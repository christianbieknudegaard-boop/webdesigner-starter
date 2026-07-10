import { NextResponse } from "next/server";
import { getListing } from "@/lib/data";

/** GET /api/listings/:id – én annonse med selgerinfo. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) {
    return NextResponse.json({ error: "Fant ikke annonsen" }, { status: 404 });
  }
  return NextResponse.json({ listing });
}
