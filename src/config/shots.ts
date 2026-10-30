/**
 * Camera + product "shots". Every visual state of the experience is one of these
 * declarative poses; the scroll director interpolates between them and the
 * CameraRig is the only system that writes them into the scene.
 *
 * All products share one scene (1 unit = 50 mm). They sit far apart so a shot
 * only ever frames one of them; the camera travels between them as you scroll.
 * Phones: screen faces +Z, so a yaw of PI shows the back and its cameras.
 */
export type Vec3 = readonly [number, number, number];

export const POSITIONS = {
  phone: [0, 0, 0],
  watch: [30, 0, 0],
  laptop: [60, -1.4, 0],
} as const satisfies Record<string, Vec3>;

export interface Shot {
  cam: Vec3;
  target: Vec3;
  /** Turntable yaw of each product, in radians. */
  yaw: { phone: number; watch: number; laptop: number };
  /** Idle sway of each product (0-1). Disabled under reduced motion. */
  spin: { phone: number; watch: number; laptop: number };
  /**
   * On portrait screens the copy sits in a card at the bottom, so the product is
   * raised by this fraction of the frame height to stay clear of it.
   */
  portraitLift: number;
}

/** Vertical field of view of the scene camera, in degrees. */
export const CAMERA_FOV = 30;

const PI = Math.PI;
const rest = { phone: PI - 0.5, watch: -0.35, laptop: -0.3 };
const still = { phone: 0, watch: 0, laptop: 0 };

const shot = (
  s: Omit<Shot, 'yaw' | 'spin' | 'portraitLift'> & {
    yaw?: Partial<Shot['yaw']>;
    spin?: Partial<Shot['spin']>;
    portraitLift?: number;
  },
): Shot => ({
  portraitLift: 0.17,
  ...s,
  yaw: { ...rest, ...s.yaw },
  spin: { ...still, ...s.spin },
});

export const SHOTS = {
  hero: shot({ cam: [0, 0.4, 12.5], target: [0, -0.35, 0], yaw: { phone: PI - 0.55 }, spin: { phone: 1 }, portraitLift: 0.1 }),
  // "Conferido de ponta a ponta": the camera walks around one phone.
  screen: shot({ cam: [0, 0.15, 10.5], target: [-1.35, 0, 0], yaw: { phone: -0.3 } }),
  cameras: shot({ cam: [0, 0.9, 5.8], target: [-1.55, 0.95, 0], yaw: { phone: PI + 0.18 }, portraitLift: 0.3 }),
  battery: shot({ cam: [0, 0.2, 9.6], target: [-1.25, 0.05, 0], yaw: { phone: 0.45 } }),
  frame: shot({ cam: [0, 0.2, 7.2], target: [-1.15, 0, 0], yaw: { phone: -PI / 2 + 0.35 } }),
  // Configurator: phone on the left, panel on the right.
  choose: shot({ cam: [0, 0.3, 11.5], target: [1.9, -0.1, 0], yaw: { phone: PI - 0.5 }, portraitLift: 0.22 }),
  // "E muito mais"
  watch: shot({ cam: [30, 0.35, 10], target: [28.3, 0, 0], yaw: { watch: -0.35 }, spin: { watch: 0.6 }, portraitLift: 0.29 }),
  laptop: shot({ cam: [61.5, 4.3, 15.5], target: [57, 1.1, 0], yaw: { laptop: -0.3 }, portraitLift: 0.27 }),
  // Closing section: phone on the right.
  visit: shot({ cam: [0, 0.4, 12], target: [-2.2, -0.2, 0], spin: { phone: 0.6 }, portraitLift: 0.24 }),
} satisfies Record<string, Shot>;

export type ShotId = keyof typeof SHOTS;

/**
 * Ordered narrative. Each DOM section owns a slice of the central timeline that
 * walks through `keys`, reaching each one at its mark (a 0-1 fraction of the
 * section's scroll range: section top at viewport centre -> bottom at centre).
 */
export interface SectionScript {
  section: string;
  keys: ShotId[];
  marks: number[];
}

export const SCRIPT: SectionScript[] = [
  { section: 'inicio', keys: ['hero', 'screen'], marks: [0, 1] },
  { section: 'conferido', keys: ['screen', 'cameras', 'battery', 'frame'], marks: [0.125, 0.375, 0.625, 0.875] },
  { section: 'escolha', keys: ['frame', 'choose'], marks: [0, 0.42] },
  { section: 'mais', keys: ['choose', 'watch', 'laptop'], marks: [0, 0.25, 0.75] },
  // Opaque section: the long camera flight back to the phone happens behind it.
  { section: 'vantagens', keys: ['laptop', 'visit'], marks: [0, 1] },
  { section: 'loja', keys: ['visit'], marks: [0] },
];

/**
 * Portrait and narrow screens can't fit side-by-side compositions, so the product
 * is re-centred and the camera pulled back. Pure function, unit-tested.
 */
export function adaptShotForAspect(shot: Shot, aspect: number, focusX = 0): Shot {
  if (aspect >= 1.7) return shot;
  const [tx, ty, tz] = shot.target;
  const [cx, cy, cz] = shot.cam;
  if (aspect >= 1.05) {
    const pull = 1 + (1.7 - aspect) * 0.45;
    return { ...shot, cam: [tx + (cx - tx) * pull, ty + (cy - ty) * pull, tz + (cz - tz) * pull] };
  }
  const t = Math.min(1, (1.05 - aspect) / 0.6);
  const lerp = (a: number, b: number) => a + (b - a) * t;
  const pull = 1 + t * 1.15;
  const frameH = 2 * Math.hypot(cx - tx, cy - ty, cz - tz) * pull * Math.tan((CAMERA_FOV * Math.PI) / 360);
  // Re-centre on the product the camera is looking at (focusX), not the world origin,
  // and look below it so it rises into the free space above the copy.
  const target: Vec3 = [lerp(tx, focusX), lerp(ty, ty - shot.portraitLift * frameH), tz];
  return {
    ...shot,
    target,
    cam: [target[0] + (cx - tx) * pull, target[1] + (cy - ty) * pull, target[2] + (cz - tz) * pull],
  };
}

/** The product a camera target is closest to (for portrait re-centring and turntable focus). */
export function focusOf(targetX: number): keyof typeof POSITIONS {
  const entries = Object.entries(POSITIONS) as [keyof typeof POSITIONS, Vec3][];
  return entries.reduce((best, cur) => (Math.abs(cur[1][0] - targetX) < Math.abs(best[1][0] - targetX) ? cur : best))[0];
}
