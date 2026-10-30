import { defineConfig, devices } from '@playwright/test';

const PORT = 4174;
const BASE = process.env.E2E_BASE_PATH ?? '/megastore-slz';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}${BASE}/`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // Serves the static GitHub Pages build (run `npm run build:pages` first).
    command: `node tests/e2e/serve-out.mjs ${PORT} ${BASE}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
});
