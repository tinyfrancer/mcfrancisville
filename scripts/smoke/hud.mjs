/** The HUD's sheets: her bag, the calendar and Today, Settings, and the bars and sheets on the phone's side. */
import {
  PHONE,
  URL_BASE,
  answerCody,
  check,
  framed,
  page,
  playerTile,
  stepUntil,
  tapElement,
  walkTo,
} from './lib.mjs';

async function bag() {
  await tapElement('.hud-bag-button');
  await framed('.hud-bag-sheet');
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
  const card = await page.evaluate(() => {
    const element = document.querySelector('.hud-bag-sheet .hud-item-card');
    const picture = element?.querySelector('.hud-icon-box canvas')?.getBoundingClientRect();
    const title = element?.querySelector('h3')?.getBoundingClientRect();
    const about = element?.querySelector('p')?.getBoundingClientRect();
    return {
      picture: picture?.width ?? 0,
      under: !!title && !!about && about.top >= title.bottom - 1 && about.left === title.left,
      beside: !!picture && !!title && title.left > picture.right,
    };
  });
  check(
    'its card shows its picture big, and what it is under its name, beside it',
    card.picture >= 64 && card.under && card.beside,
    JSON.stringify(card),
  );
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
    ['.hud-today', '.hud-candy', '.hud-settings', '.hud-menu', '.hud-quick'].map((s) => {
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
    "the day's chip sits beside her Candy, clear of the buttons, and a thumb tall",
    !!chip && chip.bottom - chip.top >= 44 && others.every((b) => clear(chip, b)),
    JSON.stringify(chip),
  );
  // V1's R2: a dot on the chip while Today has something she hasn't seen, gone once she looks.
  check(
    'the chip wears a dot while Today has something new',
    (await page.locator('.hud-today[data-new]').count()) === 1,
  );
  await tapElement('.hud-today');
  check(
    "the chip's dot goes once she has looked",
    (await page.locator('.hud-today[data-new]').count()) === 0,
  );
  // U4: today's mark (or a plain page) beside the title, and a tab each for today, the month and
  // what's coming up.
  await framed('.hud-calendar-sheet', { picture: true, tabs: ['Today', 'Month', 'Coming up'] });
  await tapElement('.hud-calendar-sheet .hud-sheet-tab:text-is("Today")');
  await upNow();
  await tapElement('.hud-calendar-sheet .hud-sheet-tab:text-is("Month")');
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
  await tapElement('.hud-calendar-sheet .hud-sheet-tab:text-is("Coming up")');
  const soon = await page.locator('.hud-cal-soon p').count();
  check('the Coming up tab lists what is on soon', soon > 0, `${soon}`);
  await tapElement('.hud-calendar-sheet .hud-sheet-tab:text-is("Today")');
  await tapElement('.hud-calendar-sheet button:text("Done")');
  check('Done closes the calendar', (await page.locator('.hud-sheet').count()) === 0);
  // A tap on the tree's line sends her off to it and closes the calendar; she's stopped short,
  // so the passive section still finds it full.
  await tapElement('.hud-today');
  await tapElement('.hud-calendar-sheet .hud-sheet-tab:text-is("Today")');
  await tapElement('.hud-cal-line[data-today="tree"] .hud-cal-go');
  const aim = await page.evaluate(() => {
    const tree = window.world.map.props.find((p) => p.id === 'candyTree');
    const aimed = window.world.aim;
    const box = aimed && 'box' in aimed ? aimed.box : null;
    const here = window.world.movement.tile;
    window.world.tapTile(here.tx, here.ty);
    return { tree, box, scene: window.world.scene };
  });
  check(
    "a tap on the tree's line closes the calendar and sets her off to the tree",
    (await page.locator('.hud-sheet').count()) === 0 &&
      aim.scene === 'town' &&
      !!aim.box &&
      aim.box.tx === aim.tree?.tx &&
      aim.box.ty === aim.tree?.ty,
    JSON.stringify(aim),
  );
  await stepUntil(() => !window.world.player.moving, 'she stops');
}

/**
 * The calendar's Today (V1's R2): a line for what's up now, the tree's among them, each true of
 * the world and on screen upright and on its side.
 */
async function upNow() {
  const tree = await page.locator('.hud-cal-line[data-today="tree"]').textContent();
  const candy = await page.evaluate(() => window.world.candyTree.candy());
  check(
    "Today has the candy tree's line, saying what it holds",
    candy > 0 && !!tree && tree.includes(`${candy} Candy`),
    `${tree} (${candy})`,
  );
  /** @returns {Promise<{ kind: string, left: number, right: number, height: number }[]>} */
  const lines = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.hud-cal-line')].map((el) => {
        const r = el.getBoundingClientRect();
        const kind = el instanceof HTMLElement ? (el.dataset.today ?? '') : '';
        return { kind, left: r.left, right: r.right, height: r.height };
      }),
    );
  const upright = await lines();
  const kinds = await page.evaluate(() => window.world.upNow.lines().map((l) => l.kind));
  check(
    'every line of Today is one the world says, a thumb tall and on screen',
    upright.length === kinds.length &&
      upright.every((l, i) => l.kind === kinds[i] && l.height >= 44 && l.right <= PHONE.width),
    JSON.stringify(upright.map((l) => l.kind)),
  );
  await page.screenshot({ path: '.smoke/today.png' });
  await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
  await page.evaluate(() => window.view.step(40));
  const side = await lines();
  check(
    'on its side, Today keeps every line on screen',
    side.length === upright.length && side.every((l) => l.left >= 0 && l.right <= PHONE.height),
    JSON.stringify(side.map((l) => [l.left, l.right])),
  );
  await page.screenshot({ path: '.smoke/today-side.png' });
  await page.setViewportSize(PHONE);
  await page.evaluate(() => window.view.step(40));
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
  // U4: the frame, a tab each for the sound, the mayor's notes and the backup, and whether the
  // town is kept safe said under the title.
  await framed('.hud-settings-sheet', { tabs: ['View', 'Sound', 'News', 'Backup'] });
  const kept = (await page.locator('.hud-settings-sheet .hud-sheet-line').textContent()) ?? '';
  check(
    'settings says under its title that the town is saved',
    /saved on this phone/.test(kept),
    kept,
  );
  await tapElement('.hud-settings-sheet .hud-sheet-tab:text-is("Backup")');
  check('the backup code is on the Backup tab', await page.locator('.hud-code').isVisible());
  await page.screenshot({ path: '.smoke/settings.png' });
  await tapElement('.hud-sheet button:text("Done")');
  check('Done closes the sheet', (await page.locator('.hud-sheet').count()) === 0);

  await walkTo({ tx: here.tx + 3, ty: here.ty });
  await page.evaluate(() => window.view.saveNow());

  await tapElement('.hud-settings');
  await tapElement('.hud-settings-sheet .hud-sheet-tab:text-is("Backup")');
  await page.locator('.hud-paste').fill(code);
  page.once('dialog', (dialog) => void dialog.accept());
  const reloaded = page.waitForEvent('load', { timeout: 60_000 });
  await tapElement('.hud-restore');
  await reloaded;
  await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
  if ((await page.locator('.hud-title').count()) > 0) await tapElement('.hud-title-begin');
  await answerCody();
  const restored = await playerTile();
  check(
    'restoring the code brings back the town it was made from',
    restored.tx === here.tx && restored.ty === here.ty,
    `${JSON.stringify(here)} -> ${JSON.stringify(restored)}`,
  );
}

