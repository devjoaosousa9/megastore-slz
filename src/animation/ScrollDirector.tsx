'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useExperience } from '@/store/useExperience';
import { buildMasterTimeline } from './buildMasterTimeline';
import { notifySceneTarget } from './sceneTarget';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * All scroll logic in one place: sections seek their slice of the central
 * timeline (the CameraRig damps toward it), the tour reports its active step,
 * the configurator switches the stage into turntable mode, and the header
 * progress bar follows the page. Nothing here ever hides content.
 */
export function ScrollDirector() {
  useGSAP(() => {
    const { tl, ranges } = buildMasterTimeline();
    const store = useExperience.getState;

    const triggers = ranges.map((r) => {
      const el = document.getElementById(r.section);
      if (!el) return null;
      const seek = (p: number) => tl.time(r.start + (r.end - r.start) * p);
      return ScrollTrigger.create({
        trigger: el,
        start: r.section === 'inicio' ? 'top top' : 'top center',
        end: 'bottom center',
        onUpdate: (self) => seek(self.progress),
      });
    });

    // Sync on load and deep links (/#escolha): the last section reached wins.
    const sync = () => {
      triggers.forEach((t, i) => {
        const r = ranges[i]!;
        if (t && t.progress > 0) tl.time(r.start + (r.end - r.start) * t.progress);
      });
      notifySceneTarget();
    };
    sync();
    ScrollTrigger.addEventListener('refresh', sync);

    gsap.utils.toArray<HTMLElement>('[data-tour-step]').forEach((el) => {
      const step = Number(el.dataset.tourStep);
      ScrollTrigger.create({
        trigger: el,
        start: 'top 60%',
        end: 'bottom 40%',
        onToggle: (self) => {
          if (self.isActive) store().setTourStep(step);
          else if (store().tourStep === step) store().setTourStep(-1);
        },
      });
    });

    const configurator = document.getElementById('escolha');
    if (configurator) {
      ScrollTrigger.create({
        trigger: configurator,
        start: 'top 35%',
        end: 'bottom 65%',
        onToggle: (self) => store().setMode(self.isActive ? 'configure' : 'cinematic'),
      });
    }

    const bar = document.querySelector<HTMLElement>('[data-progress-bar]');
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        if (bar) bar.style.transform = `scaleX(${self.progress})`;
      },
    });

    return () => {
      ScrollTrigger.removeEventListener('refresh', sync);
      tl.kill();
    };
  });

  return null;
}
