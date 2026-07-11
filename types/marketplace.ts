export type BookCondition = "som-ny" | "veldig-god" | "god" | "slitt";

export const CONDITION_LABELS: Record<BookCondition, string> = {
  "som-ny": "Som ny",
  "veldig-god": "Veldig god",
  god: "God",
  slitt: "Slitt",
};

export type ProductType = "bok" | "film";

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  bok: "Bøker",
  film: "Film",
};

export type FilmFormat = "dvd" | "blu-ray" | "4k";

export const FILM_FORMAT_LABELS: Record<FilmFormat, string> = {
  dvd: "DVD",
  "blu-ray": "Blu-ray",
  "4k": "4K Ultra HD",
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

export const CATEGORY_LABELS: Record<string, string> = {
  ...BOOK_CATEGORIES,
  ...FILM_CATEGORIES,
};

export type Category = keyof typeof BOOK_CATEGORIES | keyof typeof FILM_CATEGORIES;

export const CATEGORIES_BY_TYPE: Record<ProductType, Record<string, string>> = {
  bok: BOOK_CATEGORIES,
  film: FILM_CATEGORIES,
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
  /** Forfatter for bøker, regissør for film. */
  author: string;
  /** ISBN for bøker, EAN for film – strekkoden på baksiden. */
  isbn: string;
  category: Category;
  condition: BookCondition;
  /** Kun for film: dvd, blu-ray eller 4k. */
  format?: FilmFormat;
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
