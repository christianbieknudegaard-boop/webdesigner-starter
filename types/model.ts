export type ModelFormat = 'stl' | 'obj' | 'glb' | 'ply' | 'svg' | 'bilde';

/** Native up axis per format: OBJ/GLB are authored Y-up, the rest Z-up
 *  (print-bed convention; our generated svg/lithophane solids follow it). */
export function formatUpAxis(format: ModelFormat): 'y' | 'z' {
  return format === 'obj' || format === 'glb' ? 'y' : 'z';
}

/** Z-up formats get a display-only -90deg X rotation (three.js is Y-up). */
export function isZUpFormat(format: ModelFormat): boolean {
  return formatUpAxis(format) === 'z';
}

export interface ModelStats {
  fileName: string;
  format: ModelFormat;
  triangleCount: number;
  vertexCount: number;
  dimensions: { x: number; y: number; z: number };
}
