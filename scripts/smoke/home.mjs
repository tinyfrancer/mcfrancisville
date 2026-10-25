/** Her home: decorating, the chest, display pieces, things on tables, the workbench, the back room, her yard, the stove and window wallpaper. */
import {
  FRAME_MS,
  PHONE,
  PLAIN_DAY,
  check,
  clearMat,
  closeSheets,
  framed,
  openOn,
  page,
  playerTile,
  reloadGame,
  stepUntil,
  tapElement,
  tapProp,
  tapTile,
  walkTo,
} from './lib.mjs';

async function home() {
  // Her house is the plum one top-left, and walking up to it goes in through the door with the bat.
  await tapProp('homeHouse');
  await stepUntil(() => window.world.scene === 'home', 'she goes in her front door');
  await page.evaluate(() => window.view.step(40));
  await page.screenshot({ path: '.smoke/home.png' });
  const decorate = await page.locator('.hud-decorate').boundingBox();
  check(
    'at home, the Decorate button is a full thumb and on screen',
    !!decorate && decorate.width >= 44 && decorate.x + decorate.width <= PHONE.width,
    JSON.stringify(decorate),
  );

  await tapElement('.hud-decorate');
  // Duckworth & Duckworth, under their dome by the wall, picked up and set down with real taps.
  await tapTile(8, 3);
  const picked = await page.evaluate(() => window.world.decorating.state?.selected?.id);
  check('a tap while decorating picks a piece up', picked === 'twoHeadedDuck', String(picked));
  await tapTile(9, 9);
  await tapElement('.hud-decor-bar button:text-is("↻ Turn")');
  await page.evaluate(() => window.view.step(40));
  const moved = await page.evaluate(() => window.world.home.rooms.pieceAt(9, 9));
  check(
    'the next tap puts it down there, and Turn turns it',
    moved?.id === 'twoHeadedDuck' && moved.turn === 1,
    JSON.stringify(moved),
  );
  await page.screenshot({ path: '.smoke/decorate.png' });
  const bar = await page.locator('.hud-decor-bar').boundingBox();
  check(
    'the decorating bar sits on screen above the home bar',
    !!bar && bar.y + bar.height <= PHONE.height && bar.height >= 44,
    JSON.stringify(bar),
  );

  await tapElement('.hud-decor-bar button:text-is("Put away")');
  await tapElement('.hud-decor-bar button:text-is("Walls & floors")');
  await framed('.hud-surfaces-sheet', { tabs: ['Wallpaper', 'Flooring'] });
  await tapElement('.hud-surfaces-sheet .hud-done');
  await tapElement('.hud-decor-bar button:text-is("Storage")');
  await framed('.hud-storage-sheet', { tabs: ['Furniture', 'Items'] });
  await page.screenshot({ path: '.smoke/storage.png' });
  await tapElement('.hud-storage-sheet button:text-is("Put out") >> nth=0');
  const out = await page.evaluate(() => window.world.decorating.state?.selected?.id);
  check('the storage chest puts a piece out beside her, picked up', !!out, String(out));
  await tapElement('.hud-decor-bar button:text-is("Done")');
  check('Done stops decorating', await page.evaluate(() => window.world.decorating.state === null));

  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const after = await page.evaluate(() => ({
    scene: window.world.scene,
    duck: window.world.home.stored.some((s) => s.id === 'twoHeadedDuck'),
  }));
  check(
    'after a reload she is still at home, with the duck put away where she left it',
    after.scene === 'home' && after.duck,
    JSON.stringify(after),
  );

  await tapTile(6, 13);
  await stepUntil(() => window.world.scene === 'town', 'she goes out of her door');
  const outside = await playerTile();
  const spawn = await page.evaluate(() => window.world.map.spawn);
  check(
    'the door mat takes her back out to her front step',
    outside.tx === spawn.tx && outside.ty === spawn.ty,
    JSON.stringify(outside),
  );
}

