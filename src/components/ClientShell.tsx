'use client';

import { useEffect } from 'react';
import { ScrollDirector } from '@/animation/ScrollDirector';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { resolveChoice, useExperience } from '@/store/useExperience';
import { Stage } from './Stage';
import { InterestList } from './ui/InterestList';

/** The page accent follows the colour of the selected iPhone. */
function useFinishAccent() {
  const choice = useExperience((s) => s.choice);
  useEffect(() => {
    const { finish } = resolveChoice(choice);
    document.documentElement.style.setProperty('--finish', finish.swatch);
    document.documentElement.style.setProperty('--finish-frame', finish.frame);
  }, [choice]);
}

/** Client-only runtime layered under/over the server-rendered page. */
export function ClientShell() {
  useMotionPreference();
  useFinishAccent();
  return (
    <>
      <Stage />
      <ScrollDirector />
      <InterestList />
    </>
  );
}
