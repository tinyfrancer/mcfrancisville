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
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const URL_BASE = process.env.SMOKE_URL ?? 'http://localhost:5173/';
const PHONE = { width: 390, height: 844 };
/** `TILE_SIZE` in `src/config/world.ts`: world pixels to a tile. */
const TILE = 32;
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

/**
 * Cranks the game until `done` holds in the page (a function, or an expression as a string).
 * @param {(() => boolean) | string} done @param {string} label @param {number} [budgetMs]
 */
async function stepUntil(done, label, budgetMs = 20_000) {
  for (let spent = 0; spent < budgetMs; spent += FRAME_MS * 5) {
    if (await page.evaluate(done)) return true;
    await page.evaluate((ms) => window.view.step(ms, 5), FRAME_MS);
  }
  check(`${label} within ${budgetMs}ms of game time`, false);
  return false;
}

/**
 * A real touch on a tile, or, when a HUD control is on it or near enough for the browser's touch
 * adjustment to snap the tap onto it (the corner buttons, the day's chip), the same tap through
 * the world, as she'd move the town into the clear first.
 * @param {number} tx @param {number} ty
 */
async function tapTile(tx, ty) {
  const at = await page.evaluate((t) => window.view.tileToClient(t.tx, t.ty), { tx, ty });
  const covered = await page.evaluate((p) => {
    const near = 16;
    return [...document.querySelectorAll('.hud button')].some((b) => {
      const r = b.getBoundingClientRect();
      if (r.width === 0) return false;
      return (
        p.x > r.left - near && p.x < r.right + near && p.y > r.top - near && p.y < r.bottom + near
      );
    });
  }, at);
  if (covered) await page.evaluate((t) => window.world.tapTile(t.tx, t.ty), { tx, ty });
  else await page.touchscreen.tap(at.x, at.y);
}

/** Closes whatever sheet is open, as a tap on its backdrop would. */
async function closeSheets() {
  for (let i = 0; i < 3 && (await page.locator('.hud-backdrop').count()) > 0; i++) {
    await page.evaluate(() =>
      /** @type {HTMLElement} */ (document.querySelector('.hud-backdrop'))?.click(),
    );
  }
}

