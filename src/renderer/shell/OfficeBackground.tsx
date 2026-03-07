import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { Group } from "three";

const MODEL_URL = "./minimalistic_modern_office.glb";

function OfficeModel() {
  const { scene } = useGLTF(MODEL_URL);
  const groupRef = useRef<Group>(null);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

export function OfficeBackground() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Canvas
        camera={{ position: [5, 3, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "#121212" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1} />
        <directionalLight position={[-3, 4, -3]} intensity={0.3} />
        <Suspense fallback={null}>
          <OfficeModel />
        </Suspense>
      </Canvas>
    </div>
  );
}
