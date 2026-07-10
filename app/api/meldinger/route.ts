import { NextRequest, NextResponse } from "next/server";
import { getSellerFromRequest } from "@/lib/auth";
import {
  MessageError,
  getConversations,
  startConversation,
} from "@/lib/messages";

/** GET /api/meldinger – mine samtaler (krever innlogging). */
export async function GET(request: NextRequest) {
  const seller = await getSellerFromRequest(request);
  if (!seller) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }
  const conversations = await getConversations(seller.id);
  return NextResponse.json({ conversations });
}

/**
 * POST /api/meldinger { listingId, body } – start en samtale om en
 * annonse (eller fortsett en eksisterende) med første melding.
 */
export async function POST(request: NextRequest) {
  const seller = await getSellerFromRequest(request);
  if (!seller) {
    return NextResponse.json(
      { error: "Du må være innlogget for å sende meldinger" },
      { status: 401 }
    );
  }

  let body: { listingId?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }
  if (!body.listingId) {
    return NextResponse.json({ error: "listingId mangler" }, { status: 400 });
  }

  try {
    const conversation = await startConversation(
      body.listingId,
      seller.id,
      body.body
    );
    return NextResponse.json(
      { conversationId: conversation.id },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof MessageError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
