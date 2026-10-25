import { CAMERA_LINE, FILTER_IDS, FILTERS, SNAPPED, type FilterId } from '../data/photo';
import { ITEMS } from '../data/items';
import {
  CAPTION_MAX,
  captionOf,
  movedSticker,
  STICKER_LIMIT,
  withSticker,
  type Sticker,
} from '../systems/photo';
import type { ItemId } from '../types/ids';
import type { Closeness } from '../types/view';
import { fitIcon } from './collection';
import { el } from './dom';
import { glyph } from './glyph';
import { openPhoto } from './PhotoCard';

/** Where the photo is on the page, in client pixels, and how big one of her pixels is there. */
export interface FrameOnScreen {
  left: number;
  top: number;
  width: number;
  height: number;
  /** The polaroid's foot under the photo, where the caption is written. */
  foot: number;
  /** Client pixels to one of hers. */
  unit: number;
}

/** A photo just taken: the picture, and its print to keep. */
export interface Shot {
  picture: HTMLCanvasElement;
  print(): Promise<Blob | null>;
}

/** What the photo mode may ask of the game (1.5's G5). Like the sheets, never the world itself. */
export interface CameraApi {
  /** Lifts the camera: the town holds still, and everyone close by turns to it and poses. */
  lift(): void;
  /** Puts it down: everyone carries on, and the view comes back to her, as close as she had it. */
  lower(): void;
  /** Her finger moved this far across the page: the town moves with it, up to its edges. */
  pan(dx: number, dy: number): void;
  /** How close the viewfinder is, and closer or farther (for the viewfinder alone). */
  lens(): Closeness;
  zoom(to: Closeness): void;
  /** Where the photo is on the page just now, or null on a canvas too small for one. */
  frame(): FrameOnScreen | null;
  /** The filter shown live, and taken. */
  filter(id: FilterId): void;
  /** What may go on as a sticker: her critters, dolls, squishies and keepsakes. */
  stickers(): readonly ItemId[];
  stickerIcon(canvas: HTMLCanvasElement, id: ItemId): void;
  /** The shutter: a click, and the photo cut from the town as it is, stickers and all. */
  shoot(stickers: readonly Sticker[], caption: string): Shot | null;
  /** When it is, for the kept file's name. */
  takenAt(): number;
}

/** A sticker in the drawer, and on the photo while she places it. */
const DRAWER_ICON = 32;

/** How far past the photo's edge a sticker can be dragged before letting go takes it off. */
const OFF_BY = 0.08;

/** How far a pinch must open or close, as a ratio, to come in or go out. */
const PINCH = 1.25;

type Drawer = 'filters' | 'stickers' | 'caption' | null;

/**
 * The photo mode (1.5's G5, decision 374): the viewfinder over the town, the bars gone but for a
 * strip along the bottom: Done, the filters, the stickers, the shutter, the caption, in and out.
 * Not a sheet (nothing rises over the town), so it isn't `openSheet`'s; the photo's card after
 * the shutter is.
 */