async function playerTile() {
  return page.evaluate(
    (T) => ({
      tx: Math.floor(window.world.player.x / T),
      ty: Math.floor(window.world.player.y / T),
    }),
    TILE,
  );
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
  const scale = doll.width / 32;
  check(
    'the preview is her at a whole-number scale',
    Number.isInteger(scale) && scale > 1 && doll.height === 48 * scale,
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
  check('the creator closes', (await page.locator('.hud-creator').count()) === 0);
  const hello = (await page.locator('.hud-talk-sheet .hud-speech').textContent()) ?? '';
  check('Cody says hello to his new neighbour', /I'm Cody/.test(hello), hello.slice(0, 40));
  const gift = (await page.locator('.hud-talk-sheet .hud-gift').textContent()) ?? '';
  check("her first visit's gift is on his greeting", /welcome gift/.test(gift), gift);
  await page.screenshot({ path: '.smoke/hello.png' });
  await answerCody();
}

/**
 * Every time the game opens, Cody greets her (decisions.md 24, 114), and she answers: "Hi, Cody!",
 * or "On it!", or "Red one!".
 */
async function answerCody() {
  const greeting = page.locator('.hud-talk-sheet .hud-done');
  if ((await greeting.count()) > 0) await tapElement('.hud-talk-sheet .hud-done');
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
  // Somewhere a few steps off, where no neighbour is passing and no critter is out (a tap there
  // would be a hello, or a swing of her net).
  const goal = await page.evaluate(
    (s) =>
      [3, 2, 4]
        .map((d) => ({ tx: s.tx + d, ty: s.ty + 3 }))
        .find(
          (t) =>
            window.world.canWalk(t.tx, t.ty) &&
            !window.world.neighbourhood.villagerAt(t.tx, t.ty) &&
            !window.world.collecting.critterAt(t.tx, t.ty),
        ) ?? {
        tx: s.tx + 3,
        ty: s.ty + 3,
      },
    start,
  );
  await tapTile(goal.tx, goal.ty);
  const moving = await page.evaluate(() => window.world.player.moving);
  check('a real tap on the ground sets her walking', moving);
  await stepUntil(() => !window.world.player.moving, 'she arrives');
  const end = await playerTile();
  check(
    'she stops on the tapped tile',
    end.tx === goal.tx && end.ty === goal.ty,
    JSON.stringify({ end, goal, start }),
  );
  await page.screenshot({ path: '.smoke/walk.png' });
}

async function camera() {
  const before = await page.evaluate(() => window.view.cameraOrigin());
  // Walk down through the square to the bottom of the town, a screen and a half away.
  for (const { tx, ty } of [
    { tx: 19, ty: 30 },
    { tx: 17, ty: 40 },
    { tx: 26, ty: 47 },
  ]) {
    await page.evaluate((t) => window.world.tapTile(t.tx, t.ty), { tx, ty });
    await stepUntil(() => !window.world.player.moving, `she reaches ${tx},${ty}`);
  }
  const after = await page.evaluate(() => window.view.cameraOrigin());
  check('the camera follows her down the map', after.y > before.y, `${before.y} -> ${after.y}`);
  const clamped = await page.evaluate((T) => {
    const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game'));
    const cam = window.view.cameraOrigin();
    return cam.y + canvas.height <= window.world.map.height * T;
  }, TILE);
  check('the camera stops at the bottom edge of the town', clamped);
  await page.screenshot({ path: '.smoke/camera.png' });
}

/**
 * A pixel that goes back and forth: the shimmer. A walk may turn a thing round once (the camera
 * settling on her as she turns a corner or stops), but never round and round again within half a
 * second.
 * @param {number[]} values @returns {number} the frame it turns back on, or -1
 */
function backAndForth(values) {
  const WINDOW = 30;
  let direction = 0;
  let lastTurn = -Infinity;
  for (let i = 1; i < values.length; i++) {
    const d = Math.sign(/** @type {number} */ (values[i]) - /** @type {number} */ (values[i - 1]));
    if (d === 0) continue;
    if (direction !== 0 && d !== direction) {
      if (i - lastTurn <= WINDOW) return i;
      lastTurn = i;
    }
    direction = d;
  }
  return -1;
}

/** Walks her along the high street and down the middle of town a 60fps frame at a time. */
async function smooth() {
  await page.evaluate(() => window.world.tapTile(2, 15));
  await stepUntil(() => !window.world.player.moving, 'she reaches the high street');
  /** @type {Record<string, { cam: {x: number, y: number}, her: {x: number, y: number} }[]>} */
  const dump = {};
  for (const [name, goal] of /** @type {const} */ ([
    ['east', { tx: 27, ty: 15 }],
    ['back', { tx: 14, ty: 15 }],
    ['south', { tx: 19, ty: 30 }],
  ])) {
    const frames = await page.evaluate((t) => {
      window.world.tapTile(t.tx, t.ty);
      const out = [];
      // Walking, then a second more for the camera to settle.
      for (let i = 0, still = 0; i < 1200 && still < 60; i++) {
        window.view.step(1000 / 60);
        out.push({ cam: window.view.cameraOrigin(), her: window.view.playerDrawnAt() });
        still = window.world.player.moving ? 0 : still + 1;
      }
      return out;
    }, goal);
    dump[name] = frames;
    const series = {
      'the camera': frames.map((f) => f.cam),
      'her, in the world': frames.map((f) => f.her),
      'her, on the screen': frames.map((f) => ({ x: f.her.x - f.cam.x, y: f.her.y - f.cam.y })),
    };
    for (const [what, points] of Object.entries(series)) {
      const x = backAndForth(points.map((p) => p.x));
      const y = backAndForth(points.map((p) => p.y));
      check(
        `${what} never shimmers on the walk ${name}`,
        x < 0 && y < 0,
        x >= 0 ? `x at frame ${x}` : y >= 0 ? `y at frame ${y}` : `${frames.length} frames`,
      );
    }
  }
  writeFileSync('.smoke/walk-frames.json', JSON.stringify(dump));
  const arrived = await playerTile();
  check('she ends the walk where she was headed', arrived.tx === 19 && arrived.ty === 30);
}

async function reloadGame() {
  await page.reload({ waitUntil: 'load', timeout: 60_000 });
  await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
  await answerCody();
}

/**
 * Where a prop stands in the map she's in (the first of its kind, or the one nearest her), so
 * smoke taps a building or a tree wherever the map puts it.
 * @param {string} id @param {{ nearest?: boolean }} [options]
 * @returns {Promise<{ tx: number, ty: number }>}
 */
async function propTile(id, options = {}) {
  return page.evaluate(
    ({ id, nearest }) => {
      const here = window.world.movement.tile;
      const all = window.world.map.props.filter((p) => p.id === id);
      const far = (/** @type {{ tx: number, ty: number }} */ p) =>
        Math.abs(p.tx - here.tx) + Math.abs(p.ty - here.ty);
      const prop = nearest ? all.sort((a, b) => far(a) - far(b))[0] : all[0];
      if (!prop) throw new Error(`no ${id} in the map`);
      return { tx: prop.tx, ty: prop.ty };
    },
    { id, nearest: options.nearest ?? false },
  );
}

/** A tap on a prop, through the world, wherever it stands. @param {string} id */
async function tapProp(id) {
  const at = await propTile(id);
  await page.evaluate((t) => window.world.tapTile(t.tx, t.ty), at);
}

/**
 * Walks her up to a building in town and in through its door.
 * @param {string} building @param {string} inside
 */
async function goInto(building, inside) {
  await tapProp(building);
  const went = await stepUntil(
    `window.world.scene === ${JSON.stringify(inside)}`,
    `she goes into ${inside}`,
  );
  await page.evaluate(() => window.view.step(40));
  return went;
}

/** A real tap on something standing in the building she's in, and the walk up to it. @param {string} id */
async function tapFixture(id) {
  const at = await page.evaluate((id) => {
    const room = window.world.zones.inside(window.world.scene);
    const thing = room?.things.find((t) => 'fixture' in t && t.fixture.id === id);
    if (!thing || !('fixture' in thing)) throw new Error(`no ${id} here`);
    return { tx: thing.fixture.tx, ty: thing.fixture.ty };
  }, id);
  await tapTile(at.tx, at.ty);
  await stepUntil(() => !window.world.player.moving, `she reaches the ${id}`);
  await page.evaluate(() => window.view.step(40));
}

/** Walks her onto the mat of the building she's in, and out. */
async function goOut() {
  const mat = await page.evaluate(() => window.world.zones.inside(window.world.scene)?.room.mat);
  if (!mat) return;
  await tapTile(mat.tx, mat.ty);
  await stepUntil(
    () => window.world.zones.inside(window.world.scene) === undefined,
    'she goes out',
  );
  await page.evaluate(() => window.view.step(40));
}

/** @param {{ tx: number, ty: number }} goal */
async function walkTo(goal) {
  await tapTile(goal.tx, goal.ty);
  await stepUntil(() => !window.world.player.moving, `she reaches ${goal.tx},${goal.ty}`);
}

async function save() {
  // Somewhere open near the bottom of town, where the camera section left her.
  await walkTo({ tx: 31, ty: 48 });
  const left = await playerTile();
  const spawn = await page.evaluate(() => window.world.map.spawn);
  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const after = await playerTile();
  check(
    'she is where she was left after a reload',
    after.tx === left.tx && after.ty === left.ty && !(left.tx === spawn.tx && left.ty === spawn.ty),
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
  await tapElement('.hud-wardrobe .hud-filters .hud-chip:text-is("Dresses")');
  await tapElement('.hud-wardrobe .hud-slot[aria-label^="Gingham sundress"]');
  await tapElement('.hud-wardrobe .hud-swatch[aria-label="Blue"]');
  const outfit = await page.evaluate(() => window.world.wardrobe.look.outfit);
  check(
    'the closet puts on a dress, in blue, with nothing under it',
    outfit.top?.id === 'sundressGingham' && outfit.top.fabric === 'blue' && !outfit.bottom,
    JSON.stringify(outfit.top),
  );
  await page.screenshot({ path: '.smoke/closet.png' });
  await tapElement('.hud-wardrobe .hud-done');
  check('Done closes the closet', (await page.locator('.hud-sheet').count()) === 0);
}

async function salon() {
  // The Muse Hair Salon, the pink house on the right of the square: in, and up to her chair.
  if (!(await goInto('salonHouse', 'muse'))) return;
  await page.screenshot({ path: '.smoke/salon-inside.png' });
  check('going in opens no sheet', (await page.locator('.hud-sheet').count()) === 0);
  check('the quick bar is put away indoors', await page.locator('.hud-quick').isHidden());
  await tapFixture('salonChair');
  const opened = (await page.locator('.hud-salon').count()) === 1;
  check('walking up to her salon chair opens the salon', opened);
  if (!opened) return goOut();
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
  await goOut();
  const out = await page.evaluate(() => {
    const step = window.world.map.props.find((p) => p.id === 'salonHouse');
    const here = window.world.movement.tile;
    return window.world.scene === 'town' && step !== undefined && here.ty === step.ty + step.h;
  });
  check('walking onto the mat goes back out, in front of the salon door', out);
}

async function gather() {
  // The tree nearest her, by the salon.
  const before = await page.evaluate(() => window.world.bag.count('wood'));
  const tree = await propTile('tree', { nearest: true });
  await tapTile(tree.tx, tree.ty);
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
  const fresh = await page.locator('.hud-bag .hud-slot .hud-new').count();
  check('what she has just found is marked new', fresh >= 1, String(fresh));
  await tapElement('.hud-bag .hud-slot >> nth=0');
  const name = (await page.locator('.hud-bag-sheet .hud-detail h3').textContent()) ?? '';
  check('tapping a slot says what it is, gathered things first', /Wood/.test(name), name);
  await page.screenshot({ path: '.smoke/bag.png' });
  await tapElement('.hud-bag-sheet button:text("Done")');
  check('Done closes the bag', (await page.locator('.hud-sheet').count()) === 0);
  check(
    'having looked, the bag has nothing new',
    (await page.locator('.hud-bag-button[data-new]').count()) === 0,
  );
}

/** The day under her Candy, and the calendar it opens. */
async function calendar() {
  const boxes = await page.evaluate(() =>
    ['.hud-today', '.hud-candy', '.hud-corner', '.hud-quick'].map((s) => {
      const r = document.querySelector(s)?.getBoundingClientRect();
      return r ? { left: r.left, right: r.right, top: r.top, bottom: r.bottom } : null;
    }),
  );
  const [chip, ...others] = boxes;
  /** @typedef {{ left: number, right: number, top: number, bottom: number }} Box */
  /** @param {Box} a @param {Box | null} b */
  const clear = (a, b) =>
    !b || a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
  check(
    "the day's chip sits under her Candy, clear of the buttons, and a thumb tall",
    !!chip && chip.bottom - chip.top >= 44 && others.every((b) => clear(chip, b)),
    JSON.stringify(chip),
  );
  await tapElement('.hud-today');
  const days = await page.evaluate(() =>
    [...document.querySelectorAll('.hud-cal-day')].map((el) => el.getBoundingClientRect()),
  );
  check(
    'the calendar shows a month of days, each a thumb tall and on screen',
    days.length >= 28 && days.every((d) => d.height >= 44 && d.right <= 390 && d.width >= 38),
    `${days.length} days, narrowest ${Math.min(...days.map((d) => d.width)).toFixed(1)}`,
  );
  check('today is marked', (await page.locator('.hud-cal-now').count()) === 1);
  const month = await page.locator('.hud-cal-title').textContent();
  await page.screenshot({ path: '.smoke/calendar.png' });
  await tapElement('.hud-cal-page >> nth=1');
  const next = await page.locator('.hud-cal-title').textContent();
  check('it pages on to the next month', next !== month, `${month} -> ${next}`);
  await tapElement('.hud-cal-day >> nth=12');
  const detail = (await page.locator('.hud-cal-detail h4').textContent()) ?? '';
  check('a tap on a day says what day it is', /\d/.test(detail), detail);
  await tapElement('.hud-calendar-sheet button:text("Done")');
  check('Done closes the calendar', (await page.locator('.hud-sheet').count()) === 0);
}

/** The noticeboard by the square: walked up to, it opens its notes, and one can be answered. */
async function notices() {
  await closeSheets();
  // Something to hand over: what the first note asks for.
  await page.evaluate(() => {
    const n = window.world.noticeboard.notices()[0];
    if (n) window.world.bag.add(n.item, n.count);
  });
  await tapProp('noticeboard');
  await stepUntil(() => !window.world.player.moving, 'she reaches the noticeboard');
  await page.evaluate(() => window.view.step(40));
  const cards = await page.locator('.hud-notice').count();
  check('walking up to the noticeboard opens its three notes', cards === 3, String(cards));
  const candy = await page.evaluate(() => window.world.wallet.candy);
  await tapElement('.hud-notice >> nth=0 >> button');
  const after = await page.evaluate(() => window.world.wallet.candy);
  check('handing over what a note asks pays her', after > candy, `${candy} -> ${after}`);
  check('and the note says it is done', (await page.locator('.hud-notice-done').count()) === 1);
  await page.screenshot({ path: '.smoke/notices.png' });
  await tapElement('.hud-notice-sheet .hud-done');
}

/** The candy tree shakes down Candy, and the honesty stall takes what she grows (phase O). */
async function passive() {
  await closeSheets();
  const before = await page.evaluate(() => window.world.wallet.candy);
  await tapProp('candyTree');
  await stepUntil(() => !window.world.player.moving, 'she reaches the candy tree');
  await page.evaluate(() => window.view.step(40));
  const after = await page.evaluate(() => window.world.wallet.candy);
  check('shaking the candy tree gives her Candy', after > before, `${before} -> ${after}`);
  await page.screenshot({ path: '.smoke/candy-tree.png' });
  await page.evaluate(() => window.world.bag.add('pumpkin', 3));
  await tapProp('honestyStall');
  await stepUntil(() => !window.world.player.moving, 'she reaches the honesty stall');
  await page.evaluate(() => window.view.step(40));
  const opened = (await page.locator('.hud-stall-sheet').count()) === 1;
  check('walking up to the honesty stall opens it', opened);
  if (!opened) return;
  await tapElement('.hud-stall-sheet .hud-ware >> nth=-1 >> button');
  const out = await page.evaluate(() => window.world.stall.view().stock);
  check(
    'putting her pumpkins out leaves them on the stall',
    out.some((s) => s.id === 'pumpkin' && s.count >= 3),
    JSON.stringify(out),
  );
  await page.screenshot({ path: '.smoke/stall.png' });
  await tapElement('.hud-stall-sheet .hud-done');
}

/** Rain and fog, drawn over the town by `?weather=` whatever the day's own weather is. */
async function weather() {
  for (const kind of ['rain', 'fog']) {
    await page.goto(`${URL_BASE}?loop=manual&weather=${kind}`, {
      waitUntil: 'load',
      timeout: 60_000,
    });
    await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
    await page.evaluate(() => window.view.step(40, 10));
    await page.screenshot({ path: `.smoke/${kind}.png` });
    check(`the town draws in the ${kind}`, consoleErrors.length === 0, consoleErrors.join(' | '));
  }
}

async function night() {
  // A dev build's ?hour= moves the town's clock too, so the night's snack is out.
  await page.goto(`${URL_BASE}?loop=manual&hour=22`, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
  const snack = await page.evaluate(() => window.world.gathering.snack());
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
    (await page.evaluate(() => window.world.gathering.snack())) === null,
  );
}

async function farm() {
  // Down the path to the farm gate first, so the bed is on screen to be tapped for real.
  await page.evaluate(() => window.world.tapTile(14, 12));
  await stepUntil(() => !window.world.player.moving, 'she reaches the farm gate');
  // A neighbour whose stop is the gate at this hour gets talked to on the way; close that first.
  await closeSheets();
  // A bed in the back row of Hosta La Vista Farm: she walks up beside it.
  const bed = await page.evaluate(() => {
    const first = window.world.map.beds[0];
    if (!first) throw new Error('the town has no garden beds');
    return first;
  });
  // The first tap only says what a tap will do (phase P), in a pop-up over the bed.
  await tapTile(bed.tx, bed.ty);
  await page.evaluate(() => window.view.step(10));
  const card = page.locator('.hud-bed');
  // It shows on the next frame, once it's placed over its bed (a slow runner may take a moment).
  const shown = await card
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  const said = shown ? ((await card.textContent()) ?? '') : '';
  check('the first tap on a bed says what it will do', /Dig it over/.test(said), said);
  const box = await card.boundingBox();
  const spot = await page.evaluate((b) => window.view.tileToClient(b.tx, b.ty), bed);
  const barTop = (await page.locator('.hud-quick').boundingBox())?.y ?? PHONE.height;
  check(
    'the pop-up sits over its bed, or along the bottom when there is no room, clear of it',
    box !== null &&
      box.x >= 0 &&
      box.x + box.width <= PHONE.width &&
      (box.y + box.height <= spot.y - 8 || (box.y >= spot.y + 8 && box.y + box.height <= barTop)),
    JSON.stringify({ box, spot, barTop }),
  );
  check(
    'and nothing is done yet',
    !(await page.evaluate((b) => window.world.farm.isTilled(b), bed)) &&
      !(await page.evaluate(() => window.world.player.moving)),
  );
  await page.screenshot({ path: '.smoke/bed-card.png' });
  await tapCard('.hud-bed .hud-primary');
  await stepUntil(() => !window.world.player.moving, 'she reaches the bed');
  await page.evaluate(() => window.view.step(40));
  const tilled = await page.evaluate((b) => window.world.farm.isTilled(b), bed);
  check('its button walks up and tills it', tilled);
  check('and the pop-up goes', !(await card.isVisible()));
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

  // The quick bar: a seed picked up there is planted straight into the next bed, without asking.
  const quick = await page.evaluate(() =>
    [...document.querySelectorAll('.hud-quick-slot')].map((b) => b.getBoundingClientRect()),
  );
  check(
    'the quick bar shows outdoors, a thumb-sized slot for her hands, net, can and seeds',
    quick.length >= 4 && quick.every((r) => r.height >= 44 && r.bottom <= PHONE.height),
    `${quick.length} slots`,
  );
  await tapElement('.hud-quick-slot[aria-label^="Rose seed"]');
  check(
    'a tap on a seed puts it in her hand',
    (await page.evaluate(() => window.world.hands.held)) === 'roseSeed',
  );
  const next = await page.evaluate(() => {
    const second = window.world.map.beds[1];
    if (!second) throw new Error('the town has only one garden bed');
    return second;
  });
  await tapTile(next.tx, next.ty);
  await page.evaluate(() => window.view.step(10));
  const offer = (await card.textContent()) ?? '';
  const roses = await page.evaluate(() => window.world.bag.count('roseSeed'));
  check(
    'with a seed in her hand, the pop-up offers it and the row',
    /Plant a rose seed/.test(offer) && offer.includes(`Plant the row (${roses})`),
    offer,
  );
  await tapCard('.hud-bed button:has-text("Plant the row")');
  await stepUntil(() => !window.world.player.moving, 'she reaches the next bed');
  await page.evaluate(() => window.view.step(40));
  const row = await page.evaluate(
    (b) =>
      window.world.map.beds
        .filter((t) => t.ty === b.ty)
        .map((t) => window.world.farm.planting(t)?.crop ?? null),
    next,
  );
  check(
    'planting the row fills the empty beds beside it, tilled first, without asking',
    row.filter((c) => c === 'rose').length === roses &&
      (await page.locator('.hud-sheet').count()) === 0,
    JSON.stringify(row),
  );
  await page.screenshot({ path: '.smoke/quick-bar.png' });
  await tapElement('.hud-quick-slot[aria-label="Hands"]');

  // A second tap on the bed does what its pop-up said.
  await tapTile(bed.tx, bed.ty);
  await page.evaluate(() => window.view.step(2));
  await tapTile(bed.tx, bed.ty);
  await stepUntil(() => !window.world.player.moving, 'she is back at the bed');
  await page.evaluate(() => window.view.step(40));
  const toast = (await page.locator('.hud-toast-shown').textContent()) ?? '';
  // On a rainy day by the real clock, the rain has already watered it.
  const rainy = await page.evaluate(() => window.world.weather.today() === 'rain');
  check(
    'tapping it again waters it',
    rainy ? /rain is watering the pumpkin/.test(toast) : /watered the pumpkin/.test(toast),
    toast,
  );
  await page.screenshot({ path: '.smoke/farm.png' });
  check(
    'watering puts the can in her hand, and the bar shows it',
    rainy ||
      (await page
        .locator('.hud-quick-slot[aria-label="Watering can"][aria-pressed="true"]')
        .count()) === 1,
  );

  // A sprinkler from her bag, fitted from the quick bar into the bed beside the pumpkin.
  await page.evaluate(() => window.world.bag.add('sprinkler', 1));
  await page.evaluate(() => window.world.events.emit('bag', window.world.bag.contents));
  await tapElement('.hud-quick-slot[aria-label^="Bat-eared sprinkler"]');
  await tapTile(next.tx, next.ty);
  await page.evaluate(() => window.view.step(2));
  await tapCard('.hud-bed button:has-text("Fit your sprinkler here")');
  await stepUntil(() => !window.world.player.moving, 'she reaches the bed for the sprinkler');
  await page.evaluate(() => window.view.step(40));
  const beside = { tx: next.tx + 1, ty: next.ty };
  const by = await page.evaluate((b) => window.world.garden.wateredBy(b), beside);
  check(
    'a sprinkler from the quick bar goes in a bed, and waters the rose beside it',
    (await page.evaluate((b) => window.world.farm.hasSprinkler(b), next)) &&
      by === (rainy ? 'rain' : 'sprinkler'),
    String(by),
  );
  await page.screenshot({ path: '.smoke/sprinkler.png' });
  const toastBox = await page.locator('.hud-toast-shown').boundingBox();
  const bedAt = await page.evaluate((b) => window.view.tileToClient(b.tx, b.ty), next);
  check(
    'up by the farm, the toast keeps clear of the bed she tended',
    toastBox !== null && (toastBox.y > bedAt.y + 24 || toastBox.y + toastBox.height < bedAt.y - 24),
    JSON.stringify({ toastBox, bedAt }),
  );

  const sign = await propTile('farmSign');
  await tapTile(sign.tx, sign.ty);
  await stepUntil(() => !window.world.player.moving, 'she reaches the sign');
  await page.evaluate(() => window.view.step(40));
  const named = (await page.locator('.hud-toast-shown').textContent()) ?? '';
  check('the sign at the gate names the farm', /Hosta La Vista Farm/.test(named), named);

  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const kept = await page.evaluate((b) => window.world.farm.planting(b), bed);
  check(
    'the garden is still growing after a reload',
    kept?.crop === 'pumpkin' && kept.waterings === (rainy ? 0 : 1),
    JSON.stringify(kept),
  );
}

async function shop() {
  const pill = await page.locator('.hud-candy').boundingBox();
  const gear = await page.locator('.hud-corner').boundingBox();
  check(
    'her Candy shows in the corner, clear of the buttons',
    !!pill && !!gear && pill.x >= 0 && pill.x + pill.width < gear.x && pill.height >= 44,
    JSON.stringify(pill),
  );
  // Cobweb Corner, the teal house on the left of the square: in, and up to the counter.
  if (!(await goInto('shopHouse', 'cobwebCorner'))) return;
  await page.screenshot({ path: '.smoke/shop-inside.png' });
  await tapFixture('shopCounter');
  const opened = (await page.locator('.hud-shop-sheet').count()) === 1;
  check("walking up to Cobweb Corner's counter opens the shop", opened);
  if (!opened) return goOut();
  const prices = await page.evaluate(() =>
    [...document.querySelectorAll('.hud-price')].map((b) => b.getBoundingClientRect()),
  );
  check(
    'every price is a full thumb and on screen',
    prices.length > 0 && prices.every((b) => b.height >= 44 && b.right <= 390),
    `${prices.length} prices`,
  );
  await page.screenshot({ path: '.smoke/shop.png' });

  const before = await page.evaluate(() => window.world.wallet.candy);
  await tapElement('.hud-shop-sheet section:has(h3:text-is("Seeds")) .hud-price >> nth=0');
  const after = await page.evaluate(() => window.world.wallet.candy);
  const said = (await page.locator('.hud-shop-sheet .hud-message').textContent()) ?? '';
  check(
    'buying a seed spends Candy and says it went in her bag',
    after < before && /into your bag/.test(said),
    `${before} -> ${after}: ${said}`,
  );
  const shown = (await page.locator('.hud-candy').textContent()) ?? '';
  check('the Candy in the corner keeps up', shown.includes(String(after)), shown);

  await tapElement('.hud-shop-sheet .hud-tabs .hud-chip:text-is("Sell")');
  // The first slot is her purse butter, which the shop won't take; the next is a seed.
  await tapElement('.hud-shop-sheet .hud-slot >> nth=1');
  await tapElement('.hud-shop-sheet .hud-sell-one');
  const sold = await page.evaluate(() => window.world.wallet.candy);
  check('selling something from her bag pays Candy', sold > after, `${after} -> ${sold}`);
  await page.screenshot({ path: '.smoke/sell.png' });
  await tapElement('.hud-shop-sheet .hud-primary');
  check('Done closes the shop', (await page.locator('.hud-sheet').count()) === 0);

  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const kept = await page.evaluate(() => window.world.wallet.candy);
  check('her Candy is still there after a reload', kept === sold, `${sold} -> ${kept}`);
  const inside = await page.evaluate(() => window.world.scene);
  check('and she is still in the shop', inside === 'cobwebCorner', inside);
  await goOut();

  const popUp = await page.evaluate(() => window.world.stalls.popUp());
  if (!popUp) {
    console.log('note  the pop-up shop is not in town today, so its visit is skipped');
    return;
  }
  await page.evaluate((p) => window.world.tapTile(p.tx + 1, p.ty), popUp);
  await stepUntil(() => !window.world.player.moving, 'she reaches the pop-up shop');
  await page.evaluate(() => window.view.step(40));
  await page.screenshot({ path: '.smoke/popup.png' });
  check(
    'walking up to the pop-up shop opens it',
    (await page.locator('.hud-shop-sheet h2:text-is("Spirit Halloweenie")').count()) === 1,
  );
  await tapElement('.hud-shop-sheet .hud-primary');
}

async function home() {
  // Her house is the plum one top-left, and walking up to it goes in through the door with the bat.
  await tapProp('homeHouse');
  await stepUntil(() => window.world.scene === 'home', 'she goes in her front door');
  await page.evaluate(() => window.view.step(40));
  await page.screenshot({ path: '.smoke/home.png' });
  const decorate = await page.locator('.hud-decorate').boundingBox();
  check(
    'at home, the Decorate button is a full thumb and on screen',
    !!decorate && decorate.width >= 44 && decorate.x + decorate.width <= PHONE.width,
    JSON.stringify(decorate),
  );

  await tapElement('.hud-decorate');
  // Duckworth & Duckworth, under their dome by the wall, picked up and set down with real taps.
  await tapTile(8, 3);
  const picked = await page.evaluate(() => window.world.decorating.state?.selected?.id);
  check('a tap while decorating picks a piece up', picked === 'twoHeadedDuck', String(picked));
  await tapTile(9, 9);
  await tapElement('.hud-decor-bar button:text-is("↻ Turn")');
  await page.evaluate(() => window.view.step(40));
  const moved = await page.evaluate(() => window.world.home.pieceAt(9, 9));
  check(
    'the next tap puts it down there, and Turn turns it',
    moved?.id === 'twoHeadedDuck' && moved.turn === 1,
    JSON.stringify(moved),
  );
  await page.screenshot({ path: '.smoke/decorate.png' });
  const bar = await page.locator('.hud-decor-bar').boundingBox();
  check(
    'the decorating bar sits on screen above the home bar',
    !!bar && bar.y + bar.height <= PHONE.height && bar.height >= 44,
    JSON.stringify(bar),
  );

  await tapElement('.hud-decor-bar button:text-is("Put away")');
  await tapElement('.hud-decor-bar button:text-is("Storage")');
  await page.screenshot({ path: '.smoke/storage.png' });
  await tapElement('.hud-storage-sheet button:text-is("Put out") >> nth=0');
  const out = await page.evaluate(() => window.world.decorating.state?.selected?.id);
  check('the storage chest puts a piece out beside her, picked up', !!out, String(out));
  await tapElement('.hud-decor-bar button:text-is("Done")');
  check('Done stops decorating', await page.evaluate(() => window.world.decorating.state === null));

  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const after = await page.evaluate(() => ({
    scene: window.world.scene,
    duck: window.world.home.stored.some((s) => s.id === 'twoHeadedDuck'),
  }));
  check(
    'after a reload she is still at home, with the duck put away where she left it',
    after.scene === 'home' && after.duck,
    JSON.stringify(after),
  );

  await tapTile(6, 13);
  await stepUntil(() => window.world.scene === 'town', 'she goes out of her door');
  const outside = await playerTile();
  const spawn = await page.evaluate(() => window.world.map.spawn);
  check(
    'the door mat takes her back out to her front step',
    outside.tx === spawn.tx && outside.ty === spawn.ty,
    JSON.stringify(outside),
  );
}

async function craft() {
  await tapProp('homeHouse');
  await stepUntil(() => window.world.scene === 'home', 'she goes in to her workbench');
  // Enough for a stump stool and the first extension, as if she had been busy with the trees.
  await page.evaluate(() => {
    window.world.bag.add('wood', 66);
    window.world.bag.add('stone', 20);
  });
  await tapTile(5, 3);
  await stepUntil(
    () => document.querySelector('.hud-craft-sheet') !== null,
    'walking up to the workbench opens it',
  );
  await page.screenshot({ path: '.smoke/workbench.png' });
  await tapElement('.hud-craft-sheet .hud-tabs button:text-is("Furniture")');
  await tapElement('.hud-craft-sheet button[aria-label="Make Stump stool"]');
  const stool = await page.evaluate(() =>
    window.world.home.stored.some((s) => s.id === 'stumpStool'),
  );
  check('the workbench makes a stump stool into her storage chest', stool);

  await tapElement('.hud-craft-sheet .hud-tabs button:text-is("Home")');
  await page.screenshot({ path: '.smoke/workbench-home.png' });
  await tapElement('.hud-craft-sheet button[aria-label="Make Roomy extension"]');
  const size = await page.evaluate(() => window.world.home.room.size);
  check('the roomy extension builds her house bigger', size === 1, String(size));
  await tapElement('.hud-craft-sheet button:text-is("Done")');
  await page.evaluate(() => window.view.step(40));
  await page.screenshot({ path: '.smoke/bigger-home.png' });

  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const after = await page.evaluate(() => window.world.home.room.size);
  check('after a reload her house is still the bigger size', after === 1, String(after));
  const mat = await page.evaluate(() => window.world.home.room.mat);
  await tapTile(mat.tx, mat.ty);
  await stepUntil(() => window.world.scene === 'town', 'she goes out of her new front door');
}

/** Her stove (phase R): cooking a dish, eating it from her bag, and its spring in her step. */
async function cook() {
  await tapProp('homeHouse');
  await stepUntil(() => window.world.scene === 'home', 'she goes in to her stove');
  await page.evaluate(() => window.world.bag.add('pumpkin', 2));
  const stove = await page.evaluate(() => window.world.home.placed.find((p) => p.id === 'stove'));
  if (!stove) throw new Error('her stove is not in her home');
  await tapTile(stove.tx, stove.ty);
  await stepUntil(
    () => document.querySelector('.hud-stove-sheet') !== null,
    'walking up to the stove opens it',
  );
  await page.screenshot({ path: '.smoke/stove.png' });
  await tapElement('.hud-stove-sheet button[aria-label="Cook Pumpkin soup"]');
  const soup = await page.evaluate(() => window.world.bag.count('pumpkinSoup'));
  check('the stove cooks pumpkin soup into her bag', soup === 1, String(soup));
  const said = (await page.locator('.hud-stove-sheet .hud-message').textContent()) ?? '';
  check('the stove says what she cooked', /Pumpkin soup, cooked/.test(said), said);
  await tapElement('.hud-stove-sheet button:text-is("Done")');

  await tapElement('.hud-bag-button');
  await tapElement('.hud-bag .hud-slot[aria-label^="Pumpkin soup"]');
  await tapElement('.hud-bag-sheet .hud-eat');
  const ate = (await page.locator('.hud-bag-sheet .hud-detail p').textContent()) ?? '';
  const pace = await page.evaluate(() => window.world.kitchen.pace());
  check('eating the soup puts a spring in her step', pace > 1 && /spring/.test(ate), ate);
  await page.screenshot({ path: '.smoke/ate.png' });
  await tapElement('.hud-bag-sheet button:text("Done")');

  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const after = await page.evaluate(() => window.world.kitchen.pace());
  check('after a reload the spring is still in her step', after > 1, String(after));
  const mat = await page.evaluate(() => window.world.home.room.mat);
  await tapTile(mat.tx, mat.ty);
  await stepUntil(() => window.world.scene === 'town', 'she goes back out');
}

/**
 * Taps a button on a bed's pop-up once it has settled over its bed, as a finger would.
 * @param {string} selector
 */
async function tapCard(selector) {
  await page.waitForTimeout(450);
  await tapElement(selector);
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
  await answerCody();
  const restored = await playerTile();
  check(
    'restoring the code brings back the town it was made from',
    restored.tx === here.tx && restored.ty === here.ty,
    `${JSON.stringify(here)} -> ${JSON.stringify(restored)}`,
  );
}

async function neighbours() {
  const welcome = await page.evaluate(() => {
    const sheet = document.querySelector('.hud-talk-sheet');
    return sheet ? null : 'none';
  });
  check('no welcome is left open', welcome === 'none');

  // Walk up to whoever is out in town at this hour (phase S has some in, or beyond it), which
  // may be off screen.
  const { id: friend, tile } = await page.evaluate(() => {
    // Not Maude, whose letter is next.
    const n = window.world.neighbourhood.neighboursIn('town').find((n) => n.id !== 'maude');
    if (!n) throw new Error('nobody is out in town');
    return { id: n.id, tile: n.tile };
  });
  await page.evaluate((t) => window.world.tapTile(t.tx, t.ty), tile);
  const talking = await stepUntil(
    () => document.querySelector('.hud-talk-sheet') !== null,
    `walking up to ${friend} opens a talk`,
  );
  if (!talking) return;
  const hearts = (await page.locator('.hud-talk-sheet .hud-hearts').textContent()) ?? '';
  check('the talk shows how close they are, out of ten', hearts.length === 10, hearts);
  const buttons = await page.evaluate(() =>
    [...document.querySelectorAll('.hud-talk-sheet .hud-sheet-foot button')].map((b) =>
      b.getBoundingClientRect(),
    ),
  );
  check(
    'every answer is a full thumb and on screen',
    buttons.length >= 3 && buttons.every((b) => b.height >= 44 && b.right <= 390),
    `${buttons.length} buttons`,
  );
  await page.screenshot({ path: '.smoke/talk.png' });
  await tapElement('.hud-talk-sheet button:text-is("Give a gift")');
  await tapElement('.hud-talk-sheet .hud-slot >> nth=0');
  const points = await page.evaluate((id) => window.world.friends.of(id).points, friend);
  check(`a gift and a talk bring ${friend} closer`, points >= 20, String(points));
  await tapElement('.hud-talk-sheet button:text-is("Bye")');
  check(
    'saying bye lets them go on their way',
    (await page.evaluate(() => window.world.neighbourhood.talkingTo)) === null,
  );

  // A letter: as if Maude were nearly three hearts along, then a hello.
  await page.evaluate(() => {
    window.world.friends.update('maude', { points: 295 });
    window.world.neighbourhood.talk('maude');
    window.world.neighbourhood.endTalk();
  });
  await page.evaluate(() => window.view.step(40));
  const mailbox = await propTile('mailbox');
  await walkTo({ tx: mailbox.tx + 1, ty: mailbox.ty + 1 });
  await tapProp('mailbox');
  await stepUntil(
    () => document.querySelector('.hud-mail-sheet') !== null,
    'walking up to the mailbox opens it',
  );
  await page.screenshot({ path: '.smoke/mailbox.png' });
  await tapElement('.hud-mail-sheet .hud-seed >> nth=0');
  const enclosed = (await page.locator('.hud-mail-sheet .hud-message').textContent()) ?? '';
  check(
    "Maude's letter teaches her a recipe",
    (await page.evaluate(() => window.world.workbench.knows('moonflowerLamp'))) &&
      /Recipe/.test(enclosed),
    enclosed,
  );
  await page.screenshot({ path: '.smoke/letter.png' });
  await tapElement('.hud-mail-sheet button:text-is("Done")');

  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const kept = await page.evaluate(() => ({
    points: window.world.friends.of('maude').points,
    mail: window.world.mailbox.view().length,
  }));
  check(
    'friendships and letters are still there after a reload',
    kept.points >= 305 && kept.mail === 2,
    JSON.stringify(kept),
  );

  const cart = await page.evaluate(() => window.world.stalls.moonPieCart());
  if (!cart) {
    console.log('note  the Moon Pie Man is not in town today, so his visit is skipped');
    return;
  }
  await page.evaluate((c) => window.world.tapTile(c.tx, c.ty + 1), cart);
  await stepUntil(() => !window.world.player.moving, 'she reaches the Moon Pie Man');
  await page.evaluate(() => window.view.step(40));
  await page.screenshot({ path: '.smoke/moonpie.png' });
  check(
    'walking up to the Moon Pie Man opens his cart',
    (await page.locator('.hud-shop-sheet h2:has-text("Moon Pie Man")').count()) === 1,
  );
  await tapElement('.hud-shop-sheet .hud-primary');
}

async function critters() {
  // At ten at night, by a dev build's ?hour=, the night's critters are out: moths at the lanterns,
  // orbs in the graveyard, a lantern fish in the pond.
  await page.goto(`${URL_BASE}?loop=manual&hour=22`, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
  await answerCody();
  const out = await page.evaluate(() => window.world.collecting.critters());
  check('critters are out after dark', out.length >= 4, out.map((c) => c.critter).join(', '));
  // One she can see, since a tap off the edge of the screen lands nowhere. Which critters are
  // out, and where, changes with the day, so she first walks over near the closest one.
  await page.evaluate(() => {
    const w = window.world;
    const me = w.movement.tile;
    const far = (/** @type {{ tx: number, ty: number }} */ c) =>
      Math.abs(c.tx - me.tx) + Math.abs(c.ty - me.ty);
    const [near] = w.collecting
      .critters()
      .filter((c) => w.canWalk(c.tx, c.ty))
      .sort((a, b) => far(a) - far(b));
    if (!near || far(near) < 5) return;
    for (let r = 3; r <= 6; r++) {
      for (const [dx, dy] of /** @type {const} */ ([
        [0, r],
        [0, -r],
        [r, 0],
        [-r, 0],
      ])) {
        if (w.canWalk(near.tx + dx, near.ty + dy) && w.tapTile(near.tx + dx, near.ty + dy)) return;
      }
    }
  });
  await stepUntil(() => !window.world.player.moving, 'she walks over near a critter');
  await page.evaluate(() => window.view.step(16, 120));
  const target = await page.evaluate(() => {
    // Above the quick bar, which takes a tap on the town under it.
    const bar = document.querySelector('.hud-quick-slots')?.getBoundingClientRect();
    const bottom = bar ? bar.top - 16 : window.innerHeight;
    const onScreen = (/** @type {{ tx: number, ty: number }} */ c) => {
      const at = window.view.tileToClient(c.tx, c.ty);
      return at.x > 0 && at.y > 0 && at.x < window.innerWidth && at.y < bottom;
    };
    return window.world.collecting.critters().find(
      (c) =>
        // A fish, in the water, is for her rod, which the fishing section tries.
        window.world.canWalk(c.tx, c.ty) &&
        onScreen(c) &&
        !window.world.neighbourhood.villagerAt(c.tx, c.ty) &&
        !window.world.neighbourhood.villagerAt(c.tx, c.ty + 1),
    );
  });
  check('a critter is out where she can see it', target !== undefined);
  if (!target) return;
  const before = await page.evaluate(() => window.world.cabinet.found);
  // A wary one flutters off once, so it may take a second go.
  for (let tries = 0; tries < 3; tries++) {
    const now = await page.evaluate(
      (key) => window.world.collecting.critters().find((c) => c.key === key) ?? null,
      target.key,
    );
    if (!now) break;
    await tapTile(now.tx, now.ty);
    await stepUntil(() => !window.world.player.moving, `she reaches the ${target.critter}`);
    await page.evaluate(() => window.view.step(40));
    if (tries === 0) await page.screenshot({ path: '.smoke/net.png' });
  }
  const caught = await page.evaluate((id) => window.world.bag.count(id), target.critter);
  check('tapping a critter walks her up to it and nets it', caught >= 1, target.critter);
  const found = await page.evaluate(() => window.world.cabinet.found);
  check(
    'a new catch goes in the Curiosity Cabinet, with a fuss',
    found === before + 1 && (await page.locator('.hud-toast-special').count()) === 1,
    `${before} -> ${found}`,
  );

  await tapElement('.hud-cabinet');
  const book = await page.evaluate(() => {
    const slots = [
      ...document.querySelectorAll('.hud-cabinet-sheet .hud-slot:not(.hud-slot-empty)'),
    ];
    return {
      cases: slots.length,
      thumb: slots.every((s) => s.getBoundingClientRect().width >= 44),
      onScreen: slots.every((s) => s.getBoundingClientRect().right <= 390),
      found: document.querySelector('.hud-cabinet-sheet h2 + p')?.textContent ?? '',
    };
  });
  check(
    'the Curiosity Cabinet has a thumb-sized case for every critter, all on screen',
    book.cases === 34 && book.thumb && book.onScreen,
    JSON.stringify(book),
  );
  // A tap earlier in the run can net a critter that happened to be on the tile, by the real clock.
  check('it counts what she has found', book.found.startsWith(`${found} of 34 found`), book.found);
  await page.screenshot({ path: '.smoke/cabinet.png' });
  await tapElement('.hud-cabinet-sheet button:text-is("Done")');

  // Crumbs & Curios, east of the square: in, and up to one of the museum's cases.
  if (!(await goInto('bakery', 'crumbs'))) return;
  await tapFixture('museumCase');
  const museum = (await page.locator('.hud-museum-sheet').count()) === 1;
  check("walking up to a case in Wrapunzel's museum opens it", museum);
  if (!museum) return goOut();
  await page.screenshot({ path: '.smoke/museum.png' });
  // Any other catch she has is listed too, so donate from the top until hers is on show.
  const isShown = () => page.evaluate((id) => window.world.cabinet.isDonated(id), target.critter);
  for (let i = 0; i < found && !(await isShown()); i++) {
    await tapElement('.hud-museum-sheet button:text-is("Donate") >> nth=0');
  }
  const donated = await page.evaluate(
    (id) => window.world.cabinet.isDonated(id) && window.world.bag.count(id) === 0,
    target.critter,
  );
  const label = (await page.locator('.hud-museum-sheet .hud-message').textContent()) ?? '';
  check('donating puts it on show, with a label', donated && label.length > 0, label);
  await page.screenshot({ path: '.smoke/donated.png' });
  await tapElement('.hud-museum-sheet button:text-is("Done")');

  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const kept = await page.evaluate(
    (id) => window.world.cabinet.caughtOn(id) !== null && window.world.cabinet.isDonated(id),
    target.critter,
  );
  check('the Cabinet and the museum are still there after a reload', kept);
  await page.screenshot({ path: '.smoke/museum-cases.png' });
  await goOut();
}

async function fishing() {
  // At noon there are always a few fish in the town's pond, shadows under the water.
  await page.goto(`${URL_BASE}?loop=manual&hour=12`, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
  await answerCody();
  const fish = await page.evaluate(() =>
    window.world.collecting.critters().filter((c) => !window.world.canWalk(c.tx, c.ty)),
  );
  check('fish are in the water at noon', fish.length >= 2, fish.map((c) => c.critter).join(', '));
  const [first] = fish;
  if (!first) return;
  // Over to the bank near it, so its shadow is on screen for a real tap.
  await page.evaluate((c) => {
    const w = window.world;
    for (let r = 2; r <= 5; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (w.canWalk(c.tx + dx, c.ty + dy) && w.tapTile(c.tx + dx, c.ty + dy)) return;
        }
      }
    }
  }, first);
  await stepUntil(() => !window.world.player.moving, 'she walks over to the pond');
  await page.evaluate(() => window.view.step(16, 60));
  await page.screenshot({ path: '.smoke/fish-shadows.png' });
  await tapTile(first.tx, first.ty);
  await stepUntil(() => window.world.fishing.line !== null, 'she casts to the fish');
  check(
    'tapping a shadow walks her to the bank and casts her rod',
    (await page.evaluate(() => window.world.hands.held)) === 'rod',
  );
  // Her line is read off the real clock, so a bite comes in real time: wait for one, and tap.
  // One missed only comes round again, so she has a few goes.
  let landed = false;
  for (let tries = 0; tries < 4 && !landed; tries++) {
    await page.waitForFunction(() => window.world.fishing.line?.state === 'bite', null, {
      timeout: 20_000,
      polling: 30,
    });
    await page.evaluate(() => window.view.step(16));
    if (tries === 0) await page.screenshot({ path: '.smoke/fish-bite.png' });
    const me = await playerTile();
    await tapTile(me.tx, me.ty + 2);
    await page.evaluate(() => window.view.step(16, 2));
    landed = await page.evaluate((id) => window.world.bag.count(id) > 0, first.critter);
    if (!landed) {
      await tapTile(first.tx, first.ty);
      await stepUntil(() => window.world.fishing.line !== null, 'she casts again');
    }
  }
  check('a tap on the bite lands the fish, into her bag', landed, first.critter);
  await page.screenshot({ path: '.smoke/fish-caught.png' });
  check('the catch is told with a fuss', (await page.locator('.hud-toast-special').count()) === 1);
}

async function pets() {
  await reloadGame();
  await tapProp('homeHouse');
  await stepUntil(() => window.world.scene === 'home', 'she goes home to her pets');
  const home = await page.evaluate(() => window.world.petCare.here().map((p) => p.id));
  check('all six pets are at home', home.length === 6, home.join(', '));
  await page.screenshot({ path: '.smoke/pets.png' });

  // A real tap on Dolly walks her over, and opens Dolly's sheet with a pat.
  const dolly = await page.evaluate(() => window.world.petCare.pet('dolly').tile);
  await tapTile(dolly.tx, dolly.ty);
  const opened = await stepUntil(
    () => document.querySelector('.hud-pet-sheet') !== null,
    'walking up to Dolly opens her sheet',
  );
  if (!opened) return;
  const sheet = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('.hud-pet-sheet .hud-sheet-foot button')];
    return {
      name: document.querySelector('.hud-pet-sheet h2')?.textContent ?? '',
      said: document.querySelector('.hud-pet-sheet .hud-speech')?.textContent ?? '',
      thumb: buttons.every((b) => b.getBoundingClientRect().height >= 44),
      onScreen: buttons.every((b) => b.getBoundingClientRect().right <= 390),
    };
  });
  check(
    'her sheet has her name, a pat, and thumb-sized buttons on screen',
    sheet.name === 'Dolly' && sheet.said.includes('Dolly') && sheet.thumb && sheet.onScreen,
    JSON.stringify(sheet),
  );
  await page.screenshot({ path: '.smoke/pet-sheet.png' });

  await tapElement('.hud-pet-sheet button:text-is("Come for a walk")');
  await tapElement('.hud-pet-sheet button:text-is("Dress up")');
  await tapElement('.hud-pet-sheet .hud-slot[aria-label="Scarlet bandana"]');
  await tapElement('.hud-pet-sheet button:text-is("Done")');
  await tapElement('.hud-pet-sheet button:text-is("Rename")');
  await page.locator('.hud-pet-sheet .hud-name').fill('Dolly Parton');
  await tapElement('.hud-pet-sheet button:text-is("Save")');
  const dressed = await page.evaluate(() => ({
    walking: window.world.pets.walking,
    wearing: window.world.pets.wearing('dolly'),
    name: window.world.pets.nameOf('dolly'),
  }));
  check(
    'she can take Dolly for a walk, dress her and rename her',
    dressed.walking === 'dolly' &&
      dressed.wearing === 'scarletBandana' &&
      dressed.name === 'Dolly Parton',
    JSON.stringify(dressed),
  );
  await page.screenshot({ path: '.smoke/pet-dressed.png' });
  await tapElement('.hud-pet-sheet button:text-is("Bye")');

  const mat = await page.evaluate(() => window.world.home.room.mat);
  await tapTile(mat.tx, mat.ty);
  await stepUntil(() => window.world.scene === 'town', 'she goes out with Dolly');
  await page.evaluate(() => window.view.step(40, 20));
  const out = await page.evaluate((T) => {
    const d = window.world.petCare.pet('dolly');
    const p = window.world.player;
    return {
      scene: d.scene,
      reach: Math.max(
        Math.abs(d.tile.tx - Math.floor(p.x / T)),
        Math.abs(d.tile.ty - Math.floor(p.y / T)),
      ),
    };
  }, TILE);
  check(
    'Dolly comes out into town at her side',
    out.scene === 'town' && out.reach <= 1,
    JSON.stringify(out),
  );
  await page.screenshot({ path: '.smoke/pet-walk.png' });

  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const kept = await page.evaluate(() => ({
    walking: window.world.pets.walking,
    scene: window.world.petCare.pet('dolly').scene,
    name: window.world.pets.nameOf('dolly'),
  }));
  check(
    'Dolly, her name and her walk are still there after a reload',
    kept.walking === 'dolly' && kept.scene === 'town' && kept.name === 'Dolly Parton',
    JSON.stringify(kept),
  );
}