/** Upright, the bottom bar is one row; on its side, one thin strip along the bottom (0.2.2). */
async function sideways() {
  const layout = () =>
    page.evaluate(() => {
      const box = (/** @type {string} */ s) => {
        const r = document.querySelector(s)?.getBoundingClientRect();
        return r ? { left: r.left, top: r.top, right: r.right, bottom: r.bottom } : null;
      };
      const shown = (/** @type {string} */ s) => {
        const e = document.querySelector(s);
        if (!e) return false;
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5;
      };
      return {
        width: innerWidth,
        height: innerHeight,
        top: box('.hud-top'),
        view: box('.hud-view'),
        bottom: box('.hud-bottom'),
        canvas: box('#game'),
        quick: shown('.hud-quick-slot'),
        bag: shown('.hud-bag-button'),
        closet: shown('.hud-closet'),
        map: shown('.hud-map-button'),
        neighbours: shown('.hud-neighbours'),
      };
    });
  const upright = await layout();
  check(
    'upright, the quick bar and the menu share one row along the bottom',
    !!upright.bottom && upright.bottom.bottom - upright.bottom.top <= 72 && upright.quick,
    JSON.stringify(upright.bottom),
  );
  await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
  await page.waitForTimeout(300);
  const side = await layout();
  await page.screenshot({ path: '.smoke/sideways.png' });
  check(
    'on its side, the world keeps the whole width, over one thin strip along the bottom',
    !!side.view &&
      !!side.top &&
      !!side.bottom &&
      side.view.right - side.view.left >= side.width - 1 &&
      side.top.top >= side.view.bottom - 0.5 &&
      side.bottom.top >= side.view.bottom - 0.5 &&
      side.height - side.view.bottom <= 72,
    JSON.stringify(side),
  );
  check(
    'on its side, the world is drawn in its room, and the quick bar and bag are on screen',
    !!side.canvas &&
      !!side.view &&
      Math.abs(side.canvas.left - side.view.left) < 1 &&
      side.canvas.bottom >= side.view.bottom - 0.5 &&
      side.quick &&
      side.bag &&
      side.neighbours,
    JSON.stringify(side),
  );
  // A sheet on its side is two columns, so a thing's card in the foot leaves the list its room.
  await tapElement('.hud-bag-button');
  await tapElement('.hud-bag .hud-slot >> nth=0');
  const sheet = await page.evaluate(() => {
    const view = document.querySelector('.hud-view')?.getBoundingClientRect();
    const body = document.querySelector('.hud-bag-sheet .hud-sheet-body')?.getBoundingClientRect();
    const slot = document.querySelector('.hud-bag .hud-slot')?.getBoundingClientRect();
    return {
      view: view?.height ?? 0,
      body: body?.height ?? 0,
      slot: !!slot && slot.top >= 0 && slot.bottom <= innerHeight,
    };
  });
  await page.screenshot({ path: '.smoke/sideways-bag.png' });
  check(
    "on its side, a sheet with a thing's card up still shows its list",
    sheet.body >= sheet.view * 0.6 && sheet.slot,
    JSON.stringify(sheet),
  );
  await tapElement('.hud-bag-sheet .hud-done');
  // U4: the map's ways out fit beside its head on its side, the compass whole on screen.
  await tapElement('.hud-map-button');
  await tapElement('.hud-map-sheet .hud-sheet-tab:text-is("Ways out")');
  const map = await page.evaluate(() => {
    const sheet = document.querySelector('.hud-map-sheet');
    const r = document.querySelector('.hud-map-compass')?.getBoundingClientRect();
    return {
      wide: !!sheet && sheet.scrollWidth > sheet.clientWidth + 1,
      compass: r ? { left: r.left, right: r.right, width: innerWidth } : null,
    };
  });
  await page.screenshot({ path: '.smoke/sideways-map.png' });
  check(
    "on its side, the map's ways out are on screen",
    !map.wide && !!map.compass && map.compass.left >= 0 && map.compass.right <= map.compass.width,
    JSON.stringify(map),
  );
  await tapElement('.hud-map-sheet .hud-done');
  // And the title, picture beside the words, has its button on screen.
  await page.goto(`${URL_BASE}?loop=manual`, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForSelector('.hud-title', { timeout: 10_000 });
  const begin = await page.evaluate(() => {
    const r = document.querySelector('.hud-title-begin')?.getBoundingClientRect();
    return r ? { top: r.top, bottom: r.bottom, height: innerHeight } : null;
  });
  await page.screenshot({ path: '.smoke/sideways-title.png' });
  check(
    'on its side, the title screen fits, Tap to begin and all',
    !!begin && begin.top >= 0 && begin.bottom <= begin.height,
    JSON.stringify(begin),
  );
  await page.setViewportSize(PHONE);
  await page.waitForTimeout(300);
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [
  ['bag', bag],
  ['calendar', calendar],
  ['settings', settings],
  ['sideways', sideways],
];
