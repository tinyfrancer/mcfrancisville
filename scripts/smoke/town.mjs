/** Out in the town: walking by real taps, the camera and the shimmer checks, the ground in chunks, gathering, the noticeboard, the candy tree and the stall, the weather and the night, see-through trees, and Close and Far. */
import { writeFileSync } from 'node:fs';
import {
  PHONE,
  PLAIN_DAY,
  TILE,
  URL_BASE,
  check,
  clearMat,
  closeSheets,
  consoleErrors,
  framed,
  goInto,
  goOut,
  page,
  playerTile,
  propTile,
  reloadGame,
  stepUntil,
  tapElement,
  tapProp,
  tapTile,
} from './lib.mjs';

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

/**
 * Whether a tap on the middle of a tile in a place's top or bottom row reaches the world: the
 * canvas is what's under that point, not a bar (0.2's U1).
 * @param {number} tx @param {'top' | 'bottom'} edge
 */
async function edgeInReach(tx, edge) {
  return page.evaluate(
    ({ tx, edge }) => {
      const ty = edge === 'top' ? 0 : window.world.map.height - 1;
      const at = window.view.tileToClient(tx, ty);
      const hit = document.elementFromPoint(at.x, at.y);
      return {
        ok: hit?.id === 'game',
        detail: `${tx},${ty} at ${at.x},${at.y}: ${hit?.className || hit?.id}`,
      };
    },
    { tx, edge },
  );
}

