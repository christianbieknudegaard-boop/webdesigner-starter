/**
 * API-klient mot Bokfink-backenden (Next.js-appen i rotmappen).
 *
 * Under utvikling: start nettsiden med `npm run dev` i rotmappen og sett
 * BASE_URL til maskinens lokale IP (ikke localhost – telefonen må nå den).
 */
export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.1:3000";

export type BookCondition = "som-ny" | "veldig-god" | "god" | "slitt";

export const CONDITION_LABELS: Record<BookCondition, string> = {
  "som-ny": "Som ny",
  "veldig-god": "Veldig god",
  god: "God",
  slitt: "Slitt",
};

export interface Seller {
  id: string;
  name: string;
  city: string;
  rating: number;
  salesCount: number;
  memberSince: string;
}

export interface Listing {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  condition: BookCondition;
  price: number;
  originalPrice?: number;
  description: string;
  coverColor: string;
  createdAt: string;
  sold: boolean;
  seller: Seller;
}

export async function fetchListings(query?: string): Promise<Listing[]> {
  const url = new URL("/api/listings", BASE_URL);
  if (query) url.searchParams.set("q", query);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API-feil: ${res.status}`);
  const data = (await res.json()) as { listings: Listing[] };
  return data.listings;
}
