/** How it feels (V1's lane E): the effects layer, her verbs, what moves on its own, and taps and transitions. */
import {
  FRAME_MS,
  PHONE,
  check,
  closeSheets,
  framed,
  openOn,
  page,
  propTile,
  stepUntil,
  tapProp,
  tapElement,
  tapTile,
  tapToastAway,
  walkTo,
} from './lib.mjs';

/**
 * V1's E1, the effects layer: a real tap on a rock pops the stone over her head, and a loved gift
 * (a bracelet: everyone loves one) puts a ♥ over the neighbour. Smoke asks for reduced motion, so
 * these are the still ones; upright and on its side.
 */
async function effects() {
  await openOn('2026-09-28', 13);
  await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
  await stepUntil(() => window.world.scene === 'town', 'she is in town');
  const gatherAt = async (/** @type {string} */ shot) => {
    const rock = await propTile('rock', { nearest: true });
    await tapTile(rock.tx, rock.ty);
    await stepUntil(() => !window.world.player.moving, 'she reaches the rock');
    await page.evaluate(() => window.view.step(40));
    const shown = await page.evaluate(() => window.view.effects().shown);
    await page.screenshot({ path: `.smoke/${shot}.png` });
    return shown;
  };
  const popped = await gatherAt('effects-pop');
  check(
    'chipping a rock pops the stone over her head',
    popped.some((s) => s.kind === 'pop' && !!s.icon && 'item' in s.icon && s.icon.item === 'stone'),
    JSON.stringify(popped),
  );

  const friend = await page.evaluate(() => {
    const n = window.world.neighbourhood.neighboursIn('town')[0];
    if (!n) return null;
    window.world.bag.add('loveBracelet', 1);
    window.world.seek(n.id);
    return n.id;
  });
  if (!friend) {
    check('somebody is out in town to give a gift to', false);
    return;
  }
  const talking = await stepUntil(
    () => document.querySelector('.hud-talk-sheet') !== null,
    `she walks up to ${friend}`,
  );
  if (!talking) return;
  await tapElement('.hud-talk-sheet button:text-is("Give a gift")');
  await tapElement('.hud-talk-sheet .hud-slot[aria-label="Give LOVE bracelet"]');
  await page.evaluate(() => window.view.step(40));
  const hearts = await page.evaluate(() => window.view.effects().shown);
  check(
    `a loved gift puts a ♥ over ${friend}`,
    hearts.some(
      (s) =>
        s.kind === 'emote' &&
        s.emote === '♥' &&
        !!s.over &&
        'villager' in s.over &&
        s.over.villager === friend,
    ),
    JSON.stringify(hearts),
  );
  await tapElement('.hud-talk-sheet button:text-is("Bye")');
  await page.evaluate(() => window.view.step(40));
  await page.screenshot({ path: '.smoke/effects-heart.png' });

  await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
  await page.waitForTimeout(300);
  const sideways = await gatherAt('effects-sideways');
  check(
    'on its side too, a gather pops what she got',
    sideways.some((s) => s.kind === 'pop'),
    JSON.stringify(sideways),
  );
  await page.setViewportSize(PHONE);
  await page.waitForTimeout(300);
  await tapToastAway();
}

/**
 * What moves on its own (V1's E5, decision 284): the fountain's jet plays through its frames, a
 * crow crosses the town's sky by day, and leaves fall under the trees in autumn but not in
 * summer; looked at upright and on its side.
 */
