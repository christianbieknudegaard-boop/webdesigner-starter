'use client';

import { useState } from 'react';
import type { MoldOptions, SplitAxis } from '@/lib/moldGenerator';
import type { DemoldAxisReport } from '@/lib/demoldAnalysis';

type Unit = 'mm' | 'in';

interface MoldPanelProps {
  supported: boolean;
  unit: Unit;
  isGenerating: boolean;
  error: string | null;
  hasResult: boolean;
  showMold: boolean;
  siliconeMl: number | null;
  demold: DemoldAxisReport[] | null;
  recommendedAxis: SplitAxis | null;
  onGenerate: (margin: number, axis: SplitAxis, options: Omit<MoldOptions, 'upAxis'>) => void;
  onToggleShowMold: () => void;
  onDownloadHalf: (half: 'A' | 'B') => void;
}

function undercutBadgeClass(fraction: number, selected: boolean): string {
  const tone =
    fraction < 0.005
      ? 'text-emerald-300'
      : fraction < 0.1
        ? 'text-amber-300'
        : 'text-red-400';
  return `${tone} ${selected ? 'font-semibold underline underline-offset-2' : ''}`;
}

export default function MoldPanel({
  supported,
  unit,
  isGenerating,
  error,
  hasResult,
  showMold,
  siliconeMl,
  demold,
  recommendedAxis,
  onGenerate,
  onToggleShowMold,
  onDownloadHalf,
}: MoldPanelProps) {
  const [margin, setMargin] = useState(unit === 'mm' ? 5 : 0.2);
  const [axis, setAxis] = useState<SplitAxis>('z');
  const [pourChannel, setPourChannel] = useState(true);
  const [registrationKeys, setRegistrationKeys] = useState(true);
  const [bandGrooves, setBandGrooves] = useState(true);
  const [prySlots, setPrySlots] = useState(true);

  // Follow the recommendation whenever a new model produces one
  // (state adjusted during render, per React's "you might not need an effect").
  const [lastRecommended, setLastRecommended] = useState<SplitAxis | null>(null);
  if (recommendedAxis !== lastRecommended) {
    setLastRecommended(recommendedAxis);
    if (recommendedAxis) setAxis(recommendedAxis);
  }

  // Convert the entered margin when the unit changes, so "5 mm" doesn't
  // silently become "5 in" (= 127 mm of mold wall).
  const MM_PER_INCH = 25.4;
  const [lastUnit, setLastUnit] = useState(unit);
  if (unit !== lastUnit) {
    setLastUnit(unit);
    if (Number.isFinite(margin)) {
      const converted = unit === 'mm' ? margin * MM_PER_INCH : margin / MM_PER_INCH;
      setMargin(Number(converted.toFixed(unit === 'mm' ? 1 : 3)));
    }
  }

  return (
    <details className="tcard w-full p-4">
      <summary className="tlabel cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
        <span className="tnum">05</span>Mold-generator
      </summary>

      {!supported ? (
        <p className="mt-2 text-xs text-slate-400">
          Støtter foreløpig kun modeller med én sammenhengende del.
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs">
            <label htmlFor="mold-margin" className="text-slate-400">
              Randmargin ({unit})
            </label>
            <input
              id="mold-margin"
              type="number"
              min="0.5"
              step={unit === 'mm' ? 0.5 : 0.02}
              value={margin}
              onChange={(e) => setMargin(parseFloat(e.target.value))}
              className="w-20 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-right text-slate-100"
            />
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 text-xs">
            <label htmlFor="mold-axis" className="text-slate-400">
              Delingsakse
            </label>
            <select
              id="mold-axis"
              value={axis}
              onChange={(e) => setAxis(e.target.value as SplitAxis)}
              className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-slate-100"
            >
              <option value="x">X</option>
              <option value="y">Y</option>
              <option value="z">Z</option>
            </select>
          </div>

          {demold && (
            <div className="mt-2 rounded-md border border-slate-800 bg-slate-950/40 px-2 py-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Avformbarhet</span>
                <span className="flex gap-3">
                  {demold.map((report) => (
                    <span
                      key={report.axis}
                      className={undercutBadgeClass(report.undercutFraction, report.axis === axis)}
                    >
                      {report.axis.toUpperCase()} {Math.round(report.undercutFraction * 100)}%
                    </span>
                  ))}
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-snug text-slate-500">
                Andel av flaten med undercuts per delingsakse. Stive støp (resin/gips) krever
                0 % – silikon tåler moderate undercuts.
              </p>
            </div>
          )}

          <div className="mt-2 space-y-1.5 text-xs">
            <label className="flex items-center gap-2 text-slate-400">
              <input
                type="checkbox"
                checked={pourChannel}
                onChange={() => setPourChannel((prev) => !prev)}
              />
              Hellekanal med trakt
            </label>
            <label className="flex items-center gap-2 text-slate-400">
              <input
                type="checkbox"
                checked={registrationKeys}
                onChange={() => setRegistrationKeys((prev) => !prev)}
              />
              Styrepinner (kulelås)
            </label>
            <label className="flex items-center gap-2 text-slate-400">
              <input
                type="checkbox"
                checked={bandGrooves}
                onChange={() => setBandGrooves((prev) => !prev)}
              />
              Strikk-spor (klemming)
            </label>
            <label className="flex items-center gap-2 text-slate-400">
              <input
                type="checkbox"
                checked={prySlots}
                onChange={() => setPrySlots((prev) => !prev)}
              />
              Vippespor (åpning)
            </label>
          </div>

          <button
            onClick={() =>
              onGenerate(margin, axis, { pourChannel, registrationKeys, bandGrooves, prySlots })
            }
            disabled={isGenerating || !(margin > 0)}
            className="mt-3 w-full rounded-md border border-slate-600 py-1.5 text-xs text-slate-200 hover:border-slate-400 disabled:opacity-50"
          >
            {isGenerating ? 'Genererer…' : 'Generer mold'}
          </button>

          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

          {hasResult && (
            <div className="mt-3 space-y-2 border-t border-slate-800 pt-3">
              {siliconeMl !== null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Silikonbehov</span>
                  <span className="text-slate-200">
                    ~{siliconeMl < 10 ? siliconeMl.toFixed(1) : Math.round(siliconeMl)} ml
                  </span>
                </div>
              )}
              <button
                onClick={onToggleShowMold}
                className="w-full rounded-md border border-slate-600 py-1.5 text-xs text-slate-200 hover:border-slate-400"
              >
                {showMold ? 'Vis original' : 'Vis mold'}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onDownloadHalf('A')}
                  className="rounded-md border border-blue-500/60 bg-blue-500/10 py-1.5 text-xs text-blue-100 hover:border-blue-400"
                >
                  Last ned del A
                </button>
                <button
                  onClick={() => onDownloadHalf('B')}
                  className="rounded-md border border-amber-500/60 bg-amber-500/10 py-1.5 text-xs text-amber-100 hover:border-amber-400"
                >
                  Last ned del B
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </details>
  );
}
