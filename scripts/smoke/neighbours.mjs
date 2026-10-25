/** Her neighbours: talking and giving, the neighbours sheet, the mayor's mystery and Wes, faces and lives, everyone in town, Scarah, jobs, Rob Boo and Cody. */
import {
  PHONE,
  PLAIN_DAY,
  URL_BASE,
  answerCody,
  check,
  clearMat,
  closeSheets,
  framed,
  goInto,
  goOut,
  openOn,
  page,
  playerTile,
  propTile,
  reloadGame,
  stepUntil,
  tapAlong,
  tapElement,
  tapFixture,
  tapProp,
  tapTile,
  tapToastAway,
  walkTo,
} from './lib.mjs';

async function neighbours() {
  const welcome = await page.evaluate(() => {
    const sheet = document.querySelector('.hud-talk-sheet');
    return sheet ? null : 'none';
  });
  check('no welcome is left open', welcome === 'none');

  // Walk up to whoever is out in town at this hour (phase S has some in, or beyond it), which
  // may be off screen.
  const { id: friend, tile } = await page.evaluate(() => {
    // Not Maude, whose letter is next.
    const n = window.world.neighbourhood.neighboursIn('town').find((n) => n.id !== 'maude');
    if (!n) throw new Error('nobody is out in town');
    return { id: n.id, tile: n.tile };
  });
  await page.evaluate((t) => window.world.tapTile(t.tx, t.ty), tile);
  const talking = await stepUntil(
    () => document.querySelector('.hud-talk-sheet') !== null,
    `walking up to ${friend} opens a talk`,
  );
  if (!talking) return;
  await framed('.hud-talk-sheet', { picture: true });
  // Drawn hearts (V1's L5), ten of them, filled then empty.
  const hearts = await page.locator('.hud-talk-sheet .hud-hearts .hud-heart').count();
  check('the talk shows how close they are, out of ten', hearts === 10, String(hearts));
  const buttons = await page.evaluate(() =>
    [...document.querySelectorAll('.hud-talk-sheet .hud-sheet-foot button')].map((b) =>
      b.getBoundingClientRect(),
    ),
  );
  check(
    'every answer is a full thumb and on screen',
    buttons.length >= 3 && buttons.every((b) => b.height >= 44 && b.right <= 390),
    `${buttons.length} buttons`,
  );
  await page.screenshot({ path: '.smoke/talk.png' });
  // On its side too (V1's P1: the talk is longer now), every answer still on screen.
  await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
  await page.waitForTimeout(300);
  const sideways = await page.evaluate(() =>
    [...document.querySelectorAll('.hud-talk-sheet .hud-sheet-foot button')].every((b) => {
      const r = b.getBoundingClientRect();
      return r.height >= 44 && r.right <= window.innerWidth && r.bottom <= window.innerHeight;
    }),
  );
  check('on its side, every answer in the talk is on screen', sideways);
  await page.screenshot({ path: '.smoke/talk-sideways.png' });
  await page.setViewportSize(PHONE);
  await page.waitForTimeout(300);
  await tapElement('.hud-talk-sheet button:text-is("Give a gift")');
  await tapElement('.hud-talk-sheet .hud-slot >> nth=0');
  const points = await page.evaluate((id) => window.world.friends.of(id).points, friend);
  check(`a gift and a talk bring ${friend} closer`, points >= 20, String(points));
  // V1's P1: they remember what she gave them, to bring it up in the days after.
  const gave = await page.evaluate((id) => window.world.friends.of(id).gave ?? null, friend);
  check(`${friend} remembers what she gave them`, gave !== null, String(gave));
  await tapElement('.hud-talk-sheet button:text-is("Bye")');
  check(
    'saying bye lets them go on their way',
    (await page.evaluate(() => window.world.neighbourhood.talkingTo)) === null,
  );

  // A letter: as if Maude were nearly three hearts along, then a hello.
  await page.evaluate(() => {
    window.world.friends.update('maude', { points: 295 });
    window.world.neighbourhood.talk('maude');
    window.world.neighbourhood.endTalk();
  });
  await page.evaluate(() => window.view.step(40));
  const mailbox = await propTile('mailbox');
  // Near it first, but not onto a neighbour: at 5am Cody stands by her house, and a tap on him
  // is a talk.
  const near = await page.evaluate(
    (m) =>
      [
        { tx: m.tx + 1, ty: m.ty + 1 },
        { tx: m.tx, ty: m.ty + 1 },
        { tx: m.tx + 2, ty: m.ty + 1 },
      ].find((t) => !window.world.neighbourhood.villagerAt(t.tx, t.ty)),
    mailbox,
  );
  if (near) await walkTo(near);
  await tapProp('mailbox');
  await stepUntil(
    () => document.querySelector('.hud-mail-sheet') !== null,
    'walking up to the mailbox opens it',
  );
  await page.screenshot({ path: '.smoke/mailbox.png' });
  await framed('.hud-mail-sheet');
  await tapElement('.hud-mail-sheet .hud-seed >> nth=0');
  const enclosed = (await page.locator('.hud-mail-sheet .hud-message').textContent()) ?? '';
  check(
    "Maude's letter teaches her a recipe",
    (await page.evaluate(() => window.world.workbench.knows('moonflowerLamp'))) &&
      /Recipe/.test(enclosed),
    enclosed,
  );
  await page.screenshot({ path: '.smoke/letter.png' });
  await tapElement('.hud-mail-sheet button:text-is("Done")');

  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const kept = await page.evaluate(() => ({
    points: window.world.friends.of('maude').points,
    // October's story chapters come as the days do, so they're left out of the count, and so
    // are Cody's letters, all in her mailbox from her first day (V1's P5).
    mail: window.world.mailbox
      .view()
      .filter((l) => !l.id.startsWith('story:') && !l.id.startsWith('cody:')).length,
  }));
  check(
    'friendships and letters are still there after a reload',
    // Agatha's broom letter is among them, posted on her first day (decision 211).
    kept.points >= 305 && kept.mail === 3,
    JSON.stringify(kept),
  );
  const remembered = await page.evaluate((id) => window.world.friends.of(id).gave ?? null, friend);
  check(
    'what she gave is still remembered after a reload',
    remembered === gave,
    String(remembered),
  );

  // V1's P2, her voice: as if a neighbour here were three hearts along, their first story told,
  // after their hello they ask her their question, and she answers it on a chip.
  const asker = await page.evaluate(() => {
    const n = window.world.neighbourhood.neighboursIn(window.world.scene)[0];
    if (!n) return null;
    window.world.friends.update(n.id, { points: 350, moments: [2], answered: undefined });
    window.world.neighbourhood.talk(n.id);
    window.world.neighbourhood.endTalk();
    return { id: n.id, tile: n.tile };
  });
  if (!asker) check('someone is here to ask her something', false);
  else {
    await page.evaluate((t) => window.world.tapTile(t.tx, t.ty), asker.tile);
    const asked = await stepUntil(
      () => document.querySelector('.hud-talk-sheet .hud-reply') !== null,
      `${asker.id} asks her something, with answers on chips`,
    );
    if (asked) {
      const chips = await page.evaluate(() =>
        [...document.querySelectorAll('.hud-talk-sheet .hud-sheet-foot button')].map((b) => {
          const r = b.getBoundingClientRect();
          return { reply: b.classList.contains('hud-reply'), h: r.height, right: r.right };
        }),
      );
      check(
        'her answers are chips, each a full thumb and on screen, with Bye beside them',
        chips.filter((c) => c.reply).length >= 2 && chips.every((c) => c.h >= 44 && c.right <= 390),
        JSON.stringify(chips),
      );
      await page.screenshot({ path: '.smoke/talk-reply.png' });
      await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
      await page.waitForTimeout(300);
      const sideways = await page.evaluate(() =>
        [...document.querySelectorAll('.hud-talk-sheet .hud-sheet-foot button')].every((b) => {
          const r = b.getBoundingClientRect();
          return r.height >= 44 && r.right <= window.innerWidth && r.bottom <= window.innerHeight;
        }),
      );
      check('on its side, every chip is on screen', sideways);
      await page.screenshot({ path: '.smoke/talk-reply-sideways.png' });
      await page.setViewportSize(PHONE);
      await page.waitForTimeout(300);
      await tapElement('.hud-talk-sheet .hud-reply >> nth=0');
      const answered = await page.evaluate(
        (id) => window.world.friends.of(id).answered ?? null,
        asker.id,
      );
      check(`${asker.id} keeps her answer`, answered !== null, String(answered));
      check(
        'the chips go once she has answered',
        (await page.locator('.hud-talk-sheet .hud-reply').count()) === 0,
      );
      await tapElement('.hud-talk-sheet button:text-is("Bye")');
    }
  }

  const cart = await page.evaluate(() => window.world.stalls.moonPieCart());
  if (!cart) {
    console.log('note  the Moon Pie Man is not in town today, so his visit is skipped');
    return;
  }
  await page.evaluate((c) => window.world.tapTile(c.tx, c.ty + 1), cart);
  await stepUntil(() => !window.world.player.moving, 'she reaches the Moon Pie Man');
  await page.evaluate(() => window.view.step(40));
  await page.screenshot({ path: '.smoke/moonpie.png' });
  check(
    'walking up to the Moon Pie Man opens his cart',
    (await page.locator('.hud-shop-sheet h2:has-text("Moon Pie Man")').count()) === 1,
  );
  await tapElement('.hud-shop-sheet .hud-primary');
}

