/** Growing: Hosta La Vista Farm, the beds beyond it, Boo Acres and what grows there, and the greenhouse's raised beds. */
import {
  PHONE,
  TILE,
  check,
  closeSheets,
  framed,
  goInto,
  goOut,
  page,
  propTile,
  reloadGame,
  stepUntil,
  tapAlong,
  tapElement,
  tapTile,
} from './lib.mjs';

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
  await framed('.hud-seed-sheet');
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

/**
 * Taps a button on a bed's pop-up once it has settled over its bed, as a finger would.
 * @param {string} selector
 */
async function tapCard(selector) {
  await page.waitForTimeout(450);
  await tapElement(selector);
}

/**
 * More places to grow (0.2's N1): a bed in the woods dug and planted by real taps, the farm's
 * first extension row built and baked into the ground, and a planter box at home.
 */
async function plots() {
  await closeSheets();
  await page.evaluate(() => {
    window.world.bag.add('hostaDivision', 2);
    window.world.travel.cross({ to: 'whisperwood', along: 0 });
    window.world.movement.standAt({ tx: 13, ty: 29 }, 'up');
  });
  await page.evaluate(() => window.view.step(40, 20));
  const bed = await page.evaluate(() => {
    const first = window.world.farm.bedsIn('whisperwood')[0];
    if (!first) throw new Error('the woods have no garden beds');
    return first;
  });
  await tapTile(bed.tx, bed.ty);
  await page.evaluate(() => window.view.step(10));
  const card = page.locator('.hud-bed');
  const shown = await card
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  const said = shown ? ((await card.textContent()) ?? '') : '';
  check('a bed in the woods says what a tap will do', /Dig it over/.test(said), said);
  await tapCard('.hud-bed .hud-primary');
  await stepUntil(() => !window.world.player.moving, 'she reaches the bed in the woods');
  await page.evaluate(() => window.view.step(40));
  const asked = (await page.locator('.hud-seed-sheet').count()) === 1;
  check('the bed in the woods is dug over, and asks for a seed', asked);
  if (!asked) return;
  await tapElement('.hud-seed:has-text("Hosta division")');
  await page.evaluate(() => window.view.step(40, 2));
  const planted = await page.evaluate((b) => window.world.farm.planting(b), bed);
  const toast = (await page.locator('.hud-toast-shown').textContent()) ?? '';
  check(
    'a hosta planted by the creek grows there a day sooner, and she is told so',
    planted?.crop === 'hosta' && planted.quick === true && /a day sooner/.test(toast),
    `${JSON.stringify(planted)} ${toast}`,
  );
  await page.screenshot({ path: '.smoke/woods-bed.png' });

  // The farm's first extension row: grass until it's built, beds after, baked with no seam.
  await page.evaluate(() => {
    window.world.bag.add('wood', 30);
    window.world.bag.add('stone', 10);
    window.world.travel.go('town');
  });
  await page.evaluate(() => window.view.step(40, 2));
  const built = await page.evaluate(() => window.world.workbench.craft('gardenRow')?.kind);
  check('the new garden row is made at the workbench', built === 'made', String(built));
  await page.evaluate(() => window.world.tapTile(14, 12));
  await stepUntil(() => !window.world.player.moving, 'she walks to the farm gate');
  await page.evaluate(() => window.view.step(40, 10));
  await page.screenshot({ path: '.smoke/farm-row.png' });
  const seams = await page.evaluate(() => window.view.groundSeams());
  check('the new row is baked into the ground with no seam', seams === 0, `${seams}`);

  // A planter box at home, with something growing in it.
  await page.evaluate(() => {
    window.world.bag.add('wood', 4);
    window.world.bag.add('stone', 2);
    window.world.workbench.craft('planterBox');
  });
  if (!(await goInto('homeHouse', 'home'))) return;
  const planter = await page.evaluate(() => {
    if (!window.world.decorating.takeOut('planterBox')) return null;
    window.world.decorating.stop();
    const bed = window.world.farm.bedsIn('home')[0];
    if (!bed) return null;
    window.world.farm.till(bed);
    window.world.garden.plant(bed, 'pumpkinSeed');
    return window.world.farm.planting(bed)?.crop ?? null;
  });
  check('a planter box at home is a bed of its own', planter === 'pumpkin', String(planter));
  await page.evaluate(() => window.view.step(40, 10));
  await page.screenshot({ path: '.smoke/planter.png' });
  await page.evaluate(() => window.world.travel.cross({ to: 'town', along: 0 }));
  await page.evaluate(() => window.view.step(40, 2));
}

