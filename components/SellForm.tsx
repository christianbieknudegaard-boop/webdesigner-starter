"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";
import { CatalogBook, normalizeIsbn } from "@/lib/catalog";
import {
  BookCondition,
  CATEGORIES_BY_TYPE,
  CONDITION_LABELS,
  Category,
  FILM_FORMAT_LABELS,
  FilmFormat,
  PRODUCT_TYPE_LABELS,
  ProductType,
  categoryBelongsTo,
} from "@/types/marketplace";

interface FormState {
  productType: ProductType;
  isbn: string;
  title: string;
  author: string;
  category: Category | "";
  condition: BookCondition | "";
  format: FilmFormat | "";
  price: string;
  description: string;
}

const EMPTY: FormState = {
  productType: "bok",
  isbn: "",
  title: "",
  author: "",
  category: "",
  condition: "",
  format: "",
  price: "",
  description: "",
};

/** Andel av nypris bøker vanligvis selges for, per tilstand. */
const PRICE_RANGES: Record<BookCondition, [number, number]> = {
  "som-ny": [0.4, 0.6],
  "veldig-god": [0.3, 0.5],
  god: [0.2, 0.4],
  slitt: [0.1, 0.25],
};

const PRICE_HINTS: Record<BookCondition, string> = {
  "som-ny": "Bøker som ny selges ofte for 40–60 % av nypris.",
  "veldig-god": "Veldig gode bøker selges ofte for 30–50 % av nypris.",
  god: "Gode bøker selges ofte for 20–40 % av nypris.",
  slitt: "Slitte bøker selges ofte for 10–25 % av nypris.",
};

const inputCls =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 outline-none placeholder:text-muted focus:border-brand";