/**
 * The neighbours sheet from the top bar (0.2's U3): its 👥 clear of the day and Settings,
 * everyone in it (all of them living here from the first day, decision 211), a page each, and Find walking her up to
 * one who is here and only saying where one is who isn't.
 */
async function relations() {
  await closeSheets();
  const bar = await page.evaluate(() => {
    const box = (/** @type {string} */ s) => {
      const r = document.querySelector(s)?.getBoundingClientRect();
      return r ? { left: r.left, right: r.right, top: r.top, bottom: r.bottom } : null;
    };
    return {
      button: box('.hud-neighbours'),
      day: box('.hud-today'),
      settings: box('.hud-settings'),
      width: innerWidth,
    };
  });
  const { button, day, settings: gear } = bar;
  check(
    'the 👥 is in the top bar, a thumb wide, clear of the day and Settings',
    !!button &&
      !!day &&
      !!gear &&
      button.right - button.left >= 44 &&
      button.left >= day.right + 4 &&
      button.right <= gear.left - 4 &&
      gear.right <= bar.width,
    JSON.stringify(bar),
  );
  await tapElement('.hud-neighbours');
  if (!(await page.locator('.hud-neighbours-sheet').isVisible())) {
    check('the 👥 opens the neighbours sheet', false);
    return;
  }
  await framed('.hud-neighbours-sheet');
  const listed = await page.evaluate(() => {
    // The mayor is a shape of his own until she has met him (V1's P3b), below.
    const rows = [
      ...document.querySelectorAll('.hud-neighbours-sheet .hud-neighbour:not(.hud-unmet)'),
    ];
    return rows.map((r) => ({
      id: /** @type {HTMLElement} */ (r).dataset.villager,
      text: r.textContent ?? '',
    }));
  });
  const everyone = await page.evaluate(() =>
    window.world.neighbourhood.neighbours.map((n) => n.id),
  );
  check(
    'all twelve neighbours live here, and every one is on it by name',
    everyone.length === 12 &&
      listed.length === everyone.length &&
      everyone.every((id) => listed.some((r) => r.id === id)) &&
      listed.every((r) => !r.text.includes('Someone new')),
    JSON.stringify(listed.map((r) => r.id)),
  );
  const mayor = await page.evaluate(
    () => document.querySelector('.hud-neighbours-sheet .hud-unmet')?.textContent ?? '',
  );
  check(
    "the mayor is only a shape on it till she's met him",
    mayor.includes('The mayor') && !mayor.includes('Rob Boo'),
    mayor,
  );
  await page.screenshot({ path: '.smoke/neighbours.png' });

  // Someone out in town, where she is: their page, and Find walks her up to them for a talk.
  const friend = await page.evaluate(
    () => window.world.neighbourhood.neighboursIn(window.world.scene)[0]?.id ?? null,
  );
  if (!friend) {
    check('somebody is out where she is', false);
    return;
  }
  await tapElement(`.hud-neighbours-sheet .hud-neighbour[data-villager="${friend}"]`);
  await framed('.hud-neighbour-sheet', { picture: true, tabs: ['About', 'Gifts'] });
  const gifts = await page.evaluate(() => {
    const panel = document.querySelectorAll('.hud-neighbour-sheet .hud-sheet-panel')[1];
    return panel?.querySelectorAll('.hud-ware').length ?? 0;
  });
  check(`${friend}'s page shows what they'll give at each band`, gifts === 3, String(gifts));
  await page.screenshot({ path: '.smoke/neighbour.png' });
  await tapElement('.hud-neighbour-sheet button:has-text("Find")');
  check(
    'Find closes the sheet and sets her walking',
    (await page.locator('.hud-sheet').count()) === 0,
  );
  const talking = await stepUntil(
    () => document.querySelector('.hud-talk-sheet') !== null,
    `Find walks her up to ${friend} for a talk`,
  );
  if (talking) await tapElement('.hud-talk-sheet button:text-is("Bye")');

  // Someone not where she is: Find says where, and she stays put.
  const away = await page.evaluate(() => {
    const here = window.world.scene;
    return window.world.neighbourhood.neighbours.find((n) => n.zone !== here)?.id ?? null;
  });
  if (away) {
    const before = await playerTile();
    await tapElement('.hud-neighbours');
    await tapElement(`.hud-neighbours-sheet .hud-neighbour[data-villager="${away}"]`);
    await tapElement('.hud-neighbour-sheet button:has-text("Find")');
    const said = (await page.locator('.hud-neighbour-sheet .hud-message').textContent()) ?? '';
    const after = await playerTile();
    check(
      `Find says where ${away} is, and never hops her there`,
      /Head over and say hello!$/.test(said) &&
        after.tx === before.tx &&
        after.ty === before.ty &&
        !(await page.evaluate(() => window.world.player.moving)),
      said,
    );
  }
  await closeSheets();
}

