/** The calendar's days: holidays, the seasons, rare events, and the Halloween Festival from the banner to the finale. */
import { readFileSync } from 'node:fs';
import {
  PHONE,
  URL_BASE,
  check,
  closeSheets,
  framed,
  openOn,
  page,
  stepUntil,
  tapElement,
  tapFairProp,
  tapProp,
  walkTo,
} from './lib.mjs';

/**
 * The seasons (V1's L4): the town on a day in each, its lawn baked in the season's colours (snow
 * in January, all four different), the drifts and snow in their looks, and the winter town on its
 * side too. Clear weather, at noon, so each screenshot shows the season and not a rainy day.
 */
async function seasons() {
  /** @type {Record<string, number[]>} */
  const lawns = {};
  /** @type {readonly (readonly [string, string])[]} */
  const days = [
    ['2027-01-15', 'winter'],
    ['2027-04-15', 'spring'],
    ['2027-07-15', 'summer'],
    ['2026-10-15', 'autumn'],
  ];
  for (const [day, season] of days) {
    await page.goto(`${URL_BASE}?loop=manual&skiptitle&day=${day}&hour=12&weather=clear`, {
      waitUntil: 'load',
      timeout: 60_000,
    });
    await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
    await closeSheets();
    await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
    await stepUntil(() => window.world.scene === 'town', `she is in town on ${day}`);
    // The flight's moment plays on the next step, so its transition only shows up after one.
    await page.evaluate(() => window.view.step(40, 3));
    await stepUntil(() => window.view.transition() === null, 'the way into town has drawn');
    await page.evaluate(() => window.view.step(40, 20));
    const shown = await page.evaluate(() => window.view.season());
    check(`${day} draws the town in ${season}`, shown?.season === season, JSON.stringify(shown));
    lawns[season] = shown?.lawn ?? [];
    await page.screenshot({ path: `.smoke/season-${season}.png` });
    if (season === 'winter') {
      await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
      await page.evaluate(() => window.view.step(40, 3));
      await page.screenshot({ path: '.smoke/season-winter-sideways.png' });
      await page.setViewportSize(PHONE);
      await page.evaluate(() => window.view.step(40, 3));
    }
  }
  const [r = 0, g = 0, b = 0] = lawns.winter ?? [];
  check('the lawn lies under snow in winter', r > 180 && g > 180 && b > 190, JSON.stringify(lawns));
  const greens = ['spring', 'summer', 'autumn'].map((s) => lawns[s] ?? []);
  check(
    'the lawn is green in spring, summer and autumn',
    greens.every(([lr = 0, lg = 0, lb = 0]) => lg > lr && lg > lb),
    JSON.stringify(lawns),
  );
  const keys = Object.values(lawns).map((c) => c.join(','));
  check(
    'the lawn is a different colour in every season',
    new Set(keys).size === 4,
    keys.join(' | '),
  );
}

/**
 * Rare events (V1's R3): a meteor shower's night by `?day=`, told by a toast and in Today, shooting
 * stars in the sky; and the wandering stall's week, the stall stood in town and opened as a shop.
 */
async function rare() {
  const shower = '2026-11-29';
  await openOn(shower, 22);
  await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
  await stepUntil(() => window.world.scene === 'town', `she is in town on ${shower}`);
  await page.evaluate(() => window.view.step(40, 30));
  const shown = await page.evaluate(() => ({
    today: window.world.rareEvents.today(),
    sky: window.world.rareEvents.sky(),
    line: window.world.upNow.lines().some((l) => l.kind === 'rare'),
  }));
  check(
    `${shower} is a meteor shower's night, shooting stars in the sky and a line in Today`,
    shown.today === 'meteorShower' && shown.sky === 'meteors' && shown.line,
    JSON.stringify(shown),
  );
  // The day's letters are told first, each waiting its turn: a tap sends each on.
  /** @type {string[]} */
  const told = [];
  for (let i = 0; i < 8; i++) {
    const text =
      (await page
        .locator('.hud-toast-shown')
        .textContent()
        .catch(() => '')) ?? '';
    told.push(text);
    if (text.includes('meteor shower')) break;
    await page.evaluate(() =>
      document.querySelector('.hud-toast-shown')?.dispatchEvent(new Event('pointerdown')),
    );
    await page.waitForTimeout(100);
  }
  check(
    'the meteor shower is told by a toast',
    told.some((t) => t.includes('meteor shower')),
    told.join(' | '),
  );
  await page.screenshot({ path: '.smoke/rare-meteors.png' });

  const stallDay = '2026-11-18';
  await openOn(stallDay, 12);
  await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
  await stepUntil(() => window.world.scene === 'town', `she is in town on ${stallDay}`);
  await page.evaluate(() => window.view.step(40, 10));
  await closeSheets();
  const stood = await page.evaluate(() => ({
    today: window.world.rareEvents.today(),
    open: window.world.shops.isOpen('wandering'),
  }));
  check(
    `the wandering stall is in town on ${stallDay}`,
    stood.today === 'wanderingStall' && stood.open,
    JSON.stringify(stood),
  );
  await page.evaluate(() => window.world.tapTile(31, 35));
  await stepUntil(
    () => document.querySelector('.hud-shop-sheet') !== null,
    'the wandering stall opens as a shop',
  );
  const title = (await page.locator('.hud-shop-sheet').textContent()) ?? '';
  check('the wandering stall sells its curios', title.includes('Curios from far away'), title);
  await page.screenshot({ path: '.smoke/rare-stall.png' });
  await closeSheets();
}

