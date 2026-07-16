'use client';

import { useState } from 'react';
import type { MeshHealthReport } from '@/lib/meshRepair';

type Unit = 'mm' | 'in';
const MM_PER_INCH = 25.4;

interface RepairPanelProps {
  supported: boolean;
  health: MeshHealthReport | null;
  isRepairing: boolean;
  lastRepairCount: number | null;
  unit: Unit;
  thicknessBusy: boolean;
  thicknessInfo: { belowFraction: number } | null;
  showThickness: boolean;
  onRepair: () => void;
  onCheckThickness: (minInUnit: number) => void;
  onToggleShowThickness: () => void;
}

export default function RepairPanel({
  supported,
  health,
  isRepairing,
  lastRepairCount,
  unit,
  thicknessBusy,
  thicknessInfo,
  showThickness,
  onRepair,
  onCheckThickness,
  onToggleShowThickness,
}: RepairPanelProps) {
  const [minThickness, setMinThickness] = useState(unit === 'mm' ? 2 : 0.08);

  const [lastUnit, setLastUnit] = useState(unit);
  if (unit !== lastUnit) {
    setLastUnit(unit);
    if (Number.isFinite(minThickness)) {
      const converted =
        unit === 'mm' ? minThickness * MM_PER_INCH : minThickness / MM_PER_INCH;
      setMinThickness(Number(converted.toFixed(unit === 'mm' ? 2 : 3)));
    }
  }

  return (
    <details open className="tcard w-full p-4">
      <summary className="tlabel cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
        <span className="tnum">03</span>Meshhelse
      </summary>

      {!supported ? (
        <p className="mt-2 text-xs text-slate-400">
          Støtter foreløpig kun modeller med én sammenhengende del.
        </p>
      ) : (
        <>
          {!health ? (
            <p className="mt-2 text-xs text-slate-400">Analyserer…</p>
          ) : health.holeCount === 0 && health.nonManifoldEdgeCount === 0 ? (
            <p className="mt-2 text-xs text-emerald-300">✓ Ingen problemer funnet</p>
          ) : (
            <>
              <dl className="mt-2 space-y-1.5 text-xs">
                {health.holeCount > 0 && (
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-400">Hull funnet</dt>
                    <dd className="text-slate-200">{health.holeCount}</dd>
                  </div>
                )}
                {health.nonManifoldEdgeCount > 0 && (
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-400">Ikke-manifold kanter</dt>
                    <dd className="text-slate-200">{health.nonManifoldEdgeCount}</dd>
                  </div>
                )}
              </dl>

              {health.holeCount > 0 && (
                <button
                  onClick={onRepair}
                  disabled={isRepairing}
                  className="mt-3 w-full rounded-md border border-slate-600 py-1.5 text-xs text-slate-200 hover:border-slate-400 disabled:opacity-50"
                >
                  {isRepairing ? 'Reparerer…' : 'Reparer hull'}
                </button>
              )}

              {health.nonManifoldEdgeCount > 0 && (
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  Ikke-manifold kanter kan ikke fikses automatisk ennå. På CSG-genererte
                  modeller (f.eks. mold-halvdeler) er dette som regel ufarlige sømmer.
                </p>
              )}
            </>
          )}

          {lastRepairCount !== null && lastRepairCount > 0 && (
            <p className="mt-2 text-xs text-emerald-300">✓ {lastRepairCount} hull reparert</p>
          )}

          <div className="mt-3 border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between gap-2 text-xs">
              <label htmlFor="min-thickness" className="text-slate-400">
                Min. veggtykkelse ({unit})
              </label>
              <input
                id="min-thickness"
                type="number"
                min="0.1"
                step={unit === 'mm' ? 0.5 : 0.02}
                value={minThickness}
                onChange={(e) => setMinThickness(parseFloat(e.target.value))}
                className="w-20 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-right text-slate-100"
              />
            </div>
            <button
              onClick={() => onCheckThickness(minThickness)}
              disabled={thicknessBusy || !(minThickness > 0)}
              className="mt-2 w-full rounded-md border border-slate-600 py-1.5 text-xs text-slate-200 hover:border-slate-400 disabled:opacity-50"
            >
              {thicknessBusy ? 'Analyserer…' : 'Sjekk veggtykkelse'}
            </button>
            {thicknessInfo && (
              <div className="mt-2 space-y-1.5 text-xs">
                <p
                  className={
                    thicknessInfo.belowFraction > 0.001 ? 'text-amber-300' : 'text-emerald-300'
                  }
                >
                  {thicknessInfo.belowFraction > 0.001
                    ? `⚠ ${(thicknessInfo.belowFraction * 100).toFixed(1)} % av flaten er tynnere enn grensen`
                    : '✓ Ingen områder under grensen'}
                </p>
                <button
                  onClick={onToggleShowThickness}
                  className="w-full rounded-md border border-slate-600 py-1.5 text-slate-200 hover:border-slate-400"
                >
                  {showThickness ? 'Skjul tykkelseskart' : 'Vis tykkelseskart'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </details>
  );
}