/** The mayor's letter pins the first clue, and her corkboard at home shows the case so far. */
async function mystery() {
  await tapProp('mailbox');
  const open = await stepUntil(
    () => document.querySelector('.hud-mail-sheet') !== null,
    'walking up to the mailbox opens it',
  );
  if (!open) return;
  // His welcome, mayor:0; in October his story's first chapter comes from him too.
  const welcome = await page.evaluate(() =>
    window.world.mailbox.view().findIndex((l) => l.id === 'mayor:0'),
  );
  await tapElement(`.hud-mail-sheet .hud-seed >> nth=${welcome}`);
  const letter = (await page.locator('.hud-mail-sheet .hud-letter').textContent()) ?? '';
  check(
    "the mayor's letter welcomes her by name",
    /^Dear Smoke,/.test(letter),
    letter.slice(0, 30),
  );
  await tapElement('.hud-mail-sheet button:text-is("Done")');
  check(
    "reading it pins the mayor's letter to her corkboard",
    await page.evaluate(() => window.world.casebook.foundOn('welcome') !== null),
  );

  await tapProp('homeHouse');
  await stepUntil(() => window.world.scene === 'home', 'she goes in her front door');
  const board = await page.evaluate(
    () => window.world.home.rooms.placed.find((p) => p.id === 'mysteryCorkboard') ?? null,
  );
  check('her corkboard is up at home', board !== null);
  if (!board) return;
  await page.evaluate((b) => window.world.tapTile(b.tx, b.ty), board);
  const sheet = await stepUntil(
    () => document.querySelector('.hud-corkboard-sheet') !== null,
    'walking up to the corkboard opens it',
  );
  if (sheet) {
    await framed('.hud-corkboard-sheet');
    const text = (await page.locator('.hud-corkboard-sheet').textContent()) ?? '';
    // At least the letter and a friend's rumour; Wes may have been spotted too, by the real clock.
    const pinned = await page.evaluate(
      () => Object.keys(window.world.casebook.snapshot().clues).length,
    );
    check(
      'the corkboard shows the clues found and the suspects so far',
      pinned >= 2 && new RegExp(`${pinned} of 14 clues`).test(text) && /Wes/.test(text),
      text.slice(0, 60),
    );
    // V1's P3a: the board fills to one empty pin, the mayor's.
    const last = (await page.locator('.hud-corkboard-sheet .hud-last-pin').textContent()) ?? '';
    check('the corkboard keeps one pin for the mayor, marked ???', /^\?\?\?/.test(last), last);
    const wide = await page.evaluate(() =>
      [...document.querySelectorAll('.hud-clue')].every(
        (c) => c.getBoundingClientRect().right <= window.innerWidth,
      ),
    );
    check('every clue card fits on screen', wide);
    await page.screenshot({ path: '.smoke/corkboard.png' });
    await tapElement('.hud-corkboard-sheet button:text-is("Done")');
  }
  await clearMat();
  const mat = await page.evaluate(() => window.world.home.rooms.room.mat);
  await page.evaluate((m) => window.world.tapTile(m.tx, m.ty), mat);
  await stepUntil(() => window.world.scene === 'town', 'she goes back out');
  await wesChat();
}

/**
 * Wes, after she has seen him run off three times (V1's P3a), stays behind his tree for a chat:
 * tapping him walks her up, and he owns up on a sheet of his own, upright and on its side.
 */
