import { NextRequest, NextResponse } from "next/server";
import { getSellerFromRequest } from "@/lib/auth";
import { OrderError, updateOrderStatus } from "@/lib/orders";

/**
 * PATCH /api/orders/:id { status } – oppdater ordrestatus.
 * Selgeren kan sette "sendt", kjøperen kan sette "levert".
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const seller = await getSellerFromRequest(request);
  if (!seller) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  const { id } = await params;
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }
  if (!body.status) {
    return NextResponse.json({ error: "status mangler" }, { status: 400 });
  }

  try {
    const order = await updateOrderStatus(id, body.status, seller.id);
    return NextResponse.json({ order });
  } catch (e) {
    if (e instanceof OrderError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
