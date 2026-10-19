/** Her pets, and their growing fond of her. */
import {
  PHONE,
  TILE,
  check,
  clearMat,
  framed,
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
  check('all six pets are at home', home.length === 6, home.join(', '));
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
  const mat = await page.evaluate(() => window.world.home.room.mat);
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

/** @type {import('./lib.mjs').Section[]} */
export const sections = [['pets', pets]];
