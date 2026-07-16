'use client';

import { useState } from 'react';
import type { Source2D } from '@/lib/parseModel';
import type { LithophaneOptions } from '@/lib/lithophane';
import type { SvgOptions } from '@/lib/svgTo3d';

interface From2DPanelProps {
  source: Source2D;
  svgOptions: SvgOptions;
  lithoOptions: LithophaneOptions;
  busy: boolean;
  onRegenerateSvg: (options: SvgOptions) => void;
  onRegenerateLitho: (options: LithophaneOptions) => void;
}

function NumberRow({
  id,
  label,
  value,
  step,
  min,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  step: number;
  min?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <label htmlFor={id} className="text-slate-400">
        {label}
      </label>
      <input
        id={id}
        type="number"
        step={step}
        min={min}
        value={value}
        onChange={(e) => {
          const parsed = parseFloat(e.target.value);
          if (Number.isFinite(parsed)) onChange(parsed);
        }}
        className="w-20 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-right text-slate-100"
      />
    </div>
  );
}

/** Settings for models generated from 2D sources (SVG extrusion or
 *  image lithophane). Values are always mm - these are generator inputs. */
export default function From2DPanel({
  source,
  svgOptions,
  lithoOptions,
  busy,
  onRegenerateSvg,
  onRegenerateLitho,
}: From2DPanelProps) {
  const [svg, setSvg] = useState(svgOptions);
  const [litho, setLitho] = useState(lithoOptions);

  return (
    <details open className="tcard w-full p-4">
      <summary className="tlabel cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
        <span className="tnum">10</span>
        {source.kind === 'svg' ? 'SVG til 3D' : 'Lithophane'}
      </summary>

      {source.kind === 'svg' ? (
        <div className="mt-3 space-y-1.5">
          <NumberRow
            id="svg-width"
            label="Bredde (mm)"
            value={svg.widthMm}
            step={5}
            min={1}
            onChange={(widthMm) => setSvg((prev) => ({ ...prev, widthMm }))}
          />
          <NumberRow
            id="svg-depth"
            label="Høyde/ekstrudering (mm)"
            value={svg.depthMm}
            step={1}
            min={0.2}
            onChange={(depthMm) => setSvg((prev) => ({ ...prev, depthMm }))}
          />
          <button
            onClick={() => onRegenerateSvg(svg)}
            disabled={busy || !(svg.widthMm > 0) || !(svg.depthMm > 0)}
            className="mt-1 w-full rounded-md border border-blue-500/60 bg-blue-500/10 py-1.5 text-xs text-blue-100 hover:border-blue-400 disabled:opacity-50"
          >
            {busy ? 'Genererer…' : 'Oppdater modellen'}
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-1.5">
          <NumberRow
            id="litho-width"
            label="Bredde (mm)"
            value={litho.widthMm}
            step={10}
            min={10}
            onChange={(widthMm) => setLitho((prev) => ({ ...prev, widthMm }))}
          />
          <NumberRow
            id="litho-min"
            label="Min. tykkelse (mm)"
            value={litho.minMm}
            step={0.1}
            min={0.2}
            onChange={(minMm) => setLitho((prev) => ({ ...prev, minMm }))}
          />
          <NumberRow
            id="litho-max"
            label="Maks tykkelse (mm)"
            value={litho.maxMm}
            step={0.2}
            min={0.4}
            onChange={(maxMm) => setLitho((prev) => ({ ...prev, maxMm }))}
          />
          <NumberRow
            id="litho-res"
            label="Oppløsning (punkter)"
            value={litho.resolution}
            step={20}
            min={40}
            onChange={(resolution) => setLitho((prev) => ({ ...prev, resolution }))}
          />
          <label className="flex items-center gap-2 pt-1 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={litho.invert}
              onChange={(e) => setLitho((prev) => ({ ...prev, invert: e.target.checked }))}
            />
            Inverter (mørkt = tynt, for relieff uten baklys)
          </label>
          <button
            onClick={() => onRegenerateLitho(litho)}
            disabled={busy || !(litho.maxMm > litho.minMm) || !(litho.widthMm > 0)}
            className="mt-1 w-full rounded-md border border-blue-500/60 bg-blue-500/10 py-1.5 text-xs text-blue-100 hover:border-blue-400 disabled:opacity-50"
          >
            {busy ? 'Genererer…' : 'Oppdater modellen'}
          </button>
          <p className="pt-1 text-[11px] leading-relaxed text-slate-500">
            Standardinnstillingen (mørkt = tykt) er for lithophane med lys bak – f.eks.
            i et vindu eller foran en LED.
          </p>
        </div>
      )}
    </details>
  );
}
