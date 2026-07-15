import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION, INTERSECTION, ADDITION, computeMeshVolume } from 'three-bvh-csg';

export type SplitAxis = 'x' | 'y' | 'z';

export interface MoldOptions {
  pourChannel: boolean;
  registrationKeys: boolean;
}

export interface MoldResult {
  halfA: THREE.BufferGeometry;
  halfB: THREE.BufferGeometry;
  splitAxis: SplitAxis;
  boxSize: { x: number; y: number; z: number };
}

const AXIS_INDEX: Record<SplitAxis, 0 | 1 | 2> = { x: 0, y: 1, z: 2 };
const ALL_AXES: SplitAxis[] = ['x', 'y', 'z'];

function brushAt(
  geometry: THREE.BufferGeometry,
  position: THREE.Vector3,
  rotation?: THREE.Euler
): Brush {
  const brush = new Brush(geometry);
  brush.position.copy(position);
  if (rotation) brush.rotation.copy(rotation);
  brush.updateMatrixWorld();
  return brush;
}

function buildHalfSpaceBrush(
  center: THREE.Vector3,
  outerSize: THREE.Vector3,
  axis: SplitAxis,
  splitValue: number,
  side: 1 | -1
): Brush {
  const axisIndex = AXIS_INDEX[axis];
  const dims: [number, number, number] = [outerSize.x, outerSize.y, outerSize.z];
  // Oversize the half-space box generously so it fully covers its side of the
  // cavity regardless of where the split plane sits within the model bounds.
  const largeExtent = dims[axisIndex] * 2 + 1;
  dims[axisIndex] = largeExtent;

  const geometry = new THREE.BoxGeometry(dims[0], dims[1], dims[2]);
  const position = center.clone();
  position.setComponent(axisIndex, splitValue + (side * largeExtent) / 2);
  return brushAt(geometry, position);
}

// CylinderGeometry's axis is Y; rotate it to run along the requested axis.
function cylinderRotationFor(axis: SplitAxis): THREE.Euler {
  if (axis === 'z') return new THREE.Euler(Math.PI / 2, 0, 0);
  if (axis === 'x') return new THREE.Euler(0, 0, -Math.PI / 2);
  return new THREE.Euler();
}

/**
 * Generates a two-part 3D-printable mold around a model: an enclosing box
 * with the model's shape subtracted out to form the cavity, split into two
 * halves along the chosen axis through the model's center.
 *
 * Optionally adds a pour channel with funnel (centered on the parting plane,
 * so each half carries half the channel) and four spherical registration
 * keys - bumps on half B, matching recesses with clearance in half A - so
 * the halves align when clamped together.
 */
