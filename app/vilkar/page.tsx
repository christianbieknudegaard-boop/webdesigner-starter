export const metadata = {
  title: "Brukervilkår",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold text-brand-dark">Brukervilkår</h1>
      <p className="mt-2 text-sm text-muted">
        Sist oppdatert: juli 2026 · <strong>Utkast</strong> – må
        kvalitetssikres juridisk før lansering.
      </p>

      <section className="mt-8 space-y-6 text-foreground/90">
        <div>
          <h2 className="text-xl font-semibold text-brand-dark">
            1. Om tjenesten
          </h2>
          <p className="mt-2">
            Bokfink er en markedsplass der privatpersoner kjøper og selger
            brukte bøker. Bokfink er formidler – avtalen om kjøp inngås
            mellom kjøper og selger.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-brand-dark">
            2. Konto og ansvar
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Du må være over 18 år, eller ha samtykke fra foresatte.</li>
            <li>Du er ansvarlig for at opplysningene i annonsene dine stemmer.</li>
            <li>
              Det er ikke tillatt å legge ut ulovlig eller opphavsrettslig
              beskyttet materiale (f.eks. piratkopier).
            </li>
            <li>
              Vi kan fjerne annonser og stenge kontoer som bryter vilkårene.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-brand-dark">
            3. Kjøp og salg
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Selger plikter å sende boken i den stand annonsen beskriver,
              innen rimelig tid etter kjøp.
            </li>
            <li>
              Kjøper plikter å oppgi riktig leveringsadresse og bekrefte
              mottak når boken er levert.
            </li>
            <li>
              [Betalings- og gebyrvilkår fylles inn når betalingsløsningen er
              på plass.]
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-brand-dark">
            4. Angrerett og reklamasjon
          </h2>
          <p className="mt-2">
            Ved kjøp mellom privatpersoner gjelder ikke angrerettloven, men
            kjøpsloven gir deg rettigheter hvis boken avviker vesentlig fra
            beskrivelsen. Meld fra til selgeren via meldinger, og kontakt oss
            hvis dere ikke blir enige.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-brand-dark">
            5. Endringer
          </h2>
          <p className="mt-2">
            Vi kan oppdatere vilkårene; vesentlige endringer varsles på
            e-post eller i tjenesten.
          </p>
        </div>
      </section>
    </article>
  );
}
