# 🚀 Sette Bokfink i produksjon

Denne guiden tar deg fra koden i dette repoet til en live nettside med
database, bildelagring og eget domene – og mobilappen i app-butikkene.
Alt unntatt domenet har gratis startnivå.

## 1. Database – Neon (gratis PostgreSQL)

1. Opprett konto på [neon.tech](https://neon.tech) og lag et prosjekt
   (velg region Europa, f.eks. Frankfurt).
2. Kopier **Connection string** (begynner med `postgresql://…`).
3. Lokalt på din maskin: legg den i `.env` som `DATABASE_URL`, og kjør:

   ```bash
   npm install
   npm run db:push    # oppretter tabellene i Neon-databasen
   ```

> **Ikke kjør `npm run db:seed` mot produksjonsdatabasen.** Demodataene
> inneholder testkontoer med kjent passord (`bokfink123`). Seed er kun
> for lokal utvikling.

## 2. Nettsiden – Vercel

1. Opprett konto på [vercel.com](https://vercel.com) med GitHub-kontoen
   din, og velg **Add New → Project → Import** dette repoet.
2. Under **Environment Variables**, legg inn:
   - `DATABASE_URL` = Neon-tilkoblingsstrengen fra steg 1
3. Trykk **Deploy**. Bygget kjører `prisma generate` automatisk
   (postinstall-skriptet), og appen er live på `<prosjekt>.vercel.app`.

## 3. Bildelagring – Vercel Blob

Opplastede bokbilder må ligge i skyen (serverless har ingen varig disk):

1. I Vercel-dashbordet: **Storage → Create → Blob**, koble til prosjektet.
2. Miljøvariabelen `BLOB_READ_WRITE_TOKEN` settes automatisk, og
   `lib/storage.ts` bytter da til Blob av seg selv.
3. Redeploy, og test at bildeopplasting fungerer (se sjekklisten under).

## 4. Domene

1. Kjøp domene (f.eks. `bokfink.no`) hos en norsk registrar som
   [Domeneshop](https://domene.shop).
2. I Vercel: **Settings → Domains → Add**, følg DNS-instruksjonene.
3. HTTPS-sertifikat ordnes automatisk.

## 5. Mobilappen – Expo/EAS

1. Sett produksjons-API-et i `mobile/.env`:

   ```
   EXPO_PUBLIC_API_URL=https://bokfink.no
   ```

2. Opprett konto på [expo.dev](https://expo.dev), og bygg:

   ```bash
   cd mobile
   npm install
   npx eas build --platform all
   ```

3. `npx eas submit` sender byggene til App Store og Google Play.
   Du trenger Apple Developer-konto (999 kr/år) og Google Play-konto
   (engangsbeløp 25 USD).

Tips før app-butikkene: brukere kan installere nettsiden som app med én
gang («Legg til på hjemskjerm») – PWA-manifestet er allerede på plass.

## 6. Sjekkliste etter deploy

- [ ] Forsiden laster og viser bøker
- [ ] Registrer en ekte konto (via `/registrer`)
- [ ] Legg ut en bok **med bilde** – bildet skal vises i oversikten
      (verifiserer at Vercel Blob er riktig koblet)
- [ ] Kjøp en bok med en annen konto, merk som sendt/mottatt
- [ ] Åpne siden på mobil og «Legg til på hjemskjerm»

## Kjente begrensninger før ekte lansering

- **Betaling**: kjøp reserverer boken, men ingen penger flyttes.
  Krever Stripe-konto eller Vipps-avtale – kobles på i kjøpsflyten.
- **E-postverifisering / glemt passord** mangler.
- **Rate-limiting** på API-et mangler (vurder Vercel WAF eller
  `@upstash/ratelimit`).
- **Personvern**: før lansering trengs personvernerklæring og
  brukervilkår (GDPR).
