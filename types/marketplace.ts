export type BookCondition = "som-ny" | "veldig-god" | "god" | "slitt";

export const CONDITION_LABELS: Record<BookCondition, string> = {
  "som-ny": "Som ny",
  "veldig-god": "Veldig god",
  god: "God",
  slitt: "Slitt",
};

export type Category =
  | "skjonnlitteratur"
  | "krim"
  | "fantasy"
  | "barn-og-ungdom"
  | "pensum"
  | "fakta"
  | "biografi";

export const CATEGORY_LABELS: Record<Category, string> = {
  skjonnlitteratur: "Skjønnlitteratur",
  krim: "Krim og spenning",
  fantasy: "Fantasy og sci-fi",
  "barn-og-ungdom": "Barn og ungdom",
  pensum: "Pensum og studiebøker",
  fakta: "Fakta og dokumentar",
  biografi: "Biografier",
};

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
  title: string;
  author: string;
  isbn: string;
  category: Category;
  condition: BookCondition;
  price: number; // NOK
  originalPrice?: number; // new price in store, NOK
  description: string;
  coverColor: string; // placeholder cover background
  sellerId: string;
  createdAt: string; // ISO date
  sold: boolean;
}

export interface ListingWithSeller extends Listing {
  seller: Seller;
}
