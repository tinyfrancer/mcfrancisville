/** Critters: netting, fishing and the reel, a drifting critter, fossils, the creepy-crawlies, the Cabinet and the museum. */
import {
  PLAIN_DAY,
  URL_BASE,
  answerCody,
  check,
  closeSheets,
  framed,
  goInto,
  goOut,
  openOn,
  page,
  playerTile,
  reloadGame,
  stepUntil,
  tapElement,
  tapFixture,
  tapTile,
} from './lib.mjs';

async function critters() {
  // At ten at night, by a dev build's ?hour=, the night's critters are out: moths at the lanterns,
  // orbs in the graveyard, a lantern fish in the pond.
  await page.goto(`${URL_BASE}?loop=manual&skiptitle&day=${PLAIN_DAY}&hour=22`, {
    waitUntil: 'load',
    timeout: 60_000,
  });
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
    // A kind she hasn't had yet: a tap earlier in the run can net one that happened to be on the
    // tile, by the real clock.
    const [near] = w.collecting
      .critters()
      .filter((c) => w.canWalk(c.tx, c.ty) && !w.cabinet.caughtOn(c.critter))
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
        !window.world.cabinet.caughtOn(c.critter) &&
        window.world.bag.count(c.critter) === 0 &&
        onScreen(c) &&
        !window.world.neighbourhood.villagerAt(c.tx, c.ty) &&
        !window.world.neighbourhood.villagerAt(c.tx, c.ty + 1),
    );
  });
  check('a critter is out where she can see it', target !== undefined);
  if (!target) return;
  const before = await page.evaluate(() => window.world.cabinet.found);
  // A wary one flutters off once, and a shy one drifts if she rushes it (V1's R6a): a few goes.
  for (let tries = 0; tries < 6; tries++) {
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
  // It may have come out shiny (1.4's G1), a thing of its own in her bag.
  const caught = await page.evaluate(
    (id) => window.world.bag.count(id) + window.world.bag.count(`${id}Shiny`),
    target.critter,
  );
  check('tapping a critter walks her up to it and nets it', caught >= 1, target.critter);
  const found = await page.evaluate(() => window.world.cabinet.found);
  check(
    'a new catch goes in the Curiosity Cabinet, with a fuss',
    found === before + 1 && (await page.locator('.hud-toast-special').count()) === 1,
    `${before} -> ${found}`,
  );

  await tapElement('.hud-cabinet');
  await framed('.hud-cabinet-sheet', { tabs: ['Cases', 'Fossils', 'Shelves'] });
  const cases = await page.evaluate(() => {
    const slots = [
      ...document.querySelectorAll('.hud-cabinet-sheet .hud-slot:not(.hud-slot-empty)'),
    ].filter((s) => !s.closest('.hud-shelves') && !s.closest('.hud-sheet-panel[hidden]'));
    return {
      cases: slots.length,
      thumb: slots.every((s) => s.getBoundingClientRect().width >= 44),
      onScreen: slots.every((s) => s.getBoundingClientRect().right <= 390),
      found: document.querySelector('.hud-cabinet-sheet h2 + p')?.textContent ?? '',
    };
  });
  await tapElement('.hud-cabinet-sheet .hud-sheet-panel .hud-slot >> nth=0');
  const picked = await page.evaluate(() => {
    const card = document.querySelector('.hud-cabinet-sheet .hud-sheet-foot .hud-item-card');
    const picture = card?.querySelector('.hud-icon-box canvas')?.getBoundingClientRect();
    return { name: card?.querySelector('h3')?.textContent ?? '', width: picture?.width ?? 0 };
  });
  check(
    'a case tapped is told in the foot, its picture big beside its name',
    picked.name !== '' && picked.width >= 48,
    JSON.stringify(picked),
  );
  await tapElement('.hud-cabinet-sheet .hud-sheet-tab:text-is("Shelves")');
  const book = await page.evaluate(() => {
    const sets = [...document.querySelectorAll('.hud-shelves .hud-slot')];
    return {
      sets: sets.length,
      setsFit: sets.every((s) => {
        const r = s.getBoundingClientRect();
        return r.width >= 44 && r.right <= 390;
      }),
      shelves: document.querySelectorAll('.hud-shelves .hud-detail').length,
    };
  });
  check(
    'the Curiosity Cabinet has a thumb-sized case for every critter, all on screen',
    cases.cases === 74 && cases.thumb && cases.onScreen,
    JSON.stringify(cases),
  );
  check(
    "on its own tab, her shelves to finish, and every squishy and doll she's still to have",
    // Nine squishies (the fairground's own since V1's R6b) and eight dolls; the shinies' two
    // shelves since 1.4's G1.
    book.shelves === 17 && book.sets === 17 && book.setsFit,
    JSON.stringify(book),
  );
  // A tap earlier in the run can net a critter that happened to be on the tile, by the real clock.
  check(
    'it counts what she has found',
    cases.found.startsWith(`${found} of 74 found`),
    cases.found,
  );
  await page.screenshot({ path: '.smoke/cabinet.png' });
  await tapElement('.hud-cabinet-sheet button:text-is("Done")');

  // Crumbs & Curios, east of the square: in, and up to one of the museum's cases.
  if (!(await goInto('bakery', 'crumbs'))) return;
  await tapFixture('museumCase');
  const museum = (await page.locator('.hud-museum-sheet').count()) === 1;
  check("walking up to a case in Wrapunzel's museum opens it", museum);
  if (!museum) return goOut();
  await framed('.hud-museum-sheet', { tabs: ['To donate', 'On show'] });
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

/**
 * 0.3's C1: the day's mound, dug by a real tap, the fossil in her Curiosity Cabinet's Fossils
 * tab, and given to the seventh case at Wrapunzel's museum.
 */
async function fossils() {
  await closeSheets();
  // A place whose mound has a fossil in it today (most do), and over near it.
  const place = await page.evaluate(() => {
    const w = window.world;
    const places = /** @type {const} */ ([
      'town',
      'whisperwood',
      'lanternShore',
      'castleHill',
      'booAcres',
      'fairground',
    ]);
    const zone = places.find((z) => !w.fossils.isDug(z) && 'fossil' in w.fossils.findToday(z));
    if (!zone) return null;
    w.atlas.find(zone);
    if (w.scene !== zone) w.travel.go(zone);
    if (w.scene !== zone) return null;
    const mound = w.fossils.mound(zone);
    if (!mound) return null;
    for (const [dx, dy] of /** @type {const} */ ([
      [0, 3],
      [3, 0],
      [-3, 0],
      [0, -3],
      [2, 2],
      [-2, 2],
    ])) {
      const at = { tx: mound.tx + dx, ty: mound.ty + dy };
      if (w.canWalk(at.tx, at.ty)) {
        w.movement.standAt(at, 'up');
        break;
      }
    }
    return {
      zone,
      mound,
      fossil: /** @type {import('../../src/types/ids').FossilId} */ (
        /** @type {{ fossil: string }} */ (w.fossils.findToday(zone)).fossil
      ),
    };
  });
  check('a place has a mound with a fossil in it today', place !== null);
  if (!place) return;
  await page.evaluate(() => window.view.step(40, 30));
  await page.screenshot({ path: '.smoke/mound.png' });
  await tapTile(place.mound.tx, place.mound.ty);
  await stepUntil(() => !window.world.player.moving, 'she walks up to the mound');
  await page.evaluate(() => window.view.step(40));
  const dug = await page.evaluate(
    (p) => ({
      count: window.world.bag.count(p.fossil),
      dug: window.world.fossils.isDug(p.zone),
      solid: !window.world.canWalk(p.mound.tx, p.mound.ty),
    }),
    place,
  );
  // Anything else said first (a letter come while she was out) is tapped away, in its turn.
  const said = await stepUntil(() => {
    const shown = document.querySelector('.hud-toast-shown');
    if (!shown) return false;
    if (/dig into the mound/.test(shown.textContent ?? '')) return true;
    shown.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    return false;
  }, 'she says what she dug up');
  check(
    'tapping the mound walks her up to it, and she digs up a fossil, with a fuss',
    dug.count >= 1 && dug.dug && dug.solid && said,
    `${place.zone} ${place.fossil} ${JSON.stringify(dug)}`,
  );
  await page.screenshot({ path: '.smoke/mound-dug.png' });

  await closeSheets();
  await tapElement('.hud-cabinet');
  await tapElement('.hud-cabinet-sheet .hud-sheet-tab:text-is("Fossils")');
  const tab = await page.evaluate(() => {
    const panel = [...document.querySelectorAll('.hud-cabinet-sheet .hud-sheet-panel')].find(
      (p) => !(/** @type {HTMLElement} */ (p).hidden),
    );
    const slots = [...(panel?.querySelectorAll('.hud-slot[aria-label]') ?? [])].filter(
      (s) => s.getAttribute('aria-label') !== '',
    );
    return {
      slots: slots.length,
      names: slots.map((s) => s.getAttribute('aria-label') ?? ''),
      fit: slots.every((s) => {
        const r = s.getBoundingClientRect();
        return r.width >= 44 && r.right <= 390;
      }),
    };
  });
  const found = tab.names.filter((n) => !n.startsWith('Not dug up')).length;
  check(
    'the Cabinet has a Fossils tab, a thumb-sized case for each, the one she dug drawn in its own',
    tab.slots === 12 && tab.fit && found >= 1,
    `${place.fossil} ${JSON.stringify(tab)}`,
  );
  await tapElement('.hud-cabinet-sheet .hud-sheet-panel:not([hidden]) .hud-slot >> nth=0');
  await page.screenshot({ path: '.smoke/cabinet-fossils.png' });
  await tapElement('.hud-cabinet-sheet button:text-is("Done")');

  // Back to town, and in to the museum to give it to the seventh case.
  await page.evaluate(() => {
    const w = window.world;
    if (w.scene !== 'town') w.travel.go('town');
  });
  await page.evaluate(() => window.view.step(40, 10));
  if (!(await goInto('bakery', 'crumbs'))) return;
  await tapFixture('museumCase');
  if ((await page.locator('.hud-museum-sheet').count()) !== 1) {
    check("the museum's cases open to give it a fossil", false);
    return goOut();
  }
  const isShown = () => page.evaluate((id) => window.world.cabinet.isDonated(id), place.fossil);
  for (let i = 0; i < 60 && !(await isShown()); i++) {
    const rows = await page.locator('.hud-museum-sheet button:text-is("Donate")').count();
    if (rows === 0) break;
    await tapElement('.hud-museum-sheet button:text-is("Donate") >> nth=-1');
  }
  const label = (await page.locator('.hud-museum-sheet .hud-message').textContent()) ?? '';
  check(
    'a fossil given to the museum goes in the seventh case, with a label',
    await isShown(),
    label,
  );
  await tapElement('.hud-museum-sheet .hud-sheet-tab:text-is("On show")');
  await page.screenshot({ path: '.smoke/museum-fossils.png' });
  await tapElement('.hud-museum-sheet button:text-is("Done")');
  // Over to the seventh case, to see it in its nook.
  await page.evaluate(() => window.world.tapTile(21, 4));
  await stepUntil(() => !window.world.player.moving, 'she walks over to the seventh case');
  await page.evaluate(() => window.view.step(40, 10));
  await page.screenshot({ path: '.smoke/fossil-case.png' });
  await goOut();
}

/** The creepy-crawlies (0.3's C2), a seventh family, most of them at home at Boo Acres. */
const CRAWLIES = [
  'pumpkinSnail',
  'booSlug',
  'glowworm',
  'woollyBear',
  'bowSpider',
  'moonCricket',
  'fiddleHopper',
  'twigKnight',
  'rolyPoly',
  'wiggleWorm',
  'goldenSnail',
];

/**
 * 0.3's C2: a creepy-crawly netted at Boo Acres by a real tap, and given to the eighth case at
 * Wrapunzel's museum.
 */
async function crawlies() {
  await closeSheets();
  const target = await page.evaluate((crawlies) => {
    const w = window.world;
    w.atlas.find('booAcres');
    if (w.scene !== 'booAcres') w.travel.go('booAcres');
    if (w.scene !== 'booAcres') return null;
    const near = w.collecting
      .critters()
      .find(
        (c) =>
          crawlies.includes(c.critter) &&
          w.canWalk(c.tx, c.ty) &&
          !w.cabinet.caughtOn(c.critter) &&
          w.bag.count(c.critter) === 0 &&
          !w.neighbourhood.villagerAt(c.tx, c.ty) &&
          !w.neighbourhood.villagerAt(c.tx, c.ty + 1),
      );
    if (!near) return null;
    for (const [dx, dy] of /** @type {const} */ ([
      [0, 3],
      [3, 0],
      [-3, 0],
      [0, -3],
      [2, 2],
      [-2, 2],
      [0, 2],
      [2, 0],
    ])) {
      const at = { tx: near.tx + dx, ty: near.ty + dy };
      if (w.canWalk(at.tx, at.ty)) {
        w.movement.standAt(at, 'up');
        break;
      }
    }
    return near;
  }, CRAWLIES);
  check('a creepy-crawly is out at Boo Acres', target !== null);
  if (!target) return;
  await page.evaluate(() => window.view.step(40, 30));
  // A wary one flutters off once, and a shy one drifts if she rushes it (V1's R6a): a few goes.
  for (let tries = 0; tries < 6; tries++) {
    const now = await page.evaluate(
      (key) => window.world.collecting.critters().find((c) => c.key === key) ?? null,
      target.key,
    );
    if (!now) break;
    await tapTile(now.tx, now.ty);
    await stepUntil(() => !window.world.player.moving, `she reaches the ${target.critter}`);
    await page.evaluate(() => window.view.step(40));
    if (tries === 0) await page.screenshot({ path: '.smoke/crawly.png' });
  }
  // It may have come out shiny (1.4's G1), a thing of its own in her bag.
  const caught = await page.evaluate(
    (id) => window.world.bag.count(id) + window.world.bag.count(`${id}Shiny`),
    target.critter,
  );
  check(
    'tapping a creepy-crawly at Boo Acres walks her up to it and nets it',
    caught >= 1,
    target.critter,
  );
  if (caught < 1) return;

  await closeSheets();
  await page.evaluate(() => window.world.travel.go('town'));
  await page.evaluate(() => window.view.step(40, 10));
  if (!(await goInto('bakery', 'crumbs'))) return;
  // Two since V1's R5: the eighth and, for the jumping spiders, the ninth.
  const crawlyCases = await page.evaluate(() => {
    const room = window.world.zones.inside(window.world.scene);
    return (
      room?.things.filter(
        (t) => 'fixture' in t && t.fixture.id === 'museumCase' && t.fixture.shows === 'crawly',
      ).length ?? 0
    );
  });
  check(
    "Wrapunzel's museum has an eighth case and a ninth, for the creepy-crawlies",
    crawlyCases === 2,
  );
  await tapFixture('museumCase');
  if ((await page.locator('.hud-museum-sheet').count()) !== 1) {
    check("the museum's cases open to give it a creepy-crawly", false);
    return goOut();
  }
  const isShown = () => page.evaluate((id) => window.world.cabinet.isDonated(id), target.critter);
  for (let i = 0; i < 70 && !(await isShown()); i++) {
    const rows = await page.locator('.hud-museum-sheet button:text-is("Donate")').count();
    if (rows === 0) break;
    await tapElement('.hud-museum-sheet button:text-is("Donate") >> nth=0');
  }
  check('a creepy-crawly given to the museum goes on show', await isShown(), target.critter);
  await tapElement('.hud-museum-sheet button:text-is("Done")');
  // Over to the eighth case, to see it in its nook.
  await page.evaluate(() => window.world.tapTile(21, 9));
  await stepUntil(() => !window.world.player.moving, 'she walks over to the eighth case');
  await page.evaluate(() => window.view.step(40, 10));
  await page.screenshot({ path: '.smoke/crawly-case.png' });
  await goOut();
}

async function fishing() {
  // At noon there are always a few fish in the town's pond, shadows under the water.
  await page.goto(`${URL_BASE}?loop=manual&skiptitle&day=${PLAIN_DAY}&hour=12`, {
    waitUntil: 'load',
    timeout: 60_000,
  });
  await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
  await answerCody();
  const fish = await page.evaluate(() =>
    window.world.collecting.critters().filter((c) => !window.world.canWalk(c.tx, c.ty)),
  );
  check('fish are in the water at noon', fish.length >= 2, fish.map((c) => c.critter).join(', '));
  // A common one if there is, which a single timed tap lands (V1's R6a: no reel for it).
  const rarity = await page.evaluate(
    (ids) => ids.map((id) => window.world.collecting.rarityOf(id)),
    fish.map((c) => c.critter),
  );
  const first = fish[rarity.indexOf('common')] ?? fish[0];
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
  // Her line is read off the real clock, so a bite comes in real time: wait for the middle of
  // the next one (`bestTapAt`, V1's R6a) and tap, once; a rare fish's reel is a second tap in time.
  // One missed only comes round again, so she has a few goes.
  let landed = false;
  let taps = 0;
  const me = await playerTile();
  for (let tries = 0; tries < 4 && !landed; tries++) {
    const wait = await page.evaluate(
      () =>
        (window.world.fishing.bestTapAt() ?? window.world.clock.now()) - window.world.clock.now(),
    );
    if (wait > 25) await page.waitForTimeout(wait - 25);
    await page.waitForFunction(
      () => ['bite', 'reel'].includes(window.world.fishing.line?.state ?? ''),
      null,
      { timeout: 20_000, polling: 10 },
    );
    if (tries === 0) await page.screenshot({ path: '.smoke/fish-bite.png' });
    await tapTile(me.tx, me.ty + 2);
    taps++;
    await page.evaluate(() => window.view.step(16, 2));
    landed = await page.evaluate((id) => window.world.bag.count(id) > 0, first.critter);
    if (!landed && !(await page.evaluate(() => window.world.fishing.line))) {
      await tapTile(first.tx, first.ty);
      await stepUntil(() => window.world.fishing.line !== null, 'she casts again');
    }
  }
  check('a tap on the bite lands the fish, into her bag', landed, first.critter);
  const common =
    (await page.evaluate((id) => window.world.collecting.rarityOf(id), first.critter)) === 'common';
  if (common)
    check('a common fish lands with one tap in time', landed && taps === 1, `${taps} taps`);
  const size = await page.evaluate((id) => window.world.cabinet.bestOf(id), first.critter);
  check('the fish landed is measured, its best kept in the Cabinet', (size ?? 0) > 0, `${size}`);
  await page.screenshot({ path: '.smoke/fish-caught.png' });
  check('the catch is told with a fuss', (await page.locator('.hud-toast-special').count()) === 1);
}

/**
 * 1.4's G3: in January the town's pond is frozen over, its fish dim shadows under the ice; a tap on
 * one casts through a hole in it, and a tap on the bite lands it.
 */
async function iceFishing() {
  await openOn('2027-01-15', 12);
  await answerCody();
  const fish = await page.evaluate(() =>
    window.world.collecting.critters().filter((c) => window.world.townZone.isIce(c.tx, c.ty)),
  );
  check(
    'in January the fish are under the frozen pond',
    fish.length >= 1,
    fish.map((c) => c.critter).join(', '),
  );
  const first = fish[0];
  if (!first) return;
  // Onto the ice near it, so its shadow is on screen for a real tap.
  await page.evaluate((c) => {
    const w = window.world;
    for (let r = 2; r <= 4; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (w.canWalk(c.tx + dx, c.ty + dy) && w.tapTile(c.tx + dx, c.ty + dy)) return;
        }
      }
    }
  }, first);
  await stepUntil(() => !window.world.player.moving, 'she skates over to it');
  await page.evaluate(() => window.view.step(16, 30));
  await page.screenshot({ path: '.smoke/ice-shadows.png' });
  await tapTile(first.tx, first.ty);
  await stepUntil(() => window.world.fishing.line !== null, 'she casts through the ice');
  const cast = await page.evaluate(() => {
    const line = window.world.fishing.line;
    return {
      held: window.world.hands.held,
      onIce: !!line && window.world.townZone.isIce(line.tx, line.ty),
    };
  });
  check(
    'a tap on a shadow under the ice casts her rod through a hole in it',
    cast.held === 'rod' && cast.onIce,
    JSON.stringify(cast),
  );
  await page.evaluate(() => window.view.step(16, 60));
  await page.screenshot({ path: '.smoke/ice-hole.png' });
  let landed = false;
  const me = await playerTile();
  for (let tries = 0; tries < 4 && !landed; tries++) {
    const wait = await page.evaluate(
      () =>
        (window.world.fishing.bestTapAt() ?? window.world.clock.now()) - window.world.clock.now(),
    );
    if (wait > 25) await page.waitForTimeout(wait - 25);
    await page.waitForFunction(
      () => ['bite', 'reel'].includes(window.world.fishing.line?.state ?? ''),
      null,
      { timeout: 20_000, polling: 10 },
    );
    await tapTile(me.tx, me.ty + 1);
    await page.evaluate(() => window.view.step(16, 2));
    landed = await page.evaluate((id) => window.world.cabinet.caughtOn(id) !== null, first.critter);
    if (!landed && !(await page.evaluate(() => window.world.fishing.line))) {
      await tapTile(first.tx, first.ty);
      await stepUntil(() => window.world.fishing.line !== null, 'she casts again');
    }
  }
  check('a tap on the bite lands it, through the ice', landed, first.critter);
}

