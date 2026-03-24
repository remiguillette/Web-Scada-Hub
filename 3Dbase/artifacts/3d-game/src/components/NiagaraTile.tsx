import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";

export function NiagaraTile() {
  const meshRef = useRef<THREE.Mesh>(null);

  const colorMap = useLoader(TextureLoader, "/niagara-heightmap.png");

  const geometry = useMemo(() => {
    const WIDTH = 16;
    const HEIGHT = 10;
    const SEGMENTS_X = 256;
    const SEGMENTS_Y = 160;

    const geo = new THREE.PlaneGeometry(WIDTH, HEIGHT, SEGMENTS_X, SEGMENTS_Y);
    geo.rotateX(-Math.PI / 2);

    return geo;
  }, []);

  useMemo(() => {
    if (!colorMap) return;
    colorMap.wrapS = THREE.ClampToEdgeWrapping;
    colorMap.wrapT = THREE.ClampToEdgeWrapping;
    colorMap.minFilter = THREE.LinearFilter;
    colorMap.magFilter = THREE.LinearFilter;
  }, [colorMap]);

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial
          map={colorMap}
          color={new THREE.Color(0x1a3a6e)}
          roughness={0.8}
          metalness={0.0}
        />
      </mesh>
      <mesh geometry={geometry} position={[0, -0.01, 0]}>
        <meshStandardMaterial
          color={new THREE.Color(0x0d2244)}
          roughness={1}
          metalness={0}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <planeGeometry args={[16, 10]} />
        <meshStandardMaterial color={new THREE.Color(0x0d2244)} roughness={1} />
      </mesh>
    </group>
  );
}
