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

export type BooleanOp = 'union' | 'subtract' | 'intersect';

/** Combines two solids with a boolean operation. Both inputs must already be
 *  in the same coordinate frame; the result is baked into that frame. */
export function booleanGeometry(
  a: THREE.BufferGeometry,
  b: THREE.BufferGeometry,
  op: BooleanOp
): THREE.BufferGeometry {
  const prepare = (source: THREE.BufferGeometry) => {
    const clone = source.clone();
    if (!clone.attributes.normal) clone.computeVertexNormals();
    const brush = new Brush(clone);
    brush.updateMatrixWorld();
    return brush;
  };
  const operation = op === 'union' ? ADDITION : op === 'subtract' ? SUBTRACTION : INTERSECTION;
  const result = makeEvaluator().evaluate(prepare(a), prepare(b), operation);
  const geometry = bakeResult(result);
  if (!geometry.attributes.position || geometry.attributes.position.count === 0) {
    throw new Error('Operasjonen ga et tomt resultat – modellene overlapper kanskje ikke.');
  }
  return geometry;
}

export interface CutResult {
  halfA: THREE.BufferGeometry;
  halfB: THREE.BufferGeometry;
  axis: SplitAxis;
  pinsAdded: boolean;
}

/**
 * Finds up to two dowel-pin positions on the flat cap that `cutGeometry`
 * produced: collects the cap triangles (coplanar with the cut), then walks
 * candidates along the cap's longer in-plane dimension and keeps those that
 * actually land on cap material (point-in-triangle test in 2D).
 */
function findPinSpots(
  capGeometry: THREE.BufferGeometry,
  axisIndex: 0 | 1 | 2,
  coord: number
): { points: THREE.Vector3[]; radius: number } {
  const position = capGeometry.attributes.position;
  const index = capGeometry.index;
  const count = index ? index.count : position.count;
  const [u, v] = [0, 1, 2].filter((i) => i !== axisIndex) as [number, number];
  const epsilon = 1e-3;

  interface CapTri { au: number; av: number; bu: number; bv: number; cu: number; cv: number }
  const capTris: CapTri[] = [];
  const p = new THREE.Vector3();
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;

  const corners: THREE.Vector3[] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  for (let i = 0; i < count; i += 3) {
    let onPlane = true;
    for (let k = 0; k < 3; k++) {
      corners[k].fromBufferAttribute(position, index ? index.getX(i + k) : i + k);
      if (Math.abs(corners[k].getComponent(axisIndex) - coord) > epsilon) onPlane = false;
    }
    if (!onPlane) continue;
    capTris.push({
      au: corners[0].getComponent(u), av: corners[0].getComponent(v),
      bu: corners[1].getComponent(u), bv: corners[1].getComponent(v),
      cu: corners[2].getComponent(u), cv: corners[2].getComponent(v),
    });
    for (const corner of corners) {
      minU = Math.min(minU, corner.getComponent(u));
      maxU = Math.max(maxU, corner.getComponent(u));
      minV = Math.min(minV, corner.getComponent(v));
      maxV = Math.max(maxV, corner.getComponent(v));
    }
  }
  if (capTris.length === 0) return { points: [], radius: 0 };

  const spanU = maxU - minU;
  const spanV = maxV - minV;
  const radius = Math.min(Math.min(spanU, spanV) * 0.12, 4);
  if (radius < 0.5) return { points: [], radius: 0 };

  const inCap = (pu: number, pv: number): boolean => {
    for (const t of capTris) {
      const d1 = (pu - t.bu) * (t.av - t.bv) - (t.au - t.bu) * (pv - t.bv);
      const d2 = (pu - t.cu) * (t.bv - t.cv) - (t.bu - t.cu) * (pv - t.cv);
      const d3 = (pu - t.au) * (t.cv - t.av) - (t.cu - t.au) * (pv - t.av);
      const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
      const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(hasNeg && hasPos)) return true;
    }
    return false;
  };

  // Candidates spread along the longer in-plane dimension, centered on the
  // shorter one; require clearance for the pin plus a small wall.
  const longIsU = spanU >= spanV;
  const centerShort = longIsU ? (minV + maxV) / 2 : (minU + maxU) / 2;
  const points: THREE.Vector3[] = [];
  for (const fraction of [0.28, 0.72, 0.5, 0.15, 0.85]) {
    if (points.length >= 2) break;
    const long = (longIsU ? minU : minV) + (longIsU ? spanU : spanV) * fraction;
    const pu = longIsU ? long : centerShort;
    const pv = longIsU ? centerShort : long;
    const clear = radius * 1.6;
    if (
      inCap(pu, pv) &&
      inCap(pu + clear, pv) && inCap(pu - clear, pv) &&
      inCap(pu, pv + clear) && inCap(pu, pv - clear) &&
      points.every((q) => Math.hypot(q.getComponent(u) - pu, q.getComponent(v) - pv) > radius * 4)
    ) {
      p.set(0, 0, 0);
      p.setComponent(axisIndex, coord);
      p.setComponent(u, pu);
      p.setComponent(v, pv);
      points.push(p.clone());
    }
  }
  return { points, radius };
}