/** The Halloween Festival (0.2's J1): the banner, the chip's countdown, the calendar, the title. */
async function festival() {
  await openOn('2026-10-05', 12);
  const on = await page.evaluate(() => ({
    banner: window.world.holidays.banner(),
    left: window.world.calendar.today().festival?.left ?? null,
  }));
  check(
    'the Halloween Festival is on on 5 October, with its banner up',
    on.banner === 'halloweenFestival' && on.left === 26,
    JSON.stringify(on),
  );
  // Wherever the last section left her, back to town by the map.
  await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
  await stepUntil(() => window.world.scene === 'town', 'she goes back to town');
  const chip = (await page.locator('.hud-today').textContent()) ?? '';
  check('the day chip counts down to Halloween', chip.includes('26 days'), chip);
  await page.evaluate(() => window.world.tapTile(20, 21));
  await stepUntil(() => !window.world.player.moving, 'she walks into the square');
  await page.evaluate(() => window.view.step(40, 5));
  await page.screenshot({ path: '.smoke/festival.png' });
  await tapElement('.hud-today');
  const sheet = await page.evaluate(() => ({
    festival: document.querySelector('.hud-cal-festival')?.textContent ?? '',
    banded: document.querySelectorAll('.hud-cal-span').length,
  }));
  check(
    'the calendar shows the festival, its countdown, and all October banded',
    sheet.festival.includes('26 days to Halloween') && sheet.banded === 31,
    JSON.stringify(sheet),
  );
  // U4: the festival is one span, its ends rounded where it begins and ends and where each of
  // October 2026's five weeks wraps, and said under the month.
  await tapElement('.hud-calendar-sheet .hud-sheet-tab:text-is("Month")');
  const span = await page.evaluate(() => ({
    starts: document.querySelectorAll('.hud-cal-span-start').length,
    ends: document.querySelectorAll('.hud-cal-span-end').length,
    key: document.querySelector('.hud-cal-key')?.textContent ?? '',
  }));
  check(
    'the festival is one band across October, said under the month',
    span.starts === 5 && span.ends === 5 && span.key.includes('1 October to 31 October'),
    JSON.stringify(span),
  );
  await page.screenshot({ path: '.smoke/festival-calendar.png' });
  await tapElement('.hud-cal-page >> nth=1');
  const cakes = await page.evaluate(() =>
    [...document.querySelectorAll('.hud-cal-day')]
      .map((d) => d.getAttribute('aria-label') ?? '')
      .filter((label) => label.includes('birthday')),
  );
  check(
    "November has Maude's and Wrapunzel's birthdays on it",
    cakes.some((c) => c.startsWith('Monday 2 November') && c.includes("Maude's birthday")) &&
      cakes.some((c) => c.includes("Wrapunzel's birthday")),
    cakes.join(' | '),
  );
  await tapElement('.hud-calendar-sheet .hud-sheet-tab:text-is("Today")');
  await closeSheets();

  await page.goto(`${URL_BASE}?loop=manual&day=2026-10-05&hour=12`, {
    waitUntil: 'load',
    timeout: 60_000,
  });
  await page.waitForSelector('.hud-title', { timeout: 10_000 });
  const title = (await page.locator('.hud-title-festival').textContent()) ?? '';
  check('the title screen says the festival is on', title.includes('Halloween Festival'), title);
  await page.screenshot({ path: '.smoke/festival-title.png' });
}

