import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

/**
 * Bildelagring: filer legges i uploads/ (utenfor public/, gitignorert) og
 * serveres via GET /api/bilder/[navn]. Fungerer i dev og på egen server;
 * på serverless (Vercel) byttes dette laget ut med Vercel Blob/S3.
 */

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Lagrer et bilde og returnerer URL-en det serveres på. */
export async function saveImage(
  data: Buffer,
  mimeType: string
): Promise<string> {
  const ext = IMAGE_TYPES[mimeType];
  if (!ext) throw new Error(`Ustøttet bildetype: ${mimeType}`);
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomBytes(16).toString("hex")}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), data);
  return `/api/bilder/${name}`;
}

/** Leser et lagret bilde. Returnerer null hvis det ikke finnes. */
export async function readImage(
  name: string
): Promise<{ data: Buffer; mimeType: string } | null> {
  // Kun filnavn vi selv har generert – stopper path traversal.
  if (!/^[a-f0-9]{32}\.(jpg|png|webp)$/.test(name)) return null;
  try {
    const data = await readFile(path.join(UPLOAD_DIR, name));
    const ext = name.split(".")[1];
    const mimeType =
      Object.entries(IMAGE_TYPES).find(([, e]) => e === ext)?.[0] ??
      "application/octet-stream";
    return { data, mimeType };
  } catch {
    return null;
  }
}
