import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION, INTERSECTION, ADDITION, computeMeshVolume } from 'three-bvh-csg';

export type SplitAxis = 'x' | 'y' | 'z';

export interface MoldOptions {
  pourChannel: boolean;
  registrationKeys: boolean;
  bandGrooves: boolean;
  prySlots: boolean;
  /** The model's up direction in native coordinates: 'z' for STL, 'y' for OBJ. */
  upAxis: SplitAxis;
}

export interface MoldResult {
  halfA: THREE.BufferGeometry;
  halfB: THREE.BufferGeometry;
  splitAxis: SplitAxis;
  boxSize: { x: number; y: number; z: number };
  /** Empty space in the assembled mold (cavity + pour channel), native units cubed. */
  siliconeVolume: number;
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
 * Finds where along the parting line the pour channel should enter: sample
 * across the model, raycast down the pour axis, and keep the highest surface
 * hit (ties broken toward the center). For solid models this is simply the
 * top; for open vessels (cups, flower pots) the naive "center of the top"
 * would drop the channel into the mold core - a dead-end tube that never
 * reaches the casting cavity - so the rim wins instead.
 */
function findPourPoint(
  modelGeometry: THREE.BufferGeometry,
  box: THREE.Box3,
  center: THREE.Vector3,
  splitValue: number,
  splitAxis: SplitAxis,
  pourAxis: SplitAxis,
  thirdAxis: SplitAxis
): { thirdCoord: number; surfaceCoord: number } {
  const pourIndex = AXIS_INDEX[pourAxis];
  const thirdIndex = AXIS_INDEX[thirdAxis];

  const probe = new THREE.Mesh(
    modelGeometry,
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
  );
  probe.updateMatrixWorld();

  const raycaster = new THREE.Raycaster();
  const direction = new THREE.Vector3();
  direction.setComponent(pourIndex, -1);

  const uMin = box.min.getComponent(thirdIndex);
  const uMax = box.max.getComponent(thirdIndex);
  const uCenter = center.getComponent(thirdIndex);
  const rayTop = box.max.getComponent(pourIndex) + 10;

  let bestU = uCenter;
  let bestHit = -Infinity;
  let bestDistToCenter = Infinity;
  const SAMPLES = 60;

  for (let i = 0; i <= SAMPLES; i++) {
    const u = uMin + ((uMax - uMin) * i) / SAMPLES;
    const origin = center.clone();
    origin.setComponent(AXIS_INDEX[splitAxis], splitValue);
    origin.setComponent(thirdIndex, u);
    origin.setComponent(pourIndex, rayTop);

    raycaster.set(origin, direction);
    const hits = raycaster.intersectObject(probe, false);
    if (hits.length === 0) continue;

    const hitCoord = hits[0].point.getComponent(pourIndex);
    const distToCenter = Math.abs(u - uCenter);
    if (hitCoord > bestHit + 1e-6 || (Math.abs(hitCoord - bestHit) <= 1e-6 && distToCenter < bestDistToCenter)) {
      bestHit = hitCoord;
      bestU = u;
      bestDistToCenter = distToCenter;
    }
  }

  if (!Number.isFinite(bestHit)) {
    return { thirdCoord: uCenter, surfaceCoord: box.max.getComponent(pourIndex) };
  }
  return { thirdCoord: bestU, surfaceCoord: bestHit };
}

/**
 * Generates a two-part 3D-printable mold around a model: an enclosing box
 * with the model's shape subtracted out to form the cavity, split into two
 * halves along the chosen axis through the model's center.
 *
 * Options add a pour channel with funnel (centered on the parting plane and
 * entering at the model's highest surface along it), four spherical
 * registration keys (bumps on half B, matching clearance recesses in half A),
 * and two rubber-band grooves around the side walls for clamping the halves
 * together during casting.
 */
export function generateMold(
  sourceGeometry: THREE.BufferGeometry,
  margin: number,
  splitAxis: SplitAxis,
  options: MoldOptions = {
    pourChannel: true,
    registrationKeys: true,
    bandGrooves: true,
    prySlots: true,
    upAxis: 'z',
  }
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
  const splitValue = center.getComponent(AXIS_INDEX[splitAxis]);

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

  // Pour along an axis that lies in the parting plane, so the channel is
  // shared between the two halves. Prefer the model's up direction (Z for
  // STL, Y for OBJ); if that IS the split axis, fall back to a side axis.
  const upAxis = options.upAxis ?? 'z';
  const pourAxis: SplitAxis =
    splitAxis === upAxis ? (upAxis === 'z' ? 'y' : 'z') : upAxis;
  const thirdAxis = ALL_AXES.find((axis) => axis !== splitAxis && axis !== pourAxis)!;

  if (options.pourChannel) {
    const pourIndex = AXIS_INDEX[pourAxis];
    const thirdIndex = AXIS_INDEX[thirdAxis];
    const rotation = cylinderRotationFor(pourAxis);

    const channelRadius = margin * 0.5;
    const overlap = margin * 0.5; // reach into the cavity so the channel connects
    const funnelHeight = margin * 0.7;
    const funnelTopRadius = channelRadius * 2.2;
    const outerTop = box.max.getComponent(pourIndex) + margin;

    const pour = findPourPoint(modelGeometry, box, center, splitValue, splitAxis, pourAxis, thirdAxis);

    // Keep the funnel from breaking through the mold's side wall.
    const uLimit =
      outerSize.getComponent(thirdIndex) / 2 - funnelTopRadius - margin * 0.15;
    const thirdCoord = THREE.MathUtils.clamp(
      pour.thirdCoord,
      center.getComponent(thirdIndex) - uLimit,
      center.getComponent(thirdIndex) + uLimit
    );

    const channelCenter = center.clone();
    channelCenter.setComponent(AXIS_INDEX[splitAxis], splitValue);
    channelCenter.setComponent(thirdIndex, thirdCoord);

    const neckBottom = pour.surfaceCoord - overlap;
    const neckTop = outerTop - funnelHeight;
    const neckHeight = Math.max(neckTop - neckBottom, margin * 0.1);

    const neckCenter = channelCenter.clone();
    neckCenter.setComponent(pourIndex, neckBottom + neckHeight / 2);
    const neckBrush = brushAt(
      new THREE.CylinderGeometry(channelRadius, channelRadius, neckHeight, 24),
      neckCenter,
      rotation
    );
    cavityBrush = evaluator.evaluate(cavityBrush, neckBrush, SUBTRACTION);

    // Funnel flares out toward the top surface for easy pouring. Extend it a
    // hair past the surface so the boolean cut is unambiguous.
    const funnelCenter = channelCenter.clone();
    funnelCenter.setComponent(pourIndex, neckTop + (funnelHeight + margin * 0.02) / 2);
    const funnelBrush = brushAt(
      new THREE.CylinderGeometry(funnelTopRadius, channelRadius, funnelHeight + margin * 0.02, 24),
      funnelCenter,
      rotation
    );
    cavityBrush = evaluator.evaluate(cavityBrush, funnelBrush, SUBTRACTION);
  }

  // Estimate the silicone needed BEFORE cutting the external band grooves:
  // grooves live on the outside of the assembled mold and never hold
  // silicone, so they must not inflate the estimate.
  const boxVolume = outerSize.x * outerSize.y * outerSize.z;
  const siliconeVolume = Math.max(0, boxVolume - computeMeshVolume(cavityBrush));

  if (options.bandGrooves) {
    // Two shallow grooves wrap the four side walls (plane normal = pour
    // axis, so they never touch the funnel face) and cross the parting
    // plane - rubber bands seated in them clamp the halves together.
    const bandIndex = AXIS_INDEX[pourAxis];
    const grooveDepth = margin * 0.25;
    const grooveWidth = margin * 0.5;

    for (const side of [-1, 1]) {
      const ringCenter = center.clone();
      ringCenter.setComponent(
        bandIndex,
        center.getComponent(bandIndex) + side * outerSize.getComponent(bandIndex) * 0.27
      );

      const outerDims: [number, number, number] = [
        outerSize.x + grooveDepth * 2,
        outerSize.y + grooveDepth * 2,
        outerSize.z + grooveDepth * 2,
      ];
      outerDims[bandIndex] = grooveWidth;
      const innerDims: [number, number, number] = [
        outerSize.x - grooveDepth * 2,
        outerSize.y - grooveDepth * 2,
        outerSize.z - grooveDepth * 2,
      ];
      innerDims[bandIndex] = grooveWidth * 2;

      const slabBrush = brushAt(new THREE.BoxGeometry(...outerDims), ringCenter);
      const coreBrush = brushAt(new THREE.BoxGeometry(...innerDims), ringCenter);
      const ringBrush = evaluator.evaluate(slabBrush, coreBrush, SUBTRACTION);
      cavityBrush = evaluator.evaluate(cavityBrush, ringBrush, SUBTRACTION);
    }
  }

  if (options.prySlots) {
    // Two screwdriver notches straddling the parting seam on the side faces
    // the seam crosses, so the halves can be levered apart after casting.
    // Placed at mid pour-height: clear of the band grooves (at ±27%), the
    // registration keys (at the corners), and the funnel (top face).
    const thirdIndex = AXIS_INDEX[thirdAxis];
    const slotDims: [number, number, number] = [0, 0, 0];
    slotDims[AXIS_INDEX[splitAxis]] = margin * 0.9; // opening across the seam
    slotDims[thirdIndex] = margin * 0.8; // centered on the wall -> cuts 0.4*margin deep
    slotDims[AXIS_INDEX[pourAxis]] = margin * 0.6;

    for (const side of [-1, 1]) {
      const slotCenter = center.clone();
      slotCenter.setComponent(AXIS_INDEX[splitAxis], splitValue);
      slotCenter.setComponent(
        thirdIndex,
        center.getComponent(thirdIndex) + (side * outerSize.getComponent(thirdIndex)) / 2
      );
      const slotBrush = brushAt(new THREE.BoxGeometry(...slotDims), slotCenter);
      cavityBrush = evaluator.evaluate(cavityBrush, slotBrush, SUBTRACTION);
    }
  }

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

  // The evaluator emits result geometry in the FIRST brush's local frame and
  // parks that frame on the returned brush's transform (see Evaluator.js:
  // "assign brush A's transform to the result"). Bake it back into the
  // geometry so the halves land in the source model's coordinate system.
  for (const brush of [halfABrush, halfBBrush]) {
    brush.updateMatrixWorld();
    brush.geometry.applyMatrix4(brush.matrixWorld);
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
    siliconeVolume,
  };
}
