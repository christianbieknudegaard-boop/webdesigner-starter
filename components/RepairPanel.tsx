'use client';

import type { MeshHealthReport } from '@/lib/meshRepair';

interface RepairPanelProps {
  supported: boolean;
  health: MeshHealthReport | null;
  isRepairing: boolean;
  lastRepairCount: number | null;
  onRepair: () => void;
}

export default function RepairPanel({
  supported,
  health,
  isRepairing,
  lastRepairCount,
  onRepair,
}: RepairPanelProps) {
  return (
    <details open className="w-full rounded-xl border border-slate-700 bg-slate-900/80 p-4 backdrop-blur-sm">
      <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100 select-none [&::-webkit-details-marker]:hidden">
        Meshhelse
      </summary>

      {!supported ? (
        <p className="mt-2 text-xs text-slate-400">
          Støtter foreløpig kun modeller med én sammenhengende del.
        </p>
      ) : !health ? (
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
              Ikke-manifold kanter kan ikke fikses automatisk ennå. På CSG-genererte modeller
              (f.eks. mold-halvdeler) er dette som regel ufarlige sømmer.
            </p>
          )}
        </>
      )}

      {lastRepairCount !== null && lastRepairCount > 0 && (
        <p className="mt-2 text-xs text-emerald-300">✓ {lastRepairCount} hull reparert</p>
      )}
    </details>
  );
}
