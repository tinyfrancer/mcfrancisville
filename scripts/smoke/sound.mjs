/** What she hears: the sound and its switches, the fountain's music box after dark, and a place's night heard. */
import {
  PLAIN_DAY,
  URL_BASE,
  check,
  clearMat,
  closeSheets,
  page,
  playerTile,
  stepUntil,
  tapElement,
  tapProp,
  tapTile,
} from './lib.mjs';

/**
 * The fountain after dark (0.2's H2): on the bank of its pond its music box takes over from the
 * town's tune, its lamps pulsing on the beat, and the town's comes back as she walks away.
 */
async function fountain() {
  await page.goto(`${URL_BASE}?loop=manual&skiptitle&day=${PLAIN_DAY}&hour=22`, {
    waitUntil: 'load',
    timeout: 60_000,
  });
  await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
  await closeSheets();
  // The last section may have left her anywhere in town (by the pond, even): back to her door.
  const door = await page.evaluate(() => window.world.map.spawn);
  await page.evaluate((d) => window.world.tapTile(d.tx, d.ty), door);
  await stepUntil(() => !window.world.player.moving, 'she walks back to her door');
  await tapTile(door.tx + 1, door.ty + 1);
  await stepUntil(() => !window.world.player.moving, 'a step, to wake the sound');
  const away = await page.evaluate(() => window.sound.musicPlaying);
  check(
    'away from the fountain, the town plays its own tune',
    /^town@/.test(away ?? ''),
    away ?? 'none',
  );
  await page.evaluate(() => window.world.tapTile(19, 42));
  await stepUntil(() => window.world.fountain.playing(), 'she reaches the bank of the pond');
  await stepUntil(
    () => window.sound.musicPlaying === 'fountain@musicBox',
    "the fountain's music box plays for her after dark",
  );
  await stepUntil(() => !window.world.player.moving, 'she stops on the bank');
  await page.evaluate(() => window.view.step(40, 3));
  await page.screenshot({ path: '.smoke/fountain.png' });
  const beat = await page.evaluate(() => window.sound.musicBeat());
  check('its lamps have a beat to pulse to', typeof beat === 'number', String(beat));
  await page.evaluate((d) => window.world.tapTile(d.tx, d.ty), door);
  await stepUntil(
    () => window.sound.musicPlaying?.startsWith('town@') === true,
    "the town's tune comes back as she walks away",
  );
}

/**
 * The sound starts with her first touch, the settings sheet can hush it, her home has its own tune
 * (0.2's H1), and Walk the Tomb on the record player gets her dancing, with Cody over from next door.
 */
async function sound() {
  const step = await playerTile();
  await tapTile(step.tx + 1, step.ty + 1);
  await stepUntil(() => !window.world.player.moving, 'a step, to wake the sound');
  const state = await page.evaluate(() => window.sound.state);
  check('a tap starts the sound', state === 'running', state);

  await tapElement('.hud-settings');
  await tapElement('.hud-settings-sheet .hud-sheet-tab:text-is("Sound")');
  const switches = await page.locator('.hud-toggle').allTextContents();
  check(
    'settings has switches for the sounds, the music, the ambience and playing on silent (off)',
    switches.join('|') === 'Sounds: on|Music: on|Ambience: on|Play on silent: off',
    switches.join('|'),
  );
  await tapElement('.hud-toggle:has-text("Music")');
  const saved = await page.evaluate(() => localStorage.getItem('mcfrancisville:sound'));
  check('turning the music off is remembered on this phone', /"music":false/.test(saved ?? ''));
  await tapElement('.hud-toggle:has-text("Music")');
  await tapElement('.hud-sheet button:text("Done")');

  const outside = await page.evaluate(() => window.sound.musicPlaying);
  check(
    'the town has its music playing',
    /^(town|halloweenFestival)@/.test(outside ?? ''),
    outside ?? 'none',
  );
  await tapProp('homeHouse');
  await stepUntil(() => window.world.scene === 'home', 'she goes in her front door');
  await stepUntil(
    () => window.sound.musicPlaying?.startsWith('home@') === true,
    'her home has a tune of its own, crossfading in at the door',
  );
  const player = await page.evaluate(() => {
    const w = window.world;
    w.bag.add('recordWalkTheTomb', 1);
    w.home.store('recordPlayer');
    w.decorating.takeOut('recordPlayer');
    w.decorating.stop();
    return w.home.placed.find((p) => p.id === 'recordPlayer') ?? null;
  });
  check('a record player can be set out at home', player !== null);
  if (!player) return;
  // The pets potter about the room by the clock, and a tap on a pet reaches the pet, so wait
  // for the tile to be clear of them; otherwise, now and then, she'd be off to pat one instead.
  await stepUntil(() => {
    const at = window.world.home.placed.find((p) => p.id === 'recordPlayer');
    return !at || !window.world.petCare.petAt(at.tx, at.ty);
  }, 'no pet is sitting on the record player');
  await page.evaluate((p) => window.world.tapTile(p.tx, p.ty), player);
  await stepUntil(() => window.sound.recordPlaying, 'walking up to it puts a record on');
  const dance = await page.evaluate(() => window.world.recordPlayer.dance());
  check(
    'Walk the Tomb gets her dancing, with Cody beside her',
    !!dance?.cody,
    JSON.stringify(dance),
  );
  await page.evaluate(() => window.view.step(40, 3));
  await page.screenshot({ path: '.smoke/dance.png' });
  // Her piano (0.2's G2) plays one of its tunes as a record does, the music hushed for it.
  const piano = await page.evaluate(() => {
    const w = window.world;
    window.sound.stopRecord();
    w.home.store('piano');
    w.decorating.takeOut('piano');
    w.decorating.stop();
    return w.home.placed.find((p) => p.id === 'piano') ?? null;
  });
  check('a piano can be set out at home', piano !== null);
  if (piano) {
    await stepUntil(() => {
      const at = window.world.home.placed.find((p) => p.id === 'piano');
      return !at || !window.world.petCare.petAt(at.tx, at.ty);
    }, 'no pet is sitting at the piano');
    await page.evaluate((p) => window.world.tapTile(p.tx, p.ty), piano);
    await stepUntil(() => window.sound.recordPlaying, 'walking up to the piano plays a tune');
    await page.screenshot({ path: '.smoke/piano.png' });
    // Put away again, so it stands in nobody's way later on.
    await page.evaluate(() => {
      const w = window.world;
      w.decorating.start(w.home.placed.find((p) => p.id === 'piano'));
      w.decorating.putAwaySelected();
      w.decorating.stop();
    });
  }
  await clearMat();
  const mat = await page.evaluate(() => window.world.home.room.mat);
  await page.evaluate((m) => window.world.tapTile(m.tx, m.ty), mat);
  await stepUntil(() => window.world.scene === 'town', 'she goes back out');
  check('going out takes the record off', !(await page.evaluate(() => window.sound.recordPlaying)));
  const back = await page.evaluate(() => window.sound.musicPlaying);
  check(
    "the town's music comes back outside",
    back?.split('@')[0] === outside?.split('@')[0],
    `${back} after ${outside}`,
  );
}

