import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { weldByPosition } from '@/lib/meshUtils';

export interface ShellResult {
  geometry: THREE.BufferGeometry;
  triangleCount: number;
}

function reverseWinding(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const index = geometry.getIndex();
  if (!index) return geometry;

  const array = index.array;
  for (let i = 0; i < array.length; i += 3) {
    const tmp = array[i];
    array[i] = array[i + 2];
    array[i + 2] = tmp;
  }
  index.needsUpdate = true;
  return geometry;
}

function offsetAlongNormals(geometry: THREE.BufferGeometry, distance: number) {
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;

  for (let i = 0; i < position.count; i++) {
    const nx = normal.getX(i);
    const ny = normal.getY(i);
    const nz = normal.getZ(i);
    position.setXYZ(
      i,
      position.getX(i) + nx * distance,
      position.getY(i) + ny * distance,
      position.getZ(i) + nz * distance
    );
  }
  position.needsUpdate = true;
}

/**
 * Hollows out a solid mesh by generating an inward-offset inner surface
 * (along vertex normals) and merging it with the outer surface. This is a
 * geometric approximation, not a true boolean operation: it works well for
 * reasonably simple/convex shapes, but very thin features or sharp concave
 * corners can produce self-intersecting geometry.
 */
export function createShell(sourceGeometry: THREE.BufferGeometry, wallThickness: number): ShellResult {
  if (!(wallThickness > 0)) {
    throw new Error('Veggtykkelsen må være større enn 0.');
  }

  const outer = weldByPosition(sourceGeometry);
  outer.computeVertexNormals();

  const maxOffset = estimateMaxSafeOffset(outer);
  const clampedThickness = Math.min(wallThickness, maxOffset);
  if (clampedThickness <= 0) {
    throw new Error('Modellen er for tynn til å gjøres hul med denne veggtykkelsen.');
  }

  const inner = outer.clone();
  offsetAlongNormals(inner, -clampedThickness);
  reverseWinding(inner);
  inner.computeVertexNormals();

  const merged = mergeGeometries([outer, inner], false);
  if (!merged) {
    throw new Error('Kunne ikke generere hul modell.');
  }

  const position = merged.attributes.position;
  const triangleCount = merged.index ? merged.index.count / 3 : position.count / 3;

  return { geometry: merged, triangleCount: Math.round(triangleCount) };
}

// A rough, cheap bound: half the smallest bounding-box dimension, so the
// inner offset can't invert through the opposite wall of the model.
function estimateMaxSafeOffset(geometry: THREE.BufferGeometry): number {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return 0;
  const size = new THREE.Vector3();
  box.getSize(size);
  return Math.min(size.x, size.y, size.z) * 0.45;
}
