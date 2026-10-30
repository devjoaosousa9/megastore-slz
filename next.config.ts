import type { NextConfig } from 'next';

/**
 * Two deployment targets share one codebase:
 *  - Vercel / Node: default output, cache headers come from vercel.json.
 *  - GitHub Pages: `STATIC_EXPORT=true` produces a fully static `out/` folder,
 *    served under a sub-path (NEXT_PUBLIC_BASE_PATH, e.g. /megastore-slz).
 */
const isStatic = process.env.STATIC_EXPORT === 'true';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(isStatic ? { output: 'export', trailingSlash: true } : {}),
  basePath: basePath || undefined,
  images: { unoptimized: true },
  // three.js ships ESM that Next can consume directly; transpiling keeps
  // tree-shaking of the addons consistent between dev and prod.
  transpilePackages: ['three'],
};

export default nextConfig;