export function openCamera(
  hud: HTMLElement,
  viewport: HTMLElement,
  bottom: HTMLElement,
  api: CameraApi,
  onClose: () => void = () => {},
): { close(): void } {
  let filter: FilterId = 'plain';
  let stickers: Sticker[] = [];
  let caption = '';
  let drawer: Drawer = null;

  api.lift();
  hud.setAttribute('data-camera', '');

  // Over the town: what she drags (the town, or a sticker), the stickers and the caption.
  const layer = el('div', { className: 'hud-camera-layer' });
  layer.setAttribute('aria-label', 'Viewfinder: drag to look around');
  const writing = el('p', { className: 'hud-camera-caption' });
  const say = el('p', { className: 'hud-camera-say', textContent: CAMERA_LINE });
  say.setAttribute('role', 'status');
  const placed = el('div', { className: 'hud-camera-stickers' });
  layer.append(placed, writing, say);

  const strip = el('div', { className: 'hud-camera-strip' });
  strip.setAttribute('role', 'toolbar');
  strip.setAttribute('aria-label', 'Camera');
  const tray = el('div', { className: 'hud-camera-drawer' });
  tray.hidden = true;

  const round = (label: string, icon: Parameters<typeof glyph>[0], onClick: () => void) => {
    const b = el('button', { type: 'button', className: 'hud-round hud-camera-button' });
    b.setAttribute('aria-label', label);
    b.append(glyph(icon, 32));
    b.addEventListener('click', onClick);
    return b;
  };
  const done = el('button', { type: 'button', className: 'hud-camera-done' }, 'Done');
  done.addEventListener('click', () => close());
  const filters = round('Filters', 'filters', () => open('filters'));
  const stickerButton = round('Stickers', 'sticker', () => open('stickers'));
  const shutter = el('button', { type: 'button', className: 'hud-camera-shutter' });
  shutter.setAttribute('aria-label', 'Take the photo');
  shutter.append(glyph('camera', 32));
  shutter.addEventListener('click', () => snap());
  const pencil = round('Caption', 'pencil', () => open('caption'));
  const zoom = round('Closer', 'zoomIn', () => zoomTo(api.lens() === 'far' ? 'close' : 'far'));
  strip.append(done, filters, stickerButton, shutter, pencil, zoom);
  bottom.append(tray, strip);
  viewport.append(layer);

  const tell = (text: string) => (say.textContent = text);

  const showZoom = () => {
    const far = api.lens() === 'far';
    zoom.setAttribute('aria-label', far ? 'Closer' : 'Farther');
    zoom.replaceChildren(glyph(far ? 'zoomIn' : 'zoomOut', 32));
  };
  const zoomTo = (to: Closeness) => {
    if (api.lens() === to) return;
    api.zoom(to);
    showZoom();
    layout();
  };

  // ---- The drawers: one at a time, over the strip ---------------------------------------------

  const open = (which: Exclude<Drawer, null>) => {
    drawer = drawer === which ? null : which;
    for (const [b, d] of [
      [filters, 'filters'],
      [stickerButton, 'stickers'],
      [pencil, 'caption'],
    ] as const) {
      b.setAttribute('aria-pressed', String(drawer === d));
    }
    tray.hidden = drawer === null;
    tray.replaceChildren();
    if (drawer === 'filters') tray.append(...FILTER_IDS.map(filterChip));
    if (drawer === 'stickers') tray.append(stickerShelf());
    if (drawer === 'caption') tray.append(captionField());
  };

  const filterChip = (id: FilterId) => {
    const b = el('button', { type: 'button', className: `hud-camera-filter hud-filter-${id}` });
    b.append(el('span', { className: 'hud-camera-swatch' }), FILTERS[id].name);
    b.setAttribute('aria-pressed', String(filter === id));
    b.addEventListener('click', () => {
      filter = id;
      api.filter(id);
      tell(FILTERS[id].line);
      for (const chip of tray.querySelectorAll('.hud-camera-filter')) {
        chip.setAttribute('aria-pressed', String(chip === b));
      }
    });
    return b;
  };

  const stickerShelf = () => {
    const shelf = el('div', { className: 'hud-camera-shelf' });
    const choices = api.stickers();
    if (choices.length === 0) {
      shelf.append(el('p', {}, 'Catch a critter or find a doll, and it can be a sticker.'));
    }
    for (const id of choices) {
      const canvas = el('canvas', { className: 'hud-icon' });
      api.stickerIcon(canvas, id);
      fitIcon(canvas, DRAWER_ICON);
      const b = el('button', { type: 'button', className: 'hud-camera-sticker-pick' }, canvas);
      b.setAttribute('aria-label', ITEMS[id].name);
      b.addEventListener('click', () => addSticker(id));
      shelf.append(b);
    }
    return shelf;
  };

  const captionField = () => {
    const input = el('input', { className: 'hud-camera-input', type: 'text', value: caption });
    input.maxLength = CAPTION_MAX;
    input.placeholder = 'Write something under it';
    input.setAttribute('aria-label', 'Caption');
    input.setAttribute('enterkeyhint', 'done');
    input.autocomplete = 'off';
    input.addEventListener('input', () => {
      caption = captionOf(input.value);
      showCaption();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur();
    });
    setTimeout(() => input.focus(), 0);
    return input;
  };

  // ---- Stickers and the caption, placed on the photo ------------------------------------------

  const addSticker = (id: ItemId) => {
    const n = stickers.length;
    const more = withSticker(stickers, {
      id,
      x: 0.5 + ((n % 3) - 1) * 0.2,
      y: 0.5 + (Math.floor(n / 3) - 0.5) * 0.2,
    });
    if (!more) return tell(SNAPPED.full);
    stickers = more;
    tell(`${ITEMS[id].name}: drag it where you like.`);
    showStickers();
  };

  const showStickers = () => {
    const frame = api.frame();
    placed.replaceChildren(
      ...stickers.map((s, i) => {
        const canvas = el('canvas', { className: 'hud-icon hud-camera-sticker' });
        api.stickerIcon(canvas, s.id);
        canvas.dataset.n = String(i);
        canvas.setAttribute('aria-label', ITEMS[s.id].name);
        if (frame) place(canvas, s, frame);
        return canvas;
      }),
    );
    stickerButton.toggleAttribute('data-full', stickers.length >= STICKER_LIMIT);
  };

  const place = (sticker: HTMLElement, s: { x: number; y: number }, frame: FrameOnScreen) => {
    // A 16-pixel icon at twice, as it's drawn on the photo, in her pixels on the page.
    const size = 32 * frame.unit;
    sticker.style.width = `${size}px`;
    sticker.style.height = `${size}px`;
    sticker.style.left = `${frame.left + s.x * frame.width - size / 2}px`;
    sticker.style.top = `${frame.top + s.y * frame.height - size / 2}px`;
  };

  const showCaption = () => {
    const frame = api.frame();
    writing.textContent = caption;
    if (!frame) return;
    writing.style.left = `${frame.left}px`;
    writing.style.width = `${frame.width}px`;
    writing.style.top = `${frame.top + frame.height}px`;
    writing.style.height = `${frame.foot}px`;
    writing.style.fontSize = `${Math.max(11, Math.round(frame.foot * 0.45))}px`;
  };

  const layout = () => {
    showStickers();
    showCaption();
  };

  // ---- Dragging: a sticker where she put her finger on one, else the town; pinching, in or out --

  const fingers = new Map<number, { x: number; y: number }>();
  let dragging: { n: number; el: HTMLElement } | null = null;
  let pinch: { from: number; done: boolean } | null = null;
  const spread = () => {
    const [a, b] = [...fingers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  const fractionAt = (x: number, y: number, frame: FrameOnScreen) => ({
    fx: (x - frame.left) / frame.width,
    fy: (y - frame.top) / frame.height,
  });
  const off = (fx: number, fy: number) =>
    fx < -OFF_BY || fy < -OFF_BY || fx > 1 + OFF_BY || fy > 1 + OFF_BY;

  layer.addEventListener('pointerdown', (e) => {
    layer.setPointerCapture?.(e.pointerId);
    fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (fingers.size === 1 && target?.dataset.n !== undefined) {
      dragging = { n: Number(target.dataset.n), el: target };
      target.classList.add('hud-camera-held');
    }
    if (fingers.size === 2) {
      dragging?.el.classList.remove('hud-camera-held');
      dragging = null;
      pinch = { from: spread(), done: false };
    }
  });
  layer.addEventListener('pointermove', (e) => {
    const was = fingers.get(e.pointerId);
    if (!was) return;
    const now = { x: e.clientX, y: e.clientY };
    fingers.set(e.pointerId, now);
    if (pinch) {
      const ratio = spread() / Math.max(1, pinch.from);
      if (!pinch.done && (ratio > PINCH || ratio < 1 / PINCH)) {
        pinch.done = true;
        zoomTo(ratio > 1 ? 'close' : 'far');
      }
      return;
    }
    if (dragging) {
      const frame = api.frame();
      if (!frame) return;
      const { fx, fy } = fractionAt(now.x, now.y, frame);
      place(dragging.el, { x: fx, y: fy }, frame);
      dragging.el.classList.toggle('hud-camera-off', off(fx, fy));
      return;
    }
    api.pan(now.x - was.x, now.y - was.y);
  });
  const lift = (e: PointerEvent) => {
    if (!fingers.delete(e.pointerId)) return;
    if (dragging) {
      const frame = api.frame();
      if (frame) {
        const { fx, fy } = fractionAt(e.clientX, e.clientY, frame);
        if (off(fx, fy)) stickers = stickers.filter((_, i) => i !== dragging!.n);
        else stickers = movedSticker(stickers, dragging.n, fx, fy);
      }
      dragging = null;
      showStickers();
    }
    if (fingers.size === 0) pinch = null;
  };
  layer.addEventListener('pointerup', lift);
  layer.addEventListener('pointercancel', lift);

  // ---- The shutter -----------------------------------------------------------------------------

  const snap = () => {
    if (drawer) open(drawer);
    const shot = api.shoot(stickers, caption);
    if (!shot) return;
    hud.setAttribute('data-camera-card', '');
    openPhoto(hud, shot.picture, caption, () => shot.print(), {
      title: SNAPPED.title,
      line: SNAPPED.line,
      done: 'Done',
      another: 'Another',
      takenAt: () => api.takenAt(),
      closed: (again) => {
        hud.removeAttribute('data-camera-card');
        if (!again) close();
      },
    });
  };

  // Turning the phone, or the bars settling, moves where the photo is on the page.
  const resizing = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(layout) : null;
  resizing?.observe(layer);
  showZoom();
  // The bars go as the camera comes up: wait a frame for the town to be fitted to the room.
  requestAnimationFrame(layout);

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    resizing?.disconnect();
    layer.remove();
    strip.remove();
    tray.remove();
    hud.removeAttribute('data-camera');
    api.lower();
    onClose();
  };
  return { close };
}
