/** The places beyond the town: Whisperwood and the world map, the wilds and the castle, every way out walked, a building gone into, and her broom. */
import {
  PHONE,
  check,
  closeSheets,
  framed,
  goInto,
  goOut,
  nextTapToward,
  page,
  playerTile,
  reloadGame,
  stepUntil,
  tapElement,
  tapFixture,
  tapTile,
  tapToastAway,
} from './lib.mjs';

/**
 * Off the east end of the road into Whisperwood, drawn and faded in; the world map shows it, and
 * takes her home; and a reload keeps her in the woods.
 */
async function zones() {
  await closeSheets();
  await page.evaluate(() => {
    const road = window.world.map.exits.find((e) => e.to === 'whisperwood');
    if (road) window.world.tapTile(road.tx, road.ty);
  });
  const went = await stepUntil(
    () => window.world.scene === 'whisperwood',
    'she walks into the woods',
  );
  if (!went) return;
  // Through an iris, or a fade with less motion asked for, as smoke asks (V1's E4).
  check(
    'the woods fade in from dark',
    await page.evaluate(() => window.view.transition()?.kind === 'iris'),
  );
  await page.evaluate(() => window.view.step(40, 10));
  // Toasts for big moments take turns, so a letter that came just before may be showing first.
  const found = await page
    .waitForFunction(
      () => /Whisperwood/.test(document.querySelector('.hud-toast')?.textContent ?? ''),
      null,
      { timeout: 10_000 },
    )
    .then(() => true)
    .catch(() => false);
  check('finding the woods is a moment', found);
  const painted = await page.evaluate(() => {
    const el = /** @type {HTMLCanvasElement} */ (document.getElementById('game'));
    const px = el.getContext('2d')?.getImageData(el.width >> 1, el.height >> 1, 1, 1).data;
    return px ? px[3] === 255 : false;
  });
  check('the woods are drawn', painted);
  await page.screenshot({ path: '.smoke/whisperwood.png' });

  const crowded = await page.evaluate(() => {
    const purse = document.querySelector('.hud-candy')?.getBoundingClientRect();
    const first = document.querySelector('.hud-settings')?.getBoundingClientRect();
    return purse && first ? purse.right > first.left : true;
  });
  check("the top bar's buttons stay clear of her Candy", !crowded);

  await tapElement('.hud-map-button');
  const pins = await page.locator('.hud-map-place').allTextContents();
  // The town, the woods, and question marks down the ways to the shore, the castle, the
  // fairground and Boo Acres; the hidden clearing is a secret, so not even a question mark.
  check(
    'the map shows the town, the woods and question marks',
    pins.length === 6 && pins.some((p) => p.includes('???')),
    pins.join(' | '),
  );
  const ways = await page.locator('.hud-map-way').allTextContents();
  check(
    'the map lists the ways out of the woods, the town by name',
    ways.length === 3 && ways.some((w) => /West.*McFrancisVille/.test(w)),
    ways.join(' | '),
  );
  // U4: the ways out first, laid round where she is, so the way west is plainly to its left.
  await framed('.hud-map-sheet', { tabs: ['Ways out', 'World'] });
  const compass = await page.evaluate(() => {
    /** @param {string} s */
    const box = (s) => document.querySelector(s)?.getBoundingClientRect();
    const centre = box('.hud-map-centre');
    const west = box('.hud-map-side[data-side="west"] .hud-map-way');
    return {
      here: document.querySelector('.hud-map-centre')?.textContent ?? '',
      west: !!centre && !!west && west.right <= centre.left && west.height >= 44,
    };
  });
  check(
    'the map opens on the ways out, the town to the west of the woods',
    compass.here.includes('Whisperwood') && compass.west,
    JSON.stringify(compass),
  );
  await page.screenshot({ path: '.smoke/map.png' });
  await tapElement('.hud-map-sheet .hud-sheet-tab:text-is("World")');
  await page.screenshot({ path: '.smoke/map-world.png' });
  await tapElement('.hud-map-sheet .hud-sheet-tab:text-is("Ways out")');
  await tapElement('.hud-map-way:has-text("McFrancisVille")');
  await page.evaluate(() => window.view.step(40, 2));
  const home = await page.evaluate(() => ({
    scene: window.world.scene,
    tile: window.world.movement.tile,
    spawn: window.world.map.spawn,
    sheet: !!document.querySelector('.hud-sheet'),
  }));
  check(
    'a tap on the way to town takes her to her door, and the map closes',
    home.scene === 'town' &&
      home.tile.tx === home.spawn.tx &&
      home.tile.ty === home.spawn.ty &&
      !home.sheet,
    JSON.stringify(home),
  );

  await page.evaluate(() => window.world.travel.go('whisperwood'));
  await page.evaluate(() => window.view.step(40, 2));
  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  check(
    'a reload keeps her in the woods',
    (await page.evaluate(() => window.world.scene)) === 'whisperwood',
  );
  await page.evaluate(() => window.world.travel.go('town'));
  await page.evaluate(() => window.view.step(40, 2));
}

