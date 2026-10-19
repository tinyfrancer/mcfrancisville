/** The sprite gallery (`?gallery`). */
import { URL_BASE, check, page } from './lib.mjs';

async function gallery() {
  await page.goto(`${URL_BASE}?gallery`, { waitUntil: 'load', timeout: 60_000 });
  const count = await page.locator('#gallery canvas').count();
  check('the gallery shows every sprite', count > 20, `${count} sprites`);
  // The gallery is a very long page; a full-page picture of it takes a while, and is taken at one
  // pixel a CSS pixel, since at the phone's three it's more than Chromium will capture.
  /** @type {import('playwright').PageScreenshotOptions} */
  const shot = { path: '.smoke/gallery.png', fullPage: true, scale: 'css', timeout: 120_000 };
  try {
    await page.screenshot(shot);
  } catch (error) {
    // Grown past what Chromium will capture in one (CI's runner gives up before a container
    // does): the top of it, which is what a look at it starts with anyway.
    console.log(`note  the gallery is too long to picture whole, so its top is: ${error}`);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    await page.screenshot({ ...shot, clip: { x: 0, y: 0, width, height: 16_000 } });
  }
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [['gallery', gallery]];