async function wesChat() {
  // He's put by the nearest tree, this minute, as though he'd come out there.
  const placed = await page.evaluate(() => {
    const m = window.world.mystery;
    window.world.casebook.glimpses = 3;
    window.world.casebook.chats = 0;
    const her = {
      tx: Math.floor(window.world.player.x / 32),
      ty: Math.floor(window.world.player.y / 32),
    };
    /** @param {{ tx: number, ty: number }} l */
    const far = (l) => Math.max(Math.abs(l.tx - her.tx), Math.abs(l.ty - her.ty));
    /** @param {{ tx: number, ty: number }} l */
    const free = (l) =>
      [l.ty, l.ty - 1].every((ty) => !window.world.neighbourhood.villagerAt(l.tx, ty));
    const near = [...m.lurks]
      .filter((l) => far(l) >= 2 && free(l))
      .sort((a, b) => far(a) - far(b))[0];
    if (!near) return null;
    m.wesSlot = Math.floor(window.world.clock.now() / 60_000);
    m.wesHere = near;
    return near;
  });
  check('Wes can be put by a tree near her', placed !== null);
  if (!placed) return;
  await tapTile(placed.tx, placed.ty - 1);
  const open = await stepUntil(
    () => document.querySelector('.hud-wes-sheet') !== null,
    'walking up to Wes opens a chat with him',
  );
  if (!open) return;
  await framed('.hud-wes-sheet', { picture: true });
  const first = (await page.locator('.hud-wes-sheet .hud-speech').textContent()) ?? '';
  // From the real day the October story's last chapter is due (about 24 October) he leads with
  // delivering it instead of a hello (`WES_DELIVERS`), so either opens the chat.
  check(
    'Wes says hello, and stays',
    /Hello/.test(first) || /last chapter of the mayor's story/.test(first),
    first.slice(0, 40),
  );
  await page.screenshot({ path: '.smoke/wes.png' });
  await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => done(null))));
  const sideways = await page.evaluate(() =>
    [...document.querySelectorAll('.hud-wes-sheet .hud-speech, .hud-wes-sheet button')].every(
      (e) => {
        const r = e.getBoundingClientRect();
        return r.right <= window.innerWidth && r.bottom <= window.innerHeight && r.width > 0;
      },
    ),
  );
  check("on its side, Wes's chat is all on screen", sideways);
  await page.screenshot({ path: '.smoke/wes-sideways.png' });
  await page.setViewportSize(PHONE);
  const goOn = '.hud-wes-sheet button:text-is("Go on…")';
  let said = '';
  for (let i = 0; i < 8 && (await page.locator(goOn).count()); i++) {
    await tapElement(goOn);
    said = (await page.locator('.hud-wes-sheet .hud-speech').textContent()) ?? '';
    if (/assistant/.test(said)) break;
  }
  check("Wes owns up: he's the mayor's assistant", /assistant/.test(said), said.slice(0, 60));
  while (await page.locator(goOn).count()) await tapElement(goOn);
  await tapElement('.hud-wes-sheet button:text-is("Bye")');
  check(
    'a chat with Wes is kept: one day of chats',
    await page.evaluate(() => window.world.casebook.chats === 1),
  );
}

/**
 * V1's L7, faces: a loved gift (a bracelet) changes the face on the neighbour's bust in the talk
 * sheet, read from its canvas, and the same face is on them in the world and on her, read through
 * `view.faces()`; upright and on its side, a neighbour each.
 */
async function faces() {
  await openOn('2026-09-28', 13);
  await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
  await stepUntil(() => window.world.scene === 'town', 'she is in town');
  const given = new Set();
  for (const sideways of [false, true]) {
    const way = sideways ? 'on its side' : 'upright';
    if (sideways) {
      await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
      await page.waitForTimeout(300);
    }
    // Someone in town she hasn't given anything to today, so the gift is taken.
    const friend = await page.evaluate(
      (done) => {
        const n = window.world.neighbourhood
          .neighboursIn('town')
          .find(
            (n) => !done.includes(n.id) && window.world.friends.of(n.id).gifted !== '2026-09-28',
          );
        if (!n) return null;
        window.world.bag.add('loveBracelet', 1);
        window.world.seek(n.id);
        return n.id;
      },
      [...given],
    );
    if (!friend) {
      check(`somebody is out in town to give a gift to, ${way}`, false);
      break;
    }
    given.add(friend);
    const talking = await stepUntil(
      () => document.querySelector('.hud-talk-sheet') !== null,
      `she walks up to ${friend}`,
    );
    if (!talking) break;
    const bust = () =>
      page.evaluate(() => {
        const c = /** @type {HTMLCanvasElement | null} */ (
          document.querySelector('.hud-talk-sheet .hud-portrait')
        );
        return { url: c?.toDataURL() ?? '', feel: c?.dataset['feel'] ?? 'neutral' };
      });
    const before = await bust();
    await tapElement('.hud-talk-sheet button:text-is("Give a gift")');
    await tapElement('.hud-talk-sheet .hud-slot[aria-label="Give LOVE bracelet"]');
    await page.evaluate(() => window.view.step(40));
    const after = await bust();
    check(
      `a loved gift changes ${friend}'s face on the bust, ${way}`,
      after.feel === 'laugh' && (before.feel === 'laugh' || after.url !== before.url),
      `${before.feel} -> ${after.feel}`,
    );
    const faces = await page.evaluate(() => window.view.faces());
    check(
      `and on ${friend} in the world, and on her, the same face, ${way}`,
      faces.neighbours.some((f) => f.id === friend && f.feel === 'laugh') && faces.her === 'laugh',
      JSON.stringify(faces),
    );
    await page.screenshot({ path: `.smoke/faces-${sideways ? 'sideways' : 'gift'}.png` });
    await tapElement('.hud-talk-sheet button:text-is("Bye")');
    await page.evaluate(() => window.view.step(40, 100));
  }
  await page.setViewportSize(PHONE);
  await page.waitForTimeout(300);
  await tapToastAway();
}

