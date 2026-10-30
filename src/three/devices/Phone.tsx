'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mm, type Finish, type PhoneSpec } from '@/config/catalog';
import { canvasTexture, disposeAll, mix, paintWallpaper, roundedPanel, roundedSlab } from './shared';

type V3 = [number, number, number];

/**
 * Layout of one model in scene units (1 unit = 50 mm). Origin at the geometric
 * centre, +Y = top, +X = right edge when looking at the screen, screen on +Z,
 * back glass on -Z. Seen from behind, the camera plateau is top-left, which in
 * these coordinates means +X.
 */
function layout(spec: PhoneSpec) {
  const h = mm(spec.mm.h);
  const w = mm(spec.mm.w);
  const d = mm(spec.mm.d);
  const corner = w * 0.135;
  const pro = spec.camera === 'triple';
  const plateau = w * (pro ? 0.5 : 0.43);
  const inset = mm(3.2);
  const camera: V3 = [w / 2 - inset - plateau / 2, h / 2 - inset - plateau / 2, -d / 2];
  const powerY = h / 2 - h * 0.25;
  return { h, w, d, corner, pro, plateau, camera, powerY };
}

export function phoneAnchors(spec: PhoneSpec): Record<'screen' | 'camera' | 'sideButton' | 'port' | 'frame', V3> {
  const L = layout(spec);
  return {
    screen: [0, L.h / 2 - mm(9), L.d / 2 + 0.01],
    camera: [L.camera[0] - L.plateau * 0.25, L.camera[1] + L.plateau * 0.24, -L.d / 2 - 0.06],
    sideButton: [L.w / 2 + 0.03, L.powerY, 0],
    port: [0, -L.h / 2 - 0.02, 0],
    frame: [-L.w / 2 - 0.02, 0, 0],
  };
}

/** Lens glass: layered optics with a coated blue-violet sheen and a sharp highlight. */
function lensTexture() {
  return canvasTexture(256, 256, (ctx) => {
    const c = 128;
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, 256, 256);
    const rings: [number, string][] = [
      [124, '#1a1d24'],
      [104, '#0d0f14'],
      [86, '#202534'],
      [70, '#0a0b10'],
      [48, '#1b1630'],
      [30, '#05060a'],
    ];
    rings.forEach(([r, col]) => {
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
    });
    const sheen = ctx.createRadialGradient(c - 30, c - 34, 4, c, c, 100);
    sheen.addColorStop(0, 'rgba(140,120,255,0.55)');
    sheen.addColorStop(0.35, 'rgba(60,90,200,0.18)');
    sheen.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, 256, 256);
    ctx.beginPath();
    ctx.ellipse(c - 34, c - 38, 14, 8, -0.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fill();
  });
}

/** Lock screen: tinted wallpaper, large clock and a Portuguese date. No icons, no logos. */
function lockScreen(spec: PhoneSpec, tint: string) {
  const W = 600;
  const H = Math.round((600 * spec.mm.h) / spec.mm.w);
  return canvasTexture(W, H, (ctx) => {
    paintWallpaper(ctx, W, H, tint);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.textAlign = 'center';
    ctx.font = '600 34px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillText('sexta-feira, 30 de outubro', W / 2, H * 0.16);
    ctx.font = '700 168px system-ui, -apple-system, Segoe UI, sans-serif';
    ctx.fillText('9:41', W / 2, H * 0.29);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.roundRect(W * 0.34, H * 0.965, W * 0.32, 10, 5);
    ctx.fill();
  });
}

function frameMaterialProps(frame: PhoneSpec['frame']) {
  if (frame === 'steel') return { metalness: 1, roughness: 0.1, clearcoat: 0.6 };
  if (frame === 'titanium') return { metalness: 1, roughness: 0.4, clearcoat: 0 };
  return { metalness: 1, roughness: 0.3, clearcoat: 0.2 };
}

function backMaterialProps(glass: PhoneSpec['glass']) {
  if (glass === 'glossy') return { roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.04, sheen: 0 };
  if (glass === 'frosted-tint') return { roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.35, sheen: 0.4 };
  return { roughness: 0.58, clearcoat: 0.15, clearcoatRoughness: 0.5, sheen: 0.6 };
}

