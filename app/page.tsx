'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
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
import type { MeshHealthReport } from '@/lib/meshRepair';
import {
  analyzeMeshInWorker,
  runGeometryOp,
  thicknessInWorker,
  type GeometryOpResult,
  type ThicknessClientResult,
} from '@/lib/meshClient';
import OptimizePanel, { type OptimizeOp } from '@/components/OptimizePanel';
import type { MoldOptions, SplitAxis } from '@/lib/moldGenerator';
import {
  generateMoldInWorker,
  cutInWorker,
  engraveInWorker,
  type MoldClientResult,
  type CutClientResult,
} from '@/lib/moldClient';
import CutPanel from '@/components/CutPanel';
import EngravePanel from '@/components/EngravePanel';
import type { FaceSide } from '@/lib/csgTools';
import { analyzeDemoldability, recommendSplitAxis } from '@/lib/demoldAnalysis';
import { downloadGeometryAsSTL, downloadGeometry } from '@/lib/exportModel';
import { getSingleMesh, computeVolume, dominantFaceNormal, ensureOutwardWinding } from '@/lib/meshUtils';
import TransformPanel, { type RotateAxis } from '@/components/TransformPanel';
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

  const [optimizeBusy, setOptimizeBusy] = useState<OptimizeOp | null>(null);
  const [optimizeStatus, setOptimizeStatus] = useState<string | null>(null);

  // Guards async worker results against arriving after the model changed.
  const analysisToken = useRef(0);

  // Single-step undo: snapshot before each destructive geometry change.
  // Undoing swaps snapshot and current, so a second undo acts as redo.
  const undoSnapshot = useRef<{
    geometry: THREE.BufferGeometry;
    stats: ModelStats;
    health: MeshHealthReport | null;
  } | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const rememberForUndo = useCallback(
    (geometry: THREE.BufferGeometry | null, statsValue: ModelStats | null, healthValue: MeshHealthReport | null) => {
      if (!geometry || !statsValue) return;
      undoSnapshot.current = { geometry, stats: statsValue, health: healthValue };
      setCanUndo(true);
    },
    []
  );

  const [thicknessResult, setThicknessResult] = useState<ThicknessClientResult | null>(null);
  const [thicknessBusy, setThicknessBusy] = useState(false);
  const [showThickness, setShowThickness] = useState(false);

  // Also clears the thickness heat map - it belongs to the old geometry.
  const resetShellState = useCallback(() => {
    setShellGeometry(null);
    setShellTriangleCount(null);
    setIsHollow(false);
    setShellError(null);
    setTransparentView(false);
    setThicknessResult(null);
    setThicknessBusy(false);
    setShowThickness(false);
  }, []);

  const [cutResult, setCutResult] = useState<CutClientResult | null>(null);
  const [isCutting, setIsCutting] = useState(false);
  const [cutError, setCutError] = useState<string | null>(null);
  const [showCut, setShowCut] = useState(false);
  const [isEngraving, setIsEngraving] = useState(false);
  const [engraveError, setEngraveError] = useState<string | null>(null);

  // Clears every CSG-derived result (mold, cut, engrave errors).
  const resetMoldState = useCallback(() => {
    setMoldResult(null);
    setIsMoldGenerating(false);
    setMoldError(null);
    setShowMold(false);
    setCutResult(null);
    setIsCutting(false);
    setCutError(null);
    setShowCut(false);
    setIsEngraving(false);
    setEngraveError(null);
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await parseModelFile(file);
        analysisToken.current++;
        setObject(result.object);
        setStats(result.stats);
        setScale(1);
        setMeasureMode(false);
        setMeasurePoints([]);
        resetShellState();
        resetMoldState();
        setRepairedCount(null);
        setOptimizeStatus(null);
        undoSnapshot.current = null;
        setCanUndo(false);

        const mesh = getSingleMesh(result.object);
        setBaseGeometry(mesh?.geometry ?? null);
        setHealth(null);

        if (mesh) {
          const token = analysisToken.current;
          analyzeMeshInWorker(mesh.geometry)
            .then((report) => {
              if (analysisToken.current === token) setHealth(report);
            })
            .catch(() => {
              /* health stays unknown; tools still work */
            });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kunne ikke lese filen.');
      } finally {
        setIsLoading(false);
      }
    },
    [resetShellState, resetMoldState]
  );

  const handleReset = useCallback(() => {
    analysisToken.current++;
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
    setOptimizeStatus(null);
    undoSnapshot.current = null;
    setCanUndo(false);
  }, [resetShellState, resetMoldState]);

  const handleScaleChange = useCallback(
    (next: number) => {
      if (!Number.isFinite(next) || next <= 0) return;
      analysisToken.current++; // discard in-flight shell/mold built for the old scale
      setScale(next);
      setMeasurePoints([]);
      // Shell and mold were computed with wall/margin divided by the old
      // scale; keeping them would bake the new scale into old geometry.
      resetShellState();
      resetMoldState();
    },
    [resetShellState, resetMoldState]
  );

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

  const volumeNative = useMemo(
    () => (baseGeometry ? computeVolume(baseGeometry) : null),
    [baseGeometry]
  );

  /** Bakes an orientation change into the base geometry. Topology is
   *  untouched, so mesh health carries over; everything geometric resets. */
  const applyTransform = useCallback(
    (mutate: (geometry: THREE.BufferGeometry) => void) => {
      if (!baseGeometry) return;
      analysisToken.current++; // discard in-flight results for the old orientation
      rememberForUndo(baseGeometry, stats, health);
      const next = baseGeometry.clone();
      mutate(next);
      next.computeVertexNormals();
      next.computeBoundingBox();
      const size = next.boundingBox!.getSize(new THREE.Vector3());
      setBaseGeometry(next);
      setStats((prev) =>
        prev ? { ...prev, dimensions: { x: size.x, y: size.y, z: size.z } } : prev
      );
      resetShellState();
      resetMoldState();
      setMeasurePoints([]);
    },
    [baseGeometry, stats, health, rememberForUndo, resetShellState, resetMoldState]
  );

  const handleRotate = useCallback(
    (axis: RotateAxis) => {
      applyTransform((geometry) => {
        if (axis === 'x') geometry.rotateX(Math.PI / 2);
        else if (axis === 'y') geometry.rotateY(Math.PI / 2);
        else geometry.rotateZ(Math.PI / 2);
      });
    },
    [applyTransform]
  );

  const handleMirror = useCallback(() => {
    applyTransform((geometry) => {
      geometry.scale(-1, 1, 1);
      ensureOutwardWinding(geometry); // mirroring flips the winding
    });
  }, [applyTransform]);

  const handleLayFlat = useCallback(() => {
    applyTransform((geometry) => {
      const normal = dominantFaceNormal(geometry);
      if (!normal) return;
      const down = new THREE.Vector3();
      // Native down: -Z for Z-up formats (STL/PLY), -Y for Y-up (OBJ/GLB).
      if (stats?.format === 'obj' || stats?.format === 'glb') down.set(0, -1, 0);
      else down.set(0, 0, -1);
      const rotation = new THREE.Quaternion().setFromUnitVectors(normal, down);
      geometry.applyQuaternion(rotation);
    });
  }, [applyTransform, stats]);

  /** Runs a geometry-transforming worker op and swaps in the result,
   *  invalidating everything derived from the old geometry. */
  const applyGeometryOp = useCallback(
    async (op: 'repair' | 'simplify' | 'loose' | 'smooth', amount?: number) => {
      if (!baseGeometry) return null;
      const token = ++analysisToken.current;
      const result = await runGeometryOp(baseGeometry, op, amount);
      if (analysisToken.current !== token) return null; // model changed meanwhile
      rememberForUndo(baseGeometry, stats, health);
      setBaseGeometry(result.geometry);
      setHealth(result.report);
      setStats((prev) =>
        prev
          ? {
              ...prev,
              triangleCount: Math.round(result.triangleCount),
              vertexCount: result.vertexCount,
            }
          : prev
      );
      resetShellState();
      resetMoldState();
      setMeasurePoints([]);
      return result;
    },
    [baseGeometry, stats, health, rememberForUndo, resetShellState, resetMoldState]
  );

  const handleRepair = useCallback(async () => {
    setIsRepairing(true);
    try {
      const result = await applyGeometryOp('repair');
      if (result) setRepairedCount(result.detail);
    } catch {
      /* leave state untouched on failure */
    } finally {
      setIsRepairing(false);
    }
  }, [applyGeometryOp]);

  const handleOptimize = useCallback(
    async (op: OptimizeOp, amount?: number) => {
      const before = stats?.triangleCount ?? 0;
      setOptimizeBusy(op);
      setOptimizeStatus(null);
      try {
        const result: GeometryOpResult | null = await applyGeometryOp(op, amount);
        if (!result) return;
        if (op === 'simplify') {
          setOptimizeStatus(
            `${before.toLocaleString('nb-NO')} → ${Math.round(result.triangleCount).toLocaleString('nb-NO')} triangler`
          );
        } else if (op === 'loose') {
          setOptimizeStatus(
            result.detail > 0
              ? `Fjernet ${result.detail} løse del${result.detail === 1 ? '' : 'er'}`
              : 'Ingen løse deler funnet'
          );
        } else {
          setOptimizeStatus('Overflaten er glattet ut');
        }
      } catch (err) {
        setOptimizeStatus(err instanceof Error ? err.message : 'Operasjonen feilet.');
      } finally {
        setOptimizeBusy(null);
      }
    },
    [applyGeometryOp, stats]
  );

  const handleHollow = useCallback(
    (thicknessInCurrentUnit: number) => {
      if (!baseGeometry || !(thicknessInCurrentUnit > 0)) return;

      setIsShelling(true);
      setShellError(null);
      const token = analysisToken.current;

      // Defer so the "Behandler..." state actually gets a chance to paint
      // before the synchronous geometry work runs on the main thread.
      setTimeout(() => {
        try {
          if (analysisToken.current !== token) return; // model changed meanwhile
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

  const handleDownload = useCallback(
    (format: 'stl' | 'obj' | 'ply' = 'stl') => {
      if (!baseGeometry || !stats) return;
      const geometry = isHollow && shellGeometry ? shellGeometry : baseGeometry;
      const baseName = stats.fileName.replace(/\.[^.]+$/, '');
      downloadGeometry(geometry, scale, `${baseName}-meshforge`, format);
    },
    [baseGeometry, stats, isHollow, shellGeometry, scale]
  );

  const handleUndo = useCallback(() => {
    const snapshot = undoSnapshot.current;
    if (!snapshot || !baseGeometry || !stats) return;
    analysisToken.current++;
    undoSnapshot.current = { geometry: baseGeometry, stats, health };
    setBaseGeometry(snapshot.geometry);
    setStats(snapshot.stats);
    setHealth(snapshot.health);
    resetShellState();
    resetMoldState();
    setMeasurePoints([]);
    setRepairedCount(null);
    setOptimizeStatus(null);
  }, [baseGeometry, stats, health, resetShellState, resetMoldState]);

  const handleGenerateMold = useCallback(
    async (
      marginInCurrentUnit: number,
      axis: SplitAxis,
      panelOptions: Omit<MoldOptions, 'upAxis'>
    ) => {
      if (!baseGeometry || !(marginInCurrentUnit > 0)) return;
      // STL is Z-up, OBJ is Y-up - the pour funnel should exit the model's top.
      const options: MoldOptions = {
        ...panelOptions,
        upAxis: stats?.format === 'obj' || stats?.format === 'glb' ? 'y' : 'z',
      };

      setIsMoldGenerating(true);
      setMoldError(null);
      const token = analysisToken.current;

      try {
        const marginMm = unit === 'in' ? marginInCurrentUnit / MM_TO_INCH : marginInCurrentUnit;
        const nativeMargin = marginMm / scale;
        // Heavy CSG runs in a Web Worker so the viewer stays responsive.
        const result = await generateMoldInWorker(baseGeometry, nativeMargin, axis, options);
        if (analysisToken.current !== token) return; // model changed meanwhile
        setMoldResult(result);
        setShowMold(true);
        setMeasurePoints([]);
      } catch (err) {
        if (analysisToken.current === token) {
          setMoldError(err instanceof Error ? err.message : 'Kunne ikke generere mold.');
        }
      } finally {
        if (analysisToken.current === token) setIsMoldGenerating(false);
      }
    },
    [baseGeometry, unit, scale, stats]
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

  const handleCheckThickness = useCallback(
    async (minInUnit: number) => {
      if (!baseGeometry || !(minInUnit > 0)) return;
      setThicknessBusy(true);
      const token = analysisToken.current;
      try {
        const minNative = ((unit === 'in' ? minInUnit / MM_TO_INCH : minInUnit)) / scale;
        const result = await thicknessInWorker(baseGeometry, minNative);
        if (analysisToken.current !== token) return;
        setThicknessResult(result);
        setShowThickness(true);
        setShowMold(false);
        setShowCut(false);
        setMeasurePoints([]);
      } catch {
        /* leave state untouched on failure */
      } finally {
        if (analysisToken.current === token) setThicknessBusy(false);
      }
    },
    [baseGeometry, unit, scale]
  );

  const handleCut = useCallback(
    async (axis: SplitAxis, positionRatio: number, pins: boolean) => {
      if (!baseGeometry) return;
      setIsCutting(true);
      setCutError(null);
      const token = analysisToken.current;
      try {
        baseGeometry.computeBoundingBox();
        const box = baseGeometry.boundingBox!;
        const axisIndex = { x: 0, y: 1, z: 2 }[axis] as 0 | 1 | 2;
        const coord =
          box.min.getComponent(axisIndex) +
          (box.max.getComponent(axisIndex) - box.min.getComponent(axisIndex)) * positionRatio;
        const result = await cutInWorker(baseGeometry, axis, coord, pins);
        if (analysisToken.current !== token) return;
        setCutResult(result);
        setShowCut(true);
        setShowMold(false);
        setMeasurePoints([]);
      } catch (err) {
        if (analysisToken.current === token) {
          setCutError(err instanceof Error ? err.message : 'Kunne ikke kutte modellen.');
        }
      } finally {
        if (analysisToken.current === token) setIsCutting(false);
      }
    },
    [baseGeometry]
  );

  const handleDownloadCutHalf = useCallback(
    (half: 'A' | 'B') => {
      if (!cutResult || !stats) return;
      const geometry = half === 'A' ? cutResult.halfA : cutResult.halfB;
      const baseName = stats.fileName.replace(/\.[^.]+$/, '');
      downloadGeometryAsSTL(geometry, scale, `${baseName}-del-${half}.stl`);
    },
    [cutResult, stats, scale]
  );

  const handleEngrave = useCallback(
    async (
      text: string,
      face: FaceSide,
      sizeInUnit: number,
      depthInUnit: number,
      mode: 'engrave' | 'emboss'
    ) => {
      if (!baseGeometry) return;
      setIsEngraving(true);
      setEngraveError(null);
      const token = ++analysisToken.current;
      try {
        const toNative = (value: number) =>
          (unit === 'in' ? value / MM_TO_INCH : value) / scale;
        const result = await engraveInWorker(baseGeometry, {
          text,
          face,
          size: toNative(sizeInUnit),
          depth: toNative(depthInUnit),
          mode,
          upAxis: stats?.format === 'obj' || stats?.format === 'glb' ? 'y' : 'z',
        });
        if (analysisToken.current !== token) return;
        rememberForUndo(baseGeometry, stats, health);
        setBaseGeometry(result);
        const triangleCount = result.index
          ? result.index.count / 3
          : result.attributes.position.count / 3;
        setStats((prev) =>
          prev
            ? {
                ...prev,
                triangleCount: Math.round(triangleCount),
                vertexCount: result.attributes.position.count,
              }
            : prev
        );
        setHealth(null);
        analyzeMeshInWorker(result)
          .then((report) => {
            if (analysisToken.current === token) setHealth(report);
          })
          .catch(() => {});
        resetShellState();
        setMoldResult(null);
        setShowMold(false);
        setCutResult(null);
        setShowCut(false);
        setMeasurePoints([]);
      } catch (err) {
        if (analysisToken.current === token) {
          setEngraveError(err instanceof Error ? err.message : 'Graveringen feilet.');
        }
      } finally {
        setIsEngraving(false);
      }
    },
    [baseGeometry, unit, scale, stats, health, rememberForUndo, resetShellState]
  );

  const cutDisplayObject = useMemo(() => {
    if (!cutResult || !baseGeometry) return null;
    baseGeometry.computeBoundingBox();
    const size = baseGeometry.boundingBox!.getSize(new THREE.Vector3());
    const axisIndex = { x: 0, y: 1, z: 2 }[cutResult.axis] as 0 | 1 | 2;
    const offset = new THREE.Vector3();
    offset.setComponent(axisIndex, size.getComponent(axisIndex) * 0.12 + 1);

    const materialA = new THREE.MeshStandardMaterial({
      color: '#4f8ff7',
      roughness: 0.35,
      side: THREE.DoubleSide,
    });
    const materialB = new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      roughness: 0.35,
      side: THREE.DoubleSide,
    });
    const meshA = new THREE.Mesh(cutResult.halfA, materialA);
    const meshB = new THREE.Mesh(cutResult.halfB, materialB);
    meshA.position.copy(offset);
    meshB.position.copy(offset).multiplyScalar(-1);

    const group = new THREE.Group();
    group.add(meshA, meshB);
    if (stats?.format === 'stl' || stats?.format === 'ply') {
      group.rotation.x = -Math.PI / 2;
    }
    return group;
  }, [cutResult, baseGeometry, stats]);

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
    if (stats?.format === 'stl' || stats?.format === 'ply') {
      group.rotation.x = -Math.PI / 2;
    }
    return group;
  }, [moldResult, stats]);

  const displayObject = useMemo(() => {
    if (showMold && moldDisplayObject) return moldDisplayObject;
    if (showCut && cutDisplayObject) return cutDisplayObject;
    if (!object || !singleMesh) return object;
    if (showThickness && thicknessResult) {
      const mesh = new THREE.Mesh(
        thicknessResult.geometry,
        new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.55,
          metalness: 0.05,
          side: THREE.DoubleSide,
        })
      );
      mesh.rotation.copy(object.rotation);
      return mesh;
    }
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
  }, [showMold, moldDisplayObject, showCut, cutDisplayObject, showThickness, thicknessResult, object, singleMesh, isHollow, shellGeometry, baseGeometry]);

  const distance =
    measurePoints.length === 2 ? measurePoints[0].distanceTo(measurePoints[1]) : null;

  const maxDimension = stats
    ? Math.max(stats.dimensions.x, stats.dimensions.y, stats.dimensions.z) * scale
    : 1;
  const markerSize = Math.max(maxDimension * 0.012, 0.05);

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100">
      <header className="border-b border-slate-800/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" strokeWidth="1.5">
              <path d="M12 2 3 7v10l9 5 9-5V7L12 2Z" stroke="#f59e0b" />
              <path d="M12 22V12M12 12 3 7M12 12l9-5" stroke="#2dd4bf" />
            </svg>
            <div>
              <h1 className="font-mono text-base font-bold tracking-[0.3em] text-slate-100">
                MESHFORGE
              </h1>
              <p className="text-[11px] text-slate-500">3D-verktøy for makere og modellbyggere</p>
            </div>
          </div>
          <span className="tlabel rounded-full border border-slate-700 px-3 py-1">STL · OBJ · GLB · PLY</span>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-amber-500/60 via-teal-400/40 to-transparent" />
      </header>

      <main>
        <section
          className="relative w-full border-b border-slate-800/80"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
        >
          {/* On small screens the panel column flows below the viewer instead
              of overlaying it, so the model stays visible. */}
          <div className="relative h-[75vh] w-full overflow-hidden max-sm:h-[45vh]">
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
            {object && error && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-lg border border-red-500/50 bg-red-950/80 px-4 py-2 text-xs text-red-200 backdrop-blur-sm">
                {error}
              </div>
            )}
            {object && stats && (
              <MeasureOverlay
                active={measureMode}
                onToggle={handleToggleMeasure}
                distance={distance}
                pointCount={measurePoints.length}
                unit={unit}
                onReset={() => setMeasurePoints([])}
              />
            )}
          </div>
          {object && stats && (
            <>
              <aside className="space-y-3 p-4 sm:absolute sm:inset-y-0 sm:right-0 sm:w-72 sm:overflow-y-auto">
                <StatsPanel
                  stats={stats}
                  scale={scale}
                  unit={unit}
                  volumeNative={volumeNative}
                  onUnitChange={setUnit}
                  onScaleChange={handleScaleChange}
                  onDownload={handleDownload}
                  canUndo={canUndo}
                  onUndo={handleUndo}
                  onReset={handleReset}
                />
                <TransformPanel
                  supported={singleMesh !== null}
                  onRotate={handleRotate}
                  onMirror={handleMirror}
                  onLayFlat={handleLayFlat}
                />
                <RepairPanel
                  supported={singleMesh !== null}
                  health={health}
                  isRepairing={isRepairing}
                  lastRepairCount={repairedCount}
                  unit={unit}
                  thicknessBusy={thicknessBusy}
                  thicknessInfo={thicknessResult}
                  showThickness={showThickness}
                  onRepair={handleRepair}
                  onCheckThickness={handleCheckThickness}
                  onToggleShowThickness={() => setShowThickness((prev) => !prev)}
                />
                <OptimizePanel
                  supported={singleMesh !== null}
                  triangleCount={stats.triangleCount}
                  busy={optimizeBusy}
                  status={optimizeStatus}
                  onRun={handleOptimize}
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
                  onToggleHollow={() => {
                    setIsHollow((prev) => !prev);
                    setMeasurePoints([]);
                  }}
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
                  onToggleShowMold={() => {
                    setShowMold((prev) => !prev);
                    setMeasurePoints([]);
                  }}
                  onDownloadHalf={handleDownloadMoldHalf}
                />
                <CutPanel
                  supported={singleMesh !== null}
                  isCutting={isCutting}
                  error={cutError}
                  hasResult={cutResult !== null}
                  showCut={showCut}
                  onCut={handleCut}
                  onToggleShowCut={() => {
                    setShowCut((prev) => !prev);
                    setMeasurePoints([]);
                  }}
                  onDownloadHalf={handleDownloadCutHalf}
                />
                <EngravePanel
                  supported={singleMesh !== null}
                  unit={unit}
                  isEngraving={isEngraving}
                  error={engraveError}
                  onEngrave={handleEngrave}
                />
              </aside>
            </>
          )}
        </section>

        <RoadmapSection />
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center font-mono text-[11px] tracking-widest text-slate-600 uppercase">
        Meshforge · åpen, nettbasert erstatning for MoldBoxer og Meshcast
      </footer>
    </div>
  );
}
