import { Category, ProductType } from "@/types/marketplace";

/**
 * Katalogen: metadata om kjente bøker og filmer, slått opp via strekkode
 * (ISBN/EAN) eller tekstsøk når noen skal selge. I produksjon erstattes
 * denne av en ekte produktdatabase; ukjente ISBN slås i mellomtiden opp
 * mot Google Books i API-ruten (kun bøker).
 */
export interface CatalogBook {
  isbn: string;
  title: string;
  /** Forfatter for bøker, regissør for film. */
  author: string;
  productType?: ProductType; // udefinert = bok
  category?: Category;
  /** Veiledende nypris i kroner, brukes til prisforslag. */
  originalPrice?: number;
}

export const CATALOG: CatalogBook[] = [
  {
    isbn: "9788202433666",
    title: "Halvbroren",
    author: "Lars Saabye Christensen",
    category: "skjonnlitteratur",
    originalPrice: 249,
  },
  {
    isbn: "9788203373114",
    title: "Kniv",
    author: "Jo Nesbø",
    category: "krim",
    originalPrice: 199,
  },
  {
    isbn: "9788203192920",
    title: "Snømannen",
    author: "Jo Nesbø",
    category: "krim",
    originalPrice: 199,
  },
  {
    isbn: "9788210053559",
    title: "Ringenes herre – Ringens brorskap",
    author: "J.R.R. Tolkien",
    category: "fantasy",
    originalPrice: 299,
  },
  {
    isbn: "9788205426641",
    title: "Anatomi og fysiologi – arbeidsbok",
    author: "Olav Sand",
    category: "pensum",
    originalPrice: 499,
  },
  {
    isbn: "9788280873781",
    title: "Sapiens: En kort historie om menneskeheten",
    author: "Yuval Noah Harari",
    category: "fakta",
    originalPrice: 229,
  },
  {
    isbn: "9788202235352",
    title: "Harry Potter og de vises stein",
    author: "J.K. Rowling",
    category: "barn-og-ungdom",
    originalPrice: 179,
  },
  {
    isbn: "9788248911975",
    title: "Jeg er Zlatan",
    author: "Zlatan Ibrahimović og David Lagercrantz",
    category: "biografi",
    originalPrice: 149,
  },
  {
    isbn: "9781292213316",
    title: "Mikroøkonomi",
    author: "Robert Pindyck og Daniel Rubinfeld",
    category: "pensum",
    originalPrice: 899,
  },
  {
    isbn: "9788253040288",
    title: "Beartown",
    author: "Fredrik Backman",
    category: "skjonnlitteratur",
    originalPrice: 249,
  },
  {
    isbn: "9788203365539",
    title: "Doppler",
    author: "Erlend Loe",
    category: "skjonnlitteratur",
    originalPrice: 199,
  },
  {
    isbn: "9788202562359",
    title: "Skammerens datter",
    author: "Lene Kaaberbøl",
    category: "barn-og-ungdom",
    originalPrice: 199,
  },
  {
    isbn: "9788205518438",
    title: "Statistikk for universiteter og høgskoler",
    author: "Gunnar G. Løvås",
    category: "pensum",
    originalPrice: 619,
  },
  {
    isbn: "9788249521463",
    title: "Atomic Habits",
    author: "James Clear",
    category: "fakta",
    originalPrice: 249,
  },
  // Film (EAN-strekkoder)
  {
    isbn: "7020560910136",
    title: "Flåklypa Grand Prix",
    author: "Ivo Caprino",
    productType: "film",
    category: "film-barn",
    originalPrice: 199,
  },
  {
    isbn: "7340112717322",
    title: "Ringenes herre-trilogien (Extended Edition)",
    author: "Peter Jackson",
    productType: "film",
    category: "film-action",
    originalPrice: 399,
  },
  {
    isbn: "7020560920128",
    title: "Kon-Tiki",
    author: "Joachim Rønning og Espen Sandberg",
    productType: "film",
    category: "film-drama",
    originalPrice: 149,
  },
  {
    isbn: "5051895034125",
    title: "Game of Thrones – sesong 1",
    author: "HBO",
    productType: "film",
    category: "film-serier",
    originalPrice: 299,
  },
];

/** Fjerner bindestreker og mellomrom fra et ISBN. */
export function normalizeIsbn(raw: string): string {
  return raw.replace(/[^0-9Xx]/g, "").toUpperCase();
}

export function findByIsbn(isbn: string): CatalogBook | undefined {
  const clean = normalizeIsbn(isbn);
  return CATALOG.find((b) => b.isbn === clean);
}

export function searchCatalog(query: string, limit = 6): CatalogBook[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return CATALOG.filter((b) =>
    `${b.title} ${b.author} ${b.isbn}`.toLowerCase().includes(q)
  ).slice(0, limit);
}
