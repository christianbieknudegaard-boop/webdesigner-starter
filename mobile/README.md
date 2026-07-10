# Bokfink – mobilapp

React Native-app (Expo) for Bokfink. Bruker samme API som nettsiden.

## Kom i gang

1. Installer avhengigheter:

   ```bash
   cd mobile
   npm install
   ```

2. Start nettsiden (API-et) fra rotmappen i et annet terminalvindu:

   ```bash
   npm run dev
   ```

3. Sett API-adressen til maskinens lokale IP (telefonen kan ikke nå
   `localhost` på maskinen din):

   ```bash
   EXPO_PUBLIC_API_URL=http://<din-lokale-ip>:3000 npm start
   ```

4. Skann QR-koden med [Expo Go](https://expo.dev/go) på telefonen.

## Struktur

- `App.tsx` – fanenavigasjon (Hjem, Selg, Min side)
- `src/screens/` – skjermene
- `src/api.ts` – API-klient og delte typer
- `src/theme.ts` – fargepalett (speiler nettsiden)
