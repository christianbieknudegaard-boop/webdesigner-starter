import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

/**
 * Bildelagring med to drivere:
 *  - Vercel Blob når BLOB_READ_WRITE_TOKEN er satt (produksjon på Vercel)
 *  - lokal disk (uploads/, servert via GET /api/bilder/[navn]) ellers
 */

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

function blobEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

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
  const name = `${randomBytes(16).toString("hex")}.${ext}`;

  if (blobEnabled()) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`bokfink/${name}`, data, {
      access: "public",
      contentType: mimeType,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
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
