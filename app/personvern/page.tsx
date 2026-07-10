import Link from "next/link";

export const metadata = {
  title: "Personvernerklæring",
};

export default function PrivacyPage() {
  return (
    <article className="prose-custom mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold text-brand-dark">
        Personvernerklæring
      </h1>
      <p className="mt-2 text-sm text-muted">
        Sist oppdatert: juli 2026 · <strong>Utkast</strong> – må
        kvalitetssikres juridisk før lansering.
      </p>

      <section className="mt-8 space-y-6 text-foreground/90">
        <div>
          <h2 className="text-xl font-semibold text-brand-dark">
            1. Hvem er behandlingsansvarlig?
          </h2>
          <p className="mt-2">
            Bokfink [selskapsnavn og organisasjonsnummer fylles inn] er
            ansvarlig for behandlingen av personopplysningene dine på
            bokfink.no og i Bokfink-appen.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-brand-dark">
            2. Hvilke opplysninger samler vi inn?
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Kontoopplysninger:</strong> navn, e-postadresse, sted og
              passord (lagres kryptert med bcrypt).
            </li>
            <li>
              <strong>Annonser:</strong> bøkene du legger ut, med bilder du
              laster opp.
            </li>
            <li>
              <strong>Kjøp og salg:</strong> ordrehistorikk og
              leveringsadresser du oppgir ved kjøp.
            </li>
            <li>
              <strong>Meldinger:</strong> samtaler mellom deg og andre
              brukere.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-brand-dark">
            3. Hva brukes opplysningene til?
          </h2>
          <p className="mt-2">
            Vi bruker opplysningene til å drifte markedsplassen: vise
            annonsene dine, gjennomføre kjøp og salg, la deg kommunisere med
            andre brukere, og gi selgeren leveringsadressen din når du
            kjøper. Vi selger aldri opplysningene dine videre.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-brand-dark">
            4. Hvor lagres opplysningene?
          </h2>
          <p className="mt-2">
            Data lagres i database hos [databaseleverandør, f.eks. Neon] og
            bilder hos [lagringsleverandør, f.eks. Vercel], innenfor EØS
            eller under gyldige overføringsgrunnlag.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-brand-dark">
            5. Dine rettigheter
          </h2>
          <p className="mt-2">
            Du har rett til innsyn, retting og sletting av opplysningene
            dine. Du kan når som helst{" "}
            <Link href="/profil" className="text-brand underline">
              slette kontoen din fra Min side
            </Link>
            : da fjernes annonser og samtaler, og profilen anonymiseres.
            Fullførte kjøp og salg beholdes uten personopplysninger av hensyn
            til motparten. Du kan også klage til Datatilsynet.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-brand-dark">6. Kontakt</h2>
          <p className="mt-2">
            Spørsmål om personvern? Kontakt oss på [e-postadresse fylles
            inn].
          </p>
        </div>
      </section>
    </article>
  );
}