/** 0.3's H1: a stack from her bag put away in her storage chest, and taken back out, by taps. */
async function chest() {
  await page.evaluate(() => window.world.bag.add('stone', 3));
  const had = await page.evaluate(() => window.world.bag.count('stone'));
  await tapProp('homeHouse');
  await stepUntil(() => window.world.scene === 'home', 'she goes in to put things away');
  await page.evaluate(() => window.view.step(40));
  await tapElement('.hud-bag-button');
  await tapElement('.hud-bag-sheet .hud-slot[aria-label^="Stone,"]');
  await tapElement('.hud-bag-sheet .hud-put-all');
  const away = await page.evaluate(() => ({
    bag: window.world.bag.count('stone'),
    chest: window.world.chest.items.find((s) => s.id === 'stone')?.count ?? 0,
  }));
  check(
    "at home, the bag's Put away all puts the whole stack in her chest",
    away.bag === 0 && away.chest === had,
    JSON.stringify(away),
  );
  await page.screenshot({ path: '.smoke/chest-put-away.png' });
  await tapElement('.hud-bag-sheet .hud-done');

  // Walking up to the chest in its corner (`CHEST` in `src/data/home.ts`) opens it, and its Items
  // tab has the stack to take back out.
  await tapTile(0, 3);
  await stepUntil(
    () => document.querySelector('.hud-storage-sheet') !== null,
    'walking up to the chest opens it',
  );
  await tapElement('.hud-storage-sheet .hud-sheet-tab:text-is("Items")');
  await tapElement('.hud-storage-sheet .hud-slot[aria-label^="Stone,"]');
  await page.screenshot({ path: '.smoke/chest-items.png' });
  await tapElement('.hud-storage-sheet .hud-take-all');
  const back = await page.evaluate(() => ({
    bag: window.world.bag.count('stone'),
    chest: window.world.chest.items.length,
  }));
  check(
    "the chest's Items tab takes the whole stack back out into her bag",
    back.bag === had && back.chest === 0,
    JSON.stringify(back),
  );
  await tapElement('.hud-storage-sheet .hud-done');

  // One put away stays put away across a reload.
  await tapElement('.hud-bag-button');
  await tapElement('.hud-bag-sheet .hud-slot[aria-label^="Stone,"]');
  await tapElement('.hud-bag-sheet .hud-put-away');
  await tapElement('.hud-bag-sheet .hud-done');
  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const kept = await page.evaluate(() => window.world.chest.items);
  check(
    'what she put away is still in her chest after a reload',
    JSON.stringify(kept) === JSON.stringify([{ id: 'stone', count: 1 }]),
    JSON.stringify(kept),
  );
  await clearMat();
  const mat = await page.evaluate(() => window.world.home.rooms.room.mat);
  await tapTile(mat.tx, mat.ty);
  await stepUntil(() => window.world.scene === 'town', 'she goes back out');
}

