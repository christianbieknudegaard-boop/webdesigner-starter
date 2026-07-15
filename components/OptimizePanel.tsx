'use client';

import { useState } from 'react';

export type OptimizeOp = 'simplify' | 'loose' | 'smooth';

interface OptimizePanelProps {
  supported: boolean;
  triangleCount: number;
  busy: OptimizeOp | null;
  status: string | null;
  onRun: (op: OptimizeOp, amount?: number) => void;
}

const RATIOS = [
  { value: 0.5, label: '50 %' },
  { value: 0.25, label: '25 %' },
  { value: 0.1, label: '10 %' },
  { value: 0.05, label: '5 %' },
];

/**
 * Cleanup tools aimed at AI-generated meshes (image-to-3D output): they
 * usually arrive with far more triangles than the shape needs, bumpy
 * surfaces, and loose floating debris.
 */
export default function OptimizePanel({
  supported,
  triangleCount,
  busy,
  status,
  onRun,
}: OptimizePanelProps) {
  const [ratio, setRatio] = useState(0.25);

  return (
    <details className="tcard w-full p-4">
      <summary className="tlabel cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
        <span className="tnum">03</span>Optimalisering
      </summary>

      {!supported ? (
        <p className="mt-2 text-xs text-slate-400">
          Støtter foreløpig kun modeller med én sammenhengende del.
        </p>
      ) : (
        <>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            For AI-genererte modeller: reduser trianglertall, fjern løse fragmenter og
            glatt ut humpete overflater.
          </p>

          <div className="mt-3 flex items-center justify-between gap-2 text-xs">
            <label htmlFor="simplify-ratio" className="text-slate-400">
              Behold andel
            </label>
            <select
              id="simplify-ratio"
              value={ratio}
              onChange={(e) => setRatio(parseFloat(e.target.value))}
              className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-slate-100"
            >
              {RATIOS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => onRun('simplify', ratio)}
            disabled={busy !== null || triangleCount < 20}
            className="mt-2 w-full rounded-md border border-slate-600 py-1.5 text-xs text-slate-200 hover:border-slate-400 disabled:opacity-50"
          >
            {busy === 'simplify'
              ? 'Forenkler…'
              : `Forenkle (~${Math.max(1, Math.round(triangleCount * ratio)).toLocaleString('nb-NO')} triangler)`}
          </button>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => onRun('loose')}
              disabled={busy !== null}
              className="rounded-md border border-slate-600 py-1.5 text-xs text-slate-200 hover:border-slate-400 disabled:opacity-50"
            >
              {busy === 'loose' ? 'Rydder…' : 'Fjern løse deler'}
            </button>
            <button
              onClick={() => onRun('smooth', 10)}
              disabled={busy !== null}
              className="rounded-md border border-slate-600 py-1.5 text-xs text-slate-200 hover:border-slate-400 disabled:opacity-50"
            >
              {busy === 'smooth' ? 'Glatter…' : 'Glatt ut'}
            </button>
          </div>

          {status && <p className="mt-2 text-xs text-emerald-300">{status}</p>}
        </>
      )}
    </details>
  );
}