/**
 * V1's E3, neighbours alive: a neighbour standing at their stop is drawn a new way within a few
 * seconds (a breath, a blink, their job's next frame), and two standing together chatter, a
 * bubble over one of them; upright and on its side. A Monday afternoon with a visit in town.
 */
async function alive() {
  await openOn('2026-09-28', 15);
  await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
  await stepUntil(() => window.world.scene === 'town', 'she is in town');
  await page.evaluate(() => window.view.step(50, 100));
  /** Watches the neighbours standing in town for four seconds, as they're drawn. */
  const watch = async () => {
    const seen = /** @type {Record<string, Set<string>>} */ ({});
    for (let t = 0; t < 4_000; t += 200) {
      const figures = await page.evaluate(() => window.view.figures());
      for (const f of figures) {
        if (f.moving) continue;
        (seen[f.id] ??= new Set()).add(f.stance);
      }
      await page.waitForTimeout(200);
    }
    return Object.entries(seen).map(([id, stances]) => ({ id, stances: [...stances] }));
  };
  const upright = await watch();
  check(
    'everyone standing in town is drawn more than one way within four seconds',
    upright.length > 0 && upright.every((f) => f.stances.length > 1),
    JSON.stringify(upright),
  );
  /** @type {string[]} */
  let chats = [];
  for (let spent = 0; spent < 30_000 && chats.length === 0; spent += 500) {
    chats = await page.evaluate(() => {
      window.view.step(50, 10);
      return window.view
        .effects()
        .shown.filter(
          (s) =>
            s.kind === 'emote' &&
            ['…', '♪', '♥'].includes(s.emote ?? '') &&
            !!s.over &&
            'villager' in s.over,
        )
        .map((s) => `${s.emote} ${s.over && 'villager' in s.over ? s.over.villager : ''}`);
    });
  }
  check('two standing together chatter, a bubble over one', chats.length > 0, chats.join());
  await page.screenshot({ path: '.smoke/alive-chatter.png' });

  await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
  await page.waitForTimeout(300);
  const sideways = await watch();
  check(
    'on its side too, they breathe and blink',
    sideways.length > 0 && sideways.every((f) => f.stances.length > 1),
    JSON.stringify(sideways),
  );
  await page.screenshot({ path: '.smoke/alive-sideways.png' });
  await page.setViewportSize(PHONE);
  await page.waitForTimeout(300);
}

async function lives() {
  // At ten in the morning, weekday or weekend, some of her neighbours are in: at home, at work,
  // browsing a shop, or round at hers.
  await page.goto(`${URL_BASE}?loop=manual&skiptitle&day=${PLAIN_DAY}&hour=10`, {
    waitUntil: 'load',
    timeout: 60_000,
  });
  await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
  await answerCody();
  const found = await page.evaluate(() => {
    const n = window.world.neighbourhood.neighbours.find(
      (n) => !window.world.zones.outdoor(n.zone),
    );
    if (!n) return null;
    const door = window.world.zones.map('town').map.doors.find((d) => d.to === n.zone);
    return { id: n.id, zone: n.zone, building: door?.prop ?? null };
  });
  check('someone is in at ten in the morning', found !== null && found.building !== null);
  if (!found?.building) return;
  if (!(await goInto(found.building, found.zone))) return;
  const tile = await page.evaluate((id) => window.world.neighbourhood.neighbour(id).tile, found.id);
  await tapTile(tile.tx, tile.ty);
  const talking = await stepUntil(
    () => document.querySelector('.hud-talk-sheet') !== null,
    `a tap on ${found.id} in ${found.zone} opens a talk`,
  );
  if (talking) check(`${found.id} talks to her in ${found.zone}`, true);
  await page.screenshot({ path: '.smoke/lives.png' });
  if (talking) await tapElement('.hud-talk-sheet button:text-is("Bye")');
  if (found.zone === 'home') {
    const mat = await page.evaluate(() => window.world.zones.home.entry().tile);
    await tapTile(mat.tx, mat.ty);
    await stepUntil(() => window.world.scene === 'town', 'she goes back out');
  } else await goOut();
}