/** 0.3's H2: a moth put in a bell jar from her bag, and taken out again, by taps. */
async function display() {
  await tapProp('homeHouse');
  await stepUntil(() => window.world.scene === 'home', 'she goes in to her bell jar');
  // A bell jar of her own out beside her, and a luna moth in her bag, as if she'd been busy.
  const jar = await page.evaluate(() => {
    window.world.bag.add('lunaMoth', 1);
    window.world.home.store('bellJar');
    window.world.decorating.takeOut('bellJar');
    window.world.decorating.stop();
    let placed = window.world.home.rooms.placed.find((p) => p.id === 'bellJar');
    // A neighbour visiting may stand where it came out (Nessa, some afternoons), and a tap there
    // is a hello: it goes on the nearest tile with nobody on it.
    const busy = (/** @type {{ tx: number, ty: number }} */ t) =>
      !!window.world.neighbourhood.villagerAt(t.tx, t.ty) ||
      !!window.world.petCare.petAt(t.tx, t.ty);
    const me = window.world.movement.tile;
    for (let r = 1; placed && busy(placed) && r <= 4; r++) {
      for (let dy = -r; dy <= r && placed && busy(placed); dy++) {
        for (let dx = -r; dx <= r && placed && busy(placed); dx++) {
          const to = { tx: me.tx + dx, ty: me.ty + dy };
          if (busy(to)) continue;
          window.world.home.rooms.move(placed, to.tx, to.ty, me);
          placed = window.world.home.rooms.placed.find((p) => p.id === 'bellJar');
        }
      }
    }
    return { tx: placed?.tx ?? 0, ty: placed?.ty ?? 0 };
  });
  await page.evaluate(() => window.view.step(40));
  const had = await page.evaluate(() => window.world.bag.count('lunaMoth'));
  await tapTile(jar.tx, jar.ty);
  const went = await page.evaluate(
    (j) => ({
      moving: window.world.player.moving,
      at: window.world.movement.tile,
      jar: j,
      pet: !!window.world.petCare.petAt(j.tx, j.ty),
      cam: window.view.cameraOrigin(),
      client: window.view.tileToClient(j.tx, j.ty),
      canvas: document.getElementById('game')?.getBoundingClientRect().toJSON(),
      toast: document.querySelector('.hud-toast-shown')?.getBoundingClientRect().toJSON() ?? null,
    }),
    jar,
  );
  const opened = await stepUntil(
    () => document.querySelector('.hud-display-sheet') !== null,
    'walking up to the bell jar opens it',
  );
  if (!opened) check('where the tap on the bell jar went', false, JSON.stringify(went));
  await framed('.hud-display-sheet', { picture: true });
  await tapElement('.hud-display-sheet .hud-slot[aria-label^="Luna moth,"]');
  await tapElement('.hud-display-sheet .hud-show-it');
  const shown = await page.evaluate(() => ({
    shows: window.world.home.rooms.placed.find((p) => p.id === 'bellJar')?.shows,
    bag: window.world.bag.count('lunaMoth'),
  }));
  check(
    'the bell jar takes the luna moth from her bag and shows it',
    shown.shows === 'lunaMoth' && shown.bag === had - 1,
    JSON.stringify(shown),
  );
  await page.screenshot({ path: '.smoke/display-jar.png' });
  await tapElement('.hud-display-sheet .hud-take-out');
  const back = await page.evaluate(() => ({
    shows: window.world.home.rooms.placed.find((p) => p.id === 'bellJar')?.shows ?? null,
    bag: window.world.bag.count('lunaMoth'),
  }));
  check(
    "the bell jar's Take it out puts the moth back in her bag",
    back.shows === null && back.bag === had,
    JSON.stringify(back),
  );
  await tapElement('.hud-display-sheet .hud-done');
  await page.evaluate(() => window.view.step(40));
  await page.screenshot({ path: '.smoke/display-room.png' });
  // As she was, for the sections after: the museum wants her own catch, and the room its floor.
  await page.evaluate(() => {
    window.world.bag.remove('lunaMoth', 1);
    const jar = window.world.home.rooms.placed.find((p) => p.id === 'bellJar');
    if (jar) window.world.home.rooms.putAway(jar);
  });
  await clearMat();
  const mat = await page.evaluate(() => window.world.home.rooms.room.mat);
  await tapTile(mat.tx, mat.ty);
  await stepUntil(() => window.world.scene === 'town', 'she goes back out');
}

