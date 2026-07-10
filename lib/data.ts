import {
  Category,
  Listing,
  ListingWithSeller,
  Seller,
} from "@/types/marketplace";

export const SELLERS: Seller[] = [
  {
    id: "s1",
    name: "Ingrid H.",
    city: "Oslo",
    rating: 4.9,
    salesCount: 128,
    memberSince: "2023-02-14",
  },
  {
    id: "s2",
    name: "Magnus L.",
    city: "Bergen",
    rating: 4.7,
    salesCount: 54,
    memberSince: "2024-06-01",
  },
  {
    id: "s3",
    name: "Sofie K.",
    city: "Trondheim",
    rating: 5.0,
    salesCount: 211,
    memberSince: "2022-09-30",
  },
  {
    id: "s4",
    name: "Even R.",
    city: "Stavanger",
    rating: 4.5,
    salesCount: 33,
    memberSince: "2025-01-12",
  },
];

export const LISTINGS: Listing[] = [
  {
    id: "b1",
    title: "Halvbroren",
    author: "Lars Saabye Christensen",
    isbn: "9788202433666",
    category: "skjonnlitteratur",
    condition: "veldig-god",
    price: 89,
    originalPrice: 249,
    description:
      "Praktutgave i pocket, lest én gang. Ingen brettede sider eller notater. Sendes godt innpakket.",
    coverColor: "#2f5d50",
    sellerId: "s1",
    createdAt: "2026-07-01",
    sold: false,
  },
  {
    id: "b2",
    title: "Kniv",
    author: "Jo Nesbø",
    isbn: "9788203373114",
    category: "krim",
    condition: "god",
    price: 65,
    originalPrice: 199,
    description:
      "Harry Hole på sitt beste. Noe slitasje på ryggen, ellers fin. Røykfritt hjem.",
    coverColor: "#7a3b3b",
    sellerId: "s2",
    createdAt: "2026-07-03",
    sold: false,
  },
  {
    id: "b3",
    title: "Ringenes herre – Ringens brorskap",
    author: "J.R.R. Tolkien",
    isbn: "9788210053559",
    category: "fantasy",
    condition: "slitt",
    price: 49,
    originalPrice: 299,
    description:
      "Godt lest klassiker med sjel. Gulnede sider, men helt komplett og godt limt.",
    coverColor: "#5b4a2f",
    sellerId: "s3",
    createdAt: "2026-06-20",
    sold: false,
  },
  {
    id: "b4",
    title: "Snømannen",
    author: "Jo Nesbø",
    isbn: "9788203192920",
    category: "krim",
    condition: "som-ny",
    price: 79,
    originalPrice: 199,
    description: "Helt ubrukt, fikk to i gave. Kan hentes i Trondheim sentrum.",
    coverColor: "#3d5a80",
    sellerId: "s3",
    createdAt: "2026-07-07",
    sold: false,
  },
  {
    id: "b5",
    title: "Anatomi og fysiologi – arbeidsbok",
    author: "Olav Sand",
    isbn: "9788205426641",
    category: "pensum",
    condition: "veldig-god",
    price: 220,
    originalPrice: 499,
    description:
      "Pensum på sykepleien. Noen få markeringer med gul tusj i kapittel 1–3, ellers ren.",
    coverColor: "#446373",
    sellerId: "s4",
    createdAt: "2026-06-28",
    sold: false,
  },
  {
    id: "b6",
    title: "Sapiens: En kort historie om menneskeheten",
    author: "Yuval Noah Harari",
    isbn: "9788280873781",
    category: "fakta",
    condition: "god",
    price: 99,
    originalPrice: 229,
    description: "Innbundet utgave. Litt bruksspor på omslaget, sidene er fine.",
    coverColor: "#8a6d3b",
    sellerId: "s1",
    createdAt: "2026-07-05",
    sold: false,
  },
  {
    id: "b7",
    title: "Harry Potter og de vises stein",
    author: "J.K. Rowling",
    isbn: "9788202235352",
    category: "barn-og-ungdom",
    condition: "god",
    price: 70,
    originalPrice: 179,
    description:
      "Norsk utgave, perfekt som første Harry Potter-bok. Navnet til forrige eier står på innsiden av permen.",
    coverColor: "#6d3b8a",
    sellerId: "s2",
    createdAt: "2026-07-08",
    sold: false,
  },
  {
    id: "b8",
    title: "Jeg er Zlatan",
    author: "Zlatan Ibrahimović og David Lagercrantz",
    isbn: "9788248911975",
    category: "biografi",
    condition: "veldig-god",
    price: 60,
    originalPrice: 149,
    description: "Lest én gang. Sendes samme dag som bestilling.",
    coverColor: "#374151",
    sellerId: "s4",
    createdAt: "2026-06-15",
    sold: true,
  },
  {
    id: "b9",
    title: "Mikroøkonomi",
    author: "Robert Pindyck og Daniel Rubinfeld",
    isbn: "9781292213316",
    category: "pensum",
    condition: "god",
    price: 350,
    originalPrice: 899,
    description:
      "Pensum på NHH og BI. Engelsk utgave, 9. utgave. Understrekninger i blyant som kan viskes ut.",
    coverColor: "#2d4f6c",
    sellerId: "s1",
    createdAt: "2026-07-09",
    sold: false,
  },
  {
    id: "b10",
    title: "Beartown",
    author: "Fredrik Backman",
    isbn: "9788253040288",
    category: "skjonnlitteratur",
    condition: "som-ny",
    price: 95,
    originalPrice: 249,
    description: "Som ny, plastet omslag. En av de beste bøkene jeg har lest!",
    coverColor: "#1f6f5c",
    sellerId: "s3",
    createdAt: "2026-07-06",
    sold: false,
  },
];

export function getSeller(id: string): Seller | undefined {
  return SELLERS.find((s) => s.id === id);
}

export function withSeller(listing: Listing): ListingWithSeller {
  const seller = getSeller(listing.sellerId);
  if (!seller) throw new Error(`Unknown seller ${listing.sellerId}`);
  return { ...listing, seller };
}

export function getListing(id: string): ListingWithSeller | undefined {
  const listing = LISTINGS.find((l) => l.id === id);
  return listing ? withSeller(listing) : undefined;
}

export interface ListingFilter {
  query?: string;
  category?: Category;
  includeSold?: boolean;
}

export function searchListings(filter: ListingFilter = {}): ListingWithSeller[] {
  const q = filter.query?.trim().toLowerCase();
  return LISTINGS.filter((l) => {
    if (!filter.includeSold && l.sold) return false;
    if (filter.category && l.category !== filter.category) return false;
    if (q) {
      const haystack = `${l.title} ${l.author} ${l.isbn}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(withSeller);
}
