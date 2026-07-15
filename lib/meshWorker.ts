/// <reference lib="webworker" />
import * as THREE from 'three';
import { analyzeMesh, repairMesh, type MeshHealthReport } from '@/lib/meshRepair';

export type MeshWorkerRequest =
  | { op: 'analyze'; positions: Float32Array; index: Uint32Array | null }
  | { op: 'repair'; positions: Float32Array; index: Uint32Array | null };

export type MeshWorkerResponse =
  | { ok: true; op: 'analyze'; report: MeshHealthReport }
  | {
      ok: true;
      op: 'repair';
      report: MeshHealthReport;
      holesFilled: number;
      positions: Float32Array;
      index: Uint32Array | null;
    }
  | { ok: false; message: string };

function buildGeometry(positions: Float32Array, index: Uint32Array | null): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  if (index) geometry.setIndex(new THREE.BufferAttribute(index, 1));
  return geometry;
}

self.onmessage = (event: MessageEvent<MeshWorkerRequest>) => {
  try {
    const { op, positions, index } = event.data;
    const geometry = buildGeometry(positions, index);

    if (op === 'analyze') {
      const report = analyzeMesh(geometry);
      const response: MeshWorkerResponse = { ok: true, op, report };
      self.postMessage(response);
      return;
    }

    const result = repairMesh(geometry);
    const report = analyzeMesh(result.geometry);
    const outPositions = new Float32Array(result.geometry.attributes.position.array);
    const outIndex = result.geometry.index
      ? new Uint32Array(result.geometry.index.array)
      : null;

    const response: MeshWorkerResponse = {
      ok: true,
      op,
      report,
      holesFilled: result.holesFilled,
      positions: outPositions,
      index: outIndex,
    };
    const transfer: ArrayBuffer[] = [outPositions.buffer as ArrayBuffer];
    if (outIndex) transfer.push(outIndex.buffer as ArrayBuffer);
    self.postMessage(response, { transfer });
  } catch (err) {
    const response: MeshWorkerResponse = {
      ok: false,
      message: err instanceof Error ? err.message : 'Meshanalysen feilet.',
    };
    self.postMessage(response);
  }
};
