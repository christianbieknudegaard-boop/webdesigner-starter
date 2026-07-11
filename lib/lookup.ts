import { CatalogBook } from "@/lib/catalog";

/**
 * Eksterne strekkode- og tittel-oppslag, som reserve når varen ikke
 * finnes i vår egen katalog:
 *
 *  - Google Books: ISBN (978/979) → bok. Gratis, ingen nøkkel.
 *  - MusicBrainz: EAN → musikkutgivelse (tittel + artist). Gratis,
 *    ingen nøkkel, krever User-Agent.
 *  - UPCitemdb: EAN → generelt produktnavn (fanger DVD-er m.m.).
 *    Gratisnivå uten nøkkel, 100 oppslag/dag – byttes ved vekst.
 *  - TMDb: tittelsøk for film. Valgfritt, aktiveres med TMDB_API_KEY.
 *
 * Alle feiler stille (null/tom liste) – selgeren fyller inn manuelt.
 */

const TIMEOUT_MS = 4000;
const USER_AGENT = "Bokfink/0.1 (kontakt@bokfink.no)";

export async function lookupGoogleBooks(
  isbn: string
): Promise<CatalogBook | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
      { signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: 86400 } }
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
      productType: "bok",
    };
  } catch {
    return null;
  }
}

export async function lookupMusicBrainz(
  ean: string
): Promise<CatalogBook | null> {
  try {
    const res = await fetch(
      `https://musicbrainz.org/ws/2/release/?query=barcode:${ean}&fmt=json&limit=1`,
      {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      releases?: {
        title?: string;
        "artist-credit"?: { name?: string }[];
      }[];
    };
    const release = data.releases?.[0];
    if (!release?.title) return null;
    return {
      isbn: ean,
      title: release.title,
      author: release["artist-credit"]?.[0]?.name ?? "Ukjent artist",
      productType: "musikk",
    };
  } catch {
    return null;
  }
}

export async function lookupUpcItemDb(
  ean: string
): Promise<CatalogBook | null> {
  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${ean}`,
      { signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: { title?: string }[] };
    const title = data.items?.[0]?.title;
    if (!title) return null;
    // Generelt produktregister – vet ikke type eller opphav.
    return { isbn: ean, title, author: "" };
  } catch {
    return null;
  }
}

/** Tittelsøk for film via TMDb. Tomt resultat uten TMDB_API_KEY. */
export async function searchTmdb(query: string): Promise<CatalogBook[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return [];
  try {
    const url = new URL("https://api.themoviedb.org/3/search/movie");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("query", query);
    url.searchParams.set("language", "nb-NO");
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      results?: { title?: string; release_date?: string }[];
    };
    return (data.results ?? [])
      .filter((m) => m.title)
      .slice(0, 3)
      .map((m) => ({
        isbn: "",
        title: m.release_date
          ? `${m.title} (${m.release_date.slice(0, 4)})`
          : m.title!,
        author: "",
        productType: "film" as const,
      }));
  } catch {
    return [];
  }
}
