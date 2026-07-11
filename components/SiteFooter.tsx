import Link from "next/link";
import Logo from "@/components/Logo";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="flex items-center gap-2 text-lg font-bold text-brand-dark">
            <Logo size={28} /> Bokfink
          </p>
          <p className="mt-2 text-sm text-muted">
            Norges hyggeligste markedsplass for brukte bøker og filmer. Kjøp
            og selg trygt, spar penger og gi tingene et nytt liv.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-foreground">Snarveier</p>
          <ul className="mt-2 space-y-1 text-muted">
            <li>
              <Link href="/boker" className="hover:text-brand-dark">
                Finn bøker
              </Link>
            </li>
            <li>
              <Link href="/selg" className="hover:text-brand-dark">
                Selg en bok
              </Link>
            </li>
            <li>
              <Link href="/profil" className="hover:text-brand-dark">
                Min side
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-foreground">Trygghet</p>
          <ul className="mt-2 space-y-1 text-muted">
            <li>Sikker betaling holdes til boken er levert</li>
            <li>Ferdig frankert fraktetikett</li>
            <li>Kjøperbeskyttelse på alle kjøp</li>
            <li>
              <Link href="/personvern" className="hover:text-brand-dark">
                Personvernerklæring
              </Link>
            </li>
            <li>
              <Link href="/vilkar" className="hover:text-brand-dark">
                Brukervilkår
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Bokfink. Laget med kjærlighet for brukte bøker.
      </div>
    </footer>
  );
}
