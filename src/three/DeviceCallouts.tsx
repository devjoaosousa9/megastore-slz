'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import { mm, type PhoneSpec } from '@/config/catalog';
import { TOUR, type Dimension } from '@/config/tour';
import { useExperience } from '@/store/useExperience';
import { phoneAnchors } from './devices/Phone';

type V3 = [number, number, number];
const TICK = 0.07;

/** Measured extents of the selected phone, drawn like a technical drawing. */
function dimensionSpec(spec: PhoneSpec, d: Dimension) {
  const h = mm(spec.mm.h) / 2;
  const w = mm(spec.mm.w) / 2;
  const t = mm(spec.mm.d) / 2;
  const fmt = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mm`;
  const tickX = (p: V3): V3[] => [
    [p[0] - TICK, p[1], p[2]],
    [p[0] + TICK, p[1], p[2]],
  ];
  const tickY = (p: V3): V3[] => [
    [p[0], p[1] - TICK, p[2]],
    [p[0], p[1] + TICK, p[2]],
  ];
  if (d === 'height') {
    const x = -w - 0.35;
    return { line: [[x, -h, 0], [x, h, 0]] as V3[], ticks: [tickX([x, -h, 0]), tickX([x, h, 0])], label: [x - 0.1, 0, 0] as V3, text: fmt(spec.mm.h) };
  }
  if (d === 'width') {
    const y = -h - 0.35;
    return { line: [[-w, y, 0], [w, y, 0]] as V3[], ticks: [tickY([-w, y, 0]), tickY([w, y, 0])], label: [0, y - 0.05, 0] as V3, text: fmt(spec.mm.w) };
  }
  const y = -h - 0.35;
  return {
    line: [[w, y, -t], [w, y, t]] as V3[],
    ticks: [tickY([w, y, -t]), tickY([w, y, t])],
    label: [w, y - 0.05, 0] as V3,
    text: fmt(spec.mm.d),
  };
}

/**
 * Pins on the model and the selected phone's official measurements, shown for
 * the active tour step. They live in phone space, so they follow every camera
 * move. Decorative for assistive tech: the same facts are in the DOM copy.
 */
export function DeviceCallouts({ spec }: { spec: PhoneSpec }) {
  const step = useExperience((s) => s.tourStep);
  const anchors = useMemo(() => phoneAnchors(spec), [spec]);
  const active = TOUR[step];

  return (
    <group>
      {TOUR.map((t, i) => (
        <Html key={t.id} position={anchors[t.pin.anchor]} center zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
          <div className="pin3d" data-active={i === step} aria-hidden="true">
            <span className="pin3d__dot" />
            <span className="pin3d__label">{t.pin.label(spec)}</span>
          </div>
        </Html>
      ))}
      {(['height', 'width', 'depth'] as Dimension[]).map((d) => (
        <DimensionLine key={d} spec={spec} id={d} visible={active?.dimension === d} />
      ))}
    </group>
  );
}

function DimensionLine({ spec, id, visible }: { spec: PhoneSpec; id: Dimension; visible: boolean }) {
  const data = useMemo(() => dimensionSpec(spec, id), [spec, id]);
  const group = useRef<THREE.Group>(null);
  const opacity = useRef(0);

  useFrame((state, delta) => {
    const goal = visible ? 1 : 0;
    if (Math.abs(opacity.current - goal) < 0.01) opacity.current = goal;
    else {
      opacity.current = THREE.MathUtils.damp(opacity.current, goal, 8, Math.min(delta, 0.1));
      state.invalidate();
    }
    group.current?.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (m && 'opacity' in m) {
        // Annotations read on top of the model, like a drawing overlay.
        m.depthTest = false;
        m.transparent = true;
        m.opacity = opacity.current;
      }
    });
    if (group.current) group.current.visible = opacity.current > 0.01;
  });

  return (
    <group ref={group} renderOrder={10}>
      <Line points={data.line} color="#f5f5f2" lineWidth={1.5} />
      {data.ticks.map((t, i) => (
        <Line key={i} points={t} color="#f5f5f2" lineWidth={1.5} />
      ))}
      <Html position={data.label} center zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
        <span className="dim3d" data-visible={visible} aria-hidden="true">
          {data.text}
        </span>
      </Html>
    </group>
  );
}
