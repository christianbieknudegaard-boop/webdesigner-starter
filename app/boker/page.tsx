import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import { searchListings } from "@/lib/data";
import { CATEGORY_LABELS, Category } from "@/types/marketplace";

export const metadata = {
  title: "Finn bøker",
};

interface SearchParams {
  q?: string;
  kategori?: string;
}

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, kategori } = await searchParams;
  const category =
    kategori && kategori in CATEGORY_LABELS ? (kategori as Category) : undefined;
  const listings = searchListings({ query: q, category });

  return (
    <div>
      <h1 className="text-3xl font-bold text-brand-dark">Finn bøker</h1>

      <form action="/boker" className="mt-6 flex max-w-xl gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Søk på tittel, forfatter eller ISBN …"
          className="w-full rounded-full border border-border bg-surface px-5 py-3 outline-none placeholder:text-muted focus:border-brand"
        />
        {category && <input type="hidden" name="kategori" value={category} />}
        <button
          type="submit"
          className="shrink-0 rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
        >
          Søk
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={q ? `/boker?q=${encodeURIComponent(q)}` : "/boker"}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            !category
              ? "bg-brand text-white"
              : "border border-border bg-surface text-foreground hover:border-brand"
          }`}
        >
          Alle
        </Link>
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
          <Link
            key={cat}
            href={`/boker?kategori=${cat}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              category === cat
                ? "bg-brand text-white"
                : "border border-border bg-surface text-foreground hover:border-brand"
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </Link>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted">
        {listings.length} {listings.length === 1 ? "bok" : "bøker"} til salgs
        {q ? ` for «${q}»` : ""}
        {category ? ` i ${CATEGORY_LABELS[category]}` : ""}
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