/** Trick or treat (0.2's J2): a knock at a neighbour's door on a festival evening, in costume. */
async function trickOrTreat() {
  await openOn('2026-10-05', 19);
  await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
  await stepUntil(() => window.world.scene === 'town', 'she goes back to town');
  await tapProp('bartyHouse');
  await stepUntil(() => !window.world.player.moving, "she walks up to Barty's door");
  await page.evaluate(() => window.view.step(40, 5));
  const knock = await page.evaluate(() => ({
    scene: window.world.scene,
    toast: document.querySelector('.hud-toast')?.textContent ?? '',
    costumed: window.world.holidays.inCostume('barty'),
  }));
  check(
    "a knock at Barty's door on an October evening gets a sweet, and Barty's in costume",
    knock.scene === 'town' && /Barty|bowl/.test(knock.toast) && knock.costumed,
    JSON.stringify(knock),
  );
  await page.screenshot({ path: '.smoke/trick-or-treat.png' });
}

/** October's middle weeks (0.2's J3): the pumpkin patch picked, and film night on the avenue. */
async function october() {
  await openOn('2026-10-16', 12);
  await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
  await stepUntil(() => window.world.scene === 'town', 'she goes back to town');
  const before = await page.evaluate(() => window.world.bag.count('patchPumpkin'));
  await tapProp('pumpkinPatch');
  await stepUntil(() => !window.world.player.moving, 'she walks up to the pumpkin patch');
  await page.evaluate(() => window.view.step(40, 5));
  const picked = await page.evaluate(() => ({
    stage: window.world.pumpkinPatch.stage(),
    count: window.world.bag.count('patchPumpkin'),
  }));
  check(
    'the pumpkin patch is ripe in mid-October, and gives her one to carve',
    picked.stage === 'ripe' && picked.count === before + 1,
    JSON.stringify(picked),
  );
  await page.screenshot({ path: '.smoke/pumpkin-patch.png' });

  await openOn('2026-10-10', 20);
  await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
  await stepUntil(() => window.world.scene === 'town', 'she goes back to town');
  await page.evaluate(() => window.world.tapTile(20, 34));
  await stepUntil(() => !window.world.player.moving, 'she walks down the avenue, out of the way');
  await stepUntil(
    () => window.world.neighbourhood.neighbours.every((n) => n.zone !== 'town' || !n.moving),
    'everyone takes their seat',
    60_000,
  );
  await page.evaluate(() => window.view.step(40, 5));
  const film = await page.evaluate(() => {
    const seated = window.world.neighbourhood.neighbours.filter(
      (n) => n.zone === 'town' && n.tile.ty >= 29 && n.tile.ty <= 30,
    );
    return {
      screen: window.world.townZone.propAt(20, 28)?.id ?? null,
      seated: seated.length,
      facing: [...new Set(seated.map((n) => n.facing))],
    };
  });
  check(
    'film night: the screen is up on the avenue, and the town is seated facing it',
    film.screen === 'filmScreen' && film.seated >= 4 && film.facing.every((f) => f === 'up'),
    JSON.stringify(film),
  );
  await page.screenshot({ path: '.smoke/film-night.png' });
}

/**
 * Flies her to the fairground by the map, where the calendar's events are (0.2's M3). False if she
 * didn't get there.
 */
async function toTheFair() {
  await page.evaluate(() => window.world.atlas.find('fairground'));
  await page.evaluate(() => window.view.step(40, 2));
  await closeSheets();
  const went = await page.evaluate(
    () => window.world.scene === 'fairground' || window.world.travel.go('fairground'),
  );
  await page.evaluate(() => window.view.step(40, 5));
  await closeSheets();
  return went && (await page.evaluate(() => window.world.scene === 'fairground'));
}

/**
 * The Halloween finale (0.2's J4): she judges the costume contest, then their photo at the party,
 * both at the fairground's stage once its gate is open (0.2's M3; in town before, held by vitest).
 */
