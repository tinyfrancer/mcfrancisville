/**
 * The smoke check's shared helpers and state: the phone's shape, the base URL, `check` and its
 * results, the page every helper drives (set by the runner, swapped by `setPage`), the cranked
 * waits, the real taps, the sheet frame, the faked cloud. Every area file (`./<area>.mjs`) and the
 * runner (`./run.mjs`) import from here; nothing here starts a browser.
 */
export const URL_BASE = process.env.SMOKE_URL ?? 'http://localhost:5173/';

/**
 * An ordinary day for the sections that open at an hour: by the real date, October's evenings
 * would turn a walk up to a neighbour's door into a knock and queue the festival's toasts ahead
 * of the ones a check waits for. The festival's own sections name their days.
 */
export const PLAIN_DAY = '2026-09-30';

export const PHONE = { width: 390, height: 844 };

/** `TILE_SIZE` in `src/config/world.ts`: world pixels to a tile. */
export const TILE = 32;

/** @type {{ name: string, passed: boolean, detail: string }[]} */
export const results = [];

/** @param {string} name @param {boolean} passed @param {string} [detail] */
export function check(name, passed, detail = '') {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  // On CI, a failure is an annotation too, readable from the check run when its log isn't.
  if (!passed && process.env.GITHUB_ACTIONS) {
    console.log(`::error title=smoke::${name}${detail ? ` (${detail})` : ''}`.slice(0, 900));
  }
}

/** @type {import('playwright').BrowserContextOptions} */
export const PHONE_CONTEXT = {
  viewport: PHONE,
  deviceScaleFactor: 3,
  hasTouch: true,
  isMobile: true,
  // Smoke cranks the game faster than real time, so a CSS animation (the fade between places) is
  // still running when it takes a picture; reduced motion cuts it to a millisecond.
  reducedMotion: 'reduce',
};

/**
 * The cloud save's function (V1's S2, `api/save.ts`), faked for the dev server, which hasn't it:
 * the same answers over a store in memory that every context given it shares, as phones share
 * the cloud. `setUp: false` answers as the function does before its store is linked.
 * @type {Map<string, { savedAt: number, data: string }>}
 */
export const cloudStore = new Map();

/** @param {import('playwright').BrowserContext} ctx @param {{ setUp?: boolean }} [options] */
export async function fakeCloud(ctx, { setUp = true } = {}) {
  await ctx.route('**/api/save?*', async (route) => {
    const request = route.request();
    const id = new URL(request.url()).searchParams.get('id') ?? '';
    /** @param {number} status @param {unknown} body */
    const answer = (status, body) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (!/^[0-9a-f]{64}$/.test(id)) return answer(400, { error: 'id' });
    if (!setUp) return answer(503, { error: 'not-set-up', message: 'not linked' });
    if (request.method() === 'GET') return answer(200, { save: cloudStore.get(id) ?? null });
    const body = request.postDataJSON();
    const kept = cloudStore.get(id);
    if (kept && kept.savedAt > body.savedAt)
      return answer(409, { kept: false, savedAt: kept.savedAt });
    cloudStore.set(id, { savedAt: body.savedAt, data: body.data });
    return answer(200, { kept: true, savedAt: body.savedAt });
  });
}

/** The browser, launched by the runner. @type {import('playwright').Browser} */
export let browser;
/** The phone every section shares, made by the runner. @type {import('playwright').BrowserContext} */
export let context;
/** The page every helper drives; `firstDay` swaps in a new town's for a while (V1's R1). @type {import('playwright').Page} */
export let page;

/**
 * Hands the helpers the runner's browser, its phone and its page.
 * @param {import('playwright').Browser} b @param {import('playwright').BrowserContext} c
 * @param {import('playwright').Page} p
 */
export function attach(b, c, p) {
  browser = b;
  context = c;
  page = p;
}

/** Swaps the page every helper drives: another phone's for a while, then back. @param {import('playwright').Page} p */
export function setPage(p) {
  page = p;
}

/** A section: its name (its screenshots' too) and what it does. @typedef {[string, () => Promise<void>]} Section */

/** @type {string[]} */
export const consoleErrors = [];

/** @param {import('playwright').Page} p */
export function listen(p) {
  p.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  p.on('pageerror', (e) => consoleErrors.push(String(e)));
}

/** Game time per cranked frame: a steady 25fps. */
export const FRAME_MS = 40;

