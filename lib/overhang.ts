import * as THREE from 'three';

export type UpAxis = 'y' | 'z';

export interface OverhangResult {
  /** Non-indexed copy with a per-face color map (red = needs support). */
  geometry: THREE.BufferGeometry;
  /** Area fraction (0..1) that needs support at the given threshold. */
  supportFraction: number;
}

export interface OrientationSuggestion {
  /** Rotation that maps the best-found down direction to native down. */
  quaternion: [number, number, number, number];
  /** Support fraction with the suggested orientation. */
  bestFraction: number;
  /** Support fraction as the model is oriented now. */
  currentFraction: number;
}

const COLOR_SUPPORT = [0.95, 0.2, 0.2];
const COLOR_WARN = [0.96, 0.62, 0.1];
const COLOR_OK = [0.31, 0.56, 0.97];

function downVector(up: UpAxis): THREE.Vector3 {
  return up === 'y' ? new THREE.Vector3(0, -1, 0) : new THREE.Vector3(0, 0, -1);
}

interface FaceData {
  /** Unit normals, 3 floats per face. */
  normals: Float32Array;
  /** Face areas. */
  areas: Float32Array;
  /** Face centroids, 3 floats per face. */
  centroids: Float32Array;
  faceCount: number;
}

function collectFaces(geometry: THREE.BufferGeometry): FaceData {
  const position = geometry.attributes.position;
  const index = geometry.index;
  const faceCount = index ? index.count / 3 : position.count / 3;
  const normals = new Float32Array(faceCount * 3);
  const areas = new Float32Array(faceCount);
  const centroids = new Float32Array(faceCount * 3);

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const n = new THREE.Vector3();

  for (let f = 0; f < faceCount; f++) {
    const i0 = index ? index.getX(f * 3) : f * 3;
    const i1 = index ? index.getX(f * 3 + 1) : f * 3 + 1;
    const i2 = index ? index.getX(f * 3 + 2) : f * 3 + 2;
    a.fromBufferAttribute(position, i0);
    b.fromBufferAttribute(position, i1);
    c.fromBufferAttribute(position, i2);
    n.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a));
    const doubleArea = n.length();
    areas[f] = doubleArea / 2;
    if (doubleArea > 1e-12) n.divideScalar(doubleArea);
    normals[f * 3] = n.x;
    normals[f * 3 + 1] = n.y;
    normals[f * 3 + 2] = n.z;
    centroids[f * 3] = (a.x + b.x + c.x) / 3;
    centroids[f * 3 + 1] = (a.y + b.y + c.y) / 3;
    centroids[f * 3 + 2] = (a.z + b.z + c.z) / 3;
  }

  return { normals, areas, centroids, faceCount };
}

/** Support fraction for an arbitrary "down" direction, excluding faces that
 *  rest on the build plate (the lowest extent along that direction). */
function supportFractionFor(
  faces: FaceData,
  down: THREE.Vector3,
  sinThreshold: number,
  geometry: THREE.BufferGeometry
): number {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  // Lowest point along "down" = max of dot(p, down) over the bbox corners.
  const corner = new THREE.Vector3();
  let maxDot = -Infinity;
  let minDot = Infinity;
  for (let i = 0; i < 8; i++) {
    corner.set(
      i & 1 ? box.max.x : box.min.x,
      i & 2 ? box.max.y : box.min.y,
      i & 4 ? box.max.z : box.min.z
    );
    const d = corner.dot(down);
    if (d > maxDot) maxDot = d;
    if (d < minDot) minDot = d;
  }
  const plateEps = Math.max((maxDot - minDot) * 2e-3, 1e-4);

  let totalArea = 0;
  let supportArea = 0;
  const n = new THREE.Vector3();
  const centroid = new THREE.Vector3();
  for (let f = 0; f < faces.faceCount; f++) {
    const area = faces.areas[f];
    if (!(area > 0)) continue;
    totalArea += area;
    n.set(faces.normals[f * 3], faces.normals[f * 3 + 1], faces.normals[f * 3 + 2]);
    const downess = n.dot(down);
    if (downess <= sinThreshold) continue;
    centroid.set(faces.centroids[f * 3], faces.centroids[f * 3 + 1], faces.centroids[f * 3 + 2]);
    // Faces flat on the plate print fine without support.
    if (downess > 0.99 && maxDot - centroid.dot(down) < plateEps) continue;
    supportArea += area;
  }
  return totalArea > 0 ? supportArea / totalArea : 0;
}

