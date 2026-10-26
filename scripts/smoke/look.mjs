/** Her look: the closet and the salon. */
import { check, framed, goInto, goOut, page, tapElement, tapFixture } from './lib.mjs';

async function closet() {
  await page.evaluate(() => window.world.wardrobe.give('denimJacket'));
  await tapElement('.hud-closet');
  await framed('.hud-wardrobe', { tabs: ['Clothes', 'Wrists', 'Tattoos', 'Face'] });
  await tapElement('.hud-wardrobe .hud-filters .hud-chip:text-is("Gloves")');
  await tapElement('.hud-wardrobe .hud-slot[aria-label^="Pink gardening gloves"]');
  const gloves = await page.evaluate(() => window.world.wardrobe.look.outfit.gloves);
  check(
    'the closet has her pink gardening gloves, and puts them on',
    gloves?.id === 'gardenGloves',
  );
  await page.screenshot({ path: '.smoke/closet-gloves.png' });
  // A jacket goes on over her top, on a rail of its own (0.2's W3).
  const top = await page.evaluate(() => window.world.wardrobe.look.outfit.top);
  await tapElement('.hud-wardrobe .hud-filters .hud-chip:text-is("Jackets")');
  await tapElement('.hud-wardrobe .hud-slot[aria-label^="Denim jacket"]');
  const jacketed = await page.evaluate(() => window.world.wardrobe.look.outfit);
  check(
    'the closet puts a jacket on over her top',
    jacketed.outer?.id === 'denimJacket' && jacketed.top?.id === top?.id,
    JSON.stringify(jacketed.outer),
  );
  await page.screenshot({ path: '.smoke/closet-jacket.png' });
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
  await framed('.hud-salon');
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

/** 1.4's G2: the winter wardrobe from her closet by taps, a coat with a scarf over it. */
async function winter() {
  if (await page.evaluate(() => window.world.scene !== 'town')) await goOut();
  const was = await page.evaluate(() => {
    const ids = /** @type {const} */ ([
      'duffelCoat',
      'longScarf',
      'snowflakeHat',
      'mittens',
      'snowBoots',
    ]);
    for (const id of ids) window.world.wardrobe.give(id);
    return window.world.wardrobe.look;
  });
  await tapElement('.hud-closet');
  for (const [rail, piece] of [
    ['Jackets', 'Duffel coat'],
    ['Necklaces', 'Long striped scarf'],
    ['Hats', 'Snowflake bobble hat'],
    ['Gloves', 'Mittens'],
    ['Shoes', 'Snow boots'],
  ]) {
    await tapElement(`.hud-wardrobe .hud-filters .hud-chip:text-is("${rail}")`);
    await tapElement(`.hud-wardrobe .hud-slot[aria-label^="${piece}"]`);
  }
  const outfit = await page.evaluate(() => window.world.wardrobe.look.outfit);
  check(
    'the closet dresses her for snow: a duffel coat, the scarf over it, hat, mittens and boots',
    outfit.outer?.id === 'duffelCoat' &&
      outfit.necklace?.id === 'longScarf' &&
      outfit.hat?.id === 'snowflakeHat' &&
      outfit.gloves?.id === 'mittens' &&
      outfit.shoes?.id === 'snowBoots' &&
      outfit.top?.id === was.outfit.top?.id,
    JSON.stringify(outfit),
  );
  await page.screenshot({ path: '.smoke/closet-winter.png' });
  await tapElement('.hud-wardrobe .hud-done');
  await page.evaluate(() => window.view.step(40));
  await page.screenshot({ path: '.smoke/winter-look.png' });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => window.view.step(40, 4));
  await page.screenshot({ path: '.smoke/winter-look-sideways.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.view.step(40, 4));
  // Back as she was, for the sections after.
  await page.evaluate((look) => window.world.wardrobe.setLook(look), was);
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [
  ['closet', closet],
  ['salon', salon],
  ['winter', winter],
];