/**
 * Waits until no pet is crossing the mat at home: they potter across it now and then, and a tap on
 * a pet reaches the pet, so she'd stop to pat one instead of going out. A neighbour visiting her
 * comes through after her onto the mat (0.3's H4) and steps off it, so it waits for them too.
 */
export async function clearMat() {
  await stepUntil(() => {
    const m = window.world.home.rooms.room.mat;
    return (
      !window.world.petCare.petAt(m.tx, m.ty) && !window.world.neighbourhood.villagerAt(m.tx, m.ty)
    );
  }, 'nobody is crossing the mat');
}

/**
 * Cranks the game until `done` holds in the page (a function, or an expression as a string).
 * @param {(() => boolean) | string} done @param {string} label @param {number} [budgetMs]
 */
export async function stepUntil(done, label, budgetMs = 20_000) {
  for (let spent = 0; spent < budgetMs; spent += FRAME_MS * 5) {
    if (await page.evaluate(done)) return true;
    await page.evaluate((ms) => window.view.step(ms, 5), FRAME_MS);
  }
  check(`${label} within ${budgetMs}ms of game time`, false);
  return false;
}

/**
 * A real touch on a tile, or, when a HUD control is on it or near enough for the browser's touch
 * adjustment to snap the tap onto it (the corner buttons, the day's chip, a toast, which takes a
 * tap to send it off), the same tap through the world, as she'd move the town into the clear first.
 * @param {number} tx @param {number} ty
 */
export async function tapTile(tx, ty) {
  // A frame first, so a bar that just changed has refitted the world under it.
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => done(null))));
  const at = await page.evaluate((t) => window.view.tileToClient(t.tx, t.ty), { tx, ty });
  const covered = await page.evaluate((p) => {
    const near = 16;
    // Off the edge of the view at Close (decision 290): she'd walk nearer first.
    const view = document.querySelector('.hud-view')?.getBoundingClientRect();
    if (view && (p.x < view.left || p.x > view.right || p.y < view.top || p.y > view.bottom)) {
      return true;
    }
    return [...document.querySelectorAll('.hud button, .hud-toast-shown')].some((b) => {
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

/**
 * Sends off a toast that stands in her way with a tap on it, as she would. A toast goes by itself
 * once it has been read, so it may be gone by the time the tap comes; then there's nothing to do.
 */
export async function tapToastAway() {
  const toast = await page.locator('.hud-toast-shown').boundingBox();
  if (toast) await page.touchscreen.tap(toast.x + toast.width / 2, toast.y + toast.height / 2);
  await page.evaluate(() => window.view.step(40, 2));
}

/** Closes whatever sheet is open, as a tap on its backdrop would. */
export async function closeSheets() {
  for (let i = 0; i < 3 && (await page.locator('.hud-backdrop').count()) > 0; i++) {
    await page.evaluate(() =>
      /** @type {HTMLElement} */ (document.querySelector('.hud-backdrop'))?.click(),
    );
  }
}

/**
 * The sheet frame (0.2's U2), checked on each sheet as it opens: a title of the larger type, a
 * picture beside it when it has one, nothing wider than the screen, and each of its tabs, tapped,
 * showing its own panel and only that.
 * @param {string} sheet
 * @param {{ picture?: boolean, tabs?: string[] }} [options]
 */
export async function framed(sheet, { picture = false, tabs = [] } = {}) {
  const frame = await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const title = element.querySelector('.hud-sheet-head h2');
    const shown = element.querySelector('.hud-sheet-picture canvas');
    return {
      title: title?.textContent ?? '',
      size: title ? parseFloat(getComputedStyle(title).fontSize) : 0,
      picture: !!shown && shown.getBoundingClientRect().width > 0,
      wide: element.scrollWidth > element.clientWidth + 1,
      tabs: [...element.querySelectorAll('.hud-sheet-tab')].map((t) => t.textContent),
      parts: ['head', 'body', 'foot'].every((p) => element.querySelector(`.hud-sheet-${p}`)),
    };
  }, sheet);
  const ok =
    !!frame &&
    frame.parts &&
    frame.title !== '' &&
    frame.size >= 24 &&
    frame.picture === picture &&
    !frame.wide &&
    JSON.stringify(frame.tabs) === JSON.stringify(tabs);
  check(`${sheet} is on the sheet frame`, ok, JSON.stringify(frame));
  if (!ok) return;
  for (const tab of tabs) {
    await tapElement(`${sheet} .hud-sheet-tab:text-is("${tab}")`);
    const panels = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      const on = element?.querySelector('.hud-sheet-tab[aria-selected="true"]');
      const visible = [...(element?.querySelectorAll('.hud-sheet-panel') ?? [])].filter(
        (p) => !(/** @type {HTMLElement} */ (p).hidden),
      );
      return { on: on?.textContent, shown: visible.map((p) => p.getAttribute('aria-labelledby')) };
    }, sheet);
    check(
      `${sheet}'s ${tab} tab shows its own panel`,
      panels.on === tab && panels.shown.length === 1,
      JSON.stringify(panels),
    );
  }
  if (tabs.length > 0) await tapElement(`${sheet} .hud-sheet-tab:text-is("${tabs[0]}")`);
}

