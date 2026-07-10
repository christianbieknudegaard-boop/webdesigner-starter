import { NextRequest, NextResponse } from "next/server";
import {
  NewListingInput,
  createListing,
  getDemoSeller,
  searchListings,
  validateNewListing,
} from "@/lib/data";
import { CATEGORY_LABELS, Category } from "@/types/marketplace";

/**
 * GET /api/listings?q=<søk>&kategori=<kategori>
 * Brukes av både nettsiden og mobilappen.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q") ?? undefined;
  const rawCategory = params.get("kategori");
  const category =
    rawCategory && rawCategory in CATEGORY_LABELS
      ? (rawCategory as Category)
      : undefined;

  const listings = await searchListings({ query: q, category });
  return NextResponse.json({ listings });
}

/**
 * POST /api/listings – opprett en annonse.
 * Inntil innlogging er på plass eies alle nye annonser av demo-selgeren.
 */
export async function POST(request: NextRequest) {
  let body: Partial<NewListingInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const error = validateNewListing(body);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const seller = await getDemoSeller();
  const listing = await createListing(body as NewListingInput, seller.id);
  return NextResponse.json({ listing }, { status: 201 });
}