async function finale() {
  await openOn('2026-10-31', 18.5);
  if (!(await toTheFair())) return check('she goes to the fairground for the contest', false);
  await stepUntil(
    () =>
      window.world.neighbourhood.neighbours.every(
        (n) => n.id === 'boothoven' || (n.zone === 'fairground' && !n.moving),
      ),
    'everyone lines up before the stage',
    120_000,
  );
  const lineUp = await page.evaluate(() => {
    const rufus = window.world.neighbourhood.neighbour('rufus');
    return { zone: rufus.zone, ty: rufus.tile.ty, facing: rufus.facing };
  });
  check(
    'the contest lines the town up along the front of the fairground stage, facing her',
    lineUp.zone === 'fairground' && lineUp.ty === 6 && lineUp.facing === 'down',
    JSON.stringify(lineUp),
  );
  await page.evaluate(() => {
    const rufus = window.world.neighbourhood.neighbour('rufus');
    window.world.tapTile(rufus.tile.tx, rufus.tile.ty);
  });
  const talking = await stepUntil(
    () => document.querySelector('.hud-talk-sheet') !== null,
    'walking up to Rufus opens a talk',
  );
  if (talking) {
    await page.screenshot({ path: '.smoke/contest.png' });
    await page.locator('.hud-talk-sheet button', { hasText: 'Best costume' }).click();
    const note = (await page.locator('.hud-talk-sheet .hud-message').textContent()) ?? '';
    check(
      'she crowns Rufus best costume, and he takes home the Golden Gourd',
      note.includes('Golden Gourd') &&
        (await page.evaluate(() => window.world.finale.crowned())) === 'rufus',
      note.slice(0, 60),
    );
    await page.screenshot({ path: '.smoke/contest-crowned.png' });
  }
  await closeSheets();

  await openOn('2026-10-31', 21);
  if (!(await toTheFair())) return check('she goes to the fairground for the party', false);
  await stepUntil(
    () => window.world.neighbourhood.neighbours.every((n) => n.zone === 'fairground' && !n.moving),
    'everyone gathers before the stage',
    120_000,
  );
  const chili = await page.evaluate(() =>
    (window.world.zones.outdoor('fairground')?.decorations?.props() ?? []).some(
      (p) => p.id === 'chiliTable',
    ),
  );
  check("the party's chili and pumpkins are set out before the fairground stage", chili);
  await page.evaluate(() => {
    const cody = window.world.neighbourhood.neighbour('cody');
    window.world.tapTile(cody.tile.tx, cody.tile.ty);
  });
  const withCody = await stepUntil(
    () => document.querySelector('.hud-talk-sheet') !== null,
    'walking up to Cody opens a talk',
  );
  if (withCody) {
    await page.locator('.hud-talk-sheet button', { hasText: 'Our photo' }).click();
    await page.evaluate(() => window.view.step(40, 2));
    await framed('.hud-photo-sheet');
    const photo = await page.evaluate(() => {
      const picture = document.querySelector('.hud-photo-sheet canvas');
      return {
        width: picture instanceof HTMLCanvasElement ? picture.width : 0,
        caption: document.querySelector('.hud-polaroid figcaption')?.textContent ?? '',
      };
    });
    check(
      'their photo at the party: a picture of the two of them, captioned',
      photo.width > 64 && photo.caption.startsWith('Halloween 2026'),
      JSON.stringify(photo),
    );
    await page.screenshot({ path: '.smoke/photo.png' });
    // Kept as a print (V1's S3): the share sheet on her iPhone, a download here, with none.
    const download = page.waitForEvent('download', { timeout: 10_000 }).catch(() => null);
    await tapElement('.hud-photo-keep');
    const file = await download;
    const path = file && (await file.path().catch(() => null));
    const png = path ? readFileSync(path) : null;
    check(
      'the photo can be kept, as a print big enough for the camera roll',
      !!png &&
        png.readUInt32BE(16) >= 900 &&
        /^mcfrancisville-.*\.png$/.test(file?.suggestedFilename() ?? ''),
      `${file?.suggestedFilename()} ${png ? png.readUInt32BE(16) : 0}`,
    );
  }
  await closeSheets();
  await page.screenshot({ path: '.smoke/fair-party.png' });
  await page.evaluate(() => window.world.travel.go('town'));
  await page.evaluate(() => window.view.step(40, 5));
  await closeSheets();
}

