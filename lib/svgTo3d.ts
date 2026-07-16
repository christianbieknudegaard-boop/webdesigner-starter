import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ensureOutwardWinding } from '@/lib/meshUtils';

export interface SvgOptions {
  /** Target width of the extruded solid, mm. */
  widthMm: number;
  /** Extrusion depth, mm. */
  depthMm: number;
}

export const SVG_DEFAULTS: SvgOptions = { widthMm: 80, depthMm: 5 };

/**
 * Extrudes the filled shapes of an SVG into a Z-up solid: the artwork lies in
 * the XY plane (Y flipped from SVG's screen coordinates) and the extrusion
 * runs from z=0 to z=depth. Strokes without fill are ignored.
 */
export function svgToGeometry(svgText: string, options: SvgOptions): THREE.BufferGeometry {
  const data = new SVGLoader().parse(svgText);

  const parts: THREE.BufferGeometry[] = [];
  for (const path of data.paths) {
    const style = path.userData?.style as { fill?: string } | undefined;
    if (style?.fill === 'none') continue;
    for (const shape of SVGLoader.createShapes(path)) {
      const extruded = new THREE.ExtrudeGeometry(shape, {
        depth: 1,
        bevelEnabled: false,
        curveSegments: 24,
      });
      const stripped = new THREE.BufferGeometry();
      stripped.setAttribute('position', extruded.toNonIndexed().attributes.position);
      parts.push(stripped);
    }
  }
  if (parts.length === 0) {
    throw new Error('Fant ingen fylte former i SVG-filen.');
  }

  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error('Kunne ikke slå sammen formene i SVG-filen.');

  // SVG Y points down on screen; mirror so the artwork reads correctly.
  merged.scale(1, -1, 1);
  merged.computeBoundingBox();
  const box = merged.boundingBox!;
  const size = box.getSize(new THREE.Vector3());
  const planarWidth = Math.max(size.x, 1e-6);
  const s = options.widthMm / planarWidth;

  merged.scale(s, s, options.depthMm / Math.max(size.z, 1e-6));
  merged.computeBoundingBox();
  const scaledBox = merged.boundingBox!;
  const center = scaledBox.getCenter(new THREE.Vector3());
  merged.translate(-center.x, -center.y, -scaledBox.min.z);

  ensureOutwardWinding(merged); // the Y-mirror flipped the winding
  merged.computeVertexNormals();
  return merged;
}
