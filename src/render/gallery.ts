import { catalogue, pageOf } from '../sprites/catalogue';
import { PALETTE } from '../sprites/palette';
import type { Raster } from '../sprites/sprite';
import { fitPixelScale } from './pixelScale';

/** CSS pixels to a pixel of the grid, at most, for everything but the scale sheet. */
const SCALE = 4;

/**
 * Every sprite on one scrolling page, at a readable scale (`?gallery`). It ships in production on
 * purpose (decisions.md 21): the Vercel preview on a real phone is where the art gets judged. The
 * scale sheet comes first, at exactly the size the game draws it on this screen, since how big
 * she looks beside a house is what it's there to show; its pieces follow, bigger. Given a `page`
 * (`?gallery&page=n`, T1), it shows that page of the catalogue's rows, with a link to the next.
 */
export function showGallery(root: HTMLElement, page: number | null = null): void {
  // The game pins the page to the screen; the gallery is a page that scrolls.
  for (const el of [document.documentElement, document.body]) {
    el.style.overflow = 'auto';
    el.style.height = 'auto';
  }
  root.style.height = 'auto';
  root.style.overflow = 'visible';
  root.replaceChildren();

  const sheet = document.createElement('div');
  sheet.id = 'gallery';
  Object.assign(sheet.style, {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    padding: 'calc(env(safe-area-inset-top) + 16px) 16px 32px',
    alignItems: 'flex-end',
  });

  const dpr = window.devicePixelRatio || 1;
  const fit = fitPixelScale(window.innerWidth, window.innerHeight, dpr);
  const inGame = fit.scale / dpr;

  // Anything else as big as fits across the page, up to `SCALE`, so the house isn't cropped.
  const fits = (width: number) =>
    Math.max(1, Math.min(SCALE, Math.floor((window.innerWidth - 32) / width)));
  const { entries, pages } = pageOf(catalogue(), page);
  for (const entry of entries) {
    const raster = entry.draw();
    const scale = entry.name === 'scale:sheet' ? inGame : fits(raster.width);
    sheet.append(figure(entry.name, raster, scale));
  }
  root.append(sheet);
  if (page !== null) root.append(pager(page, pages));
}

/** Which page this is, and a link to the next while there is one. */
function pager(page: number, pages: number): HTMLElement {
  const nav = document.createElement('nav');
  Object.assign(nav.style, {
    display: 'flex',
    gap: '16px',
    padding: '0 16px calc(env(safe-area-inset-bottom) + 32px)',
    fontSize: '16px',
  });
  const where = document.createElement('span');
  where.textContent = `Page ${page} of ${pages}`;
  nav.append(where);
  if (page < pages) {
    const next = document.createElement('a');
    next.id = 'gallery-next';
    next.href = `?gallery&page=${page + 1}`;
    next.textContent = 'Next page';
    nav.append(next);
  }
  return nav;
}

function figure(label: string, raster: Raster, scale: number): HTMLElement {
  const canvas = document.createElement('canvas');
  canvas.width = raster.width;
  canvas.height = raster.height;
  canvas
    .getContext('2d')
    ?.putImageData(new ImageData(raster.data, raster.width, raster.height), 0, 0);
  Object.assign(canvas.style, {
    width: `${raster.width * scale}px`,
    height: `${raster.height * scale}px`,
    imageRendering: 'pixelated',
    background: PALETTE.dusk,
  });
  const el = document.createElement('figure');
  Object.assign(el.style, { margin: '0', textAlign: 'center', fontSize: '12px' });
  const caption = document.createElement('figcaption');
  caption.textContent = label;
  el.append(canvas, caption);
  return el;
}