/** The mayor's letter pins the first clue, and her corkboard at home shows the case so far. */
async function mystery() {
  await tapProp('mailbox');
  const open = await stepUntil(
    () => document.querySelector('.hud-mail-sheet') !== null,
    'walking up to the mailbox opens it',
  );
  if (!open) return;
  await tapElement('.hud-mail-sheet .hud-seed:has-text("the Mayor")');
  const letter = (await page.locator('.hud-mail-sheet .hud-letter').textContent()) ?? '';
  check(
    "the mayor's letter welcomes her by name",
    /^Dear Smoke,/.test(letter),
    letter.slice(0, 30),
  );
  await tapElement('.hud-mail-sheet button:text-is("Done")');
  check(
    "reading it pins the mayor's letter to her corkboard",
    await page.evaluate(() => window.world.casebook.foundOn('welcome') !== null),
  );

  await tapProp('homeHouse');
  await stepUntil(() => window.world.scene === 'home', 'she goes in her front door');
  const board = await page.evaluate(
    () => window.world.home.placed.find((p) => p.id === 'mysteryCorkboard') ?? null,
  );
  check('her corkboard is up at home', board !== null);
  if (!board) return;
  await page.evaluate((b) => window.world.tapTile(b.tx, b.ty), board);
  const sheet = await stepUntil(
    () => document.querySelector('.hud-corkboard-sheet') !== null,
    'walking up to the corkboard opens it',
  );
  if (sheet) {
    const text = (await page.locator('.hud-corkboard-sheet').textContent()) ?? '';
    // At least the letter and a friend's rumour; Wes may have been spotted too, by the real clock.
    const pinned = await page.evaluate(
      () => Object.keys(window.world.casebook.snapshot().clues).length,
    );
    check(
      'the corkboard shows the clues found and the suspects so far',
      pinned >= 2 && new RegExp(`${pinned} of 6 clues`).test(text) && /Wes/.test(text),
      text.slice(0, 60),
    );
    const wide = await page.evaluate(() =>
      [...document.querySelectorAll('.hud-clue')].every(
        (c) => c.getBoundingClientRect().right <= window.innerWidth,
      ),
    );
    check('every clue card fits on screen', wide);
    await page.screenshot({ path: '.smoke/corkboard.png' });
    await tapElement('.hud-corkboard-sheet button:text-is("Done")');
  }
  const mat = await page.evaluate(() => window.world.home.room.mat);
  await page.evaluate((m) => window.world.tapTile(m.tx, m.ty), mat);
  await stepUntil(() => window.world.scene === 'town', 'she goes back out');
}

