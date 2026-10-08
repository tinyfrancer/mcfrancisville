/**
 * The performance baseline (v0.1 plan, phase A): how long a frame's simulation and drawing take,
 * and how much memory the game holds, on the same iPhone-sized touch viewport smoke uses, with the
 * CPU slowed to stand in for a phone. Every later phase compares against the numbers this prints,
 * which are kept in `docs/architecture.md`.
 *
 * It runs under `?loop=manual`, so the simulation only moves when cranked, and times `world.update`
 * and `view.draw` separately around each cranked frame. She walks a fixed, seeded route about
 * town at night (the most lights and glows), then about her home, then about the fairground (its
 * string lights and stalls), and then 0.3's: Whisperwood's trees (the see-through crowns), Boo
 * Acres, her yard with every outdoor piece out, and her back room full of set pieces under a window
 * paper. A scene a build doesn't have is skipped, so the same script measures an older build.
 *
 * Usage: npm run dev, then `node scripts/perf.mjs [--throttle=4] [--frames=900] [--view=far]
 * [--hour=12] [--day=2026-10-26]`.
 */
import { chromium } from 'playwright';

const URL_BASE = process.env.SMOKE_URL ?? 'http://localhost:5173/';
const PHONE = { width: 390, height: 844 };
/** @param {string} name @param {number} fallback */
const arg = (name, fallback) =>
  Number(process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback);
const THROTTLE = arg('throttle', 4);
const FRAMES = arg('frames', 900);
/** The game time each cranked frame is handed: 60fps. */
const FRAME_MS = 16;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const context = await browser.newContext({
  viewport: PHONE,
  deviceScaleFactor: 3,
  hasTouch: true,
  isMobile: true,
});
// How close the camera is (decision 290): Close, the default, or `--view=far`.
const VIEW = process.argv.find((a) => a.startsWith('--view='))?.split('=')[1] ?? 'close';
await context.addInitScript((view) => localStorage.setItem('mcfrancisville:view', view), VIEW);
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
/** @type {string[]} */
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

// The hour and day it's measured at (V1's L3): 21:30, the night's lamps and glows, unless
// `--hour=12` (the day's clouds) or `--day=2026-10-26` (a full moon's rims) asks for another.
const HOUR = process.argv.find((a) => a.startsWith('--hour='))?.split('=')[1] ?? '21.5';
const DAY = process.argv.find((a) => a.startsWith('--day='))?.split('=')[1];
await page.goto(`${URL_BASE}?loop=manual&skiptitle&hour=${HOUR}${DAY ? `&day=${DAY}` : ''}`, {
  waitUntil: 'load',
  timeout: 60_000,
});
await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
// Through the creator, and past Cody's hello, so nothing is drawn over the canvas.
await page.locator('.hud-name').fill('Perf');
await page.locator('.hud-creator .hud-primary').click();
await page.locator('.hud-talk-sheet .hud-primary').click();
// Warm up: the first frames bake sprites and the ground, which a long session pays once.
await page.evaluate(() => window.view.step(16, 120));

await cdp.send('Performance.enable');
await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });

/**
 * Walks her to seeded open tiles for `frames` frames, timing each frame's update and draw, within
 * `box` if one is given.
 * @param {number} frames @param {number} seed
 * @param {{ tx: number, ty: number, w: number, h: number } | null} [box]
 */