/** Cuts the model in two along a plane perpendicular to `axis` at `coord`
 *  (native units), producing two watertight, printable halves. With `pins`,
 *  dowel bumps on half A and clearance recesses on half B self-align the
 *  parts when gluing. */
export function cutGeometry(
  sourceGeometry: THREE.BufferGeometry,
  axis: SplitAxis,
  coord: number,
  pins = true
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

  let [halfA, halfB] = halves;
  let pinsAdded = false;

  if (pins) {
    const spots = findPinSpots(halfA, axisIndex, coord);
    if (spots.points.length > 0) {
      let brushA = new Brush(halfA);
      brushA.updateMatrixWorld();
      let brushB = new Brush(halfB);
      brushB.updateMatrixWorld();
      for (const point of spots.points) {
        const bump = new Brush(new THREE.SphereGeometry(spots.radius, 16, 16));
        bump.position.copy(point);
        bump.updateMatrixWorld();
        const recess = new Brush(new THREE.SphereGeometry(spots.radius * 1.12, 16, 16));
        recess.position.copy(point);
        recess.updateMatrixWorld();
        brushA = evaluator.evaluate(brushA, bump, ADDITION);
        brushB = evaluator.evaluate(brushB, recess, SUBTRACTION);
      }
      halfA = bakeResult(brushA);
      halfB = bakeResult(brushB);
      pinsAdded = true;
    }
  }

  return { halfA, halfB, axis, pinsAdded };
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
  const rotation = textRotationFor(direction, up);

  // The bounding-box face usually floats above the real surface on curved
  // models. Raycast a grid over the text footprint to find how far the
  // actual surface lies behind the face plane (dMin = most protruding
  // sampled point, dMax = most recessed), and anchor the text prism there.
  const probe = buildTextGeometry(trimmed, options.size, 1);
  probe.computeBoundingBox();
  const textSize = probe.boundingBox!.getSize(new THREE.Vector3());
  const basis = new THREE.Matrix4().makeRotationFromQuaternion(rotation);
  const textRight = new THREE.Vector3().setFromMatrixColumn(basis, 0);
  const textUp = new THREE.Vector3().setFromMatrixColumn(basis, 1);

  const raycaster = new THREE.Raycaster();
  const probeMesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
  );
  const spanOut = box.getSize(new THREE.Vector3()).getComponent(axisIndex) || 1;
  const pad = Math.max(spanOut * 0.05, options.depth);
  const probeDepth = (u: number, v: number): number | null => {
    const sample = center
      .clone()
      .addScaledVector(textRight, textSize.x * u)
      .addScaledVector(textUp, textSize.y * v);
    sample.setComponent(axisIndex, faceCoord + direction.getComponent(axisIndex) * pad);
    raycaster.set(sample, direction.clone().negate());
    const hit = raycaster.intersectObject(probeMesh, false)[0];
    return hit ? hit.distance - pad : null; // 0 = at the bbox face plane
  };

  // Anchor on the surface under the text's center; the protrusion check
  // keeps the prism from starting buried under a higher nearby feature.
  const hits: number[] = [];
  let dMin = Infinity;
  for (const u of [-0.45, 0, 0.45]) {
    for (const v of [-0.45, 0, 0.45]) {
      const d = probeDepth(u, v);
      if (d === null) continue;
      hits.push(d);
      if (d < dMin) dMin = d;
    }
  }
  let anchor = probeDepth(0, 0);
  if (anchor === null) {
    hits.sort((a, b) => a - b);
    anchor = hits.length > 0 ? hits[Math.floor(hits.length / 2)] : 0;
  }
  if (!Number.isFinite(dMin)) dMin = anchor;

  const eps = options.depth * 0.25;
  // Engrave: cut `depth` below the anchored surface, starting just proud of
  // the highest sampled point so no buried pocket forms. Emboss: a prism
  // centered on the anchored surface - `depth` raised, `depth` embedded.
  const outerDepth =
    options.mode === 'engrave' ? Math.min(dMin, anchor) - eps : anchor - options.depth;
  const innerDepth = anchor + options.depth;
  const textGeometry = buildTextGeometry(trimmed, options.size, innerDepth - outerDepth);

  const textBrush = new Brush(textGeometry);
  textBrush.quaternion.copy(rotation);
  const position = center.clone();
  const centerDepth = (outerDepth + innerDepth) / 2;
  position.setComponent(
    axisIndex,
    faceCoord - direction.getComponent(axisIndex) * centerDepth
  );
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
