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
- 👤 Min side med aktive annonser, solgte bøker og statistikk
- 🔌 REST-API (`/api/listings`) som mobilappen bruker
- 📱 Mobilapp med Hjem (søk/liste), Selg og Min side

> Dette er en prototype med demodata i `lib/data.ts`. Neste steg er ekte
> database, innlogging (Vipps/e-post), betaling og bildeopplasting – se
> veikartet nederst.

## Kom i gang – nettsiden

```bash
npm install
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000).

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
  api/listings/ REST-API (brukes av web og mobil)
components/     Delte UI-komponenter
lib/data.ts     Demodata og søkelogikk
types/          Delte TypeScript-typer
mobile/         Expo-appen
```

## Veikart

1. **Database** – bytt ut `lib/data.ts` med Postgres (f.eks. Supabase/Neon)
2. **Innlogging** – Vipps Login og e-post
3. **Betaling** – Vipps/Stripe med pengene i forvaring til levert bok
4. **Frakt** – ferdig frankert etikett via Posten/Helthjem-API
5. **Bilder** – opplasting av ekte bokbilder (erstatter fargeomslagene)
6. **ISBN-oppslag** – autoutfylling av tittel/forfatter fra ISBN
7. **Meldinger** – chat mellom kjøper og selger
8. **App-butikkene** – bygg og publiser Expo-appen via EAS
