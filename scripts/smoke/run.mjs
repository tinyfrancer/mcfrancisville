/**
 * Browser smoke check: what only a real browser can show. Game rules belong in vitest.
 *
 * It runs on a portrait iPhone-sized viewport in a touch-capable context, because that is what the
 * game is for, under `?loop=manual`: nothing moves until `view.step()` cranks it, so every wait is
 * in game milliseconds and a slow runner makes the run slower rather than flakier. It reaches the
 * game through the dev-only `window.world` and `window.view`, typed in `scripts/globals.d.ts`.
 *
 * The sections are grouped in areas, a file each beside this one (`town.mjs`, `fair.mjs`…), each
 * exporting its `sections`; the helpers they share are `lib.mjs`. They share one page and one
 * town, so a whole run takes them in `ORDER` below, and a section may lean on what one before it
 * left. `boot` always runs first.
 *
 * Usage: npm run dev, then `npm run smoke [-- [--headed] [--list] [name…]]`. No names runs every
 * area; `npm run smoke -- town fair` runs those areas' sections, in `ORDER`; a name that is no
 * area's but a section's runs that section (`--section=a,b` names sections only, as before the
 * split); `--list` lists the areas and their sections. `SMOKE_URL` points it at another server.
 * Screenshots land in .smoke/.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import {
  PHONE_CONTEXT,
  attach,
  check,
  consoleErrors,
  fakeCloud,
  listen,
  page,
  results,
} from './lib.mjs';
import { sections as boot } from './boot.mjs';
import { sections as cloud } from './cloud.mjs';
import { sections as critters } from './critters.mjs';
import { sections as fair } from './fair.mjs';
import { sections as farm } from './farm.mjs';
import { sections as feel } from './feel.mjs';
import { sections as firstDay } from './firstDay.mjs';
import { sections as gallery } from './gallery.mjs';
import { sections as home } from './home.mjs';
import { sections as hud } from './hud.mjs';
import { sections as look } from './look.mjs';
import { sections as neighbours } from './neighbours.mjs';
import { sections as pets } from './pets.mjs';
import { sections as places } from './places.mjs';
import { sections as projects } from './projects.mjs';
import { sections as seasons } from './seasons.mjs';
import { sections as shops } from './shops.mjs';
import { sections as sound } from './sound.mjs';
import { sections as town } from './town.mjs';

/**
 * Each area by its file's name.
 * @type {Record<string, import('./lib.mjs').Section[]>}
 */
const AREAS = {
  boot,
  firstDay,
  town,
  look,
  hud,
  feel,
  sound,
  cloud,
  projects,
  farm,
  shops,
  home,
  neighbours,
  critters,
  pets,
  fair,
  places,
  seasons,
  gallery,
};

/**
 * Every section, in the order a whole run takes them (the order of the one file they came from).
 * A new section goes in its area's list and here.
 */
const ORDER = [
  'boot',
  'firstDay',
  'pwa',
  'walk',
  'camera',
  'smooth',
  'ground',
  'save',
  'notes',
  'closet',
  'salon',
  'gather',
  'bag',
  'calendar',
  'notices',
  'projects',
  'passive',
  'farm',
  'shop',
  'held',
  'home',
  'chest',
  'display',
  'tabletop',
  'craft',
  'backRoom',
  'yard',
  'cook',
  'neighbours',
  'relations',
  'mystery',
  'sound',
  'settings',
  'safe',
  'cloud',
  'weather',
  'night',
  'fountain',
  'heard',
  'critters',
  'fishing',
  'drifter',
  'fossils',
  'crawlies',
  'pets',
  'zones',
  'places',
  'seeThrough',
  'effects',
  'faces',
  'verbs',
  'alive',
  'moves',
  'taps',
  'catalogue',
  'workshop',
  'figurines',
  'sets',
  'windows',
  'fair',
  'plots',
  'booAcres',
  'whatGrows',
  'greenhouseBeds',
  'edges',
  'interiors',
  'lives',
  'everyone',
  'scarah',
  'holidays',
  'seasons',
  'rare',
  'festival',
  'trickOrTreat',
  'october',
  'finale',
  'jobs',
  'robBoo',
  'married',
  'broom',
  'closer',
  'sideways',
  'gallery',
];

/** @type {Map<string, { area: string, run: () => Promise<void> }>} */
const SECTIONS = new Map();
for (const [area, list] of Object.entries(AREAS)) {
  for (const [name, run] of list) {
    if (SECTIONS.has(name)) fail(`section ${name} is in ${SECTIONS.get(name)?.area} and ${area}`);
    SECTIONS.set(name, { area, run });
  }
}
const unordered = [...SECTIONS.keys()].filter((name) => !ORDER.includes(name));
const unlisted = ORDER.filter((name) => !SECTIONS.has(name));
if (unordered.length > 0) fail(`not in run.mjs's ORDER: ${unordered.join(', ')}`);
if (unlisted.length > 0) fail(`in ORDER but no area's: ${unlisted.join(', ')}`);

const args = process.argv.slice(2);
const headed = args.includes('--headed');

if (args.includes('--list')) {
  for (const [area, list] of Object.entries(AREAS)) {
    console.log(`${area.padEnd(11)} ${list.map(([name]) => name).join(', ')}`);
  }
  process.exit(0);
}

/** @type {Set<string>} */
const chosen = new Set();
const named = args.filter((a) => !a.startsWith('--'));
const sectionsNamed =
  args
    .find((a) => a.startsWith('--section='))
    ?.slice('--section='.length)
    .split(',')
    .filter(Boolean) ?? [];
const unknown = [];
for (const name of named) {
  const area = AREAS[name];
  if (area) for (const [section] of area) chosen.add(section);
  else if (SECTIONS.has(name)) chosen.add(name);
  else unknown.push(name);
}
for (const name of sectionsNamed) {
  if (SECTIONS.has(name)) chosen.add(name);
  else unknown.push(name);
}
if (unknown.length > 0) {
  console.error(`unknown area(s) or section(s): ${unknown.join(', ')}`);
  console.error(`areas: ${Object.keys(AREAS).join(', ')} (--list for their sections)`);
  process.exit(2);
}
const all = named.length === 0 && sectionsNamed.length === 0;

mkdirSync('.smoke', { recursive: true });

// CHROMIUM_PATH is for a machine with a preinstalled browser that doesn't match the pinned
// Playwright, such as a Claude Code cloud container (/opt/pw-browsers/chromium).
const browser = await chromium.launch({
  headless: !headed,
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const context = await browser.newContext(PHONE_CONTEXT);
await fakeCloud(context);
const first = await context.newPage();
attach(browser, context, first);
listen(first);

try {
  for (const name of ORDER) {
    if (name === 'boot' || all || chosen.has(name)) await SECTIONS.get(name)?.run();
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

/** @param {string} why @returns {never} */
function fail(why) {
  console.error(`smoke: ${why}`);
  process.exit(2);
}
