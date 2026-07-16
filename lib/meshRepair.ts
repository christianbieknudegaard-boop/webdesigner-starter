import * as THREE from 'three';
import { weldByPosition } from '@/lib/meshUtils';

export interface MeshHealthReport {
  holeCount: number;
  boundaryEdgeCount: number;
  nonManifoldEdgeCount: number;
}

export interface RepairResult {
  geometry: THREE.BufferGeometry;
  holesFilled: number;
  remainingBoundaryEdges: number;
}

interface BoundaryEdge {
  /** Vertex order to walk when building the fill loop (already reversed relative to the mesh winding). */
  from: number;
  to: number;
}

function undirectedKey(a: number, b: number): string {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

/** Builds directed-edge fill edges (count === 1) and the non-manifold edge count (count >= 3). */
function collectBoundaryEdges(geometry: THREE.BufferGeometry): {
  boundaryEdges: BoundaryEdge[];
  nonManifoldEdgeCount: number;
} {
  const index = geometry.getIndex();
  if (!index) return { boundaryEdges: [], nonManifoldEdgeCount: 0 };

  const counts = new Map<string, number>();
  // Last-seen directed edge for each undirected key, used to derive fill direction.
  const directed = new Map<string, [number, number]>();

  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i);
    const b = index.getX(i + 1);
    const c = index.getX(i + 2);
    const edges: [number, number][] = [
      [a, b],
      [b, c],
      [c, a],
    ];
    for (const [u, v] of edges) {
      const key = undirectedKey(u, v);
      counts.set(key, (counts.get(key) ?? 0) + 1);
      directed.set(key, [u, v]);
    }
  }

  const boundaryEdges: BoundaryEdge[] = [];
  let nonManifoldEdgeCount = 0;

  for (const [key, count] of counts) {
    if (count === 1) {
      const [u, v] = directed.get(key)!;
      // Reverse: the fill triangle must traverse the edge opposite to the
      // existing (single) adjacent triangle to keep winding consistent.
      boundaryEdges.push({ from: v, to: u });
    } else if (count >= 3) {
      nonManifoldEdgeCount++;
    }
  }

  return { boundaryEdges, nonManifoldEdgeCount };
}

/**
 * CSG output is full of T-junction seams: a long triangle edge geometrically
 * covered by several shorter collinear edges from the neighbouring surface.
 * Edge-counting sees all of them as "open" although the surface is closed.
 * Filter out boundary edges whose midpoint lies on another boundary edge so
 * only genuinely open borders are treated as holes.
 */
function filterSeamEdges(
  boundaryEdges: BoundaryEdge[],
  position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute
): BoundaryEdge[] {
  if (boundaryEdges.length < 2) return boundaryEdges;

  const segments = boundaryEdges.map((edge) => {
    const a = new THREE.Vector3().fromBufferAttribute(position, edge.from);
    const b = new THREE.Vector3().fromBufferAttribute(position, edge.to);
    return { a, b, mid: a.clone().add(b).multiplyScalar(0.5) };
  });

  const bounds = new THREE.Box3();
  for (const { a, b } of segments) {
    bounds.expandByPoint(a);
    bounds.expandByPoint(b);
  }
  const diagonal = bounds.getSize(new THREE.Vector3()).length() || 1;
  const epsilon = Math.max(diagonal * 1e-5, 1e-4);
  const cellSize = Math.max(diagonal / 64, epsilon * 8);

  const grid = new Map<string, number[]>();
  const cellKey = (p: THREE.Vector3) =>
    `${Math.floor(p.x / cellSize)}_${Math.floor(p.y / cellSize)}_${Math.floor(p.z / cellSize)}`;

  const sample = new THREE.Vector3();
  segments.forEach((segment, index) => {
    // Register the segment in every cell it passes through.
    const steps = Math.max(1, Math.ceil(segment.a.distanceTo(segment.b) / cellSize));
    for (let s = 0; s <= steps; s++) {
      sample.lerpVectors(segment.a, segment.b, s / steps);
      const key = cellKey(sample);
      const bucket = grid.get(key);
      if (bucket) {
        if (bucket[bucket.length - 1] !== index) bucket.push(index);
      } else {
        grid.set(key, [index]);
      }
    }
  });

  const line = new THREE.Line3();
  const closest = new THREE.Vector3();

  return boundaryEdges.filter((_, index) => {
    const { mid } = segments[index];
    const cx = Math.floor(mid.x / cellSize);
    const cy = Math.floor(mid.y / cellSize);
    const cz = Math.floor(mid.z / cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const bucket = grid.get(`${cx + dx}_${cy + dy}_${cz + dz}`);
          if (!bucket) continue;
          for (const other of bucket) {
            if (other === index) continue;
            line.set(segments[other].a, segments[other].b);
            line.closestPointToPoint(mid, true, closest);
            if (closest.distanceTo(mid) < epsilon) {
              return false; // seam, not a real hole border
            }
          }
        }
      }
    }
    return true;
  });
}

