'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import UploadZone from '@/components/UploadZone';
import StatsPanel from '@/components/StatsPanel';
import MeasureOverlay from '@/components/MeasureOverlay';
import ShellPanel from '@/components/ShellPanel';
import RoadmapSection from '@/components/RoadmapSection';
import { parseModelFile } from '@/lib/parseModel';
import { createShell } from '@/lib/shellModel';
import { downloadGeometryAsSTL } from '@/lib/exportModel';
import { getSingleMesh } from '@/lib/meshUtils';
import type { ModelStats } from '@/types/model';

const ModelViewer = dynamic(() => import('@/components/ModelViewer'), { ssr: false });

const MM_TO_INCH = 1 / 25.4;

export default function Home() {
  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const [stats, setStats] = useState<ModelStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [unit, setUnit] = useState<'mm' | 'in'>('mm');
  const [scale, setScale] = useState(1);

  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<THREE.Vector3[]>([]);

  const [shellGeometry, setShellGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [shellTriangleCount, setShellTriangleCount] = useState<number | null>(null);
  const [isHollow, setIsHollow] = useState(false);
  const [isShelling, setIsShelling] = useState(false);
  const [shellError, setShellError] = useState<string | null>(null);
  const [transparentView, setTransparentView] = useState(false);

  const resetShellState = useCallback(() => {
    setShellGeometry(null);
    setShellTriangleCount(null);
    setIsHollow(false);
    setShellError(null);
    setTransparentView(false);
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await parseModelFile(file);
        setObject(result.object);
        setStats(result.stats);
        setScale(1);
        setMeasurePoints([]);
        resetShellState();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kunne ikke lese filen.');
      } finally {
        setIsLoading(false);
      }
    },
    [resetShellState]
  );

  const handleReset = useCallback(() => {
    setObject(null);
    setStats(null);
    setError(null);
    setScale(1);
    setMeasureMode(false);
    setMeasurePoints([]);
    resetShellState();
  }, [resetShellState]);

  const handleScaleChange = useCallback((next: number) => {
    if (!Number.isFinite(next) || next <= 0) return;
    setScale(next);
    setMeasurePoints([]);
  }, []);

  const handleMeasureClick = useCallback((point: THREE.Vector3) => {
    setMeasurePoints((prev) => (prev.length >= 2 ? [point] : [...prev, point]));
  }, []);

  const handleToggleMeasure = useCallback(() => {
    setMeasureMode((prev) => !prev);
    setMeasurePoints([]);
  }, []);

  const singleMesh = useMemo(() => (object ? getSingleMesh(object) : null), [object]);

  const handleHollow = useCallback(
    (thicknessInCurrentUnit: number) => {
      if (!singleMesh || !(thicknessInCurrentUnit > 0)) return;

      setIsShelling(true);
      setShellError(null);

      // Defer so the "Behandler..." state actually gets a chance to paint
      // before the synchronous geometry work runs on the main thread.
      setTimeout(() => {
        try {
          const thicknessMm = unit === 'in' ? thicknessInCurrentUnit / MM_TO_INCH : thicknessInCurrentUnit;
          const nativeThickness = thicknessMm / scale;
          const result = createShell(singleMesh.geometry, nativeThickness);
          setShellGeometry(result.geometry);
          setShellTriangleCount(result.triangleCount);
          setIsHollow(true);
          setMeasurePoints([]);
        } catch (err) {
          setShellError(err instanceof Error ? err.message : 'Kunne ikke gjøre modellen hul.');
        } finally {
          setIsShelling(false);
        }
      }, 20);
    },
    [singleMesh, unit, scale]
  );

  const handleDownload = useCallback(() => {
    if (!singleMesh || !stats) return;
    const geometry = isHollow && shellGeometry ? shellGeometry : singleMesh.geometry;
    const baseName = stats.fileName.replace(/\.[^.]+$/, '');
    downloadGeometryAsSTL(geometry, scale, `${baseName}-meshforge.stl`);
  }, [singleMesh, stats, isHollow, shellGeometry, scale]);

  const displayObject = useMemo(() => {
    if (!object || !isHollow || !shellGeometry || !singleMesh) return object;
    const mesh = new THREE.Mesh(shellGeometry, singleMesh.material);
    mesh.rotation.copy(object.rotation);
    return mesh;
  }, [object, isHollow, shellGeometry, singleMesh]);

  const distance =
    measurePoints.length === 2 ? measurePoints[0].distanceTo(measurePoints[1]) : null;

  const maxDimension = stats
    ? Math.max(stats.dimensions.x, stats.dimensions.y, stats.dimensions.z) * scale
    : 1;
  const markerSize = Math.max(maxDimension * 0.012, 0.05);

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
          <ModelViewer
            object={displayObject}
            scale={scale}
            measureMode={measureMode}
            measurePoints={measurePoints}
            markerSize={markerSize}
            onMeasureClick={handleMeasureClick}
            transparent={transparentView}
          />
          {!object && <UploadZone onFile={handleFile} isLoading={isLoading} error={error} />}
          {object && stats && (
            <>
              <StatsPanel
                stats={stats}
                scale={scale}
                unit={unit}
                onUnitChange={setUnit}
                onScaleChange={handleScaleChange}
                onReset={handleReset}
              />
              <MeasureOverlay
                active={measureMode}
                onToggle={handleToggleMeasure}
                distance={distance}
                pointCount={measurePoints.length}
                unit={unit}
                onReset={() => setMeasurePoints([])}
              />
              <ShellPanel
                supported={singleMesh !== null}
                unit={unit}
                isHollow={isHollow}
                isProcessing={isShelling}
                error={shellError}
                triangleCount={shellTriangleCount}
                transparent={transparentView}
                onHollow={handleHollow}
                onToggleHollow={() => setIsHollow((prev) => !prev)}
                onToggleTransparent={() => setTransparentView((prev) => !prev)}
                onDownload={handleDownload}
              />
            </>
          )}
        </section>

        <RoadmapSection />
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        Bygget som en åpen, nettbasert erstatning for MoldBoxer og Meshcast.
      </footer>
    </div>
  );
}
