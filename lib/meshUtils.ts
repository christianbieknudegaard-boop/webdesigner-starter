import * as THREE from 'three';

/** Returns the single mesh contained in an object graph, or null if there are zero or several. */
export function getSingleMesh(object: THREE.Object3D): THREE.Mesh | null {
  const meshes: THREE.Mesh[] = [];
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) meshes.push(child);
  });
  return meshes.length === 1 ? meshes[0] : null;
}
