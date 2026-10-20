/** The shops: Cobweb Corner and its held − and +, Ollie's catalogue, Gourdon's workshop and figurines, and this week's furniture set. */
import {
  PHONE,
  check,
  clearMat,
  closeSheets,
  framed,
  goInto,
  goOut,
  holdElement,
  openOn,
  page,
  reloadGame,
  stepUntil,
  tapElement,
  tapFixture,
  tapProp,
  tapTile,
} from './lib.mjs';

/**
 * Enough kinds of thing to fill her bag past the sheet's fold, the sellable ones last.
 * @type {import('../../src/types/ids').ItemId[]}
 */
const A_FULL_BAG = [
  'moonpetal',
  'forgetMeBoo',
  'ghostDaisy',
  'moonflower',
  'snapdragon',
  'spiderLily',
  'batFlower',
  'heartBead',
  'loveBeads',
  'smileyBead',
  'batBead',
  'ghostBead',
  'loveBracelet',
  'smileyBracelet',
  'friendshipBracelet',
  'spookyBracelet',
  'ghostGooBall',
  'pumpkinGooBall',
  'swampGooBall',
  'eyeballSquish',
  'booBao',
  'xiaoLongBoo',
  'batGyoza',
  'recordLadyGhoulga',
  'recordBoneJovi',
  'recordFleetwoodMacabre',
  'recordScreamDion',
  'recordBoolafonte',
];