/**
 * The sound starts with her first touch, the settings sheet can hush it, and Walk the Tomb on the
 * record player gets her dancing, with Cody over from next door.
 */
async function sound() {
  const step = await playerTile();
  await tapTile(step.tx + 1, step.ty + 1);
  await stepUntil(() => !window.world.player.moving, 'a step, to wake the sound');
  const state = await page.evaluate(() => window.sound.state);
  check('a tap starts the sound', state === 'running', state);

  await tapElement('.hud-settings');
  const switches = await page.locator('.hud-toggle').allTextContents();
  check(
    'settings has switches for the sounds and the music',
    switches.join('|') === 'Sounds: on|Music: on',
    switches.join('|'),
  );
  await tapElement('.hud-toggle:has-text("Music")');
  const saved = await page.evaluate(() => localStorage.getItem('mcfrancisville:sound'));
  check('turning the music off is remembered on this phone', /"music":false/.test(saved ?? ''));
  await tapElement('.hud-toggle:has-text("Music")');
  await tapElement('.hud-sheet button:text("Done")');

  await tapProp('homeHouse');
  await stepUntil(() => window.world.scene === 'home', 'she goes in her front door');
  const player = await page.evaluate(() => {
    const w = window.world;
    w.bag.add('recordWalkTheTomb', 1);
    w.home.store('recordPlayer');
    w.decorating.takeOut('recordPlayer');
    w.decorating.stop();
    return w.home.placed.find((p) => p.id === 'recordPlayer') ?? null;
  });
  check('a record player can be set out at home', player !== null);
  if (!player) return;
  // The pets potter about the room by the clock, and a tap on a pet reaches the pet, so wait
  // for the tile to be clear of them; otherwise, now and then, she'd be off to pat one instead.
  await stepUntil(() => {
    const at = window.world.home.placed.find((p) => p.id === 'recordPlayer');
    return !at || !window.world.petCare.petAt(at.tx, at.ty);
  }, 'no pet is sitting on the record player');
  await page.evaluate((p) => window.world.tapTile(p.tx, p.ty), player);
  await stepUntil(() => window.sound.recordPlaying, 'walking up to it puts a record on');
  const dance = await page.evaluate(() => window.world.recordPlayer.dance());
  check(
    'Walk the Tomb gets her dancing, with Cody beside her',
    !!dance?.cody,
    JSON.stringify(dance),
  );
  await page.evaluate(() => window.view.step(40, 3));
  await page.screenshot({ path: '.smoke/dance.png' });
  const mat = await page.evaluate(() => window.world.home.room.mat);
  await page.evaluate((m) => window.world.tapTile(m.tx, m.ty), mat);
  await stepUntil(() => window.world.scene === 'town', 'she goes back out');
  check('going out takes the record off', !(await page.evaluate(() => window.sound.recordPlaying)));
}

