import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

/* ── Materials ─────────────────────────────────────────────────── */
const BD = { color: '#0c0c14', metalness: 0.94, roughness: 0.08 };   // dark body
const JT = { color: '#1b1b2c', metalness: 0.84, roughness: 0.22 };   // joints (slightly lighter)
const VS = { color: '#000b1c', emissive: '#0088ff', emissiveIntensity: 0.9, metalness: 1.0, roughness: 0.0 }; // visor
const DT = { color: '#22ddff', emissive: '#22ddff', emissiveIntensity: 4.5, roughness: 1, metalness: 0 };    // glow dots
const CL = { color: '#0077ff', emissive: '#0077ff', emissiveIntensity: 2.0, roughness: 1, metalness: 0 };    // chest stripe

/* ── Reusable arm ───────────────────────────────────────────────── */
function Arm({ pivotRef }) {
  return (
    <group ref={pivotRef}>
      {/* upper arm */}
      <mesh position={[0, -0.225, 0]}>
        <cylinderGeometry args={[0.082, 0.072, 0.42, 18]} />
        <meshStandardMaterial {...BD} />
      </mesh>
      {/* elbow */}
      <mesh position={[0, -0.47, 0]}>
        <sphereGeometry args={[0.078, 18, 18]} />
        <meshStandardMaterial {...JT} />
      </mesh>
      {/* forearm */}
      <mesh position={[0, -0.72, 0]}>
        <cylinderGeometry args={[0.068, 0.058, 0.42, 18]} />
        <meshStandardMaterial {...BD} />
      </mesh>
      {/* hand */}
      <mesh position={[0, -0.97, 0]}>
        <sphereGeometry args={[0.072, 18, 18]} />
        <meshStandardMaterial {...BD} />
      </mesh>
    </group>
  );
}

/* ── Reusable leg ───────────────────────────────────────────────── */
function Leg({ x }) {
  const footX = x < 0 ? 0.02 : -0.02;
  return (
    <group position={[x, 0.24, 0]}>
      <mesh position={[0, -0.34, 0]}>
        <cylinderGeometry args={[0.091, 0.081, 0.56, 18]} />
        <meshStandardMaterial {...BD} />
      </mesh>
      <mesh position={[0, -0.65, 0]}>
        <sphereGeometry args={[0.092, 18, 18]} />
        <meshStandardMaterial {...JT} />
      </mesh>
      <mesh position={[0, -0.98, 0]}>
        <cylinderGeometry args={[0.076, 0.068, 0.60, 18]} />
        <meshStandardMaterial {...BD} />
      </mesh>
      <mesh position={[footX, -1.36, 0.06]}>
        <boxGeometry args={[0.165, 0.125, 0.28]} />
        <meshStandardMaterial {...BD} />
      </mesh>
    </group>
  );
}

