"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookCondition,
  CATEGORY_LABELS,
  CONDITION_LABELS,
  Category,
} from "@/types/marketplace";

interface FormState {
  isbn: string;
  title: string;
  author: string;
  category: Category | "";
  condition: BookCondition | "";
  price: string;
  description: string;
}

const EMPTY: FormState = {
  isbn: "",
  title: "",
  author: "",
  category: "",
  condition: "",
  price: "",
  description: "",
};

/** Rough price guidance per condition, until real sales data drives this. */
const PRICE_HINTS: Record<BookCondition, string> = {
  "som-ny": "Bøker som ny selges ofte for 40–60 % av nypris.",
  "veldig-god": "Veldig gode bøker selges ofte for 30–50 % av nypris.",
  god: "Gode bøker selges ofte for 20–40 % av nypris.",
  slitt: "Slitte bøker selges ofte for 10–25 % av nypris.",
};

export default function SellForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.author || !form.category || !form.condition) {
      setError("Fyll inn tittel, forfatter, kategori og tilstand.");
      return;
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Oppgi en gyldig pris i kroner.");
      return;
    }
    setError(null);
    // Prototype: annonsen lagres ikke ennå. Neste steg er POST /api/listings
    // med innlogget bruker og bildeopplasting.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-3 text-xl font-bold text-brand-dark">
          Annonsen din er klar!
        </h2>
        <p className="mt-2 text-muted">
          «{form.title}» av {form.author} legges ut for {form.price} kr. I
          denne prototypen lagres ikke annonsen ennå – innlogging og lagring
          kommer i neste versjon.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => {
              setForm(EMPTY);
              setSubmitted(false);
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

  const inputCls =
    "w-full rounded-xl border border-border bg-surface px-4 py-2.5 outline-none placeholder:text-muted focus:border-brand";

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="isbn">
          ISBN (valgfritt)
        </label>
        <input
          id="isbn"
          className={inputCls}
          placeholder="F.eks. 9788202433666"
          value={form.isbn}
          onChange={(e) => update("isbn", e.target.value)}
          inputMode="numeric"
        />
        <p className="mt-1 text-xs text-muted">
          Med ISBN kan vi fylle inn tittel og forfatter automatisk (kommer
          snart).
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="title">
            Tittel *
          </label>
          <input
            id="title"
            className={inputCls}
            placeholder="Boktittel"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="author">
            Forfatter *
          </label>
          <input
            id="author"
            className={inputCls}
            placeholder="Forfatterens navn"
            value={form.author}
            onChange={(e) => update("author", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="category">
            Kategori *
          </label>
          <select
            id="category"
            className={inputCls}
            value={form.category}
            onChange={(e) => update("category", e.target.value as Category)}
          >
            <option value="">Velg kategori</option>
            {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="condition">
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
        {form.condition && (
          <p className="mt-1 text-xs text-muted">
            💡 {PRICE_HINTS[form.condition]}
          </p>
        )}
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
        className="w-full rounded-full bg-accent py-3 font-semibold text-white transition hover:opacity-90 sm:w-auto sm:px-10"
      >
        Legg ut annonsen
      </button>
    </form>
  );
}
