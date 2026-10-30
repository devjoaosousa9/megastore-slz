import type { DeviceSignals } from './quality';

export interface WebGLProbe {
  supported: boolean;
  signals: DeviceSignals;
}

/**
 * Probes WebGL once on the client. `?webgl=0` forces the 2D fallback (useful for
 * demos and the automated fallback test).
 */
export function probeWebGL(): WebGLProbe {
  if (typeof window === 'undefined') return { supported: false, signals: {} };
  if (new URLSearchParams(window.location.search).get('webgl') === '0') return { supported: false, signals: {} };

  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const signals: DeviceSignals = {
    cores: nav.hardwareConcurrency,
    memoryGb: nav.deviceMemory,
    saveData: nav.connection?.saveData,
    coarsePointer: window.matchMedia?.('(pointer: coarse)').matches,
  };

  try {
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');
    const gl = (gl2 ?? canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return { supported: false, signals };
    signals.webgl2 = !!gl2;
    signals.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) signals.renderer = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { supported: true, signals };
  } catch {
    return { supported: false, signals };
  }
}