/**
 * V1's R6a: a shy critter rushed at drifts a tile away with a hop, drawn on the way, and is
 * netted once she creeps up. Found by trying a few hours of a few days, by a dev build's ?day=.
 */
async function drifter() {
  /** @type {null | { key: string, critter: import('../../src/types/ids').CritterId, tx: number, ty: number, from: { tx: number, ty: number }, facing: import('../../src/types/ids').Facing }} */
  let shy = null;
  for (let tries = 0; tries < 18 && !shy; tries++) {
    const day = `2026-10-${String(3 + (tries % 6)).padStart(2, '0')}`;
    const hour = [11, 21, 16][Math.floor(tries / 6)];
    await page.goto(`${URL_BASE}?loop=manual&skiptitle&day=${day}&hour=${hour}`, {
      waitUntil: 'load',
      timeout: 60_000,
    });
    await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
    await answerCody();
    shy = await page.evaluate(() => {
      const w = window.world;
      const out = w.collecting.critters();
      const clear = (/** @type {number} */ tx, /** @type {number} */ ty) =>
        w.canWalk(tx, ty) &&
        !w.neighbourhood.villagerAt(tx, ty) &&
        !out.some((o) => o.tx === tx && o.ty === ty);
      // From the south, east or west (a flier never sees her coming from the north, its back).
      /** @type {readonly (readonly [number, number, import('../../src/types/ids').Facing])[]} */
      const sides = [
        [0, 1, 'up'],
        [1, 0, 'left'],
        [-1, 0, 'right'],
      ];
      for (const c of out) {
        if (!w.collecting.isShy(c.critter) || !w.canWalk(c.tx, c.ty)) continue;
        for (const [dx, dy, facing] of sides) {
          // Somewhere to drift to, straight on away from her.
          if (!clear(c.tx - dx, c.ty - dy)) continue;
          let open = true;
          for (let k = 1; k <= 6; k++) open &&= clear(c.tx + dx * k, c.ty + dy * k);
          const from = { tx: c.tx + dx * 6, ty: c.ty + dy * 6 };
          if (open) return { key: c.key, critter: c.critter, tx: c.tx, ty: c.ty, from, facing };
        }
      }
      return null;
    });
  }
  check('a shy critter is out somewhere to try', shy !== null);
  if (!shy) return;
  const target = shy;
  // Stood six tiles off, where she'll be seen coming, and then a tap to rush it.
  await page.evaluate((t) => window.world.movement.standAt(t.from, t.facing), target);
  await page.evaluate(() => window.view.step(16, 4));
  await page.evaluate((t) => window.world.tapTile(t.tx, t.ty), target);
  await stepUntil(
    () => window.world.collecting.critters().some((c) => c.hop !== undefined),
    'the shy critter notices her',
  );
  const hop = await page.evaluate(
    (key) => window.world.collecting.critters().find((c) => c.key === key) ?? null,
    target.key,
  );
  const step = hop ? Math.max(Math.abs(hop.tx - target.tx), Math.abs(hop.ty - target.ty)) : 0;
  check(
    'rushed at, a shy critter hops a tile away, drawn from where it was',
    hop !== null && step === 1 && hop.hop?.tx === target.tx && hop.hop?.ty === target.ty,
    JSON.stringify(hop),
  );
  await page.evaluate(() => window.view.step(16, 8));
  await page.screenshot({ path: '.smoke/drift.png' });
  await stepUntil(() => !window.world.player.moving, 'she stops');
  // Creeping up from where she stopped, it's hers (a wary one may flutter off first).
  for (let tries = 0; tries < 5; tries++) {
    const now = await page.evaluate(
      (key) => window.world.collecting.critters().find((c) => c.key === key) ?? null,
      target.key,
    );
    if (!now) break;
    await page.evaluate((t) => window.world.tapTile(t.tx, t.ty), now);
    await stepUntil(() => !window.world.player.moving, 'she creeps up');
  }
  const netted = await page.evaluate((id) => window.world.bag.count(id), target.critter);
  check('creeping up, she nets it', netted >= 1, target.critter);
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [
  ['critters', critters],
  ['fishing', fishing],
  ['iceFishing', iceFishing],
  ['drifter', drifter],
  ['fossils', fossils],
  ['crawlies', crawlies],
];
