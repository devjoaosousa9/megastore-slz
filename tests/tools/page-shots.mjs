// Visual QA: screenshots of the page at scroll anchors, plus overflow and console checks.
// node tests/tools/page-shots.mjs <url> <outDir> <width> <height> <label> [anchors...]
// An anchor is a number (viewport heights from the top) or "selector@offsetInViewports".
import { chromium } from '@playwright/test';

const [url, outDir, w, h, label, ...anchors] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
await page.goto(url, { waitUntil: 'networkidle' });
await page.addStyleTag({ content: 'html{scroll-behavior:auto!important} nextjs-portal{display:none!important}' });
await page
  .waitForFunction(() => document.querySelector('.stage')?.dataset.status !== 'pending', null, { timeout: 60000 })
  .catch(() => {});
await page.waitForTimeout(2600);
for (const a of anchors.length ? anchors : ['0']) {
  await page.evaluate((a) => {
    if (/^-?\d+(\.\d+)?$/.test(a)) window.scrollTo(0, Number(a) * window.innerHeight);
    else {
      const [sel, frac] = a.split('@');
      const el = document.querySelector(sel);
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + Number(frac || 0) * window.innerHeight);
    }
  }, a);
  await page.waitForTimeout(1500);
  const name = `${outDir}/${label}-${a.replace(/[^a-z0-9.]+/gi, '_')}.png`;
  await page.screenshot({ path: name });
  console.log(name);
}
const metrics = await page.evaluate(() => ({
  screens: Math.round((document.documentElement.scrollHeight / innerHeight) * 10) / 10,
  overflowX: document.documentElement.scrollWidth - innerWidth,
  status: document.querySelector('.stage')?.dataset.status,
}));
console.log(JSON.stringify({ metrics, errors: [...new Set(errors)].slice(0, 6) }));
await browser.close();
