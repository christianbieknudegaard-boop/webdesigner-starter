import { NextRequest, NextResponse } from "next/server";
import { getSellerFromRequest } from "@/lib/auth";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, saveImage } from "@/lib/storage";

/**
 * POST /api/upload – last opp et bokbilde (krever innlogging).
 * Multipart form data med feltet "file". Returnerer { url }.
 */
export async function POST(request: NextRequest) {
  const seller = await getSellerFromRequest(request);
  if (!seller) {
    return NextResponse.json(
      { error: "Du må være innlogget for å laste opp bilder" },
      { status: 401 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Forventet multipart form data" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Feltet «file» mangler" }, { status: 400 });
  }
  if (!(file.type in IMAGE_TYPES)) {
    return NextResponse.json(
      { error: "Bildet må være JPEG, PNG eller WebP" },
      { status: 400 }
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Bildet kan være maks 5 MB" },
      { status: 400 }
    );
  }

  const url = await saveImage(Buffer.from(await file.arrayBuffer()), file.type);
  return NextResponse.json({ url }, { status: 201 });
}
