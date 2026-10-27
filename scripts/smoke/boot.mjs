/** Booting: the canvas and its bars, the title, his dedication and the creator (always run first), the installed app, the save surviving a reload, and the mayor's notes. */
import {
  URL_BASE,
  answerCody,
  check,
  framed,
  page,
  playerTile,
  reloadGame,
  tapElement,
  titleAgain,
  walkTo,
} from './lib.mjs';

async function boot() {
  // A cold Vite cache compiles on the first request, so this wait is generous on purpose.
  await page.goto(`${URL_BASE}?loop=manual`, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
  const canvas = await page.evaluate(() => {
    const el = /** @type {HTMLCanvasElement} */ (document.getElementById('game'));
    const ctx = el.getContext('2d');
    const px = ctx?.getImageData(el.width >> 1, el.height >> 1, 1, 1).data;
    const box = el.getBoundingClientRect();
    const room = document.querySelector('.hud-view')?.getBoundingClientRect();
    const top = document.querySelector('.hud-top')?.getBoundingClientRect();
    const bottom = document.querySelector('.hud-bottom')?.getBoundingClientRect();
    return {
      width: el.width,
      height: el.height,
      box: { left: box.left, top: box.top, right: box.right, bottom: box.bottom },
      room: room && { left: room.left, top: room.top, right: room.right, bottom: room.bottom },
      bars: !!top && !!bottom && top.top <= 0 && bottom.bottom >= innerHeight - 1,
      painted: px ? px[3] === 255 : false,
    };
  });
  check('the canvas has a backing size', canvas.width > 0 && canvas.height > 0);
  // The frame (0.2's U1): the world fills the room between the bars, and starts under the top one.
  const room = canvas.room;
  check(
    'the bars run along the top and bottom, and the world fills the room between them',
    canvas.bars &&
      !!room &&
      Math.abs(canvas.box.left - room.left) < 1 &&
      Math.abs(canvas.box.top - room.top) < 1 &&
      canvas.box.right >= room.right - 0.5 &&
      canvas.box.bottom >= room.bottom - 0.5 &&
      canvas.box.bottom - room.bottom < 1,
    JSON.stringify({ box: canvas.box, room }),
  );
  check('the canvas has been drawn on', canvas.painted);
  await page.screenshot({ path: '.smoke/boot.png' });
  await title();
  await creator();
}

/** The title screen, then his dedication to her the first time (phase V). */
async function title() {
  const shown = await page
    .waitForSelector('.hud-title', { timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
  check('the game opens on its title screen', shown);
  if (!shown) return;
  await page.screenshot({ path: '.smoke/title.png' });
  await tapElement('.hud-title-begin');
  const line = (await page.locator('.hud-dedication-line').textContent()) ?? '';
  check(
    'his dedication to her follows the title the first time',
    line === 'To my beautiful perfect angel baby wife, who is my whole world.',
    line,
  );
  await page.screenshot({ path: '.smoke/dedication.png' });
  await tapElement('.hud-dedication-reply');
}

/** A fresh browser has no save, so the game opens on the creator, which has to be got through. */
async function creator() {
  const opened = await page
    .waitForSelector('.hud-creator', { timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
  check('a new game opens the character creator', opened);
  if (!opened) return;
  await framed('.hud-creator', { tabs: ['You', 'Hair', 'Face', 'Tattoos'] });
  const finish = page.locator('.hud-creator .hud-primary');
  check("the creator won't finish without a name", await finish.isDisabled());
  const doll = await page.evaluate(() => {
    const canvas = /** @type {HTMLCanvasElement} */ (
      document.querySelector('.hud-creator .hud-doll')
    );
    const style = getComputedStyle(canvas);
    return { width: parseFloat(style.width), height: parseFloat(style.height) };
  });
  const scale = doll.width / 32;
  check(
    'the preview is her at a whole-number scale',
    Number.isInteger(scale) && scale > 1 && doll.height === 48 * scale,
    JSON.stringify(doll),
  );
  await page.screenshot({ path: '.smoke/creator.png' });
  await tapElement('.hud-creator .hud-sheet-tab:text-is("Hair")');
  await tapElement('.hud-creator .hud-chip:text-is("Bunches")');
  await tapElement('.hud-creator .hud-sheet-tab:text-is("You")');
  await page.locator('.hud-name').fill('Smoke');
  await tapElement('.hud-creator .hud-primary');
  const look = await page.evaluate(() => ({
    created: window.world.wardrobe.created,
    ...window.world.wardrobe.look,
  }));
  check(
    'finishing the creator dresses her in what was picked',
    look.created && look.name === 'Smoke' && look.hairStyle === 'bunches',
    `${look.name} ${look.hairStyle}`,
  );
  check('the creator closes', (await page.locator('.hud-creator').count()) === 0);
  await framed('.hud-talk-sheet', { picture: true });
  const hello = (await page.locator('.hud-talk-sheet .hud-speech').textContent()) ?? '';
  check('Cody says hello to his new neighbour', /I'm Cody/.test(hello), hello.slice(0, 40));
  const gift = (await page.locator('.hud-talk-sheet .hud-gift').textContent()) ?? '';
  check("her first visit's gift is on his greeting", /welcome gift/.test(gift), gift);
  await page.screenshot({ path: '.smoke/hello.png' });
  await answerCody();
  await firstDayCard();
}

/** A new town's hello is followed by Cody's list for her first day (V1's R1), closed with Got it. */
async function firstDayCard() {
  const shown = await page
    .waitForSelector('.hud-first-day', { timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  check("Cody's list for her first day follows his hello", shown);
  if (!shown) return;
  await framed('.hud-first-day', { picture: true });
  const steps = await page.locator('.hud-first-day-step').count();
  const done = await page.locator('.hud-first-day-step[data-done]').count();
  check('it lists six things to try, none done yet', steps === 6 && done === 0, `${done}/${steps}`);
  await tapElement('.hud-first-day .hud-done');
  check('Got it closes it', (await page.locator('.hud-first-day').count()) === 0);
}

async function pwa() {
  const manifest = await page.evaluate(async () => {
    const href = document.querySelector('link[rel="manifest"]')?.getAttribute('href');
    if (!href) return null;
    const response = await fetch(href);
    return response.ok ? await response.json() : null;
  });
  check('the manifest is served', manifest !== null);
  check('the manifest installs standalone', manifest?.display === 'standalone');
  const iconsOk = await page.evaluate(async () => {
    const href = document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href');
    return href ? (await fetch(href)).ok : false;
  });
  check('the apple-touch-icon is served', iconsOk);
}

/**
 * The mayor's notes (decision 142): kept from a new town, shown once to a phone from an older
 * version between the title and Cody's hello, and there to read again in Settings.
 */
async function notes() {
  const kept = await page.evaluate(() => localStorage.getItem('mcfrancisville:notesSeen'));
  check('a new town remembers its version without showing the notes', kept !== null, `${kept}`);
  // A phone that last played an older version.
  await page.evaluate(() => localStorage.removeItem('mcfrancisville:notesSeen'));
  await page.reload({ waitUntil: 'load', timeout: 60_000 });
  await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
  await titleAgain();
  const shown = await page
    .waitForSelector('.hud-notes-sheet', { timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  check("the mayor's notes follow the title on a new version", shown);
  if (!shown) return;
  await framed('.hud-notes-sheet');
  const card = await page.evaluate(() => {
    const sheet = /** @type {HTMLElement} */ (document.querySelector('.hud-notes-sheet'));
    const box = sheet.getBoundingClientRect();
    return {
      lines: sheet.querySelectorAll('.hud-notes-lines li').length,
      dear: sheet.querySelector('.hud-notes p')?.textContent ?? '',
      inside: box.left >= 0 && box.right <= window.innerWidth && box.bottom <= window.innerHeight,
    };
  });
  check(
    'they are three to five lines, to her by name, and fit the phone',
    card.lines >= 3 && card.lines <= 5 && card.dear === 'Dear Smoke,' && card.inside,
    JSON.stringify(card),
  );
  await page.waitForTimeout(1_600);
  await page.screenshot({ path: '.smoke/notes.png' });
  // 1.7's card ends with Cody's own line (decision 388): scrolled to, it reads whole.
  const handed = await page.evaluate(() => {
    const line = document.querySelector('.hud-notes-sheet .hud-notes-handed');
    if (!line) return null;
    line.scrollIntoView({ block: 'end' });
    const box = line.getBoundingClientRect();
    return {
      text: line.textContent ?? '',
      inside: box.left >= 0 && box.right <= window.innerWidth && box.bottom <= window.innerHeight,
      unclipped: line.scrollWidth <= line.clientWidth,
    };
  });
  if (handed) {
    check(
      "Cody's line reads whole at the foot of the card, signed by him",
      handed.inside && handed.unclipped && /smile everyday\.\u201d\u2014 Cody$/.test(handed.text),
      JSON.stringify(handed),
    );
    await page.waitForTimeout(300);
    await page.screenshot({ path: '.smoke/notes-handed.png' });
  }
  await tapElement('.hud-notes-sheet .hud-done');
  const greeted = (await page.locator('.hud-talk-sheet').count()) > 0;
  check("Cody's hello follows the notes", greeted);
  await answerCody();
  const seen = await page.evaluate(() => localStorage.getItem('mcfrancisville:notesSeen'));
  check('the notes are remembered once read', seen === kept, `${seen}`);

  await page.reload({ waitUntil: 'load', timeout: 60_000 });
  await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
  await titleAgain();
  check('they show only once', (await page.locator('.hud-notes-sheet').count()) === 0);
  await answerCody();

  await tapElement('.hud-settings');
  await tapElement('.hud-settings-sheet .hud-sheet-tab:text-is("News")');
  await tapElement('.hud-read-notes');
  check(
    'Settings opens them again',
    (await page.locator('.hud-notes-sheet .hud-notes-lines li').count()) === card.lines,
  );
  await tapElement('.hud-notes-sheet .hud-done');
}

async function save() {
  // Somewhere open near the bottom of town, where the camera section left her.
  await walkTo({ tx: 31, ty: 48 });
  const left = await playerTile();
  const spawn = await page.evaluate(() => window.world.map.spawn);
  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const after = await playerTile();
  check(
    'she is where she was left after a reload',
    after.tx === left.tx && after.ty === left.ty && !(left.tx === spawn.tx && left.ty === spawn.ty),
    `${JSON.stringify(left)} -> ${JSON.stringify(after)}`,
  );
  const look = await page.evaluate(() => window.world.wardrobe.look);
  check(
    'she looks as she did, and the creator stays away',
    look.name === 'Smoke' &&
      look.hairStyle === 'bunches' &&
      (await page.locator('.hud-creator').count()) === 0,
    `${look.name} ${look.hairStyle}`,
  );
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [
  ['boot', boot],
  ['pwa', pwa],
  ['save', save],
  ['notes', notes],
];