/**
 * Off the east end of the road into Whisperwood, drawn and faded in; the world map shows it, and
 * takes her home; and a reload keeps her in the woods.
 */
async function zones() {
  await closeSheets();
  await page.evaluate(() => {
    const road = window.world.map.exits.find((e) => e.to === 'whisperwood');
    if (road) window.world.tapTile(road.tx, road.ty);
  });
  const went = await stepUntil(
    () => window.world.scene === 'whisperwood',
    'she walks into the woods',
  );
  if (!went) return;
  check(
    'the woods fade in from dark',
    await page.evaluate(() => !!document.querySelector('.hud-fade.fading')),
  );
  await page.evaluate(() => window.view.step(40, 10));
  // Toasts for big moments take turns, so a letter that came just before may be showing first.
  const found = await page
    .waitForFunction(
      () => /Whisperwood/.test(document.querySelector('.hud-toast')?.textContent ?? ''),
      null,
      { timeout: 10_000 },
    )
    .then(() => true)
    .catch(() => false);
  check('finding the woods is a moment', found);
  const painted = await page.evaluate(() => {
    const el = /** @type {HTMLCanvasElement} */ (document.getElementById('game'));
    const px = el.getContext('2d')?.getImageData(el.width >> 1, el.height >> 1, 1, 1).data;
    return px ? px[3] === 255 : false;
  });
  check('the woods are drawn', painted);
  await page.screenshot({ path: '.smoke/whisperwood.png' });

  const crowded = await page.evaluate(() => {
    const purse = document.querySelector('.hud-candy')?.getBoundingClientRect();
    const first = document.querySelector('.hud-corner')?.getBoundingClientRect();
    return purse && first ? purse.right > first.left : true;
  });
  check("the corner's buttons stay clear of her Candy", !crowded);

  await tapElement('.hud-map-button');
  const pins = await page.locator('.hud-map-place').allTextContents();
  // The town, the woods, and question marks down the ways to the shore and the castle; the hidden
  // clearing is a secret, so not even a question mark.
  check(
    'the map shows the town, the woods and question marks',
    pins.length === 4 && pins.some((p) => p.includes('???')),
    pins.join(' | '),
  );
  await page.screenshot({ path: '.smoke/map.png' });
  await tapElement('.hud-map-place:has-text("McFrancisVille")');
  await page.evaluate(() => window.view.step(40, 2));
  const home = await page.evaluate(() => ({
    scene: window.world.scene,
    tile: window.world.movement.tile,
    spawn: window.world.map.spawn,
    sheet: !!document.querySelector('.hud-sheet'),
  }));
  check(
    'a tap on the town takes her to her door, and the map closes',
    home.scene === 'town' &&
      home.tile.tx === home.spawn.tx &&
      home.tile.ty === home.spawn.ty &&
      !home.sheet,
    JSON.stringify(home),
  );

  await page.evaluate(() => window.world.travel.go('whisperwood'));
  await page.evaluate(() => window.view.step(40, 2));
  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  check(
    'a reload keeps her in the woods',
    (await page.evaluate(() => window.world.scene)) === 'whisperwood',
  );
  await page.evaluate(() => window.world.travel.go('town'));
  await page.evaluate(() => window.view.step(40, 2));
}

