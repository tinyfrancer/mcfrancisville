/**
 * The performance baseline (v0.1 plan, phase A): how long a frame's simulation and drawing take,
 * and how much memory the game holds, on the same iPhone-sized touch viewport smoke uses, with the
 * CPU slowed to stand in for a phone. Every later phase compares against the numbers this prints,
 * which are kept in `docs/architecture.md`.
 *
 * It runs under `?loop=manual`, so the simulation only moves when cranked, and times `world.update`
 * and `view.draw` separately around each cranked frame. She walks a fixed, seeded route about
 * town at night (the most lights and glows), then about her home.
 *
 * Usage: npm run dev, then `node scripts/perf.mjs [--throttle=4] [--frames=900]`.
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
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
/** @type {string[]} */
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(`${URL_BASE}?loop=manual&skiptitle&hour=21.5`, {
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
 * Walks her to seeded open tiles for `frames` frames, timing each frame's update and draw.
 * @param {number} frames @param {number} seed
 */
async function walkAbout(frames, seed) {
  return page.evaluate(
    ({ frames, seed, frameMs }) => {
      let s = seed;
      const random = () => (s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
      const world = window.world;
      const pick = () => {
        const { width, height } = world.size;
        for (let i = 0; i < 200; i++) {
          const tx = Math.floor(random() * width);
          const ty = Math.floor(random() * height);
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
    { frames, seed, frameMs: FRAME_MS },
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

const report = {
  throttle: THROTTLE,
  frames: FRAMES,
  town: { update: summary(town.update), draw: summary(town.draw), heapMb: townHeap, ...townGround },
  home: { update: summary(home.update), draw: summary(home.draw), heapMb: homeHeap, ...homeGround },
};
console.log(JSON.stringify(report, null, 2));
if (scene !== 'home') console.log(`note: she didn't get home (scene: ${scene})`);
if (errors.length > 0) console.log(`page errors:\n${errors.join('\n')}`);
await browser.close();
process.exit(errors.length > 0 ? 1 : 0);
