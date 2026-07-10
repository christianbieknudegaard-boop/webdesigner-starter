import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, getSellerFromRequest } from "@/lib/auth";
import { AccountError, deleteAccount } from "@/lib/account";

/** DELETE /api/auth/konto – slett egen konto (GDPR). */
export async function DELETE(request: NextRequest) {
  const seller = await getSellerFromRequest(request);
  if (!seller) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  try {
    await deleteAccount(seller.id);
  } catch (e) {
    if (e instanceof AccountError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
