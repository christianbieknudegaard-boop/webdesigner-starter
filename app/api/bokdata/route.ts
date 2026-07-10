import { NextRequest, NextResponse } from "next/server";
import {
  CatalogBook,
  findByIsbn,
  normalizeIsbn,
  searchCatalog,
} from "@/lib/catalog";

/**
 * Bokoppslag for selg-flyten (web og mobil):
 *   GET /api/bokdata?isbn=9788203373114  → { book: CatalogBook | null }
 *   GET /api/bokdata?q=nesbø             → { books: CatalogBook[] }
 *
 * Ukjente ISBN slås opp mot Google Books som reserveløsning.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const isbn = params.get("isbn");
  const q = params.get("q");

  if (isbn) {
    const clean = normalizeIsbn(isbn);
    if (clean.length !== 10 && clean.length !== 13) {
      return NextResponse.json(
        { error: "Ugyldig ISBN – må være 10 eller 13 siffer" },
        { status: 400 }
      );
    }
    const local = findByIsbn(clean);
    if (local) return NextResponse.json({ book: local, source: "katalog" });

    const external = await lookupGoogleBooks(clean);
    return NextResponse.json({ book: external, source: "google-books" });
  }

  if (q) {
    return NextResponse.json({ books: searchCatalog(q) });
  }

  return NextResponse.json(
    { error: "Oppgi ?isbn= eller ?q=" },
    { status: 400 }
  );
}

async function lookupGoogleBooks(isbn: string): Promise<CatalogBook | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
      { signal: AbortSignal.timeout(4000), next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      items?: { volumeInfo?: { title?: string; authors?: string[] } }[];
    };
    const info = data.items?.[0]?.volumeInfo;
    if (!info?.title) return null;
    return {
      isbn,
      title: info.title,
      author: info.authors?.join(" og ") ?? "Ukjent forfatter",
    };
  } catch {
    // Nettverksfeil eller timeout – selgeren fyller inn manuelt i stedet.
    return null;
  }
}
