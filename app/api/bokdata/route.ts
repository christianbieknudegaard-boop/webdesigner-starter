import { NextRequest, NextResponse } from "next/server";
import {
  CatalogBook,
  findByIsbn,
  normalizeIsbn,
  searchCatalog,
} from "@/lib/catalog";
import {
  lookupGoogleBooks,
  lookupMusicBrainz,
  lookupUpcItemDb,
  searchTmdb,
} from "@/lib/lookup";

/**
 * Vareoppslag for selg-flyten (web og mobil):
 *   GET /api/bokdata?isbn=<strekkode>      → { book: CatalogBook | null }
 *   GET /api/bokdata?q=<søk>&type=<type>   → { books: CatalogBook[] }
 *
 * Strekkoder utenfor katalogen slås opp eksternt:
 * ISBN (978/979) → Google Books; andre EAN → MusicBrainz (musikk),
 * deretter UPCitemdb (generelt). Tittelsøk for film utvides med TMDb
 * når TMDB_API_KEY er satt.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const isbn = params.get("isbn");
  const q = params.get("q");
  const type = params.get("type");

  if (isbn) {
    const clean = normalizeIsbn(isbn);
    if (clean.length < 8 || clean.length > 14) {
      return NextResponse.json(
        { error: "Ugyldig strekkode" },
        { status: 400 }
      );
    }

    const local = findByIsbn(clean);
    if (local) {
      return NextResponse.json({
        book: { ...local, productType: local.productType ?? "bok" },
        source: "katalog",
      });
    }

    let external: CatalogBook | null = null;
    let source = "";
    if (/^97[89]\d{10}$/.test(clean)) {
      external = await lookupGoogleBooks(clean);
      source = "google-books";
    } else {
      external = await lookupMusicBrainz(clean);
      source = "musicbrainz";
      if (!external) {
        external = await lookupUpcItemDb(clean);
        source = "upcitemdb";
      }
    }
    return NextResponse.json({ book: external, source });
  }

  if (q) {
    const books = searchCatalog(q);
    // Utvid filmsøk med TMDb når nøkkelen er satt (fyller på til 6 treff)
    if (type === "film" && books.length < 6) {
      const tmdb = await searchTmdb(q);
      const seen = new Set(books.map((b) => b.title.toLowerCase()));
      for (const hit of tmdb) {
        if (books.length >= 6) break;
        if (!seen.has(hit.title.toLowerCase())) books.push(hit);
      }
    }
    return NextResponse.json({ books });
  }

  return NextResponse.json(
    { error: "Oppgi ?isbn= eller ?q=" },
    { status: 400 }
  );
}
