import { gsap } from 'gsap';
import { SCRIPT, SHOTS, type SectionScript } from '@/config/shots';
import { notifySceneTarget, sceneTarget, shotToTarget } from './sceneTarget';

export interface SectionRange {
  section: string;
  start: number;
  end: number;
}

/** Each section's slice is exactly 1 unit long, so `marks` read as fractions of the section. */
const HOLD = 0.07;

/**
 * One centralised, paused GSAP timeline holds the whole narrative. Sections never
 * own tweens - they only seek this timeline - so two systems can never fight over
 * the same property.
 *
 * Every key is reached at its mark (a 0-1 position in the section's scroll range)
 * and held briefly around it, so a shot lines up with the copy it belongs to.
 */
export function buildMasterTimeline(script: SectionScript[] = SCRIPT) {
  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: 'power2.inOut' },
    onUpdate: notifySceneTarget,
  });
  const ranges: SectionRange[] = [];

  // Pin initial values so seeking back to 0 restores the first shot.
  tl.set(sceneTarget, shotToTarget(SHOTS[script[0]!.keys[0]!]), 0);

  for (const part of script) {
    const start = tl.duration();
    const marks = part.marks;
    let cursor = 0;
    part.keys.forEach((key, i) => {
      const mark = marks[i]!;
      if (i === 0) {
        const holdUntil = Math.min(1, mark + (mark === 0 ? 0 : HOLD));
        if (holdUntil > 0) tl.to({}, { duration: holdUntil });
        cursor = holdUntil;
        return;
      }
      const arrive = Math.max(cursor + 0.01, mark - (mark === 1 ? 0 : HOLD));
      tl.to(sceneTarget, { ...shotToTarget(SHOTS[key]), duration: arrive - cursor });
      cursor = arrive;
      const leave = i === part.keys.length - 1 ? 1 : Math.min(1, mark + HOLD);
      if (leave > cursor) tl.to({}, { duration: leave - cursor });
      cursor = Math.max(cursor, leave);
    });
    if (cursor < 1) tl.to({}, { duration: 1 - cursor });
    ranges.push({ section: part.section, start, end: tl.duration() });
  }
  return { tl, ranges };
}
