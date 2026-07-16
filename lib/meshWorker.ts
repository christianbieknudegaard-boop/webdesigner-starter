/// <reference lib="webworker" />
import * as THREE from 'three';
import { analyzeMesh, repairMesh, type MeshHealthReport } from '@/lib/meshRepair';
import { simplifyGeometry, removeLooseParts, smoothGeometry } from '@/lib/meshOptimize';
import { analyzeThickness } from '@/lib/thickness';

export type MeshWorkerOp = 'analyze' | 'repair' | 'simplify' | 'loose' | 'smooth' | 'thickness';

export interface MeshWorkerRequest {
  op: MeshWorkerOp;
  positions: Float32Array;
  index: Uint32Array | null;
  /** simplify: target triangle ratio 0..1; smooth: iteration count. */
  amount?: number;
}

export type MeshWorkerResponse =
  | { ok: true; op: 'analyze'; report: MeshHealthReport }
  | {
      ok: true;
      op: 'thickness';
      positions: Float32Array;
      index: Uint32Array | null;
      colors: Float32Array;
      belowFraction: number;
      minFound: number;
    }
  | {
      ok: true;
      op: Exclude<MeshWorkerOp, 'analyze' | 'thickness'>;
      report: MeshHealthReport;
      positions: Float32Array;
      index: Uint32Array | null;
      triangleCount: number;
      vertexCount: number;
      detail: number;
    }
  | { ok: false; message: string };

function buildGeometry(positions: Float32Array, index: Uint32Array | null): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  if (index) geometry.setIndex(new THREE.BufferAttribute(index, 1));
  return geometry;
}

function respondWithGeometry(
  op: Exclude<MeshWorkerOp, 'analyze' | 'thickness'>,
  geometry: THREE.BufferGeometry,
  detail: number
) {
  const report = analyzeMesh(geometry);
  const positions = new Float32Array(geometry.attributes.position.array);
  const index = geometry.index ? new Uint32Array(geometry.index.array) : null;
  const response: MeshWorkerResponse = {
    ok: true,
    op,
    report,
    positions,
    index,
    triangleCount: index ? index.length / 3 : positions.length / 9,
    vertexCount: positions.length / 3,
    detail,
  };
  const transfer: ArrayBuffer[] = [positions.buffer as ArrayBuffer];
  if (index) transfer.push(index.buffer as ArrayBuffer);
  self.postMessage(response, { transfer });
}

self.onmessage = async (event: MessageEvent<MeshWorkerRequest>) => {
  try {
    const { op, positions, index, amount } = event.data;
    const geometry = buildGeometry(positions, index);

    if (op === 'analyze') {
      const report = analyzeMesh(geometry);
      const response: MeshWorkerResponse = { ok: true, op, report };
      self.postMessage(response);
      return;
    }

    if (op === 'repair') {
      const result = repairMesh(geometry);
      respondWithGeometry(op, result.geometry, result.holesFilled);
      return;
    }

    if (op === 'thickness') {
      const result = analyzeThickness(geometry, amount ?? 2);
      const outPositions = new Float32Array(result.geometry.attributes.position.array);
      const outIndex = result.geometry.index
        ? new Uint32Array(result.geometry.index.array)
        : null;
      const colors = new Float32Array(result.geometry.attributes.color.array);
      const response: MeshWorkerResponse = {
        ok: true,
        op,
        positions: outPositions,
        index: outIndex,
        colors,
        belowFraction: result.belowFraction,
        minFound: result.minFound,
      };
      const transfer: ArrayBuffer[] = [
        outPositions.buffer as ArrayBuffer,
        colors.buffer as ArrayBuffer,
      ];
      if (outIndex) transfer.push(outIndex.buffer as ArrayBuffer);
      self.postMessage(response, { transfer });
      return;
    }

    if (op === 'simplify') {
      const result = await simplifyGeometry(geometry, amount ?? 0.25);
      respondWithGeometry(op, result.geometry, result.detail ?? 0);
      return;
    }

    if (op === 'loose') {
      const result = removeLooseParts(geometry);
      respondWithGeometry(op, result.geometry, result.detail ?? 0);
      return;
    }

    const result = smoothGeometry(geometry, amount ?? 10);
    respondWithGeometry(op, result.geometry, 0);
  } catch (err) {
    const response: MeshWorkerResponse = {
      ok: false,
      message: err instanceof Error ? err.message : 'Meshoperasjonen feilet.',
    };
    self.postMessage(response);
  }
};
