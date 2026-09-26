/**
 * Browser smoke check: what only a real browser can show. Game rules belong in vitest.
 *
 * It runs on a portrait iPhone-sized viewport in a touch-capable context, because that is what the
 * game is for, under `?loop=manual`: nothing moves until `view.step()` cranks it, so every wait is
 * in game milliseconds and a slow runner makes the run slower rather than flakier. It reaches the
 * game through the dev-only `window.world` and `window.view`, typed in `scripts/globals.d.ts`. The run is a list of named sections (`SECTIONS`, at the bottom) sharing one page;
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

/** Game time per cranked frame: a steady 25fps. */
const FRAME_MS = 40;

/** @param {() => boolean} done @param {string} label @param {number} [budgetMs] */
async function stepUntil(done, label, budgetMs = 20_000) {
  for (let spent = 0; spent < budgetMs; spent += FRAME_MS * 5) {
    if (await page.evaluate(done)) return true;
    await page.evaluate((ms) => window.view.step(ms, 5), FRAME_MS);
  }
  check(`${label} within ${budgetMs}ms of game time`, false);
  return false;
}

/** @param {number} tx @param {number} ty */
async function tapTile(tx, ty) {
  const at = await page.evaluate((t) => window.view.tileToClient(t.tx, t.ty), { tx, ty });
  await page.touchscreen.tap(at.x, at.y);
}

async function playerTile() {
  return page.evaluate(() => ({
    tx: Math.floor(window.world.player.x / 16),
    ty: Math.floor(window.world.player.y / 16),
  }));
}

