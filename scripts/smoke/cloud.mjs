/** Keeping her town safe: Settings' backup line and notes, and the cloud save against a faked function. */
import {
  PHONE,
  PHONE_CONTEXT,
  PLAIN_DAY,
  URL_BASE,
  answerCody,
  browser,
  check,
  closeSheets,
  cloudStore,
  context,
  fakeCloud,
  listen,
  page,
  playerTile,
  setPage,
  tapElement,
} from './lib.mjs';

/**
 * Keeping her town safe (V1's S3): Settings says when this phone last backed up, and again once a
 * code is copied; something gone wrong is noted and mentioned on the Sound tab with a note to copy.
 */
async function safe() {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate(() => {
    localStorage.removeItem('mcfrancisville:backedUpAt');
    window.dispatchEvent(
      new ErrorEvent('error', { message: 'smoke', error: new Error('a pretend wobble') }),
    );
  });
  await tapElement('.hud-settings');
  await tapElement('.hud-settings-sheet .hud-sheet-tab:text-is("Sound")');
  const trouble =
    (await page
      .locator('.hud-trouble')
      .textContent()
      .catch(() => '')) ?? '';
  check(
    'a wobble is mentioned on the Sound tab, by its day',
    /wobbly on \d+ \w+/.test(trouble),
    trouble,
  );
  await tapElement('.hud-trouble-copy');
  const note = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
  check('its note copies, for Cody', /a pretend wobble/.test(note), note.slice(0, 80));
  await tapElement('.hud-settings-sheet .hud-sheet-tab:text-is("Backup")');
  await page.waitForFunction(() =>
    /** @type {HTMLTextAreaElement | null} */ (
      document.querySelector('.hud-code')
    )?.value.startsWith('MFV'),
  );
  const before = (await page.locator('.hud-backed-up').textContent()) ?? '';
  await tapElement('.hud-settings-sheet button:text-is("Copy")');
  await page
    .waitForFunction(() =>
      /today/.test(document.querySelector('.hud-backed-up')?.textContent ?? ''),
    )
    .catch(() => {});
  const after = (await page.locator('.hud-backed-up').textContent()) ?? '';
  check(
    'the Backup tab says when this phone last backed up, and today once a code is copied',
    /yet/.test(before) && after === 'Last backed up today.',
    `${before} -> ${after}`,
  );
  await page.evaluate(() => localStorage.removeItem('mcfrancisville:errors'));
  await tapElement('.hud-sheet button:text("Done")');
}

/**
 * The cloud save (V1's S2) against a faked function: this phone's town goes up as she plays, the
 * Backup tab shows its cloud code and QR, and a second phone with a town of its own brings hers
 * back by the code, taking the code as its own. And before the store is set up, it says so.
 */