function buildLoops(boundaryEdges: BoundaryEdge[]): { loops: number[][]; leftover: number } {
  const next = new Map<number, number>();
  for (const edge of boundaryEdges) {
    next.set(edge.from, edge.to);
  }

  const visited = new Set<number>();
  const loops: number[][] = [];
  let leftover = 0;

  for (const edge of boundaryEdges) {
    if (visited.has(edge.from)) continue;

    const loop: number[] = [];
    let current = edge.from;
    const maxSteps = boundaryEdges.length + 1;
    let steps = 0;
    let closed = false;

    while (steps < maxSteps) {
      if (visited.has(current)) {
        closed = current === edge.from && loop.length > 2;
        break;
      }
      visited.add(current);
      loop.push(current);
      const nextVertex = next.get(current);
      if (nextVertex === undefined) break;
      current = nextVertex;
      steps++;
      if (current === edge.from) {
        closed = loop.length > 2;
        break;
      }
    }

    if (closed) {
      loops.push(loop);
    } else {
      leftover += loop.length;
    }
  }

  return { loops, leftover };
}

export function analyzeMesh(geometry: THREE.BufferGeometry): MeshHealthReport {
  const welded = weldByPosition(geometry);
  const { boundaryEdges, nonManifoldEdgeCount } = collectBoundaryEdges(welded);
  const realBoundary = filterSeamEdges(boundaryEdges, welded.attributes.position);
  const { loops } = buildLoops(realBoundary);

  return {
    holeCount: loops.length,
    boundaryEdgeCount: realBoundary.length,
    nonManifoldEdgeCount,
  };
}

export function repairMesh(geometry: THREE.BufferGeometry): RepairResult {
  const welded = weldByPosition(geometry);
  const { boundaryEdges } = collectBoundaryEdges(welded);
  const realBoundary = filterSeamEdges(boundaryEdges, welded.attributes.position);
  const { loops, leftover } = buildLoops(realBoundary);

  if (loops.length === 0) {
    return { geometry: welded, holesFilled: 0, remainingBoundaryEdges: leftover };
  }

  const position = welded.attributes.position;
  const index = welded.getIndex()!;

  const positions = Array.from(position.array as Float32Array);
  const indices = Array.from(index.array as Uint32Array | Uint16Array);

  for (const loop of loops) {
    const centroid = new THREE.Vector3();
    for (const vertexIndex of loop) {
      centroid.add(new THREE.Vector3().fromBufferAttribute(position, vertexIndex));
    }
    centroid.divideScalar(loop.length);

    const centroidIndex = positions.length / 3;
    positions.push(centroid.x, centroid.y, centroid.z);

    for (let i = 0; i < loop.length; i++) {
      const current = loop[i];
      const nextVertex = loop[(i + 1) % loop.length];
      indices.push(centroidIndex, current, nextVertex);
    }
  }

  const repaired = new THREE.BufferGeometry();
  repaired.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  repaired.setIndex(indices);
  repaired.computeVertexNormals();

  return {
    geometry: repaired,
    holesFilled: loops.length,
    remainingBoundaryEdges: leftover,
  };
}