async function camera() {
  // At her door the camera is at the top of the town, at Close as at Far (decision 290).
  await page.evaluate(() => window.world.tapTile(4, 9));
  await stepUntil(() => !window.world.player.moving, 'she walks back to her door');
  await page.evaluate(() => window.view.step(40, 10));
  const topRow = await edgeInReach(8, 'top');
  check(
    "the town's top row, above her house, is in the world, under the bar, to be tapped",
    topRow.ok,
    topRow.detail,
  );
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
  // A neighbour standing on the last tile at this hour (Ollie, of an evening) is talked to.
  if (await page.locator('.hud-talk-sheet').count()) {
    await tapElement('.hud-talk-sheet button:text-is("Bye")');
  }
  const after = await page.evaluate(() => window.view.cameraOrigin());
  check('the camera follows her down the map', after.y > before.y, `${before.y} -> ${after.y}`);
  const bottomRow = await edgeInReach(26, 'bottom');
  check(
    "the town's bottom row is in the world, above the bar, to be tapped",
    bottomRow.ok,
    bottomRow.detail,
  );
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
  let last = { tx: 17, ty: 27 };
  for (const [name, goal] of /** @type {const} */ ([
    ['east', { tx: 27, ty: 15 }],
    ['back', { tx: 14, ty: 15 }],
    // Down to the avenue, short of where film night's screen stands on an October Saturday,
    // which a walk to the far side of it would bend round.
    ['south', { tx: 17, ty: 27 }],
  ])) {
    const walked = await page.evaluate((wanted) => {
      // A neighbour on the tile (or just below it, the tile being their head) at this hour would be
      // walked up to and talked to instead: the nearest open tile beside it, then.
      const w = window.world;
      const clear = (/** @type {{ tx: number, ty: number }} */ t) =>
        w.canWalk(t.tx, t.ty) &&
        !w.neighbourhood.villagerAt(t.tx, t.ty) &&
        !w.neighbourhood.villagerAt(t.tx, t.ty + 1);
      const ring = [0, -1, 1, -2, 2].flatMap((dy) => [0, -1, 1, -2, 2].map((dx) => ({ dx, dy })));
      const t =
        ring
          .map(({ dx, dy }) => ({ tx: wanted.tx + dx, ty: wanted.ty + dy }))
          .find((c) => clear(c)) ?? wanted;
      w.tapTile(t.tx, t.ty);
      const out = [];
      // Walking, then a second more for the camera to settle.
      for (let i = 0, still = 0; i < 1200 && still < 60; i++) {
        window.view.step(1000 / 60);
        out.push({ cam: window.view.cameraOrigin(), her: window.view.playerDrawnAt() });
        still = window.world.player.moving ? 0 : still + 1;
      }
      return { goal: t, out };
    }, goal);
    const frames = walked.out;
    last = walked.goal;
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
  const goal = last;
  check(
    'she ends the walk where she was headed',
    arrived.tx === goal.tx && arrived.ty === goal.ty,
    `${arrived.tx},${arrived.ty} for ${goal.tx},${goal.ty}`,
  );
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
  await framed('.hud-notice-sheet', { tabs: ['Notes', 'Projects'] });
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
  await framed('.hud-stall-sheet');
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
    await page.goto(`${URL_BASE}?loop=manual&skiptitle&weather=${kind}`, {
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
  await page.goto(`${URL_BASE}?loop=manual&skiptitle&day=${PLAIN_DAY}&hour=22`, {
    waitUntil: 'load',
    timeout: 60_000,
  });
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

/**
 * See-through trees (0.3's A3): walked by a real tap in under a tree's crown in Whisperwood, she
 * shows through it; walked back out, it comes back solid, its opacity going only one way.
 */
async function seeThrough() {
  await closeSheets();
  await page.evaluate(() => {
    window.world.travel.cross({ to: 'whisperwood', along: 0 });
    window.world.movement.standAt({ tx: 5, ty: 18 }, 'right');
  });
  await page.evaluate(() => window.view.step(40, 40));
  await page.evaluate(() => window.view.step(40, 10));
  const open = await page.evaluate(() => window.view.seeThroughCrowns());
  check(
    'out on the path, the tree by the crossroads is solid',
    !open.some((c) => c.tx === 14 && c.ty === 16),
    JSON.stringify(open),
  );
  await tapTile(14, 15);
  await stepUntil(() => !window.world.player.moving, 'she walks in under the tree');
  await page.evaluate(() => window.view.step(40, 10));
  const under = await page.evaluate(() => window.view.seeThroughCrowns());
  check(
    'standing under its crown makes that tree see-through',
    under.some((c) => c.tx === 14 && c.ty === 16 && c.alpha <= 0.5),
    JSON.stringify(under),
  );
  await page.screenshot({ path: '.smoke/see-through.png' });
  await tapTile(5, 18);
  const alphas = await page.evaluate(() => {
    const out = [];
    for (let i = 0, still = 0; i < 600 && still < 60; i++) {
      window.view.step(1000 / 60);
      const tree = window.view.seeThroughCrowns().find((c) => c.tx === 14 && c.ty === 16);
      out.push(tree?.alpha ?? 1);
      still = window.world.player.moving || (tree?.alpha ?? 1) < 1 ? 0 : still + 1;
    }
    return out;
  });
  const back = alphas.findIndex((a, i) => i > 0 && a < (alphas[i - 1] ?? 0));
  check(
    'walked back out, the tree comes back solid, never flickering on the way',
    back < 0 && alphas.at(-1) === 1,
    back >= 0 ? `down again at frame ${back}` : `${alphas.length} frames`,
  );
  await page.evaluate(() => window.world.travel.go('town'));
  await page.evaluate(() => window.view.step(40, 2));
}

/**
 * The ground in chunks (0.2 session A1): the town draws from chunks with no seam between them,
 * only the chunks under the view are baked, and a place she has left lets its ground go.
 */
async function ground() {
  await page.evaluate(() => window.view.step(40, 5));
  const all = await page.evaluate(() => {
    const { width, height } = window.world.size;
    return Math.ceil(width / 8) * Math.ceil(height / 8);
  });
  await page.screenshot({ path: '.smoke/ground-chunks.png' });
  const seams = await page.evaluate(() => window.view.groundSeams());
  check('the ground drawn from chunks has no seam', seams === 0, `${seams} pixels differ`);
  const whole = await page.evaluate(() => window.view.groundMemory());
  check('checking for seams bakes every chunk', whole.chunks === all, `${whole.chunks} of ${all}`);
  if (!(await goInto('shopHouse', 'cobwebCorner'))) return;
  const inside = await page.evaluate(() => window.view.groundMemory());
  check('a place she has left lets its ground go', inside.chunks === 0, `${inside.chunks} kept`);
  await goOut();
  const back = await page.evaluate(() => window.view.groundMemory());
  check(
    'and coming back bakes only the ground under the view',
    back.chunks > 0 && back.chunks < all,
    `${back.chunks} of ${all} chunks, ${(back.bytes / 2 ** 20).toFixed(1)} MB`,
  );
}

/**
 * Close and Far (V1's L1, decision 290): Close by default, about 12 tiles across and her about 8 mm
 * tall; Far from Settings' View tab, kept over a reload; no shimmer at Far; and a room fitted to
 * the width in its house at either, upright and on its side.
 */
async function closer() {
  await closeSheets();
  await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
  await stepUntil(() => window.world.scene === 'town', 'she goes back to town');
  const fit = () =>
    page.evaluate(() => {
      const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game'));
      const box = canvas.getBoundingClientRect();
      return {
        scale: Math.round((box.width * devicePixelRatio) / canvas.width),
        width: canvas.width,
        height: canvas.height,
        stored: localStorage.getItem('mcfrancisville:view'),
      };
    });
  /** Until the canvas has been refitted to the room between the bars, however slow the runner. */
  const refitted = () =>
    page.waitForFunction(
      () => {
        const canvas = document.getElementById('game')?.getBoundingClientRect();
        const room = document.querySelector('.hud-view')?.getBoundingClientRect();
        return (
          !!canvas &&
          !!room &&
          Math.abs(canvas.width - room.width) < 1 &&
          Math.abs(canvas.height - room.height) < 1
        );
      },
      null,
      { timeout: 10_000 },
    );
  /** Both orientations of whatever is shown, at `name`. @param {string} name */
  const pair = async (name) => {
    await page.evaluate(() => window.view.step(40, 5));
    await page.screenshot({ path: `.smoke/${name}.png` });
    await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
    await page.waitForTimeout(300);
    await refitted();
    await page.evaluate(() => window.view.step(40, 5));
    const side = await fit();
    await page.screenshot({ path: `.smoke/${name}-side.png` });
    await page.setViewportSize(PHONE);
    await page.waitForTimeout(300);
    await refitted();
    return side;
  };
  /** Settings' View tab, and a tap on Close or Far. @param {'Close' | 'Far'} label */
  const choose = async (label) => {
    await tapElement('.hud-settings');
    await tapElement('.hud-settings-sheet .hud-sheet-tab:text-is("View")');
    await tapElement(`.hud-settings-sheet .hud-view-chip:text-is("${label}")`);
    const pressed = await page
      .locator(`.hud-settings-sheet .hud-view-chip:text-is("${label}")`)
      .getAttribute('aria-pressed');
    await page.screenshot({ path: `.smoke/view-${label.toLowerCase()}.png` });
    await tapElement('.hud-settings-sheet .hud-done');
    await page.waitForTimeout(100);
    return pressed === 'true';
  };

  const close = await fit();
  const millimetres = ((48 * close.scale) / 460) * 25.4;
  check(
    'Close is the default: about 12 tiles across, her about 8 mm tall on an iPhone',
    close.stored === null &&
      close.scale === 3 &&
      close.width / TILE >= 11 &&
      close.width / TILE <= 13.5 &&
      millimetres > 7.5 &&
      millimetres < 8.5,
    `${JSON.stringify(close)}, ${millimetres.toFixed(1)} mm`,
  );
  const closeSide = await pair('close-town');
  check(
    'on its side, Close stays Close',
    closeSide.scale === close.scale,
    JSON.stringify(closeSide),
  );

  check('Settings has a View tab, and Far is picked there', await choose('Far'));
  const far = await fit();
  check(
    'Far is the view from before: about 18 tiles across, kept by the phone',
    far.scale === 2 && far.width / TILE >= 16 && far.stored === 'far',
    JSON.stringify(far),
  );
  const farSide = await pair('far-town');
  check('on its side, Far stays Far', farSide.scale === far.scale, JSON.stringify(farSide));
  await reloadGame();
  check('Far survives a reload', (await fit()).scale === 2);
  // The walks of `smooth`, again at Far.
  await smooth();

  await tapProp('homeHouse');
  await stepUntil(() => window.world.scene === 'home', 'she goes home');
  await clearMat();
  /** How much of her room shows across, and whether the canvas starts on a whole pixel. */
  const room = async () => {
    const shown = await fit();
    const wide = await page.evaluate(() => window.world.home.rooms.room.width);
    const shows = shown.width / TILE;
    return { ...shown, room: wide, shows, fills: Math.min(wide, shows) / shows };
  };
  const farHome = await room();
  const farHomeSide = await pair('far-home');
  check(
    'at Far, her room fills the width in its house, the town scale or a step closer',
    farHome.scale >= 2 && farHome.scale <= 3 && farHome.fills >= 0.85,
    JSON.stringify(farHome),
  );
  check(
    'on its side, the room keeps the town scale or a step closer',
    farHomeSide.scale >= 2 && farHomeSide.scale <= 3,
    JSON.stringify(farHomeSide),
  );
  check('and Close is picked back', await choose('Close'));
  const closeHome = await room();
  await pair('close-home');
  check(
    'at Close, her room fills the width too',
    closeHome.scale >= 3 && closeHome.fills >= 0.85,
    JSON.stringify(closeHome),
  );
  const mat = await page.evaluate(() => window.world.home.rooms.room.mat);
  await tapTile(mat.tx, mat.ty);
  await stepUntil(() => window.world.scene === 'town', 'she goes back out');
  const out = await fit();
  check('back outside, the town is Close again', out.scale === 3, JSON.stringify(out));
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [
  ['walk', walk],
  ['camera', camera],
  ['smooth', smooth],
  ['ground', ground],
  ['gather', gather],
  ['notices', notices],
  ['passive', passive],
  ['weather', weather],
  ['night', night],
  ['seeThrough', seeThrough],
  ['closer', closer],
];
