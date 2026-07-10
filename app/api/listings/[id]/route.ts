import { NextRequest, NextResponse } from "next/server";
import { getSellerFromRequest } from "@/lib/auth";
import {
  ListingError,
  ListingUpdate,
  deleteListing,
  getListing,
  updateListing,
} from "@/lib/data";

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

/** PATCH /api/listings/:id – rediger egen usolgt annonse. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const seller = await getSellerFromRequest(request);
  if (!seller) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }
  const { id } = await params;

  let body: ListingUpdate;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  try {
    const listing = await updateListing(id, seller.id, body);
    return NextResponse.json({ listing });
  } catch (e) {
    if (e instanceof ListingError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}

/** DELETE /api/listings/:id – slett egen usolgt annonse. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const seller = await getSellerFromRequest(request);
  if (!seller) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }
  const { id } = await params;

  try {
    await deleteListing(id, seller.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ListingError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
