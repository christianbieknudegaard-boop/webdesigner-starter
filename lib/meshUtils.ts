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
