'use client';

import { useState } from 'react';
import type { SplitAxis } from '@/lib/moldGenerator';

interface CutPanelProps {
  supported: boolean;
  isCutting: boolean;
  error: string | null;
  hasResult: boolean;
  showCut: boolean;
  onCut: (axis: SplitAxis, positionRatio: number, pins: boolean) => void;
  onToggleShowCut: () => void;
  onDownloadHalf: (half: 'A' | 'B') => void;
}

/** Splits the model along a plane so large parts can be printed in pieces. */
export default function CutPanel({
  supported,
  isCutting,
  error,
  hasResult,
  showCut,
  onCut,
  onToggleShowCut,
  onDownloadHalf,
}: CutPanelProps) {
  const [axis, setAxis] = useState<SplitAxis>('z');
  const [positionPct, setPositionPct] = useState(50);
  const [pins, setPins] = useState(true);

  return (
    <details className="tcard w-full p-4">
      <summary className="tlabel cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
        <span className="tnum">07</span>Plan-kutt
      </summary>

      {!supported ? (
        <p className="mt-2 text-xs text-slate-400">
          Støtter foreløpig kun modeller med én sammenhengende del.
        </p>
      ) : (
        <>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Del modellen i to langs et plan – for å printe store modeller i deler.
          </p>

          <div className="mt-3 flex items-center justify-between gap-2 text-xs">
            <label htmlFor="cut-axis" className="text-slate-400">
              Kutteakse
            </label>
            <select
              id="cut-axis"
              value={axis}
              onChange={(e) => setAxis(e.target.value as SplitAxis)}
              className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-slate-100"
            >
              <option value="x">X</option>
              <option value="y">Y</option>
              <option value="z">Z</option>
            </select>
          </div>

          <div className="mt-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <label htmlFor="cut-position">Posisjon</label>
              <span className="text-slate-200">{positionPct} %</span>
            </div>
            <input
              id="cut-position"
              type="range"
              min="5"
              max="95"
              value={positionPct}
              onChange={(e) => setPositionPct(parseInt(e.target.value, 10))}
              className="mt-1 w-full accent-amber-500"
            />
          </div>

          <label className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={pins} onChange={() => setPins((prev) => !prev)} />
            Styrepinner (for liming)
          </label>

          <button
            onClick={() => onCut(axis, positionPct / 100, pins)}
            disabled={isCutting}
            className="mt-3 w-full rounded-md border border-slate-600 py-1.5 text-xs text-slate-200 hover:border-slate-400 disabled:opacity-50"
          >
            {isCutting ? 'Kutter…' : 'Kutt modellen'}
          </button>

          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

          {hasResult && (
            <div className="mt-3 space-y-2 border-t border-slate-800 pt-3">
              <button
                onClick={onToggleShowCut}
                className="w-full rounded-md border border-slate-600 py-1.5 text-xs text-slate-200 hover:border-slate-400"
              >
                {showCut ? 'Vis original' : 'Vis delene'}
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
