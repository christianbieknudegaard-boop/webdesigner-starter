import * as THREE from 'three';
import type { MeshHealthReport } from '@/lib/meshRepair';
import type { MeshWorkerOp, MeshWorkerRequest, MeshWorkerResponse } from '@/lib/meshWorker';

export interface GeometryOpResult {
  geometry: THREE.BufferGeometry;
  report: MeshHealthReport;
  triangleCount: number;
  vertexCount: number;
  /** repair: holes filled; loose: parts removed; simplify: achieved error. */
  detail: number;
}

type MeshWorkerSuccess = Extract<MeshWorkerResponse, { ok: true }>;

function runMeshWorker(request: MeshWorkerRequest): Promise<MeshWorkerSuccess> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./meshWorker.ts', import.meta.url));
    worker.onmessage = (event: MessageEvent<MeshWorkerResponse>) => {
      worker.terminate();
      if (event.data.ok) resolve(event.data);
      else reject(new Error(event.data.message));
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error('Meshoperasjonen feilet i bakgrunnstråden.'));
    };
    const transfer: ArrayBuffer[] = [request.positions.buffer as ArrayBuffer];
    if (request.index) transfer.push(request.index.buffer as ArrayBuffer);
    worker.postMessage(request, transfer);
  });
}

function extract(geometry: THREE.BufferGeometry): {
  positions: Float32Array;
  index: Uint32Array | null;
} {
  // Copy before transfer so the caller's geometry stays usable.
  return {
    positions: new Float32Array(geometry.attributes.position.array),
    index: geometry.index ? new Uint32Array(geometry.index.array) : null,
  };
}

/** Runs the hole/non-manifold analysis in a Web Worker (welding a large mesh
 *  blocks the main thread for seconds otherwise). */
export async function analyzeMeshInWorker(
  geometry: THREE.BufferGeometry
): Promise<MeshHealthReport> {
  const { positions, index } = extract(geometry);
  const response = await runMeshWorker({ op: 'analyze', positions, index });
  if (response.op !== 'analyze') throw new Error('Uventet svar fra meshanalysen.');
  return response.report;
}

/** Runs a geometry-transforming op (repair/simplify/loose/smooth) in the
 *  worker and rebuilds the resulting geometry with fresh normals. */
export async function runGeometryOp(
  geometry: THREE.BufferGeometry,
  op: Exclude<MeshWorkerOp, 'analyze'>,
  amount?: number
): Promise<GeometryOpResult> {
  const { positions, index } = extract(geometry);
  const response = await runMeshWorker({ op, positions, index, amount });
  if (response.op === 'analyze') throw new Error('Uventet svar fra meshoperasjonen.');

  const rebuilt = new THREE.BufferGeometry();
  rebuilt.setAttribute('position', new THREE.BufferAttribute(response.positions, 3));
  if (response.index) rebuilt.setIndex(new THREE.BufferAttribute(response.index, 1));
  rebuilt.computeVertexNormals();

  return {
    geometry: rebuilt,
    report: response.report,
    triangleCount: response.triangleCount,
    vertexCount: response.vertexCount,
    detail: response.detail,
  };
}