async function moves() {
  await openOn('2026-10-14', 10);
  await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
  await stepUntil(() => window.world.scene === 'town', 'she is in town');
  const fountainFrames = new Set();
  let flyers = 0;
  let leaves = 0;
  for (let spent = 0; spent < 32_000 && (fountainFrames.size < 2 || flyers === 0); spent += 400) {
    const m = await page.evaluate(() => {
      window.view.step(40, 2);
      return window.view.motion();
    });
    for (const p of m.props) if (p.id === 'fountain') fountainFrames.add(p.frame);
    flyers = Math.max(flyers, m.flyers);
    leaves = Math.max(leaves, m.leaves);
    await page.waitForTimeout(400);
  }
  check(
    "the fountain's jet plays through its frames",
    fountainFrames.size > 1,
    [...fountainFrames].join(),
  );
  check('a crow crosses the sky over town by day', flyers > 0, String(flyers));
  check('leaves fall under the trees in October', leaves > 0, String(leaves));
  await page.screenshot({ path: '.smoke/moves.png' });
  await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.view.step(40, 2));
  await page.screenshot({ path: '.smoke/moves-sideways.png' });
  await page.setViewportSize(PHONE);
  await page.waitForTimeout(300);

  await openOn('2026-07-14', 10);
  await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
  await stepUntil(() => window.world.scene === 'town', 'she is in town in July');
  const summer = await page.evaluate(() => {
    window.view.step(40, 2);
    return window.view.motion().leaves;
  });
  check('no leaves fall in July', summer === 0, String(summer));
}

/**
 * Taps and transitions (V1's E4, decision 283): a real tap on a hedge she can't get round gets a
 * shrug and a ? over her, never a toast; a held press is a tap, and rings where it lands; a tap
 * on a neighbour aims at them; flying passes through a fade, or with motion her broom and an
 * iris; a sheet slides up and away, upright and on its side.
 */
