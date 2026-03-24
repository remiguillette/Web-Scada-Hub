import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import { NiagaraTile } from "./NiagaraTile";
import { OrbitalCamera } from "./OrbitalCamera";

function Lights() {
  return (
    <>
      <ambientLight intensity={2.5} color={new THREE.Color(0xffffff)} />
      <directionalLight
        position={[15, 30, 15]}
        intensity={4.0}
        color={new THREE.Color(0xfffde8)}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={80}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight
        position={[-10, 15, -8]}
        intensity={1.0}
        color={new THREE.Color(0xc8deff)}
      />
    </>
  );
}

function LoadingFallback() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[16, 10]} />
      <meshStandardMaterial color={new THREE.Color(0x5a8a5a)} roughness={1} />
    </mesh>
  );
}

export function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 14, 18], fov: 45, near: 0.1, far: 500 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.4,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      }}
      style={{ width: "100%", height: "100%" }}
    >
      <OrbitalCamera autoRotate autoRotateSpeed={0.25} />
      <Sky
        distance={450}
        sunPosition={[15, 30, 15]}
        inclination={0.52}
        azimuth={0.25}
        rayleigh={0.5}
        turbidity={4}
        mieCoefficient={0.003}
        mieDirectionalG={0.8}
      />
      <Lights />
      <Suspense fallback={<LoadingFallback />}>
        <NiagaraTile />
      </Suspense>
    </Canvas>
  );
}
