import Link from "next/link";
import BookCover from "@/components/BookCover";
import {
  CONDITION_LABELS,
  FORMAT_LABELS,
  ListingWithSeller,
} from "@/types/marketplace";

export default function ListingCard({ listing }: { listing: ListingWithSeller }) {
  return (
    <Link
      href={`/bok/${listing.id}`}
      className="group flex flex-col rounded-2xl border border-border bg-surface p-3 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <BookCover
        title={listing.title}
        author={listing.author}
        color={listing.coverColor}
        imageUrl={listing.imageUrl}
        className="transition group-hover:scale-[1.01]"
      />
      <div className="mt-3 flex flex-1 flex-col">
        <p className="font-semibold leading-snug text-foreground">
          {listing.title}
        </p>
        <p className="text-sm text-muted">
          {listing.author}
          {listing.format ? ` · ${FORMAT_LABELS[listing.format]}` : ""}
        </p>
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <p className="text-lg font-bold text-brand-dark">
              {listing.price} kr
            </p>
            {listing.originalPrice && (
              <p className="text-xs text-muted line-through">
                Ny: {listing.originalPrice} kr
              </p>
            )}
          </div>
          <span className="rounded-full bg-brand-light px-2 py-1 text-xs font-medium text-brand-dark">
            {CONDITION_LABELS[listing.condition]}
          </span>
        </div>
      </div>
    </Link>
  );
}
