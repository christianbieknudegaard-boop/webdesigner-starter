import { NextRequest, NextResponse } from "next/server";
import { getSellerFromRequest } from "@/lib/auth";
import { ReportError, reportListing } from "@/lib/reports";

/** POST /api/rapporter { listingId, reason, comment? } – rapporter en annonse. */
export async function POST(request: NextRequest) {
  const seller = await getSellerFromRequest(request);
  if (!seller) {
    return NextResponse.json(
      { error: "Du må være innlogget for å rapportere" },
      { status: 401 }
    );
  }

  let body: { listingId?: string; reason?: string; comment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }
  if (!body.listingId) {
    return NextResponse.json({ error: "listingId mangler" }, { status: 400 });
  }

  try {
    await reportListing(body.listingId, seller.id, body.reason, body.comment);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    if (e instanceof ReportError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
