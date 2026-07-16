export type ModelFormat = 'stl' | 'obj' | 'glb' | 'ply';

export interface ModelStats {
  fileName: string;
  format: ModelFormat;
  triangleCount: number;
  vertexCount: number;
  dimensions: { x: number; y: number; z: number };
}
