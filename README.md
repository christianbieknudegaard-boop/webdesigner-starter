# MeshForge

En nettbasert samling 3D-verktøy for makere og modellbyggere — en åpen erstatning for
verktøy som [MoldBoxer](https://moldboxer.com/) og [Meshcast](https://meshcast.app/).

## 🚀 Funksjoner

- **3D-viewer**: Dra-og-slipp STL/OBJ-filer og se dem i en flott, interaktiv 3D-scene
- **Modellinfo**: Dimensjoner, triangel- og punktantall, med mm/tommer-veksling
- **Nettbasert**: Alt kjører i nettleseren, ingen installasjon nødvendig

## 🧭 På veikartet

- Automatisk mold-generator (splitt en modell i en 3D-printbar støpeform)
- Mesh-reparasjon (hull, ikke-manifold kanter)
- Hul-gjøring / shell-verktøy
- Måling og skalering

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
