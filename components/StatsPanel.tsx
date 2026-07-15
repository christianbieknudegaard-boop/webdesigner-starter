'use client';

import { useState } from 'react';
import type { ModelStats } from '@/types/model';

const MM_TO_INCH = 1 / 25.4;

interface StatsPanelProps {
  stats: ModelStats;
  onReset: () => void;
}

export default function StatsPanel({ stats, onReset }: StatsPanelProps) {
  const [unit, setUnit] = useState<'mm' | 'in'>('mm');
  const factor = unit === 'mm' ? 1 : MM_TO_INCH;
  const formatLength = (value: number) => `${(value * factor).toFixed(unit === 'mm' ? 1 : 2)} ${unit}`;

  return (
    <div className="absolute top-4 right-4 w-64 rounded-xl border border-slate-700 bg-slate-900/80 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Modellinfo</h3>
        <button
          onClick={() => setUnit(unit === 'mm' ? 'in' : 'mm')}
          className="rounded-md border border-slate-600 px-2 py-0.5 text-xs text-slate-300 hover:border-slate-400"
        >
          {unit}
        </button>
      </div>

      <dl className="space-y-1.5 text-xs">
        <Row label="Fil" value={stats.fileName} />
        <Row label="Format" value={stats.format.toUpperCase()} />
        <Row label="X" value={formatLength(stats.dimensions.x)} />
        <Row label="Y" value={formatLength(stats.dimensions.y)} />
        <Row label="Z" value={formatLength(stats.dimensions.z)} />
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
