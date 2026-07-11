import { redirect } from "next/navigation";
import ListingCard from "@/components/ListingCard";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import LogoutButton from "@/components/LogoutButton";
import OrderCard, { OrderView } from "@/components/OrderCard";
import { getCurrentSeller } from "@/lib/auth";
import { searchListings } from "@/lib/data";
import {
  ORDER_STATUS_LABELS,
  OrderStatus,
  getPurchases,
  getSales,
} from "@/lib/orders";

export const metadata = {
  title: "Min side",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const seller = await getCurrentSeller();
  if (!seller) redirect("/logg-inn");

  const [all, purchases, sales] = await Promise.all([
    searchListings({ includeSold: true, sellerId: seller.id }),
    getPurchases(seller.id),
    getSales(seller.id),
  ]);
  const active = all.filter((l) => !l.sold);
  const sold = all.filter((l) => l.sold);
  const earned = sales
    .filter((o) => o.status === "levert")
    .reduce((sum, o) => sum + o.itemPrice, 0);

  const purchaseViews: OrderView[] = purchases.map((o) => ({
    id: o.id,
    listingId: o.listingId,
    title: o.listing.title,
    author: o.listing.author,
    counterpartLabel: `Selger: ${o.listing.seller.name}`,
    status: o.status,
    statusLabel: ORDER_STATUS_LABELS[o.status as OrderStatus] ?? o.status,
    totalPrice: o.itemPrice + o.shippingPrice,
    createdAt: o.createdAt.toISOString(),
    rating: o.rating,
    shipDeadline: o.shipDeadline?.toISOString() ?? null,
    deadlineExtended: o.deadlineExtended,
    cancelRequestedAt: o.cancelRequestedAt?.toISOString() ?? null,
  }));
  const saleViews: OrderView[] = sales.map((o) => ({
    id: o.id,
    listingId: o.listingId,
    title: o.listing.title,
    author: o.listing.author,
    counterpartLabel: `Kjøper: ${o.buyer.name}`,
    status: o.status,
    statusLabel: ORDER_STATUS_LABELS[o.status as OrderStatus] ?? o.status,
    totalPrice: o.itemPrice,
    createdAt: o.createdAt.toISOString(),
    shippingAddress: o.shipStreet
      ? `${o.shipName}, ${o.shipStreet}, ${o.shipPostalCode} ${o.shipCity}`
      : undefined,
    shipDeadline: o.shipDeadline?.toISOString() ?? null,
    deadlineExtended: o.deadlineExtended,
    cancelRequestedAt: o.cancelRequestedAt?.toISOString() ?? null,
  }));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">
            {seller.name[0]}
          </span>
          <div>
            <h1 className="text-3xl font-bold text-brand-dark">
              {seller.name}
            </h1>
            <p className="text-muted">
              {seller.city} · medlem siden{" "}
              {new Date(seller.memberSince).getFullYear()}
            </p>
          </div>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Vurdering</p>
          <p className="mt-1 text-2xl font-bold text-brand-dark">
            {seller.salesCount > 0 ? `⭐ ${seller.rating.toFixed(1)}` : "–"}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Fullførte salg</p>
          <p className="mt-1 text-2xl font-bold text-brand-dark">
            {seller.salesCount}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Tjent på Bokfink</p>
          <p className="mt-1 text-2xl font-bold text-brand-dark">{earned} kr</p>
        </div>
      </div>

      {purchaseViews.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-brand-dark">
            Mine kjøp ({purchaseViews.length})
          </h2>
          <div className="mt-4 space-y-3">
            {purchaseViews.map((o) => (
              <OrderCard key={o.id} order={o} role="buyer" />
            ))}
          </div>
        </section>
      )}

      {saleViews.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-brand-dark">
            Mine salg ({saleViews.length})
          </h2>
          <div className="mt-4 space-y-3">
            {saleViews.map((o) => (
              <OrderCard key={o.id} order={o} role="seller" />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-brand-dark">
          Aktive annonser ({active.length})
        </h2>
        {active.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border bg-surface p-6 text-muted">
            Du har ingen aktive annonser.{" "}
            <a href="/selg" className="font-medium text-brand hover:underline">
              Legg ut din første bok →
            </a>
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {active.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>

      {sold.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-brand-dark">
            Solgte bøker ({sold.length})
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 opacity-60 sm:grid-cols-3 lg:grid-cols-4">
            {sold.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-14 border-t border-border pt-6">
        <DeleteAccountButton />
      </div>
    </div>
  );
}
