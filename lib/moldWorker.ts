/// <reference lib="webworker" />
import * as THREE from 'three';
import { generateMold, type MoldOptions, type SplitAxis } from '@/lib/moldGenerator';

export interface MoldWorkerRequest {
  positions: Float32Array;
  index: Uint32Array | null;
  margin: number;
  splitAxis: SplitAxis;
  options: MoldOptions;
}

export type MoldWorkerResponse =
  | {
      ok: true;
      positionsA: Float32Array;
      indexA: Uint32Array | null;
      positionsB: Float32Array;
      indexB: Uint32Array | null;
      splitAxis: SplitAxis;
      boxSize: { x: number; y: number; z: number };
      siliconeVolume: number;
    }
  | { ok: false; message: string };

function extractArrays(geometry: THREE.BufferGeometry): {
  positions: Float32Array;
  index: Uint32Array | null;
} {
  const positions = new Float32Array(geometry.attributes.position.array);
  const index = geometry.index ? new Uint32Array(geometry.index.array) : null;
  return { positions, index };
}

self.onmessage = (event: MessageEvent<MoldWorkerRequest>) => {
  try {
    const { positions, index, margin, splitAxis, options } = event.data;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    if (index) geometry.setIndex(new THREE.BufferAttribute(index, 1));
    geometry.computeVertexNormals();

    const result = generateMold(geometry, margin, splitAxis, options);

    const a = extractArrays(result.halfA);
    const b = extractArrays(result.halfB);

    const response: MoldWorkerResponse = {
      ok: true,
      positionsA: a.positions,
      indexA: a.index,
      positionsB: b.positions,
      indexB: b.index,
      splitAxis: result.splitAxis,
      boxSize: result.boxSize,
      siliconeVolume: result.siliconeVolume,
    };

    const transfer: ArrayBuffer[] = [a.positions.buffer as ArrayBuffer, b.positions.buffer as ArrayBuffer];
    if (a.index) transfer.push(a.index.buffer as ArrayBuffer);
    if (b.index) transfer.push(b.index.buffer as ArrayBuffer);

    self.postMessage(response, { transfer });
  } catch (err) {
    const response: MoldWorkerResponse = {
      ok: false,
      message: err instanceof Error ? err.message : 'Kunne ikke generere mold.',
    };
    self.postMessage(response);
  }
};
