import * as THREE from 'three';
import type { MoldOptions, MoldResult, SplitAxis } from '@/lib/moldGenerator';
import type { EngraveOptions } from '@/lib/csgTools';
import type { MoldWorkerRequest, MoldWorkerResponse } from '@/lib/moldWorker';

export interface MoldClientResult extends MoldResult {
  siliconeVolume: number;
}

export interface CutClientResult {
  halfA: THREE.BufferGeometry;
  halfB: THREE.BufferGeometry;
  axis: SplitAxis;
}

type CsgSuccess = Extract<MoldWorkerResponse, { ok: true }>;

function rebuildGeometry(payload: {
  positions: Float32Array;
  index: Uint32Array | null;
}): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(payload.positions, 3));
  if (payload.index) geometry.setIndex(new THREE.BufferAttribute(payload.index, 1));
  geometry.computeVertexNormals();
  return geometry;
}

/** Runs a CSG job (mold/cut/engrave) in a Web Worker so heavy boolean work
 *  doesn't freeze the UI. Fresh worker per call keeps things stateless. */
function runCsgWorker(request: MoldWorkerRequest): Promise<CsgSuccess> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./moldWorker.ts', import.meta.url));
    worker.onmessage = (event: MessageEvent<MoldWorkerResponse>) => {
      worker.terminate();
      if (event.data.ok) resolve(event.data);
      else reject(new Error(event.data.message));
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error('CSG-operasjonen feilet i bakgrunnstråden.'));
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

export async function generateMoldInWorker(
  geometry: THREE.BufferGeometry,
  margin: number,
  splitAxis: SplitAxis,
  options: MoldOptions
): Promise<MoldClientResult> {
  const { positions, index } = extract(geometry);
  const response = await runCsgWorker({ kind: 'mold', positions, index, margin, splitAxis, options });
  if (response.kind !== 'mold') throw new Error('Uventet svar fra CSG-workeren.');
  return {
    halfA: rebuildGeometry(response.halfA),
    halfB: rebuildGeometry(response.halfB),
    splitAxis: response.splitAxis,
    boxSize: response.boxSize,
    siliconeVolume: response.siliconeVolume,
  };
}

export async function cutInWorker(
  geometry: THREE.BufferGeometry,
  axis: SplitAxis,
  coord: number,
  pins: boolean
): Promise<CutClientResult> {
  const { positions, index } = extract(geometry);
  const response = await runCsgWorker({ kind: 'cut', positions, index, axis, coord, pins });
  if (response.kind !== 'cut') throw new Error('Uventet svar fra CSG-workeren.');
  return {
    halfA: rebuildGeometry(response.halfA),
    halfB: rebuildGeometry(response.halfB),
    axis: response.axis,
  };
}

export async function engraveInWorker(
  geometry: THREE.BufferGeometry,
  options: EngraveOptions
): Promise<THREE.BufferGeometry> {
  const { positions, index } = extract(geometry);
  const response = await runCsgWorker({ kind: 'engrave', positions, index, options });
  if (response.kind !== 'engrave') throw new Error('Uventet svar fra CSG-workeren.');
  return rebuildGeometry(response.result);
}
