'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { LAPTOP, mm, type Finish } from '@/config/catalog';
import { canvasTexture, disposeAll, paintWallpaper, roundedPanel, roundedSlab } from './shared';

type V3 = [number, number, number];

// Scene units (1 unit = 50 mm). The base rests on y = 0, centred in X/Z; the
// keyboard faces +Y, the front edge is +Z and the hinge runs along the back edge (-Z).
const W = mm(LAPTOP.mm.w);
const DEPTH = mm(LAPTOP.mm.d);
const BASE_T = mm(6.6);
const LID_T = mm(4.4);
const CORNER = mm(11);
const OPEN_ANGLE = (110 * Math.PI) / 180;

export function laptopAnchors(): Record<'display' | 'keyboard' | 'trackpad' | 'ports', V3> {
  return {
    display: [0, DEPTH * 0.55, -DEPTH / 2 + mm(4)],
    keyboard: [0, BASE_T + 0.01, -mm(18)],
    trackpad: [0, BASE_T + 0.01, mm(58)],
    ports: [-W / 2 - 0.02, BASE_T / 2, -mm(70)],
  };
}

/** Key layout: rows of [count, width in key units]; the top row is the half-height function row. */
const ROWS: { keys: number[]; h: number }[] = [
  { keys: [1.5, ...Array(12).fill(1), 1], h: 0.5 },
  { keys: [...Array(13).fill(1), 1.5], h: 1 },
  { keys: [1.5, ...Array(13).fill(1)], h: 1 },
  { keys: [1.8, ...Array(11).fill(1), 1.7], h: 1 },
  { keys: [2.3, ...Array(10).fill(1), 2.2], h: 1 },
  { keys: [1, 1, 1, 1.25, 5, 1.25, 1, 1, 1, 1], h: 1 },
];

function keyMatrices() {
  const unit = mm(18.4);
  const gap = mm(2.2);
  const matrices: THREE.Matrix4[] = [];
  const totalW = Math.max(...ROWS.map((r) => r.keys.reduce((a, b) => a + b, 0))) * unit;
  let z = -DEPTH / 2 + mm(16);
  for (const row of ROWS) {
    const rowH = row.h * unit;
    let x = -totalW / 2;
    for (const k of row.keys) {
      const kw = k * unit;
      matrices.push(
        new THREE.Matrix4().compose(
          new THREE.Vector3(x + kw / 2, BASE_T + mm(0.35), z + rowH / 2),
          new THREE.Quaternion(),
          new THREE.Vector3((kw - gap) / unit, 1, (rowH - gap) / unit),
        ),
      );
      x += kw;
    }
    z += rowH;
  }
  return { matrices, wellW: totalW + mm(6), wellD: z - (-DEPTH / 2 + mm(16)) + mm(6), wellZ: (-DEPTH / 2 + mm(16) + z) / 2 };
}

function desktop(tint: string) {
  return canvasTexture(1280, 832, (ctx) => {
    paintWallpaper(ctx, 1280, 832, tint);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, 0, 1280, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.roundRect(420, 772, 440, 46, 14);
    ctx.fill();
  });
}