async function taps() {
  await openOn('2026-09-28', 12);
  await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
  await stepUntil(() => window.world.scene === 'town', 'she is in town');
  await page.evaluate(() => window.view.step(40, 30));
  /** A hedge tile no open tile touches, the nearest to her, and an open tile near it. */
  const hedge = await page.evaluate(() => {
    const w = window.world;
    const here = w.movement.tile;
    /** @type {{ tx: number, ty: number, d: number } | null} */
    let best = null;
    for (let ty = 0; ty < w.size.height; ty++) {
      for (let tx = 0; tx < w.size.width; tx++) {
        if (w.canWalk(tx, ty) || w.zone.propAt(tx, ty)) continue;
        let shut = true;
        for (let dy = -1; dy <= 1 && shut; dy++) {
          for (let dx = -1; dx <= 1; dx++) if (w.canWalk(tx + dx, ty + dy)) shut = false;
        }
        if (!shut) continue;
        const d = Math.abs(tx - here.tx) + Math.abs(ty - here.ty);
        if (!best || d < best.d) best = { tx, ty, d };
      }
    }
    if (!best) return null;
    /** @type {{ tx: number, ty: number, d: number } | null} */
    let near = null;
    for (let ty = best.ty - 4; ty <= best.ty + 4; ty++) {
      for (let tx = best.tx - 4; tx <= best.tx + 4; tx++) {
        if (!w.canWalk(tx, ty)) continue;
        const d = Math.abs(tx - best.tx) + Math.abs(ty - best.ty);
        if (d >= 3 && (!near || d < near.d)) near = { tx, ty, d };
      }
    }
    return near && { hedge: best, near };
  });
  if (!hedge) return check('town has a hedge she cannot get round', false);
  await walkTo(hedge.near);
  for (const [way, size] of /** @type {const} */ ([
    ['upright', PHONE],
    ['on its side', { width: PHONE.height, height: PHONE.width }],
  ])) {
    await page.setViewportSize(size);
    await page.waitForTimeout(300);
    await page.evaluate(() => window.view.step(40, 25));
    await closeSheets();
    if ((await page.locator('.hud-toast-shown').count()) > 0) await tapToastAway();
    // The nearest such hedge in the clear on the page: nothing of the HUD over it or near it.
    const at = await page.evaluate(() => {
      const w = window.world;
      const here = w.movement.tile;
      const view = document.querySelector('.hud-view')?.getBoundingClientRect();
      const furniture = [...document.querySelectorAll('.hud button, .hud-toast-shown')]
        .map((b) => b.getBoundingClientRect())
        .filter((r) => r.width > 0);
      /** @type {{ x: number, y: number, d: number } | null} */
      let best = null;
      for (let ty = 0; ty < w.size.height; ty++) {
        for (let tx = 0; tx < w.size.width; tx++) {
          if (w.canWalk(tx, ty) || w.zone.propAt(tx, ty)) continue;
          let shut = true;
          for (let dy = -1; dy <= 1 && shut; dy++) {
            for (let dx = -1; dx <= 1; dx++) if (w.canWalk(tx + dx, ty + dy)) shut = false;
          }
          if (!shut) continue;
          const p = window.view.tileToClient(tx, ty);
          const m = 20;
          if (!view || p.x < view.left + 4 || p.x > view.right - 4) continue;
          if (p.y < view.top + 4 || p.y > view.bottom - 4) continue;
          const covered = furniture.some(
            (r) => p.x > r.left - m && p.x < r.right + m && p.y > r.top - m && p.y < r.bottom + m,
          );
          if (covered || document.elementFromPoint(p.x, p.y)?.id !== 'game') continue;
          const d = Math.abs(tx - here.tx) + Math.abs(ty - here.ty);
          if (!best || d < best.d) best = { x: p.x, y: p.y, d };
        }
      }
      return best;
    });
    if (!at) {
      check(`${way}, a hedge she can't get round is in the clear on the page`, false);
      continue;
    }
    const toasts = await page.locator('.hud-toast-shown').count();
    await page.touchscreen.tap(at.x, at.y);
    await page.evaluate(() => window.view.step(40, 1));
    const after = await page.evaluate(
      (p) => ({
        pose: window.world.poses.pose(),
        moving: window.world.player.moving,
        shown: window.view.effects().shown.map((e) => `${e.kind}${e.emote ?? ''}`),
        at: p,
        scene: window.world.scene,
      }),
      at,
    );
    check(
      `${way}, a tap on a hedge she can't get round gets a shrug and a ?, and no toast`,
      after.pose === 'shrug' &&
        !after.moving &&
        after.shown.includes('emote?') &&
        after.shown.includes('ring') &&
        (await page.locator('.hud-toast-shown').count()) <= toasts,
      JSON.stringify(after),
    );
    const name = way === 'upright' ? 'upright' : 'sideways';
    await page.screenshot({ path: `.smoke/taps-shrug-${name}.png` });
    // A press held most of a second on open ground is a tap: she sets off, and it rings.
    await page.evaluate(() => window.view.step(40, 25));
    const open = await page.evaluate(() => {
      const h = window.world.movement.tile;
      for (const [dx, dy] of [
        [2, 0],
        [-2, 0],
        [0, 2],
        [0, -2],
        [1, 1],
        [-1, 1],
      ]) {
        const t = { tx: h.tx + (dx ?? 0), ty: h.ty + (dy ?? 0) };
        if (window.world.canWalk(t.tx, t.ty)) return t;
      }
      return null;
    });
    if (!open) {
      check(`${way}, there's open ground beside her for a held press`, false);
      continue;
    }
    const to = await page.evaluate((t) => window.view.tileToClient(t.tx, t.ty), open);
    const touch = await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: to.x, y: to.y }],
    });
    await page.waitForTimeout(900);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touch.detach();
    await page.evaluate(() => window.view.step(40, 1));
    const held = await page.evaluate(() => ({
      target: window.world.target,
      moving: window.world.player.moving,
      rings: window.view.effects().shown.filter((e) => e.kind === 'ring').length,
    }));
    check(
      `${way}, a press held most of a second is a tap: she sets off, and it rings`,
      (held.moving || held.target !== null) && held.rings > 0,
      JSON.stringify(held),
    );
    await stepUntil(() => !window.world.player.moving, 'she stops after the held press');
    // Back beside the hedge, for the other way round.
    await walkTo(hedge.near);
  }
  await page.setViewportSize(PHONE);
  await page.waitForTimeout(300);
  // A tap on a neighbour aims at them, which the outline follows, onto a seat too.
  const someone = await page.evaluate(() => {
    const n = window.world.neighbourhood.neighboursIn('town')[0];
    return n ? { tx: n.tile.tx, ty: n.tile.ty, id: n.id } : null;
  });
  if (someone) {
    await page.evaluate((t) => window.world.tapTile(t.tx, t.ty), someone);
    const aim = await page.evaluate(() => window.world.aim);
    check(
      'a tap on a neighbour aims at them, to bracket them',
      !!aim && 'villager' in aim && aim.villager === someone.id,
      JSON.stringify(aim),
    );
    await page.evaluate(() => window.view.step(40, 100));
    await closeSheets();
  }
  // Flying home with less motion asked for (smoke's) fades through dark, never a cut.
  await page.evaluate(() => window.world.travel.home());
  await page.evaluate(() => window.view.step(40, 2));
  const fading = await page.evaluate(() => window.view.transition());
  check(
    'flying home with less motion fades through dark',
    fading?.kind === 'iris',
    JSON.stringify(fading),
  );
  await page.evaluate(() => window.view.step(40, 20));
  check(
    'and is done within a second',
    (await page.evaluate(() => window.view.transition())) === null,
  );
  // With motion, she's seen flying off on her broom, then the iris.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await closeSheets();
  await page.evaluate(() => window.world.travel.back());
  await page.evaluate(() => window.view.step(40, 4));
  const flying = await page.evaluate(() => window.view.transition());
  check('flying back she is seen on her broom', flying?.kind === 'broom', JSON.stringify(flying));
  await page.screenshot({ path: '.smoke/taps-broom.png' });
  await page.evaluate(() => window.view.step(40, 14));
  const iris = await page.evaluate(() => window.view.transition());
  check(
    'then the iris closes on her and opens where she lands',
    iris?.kind === 'broom' && iris.progress > 0.6,
    JSON.stringify(iris),
  );
  await page.screenshot({ path: '.smoke/taps-iris.png' });
  await page.evaluate(() => window.view.step(40, 10));
  check(
    'and the town is drawn plain again',
    (await page.evaluate(() => window.view.transition())) === null,
  );
  // A sheet slides up, and away when it's done, upright and on its side.
  for (const [way, size] of /** @type {const} */ ([
    ['upright', PHONE],
    ['on its side', { width: PHONE.height, height: PHONE.width }],
  ])) {
    await page.setViewportSize(size);
    await page.waitForTimeout(300);
    await closeSheets();
    await tapElement('.hud-bag-button');
    const opening = await page.evaluate(() => {
      const sheet = document.querySelector('.hud-sheet');
      const backdrop = document.querySelector('.hud-backdrop');
      return {
        sheet: sheet ? getComputedStyle(sheet).animationName : null,
        backdrop: backdrop ? getComputedStyle(backdrop).animationName : null,
      };
    });
    check(
      `${way}, a sheet slides up over a backdrop easing in`,
      opening.sheet === 'hud-sheet-up' && opening.backdrop === 'hud-backdrop-in',
      JSON.stringify(opening),
    );
    await page.waitForTimeout(250);
    await tapElement('.hud-bag-sheet .hud-done');
    const leaving = await page.evaluate(() => {
      const going = document.querySelector('.hud-sheet-leaving');
      return {
        leaving: document.querySelectorAll('.hud-sheet-leaving').length,
        animation: going ? getComputedStyle(going).animationName : null,
      };
    });
    await page.waitForTimeout(400);
    const gone = await page.locator('.hud-sheet').count();
    check(
      `${way}, and slides away as it closes, then is gone`,
      leaving.leaving === 1 && leaving.animation === 'hud-sheet-down' && gone === 0,
      JSON.stringify({ ...leaving, gone }),
    );
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize(PHONE);
  await page.waitForTimeout(300);
}

