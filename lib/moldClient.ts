import * as THREE from 'three';
import type { MoldOptions, MoldResult, SplitAxis } from '@/lib/moldGenerator';
import type { MoldWorkerRequest, MoldWorkerResponse } from '@/lib/moldWorker';

export interface MoldClientResult extends MoldResult {
  /** Empty space in the assembled mold, in native model units cubed. */
  siliconeVolume: number;
}

function rebuildGeometry(positions: Float32Array, index: Uint32Array | null): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  if (index) geometry.setIndex(new THREE.BufferAttribute(index, 1));
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Runs mold generation in a Web Worker so heavy CSG work doesn't freeze the
 * UI. A fresh worker per call keeps things stateless and lets errors or big
 * jobs be thrown away cleanly with terminate().
 */
export function generateMoldInWorker(
  geometry: THREE.BufferGeometry,
  margin: number,
  splitAxis: SplitAxis,
  options: MoldOptions
): Promise<MoldClientResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./moldWorker.ts', import.meta.url));

    worker.onmessage = (event: MessageEvent<MoldWorkerResponse>) => {
      worker.terminate();
      const data = event.data;
      if (!data.ok) {
        reject(new Error(data.message));
        return;
      }
      resolve({
        halfA: rebuildGeometry(data.positionsA, data.indexA),
        halfB: rebuildGeometry(data.positionsB, data.indexB),
        splitAxis: data.splitAxis,
        boxSize: data.boxSize,
        siliconeVolume: data.siliconeVolume,
      });
    };

    worker.onerror = () => {
      worker.terminate();
      reject(new Error('Mold-generering feilet i bakgrunnstråden.'));
    };

    // Copy before transfer so the caller's geometry stays usable.
    const positions = new Float32Array(geometry.attributes.position.array);
    const index = geometry.index ? new Uint32Array(geometry.index.array) : null;

    const request: MoldWorkerRequest = { positions, index, margin, splitAxis, options };
    const transfer: ArrayBuffer[] = [positions.buffer];
    if (index) transfer.push(index.buffer);
    worker.postMessage(request, transfer);
  });
}
