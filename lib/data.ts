import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  BookCondition,
  CATEGORY_LABELS,
  CONDITION_LABELS,
  Category,
  ListingWithSeller,
} from "@/types/marketplace";

type ListingRow = Prisma.ListingGetPayload<{ include: { seller: true } }>;

function toListing(row: ListingRow): ListingWithSeller {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    isbn: row.isbn,
    category: row.category as Category,
    condition: row.condition as BookCondition,
    price: row.price,
    originalPrice: row.originalPrice ?? undefined,
    description: row.description,
    coverColor: row.coverColor,
    imageUrl: row.imageUrl ?? undefined,
    sellerId: row.sellerId,
    createdAt: row.createdAt.toISOString(),
    sold: row.sold,
    seller: {
      id: row.seller.id,
      name: row.seller.name,
      city: row.seller.city,
      rating: row.seller.rating,
      salesCount: row.seller.salesCount,
      memberSince: row.seller.memberSince.toISOString(),
    },
  };
}

export async function getListing(
  id: string
): Promise<ListingWithSeller | undefined> {
  const row = await prisma.listing.findUnique({
    where: { id },
    include: { seller: true },
  });
  return row ? toListing(row) : undefined;
}

export interface ListingFilter {
  query?: string;
  category?: Category;
  includeSold?: boolean;
  sellerId?: string;
}

export async function searchListings(
  filter: ListingFilter = {}
): Promise<ListingWithSeller[]> {
  const rows = await prisma.listing.findMany({
    where: {
      ...(filter.includeSold ? {} : { sold: false }),
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.sellerId ? { sellerId: filter.sellerId } : {}),
    },
    include: { seller: true },
    orderBy: { createdAt: "desc" },
  });

  // Fritekstfilteret kjøres i JS: SQLite skiller ikke store/små norske
  // bokstaver (æøå) i LIKE, og datasettet er lite.
  const q = filter.query?.trim().toLowerCase();
  const filtered = q
    ? rows.filter((l) =>
        `${l.title} ${l.author} ${l.isbn}`.toLowerCase().includes(q)
      )
    : rows;

  return filtered.map(toListing);
}

/** Omslagsfarger for nye annonser (til ekte bokbilder er på plass). */
const COVER_COLORS = [
  "#2f5d50",
  "#7a3b3b",
  "#3d5a80",
  "#5b4a2f",
  "#446373",
  "#8a6d3b",
  "#6d3b8a",
  "#1f6f5c",
  "#374151",
  "#2d4f6c",
];

export interface NewListingInput {
  title: string;
  author: string;
  isbn?: string;
  category: string;
  condition: string;
  price: number;
  originalPrice?: number;
  description?: string;
  imageUrl?: string;
}

export function validateNewListing(
  input: Partial<NewListingInput>
): string | null {
  if (!input.title?.trim()) return "Tittel mangler";
  if (!input.author?.trim()) return "Forfatter mangler";
  if (!input.category || !(input.category in CATEGORY_LABELS))
    return "Ugyldig kategori";
  if (!input.condition || !(input.condition in CONDITION_LABELS))
    return "Ugyldig tilstand";
  if (
    typeof input.price !== "number" ||
    !Number.isFinite(input.price) ||
    input.price <= 0 ||
    !Number.isInteger(input.price)
  )
    return "Prisen må være et positivt heltall i kroner";
  // Kun bilder lastet opp via vårt eget API godtas (lokal disk eller
  // Vercel Blob).
  const validImage =
    /^\/api\/bilder\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(input.imageUrl ?? "") ||
    /^https:\/\/[a-z0-9.-]+\.public\.blob\.vercel-storage\.com\/bokfink\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(
      input.imageUrl ?? ""
    );
  if (input.imageUrl && !validImage) return "Ugyldig bilde-URL";
  return null;
}

export class ListingError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export interface ListingUpdate {
  price?: number;
  condition?: string;
  description?: string;
}

/** Oppdaterer egen usolgt annonse (pris, tilstand, beskrivelse). */
export async function updateListing(
  id: string,
  sellerId: string,
  update: ListingUpdate
) {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) throw new ListingError("Fant ikke annonsen", 404);
  if (listing.sellerId !== sellerId)
    throw new ListingError("Du kan bare endre dine egne annonser", 403);
  if (listing.sold)
    throw new ListingError("Solgte annonser kan ikke endres", 409);

  const data: ListingUpdate = {};
  if (update.price !== undefined) {
    if (
      typeof update.price !== "number" ||
      !Number.isInteger(update.price) ||
      update.price <= 0
    )
      throw new ListingError("Prisen må være et positivt heltall", 400);
    data.price = update.price;
  }
  if (update.condition !== undefined) {
    if (!(update.condition in CONDITION_LABELS))
      throw new ListingError("Ugyldig tilstand", 400);
    data.condition = update.condition;
  }
  if (update.description !== undefined) {
    if (typeof update.description !== "string")
      throw new ListingError("Ugyldig beskrivelse", 400);
    data.description = update.description.trim();
  }

  const row = await prisma.listing.update({
    where: { id },
    data,
    include: { seller: true },
  });
  return toListing(row);
}

/**
 * Sletter egen usolgt annonse. Tilhørende samtaler (og meldinger via
 * cascade) fjernes i samme transaksjon.
 */
export async function deleteListing(id: string, sellerId: string) {
  await prisma.$transaction(async (tx) => {
    const listing = await tx.listing.findUnique({
      where: { id },
      include: { order: true },
    });
    if (!listing) throw new ListingError("Fant ikke annonsen", 404);
    if (listing.sellerId !== sellerId)
      throw new ListingError("Du kan bare slette dine egne annonser", 403);
    if (listing.sold || listing.order)
      throw new ListingError("Solgte annonser kan ikke slettes", 409);

    await tx.conversation.deleteMany({ where: { listingId: id } });
    await tx.listing.delete({ where: { id } });
  });
}

export async function createListing(
  input: NewListingInput,
  sellerId: string
): Promise<ListingWithSeller> {
  let hash = 0;
  for (const ch of input.title) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const coverColor = COVER_COLORS[Math.abs(hash) % COVER_COLORS.length];

  const row = await prisma.listing.create({
    data: {
      title: input.title.trim(),
      author: input.author.trim(),
      isbn: input.isbn?.trim() ?? "",
      category: input.category,
      condition: input.condition,
      price: input.price,
      originalPrice: input.originalPrice ?? null,
      description: input.description?.trim() ?? "",
      coverColor,
      imageUrl: input.imageUrl ?? null,
      sellerId,
    },
    include: { seller: true },
  });
  return toListing(row);
}