/**
 * V1's E2, her verbs: walked up to by a real tap, a rock has her turned to it and crouched for its
 * stone, and a bed has her facing it to dig it over; upright, and on its side.
 */
async function verbs() {
  /** Steps a frame at a time until she stops, and says how she stands the frame she arrives. */
  const arrive = async (/** @type {string} */ label) => {
    for (let spent = 0; spent < 20_000; spent += FRAME_MS) {
      const now = await page.evaluate((ms) => {
        window.view.step(ms, 1);
        const w = window.world;
        return w.player.moving
          ? null
          : { pose: w.poses.pose(), facing: w.player.facing, here: w.movement.tile };
      }, FRAME_MS);
      if (now) return now;
    }
    check(`${label} within 20000ms of game time`, false);
    return null;
  };
  /** Which way the rule says she faces something from where she stands. */
  const toward = (
    /** @type {{ tx: number, ty: number }} */ here,
    /** @type {{ tx: number, ty: number, w: number, h: number }} */ box,
  ) => {
    const near = (/** @type {number} */ at, /** @type {number} */ from, /** @type {number} */ n) =>
      Math.min(Math.max(at, from), from + n - 1);
    const dx = near(here.tx, box.tx, box.w) - here.tx;
    const dy = near(here.ty, box.ty, box.h) - here.ty;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'down' : 'up';
  };
  const crouchAt = async (/** @type {string} */ shot, /** @type {string} */ how) => {
    await stepUntil(() => window.world.scene === 'town', 'she is in town');
    const rock = await page.evaluate(() => {
      const here = window.world.movement.tile;
      const far = (/** @type {{ tx: number, ty: number }} */ p) =>
        Math.abs(p.tx - here.tx) + Math.abs(p.ty - here.ty);
      const r = window.world.map.props
        .filter((p) => p.id === 'rock')
        .sort((a, b) => far(a) - far(b))[0];
      return r ? { tx: r.tx, ty: r.ty, w: r.w, h: r.h } : null;
    });
    if (!rock) {
      check('the town has a rock', false);
      return;
    }
    await page.evaluate(() => {
      window.world.player.facing = 'up';
    });
    await tapTile(rock.tx, rock.ty);
    const at = await arrive('she reaches the rock');
    if (!at) return;
    await page.screenshot({ path: `.smoke/${shot}.png` });
    check(
      `${how}, she crouches at a rock she walks up to, turned to it`,
      at.pose === 'crouch' && at.facing === toward(at.here, rock),
      JSON.stringify({ ...at, rock }),
    );
  };

  // Days of their own, so the rocks haven't been chipped this window by another section.
  await openOn('2026-09-30', 13);
  await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
  await crouchAt('verbs-crouch', 'upright');

  // Down to the farm's first bed, tapped twice for real: a look, then a dig.
  await page.evaluate(() => window.world.tapTile(14, 12));
  await stepUntil(() => !window.world.player.moving, 'she reaches the farm gate');
  await closeSheets();
  // One with nothing growing in it, so a visit digs it over (or finds it dug, waiting).
  const bed = await page.evaluate(() =>
    window.world.map.beds.find((b) => !window.world.farm.planting(b)),
  );
  if (!bed) {
    check('the town has a garden bed', false);
    return;
  }
  await page.evaluate(() => {
    window.world.player.facing = 'down';
  });
  await tapTile(bed.tx, bed.ty);
  await page.evaluate(() => window.view.step(10));
  await tapTile(bed.tx, bed.ty);
  const atBed = await arrive('she reaches the bed');
  if (atBed) {
    await page.screenshot({ path: '.smoke/verbs-bed.png' });
    check(
      'she faces a bed she walks up to, and crouches to dig it over',
      atBed.facing === toward(atBed.here, { ...bed, w: 1, h: 1 }) && atBed.pose === 'crouch',
      JSON.stringify({ ...atBed, bed }),
    );
  }
  await closeSheets();

  await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
  await openOn('2026-10-01', 13);
  await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
  await crouchAt('verbs-sideways', 'on its side');
  await page.setViewportSize(PHONE);
  await page.waitForTimeout(300);
  await closeSheets();
}