/** 0.3's H3: a skull mug put on a side table, the table moved with the mug on it, by taps. */
async function tabletop() {
  await tapProp('homeHouse');
  await stepUntil(() => window.world.scene === 'home', 'she goes in to her side table');
  // A side table and a skull mug of her own, as if she'd been shopping; the table out, picked up.
  await page.evaluate(() => {
    window.world.home.store('sideTable');
    window.world.home.store('skullMug');
    window.world.decorating.takeOut('sideTable');
  });
  await page.evaluate(() => window.view.step(40));
  await tapTile(8, 9);
  const table = await page.evaluate(() => window.world.home.rooms.pieceAt(8, 9)?.id);
  check('a tap while decorating puts the side table down', table === 'sideTable', String(table));
  await page.evaluate(() => window.world.decorating.takeOut('skullMug'));
  await page.evaluate(() => window.view.step(40));
  await tapTile(8, 9);
  const mug = await page.evaluate(() => window.world.home.rooms.pieceAt(8, 9));
  check(
    'a tap on the table with the mug picked up stands the mug on it',
    mug?.id === 'skullMug' && mug.on === true,
    JSON.stringify(mug),
  );
  await page.evaluate(() => window.view.step(40));
  await page.screenshot({ path: '.smoke/tabletop-mug.png' });
  // The mug again is the table under it, and the next tap carries both.
  await tapTile(8, 9);
  const picked = await page.evaluate(() => window.world.decorating.state?.selected?.id);
  check(
    'a tap on the mug again picks up the table under it',
    picked === 'sideTable',
    String(picked),
  );
  await tapTile(4, 10);
  const moved = await page.evaluate(() =>
    window.world.home.rooms.placed.filter((p) => p.id === 'sideTable' || p.id === 'skullMug'),
  );
  check(
    'the table moves, and the mug goes with it',
    moved.length === 2 && moved.every((p) => p.tx === 4 && p.ty === 10),
    JSON.stringify(moved),
  );
  await tapElement('.hud-decor-bar button:text-is("Done")');
  await page.evaluate(() => window.view.step(40));
  await page.screenshot({ path: '.smoke/tabletop-moved.png' });

  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const kept = await page.evaluate(() => window.world.home.rooms.pieceAt(4, 10));
  check(
    'after a reload the mug is still on its table',
    kept?.id === 'skullMug' && kept.on === true,
    JSON.stringify(kept),
  );
  // Putting the table away puts the mug away with it, for the sections after.
  await page.evaluate(() => {
    const t = window.world.home.rooms.placed.find((p) => p.id === 'sideTable');
    window.world.decorating.start(t ?? null);
  });
  await tapElement('.hud-decor-bar button:text-is("Put away")');
  const away = await page.evaluate(() =>
    ['sideTable', 'skullMug'].every((id) => window.world.home.stored.some((s) => s.id === id)),
  );
  check('the table goes in the chest with the mug', away);
  await tapElement('.hud-decor-bar button:text-is("Done")');
  await clearMat();
  const mat = await page.evaluate(() => window.world.home.rooms.room.mat);
  await tapTile(mat.tx, mat.ty);
  await stepUntil(() => window.world.scene === 'town', 'she goes back out');
}

async function craft() {
  await tapProp('homeHouse');
  await stepUntil(() => window.world.scene === 'home', 'she goes in to her workbench');
  // Enough for a stump stool and the first extension, as if she had been busy with the trees.
  await page.evaluate(() => {
    window.world.bag.add('wood', 66);
    window.world.bag.add('stone', 20);
  });
  await tapTile(5, 3);
  await stepUntil(
    () => document.querySelector('.hud-craft-sheet') !== null,
    'walking up to the workbench opens it',
  );
  await page.screenshot({ path: '.smoke/workbench.png' });
  await framed('.hud-craft-sheet');
  await tapElement('.hud-craft-sheet .hud-tabs button:text-is("Furniture")');
  await tapElement('.hud-craft-sheet button[aria-label="Make Stump stool"]');
  const stool = await page.evaluate(() =>
    window.world.home.stored.some((s) => s.id === 'stumpStool'),
  );
  check('the workbench makes a stump stool into her storage chest', stool);

  await tapElement('.hud-craft-sheet .hud-tabs button:text-is("Home")');
  await page.screenshot({ path: '.smoke/workbench-home.png' });
  await tapElement('.hud-craft-sheet button[aria-label="Make Roomy extension"]');
  const size = await page.evaluate(() => window.world.home.rooms.room.size);
  check('the roomy extension builds her house bigger', size === 1, String(size));
  await tapElement('.hud-craft-sheet button:text-is("Done")');
  await page.evaluate(() => window.view.step(40));
  await page.screenshot({ path: '.smoke/bigger-home.png' });

  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const after = await page.evaluate(() => window.world.home.rooms.room.size);
  check('after a reload her house is still the bigger size', after === 1, String(after));
  await clearMat();
  const mat = await page.evaluate(() => window.world.home.rooms.room.mat);
  await tapTile(mat.tx, mat.ty);
  await stepUntil(() => window.world.scene === 'town', 'she goes out of her new front door');
}

