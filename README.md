# MeshForge

En nettbasert samling 3D-verktøy for makere og modellbyggere — en åpen erstatning for
verktøy som [MoldBoxer](https://moldboxer.com/) og [Meshcast](https://meshcast.app/).

## 🚀 Funksjoner

- **3D-viewer**: Dra-og-slipp STL-, OBJ-, GLB/GLTF- og PLY-filer (GLB er formatet de fleste AI bilde-til-3D-tjenester leverer)
- **Orientering og justering**: Rotér 90° eller vilkårlige grader, speil, legg største flate ned, auto-orienter for minst printstøtte, strekk/klem per akse, og kutt flat bunn for godt printfeste
- **Volum og vekt**: Volum i cm³ med vektestimat per materiale (PLA/PETG/ABS/resin/silikon/gips)
- **Optimalisering**: Forenkle tunge AI-modeller (meshoptimizer), fjern løse fragmenter, glatt ut overflater
- **Plan-kutt**: Del modellen i to vanntette deler for utskrift i biter
- **Gravering**: Gravér eller preg tekst på valgfri flate
- **Veggtykkelse**: BVH-basert analyse med fargekart over for tynne områder
- **Overheng-analyse**: Fargekart over flater som trenger printstøtte, med justerbar vinkelgrense
- **Kombiner modeller**: Last opp en modell til og slå sammen, trekk fra eller behold skjæringen (CSG), med plassering og skalering av modell B
- **SVG til 3D**: Ekstruder en logo/ikon fra SVG til en solid modell med valgfri bredde og høyde
- **Foto til lithophane**: Gjør et bilde om til en printbar relieffplate (mørkt = tykt, for baklys), med justerbar størrelse, tykkelse og oppløsning
- **Modellinfo**: Dimensjoner, triangel- og punktantall, med mm/tommer-veksling
- **Måling og skalering**: Klikk to punkter for å måle avstand; skriv inn ønsket mål så skaleres modellen proporsjonalt
- **Mesh-reparasjon**: Finner og tetter hull automatisk, varsler om ikke-manifold kanter
- **Hul-gjøring (shell)**: Gjør en solid modell hul med valgfri veggtykkelse, med gjennomsiktig kontrollvisning
- **Mold-generator**: Genererer en todelt, 3D-printbar støpeform rundt modellen (CSG), med hellekanal/trakt, kuleformede styrepinner og strikk-spor for klemming, vist i utsprengt visning med nedlasting per halvdel og silikonestimat. Hellepunktet finnes automatisk med raycasting, så åpne kar (kopper, blomsterpotter) får kanalen over randen i stedet for en blindkanal i kjernen
- **Eksport**: Last ned resultatet (originalt, reparert, hult eller mold-halvdeler) som STL, OBJ eller PLY
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

Appen bygges som en ren statisk eksport (`npm run build` gir en `out/`-mappe) og kan hostes hvor som helst.

### GitHub Pages (automatisk)

Repoet har en workflow (`.github/workflows/deploy.yml`) som bygger og publiserer til GitHub Pages ved hver push. Første gang kan det hende du må aktivere Pages manuelt: gå til **Settings → Pages** i repoet og sett **Source** til **"GitHub Actions"** (workflowen forsøker å aktivere dette selv, men det krever riktige tillatelser).

Siden blir tilgjengelig på:

```
https://<brukernavn>.github.io/<repo-navn>/
```

### Andre alternativer

Statisk eksport betyr at [Vercel](https://vercel.com/new), Netlify, Cloudflare Pages eller en hvilken som helst filserver også fungerer uten ekstra oppsett.