/**
 * Small delights (1.6's X5, decision 384): standing still in town on a clear day, a butterfly
 * lands on her hat (still, as smoke asks for reduced motion) and is gone as she walks; walking
 * past the scarecrow on her farm, its crow caws; and coming home, her pets trot over to say hello.
 */
async function delights() {
  await openOn('2026-09-27', 13);
  await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
  await stepUntil(() => window.world.scene === 'town', 'she is in town');
  await closeSheets();
  const landed = await stepUntil(
    () => window.view.effects().perched !== null,
    'a butterfly lands on her hat as she stands still',
  );
  await page.screenshot({ path: '.smoke/delights-butterfly.png' });
  if (landed) {
    check(
      'a butterfly lands on her hat as she stands still in town',
      (await page.evaluate(() => window.world.delights.perched())) !== null,
    );
  }

  const scarecrow = await propTile('scarecrow', { nearest: true });
  const by = await page.evaluate((s) => {
    for (let r = 4; r <= 7; r++) {
      for (let ty = s.ty - r; ty <= s.ty + r; ty++) {
        for (let tx = s.tx - r; tx <= s.tx + r; tx++) {
          if (Math.max(Math.abs(tx - s.tx), Math.abs(ty - s.ty)) !== r) continue;
          if (window.world.canWalk(tx, ty)) return { tx, ty };
        }
      }
    }
    return null;
  }, scarecrow);
  if (!by) {
    check('open ground a little way from the scarecrow', false);
    return;
  }
  await walkTo(by);
  check(
    'the butterfly flies off as she walks',
    (await page.evaluate(() => window.view.effects().perched)) === null,
  );
  const near = await page.evaluate((s) => {
    for (let ty = s.ty - 2; ty <= s.ty + 2; ty++) {
      for (let tx = s.tx - 2; tx <= s.tx + 2; tx++) {
        if ((tx !== s.tx || ty !== s.ty) && window.world.canWalk(tx, ty)) return { tx, ty };
      }
    }
    return null;
  }, scarecrow);
  if (near) {
    await walkTo(near);
    await page.evaluate((ms) => window.view.step(ms, 10), FRAME_MS);
    check(
      'the crow on the scarecrow caws as she walks past',
      (await page.evaluate(() => window.view.cawed())) !== null,
    );
    await page.screenshot({ path: '.smoke/delights-caw.png' });
  }
  await tapToastAway();

  await page.evaluate(() => window.world.travel.home());
  await stepUntil(() => window.world.scene === 'home', 'she flies home');
  const greeting = await stepUntil(
    () => window.world.petCare.all.some((p) => p.comingOver === 'greet'),
    'her pets come over to say hello',
    4000,
  );
  check('her pets trot over to say hello as she comes home', greeting);
  await page.evaluate((ms) => window.view.step(ms, 30), FRAME_MS);
  await page.screenshot({ path: '.smoke/delights-home.png' });
  await closeSheets();
  // Back out to town, where the sections after expect to find her.
  await page.evaluate(() => window.world.travel.back());
  await stepUntil(() => window.world.scene === 'town', 'she flies back to town');
}

