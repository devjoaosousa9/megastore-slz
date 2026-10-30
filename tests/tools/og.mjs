// Builds public/og.png (1200x630 share image) from the live hero of the dev server.
// node tests/tools/og.mjs <devServerOrigin>
import { chromium } from '@playwright/test';

const origin = process.argv[2] ?? 'http://localhost:3200';
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
await page.addStyleTag({
  content: `nextjs-portal,.site-header,.hero__ctas,.hero__lede,.hero__rating,.load-state{display:none!important}`,
});
await page.waitForFunction(() => document.querySelector('.stage')?.dataset.status === 'ready', null, { timeout: 60_000 });
await page.waitForTimeout(3500);
await page.screenshot({ path: 'public/og.png' });
await browser.close();
console.log('public/og.png');