async function boot() {
  // A cold Vite cache compiles on the first request, so this wait is generous on purpose.
  await page.goto(`${URL_BASE}?loop=manual`, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
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
  await creator();
}

/** A fresh browser has no save, so the game opens on the creator, which has to be got through. */
async function creator() {
  const opened = await page
    .waitForSelector('.hud-creator', { timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
  check('a new game opens the character creator', opened);
  if (!opened) return;
  const finish = page.locator('.hud-creator .hud-primary');
  check("the creator won't finish without a name", await finish.isDisabled());
  const doll = await page.evaluate(() => {
    const canvas = /** @type {HTMLCanvasElement} */ (
      document.querySelector('.hud-creator .hud-doll')
    );
    const style = getComputedStyle(canvas);
    return { width: parseFloat(style.width), height: parseFloat(style.height) };
  });
  const scale = doll.width / 16;
  check(
    'the preview is her at a whole-number scale',
    Number.isInteger(scale) && scale > 1 && doll.height === 32 * scale,
    JSON.stringify(doll),
  );
  await page.screenshot({ path: '.smoke/creator.png' });
  await tapElement('.hud-creator .hud-chip:text-is("Bunches")');
  await page.locator('.hud-name').fill('Smoke');
  await tapElement('.hud-creator .hud-primary');
  const look = await page.evaluate(() => ({
    created: window.world.wardrobe.created,
    ...window.world.wardrobe.look,
  }));
  check(
    'finishing the creator dresses her in what was picked',
    look.created && look.name === 'Smoke' && look.hairStyle === 'bunches',
    `${look.name} ${look.hairStyle}`,
  );
  check('the creator closes', (await page.locator('.hud-sheet').count()) === 0);
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

async function walk() {
  const start = await playerTile();
  const goal = { tx: start.tx + 3, ty: start.ty + 3 };
  await tapTile(goal.tx, goal.ty);
  const moving = await page.evaluate(() => window.world.player.moving);
  check('a real tap on the ground sets her walking', moving);
  await stepUntil(() => !window.world.player.moving, 'she arrives');
  const end = await playerTile();
  check(
    'she stops on the tapped tile',
    end.tx === goal.tx && end.ty === goal.ty,
    JSON.stringify(end),
  );
  await page.screenshot({ path: '.smoke/walk.png' });
}

async function camera() {
  const before = await page.evaluate(() => window.view.cameraOrigin());
  // Walk down through the square to the bottom of the town, a screen and a half away.
  for (const { tx, ty } of [
    { tx: 14, ty: 28 },
    { tx: 17, ty: 40 },
    { tx: 20, ty: 44 },
  ]) {
    await page.evaluate((t) => window.world.tapTile(t.tx, t.ty), { tx, ty });
    await stepUntil(() => !window.world.player.moving, `she reaches ${tx},${ty}`);
  }
  const after = await page.evaluate(() => window.view.cameraOrigin());
  check('the camera follows her down the map', after.y > before.y, `${before.y} -> ${after.y}`);
  const clamped = await page.evaluate(() => {
    const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game'));
    const cam = window.view.cameraOrigin();
    return cam.y + canvas.height <= window.world.map.height * 16;
  });
  check('the camera stops at the bottom edge of the town', clamped);
  await page.screenshot({ path: '.smoke/camera.png' });
}

async function reloadGame() {
  await page.reload({ waitUntil: 'load', timeout: 60_000 });
  await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
}

/** @param {{ tx: number, ty: number }} goal */
async function walkTo(goal) {
  await tapTile(goal.tx, goal.ty);
  await stepUntil(() => !window.world.player.moving, `she reaches ${goal.tx},${goal.ty}`);
}

async function save() {
  // Somewhere open near the bottom of town, where the camera section left her.
  await walkTo({ tx: 16, ty: 44 });
  const left = await playerTile();
  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const after = await playerTile();
  check(
    'she is where she was left after a reload',
    after.tx === left.tx && after.ty === left.ty && !(left.tx === 4 && left.ty === 6),
    `${JSON.stringify(left)} -> ${JSON.stringify(after)}`,
  );
  const look = await page.evaluate(() => window.world.wardrobe.look);
  check(
    'she looks as she did, and the creator stays away',
    look.name === 'Smoke' &&
      look.hairStyle === 'bunches' &&
      (await page.locator('.hud-creator').count()) === 0,
    `${look.name} ${look.hairStyle}`,
  );
}

async function closet() {
  await tapElement('.hud-closet');
  await tapElement('.hud-wardrobe .hud-tabs .hud-chip:text-is("Dresses")');
  await tapElement('.hud-wardrobe .hud-chip:text-is("Gingham sundress")');
  await tapElement('.hud-wardrobe .hud-swatch[aria-label="Blue"]');
  const outfit = await page.evaluate(() => window.world.wardrobe.look.outfit);
  check(
    'the closet puts on a dress, in blue, with nothing under it',
    outfit.top?.id === 'sundressGingham' && outfit.top.fabric === 'blue' && !outfit.bottom,
    JSON.stringify(outfit.top),
  );
  await page.screenshot({ path: '.smoke/closet.png' });
  await tapElement('.hud-wardrobe .hud-primary');
  check('Done closes the closet', (await page.locator('.hud-sheet').count()) === 0);
}

async function salon() {
  // The Muse Hair Salon, the pink house on the right of the square.
  await page.evaluate(() => window.world.tapTile(23, 13));
  await stepUntil(() => !window.world.player.moving, 'she reaches the salon');
  await page.evaluate(() => window.view.step(40));
  const opened = (await page.locator('.hud-salon').count()) === 1;
  check('walking up to the salon opens it', opened);
  if (!opened) return;
  await tapElement('.hud-salon .hud-chip:text-is("Pixie")');
  await tapElement('.hud-salon .hud-swatch[aria-label="Lavender"]');
  const look = await page.evaluate(() => window.world.wardrobe.look);
  check(
    'the salon restyles her hair',
    look.hairStyle === 'pixie' && look.hairColour === 'lavender',
    `${look.hairStyle} ${look.hairColour}`,
  );
  await page.screenshot({ path: '.smoke/salon.png' });
  await tapElement('.hud-salon .hud-primary');
}

async function gather() {
  // The tree at the right-hand edge of the square, below the salon.
  const before = await page.evaluate(() => window.world.bag.count('wood'));
  await tapTile(26, 15);
  await stepUntil(() => !window.world.player.moving, 'she reaches the tree');
  await page.evaluate(() => window.view.step(40));
  const after = await page.evaluate(() => window.world.bag.count('wood'));
  check('tapping a tree shakes wood into her bag', after === before + 3, `${before} -> ${after}`);
  const toast = (await page.locator('.hud-toast-shown').textContent()) ?? '';
  check('the find is cheered at the top of the screen', /wood/.test(toast), toast);
  check(
    'the bag shows something new',
    (await page.locator('.hud-bag-button[data-new]').count()) === 1,
  );
}

async function bag() {
  await tapElement('.hud-bag-button');
  const slots = await page.evaluate(() =>
    [...document.querySelectorAll('.hud-bag .hud-slot')].map((el) => ({
      full: !el.classList.contains('hud-slot-empty'),
      width: el.getBoundingClientRect().width,
      right: el.getBoundingClientRect().right,
    })),
  );
  check(
    'the bag holds the purse butter she started with, and the wood',
    slots.filter((s) => s.full).length >= 2,
    `${slots.filter((s) => s.full).length} full of ${slots.length}`,
  );
  check(
    'every bag slot is a full thumb wide and on screen',
    slots.every((s) => s.width >= 44 && s.right <= PHONE.width),
  );
  await tapElement('.hud-bag .hud-slot >> nth=0');
  const name = (await page.locator('.hud-bag-sheet h3').textContent()) ?? '';
  check('tapping a slot says what it is', /Purse butter/.test(name), name);
  await page.screenshot({ path: '.smoke/bag.png' });
  await tapElement('.hud-bag-sheet button:text("Done")');
  check('Done closes the bag', (await page.locator('.hud-sheet').count()) === 0);
}

async function night() {
  // A dev build's ?hour= moves the town's clock too, so the night's snack is out.
  await page.goto(`${URL_BASE}?loop=manual&hour=22`, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
  const snack = await page.evaluate(() => window.world.snack());
  check('a snack is out after dark', snack !== null, JSON.stringify(snack));
  if (!snack) return;
  await page.evaluate((t) => window.world.tapTile(t.tx, t.ty), snack);
  await stepUntil(() => !window.world.player.moving, 'she reaches the snack');
  await page.evaluate(() => window.view.step(40));
  await page.screenshot({ path: '.smoke/night.png' });
  const found = await page.evaluate((id) => window.world.bag.count(id), snack.item);
  check('walking to the snack puts it in her bag', found >= 1, snack.item);
  check(
    'the snack gets a fuss made over it',
    (await page.locator('.hud-toast-special').count()) === 1,
  );
  check(
    'it is gone until tomorrow night',
    (await page.evaluate(() => window.world.snack())) === null,
  );
}

async function farm() {
  // Down the path to the farm gate first, so the bed is on screen to be tapped for real.
  await page.evaluate(() => window.world.tapTile(12, 9));
  await stepUntil(() => !window.world.player.moving, 'she reaches the farm gate');
  // A bed in the front row of Hosta La Vista Farm: she walks up beside it.
  const bed = { tx: 10, ty: 6 };
  await tapTile(bed.tx, bed.ty);
  await stepUntil(() => !window.world.player.moving, 'she reaches the bed');
  await page.evaluate(() => window.view.step(40));
  const tilled = await page.evaluate((b) => window.world.farm.isTilled(b), bed);
  check('tapping a wild bed tills it', tilled);
  const asked = (await page.locator('.hud-seed-sheet').count()) === 1;
  check('a tilled bed asks which seed to plant', asked);
  if (!asked) return;
  const buttons = await page.evaluate(() =>
    [...document.querySelectorAll('.hud-seed')].map((b) => b.getBoundingClientRect().height),
  );
  check(
    'every seed is a full thumb tall',
    buttons.length > 0 && buttons.every((h) => h >= 44),
    `${buttons.length} seeds`,
  );
  await page.screenshot({ path: '.smoke/seeds.png' });
  await tapElement('.hud-seed:has-text("Pumpkin seed")');
  const planted = await page.evaluate((b) => window.world.farm.planting(b)?.crop, bed);
  check('picking a seed plants it', planted === 'pumpkin', String(planted));
  check('the sheet closes', (await page.locator('.hud-sheet').count()) === 0);

  await tapTile(bed.tx, bed.ty);
  await stepUntil(() => !window.world.player.moving, 'she is back at the bed');
  await page.evaluate(() => window.view.step(40));
  const toast = (await page.locator('.hud-toast-shown').textContent()) ?? '';
  check('tapping it again waters it', /watered the pumpkin/.test(toast), toast);
  await page.screenshot({ path: '.smoke/farm.png' });

  await tapTile(11, 8);
  await stepUntil(() => !window.world.player.moving, 'she reaches the sign');
  await page.evaluate(() => window.view.step(40));
  const sign = (await page.locator('.hud-toast-shown').textContent()) ?? '';
  check('the sign at the gate names the farm', /Hosta La Vista Farm/.test(sign), sign);

  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const kept = await page.evaluate((b) => window.world.farm.planting(b), bed);
  check(
    'the garden is still growing after a reload',
    kept?.crop === 'pumpkin' && kept.waterings === 1,
    JSON.stringify(kept),
  );
}

/** @param {string} selector */
async function tapElement(selector) {
  const target = page.locator(selector);
  // Sheets scroll, so what is asked for may be below the fold.
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error(`${selector} is not on screen`);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

async function settings() {
  const gear = await page.locator('.hud-settings').boundingBox();
  check(
    'the settings button is a full thumb wide and on screen',
    !!gear && gear.width >= 44 && gear.x + gear.width <= PHONE.width && gear.y >= 0,
    JSON.stringify(gear),
  );

  const here = await playerTile();
  await tapElement('.hud-settings');
  await page.waitForFunction(
    () =>
      /** @type {HTMLTextAreaElement | null} */ (
        document.querySelector('.hud-code')
      )?.value.startsWith('MFV'),
    null,
    { timeout: 10_000 },
  );
  const code = await page.locator('.hud-code').inputValue();
  check('the settings sheet shows a backup code', /^MFV[01]-/.test(code), code.slice(0, 12));
  await page.screenshot({ path: '.smoke/settings.png' });
  await tapElement('.hud-sheet button:text("Done")');
  check('Done closes the sheet', (await page.locator('.hud-sheet').count()) === 0);

  await walkTo({ tx: here.tx + 3, ty: here.ty });
  await page.evaluate(() => window.view.saveNow());

  await tapElement('.hud-settings');
  await page.locator('.hud-paste').fill(code);
  page.once('dialog', (dialog) => void dialog.accept());
  const reloaded = page.waitForEvent('load', { timeout: 60_000 });
  await tapElement('.hud-restore');
  await reloaded;
  await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
  const restored = await playerTile();
  check(
    'restoring the code brings back the town it was made from',
    restored.tx === here.tx && restored.ty === here.ty,
    `${JSON.stringify(here)} -> ${JSON.stringify(restored)}`,
  );
}

async function gallery() {
  await page.goto(`${URL_BASE}?gallery`, { waitUntil: 'load', timeout: 60_000 });
  const count = await page.locator('#gallery canvas').count();
  check('the gallery shows every sprite', count > 20, `${count} sprites`);
  await page.screenshot({ path: '.smoke/gallery.png', fullPage: true });
}

/** @type {[string, () => Promise<void>][]} */
const SECTIONS = [
  ['boot', boot],
  ['pwa', pwa],
  ['walk', walk],
  ['camera', camera],
  ['save', save],
  ['closet', closet],
  ['salon', salon],
  ['gather', gather],
  ['bag', bag],
  ['farm', farm],
  ['settings', settings],
  ['night', night],
  ['gallery', gallery],
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