/** Sends off every toast up, one tap at a time, so the next one read is the next one made. */
async function clearToasts() {
  for (let i = 0; i < 6 && (await page.locator('.hud-toast-shown').count()) > 0; i++) {
    await tapToastAway();
  }
}

/**
 * The wishing well (1.7's Y2, decision 389): walking up to the square's well opens its card, and
 * Toss a Candy takes one, closes the card and gives a wish back as a toast, a ripple over the
 * water. A second visit the same day has nothing to toss.
 */
async function wishingWell() {
  await openOn('2026-10-27', 15);
  await page.evaluate(() => window.world.scene === 'town' || window.world.travel.go('town'));
  await stepUntil(() => window.world.scene === 'town', 'she is in town');
  await closeSheets();
  await clearToasts();
  const before = await page.evaluate(() => window.world.wallet.candy);
  const penny = await page.evaluate(() => window.world.bag.count('wellPenny') === 0);
  const wished = await page.evaluate(() => window.world.well.view().wished);
  await tapProp('well');
  const opened = await stepUntil(
    () => !window.world.player.moving && document.querySelector('.hud-well-sheet') !== null,
    'she walks up to the well and its card opens',
  );
  if (!opened) return;
  await framed('.hud-well-sheet', { picture: true });
  await page.screenshot({ path: '.smoke/well-card.png' });
  if (wished) {
    check(
      'a wish already made today leaves nothing to toss',
      (await page.locator('.hud-well-toss').count()) === 0,
    );
    await closeSheets();
    return;
  }
  await tapElement('.hud-well-toss');
  await page.evaluate((ms) => window.view.step(ms, 8), FRAME_MS);
  check('the card goes as she tosses', (await page.locator('.hud-well-sheet').count()) === 0);
  check(
    'a Candy goes in the well',
    (await page.evaluate(() => window.world.wallet.candy)) === before - 1,
  );
  await page.screenshot({ path: '.smoke/well-wish.png' });
  // A toast before it (a clue the mystery left at the well) is read first, so it waits its turn.
  const wishes = penny ? /lucky penny/ : /well|wish|plink|echo|frog|ghost/i;
  let toast = null;
  for (let i = 0; i < 5 && (await page.locator('.hud-toast-shown').count()) > 0; i++) {
    toast = await page.locator('.hud-toast-shown').textContent();
    if (wishes.test(toast ?? '')) break;
    await tapToastAway();
    await page.evaluate((ms) => window.view.step(ms, 4), FRAME_MS);
  }
  check(
    penny ? 'a wish comes back up, and with the first a lucky penny' : 'a wish comes back up',
    wishes.test(toast ?? ''),
    toast ?? 'no toast',
  );
  await clearToasts();
  await tapProp('well');
  await stepUntil(() => document.querySelector('.hud-well-sheet') !== null, 'the card opens again');
  check(
    'once a day: the card has nothing more to toss',
    (await page.locator('.hud-well-toss').count()) === 0,
  );
  await closeSheets();
}

