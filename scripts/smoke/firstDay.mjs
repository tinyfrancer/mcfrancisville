/** Her first day (V1's R1), played through in a town of its own. */
import {
  PHONE,
  PHONE_CONTEXT,
  PLAIN_DAY,
  URL_BASE,
  answerCody,
  browser,
  check,
  closeSheets,
  listen,
  page,
  setPage,
  stepUntil,
  tapElement,
  tapProp,
} from './lib.mjs';

/**
 * Her first day played through in a town of its own (V1's R1), so the town every other section
 * shares is left as it was: the card after his hello, the day's chip and the tray glowing until
 * first tapped, each step done in turn (any order) with his line and its gift, and his keepsake in
 * her chest once the last is, the tray's button gone with it.
 */
async function firstDay() {
  const main = page;
  const town = await browser.newContext(PHONE_CONTEXT);
  setPage(await town.newPage());
  listen(page);
  try {
    await page.goto(`${URL_BASE}?loop=manual&skiptitle&day=${PLAIN_DAY}&hour=10`, {
      waitUntil: 'load',
      timeout: 60_000,
    });
    await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
    await page.waitForSelector('.hud-creator', { timeout: 10_000 });
    await page.locator('.hud-name').fill('Smoke');
    await tapElement('.hud-creator .hud-primary');
    await answerCody();
    const card = await page
      .waitForSelector('.hud-first-day', { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    check('a new town opens on his list for her first day', card);
    if (!card) return;
    await page.screenshot({ path: '.smoke/first-day.png' });
    await tapElement('.hud-first-day .hud-done');
    const glows = () =>
      page.evaluate(() => ({
        today: document.querySelector('.hud-today')?.hasAttribute('data-hint') ?? false,
        more: document.querySelector('.hud-more')?.hasAttribute('data-hint') ?? false,
      }));
    const lit = await glows();
    check(
      'the day chip and the tray glow on her first day',
      lit.today && lit.more,
      JSON.stringify(lit),
    );
    await page.screenshot({ path: '.smoke/first-day-hints.png' });
    // The tray, opened for real, has his list first in it, and stops glowing.
    await tapElement('.hud-first-day-button');
    check('the tray stops glowing once opened', !(await glows()).more);
    check(
      'his list opens again from the tray',
      (await page.locator('.hud-first-day').count()) === 1,
    );
    await tapElement('.hud-first-day .hud-done');
    await tapElement('.hud-today');
    check(
      'the day chip opens the calendar',
      (await page.locator('.hud-calendar-sheet').count()) === 1,
    );
    check('and stops glowing', !(await glows()).today);
    await closeSheets();
    // On its side, the list is two columns like any sheet.
    await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
    await page.evaluate(() => window.view.step(40));
    await page.evaluate(() =>
      /** @type {HTMLElement} */ (document.querySelector('.hud-first-day-button'))?.click(),
    );
    const side = await page.evaluate(() => {
      const sheet = document.querySelector('.hud-first-day');
      return !!sheet && sheet.scrollWidth <= sheet.clientWidth + 1;
    });
    check('his list fits a phone on its side', side);
    await page.screenshot({ path: '.smoke/first-day-side.png' });
    await closeSheets();
    await page.setViewportSize(PHONE);
    await page.evaluate(() => window.view.step(40));

    /** @param {string} step @param {string} label */
    const done = async (step, label) => {
      const kept = await stepUntil(
        `window.world.firstDay.done.includes(${JSON.stringify(step)})`,
        label,
        4000,
      );
      if (!kept) return;
      await page.evaluate(() => window.view.step(40, 2));
      const told = (await page.locator('.hud-toast').textContent()) ?? '';
      check(`${label}, and Cody says so`, told.includes('Cody: '), told.slice(0, 60));
    };
    // The candy tree, walked up to.
    await tapProp('candyTree');
    await stepUntil(() => !window.world.player.moving, 'she reaches the candy tree');
    await done('shake', 'shaking the candy tree is a step done');
    // A bed dug over and sown.
    await page.evaluate(() => {
      const first = window.world.map.beds[0];
      if (!first) throw new Error('the town has no garden beds');
      const bed = { zone: /** @type {const} */ ('town'), ...first };
      window.world.farm.till(bed);
      window.world.garden.plant(bed, 'pumpkinSeed');
    });
    await done('plant', 'planting a seed is a step done');
    // Pumpkins on the honesty stall, put out on its sheet.
    await page.evaluate(() => window.world.bag.add('pumpkin', 2));
    await tapProp('honestyStall');
    await stepUntil(() => !window.world.player.moving, 'she reaches the honesty stall');
    await page.evaluate(() => window.view.step(40));
    await tapElement('.hud-stall-sheet .hud-ware >> nth=-1 >> button');
    await tapElement('.hud-stall-sheet .hud-done');
    await done('stall', 'putting something on the stall is a step done');
    // A note on the board answered.
    await page.evaluate(() => {
      const n = window.world.noticeboard.notices()[0];
      if (n) window.world.bag.add(n.item, n.count);
    });
    await tapProp('noticeboard');
    await stepUntil(() => !window.world.player.moving, 'she reaches the noticeboard');
    await page.evaluate(() => window.view.step(40));
    await tapElement('.hud-notice >> nth=0 >> button');
    await tapElement('.hud-notice-sheet .hud-done');
    await done('notice', 'answering a note is a step done');
    // Three neighbours said hello to.
    await page.evaluate(() => {
      const them = window.world.neighbourhood.neighbours
        .map((n) => n.id)
        .filter((id) => id !== 'cody' && id !== 'robBoo')
        .slice(0, 3);
      for (const id of them) {
        window.world.talk.talk(id);
        window.world.talk.endTalk();
      }
    });
    await done('meet', 'meeting three neighbours is a step done');
    // Something from her bag eaten, by its card's Eat.
    await tapElement('.hud-bag-button');
    await tapElement('.hud-bag .hud-slot[aria-label^="Toasted ghost mallow"]');
    await tapElement('.hud-bag-sheet .hud-eat');
    await tapElement('.hud-bag-sheet button:text("Done")');
    await done('eat', 'eating something is a step done');
    const over = await page.evaluate(() => ({
      open: window.world.firstDay.open,
      keepsake: window.world.home.stored.some((s) => s.id === 'welcomeSampler'),
      button: /** @type {HTMLElement | null} */ (document.querySelector('.hud-first-day-button'))
        ?.hidden,
    }));
    check(
      'with every step done, his keepsake is in her chest and the list leaves the tray',
      !over.open && over.keepsake && over.button === true,
      JSON.stringify(over),
    );
    await page.screenshot({ path: '.smoke/first-day-done.png' });
    // Saved (v50): back the next time, her first day stays done, and his list doesn't come back.
    await page.evaluate(() => window.view.saveNow());
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
    await answerCody();
    await page.waitForTimeout(100);
    const kept = await page.evaluate(() => ({
      open: window.world.firstDay.open,
      done: window.world.firstDay.done.length,
      card: document.querySelector('.hud-first-day') !== null,
    }));
    check(
      'her first day stays done through a reload, with no list',
      !kept.open && kept.done === 6 && !kept.card,
      JSON.stringify(kept),
    );
  } finally {
    await town.close();
    setPage(main);
  }
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [['firstDay', firstDay]];