async function shop() {
  const pill = await page.locator('.hud-candy').boundingBox();
  const gear = await page.locator('.hud-settings').boundingBox();
  check(
    'her Candy shows along the top, clear of the buttons',
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
  await framed('.hud-shop-sheet', { tabs: ['Buy', 'Sell'] });
  const prices = await page.evaluate(() =>
    [...document.querySelectorAll('.hud-price')].map((b) => b.getBoundingClientRect()),
  );
  check(
    'every price is a full thumb and on screen',
    prices.length > 0 && prices.every((b) => b.height >= 44 && b.right <= 390),
    `${prices.length} prices`,
  );
  await page.screenshot({ path: '.smoke/shop.png' });
  const boutique = page.locator('.hud-shop-sheet section:has(h3:text-is("This week\'s boutique"))');
  check(
    "Cobweb Corner has this week's boutique, a whole look",
    (await boutique.locator('.hud-price').count()) >= 2,
  );
  await boutique.scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.smoke/shop-boutique.png' });

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

  // A bag far fuller than the sheet, so the last thing in it is well below the fold (B4).
  await page.evaluate((ids) => ids.forEach((id) => window.world.bag.add(id, 2)), A_FULL_BAG);
  await tapElement('.hud-shop-sheet .hud-sheet-tab:text-is("Sell")');
  await tapElement('.hud-shop-sheet .hud-sheet-body .hud-slot:not(.hud-slot-empty) >> nth=-1');
  const last = await page.evaluate(() => window.world.bag.snapshot().at(-1));
  const sellOne = await page.locator('.hud-shop-sheet .hud-sell-one').boundingBox();
  check(
    'the last thing in a full bag shows what it fetches, and Sell, in sight without scrolling',
    !!sellOne && sellOne.y >= 0 && sellOne.y + sellOne.height <= PHONE.height,
    JSON.stringify(sellOne),
  );
  await page.screenshot({ path: '.smoke/sell.png' });
  if (sellOne) {
    await page.touchscreen.tap(sellOne.x + sellOne.width / 2, sellOne.y + sellOne.height / 2);
  }
  const sold = await page.evaluate(() => window.world.wallet.candy);
  const left = await page.evaluate((id) => (id ? window.world.bag.count(id) : -1), last?.id);
  check(
    'selling one from her bag pays Candy, and takes just the one',
    sold > after && left === (last?.count ?? 0) - 1,
    `${after} -> ${sold}, ${last?.id} ${last?.count} -> ${left}`,
  );
  await tapElement('.hud-shop-sheet .hud-primary');
  check('Done closes the shop', (await page.locator('.hud-sheet').count()) === 0);
  // Back as it was, so the record player further on puts on the record it's given.
  await page.evaluate(
    (ids) => ids.forEach((id) => window.world.bag.remove(id, window.world.bag.count(id))),
    A_FULL_BAG,
  );

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

/** Holding − and + at Cobweb Corner's Sell tab repeats and speeds up (V1's S4, decision 320). */
async function heldStepper() {
  const had = await page.evaluate(() => {
    const had = window.world.bag.count('stone');
    window.world.bag.remove('stone', had);
    window.world.bag.add('stone', 20);
    return had;
  });
  if (!(await goInto('shopHouse', 'cobwebCorner'))) return;
  await tapFixture('shopCounter');
  if ((await page.locator('.hud-shop-sheet').count()) === 0) {
    return check("Cobweb Corner's counter opens for the held stepper", false);
  }
  const count = () => page.locator('.hud-shop-sheet .hud-how-many-n').textContent();
  const more = '.hud-shop-sheet .hud-how-many .hud-chip:last-child';
  const less = '.hud-shop-sheet .hud-how-many .hud-chip:first-child';
  for (const [way, size] of /** @type {const} */ ([
    ['upright', PHONE],
    ['on its side', { width: PHONE.height, height: PHONE.width }],
  ])) {
    await page.setViewportSize(size);
    await page.waitForTimeout(300);
    await tapElement('.hud-shop-sheet .hud-sheet-tab:text-is("Sell")');
    await tapElement('.hud-shop-sheet .hud-sheet-body .hud-slot[aria-label^="Stone"]');
    const tapped = await page.locator(more).isVisible();
    if (!tapped) {
      check(`${way}, a stack of twenty stones shows a − n +`, false);
      continue;
    }
    await tapElement(more);
    const once = Number(await count());
    await holdElement(more, 1500);
    const up = Number(await count());
    const priced = (await page.locator('.hud-shop-sheet .hud-sell-one').textContent()) ?? '';
    check(
      `${way}, a tap on + counts one, and holding it counts past ten, pricing Sell as it goes`,
      once === 2 && up > 10 && up <= 20 && priced.startsWith(`Sell ${up} for`),
      `${once}, then ${up}: ${priced}`,
    );
    await page.screenshot({
      path: `.smoke/held-${way === 'upright' ? 'upright' : 'sideways'}.png`,
    });
    await holdElement(more, 2500);
    check(`${way}, held long enough it stops at all twenty`, Number(await count()) === 20);
    await holdElement(less, 600);
    const down = Number(await count());
    check(`${way}, holding − counts back down`, down < 19, String(down));
  }
  await page.setViewportSize(PHONE);
  await page.waitForTimeout(300);
  const selling = Number(await count());
  await tapElement('.hud-shop-sheet .hud-sell-one');
  const left = await page.evaluate(() => window.world.bag.count('stone'));
  check('selling the held-up count sells that many', left === 20 - selling, `${selling}, ${left}`);
  await closeSheets();
  // Her stones as they were, for the sections after.
  await page.evaluate((had) => {
    window.world.bag.remove('stone', window.world.bag.count('stone'));
    if (had > 0) window.world.bag.add('stone', had);
  }, had);
  await goOut();
}

/**
 * Ollie's catalogue (0.3's S1): up to his post counter by real taps, a second pumpkin armchair
 * ordered, and the next morning his letter in her mailbox with it in her storage chest. Upright
 * and on its side.
 */
async function catalogue() {
  await page.evaluate(() => window.view.saveNow());
  await openOn('2026-10-06', 14);
  if (await page.evaluate(() => window.world.scene !== 'town')) {
    await page.evaluate(() => window.world.travel.go('town'));
    await page.evaluate(() => window.view.step(40, 2));
  }
  // His house stands on a lot (phase T), so it's found among the lots' props, not the map's.
  const house = await page.evaluate(() =>
    window.world.townZone.lots?.props().find((p) => p.id === 'ollieHouse'),
  );
  if (!house) return check("Ollie's house stands on its lot", false);
  await page.evaluate((t) => window.world.tapTile(t.tx, t.ty), house);
  const went = await stepUntil(
    () => window.world.scene === 'ollieCottage',
    "she goes into Ollie's cottage",
  );
  if (!went) return;
  await page.evaluate(() => window.view.step(40));
  await page.screenshot({ path: '.smoke/ollie-cottage.png' });
  // Enough for anything, so the order below is never short.
  await page.evaluate(() => window.world.wallet.earn(2000));
  await tapFixture('postCounter');
  const opened = (await page.locator('.hud-catalogue-sheet').count()) === 1;
  check("walking up to Ollie's post counter opens his catalogue", opened);
  if (!opened) return goOut();
  await framed('.hud-catalogue-sheet', { tabs: ['Catalogue', 'On its way'] });
  const chair = '.hud-catalogue-sheet .hud-ware:has(strong:text-is("Pumpkin armchair")) .hud-price';
  check(
    'the catalogue lists the armchair she has had from the first day, with its price',
    (await page.locator(chair).count()) === 1 &&
      /350/.test((await page.locator(chair).textContent()) ?? ''),
  );
  await page.screenshot({ path: '.smoke/catalogue.png' });
  const before = await page.evaluate(() => ({
    candy: window.world.wallet.candy,
    chairs: window.world.home.stored.find((s) => s.id === 'pumpkinChair')?.count ?? 0,
  }));
  await tapElement(chair);
  const ordered = await page.evaluate(() => ({
    candy: window.world.wallet.candy,
    coming: window.world.deliveries.onTheWay().length,
  }));
  const said = (await page.locator('.hud-catalogue-sheet .hud-message').textContent()) ?? '';
  check(
    'ordering it spends its price, and Ollie will bring it in the morning',
    ordered.candy === before.candy - 350 && ordered.coming === 1 && /morning/.test(said),
    `${JSON.stringify(ordered)} ${said}`,
  );
  await tapElement('.hud-catalogue-sheet .hud-sheet-tab:text-is("On its way")');
  check(
    'it is on its way',
    (await page
      .locator(
        '.hud-catalogue-sheet .hud-sheet-panel:not([hidden]) strong:text-is("Pumpkin armchair")',
      )
      .count()) === 1,
  );
  await page.screenshot({ path: '.smoke/catalogue-coming.png' });
  await tapElement('.hud-catalogue-sheet .hud-sheet-tab:text-is("Catalogue")');
  // On its side, the catalogue is two columns, the whole height, and nothing spills off.
  await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
  await page.waitForTimeout(300);
  const side = await page.evaluate(() => {
    const sheet = document.querySelector('.hud-catalogue-sheet');
    const price = document
      .querySelector('.hud-catalogue-sheet .hud-price')
      ?.getBoundingClientRect();
    return {
      wide: !!sheet && sheet.scrollWidth > sheet.clientWidth + 1,
      price: price ? { right: price.right, width: innerWidth } : null,
    };
  });
  await page.screenshot({ path: '.smoke/sideways-catalogue.png' });
  check(
    "on its side, Ollie's catalogue fits, its prices on screen",
    !side.wide && !!side.price && side.price.right <= side.price.width,
    JSON.stringify(side),
  );
  await page.setViewportSize(PHONE);
  await page.waitForTimeout(300);
  await tapElement('.hud-catalogue-sheet .hud-done');

  // The next morning: his letter in her mailbox, and the chair in her chest once it's opened.
  await page.evaluate(() => window.view.saveNow());
  await openOn('2026-10-07', 9);
  const posted = await page.evaluate(() => ({
    coming: window.world.deliveries.onTheWay().length,
    letter: window.world.mailbox.view().find((l) => l.id.startsWith('order:')),
  }));
  check(
    'next morning, the order has come: a letter from Ollie in her mailbox',
    posted.coming === 0 && posted.letter?.from === 'ollie' && !posted.letter.opened,
    JSON.stringify(posted),
  );
  await goOut();
  await tapProp('mailbox');
  await stepUntil(
    () => document.querySelector('.hud-mail-sheet') !== null,
    'walking up to the mailbox opens it',
  );
  await tapElement('.hud-mail-sheet .hud-seed >> nth=0');
  const enclosed = (await page.locator('.hud-mail-sheet .hud-message').textContent()) ?? '';
  const chairs = await page.evaluate(
    () => window.world.home.stored.find((s) => s.id === 'pumpkinChair')?.count ?? 0,
  );
  check(
    "Ollie's letter brings the armchair, into her storage chest: two chairs, at last",
    chairs === before.chairs + 1 && /Pumpkin armchair/.test(enclosed),
    `${before.chairs} -> ${chairs}: ${enclosed}`,
  );
  await page.screenshot({ path: '.smoke/catalogue-letter.png' });
  await tapElement('.hud-mail-sheet button:text-is("Done")');
}

/**
 * Gourdon's workshop (0.3's S2): up to his bench by real taps, a piece bought fresh from the
 * bench into her chest, a garden bench ordered from his book, and the next morning Ollie's letter
 * in her mailbox with it. Upright and on its side.
 */
async function workshop() {
  await page.evaluate(() => window.view.saveNow());
  await openOn('2026-10-06', 14);
  if (await page.evaluate(() => window.world.scene !== 'town')) {
    await page.evaluate(() => window.world.travel.go('town'));
    await page.evaluate(() => window.view.step(40, 2));
  }
  // His pumpkin stands on a lot (phase T), so it's found among the lots' props.
  const house = await page.evaluate(() =>
    window.world.townZone.lots?.props().find((p) => p.id === 'gourdonHouse'),
  );
  if (!house) return check("Gourdon's pumpkin stands on its lot", false);
  await page.evaluate((t) => window.world.tapTile(t.tx, t.ty), house);
  const went = await stepUntil(
    () => window.world.scene === 'gourdonPumpkin',
    "she goes into Gourdon's pumpkin",
  );
  if (!went) return;
  await page.evaluate(() => window.view.step(40));
  // Enough for anything, so nothing below is ever short.
  await page.evaluate(() => window.world.wallet.earn(3000));
  await tapFixture('carpentersBench');
  const opened = (await page.locator('.hud-shop-sheet').count()) === 1;
  check("walking up to Gourdon's bench opens his workshop", opened);
  if (!opened) return goOut();
  await framed('.hud-shop-sheet', { tabs: ['The bench', 'His book', 'Figurines'] });
  const fresh = '.hud-shop-sheet .hud-sheet-panel:not([hidden]) .hud-ware';
  check('three pieces are fresh from the bench today', (await page.locator(fresh).count()) === 3);
  await page.screenshot({ path: '.smoke/workshop.png' });
  const stored = () =>
    page.evaluate(() => ({
      candy: window.world.wallet.candy,
      pieces: window.world.home.stored.reduce((n, s) => n + s.count, 0),
    }));
  const before = await stored();
  await tapElement(`${fresh} >> nth=0 >> .hud-price`);
  const bought = await stored();
  check(
    'a piece fresh from the bench is bought into her storage chest',
    bought.candy < before.candy && bought.pieces === before.pieces + 1,
    `${JSON.stringify(before)} -> ${JSON.stringify(bought)}`,
  );

  await tapElement('.hud-shop-sheet .hud-sheet-tab:text-is("His book")');
  const order = '.hud-shop-sheet button[aria-label^="Order Garden bench for"]';
  check(
    "his book lists the yard's garden bench, at a quarter over its shelf price",
    (await page.locator(order).count()) === 1 &&
      /650/.test((await page.locator(order).textContent()) ?? ''),
  );
  await page.screenshot({ path: '.smoke/workshop-book.png' });
  await tapElement(order);
  const ordered = await page.evaluate(() => ({
    candy: window.world.wallet.candy,
    coming: window.world.deliveries.onTheWay().map((w) => ('furniture' in w ? w.furniture : '')),
  }));
  const said = (await page.locator('.hud-shop-sheet .hud-message').textContent()) ?? '';
  check(
    'ordering it spends its price, and Ollie will bring it in the morning',
    ordered.candy === bought.candy - 650 &&
      ordered.coming.includes('gardenBench') &&
      /Gourdon.*morning/.test(said),
    `${JSON.stringify(ordered)} ${said}`,
  );
  // On its side, the workshop is two columns, the whole height, and nothing spills off.
  await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
  await page.waitForTimeout(300);
  const side = await page.evaluate(() => {
    const sheet = document.querySelector('.hud-shop-sheet');
    const price = document
      .querySelector('.hud-shop-sheet .hud-sheet-panel:not([hidden]) .hud-price')
      ?.getBoundingClientRect();
    return {
      wide: !!sheet && sheet.scrollWidth > sheet.clientWidth + 1,
      price: price ? { right: price.right, width: innerWidth } : null,
    };
  });
  await page.screenshot({ path: '.smoke/sideways-workshop.png' });
  check(
    "on its side, Gourdon's book fits, its prices on screen",
    !side.wide && !!side.price && side.price.right <= side.price.width,
    JSON.stringify(side),
  );
  await page.setViewportSize(PHONE);
  await page.waitForTimeout(300);
  await tapElement('.hud-shop-sheet .hud-done');

  // The next morning: Ollie's letter in her mailbox, and the bench in her chest once it's opened.
  await page.evaluate(() => window.view.saveNow());
  await openOn('2026-10-07', 9);
  const posted = await page.evaluate(() => {
    const letters = window.world.mailbox.view();
    const at = letters.findIndex((l) => l.id.startsWith('order:furniture:gardenBench:'));
    return { at, from: letters[at]?.from, opened: letters[at]?.opened };
  });
  check(
    "next morning, Gourdon's piece has come: a letter from Ollie in her mailbox",
    posted.at >= 0 && posted.from === 'ollie' && posted.opened === false,
    JSON.stringify(posted),
  );
  if (posted.at < 0) return;
  const benches = () =>
    page.evaluate(() => window.world.home.stored.find((s) => s.id === 'gardenBench')?.count ?? 0);
  const had = await benches();
  await goOut();
  await tapProp('mailbox');
  await stepUntil(
    () => document.querySelector('.hud-mail-sheet') !== null,
    'walking up to the mailbox opens it',
  );
  await tapElement(`.hud-mail-sheet .hud-seed >> nth=${posted.at}`);
  const enclosed = (await page.locator('.hud-mail-sheet .hud-message').textContent()) ?? '';
  const after = await benches();
  check(
    "Ollie's letter brings the garden bench Gourdon made, into her storage chest",
    after === had + 1 && /Garden bench/.test(enclosed),
    `${had} -> ${after}: ${enclosed}`,
  );
  await page.screenshot({ path: '.smoke/workshop-letter.png' });
  await tapElement('.hud-mail-sheet button:text-is("Done")');
}

/**
 * Gourdon's figurines (0.3's C3): up to his bench by real taps with three luna moths in her bag,
 * the Figurines tab, and one carved into her storage chest by a tap on Carve.
 */
async function figurines() {
  if (await page.evaluate(() => window.world.scene !== 'town')) {
    if (await page.evaluate(() => window.world.zones.inside(window.world.scene))) await goOut();
    else await page.evaluate(() => window.world.travel.go('town'));
    await page.evaluate(() => window.view.step(40, 2));
  }
  const house = await page.evaluate(() =>
    window.world.townZone.lots?.props().find((p) => p.id === 'gourdonHouse'),
  );
  if (!house) return check("Gourdon's pumpkin stands on its lot", false);
  await page.evaluate((t) => window.world.tapTile(t.tx, t.ty), house);
  const went = await stepUntil(
    () => window.world.scene === 'gourdonPumpkin',
    "she goes into Gourdon's pumpkin",
  );
  if (!went) return;
  await page.evaluate(() => window.view.step(40));
  const moths = () =>
    page.evaluate(() => ({
      moths: window.world.bag.count('lunaMoth'),
      figurines: window.world.home.stored.find((s) => s.id === 'lunaMothFigurine')?.count ?? 0,
    }));
  await page.evaluate(() => {
    const { bag } = window.world;
    bag.add('lunaMoth', 3 - bag.count('lunaMoth'));
    window.world.events.emit('bag', bag.contents);
  });
  const before = await moths();
  await tapFixture('carpentersBench');
  if ((await page.locator('.hud-shop-sheet').count()) !== 1) {
    return check("walking up to Gourdon's bench opens his workshop, for a figurine", false);
  }
  await tapElement('.hud-shop-sheet .hud-sheet-tab:text-is("Figurines")');
  const carve = '.hud-shop-sheet button[aria-label="Carve Luna moth figurine"]';
  check(
    'his Figurines tab offers to carve a luna moth from her three',
    (await page.locator(carve).count()) === 1 && (await page.locator(carve).isEnabled()),
  );
  await page.screenshot({ path: '.smoke/figurines.png' });
  await tapElement(carve);
  const after = await moths();
  const said = (await page.locator('.hud-shop-sheet .hud-message').textContent()) ?? '';
  check(
    'Carve takes her three luna moths and puts their figurine in her storage chest',
    before.moths === 3 &&
      after.moths === 0 &&
      after.figurines === before.figurines + 1 &&
      /Luna moth figurine, carved/.test(said),
    `${JSON.stringify(before)} -> ${JSON.stringify(after)} ${said}`,
  );
  await page.screenshot({ path: '.smoke/figurines-carved.png' });
  await tapElement('.hud-shop-sheet .hud-done');
  await goOut();
}

/** 0.3's S3: this week's furniture set on Cobweb Corner's shelf, a piece bought and put out, by taps. */
async function furnitureSets() {
  if (await page.evaluate(() => window.world.scene !== 'town')) await goOut();
  await page.evaluate(() => window.world.wallet.earn(3000));
  if (!(await goInto('shopHouse', 'cobwebCorner'))) return;
  await tapFixture('shopCounter');
  if ((await page.locator('.hud-shop-sheet').count()) !== 1) {
    check("walking up to Cobweb Corner's counter opens the shop for the sets", false);
    return goOut();
  }
  const set = '.hud-shop-sheet section:has(h3:text-is("This week\'s set"))';
  const pieces = await page.locator(`${set} .hud-price`).count();
  check(
    "Cobweb Corner has this week's furniture set on its shelf, every piece",
    pieces >= 6,
    `${pieces}`,
  );
  await page.locator(set).scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.smoke/shop-set.png' });
  const label = (await page.locator(`${set} .hud-price >> nth=0`).getAttribute('aria-label')) ?? '';
  const name = /^Buy (.*) for \d+$/.exec(label)?.[1] ?? '';
  const chest = () =>
    page.evaluate(() => window.world.home.stored.reduce((n, s) => n + s.count, 0));
  const before = await chest();
  await tapElement(`${set} .hud-price >> nth=0`);
  const after = await chest();
  check(
    "a piece of the week's set is bought into her storage chest",
    !!name && after === before + 1,
    `${name}: ${before} -> ${after}`,
  );
  await tapElement('.hud-shop-sheet .hud-primary');
  await goOut();

  await tapProp('homeHouse');
  if (!(await stepUntil(() => window.world.scene === 'home', 'she goes home with it'))) return;
  await tapElement('.hud-decorate');
  await tapElement('.hud-decor-bar button:text-is("Storage")');
  await tapElement(`.hud-storage-sheet button[aria-label="Put out ${name}"]`);
  const picked = await page.evaluate(() => window.world.decorating.state?.selected?.id ?? null);
  await tapTile(7, 8);
  await page.evaluate(() => window.view.step(40));
  const placed = await page.evaluate(
    (id) => window.world.home.placed.find((p) => p.id === id) ?? null,
    picked,
  );
  check(
    'the storage chest puts it out, and a tap puts it down in her room',
    !!picked && !!placed,
    `${picked} ${JSON.stringify(placed)}`,
  );
  await tapElement('.hud-decor-bar button:text-is("Done")');
  await page.evaluate(() => window.view.step(40));
  await page.screenshot({ path: '.smoke/set-placed.png' });
  // Back in the chest, for the sections after.
  await page.evaluate((id) => {
    const p = window.world.home.placed.find((q) => q.id === id);
    window.world.decorating.start(p ?? null);
  }, picked);
  await tapElement('.hud-decor-bar button:text-is("Put away")');
  await tapElement('.hud-decor-bar button:text-is("Done")');
  await clearMat();
  const mat = await page.evaluate(() => window.world.home.room.mat);
  await tapTile(mat.tx, mat.ty);
  await stepUntil(() => window.world.scene === 'town', 'she goes back out');
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [
  ['shop', shop],
  ['held', heldStepper],
  ['catalogue', catalogue],
  ['workshop', workshop],
  ['figurines', figurines],
  ['sets', furnitureSets],
];