/** Everyone lives in town from the first day (decision 211): Ollie's house stands, and in she goes. */
async function everyone() {
  const all = await page.evaluate(() => window.world.neighbourhood.neighbours.length);
  check('all twelve neighbours live in town', all === 12, String(all));
  const house = await page.evaluate(() =>
    window.world.townZone.lots?.props().find((p) => p.id === 'ollieHouse'),
  );
  check("Ollie's house stands on its lot", !!house);
  if (!house) return;
  await page.evaluate((t) => window.world.tapTile(t.tx, t.ty), house);
  const went = await stepUntil(
    () => window.world.scene === 'ollieCottage',
    "she goes into Ollie's cottage",
  );
  if (!went) return;
  await page.evaluate(() => window.view.step(40));
  const welcome = (await page.locator('.hud-toast').textContent()) ?? '';
  check("going into Ollie's cottage says so", /Ollie's cottage/.test(welcome), welcome);
  await page.screenshot({ path: '.smoke/ollie.png' });
  await goOut();
  const out = await page.evaluate((h) => {
    const here = window.world.movement.tile;
    return window.world.scene === 'town' && here.tx === h.tx + 1 && here.ty === h.ty + h.h;
  }, house);
  check("the mat takes her back out in front of Ollie's door", out);
  await page.screenshot({ path: '.smoke/ollie-house.png' });
}

/**
 * Scarah (0.3's F3, decision 243): at her seed cart at Boo Acres of a weekday morning, walked up
 * to and talked to by real taps, and her farmhouse gone into by its door.
 */
async function scarah() {
  await openOn(PLAIN_DAY, 10);
  await page.evaluate(() => window.world.travel.go('booAcres'));
  await page.evaluate(() => window.view.step(40, 20));
  const where = await page.evaluate(() => {
    const n = window.world.neighbourhood.neighbour('scarah');
    return { zone: n.zone, tx: n.tile.tx, ty: n.tile.ty };
  });
  check(
    'Scarah is at Boo Acres of a weekday morning',
    where.zone === 'booAcres',
    JSON.stringify(where),
  );
  if (where.zone !== 'booAcres') return;
  const near = await page.evaluate((s) => {
    const acres = window.world.zones.map('booAcres');
    return [
      { tx: s.tx, ty: s.ty + 2 },
      { tx: s.tx + 2, ty: s.ty },
      { tx: s.tx - 2, ty: s.ty },
      { tx: s.tx, ty: s.ty - 2 },
    ].find((t) => acres.canWalk(t.tx, t.ty));
  }, where);
  if (!near) return check('there is open ground near Scarah', false);
  if (!(await tapAlong(near, 'near Scarah'))) return;
  const at = await page.evaluate(() => window.world.neighbourhood.neighbour('scarah').tile);
  await tapTile(at.tx, at.ty);
  const talking = await stepUntil(
    () => document.querySelector('.hud-talk-sheet') !== null,
    'walking up to Scarah opens a talk',
  );
  if (!talking) return;
  await framed('.hud-talk-sheet', { picture: true });
  const head = (await page.locator('.hud-talk-sheet h2').textContent()) ?? '';
  const said = (await page.locator('.hud-talk-sheet .hud-speech').textContent()) ?? '';
  check('a tap on Scarah talks to her', /Scarah/.test(head) && said.length > 0, `${head}: ${said}`);
  await page.screenshot({ path: '.smoke/scarah.png' });
  await tapElement('.hud-talk-sheet button:text-is("Bye")');

  // Her farmhouse, by its door at the middle.
  const house = await page.evaluate(() => {
    const p = window.world.zones.map('booAcres').map.props.find((p) => p.id === 'farmhouse');
    return p ? { tx: p.tx, ty: p.ty, w: p.w, h: p.h } : null;
  });
  if (!house) return check('Boo Acres has a farmhouse', false);
  const step = { tx: house.tx + 2, ty: house.ty + house.h };
  if (!(await tapAlong(step, "to Scarah's door"))) return;
  await tapTile(step.tx, step.ty - 1);
  const inside = await stepUntil(
    () => window.world.scene === 'scarahFarmhouse',
    "she goes into Scarah's farmhouse",
  );
  check("the farmhouse door goes into Scarah's farmhouse", inside);
  if (!inside) return;
  await page.evaluate(() => window.view.step(40, 4));
  const welcome = (await page.locator('.hud-toast').textContent()) ?? '';
  check("going into Scarah's farmhouse says so", /Scarah's farmhouse/.test(welcome), welcome);
  await page.screenshot({ path: '.smoke/scarah-farmhouse.png' });
  await goOut();
  await page.evaluate(() => window.world.travel.go('town'));
  await page.evaluate(() => window.view.step(40, 2));
}

/**
 * Jobs seen, and happenings that do something (V1's P4): Rufus's flower buckets open as a shop,
 * and at book club Maude's talk has its verb, picking next week's book from three, through the
 * talk's list of actions, upright and on its side.
 */
async function jobs() {
  await page.evaluate(() => window.view.saveNow());
  // A Wednesday evening in November, out of the festival: book club is on at Maude's.
  await openOn('2026-11-11', 20);
  await goOut();
  await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
  await stepUntil(() => window.world.scene === 'town', 'she goes back to town');
  await page.evaluate(() => window.view.step(40, 5));
  await closeSheets();
  if (!(await goInto('rufusHouse', 'rufusCabin'))) return;
  await page.evaluate(() => window.world.wallet.earn(1000));
  await tapFixture('flowerBuckets');
  const shop = (await page.locator('.hud-shop-sheet').count()) === 1;
  const title = shop ? ((await page.locator('.hud-shop-sheet h2').textContent()) ?? '') : '';
  check(
    "walking up to Rufus's flower buckets opens them as a shop",
    shop && /flower buckets/.test(title),
    title,
  );
  if (!shop) return goOut();
  await framed('.hud-shop-sheet');
  const wares = await page.locator('.hud-shop-sheet .hud-ware').count();
  check('his buckets have something in them today', wares > 3, String(wares));
  await page.screenshot({ path: '.smoke/flower-buckets.png' });
  await tapElement('.hud-shop-sheet .hud-done');
  await goOut();

  if (!(await goInto('maudeHouse', 'library'))) return;
  const settled = await stepUntil(() => {
    const m = window.world.neighbourhood.neighbour('maude');
    return m.zone === 'library' && !m.moving;
  }, 'Maude in her library for book club');
  if (!settled) return goOut();
  const maude = await page.evaluate(() => window.world.neighbourhood.neighbour('maude').tile);
  await tapTile(maude.tx, maude.ty);
  const talking = await stepUntil(
    () => document.querySelector('.hud-talk-sheet') !== null,
    'walking up to Maude opens a talk',
  );
  if (!talking) return goOut();
  const verb = `.hud-talk-sheet button:text-is("Pick next week's book")`;
  check("at book club, Maude's talk has its verb", (await page.locator(verb).count()) === 1);
  await page.screenshot({ path: '.smoke/talk-actions.png' });
  const fits = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.hud-talk-sheet .hud-sheet-foot button')].every((b) => {
        const r = b.getBoundingClientRect();
        return r.height >= 44 && r.right <= window.innerWidth && r.bottom <= window.innerHeight;
      }),
    );
  check("upright, every one of the talk's actions is on screen", await fits());
  await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
  await page.waitForTimeout(300);
  check("on its side, every one of the talk's actions is on screen", await fits());
  await page.screenshot({ path: '.smoke/talk-actions-sideways.png' });
  await page.setViewportSize(PHONE);
  await page.waitForTimeout(300);
  if ((await page.locator(verb).count()) !== 1) return;
  await tapElement(verb);
  const picks = await page.locator('.hud-talk-sheet .hud-reply').count();
  check("picking next week's book offers three", picks === 3, String(picks));
  await page.screenshot({ path: '.smoke/talk-picks.png' });
  if (picks === 0) return;
  await tapElement('.hud-talk-sheet .hud-reply >> nth=0');
  const joined = await page.evaluate(() => window.world.joining.lastJoined('bookClub'));
  const said = (await page.locator('.hud-talk-sheet .hud-speech').textContent()) ?? '';
  check(
    'her pick is kept for next week, and Maude answers it',
    joined?.on === '2026-11-11' && typeof joined.choice === 'string' && said.length > 0,
    `${JSON.stringify(joined)} ${said}`,
  );
  check('the verb is done for tonight', (await page.locator(verb).count()) === 0);
  await tapElement('.hud-talk-sheet button:text-is("Bye")');
  await goOut();
}