export function generateMold(
  sourceGeometry: THREE.BufferGeometry,
  margin: number,
  splitAxis: SplitAxis,
  options: MoldOptions = { pourChannel: true, registrationKeys: true }
): MoldResult {
  if (!(margin > 0)) {
    throw new Error('Randmargin må være større enn 0.');
  }

  const modelGeometry = sourceGeometry.clone();
  modelGeometry.computeBoundingBox();
  const box = modelGeometry.boundingBox!;
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  const outerSize = new THREE.Vector3(size.x + margin * 2, size.y + margin * 2, size.z + margin * 2);

  const modelBrush = new Brush(modelGeometry);
  modelBrush.updateMatrixWorld();

  const boxBrush = brushAt(
    new THREE.BoxGeometry(outerSize.x, outerSize.y, outerSize.z),
    center
  );

  const evaluator = new Evaluator();
  // STL geometries have no UV data; restrict to attributes every brush shares.
  evaluator.attributes = ['position', 'normal'];
  let cavityBrush = evaluator.evaluate(boxBrush, modelBrush, SUBTRACTION);

  if (options.pourChannel) {
    // Pour along an axis that lies in the parting plane, so the channel is
    // shared between the two halves. Native Z is "up" for STL models.
    const pourAxis: SplitAxis = splitAxis === 'z' ? 'y' : 'z';
    const pourIndex = AXIS_INDEX[pourAxis];
    const rotation = cylinderRotationFor(pourAxis);

    const channelRadius = margin * 0.5;
    const overlap = margin * 0.5; // reach into the cavity so the channel connects
    const funnelHeight = margin * 0.7;
    const modelTop = box.max.getComponent(pourIndex);
    const outerTop = modelTop + margin;

    const neckBottom = modelTop - overlap;
    const neckTop = outerTop - funnelHeight;
    const neckHeight = neckTop - neckBottom;

    const neckCenter = center.clone();
    neckCenter.setComponent(pourIndex, neckBottom + neckHeight / 2);
    const neckBrush = brushAt(
      new THREE.CylinderGeometry(channelRadius, channelRadius, neckHeight, 24),
      neckCenter,
      rotation
    );
    cavityBrush = evaluator.evaluate(cavityBrush, neckBrush, SUBTRACTION);

    // Funnel flares out toward the top surface for easy pouring. Extend it a
    // hair past the surface so the boolean cut is unambiguous.
    const funnelCenter = center.clone();
    funnelCenter.setComponent(pourIndex, neckTop + (funnelHeight + margin * 0.02) / 2);
    const funnelBrush = brushAt(
      new THREE.CylinderGeometry(channelRadius * 2.2, channelRadius, funnelHeight + margin * 0.02, 24),
      funnelCenter,
      rotation
    );
    cavityBrush = evaluator.evaluate(cavityBrush, funnelBrush, SUBTRACTION);
  }

  const splitValue = center.getComponent(AXIS_INDEX[splitAxis]);
  const sideABrush = buildHalfSpaceBrush(center, outerSize, splitAxis, splitValue, 1);
  const sideBBrush = buildHalfSpaceBrush(center, outerSize, splitAxis, splitValue, -1);

  let halfABrush = evaluator.evaluate(cavityBrush, sideABrush, INTERSECTION);
  let halfBBrush = evaluator.evaluate(cavityBrush, sideBBrush, INTERSECTION);

  if (options.registrationKeys) {
    const [axisU, axisV] = ALL_AXES.filter((axis) => axis !== splitAxis);
    const keyRadius = margin * 0.35;
    const clearance = 1.12; // recesses slightly larger than bumps so the halves seat

    for (const signU of [-1, 1]) {
      for (const signV of [-1, 1]) {
        const position = center.clone();
        position.setComponent(AXIS_INDEX[splitAxis], splitValue);
        position.setComponent(
          AXIS_INDEX[axisU],
          center.getComponent(AXIS_INDEX[axisU]) +
            signU * (outerSize.getComponent(AXIS_INDEX[axisU]) / 2 - margin / 2)
        );
        position.setComponent(
          AXIS_INDEX[axisV],
          center.getComponent(AXIS_INDEX[axisV]) +
            signV * (outerSize.getComponent(AXIS_INDEX[axisV]) / 2 - margin / 2)
        );

        const bumpBrush = brushAt(new THREE.SphereGeometry(keyRadius, 16, 16), position);
        const recessBrush = brushAt(
          new THREE.SphereGeometry(keyRadius * clearance, 16, 16),
          position
        );

        halfBBrush = evaluator.evaluate(halfBBrush, bumpBrush, ADDITION);
        halfABrush = evaluator.evaluate(halfABrush, recessBrush, SUBTRACTION);
      }
    }
  }

  halfABrush.geometry.computeVertexNormals();
  halfBBrush.geometry.computeVertexNormals();

  if (
    halfABrush.geometry.attributes.position.count === 0 ||
    halfBBrush.geometry.attributes.position.count === 0
  ) {
    throw new Error('Kunne ikke generere begge mold-halvdelene. Prøv en annen delingsakse.');
  }

  return {
    halfA: halfABrush.geometry,
    halfB: halfBBrush.geometry,
    splitAxis,
    boxSize: { x: outerSize.x, y: outerSize.y, z: outerSize.z },
  };
}

/**
 * Estimates the silicone needed to fill the assembled mold: the outer box
 * volume minus the solid material of both halves equals the empty space
 * inside (cavity + pour channel + key clearance). Native model units cubed.
 */
export function computeSiliconeVolume(result: MoldResult): number {
  const boxVolume = result.boxSize.x * result.boxSize.y * result.boxSize.z;
  const solidVolume = computeMeshVolume(result.halfA) + computeMeshVolume(result.halfB);
  return Math.max(0, boxVolume - solidVolume);
}
