# 📖 Bokfink

Markedsplass for brukte bøker – en konkurrent til Bookis. Kjøp og selg
pensumbøker, romaner og barnebøker trygt og enkelt.

Prosjektet består av to deler:

| Del | Mappe | Teknologi |
| --- | --- | --- |
| Nettside + API | rotmappen | Next.js 16, TypeScript, Tailwind CSS 4 |
| Mobilapp | `mobile/` | React Native (Expo) |

Nettsiden er også en **PWA** – den kan installeres på mobilen rett fra
nettleseren («Legg til på hjemskjerm»).

## Funksjoner i denne versjonen (MVP)

- 🔍 Søk på tittel, forfatter og ISBN, med kategorifilter
- 📚 Bla i annonser med tilstand, pris og «du sparer»-prosent
- 📄 Annonsedetaljer med selgerinfo, vurdering og relaterte bøker
- 🏷️ «Selg en bok»-flyt med prisveiledning per tilstand
- 📷 Strekkodeskanning (ISBN) og tekstsøk som autoutfyller bokdetaljene
  når du skal selge – med Google Books som reserve for ukjente ISBN
- 👤 Innlogging med e-post og passord – annonser knyttes til kontoen din
  (samme API brukes av mobilappen med Bearer-token)
- 🙋 Min side med aktive annonser, solgte bøker og statistikk
- 🖼️ Bildeopplasting: ta bilde av boken (kamera/galleri på mobil, filvelger
  på nett) – vises i annonsekort og på annonsesiden
- 🛒 Kjøpsflyt: «Kjøp nå» med pris + frakt, boken reserveres og merkes
  solgt; selger merker «sendt», kjøper bekrefter «mottatt» på Min side
  (selve betalingen kobles på når Vipps/Stripe-avtale er klar)
- 🔌 REST-API (`/api/listings`) som mobilappen bruker
- 📱 Mobilapp med Hjem (søk/liste), Selg og Min side

> Annonser lagres i PostgreSQL via Prisma – samme oppsett lokalt og i
> produksjon. **Klar til deploy: se [DEPLOY.md](DEPLOY.md)** for
> steg-for-steg-guide (Neon + Vercel + domene + app-butikkene).

## Kom i gang – nettsiden

Du trenger en PostgreSQL-database: enten lokal Postgres, eller en gratis
database hos [neon.tech](https://neon.tech) (anbefalt – samme database
kan senere brukes i produksjon).

```bash
npm install
cp .env.example .env   # lim inn din DATABASE_URL
npm run db:push        # oppretter tabellene
npm run db:seed        # legger inn demodata (kun lokalt!)
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000).

Demodataene inkluderer fire kontoer du kan logge inn med, f.eks.
`ingrid@example.com` med passordet `bokfink123`.

## Kom i gang – mobilappen

```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://<din-lokale-ip>:3000 npm start
```

Skann QR-koden med [Expo Go](https://expo.dev/go). Se `mobile/README.md`
for detaljer.

## Struktur

```
app/            Sider og API-ruter (Next.js App Router)
  boker/        Søk og bla i bøker
  bok/[id]/     Annonsedetaljer
  selg/         Selg en bok
  profil/       Min side
  api/listings/ REST-API for annonser (brukes av web og mobil)
  api/bokdata/  ISBN-/tekstoppslag i bokkatalogen
components/     Delte UI-komponenter
lib/db.ts       Prisma-klient (databasen)
lib/data.ts     Spørringer og validering
lib/catalog.ts  Bokkatalog for autoutfylling
prisma/         Datamodell og seed-skript
types/          Delte TypeScript-typer
mobile/         Expo-appen
```

## Veikart

1. **Vipps Login** – i tillegg til e-post/passord (krever Vipps-avtale);
   mobilappen bør også lagre sesjonen med expo-secure-store
2. **Betaling** – koble Vipps/Stripe på kjøpsflyten, med pengene i
   forvaring til levert bok
3. **Frakt** – ferdig frankert etikett via Posten/Helthjem-API
4. **Bokkatalog** – utvid `lib/catalog.ts` til en ekte bokdatabase
   (f.eks. Bokbasen) i stedet for demodata + Google Books
5. **Meldinger** – chat mellom kjøper og selger
6. **E-postverifisering og glemt passord**
7. **App-butikkene** – bygg og publiser Expo-appen via EAS
   (se [DEPLOY.md](DEPLOY.md))