/**
 * The places beyond the town (phase I): the castle gate shut at the lookout with its hint, the
 * shore, the hidden clearing with the key dug up from its mound, and through the gate to the
 * castle once it opens.
 */
async function places() {
  await closeSheets();
  await page.evaluate(() => window.world.travel.go('town'));
  await page.evaluate(() => window.view.step(40, 2));
  await page.evaluate(() => window.world.tapTile(28, 1));
  await stepUntil(() => !window.world.player.moving, 'she walks up to the castle gate');
  await page.evaluate(() => window.view.step(40, 10));
  const gate = (await page.locator('.hud-toast').textContent()) ?? '';
  check('the castle gate is locked, and says where the key might be', /ring/.test(gate), gate);
  await page.screenshot({ path: '.smoke/gate.png' });

  // To the shore with the skates, and a look.
  await page.evaluate(() => {
    window.world.bag.add('iceSkates', 1);
    window.world.travel.cross({ to: 'whisperwood', along: 0 });
  });
  await page.evaluate(() => window.view.step(40, 4));
  await page.evaluate(() => window.world.travel.cross({ to: 'lanternShore', along: 0 }));
  await page.evaluate(() => window.view.step(40, 10));
  check(
    'the shore is there past the creek',
    (await page.evaluate(() => window.world.scene)) === 'lanternShore',
  );
  await page.screenshot({ path: '.smoke/shore.png' });

  // Up the hidden way into the clearing, and the key from the ring of toadstools.
  await page.evaluate(() => window.world.travel.cross({ to: 'whisperwood', along: 0 }));
  await page.evaluate(() => window.view.step(40, 4));
  await page.evaluate(() => window.world.travel.cross({ to: 'hiddenClearing', along: 0 }));
  await page.evaluate(() => window.view.step(40, 10));
  await tapTile(8, 11);
  await stepUntil(() => window.world.bag.count('castleKey') > 0, 'she digs up the castle key');
  await page.evaluate(() => window.view.step(40, 10));
  await page.screenshot({ path: '.smoke/clearing.png' });

  // Home by the map, and up through the gate, open now.
  await page.evaluate(() => window.world.travel.go('town'));
  await page.evaluate(() => window.view.step(40, 2));
  await page.evaluate(() => window.world.tapTile(29, 0));
  const up = await stepUntil(
    () => window.world.scene === 'castleHill',
    'she goes up to the castle',
  );
  if (up) {
    await page.evaluate(() => window.view.step(40, 30));
    await page.screenshot({ path: '.smoke/castle.png' });
    await page.evaluate(() => window.world.travel.go('town'));
    await page.evaluate(() => window.view.step(40, 2));
  }
}

