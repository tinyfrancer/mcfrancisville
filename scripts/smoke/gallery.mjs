/** The sprite gallery (`?gallery`), whole and a page at a time. */
import { URL_BASE, check, page } from './lib.mjs';

/**
 * The whole gallery has every sprite; its pages (`?gallery&page=n`, T1), followed by each one's
 * Next link, have them all again in turn, each pictured whole as `.smoke/gallery-<n>.png`. The
 * whole is too long for CI's Chromium to picture in one (decision 296's note), a page isn't.
 */
async function gallery() {
  await page.goto(`${URL_BASE}?gallery`, { waitUntil: 'load', timeout: 60_000 });
  const count = await page.locator('#gallery canvas').count();
  let paged = 0;
  let pages = 0;
  /** @type {string[]} */
  const unpictured = [];
  /** @type {string | null} */
  let next = `${URL_BASE}?gallery&page=1`;
  while (next && pages < 500) {
    await page.goto(next, { waitUntil: 'load', timeout: 60_000 });
    pages += 1;
    paged += await page.locator('#gallery canvas').count();
    // At one pixel a CSS pixel: at the phone's three, a long page is more than Chromium captures.
    await page
      .screenshot({
        path: `.smoke/gallery-${pages}.png`,
        fullPage: true,
        scale: 'css',
        timeout: 60_000,
      })
      .catch((error) => unpictured.push(`page ${pages}: ${error}`));
    const href = await page.evaluate(
      () => document.querySelector('#gallery-next')?.getAttribute('href') ?? null,
    );
    next = href ? new URL(href, page.url()).href : null;
  }
  check(
    'the gallery shows every sprite',
    count > 20 && paged === count && unpictured.length === 0,
    `${count} sprites, ${paged} on ${pages} pages${unpictured.length ? `; ${unpictured.join(' | ')}` : ''}`,
  );
}

/** @type {import('./lib.mjs').Section[]} */
export const sections = [['gallery', gallery]];
