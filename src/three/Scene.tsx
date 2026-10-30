'use client';

import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { mm } from '@/config/catalog';
import { CAMERA_FOV } from '@/config/shots';
import {
  laptopFinish,
  resolveChoice,
  selectMotionReduced,
  useExperience,
  watchFinish,
  type QualityTier,
} from '@/store/useExperience';
import { stepTier, TIER_SETTINGS } from '@/lib/quality';
import { CameraRig } from './CameraRig';
import { Lighting, Shadow } from './Lighting';
import { DeviceCallouts } from './DeviceCallouts';
import { PhoneModel } from './devices/Phone';
import { WatchModel } from './devices/Watch';
import { LaptopModel } from './devices/Laptop';

export default function Scene({ cap }: { cap: QualityTier }) {
  const tier = useExperience((s) => s.quality);
  const setRenderStatus = useExperience((s) => s.setRenderStatus);
  const settings = TIER_SETTINGS[tier];

  return (
    <Canvas
      // Render only when something changes; the rig keeps invalidating while in motion.
      frameloop="demand"
      dpr={settings.dpr}
      camera={{ fov: CAMERA_FOV, near: 0.5, far: 200, position: [0, 1, 16] }}
      // Transparent: the page (and the hero wordmark) shows through behind the products.
      gl={{ antialias: settings.antialias, alpha: true, powerPreference: 'high-performance', stencil: false }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          setRenderStatus('error', 'O contexto gráfico foi perdido.');
        });
      }}
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <AdaptiveQuality cap={cap} />
      <Lighting tier={tier} />
      <Suspense fallback={null}>
        <CameraRig phone={<PhoneStage tier={tier} />} watch={<WatchStage tier={tier} />} laptop={<LaptopStage tier={tier} />} />
        <ReadySignal />
      </Suspense>
    </Canvas>
  );
}

/** The selected iPhone; a model change answers with a quick half-turn so the swap reads as an event. */
function PhoneStage({ tier }: { tier: QualityTier }) {
  const choice = useExperience((s) => s.choice);
  const changes = useExperience((s) => s.phoneChanges);
  const reduced = useExperience(selectMotionReduced);
  const { phone, finish } = resolveChoice(choice);
  const { invalidate } = useThree();
  const turn = useRef<THREE.Group>(null);
  const kick = useRef(0);

  useEffect(() => {
    if (changes > 0 && !reduced) {
      kick.current = -Math.PI;
      invalidate();
    }
  }, [changes, reduced, invalidate]);

  useFrame((state, delta) => {
    const g = turn.current;
    if (!g) return;
    if (Math.abs(kick.current) > 1e-3) {
      kick.current = THREE.MathUtils.damp(kick.current, 0, 5, Math.min(delta, 0.1));
      g.rotation.y = kick.current;
      state.invalidate();
    } else if (g.rotation.y !== 0) {
      g.rotation.y = 0;
      kick.current = 0;
    }
  });

  return (
    <>
      <group ref={turn}>
        <PhoneModel spec={phone} finish={finish} />
        <DeviceCallouts spec={phone} />
      </group>
      <Shadow tier={tier} y={-mm(phone.mm.h) / 2 - 0.45} scale={6} />
    </>
  );
}

function WatchStage({ tier }: { tier: QualityTier }) {
  const id = useExperience((s) => s.watchFinishId);
  return (
    <>
      <WatchModel finish={watchFinish(id)} />
      <Shadow tier={tier} y={-2} scale={5} />
    </>
  );
}

function LaptopStage({ tier }: { tier: QualityTier }) {
  const id = useExperience((s) => s.laptopFinishId);
  return (
    <>
      <LaptopModel finish={laptopFinish(id)} open={1} />
      <Shadow tier={tier} y={0.001} scale={14} />
    </>
  );
}

/** Flags the scene as ready once the first frame is drawn - no artificial delay. */
function ReadySignal() {
  const done = useRef(false);
  const setRenderStatus = useExperience((s) => s.setRenderStatus);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    requestAnimationFrame(() => setRenderStatus('ready'));
  });
  return null;
}

/**
 * Measures frame time only across contiguous rendered frames (the loop is
 * on-demand, so idle gaps must not count as "slow frames") and steps the
 * quality tier down/up with hysteresis. Never exceeds the device cap.
 */
function AdaptiveQuality({ cap }: { cap: QualityTier }) {
  const setQuality = useExperience((s) => s.setQuality);
  const { invalidate } = useThree();
  const sample = useRef({ sum: 0, n: 0, swaps: 0, cooldown: 0 });

  useFrame((_, delta) => {
    const s = sample.current;
    if (delta > 0.25) return;
    if (s.cooldown > 0) {
      s.cooldown -= 1;
      return;
    }
    s.sum += delta;
    s.n += 1;
    if (s.n < 90) return;
    const avg = s.sum / s.n;
    s.sum = 0;
    s.n = 0;
    if (s.swaps > 4) return;
    const current = useExperience.getState().quality;
    if (avg > 1 / 32) {
      const next = stepTier(current, -1, cap);
      if (next !== current) {
        setQuality(next);
        s.swaps += 1;
        s.cooldown = 120;
      }
    } else if (avg < 1 / 58 && current !== cap) {
      setQuality(stepTier(current, 1, cap));
      s.swaps += 1;
      s.cooldown = 240;
    }
  });

  useEffect(() => invalidate(), [invalidate]);
  return null;
}
