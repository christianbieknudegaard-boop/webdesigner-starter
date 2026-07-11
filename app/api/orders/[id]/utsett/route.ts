import { NextRequest, NextResponse } from "next/server";
import { getSellerFromRequest } from "@/lib/auth";
import { OrderError, extendDeadline } from "@/lib/orders";

/** POST /api/orders/:id/utsett – selgeren utsetter sendefristen (én gang). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const seller = await getSellerFromRequest(request);
  if (!seller) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const order = await extendDeadline(id, seller.id);
    return NextResponse.json({ order });
  } catch (e) {
    if (e instanceof OrderError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
