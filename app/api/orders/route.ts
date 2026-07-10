import { NextRequest, NextResponse } from "next/server";
import { getSellerFromRequest } from "@/lib/auth";
import {
  OrderError,
  createOrder,
  getPurchases,
  getSales,
} from "@/lib/orders";

/** GET /api/orders – mine kjøp og salg (krever innlogging). */
export async function GET(request: NextRequest) {
  const seller = await getSellerFromRequest(request);
  if (!seller) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }
  const [purchases, sales] = await Promise.all([
    getPurchases(seller.id),
    getSales(seller.id),
  ]);
  return NextResponse.json({ purchases, sales });
}

/** POST /api/orders { listingId } – kjøp en bok (krever innlogging). */
export async function POST(request: NextRequest) {
  const seller = await getSellerFromRequest(request);
  if (!seller) {
    return NextResponse.json(
      { error: "Du må være innlogget for å kjøpe" },
      { status: 401 }
    );
  }

  let body: { listingId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }
  if (!body.listingId) {
    return NextResponse.json({ error: "listingId mangler" }, { status: 400 });
  }

  try {
    const order = await createOrder(body.listingId, seller.id);
    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    if (e instanceof OrderError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
