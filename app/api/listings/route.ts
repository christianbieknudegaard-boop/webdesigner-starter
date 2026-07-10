import { NextRequest, NextResponse } from "next/server";
import { searchListings } from "@/lib/data";
import { CATEGORY_LABELS, Category } from "@/types/marketplace";

/**
 * GET /api/listings?q=<søk>&kategori=<kategori>
 * Brukes av både nettsiden og mobilappen.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q") ?? undefined;
  const rawCategory = params.get("kategori");
  const category =
    rawCategory && rawCategory in CATEGORY_LABELS
      ? (rawCategory as Category)
      : undefined;

  const listings = searchListings({ query: q, category });
  return NextResponse.json({ listings });
}