export async function playerTile() {
  return page.evaluate(
    (T) => ({
      tx: Math.floor(window.world.player.x / T),
      ty: Math.floor(window.world.player.y / T),
    }),
    TILE,
  );
}

/** The title again after a reload, his words on it now, and a tap to go in. */
export async function titleAgain() {
  const line = (await page.locator('.hud-title-dedication').textContent()) ?? '';
  check('the title greets her with his words every time after', /whole world/.test(line), line);
  await tapElement('.hud-title-begin');
}

/**
 * Every time the game opens, Cody greets her (decisions.md 24, 114), and she answers: "Hi, Cody!",
 * or "On it!", or "Red one!".
 */
export async function answerCody() {
  const greeting = page.locator('.hud-talk-sheet .hud-done');
  if ((await greeting.count()) > 0) await tapElement('.hud-talk-sheet .hud-done');
}

export async function reloadGame() {
  await page.reload({ waitUntil: 'load', timeout: 60_000 });
  await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
  if ((await page.locator('.hud-title').count()) > 0) await titleAgain();
  await answerCody();
}

/**
 * Where a prop stands in the map she's in (the first of its kind, or the one nearest her), so
 * smoke taps a building or a tree wherever the map puts it.
 * @param {string} id @param {{ nearest?: boolean }} [options]
 * @returns {Promise<{ tx: number, ty: number }>}
 */
