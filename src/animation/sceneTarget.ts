import { SHOTS, type Shot } from '@/config/shots';

/**
 * Mutable, non-React target pose written by the scroll director and read by the
 * CameraRig every frame. Flat numbers so the central GSAP timeline can tween them.
 */
export interface SceneTarget {
  camX: number;
  camY: number;
  camZ: number;
  tgtX: number;
  tgtY: number;
  tgtZ: number;
  yawPhone: number;
  yawWatch: number;
  yawLaptop: number;
  spinPhone: number;
  spinWatch: number;
  spinLaptop: number;
  portraitLift: number;
}

export const shotToTarget = (s: Shot): SceneTarget => ({
  camX: s.cam[0],
  camY: s.cam[1],
  camZ: s.cam[2],
  tgtX: s.target[0],
  tgtY: s.target[1],
  tgtZ: s.target[2],
  yawPhone: s.yaw.phone,
  yawWatch: s.yaw.watch,
  yawLaptop: s.yaw.laptop,
  spinPhone: s.spin.phone,
  spinWatch: s.spin.watch,
  spinLaptop: s.spin.laptop,
  portraitLift: s.portraitLift,
});

export const targetToShot = (t: SceneTarget): Shot => ({
  cam: [t.camX, t.camY, t.camZ],
  target: [t.tgtX, t.tgtY, t.tgtZ],
  yaw: { phone: t.yawPhone, watch: t.yawWatch, laptop: t.yawLaptop },
  spin: { phone: t.spinPhone, watch: t.spinWatch, laptop: t.spinLaptop },
  portraitLift: t.portraitLift,
});

export const sceneTarget: SceneTarget = shotToTarget(SHOTS.hero);

type Listener = () => void;
const listeners = new Set<Listener>();

/** The canvas subscribes so on-demand rendering wakes up when scroll moves the target. */
export const onSceneTargetChange = (fn: Listener) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export const notifySceneTarget = () => listeners.forEach((fn) => fn());