/**
 * The places beyond the town (phase I): the castle gate shut at the lookout with its hint, the
 * shore, the hidden clearing with the key dug up from its mound, and through the gate to the
 * castle once it opens.
 */
async function places() {
  await closeSheets();
  await page.evaluate(() => window.world.travel.go('town'));
  await page.evaluate(() => window.view.step(40, 2));
  check(
    'the castle gate stands open from the first day',
    await page.evaluate(() => window.world.canWalk(28, 1)),
  );

  // The frozen creek (phase B1): she has her skates from the first day (decision 211), so only
  // smoke takes them away to see her slide back to the bank without them.
  await page.evaluate(() => {
    while (window.world.bag.count('iceSkates') > 0) window.world.bag.remove('iceSkates');
    window.world.travel.cross({ to: 'whisperwood', along: 0 });
    window.world.movement.standAt({ tx: 16, ty: 28 }, 'right');
  });
  await page.evaluate(() => window.view.step(40, 40));
  await tapTile(17, 29);
  await stepUntil(
    () => /slippery/.test(document.querySelector('.hud-toast-shown')?.textContent ?? ''),
    'she slips on the creek without her skates',
  );
  await stepUntil(() => !window.world.player.moving, 'she slides back to the bank');
  const bank = await page.evaluate(() => {
    const t = window.world.movement.tile;
    return { ...t, ice: window.world.zones.map('whisperwood').slippery(t.tx, t.ty) };
  });
  check('she slides back off the ice to the bank', !bank.ice, JSON.stringify(bank));
  await page.screenshot({ path: '.smoke/creek.png' });
  await tapElement('.hud-toast-shown');
  check(
    'a tap on the toast sends it off, and leaves her where she is',
    (await page.locator('.hud-toast-shown').count()) === 0 &&
      !(await page.evaluate(() => window.world.player.moving)),
  );
  await page.evaluate(() => window.world.bag.add('iceSkates', 1));
  await tapTile(17, 29);
  await stepUntil(() => !window.world.player.moving, 'she skates out onto the creek');
  const skating = await page.evaluate(() => window.world.movement.tile);
  check(
    'with her skates she goes out onto the ice',
    skating.tx === 17 && skating.ty === 29,
    JSON.stringify(skating),
  );

  // To the shore with the skates, and a look.
  await page.evaluate(() => window.world.travel.cross({ to: 'lanternShore', along: 0 }));
  await page.evaluate(() => window.view.step(40, 10));
  check(
    'the shore is there past the creek',
    (await page.evaluate(() => window.world.scene)) === 'lanternShore',
  );
  await page.screenshot({ path: '.smoke/shore.png' });

  // Up the hidden way into the clearing, and the key from the ring of toadstools, a keepsake.
  await page.evaluate(() => window.world.travel.cross({ to: 'whisperwood', along: 0 }));
  await page.evaluate(() => window.view.step(40, 4));
  await page.evaluate(() => window.world.travel.cross({ to: 'hiddenClearing', along: 0 }));
  await page.evaluate(() => window.view.step(40, 10));
  await tapTile(8, 11);
  await stepUntil(() => window.world.bag.count('castleKey') > 0, 'she digs up the castle key');
  await page.evaluate(() => window.view.step(40, 10));
  await page.screenshot({ path: '.smoke/clearing.png' });

  // Home by the map, and up through the gate.
  await page.evaluate(() => window.world.travel.go('town'));
  await page.evaluate(() => window.view.step(40, 2));
  await page.evaluate(() => window.world.tapTile(29, 0));
  const up = await stepUntil(
    () => window.world.scene === 'castleHill',
    'she goes up to the castle',
  );
  if (up) {
    await page.evaluate(() => window.view.step(40, 30));
    await page.screenshot({ path: '.smoke/castle.png' });
    await page.evaluate(() => window.world.travel.go('town'));
    await page.evaluate(() => window.view.step(40, 2));
  }

  // Down through the park's gate to the Hollow Fairground (0.2's M1), open from the first day
  // (decision 211), and into the fortune tent by its flap.
  await closeSheets();
  await page.evaluate(() => window.world.tapTile(35, 49));
  const down = await stepUntil(
    () => window.world.scene === 'fairground',
    'she goes down to the fairground',
  );
  if (down) {
    await page.evaluate(() => window.view.step(40, 30));
    await page.screenshot({ path: '.smoke/fairground.png' });
    const tent = await page.evaluate(() => {
      const p = window.world.zones.map('fairground').map.props.find((q) => q.id === 'fortuneTent');
      return p ? { tx: p.tx + 1, ty: p.ty + 1 } : null;
    });
    if (tent) {
      await closeSheets();
      await page.evaluate(
        (t) => window.world.movement.standAt({ tx: t.tx, ty: t.ty + 3 }, 'up'),
        tent,
      );
      await page.evaluate(() => window.view.step(40, 40));
      await tapTile(tent.tx, tent.ty);
      const inside = await stepUntil(
        () => window.world.scene === 'fortuneTent',
        'she goes into the fortune tent',
      );
      if (inside) {
        await page.evaluate(() => window.view.step(40, 20));
        const welcome = (await page.locator('.hud-toast').textContent()) ?? '';
        check('going into the fortune tent says so', /fortune tent/.test(welcome), welcome);
        await page.screenshot({ path: '.smoke/fortune-tent.png' });
      }
    }
    await page.evaluate(() => window.world.travel.go('town'));
    await page.evaluate(() => window.view.step(40, 2));
  }
}

