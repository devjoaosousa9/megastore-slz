import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';

// Known third-party noise that is not an application error.
const IGNORED = [/THREE\.Clock: This module has been deprecated/, /GPU stall due to ReadPixels/, /WebGLProgram/];

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m: ConsoleMessage) => {
    if (m.type() === 'error' && !IGNORED.some((r) => r.test(m.text()))) errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

const ready = (page: Page) =>
  expect(page.locator('.stage')).toHaveAttribute('data-status', /ready|unsupported/, { timeout: 45_000 });

test('renders the 3D store with no errors or hydration mismatch', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('iPhones novos e seminovos');
  for (const id of ['inicio', 'conferido', 'escolha', 'mais', 'vantagens', 'loja']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  await ready(page);
  await expect(page.locator('.stage canvas')).toHaveCount(1);
  await expect(page.getByText(/Modelo 3D do iPhone 15 Pro/)).toBeAttached();
  expect(errors).toEqual([]);
});

test('scroll tour walks through the four checks', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  for (const [i, title] of ['A tela', 'As câmeras', 'A bateria', 'Estrutura e botões'].entries()) {
    await page.locator(`[data-tour-step="${i}"]`).scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: title })).toBeInViewport();
  }
  // The measured height belongs to step one.
  await page.locator('[data-tour-step="0"]').scrollIntoViewIfNeeded();
  await expect(page.locator('.dim3d', { hasText: '146,6 mm' })).toHaveAttribute('data-visible', 'true');
});

test('navigation links move to their sections', async ({ page, isMobile }) => {
  await page.goto('./');
  if (isMobile) {
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('navigation', { name: 'Menu' }).getByRole('link', { name: 'Escolha o seu' }).click();
  } else {
    await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Escolha o seu' }).click();
  }
  await expect(page).toHaveURL(/#escolha$/);
  await expect(page.locator('#cfg-title')).toBeInViewport();
});

test('configurator: model, storage, WhatsApp and the list stay in sync', async ({ page }) => {
  await page.goto('./#escolha');
  const cfg = page.locator('#escolha');
  await cfg.getByRole('radio', { name: /15 Pro Max/ }).click();
  await cfg.getByRole('radio', { name: 'Titânio azul' }).click();
  await cfg.getByRole('radio', { name: '1 TB' }).click();
  await expect(cfg.locator('.cfg__summary-name')).toHaveText('iPhone 15 Pro Max');

  const ask = cfg.getByRole('link', { name: /Perguntar por este/ });
  const href = decodeURIComponent((await ask.getAttribute('href')) ?? '');
  expect(href).toMatch(/^https:\/\/wa\.me\/5598981238819\?text=/);
  expect(href).toContain('iPhone 15 Pro Max (1 TB, Titânio azul)');

  await cfg.getByRole('button', { name: 'Adicionar à lista' }).click();
  const dialog = page.getByRole('dialog', { name: /Minha lista/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('1 TB, Titânio azul')).toBeVisible();
  await dialog.getByRole('button', { name: 'Fechar lista' }).click();
  await expect(page.getByRole('button', { name: 'Abrir minha lista, 1 aparelho' })).toBeVisible();
});

test('no horizontal overflow at any section', async ({ page }) => {
  await page.goto('./');
  await ready(page);
  for (const id of ['inicio', 'conferido', 'escolha', 'mais', 'vantagens', 'loja']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, id).toBeLessThanOrEqual(0);
  }
});

test('falls back to still renders without WebGL', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return (original as (...a: unknown[]) => RenderingContext | null).call(this, type, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto('./');
  await expect(page.locator('.stage')).toHaveAttribute('data-status', 'unsupported');
  await expect(page.getByText(/Seu aparelho não exibe o 3D/)).toBeVisible();
  const still = page.getByRole('img', { name: 'iPhone 15 Pro, vista traseira' }).first();
  await still.scrollIntoViewIfNeeded();
  await expect.poll(() => still.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
});

test('honours reduced motion', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  await expect(page.getByRole('button', { name: 'Movimento reduzido ativado no seu sistema' })).toBeDisabled();
  await context.close();
});
