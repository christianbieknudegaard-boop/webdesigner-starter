import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

export function downloadGeometryAsSTL(geometry: THREE.BufferGeometry, scale: number, fileName: string) {
  const exportGeometry = geometry.clone();
  if (scale !== 1) {
    exportGeometry.scale(scale, scale, scale);
  }

  const exporter = new STLExporter();
  const result = exporter.parse(new THREE.Mesh(exportGeometry), { binary: true }) as DataView;
  const bytes = Uint8Array.from(new Uint8Array(result.buffer, result.byteOffset, result.byteLength));

  const blob = new Blob([bytes], { type: 'application/sla' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
