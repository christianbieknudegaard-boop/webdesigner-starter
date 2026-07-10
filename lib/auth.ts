import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { Seller } from "@prisma/client";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "bokfink_session";
const SESSION_DAYS = 30;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export async function createSession(sellerId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { token, sellerId, expiresAt } });
  return { token, expiresAt };
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}

async function getSellerByToken(
  token: string | undefined
): Promise<Seller | null> {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { seller: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { token } });
    return null;
  }
  return session.seller;
}

/** Innlogget bruker i server components (leser sesjonscookien). */
export async function getCurrentSeller(): Promise<Seller | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return getSellerByToken(token);
}

/**
 * Innlogget bruker i API-ruter. Ser først etter Bearer-token
 * (mobilappen), deretter sesjonscookien (nettsiden).
 */
export async function getSellerFromRequest(
  request: NextRequest
): Promise<Seller | null> {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : request.cookies.get(SESSION_COOKIE)?.value;
  return getSellerByToken(token);
}

/** Feltene i Seller som trygt kan sendes til klienten. */
export function publicSeller(seller: Seller) {
  return {
    id: seller.id,
    name: seller.name,
    city: seller.city,
    email: seller.email,
    rating: seller.rating,
    salesCount: seller.salesCount,
    memberSince: seller.memberSince.toISOString(),
  };
}
