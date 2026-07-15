import * as THREE from 'three';
import type { MeshHealthReport } from '@/lib/meshRepair';
import type { MeshWorkerRequest, MeshWorkerResponse } from '@/lib/meshWorker';

export interface RepairClientResult {
  geometry: THREE.BufferGeometry;
  holesFilled: number;
  report: MeshHealthReport;
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
      reject(new Error('Meshanalysen feilet i bakgrunnstråden.'));
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

/** Runs hole filling in a Web Worker and rebuilds the repaired geometry. */
export async function repairMeshInWorker(
  geometry: THREE.BufferGeometry
): Promise<RepairClientResult> {
  const { positions, index } = extract(geometry);
  const response = await runMeshWorker({ op: 'repair', positions, index });
  if (response.op !== 'repair') throw new Error('Uventet svar fra meshreparasjonen.');

  const repaired = new THREE.BufferGeometry();
  repaired.setAttribute('position', new THREE.BufferAttribute(response.positions, 3));
  if (response.index) repaired.setIndex(new THREE.BufferAttribute(response.index, 1));
  repaired.computeVertexNormals();

  return { geometry: repaired, holesFilled: response.holesFilled, report: response.report };
}