/**
 * Every way out of every place (0.2's C1), walked to from where she starts there with real taps on
 * what's on screen, until she's through it into the place beyond.
 */
async function edges() {
  await closeSheets();
  await page.evaluate(() => {
    window.world.bag.add('iceSkates', 1);
    for (const z of /** @type {const} */ ([
      'whisperwood',
      'lanternShore',
      'hiddenClearing',
      'castleHill',
      'fairground',
      'booAcres',
    ])) {
      window.world.atlas.find(z);
    }
  });
  await page.evaluate(() => window.view.step(40, 2));
  for (const place of /** @type {const} */ ([
    'town',
    'whisperwood',
    'lanternShore',
    'hiddenClearing',
    'castleHill',
    'fairground',
    'booAcres',
  ])) {
    const exits = await page.evaluate(
      (place) => window.world.zones.map(place).map.exits.map((e) => ({ ...e })),
      place,
    );
    for (const exit of exits) {
      await page.evaluate((place) => {
        if (window.world.scene !== place && window.world.travel.go(place)) return;
        if (window.world.scene !== place) window.world.travel.go('town');
        if (window.world.scene !== place) window.world.travel.go(place);
        window.world.movement.standAt(window.world.zones.map(place).map.spawn, 'down');
      }, place);
      await page.evaluate(() => window.view.step(40, 30));
      let taps = 0;
      let through = false;
      let stuck = '';
      while (taps < 30 && !through) {
        const next = await nextTapToward(exit);
        // A toast over the way goes at a tap, as she'd send it off to see past it.
        if (typeof next === 'string' && next.includes('hud-toast')) {
          await tapToastAway();
          taps++;
          continue;
        }
        if (next === null || typeof next === 'string') {
          stuck = `from ${JSON.stringify(await playerTile())}: ${next ?? 'no way'}`;
          break;
        }
        await page.touchscreen.tap(next.x, next.y);
        taps++;
        for (let i = 0; i < 200; i++) {
          await page.evaluate(() => window.view.step(40, 5));
          const now = await page.evaluate(() => ({
            scene: window.world.scene,
            moving: window.world.player.moving,
          }));
          if (now.scene !== place || !now.moving) break;
        }
        await closeSheets();
        through = (await page.evaluate(() => window.world.scene)) === exit.to;
      }
      check(
        `from where she starts in ${place}, taps on what she can see take her to ${exit.to}`,
        through,
        through ? `taps: ${taps}` : stuck || `taps: ${taps}`,
      );
      if (through && place === 'whisperwood' && exit.to === 'hiddenClearing') {
        await page.screenshot({ path: '.smoke/edges-clearing.png' });
      }
    }
  }
  await lakeRing();
  await page.evaluate(() => window.world.travel.go('town'));
  await page.evaluate(() => window.view.step(40, 2));
}

/**
 * Round Lantern Shore's lake (0.3's F0, decisions 217 and 240): from where she comes in, with no
 * skates, by real taps round the south shore and up the west bank past the beds to the top of the
 * wood, then on her skates over the creek back to where she began, the ring closed.
 */