/**
 * Rob Boo (V1's P3b, decision 303): on a plain Tuesday evening, the mayor's chain done by the dev
 * handles (`world.mystery.pin`), the town is gathered in the castle's great hall; walking in by real
 * taps, the dust sheet comes off, Rob Boo says hello and the corkboard's last pin is his. The next
 * morning, after a reload by `?day=`, he's on the town hall's steps, and a tap on him talks to him.
 */
async function robBoo() {
  const evening = '2026-11-17';
  const morning = '2026-11-18';
  await openOn(evening, 19);
  const ready = await page.evaluate(() => {
    const m = window.world.mystery;
    const chain = /** @type {const} */ ([
      'welcome',
      'typewriter',
      'wobblyLetter',
      'sash',
      'goodEnvelopes',
      'stamp',
      'assistant',
      'typing',
      'promise',
    ]);
    for (const id of chain) m.pin(id);
    return {
      ready: m.ready(),
      met: m.met(),
      about: window.world.neighbourhood.neighbours.some((n) => n.id === 'robBoo'),
    };
  });
  check(
    'the mayor has promised, and is nowhere about yet',
    ready.ready === evening && ready.met === null && !ready.about,
    JSON.stringify(ready),
  );
  await closeSheets();
  await page.evaluate(() => window.world.atlas.find('castleHill'));
  await page.evaluate(() => window.view.step(40));
  await closeSheets();
  await page.evaluate(
    () => window.world.scene === 'castleHill' || window.world.travel.go('castleHill'),
  );
  await page.evaluate(() => window.view.step(40, 5));
  await closeSheets();
  const castle = await page.evaluate(() => {
    const p = window.world.zones.map('castleHill').map.props.find((p) => p.id === 'castle');
    return p ? { tx: p.tx + 4, ty: p.ty + p.h } : null;
  });
  if (!castle) return check('the castle hill has its castle', false);
  if (!(await tapAlong(castle, "up to the castle's doors"))) return;
  await tapTile(castle.tx, castle.ty - 1);
  const inside = await stepUntil(
    () => window.world.scene === 'castleHall',
    "she goes into the castle's great hall",
  );
  if (!inside) return;
  const revealed = await stepUntil(
    () => document.querySelector('.hud-reveal-sheet') !== null,
    'the dust sheet is waiting for her in the hall',
  );
  if (!revealed) return;
  await page.evaluate(() => window.view.step(40, 10));
  await framed('.hud-reveal-sheet', { picture: true });
  const before = (await page.locator('.hud-reveal-sheet h2').textContent()) ?? '';
  const goOn = '.hud-reveal-sheet button:text-is("Go on…")';
  let titles = [before];
  for (let i = 0; i < 10 && (await page.locator(goOn).count()) > 0; i++) {
    await tapElement(goOn);
    titles.push((await page.locator('.hud-reveal-sheet h2').textContent()) ?? '');
    if (titles.at(-1) !== titles.at(-2)) {
      await page.screenshot({ path: '.smoke/reveal.png' });
      await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
      await page.waitForTimeout(300);
      await page.screenshot({ path: '.smoke/reveal-sideways.png' });
      await page.setViewportSize(PHONE);
      await page.waitForTimeout(300);
    }
  }
  titles = [...new Set(titles)];
  check(
    'the dust sheet comes off the mayor, and it is Rob Boo',
    titles.length === 2 && titles[0] === 'The mayor' && titles[1] === 'Rob Boo, the mayor',
    JSON.stringify(titles),
  );
  await tapElement('.hud-reveal-sheet button:text-is("Hello, Rob!")');
  const met = await page.evaluate(() => ({
    met: window.world.mystery.met(),
    here: window.world.neighbourhood.neighboursIn('castleHall').some((n) => n.id === 'robBoo'),
    pinned: window.world.casebook.foundOn('unmasked'),
  }));
  check(
    'she has met the mayor, his clue is pinned, and he is there in the hall',
    met.met === evening && met.pinned === evening && met.here,
    JSON.stringify(met),
  );
  await page.evaluate(() => window.view.step(40, 10));
  await page.screenshot({ path: '.smoke/reveal-hall.png' });
  await page.evaluate(() => window.view.saveNow());

  // The next morning, a Wednesday: out on the town hall's steps, waving the town good morning.
  await openOn(morning, 9);
  await goOut();
  await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
  await stepUntil(() => window.world.scene === 'town', 'she goes back to town');
  await page.evaluate(() => window.view.step(40, 10));
  await closeSheets();
  const where = await page.evaluate(() => {
    const n = window.world.neighbourhood.neighbour('robBoo');
    return { zone: n.zone, tx: n.tile.tx, ty: n.tile.ty, met: window.world.mystery.met() };
  });
  check(
    "the next morning Rob Boo is out on the town hall's steps",
    where.zone === 'town' && where.met === evening,
    JSON.stringify(where),
  );
  if (where.zone !== 'town') return;
  const near = await page.evaluate((s) => {
    const town = window.world.zones.map('town');
    return [
      { tx: s.tx, ty: s.ty + 2 },
      { tx: s.tx + 2, ty: s.ty },
      { tx: s.tx - 2, ty: s.ty },
      { tx: s.tx, ty: s.ty + 3 },
    ].find((t) => town.canWalk(t.tx, t.ty));
  }, where);
  if (!near) return check('there is open ground near Rob Boo', false);
  if (!(await tapAlong(near, 'near Rob Boo'))) return;
  const at = await page.evaluate(() => window.world.neighbourhood.neighbour('robBoo').tile);
  await tapTile(at.tx, at.ty);
  const talking = await stepUntil(
    () => document.querySelector('.hud-talk-sheet') !== null,
    'walking up to Rob Boo opens a talk',
  );
  if (!talking) return;
  await framed('.hud-talk-sheet', { picture: true });
  const head = (await page.locator('.hud-talk-sheet h2').textContent()) ?? '';
  const said = (await page.locator('.hud-talk-sheet .hud-speech').textContent()) ?? '';
  check(
    'a tap on Rob Boo talks to him',
    /Rob Boo/.test(head) && said.length > 0,
    `${head}: ${said}`,
  );
  await page.screenshot({ path: '.smoke/rob-boo.png' });
  await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.smoke/rob-boo-sideways.png' });
  await page.setViewportSize(PHONE);
  await page.waitForTimeout(300);
  await tapElement('.hud-talk-sheet button:text-is("Bye")');
}

