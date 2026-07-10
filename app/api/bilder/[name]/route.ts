import { NextResponse } from "next/server";
import { readImage } from "@/lib/storage";

/** GET /api/bilder/:name – serverer opplastede bokbilder. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const image = await readImage(name);
  if (!image) {
    return NextResponse.json({ error: "Fant ikke bildet" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