export function PhoneModel({ spec, finish, screenOn = true }: { spec: PhoneSpec; finish: Finish; screenOn?: boolean }) {
  const L = useMemo(() => layout(spec), [spec]);

  const geo = useMemo(() => {
    const bevel = spec.frame === 'titanium' ? mm(0.9) : mm(0.5);
    const lensR = L.plateau * (L.pro ? 0.215 : 0.24);
    return {
      body: roundedSlab(L.w, L.h, L.d, L.corner, bevel, 32),
      back: roundedPanel(L.w - mm(1.4), L.h - mm(1.4), L.corner - mm(0.7)),
      front: roundedPanel(L.w - mm(1.0), L.h - mm(1.0), L.corner - mm(0.5)),
      screen: roundedPanel(L.w - mm(4.2), L.h - mm(4.2), L.corner - mm(2.2)),
      plateau: roundedSlab(L.plateau, L.plateau, mm(1.3), L.plateau * 0.24, mm(0.5), 24),
      ring: new THREE.CylinderGeometry(lensR, lensR * 1.02, mm(1.8), 48, 1, false),
      lens: new THREE.CircleGeometry(lensR * 0.84, 48),
      dot: new THREE.CircleGeometry(lensR * 0.32, 32),
      cutout:
        spec.cutout === 'island'
          ? roundedPanel(mm(19.5), mm(5.6), mm(2.8))
          : roundedPanel(mm(26), mm(5.4), mm(2.2)),
      power: new RoundedBoxGeometry(mm(1.1), mm(spec.mm.h * 0.12), mm(3.2), 3, mm(0.5)),
      volume: new RoundedBoxGeometry(mm(1.1), mm(spec.mm.h * 0.07), mm(3.2), 3, mm(0.5)),
      switch: new RoundedBoxGeometry(mm(1.1), mm(spec.actionButton ? 6.5 : 4.5), mm(3), 3, mm(0.5)),
      port:
        spec.port === 'usb-c'
          ? new RoundedBoxGeometry(mm(8.6), mm(2.6), mm(1.6), 4, mm(1.25))
          : new RoundedBoxGeometry(mm(7), mm(1.4), mm(1.6), 3, mm(0.6)),
      hole: new THREE.CylinderGeometry(mm(0.55), mm(0.55), mm(1.4), 12),
      lensR,
    };
  }, [spec, L]);

  const tex = useMemo(() => ({ lens: lensTexture(), screen: lockScreen(spec, finish.swatch) }), [spec, finish.swatch]);

  const mat = useMemo(
    () => ({
      frame: new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 0.3 }),
      back: new THREE.MeshPhysicalMaterial({ roughness: 0.5 }),
      plateau: new THREE.MeshPhysicalMaterial({ roughness: 0.08, clearcoat: 1 }),
      front: new THREE.MeshPhysicalMaterial({ color: '#030304', roughness: 0.05, clearcoat: 1, metalness: 0.1 }),
      screen: new THREE.MeshStandardMaterial({ color: '#000000', roughness: 0.2 }),
      ring: new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 0.2 }),
      lens: new THREE.MeshPhysicalMaterial({ roughness: 0.04, clearcoat: 1, metalness: 0.2 }),
      flash: new THREE.MeshPhysicalMaterial({ color: '#efe6cf', roughness: 0.55, transmission: 0, clearcoat: 1 }),
      black: new THREE.MeshStandardMaterial({ color: '#050506', roughness: 0.6 }),
      cutout: new THREE.MeshBasicMaterial({ color: '#000000' }),
    }),
    [],
  );

  useEffect(() => {
    const frame = frameMaterialProps(spec.frame);
    mat.frame.color.set(finish.frame);
    mat.frame.metalness = frame.metalness;
    mat.frame.roughness = frame.roughness;
    mat.frame.clearcoat = frame.clearcoat;
    const back = backMaterialProps(spec.glass);
    mat.back.color.set(finish.back);
    mat.back.roughness = back.roughness;
    mat.back.clearcoat = back.clearcoat;
    mat.back.clearcoatRoughness = back.clearcoatRoughness;
    mat.back.sheen = back.sheen;
    mat.back.sheenColor.set(mix(finish.back, '#ffffff', 0.4));
    // Pro models pair a matte back with a glossy camera plateau; others keep one surface.
    mat.plateau.color.set(spec.glass === 'matte' ? mix(finish.back, '#000000', 0.04) : finish.back);
    mat.plateau.roughness = spec.glass === 'glossy' ? 0.06 : spec.glass === 'matte' ? 0.12 : 0.3;
    mat.ring.color.set(spec.frame === 'aluminium' ? mix(finish.frame, '#ffffff', 0.1) : finish.frame);
    mat.ring.roughness = spec.frame === 'titanium' ? 0.32 : 0.16;
    mat.lens.map = tex.lens;
    mat.lens.needsUpdate = true;
  }, [finish, spec, mat, tex.lens]);

  useEffect(() => {
    mat.screen.map = screenOn ? tex.screen : null;
    mat.screen.emissiveMap = screenOn ? tex.screen : null;
    mat.screen.emissive.set(screenOn ? '#ffffff' : '#000000');
    mat.screen.emissiveIntensity = screenOn ? 0.9 : 0;
    mat.screen.color.set(screenOn ? '#ffffff' : '#000000');
    mat.screen.needsUpdate = true;
  }, [screenOn, mat, tex.screen]);

  useEffect(() => () => disposeAll(tex.lens, tex.screen), [tex]);
  useEffect(
    () => () => Object.values(geo).forEach((g) => g instanceof THREE.BufferGeometry && g.dispose()),
    [geo],
  );
  useEffect(() => () => Object.values(mat).forEach((m) => m.dispose()), [mat]);

  const { h, w, d, plateau, camera, powerY } = L;
  // Lens positions inside the plateau, as seen from behind (+X is the outer edge).
  const lenses: [number, number][] = L.pro
    ? [
        [0.25, 0.24],
        [0.25, -0.24],
        [-0.22, 0],
      ]
    : [
        [0.23, 0.23],
        [-0.23, -0.23],
      ];
  const flash: [number, number] = L.pro ? [-0.25, 0.3] : [-0.26, 0.27];
  const lidar: [number, number] | null = L.pro ? [-0.25, -0.3] : null;
  const pz = camera[2] - mm(0.65);

  return (
    <group>
      <mesh geometry={geo.body} material={mat.frame} />
      {/* Back glass */}
      <mesh geometry={geo.back} material={mat.back} position={[0, 0, -d / 2 - mm(0.12)]} rotation-y={Math.PI} />
      {/* Front glass and display */}
      <mesh geometry={geo.front} material={mat.front} position={[0, 0, d / 2 + mm(0.12)]} />
      <mesh geometry={geo.screen} material={mat.screen} position={[0, 0, d / 2 + mm(0.2)]} />
      <mesh
        geometry={geo.cutout}
        material={mat.cutout}
        position={[0, spec.cutout === 'island' ? h / 2 - mm(4.2) - mm(3.4) : h / 2 - mm(2.1) - mm(2.7), d / 2 + mm(0.28)]}
      />

      {/* Camera plateau */}
      <group position={[camera[0], camera[1], pz]}>
        <mesh geometry={geo.plateau} material={mat.plateau} />
        {lenses.map(([lx, ly], i) => (
          <group key={i} position={[lx * plateau, ly * plateau, -mm(1.4)]}>
            <mesh geometry={geo.ring} material={mat.ring} rotation-x={Math.PI / 2} />
            <mesh geometry={geo.lens} material={mat.lens} position={[0, 0, -mm(0.92)]} rotation-y={Math.PI} />
          </group>
        ))}
        <mesh
          geometry={geo.dot}
          material={mat.flash}
          position={[flash[0] * plateau, flash[1] * plateau, -mm(0.7)]}
          rotation-y={Math.PI}
        />
        {lidar && (
          <mesh
            geometry={geo.dot}
            material={mat.black}
            position={[lidar[0] * plateau, lidar[1] * plateau, -mm(0.7)]}
            rotation-y={Math.PI}
          />
        )}
        <mesh
          geometry={geo.hole}
          material={mat.black}
          position={[(L.pro ? -0.05 : 0.0) * plateau, (L.pro ? 0.3 : 0.02) * plateau, -mm(0.66)]}
          rotation-x={Math.PI / 2}
          scale={0.7}
        />
      </group>

      {/* Buttons: power on the right; switch/Action and volume on the left */}
      <mesh geometry={geo.power} material={mat.frame} position={[w / 2 + mm(0.25), powerY, 0]} />
      <mesh geometry={geo.switch} material={mat.frame} position={[-w / 2 - mm(0.25), h / 2 - h * 0.17, 0]} />
      <mesh geometry={geo.volume} material={mat.frame} position={[-w / 2 - mm(0.25), h / 2 - h * 0.29, 0]} />
      <mesh geometry={geo.volume} material={mat.frame} position={[-w / 2 - mm(0.25), h / 2 - h * 0.39, 0]} />

      {/* Bottom edge: port and speaker/mic grilles */}
      <mesh geometry={geo.port} material={mat.black} position={[0, -h / 2 + mm(0.5), 0]} />
      {[-1, 1].map((side) =>
        Array.from({ length: 6 }, (_, i) => (
          <mesh
            key={`${side}-${i}`}
            geometry={geo.hole}
            material={mat.black}
            position={[side * (mm(9) + i * mm(1.9)), -h / 2 + mm(0.4), 0]}
          />
        )),
      )}

      {/* Antenna bands */}
      {[
        [w / 2, h / 2 - h * 0.08],
        [-w / 2, h / 2 - h * 0.08],
        [w / 2, -h / 2 + h * 0.08],
        [-w / 2, -h / 2 + h * 0.08],
      ].map(([x, y], i) => (
        <mesh key={i} position={[x! + (x! > 0 ? mm(0.05) : -mm(0.05)), y!, 0]} material={mat.black}>
          <boxGeometry args={[mm(0.3), mm(1), d * 0.8]} />
        </mesh>
      ))}
    </group>
  );
}