/* ── Main robot ─────────────────────────────────────────────────── */
function Robot({ mouseRef, activeFeature }) {
  const root  = useRef();
  const head  = useRef();
  const lArm  = useRef(); // left shoulder pivot (screen-left, x=-0.52)
  const rArm  = useRef(); // right shoulder pivot (screen-right, x=+0.52)
  const sm    = useRef({ x: 0, y: 0 });
  // idle arms hang slightly outward
  const sa    = useRef({ l: -0.15, r: 0.15 });

  useFrame(({ clock }) => {
    const t  = clock.elapsedTime;
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    // smooth mouse position — tighter lerp for more responsive tracking
    sm.current.x += (mx - sm.current.x) * 0.12;
    sm.current.y += (my - sm.current.y) * 0.12;

    // head tracks cursor
    if (head.current) {
      head.current.rotation.y = sm.current.x * 0.46;
      head.current.rotation.x = -sm.current.y * 0.28;
    }

    // whole body: slight sway + idle float
    if (root.current) {
      root.current.rotation.y += (mx * 0.065 - root.current.rotation.y) * 0.07;
      root.current.position.y = Math.sin(t * 0.82) * 0.065 - 0.5;
    }

    // arm targets based on which feature card is hovered.
    // Left arm (pivot at x=-0.52): rotation.z NEGATIVE sweeps the arm OUTWARD to the left.
    // Right arm (pivot at x=+0.52): rotation.z POSITIVE sweeps the arm OUTWARD to the right.
    let lt = -0.15, rt = 0.15;
    if (activeFeature === 'tl')      lt = -1.85;   // left arm raised high-left
    else if (activeFeature === 'bl') lt = -1.1;    // left arm pointing left-horizontal
    else if (activeFeature === 'tr') rt =  1.85;   // right arm raised high-right
    else if (activeFeature === 'br') rt =  1.1;    // right arm pointing right-horizontal

    sa.current.l += (lt - sa.current.l) * 0.12;
    sa.current.r += (rt - sa.current.r) * 0.12;

    if (lArm.current) lArm.current.rotation.z = sa.current.l;
    if (rArm.current) rArm.current.rotation.z = sa.current.r;
  });

  return (
    <group ref={root}>

      {/* ── HEAD ── */}
      <group ref={head} position={[0, 1.82, 0]}>
        <mesh>
          <sphereGeometry args={[0.30, 40, 40]} />
          <meshStandardMaterial {...BD} />
        </mesh>
        {/* visor strip */}
        <mesh position={[0, 0.02, 0.245]}>
          <boxGeometry args={[0.34, 0.115, 0.04]} />
          <meshStandardMaterial {...VS} />
        </mesh>
        {/* eye glow dots */}
        {[-0.09, 0.09].map((x, i) => (
          <mesh key={i} position={[x, 0.02, 0.268]}>
            <boxGeometry args={[0.030, 0.050, 0.008]} />
            <meshStandardMaterial {...DT} />
          </mesh>
        ))}
        {/* chin guard */}
        <mesh position={[0, -0.175, 0.19]}>
          <boxGeometry args={[0.22, 0.085, 0.11]} />
          <meshStandardMaterial {...JT} />
        </mesh>
      </group>

      {/* ── NECK ── */}
      <mesh position={[0, 1.48, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 0.21, 20]} />
        <meshStandardMaterial {...JT} />
      </mesh>

      {/* ── TORSO ── */}
      <mesh position={[0, 0.88, 0]}>
        <capsuleGeometry args={[0.295, 0.55, 20, 40]} />
        <meshStandardMaterial {...BD} />
      </mesh>
      {/* chest panel */}
      <mesh position={[0, 0.97, 0.27]}>
        <boxGeometry args={[0.24, 0.20, 0.03]} />
        <meshStandardMaterial {...JT} />
      </mesh>
      {/* chest glow stripe */}
      <mesh position={[0, 0.97, 0.29]}>
        <boxGeometry args={[0.10, 0.022, 0.008]} />
        <meshStandardMaterial {...CL} />
      </mesh>

      {/* ── SHOULDER JOINTS ── */}
      {[-0.52, 0.52].map((x, i) => (
        <mesh key={i} position={[x, 1.22, 0]}>
          <sphereGeometry args={[0.12, 22, 22]} />
          <meshStandardMaterial {...JT} />
        </mesh>
      ))}

      {/* ── LEFT ARM (screen-left) ── */}
      <group position={[-0.52, 1.22, 0]}>
        <Arm pivotRef={lArm} />
      </group>

      {/* ── RIGHT ARM (screen-right) ── */}
      <group position={[0.52, 1.22, 0]}>
        <Arm pivotRef={rArm} />
      </group>

      {/* ── WAIST ── */}
      <mesh position={[0, 0.47, 0]}>
        <cylinderGeometry args={[0.19, 0.235, 0.17, 20]} />
        <meshStandardMaterial {...JT} />
      </mesh>

      {/* ── HIPS ── */}
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[0.47, 0.155, 0.26]} />
        <meshStandardMaterial {...BD} />
      </mesh>

      {/* ── LEGS ── */}
      <Leg x={-0.16} />
      <Leg x={ 0.16} />

    </group>
  );
}

/* ── Scene lighting ─────────────────────────────────────────────── */
function Lights() {
  return (
    <>
      {/* very dim cool ambient */}
      <ambientLight intensity={0.12} color="#0a0f22" />
      {/* key light: strong white from upper-right-front (creates helmet highlight) */}
      <directionalLight position={[3.5, 7, 3]} intensity={3.4} color="#ffffff" />
      {/* blue rim from behind-left (edge glow on shoulders/head) */}
      <directionalLight position={[-2.5, 2.5, -4]} intensity={1.6} color="#0055ee" />
      {/* soft purple fill from screen-left */}
      <directionalLight position={[-3, -1, 3]} intensity={0.45} color="#8899dd" />
      {/* bottom bounce */}
      <pointLight position={[0, -4, 2]} intensity={0.3} color="#1122bb" />
    </>
  );
}

/* ── Canvas export ──────────────────────────────────────────────── */
export default function BotScene({ mouseRef, activeFeature }) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0.2, 5.0], fov: 46 }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <Lights />
      <Robot mouseRef={mouseRef} activeFeature={activeFeature} />
    </Canvas>
  );
}