export function LaptopModel({ finish, open = 1, screenOn = true }: { finish: Finish; open?: number; screenOn?: boolean }) {
  const keys = useMemo(() => keyMatrices(), []);
  const geo = useMemo(
    () => ({
      base: roundedSlab(W, DEPTH, BASE_T, CORNER, mm(1.6), 32),
      well: roundedPanel(keys.wellW, keys.wellD, mm(3)),
      key: new RoundedBoxGeometry(mm(18.4), mm(0.8), mm(18.4), 2, mm(0.6)),
      trackpad: roundedPanel(mm(134), mm(83), mm(4)),
      lid: roundedSlab(W, DEPTH, LID_T, CORNER, mm(1.2), 32),
      bezel: roundedPanel(W - mm(3), DEPTH - mm(3), CORNER - mm(1.5)),
      display: roundedPanel(W - mm(13), DEPTH - mm(17), mm(6)),
      notch: roundedPanel(mm(31), mm(7), mm(2.5)),
      hinge: new THREE.CylinderGeometry(mm(3.2), mm(3.2), W - mm(70), 24),
      port: new RoundedBoxGeometry(mm(1), mm(3), mm(9), 3, mm(1.2)),
    }),
    [keys],
  );
  const screen = useMemo(() => desktop(finish.swatch), [finish.swatch]);

  const mat = useMemo(
    () => ({
      alu: new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 0.34 }),
      well: new THREE.MeshStandardMaterial({ color: '#0b0b0c', roughness: 0.8 }),
      key: new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.55 }),
      trackpad: new THREE.MeshPhysicalMaterial({ metalness: 0.6, roughness: 0.22, clearcoat: 0.6 }),
      bezel: new THREE.MeshPhysicalMaterial({ color: '#030304', roughness: 0.05, clearcoat: 1 }),
      display: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 }),
      black: new THREE.MeshStandardMaterial({ color: '#050506', roughness: 0.5 }),
      hinge: new THREE.MeshStandardMaterial({ color: '#1a1a1c', roughness: 0.5, metalness: 0.4 }),
    }),
    [],
  );

  const keysRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = keysRef.current;
    if (!m) return;
    keys.matrices.forEach((mat4, i) => m.setMatrixAt(i, mat4));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [keys]);

  useEffect(() => {
    mat.alu.color.set(finish.frame);
    mat.trackpad.color.set(finish.frame);
  }, [finish, mat]);

  useEffect(() => {
    mat.display.map = screenOn ? screen : null;
    mat.display.emissiveMap = screenOn ? screen : null;
    mat.display.emissive.set(screenOn ? '#ffffff' : '#000000');
    mat.display.emissiveIntensity = screenOn ? 0.85 : 0;
    mat.display.color.set(screenOn ? '#ffffff' : '#000000');
    mat.display.needsUpdate = true;
  }, [screenOn, screen, mat]);

  useEffect(() => () => disposeAll(screen), [screen]);
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);
  useEffect(() => () => Object.values(mat).forEach((m) => m.dispose()), [mat]);

  // Lid pivots on the hinge: closed = lying on the base (rotation 0), open = OPEN_ANGLE.
  const hingeRotation = -OPEN_ANGLE * Math.min(1, Math.max(0, open));

  return (
    <group>
      {/* Base: slab lying flat (the slab is built in XY, so rotate it onto XZ). */}
      <mesh geometry={geo.base} material={mat.alu} rotation-x={-Math.PI / 2} position={[0, BASE_T / 2, 0]} />
      <mesh geometry={geo.well} material={mat.well} rotation-x={-Math.PI / 2} position={[0, BASE_T + mm(0.05), keys.wellZ]} />
      <instancedMesh ref={keysRef} args={[geo.key, mat.key, keys.matrices.length]} frustumCulled={false} />
      <mesh
        geometry={geo.trackpad}
        material={mat.trackpad}
        rotation-x={-Math.PI / 2}
        position={[0, BASE_T + mm(0.05), DEPTH / 2 - mm(52)]}
      />
      {/* Ports on the left edge: MagSafe and two USB-C */}
      {[-mm(95), -mm(78), -mm(64)].map((z, i) => (
        <mesh key={i} geometry={geo.port} material={mat.black} position={[-W / 2 + mm(0.3), BASE_T / 2, z]} />
      ))}
      <mesh geometry={geo.hinge} material={mat.hinge} rotation-z={Math.PI / 2} position={[0, BASE_T, -DEPTH / 2 + mm(4)]} />

      {/* Lid hinged on the back edge */}
      <group position={[0, BASE_T, -DEPTH / 2 + mm(4)]} rotation-x={hingeRotation}>
        <group position={[0, LID_T / 2, DEPTH / 2 - mm(4)]}>
          <mesh geometry={geo.lid} material={mat.alu} rotation-x={-Math.PI / 2} />
          {/* Inside of the lid faces down when closed (-Y in lid space). */}
          <mesh geometry={geo.bezel} material={mat.bezel} rotation-x={Math.PI / 2} position={[0, -LID_T / 2 - mm(0.05), 0]} />
          <mesh
            geometry={geo.display}
            material={mat.display}
            rotation-x={Math.PI / 2}
            position={[0, -LID_T / 2 - mm(0.1), mm(3)]}
          />
          {/* Notch at the top of the display (the far end of the lid from the hinge). */}
          <mesh geometry={geo.notch} material={mat.bezel} rotation-x={Math.PI / 2} position={[0, -LID_T / 2 - mm(0.15), DEPTH / 2 - mm(4.5)]} />
        </group>
      </group>
    </group>
  );
}