/**
 * Boo Acres (0.3's F1, decision 241): down the main road west out of town by real taps, its
 * farm's own tune, and a bed in its fields dug over and planted by taps on the bed, its card and
 * the seed.
 */
async function booAcres() {
  await closeSheets();
  await page.evaluate(() => {
    window.world.bag.add('pumpkinSeed', 2);
    if (window.world.scene !== 'town') window.world.travel.go('town');
    window.world.movement.standAt({ tx: 6, ty: 15 }, 'left');
  });
  await page.evaluate(() => window.view.step(40, 30));
  const west = await page.evaluate(() =>
    window.world.zones.map('town').map.exits.find((e) => e.to === 'booAcres'),
  );
  if (!west) return check('the town has a way west to Boo Acres', false);
  const arrived = await tapAlong({ ...west }, 'west down the main road', 'booAcres');
  check('down the main road west of town is Boo Acres', arrived);
  if (!arrived) return;
  await stepUntil(
    () => window.sound.musicPlaying?.startsWith('booAcres@') === true,
    'Boo Acres has a tune of its own',
  );
  await page.screenshot({ path: '.smoke/boo-acres.png' });

  const bed = await page.evaluate(() => window.world.farm.bedsIn('booAcres')[0]);
  if (!bed) return check('Boo Acres has beds in its fields', false);
  if (!(await tapAlong({ tx: bed.tx, ty: bed.ty - 1 }, 'into the fields'))) return;
  await tapTile(bed.tx, bed.ty);
  await page.evaluate(() => window.view.step(10));
  const card = page.locator('.hud-bed');
  const shown = await card
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  const said = shown ? ((await card.textContent()) ?? '') : '';
  check('a bed at Boo Acres says what a tap will do', /Dig it over/.test(said), said);
  if (!shown) return;
  await tapCard('.hud-bed .hud-primary');
  await stepUntil(() => !window.world.player.moving, 'she reaches the bed at Boo Acres');
  await page.evaluate(() => window.view.step(40));
  const asked = (await page.locator('.hud-seed-sheet').count()) === 1;
  check('the bed at Boo Acres is dug over, and asks for a seed', asked);
  if (!asked) return;
  await tapElement('.hud-seed:has-text("Pumpkin")');
  await page.evaluate(() => window.view.step(40, 2));
  const planted = await page.evaluate((b) => window.world.farm.planting(b), bed);
  check(
    'a pumpkin is planted in the fields at Boo Acres',
    planted?.crop === 'pumpkin',
    JSON.stringify(planted),
  );
  await closeSheets();
  await page.evaluate(() => window.view.step(40, 10));
  await page.screenshot({ path: '.smoke/boo-acres-bed.png' });
  await page.evaluate(() => window.world.travel.go('town'));
  await page.evaluate(() => window.view.step(40, 2));
}

/**
 * A strip of a tile as the game's canvas last drew it, `from` to `to` pixels down from its top: the
 * canvas is in world pixels, from the camera's origin.
 * @param {{ tx: number, ty: number }} tile @param {number} from @param {number} to
 */
async function tileStrip(tile, from, to) {
  return page.evaluate(
    ({ tile, from, to, T }) => {
      const cam = window.view.cameraOrigin();
      const canvas = /** @type {HTMLCanvasElement} */ (document.querySelector('#game'));
      const x = tile.tx * T - cam.x;
      const y = tile.ty * T + from - cam.y;
      const data = canvas.getContext('2d')?.getImageData(x, y, T, to - from).data ?? [];
      return [...data];
    },
    { tile, from, to, T: TILE },
  );
}

