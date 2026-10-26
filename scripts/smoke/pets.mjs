/** Her pets, and their growing fond of her. */
import {
  PHONE,
  PLAIN_DAY,
  TILE,
  check,
  clearMat,
  framed,
  openOn,
  page,
  reloadGame,
  stepUntil,
  tapElement,
  tapProp,
  tapTile,
} from './lib.mjs';

async function pets() {
  await reloadGame();
  await tapProp('homeHouse');
  await stepUntil(() => window.world.scene === 'home', 'she goes home to her pets');
  const home = await page.evaluate(() => window.world.petCare.here().map((p) => p.id));
  check('all seven pets are at home', home.length === 7, home.join(', '));
  await page.screenshot({ path: '.smoke/pets.png' });

  // A real tap on Dolly walks her over, and opens Dolly's sheet with a pat.
  const dolly = await page.evaluate(() => window.world.petCare.pet('dolly').tile);
  await tapTile(dolly.tx, dolly.ty);
  const opened = await stepUntil(
    () => document.querySelector('.hud-pet-sheet') !== null,
    'walking up to Dolly opens her sheet',
  );
  if (!opened) return;
  await framed('.hud-pet-sheet', { picture: true });
  const sheet = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('.hud-pet-sheet .hud-sheet-foot button')];
    return {
      name: document.querySelector('.hud-pet-sheet h2')?.textContent ?? '',
      said: document.querySelector('.hud-pet-sheet .hud-speech')?.textContent ?? '',
      thumb: buttons.every((b) => b.getBoundingClientRect().height >= 44),
      onScreen: buttons.every((b) => b.getBoundingClientRect().right <= 390),
    };
  });
  check(
    'her sheet has her name, a pat, and thumb-sized buttons on screen',
    sheet.name === 'Dolly' && sheet.said.includes('Dolly') && sheet.thumb && sheet.onScreen,
    JSON.stringify(sheet),
  );
  await page.screenshot({ path: '.smoke/pet-sheet.png' });

  await tapElement('.hud-pet-sheet button:text-is("Come for a walk")');
  await tapElement('.hud-pet-sheet button:text-is("Dress up")');
  await tapElement('.hud-pet-sheet .hud-slot[aria-label="Scarlet bandana"]');
  await tapElement('.hud-pet-sheet button:text-is("Done")');
  await tapElement('.hud-pet-sheet button:text-is("Rename")');
  await page.locator('.hud-pet-sheet .hud-name').fill('Dolly Parton');
  await tapElement('.hud-pet-sheet button:text-is("Save")');
  const dressed = await page.evaluate(() => ({
    walking: window.world.pets.walking,
    wearing: window.world.pets.wearing('dolly'),
    name: window.world.pets.nameOf('dolly'),
  }));
  check(
    'she can take Dolly for a walk, dress her and rename her',
    dressed.walking === 'dolly' &&
      dressed.wearing === 'scarletBandana' &&
      dressed.name === 'Dolly Parton',
    JSON.stringify(dressed),
  );
  await page.screenshot({ path: '.smoke/pet-dressed.png' });
  await tapElement('.hud-pet-sheet button:text-is("Bye")');

  await clearMat();
  const mat = await page.evaluate(() => window.world.home.rooms.room.mat);
  await tapTile(mat.tx, mat.ty);
  await stepUntil(() => window.world.scene === 'town', 'she goes out with Dolly');
  await page.evaluate(() => window.view.step(40, 20));
  const out = await page.evaluate((T) => {
    const d = window.world.petCare.pet('dolly');
    const p = window.world.player;
    return {
      scene: d.scene,
      reach: Math.max(
        Math.abs(d.tile.tx - Math.floor(p.x / T)),
        Math.abs(d.tile.ty - Math.floor(p.y / T)),
      ),
    };
  }, TILE);
  check(
    'Dolly comes out into town at her side',
    out.scene === 'town' && out.reach <= 1,
    JSON.stringify(out),
  );
  await page.screenshot({ path: '.smoke/pet-walk.png' });

  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const kept = await page.evaluate(() => ({
    walking: window.world.pets.walking,
    scene: window.world.petCare.pet('dolly').scene,
    name: window.world.pets.nameOf('dolly'),
  }));
  check(
    'Dolly, her name and her walk are still there after a reload',
    kept.walking === 'dolly' && kept.scene === 'town' && kept.name === 'Dolly Parton',
    JSON.stringify(kept),
  );
  await petsThatGrow();
}

/**
 * Pets that grow (V1's R6c): her pat counted, then Dolly made fond to bits through the dev
 * handle, her sheet showing the level and the Trick button, the trick done in the world, and the
 * sheet on its side.
 */