/**
 * Colors every face by whether it needs print support: steeper than the
 * threshold (measured from vertical, 45 deg default) and facing downward.
 */
export function analyzeOverhang(
  sourceGeometry: THREE.BufferGeometry,
  thresholdDeg: number,
  up: UpAxis
): OverhangResult {
  const geometry = sourceGeometry.index
    ? sourceGeometry.toNonIndexed()
    : sourceGeometry.clone();
  const faces = collectFaces(geometry);
  const down = downVector(up);
  const sinThreshold = Math.sin(THREE.MathUtils.degToRad(thresholdDeg));
  const sinWarn = Math.sin(THREE.MathUtils.degToRad(Math.max(thresholdDeg - 10, 0)));

  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const span = box.getSize(new THREE.Vector3());
  const upSpan = up === 'y' ? span.y : span.z;
  const plateLevel = up === 'y' ? box.min.y : box.min.z;
  const plateEps = Math.max(upSpan * 2e-3, 1e-4);

  const colors = new Float32Array(geometry.attributes.position.count * 3);
  const n = new THREE.Vector3();
  let totalArea = 0;
  let supportArea = 0;

  for (let f = 0; f < faces.faceCount; f++) {
    const area = faces.areas[f];
    n.set(faces.normals[f * 3], faces.normals[f * 3 + 1], faces.normals[f * 3 + 2]);
    const downess = n.dot(down);
    const centroidUp =
      up === 'y' ? faces.centroids[f * 3 + 1] : faces.centroids[f * 3 + 2];
    const onPlate = downess > 0.99 && centroidUp - plateLevel < plateEps;

    let palette = COLOR_OK;
    if (area > 0 && !onPlate) {
      if (downess > sinThreshold) palette = COLOR_SUPPORT;
      else if (downess > sinWarn) palette = COLOR_WARN;
    }
    if (area > 0) {
      totalArea += area;
      if (palette === COLOR_SUPPORT) supportArea += area;
    }
    for (let v = 0; v < 3; v++) {
      colors[(f * 3 + v) * 3] = palette[0];
      colors[(f * 3 + v) * 3 + 1] = palette[1];
      colors[(f * 3 + v) * 3 + 2] = palette[2];
    }
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return {
    geometry,
    supportFraction: totalArea > 0 ? supportArea / totalArea : 0,
  };
}

/**
 * Tries the six axis-aligned orientations and returns the rotation with the
 * least support-needing area. Cheap: one face pass per candidate direction.
 */
export function bestPrintOrientation(
  sourceGeometry: THREE.BufferGeometry,
  thresholdDeg: number,
  up: UpAxis
): OrientationSuggestion {
  const faces = collectFaces(sourceGeometry);
  const sinThreshold = Math.sin(THREE.MathUtils.degToRad(thresholdDeg));
  const nativeDown = downVector(up);

  const candidates = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
  ];

  let best = nativeDown;
  let bestFraction = Infinity;
  let currentFraction = 0;
  for (const candidate of candidates) {
    const fraction = supportFractionFor(faces, candidate, sinThreshold, sourceGeometry);
    if (candidate.distanceToSquared(nativeDown) < 1e-9) currentFraction = fraction;
    if (fraction < bestFraction - 1e-9) {
      bestFraction = fraction;
      best = candidate;
    }
  }

  const quaternion = new THREE.Quaternion().setFromUnitVectors(best, nativeDown);
  return {
    quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w],
    bestFraction,
    currentFraction,
  };
}