async function lakeRing() {
  await page.evaluate(() => {
    if (window.world.scene !== 'lanternShore') window.world.travel.go('lanternShore');
    window.world.movement.standAt(window.world.zones.map('lanternShore').map.spawn, 'down');
    while (window.world.bag.remove('iceSkates'));
  });
  await page.evaluate(() => window.view.step(40, 30));
  const spawn = await page.evaluate(() => window.world.zones.map('lanternShore').map.spawn);
  for (const [to, label, skates] of /** @type {const} */ ([
    [{ tx: 2, ty: 21 }, 'round the south shore to the beds on the west bank', false],
    [{ tx: 3, ty: 5 }, 'on up the west bank to the top of the wood', false],
    [spawn, 'and on her skates over the creek, back where she began', true],
  ])) {
    if (skates) await page.evaluate(() => window.world.bag.add('iceSkates', 1));
    let taps = 0;
    let stuck = '';
    let here = await playerTile();
    while (taps < 30 && (here.tx !== to.tx || here.ty !== to.ty)) {
      const next = await nextTapToward({ ...to, w: 1, h: 1, onFoot: true });
      if (typeof next === 'string' && next.includes('hud-toast')) {
        await tapToastAway();
        taps++;
        continue;
      }
      if (next === null || typeof next === 'string') {
        stuck = `from ${JSON.stringify(here)}: ${next ?? 'no way'}`;
        break;
      }
      await page.touchscreen.tap(next.x, next.y);
      taps++;
      await stepUntil(() => !window.world.player.moving, `walking ${label}`);
      await closeSheets();
      here = await playerTile();
    }
    const there = here.tx === to.tx && here.ty === to.ty;
    check(`at Lantern Shore she walks ${label}`, there, there ? `taps: ${taps}` : stuck);
    if (to.ty === 21) await page.screenshot({ path: '.smoke/lake-ring.png' });
    if (!there) break;
  }
  await page.evaluate(() => {
    if (window.world.bag.count('iceSkates') === 0) window.world.bag.add('iceSkates', 1);
  });
}

