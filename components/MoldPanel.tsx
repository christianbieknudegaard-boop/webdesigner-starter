'use client';

import { useState } from 'react';
import type { MoldOptions, SplitAxis } from '@/lib/moldGenerator';

type Unit = 'mm' | 'in';

interface MoldPanelProps {
  supported: boolean;
  unit: Unit;
  isGenerating: boolean;
  error: string | null;
  hasResult: boolean;
  showMold: boolean;
  onGenerate: (margin: number, axis: SplitAxis, options: MoldOptions) => void;
  onToggleShowMold: () => void;
  onDownloadHalf: (half: 'A' | 'B') => void;
}

export default function MoldPanel({
  supported,
  unit,
  isGenerating,
  error,
  hasResult,
  showMold,
  onGenerate,
  onToggleShowMold,
  onDownloadHalf,
}: MoldPanelProps) {
  const [margin, setMargin] = useState(unit === 'mm' ? 5 : 0.2);
  const [axis, setAxis] = useState<SplitAxis>('z');
  const [pourChannel, setPourChannel] = useState(true);
  const [registrationKeys, setRegistrationKeys] = useState(true);

  return (
    <div className="absolute bottom-4 left-1/2 w-72 -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-900/80 p-4 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-slate-100">Mold-generator</h3>

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
          </div>

          <button
            onClick={() => onGenerate(margin, axis, { pourChannel, registrationKeys })}
            disabled={isGenerating || !(margin > 0)}
            className="mt-3 w-full rounded-md border border-slate-600 py-1.5 text-xs text-slate-200 hover:border-slate-400 disabled:opacity-50"
          >
            {isGenerating ? 'Genererer…' : 'Generer mold'}
          </button>

          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

          {hasResult && (
            <div className="mt-3 space-y-2 border-t border-slate-800 pt-3">
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
    </div>
  );
}
