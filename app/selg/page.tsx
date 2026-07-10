import Link from "next/link";
import SellForm from "@/components/SellForm";
import { getCurrentSeller } from "@/lib/auth";

export const metadata = {
  title: "Selg en bok",
};

export const dynamic = "force-dynamic";

export default async function SellPage() {
  const seller = await getCurrentSeller();

  if (!seller) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-4xl">🔑</p>
        <h1 className="mt-3 text-3xl font-bold text-brand-dark">
          Logg inn for å selge
        </h1>
        <p className="mt-2 text-muted">
          Du må ha en konto for å legge ut bøker – det tar under ett minutt
          og er helt gratis.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/logg-inn"
            className="rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
          >
            Logg inn
          </Link>
          <Link
            href="/registrer"
            className="rounded-full border border-brand px-6 py-3 font-semibold text-brand transition hover:bg-brand-light"
          >
            Opprett konto
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold text-brand-dark">Selg en bok</h1>
      <p className="mt-2 text-muted">
        Legg ut boken din på under ett minutt. Det er gratis å legge ut – vi
        tar først et lite gebyr når boken er solgt.
      </p>
      <SellForm />
    </div>
  );
}
