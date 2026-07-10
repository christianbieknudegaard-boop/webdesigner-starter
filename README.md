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
- 🔌 REST-API (`/api/listings`) som mobilappen bruker
- 📱 Mobilapp med Hjem (søk/liste), Selg og Min side

> Annonser lagres i en ekte database (Prisma). Lokalt brukes SQLite uten
> noe oppsett; ved lansering bytter du til Postgres (f.eks. Neon eller
> Supabase) ved å endre `provider` i `prisma/schema.prisma` og
> `DATABASE_URL`. Innlogging, betaling og bildeopplasting står i
> veikartet nederst.

## Kom i gang – nettsiden

```bash
npm install
cp .env.example .env   # DATABASE_URL (SQLite lokalt)
npm run db:push        # oppretter databasen
npm run db:seed        # legger inn demodata
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
2. **Betaling** – Vipps/Stripe med pengene i forvaring til levert bok
3. **Frakt** – ferdig frankert etikett via Posten/Helthjem-API
4. **Bilder** – opplasting av ekte bokbilder (erstatter fargeomslagene)
5. **Bokkatalog** – utvid `lib/catalog.ts` til en ekte bokdatabase
   (f.eks. Bokbasen) i stedet for demodata + Google Books
6. **Meldinger** – chat mellom kjøper og selger
7. **App-butikkene** – bygg og publiser Expo-appen via EAS
8. **Produksjonsdatabase** – bytt SQLite til Postgres (Neon/Supabase) ved
   deploy: endre `provider` i `prisma/schema.prisma` og sett `DATABASE_URL`
