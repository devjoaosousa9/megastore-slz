'use client';

import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import type { QualityTier } from '@/store/useExperience';

/**
 * Product-photography lighting: softboxes rendered once into an environment map
 * (no HDRI download) give glass and metal their reflections; two lights add form.
 * Shared by every product in the scene.
 */
export function Lighting({ tier }: { tier: QualityTier }) {
  const envRes = tier === 'high' ? 256 : tier === 'medium' ? 128 : 64;
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[4, 6, 6]} intensity={1.4} />
      <directionalLight position={[-6, 2, -4]} intensity={0.5} color="#dfe6ff" />
      <Environment resolution={envRes} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 7, 2]} rotation-x={Math.PI / 2} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[-8, 2, 3]} rotation-y={Math.PI / 2} scale={[14, 2.5, 1]} />
        <Lightformer form="rect" intensity={1.3} position={[8, 1, 4]} rotation-y={-Math.PI / 2} scale={[14, 1.6, 1]} />
        <Lightformer form="rect" intensity={0.8} position={[0, 2, -9]} scale={[12, 4, 1]} />
        <Lightformer form="ring" intensity={0.6} position={[3, 4, 8]} scale={3} />
      </Environment>
    </>
  );
}

/** Soft grounding shadow under a product (skipped on low-tier GPUs). */
export function Shadow({ tier, y, scale }: { tier: QualityTier; y: number; scale: number }) {
  if (tier === 'low') return null;
  return (
    <ContactShadows
      position={[0, y, 0]}
      opacity={0.32}
      scale={scale}
      blur={2.6}
      far={4}
      resolution={tier === 'high' ? 512 : 256}
      frames={Infinity}
    />
  );
}