export async function propTile(id, options = {}) {
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
export async function tapProp(id) {
  const at = await propTile(id);
  await page.evaluate((t) => window.world.tapTile(t.tx, t.ty), at);
}

/**
 * Walks her up to a building in town and in through its door.
 * @param {string} building @param {string} inside
 */
export async function goInto(building, inside) {
  await tapProp(building);
  const went = await stepUntil(
    `window.world.scene === ${JSON.stringify(inside)}`,
    `she goes into ${inside}`,
  );
  await page.evaluate(() => window.view.step(40));
  return went;
}

/** A real tap on something standing in the building she's in, and the walk up to it. @param {string} id */
export async function tapFixture(id) {
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
export async function goOut() {
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
export async function walkTo(goal) {
  await tapTile(goal.tx, goal.ty);
  await stepUntil(() => !window.world.player.moving, `she reaches ${goal.tx},${goal.ty}`);
}

/**
 * A finger held on a button for `ms` and lifted, as a real touch (decision 275): Playwright's
 * touchscreen only taps.
 * @param {string} selector @param {number} ms
 */
export async function holdElement(selector, ms) {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`${selector} is not on screen`);
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await page.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

/** @param {string} selector */
export async function tapElement(selector) {
  const target = page.locator(selector);
  // Outdoors, the closet, map and Cabinet wait in the tray behind "more" (0.2.1).
  if (!(await target.first().isVisible()) && (await page.locator('.hud-more').isVisible())) {
    const tucked = await target
      .first()
      .evaluate((e) => !!e.closest('.hud-menu-more'))
      .catch(() => false);
    if (tucked) {
      const more = await page.locator('.hud-more').boundingBox();
      if (more) await page.touchscreen.tap(more.x + more.width / 2, more.y + more.height / 2);
    }
  }
  // Sheets scroll, so what is asked for may be below the fold.
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error(`${selector} is not on screen`);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

/** A tap on a prop in the fairground, through the world. @param {string} id */
export async function tapFairProp(id) {
  await page.evaluate((id) => {
    const p = window.world.zones.map('fairground').map.props.find((q) => q.id === id);
    if (!p) throw new Error(`no ${id} in the fairground`);
    window.world.tapTile(p.tx, p.ty);
  }, id);
}

/**
 * Walks her by real taps on what's on screen toward `goal` (a tile, or a way out), until she's
 * there or, for a way out, through it. True if she made it.
 * @param {{ tx: number, ty: number, w?: number, h?: number }} goal @param {string} label
 * @param {string} [into] the place a way out leads to
 */
export async function tapAlong(goal, label, into) {
  for (let taps = 0; taps < 30; taps++) {
    const here = await playerTile();
    if (into && (await page.evaluate(() => window.world.scene)) === into) return true;
    if (!into && here.tx === goal.tx && here.ty === goal.ty) return true;
    const next = await nextTapToward({ w: 1, h: 1, ...goal, onFoot: true });
    if (typeof next === 'string' && next.includes('hud-toast')) {
      await tapToastAway();
      continue;
    }
    if (next === null || typeof next === 'string') {
      check(`she walks ${label}`, false, `from ${JSON.stringify(here)}: ${next ?? 'no way'}`);
      return false;
    }
    await page.touchscreen.tap(next.x, next.y);
    for (let i = 0; i < 200; i++) {
      await page.evaluate(() => window.view.step(40, 5));
      const moving = await page.evaluate(() => window.world.player.moving);
      if (!moving) break;
    }
    await closeSheets();
  }
  check(`she walks ${label}`, false, 'thirty taps and not there');
  return false;
}

/**
 * The tile to tap next on the way to a way out, as she'd pick it (0.2's C1): the furthest one along
 * the shortest walk there that's on screen, in the world and clear of the bars, so every tap is on
 * something she can see. Null if there's no way, or what covers each tile if none is on screen.
 * `onFoot` keeps to the ground as she can walk it now: round a house on a lot, off ice with no skates.
 * @param {{ tx: number, ty: number, w: number, h: number, onFoot?: boolean }} exit
 */
export async function nextTapToward(exit) {
  return page.evaluate((exit) => {
    const map = window.world.zones.map(/** @type {any} */ (window.world.scene)).map;
    const { width, height } = map;
    const start = window.world.movement.tile;
    const onExit = (/** @type {number} */ tx, /** @type {number} */ ty) =>
      tx >= exit.tx && tx < exit.tx + exit.w && ty >= exit.ty && ty < exit.ty + exit.h;
    /** @type {Map<number, number>} */
    const cameFrom = new Map([[start.ty * width + start.tx, -1]]);
    const queue = [start.ty * width + start.tx];
    let end = -1;
    while (queue.length > 0 && end < 0) {
      const at = /** @type {number} */ (queue.shift());
      const tx = at % width;
      const ty = Math.floor(at / width);
      for (const [dx, dy] of /** @type {[number, number][]} */ ([
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ])) {
        const x = tx + dx;
        const y = ty + dy;
        const next = y * width + x;
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        if (map.solid[next] || cameFrom.has(next)) continue;
        if (exit.onFoot && !window.world.canWalk(x, y)) continue;
        cameFrom.set(next, at);
        if (onExit(x, y)) end = next;
        queue.push(next);
      }
    }
    if (end < 0) return null;
    const route = [];
    for (let at = end; at !== -1; at = /** @type {number} */ (cameFrom.get(at))) route.push(at);
    const canvas = /** @type {HTMLElement} */ (document.getElementById('game'));
    const covered = [];
    for (const at of route) {
      const tile = { tx: at % width, ty: Math.floor(at / width) };
      if (tile.tx === start.tx && tile.ty === start.ty) break;
      const p = window.view.tileToClient(tile.tx, tile.ty);
      const hit = document.elementFromPoint(p.x, p.y);
      if (hit === canvas) return { ...tile, ...p };
      covered.push(`${tile.tx},${tile.ty} under ${hit?.className || hit?.tagName}`);
    }
    return covered.join('; ') || 'no tile';
  }, exit);
}

/**
 * Opens the game on another day and hour (a dev build's `?day=`), cranked by hand.
 * @param {string} day @param {number} hour
 */
export async function openOn(day, hour) {
  await page.goto(`${URL_BASE}?loop=manual&skiptitle&day=${day}&hour=${hour}`, {
    waitUntil: 'load',
    timeout: 60_000,
  });
  await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
  await closeSheets();
  await page.evaluate(() => window.view.step(40, 5));
}
