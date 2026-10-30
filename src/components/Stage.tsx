'use client';

import dynamic from 'next/dynamic';
import { Component, useEffect, useState, type ReactNode } from 'react';
import { resolveChoice, useExperience, type QualityTier } from '@/store/useExperience';
import { probeWebGL } from '@/lib/webgl';
import { detectInitialTier, parseQualityOverride } from '@/lib/quality';

// The whole three.js / R3F graph is its own chunk and never renders on the server.
const Scene = dynamic(() => import('@/three/Scene'), { ssr: false });

class SceneBoundary extends Component<{ children: ReactNode; onError: (e: Error) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Fixed, transparent 3D layer between the page background (where the hero
 * wordmark lives) and the page content. Everything readable is server-rendered
 * HTML, so the site works whether or not WebGL starts.
 */
export function Stage() {
  const status = useExperience((s) => s.renderStatus);
  const setRenderStatus = useExperience((s) => s.setRenderStatus);
  const setQuality = useExperience((s) => s.setQuality);
  const [cap, setCap] = useState<QualityTier | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Capability probing needs the real browser, so it can only happen after mount.
    const probe = probeWebGL();
    if (!probe.supported) {
      setRenderStatus('unsupported');
      return;
    }
    const tier = parseQualityOverride(window.location.search) ?? detectInitialTier(probe.signals);
    setQuality(tier);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot client capability probe
    setCap(tier);
  }, [setQuality, setRenderStatus]);

  const failed = status === 'unsupported' || status === 'error';

  return (
    <>
      <div className="stage" data-status={status}>
        {cap && !failed && (
          <SceneBoundary key={attempt} onError={(e) => setRenderStatus('error', e.message)}>
            <Scene cap={cap} />
          </SceneBoundary>
        )}
      </div>
      {failed && (
        <div className="stage-notice" role="status">
          <span>
            {status === 'unsupported'
              ? 'Seu aparelho não exibe o 3D, então mostramos imagens dos modelos.'
              : 'O 3D parou de carregar. Mostramos imagens dos modelos.'}
          </span>
          {status === 'error' && (
            <button
              type="button"
              className="btn btn--quiet btn--small"
              onClick={() => {
                setRenderStatus('pending');
                setAttempt((n) => n + 1);
              }}
            >
              Tentar o 3D de novo
            </button>
          )}
        </div>
      )}
      <ModelDescription />
    </>
  );
}

/** Text alternative for the canvas, kept in sync with the selected iPhone. */
function ModelDescription() {
  const choice = useExperience((s) => s.choice);
  const { phone, finish, storage } = resolveChoice(choice);
  return (
    <p className="sr-only" aria-live="polite">
      Modelo 3D do {phone.name}, {storage}, na cor {finish.name}.
    </p>
  );
}

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Still render of a product, shown only when the 3D view can't run. */
export function StillRender({ product, className = '' }: { product: 'phone' | 'watch' | 'laptop'; className?: string }) {
  const status = useExperience((s) => s.renderStatus);
  const choice = useExperience((s) => s.choice);
  if (status !== 'unsupported' && status !== 'error') return null;
  const { phone } = resolveChoice(choice);
  const src = product === 'phone' ? `${base}/renders/${phone.id}.webp` : `${base}/renders/${product}.webp`;
  const alt = product === 'phone' ? `${phone.name}, vista traseira` : product === 'watch' ? 'Apple Watch' : 'MacBook Air';
  // eslint-disable-next-line @next/next/no-img-element -- static export
  return <img className={`still ${className}`} src={src} width={1200} height={900} alt={alt} />;
}

/** Shown in the hero until the first 3D frame is drawn. */
export function LoadState() {
  const status = useExperience((s) => s.renderStatus);
  if (status !== 'pending') return null;
  return (
    <p className="load-state" role="status">
      <span className="load-state__bar" aria-hidden="true" />
      Preparando o 3D
    </p>
  );
}