/**
 * 0.3's H4: her back room, built at the workbench, gone into through the arch by a real tap, a
 * piece put down there, and still there, with her in it, after a reload.
 */
async function backRoom() {
  await tapProp('homeHouse');
  await stepUntil(() => window.world.scene === 'home', 'she goes in to build her back room');
  await page.evaluate(() => {
    window.world.bag.add('wood', 80);
    window.world.bag.add('stone', 30);
  });
  await tapTile(5, 3);
  await stepUntil(
    () => document.querySelector('.hud-craft-sheet') !== null,
    'walking up to the workbench opens it',
  );
  await tapElement('.hud-craft-sheet .hud-tabs button:text-is("Home")');
  await tapElement('.hud-craft-sheet button[aria-label="Make Back room"]');
  const built = await page.evaluate(() => window.world.home.rooms.built);
  check('the workbench builds her a back room', built.includes('back'), JSON.stringify(built));
  await tapElement('.hud-craft-sheet button:text-is("Done")');
  await page.evaluate(() => window.view.step(40));
  await page.screenshot({ path: '.smoke/back-doorway.png' });

  // A tap on the arch walks her onto the doorway under it, and through.
  const way = await page.evaluate(
    () => window.world.home.rooms.room.doorways[0] ?? { tx: 1, ty: 3 },
  );
  await tapTile(way.tx, way.ty - 1);
  await stepUntil(
    () => window.world.home.rooms.here === 'back',
    'a tap on the arch takes her through',
  );
  const inside = await page.evaluate(() => ({
    scene: window.world.scene,
    width: window.world.home.rooms.room.width,
  }));
  check(
    'she is in her back room, at home still',
    inside.scene === 'home' && inside.width === 11,
    JSON.stringify(inside),
  );
  // A cauldron of her own, as if she'd been shopping, put down with a real tap.
  await page.evaluate(() => {
    window.world.home.store('cauldron');
    window.world.decorating.takeOut('cauldron');
  });
  await page.evaluate(() => window.view.step(40));
  await tapTile(3, 5);
  const placed = await page.evaluate(() => window.world.home.rooms.pieceAt(3, 5)?.id);
  check('a tap puts a piece down in the back room', placed === 'cauldron', String(placed));
  await tapElement('.hud-decor-bar button:text-is("Done")');
  await page.evaluate(() => window.view.step(40));
  await page.screenshot({ path: '.smoke/back-room.png' });

  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const after = await page.evaluate(() => ({
    here: window.world.home.rooms.here,
    piece: window.world.home.rooms.pieceAt(3, 5)?.id,
  }));
  check(
    'after a reload she is in her back room, with the cauldron where she put it',
    after.here === 'back' && after.piece === 'cauldron',
    JSON.stringify(after),
  );

  // Its mat goes back through to the front room, onto the doorway, and that mat out.
  await clearMat();
  const mat = await page.evaluate(() => window.world.home.rooms.room.mat);
  await tapTile(mat.tx, mat.ty);
  await stepUntil(
    () => window.world.home.rooms.here === 'main',
    'the back room mat takes her back',
  );
  const front = await playerTile();
  check(
    'back through, she stands in the doorway',
    front.tx === way.tx && front.ty === way.ty,
    JSON.stringify(front),
  );
  await clearMat();
  const door = await page.evaluate(() => window.world.home.rooms.room.mat);
  await tapTile(door.tx, door.ty);
  await stepUntil(() => window.world.scene === 'town', 'she goes out of her front door');
}

/**
 * 0.3's H5: her yard. From the ☰ tray while she stands in it, a garden bench out of her chest and
 * put down on the lawn by real taps, walked round, and still there after a reload.
 */
