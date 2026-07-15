import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import type { ModelFormat, ModelStats } from '@/types/model';

const MODEL_COLOR = '#4f8ff7';

export interface ParsedModel {
  object: THREE.Object3D;
  stats: ModelStats;
}

function applyStandardMaterial(object: THREE.Object3D) {
  const material = new THREE.MeshStandardMaterial({
    color: MODEL_COLOR,
    roughness: 0.35,
    metalness: 0.1,
    // Many real-world STL/OBJ uploads have inconsistent or flipped face
    // winding, which would otherwise make faces vanish under backface culling.
    side: THREE.DoubleSide,
  });

  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = material;
      if (!child.geometry.attributes.normal) {
        child.geometry.computeVertexNormals();
      }
    }
  });
}

function computeStats(object: THREE.Object3D, fileName: string, format: ModelFormat): ModelStats {
  let triangleCount = 0;
  let vertexCount = 0;

  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const position = child.geometry.attributes.position;
      const count = position ? position.count : 0;
      vertexCount += count;
      triangleCount += child.geometry.index ? child.geometry.index.count / 3 : count / 3;
    }
  });

  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);

  return {
    fileName,
    format,
    triangleCount: Math.round(triangleCount),
    vertexCount,
    dimensions: { x: size.x, y: size.y, z: size.z },
  };
}

function assertHasMesh(object: THREE.Object3D) {
  let hasMesh = false;
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) hasMesh = true;
  });
  if (!hasMesh) {
    throw new Error('Fant ingen 3D-geometri i filen.');
  }
}

export async function parseModelFile(file: File): Promise<ParsedModel> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  let object: THREE.Object3D;
  let format: ModelFormat;

  if (extension === 'stl') {
    try {
      const buffer = await file.arrayBuffer();
      const geometry = new STLLoader().parse(buffer);
      geometry.computeVertexNormals();
      object = new THREE.Mesh(geometry);
      format = 'stl';
    } catch {
      throw new Error('Kunne ikke lese STL-filen. Den kan være skadet eller ha feil format.');
    }
  } else if (extension === 'obj') {
    try {
      const text = await file.text();
      object = new OBJLoader().parse(text);
      format = 'obj';
    } catch {
      throw new Error('Kunne ikke lese OBJ-filen. Den kan være skadet eller ha feil format.');
    }
  } else {
    throw new Error(`Filformatet .${extension ?? '?'} støttes ikke ennå. Bruk STL eller OBJ.`);
  }

  assertHasMesh(object);
  applyStandardMaterial(object);

  // Compute stats in the file's native axes before any display-only rotation,
  // so dimensions match what a slicer/CAD tool would report (X/Y/Z as authored).
  const stats = computeStats(object, file.name, format);

  // STL is conventionally Z-up (print bed = XY, height = Z), while three.js
  // treats Y as up. Rotate for display only so tall parts don't render lying down.
  if (format === 'stl') {
    object.rotation.x = -Math.PI / 2;
  }

  return { object, stats };
}
