import type { QualityTier } from '@/store/useExperience';

export interface DeviceSignals {
  cores?: number;
  memoryGb?: number;
  maxTextureSize?: number;
  renderer?: string;
  saveData?: boolean;
  coarsePointer?: boolean;
  webgl2?: boolean;
}

const SOFTWARE_RENDERERS = /swiftshader|llvmpipe|software|basic render|mesa offscreen/i;
const LOW_END_GPUS = /mali-4|mali-t|adreno \(tm\) [3-5]\d\d|powervr|intel\(r\) hd graphics [2-5]/i;

/**
 * Initial quality guess from capability signals, never from screen width alone.
 * The runtime PerformanceMonitor then refines it using measured frame rate.
 */
export function detectInitialTier(s: DeviceSignals): QualityTier {
  if (s.saveData) return 'low';
  if (s.renderer && SOFTWARE_RENDERERS.test(s.renderer)) return 'low';
  if (s.webgl2 === false) return 'low';
  if (s.renderer && LOW_END_GPUS.test(s.renderer)) return 'low';
  if ((s.memoryGb !== undefined && s.memoryGb <= 2) || (s.cores !== undefined && s.cores <= 2)) return 'low';
  if ((s.maxTextureSize ?? 16384) < 8192) return 'medium';
  if (s.coarsePointer) return 'medium';
  if ((s.cores ?? 8) <= 4 || (s.memoryGb !== undefined && s.memoryGb <= 4)) return 'medium';
  return 'high';
}

export const TIER_ORDER: QualityTier[] = ['low', 'medium', 'high'];
export const stepTier = (tier: QualityTier, dir: 1 | -1, cap: QualityTier): QualityTier => {
  const i = TIER_ORDER.indexOf(tier) + dir;
  const capped = Math.min(i, TIER_ORDER.indexOf(cap));
  return TIER_ORDER[Math.max(0, capped)]!;
};

export const TIER_SETTINGS: Record<QualityTier, { dpr: [number, number]; bloom: boolean; antialias: boolean }> = {
  high: { dpr: [1, 2], bloom: true, antialias: true },
  medium: { dpr: [1, 1.5], bloom: false, antialias: true },
  low: { dpr: [0.75, 1], bloom: false, antialias: false },
};

export function parseQualityOverride(search: string): QualityTier | null {
  const q = new URLSearchParams(search).get('quality');
  return q === 'high' || q === 'medium' || q === 'low' ? q : null;
}
