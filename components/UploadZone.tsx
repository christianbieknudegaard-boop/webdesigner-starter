'use client';

import { useCallback, useRef, useState } from 'react';
import { UploadIcon } from './icons';

const ACCEPTED_EXTENSIONS = ['.stl', '.obj', '.glb', '.gltf', '.ply'];
const FORMAT_LABELS = ['STL', 'OBJ', 'GLB', 'PLY'];

interface UploadZoneProps {
  onFile: (file: File) => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function UploadZone({ onFile, isLoading, error }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (!ACCEPTED_EXTENSIONS.includes(extension)) return;
      onFile(file);
    },
    [onFile]
  );

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`pointer-events-auto flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-10 py-14 text-center transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-500/10'
            : 'border-slate-600 bg-slate-900/60 hover:border-slate-400'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".stl,.obj,.glb,.gltf,.ply"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-600 text-slate-300">
          <UploadIcon className="h-6 w-6" />
        </span>
        <p className="text-lg font-medium text-slate-100">
          {isLoading ? 'Leser modell…' : 'Slipp en 3D-fil her'}
        </p>
        <p className="text-sm text-slate-400">eller klikk for å velge en fil fra maskinen din</p>
        <div className="mt-1 flex gap-1.5 font-mono text-[10px] tracking-wide text-slate-500">
          {FORMAT_LABELS.map((format) => (
            <span key={format} className="rounded border border-slate-700 px-1.5 py-0.5">
              {format}
            </span>
          ))}
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
