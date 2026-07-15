import * as THREE from 'three';
import { MeshoptSimplifier } from 'meshoptimizer';
import { weldByPosition } from '@/lib/meshUtils';

export interface OptimizeResult {
  geometry: THREE.BufferGeometry;
  triangleCount: number;
  vertexCount: number;
  /** Extra info: parts removed (loose-part filter) or achieved error (simplify). */
  detail?: number;
}

/** Drops vertices not referenced by any triangle and reindexes. */
function compactGeometry(positions: Float32Array, indices: Uint32Array): THREE.BufferGeometry {
  const remap = new Int32Array(positions.length / 3).fill(-1);
  let nextVertex = 0;
  for (let i = 0; i < indices.length; i++) {
    if (remap[indices[i]] === -1) remap[indices[i]] = nextVertex++;
  }

  const outPositions = new Float32Array(nextVertex * 3);
  for (let v = 0; v < remap.length; v++) {
    const target = remap[v];
    if (target === -1) continue;
    outPositions[target * 3] = positions[v * 3];
    outPositions[target * 3 + 1] = positions[v * 3 + 1];
    outPositions[target * 3 + 2] = positions[v * 3 + 2];
  }
  const outIndices = new Uint32Array(indices.length);
  for (let i = 0; i < indices.length; i++) outIndices[i] = remap[indices[i]];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(outPositions, 3));
  geometry.setIndex(new THREE.BufferAttribute(outIndices, 1));
  geometry.computeVertexNormals();
  return geometry;
}

function weldedArrays(geometry: THREE.BufferGeometry): {
  positions: Float32Array;
  indices: Uint32Array;
} {
  const welded = weldByPosition(geometry);
  return {
    positions: new Float32Array(welded.attributes.position.array),
    indices: new Uint32Array(welded.index!.array),
  };
}

/**
 * Reduces the triangle count to roughly `ratio` (0..1) of the original using
 * meshoptimizer's quadric edge-collapse simplifier. Made for AI-generated
 * meshes that arrive with 10-100x more triangles than the shape needs.
 */
export async function simplifyGeometry(
  geometry: THREE.BufferGeometry,
  ratio: number
): Promise<OptimizeResult> {
  if (!(ratio > 0 && ratio < 1)) {
    throw new Error('Forenklingsgraden må være mellom 0 og 100 %.');
  }
  await MeshoptSimplifier.ready;

  const { positions, indices } = weldedArrays(geometry);
  const targetIndexCount = Math.max(3, Math.floor((indices.length * ratio) / 3) * 3);

  const [simplified, error] = MeshoptSimplifier.simplify(
    indices,
    positions,
    3,
    targetIndexCount,
    0.05, // allow up to 5% relative error to actually reach aggressive targets
    []
  );

  if (simplified.length === 0) {
    throw new Error('Forenklingen fjernet hele modellen. Prøv en mildere grad.');
  }

  const result = compactGeometry(positions, new Uint32Array(simplified));
  return {
    geometry: result,
    triangleCount: result.index!.count / 3,
    vertexCount: result.attributes.position.count,
    detail: error,
  };
}

/**
 * Keeps only the largest connected component. Image-to-3D generators often
 * leave floating debris fragments around the main shape.
 */
