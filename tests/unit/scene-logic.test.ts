import { describe, expect, it } from 'vitest';
import { adaptShotForAspect, focusOf, POSITIONS, SCRIPT, SHOTS } from '@/config/shots';
import { buildMasterTimeline } from '@/animation/buildMasterTimeline';
import { sceneTarget } from '@/animation/sceneTarget';
import { getPhone } from '@/config/catalog';
import { TOUR } from '@/config/tour';
import { detectInitialTier, parseQualityOverride, stepTier } from '@/lib/quality';

describe('central timeline', () => {
  it('gives every scripted section a contiguous one-unit slice', () => {
    const { ranges, tl } = buildMasterTimeline();
    expect(ranges.map((r) => r.section)).toEqual(SCRIPT.map((s) => s.section));
    ranges.forEach((r, i) => {
      expect(r.end - r.start).toBeCloseTo(1, 6);
      if (i > 0) expect(r.start).toBeCloseTo(ranges[i - 1]!.end, 6);
    });
    tl.kill();
  });

  it('lands exactly on each scripted shot at its mark', () => {
    const { ranges, tl } = buildMasterTimeline();
    for (const script of SCRIPT) {
      const range = ranges.find((r) => r.section === script.section)!;
      script.keys.forEach((key, i) => {
        tl.time(range.start + script.marks[i]!);
        expect(sceneTarget.camX).toBeCloseTo(SHOTS[key].cam[0], 5);
        expect(sceneTarget.tgtY).toBeCloseTo(SHOTS[key].target[1], 5);
        expect(sceneTarget.yawPhone).toBeCloseTo(SHOTS[key].yaw.phone, 5);
      });
    }
    tl.time(0);
    expect(sceneTarget.camZ).toBeCloseTo(SHOTS.hero.cam[2], 5);
    tl.kill();
  });

  it('has one tour shot per tour step, centred on the step', () => {
    const script = SCRIPT.find((s) => s.section === 'conferido')!;
    expect(script.keys).toHaveLength(TOUR.length);
    expect(script.marks).toEqual(TOUR.map((_, i) => (i + 0.5) / TOUR.length));
  });

  it('starts every section where the previous one ended', () => {
    SCRIPT.forEach((s, i) => {
      if (i > 0) expect(s.keys[0]).toBe(SCRIPT[i - 1]!.keys.at(-1));
    });
  });
});

describe('responsive framing', () => {
  const dist = (s: { cam: readonly number[]; target: readonly number[] }) =>
    Math.hypot(...s.cam.map((c, i) => c - s.target[i]!));

  it('leaves wide screens untouched', () => {
    expect(adaptShotForAspect(SHOTS.screen, 1.9)).toBe(SHOTS.screen);
  });

  it('pulls back a little on squarer screens', () => {
    expect(dist(adaptShotForAspect(SHOTS.screen, 1.3))).toBeGreaterThan(dist(SHOTS.screen));
  });

  it('re-centres on the product, pulls back and lifts it above the copy on phones', () => {
    const shot = adaptShotForAspect(SHOTS.watch, 0.46, POSITIONS.watch[0]);
    expect(shot.target[0]).toBeCloseTo(POSITIONS.watch[0], 1);
    expect(dist(shot)).toBeGreaterThan(dist(SHOTS.watch) * 1.8);
    // Looking below the product moves it up the screen.
    expect(shot.target[1]).toBeLessThan(SHOTS.watch.target[1] - 1);
  });

  it('finds the product a shot is looking at', () => {
    expect(focusOf(SHOTS.choose.target[0])).toBe('phone');
    expect(focusOf(SHOTS.watch.target[0])).toBe('watch');
    expect(focusOf(SHOTS.laptop.target[0])).toBe('laptop');
  });
});

describe('tour copy', () => {
  it('quotes the selected model’s real measurements in Brazilian format', () => {
    const max = getPhone('iphone-15-pro-max');
    expect(TOUR[0]!.body(max)).toContain('159,9 mm');
    expect(TOUR[1]!.body(max)).toContain('76,7 mm');
    expect(TOUR[3]!.body(max)).toContain('8,25 mm');
  });

  it('labels hardware by generation', () => {
    expect(TOUR[0]!.pin.label(getPhone('iphone-13'))).toBe('Tela com notch');
    expect(TOUR[0]!.pin.label(getPhone('iphone-15'))).toBe('Dynamic Island');
    expect(TOUR[1]!.pin.label(getPhone('iphone-14'))).toBe('Câmera dupla');
  });
});

describe('adaptive quality', () => {
  it('treats software renderers and save-data as low tier', () => {
    expect(detectInitialTier({ renderer: 'Google SwiftShader' })).toBe('low');
    expect(detectInitialTier({ saveData: true, cores: 16 })).toBe('low');
  });
  it('does not rely on screen width: a strong touch device is medium, not low', () => {
    expect(detectInitialTier({ coarsePointer: true, cores: 8, memoryGb: 8, webgl2: true })).toBe('medium');
  });
  it('gives capable desktops the high tier', () => {
    expect(detectInitialTier({ cores: 12, memoryGb: 16, webgl2: true, maxTextureSize: 16384 })).toBe('high');
  });
  it('never steps above the device cap', () => {
    expect(stepTier('medium', 1, 'medium')).toBe('medium');
    expect(stepTier('high', -1, 'high')).toBe('medium');
    expect(stepTier('low', -1, 'high')).toBe('low');
  });
  it('accepts a ?quality= override for testing', () => {
    expect(parseQualityOverride('?quality=low')).toBe('low');
    expect(parseQualityOverride('?quality=ultra')).toBeNull();
  });
});