/**
 * Leaf piles (1.7's Y2): in autumn a pile or two at the trees' feet in town, Whisperwood and Boo
 * Acres; a real tap on one walks her in and she jumps, and it lies flat after.
 */
async function leafPiles() {
  await openOn('2026-10-27', 15);
  /** @type {import('../../src/types/ids').MapZoneId[]} */
  const places = ['town', 'whisperwood', 'booAcres'];
  for (const place of places) {
    await page.evaluate((p) => {
      window.world.atlas.find(p);
      return window.world.scene === p || window.world.travel.go(p);
    }, place);
    await stepUntil(`window.world.scene === ${JSON.stringify(place)}`, `she goes to ${place}`);
    await closeSheets();
    await clearToasts();
    const pile = await page.evaluate((p) => {
      const out = window.world.collecting.critters(p);
      const piles = window.world.leafPiles.piles(p).map((x) => x.pile);
      const free = piles.find((x) => !out.some((c) => c.tx === x.tx && c.ty === x.ty));
      if (!free) return null;
      const beside = window.world.zones.outdoor(p)?.standBeside(free.tx, free.ty)[0];
      if (beside) window.world.movement.standAt(beside, 'down');
      return { tx: free.tx, ty: free.ty, count: piles.length };
    }, place);
    check(
      `two or three leaf piles in ${place}`,
      pile !== null && pile.count >= 2,
      `${pile?.count}`,
    );
    if (!pile) continue;
    // Long enough for the iris into a new place to open.
    await page.evaluate((ms) => window.view.step(ms, 30), FRAME_MS);
    await page.screenshot({ path: `.smoke/leaves-${place}.png` });
    await tapTile(pile.tx, pile.ty);
    const jumped = await stepUntil(
      `window.world.leafPiles.piles(window.world.scene).some((x) => x.flat && x.pile.tx === ${pile.tx} && x.pile.ty === ${pile.ty})`,
      `she jumps in the pile in ${place}`,
    );
    await page.evaluate((ms) => window.view.step(ms, 9), FRAME_MS);
    await page.screenshot({ path: `.smoke/leaves-${place}-jump.png` });
    if (jumped) check(`a tap on a leaf pile in ${place} walks her in, and it lies flat`, true);
    await clearToasts();
  }
  await page.evaluate(() => window.world.travel.go('town'));
  await stepUntil(() => window.world.scene === 'town', 'she goes back to town');
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [
  ['effects', effects],
  ['delights', delights],
  ['wishingWell', wishingWell],
  ['leafPiles', leafPiles],
  ['verbs', verbs],
  ['moves', moves],
  ['taps', taps],
];
