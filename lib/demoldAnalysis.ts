import * as THREE from 'three';
import type { SplitAxis } from '@/lib/moldGenerator';

export interface DemoldAxisReport {
  axis: SplitAxis;
  /** Area-weighted fraction (0..1) of the model surface that hooks into its
   *  mold half when the halves are pulled apart along this split axis. */
  undercutFraction: number;
}

const AXES: SplitAxis[] = ['x', 'y', 'z'];
// Surfaces within ~2 degrees of parallel to the pull direction slide freely.
const PARALLEL_TOLERANCE = 0.035;

/**
 * Rates how demoldable a rigid cast would be for each candidate split axis.
 *
 * Each triangle belongs to the mold half on its side of the parting plane,
 * which is pulled straight out along the split axis. The mold surface can
 * release only where the model surface faces its half's pull direction;
 * a triangle whose outward normal points against the pull hooks the cast.
 * Flexible casts (silicone) tolerate moderate undercuts, rigid resin or
 * plaster casts do not - so the fraction is a hard warning for rigid use.
 */
export function analyzeDemoldability(geometry: THREE.BufferGeometry): DemoldAxisReport[] {
  const position = geometry.attributes.position;
  const index = geometry.index;
  const triangleCount = index ? index.count / 3 : position.count / 3;

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const centroid = new THREE.Vector3();

  geometry.computeBoundingBox();
  const center = new THREE.Vector3();
  geometry.boundingBox!.getCenter(center);

  let totalArea = 0;
  const undercutArea = [0, 0, 0];

  for (let t = 0; t < triangleCount; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3;
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;

    a.fromBufferAttribute(position, i0);
    b.fromBufferAttribute(position, i1);
    c.fromBufferAttribute(position, i2);

    ab.subVectors(b, a);
    ac.subVectors(c, a);
    normal.crossVectors(ab, ac);
    const doubleArea = normal.length();
    if (doubleArea < 1e-12) continue;

    const area = doubleArea / 2;
    totalArea += area;
    normal.divideScalar(doubleArea);
    centroid.addVectors(a, b).add(c).divideScalar(3);

    for (let axisIndex = 0; axisIndex < 3; axisIndex++) {
      const side = centroid.getComponent(axisIndex) >= center.getComponent(axisIndex) ? 1 : -1;
      const towardPull = normal.getComponent(axisIndex) * side;
      if (towardPull < -PARALLEL_TOLERANCE) {
        undercutArea[axisIndex] += area;
      }
    }
  }

  return AXES.map((axis, axisIndex) => ({
    axis,
    undercutFraction: totalArea > 0 ? undercutArea[axisIndex] / totalArea : 0,
  }));
}

/** The axis with the least undercut area (ties broken in x, y, z order). */
export function recommendSplitAxis(reports: DemoldAxisReport[]): SplitAxis {
  let best = reports[0];
  for (const report of reports) {
    if (report.undercutFraction < best.undercutFraction - 1e-9) {
      best = report;
    }
  }
  return best.axis;
}
