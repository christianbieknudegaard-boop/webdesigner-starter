import Link from "next/link";
import { notFound } from "next/navigation";
import BookCover from "@/components/BookCover";
import ListingCard from "@/components/ListingCard";
import { getListing, searchListings } from "@/lib/data";
import { CATEGORY_LABELS, CONDITION_LABELS } from "@/types/marketplace";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = getListing(id);
  if (!listing) notFound();

  const savings =
    listing.originalPrice != null
      ? Math.round((1 - listing.price / listing.originalPrice) * 100)
      : null;
  const related = searchListings({ category: listing.category })
    .filter((l) => l.id !== listing.id)
    .slice(0, 4);

  return (
    <div>
      <nav className="text-sm text-muted">
        <Link href="/boker" className="hover:text-brand-dark">
          Finn bøker
        </Link>{" "}
        / {CATEGORY_LABELS[listing.category]}
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr_320px]">
        <BookCover
          title={listing.title}
          author={listing.author}
          color={listing.coverColor}
          className="mx-auto w-56 lg:w-full"
        />

        <div>
          <h1 className="text-3xl font-bold text-brand-dark">{listing.title}</h1>
          <p className="mt-1 text-lg text-muted">{listing.author}</p>

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-brand-light px-3 py-1 font-medium text-brand-dark">
              {CONDITION_LABELS[listing.condition]}
            </span>
            <span className="rounded-full border border-border bg-surface px-3 py-1">
              {CATEGORY_LABELS[listing.category]}
            </span>
            <span className="rounded-full border border-border bg-surface px-3 py-1">
              ISBN {listing.isbn}
            </span>
          </div>

          <h2 className="mt-6 font-semibold">Selgers beskrivelse</h2>
          <p className="mt-2 whitespace-pre-line text-foreground/90">
            {listing.description}
          </p>

          <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
            <p className="font-semibold">Om selgeren</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light font-bold text-brand-dark">
                {listing.seller.name[0]}
              </span>
              <div className="text-sm">
                <p className="font-medium">
                  {listing.seller.name} · {listing.seller.city}
                </p>
                <p className="text-muted">
                  ⭐ {listing.seller.rating.toFixed(1)} ·{" "}
                  {listing.seller.salesCount} salg · medlem siden{" "}
                  {new Date(listing.seller.memberSince).getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-surface p-6 lg:sticky lg:top-24">
          {listing.sold && (
            <p className="mb-3 rounded-lg bg-accent/10 px-3 py-2 text-sm font-semibold text-accent">
              Denne boken er solgt
            </p>
          )}
          <p className="text-3xl font-bold text-brand-dark">
            {listing.price} kr
          </p>
          {listing.originalPrice != null && (
            <p className="mt-1 text-sm text-muted">
              Ny pris: <span className="line-through">{listing.originalPrice} kr</span>
              {savings != null && (
                <span className="ml-2 font-semibold text-brand">
                  Du sparer {savings} %
                </span>
              )}
            </p>
          )}
          <button
            disabled={listing.sold}
            className="mt-4 w-full rounded-full bg-accent py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Kjøp nå
          </button>
          <button
            disabled={listing.sold}
            className="mt-2 w-full rounded-full border border-brand py-3 font-semibold text-brand transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-40"
          >
            Gi et bud
          </button>
          <ul className="mt-4 space-y-1 text-xs text-muted">
            <li>✓ Pengene holdes trygt til boken er levert</li>
            <li>✓ Frakt fra 45 kr med sporing</li>
            <li>✓ Angrerett i 24 timer etter mottak</li>
          </ul>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-brand-dark">
            Flere i {CATEGORY_LABELS[listing.category]}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
