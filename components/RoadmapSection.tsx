const TOOLS = [
  {
    icon: '📐',
    title: 'Måling og skalering',
    description: 'Mål avstander direkte på modellen og skaler til nøyaktig ønsket størrelse i mm eller tommer.',
    status: 'Klart',
  },
  {
    icon: '🐚',
    title: 'Hul-gjøring (shell)',
    description: 'Gjør en solid modell hul med valgfri veggtykkelse for å spare filament eller harpiks.',
    status: 'Klart',
  },
  {
    icon: '🩹',
    title: 'Mesh-reparasjon',
    description: 'Finn og tett hull i modellen automatisk, og få varsel om ikke-manifold kanter.',
    status: 'Klart',
  },
  {
    icon: '✨',
    title: 'Optimalisering',
    description: 'Forenkle tunge AI-genererte modeller, fjern løse fragmenter og glatt ut overflater.',
    status: 'Klart',
  },
  {
    icon: '🧊',
    title: 'Mold-generator',
    description: 'Last opp en modell og få en automatisk splittet, 3D-printbar støpeform generert rundt den.',
    status: 'Klart',
  },
] as const;

export default function RoadmapSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <p className="tlabel">
        <span className="tnum">{'//'}</span>Verktøykasse
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-100">
        Alt du trenger fra modell til støpeform
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        3D-viseren er fundamentet. Dette er status på verktøyene som gjør dette til en
        fullverdig erstatning for MoldBoxer og Meshcast.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {TOOLS.map((tool, index) => (
          <div key={tool.title} className="tcard p-5">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{tool.icon}</span>
              <span className="font-mono text-[10px] text-slate-600">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <h3 className="tlabel mt-3">{tool.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{tool.description}</p>
            <span
              className={`mt-3 inline-block rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase ${
                tool.status === 'Klart'
                  ? 'bg-emerald-500/10 text-emerald-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {tool.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
