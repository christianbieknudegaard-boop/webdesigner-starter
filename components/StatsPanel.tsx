'use client';

import type { ModelStats } from '@/types/model';

const MM_TO_INCH = 1 / 25.4;
const MIN_BASE_DIMENSION = 0.001;

type Unit = 'mm' | 'in';
type Axis = 'x' | 'y' | 'z';

interface StatsPanelProps {
  stats: ModelStats;
  scale: number;
  unit: Unit;
  onUnitChange: (unit: Unit) => void;
  onScaleChange: (scale: number) => void;
  onReset: () => void;
}

export default function StatsPanel({
  stats,
  scale,
  unit,
  onUnitChange,
  onScaleChange,
  onReset,
}: StatsPanelProps) {
  const factor = unit === 'mm' ? 1 : MM_TO_INCH;

  const handleDimensionChange = (axis: Axis, rawValue: string) => {
    const base = stats.dimensions[axis];
    if (base < MIN_BASE_DIMENSION) return;

    const value = parseFloat(rawValue);
    if (!Number.isFinite(value) || value <= 0) return;

    const mmValue = value / factor;
    onScaleChange(mmValue / base);
  };

  return (
    <div className="w-full rounded-xl border border-slate-700 bg-slate-900/80 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Modellinfo</h3>
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
      </dl>

      <button
        onClick={onReset}
        className="mt-4 w-full rounded-md border border-slate-600 py-1.5 text-xs text-slate-300 hover:border-slate-400 hover:text-white"
      >
        Last opp ny modell
      </button>
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
