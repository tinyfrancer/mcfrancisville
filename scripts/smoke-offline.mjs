/**
 * The installed app's first launch with no signal (V1's S3): what only the production build and a
 * real service worker can show, so it runs against `npm run preview` rather than the dev server
 * smoke drives. One visit with signal, as a first open after adding it to the Home Screen; then,
 * with the phone offline, a reload and a brand-new launch, both of which must reach the title.
 * It also holds the worker to its word: every file the build listed is kept, and a cache from an
 * older version is let go.
 *
 * Usage: npm run build, npm run preview, then `node scripts/smoke-offline.mjs` (`PREVIEW_URL` if
 * the preview isn't on Vite's 4173).
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const URL_BASE = process.env.PREVIEW_URL ?? 'http://localhost:4173/';
const PHONE = { width: 390, height: 844 };
mkdirSync('.smoke', { recursive: true });

/** @type {{ name: string, passed: boolean, detail: string }[]} */
const results = [];
/** @param {string} name @param {boolean} passed @param {string} [detail] */
function check(name, passed, detail = '') {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  if (!passed && process.env.GITHUB_ACTIONS) {
    console.log(
      `::error title=smoke-offline::${name}${detail ? ` (${detail})` : ''}`.slice(0, 900),
    );
  }
}

// What the build wrote into the worker, read back from dist/ (`src/precache.ts`).
const worker = readFileSync('dist/sw.js', 'utf8');
/** @type {string[]} */
const precache = JSON.parse(/const PRECACHE = (\[[^\]]*\]);/.exec(worker)?.[1] ?? '[]');
const version = /const VERSION = "([^"]+)";/.exec(worker)?.[1] ?? '';
check('the build listed the shell into the worker', precache.includes('/'), `${precache.length}`);
check(
  'the list has the hashed chunk, the manifest and the icons',
  precache.some((u) => /^\/assets\/.+\.js$/.test(u)) &&
    precache.includes('/manifest.webmanifest') &&
    precache.some((u) => u.startsWith('/icons/')),
);
check('the worker is versioned by the build', /^[0-9a-f]{12}$/.test(version), version);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const context = await browser.newContext({
  viewport: PHONE,
  deviceScaleFactor: 3,
  hasTouch: true,
  isMobile: true,
  reducedMotion: 'reduce',
  serviceWorkers: 'allow',
});

/** @type {string[]} */
const errors = [];
/** @param {import('playwright').Page} p */
function listen(p) {
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
}

/** @param {import('playwright').Page} p */
async function reachesTitle(p) {
  return p
    .locator('.hud-title')
    .waitFor({ state: 'visible', timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
}

try {
  // A cache left by an older worker (the one before S3 named its cache this), made before this
  // build's worker is ever registered, from a page in its scope that doesn't register it.
  const setup = await context.newPage();
  await setup.goto(`${URL_BASE}manifest.webmanifest`);
  await setup.evaluate(async () => {
    const old = await caches.open('mcfrancisville-v1');
    await old.put('/old-bundle.js', new Response('old'));
  });
  await setup.close();

  // The first open, with signal.
  const page = await context.newPage();
  listen(page);
  await page.goto(URL_BASE, { waitUntil: 'load' });
  check('the game opens with signal', await reachesTitle(page));
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
    timeout: 20_000,
  });
  const kept = await page.evaluate(async (name) => {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    return { keys: keys.map((r) => new URL(r.url).pathname), all: await caches.keys() };
  }, `mcfrancisville-${version}`);
  const missing = precache.filter((u) => !kept.keys.includes(u));
  check('installing keeps every file the build listed', missing.length === 0, missing.join(', '));
  check(
    "an older version's cache is let go as the worker takes over",
    !kept.all.includes('mcfrancisville-v1') && kept.all.includes(`mcfrancisville-${version}`),
    kept.all.join(', '),
  );

  // No signal: a reload, then a new launch from the Home Screen in a page of its own.
  await context.setOffline(true);
  await page.reload({ waitUntil: 'load' });
  check('a reload with no signal still reaches the title', await reachesTitle(page));
  const launch = await context.newPage();
  listen(launch);
  await launch.goto(URL_BASE, { waitUntil: 'load' });
  check('the first offline launch after install reaches the title', await reachesTitle(launch));
  await launch.locator('.hud-title-begin').tap();
  // His dedication, the first time on a phone (phase V), then on to the creator.
  await launch.locator('.hud-dedication-reply').tap();
  check(
    'and goes in, to make her town',
    await launch
      .locator('.hud-creator')
      .waitFor({ state: 'visible', timeout: 20_000 })
      .then(() => true)
      .catch(() => false),
  );
  await launch.screenshot({ path: '.smoke/offline.png' }).catch(() => {});
  check('no errors, online or off', errors.length === 0, errors.join(' | '));
} catch (error) {
  check('the run finished', false, String(error));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
