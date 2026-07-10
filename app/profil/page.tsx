import ListingCard from "@/components/ListingCard";
import { SELLERS, searchListings } from "@/lib/data";

export const metadata = {
  title: "Min side",
};

// Prototype: viser en fast demo-bruker til innlogging er på plass.
const DEMO_SELLER_ID = "s1";

export default function ProfilePage() {
  const seller = SELLERS.find((s) => s.id === DEMO_SELLER_ID)!;
  const all = searchListings({ includeSold: true }).filter(
    (l) => l.sellerId === seller.id
  );
  const active = all.filter((l) => !l.sold);
  const sold = all.filter((l) => l.sold);
  const earned = sold.reduce((sum, l) => sum + l.price, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">
          {seller.name[0]}
        </span>
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">{seller.name}</h1>
          <p className="text-muted">
            {seller.city} · medlem siden{" "}
            {new Date(seller.memberSince).getFullYear()}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Vurdering</p>
          <p className="mt-1 text-2xl font-bold text-brand-dark">
            ⭐ {seller.rating.toFixed(1)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Fullførte salg</p>
          <p className="mt-1 text-2xl font-bold text-brand-dark">
            {seller.salesCount}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Tjent på Bokfink (demo)</p>
          <p className="mt-1 text-2xl font-bold text-brand-dark">{earned} kr</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-brand-dark">
          Aktive annonser ({active.length})
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {active.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
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

      <p className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-5 text-sm text-muted">
        🔒 Dette er en demoprofil. Innlogging med Vipps/e-post, meldinger
        mellom kjøper og selger, og utbetalinger kommer i neste versjon.
      </p>
    </div>
  );
}