/** How many pixels of two strips differ by more than a shimmer. @param {number[]} a @param {number[]} b */
function pixelsChanged(a, b) {
  let changed = 0;
  for (let i = 0; i < a.length; i += 4) {
    const d = [0, 1, 2].some((k) => Math.abs((a[i + k] ?? 0) - (b[i + k] ?? 0)) > 24);
    if (d) changed++;
  }
  return changed;
}

/**
 * The greenhouse's raised beds show what's planted in them (V1's S4, decision 275): a seed's mound
 * in a bed's soil, not floating over its back edge, and a sprout a day on.
 */
async function greenhouseBeds() {
  await closeSheets();
  // Flown there, or walked west down the main road the first time, as the map knows it only then.
  if (!(await page.evaluate(() => window.world.travel.go('booAcres')))) {
    await page.evaluate(() => {
      if (window.world.scene !== 'town') window.world.travel.go('town');
      window.world.movement.standAt({ tx: 6, ty: 15 }, 'left');
    });
    await page.evaluate(() => window.view.step(40, 30));
    const west = await page.evaluate(() =>
      window.world.zones.map('town').map.exits.find((e) => e.to === 'booAcres'),
    );
    if (!west || !(await tapAlong({ ...west }, 'west to Boo Acres for its beds', 'booAcres'))) {
      return check('she gets to Boo Acres for its greenhouse', false);
    }
  }
  await page.evaluate(() => window.view.step(40, 20));
  const glass = await page.evaluate(() => {
    const p = window.world.zones.map('booAcres').map.props.find((p) => p.id === 'greenhouse');
    return p ? { tx: p.tx, ty: p.ty, h: p.h } : null;
  });
  if (!glass) return check('Boo Acres has a greenhouse for its beds', false);
  const step = { tx: glass.tx + 2, ty: glass.ty + glass.h };
  if (!(await tapAlong(step, 'to the greenhouse door again'))) return;
  await tapTile(step.tx, step.ty - 1);
  if (!(await stepUntil(() => window.world.scene === 'greenhouse', 'she goes in to the beds'))) {
    return;
  }
  // Its pixels are read, so the way in has faded up first (V1's E4).
  await stepUntil(() => window.view.transition() === null, 'the way in has faded up');
  // The back row's bed right of the path, well away from the door she stands by.
  const bed = await page.evaluate(() => {
    const beds = window.world.farm.bedsIn('greenhouse');
    return beds.find((b) => b.tx === 8 && b.ty === 4) ?? null;
  });
  if (!bed) return check('the greenhouse has a bed at the back right', false);
  await page.evaluate((b) => {
    window.world.farm.uproot(b);
    window.world.farm.till(b);
    window.world.bag.add('sunflowerSeed', 1);
  }, bed);
  await page.evaluate(() => window.view.step(40, 2));
  // Where the seed was drawn before (over the bed's back edge), and where its soil is.
  const above = () => tileStrip(bed, 0, 6);
  const soil = () => tileStrip(bed, 8, 14);
  const [aboveBefore, soilBefore] = [await above(), await soil()];
  const planted = await page.evaluate((b) => window.world.garden.plant(b, 'sunflowerSeed'), bed);
  await page.evaluate(() => window.view.step(40, 2));
  const [aboveAfter, soilAfter] = [await above(), await soil()];
  await page.screenshot({ path: '.smoke/greenhouse-seed.png' });
  check(
    'a seed planted in a raised bed shows in its soil, not floating over its back edge',
    !!planted &&
      pixelsChanged(soilBefore, soilAfter) >= 20 &&
      pixelsChanged(aboveBefore, aboveAfter) <= 4,
    `soil ${pixelsChanged(soilBefore, soilAfter)}, above ${pixelsChanged(aboveBefore, aboveAfter)}`,
  );
  // A morning on, it's a sprout.
  await page.evaluate((b) => {
    const p = window.world.farm.planting(b);
    if (p) window.world.farm.set(b, { ...p, plantedAt: p.plantedAt - 24 * 60 * 60 * 1000 });
  }, bed);
  await page.evaluate(() => window.view.step(40, 2));
  const sprout = await tileStrip(bed, 0, 14);
  await page.screenshot({ path: '.smoke/greenhouse-sprout.png' });
  check(
    'a day on, a sprout stands in the raised bed',
    pixelsChanged(
      [...aboveAfter, ...soilAfter],
      [...sprout.slice(0, 32 * 6 * 4), ...sprout.slice(32 * 8 * 4)],
    ) >= 10,
  );
  await page.evaluate((b) => window.world.farm.uproot(b), bed);
  await goOut();
  await page.evaluate(() => window.world.travel.go('town'));
  await page.evaluate(() => window.view.step(40, 2));
}

