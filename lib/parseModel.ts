import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ensureOutwardWinding } from '@/lib/meshUtils';
import { svgToGeometry, SVG_DEFAULTS } from '@/lib/svgTo3d';
import { fileToImageData, imageToLithophane, LITHOPHANE_DEFAULTS } from '@/lib/lithophane';
import { isZUpFormat, type ModelFormat, type ModelStats } from '@/types/model';

const MODEL_COLOR = '#4f8ff7';

/** Kept around for 2D-derived models so the panel can regenerate them. */
export type Source2D =
  | { kind: 'svg'; text: string }
  | { kind: 'image'; image: ImageData };

export interface ParsedModel {
  object: THREE.Object3D;
  stats: ModelStats;
  source2d?: Source2D;
}

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp']);

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

/**
 * OBJ files often contain several sub-meshes (one per `o`/`g` group). The
 * tools (repair, shell, mold) operate on a single geometry, so bake each
 * mesh's world transform and merge them into one. Attributes are reduced to
 * positions - normals are recomputed, and materials get replaced anyway.
 */
function mergeToSingleMesh(object: THREE.Object3D): THREE.Object3D {
  const meshes: THREE.Mesh[] = [];
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) meshes.push(child);
  });
  if (meshes.length <= 1) return object;

  object.updateWorldMatrix(true, true);
  const parts = meshes.map((mesh) => {
    const source = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    const stripped = new THREE.BufferGeometry();
    stripped.setAttribute('position', source.attributes.position);
    stripped.applyMatrix4(mesh.matrixWorld);
    return stripped;
  });

  const merged = mergeGeometries(parts, false);
  if (!merged) return object;
  merged.computeVertexNormals();
  return new THREE.Mesh(merged);
}

export async function parseModelFile(file: File): Promise<ParsedModel> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  let object: THREE.Object3D;
  let format: ModelFormat;
  let source2d: Source2D | undefined;

  if (extension === 'svg') {
    try {
      const text = await file.text();
      object = new THREE.Mesh(svgToGeometry(text, SVG_DEFAULTS));
      format = 'svg';
      source2d = { kind: 'svg', text };
    } catch (err) {
      throw err instanceof Error && err.message.startsWith('Fant ingen')
        ? err
        : new Error('Kunne ikke lese SVG-filen. Den må inneholde fylte former.');
    }
  } else if (extension && IMAGE_EXTENSIONS.has(extension)) {
    try {
      const image = await fileToImageData(file);
      object = new THREE.Mesh(imageToLithophane(image, LITHOPHANE_DEFAULTS));
      format = 'bilde';
      source2d = { kind: 'image', image };
    } catch {
      throw new Error('Kunne ikke lese bildet. Prøv PNG, JPG eller WebP.');
    }
  } else if (extension === 'stl') {
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
  } else if (extension === 'glb' || extension === 'gltf') {
    try {
      const buffer = await file.arrayBuffer();
      const gltf = await new GLTFLoader().parseAsync(buffer, '');
      object = gltf.scene;
      format = 'glb';
    } catch {
      throw new Error(
        'Kunne ikke lese GLB/GLTF-filen. Draco-komprimerte filer støttes ikke ennå.'
      );
    }
  } else if (extension === 'ply') {
    try {
      const buffer = await file.arrayBuffer();
      const geometry = new PLYLoader().parse(buffer);
      if (!geometry.index && geometry.attributes.position.count % 3 !== 0) {
        throw new Error('punktsky');
      }
      geometry.computeVertexNormals();
      object = new THREE.Mesh(geometry);
      format = 'ply';
    } catch {
      throw new Error('Kunne ikke lese PLY-filen. Punktskyer uten flater støttes ikke.');
    }
  } else {
    throw new Error(
      `Filformatet .${extension ?? '?'} støttes ikke ennå. Bruk STL, OBJ, GLB, PLY, SVG eller et bilde.`
    );
  }

  assertHasMesh(object);
  object = mergeToSingleMesh(object);
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) ensureOutwardWinding(child.geometry);
  });
  applyStandardMaterial(object);

  // Compute stats in the file's native axes before any display-only rotation,
  // so dimensions match what a slicer/CAD tool would report (X/Y/Z as authored).
  const stats = computeStats(object, file.name, format);

  // Z-up formats (print bed = XY, height = Z) get a display-only rotation,
  // since three.js treats Y as up. OBJ and GLB are already Y-up.
  if (isZUpFormat(format)) {
    object.rotation.x = -Math.PI / 2;
  }

  return { object, stats, source2d };
}
