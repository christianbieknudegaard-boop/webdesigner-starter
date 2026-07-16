'use client';

import { useRef, useState } from 'react';
import type { BooleanOp } from '@/lib/csgTools';

type Unit = 'mm' | 'in';
const MM_PER_INCH = 25.4;

const OPS: { value: BooleanOp; label: string }[] = [
  { value: 'union', label: 'Slå sammen' },
  { value: 'subtract', label: 'Trekk fra' },
  { value: 'intersect', label: 'Skjæring' },
];

export interface CombineOffset {
  x: number;
  y: number;
  z: number;
}

interface CombinePanelProps {
  supported: boolean;
  unit: Unit;
  secondName: string | null;
  secondTriangles: number | null;
  /** Offset of model B relative to A's center, in mm. */
  offset: CombineOffset;
  /** Uniform scale for model B, percent. */
  scalePercent: number;
  busy: boolean;
  error: string | null;
  onUploadSecond: (file: File) => void;
  onOffsetChange: (offset: CombineOffset) => void;
  onScalePercentChange: (percent: number) => void;
  onApply: (op: BooleanOp) => void;
  onClearSecond: () => void;
}

/** Two-model boolean: upload a second model, position it, and combine. */
export default function CombinePanel({
  supported,
  unit,
  secondName,
  secondTriangles,
  offset,
  scalePercent,
  busy,
  error,
  onUploadSecond,
  onOffsetChange,
  onScalePercentChange,
  onApply,
  onClearSecond,
}: CombinePanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [op, setOp] = useState<BooleanOp>('union');
  const factor = unit === 'mm' ? 1 : 1 / MM_PER_INCH;

  const setAxis = (axis: keyof CombineOffset, raw: string) => {
    const value = parseFloat(raw);
    if (!Number.isFinite(value)) return;
    onOffsetChange({ ...offset, [axis]: value / factor });
  };

  return (
    <details className="tcard w-full p-4">
      <summary className="tlabel cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
        <span className="tnum">09</span>Kombiner
      </summary>

      {!supported ? (
        <p className="mt-2 text-xs text-slate-400">
          Støtter foreløpig kun modeller med én sammenhengende del.
        </p>
      ) : (
        <>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Last opp en modell til, plasser den, og slå dem sammen – eller bruk den som
            «hull» og trekk den fra.
          </p>

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadSecond(file);
              e.target.value = '';
            }}
          />

          {!secondName ? (
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-3 w-full rounded-md border border-slate-600 py-1.5 text-xs text-slate-200 hover:border-slate-400"
            >
              Last opp modell B
            </button>
          ) : (
            <>
              <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-slate-200" title={secondName}>
                  {secondName}
                </span>
                <button
                  onClick={onClearSecond}
                  className="rounded-md border border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-300 hover:border-slate-400"
                >
                  Fjern
                </button>
              </div>
              {secondTriangles !== null && (
                <p className="mt-1 text-[11px] text-slate-500">
                  {secondTriangles.toLocaleString('nb-NO')} triangler (vises gul i 3D-visningen)
                </p>
              )}

              <div className="mt-3 space-y-1.5">
                {(['x', 'y', 'z'] as const).map((axis) => (
                  <div key={axis} className="flex items-center justify-between gap-2 text-xs">
                    <label htmlFor={`combine-${axis}`} className="text-slate-400">
                      Forskyv {axis.toUpperCase()} ({unit})
                    </label>
                    <input
                      id={`combine-${axis}`}
                      type="number"
                      step={unit === 'mm' ? 1 : 0.05}
                      value={Number((offset[axis] * factor).toFixed(2))}
                      onChange={(e) => setAxis(axis, e.target.value)}
                      className="w-20 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-right text-slate-100"
                    />
                  </div>
                ))}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <label htmlFor="combine-scale" className="text-slate-400">
                    Skala B (%)
                  </label>
                  <input
                    id="combine-scale"
                    type="number"
                    min="1"
                    step="5"
                    value={scalePercent}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (Number.isFinite(value) && value > 0) onScalePercentChange(value);
                    }}
                    className="w-20 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-right text-slate-100"
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {OPS.map((candidate) => (
                  <button
                    key={candidate.value}
                    onClick={() => setOp(candidate.value)}
                    className={`rounded-md border px-1 py-1.5 text-[11px] ${
                      op === candidate.value
                        ? 'border-blue-400 bg-blue-500/15 text-blue-100'
                        : 'border-slate-600 text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {candidate.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => onApply(op)}
                disabled={busy}
                className="mt-2 w-full rounded-md border border-blue-500/60 bg-blue-500/10 py-1.5 text-xs text-blue-100 hover:border-blue-400 disabled:opacity-50"
              >
                {busy ? 'Kombinerer…' : 'Utfør'}
              </button>
            </>
          )}

          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </>
      )}
    </details>
  );
}
