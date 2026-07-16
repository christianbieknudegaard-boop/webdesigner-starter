'use client';

import { useCallback, useRef, useState } from 'react';

const ACCEPTED_EXTENSIONS = ['.stl', '.obj', '.glb', '.gltf', '.ply'];

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
        <div className="text-4xl">📦</div>
        <p className="text-lg font-medium text-slate-100">
          {isLoading ? 'Leser modell…' : 'Slipp en 3D-fil her (STL, OBJ, GLB, PLY)'}
        </p>
        <p className="text-sm text-slate-400">eller klikk for å velge en fil fra maskinen din</p>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
