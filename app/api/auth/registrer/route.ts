import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  createSession,
  hashPassword,
  publicSeller,
} from "@/lib/auth";

interface Body {
  name?: string;
  city?: string;
  email?: string;
  password?: string;
}

/** POST /api/auth/registrer – opprett konto og logg inn. */
export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  const city = body.city?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!name) return NextResponse.json({ error: "Navn mangler" }, { status: 400 });
  if (!city) return NextResponse.json({ error: "Sted mangler" }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Ugyldig e-postadresse" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Passordet må ha minst 8 tegn" },
      { status: 400 }
    );
  }

  const existing = await prisma.seller.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Det finnes allerede en konto med denne e-postadressen" },
      { status: 409 }
    );
  }

  const seller = await prisma.seller.create({
    data: { name, city, email, passwordHash: hashPassword(password) },
  });
  const session = await createSession(seller.id);

  const res = NextResponse.json(
    { seller: publicSeller(seller), token: session.token },
    { status: 201 }
  );
  res.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: session.expiresAt,
    path: "/",
  });
  return res;
}
