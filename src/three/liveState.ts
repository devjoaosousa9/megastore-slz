/**
 * Per-frame values produced by the CameraRig and read by other scene parts.
 * Mutable on purpose: these change every frame and must never trigger React renders.
 */
export const liveState = {
  /** Intro reveal (0 -> 1): the product turning into place on first load. */
  reveal: 0,
};