async function petsThatGrow() {
  const patted = await page.evaluate(() => window.world.pets.points('dolly'));
  check('the pat as her sheet opened made Dolly fonder', patted >= 1, String(patted));
  await page.evaluate(() => window.world.pets.setPoints('dolly', 60));
  const dolly = await page.evaluate(() => window.world.petCare.pet('dolly').tile);
  await tapTile(dolly.tx, dolly.ty);
  const opened = await stepUntil(
    () => document.querySelector('.hud-pet-sheet') !== null,
    'walking up to Dolly in town opens her sheet',
  );
  if (!opened) return;
  const fond = await page.evaluate(() => ({
    level: document.querySelector('.hud-pet-fond')?.getAttribute('data-level'),
    next: document.querySelector('.hud-pet-next')?.textContent ?? '',
    trick: [...document.querySelectorAll('.hud-pet-sheet .hud-sheet-foot button')].some(
      (b) => b.textContent === 'Trick',
    ),
  }));
  check(
    'her sheet shows her fondness at the top, what she knows, and a Trick button',
    fond.level === '2' && fond.next.includes('spins') && fond.trick,
    JSON.stringify(fond),
  );
  await page.screenshot({ path: '.smoke/pet-grown.png' });
  await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
  await page.evaluate(() => window.view.step(40));
  const side = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('.hud-pet-sheet .hud-sheet-foot button')];
    const bar = document.querySelector('.hud-pet-bar')?.getBoundingClientRect();
    return {
      onScreen: buttons.every((b) => b.getBoundingClientRect().right <= window.innerWidth),
      bar: bar ? bar.width > 0 && bar.right <= window.innerWidth : false,
    };
  });
  check(
    'on its side, her sheet keeps its buttons and bar on screen',
    side.onScreen && side.bar,
    JSON.stringify(side),
  );
  await page.screenshot({ path: '.smoke/pet-sheet-side.png' });
  await page.setViewportSize(PHONE);
  await page.evaluate(() => window.view.step(40));
  // The sheet goes down first, so the trick is seen wherever she is on the screen (1.0.1).
  await tapElement('.hud-pet-sheet button:text-is("Trick")');
  await page.evaluate(() => window.view.step(40, 2));
  const tricked = await page.evaluate(() => ({
    pose: window.world.petCare.pet('dolly').pose,
    sheet: document.querySelector('.hud-pet-sheet:not(.hud-sheet-leaving)') !== null,
    said: document.querySelector('.hud-toast')?.textContent ?? '',
  }));
  check(
    'Trick puts her sheet away and makes her spin, there in the world, saying so',
    tricked.pose === 'trick' && !tricked.sheet && tricked.said.includes('spins'),
    JSON.stringify(tricked),
  );
  await page.evaluate(() => window.view.step(40, 8));
  await page.screenshot({ path: '.smoke/pet-trick.png' });
}

/**
 * Pickle the possum (1.5's G7), out on a night's walk with his lantern lit: a pat makes him play
 * dead, and his trick plays dead and then hangs him by his tail from a branch.
 */
async function pickle() {
  await openOn(PLAIN_DAY, 22);
  await page.evaluate(() => {
    const w = window.world;
    w.pets.give('tailLantern');
    w.petCare.dress('pickle', 'tailLantern');
    w.pets.setPoints('pickle', 60);
    w.petCare.walkWith('pickle');
  });
  await page.evaluate(() => window.view.step(40, 20));
  const out = await page.evaluate((T) => {
    const p = window.world.petCare.pet('pickle');
    const her = window.world.player;
    return {
      scene: p.scene,
      wearing: window.world.pets.wearing('pickle'),
      reach: Math.max(
        Math.abs(p.tile.tx - Math.floor(her.x / T)),
        Math.abs(p.tile.ty - Math.floor(her.y / T)),
      ),
    };
  }, TILE);
  check(
    'Pickle walks with her at night, carrying his lantern',
    out.scene === 'town' && out.reach <= 1 && out.wearing === 'tailLantern',
    JSON.stringify(out),
  );
  await page.screenshot({ path: '.smoke/pickle-night.png' });

  const at = await page.evaluate(() => window.world.petCare.pet('pickle').tile);
  await tapTile(at.tx, at.ty);
  const opened = await stepUntil(
    () => document.querySelector('.hud-pet-sheet') !== null,
    'walking up to Pickle opens his sheet',
  );
  if (!opened) return;
  const sheet = await page.evaluate(() => ({
    name: document.querySelector('.hud-pet-sheet h2')?.textContent ?? '',
    said: document.querySelector('.hud-pet-sheet .hud-speech')?.textContent ?? '',
    pose: window.world.petCare.pet('pickle').pose,
    next: document.querySelector('.hud-pet-next')?.textContent ?? '',
  }));
  check(
    'his sheet opens with a pat, and a compliment has him playing dead',
    sheet.name === 'Pickle' &&
      sheet.said.includes('Pickle') &&
      sheet.pose === 'playDead' &&
      sheet.next.includes('hangs by his tail'),
    JSON.stringify(sheet),
  );
  await page.screenshot({ path: '.smoke/pickle-sheet.png' });
  await tapElement('.hud-pet-sheet button:text-is("Trick")');
  await page.evaluate(() => window.view.step(40, 2));
  const dead = await page.evaluate(() => window.world.petCare.pet('pickle').pose);
  // Past halfway through his routine he's up in the air, hanging by his tail: the trick runs on
  // the clock, which is the real one under ?hour=, so this waits for it.
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.view.step(40, 2));
  const hanging = await page.evaluate(() => ({
    pose: window.world.petCare.pet('pickle').pose,
    done: window.world.petCare.pet('pickle').trickDone(window.world.clock.now()),
  }));
  check(
    'Trick has him play dead, then hang by his tail',
    dead === 'trick' && hanging.pose === 'trick' && (hanging.done ?? 0) > 0.48,
    JSON.stringify({ dead, ...hanging }),
  );
  await page.screenshot({ path: '.smoke/pickle-trick.png' });
  await page.evaluate(() => window.world.petCare.walkWith(null));
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [
  ['pets', pets],
  ['pickle', pickle],
];
