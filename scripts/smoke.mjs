/**
 * Browser smoke check: what only a real browser can show. Game rules belong in vitest.
 *
 * It runs on a portrait iPhone-sized viewport in a touch-capable context, because that is what the
 * game is for. The run is a list of named sections (`SECTIONS`, at the bottom) sharing one page;
 * `--section=a,b` runs only those, and `boot` always runs.
 *
 * Usage: npm run dev, then `node scripts/smoke.mjs [--headed] [--section=a,b]`. Screenshots land in
 * .smoke/.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const URL_BASE = process.env.SMOKE_URL ?? 'http://localhost:5173/';
const PHONE = { width: 390, height: 844 };
const headed = process.argv.includes('--headed');
const only = process.argv
  .find((a) => a.startsWith('--section='))
  ?.slice('--section='.length)
  .split(',');

mkdirSync('.smoke', { recursive: true });

/** @type {{ name: string, passed: boolean, detail: string }[]} */
const results = [];

/** @param {string} name @param {boolean} passed @param {string} [detail] */
function check(name, passed, detail = '') {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

// CHROMIUM_PATH is for a machine with a preinstalled browser that doesn't match the pinned
// Playwright, such as a Claude Code cloud container (/opt/pw-browsers/chromium).
const browser = await chromium.launch({
  headless: !headed,
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const context = await browser.newContext({
  viewport: PHONE,
  deviceScaleFactor: 3,
  hasTouch: true,
  isMobile: true,
});
const page = await context.newPage();

/** @type {string[]} */
const consoleErrors = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push(String(e)));

async function boot() {
  // A cold Vite cache compiles on the first request, so this wait is generous on purpose.
  await page.goto(URL_BASE, { waitUntil: 'load', timeout: 60_000 });
  const canvas = await page.evaluate(() => {
    const el = /** @type {HTMLCanvasElement} */ (document.getElementById('game'));
    const ctx = el.getContext('2d');
    const px = ctx?.getImageData(el.width >> 1, el.height >> 1, 1, 1).data;
    const box = el.getBoundingClientRect();
    return {
      width: el.width,
      height: el.height,
      cssWidth: box.width,
      cssHeight: box.height,
      painted: px ? px[3] === 255 : false,
    };
  });
  check('the canvas has a backing size', canvas.width > 0 && canvas.height > 0);
  check(
    'the canvas covers the phone screen',
    canvas.cssWidth >= PHONE.width && canvas.cssHeight >= PHONE.height,
    `${canvas.cssWidth}x${canvas.cssHeight}`,
  );
  check('the canvas has been drawn on', canvas.painted);
  await page.screenshot({ path: '.smoke/boot.png' });
}

async function pwa() {
  const manifest = await page.evaluate(async () => {
    const href = document.querySelector('link[rel="manifest"]')?.getAttribute('href');
    if (!href) return null;
    const response = await fetch(href);
    return response.ok ? await response.json() : null;
  });
  check('the manifest is served', manifest !== null);
  check('the manifest installs standalone', manifest?.display === 'standalone');
  const iconsOk = await page.evaluate(async () => {
    const href = document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href');
    return href ? (await fetch(href)).ok : false;
  });
  check('the apple-touch-icon is served', iconsOk);
}

/** @type {[string, () => Promise<void>][]} */
const SECTIONS = [
  ['boot', boot],
  ['pwa', pwa],
];

const unknown = only?.filter((name) => !SECTIONS.some(([n]) => n === name)) ?? [];
if (unknown.length > 0) {
  console.error(`unknown section(s): ${unknown.join(', ')}`);
  console.error(`sections: ${SECTIONS.map(([n]) => n).join(', ')}`);
  process.exit(2);
}

try {
  for (const [name, run] of SECTIONS) {
    if (name === 'boot' || !only || only.includes(name)) await run();
  }
  check('no console errors', consoleErrors.length === 0, consoleErrors.join(' | '));
} catch (error) {
  await page.screenshot({ path: '.smoke/error.png' }).catch(() => {});
  check('the run finished', false, String(error));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
