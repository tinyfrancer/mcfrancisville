/** The Hollow Fairground's activities. */
import {
  PHONE,
  check,
  closeSheets,
  framed,
  goOut,
  holdElement,
  openOn,
  page,
  stepUntil,
  tapElement,
  tapFairProp,
  tapFixture,
  tapTile,
} from './lib.mjs';

/**
 * A real tap on a fairground game's stage, timed for the moment the world says a tap does best
 * (V1's R6b), a little early for the touch to arrive.
 * @param {string} selector @param {import('../../src/data/activities').ActivityId} id
 */
async function tapInTime(selector, id) {
  const target = page.locator(selector);
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error(`${selector} is not on screen`);
  const wait = await page.evaluate(
    (id) =>
      (window.world.activities.bestTapAt(id) ?? window.world.clock.now()) -
      window.world.clock.now(),
    id,
  );
  if (wait > 25) await page.waitForTimeout(wait - 25);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

/**
 * The fairground's activities (0.2's M2), on a Saturday afternoon when every stall is open and
 * Agatha is in her tent: a go at ring toss by real taps timed to the swinging ring (V1's R6b),
 * fried pickles from the corn dog stall, and her fortune read at the table.
 */
async function fair() {
  await openOn('2026-09-26', 14);
  await page.evaluate(() => window.world.wallet.earn(300));
  await page.evaluate(() => window.view.step(40, 4));
  await page.evaluate(() => window.world.tapTile(35, 49));
  const there = await stepUntil(
    () => window.world.scene === 'fairground',
    'she goes down to the fairground',
    60_000,
  );
  if (!there) return;
  await page.evaluate(() => window.view.step(40, 10));
  await closeSheets();

  // Ring toss: a go, every ring at the bottle that glints, and the rosette.
  await tapFairProp('ringTossStall');
  await stepUntil(() => !window.world.player.moving, 'she walks up to the ring toss');
  await page.evaluate(() => window.view.step(40, 2));
  check(
    'walking up to the ring toss opens it',
    (await page.locator('.hud-game-sheet').count()) === 1,
  );
  await framed('.hud-game-sheet', { picture: true, tabs: ['Play', 'Prizes'] });
  await tapElement('.hud-game-sheet .hud-sheet-tab:text-is("Play")');
  // V1's R6b: a go is three taps in time, each as the ring swings over the bottle that winks.
  /** @type {import('../../src/types/ids').ItemId[]} */
  const prizes = ['chewyDots', 'smileyBead', 'loveBeads', 'ringTossRosette'];
  const before = await page.evaluate(
    (ids) => ids.reduce((n, id) => n + window.world.bag.count(id), 0),
    prizes,
  );
  await tapElement('.hud-game-sheet .hud-fair-go');
  const stage = await page.evaluate(() => {
    const canvas = document.querySelector('canvas.hud-fair-stage');
    if (!(canvas instanceof HTMLCanvasElement)) return null;
    const box = canvas.getBoundingClientRect();
    return { width: box.width, height: box.height, backing: canvas.width };
  });
  check(
    "the ring toss's stage is drawn at a whole scale of its pixels",
    !!stage && stage.width > 0 && stage.width % stage.backing === 0,
    JSON.stringify(stage),
  );
  await page.waitForTimeout(400);
  await page.screenshot({ path: '.smoke/ring-toss-swing.png' });
  for (let i = 0; i < 3; i++) await tapInTime('.hud-game-sheet .hud-fair-stage', 'ringToss');
  await page.waitForTimeout(200);
  const after = await page.evaluate(
    (ids) => ids.reduce((n, id) => n + window.world.bag.count(id), 0),
    prizes,
  );
  const tally = await page.evaluate(() =>
    [...document.querySelectorAll('.hud-game-sheet .hud-fair-tally img')].map(
      (i) => i.getAttribute('src')?.length ?? 0,
    ),
  );
  check('a go of three timed taps wins a prize', after === before + 1, `${before} → ${after}`);
  const won = await page.evaluate(
    () => document.querySelector('.hud-game-sheet .hud-fair-prize small')?.textContent ?? '',
  );
  check(
    'a go tapped in time wins better than the floor',
    won !== '' && !won.startsWith('Every go'),
    `${won} (${tally.length} marks)`,
  );
  await page.screenshot({ path: '.smoke/ring-toss.png' });
  await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
  await page.evaluate(() => window.view.step(40));
  await page.waitForTimeout(100);
  const side = await page.evaluate(() => {
    const canvas = document.querySelector('.hud-game-sheet .hud-fair-stage');
    const box = canvas?.getBoundingClientRect();
    return box ? { left: box.left, right: box.right, top: box.top, bottom: box.bottom } : null;
  });
  check(
    "on its side, the ring toss's stage is on screen",
    !!side && side.left >= 0 && side.right <= PHONE.height && side.top >= 0,
    JSON.stringify(side),
  );
  await page.screenshot({ path: '.smoke/ring-toss-side.png' });
  await page.setViewportSize(PHONE);
  await page.evaluate(() => window.view.step(40));
  await tapElement('.hud-game-sheet .hud-done');

  // The duck pond (V1's R6b): a duck picked by a tap on it, and every duck wins.
  await page.evaluate(() => window.world.wallet.earn(100));
  await tapFairProp('duckPondStall');
  await stepUntil(() => !window.world.player.moving, 'she walks up to the duck pond');
  await page.evaluate(() => window.view.step(40, 2));
  check(
    'walking up to the duck pond opens it',
    (await page.locator('.hud-game-sheet').count()) === 1,
  );
  const bagCount = () =>
    page.evaluate(() =>
      ['chewyDots', 'loveBeads', 'luckyDuckSquish', 'sourGhouls', 'popcorn'].reduce(
        (n, id) =>
          n + window.world.bag.count(/** @type {import('../../src/types/ids').ItemId} */ (id)),
        0,
      ),
    );
  const before2 = await bagCount();
  await tapElement('.hud-game-sheet .hud-fair-go');
  await page.waitForTimeout(300);
  await tapElement('.hud-game-sheet .hud-fair-stage');
  await page.waitForTimeout(200);
  check('a duck picked at the duck pond wins a prize', (await bagCount()) === before2 + 1);
  await page.screenshot({ path: '.smoke/duck-pond.png' });
  await tapElement('.hud-game-sheet .hud-done');

  // The strength bell: held to wind up, and let go near the top of the puck's climb.
  await tapFairProp('strengthBellStall');
  await stepUntil(() => !window.world.player.moving, 'she walks up to the strength bell');
  await page.evaluate(() => window.view.step(40, 2));
  check(
    'walking up to the strength bell opens it',
    (await page.locator('.hud-game-sheet').count()) === 1,
  );
  const before3 = await bagCount();
  await tapElement('.hud-game-sheet .hud-fair-go');
  const climb = await page.evaluate(
    () => (window.world.activities.round('strengthBell')?.next?.pattern.period ?? 2000) / 2,
  );
  await holdElement('.hud-game-sheet .hud-fair-throw', climb - 30);
  await page.waitForTimeout(200);
  check('a swing at the strength bell wins a prize', (await bagCount()) === before3 + 1);
  await page.screenshot({ path: '.smoke/strength-bell.png' });
  await tapElement('.hud-game-sheet .hud-done');

  // The corn dog stall: fried pickles (her answer 80).
  await tapFairProp('cornDogStall');
  await stepUntil(() => !window.world.player.moving, 'she walks up to the corn dogs');
  await page.evaluate(() => window.view.step(40, 2));
  check(
    'walking up to the corn dogs opens the stall',
    (await page.locator('.hud-snack-sheet').count()) === 1,
  );
  await framed('.hud-snack-sheet', { picture: true });
  await tapElement('.hud-snack-sheet .hud-ware:has-text("Fried pickles") >> button');
  const pickles = await page.evaluate(() => window.world.bag.count('friedPickles'));
  check('fried pickles bought at the corn dog stall', pickles === 1, String(pickles));
  await page.screenshot({ path: '.smoke/corn-dogs.png' });
  await tapElement('.hud-snack-sheet .hud-done');

  // The fortune tent: in by its flap, and the table reads her fortune in Agatha's voice.
  const tent = await page.evaluate(() => {
    const p = window.world.zones.map('fairground').map.props.find((q) => q.id === 'fortuneTent');
    return p ? { tx: p.tx + 1, ty: p.ty + 1 } : null;
  });
  if (!tent) {
    check('the fortune tent stands in the fairground', false);
    return;
  }
  await tapTile(tent.tx, tent.ty);
  const inside = await stepUntil(
    () => window.world.scene === 'fortuneTent',
    'she goes into the fortune tent',
  );
  if (!inside) return;
  await page.evaluate(() => window.view.step(40, 4));
  await closeSheets();
  await stepUntil(
    () => window.world.neighbourhood.neighbour('agatha').zone === 'fortuneTent',
    'Agatha comes to her tent',
    120_000,
  );
  await closeSheets();
  await tapFixture('fortuneTable');
  await page.evaluate(() => window.view.step(40, 2));
  check(
    'walking up to the fortune table opens it',
    (await page.locator('.hud-fortune-sheet').count()) === 1,
  );
  await framed('.hud-fortune-sheet', { picture: true });
  await tapElement('.hud-fortune-sheet .hud-fortune-read');
  const read = await page.evaluate(() => ({
    fortune: document.querySelector('.hud-fortune')?.textContent ?? '',
    lucky: document.querySelector('.hud-lucky')?.textContent ?? '',
    line: document.querySelector('.hud-fortune-sheet .hud-sheet-head')?.textContent ?? '',
  }));
  check(
    "her fortune is read, with a lucky critter, in Agatha's voice",
    read.fortune.length > 10 && /Lucky critter/.test(read.lucky) && /Agatha/.test(read.line),
    JSON.stringify(read),
  );
  await page.screenshot({ path: '.smoke/fortune.png' });
  await tapElement('.hud-fortune-sheet .hud-done');
  await goOut();
}

/**
 * A ride on the big wheel (1.6's X2), on a Saturday afternoon with Agatha at the fair to ride
 * along: walked up to, Ride tapped, once round on the real clock, the top seen upright and on its
 * side, and back down on the ground with the ticket stub.
 */
async function bigWheel() {
  await openOn('2026-09-26', 13);
  await page.evaluate(() => window.view.step(40, 4));
  await page.evaluate(() => window.world.tapTile(35, 49));
  const there = await stepUntil(
    () => window.world.scene === 'fairground',
    'she goes down to the fairground',
    60_000,
  );
  if (!there) return;
  await page.evaluate(() => window.view.step(40, 10));
  await closeSheets();
  await stepUntil(
    () => window.world.neighbourhood.neighbour('agatha').zone === 'fortuneTent',
    'Agatha comes to her tent at the fair',
    240_000,
  );
  await closeSheets();
  await tapFairProp('ferrisWheel');
  await stepUntil(() => !window.world.player.moving, 'she walks up to the big wheel');
  await page.evaluate(() => window.view.step(40, 2));
  check(
    'walking up to the big wheel opens its sheet',
    (await page.locator('.hud-ride-sheet').count()) === 1,
  );
  await framed('.hud-ride-sheet', { picture: true });
  const company = await page.evaluate(
    () => document.querySelector('.hud-ride-sheet .hud-fair-below')?.textContent ?? '',
  );
  check('the sheet says Agatha will ride along', /Agatha/.test(company), company);
  await tapElement('.hud-ride-sheet .hud-ride-go');
  const riding = await page.evaluate(() => window.world.activities.riding());
  check(
    'Ride gets her into a car with Agatha, the first ride free',
    riding?.with === 'agatha' && riding.free === true,
    JSON.stringify(riding && { with: riding.with, free: riding.free }),
  );
  const stage = await page.evaluate(() => {
    const canvas = document.querySelector('canvas.hud-ride-stage');
    if (!(canvas instanceof HTMLCanvasElement)) return null;
    const box = canvas.getBoundingClientRect();
    return { width: box.width, height: box.height, backing: canvas.width, bottom: box.bottom };
  });
  check(
    "the wheel's stage is drawn at a whole scale of its pixels, on screen",
    !!stage && stage.width > 0 && stage.width % stage.backing === 0 && stage.bottom <= PHONE.height,
    JSON.stringify(stage),
  );
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '.smoke/big-wheel-up.png' });
  const top = await page
    .waitForFunction(() => window.world.activities.riding()?.at.part === 'top', null, {
      timeout: 15_000,
    })
    .then(() => true)
    .catch(() => false);
  check('the car comes round to the top', top);
  await page.waitForTimeout(300);
  const said = await page.evaluate(
    () => document.querySelector('.hud-ride-sheet .hud-ride-line')?.textContent ?? '',
  );
  check('Agatha says something at the top', /^Agatha: /.test(said), said);
  await page.screenshot({ path: '.smoke/big-wheel-top.png' });
  await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
  await page.evaluate(() => window.view.step(40));
  await page.waitForTimeout(150);
  const side = await page.evaluate(() => {
    const canvas = document.querySelector('.hud-ride-sheet .hud-ride-stage');
    const box = canvas?.getBoundingClientRect();
    return box ? { left: box.left, right: box.right, top: box.top, bottom: box.bottom } : null;
  });
  check(
    "on its side, the wheel's stage is on screen",
    !!side && side.left >= 0 && side.right <= PHONE.height && side.top >= 0,
    JSON.stringify(side),
  );
  await page.screenshot({ path: '.smoke/big-wheel-top-side.png' });
  await page.setViewportSize(PHONE);
  await page.evaluate(() => window.view.step(40));
  const down = await page
    .waitForFunction(() => window.world.activities.riding() === null, null, { timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
  await page.waitForTimeout(200);
  const landed = await page.evaluate(() => ({
    stub: window.world.bag.count('ticketStub'),
    said: document.querySelector('.hud-ride-sheet .hud-fair-below')?.textContent ?? '',
  }));
  check(
    'back on the ground with a ticket stub for her first ride',
    down && landed.stub === 1 && /Back on the ground/.test(landed.said),
    JSON.stringify(landed),
  );
  await page.screenshot({ path: '.smoke/big-wheel-landed.png' });
  await tapElement('.hud-ride-sheet .hud-done');
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [
  ['fair', fair],
  ['bigWheel', bigWheel],
];
