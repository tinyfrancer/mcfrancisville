/** The town's projects (V1's R4) on the noticeboard's Projects tab. */
import {
  PHONE,
  check,
  closeSheets,
  framed,
  page,
  reloadGame,
  stepUntil,
  tapElement,
  tapProp,
} from './lib.mjs';

/**
 * The town's projects (V1's R4): the noticeboard's Projects tab, starting the bandstand, giving
 * with − n +, its posts going up on the square, its three stages each drawn there, and the tab on
 * its side.
 */
async function projects() {
  await closeSheets();
  const woodBefore = await page.evaluate(() => window.world.bag.count('wood') + 80);
  await page.evaluate(() => {
    window.world.bag.add('wood', 80);
    window.world.bag.add('stone', 40);
    window.world.bag.add('pumpkin', 6);
    window.world.wallet.earn(5000);
  });
  await tapProp('noticeboard');
  await stepUntil(() => !window.world.player.moving, 'she reaches the noticeboard');
  await page.evaluate(() => window.view.step(40));
  await framed('.hud-notice-sheet', { tabs: ['Notes', 'Projects'] });
  await tapElement('.hud-notice-sheet .hud-sheet-tab:text-is("Projects")');
  const cards = await page.locator('.hud-project').count();
  check('the Projects tab offers every project to start', cards === 4, String(cards));
  await tapElement('.hud-project >> nth=0 >> button:text-is("Start this one")');
  const started = await page.evaluate(() => window.world.projects.current);
  check('starting one makes it the one under way', started === 'bandstand', String(started));
  const rows = await page.locator('.hud-project-need').count();
  check('it asks for Candy and each of its things, a row each', rows === 4, String(rows));
  const wood = '.hud-project-need:has-text("Wood")';
  await tapElement(`${wood} .hud-how-many .hud-chip:last-child`);
  await tapElement(`${wood} .hud-how-many .hud-chip:last-child`);
  await tapElement(`${wood} .hud-primary`);
  const given = await page.evaluate(() => ({
    wood: window.world.bag.count('wood'),
    post: window.world.townZone.propAt(26, 19)?.id ?? null,
  }));
  check(
    'giving three wood takes three from her bag',
    given.wood === woodBefore - 3,
    JSON.stringify({ ...given, woodBefore }),
  );
  check('and the posts go up on the square', given.post === 'sitePost', JSON.stringify(given));
  await page.screenshot({ path: '.smoke/projects.png' });
  // On its side, the tab keeps to the screen.
  await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
  await page.evaluate(() => window.view.step(40));
  const sideways = await page.evaluate(() => {
    const sheet = document.querySelector('.hud-notice-sheet');
    const row = document.querySelector('.hud-project-need')?.getBoundingClientRect();
    return {
      wide: !!sheet && sheet.scrollWidth > sheet.clientWidth + 1,
      row: !!row && row.right <= innerWidth + 0.5,
    };
  });
  check(
    'on its side the Projects tab fits',
    !sideways.wide && sideways.row,
    JSON.stringify(sideways),
  );
  await page.screenshot({ path: '.smoke/projects-sideways.png' });
  await page.setViewportSize(PHONE);
  await tapElement('.hud-notice-sheet .hud-done');
  // Each stage drawn where it stands: the posts, the frame, the bandstand, each a different picture.
  const shots = [];
  for (const stage of ['posts', 'frames', 'done']) {
    await page.evaluate((s) => {
      window.world.projects.preview('bandstand', /** @type {'posts'} */ (s));
      window.view.step(40);
    }, stage);
    const at = await page.evaluate(() => {
      const a = window.view.tileToClient(26, 17);
      const b = window.view.tileToClient(29, 21);
      return { x: a.x, y: a.y, width: b.x - a.x, height: b.y - a.y };
    });
    const shot = await page.screenshot({ clip: at });
    shots.push(shot.toString('base64'));
    await page.screenshot({ path: `.smoke/project-${stage}.png` });
  }
  check('the posts, the frame and the bandstand each draw', new Set(shots).size === 3);
  await page.evaluate(() => window.world.projects.preview('bandstand', undefined));
  // What she gave is kept with her town (save v51).
  await page.evaluate(() => window.view.saveNow());
  await reloadGame();
  const kept = await page.evaluate(() => ({
    current: window.world.projects.current,
    wood: window.world.projects.view()[0]?.items.find((i) => i.item === 'wood')?.given,
    post: window.world.townZone.propAt(26, 19)?.id ?? null,
  }));
  check(
    'the project and what she gave it survive a reload',
    kept.current === 'bandstand' && kept.wood === 3 && kept.post === 'sitePost',
    JSON.stringify(kept),
  );
  // What was put in her bag and purse for this goes again, for the sections after.
  await page.evaluate(() => {
    window.world.bag.remove('wood', 77);
    window.world.bag.remove('stone', 40);
    window.world.bag.remove('pumpkin', 6);
    window.world.wallet.spend(5000);
  });
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [['projects', projects]];
