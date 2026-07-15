'use client';

import { Suspense } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { Bounds, Grid, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface ModelViewerProps {
  object: THREE.Object3D | null;
  scale: number;
  measureMode: boolean;
  measurePoints: THREE.Vector3[];
  markerSize: number;
  onMeasureClick: (point: THREE.Vector3) => void;
}

export default function ModelViewer({
  object,
  scale,
  measureMode,
  measurePoints,
  markerSize,
  onMeasureClick,
}: ModelViewerProps) {
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!measureMode) return;
    event.stopPropagation();
    onMeasureClick(event.point.clone());
  };

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [120, 90, 120], fov: 45 }}
      className="absolute inset-0"
    >
      <color attach="background" args={['#05070d']} />
      <fog attach="fog" args={['#05070d', 250, 700]} />

      {object ? (
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[100, 150, 100]} intensity={1.1} />
          <directionalLight position={[-100, 60, -80]} intensity={0.4} />
          <Bounds key={object.uuid} fit clip observe margin={1.4}>
            <primitive object={object} scale={scale} onClick={handleClick} />
          </Bounds>

          {measurePoints.map((point, index) => (
            <mesh position={point} key={index}>
              <sphereGeometry args={[markerSize, 16, 16]} />
              <meshBasicMaterial color="#facc15" depthTest={false} />
            </mesh>
          ))}

          {measurePoints.length === 2 && (
            <Line points={measurePoints} color="#facc15" lineWidth={2} depthTest={false} />
          )}
        </Suspense>
      ) : (
        <>
          <ambientLight intensity={0.4} />
          <directionalLight position={[100, 150, 100]} intensity={0.8} />
          <Grid
            args={[300, 300]}
            cellColor="#1e293b"
            sectionColor="#334155"
            fadeDistance={350}
            infiniteGrid
          />
        </>
      )}

      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}