async function yard() {
  await page.evaluate(() => window.world.home.store('gardenBench'));
  await walkTo({ tx: 4, ty: 11 });
  // On the real clock a neighbour may be calling on her, stood on that very tile: she walks up
  // and says hello (1.3's V1.3 met Hazel there on 25 October), so the talk is put away first.
  await closeSheets();
  await tapElement('.hud-decorate-yard');
  const outdoors = await page.evaluate(() => window.world.decorating.outdoors);
  check('the tray’s Decorate starts decorating her yard', outdoors);
  await tapElement('.hud-decor-bar button:text-is("Storage")');
  await tapElement('.hud-storage-sheet button[aria-label="Put out Garden bench"]');
  const out = await page.evaluate(() => window.world.decorating.state?.selected?.id);
  check('her chest puts the garden bench out in her yard', out === 'gardenBench', String(out));
  await page.evaluate(() => window.view.step(40));
  await tapTile(7, 13);
  const placed = await page.evaluate(() =>
    [window.world.yard.pieceAt(6, 13)?.id, window.world.yard.pieceAt(7, 13)?.id].join(','),
  );
  check('a tap puts the bench down on the lawn', placed === 'gardenBench,gardenBench', placed);
  await tapElement('.hud-decor-bar button:text-is("Done")');
  await page.evaluate(() => window.view.step(40));
  await page.screenshot({ path: '.smoke/yard-bench.png' });

  // From one end of it to the far side: round it, never through it.
  await walkTo({ tx: 5, ty: 13 });
  await tapTile(8, 12);
  /** @type {string[]} */
  const trod = [];
  for (let spent = 0; spent < 20_000; spent += FRAME_MS) {
    const t = await playerTile();
    trod.push(`${t.tx},${t.ty}`);
    if (!(await page.evaluate(() => window.world.player.moving))) break;
    await page.evaluate((ms) => window.view.step(ms, 1), FRAME_MS);
  }
  const end = await playerTile();
  check(
    'she walks round the bench, never through it',
    end.tx === 8 && end.ty === 12 && !trod.includes('6,13') && !trod.includes('7,13'),
    [...new Set(trod)].join(' '),
  );

  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const kept = await page.evaluate(() => window.world.yard.pieceAt(7, 13)?.id);
  check('after a reload the bench is still in her yard', kept === 'gardenBench', String(kept));
  // Back in the chest, for the sections after.
  await page.evaluate(() => {
    const bench = window.world.yard.placed.find((p) => p.id === 'gardenBench');
    window.world.decorating.start(bench ?? null);
  });
  await tapElement('.hud-decor-bar button:text-is("Put away")');
  await tapElement('.hud-decor-bar button:text-is("Done")');
  const away = await page.evaluate(() => window.world.yard.placed.length === 0);
  check('the bench goes back in her chest', away);
}

