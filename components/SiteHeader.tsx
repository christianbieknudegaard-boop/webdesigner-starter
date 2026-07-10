import Link from "next/link";
import Logo from "@/components/Logo";
import { getCurrentSeller } from "@/lib/auth";

export default async function SiteHeader() {
  const seller = await getCurrentSeller();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={36} />
          <span className="text-xl font-bold tracking-tight text-brand-dark">
            Bokfink
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted sm:flex">
          <Link href="/boker" className="hover:text-brand-dark">
            Finn bøker
          </Link>
          <Link href="/selg" className="hover:text-brand-dark">
            Selg bøker
          </Link>
          {seller ? (
            <Link href="/profil" className="hover:text-brand-dark">
              {seller.name.split(" ")[0]}
            </Link>
          ) : (
            <Link href="/logg-inn" className="hover:text-brand-dark">
              Logg inn
            </Link>
          )}
        </nav>

        <Link
          href="/selg"
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Selg en bok
        </Link>
      </div>

      {/* Simple mobile nav */}
      <nav className="flex items-center justify-around border-t border-border py-2 text-sm font-medium text-muted sm:hidden">
        <Link href="/boker">Finn bøker</Link>
        <Link href="/selg">Selg bøker</Link>
        {seller ? (
          <Link href="/profil">Min side</Link>
        ) : (
          <Link href="/logg-inn">Logg inn</Link>
        )}
      </nav>
    </header>
  );
}
