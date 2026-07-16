import {
  CombineIcon,
  CutIcon,
  EngraveIcon,
  LithophaneIcon,
  MoldIcon,
  OptimizeIcon,
  OverhangIcon,
  RepairIcon,
  RulerIcon,
  ShellIcon,
  ThicknessIcon,
  VectorIcon,
} from './icons';

const TOOLS = [
  {
    icon: RulerIcon,
    title: 'Måling og skalering',
    description: 'Mål avstander direkte på modellen og skaler til nøyaktig ønsket størrelse i mm eller tommer.',
  },
  {
    icon: ShellIcon,
    title: 'Hul-gjøring (shell)',
    description: 'Gjør en solid modell hul med valgfri veggtykkelse for å spare filament eller harpiks.',
  },
  {
    icon: RepairIcon,
    title: 'Mesh-reparasjon',
    description: 'Finn og tett hull i modellen automatisk, og få varsel om ikke-manifold kanter.',
  },
  {
    icon: OptimizeIcon,
    title: 'Optimalisering',
    description: 'Forenkle tunge AI-genererte modeller, fjern løse fragmenter og glatt ut overflater.',
  },
  {
    icon: MoldIcon,
    title: 'Mold-generator',
    description: 'Automatisk todelt støpeform med hellekanal, styrelåser, strikk-spor og A/B-merking.',
  },
  {
    icon: CutIcon,
    title: 'Plan-kutt',
    description: 'Del modellen i to langs et plan for å printe store modeller i deler.',
  },
  {
    icon: EngraveIcon,
    title: 'Gravering',
    description: 'Gravér eller preg tekst på modellen – navn, delenummer eller merking.',
  },
  {
    icon: ThicknessIcon,
    title: 'Veggtykkelse',
    description: 'Fargekart som avslører områder som er for tynne for print eller støp.',
  },
  {
    icon: CombineIcon,
    title: 'Kombiner modeller',
    description: 'Slå sammen to modeller, trekk den ene fra den andre, eller behold bare overlappen.',
  },
  {
    icon: OverhangIcon,
    title: 'Overheng-analyse',
    description: 'Se hvilke flater som trenger printstøtte, og auto-orienter for minst mulig støtte.',
  },
  {
    icon: LithophaneIcon,
    title: 'Foto til lithophane',
    description: 'Last opp et bilde og få en printbar relieffplate som viser motivet med lys bak.',
  },
  {
    icon: VectorIcon,
    title: 'SVG til 3D',
    description: 'Ekstruder en logo eller et ikon fra SVG til en solid modell med valgfri høyde.',
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
        Alle verktøyene kjører direkte i nettleseren – modellen din lastes aldri opp til
        noen server.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TOOLS.map((tool, index) => (
          <div key={tool.title} className="tcard p-5">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 text-slate-300">
                <tool.icon className="h-5 w-5" />
              </span>
              <span className="font-mono text-[10px] text-slate-600">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <h3 className="tlabel mt-3">{tool.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{tool.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
