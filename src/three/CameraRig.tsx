'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { adaptShotForAspect, focusOf, POSITIONS } from '@/config/shots';
import { onSceneTargetChange, sceneTarget, targetToShot } from '@/animation/sceneTarget';
import { selectMotionReduced, useExperience } from '@/store/useExperience';
import { liveState } from './liveState';

type Device = keyof typeof POSITIONS;
const DEVICES: Device[] = ['phone', 'watch', 'laptop'];

/**
 * The single owner of camera and product transforms.
 *
 * Ownership rules (prevents scroll / controls / animation fighting):
 *  - Scroll director  -> writes `sceneTarget` (desired pose) only.
 *  - Configurator UI  -> writes `turntable` (yaw/pitch/zoom) in the store only.
 *  - CameraRig        -> the ONLY code that writes the camera, its look-at target
 *                        and each product's rotation, damping toward the composed
 *                        goal every frame (frame-rate independent, quaternions).
 */
export function CameraRig({ phone, watch, laptop }: Record<Device, ReactNode>) {
  const { camera, size, invalidate } = useThree();
  const groups = useRef<Partial<Record<Device, THREE.Group | null>>>({});
  const reduced = useExperience(selectMotionReduced);
  const reducedRef = useRef(reduced);
  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  const tmp = useMemo(
    () => ({
      camGoal: new THREE.Vector3(),
      lookGoal: new THREE.Vector3(),
      look: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      euler: new THREE.Euler(0, 0, 0, 'YXZ'),
      sway: { phone: 0, watch: 0, laptop: 0 } as Record<Device, number>,
      first: true,
    }),
    [],
  );

  useEffect(() => onSceneTargetChange(() => invalidate()), [invalidate]);
  useEffect(() => useExperience.subscribe(() => invalidate()), [invalidate]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const s = useExperience.getState();
    const isReduced = reducedRef.current;
    const raw = targetToShot(sceneTarget);
    const focus = focusOf(raw.target[0]);
    const shot = adaptShotForAspect(raw, size.width / Math.max(1, size.height), POSITIONS[focus][0]);
    const configuring = s.mode === 'configure';

    // Intro: the phone turns into place while the camera settles.
    liveState.reveal = isReduced ? 1 : Math.min(1, liveState.reveal + delta / 2);
    const intro = 1 - easeOutCubic(liveState.reveal);

    tmp.lookGoal.set(shot.target[0], shot.target[1], shot.target[2]);
    tmp.camGoal.set(shot.cam[0], shot.cam[1] + intro * 0.6, shot.cam[2] + intro * 3);
    if (configuring) tmp.camGoal.sub(tmp.lookGoal).multiplyScalar(1 / s.turntable.zoom).add(tmp.lookGoal);

    const k = isReduced || tmp.first ? 1 : 1 - Math.exp(-delta * 3.4);
    camera.position.lerp(tmp.camGoal, k);
    tmp.look.lerp(tmp.lookGoal, k);
    camera.lookAt(tmp.look);

    let settled =
      camera.position.distanceToSquared(tmp.camGoal) < 1e-6 &&
      tmp.look.distanceToSquared(tmp.lookGoal) < 1e-6 &&
      liveState.reveal >= 1;

    for (const d of DEVICES) {
      const g = groups.current[d];
      if (!g) continue;
      const spin = shot.spin[d];
      const turntable = configuring && d === 'phone';
      if (!isReduced && spin > 0 && !turntable) tmp.sway[d] += delta * 0.32 * spin;
      else tmp.sway[d] = THREE.MathUtils.damp(tmp.sway[d], Math.round(tmp.sway[d] / Math.PI) * Math.PI, 3, delta);
      const yaw =
        shot.yaw[d] +
        Math.sin(tmp.sway[d]) * 0.5 -
        (d === 'phone' ? intro * Math.PI * 0.9 : 0) +
        (turntable ? s.turntable.yaw : 0);
      tmp.quat.setFromEuler(tmp.euler.set(turntable ? s.turntable.pitch : 0, yaw, 0));
      g.quaternion.slerp(tmp.quat, isReduced ? 1 : 1 - Math.exp(-delta * 5));
      settled = settled && g.quaternion.angleTo(tmp.quat) < 1e-3 && Math.abs(Math.sin(tmp.sway[d])) < 1e-3;
      if (!isReduced && spin > 0 && !turntable) settled = false;
    }
    tmp.first = false;
    if (!settled) state.invalidate();
  });

  const children = { phone, watch, laptop };
  return (
    <>
      {DEVICES.map((d) => (
        <group key={d} position={POSITIONS[d]}>
          <group
            ref={(el) => {
              groups.current[d] = el;
            }}
            name={d}
          >
            {children[d]}
          </group>
        </group>
      ))}
    </>
  );
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
