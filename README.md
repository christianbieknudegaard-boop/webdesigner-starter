# MeshForge

En nettbasert samling 3D-verktøy for makere og modellbyggere — en åpen erstatning for
verktøy som [MoldBoxer](https://moldboxer.com/) og [Meshcast](https://meshcast.app/).

## 🚀 Funksjoner

- **3D-viewer**: Dra-og-slipp STL/OBJ-filer og se dem i en flott, interaktiv 3D-scene
- **Modellinfo**: Dimensjoner, triangel- og punktantall, med mm/tommer-veksling
- **Måling og skalering**: Klikk to punkter for å måle avstand; skriv inn ønsket mål så skaleres modellen proporsjonalt
- **Mesh-reparasjon**: Finner og tetter hull automatisk, varsler om ikke-manifold kanter
- **Hul-gjøring (shell)**: Gjør en solid modell hul med valgfri veggtykkelse, med gjennomsiktig kontrollvisning
- **Mold-generator**: Genererer en todelt, 3D-printbar støpeform rundt modellen (CSG), med hellekanal/trakt og kuleformede styrepinner, vist i utsprengt visning med nedlasting per halvdel
- **STL-eksport**: Last ned resultatet (originalt, reparert, hult eller mold-halvdeler) som binær STL
- **Nettbasert**: Alt kjører i nettleseren, ingen installasjon nødvendig

## 🛠️ Teknologi

- **Next.js 16** - React-rammeverk
- **React Three Fiber / drei / three.js** - 3D-rendering
- **TypeScript** - Type-sikkerhet
- **Tailwind CSS** - Styling

## Kom i gang

```bash
npm install
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

## Deploy

Prosjektet er satt opp for enkel deployment til [Vercel](https://vercel.com/new).
