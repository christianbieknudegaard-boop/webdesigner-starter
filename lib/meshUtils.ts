import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Returns the single mesh contained in an object graph, or null if there are zero or several. */
export function getSingleMesh(object: THREE.Object3D): THREE.Mesh | null {
  const meshes: THREE.Mesh[] = [];
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) meshes.push(child);
  });
  return meshes.length === 1 ? meshes[0] : null;
}

/** Enclosed volume of a closed mesh in native units cubed (positive when
 *  wound outward). */
export function computeVolume(geometry: THREE.BufferGeometry): number {
  return Math.abs(signedVolume(geometry));
}

/**
 * Area-weighted dominant face normal, for "lay flat": buckets normals on a
 * coarse grid and returns the average normal of the largest planar cluster.
 */
export function dominantFaceNormal(geometry: THREE.BufferGeometry): THREE.Vector3 | null {
  const position = geometry.attributes.position;
  const index = geometry.index;
  const count = index ? index.count : position.count;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();

  const buckets = new Map<string, { sum: THREE.Vector3; area: number }>();
  for (let i = 0; i < count; i += 3) {
    a.fromBufferAttribute(position, index ? index.getX(i) : i);
    b.fromBufferAttribute(position, index ? index.getX(i + 1) : i + 1);
    c.fromBufferAttribute(position, index ? index.getX(i + 2) : i + 2);
    n.subVectors(b, a).cross(c.clone().sub(a));
    const doubleArea = n.length();
    if (doubleArea < 1e-12) continue;
    n.divideScalar(doubleArea);
    const key = `${Math.round(n.x * 10)}_${Math.round(n.y * 10)}_${Math.round(n.z * 10)}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.sum.addScaledVector(n, doubleArea);
      bucket.area += doubleArea;
    } else {
      buckets.set(key, { sum: n.clone().multiplyScalar(doubleArea), area: doubleArea });
    }
  }

  let best: { sum: THREE.Vector3; area: number } | null = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.area > best.area) best = bucket;
  }
  return best ? best.sum.normalize() : null;
}

function signedVolume(geometry: THREE.BufferGeometry): number {
  const position = geometry.attributes.position;
  const index = geometry.index;
  const count = index ? index.count : position.count;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  let volume = 0;
  for (let i = 0; i < count; i += 3) {
    a.fromBufferAttribute(position, index ? index.getX(i) : i);
    b.fromBufferAttribute(position, index ? index.getX(i + 1) : i + 1);
    c.fromBufferAttribute(position, index ? index.getX(i + 2) : i + 2);
    volume += a.dot(b.clone().cross(c));
  }
  return volume / 6;
}

/**
 * Real-world STL/OBJ files sometimes come with inward-facing winding. The
 * viewer hides it (DoubleSide material), but CSG treats such a mesh as an
 * inside-out solid, producing garbage molds and impossible volume estimates.
 * Detect via signed volume and flip the triangle order when negative.
 */
export function ensureOutwardWinding(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  if (signedVolume(geometry) >= 0) return geometry;

  const index = geometry.index;
  if (index) {
    const array = index.array;
    for (let i = 0; i < array.length; i += 3) {
      const tmp = array[i + 1];
      array[i + 1] = array[i + 2];
      array[i + 2] = tmp;
    }
    index.needsUpdate = true;
  } else {
    const position = geometry.attributes.position;
    const tmp = new THREE.Vector3();
    const other = new THREE.Vector3();
    for (let i = 0; i < position.count; i += 3) {
      tmp.fromBufferAttribute(position, i + 1);
      other.fromBufferAttribute(position, i + 2);
      position.setXYZ(i + 1, other.x, other.y, other.z);
      position.setXYZ(i + 2, tmp.x, tmp.y, tmp.z);
    }
    position.needsUpdate = true;
  }
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Welds coincident vertices by position only. three.js's mergeVertices hashes
 * every attribute (including normal), so corners shared by faces with
 * different flat per-face normals - the norm for STL files - never merge.
 * Stripping down to position-only first gives the correct shared topology.
 */
export function weldByPosition(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const positionOnly = new THREE.BufferGeometry();
  positionOnly.setAttribute('position', geometry.attributes.position.clone());
  if (geometry.index) positionOnly.setIndex(geometry.index.clone());
  return mergeVertices(positionOnly);
}
