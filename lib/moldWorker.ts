/// <reference lib="webworker" />
import * as THREE from 'three';
import { generateMold, type MoldOptions, type SplitAxis } from '@/lib/moldGenerator';
import { booleanGeometry, cutGeometry, engraveGeometry, type EngraveOptions } from '@/lib/csgTools';

export type MoldWorkerRequest =
  | {
      kind: 'mold';
      positions: Float32Array;
      index: Uint32Array | null;
      margin: number;
      splitAxis: SplitAxis;
      options: MoldOptions;
    }
  | {
      kind: 'cut';
      positions: Float32Array;
      index: Uint32Array | null;
      axis: SplitAxis;
      coord: number;
      pins: boolean;
    }
  | {
      kind: 'engrave';
      positions: Float32Array;
      index: Uint32Array | null;
      options: EngraveOptions;
    }
  | {
      kind: 'boolean';
      positions: Float32Array;
      index: Uint32Array | null;
      positionsB: Float32Array;
      indexB: Uint32Array | null;
      op: 'union' | 'subtract' | 'intersect';
    };

interface GeometryPayload {
  positions: Float32Array;
  index: Uint32Array | null;
}

export type MoldWorkerResponse =
  | {
      ok: true;
      kind: 'mold';
      halfA: GeometryPayload;
      halfB: GeometryPayload;
      splitAxis: SplitAxis;
      boxSize: { x: number; y: number; z: number };
      siliconeVolume: number;
    }
  | { ok: true; kind: 'cut'; halfA: GeometryPayload; halfB: GeometryPayload; axis: SplitAxis }
  | { ok: true; kind: 'engrave'; result: GeometryPayload }
  | { ok: true; kind: 'boolean'; result: GeometryPayload }
  | { ok: false; message: string };

function buildGeometry(payload: GeometryPayload): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(payload.positions, 3));
  if (payload.index) geometry.setIndex(new THREE.BufferAttribute(payload.index, 1));
  geometry.computeVertexNormals();
  return geometry;
}

function extract(geometry: THREE.BufferGeometry): GeometryPayload {
  return {
    positions: new Float32Array(geometry.attributes.position.array),
    index: geometry.index ? new Uint32Array(geometry.index.array) : null,
  };
}

function transferListOf(...payloads: GeometryPayload[]): ArrayBuffer[] {
  const transfer: ArrayBuffer[] = [];
  for (const payload of payloads) {
    transfer.push(payload.positions.buffer as ArrayBuffer);
    if (payload.index) transfer.push(payload.index.buffer as ArrayBuffer);
  }
  return transfer;
}

self.onmessage = (event: MessageEvent<MoldWorkerRequest>) => {
  try {
    const request = event.data;
    const geometry = buildGeometry(request);

    if (request.kind === 'mold') {
      const result = generateMold(geometry, request.margin, request.splitAxis, request.options);
      const halfA = extract(result.halfA);
      const halfB = extract(result.halfB);
      const response: MoldWorkerResponse = {
        ok: true,
        kind: 'mold',
        halfA,
        halfB,
        splitAxis: result.splitAxis,
        boxSize: result.boxSize,
        siliconeVolume: result.siliconeVolume,
      };
      self.postMessage(response, { transfer: transferListOf(halfA, halfB) });
      return;
    }

    if (request.kind === 'cut') {
      const result = cutGeometry(geometry, request.axis, request.coord, request.pins);
      const halfA = extract(result.halfA);
      const halfB = extract(result.halfB);
      const response: MoldWorkerResponse = {
        ok: true,
        kind: 'cut',
        halfA,
        halfB,
        axis: result.axis,
      };
      self.postMessage(response, { transfer: transferListOf(halfA, halfB) });
      return;
    }

    if (request.kind === 'boolean') {
      const geometryB = buildGeometry({ positions: request.positionsB, index: request.indexB });
      const result = extract(booleanGeometry(geometry, geometryB, request.op));
      const response: MoldWorkerResponse = { ok: true, kind: 'boolean', result };
      self.postMessage(response, { transfer: transferListOf(result) });
      return;
    }

    const engraved = extract(engraveGeometry(geometry, request.options));
    const response: MoldWorkerResponse = { ok: true, kind: 'engrave', result: engraved };
    self.postMessage(response, { transfer: transferListOf(engraved) });
  } catch (err) {
    const response: MoldWorkerResponse = {
      ok: false,
      message: err instanceof Error ? err.message : 'CSG-operasjonen feilet.',
    };
    self.postMessage(response);
  }
};
