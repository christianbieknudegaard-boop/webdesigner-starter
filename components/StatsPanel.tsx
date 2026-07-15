'use client';

import { useState } from 'react';
import type { ModelStats } from '@/types/model';

const MM_TO_INCH = 1 / 25.4;
const MIN_BASE_DIMENSION = 0.001;

type Unit = 'mm' | 'in';
type Axis = 'x' | 'y' | 'z';

/** g/cm3 for common print- and casting materials. */
const MATERIALS = [
  { key: 'pla', label: 'PLA', density: 1.24 },
  { key: 'petg', label: 'PETG', density: 1.27 },
  { key: 'abs', label: 'ABS', density: 1.04 },
  { key: 'resin', label: 'Resin', density: 1.1 },
  { key: 'silikon', label: 'Silikon', density: 1.1 },
  { key: 'gips', label: 'Gips', density: 1.2 },
] as const;

interface StatsPanelProps {
  stats: ModelStats;
  scale: number;
  unit: Unit;
  /** Enclosed volume in native units cubed (mm3 at 100% scale), or null. */
  volumeNative: number | null;
  onUnitChange: (unit: Unit) => void;
  onScaleChange: (scale: number) => void;
  onDownload: () => void;
  onReset: () => void;
}

export default function StatsPanel({
  stats,
  scale,
  unit,
  volumeNative,
  onUnitChange,
  onScaleChange,
  onDownload,
  onReset,
}: StatsPanelProps) {
  const factor = unit === 'mm' ? 1 : MM_TO_INCH;
  const [materialKey, setMaterialKey] = useState<string>('pla');
  const material = MATERIALS.find((m) => m.key === materialKey) ?? MATERIALS[0];
  const volumeCm3 = volumeNative !== null ? (volumeNative * scale ** 3) / 1000 : null;
  const weightGrams = volumeCm3 !== null ? volumeCm3 * material.density : null;

  const handleDimensionChange = (axis: Axis, rawValue: string) => {
    const base = stats.dimensions[axis];
    if (base < MIN_BASE_DIMENSION) return;

    const value = parseFloat(rawValue);
    if (!Number.isFinite(value) || value <= 0) return;

    const mmValue = value / factor;
    onScaleChange(mmValue / base);
  };

  return (
    <div className="tcard w-full p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="tlabel"><span className="tnum">01</span>Modellinfo</h3>
        <button
          onClick={() => onUnitChange(unit === 'mm' ? 'in' : 'mm')}
          className="rounded-md border border-slate-600 px-2 py-0.5 text-xs text-slate-300 hover:border-slate-400"
        >
          {unit}
        </button>
      </div>

      <dl className="space-y-1.5 text-xs">
        <Row label="Fil" value={stats.fileName} />
        <Row label="Format" value={stats.format.toUpperCase()} />
      </dl>

      <div className="mt-3 space-y-1.5 border-t border-slate-800 pt-3">
        <DimensionInput
          axis="x"
          stats={stats}
          scale={scale}
          factor={factor}
          onChange={handleDimensionChange}
        />
        <DimensionInput
          axis="y"
          stats={stats}
          scale={scale}
          factor={factor}
          onChange={handleDimensionChange}
        />
        <DimensionInput
          axis="z"
          stats={stats}
          scale={scale}
          factor={factor}
          onChange={handleDimensionChange}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-slate-400">Skala</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-200">{Math.round(scale * 100)}%</span>
          {scale !== 1 && (
            <button
              onClick={() => onScaleChange(1)}
              className="rounded-md border border-slate-600 px-1.5 py-0.5 text-[10px] text-slate-300 hover:border-slate-400"
            >
              Nullstill
            </button>
          )}
        </div>
      </div>

      <dl className="mt-3 space-y-1.5 border-t border-slate-800 pt-3 text-xs">
        <Row label="Triangler" value={stats.triangleCount.toLocaleString('nb-NO')} />
        <Row label="Punkter" value={stats.vertexCount.toLocaleString('nb-NO')} />
        {volumeCm3 !== null && (
          <Row
            label="Volum"
            value={`${volumeCm3 < 10 ? volumeCm3.toFixed(2) : volumeCm3.toFixed(1)} cm³`}
          />
        )}
      </dl>

      {weightGrams !== null && (
        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
          <select
            value={materialKey}
            onChange={(e) => setMaterialKey(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-slate-100"
          >
            {MATERIALS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
          <span className="text-slate-200">
            ~{weightGrams < 10 ? weightGrams.toFixed(1) : Math.round(weightGrams)} g
          </span>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <button
          onClick={onDownload}
          className="w-full rounded-md border border-blue-500/60 bg-blue-500/10 py-1.5 text-xs text-blue-100 hover:border-blue-400"
        >
          Last ned STL
        </button>
        <button
          onClick={onReset}
          className="w-full rounded-md border border-slate-600 py-1.5 text-xs text-slate-300 hover:border-slate-400 hover:text-white"
        >
          Last opp ny modell
        </button>
      </div>
    </div>
  );
}

function DimensionInput({
  axis,
  stats,
  scale,
  factor,
  onChange,
}: {
  axis: Axis;
  stats: ModelStats;
  scale: number;
  factor: number;
  onChange: (axis: Axis, value: string) => void;
}) {
  const base = stats.dimensions[axis];
  const displayValue = base * scale * factor;
  const disabled = base < MIN_BASE_DIMENSION;

  return (
    <div className="flex items-center justify-between gap-2">
      <label className="text-slate-400" htmlFor={`dim-${axis}`}>
        {axis.toUpperCase()}
      </label>
      <input
        id={`dim-${axis}`}
        type="number"
        min="0.01"
        step="0.1"
        disabled={disabled}
        value={Number(displayValue.toFixed(2))}
        onChange={(e) => onChange(axis, e.target.value)}
        className="w-24 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-right text-slate-100 disabled:opacity-50"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className="truncate text-right text-slate-200" title={value}>
        {value}
      </dd>
    </div>
  );
}
