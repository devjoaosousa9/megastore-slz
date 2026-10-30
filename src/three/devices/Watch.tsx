'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mm, WATCH, type Finish } from '@/config/catalog';
import { canvasTexture, disposeAll, mix, roundedPanel, roundedSlab } from './shared';

type V3 = [number, number, number];

// Case in scene units (1 unit = 50 mm). Origin at the case centre, display on +Z, 12 o'clock on +Y.
const H = mm(WATCH.mm.h);
const W = mm(WATCH.mm.w);
const D = mm(WATCH.mm.d);
const BAND_W = mm(22);
const BAND_T = mm(3.2);

export function watchAnchors(): Record<'display' | 'crown' | 'band', V3> {
  return { display: [0, 0, D / 2 + 0.02], crown: [W / 2 + mm(2), mm(7), 0], band: [0, H / 2 + mm(10), -mm(6)] };
}

/** Watch face: black OLED, large time and two activity-style rings. No logos. */
function watchFace(tint: string) {
  return canvasTexture(512, 600, (ctx) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 512, 600);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '700 150px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillText('10:09', 256, 250);
    ctx.font = '600 36px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillStyle = mix(tint, '#ff9f0a', 0.5);
    ctx.fillText('SEX 30', 256, 100);
    const ring = (x: number, color: string, pct: number) => {
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.strokeStyle = `${color}44`;
      ctx.beginPath();
      ctx.arc(x, 430, 62, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(x, 430, 62, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      ctx.stroke();
    };
    ring(170, '#fa114f', 0.72);
    ring(342, '#00d4ff', 0.48);
  });
}

/** Sport band as one continuous strip looping behind the case (the classic product pose). */
function bandGeometry() {
  const pts = [
    [0, H / 2 - mm(1), -mm(1)],
    [0, H / 2 + mm(11), -mm(3)],
    [0, H / 2 + mm(26), -mm(16)],
    [0, H / 2 + mm(28), -mm(40)],
    [0, mm(16), -mm(62)],
    [0, -mm(16), -mm(62)],
    [0, -H / 2 - mm(28), -mm(40)],
    [0, -H / 2 - mm(26), -mm(16)],
    [0, -H / 2 - mm(11), -mm(3)],
    [0, -H / 2 + mm(1), -mm(1)],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const section = new THREE.Shape();
  const hw = BAND_W / 2;
  const ht = BAND_T / 2;
  const r = ht * 0.9;
  section.moveTo(-hw + r, -ht);
  section.lineTo(hw - r, -ht);
  section.quadraticCurveTo(hw, -ht, hw, -ht + r);
  section.lineTo(hw, ht - r);
  section.quadraticCurveTo(hw, ht, hw - r, ht);
  section.lineTo(-hw + r, ht);
  section.quadraticCurveTo(-hw, ht, -hw, ht - r);
  section.lineTo(-hw, -ht + r);
  section.quadraticCurveTo(-hw, -ht, -hw + r, -ht);
  return new THREE.ExtrudeGeometry(section, { steps: 160, bevelEnabled: false, extrudePath: curve, curveSegments: 6 });
}

export function WatchModel({ finish, screenOn = true }: { finish: Finish; screenOn?: boolean }) {
  const geo = useMemo(
    () => ({
      // Very soft edges: the aluminium case flows into the domed glass.
      caseBody: roundedSlab(W, H, D * 0.78, mm(10.5), mm(3.2), 32),
      glass: roundedSlab(W - mm(1.2), H - mm(1.2), mm(2.4), mm(9.6), mm(1.15), 32),
      display: roundedPanel(W - mm(5), H - mm(5), mm(7.5)),
      crown: new THREE.CylinderGeometry(mm(3.4), mm(3.4), mm(3.4), 48),
      crownKnurl: new THREE.TorusGeometry(mm(3.45), mm(0.18), 6, 72),
      button: new RoundedBoxGeometry(mm(2.2), mm(10), mm(3.2), 3, mm(1)),
      sensor: new THREE.SphereGeometry(mm(16), 48, 16, 0, Math.PI * 2, 0, 0.42),
      band: bandGeometry(),
      pin: new THREE.CylinderGeometry(mm(1.4), mm(1.4), mm(1.8), 20),
    }),
    [],
  );
  const face = useMemo(() => watchFace(finish.swatch), [finish.swatch]);

  const mat = useMemo(
    () => ({
      case: new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 0.38 }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#020203', roughness: 0.03, clearcoat: 1, metalness: 0.1 }),
      display: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 }),
      band: new THREE.MeshPhysicalMaterial({ roughness: 0.62, sheen: 0.5, clearcoat: 0.1 }),
      sensor: new THREE.MeshPhysicalMaterial({ color: '#111214', roughness: 0.15, clearcoat: 1 }),
    }),
    [],
  );

  useEffect(() => {
    mat.case.color.set(finish.frame);
    mat.band.color.set(mix(finish.frame, '#000000', 0.08));
    mat.band.sheenColor.set(mix(finish.frame, '#ffffff', 0.4));
  }, [finish, mat]);

  useEffect(() => {
    mat.display.map = screenOn ? face : null;
    mat.display.emissiveMap = screenOn ? face : null;
    mat.display.emissive.set(screenOn ? '#ffffff' : '#000000');
    mat.display.emissiveIntensity = screenOn ? 0.85 : 0;
    mat.display.color.set(screenOn ? '#ffffff' : '#000000');
    mat.display.needsUpdate = true;
  }, [screenOn, face, mat]);

  useEffect(() => () => disposeAll(face), [face]);
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);
  useEffect(() => () => Object.values(mat).forEach((m) => m.dispose()), [mat]);

  return (
    <group>
      <mesh geometry={geo.band} material={mat.band} />
      <mesh geometry={geo.pin} material={mat.case} position={[0, -H / 2 - mm(26.5), -mm(22)]} rotation-z={Math.PI / 2} />
      <mesh geometry={geo.caseBody} material={mat.case} position={[0, 0, -D * 0.08]} />
      <mesh geometry={geo.glass} material={mat.glass} position={[0, 0, D * 0.32]} />
      <mesh geometry={geo.display} material={mat.display} position={[0, 0, D * 0.32 + mm(1.25)]} />
      <group position={[W / 2 + mm(0.8), mm(7), 0]} rotation-z={Math.PI / 2}>
        <mesh geometry={geo.crown} material={mat.case} />
        <mesh geometry={geo.crownKnurl} material={mat.case} rotation-x={Math.PI / 2} position={[0, mm(0.6), 0]} />
      </group>
      <mesh geometry={geo.button} material={mat.case} position={[W / 2 + mm(0.2), -mm(8), 0]} />
      <mesh geometry={geo.sensor} material={mat.sensor} position={[0, 0, -D * 0.08 - D * 0.39 + mm(14.6)]} rotation-x={-Math.PI / 2} />
    </group>
  );
}
