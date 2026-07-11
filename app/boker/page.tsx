import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import { searchListings } from "@/lib/data";
import {
  CATEGORIES_BY_TYPE,
  CATEGORY_LABELS,
  Category,
  PRODUCT_TYPE_EMOJI,
  PRODUCT_TYPE_LABELS,
  ProductType,
} from "@/types/marketplace";

export const metadata = {
  title: "Finn bøker, filmer og musikk",
};

interface SearchParams {
  q?: string;
  kategori?: string;
  type?: string;
}

function buildUrl(params: {
  q?: string;
  kategori?: string;
  type?: string;
}): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.kategori) search.set("kategori", params.kategori);
  if (params.type) search.set("type", params.type);
  const qs = search.toString();
  return qs ? `/boker?${qs}` : "/boker";
}

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, kategori, type } = await searchParams;
  const productType =
    type && type in PRODUCT_TYPE_LABELS ? (type as ProductType) : undefined;
  const category =
    kategori && kategori in CATEGORY_LABELS ? (kategori as Category) : undefined;
  const listings = await searchListings({ query: q, category, productType });

  // Kategorichips: for valgt type, ellers alle
  const categories = productType
    ? CATEGORIES_BY_TYPE[productType]
    : CATEGORY_LABELS;

  const chipCls = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition ${
      active
        ? "bg-brand text-white"
        : "border border-border bg-surface text-foreground hover:border-brand"
    }`;

  return (
    <div>
      <h1 className="text-3xl font-bold text-brand-dark">
        Finn bøker, filmer og musikk
      </h1>

      <form action="/boker" className="mt-6 flex max-w-xl gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Søk på tittel, opphav eller strekkode …"
          className="w-full rounded-full border border-border bg-surface px-5 py-3 outline-none placeholder:text-muted focus:border-brand"
        />
        {category && <input type="hidden" name="kategori" value={category} />}
        {productType && <input type="hidden" name="type" value={productType} />}
        <button
          type="submit"
          className="shrink-0 rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
        >
          Søk
        </button>
      </form>

      {/* Produkttype */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={buildUrl({ q })} className={chipCls(!productType)}>
          Alt
        </Link>
        {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map((t) => (
          <Link
            key={t}
            href={buildUrl({ q, type: t })}
            className={chipCls(productType === t)}
          >
            {PRODUCT_TYPE_EMOJI[t]} {PRODUCT_TYPE_LABELS[t]}
          </Link>
        ))}
      </div>

      {/* Kategorier */}
      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          href={buildUrl({ q, type: productType })}
          className={chipCls(!category)}
        >
          Alle
        </Link>
        {Object.keys(categories).map((cat) => (
          <Link
            key={cat}
            href={buildUrl({ q, kategori: cat, type: productType })}
            className={chipCls(category === cat)}
          >
            {categories[cat]}
          </Link>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted">
        {listings.length} {listings.length === 1 ? "annonse" : "annonser"}
        {q ? ` for «${q}»` : ""}
        {category ? ` i ${CATEGORY_LABELS[category]}` : ""}
        {productType ? ` (${PRODUCT_TYPE_LABELS[productType].toLowerCase()})` : ""}
      </p>

      {listings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-surface p-10 text-center">
          <p className="text-lg font-semibold">Ingen treff 😢</p>
          <p className="mt-2 text-sm text-muted">
            Prøv et annet søkeord, eller legg ut en etterlysning når vi lanserer
            ønskelister.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
