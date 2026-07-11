import { NextRequest, NextResponse } from "next/server";
import { getSellerFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  OrderError,
  acceptCancellation,
  requestCancellation,
} from "@/lib/orders";

/**
 * POST /api/orders/:id/kansellering – rollebasert:
 *  - kjøperen sender en kanselleringsforespørsel
 *  - selgeren godtar en ventende forespørsel (kansellerer ordren)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const seller = await getSellerFromRequest(request);
  if (!seller) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { listing: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Fant ikke ordren" }, { status: 404 });
  }

  try {
    if (order.buyerId === seller.id) {
      const updated = await requestCancellation(id, seller.id);
      return NextResponse.json({ order: updated });
    }
    if (order.listing.sellerId === seller.id) {
      const updated = await acceptCancellation(id, seller.id);
      return NextResponse.json({ order: updated });
    }
    return NextResponse.json(
      { error: "Du er ikke part i denne ordren" },
      { status: 403 }
    );
  } catch (e) {
    if (e instanceof OrderError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
