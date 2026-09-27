import { FLOORINGS, FURNITURE, turnCount, WALLPAPERS } from '../data/furniture';
import type { Placed } from '../data/home';
import type { FlooringId, FurnitureId, WallpaperId } from '../types/ids';
import { el, openSheet } from './dom';

/** What the home's sheets and bar may ask of the game. Like the others, they never reach the world. */
export interface HomeApi {
  /** Whether she's at home, where decorating happens. */
  indoors(): boolean;
  /**
   * Calls `listener` when she goes in or out, starts or stops decorating, picks up a piece, or
   * her home changes. Returns a function that stops it.
   */
  onChange(listener: () => void): () => void;
  /** What's waiting in her storage chest. */
  stored(): readonly { id: FurnitureId; count: number }[];
  /** The piece she has picked up while decorating, null if none, or undefined if not decorating. */
  selected(): Placed | null | undefined;
  startDecorating(): void;
  stopDecorating(): void;
  /** Takes a piece out of the chest and sets it down beside her, picked up. False if no room. */
  takeOut(id: FurnitureId): boolean;
  turn(): boolean;
  putAway(): boolean;
  wallpapers(): readonly WallpaperId[];
  floorings(): readonly FlooringId[];
  wallpaper(): WallpaperId;
  flooring(): FlooringId;
  paper(id: WallpaperId): void;
  lay(id: FlooringId): void;
  /** Draws a piece, facing her, into a square canvas at 1×. */
  icon(canvas: HTMLCanvasElement, id: FurnitureId): void;
  /** Draws a tile of a wallpaper or flooring at 1×. */
  surfaceIcon(
    canvas: HTMLCanvasElement,
    surface: { wallpaper: WallpaperId } | { flooring: FlooringId },
  ): void;
}

/**
 * Her storage chest: every piece she owns that isn't out, with how many, and a button to put one
 * out. It sets the piece down beside her, picked up, so her next tap says where it goes.
 */
export function openStorage(hud: HTMLElement, api: HomeApi): () => void {
  const { sheet, close } = openSheet(hud, { className: 'hud-storage-sheet' });
  const stored = api.stored();
  const list = el('div', { className: 'hud-wares' });
  for (const { id, count } of stored) {
    const row = FURNITURE[id];
    const icon = el('canvas', { className: 'hud-piece' });
    api.icon(icon, id);
    const out = el('button', { type: 'button', className: 'hud-price', textContent: 'Put out' });
    out.setAttribute('aria-label', `Put out ${row.name}`);
    out.addEventListener('click', () => {
      close();
      api.takeOut(id);
    });
    const name = count > 1 ? `${row.name} ×${count}` : row.name;
    list.append(
      el(
        'div',
        { className: 'hud-ware' },
        icon,
        el(
          'span',
          { className: 'hud-ware-text' },
          el('strong', {}, name),
          el('small', {}, row.description),
        ),
        out,
      ),
    );
  }
  const done = el('button', { type: 'button', textContent: 'Done' });
  done.addEventListener('click', close);
  const about =
    stored.length > 0
      ? 'Everything you own that isn’t out is kept safe in here.'
      : 'Your storage chest is empty. Cobweb Corner has new furniture every morning!';
  sheet.append(
    el('h2', {}, 'Storage chest'),
    el('p', {}, about),
    list,
    el('div', { className: 'hud-row' }, done),
  );
  return close;
}

/** Her walls and floor: every wallpaper and flooring she owns, the one that's up pressed in. */
export function openSurfaces(hud: HTMLElement, api: HomeApi): () => void {
  const { sheet, close } = openSheet(hud, { className: 'hud-surfaces-sheet' });

  const swatches = <Id extends string>(
    ids: readonly Id[],
    current: () => Id,
    name: (id: Id) => string,
    draw: (canvas: HTMLCanvasElement, id: Id) => void,
    pick: (id: Id) => void,
  ) => {
    const row = el('div', { className: 'hud-choices' });
    const buttons = ids.map((id) => {
      const icon = el('canvas', { className: 'hud-item' });
      draw(icon, id);
      const button = el('button', { type: 'button', className: 'hud-slot hud-surface' }, icon);
      button.setAttribute('aria-label', name(id));
      button.title = name(id);
      button.addEventListener('click', () => {
        pick(id);
        refresh();
      });
      return button;
    });
    const refresh = () =>
      buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(ids[i] === current())));
    refresh();
    row.append(...buttons);
    return row;
  };

  const done = el('button', { type: 'button', className: 'hud-primary', textContent: 'Done' });
  done.addEventListener('click', close);
  sheet.append(
    el('h2', {}, 'Walls & floors'),
    el('h3', {}, 'Wallpaper'),
    swatches(
      api.wallpapers(),
      api.wallpaper,
      (id) => WALLPAPERS[id].name,
      (canvas, wallpaper) => api.surfaceIcon(canvas, { wallpaper }),
      api.paper,
    ),
    el('h3', {}, 'Flooring'),
    swatches(
      api.floorings(),
      api.flooring,
      (id) => FLOORINGS[id].name,
      (canvas, flooring) => api.surfaceIcon(canvas, { flooring }),
      api.lay,
    ),
    el('p', {}, 'New ones turn up at Cobweb Corner. Every one you buy is yours to keep.'),
    el('div', { className: 'hud-row' }, done),
  );
  return close;
}

/**
 * The bar along the bottom while she decorates: what a tap will do, and the buttons for the piece
 * she has picked up (turn it, put it away) or for the room (the chest, the walls and floor).
 * `render` redraws it from the api whenever decorating changes.
 */
export function decorBar(hud: HTMLElement, api: HomeApi): { element: HTMLElement; render(): void } {
  const element = el('div', { className: 'hud-decor-bar' });
  element.setAttribute('role', 'toolbar');
  element.setAttribute('aria-label', 'Decorating');
  const line = el('p', {});
  const buttons = el('div', { className: 'hud-row' });
  element.append(line, buttons);

  const button = (text: string, onClick: () => void, primary = false) => {
    const b = el('button', { type: 'button', textContent: text });
    if (primary) b.className = 'hud-primary';
    b.addEventListener('click', onClick);
    return b;
  };

  const render = () => {
    const selected = api.selected();
    element.hidden = selected === undefined;
    if (selected === undefined) return;
    const done = button('Done', api.stopDecorating, true);
    if (selected) {
      const row = FURNITURE[selected.id];
      line.textContent = `${row.name}: tap where it should go.`;
      const turn = button('↻ Turn', api.turn);
      turn.disabled = turnCount(selected.id) === 1;
      buttons.replaceChildren(turn, button('Put away', api.putAway), done);
    } else {
      line.textContent = 'Tap a piece to pick it up.';
      buttons.replaceChildren(
        button('Storage', () => openStorage(hud, api)),
        button('Walls & floors', () => openSurfaces(hud, api)),
        done,
      );
    }
  };
  render();
  return { element, render };
}