export function removeLooseParts(geometry: THREE.BufferGeometry): OptimizeResult {
  const { positions, indices } = weldedArrays(geometry);
  const vertexCount = positions.length / 3;

  // Union-find over vertices, joined through triangles.
  const parent = new Int32Array(vertexCount);
  for (let i = 0; i < vertexCount; i++) parent[i] = i;
  const find = (x: number): number => {
    let root = x;
    while (parent[root] !== root) root = parent[root];
    while (parent[x] !== root) {
      const next = parent[x];
      parent[x] = root;
      x = next;
    }
    return root;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  for (let i = 0; i < indices.length; i += 3) {
    union(indices[i], indices[i + 1]);
    union(indices[i], indices[i + 2]);
  }

  const triangleCountByRoot = new Map<number, number>();
  for (let i = 0; i < indices.length; i += 3) {
    const root = find(indices[i]);
    triangleCountByRoot.set(root, (triangleCountByRoot.get(root) ?? 0) + 1);
  }

  const componentCount = triangleCountByRoot.size;
  if (componentCount <= 1) {
    const welded = compactGeometry(positions, indices);
    return {
      geometry: welded,
      triangleCount: welded.index!.count / 3,
      vertexCount: welded.attributes.position.count,
      detail: 0,
    };
  }

  let mainRoot = -1;
  let mainSize = -1;
  for (const [root, size] of triangleCountByRoot) {
    if (size > mainSize) {
      mainSize = size;
      mainRoot = root;
    }
  }

  const kept = new Uint32Array(mainSize * 3);
  let write = 0;
  for (let i = 0; i < indices.length; i += 3) {
    if (find(indices[i]) === mainRoot) {
      kept[write++] = indices[i];
      kept[write++] = indices[i + 1];
      kept[write++] = indices[i + 2];
    }
  }

  const result = compactGeometry(positions, kept);
  return {
    geometry: result,
    triangleCount: result.index!.count / 3,
    vertexCount: result.attributes.position.count,
    detail: componentCount - 1,
  };
}

/**
 * Taubin smoothing (lambda/mu) - evens out the bumpy surfaces typical of
 * AI-generated meshes without the shrinkage of plain Laplacian smoothing.
 */
export function smoothGeometry(geometry: THREE.BufferGeometry, iterations = 10): OptimizeResult {
  const { positions, indices } = weldedArrays(geometry);
  const vertexCount = positions.length / 3;

  // CSR-style adjacency built in two passes to stay allocation-light.
  const degree = new Uint32Array(vertexCount);
  const addEdge = (a: number, b: number) => {
    degree[a]++;
    degree[b]++;
  };
  for (let i = 0; i < indices.length; i += 3) {
    addEdge(indices[i], indices[i + 1]);
    addEdge(indices[i + 1], indices[i + 2]);
    addEdge(indices[i + 2], indices[i]);
  }
  const offsets = new Uint32Array(vertexCount + 1);
  for (let v = 0; v < vertexCount; v++) offsets[v + 1] = offsets[v] + degree[v];
  const neighbors = new Uint32Array(offsets[vertexCount]);
  const cursor = offsets.slice(0, vertexCount);
  const pushEdge = (a: number, b: number) => {
    neighbors[cursor[a]++] = b;
    neighbors[cursor[b]++] = a;
  };
  for (let i = 0; i < indices.length; i += 3) {
    pushEdge(indices[i], indices[i + 1]);
    pushEdge(indices[i + 1], indices[i + 2]);
    pushEdge(indices[i + 2], indices[i]);
  }

  let current: Float32Array = positions;
  let scratch: Float32Array = new Float32Array(positions.length);
  const LAMBDA = 0.5;
  const MU = -0.53;

  const applyPass = (factor: number) => {
    for (let v = 0; v < vertexCount; v++) {
      const start = offsets[v];
      const end = offsets[v + 1];
      if (start === end) {
        scratch[v * 3] = current[v * 3];
        scratch[v * 3 + 1] = current[v * 3 + 1];
        scratch[v * 3 + 2] = current[v * 3 + 2];
        continue;
      }
      let ax = 0;
      let ay = 0;
      let az = 0;
      for (let n = start; n < end; n++) {
        const w = neighbors[n];
        ax += current[w * 3];
        ay += current[w * 3 + 1];
        az += current[w * 3 + 2];
      }
      const inv = 1 / (end - start);
      scratch[v * 3] = current[v * 3] + factor * (ax * inv - current[v * 3]);
      scratch[v * 3 + 1] = current[v * 3 + 1] + factor * (ay * inv - current[v * 3 + 1]);
      scratch[v * 3 + 2] = current[v * 3 + 2] + factor * (az * inv - current[v * 3 + 2]);
    }
    const swap = current;
    current = scratch;
    scratch = swap;
  };

  for (let it = 0; it < iterations; it++) {
    applyPass(LAMBDA);
    applyPass(MU);
  }

  const result = compactGeometry(current, indices);
  return {
    geometry: result,
    triangleCount: result.index!.count / 3,
    vertexCount: result.attributes.position.count,
  };
}