/** Round Cody's manor: going in by the door, what's there, a keepsake, and back out. */
async function interiors() {
  if (!(await goInto('codyHouse', 'codyManor'))) return;
  const welcome = (await page.locator('.hud-toast').textContent()) ?? '';
  check("going into Cody's manor says so", /Cody's manor/.test(welcome), welcome);
  await page.screenshot({ path: '.smoke/manor.png' });
  await tapFixture('pipeOrgan');
  const organ = (await page.locator('.hud-toast').textContent()) ?? '';
  check('walking up to the pipe organ gets a line from it', /love song/.test(organ), organ);
  const settee = await page.evaluate(() => {
    const room = window.world.zones.inside(window.world.scene);
    const thing = room?.things.find((t) => 'piece' in t && t.piece.id === 'velvetSettee');
    return thing && 'piece' in thing ? { tx: thing.piece.tx, ty: thing.piece.ty } : null;
  });
  if (settee) {
    await tapTile(settee.tx, settee.ty);
    await stepUntil(() => !window.world.player.moving, 'she reaches the settee');
    await page.evaluate(() => window.view.step(40, 20));
    const said = (await page.locator('.hud-toast').textContent()) ?? '';
    // Married to him from the first day (V1's P5), his keepsakes are hers to have at once.
    check("a keepsake of her husband's is hers to have at once", /you can have/.test(said), said);
    // It's a seat too (0.2's G1): she sits on it, drawn on it, and a tap stands her up again.
    const sat = await page.evaluate(() => ({
      seat: window.world.sitting.seat,
      drawn: window.view.playerDrawnAt(),
      pose: window.world.poses.pose(),
    }));
    check('she sits on the settee', sat.seat !== null && sat.pose === 'sit', JSON.stringify(sat));
    await page.screenshot({ path: '.smoke/sitting.png' });
    await tapTile(settee.tx, settee.ty + 2);
    await page.evaluate(() => window.view.step(40, 2));
    const up = await page.evaluate(() => ({
      seat: window.world.sitting.seat,
      moving: window.world.player.moving,
    }));
    check('a tap stands her up, and only that', up.seat === null && !up.moving, JSON.stringify(up));
  }
  await goOut();
  const out = await page.evaluate(() => {
    const manor = window.world.map.props.find((p) => p.id === 'codyHouse');
    const here = window.world.movement.tile;
    return window.world.scene === 'town' && !!manor && here.ty === manor.ty + manor.h;
  });
  check("the mat takes her back out in front of Cody's door", out);
}

/**
 * Her broom (0.2's P1): Agatha's letter brings it and sets its stand out by her mat; a tap on the
 * quick bar swoops her home from the castle hill, and the stand flies her back to the same tile.
 */
async function broom() {
  await closeSheets();
  await page.evaluate(() => {
    const w = window.world;
    const day = new Date().toISOString().slice(0, 10);
    w.mailbox.post('broom:1', day);
    w.mailbox.open('broom:1');
    w.atlas.find('castleHill');
  });
  check(
    "Agatha's letter brings her broom, and its stand by her mat",
    await page.evaluate(
      () => window.world.broom.has && window.world.home.placed.some((p) => p.id === 'broomStand'),
    ),
  );
  await page.evaluate(() => window.view.step(40));
  await closeSheets();
  await page.evaluate(() => window.world.travel.go('castleHill'));
  await page.evaluate(() => window.view.step(40, 5));
  await closeSheets();
  // A few steps up the hill, somewhere that isn't where the hill is first come to.
  const spot = await page.evaluate(() => {
    const entry = window.world.zone.entry(null).tile;
    const map = window.world.map;
    for (let d = 3; d < 12; d++) {
      for (const [dx, dy] of [
        [0, -d],
        [d, 0],
        [-d, 0],
        [0, d],
      ]) {
        const tx = entry.tx + (dx ?? 0);
        const ty = entry.ty + (dy ?? 0);
        if (
          tx > 0 &&
          ty > 0 &&
          tx < map.width - 1 &&
          ty < map.height - 1 &&
          window.world.zone.canWalk(tx, ty)
        ) {
          return { tx, ty };
        }
      }
    }
    return entry;
  });
  await page.evaluate((t) => window.world.tapTile(t.tx, t.ty), spot);
  await stepUntil(() => !window.world.player.moving, 'she walks up the hill');
  const left = await page.evaluate(() => window.world.snapshot());

  const slot = await page.locator('.hud-quick-broom').boundingBox();
  check(
    'her broom is on the quick bar, a full thumb and in the bottom bar',
    !!slot && slot.width >= 44 && slot.y + slot.height <= PHONE.height,
    JSON.stringify(slot),
  );
  await tapElement('.hud-quick-broom');
  await stepUntil(() => window.world.scene === 'home', 'she swoops home');
  await page.evaluate(() => window.view.step(40, 3));
  const landed = await page.evaluate(() => {
    const mat = window.world.home.room.mat;
    const at = window.world.movement.tile;
    return at.tx === mat.tx && at.ty === mat.ty;
  });
  check('a tap on it swoops her home, onto her mat', landed);
  await page.screenshot({ path: '.smoke/broom-home.png' });

  const stand = await page.evaluate(
    () => window.world.home.placed.find((p) => p.id === 'broomStand') ?? null,
  );
  if (!stand) return;
  await tapTile(stand.tx, stand.ty);
  await stepUntil(() => !window.world.player.moving, 'she walks up to her broom');
  await page.evaluate(() => window.view.step(40));
  const sheet = await page.locator('.hud-broom-sheet').count();
  check('walking up to the stand opens her broom', sheet === 1);
  if (sheet === 0) return;
  await framed('.hud-broom-sheet', { picture: true });
  await tapElement('.hud-broom-sheet .hud-swatch[aria-label="Teal"]');
  check(
    'its ribbon is hers to colour',
    (await page.evaluate(() => window.world.broom.look.ribbon)) === 'teal',
  );
  await page.screenshot({ path: '.smoke/broom-sheet.png' });
  const back = (await page.locator('.hud-broom-sheet .hud-sheet-line').textContent()) ?? '';
  check('it offers to fly her back to where she left', /Castle/.test(back), back);
  await tapElement('.hud-broom-sheet .hud-sheet-actions .hud-primary');
  await stepUntil(() => window.world.scene === 'castleHill', 'she flies back up the hill');
  await page.evaluate(() => window.view.step(40, 3));
  const returned = await page.evaluate(() => window.world.snapshot());
  check(
    'and flies her back to the very tile she left',
    JSON.stringify(returned) === JSON.stringify(left),
    `${JSON.stringify(left)} -> ${JSON.stringify(returned)}`,
  );
  await page.evaluate(() => window.world.travel.go('town'));
  await page.evaluate(() => window.view.step(40, 2));
  await closeSheets();
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [
  ['zones', zones],
  ['places', places],
  ['edges', edges],
  ['interiors', interiors],
  ['broom', broom],
];