/** The holidays in town (phase U): decorations, the sky, Easter's eggs and the castle's hall. */
async function holidays() {
  await openOn('2026-12-24', 21);
  const eve = await page.evaluate(() => ({
    decor: window.world.holidays.decor(),
    sky: window.world.holidays.sky(),
    tree: window.world.townZone.propAt(24, 21)?.id ?? null,
  }));
  check(
    "Christmas Eve's decorations are up, with the tree in the square and snow falling",
    eve.decor === 'christmas' && eve.sky === 'snow' && eve.tree === 'spookyTree',
    JSON.stringify(eve),
  );
  await page.screenshot({ path: '.smoke/christmas-skelly.png' });
  await page.evaluate(() => window.world.tapTile(22, 19));
  await stepUntil(() => !window.world.player.moving, 'she walks to the square');
  await page.evaluate(() => window.view.step(40, 5));
  await page.screenshot({ path: '.smoke/christmas.png' });
  // The park pond is frozen over at Christmas: out onto the ice.
  await page.evaluate(() => window.world.tapTile(22, 42));
  await stepUntil(() => !window.world.player.moving, 'she walks out onto the ice');
  const skating = await page.evaluate(() => window.world.movement.tile);
  check(
    'the frozen pond takes her out onto the ice',
    skating.tx === 22 && skating.ty === 42,
    JSON.stringify(skating),
  );
  await page.evaluate(() => window.view.step(40, 5));
  await page.screenshot({ path: '.smoke/frozen-pond.png' });
  const iceSeams = await page.evaluate(() => window.view.groundSeams());
  check('the frozen pond is baked into its chunks with no seam', iceSeams === 0, `${iceSeams}`);

  await openOn('2026-07-04', 22);
  check(
    'fireworks light up the Fourth of July',
    (await page.evaluate(() => window.world.holidays.sky())) === 'fireworks',
  );
  await page.evaluate(() => window.view.step(40, 20));
  await page.screenshot({ path: '.smoke/fireworks.png' });

  await openOn('2027-03-28', 10);
  const eggs = await page.evaluate(() => window.world.holidays.eggs());
  check("Barty's eggs are hidden round town on Easter", eggs.length === 8, `${eggs.length} eggs`);
  const nearest = await page.evaluate((all) => {
    const here = window.world.movement.tile;
    const far = (/** @type {{ tx: number, ty: number }} */ e) =>
      Math.abs(e.tx - here.tx) + Math.abs(e.ty - here.ty);
    return [...all].sort((a, b) => far(a) - far(b))[0];
  }, eggs);
  if (nearest) {
    await walkTo(nearest);
    await page.evaluate(() => window.view.step(40));
    const found = await page.evaluate(() => window.world.bag.count('chocolateEgg'));
    check('walking onto an egg finds it', found >= 1, `${found}`);
    await page.screenshot({ path: '.smoke/easter.png' });
  }

  // Thanksgiving dinner before the fairground's stage once it's open (0.2's M3), and its poster
  // pinned up on the noticeboard saying so.
  await openOn('2026-11-26', 16);
  if (await toTheFair()) {
    await stepUntil(
      () => {
        const w = window.world.neighbourhood.neighbour('wrapunzel');
        return w.zone === 'fairground' && !w.moving;
      },
      'Wrapunzel comes to dinner at the fairground',
      120_000,
    );
    const dinner = await page.evaluate(() => ({
      where: window.world.neighbourhood.whereIs('wrapunzel'),
      posters: window.world.noticeboard.posters(),
    }));
    check(
      'Thanksgiving dinner is before the fairground stage, and the board says where',
      dinner.where?.zone === 'fairground' &&
        dinner.posters.some((p) => p.name === 'Thanksgiving dinner' && /fairground/.test(p.line)),
      JSON.stringify(dinner),
    );
    await page.evaluate(() => window.view.step(40, 5));
    await page.screenshot({ path: '.smoke/thanksgiving-fair.png' });
  }
  // Market day: Cobweb Corner's market table, out at the stall by the stage.
  await openOn('2026-11-07', 10);
  if (await toTheFair()) {
    await tapFairProp('marketStall');
    const shopping = await stepUntil(
      () => document.querySelector('.hud-shop-sheet') !== null,
      'walking up to the market stall opens it',
    );
    if (shopping) {
      const text = (await page.locator('.hud-shop-sheet').textContent()) ?? '';
      check(
        "market day's stall at the fairground has the market table",
        /market stall/i.test(text) && text.includes('Market table'),
        text.slice(0, 80),
      );
      await page.screenshot({ path: '.smoke/market.png' });
    }
    await closeSheets();
    await page.evaluate(() => window.world.travel.go('town'));
    await page.evaluate(() => window.view.step(40, 5));
    await closeSheets();
  }

  // Up to the castle, and in through its great doors.
  await page.evaluate(() => window.world.atlas.find('castleHill'));
  await page.evaluate(() => window.view.step(40));
  await closeSheets();
  const there = await page.evaluate(() => window.world.travel.go('castleHill'));
  check('the world map takes her to the castle', there);
  await page.evaluate(() => window.view.step(40, 5));
  await closeSheets();
  await page.evaluate(() => {
    const castle = window.world.zone.propAt(13, 6);
    if (castle) window.world.tapTile(castle.tx + 4, castle.ty + 4);
  });
  const inside = await stepUntil(
    () => window.world.scene === 'castleHall',
    "she goes into the castle's great hall",
  );
  if (!inside) return;
  await page.evaluate(() => window.view.step(40, 5));
  await page.screenshot({ path: '.smoke/castle-hall.png' });
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [
  ['holidays', holidays],
  ['seasons', seasons],
  ['rare', rare],
  ['festival', festival],
  ['trickOrTreat', trickOrTreat],
  ['october', october],
  ['finale', finale],
];