export default function SellForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [originalPrice, setOriginalPrice] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Boksøk (steg 1)
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<CatalogBook[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [bookChosen, setBookChosen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Tekstsøk med forslag mens man skriver
  useEffect(() => {
    const q = search.trim();
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (q.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/bokdata?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { books: CatalogBook[] };
        setSuggestions(data.books);
      } catch {
        // Avbrutt eller nettverksfeil – ignorer.
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [search]);

  // Lukk forslagslisten ved klikk utenfor
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!searchBoxRef.current?.contains(e.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function applyBook(book: CatalogBook, source: string) {
    setForm((f) => ({
      ...f,
      productType: book.productType ?? "bok",
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      category: book.category ?? f.category,
      format: book.productType === "film" ? f.format : "",
    }));
    setOriginalPrice(book.originalPrice ?? null);
    setBookChosen(true);
    setSuggestions([]);
    setSearch("");
    setLookupMessage(
      source === "google-books"
        ? `Fant «${book.title}» via Google Books. Sjekk at detaljene stemmer.`
        : `Fant «${book.title}» – detaljene er fylt inn for deg.`
    );
  }

  async function lookupIsbn(rawIsbn: string) {
    const isbn = normalizeIsbn(rawIsbn);
    setShowScanner(false);
    setLookupBusy(true);
    setLookupMessage(null);
    try {
      const res = await fetch(`/api/bokdata?isbn=${isbn}`);
      const data = (await res.json()) as {
        book: CatalogBook | null;
        source?: string;
        error?: string;
      };
      if (data.book) {
        applyBook(data.book, data.source ?? "katalog");
      } else {
        update("isbn", isbn);
        setBookChosen(true);
        setLookupMessage(
          data.error ??
            `Fant ingen bok med ISBN ${isbn}. ISBN-et er fylt inn – skriv tittel og forfatter selv.`
        );
      }
    } catch {
      update("isbn", isbn);
      setBookChosen(true);
      setLookupMessage(
        "Oppslaget feilet. ISBN-et er fylt inn – skriv tittel og forfatter selv."
      );
    } finally {
      setLookupBusy(false);
    }
  }

  function handleSearchSubmit() {
    const clean = normalizeIsbn(search);
    if (clean.length === 13 || clean.length === 10) {
      void lookupIsbn(clean);
    }
  }

  // Prisforslag i kroner når vi kjenner nypris og tilstand
  const priceSuggestion =
    originalPrice != null && form.condition
      ? ([
          Math.round((originalPrice * PRICE_RANGES[form.condition][0]) / 5) * 5,
          Math.round((originalPrice * PRICE_RANGES[form.condition][1]) / 5) * 5,
        ] as const)
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.author || !form.category || !form.condition) {
      setError(
        form.productType === "film"
          ? "Fyll inn tittel, regissør, kategori og tilstand."
          : "Fyll inn tittel, forfatter, kategori og tilstand."
      );
      return;
    }
    if (form.productType === "film" && !form.format) {
      setError("Velg format (DVD, Blu-ray eller 4K).");
      return;
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Oppgi en gyldig pris i kroner.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = (await uploadRes.json()) as {
          url?: string;
          error?: string;
        };
        if (!uploadRes.ok || !uploadData.url) {
          setError(uploadData.error ?? "Bildeopplastingen feilet. Prøv igjen.");
          return;
        }
        imageUrl = uploadData.url;
      }

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          productType: form.productType,
          format: form.format || undefined,
          title: form.title,
          author: form.author,
          isbn: form.isbn,
          category: form.category,
          condition: form.condition,
          price: Math.round(price),
          originalPrice: originalPrice ?? undefined,
          description: form.description,
        }),
      });
      const data = (await res.json()) as {
        listing?: { id: string };
        error?: string;
      };
      if (!res.ok || !data.listing) {
        setError(data.error ?? "Noe gikk galt. Prøv igjen.");
        return;
      }
      setCreatedId(data.listing.id);
    } catch {
      setError("Fikk ikke kontakt med serveren. Prøv igjen.");
    } finally {
      setSaving(false);
    }
  }

  if (createdId) {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-3 text-xl font-bold text-brand-dark">
          Annonsen er lagt ut!
        </h2>
        <p className="mt-2 text-muted">
          «{form.title}» av {form.author} er nå til salgs for {form.price} kr
          og synlig i søket.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={`/bok/${createdId}`}
            className="rounded-full bg-accent px-5 py-2.5 font-semibold text-white transition hover:opacity-90"
          >
            Se annonsen
          </Link>
          <button
            onClick={() => {
              setForm(EMPTY);
              setOriginalPrice(null);
              setImageFile(null);
              setImagePreview(null);
              setBookChosen(false);
              setLookupMessage(null);
              setCreatedId(null);
            }}
            className="rounded-full bg-brand px-5 py-2.5 font-semibold text-white transition hover:bg-brand-dark"
          >
            Legg ut en til
          </button>
          <Link
            href="/boker"
            className="rounded-full border border-brand px-5 py-2.5 font-semibold text-brand transition hover:bg-brand-light"
          >
            Se andre bøker
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      {showScanner && (
        <BarcodeScannerModal
          onDetected={(isbn) => void lookupIsbn(isbn)}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Produkttype */}
      <div className="flex gap-2">
        {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() =>
              setForm((f) => ({
                ...f,
                productType: t,
                // Nullstill felter som ikke gir mening på tvers av typer
                category: categoryBelongsTo(t, f.category) ? f.category : "",
                format: t === "film" ? f.format : "",
              }))
            }
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              form.productType === t
                ? "bg-brand text-white"
                : "border border-border bg-surface text-foreground hover:border-brand"
            }`}
          >
            {t === "film" ? "🎬 Film" : "📚 Bok"}
          </button>
        ))}
      </div>

      {/* Steg 1: Finn produktet */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-semibold text-brand-dark">
          1. Finn {form.productType === "film" ? "filmen" : "boken"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Skann strekkoden på baksiden, eller søk på tittel,{" "}
          {form.productType === "film" ? "regissør" : "forfatter"} eller
          strekkode – så fyller vi inn detaljene for deg.
        </p>

        <div className="mt-3 flex gap-2">
          <div ref={searchBoxRef} className="relative w-full">
            <input
              className={inputCls}
              placeholder="Søk på tittel eller strekkode …"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchSubmit();
                }
              }}
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
                {suggestions.map((book) => (
                  <li key={book.isbn}>
                    <button
                      type="button"
                      onClick={() => applyBook(book, "katalog")}
                      className="w-full px-4 py-2.5 text-left transition hover:bg-brand-light"
                    >
                      <span className="block font-medium">
                        {book.productType === "film" ? "🎬 " : ""}
                        {book.title}
                      </span>
                      <span className="block text-sm text-muted">
                        {book.author} · {book.isbn}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="shrink-0 rounded-xl bg-brand px-4 py-2.5 font-semibold text-white transition hover:bg-brand-dark"
          >
            📷 Skann
          </button>
        </div>

        {lookupBusy && (
          <p className="mt-3 text-sm text-muted">Slår opp boken …</p>
        )}
        {lookupMessage && !lookupBusy && (
          <p className="mt-3 rounded-lg bg-brand-light px-4 py-2 text-sm text-brand-dark">
            {lookupMessage}
          </p>
        )}
        {!bookChosen && !lookupBusy && !lookupMessage && (
          <p className="mt-3 text-xs text-muted">
            Fant du ikke {form.productType === "film" ? "filmen" : "boken"}?
            Fyll inn detaljene manuelt under.
          </p>
        )}
      </div>

      {/* Steg 2: Detaljer */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-semibold text-brand-dark">
          2. Om {form.productType === "film" ? "filmen" : "boken"}
        </h2>

        <div className="mt-3 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="title">
              Tittel *
            </label>
            <input
              id="title"
              className={inputCls}
              placeholder={
                form.productType === "film" ? "Filmtittel" : "Boktittel"
              }
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="author">
              {form.productType === "film" ? "Regissør *" : "Forfatter *"}
            </label>
            <input
              id="author"
              className={inputCls}
              placeholder={
                form.productType === "film"
                  ? "Regissørens navn"
                  : "Forfatterens navn"
              }
              value={form.author}
              onChange={(e) => update("author", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="isbn">
              {form.productType === "film"
                ? "Strekkode / EAN (valgfritt)"
                : "ISBN (valgfritt)"}
            </label>
            <input
              id="isbn"
              className={inputCls}
              placeholder="F.eks. 9788202433666"
              value={form.isbn}
              onChange={(e) => update("isbn", e.target.value)}
              inputMode="numeric"
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="category"
            >
              Kategori *
            </label>
            <select
              id="category"
              className={inputCls}
              value={form.category}
              onChange={(e) => update("category", e.target.value as Category)}
            >
              <option value="">Velg kategori</option>
              {Object.entries(CATEGORIES_BY_TYPE[form.productType]).map(
                ([cat, label]) => (
                  <option key={cat} value={cat}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {form.productType === "film" && (
          <div className="mt-5">
            <label className="mb-1 block text-sm font-medium" htmlFor="format">
              Format *
            </label>
            <select
              id="format"
              className={inputCls}
              value={form.format}
              onChange={(e) =>
                update("format", e.target.value as FilmFormat)
              }
            >
              <option value="">Velg format</option>
              {(Object.keys(FILM_FORMAT_LABELS) as FilmFormat[]).map((f) => (
                <option key={f} value={f}>
                  {FILM_FORMAT_LABELS[f]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Steg 3: Tilstand og pris */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-semibold text-brand-dark">3. Tilstand og pris</h2>

        <div className="mt-3 grid gap-5 sm:grid-cols-2">
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="condition"
            >
              Tilstand *
            </label>
            <select
              id="condition"
              className={inputCls}
              value={form.condition}
              onChange={(e) =>
                update("condition", e.target.value as BookCondition)
              }
            >
              <option value="">Velg tilstand</option>
              {(Object.keys(CONDITION_LABELS) as BookCondition[]).map((c) => (
                <option key={c} value={c}>
                  {CONDITION_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="price">
              Pris (kr) *
            </label>
            <input
              id="price"
              className={inputCls}
              placeholder="F.eks. 99"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              inputMode="numeric"
            />
          </div>
        </div>

        {form.condition && (
          <p className="mt-3 text-sm text-muted">
            💡{" "}
            {priceSuggestion
              ? `Nypris er ${originalPrice} kr – vi foreslår ${priceSuggestion[0]}–${priceSuggestion[1]} kr for en bok i denne tilstanden.`
              : PRICE_HINTS[form.condition]}
          </p>
        )}
      </div>

      {/* Steg 4: Bilde */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-semibold text-brand-dark">
          4. Bilde av {form.productType === "film" ? "filmen" : "boken"}{" "}
          (valgfritt)
        </h2>
        <p className="mt-1 text-sm text-muted">
          Annonser med ekte bilde selger raskere. Ta bilde av forsiden i godt
          lys.
        </p>
        <div className="mt-3 flex items-start gap-4">
          <label className="cursor-pointer rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm font-medium text-brand transition hover:border-brand">
            📷 {imageFile ? "Bytt bilde" : "Velg eller ta bilde"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (file && file.size > 5 * 1024 * 1024) {
                  setError("Bildet kan være maks 5 MB.");
                  return;
                }
                setError(null);
                setImageFile(file);
                setImagePreview(file ? URL.createObjectURL(file) : null);
              }}
            />
          </label>
          {imagePreview && (
            <div className="flex items-start gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- lokal objectURL-forhåndsvisning */}
              <img
                src={imagePreview}
                alt="Forhåndsvisning av bokbildet"
                className="h-28 w-20 rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                aria-label="Fjern bildet"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="rounded-full px-2 py-1 text-muted hover:bg-brand-light"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="description">
          Beskrivelse
        </label>
        <textarea
          id="description"
          rows={4}
          className={inputCls}
          placeholder="Fortell om tilstanden: brettede sider, notater, lukt, hvor raskt du sender …"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full bg-accent py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {saving ? "Legger ut …" : "Legg ut annonsen"}
      </button>
    </form>
  );
}
