'use client';

import { RotateIcon } from './icons';

export type RotateAxis = 'x' | 'y' | 'z';

interface TransformPanelProps {
  supported: boolean;
  orientBusy: boolean;
  orientStatus: string | null;
  onRotate: (axis: RotateAxis) => void;
  onMirror: () => void;
  onLayFlat: () => void;
  onAutoOrient: () => void;
}

/** Orientation fixes for downloaded/AI models: 90-degree rotations, mirror
 *  (left/right part variants), and lay-flat on the largest planar face. */
export default function TransformPanel({
  supported,
  orientBusy,
  orientStatus,
  onRotate,
  onMirror,
  onLayFlat,
  onAutoOrient,
}: TransformPanelProps) {
  return (
    <details className="tcard w-full p-4">
      <summary className="tlabel cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
        <span className="tnum">02</span>Orientering
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
        </>
      )}
    </details>
  );
}
