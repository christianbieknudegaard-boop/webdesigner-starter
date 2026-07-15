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
