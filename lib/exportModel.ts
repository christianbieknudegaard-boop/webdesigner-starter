import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { PLYExporter } from 'three/examples/jsm/exporters/PLYExporter.js';

export type ExportFormat = 'stl' | 'obj' | 'ply';

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Exports the geometry (with the display scale baked in) as STL, OBJ or PLY. */
export function downloadGeometry(
  geometry: THREE.BufferGeometry,
  scale: number,
  baseName: string,
  format: ExportFormat = 'stl'
) {
  const exportGeometry = geometry.clone();
  if (scale !== 1) {
    exportGeometry.scale(scale, scale, scale);
  }
  const mesh = new THREE.Mesh(exportGeometry);

  if (format === 'obj') {
    const text = new OBJExporter().parse(mesh);
    triggerDownload(new Blob([text], { type: 'text/plain' }), `${baseName}.obj`);
    return;
  }

  if (format === 'ply') {
    exportGeometry.computeVertexNormals();
    const data = new PLYExporter().parse(mesh, () => {}, { binary: true }) as ArrayBuffer;
    triggerDownload(new Blob([data], { type: 'application/octet-stream' }), `${baseName}.ply`);
    return;
  }

  const result = new STLExporter().parse(mesh, { binary: true }) as DataView;
  const bytes = Uint8Array.from(new Uint8Array(result.buffer, result.byteOffset, result.byteLength));
  triggerDownload(new Blob([bytes], { type: 'application/sla' }), `${baseName}.stl`);
}

export function downloadGeometryAsSTL(geometry: THREE.BufferGeometry, scale: number, fileName: string) {
  downloadGeometry(geometry, scale, fileName.replace(/\.stl$/i, ''), 'stl');
}
