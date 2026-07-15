'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Grid, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface ModelViewerProps {
  object: THREE.Object3D | null;
}

export default function ModelViewer({ object }: ModelViewerProps) {
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
            <primitive object={object} />
          </Bounds>
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
