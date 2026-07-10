import { NextRequest, NextResponse } from "next/server";
import { getSellerFromRequest } from "@/lib/auth";
import {
  MessageError,
  getConversation,
  sendMessage,
} from "@/lib/messages";

/** GET /api/meldinger/:id – samtale med meldinger (markerer som lest). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const seller = await getSellerFromRequest(request);
  if (!seller) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const conversation = await getConversation(id, seller.id);
    return NextResponse.json({ conversation });
  } catch (e) {
    if (e instanceof MessageError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}

/** POST /api/meldinger/:id { body } – svar i samtalen. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const seller = await getSellerFromRequest(request);
  if (!seller) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }
  const { id } = await params;

  let body: { body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  try {
    const message = await sendMessage(id, seller.id, body.body);
    return NextResponse.json({ message }, { status: 201 });
  } catch (e) {
    if (e instanceof MessageError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