async function walkAbout(frames, seed, box = null) {
  return page.evaluate(
    ({ frames, seed, frameMs, box }) => {
      let s = seed;
      const random = () => (s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
      const world = window.world;
      const pick = () => {
        const { width, height } = world.size;
        const area = box ?? { tx: 0, ty: 0, w: width, h: height };
        for (let i = 0; i < 200; i++) {
          const tx = area.tx + Math.floor(random() * area.w);
          const ty = area.ty + Math.floor(random() * area.h);
          if (world.canWalk(tx, ty)) return { tx, ty };
        }
        return null;
      };
      const update = [];
      const draw = [];
      for (let i = 0; i < frames; i++) {
        if (!world.player.moving) {
          const to = pick();
          if (to) world.tapTile(to.tx, to.ty);
        }
        const t0 = performance.now();
        world.update(frameMs);
        const t1 = performance.now();
        window.view.draw();
        draw.push(performance.now() - t1);
        update.push(t1 - t0);
      }
      return { update, draw };
    },
    { frames, seed, frameMs: FRAME_MS, box },
  );
}

/** @param {number[]} xs */
function summary(xs) {
  const sorted = [...xs].sort((a, b) => a - b);
  const at = (/** @type {number} */ q) =>
    sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
  const mean = xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  return { mean: +mean.toFixed(2), p50: +at(0.5).toFixed(2), p95: +at(0.95).toFixed(2) };
}

async function heapMb() {
  await cdp.send('HeapProfiler.collectGarbage');
  const { metrics } = await cdp.send('Performance.getMetrics');
  const used = metrics.find((m) => m.name === 'JSHeapUsedSize')?.value ?? 0;
  return +(used / 2 ** 20).toFixed(1);
}

/**
 * The ground's baked chunks across every view she has and their canvas memory, which lives
 * outside the JS heap; nothing, on a build from before the ground was chunked.
 */
async function groundMb() {
  const m = await page.evaluate(() => window.view.groundMemory?.() ?? null);
  return m ? { groundChunks: m.chunks, groundMb: +(m.bytes / 2 ** 20).toFixed(2) } : {};
}

const town = await walkAbout(FRAMES, 7);
const townHeap = await heapMb();
const townGround = await groundMb();
// In through her door (the tile in front of it), and about her room.
await page.evaluate(() => {
  const house = window.world.map.props.find((p) => p.id === 'homeHouse');
  if (house) window.world.tapTile(house.tx + 1, house.ty + 1);
  for (let i = 0; i < 3000 && window.world.scene !== 'home'; i++) window.view.step(16);
});
const scene = await page.evaluate(() => window.world.scene);
const home = await walkAbout(Math.round(FRAMES / 2), 11);
const homeHeap = await heapMb();
const homeGround = await groundMb();

// Out to the Hollow Fairground, its gate opened as meeting Boothoven would (0.2's M1).
const fair = await page.evaluate(() => {
  const world = window.world;
  if (!world.zones.outdoors.some((z) => z.id === 'fairground')) return false;
  world.friends.update('boothoven', { points: 100 });
  world.atlas.find('fairground');
  window.view.step(16);
  world.travel.go('fairground');
  for (let i = 0; i < 600 && world.scene !== 'fairground'; i++) window.view.step(16);
  document.querySelectorAll('.hud-backdrop').forEach((b) => /** @type {HTMLElement} */ (b).click());
  window.view.step(16, 120);
  return world.scene === 'fairground';
});
const fairground = fair ? await walkAbout(FRAMES, 13) : null;
const fairHeap = fair ? await heapMb() : 0;
const fairGround = fair ? await groundMb() : {};

/** Out to a place by the map, and anything it opens closed; false if this build hasn't it. */
async function goTo(/** @type {import('../src/types/ids').MapZoneId} */ place) {
  return page.evaluate((place) => {
    const world = window.world;
    if (!world.zones.outdoors.some((z) => z.id === place)) return false;
    if (world.scene === 'home') world.travel.go('town');
    world.atlas.find(place);
    window.view.step(16);
    world.travel.go(place);
    for (let i = 0; i < 600 && world.scene !== place; i++) window.view.step(16);
    document
      .querySelectorAll('.hud-backdrop')
      .forEach((b) => /** @type {HTMLElement} */ (b).click());
    window.view.step(16, 120);
    return world.scene === place;
  }, place);
}

/** The heaviest of a scene's frames for the see-through crowns: how many were faded at once. */
async function walkCounting(/** @type {number} */ frames, /** @type {number} */ seed) {
  const walk = await walkAbout(frames, seed);
  const faded = await page.evaluate(() => window.view.seeThroughCrowns?.().length ?? null);
  return { ...walk, faded };
}

/** @param {{ update: number[], draw: number[] }} walk @param {number} heap */
const measured = (walk, heap, extra = {}) => ({
  update: summary(walk.update),
  draw: summary(walk.draw),
  heapMb: heap,
  ...extra,
});

const woods = (await goTo('whisperwood')) ? await walkCounting(FRAMES, 17) : null;
const woodsHeap = woods ? await heapMb() : 0;
const acres = (await goTo('booAcres')) ? await walkAbout(FRAMES, 19) : null;
const acresHeap = acres ? await heapMb() : 0;

// Her yard with every outdoor piece out on the lawn (0.3's H5), walked round in and near it.
const yardBox = await page.evaluate(() => {
  const world = window.world;
  if (!world.yard?.lawn) return null;
  world.travel.go('town');
  for (let i = 0; i < 600 && world.scene !== 'town'; i++) window.view.step(16);
  /** @type {import('../src/types/ids').FurnitureId[]} */
  const pieces = [
    'gardenBench',
    'yardLantern',
    'toadstoolGnome',
    'flowerPots',
    'birdbath',
    'picnicTable',
    'pumpkinPile',
    'fairyLights',
    'picketFence',
    'yardScarecrow',
  ];
  const lawn = world.yard.lawn();
  pieces.forEach((id, i) => {
    world.home.store(id);
    const near = lawn[Math.floor((i * lawn.length) / pieces.length)] ?? lawn[0];
    if (near) world.yard.takeOut(id, near, null);
  });
  world.movement.standAt({ tx: 4, ty: 11 }, 'down');
  window.view.step(16, 120);
  return { tx: 0, ty: 0, w: 12, h: 16, out: world.yard.placed.length };
});
const yard = yardBox ? await walkAbout(Math.round(FRAMES / 2), 23, yardBox) : null;
const yardHeap = yard ? await heapMb() : 0;

// Her back room (0.3's H4), built, papered with windows (S4) and as full of set pieces as it'll
// take (S3, S4): the second room and a room of set pieces at once.
/** @type {import('../src/types/ids').FurnitureId[]} */
const SET_PIECES = [
  'cauldronStove',
  'batFridge',
  'cosyCounter',
  'cosySink',
  'kettleShelf',
  'copperKettle',
  'ghostCookieJar',
  'canopyBed',
  'wardrobe',
  'vanity',
  'nightstand',
  'tasselLamp',
  'heartRug',
  'dreamSampler',
  'tallBookcase',
  'readingChair',
  'brassGlobe',
  'libraryLadder',
  'libraryDesk',
  'bankersLamp',
  'townMap',
  'potionRack',
  'seeingStone',
  'hatStand',
  'broomHook',
  'spellLectern',
  'herbBundles',
  'moonPhaseRug',
  'clawTub',
  'washstand',
  'bathMirror',
  'towelRail',
  'rubberDuck',
  'bathMat',
  'pottingTable',
  'hangingPlants',
  'wateringCan',
  'wickerChair',
  'fernStand',
  'lemonTree',
  'bigAmp',
  'recordCrate',
  'microphone',
  'bassDrum',
  'guitarStand',
  'gigPoster',
  'coffinSofa',
  'loungeCandelabra',
  'suitOfArmour',
  'eyePortrait',
  'grandClock',
  'clawTable',
];
const backRoom = await page.evaluate((pieces) => {
  const world = window.world;
  if (typeof world.home.build !== 'function') return null;
  const house = world.map.props.find((p) => p.id === 'homeHouse');
  if (house) world.tapTile(house.tx + 1, house.ty + 1);
  for (let i = 0; i < 3000 && world.scene !== 'home'; i++) window.view.step(16);
  world.home.build('back');
  const way = world.home.room.doorways[0];
  if (!way) return null;
  world.tapTile(way.tx, way.ty);
  for (let i = 0; i < 3000 && world.home.here !== 'back'; i++) window.view.step(16);
  world.home.giveWallpaper('archWindow');
  world.home.paper('archWindow');
  let placed = 0;
  for (const id of pieces) {
    world.home.store(id);
    const { width, height } = world.home.room;
    const near = { tx: 1 + (placed % (width - 2)), ty: 2 + Math.floor(placed / (width - 2)) };
    if (world.home.takeOut(id, near, world.movement.tile)) placed++;
    if (placed > 0 && near.ty >= height - 1) break;
  }
  window.view.step(16, 120);
  return { placed, here: world.home.here };
}, SET_PIECES);
const back = backRoom?.here === 'back' ? await walkAbout(Math.round(FRAMES / 2), 29) : null;
const backHeap = back ? await heapMb() : 0;

const report = {
  throttle: THROTTLE,
  frames: FRAMES,
  town: { update: summary(town.update), draw: summary(town.draw), heapMb: townHeap, ...townGround },
  home: { update: summary(home.update), draw: summary(home.draw), heapMb: homeHeap, ...homeGround },
  ...(fairground && {
    fairground: {
      update: summary(fairground.update),
      draw: summary(fairground.draw),
      heapMb: fairHeap,
      ...fairGround,
    },
  }),
  ...(woods && { whisperwood: measured(woods, woodsHeap, { fadedAtEnd: woods.faded }) }),
  ...(acres && { booAcres: measured(acres, acresHeap) }),
  ...(yard && { yard: measured(yard, yardHeap, { piecesOut: yardBox?.out }) }),
  ...(back && { backRoom: measured(back, backHeap, { setPieces: backRoom?.placed }) }),
};
console.log(JSON.stringify(report, null, 2));
if (scene !== 'home') console.log(`note: she didn't get home (scene: ${scene})`);
if (errors.length > 0) console.log(`page errors:\n${errors.join('\n')}`);
await browser.close();
process.exit(errors.length > 0 ? 1 : 0);
