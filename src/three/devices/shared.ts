import * as THREE from 'three';

/** Rounded rectangle centred on the origin, for extrusions and flat panels. */
export function roundedRect(w: number, h: number, r: number) {
  const x = -w / 2;
  const y = -h / 2;
  const rr = Math.min(r, w / 2, h / 2);
  const s = new THREE.Shape();
  s.moveTo(x + rr, y);
  s.lineTo(x + w - rr, y);
  s.quadraticCurveTo(x + w, y, x + w, y + rr);
  s.lineTo(x + w, y + h - rr);
  s.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  s.lineTo(x + rr, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - rr);
  s.lineTo(x, y + rr);
  s.quadraticCurveTo(x, y, x + rr, y);
  return s;
}

/** Rounded slab: a rounded rectangle extruded along Z, centred, with softened edges. */
export function roundedSlab(w: number, h: number, depth: number, r: number, bevel: number, curveSegments = 24) {
  const g = new THREE.ExtrudeGeometry(roundedRect(w - bevel * 2, h - bevel * 2, Math.max(0.001, r - bevel)), {
    depth: Math.max(0.001, depth - bevel * 2),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments,
  });
  g.translate(0, 0, -(depth - bevel * 2) / 2);
  g.computeVertexNormals();
  return g;
}

/** Flat rounded panel facing +Z with 0-1 UVs (for screens). */
export function roundedPanel(w: number, h: number, r: number) {
  const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 24);
  const pos = g.getAttribute('position');
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / w + 0.5;
    uv[i * 2 + 1] = pos.getY(i) / h + 0.5;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

/** Canvas-backed sRGB texture. Returns null where 2D canvas is unavailable (tests). */
export function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  draw(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Mixes two hex colours (t = 0 -> a, 1 -> b). */
export function mix(a: string, b: string, t: number) {
  return `#${new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()}`;
}

/** Abstract wallpaper tinted from a finish, used on every product screen. */
export function paintWallpaper(ctx: CanvasRenderingContext2D, w: number, h: number, tint: string) {
  const base = mix(tint, '#05060a', 0.55);
  const glow = mix(tint, '#ffffff', 0.25);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  const g1 = ctx.createRadialGradient(w * 0.25, h * 0.3, 0, w * 0.25, h * 0.3, w * 0.9);
  g1.addColorStop(0, `${glow}cc`);
  g1.addColorStop(1, '#00000000');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, w, h);
  const g2 = ctx.createRadialGradient(w * 0.85, h * 0.85, 0, w * 0.85, h * 0.85, w);
  g2.addColorStop(0, `${mix(tint, '#7a5cff', 0.45)}aa`);
  g2.addColorStop(1, '#00000000');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, w, h);
}

/** Disposes every geometry/material/texture in a record (useEffect cleanup helper). */
export function disposeAll(...items: (THREE.BufferGeometry | THREE.Material | THREE.Texture | null | undefined)[]) {
  items.forEach((i) => i?.dispose());
}