async function cloudSave() {
  await closeSheets();
  const here = await playerTile();
  await page.evaluate(() => {
    localStorage.removeItem('mcfrancisville:backedUpAt');
    window.view.saveNow();
  });
  // Back in front, what's waiting goes up at once rather than a few seconds on.
  const sent = page.waitForRequest((r) => r.url().includes('/api/save?') && r.method() === 'PUT', {
    timeout: 15_000,
  });
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  const put = await sent.then(() => true).catch(() => false);
  check('her town goes up to the cloud after a write', put);
  await page
    .waitForFunction(() => localStorage.getItem('mcfrancisville:backedUpAt') !== null)
    .catch(() => {});
  const stored = [...cloudStore.values()][0];
  check(
    'what the cloud keeps is sealed: no town to read in it',
    // Whole keys and a backup code's whole prefix: "MFV" alone turns up in the sealed base64url by
    // chance (V1.1's review, as X2 found for the unit test), and a quote never does.
    !!stored && !/"player"|"wardrobe"|MFV[01]-/.test(stored.data),
    stored ? stored.data.slice(0, 24) : 'nothing kept',
  );
  await tapElement('.hud-settings');
  await tapElement('.hud-settings-sheet .hud-sheet-tab:text-is("Backup")');
  await page
    .waitForFunction(() =>
      /goes up to the cloud/.test(document.querySelector('.hud-cloud-line')?.textContent ?? ''),
    )
    .catch(() => {});
  const shown = await page.evaluate(() => {
    const qr = document.querySelector('.hud-cloud-qr .hud-qr')?.getBoundingClientRect();
    return {
      line: document.querySelector('.hud-cloud-line')?.textContent ?? '',
      code: document.querySelector('.hud-cloud-code')?.textContent ?? '',
      kept: localStorage.getItem('mcfrancisville:cloudKey'),
      qr: qr ? { width: qr.width, left: qr.left, right: qr.right } : null,
      backed: document.querySelector('.hud-backed-up')?.textContent ?? '',
    };
  });
  check(
    'the Backup tab says the town goes up to the cloud',
    /Last kept at/.test(shown.line),
    shown.line,
  );
  check(
    'and shows the cloud code in fours, the phone’s own key',
    /^([0-9A-Z]{4}-){6}[0-9A-Z]{4}$/.test(shown.code) &&
      shown.code.replace(/-/g, '') === shown.kept,
    shown.code,
  );
  check(
    'and as a QR, whole on screen',
    !!shown.qr && shown.qr.width >= 150 && shown.qr.left >= 0 && shown.qr.right <= PHONE.width,
    JSON.stringify(shown.qr),
  );
  check('a cloud upload counts as backing up', /today/.test(shown.backed), shown.backed);
  await page.locator('.hud-cloud-qr').scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.smoke/cloud.png' });
  await tapElement('.hud-sheet button:text("Done")');

  // A second phone, with a town of its own somewhere else.
  const main = page;
  const other = await browser.newContext(PHONE_CONTEXT);
  await fakeCloud(other);
  setPage(await other.newPage());
  listen(page);
  try {
    // Its town is hers from a minute before, two tiles off, put there from a page of the site
    // that isn't the game, so nothing saves over it.
    const theirs = await main.evaluate(() => localStorage.getItem('mcfrancisville:save'));
    await page.goto(`${URL_BASE}manifest.webmanifest`);
    await page.evaluate((s) => {
      const save = JSON.parse(s ?? '{}');
      save.player.tx -= 2;
      save.updatedAt -= 60_000;
      localStorage.setItem('mcfrancisville:save', JSON.stringify(save));
    }, theirs);
    await page.goto(`${URL_BASE}?loop=manual&skiptitle&day=${PLAIN_DAY}&hour=10`, {
      waitUntil: 'load',
      timeout: 60_000,
    });
    await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
    await answerCody();
    await closeSheets();
    const before = await playerTile();
    const ownKey = await page.evaluate(() => localStorage.getItem('mcfrancisville:cloudKey'));
    await tapElement('.hud-settings');
    await tapElement('.hud-settings-sheet .hud-sheet-tab:text-is("Backup")');
    await page.locator('.hud-cloud-field').fill(shown.code.toLowerCase().replace(/-/g, ' '));
    page.once('dialog', (dialog) => void dialog.accept());
    const reloaded = page.waitForEvent('load', { timeout: 60_000 });
    await tapElement('.hud-cloud-restore');
    await reloaded;
    await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
    await answerCody();
    const after = await playerTile();
    check(
      'a new phone brings her town back by its cloud code',
      after.tx === here.tx && after.ty === here.ty && before.tx !== here.tx,
      `${JSON.stringify(before)} -> ${JSON.stringify(after)}, hers ${JSON.stringify(here)}`,
    );
    const keys = await page.evaluate(() => ({
      now: localStorage.getItem('mcfrancisville:cloudKey'),
      aside: Object.keys(localStorage)
        .filter((k) => k.startsWith('mcfrancisville:cloudKey:previous:'))
        .map((k) => localStorage.getItem(k)),
    }));
    check(
      'and takes the code as its own, its old key put aside',
      keys.now === shown.kept && keys.aside.includes(ownKey),
      JSON.stringify(keys),
    );
    check(
      'and nothing newer is offered over the town it just brought back',
      (await page.locator('.hud-cloud-offer').count()) === 0,
    );
    await page.screenshot({ path: '.smoke/cloud-restored.png' });

    // This phone is put away; the first plays on, and its town goes up newer. Opened again, this
    // one is asked, never swapped: it keeps its own here.
    await page.goto(`${URL_BASE}manifest.webmanifest`);
    await main.evaluate(() => window.view.saveNow());
    const newer = main.waitForRequest(
      (r) => r.url().includes('/api/save?') && r.method() === 'PUT',
      { timeout: 15_000 },
    );
    await main.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await newer.then((r) => r.response()).catch(() => {});
    await page.goto(`${URL_BASE}?loop=manual&skiptitle&day=${PLAIN_DAY}&hour=10`, {
      waitUntil: 'load',
      timeout: 60_000,
    });
    await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
    const offered = await page
      .waitForSelector('.hud-cloud-offer', { timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    check('opened behind the cloud, it asks before taking the newer town', offered);
    await page.screenshot({ path: '.smoke/cloud-offer.png' });
    if (offered) {
      await tapElement('.hud-cloud-keep');
      check(
        "keeping this phone's town closes the card",
        (await page.locator('.hud-cloud-offer').count()) === 0,
      );
    }
  } finally {
    await other.close();
    setPage(main);
  }

  // A phone whose cloud isn't set up yet: said so, kindly. Its 503 is a console line by design,
  // so this page isn't listened to.
  const bare = await browser.newContext(PHONE_CONTEXT);
  await fakeCloud(bare, { setUp: false });
  setPage(await bare.newPage());
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
    // A new town's hello is followed by Cody's list for her first day (V1's R1).
    const list = await page
      .waitForSelector('.hud-first-day', { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (list) await tapElement('.hud-first-day .hud-done');
    await closeSheets();
    await tapElement('.hud-settings');
    await tapElement('.hud-settings-sheet .hud-sheet-tab:text-is("Backup")');
    await page
      .waitForFunction(() =>
        /set up yet/.test(document.querySelector('.hud-cloud-line')?.textContent ?? ''),
      )
      .catch(() => {});
    const line = (await page.locator('.hud-cloud-line').textContent()) ?? '';
    check("before the store is set up, the cloud says it isn't yet", /set up yet/.test(line), line);
  } finally {
    await bare.close();
    setPage(main);
  }
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [
  ['safe', safe],
  ['cloud', cloudSave],
];