/** Her stove (phase R): cooking a dish, eating it from her bag, and its spring in her step. */
async function cook() {
  await tapProp('homeHouse');
  await stepUntil(() => window.world.scene === 'home', 'she goes in to her stove');
  await page.evaluate(() => window.world.bag.add('pumpkin', 2));
  const stove = await page.evaluate(() =>
    window.world.home.rooms.placed.find((p) => p.id === 'stove'),
  );
  if (!stove) throw new Error('her stove is not in her home');
  await tapTile(stove.tx, stove.ty);
  await stepUntil(
    () => document.querySelector('.hud-stove-sheet') !== null,
    'walking up to the stove opens it',
  );
  await page.screenshot({ path: '.smoke/stove.png' });
  await framed('.hud-stove-sheet');
  await tapElement('.hud-stove-sheet button[aria-label="Cook Pumpkin soup"]');
  const soup = await page.evaluate(() => window.world.bag.count('pumpkinSoup'));
  check('the stove cooks pumpkin soup into her bag', soup === 1, String(soup));
  const said = (await page.locator('.hud-stove-sheet .hud-message').textContent()) ?? '';
  check('the stove says what she cooked', /Pumpkin soup, cooked/.test(said), said);
  await tapElement('.hud-stove-sheet button:text-is("Done")');

  await tapElement('.hud-bag-button');
  await tapElement('.hud-bag .hud-slot[aria-label^="Pumpkin soup"]');
  // 0.3's A4: the card says what eating it does before she does.
  const eats = (await page.locator('.hud-bag-sheet .hud-item-card .hud-eats').textContent()) ?? '';
  check(
    "the soup's card says what eating it does",
    eats === 'Eat it: a spring in your step till the window turns.',
    eats,
  );
  await page.screenshot({ path: '.smoke/eat-card.png' });
  check(
    'no meal chip in the top bar before she eats',
    !(await page.locator('.hud-top .hud-meal').isVisible()),
  );
  await tapElement('.hud-bag-sheet .hud-eat');
  const ate = (await page.locator('.hud-bag-sheet .hud-detail p').first().textContent()) ?? '';
  const pace = await page.evaluate(() => window.world.kitchen.pace());
  check('eating the soup puts a spring in her step', pace > 1 && /spring/.test(ate), ate);
  await page.screenshot({ path: '.smoke/ate.png' });
  await tapElement('.hud-bag-sheet button:text("Done")');
  await mealChip('upright');
  await tapElement('.hud-top .hud-meal');
  const told = (await page.locator('.hud-toast').textContent()) ?? '';
  check(
    'a tap on the chip says what the soup is doing',
    /spring in your step till/.test(told),
    told,
  );

  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const after = await page.evaluate(() => window.world.kitchen.pace());
  check('after a reload the spring is still in her step', after > 1, String(after));
  await mealChip('after a reload');
  await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
  await page.waitForTimeout(300);
  await mealChip('on its side');
  await page.setViewportSize(PHONE);
  await page.waitForTimeout(300);
  await clearMat();
  const mat = await page.evaluate(() => window.world.home.rooms.room.mat);
  await tapTile(mat.tx, mat.ty);
  await stepUntil(() => window.world.scene === 'town', 'she goes back out');
}

/**
 * The chip in the top bar for a meal that's doing something (0.3's A4): there, a thumb's size,
 * clear of the day, the neighbours and Settings, and the bar not spilling over.
 * @param {string} how
 */
