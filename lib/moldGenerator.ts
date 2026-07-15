import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION, INTERSECTION } from 'three-bvh-csg';

export type SplitAxis = 'x' | 'y' | 'z';

export interface MoldResult {
  halfA: THREE.BufferGeometry;
  halfB: THREE.BufferGeometry;
  splitAxis: SplitAxis;
  boxSize: { x: number; y: number; z: number };
}

const AXIS_INDEX: Record<SplitAxis, 0 | 1 | 2> = { x: 0, y: 1, z: 2 };

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
  const brush = new Brush(geometry);

  const position: [number, number, number] = [center.x, center.y, center.z];
  position[axisIndex] = splitValue + (side * largeExtent) / 2;
  brush.position.set(position[0], position[1], position[2]);
  brush.updateMatrixWorld();

  return brush;
}

/**
 * Generates a two-part 3D-printable mold around a model: an enclosing box
 * with the model's shape subtracted out to form the cavity, split into two
 * halves along the chosen axis through the model's center.
 */
export function generateMold(
  sourceGeometry: THREE.BufferGeometry,
  margin: number,
  splitAxis: SplitAxis
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

  const boxGeometry = new THREE.BoxGeometry(outerSize.x, outerSize.y, outerSize.z);
  const boxBrush = new Brush(boxGeometry);
  boxBrush.position.copy(center);
  boxBrush.updateMatrixWorld();

  const evaluator = new Evaluator();
  // STL geometries have no UV data; restrict to attributes every brush shares.
  evaluator.attributes = ['position', 'normal'];
  const cavityBrush = evaluator.evaluate(boxBrush, modelBrush, SUBTRACTION);

  const splitValue = center.getComponent(AXIS_INDEX[splitAxis]);
  const sideABrush = buildHalfSpaceBrush(center, outerSize, splitAxis, splitValue, 1);
  const sideBBrush = buildHalfSpaceBrush(center, outerSize, splitAxis, splitValue, -1);

  const halfABrush = evaluator.evaluate(cavityBrush, sideABrush, INTERSECTION);
  const halfBBrush = evaluator.evaluate(cavityBrush, sideBBrush, INTERSECTION);

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
