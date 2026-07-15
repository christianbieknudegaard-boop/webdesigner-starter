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
  const { loops, leftover } = buildLoops(boundaryEdges);

  return {
    holeCount: loops.length,
    boundaryEdgeCount: boundaryEdges.length,
    nonManifoldEdgeCount: nonManifoldEdgeCount + leftover,
  };
}

export function repairMesh(geometry: THREE.BufferGeometry): RepairResult {
  const welded = weldByPosition(geometry);
  const { boundaryEdges, nonManifoldEdgeCount } = collectBoundaryEdges(welded);
  const { loops, leftover } = buildLoops(boundaryEdges);

  if (loops.length === 0) {
    return { geometry: welded, holesFilled: 0, remainingBoundaryEdges: leftover + nonManifoldEdgeCount };
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
    remainingBoundaryEdges: leftover + nonManifoldEdgeCount,
  };
}
