import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { tokens } from "./tokens";

const MODEL_URL = "./minimalistic_modern_office.glb";

// Keyframes from debug session
const POS_A = new THREE.Vector3(10.25, 1.01, 3.06);
const POS_B = new THREE.Vector3(8.26, -0.17, -3.08);
const TARGET_A = new THREE.Vector3(5.59, -0.05, 1.29);
const TARGET_B = new THREE.Vector3(4.39, -0.50, -1.09);

const CYCLE_DURATION = 60; // seconds for one A->B leg

function OfficeModel() {
  const { scene } = useGLTF(MODEL_URL);
  return <primitive object={scene} />;
}

/** Smoothstep: ease-in then ease-out, 0 derivative at both ends. */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function CameraAnimation() {
  const { camera } = useThree();
  const elapsed = useRef(0);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((_state, delta) => {
    elapsed.current += delta;

    // Triangle wave: 0→1 over CYCLE_DURATION, then 1→0, repeat
    const phase = (elapsed.current % (CYCLE_DURATION * 2)) / CYCLE_DURATION;
    const linear = phase <= 1 ? phase : 2 - phase;
    const t = smoothstep(linear);

    camera.position.lerpVectors(POS_A, POS_B, t);
    target.lerpVectors(TARGET_A, TARGET_B, t);
    camera.lookAt(target);
  });

  return null;
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
        camera={{ position: [POS_A.x, POS_A.y, POS_A.z], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: tokens.colors.background }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1} />
        <directionalLight position={[-3, 4, -3]} intensity={0.3} />
        <Suspense fallback={null}>
          <OfficeModel />
        </Suspense>
        <CameraAnimation />
      </Canvas>
    </div>
  );
}
