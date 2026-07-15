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
    icon: '🧊',
    title: 'Mold-generator',
    description: 'Last opp en modell og få en automatisk splittet, 3D-printbar støpeform generert rundt den.',
    status: 'Planlagt',
  },
  {
    icon: '🩹',
    title: 'Mesh-reparasjon',
    description: 'Finn og fiks hull, ikke-manifold kanter og andre feil i STL-filer før videre bruk.',
    status: 'Planlagt',
  },
] as const;

export default function RoadmapSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="text-2xl font-semibold text-slate-100">Verktøy</h2>
      <p className="mt-2 max-w-2xl text-slate-400">
        3D-viseren er fundamentet. Dette er status på verktøyene som gjør dette til en fullverdig
        erstatning for MoldBoxer og Meshcast.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TOOLS.map((tool) => (
          <div
            key={tool.title}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-5"
          >
            <div className="text-2xl">{tool.icon}</div>
            <h3 className="mt-3 text-sm font-semibold text-slate-100">{tool.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{tool.description}</p>
            <span
              className={`mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
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