/**
 * Heard (V1's S1): the night at Lantern Shore sounds like a place, the lake's night music under
 * crickets and its water lapping (rain instead, on a wet night); her steps are heard as she
 * walks; and a button in the HUD ticks as it's pressed.
 */
async function heard() {
  await page.goto(`${URL_BASE}?loop=manual&skiptitle&day=${PLAIN_DAY}&hour=23`, {
    waitUntil: 'load',
    timeout: 60_000,
  });
  await page.waitForFunction(() => window.world && window.view, null, { timeout: 30_000 });
  await closeSheets();
  const before = await page.evaluate(() => window.sound.heard);
  await tapElement('.hud-settings');
  await stepUntil(() => window.sound.state === 'running', 'a touch starts the sound');
  const ticked = await page.evaluate(() => window.sound.heard.ticks);
  check('a HUD button ticks as it is pressed', ticked > before.ticks, `${ticked}`);
  await closeSheets();
  await page.evaluate(() => {
    window.world.atlas.find('lanternShore');
    window.world.travel.go('lanternShore');
  });
  await stepUntil(() => window.world.scene === 'lanternShore', 'she goes to Lantern Shore');
  await page.evaluate(() => window.view.step(40, 10));
  const shore = await page.evaluate(() => ({
    music: window.sound.musicPlaying,
    bed: window.sound.ambience,
    playing: window.sound.ambiencePlaying,
    weather: window.world.weather.today(),
  }));
  check(
    'the night at Lantern Shore plays the night arrangement of its tune',
    shore.music === 'lanternShore@night',
    JSON.stringify(shore),
  );
  /** @type {('rain' | 'water' | 'crickets')[]} */
  const night = shore.weather === 'rain' ? ['rain', 'water'] : ['crickets', 'water'];
  check(
    `and sounds like a place: ${night.join(' and ')}`,
    night.every((l) => (shore.bed[l] ?? 0) > 0 && shore.playing.includes(l)),
    JSON.stringify(shore),
  );
  // A walk of a few tiles: a footstep each step.
  const goal = await page.evaluate(() => {
    const w = window.world;
    const zone = w.zones.outdoor(w.scene);
    if (!zone) return null;
    const here = { tx: Math.floor(w.player.x / 32), ty: Math.floor(w.player.y / 32) };
    for (let r = 4; r < 9; r++) {
      for (const [dx, dy] of /** @type {[number, number][]} */ ([
        [r, 0],
        [-r, 0],
        [0, r],
        [0, -r],
      ])) {
        if (zone.canWalk(here.tx + dx, here.ty + dy)) return { tx: here.tx + dx, ty: here.ty + dy };
      }
    }
    return null;
  });
  check('there is somewhere on the shore to walk to', goal !== null);
  if (!goal) return;
  const stepped = await page.evaluate(() => window.sound.heard.steps);
  await page.evaluate((g) => window.world.tapTile(g.tx, g.ty), goal);
  await stepUntil(() => !window.world.player.moving, 'she walks along the shore');
  const steps = (await page.evaluate(() => window.sound.heard.steps)) - stepped;
  check('her footsteps are heard as she walks', steps >= 3, `${steps} steps`);
  await page.evaluate(() => window.world.travel.go('town'));
  await stepUntil(() => window.world.scene === 'town', 'she goes back to town');
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [
  ['sound', sound],
  ['fountain', fountain],
  ['heard', heard],
];
