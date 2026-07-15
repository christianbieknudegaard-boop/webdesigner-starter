'use client';

import { useState } from 'react';
import type { FaceSide } from '@/lib/csgTools';

type Unit = 'mm' | 'in';
const MM_PER_INCH = 25.4;

const FACES: { value: FaceSide; label: string }[] = [
  { value: '+z', label: 'Topp (+Z)' },
  { value: '-z', label: 'Bunn (−Z)' },
  { value: '+x', label: 'Side (+X)' },
  { value: '-x', label: 'Side (−X)' },
  { value: '+y', label: 'Side (+Y)' },
  { value: '-y', label: 'Side (−Y)' },
];

interface EngravePanelProps {
  supported: boolean;
  unit: Unit;
  isEngraving: boolean;
  error: string | null;
  onEngrave: (
    text: string,
    face: FaceSide,
    sizeInUnit: number,
    depthInUnit: number,
    mode: 'engrave' | 'emboss'
  ) => void;
}

/** Cuts or raises text on a face of the model - labels, part numbers, names. */
export default function EngravePanel({
  supported,
  unit,
  isEngraving,
  error,
  onEngrave,
}: EngravePanelProps) {
  const [text, setText] = useState('');
  const [face, setFace] = useState<FaceSide>('+z');
  const [size, setSize] = useState(unit === 'mm' ? 6 : 0.25);
  const [depth, setDepth] = useState(unit === 'mm' ? 1 : 0.04);
  const [mode, setMode] = useState<'engrave' | 'emboss'>('engrave');

  const [lastUnit, setLastUnit] = useState(unit);
  if (unit !== lastUnit) {
    setLastUnit(unit);
    const factor = unit === 'mm' ? MM_PER_INCH : 1 / MM_PER_INCH;
    if (Number.isFinite(size)) setSize(Number((size * factor).toFixed(unit === 'mm' ? 1 : 3)));
    if (Number.isFinite(depth)) setDepth(Number((depth * factor).toFixed(unit === 'mm' ? 2 : 3)));
  }

  return (
    <details className="tcard w-full p-4">
      <summary className="tlabel cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
        <span className="tnum">08</span>Gravering
      </summary>

      {!supported ? (
        <p className="mt-2 text-xs text-slate-400">
          Støtter foreløpig kun modeller med én sammenhengende del.
        </p>
      ) : (
        <>
          <input
            type="text"
            value={text}
            maxLength={24}
            placeholder="Tekst (A–Z, 0–9 …)"
            onChange={(e) => setText(e.target.value)}
            className="mt-3 w-full rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500"
          />

          <div className="mt-2 flex items-center justify-between gap-2 text-xs">
            <label htmlFor="engrave-face" className="text-slate-400">
              Flate
            </label>
            <select
              id="engrave-face"
              value={face}
              onChange={(e) => setFace(e.target.value as FaceSide)}
              className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-slate-100"
            >
              {FACES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <label className="text-slate-400">
              Høyde ({unit})
              <input
                type="number"
                min="0.1"
                step={unit === 'mm' ? 1 : 0.05}
                value={size}
                onChange={(e) => setSize(parseFloat(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-right text-slate-100"
              />
            </label>
            <label className="text-slate-400">
              Dybde ({unit})
              <input
                type="number"
                min="0.05"
                step={unit === 'mm' ? 0.5 : 0.02}
                value={depth}
                onChange={(e) => setDepth(parseFloat(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-right text-slate-100"
              />
            </label>
          </div>

          <div className="mt-2 flex gap-3 text-xs text-slate-400">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={mode === 'engrave'}
                onChange={() => setMode('engrave')}
              />
              Gravér inn
            </label>
            <label className="flex items-center gap-1.5">
              <input type="radio" checked={mode === 'emboss'} onChange={() => setMode('emboss')} />
              Preg ut
            </label>
          </div>

          <button
            onClick={() => onEngrave(text, face, size, depth, mode)}
            disabled={isEngraving || text.trim().length === 0 || !(size > 0) || !(depth > 0)}
            className="mt-3 w-full rounded-md border border-slate-600 py-1.5 text-xs text-slate-200 hover:border-slate-400 disabled:opacity-50"
          >
            {isEngraving ? 'Graverer…' : mode === 'engrave' ? 'Gravér tekst' : 'Preg tekst'}
          </button>

          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </>
      )}
    </details>
  );
}
