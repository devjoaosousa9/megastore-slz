'use client';

import { useEffect } from 'react';
import { selectMotionReduced, useExperience } from '@/store/useExperience';

/**
 * Mirrors `prefers-reduced-motion` into the store and reflects the effective
 * state (system OR user pause) on <html data-motion> for CSS.
 */
export function useMotionPreference() {
  const setSystemReducedMotion = useExperience((s) => s.setSystemReducedMotion);
  const reduced = useExperience(selectMotionReduced);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSystemReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [setSystemReducedMotion]);

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  }, [reduced]);

  return reduced;
}
