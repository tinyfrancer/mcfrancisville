import { catalogue } from '../sprites/catalogue';
import { PALETTE } from '../sprites/palette';
import type { Raster } from '../sprites/sprite';
import { fitPixelScale } from './pixelScale';

/** CSS pixels to a pixel of the grid, for everything but the scale sheet. */
const SCALE = 4;

/**
 * Every sprite on one scrolling page, at a readable scale (`?gallery`). It ships in production on
 * purpose (decisions.md 21): the Vercel preview on a real phone is where the art gets judged. The
 * scale sheet comes first, at exactly the size the game draws it on this screen, since how big
 * she looks beside a house is what it's there to show.
 */
export function showGallery(root: HTMLElement): void {
  // The game pins the page to the screen; the gallery is a page that scrolls.
  for (const el of [document.documentElement, document.body]) {
    el.style.overflow = 'auto';
    el.style.height = 'auto';
  }
  root.style.height = 'auto';
  root.style.overflow = 'visible';
  root.replaceChildren();

  const page = document.createElement('div');
  page.id = 'gallery';
  Object.assign(page.style, {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    padding: 'calc(env(safe-area-inset-top) + 16px) 16px 32px',
    alignItems: 'flex-end',
  });

  const dpr = window.devicePixelRatio || 1;
  const fit = fitPixelScale(window.innerWidth, window.innerHeight, dpr);
  const inGame = fit.scale / dpr;

  for (const entry of catalogue()) {
    const onSheet = entry.name.startsWith('scale:');
    page.append(figure(entry.name, entry.draw(), onSheet ? inGame : SCALE));
  }
  root.append(page);
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