async function mealChip(how) {
  const bar = await page.evaluate(() => {
    const box = (/** @type {string} */ s) => {
      const r = document.querySelector(s)?.getBoundingClientRect();
      return r && r.width > 0
        ? { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
        : null;
    };
    const top = document.querySelector('.hud-top');
    const today = document.querySelector('.hud-today');
    return {
      chip: box('.hud-top .hud-meal'),
      day: box('.hud-today'),
      // The day beside it stays whole, never cut off into an ellipsis.
      dayCut: !today || today.scrollWidth > today.clientWidth + 1,
      neighbours: box('.hud-neighbours'),
      settings: box('.hud-settings'),
      spills: !!top && top.scrollWidth > top.clientWidth + 1,
      width: innerWidth,
    };
  });
  /** @typedef {{ left: number, right: number, top: number, bottom: number } | null} Box */
  const apart = (/** @type {Box} */ a, /** @type {Box} */ b) =>
    !!a &&
    !!b &&
    (a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
  const chip = bar.chip;
  check(
    `${how}, the chip for what she ate is in the top bar, a thumb's size, clear of the day (whole) and Settings`,
    !!chip &&
      !bar.dayCut &&
      chip.right - chip.left >= 44 &&
      chip.bottom - chip.top >= 44 &&
      chip.right <= bar.width &&
      apart(chip, bar.day) &&
      apart(chip, bar.neighbours) &&
      apart(chip, bar.settings) &&
      !bar.spills,
    JSON.stringify(bar),
  );
  await page.screenshot({ path: `.smoke/meal-chip-${how.replace(/\W+/g, '-')}.png` });
}

/**
 * A wallpaper with windows (0.3's S4), hung by taps, showing the night sky at ten at night: the
 * pixels of a window's top pane, read off the canvas, are the night's deep blue, and by day sky.
 */
async function windows() {
  /** The top pane of the arched window over the middle of her back wall, as drawn. @param {number} hour */
  const pane = async (hour) => {
    await openOn(`${PLAIN_DAY}&weather=clear`, hour);
    if (await page.evaluate(() => window.world.scene !== 'home')) {
      await tapProp('homeHouse');
      await stepUntil(() => window.world.scene === 'home', 'she goes home to hang windows');
    }
    await page.evaluate(() => window.view.step(40, 4));
    return page.evaluate(() => {
      const room = window.world.home.rooms.room;
      const tx = Math.floor(room.width / 2);
      // Her arched window's left pane, a little under the top of its arch.
      const x = tx * 32 + 9 - window.view.cameraOrigin().x;
      const y = 20 + 12 - window.view.cameraOrigin().y;
      const el = /** @type {HTMLCanvasElement} */ (document.getElementById('game'));
      const data = el.getContext('2d')?.getImageData(x, y, 4, 3).data ?? [];
      // The middle pixel by brightness, so a star or the glint doesn't count.
      const px = [];
      for (let i = 0; i < data.length; i += 4) {
        const [r = 0, g = 0, b = 0] = [data[i], data[i + 1], data[i + 2]];
        px.push({ r, g, b, sum: r + g + b });
      }
      px.sort((a, b) => a.sum - b.sum);
      return px[Math.floor(px.length / 2)] ?? { r: 0, g: 0, b: 0, sum: 0 };
    });
  };
  await openOn(`${PLAIN_DAY}&weather=clear`, 22);
  if (await page.evaluate(() => window.world.scene !== 'home')) {
    await tapProp('homeHouse');
    await stepUntil(() => window.world.scene === 'home', 'she goes home to hang windows');
  }
  const was = await page.evaluate(() => window.world.home.rooms.wallpaper);
  await page.evaluate(() => window.world.home.giveWallpaper('archWindow'));
  // Nothing hangs or stands in front of the middle of the wall, for the look at the glass.
  await page.evaluate(() => {
    const tx = Math.floor(window.world.home.rooms.room.width / 2);
    for (const p of [...window.world.home.rooms.placed]) {
      if (p.ty <= 4 && p.tx <= tx && p.tx + 2 > tx) window.world.home.rooms.putAway(p);
    }
  });
  await tapElement('.hud-decorate');
  await tapElement('.hud-decor-bar button:text-is("Walls & floors")');
  await tapElement('.hud-surfaces-sheet button[aria-label="Arched windows on cream"]');
  await tapElement('.hud-surfaces-sheet .hud-done');
  await tapElement('.hud-decor-bar button:text-is("Done")');
  const hung = await page.evaluate(() => window.world.home.rooms.wallpaper);
  check('a wallpaper with windows is hung by taps', hung === 'archWindow', String(hung));
  await page.evaluate(() => window.view.step(40, 4));
  await page.screenshot({ path: '.smoke/windows-night.png' });
  await page.evaluate(() => window.view.saveNow());
  const night = await pane(22);
  check(
    'at ten at night her windows show the night sky, deep and blue',
    night.sum < 200 && night.b > night.r,
    JSON.stringify(night),
  );
  const day = await pane(12);
  await page.screenshot({ path: '.smoke/windows-day.png' });
  check(
    'at noon they show a day sky, light and blue',
    day.sum > 300 && day.b > day.r,
    JSON.stringify(day),
  );
  await page.evaluate((id) => window.world.home.rooms.paper(id), was);
  // Back out into town, as the sections after expect her.
  await clearMat();
  const mat = await page.evaluate(() => window.world.home.rooms.room.mat);
  await tapTile(mat.tx, mat.ty);
  await stepUntil(() => window.world.scene === 'town', 'she goes back out');
  await page.evaluate(() => window.view.saveNow());
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [
  ['home', home],
  ['chest', chest],
  ['display', display],
  ['tabletop', tabletop],
  ['craft', craft],
  ['backRoom', backRoom],
  ['yard', yard],
  ['cook', cook],
  ['windows', windows],
];