/** Round Cody's manor: going in by the door, what's there, a keepsake, and back out. */
async function interiors() {
  if (!(await goInto('codyHouse', 'codyManor'))) return;
  const welcome = (await page.locator('.hud-toast').textContent()) ?? '';
  check("going into Cody's manor says so", /Cody's manor/.test(welcome), welcome);
  await page.screenshot({ path: '.smoke/manor.png' });
  await tapFixture('pipeOrgan');
  const organ = (await page.locator('.hud-toast').textContent()) ?? '';
  check('walking up to the pipe organ gets a line from it', /love song/.test(organ), organ);
  const settee = await page.evaluate(() => {
    const room = window.world.zones.inside(window.world.scene);
    const thing = room?.things.find((t) => 'piece' in t && t.piece.id === 'velvetSettee');
    return thing && 'piece' in thing ? { tx: thing.piece.tx, ty: thing.piece.ty } : null;
  });
  if (settee) {
    await tapTile(settee.tx, settee.ty);
    await stepUntil(() => !window.world.player.moving, 'she reaches the settee');
    await page.evaluate(() => window.view.step(40, 20));
    const said = (await page.locator('.hud-toast').textContent()) ?? '';
    check('a keepsake not hers yet says he is saving one for her', /saving one/.test(said), said);
  }
  await goOut();
  const out = await page.evaluate(() => {
    const manor = window.world.map.props.find((p) => p.id === 'codyHouse');
    const here = window.world.movement.tile;
    return window.world.scene === 'town' && !!manor && here.ty === manor.ty + manor.h;
  });
  check("the mat takes her back out in front of Cody's door", out);
}

async function lives() {
  // At ten in the morning, weekday or weekend, some of her neighbours are in: at home, at work,
  // browsing a shop, or round at hers.
  await page.goto(`${URL_BASE}?loop=manual&hour=10`, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
  await answerCody();
  const found = await page.evaluate(() => {
    const n = window.world.neighbourhood.neighbours.find(
      (n) => !window.world.zones.outdoor(n.zone),
    );
    if (!n) return null;
    const door = window.world.zones.map('town').map.doors.find((d) => d.to === n.zone);
    return { id: n.id, zone: n.zone, building: door?.prop ?? null };
  });
  check('someone is in at ten in the morning', found !== null && found.building !== null);
  if (!found?.building) return;
  if (!(await goInto(found.building, found.zone))) return;
  const tile = await page.evaluate((id) => window.world.neighbourhood.neighbour(id).tile, found.id);
  await tapTile(tile.tx, tile.ty);
  const talking = await stepUntil(
    () => document.querySelector('.hud-talk-sheet') !== null,
    `a tap on ${found.id} in ${found.zone} opens a talk`,
  );
  if (talking) check(`${found.id} talks to her in ${found.zone}`, true);
  await page.screenshot({ path: '.smoke/lives.png' });
  if (talking) await tapElement('.hud-talk-sheet button:text-is("Bye")');
  if (found.zone === 'home') {
    const mat = await page.evaluate(() => window.world.zones.home.entry().tile);
    await tapTile(mat.tx, mat.ty);
    await stepUntil(() => window.world.scene === 'town', 'she goes back out');
  } else await goOut();
}

async function gallery() {
  await page.goto(`${URL_BASE}?gallery`, { waitUntil: 'load', timeout: 60_000 });
  const count = await page.locator('#gallery canvas').count();
  check('the gallery shows every sprite', count > 20, `${count} sprites`);
  // The gallery is a very long page; a full-page picture of it takes a while.
  await page.screenshot({ path: '.smoke/gallery.png', fullPage: true, timeout: 120_000 });
}

/** @type {[string, () => Promise<void>][]} */
const SECTIONS = [
  ['boot', boot],
  ['pwa', pwa],
  ['walk', walk],
  ['camera', camera],
  ['smooth', smooth],
  ['save', save],
  ['closet', closet],
  ['salon', salon],
  ['gather', gather],
  ['bag', bag],
  ['calendar', calendar],
  ['notices', notices],
  ['passive', passive],
  ['farm', farm],
  ['shop', shop],
  ['home', home],
  ['craft', craft],
  ['cook', cook],
  ['neighbours', neighbours],
  ['mystery', mystery],
  ['sound', sound],
  ['settings', settings],
  ['weather', weather],
  ['night', night],
  ['critters', critters],
  ['fishing', fishing],
  ['pets', pets],
  ['zones', zones],
  ['places', places],
  ['interiors', interiors],
  ['lives', lives],
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
