import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION, INTERSECTION, ADDITION } from 'three-bvh-csg';
import { FontLoader, type Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import helvetikerBold from '@/lib/fonts/helvetiker_bold.typeface.json';
import type { SplitAxis } from '@/lib/moldGenerator';

export type FaceSide = '+x' | '-x' | '+y' | '-y' | '+z' | '-z';

const AXIS_INDEX: Record<SplitAxis, 0 | 1 | 2> = { x: 0, y: 1, z: 2 };

let cachedFont: Font | null = null;
export function getFont(): Font {
  if (!cachedFont) {
    cachedFont = new FontLoader().parse(helvetikerBold as unknown as Parameters<FontLoader['parse']>[0]);
  }
  return cachedFont;
}

function makeEvaluator(): Evaluator {
  const evaluator = new Evaluator();
  // STL-style geometry has no UV data; stick to shared attributes.
  evaluator.attributes = ['position', 'normal'];
  return evaluator;
}

function bakeResult(brush: Brush): THREE.BufferGeometry {
  brush.updateMatrixWorld();
  brush.geometry.applyMatrix4(brush.matrixWorld);
  brush.geometry.computeVertexNormals();
  return brush.geometry;
}

export interface CutResult {
  halfA: THREE.BufferGeometry;
  halfB: THREE.BufferGeometry;
  axis: SplitAxis;
}

/** Cuts the model in two along a plane perpendicular to `axis` at `coord`
 *  (native units), producing two watertight, printable halves. */
export function cutGeometry(
  sourceGeometry: THREE.BufferGeometry,
  axis: SplitAxis,
  coord: number
): CutResult {
  const geometry = sourceGeometry.clone();
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  const modelBrush = new Brush(geometry);
  modelBrush.updateMatrixWorld();

  const axisIndex = AXIS_INDEX[axis];
  const extent = Math.max(size.x, size.y, size.z) * 2 + 1;
  const evaluator = makeEvaluator();

  const halves: THREE.BufferGeometry[] = [];
  for (const side of [1, -1] as const) {
    const dims: [number, number, number] = [extent, extent, extent];
    const position = center.clone();
    position.setComponent(axisIndex, coord + (side * extent) / 2);
    const halfSpace = new Brush(new THREE.BoxGeometry(...dims));
    halfSpace.position.copy(position);
    halfSpace.updateMatrixWorld();
    const result = evaluator.evaluate(modelBrush, halfSpace, INTERSECTION);
    halves.push(bakeResult(result));
  }

  if (
    halves[0].attributes.position.count === 0 ||
    halves[1].attributes.position.count === 0
  ) {
    throw new Error('Kutteplanet treffer ikke modellen. Juster posisjonen.');
  }

  return { halfA: halves[0], halfB: halves[1], axis };
}

/** Builds a centered, extruded text geometry lying in the XY plane facing +Z. */
export function buildTextGeometry(text: string, size: number, depth: number): THREE.BufferGeometry {
  const geometry = new TextGeometry(text, {
    font: getFont(),
    size,
    depth,
    curveSegments: 4,
    bevelEnabled: false,
  });
  geometry.computeBoundingBox();
  const center = new THREE.Vector3();
  geometry.boundingBox!.getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);
  return geometry;
}

const FACE_VECTORS: Record<FaceSide, THREE.Vector3> = {
  '+x': new THREE.Vector3(1, 0, 0),
  '-x': new THREE.Vector3(-1, 0, 0),
  '+y': new THREE.Vector3(0, 1, 0),
  '-y': new THREE.Vector3(0, -1, 0),
  '+z': new THREE.Vector3(0, 0, 1),
  '-z': new THREE.Vector3(0, 0, -1),
};

/** Orients +Z-facing text toward `direction`, keeping it upright wrt `up`. */
export function textRotationFor(direction: THREE.Vector3, up: THREE.Vector3): THREE.Quaternion {
  const zAxis = direction.clone();
  let yAxis = up.clone().sub(zAxis.clone().multiplyScalar(up.dot(zAxis)));
  if (yAxis.lengthSq() < 1e-6) yAxis = new THREE.Vector3(1, 0, 0);
  yAxis.normalize();
  const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis);
  const matrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  return new THREE.Quaternion().setFromRotationMatrix(matrix);
}

export interface EngraveOptions {
  text: string;
  face: FaceSide;
  /** Glyph height in native units. */
  size: number;
  /** Cut/raise depth in native units. */
  depth: number;
  mode: 'engrave' | 'emboss';
  /** Model up direction for keeping the text upright. */
  upAxis: SplitAxis;
}

/** Engraves (subtract) or embosses (union) text onto a bounding-box face. */
export function engraveGeometry(
  sourceGeometry: THREE.BufferGeometry,
  options: EngraveOptions
): THREE.BufferGeometry {
  const trimmed = options.text.trim();
  if (!trimmed) throw new Error('Skriv inn en tekst.');
  if (!(options.size > 0) || !(options.depth > 0)) {
    throw new Error('Størrelse og dybde må være større enn 0.');
  }

  const geometry = sourceGeometry.clone();
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const center = new THREE.Vector3();
  box.getCenter(center);

  const direction = FACE_VECTORS[options.face];
  const axisIndex = direction.x !== 0 ? 0 : direction.y !== 0 ? 1 : 2;
  const faceCoord =
    direction.getComponent(axisIndex) > 0
      ? box.max.getComponent(axisIndex)
      : box.min.getComponent(axisIndex);

  const up = FACE_VECTORS[`+${options.upAxis}` as FaceSide];
  // Extrude a bit deeper than requested so the boolean cut is unambiguous.
  const textGeometry = buildTextGeometry(trimmed, options.size, options.depth * 2);

  const textBrush = new Brush(textGeometry);
  textBrush.quaternion.copy(textRotationFor(direction, up));
  const position = center.clone();
  // Engrave: sink so it protrudes `depth` inward. Emboss: raise outward.
  const offset = options.mode === 'engrave' ? -options.depth : options.depth;
  position.setComponent(axisIndex, faceCoord + direction.getComponent(axisIndex) * offset);
  textBrush.position.copy(position);
  textBrush.updateMatrixWorld();

  const modelBrush = new Brush(geometry);
  modelBrush.updateMatrixWorld();

  const evaluator = makeEvaluator();
  const result = evaluator.evaluate(
    modelBrush,
    textBrush,
    options.mode === 'engrave' ? SUBTRACTION : ADDITION
  );
  const baked = bakeResult(result);
  if (baked.attributes.position.count === 0) {
    throw new Error('Graveringen fjernet hele modellen. Reduser dybden.');
  }
  return baked;
}