/**
 * What grows at Boo Acres (0.3's F2, decision 242), by real taps: an apple picked off an orchard
 * tree, a seed bought at the seed cart, a field sprinkled from the barn's wall, and a raised bed
 * in the greenhouse planted, a day sooner under the glass.
 */
async function whatGrows() {
  await closeSheets();
  await page.evaluate(() => {
    window.world.travel.go('booAcres');
    window.world.bag.add('pumpkinSeed', 2);
    window.world.bag.add('sprinkler', 2);
    window.world.wallet.earn(200);
  });
  await page.evaluate(() => window.view.step(40, 20));
  /** @param {string} id */
  const acres = (id) =>
    page.evaluate((id) => {
      const p = window.world.zones.map('booAcres').map.props.find((p) => p.id === id);
      return p ? { tx: p.tx, ty: p.ty, w: p.w, h: p.h } : null;
    }, id);

  // The orchard: up to an apple tree, and a tap on it.
  const tree = await acres('appleTree');
  if (!tree) return check('Boo Acres has an apple tree', false);
  if (!(await tapAlong({ tx: tree.tx, ty: tree.ty + 1 }, 'up to the orchard'))) return;
  const apples = await page.evaluate(() => window.world.bag.count('apple'));
  await tapTile(tree.tx, tree.ty);
  await stepUntil(() => !window.world.player.moving, 'she reaches the apple tree');
  await page.evaluate(() => window.view.step(40, 2));
  const picked = await page.evaluate(() => window.world.bag.count('apple'));
  const toast =
    (await page
      .locator('.hud-toast-shown')
      .textContent()
      .catch(() => '')) ?? '';
  check(
    'a tap on an apple tree in the orchard picks apples',
    picked === apples + 2 && /apple tree/.test(toast),
    `${apples} -> ${picked}: ${toast}`,
  );
  await page.screenshot({ path: '.smoke/orchard.png' });
  await closeSheets();

  // The seed cart: every seed there is, and one bought.
  const cart = await acres('seedCart');
  if (!cart) return check('Boo Acres has a seed cart', false);
  if (!(await tapAlong({ tx: cart.tx, ty: cart.ty + 1 }, 'to the seed cart'))) return;
  await tapTile(cart.tx, cart.ty);
  await stepUntil(() => !window.world.player.moving, 'she reaches the seed cart');
  await page.evaluate(() => window.view.step(40));
  const open = (await page.locator('.hud-shop-sheet h2:has-text("seed cart")').count()) === 1;
  check('walking up to the seed cart opens it', open);
  if (open) {
    const seeds = page.locator('.hud-shop-sheet section:has(h3:text-is("Every seed")) .hud-price');
    const every = await page.evaluate(() => window.world.shops.stock('seeds')[0]?.offers.length);
    check('the seed cart sells every seed there is', (await seeds.count()) === every, `${every}`);
    await page.screenshot({ path: '.smoke/seed-cart.png' });
    const before = await page.evaluate(() => window.world.wallet.candy);
    await tapElement('.hud-shop-sheet section:has(h3:text-is("Every seed")) .hud-price >> nth=-1');
    const after = await page.evaluate(() => window.world.wallet.candy);
    const said = (await page.locator('.hud-shop-sheet .hud-message').textContent()) ?? '';
    check(
      'a seed bought at the cart goes in her bag',
      after < before && /into your bag/.test(said),
      `${before} -> ${after}: ${said}`,
    );
  }
  await closeSheets();

  // The barn's wall: her sprinklers, and a field sprinkled whole.
  const barn = await acres('barn');
  if (!barn) return check('Boo Acres has a barn', false);
  if (!(await tapAlong({ tx: barn.tx + 3, ty: barn.ty + barn.h + 1 }, 'to the barn'))) return;
  await tapTile(barn.tx + 3, barn.ty + barn.h - 1);
  await stepUntil(() => !window.world.player.moving, 'she reaches the barn');
  await page.evaluate(() => window.view.step(40));
  const wall = (await page.locator('.hud-barn-sheet').count()) === 1;
  check("walking up to the barn shows the wall, with her sprinklers and the farm's fields", wall);
  if (wall) {
    await framed('.hud-barn-sheet');
    await page.screenshot({ path: '.smoke/barn.png' });
    await tapElement('.hud-barn-sheet .hud-field >> nth=0 >> .hud-price:text-is("Sprinkle")');
    const fitted = await page.evaluate(() => ({
      standing: window.world.farm.sprinklersIn.filter((s) => s.zone === 'booAcres').length,
      bag: window.world.bag.count('sprinkler'),
    }));
    const said = (await page.locator('.hud-barn-sheet .hud-message').textContent()) ?? '';
    check(
      "sprinkling a field from the barn's wall stands her sprinklers in its beds",
      fitted.standing === 2 && fitted.bag === 0 && /waters itself/.test(said),
      `${JSON.stringify(fitted)}: ${said}`,
    );
    await page.screenshot({ path: '.smoke/barn-sprinkled.png' });
  }
  await closeSheets();

  // The greenhouse: in through its glass door, and a raised bed planted.
  const glass = await acres('greenhouse');
  if (!glass) return check('Boo Acres has a greenhouse', false);
  const step = { tx: glass.tx + 2, ty: glass.ty + glass.h };
  if (!(await tapAlong(step, 'to the greenhouse door'))) return;
  await tapTile(step.tx, step.ty - 1);
  const inside = await stepUntil(
    () => window.world.scene === 'greenhouse',
    'she goes into the greenhouse',
  );
  check('the greenhouse door goes in', inside);
  if (!inside) return;
  await page.evaluate(() => window.view.step(40, 4));
  await page.screenshot({ path: '.smoke/greenhouse.png' });
  const bed = await page.evaluate(() => window.world.farm.bedsIn('greenhouse')[0]);
  if (!bed) return check('the greenhouse has beds', false);
  await tapTile(bed.tx, bed.ty);
  await page.evaluate(() => window.view.step(10));
  const card = page.locator('.hud-bed');
  const shown = await card
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  check('a raised bed in the greenhouse says what a tap will do', shown);
  if (!shown) return;
  await tapCard('.hud-bed .hud-primary');
  await stepUntil(() => !window.world.player.moving, 'she reaches the raised bed');
  await page.evaluate(() => window.view.step(40));
  if ((await page.locator('.hud-seed-sheet').count()) === 0) {
    return check('the raised bed is dug over, and asks for a seed', false);
  }
  await tapElement('.hud-seed:has-text("Pumpkin")');
  await page.evaluate(() => window.view.step(40, 2));
  const planted = await page.evaluate((b) => window.world.farm.planting(b), bed);
  check(
    'a pumpkin planted under the glass grows a day sooner',
    planted?.crop === 'pumpkin' && planted.quick === true,
    JSON.stringify(planted),
  );
  await closeSheets();
  await page.evaluate(() => window.view.step(40, 10));
  await page.screenshot({ path: '.smoke/greenhouse-planted.png' });
  await goOut();
  await page.evaluate(() => window.world.travel.go('town'));
  await page.evaluate(() => window.view.step(40, 2));
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [
  ['farm', farm],
  ['plots', plots],
  ['booAcres', booAcres],
  ['whatGrows', whatGrows],
  ['greenhouseBeds', greenhouseBeds],
];
