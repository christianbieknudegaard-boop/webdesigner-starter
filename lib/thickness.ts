import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { weldByPosition } from '@/lib/meshUtils';

export interface ThicknessResult {
  /** Welded copy of the model with a per-vertex color heat map attached. */
  geometry: THREE.BufferGeometry;
  /** Area fraction (0..1) of the surface thinner than the threshold. */
  belowFraction: number;
  /** Thinnest wall found, native units (Infinity if nothing measured). */
  minFound: number;
}

const COLOR_THIN = [0.95, 0.2, 0.2];
const COLOR_WARN = [0.96, 0.62, 0.1];
const COLOR_OK = [0.31, 0.56, 0.97];
const MAX_SAMPLED_TRIANGLES = 150_000;

/**
 * Estimates local wall thickness by shooting a ray inward from each triangle
 * centroid (BVH-accelerated) and measuring the distance to the opposite
 * surface. Thin areas fail in printing and especially in casting.
 */
export function analyzeThickness(
  sourceGeometry: THREE.BufferGeometry,
  minThickness: number
): ThicknessResult {
  if (!(minThickness > 0)) {
    throw new Error('Minimumstykkelsen må være større enn 0.');
  }

  const welded = weldByPosition(sourceGeometry);
  welded.computeBoundingBox();
  const diagonal = welded.boundingBox!.getSize(new THREE.Vector3()).length() || 1;
  const epsilon = Math.max(diagonal * 1e-4, 1e-4);

  const bvh = new MeshBVH(welded);
  const index = welded.index!;
  const position = welded.attributes.position;
  const triangleCount = index.count / 3;
  const stride = Math.max(1, Math.ceil(triangleCount / MAX_SAMPLED_TRIANGLES));

  const vertexThickness = new Float32Array(position.count).fill(Infinity);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const ray = new THREE.Ray();

  let totalArea = 0;
  let belowArea = 0;
  let minFound = Infinity;

  for (let t = 0; t < triangleCount; t += stride) {
    const i0 = index.getX(t * 3);
    const i1 = index.getX(t * 3 + 1);
    const i2 = index.getX(t * 3 + 2);
    a.fromBufferAttribute(position, i0);
    b.fromBufferAttribute(position, i1);
    c.fromBufferAttribute(position, i2);

    normal.subVectors(b, a).cross(c.clone().sub(a));
    const doubleArea = normal.length();
    if (doubleArea < 1e-12) continue;
    normal.divideScalar(doubleArea);
    const area = doubleArea / 2;

    ray.origin
      .copy(a)
      .add(b)
      .add(c)
      .divideScalar(3)
      .addScaledVector(normal, -epsilon);
    ray.direction.copy(normal).negate();

    const hit = bvh.raycastFirst(ray, THREE.DoubleSide);
    const thickness = hit ? hit.distance + epsilon : Infinity;

    totalArea += area;
    if (thickness < minThickness) belowArea += area;
    if (thickness < minFound) minFound = thickness;

    for (const vertex of [i0, i1, i2]) {
      if (thickness < vertexThickness[vertex]) vertexThickness[vertex] = thickness;
    }
  }

  const colors = new Float32Array(position.count * 3);
  for (let v = 0; v < position.count; v++) {
    const thickness = vertexThickness[v];
    const palette =
      thickness < minThickness
        ? COLOR_THIN
        : thickness < minThickness * 1.5
          ? COLOR_WARN
          : COLOR_OK;
    colors[v * 3] = palette[0];
    colors[v * 3 + 1] = palette[1];
    colors[v * 3 + 2] = palette[2];
  }
  welded.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  welded.computeVertexNormals();

  return {
    geometry: welded,
    belowFraction: totalArea > 0 ? belowArea / totalArea : 0,
    minFound,
  };
}
