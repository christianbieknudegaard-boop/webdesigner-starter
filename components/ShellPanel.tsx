'use client';

import { useState } from 'react';

type Unit = 'mm' | 'in';

interface ShellPanelProps {
  supported: boolean;
  unit: Unit;
  isHollow: boolean;
  isProcessing: boolean;
  error: string | null;
  triangleCount: number | null;
  transparent: boolean;
  onHollow: (thickness: number) => void;
  onToggleHollow: () => void;
  onToggleTransparent: () => void;
  onDownload: () => void;
}

export default function ShellPanel({
  supported,
  unit,
  isHollow,
  isProcessing,
  error,
  triangleCount,
  transparent,
  onHollow,
  onToggleHollow,
  onToggleTransparent,
  onDownload,
}: ShellPanelProps) {
  const [thickness, setThickness] = useState(unit === 'mm' ? 2 : 0.08);

  return (
    <div className="absolute bottom-4 right-4 w-64 rounded-xl border border-slate-700 bg-slate-900/80 p-4 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-slate-100">Hul-gjøring</h3>

      {!supported ? (
        <p className="mt-2 text-xs text-slate-400">
          Støtter foreløpig kun modeller med én sammenhengende del.
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs">
            <label htmlFor="wall-thickness" className="text-slate-400">
              Veggtykkelse ({unit})
            </label>
            <input
              id="wall-thickness"
              type="number"
              min="0.01"
              step={unit === 'mm' ? 0.5 : 0.02}
              value={thickness}
              onChange={(e) => setThickness(parseFloat(e.target.value))}
              className="w-20 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-right text-slate-100"
            />
          </div>

          <button
            onClick={() => onHollow(thickness)}
            disabled={isProcessing || !(thickness > 0)}
            className="mt-3 w-full rounded-md border border-slate-600 py-1.5 text-xs text-slate-200 hover:border-slate-400 disabled:opacity-50"
          >
            {isProcessing ? 'Behandler…' : 'Gjør modellen hul'}
          </button>

          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

          {triangleCount !== null && (
            <div className="mt-3 space-y-2 border-t border-slate-800 pt-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Triangler (hul)</span>
                <span className="text-slate-200">{triangleCount.toLocaleString('nb-NO')}</span>
              </div>

              <button
                onClick={onToggleHollow}
                className="w-full rounded-md border border-slate-600 py-1.5 text-slate-200 hover:border-slate-400"
              >
                {isHollow ? 'Vis original' : 'Vis hul versjon'}
              </button>

              <label className="flex items-center gap-2 text-slate-400">
                <input type="checkbox" checked={transparent} onChange={onToggleTransparent} />
                Gjennomsiktig visning
              </label>

              <button
                onClick={onDownload}
                className="w-full rounded-md border border-blue-500/60 bg-blue-500/10 py-1.5 text-blue-100 hover:border-blue-400"
              >
                Last ned STL
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
