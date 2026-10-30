// Screenshot helper for building 3D models against the dev server.
// node tests/tools/shoot.mjs <url> <out.png> [width=1200] [height=800]
// Uses the hardware GPU when available, waits for <body data-ready> and the model to settle.
import { chromium } from '@playwright/test';

const [url, out, w = '1200', h = '800'] = process.argv.slice(2);
if (!url || !out) {
  console.error('usage: node tests/tools/shoot.mjs <url> <out.png> [width] [height]');
  process.exit(1);
}
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('body[data-ready="true"]', { timeout: 60_000 }).catch(() => {});
await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
await page.waitForTimeout(2500);
await page.screenshot({ path: out, omitBackground: url.includes('bg=transparent') });
console.log(JSON.stringify({ out, errors: errors.slice(0, 5) }));
await browser.close();
