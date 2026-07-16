'use client';

import { useState } from 'react';
import { RotateIcon } from './icons';

export type RotateAxis = 'x' | 'y' | 'z';

type Unit = 'mm' | 'in';
const MM_PER_INCH = 25.4;

interface TransformPanelProps {
  supported: boolean;
  unit: Unit;
  orientBusy: boolean;
  orientStatus: string | null;
  flattenBusy: boolean;
  flattenError: string | null;
  onRotate: (axis: RotateAxis) => void;
  onRotateDegrees: (axis: RotateAxis, degrees: number) => void;
  onScaleAxes: (fx: number, fy: number, fz: number) => void;
  onMirror: () => void;
  onLayFlat: () => void;
  onAutoOrient: () => void;
  onFlatten: (heightInUnit: number) => void;
}

/** Orientation and correction tools: 90-degree and free rotation, mirror,
 *  lay-flat, auto-orient, per-axis stretch, and flat-bottom trim. */
export default function TransformPanel({
  supported,
  unit,
  orientBusy,
  orientStatus,
  flattenBusy,
  flattenError,
  onRotate,
  onRotateDegrees,
  onScaleAxes,
  onMirror,
  onLayFlat,
  onAutoOrient,
  onFlatten,
}: TransformPanelProps) {
  const [freeAxis, setFreeAxis] = useState<RotateAxis>('z');
  const [freeDegrees, setFreeDegrees] = useState(45);
  const [axisScale, setAxisScale] = useState({ x: 100, y: 100, z: 100 });
  const [flattenHeight, setFlattenHeight] = useState(unit === 'mm' ? 2 : 0.08);

  const [lastUnit, setLastUnit] = useState(unit);
  if (unit !== lastUnit) {
    setLastUnit(unit);
    if (Number.isFinite(flattenHeight)) {
      const converted =
        unit === 'mm' ? flattenHeight * MM_PER_INCH : flattenHeight / MM_PER_INCH;
      setFlattenHeight(Number(converted.toFixed(unit === 'mm' ? 2 : 3)));
    }
  }

  const scaleDirty = axisScale.x !== 100 || axisScale.y !== 100 || axisScale.z !== 100;
  const scaleValid =
    axisScale.x > 0 && axisScale.y > 0 && axisScale.z > 0 &&
    Number.isFinite(axisScale.x) && Number.isFinite(axisScale.y) && Number.isFinite(axisScale.z);

  return (
    <details className="tcard w-full p-4">
      <summary className="tlabel cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
        <span className="tnum">02</span>Orientering og justering
      </summary>

      {!supported ? (
        <p className="mt-2 text-xs text-slate-400">
          Støtter foreløpig kun modeller med én sammenhengende del.
        </p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <button
                key={axis}
                onClick={() => onRotate(axis)}
                className="flex items-center justify-center gap-1 rounded-md border border-slate-600 py-1.5 text-xs text-slate-200 hover:border-slate-400"
              >
                <RotateIcon className="h-3 w-3" /> {axis.toUpperCase()} 90°
              </button>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={onMirror}
              className="rounded-md border border-slate-600 py-1.5 text-xs text-slate-200 hover:border-slate-400"
            >
              Speil
            </button>
            <button
              onClick={onLayFlat}
              className="rounded-md border border-slate-600 py-1.5 text-xs text-slate-200 hover:border-slate-400"
            >
              Legg flatt
            </button>
          </div>
          <button
            onClick={onAutoOrient}
            disabled={orientBusy}
            className="mt-2 w-full rounded-md border border-slate-600 py-1.5 text-xs text-slate-200 hover:border-slate-400 disabled:opacity-50"
          >
            {orientBusy ? 'Analyserer…' : 'Auto-orienter for print (minst støtte)'}
          </button>
          {orientStatus && <p className="mt-2 text-xs text-slate-400">{orientStatus}</p>}

          <div className="mt-3 border-t border-slate-800 pt-3">
            <div className="flex items-center gap-2 text-xs">
              <input
                id="free-degrees"
                type="number"
                step="5"
                value={freeDegrees}
                onChange={(e) => setFreeDegrees(parseFloat(e.target.value))}
                className="w-16 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-right text-slate-100"
                aria-label="Grader"
              />
              <span className="text-slate-400">° rundt</span>
              <select
                value={freeAxis}
                onChange={(e) => setFreeAxis(e.target.value as RotateAxis)}
                className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-slate-100"
                aria-label="Rotasjonsakse"
              >
                {(['x', 'y', 'z'] as const).map((axis) => (
                  <option key={axis} value={axis}>
                    {axis.toUpperCase()}
                  </option>
                ))}
              </select>
              <button
                onClick={() => Number.isFinite(freeDegrees) && freeDegrees !== 0 && onRotateDegrees(freeAxis, freeDegrees)}
                className="flex-1 rounded-md border border-slate-600 py-1 text-slate-200 hover:border-slate-400"
              >
                Roter
              </button>
            </div>
          </div>

          <div className="mt-3 border-t border-slate-800 pt-3">
            <p className="text-xs text-slate-400">Strekk/klem per akse (%)</p>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {(['x', 'y', 'z'] as const).map((axis) => (
                <div key={axis} className="flex items-center gap-1 text-xs">
                  <span className="text-slate-500">{axis.toUpperCase()}</span>
                  <input
                    type="number"
                    min="1"
                    step="10"
                    value={axisScale[axis]}
                    onChange={(e) =>
                      setAxisScale((prev) => ({ ...prev, [axis]: parseFloat(e.target.value) }))
                    }
                    className="w-full rounded-md border border-slate-700 bg-slate-800/80 px-1.5 py-1 text-right text-slate-100"
                    aria-label={`Skala ${axis.toUpperCase()}`}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                onScaleAxes(axisScale.x / 100, axisScale.y / 100, axisScale.z / 100);
                setAxisScale({ x: 100, y: 100, z: 100 });
              }}
              disabled={!scaleDirty || !scaleValid}
              className="mt-2 w-full rounded-md border border-slate-600 py-1.5 text-xs text-slate-200 hover:border-slate-400 disabled:opacity-50"
            >
              Bruk skalering
            </button>
          </div>

          <div className="mt-3 border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between gap-2 text-xs">
              <label htmlFor="flatten-height" className="text-slate-400">
                Flat bunn: kutt nederste ({unit})
              </label>
              <input
                id="flatten-height"
                type="number"
                min="0.01"
                step={unit === 'mm' ? 0.5 : 0.02}
                value={flattenHeight}
                onChange={(e) => setFlattenHeight(parseFloat(e.target.value))}
                className="w-20 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-right text-slate-100"
              />
            </div>
            <button
              onClick={() => onFlatten(flattenHeight)}
              disabled={flattenBusy || !(flattenHeight > 0)}
              className="mt-2 w-full rounded-md border border-slate-600 py-1.5 text-xs text-slate-200 hover:border-slate-400 disabled:opacity-50"
            >
              {flattenBusy ? 'Kutter…' : 'Kutt flat bunn'}
            </button>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
              Skjærer bort alt under nivået, så modellen står støtt på printbedet.
            </p>
            {flattenError && <p className="mt-1.5 text-xs text-red-400">{flattenError}</p>}
          </div>
        </>
      )}
    </details>
  );
}
