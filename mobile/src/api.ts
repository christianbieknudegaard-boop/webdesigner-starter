/**
 * API-klient mot Bokfink-backenden (Next.js-appen i rotmappen).
 *
 * Under utvikling: start nettsiden med `npm run dev` i rotmappen og sett
 * BASE_URL til maskinens lokale IP (ikke localhost – telefonen må nå den).
 */
export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.1:3000";

// Sesjonstoken holdes i minnet. Neste steg: expo-secure-store slik at
// innloggingen overlever at appen startes på nytt.
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

function authHeaders(): Record<string, string> {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

export type BookCondition = "som-ny" | "veldig-god" | "god" | "slitt";

export const CONDITION_LABELS: Record<BookCondition, string> = {
  "som-ny": "Som ny",
  "veldig-god": "Veldig god",
  god: "God",
  slitt: "Slitt",
};

export const CATEGORY_LABELS: Record<string, string> = {
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
  rating: number;
  salesCount: number;
  memberSince: string;
}

export interface Listing {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  condition: BookCondition;
  price: number;
  originalPrice?: number;
  description: string;
  coverColor: string;
  imageUrl?: string;
  createdAt: string;
  sold: boolean;
  seller: Seller;
}

export async function fetchListings(query?: string): Promise<Listing[]> {
  const url = new URL("/api/listings", BASE_URL);
  if (query) url.searchParams.set("q", query);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API-feil: ${res.status}`);
  const data = (await res.json()) as { listings: Listing[] };
  return data.listings;
}

/** Bok fra katalogen/Google Books, til autoutfylling i selg-flyten. */
export interface CatalogBook {
  isbn: string;
  title: string;
  author: string;
  category?: string;
  originalPrice?: number;
}

/** Slår opp en bok via ISBN (fra strekkode eller tastet inn). */
export async function lookupIsbn(isbn: string): Promise<CatalogBook | null> {
  const url = new URL("/api/bokdata", BASE_URL);
  url.searchParams.set("isbn", isbn);
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = (await res.json()) as { book: CatalogBook | null };
  return data.book;
}

export interface NewListing {
  title: string;
  author: string;
  isbn?: string;
  category: string;
  condition: BookCondition;
  price: number;
  description?: string;
  imageUrl?: string;
}

/**
 * Laster opp et bokbilde fra en lokal fil-URI (expo-image-picker) og
 * returnerer URL-en bildet serveres på.
 */
export async function uploadImage(uri: string): Promise<string> {
  const name = uri.split("/").pop() ?? "bilde.jpg";
  const ext = name.split(".").pop()?.toLowerCase();
  const type =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  const form = new FormData();
  // React Native FormData tar { uri, name, type } for filer.
  form.append("file", { uri, name, type } as unknown as Blob);

  const res = await fetch(new URL("/api/upload", BASE_URL).toString(), {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? `API-feil: ${res.status}`);
  }
  return data.url;
}

/** Oppretter en annonse. Kaster ved valideringsfeil fra serveren. */
export async function createListing(input: NewListing): Promise<Listing> {
  const res = await fetch(new URL("/api/listings", BASE_URL).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { listing?: Listing; error?: string };
  if (!res.ok || !data.listing) {
    throw new Error(data.error ?? `API-feil: ${res.status}`);
  }
  return data.listing;
}

/** Kjøper en bok. Kaster med serverens feilmelding hvis kjøpet avvises. */
export async function buyListing(listingId: string): Promise<void> {
  const res = await fetch(new URL("/api/orders", BASE_URL).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ listingId }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? `API-feil: ${res.status}`);
  }
}

export interface ConversationSummary {
  id: string;
  listingId: string;
  listingTitle: string;
  counterpartName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ThreadMessage {
  id: string;
  body: string;
  mine: boolean;
  senderName: string;
  createdAt: string;
}

export interface ConversationDetail {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingSold: boolean;
  counterpartName: string;
  messages: ThreadMessage[];
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const res = await fetch(new URL("/api/meldinger", BASE_URL).toString(), {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`API-feil: ${res.status}`);
  const data = (await res.json()) as { conversations: ConversationSummary[] };
  return data.conversations;
}

export async function fetchConversation(
  id: string
): Promise<ConversationDetail> {
  const res = await fetch(
    new URL(`/api/meldinger/${id}`, BASE_URL).toString(),
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`API-feil: ${res.status}`);
  const data = (await res.json()) as { conversation: ConversationDetail };
  return data.conversation;
}

export async function sendChatMessage(id: string, body: string) {
  const res = await fetch(
    new URL(`/api/meldinger/${id}`, BASE_URL).toString(),
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ body }),
    }
  );
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? `API-feil: ${res.status}`);
  }
}

/** Starter en samtale om en annonse. Returnerer samtale-ID. */
export async function startChat(
  listingId: string,
  body: string
): Promise<string> {
  const res = await fetch(new URL("/api/meldinger", BASE_URL).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ listingId, body }),
  });
  const data = (await res.json()) as {
    conversationId?: string;
    error?: string;
  };
  if (!res.ok || !data.conversationId) {
    throw new Error(data.error ?? `API-feil: ${res.status}`);
  }
  return data.conversationId;
}

export interface Profile {
  id: string;
  name: string;
  city: string;
  email: string | null;
  rating: number;
  salesCount: number;
  memberSince: string;
}

interface AuthResponse {
  seller?: Profile;
  token?: string;
  error?: string;
}

async function authRequest(
  path: string,
  body: Record<string, string>
): Promise<Profile> {
  const res = await fetch(new URL(path, BASE_URL).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as AuthResponse;
  if (!res.ok || !data.seller || !data.token) {
    throw new Error(data.error ?? `API-feil: ${res.status}`);
  }
  setAuthToken(data.token);
  return data.seller;
}

export function login(email: string, password: string) {
  return authRequest("/api/auth/login", { email, password });
}

export function register(
  name: string,
  city: string,
  email: string,
  password: string
) {
  return authRequest("/api/auth/registrer", { name, city, email, password });
}

export async function logout() {
  try {
    await fetch(new URL("/api/auth/logout", BASE_URL).toString(), {
      method: "POST",
      headers: authHeaders(),
    });
  } finally {
    setAuthToken(null);
  }
}

/** Tekstsøk i bokkatalogen (tittel, forfatter eller ISBN). */
export async function searchCatalog(query: string): Promise<CatalogBook[]> {
  const url = new URL("/api/bokdata", BASE_URL);
  url.searchParams.set("q", query);
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = (await res.json()) as { books: CatalogBook[] };
  return data.books;
}
