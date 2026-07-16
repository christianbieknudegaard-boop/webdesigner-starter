import * as THREE from 'three';

export interface LithophaneOptions {
  /** Plate width, mm (height follows the image's aspect ratio). */
  widthMm: number;
  /** Thinnest (brightest) areas, mm. */
  minMm: number;
  /** Thickest (darkest) areas, mm. */
  maxMm: number;
  /** Swap the mapping so dark areas become thin instead. */
  invert: boolean;
  /** Max samples along the width; caps triangle count. */
  resolution: number;
}

export const LITHOPHANE_DEFAULTS: LithophaneOptions = {
  widthMm: 100,
  minMm: 0.8,
  maxMm: 2.8,
  invert: false,
  resolution: 220,
};

/** Decodes an image file into raw pixels (main thread only). */
export async function fileToImageData(file: File): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Kunne ikke lese bildet.');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/** Box-averaged luminance grid (0..1), ny rows by nx columns, row 0 at the
 *  image top. Transparent pixels count as white (thin). */
function luminanceGrid(image: ImageData, nx: number, ny: number): Float32Array {
  const grid = new Float32Array(nx * ny);
  const { width, height, data } = image;
  for (let j = 0; j < ny; j++) {
    const y0 = Math.floor((j * height) / ny);
    const y1 = Math.max(y0 + 1, Math.floor(((j + 1) * height) / ny));
    for (let i = 0; i < nx; i++) {
      const x0 = Math.floor((i * width) / nx);
      const x1 = Math.max(x0 + 1, Math.floor(((i + 1) * width) / nx));
      let sum = 0;
      let count = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const p = (y * width + x) * 4;
          const alpha = data[p + 3] / 255;
          const lum =
            (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]) / 255;
          sum += lum * alpha + (1 - alpha); // transparent -> white
          count++;
        }
      }
      grid[j * nx + i] = sum / count;
    }
  }
  return grid;
}

/**
 * Builds a closed, printable relief plate from an image: flat back at z=0,
 * height field on top (dark = thick, so backlighting reproduces the photo),
 * stitched side walls. Native Z-up, units mm.
 */
export function imageToLithophane(
  image: ImageData,
  options: LithophaneOptions
): THREE.BufferGeometry {
  const { widthMm, minMm, maxMm, invert, resolution } = options;
  if (!(widthMm > 0) || !(minMm > 0) || !(maxMm > minMm)) {
    throw new Error('Ugyldige mål for lithophane (maks må være større enn min).');
  }

  const aspect = image.height / image.width;
  const nx = Math.max(8, Math.min(Math.round(resolution), image.width, 600));
  const ny = Math.max(8, Math.min(Math.round(nx * aspect), 600));
  const heightMm = widthMm * aspect;

  const lum = luminanceGrid(image, nx, ny);
  const thickness = (value: number) =>
    invert ? minMm + value * (maxMm - minMm) : minMm + (1 - value) * (maxMm - minMm);

  // Vertex layout: top grid [0 .. nx*ny), bottom grid [nx*ny .. 2*nx*ny).
  const vertexCount = nx * ny * 2;
  const positions = new Float32Array(vertexCount * 3);
  const bottomOffset = nx * ny;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const x = (i / (nx - 1) - 0.5) * widthMm;
      // Row 0 is the image top; put it at +Y so the picture is upright.
      const y = (0.5 - j / (ny - 1)) * heightMm;
      const top = (j * nx + i) * 3;
      positions[top] = x;
      positions[top + 1] = y;
      positions[top + 2] = thickness(lum[j * nx + i]);
      const bottom = (bottomOffset + j * nx + i) * 3;
      positions[bottom] = x;
      positions[bottom + 1] = y;
      positions[bottom + 2] = 0;
    }
  }

  const indices: number[] = [];
  const quad = (a: number, b: number, c: number, d: number) => {
    // Two triangles for the quad a-b-c-d (in CCW order as seen from outside).
    indices.push(a, b, c, a, c, d);
  };

  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const v00 = j * nx + i;
      const v10 = j * nx + i + 1;
      const v01 = (j + 1) * nx + i;
      const v11 = (j + 1) * nx + i + 1;
      // Grid Y decreases with j, so CCW seen from +Z runs v00 -> v01 -> v11 -> v10.
      quad(v00, v01, v11, v10);
      // Bottom surface: -Z outward (reverse order).
      quad(bottomOffset + v00, bottomOffset + v10, bottomOffset + v11, bottomOffset + v01);
    }
  }

  // Side walls along the four boundaries.
  for (let i = 0; i < nx - 1; i++) {
    const top0 = i;
    const top1 = i + 1;
    quad(top0, top1, bottomOffset + top1, bottomOffset + top0); // +Y edge (j=0)
    const bot0 = (ny - 1) * nx + i;
    const bot1 = (ny - 1) * nx + i + 1;
    quad(bot0, bottomOffset + bot0, bottomOffset + bot1, bot1); // -Y edge
  }
  for (let j = 0; j < ny - 1; j++) {
    const left0 = j * nx;
    const left1 = (j + 1) * nx;
    quad(left0, bottomOffset + left0, bottomOffset + left1, left1); // -X edge
    const right0 = j * nx + nx - 1;
    const right1 = (j + 1) * nx + nx - 1;
    quad(right0, right1, bottomOffset + right1, bottomOffset + right0); // +X edge
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
