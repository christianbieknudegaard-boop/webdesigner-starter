import * as THREE from 'three';
import type { MeshHealthReport } from '@/lib/meshRepair';
import type {
  MeshAnalysisOp,
  MeshWorkerOp,
  MeshWorkerRequest,
  MeshWorkerResponse,
} from '@/lib/meshWorker';
import type { OrientationSuggestion, UpAxis } from '@/lib/overhang';

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

export interface ThicknessClientResult {
  /** Geometry with a vertex-color heat map (red = below threshold). */
  geometry: THREE.BufferGeometry;
  belowFraction: number;
  minFound: number;
}

/** Runs the BVH wall-thickness analysis in the worker. `minThickness` is in
 *  native model units. */
export async function thicknessInWorker(
  geometry: THREE.BufferGeometry,
  minThickness: number
): Promise<ThicknessClientResult> {
  const { positions, index } = extract(geometry);
  const response = await runMeshWorker({ op: 'thickness', positions, index, amount: minThickness });
  if (response.op !== 'thickness') throw new Error('Uventet svar fra tykkelsesanalysen.');

  const rebuilt = new THREE.BufferGeometry();
  rebuilt.setAttribute('position', new THREE.BufferAttribute(response.positions, 3));
  if (response.index) rebuilt.setIndex(new THREE.BufferAttribute(response.index, 1));
  rebuilt.setAttribute('color', new THREE.BufferAttribute(response.colors, 3));
  rebuilt.computeVertexNormals();

  return {
    geometry: rebuilt,
    belowFraction: response.belowFraction,
    minFound: response.minFound,
  };
}

export interface OverhangClientResult {
  /** Geometry with a per-face support heat map (red = needs support). */
  geometry: THREE.BufferGeometry;
  supportFraction: number;
}

/** Colors faces that need print support at the given threshold (degrees
 *  from vertical) in the worker. */
export async function overhangInWorker(
  geometry: THREE.BufferGeometry,
  thresholdDeg: number,
  up: UpAxis
): Promise<OverhangClientResult> {
  const { positions, index } = extract(geometry);
  const response = await runMeshWorker({ op: 'overhang', positions, index, amount: thresholdDeg, up });
  if (response.op !== 'overhang') throw new Error('Uventet svar fra overhengsanalysen.');

  const rebuilt = new THREE.BufferGeometry();
  rebuilt.setAttribute('position', new THREE.BufferAttribute(response.positions, 3));
  rebuilt.setAttribute('color', new THREE.BufferAttribute(response.colors, 3));
  rebuilt.computeVertexNormals();
  return { geometry: rebuilt, supportFraction: response.supportFraction };
}

/** Finds the axis-aligned orientation with the least support-needing area. */
export async function orientInWorker(
  geometry: THREE.BufferGeometry,
  thresholdDeg: number,
  up: UpAxis
): Promise<OrientationSuggestion> {
  const { positions, index } = extract(geometry);
  const response = await runMeshWorker({ op: 'orient', positions, index, amount: thresholdDeg, up });
  if (response.op !== 'orient') throw new Error('Uventet svar fra orienteringsanalysen.');
  return {
    quaternion: response.quaternion,
    bestFraction: response.bestFraction,
    currentFraction: response.currentFraction,
  };
}

/** Runs a geometry-transforming op (repair/simplify/loose/smooth) in the
 *  worker and rebuilds the resulting geometry with fresh normals. */
export async function runGeometryOp(
  geometry: THREE.BufferGeometry,
  op: Exclude<MeshWorkerOp, MeshAnalysisOp>,
  amount?: number
): Promise<GeometryOpResult> {
  const { positions, index } = extract(geometry);
  const response = await runMeshWorker({ op, positions, index, amount });
  if (
    response.op === 'analyze' ||
    response.op === 'thickness' ||
    response.op === 'overhang' ||
    response.op === 'orient'
  )
    throw new Error('Uventet svar fra meshoperasjonen.');

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
