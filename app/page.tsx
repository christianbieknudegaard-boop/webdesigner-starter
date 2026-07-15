'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import UploadZone from '@/components/UploadZone';
import StatsPanel from '@/components/StatsPanel';
import MeasureOverlay from '@/components/MeasureOverlay';
import ShellPanel from '@/components/ShellPanel';
import RepairPanel from '@/components/RepairPanel';
import MoldPanel from '@/components/MoldPanel';
import RoadmapSection from '@/components/RoadmapSection';
import { parseModelFile } from '@/lib/parseModel';
import { createShell } from '@/lib/shellModel';
import { analyzeMesh, repairMesh, type MeshHealthReport } from '@/lib/meshRepair';
import type { MoldOptions, SplitAxis } from '@/lib/moldGenerator';
import { generateMoldInWorker, type MoldClientResult } from '@/lib/moldClient';
import { analyzeDemoldability, recommendSplitAxis } from '@/lib/demoldAnalysis';
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

  const [baseGeometry, setBaseGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [health, setHealth] = useState<MeshHealthReport | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairedCount, setRepairedCount] = useState<number | null>(null);

  const [shellGeometry, setShellGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [shellTriangleCount, setShellTriangleCount] = useState<number | null>(null);
  const [isHollow, setIsHollow] = useState(false);
  const [isShelling, setIsShelling] = useState(false);
  const [shellError, setShellError] = useState<string | null>(null);
  const [transparentView, setTransparentView] = useState(false);

  const [moldResult, setMoldResult] = useState<MoldClientResult | null>(null);
  const [isMoldGenerating, setIsMoldGenerating] = useState(false);
  const [moldError, setMoldError] = useState<string | null>(null);
  const [showMold, setShowMold] = useState(false);

  const resetShellState = useCallback(() => {
    setShellGeometry(null);
    setShellTriangleCount(null);
    setIsHollow(false);
    setShellError(null);
    setTransparentView(false);
  }, []);

  const resetMoldState = useCallback(() => {
    setMoldResult(null);
    setIsMoldGenerating(false);
    setMoldError(null);
    setShowMold(false);
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
        resetMoldState();
        setRepairedCount(null);

        const mesh = getSingleMesh(result.object);
        setBaseGeometry(mesh?.geometry ?? null);
        setHealth(mesh ? analyzeMesh(mesh.geometry) : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kunne ikke lese filen.');
      } finally {
        setIsLoading(false);
      }
    },
    [resetShellState, resetMoldState]
  );

  const handleReset = useCallback(() => {
    setObject(null);
    setStats(null);
    setError(null);
    setScale(1);
    setMeasureMode(false);
    setMeasurePoints([]);
    resetShellState();
    resetMoldState();
    setBaseGeometry(null);
    setHealth(null);
    setRepairedCount(null);
  }, [resetShellState, resetMoldState]);

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

  const demoldReports = useMemo(
    () => (baseGeometry ? analyzeDemoldability(baseGeometry) : null),
    [baseGeometry]
  );
  const recommendedAxis = useMemo(
    () => (demoldReports ? recommendSplitAxis(demoldReports) : null),
    [demoldReports]
  );

  const handleRepair = useCallback(() => {
    if (!baseGeometry) return;
    setIsRepairing(true);

    setTimeout(() => {
      try {
        const result = repairMesh(baseGeometry);
        setBaseGeometry(result.geometry);
        setHealth(analyzeMesh(result.geometry));
        setRepairedCount(result.holesFilled);
        resetShellState();
        resetMoldState();
        setMeasurePoints([]);
      } finally {
        setIsRepairing(false);
      }
    }, 20);
  }, [baseGeometry, resetShellState, resetMoldState]);

  const handleHollow = useCallback(
    (thicknessInCurrentUnit: number) => {
      if (!baseGeometry || !(thicknessInCurrentUnit > 0)) return;

      setIsShelling(true);
      setShellError(null);

      // Defer so the "Behandler..." state actually gets a chance to paint
      // before the synchronous geometry work runs on the main thread.
      setTimeout(() => {
        try {
          const thicknessMm = unit === 'in' ? thicknessInCurrentUnit / MM_TO_INCH : thicknessInCurrentUnit;
          const nativeThickness = thicknessMm / scale;
          const result = createShell(baseGeometry, nativeThickness);
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
    [baseGeometry, unit, scale]
  );

  const handleDownload = useCallback(() => {
    if (!baseGeometry || !stats) return;
    const geometry = isHollow && shellGeometry ? shellGeometry : baseGeometry;
    const baseName = stats.fileName.replace(/\.[^.]+$/, '');
    downloadGeometryAsSTL(geometry, scale, `${baseName}-meshforge.stl`);
  }, [baseGeometry, stats, isHollow, shellGeometry, scale]);

  const handleGenerateMold = useCallback(
    async (marginInCurrentUnit: number, axis: SplitAxis, options: MoldOptions) => {
      if (!baseGeometry || !(marginInCurrentUnit > 0)) return;

      setIsMoldGenerating(true);
      setMoldError(null);

      try {
        const marginMm = unit === 'in' ? marginInCurrentUnit / MM_TO_INCH : marginInCurrentUnit;
        const nativeMargin = marginMm / scale;
        // Heavy CSG runs in a Web Worker so the viewer stays responsive.
        const result = await generateMoldInWorker(baseGeometry, nativeMargin, axis, options);
        setMoldResult(result);
        setShowMold(true);
        setMeasurePoints([]);
      } catch (err) {
        setMoldError(err instanceof Error ? err.message : 'Kunne ikke generere mold.');
      } finally {
        setIsMoldGenerating(false);
      }
    },
    [baseGeometry, unit, scale]
  );

  const handleDownloadMoldHalf = useCallback(
    (half: 'A' | 'B') => {
      if (!moldResult || !stats) return;
      const geometry = half === 'A' ? moldResult.halfA : moldResult.halfB;
      const baseName = stats.fileName.replace(/\.[^.]+$/, '');
      downloadGeometryAsSTL(geometry, scale, `${baseName}-mold-${half}.stl`);
    },
    [moldResult, stats, scale]
  );

  const moldDisplayObject = useMemo(() => {
    if (!moldResult) return null;

    const axisIndex = { x: 0, y: 1, z: 2 }[moldResult.splitAxis] as 0 | 1 | 2;
    const gap = moldResult.boxSize[moldResult.splitAxis] * 0.15;
    const offset = new THREE.Vector3();
    offset.setComponent(axisIndex, gap);

    const materialA = new THREE.MeshStandardMaterial({
      color: '#2dd4bf',
      roughness: 0.4,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const materialB = new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      roughness: 0.4,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    const meshA = new THREE.Mesh(moldResult.halfA, materialA);
    const meshB = new THREE.Mesh(moldResult.halfB, materialB);
    meshA.position.copy(offset);
    meshB.position.copy(offset).multiplyScalar(-1);

    const group = new THREE.Group();
    group.add(meshA, meshB);
    if (stats?.format === 'stl') {
      group.rotation.x = -Math.PI / 2;
    }
    return group;
  }, [moldResult, stats]);

  const displayObject = useMemo(() => {
    if (showMold && moldDisplayObject) return moldDisplayObject;
    if (!object || !singleMesh) return object;
    if (isHollow && shellGeometry) {
      const mesh = new THREE.Mesh(shellGeometry, singleMesh.material);
      mesh.rotation.copy(object.rotation);
      return mesh;
    }
    if (baseGeometry && baseGeometry !== singleMesh.geometry) {
      const mesh = new THREE.Mesh(baseGeometry, singleMesh.material);
      mesh.rotation.copy(object.rotation);
      return mesh;
    }
    return object;
  }, [showMold, moldDisplayObject, object, singleMesh, isHollow, shellGeometry, baseGeometry]);

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
              <MeasureOverlay
                active={measureMode}
                onToggle={handleToggleMeasure}
                distance={distance}
                pointCount={measurePoints.length}
                unit={unit}
                onReset={() => setMeasurePoints([])}
              />
              <aside className="absolute inset-y-0 right-0 w-72 space-y-3 overflow-y-auto p-4 max-sm:w-64">
                <StatsPanel
                  stats={stats}
                  scale={scale}
                  unit={unit}
                  onUnitChange={setUnit}
                  onScaleChange={handleScaleChange}
                  onReset={handleReset}
                />
                <RepairPanel
                  supported={singleMesh !== null}
                  health={health}
                  isRepairing={isRepairing}
                  lastRepairCount={repairedCount}
                  onRepair={handleRepair}
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
                <MoldPanel
                  supported={singleMesh !== null}
                  unit={unit}
                  isGenerating={isMoldGenerating}
                  error={moldError}
                  hasResult={moldResult !== null}
                  showMold={showMold}
                  demold={demoldReports}
                  recommendedAxis={recommendedAxis}
                  siliconeMl={
                    moldResult ? (moldResult.siliconeVolume * scale ** 3) / 1000 : null
                  }
                  onGenerate={handleGenerateMold}
                  onToggleShowMold={() => setShowMold((prev) => !prev)}
                  onDownloadHalf={handleDownloadMoldHalf}
                />
              </aside>
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
