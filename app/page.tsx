'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import UploadZone from '@/components/UploadZone';
import StatsPanel from '@/components/StatsPanel';
import RoadmapSection from '@/components/RoadmapSection';
import { parseModelFile } from '@/lib/parseModel';
import type { ModelStats } from '@/types/model';

const ModelViewer = dynamic(() => import('@/components/ModelViewer'), { ssr: false });

export default function Home() {
  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const [stats, setStats] = useState<ModelStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await parseModelFile(file);
      setObject(result.object);
      setStats(result.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke lese filen.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setObject(null);
    setStats(null);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100">
      <header className="border-b border-slate-800/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">MeshForge</h1>
            <p className="text-xs text-slate-400">3D-verktøy for makere og modellbyggere</p>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
            STL · OBJ
          </span>
        </div>
      </header>

      <main>
        <section className="relative h-[75vh] w-full overflow-hidden border-b border-slate-800/80">
          <ModelViewer object={object} />
          {!object && <UploadZone onFile={handleFile} isLoading={isLoading} error={error} />}
          {object && stats && <StatsPanel stats={stats} onReset={handleReset} />}
        </section>

        <RoadmapSection />
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        Bygget som en åpen, nettbasert erstatning for MoldBoxer og Meshcast.
      </footer>
    </div>
  );
}