/**
 * Cody, married (V1's P5): at eight on an evening he spends at hers, she goes home and finds him
 * there; walked up to by a real tap, he asks how her day was with her three answers, and answers
 * the one she taps; what they can do together is beside Chat; and his page calls him married.
 * Upright and on its side.
 */
async function married() {
  /** @type {string | null} */
  let evening = null;
  for (const day of ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']) {
    await openOn(day, 20);
    if (await page.evaluate(() => window.world.marriage.atHers)) {
      evening = day;
      break;
    }
  }
  if (!evening) return check('one of five evenings, Cody is at hers', false);
  await page.evaluate(() => window.world.scene === 'home' || window.world.travel.home());
  await stepUntil(
    () => window.world.scene === 'home' && window.view.transition() === null,
    'she flies home',
  );
  await closeSheets();
  const there = await stepUntil(() => {
    const cody = window.world.neighbourhood.neighbour('cody');
    return cody.zone === 'home' && !cody.moving;
  }, 'Cody is at hers of an evening');
  if (!there) return;
  await page.evaluate(() => window.view.step(40, 10));
  await page.screenshot({ path: '.smoke/married-home.png' });
  const where = await page.evaluate(() => window.world.neighbourhood.whereIs('cody'));
  check(
    "the neighbours sheet's Cody is visiting her",
    where?.zone === 'home' && JSON.stringify(where.doing) === '{"visiting":"her"}',
    JSON.stringify(where),
  );
  const at = await page.evaluate(() => window.world.neighbourhood.neighbour('cody').tile);
  await tapTile(at.tx, at.ty);
  const talking = await stepUntil(
    () => document.querySelector('.hud-talk-sheet') !== null,
    'walking up to Cody at hers opens a talk',
  );
  if (!talking) return;
  await framed('.hud-talk-sheet', { picture: true });
  const asked = await page.evaluate(() => ({
    said: document.querySelector('.hud-talk-sheet .hud-speech')?.textContent ?? '',
    chips: [...document.querySelectorAll('.hud-talk-sheet .hud-reply')].map(
      (b) => b.textContent ?? '',
    ),
    hearts: document.querySelectorAll('.hud-talk-sheet .hud-hearts .hud-heart-full').length,
  }));
  check(
    'Cody asks how her day was, with her three answers, his hearts full',
    /day|today/i.test(asked.said) &&
      JSON.stringify(asked.chips) === '["It was good!","Long day…","Tell you later"]' &&
      asked.hearts === 10,
    JSON.stringify(asked),
  );
  await page.screenshot({ path: '.smoke/married-ask.png' });
  await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.smoke/married-ask-sideways.png' });
  await page.setViewportSize(PHONE);
  await page.waitForTimeout(300);
  await tapElement('.hud-talk-sheet .hud-reply:text-is("Long day…")');
  const answered = await page.evaluate(() => ({
    said: document.querySelector('.hud-talk-sheet .hud-speech')?.textContent ?? '',
    kept: window.world.lately.last.herDay,
    buttons: [...document.querySelectorAll('.hud-talk-sheet button')].map(
      (b) => b.textContent?.trim() ?? '',
    ),
  }));
  check(
    'tapping "Long day…", he answers it, and what she said is kept for tomorrow',
    answered.said !== asked.said &&
      answered.said.length > 0 &&
      answered.kept?.day === evening &&
      answered.kept.answer === 'long',
    JSON.stringify(answered),
  );
  check(
    'what they can do together at hers is beside Chat',
    answered.buttons.includes('Our song') && answered.buttons.includes('Chat'),
    JSON.stringify(answered.buttons),
  );
  await page.screenshot({ path: '.smoke/married-answered.png' });
  await tapElement('.hud-talk-sheet button:text-is("Bye")');
  await tapElement('.hud-neighbours');
  await tapElement('.hud-neighbours-sheet .hud-neighbour[data-villager="cody"]');
  const band = await page.evaluate(() =>
    [...document.querySelectorAll('.hud-neighbour-sheet .hud-fact')].map((f) => f.textContent),
  );
  check(
    'his page calls him married, never "getting to know you"',
    band.some((f) => /Married/.test(f ?? '')) && !band.some((f) => /Getting to know/.test(f ?? '')),
    JSON.stringify(band),
  );
  await closeSheets();
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [
  ['neighbours', neighbours],
  ['relations', relations],
  ['mystery', mystery],
  ['faces', faces],
  ['alive', alive],
  ['lives', lives],
  ['everyone', everyone],
  ['scarah', scarah],
  ['jobs', jobs],
  ['robBoo', robBoo],
  ['married', married],
];
