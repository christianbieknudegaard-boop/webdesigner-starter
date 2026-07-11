export type BookCondition = "som-ny" | "veldig-god" | "god" | "slitt";

export const CONDITION_LABELS: Record<BookCondition, string> = {
  "som-ny": "Som ny",
  "veldig-god": "Veldig god",
  god: "God",
  slitt: "Slitt",
};

export type ProductType = "bok" | "film" | "musikk";

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  bok: "Bøker",
  film: "Film",
  musikk: "Musikk",
};

export const PRODUCT_TYPE_EMOJI: Record<ProductType, string> = {
  bok: "📚",
  film: "🎬",
  musikk: "🎵",
};

/** Etikett for opphavsfeltet per produkttype. */
export const AUTHOR_LABELS: Record<ProductType, string> = {
  bok: "Forfatter",
  film: "Regissør",
  musikk: "Artist",
};

export type ItemFormat = "dvd" | "blu-ray" | "4k" | "lp" | "cd";

export const FORMAT_LABELS: Record<ItemFormat, string> = {
  dvd: "DVD",
  "blu-ray": "Blu-ray",
  "4k": "4K Ultra HD",
  lp: "LP (vinyl)",
  cd: "CD",
};

/** Gyldige formater per produkttype (bøker har ikke format). */
export const FORMATS_BY_TYPE: Record<ProductType, ItemFormat[]> = {
  bok: [],
  film: ["dvd", "blu-ray", "4k"],
  musikk: ["lp", "cd"],
};

export const BOOK_CATEGORIES = {
  skjonnlitteratur: "Skjønnlitteratur",
  krim: "Krim og spenning",
  fantasy: "Fantasy og sci-fi",
  "barn-og-ungdom": "Barn og ungdom",
  pensum: "Pensum og studiebøker",
  fakta: "Fakta og dokumentar",
  biografi: "Biografier",
} as const;

export const FILM_CATEGORIES = {
  "film-drama": "Drama",
  "film-komedie": "Komedie",
  "film-action": "Action og eventyr",
  "film-skrekk": "Skrekk og thriller",
  "film-barn": "Barnefilm",
  "film-serier": "TV-serier",
  "film-dokumentar": "Dokumentar",
} as const;

export const MUSIC_CATEGORIES = {
  "musikk-rock": "Rock",
  "musikk-pop": "Pop",
  "musikk-jazz-blues": "Jazz og blues",
  "musikk-klassisk": "Klassisk",
  "musikk-hiphop": "Hiphop og R&B",
  "musikk-elektronisk": "Elektronisk",
  "musikk-norsk": "Norsk musikk",
} as const;

export const CATEGORY_LABELS: Record<string, string> = {
  ...BOOK_CATEGORIES,
  ...FILM_CATEGORIES,
  ...MUSIC_CATEGORIES,
};

export type Category =
  | keyof typeof BOOK_CATEGORIES
  | keyof typeof FILM_CATEGORIES
  | keyof typeof MUSIC_CATEGORIES;

export const CATEGORIES_BY_TYPE: Record<ProductType, Record<string, string>> = {
  bok: BOOK_CATEGORIES,
  film: FILM_CATEGORIES,
  musikk: MUSIC_CATEGORIES,
};

export function categoryBelongsTo(
  type: ProductType,
  category: string
): boolean {
  return category in CATEGORIES_BY_TYPE[type];
}

export interface Seller {
  id: string;
  name: string;
  city: string;
  rating: number; // 0–5
  salesCount: number;
  memberSince: string; // ISO date
}

export interface Listing {
  id: string;
  productType: ProductType;
  title: string;
  /** Forfatter for bøker, regissør for film, artist for musikk. */
  author: string;
  /** ISBN for bøker, EAN for film/musikk – strekkoden på baksiden. */
  isbn: string;
  category: Category;
  condition: BookCondition;
  /** Format for film (dvd/blu-ray/4k) og musikk (lp/cd). */
  format?: ItemFormat;
  price: number; // NOK
  originalPrice?: number; // new price in store, NOK
  description: string;
  coverColor: string; // placeholder cover background
  imageUrl?: string; // uploaded photo; coverColor is the fallback
  sellerId: string;
  createdAt: string; // ISO date
  sold: boolean;
}

export interface ListingWithSeller extends Listing {
  seller: Seller;
}
