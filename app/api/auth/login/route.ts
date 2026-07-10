import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  createSession,
  publicSeller,
  verifyPassword,
} from "@/lib/auth";

/** POST /api/auth/login – logg inn med e-post og passord. */
export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  const seller = email
    ? await prisma.seller.findUnique({ where: { email } })
    : null;
  if (!seller?.passwordHash || !verifyPassword(password, seller.passwordHash)) {
    return NextResponse.json(
      { error: "Feil e-post eller passord" },
      { status: 401 }
    );
  }

  const session = await createSession(seller.id);
  const res = NextResponse.json({
    seller: publicSeller(seller),
    token: session.token,
  });
  res.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: session.expiresAt,
    path: "/",
  });
  return res;
}
