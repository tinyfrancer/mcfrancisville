import { PLAYER_FRAMES, PLAYER_PALETTE } from '../sprites/player';
import { PROP_ART } from '../sprites/props';
import { bake } from '../sprites/bake';
import type { Palette, SpriteSource } from '../sprites/sprite';
import { TILE_ART } from '../sprites/tiles';
import { PALETTE } from '../sprites/palette';

const SCALE = 4;

/**
 * Every sprite on one scrolling page, at a readable scale (`?gallery`). It ships in production on
 * purpose (decisions.md 21): the Vercel preview on a real phone is where the art gets judged.
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

  const add = (
    label: string,
    key: string,
    source: SpriteSource,
    palette: Palette,
    flip = false,
  ) => {
    const sprite = bake(key, source, palette, { flipX: flip });
    const canvas = document.createElement('canvas');
    canvas.width = sprite.width;
    canvas.height = sprite.height;
    canvas.getContext('2d')?.drawImage(sprite, 0, 0);
    Object.assign(canvas.style, {
      width: `${sprite.width * SCALE}px`,
      height: `${sprite.height * SCALE}px`,
      imageRendering: 'pixelated',
      background: PALETTE.dusk,
    });
    const figure = document.createElement('figure');
    Object.assign(figure.style, { margin: '0', textAlign: 'center', fontSize: '12px' });
    const caption = document.createElement('figcaption');
    caption.textContent = label;
    figure.append(canvas, caption);
    page.append(figure);
  };

  for (const [id, art] of Object.entries(TILE_ART)) {
    add(id, `tile:${id}`, art.source, art.palette);
  }
  for (const [id, art] of Object.entries(PROP_ART)) {
    add(id, `prop:${id}`, art.source, art.palette);
  }
  for (const [facing, frames] of Object.entries(PLAYER_FRAMES)) {
    frames.forEach((frame, i) =>
      add(`${facing} ${i}`, `player:${facing}:${i}`, frame, PLAYER_PALETTE),
    );
  }
  PLAYER_FRAMES.right.forEach((frame, i) =>
    add(`left ${i}`, `player:left:${i}`, frame, PLAYER_PALETTE, true),
  );

  root.append(page);
}
