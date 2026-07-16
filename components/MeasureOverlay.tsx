'use client';

import { RulerIcon } from './icons';

const MM_TO_INCH = 1 / 25.4;

interface MeasureOverlayProps {
  active: boolean;
  onToggle: () => void;
  distance: number | null;
  pointCount: number;
  unit: 'mm' | 'in';
  onReset: () => void;
}

export default function MeasureOverlay({
  active,
  onToggle,
  distance,
  pointCount,
  unit,
  onReset,
}: MeasureOverlayProps) {
  const factor = unit === 'mm' ? 1 : MM_TO_INCH;

  return (
    <div className="absolute top-4 left-4 flex flex-col items-start gap-2">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium backdrop-blur-sm transition-colors ${
          active
            ? 'border-blue-400 bg-blue-500/20 text-blue-100'
            : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-500'
        }`}
      >
        <RulerIcon className="h-3.5 w-3.5" /> Mål avstand
      </button>

      {active && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 backdrop-blur-sm">
          {distance !== null ? (
            <div className="flex items-center gap-2">
              <span>
                Avstand: <span className="font-semibold text-slate-100">{(distance * factor).toFixed(2)} {unit}</span>
              </span>
              <button
                onClick={onReset}
                className="rounded-md border border-slate-600 px-1.5 py-0.5 text-[10px] hover:border-slate-400"
              >
                Nullstill
              </button>
            </div>
          ) : pointCount === 1 ? (
            <span>Klikk ett punkt til på modellen…</span>
          ) : (
            <span>Klikk to punkter på modellen for å måle</span>
          )}
        </div>
      )}
    </div>
  );
}
