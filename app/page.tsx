import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import { searchListings } from "@/lib/data";
import { BOOK_CATEGORIES, FILM_CATEGORIES } from "@/types/marketplace";

const STEPS = [
  {
    emoji: "📷",
    title: "Legg ut boken",
    text: "Skriv inn ISBN eller tittel, velg tilstand og pris. Ferdig på under ett minutt.",
  },
  {
    emoji: "📦",
    title: "Send med ferdig etikett",
    text: "Når boken er solgt får du en ferdig frankert fraktetikett. Lever pakken i nærbutikken.",
  },
  {
    emoji: "💸",
    title: "Få betalt trygt",
    text: "Pengene holdes trygt og utbetales til deg når kjøperen har mottatt boken.",
  },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const latest = (await searchListings()).slice(0, 8);

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="rounded-3xl bg-brand px-6 py-12 text-white sm:px-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
            Gi bøkene og filmene dine et nytt liv
          </h1>
          <p className="mt-4 text-lg text-white/85">
            Kjøp og selg brukte bøker og filmer enkelt og trygt. Spar penger
            på pensum, finn din neste favorittroman eller filmkveldens
            klassiker – og rydd i hylla samtidig.
          </p>
          <form action="/boker" className="mt-8 flex max-w-xl gap-2">
            <input
              type="search"
              name="q"
              placeholder="Søk på tittel, forfatter eller ISBN …"
              className="w-full rounded-full border-0 bg-white px-5 py-3 text-foreground outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-accent px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Søk
            </button>
          </form>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/80">
            <span>✓ Kjøperbeskyttelse</span>
            <span>✓ Ferdig frankert frakt</span>
            <span>✓ Gratis å legge ut</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-2xl font-bold text-brand-dark">Utforsk kategorier</h2>
        <p className="mt-3 text-sm font-semibold text-muted">📚 Bøker</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(BOOK_CATEGORIES).map(([cat, label]) => (
            <Link
              key={cat}
              href={`/boker?kategori=${cat}`}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:border-brand hover:text-brand-dark"
            >
              {label}
            </Link>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-muted">
          🎬 Film og serier{" "}
          <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">
            Nytt!
          </span>
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(FILM_CATEGORIES).map(([cat, label]) => (
            <Link
              key={cat}
              href={`/boker?kategori=${cat}`}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:border-brand hover:text-brand-dark"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* Latest listings */}
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-brand-dark">Nyeste bøker</h2>
          <Link href="/boker" className="text-sm font-medium text-brand hover:underline">
            Se alle →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {latest.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-3xl border border-border bg-surface px-6 py-10 sm:px-12">
        <h2 className="text-2xl font-bold text-brand-dark">Slik fungerer det</h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.title}>
              <span className="text-3xl">{step.emoji}</span>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted">{step.text}</p>
            </div>
          ))}
        </div>
        <Link
          href="/selg"
          className="mt-8 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
        >
          Kom i gang – selg din første bok
        </Link>
      </section>
    </div>
  );
}
