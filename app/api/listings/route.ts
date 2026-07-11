import { NextRequest, NextResponse } from "next/server";
import { getSellerFromRequest } from "@/lib/auth";
import {
  NewListingInput,
  createListing,
  searchListings,
  validateNewListing,
} from "@/lib/data";
import {
  CATEGORY_LABELS,
  Category,
  PRODUCT_TYPE_LABELS,
  ProductType,
} from "@/types/marketplace";

/**
 * GET /api/listings?q=<søk>&kategori=<kategori>&type=<bok|film>
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
  const rawType = params.get("type");
  const productType =
    rawType && rawType in PRODUCT_TYPE_LABELS
      ? (rawType as ProductType)
      : undefined;

  const listings = await searchListings({ query: q, category, productType });
  return NextResponse.json({ listings });
}

/** POST /api/listings – opprett en annonse (krever innlogging). */
export async function POST(request: NextRequest) {
  const seller = await getSellerFromRequest(request);
  if (!seller) {
    return NextResponse.json(
      { error: "Du må være innlogget for å legge ut en annonse" },
      { status: 401 }
    );
  }

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

  const listing = await createListing(body as NewListingInput, seller.id);
  return NextResponse.json({ listing }, { status: 201 });
}
