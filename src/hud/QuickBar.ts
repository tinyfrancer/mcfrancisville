import { ITEMS } from '../data/items';
import { isTool, TOOL_IDS, TOOLS } from '../data/tools';
import type { ItemId, ToolId } from '../types/ids';
import type { Stack } from '../world/Bag';
import { fitIcon } from './collection';
import { el } from './dom';

/** What the quick bar may ask of the game. Like the sheets, it never reaches the world directly. */
export interface QuickApi {
  /** What she's holding: a tool, or a seed. */
  held(): string;
  /** The seeds and sprinklers in her bag, to hold one and plant or fit it. */
  seeds(): readonly Stack[];
  hold(held: string): void;
  /** Whether it's worth showing: outdoors, where there are beds and critters. */
  shown(): boolean;
  /** Calls `listener` when what she holds, her bag or where she is changes. */
  onChange(listener: () => void): () => void;
  toolIcon(canvas: HTMLCanvasElement, id: ToolId): void;
  itemIcon(canvas: HTMLCanvasElement, id: ItemId): void;
  /** Whether she has her broom yet (0.2's P1). */
  hasBroom(): boolean;
  /** Hops on her broom and swoops home. */
  flyHome(): void;
  broomIcon(canvas: HTMLCanvasElement): void;
}

/** A slot's icon box: smaller than a sheet's, so the bar stays low over the town. */
const QUICK_ICON = 32;
/** How long what she picked up is named above the bar. */
const SAY_MS = 2400;

/** What the bar says when she picks something up. */
export function heldLine(held: string, seeds: readonly Stack[]): string {
  if (isTool(held)) return TOOLS[held].description;
  const count = seeds.find((s) => s.id === held)?.count ?? 0;
  const row = ITEMS[held as ItemId];
  if (row.kind === 'gear') return `${row.name} ×${count}: tap a bed to fit one in its corner.`;
  return `${row.name} ×${count}: tap a bed to plant one, or a whole row.`;
}

/**
 * The quick bar (phase M): what she's holding, along the bottom while she's outdoors. Her hands,
 * her net and her watering can are always there, and then each seed in her bag. A tap picks one
 * up; a tap on the seed she's holding puts it down again.
 */
export function quickBar(api: QuickApi): { element: HTMLElement; render(): void } {
  const slots = el('div', { className: 'hud-quick-slots' });
  const say = el('p', { className: 'hud-quick-say' });
  say.setAttribute('role', 'status');
  const element = el('div', { className: 'hud-quick' }, say, slots);
  element.setAttribute('role', 'toolbar');
  element.setAttribute('aria-label', "What you're holding");
  let timer: ReturnType<typeof setTimeout> | undefined;

  const slot = (id: string, label: string, draw: (c: HTMLCanvasElement) => void, count = 0) => {
    const canvas = el('canvas', { className: 'hud-icon' });
    draw(canvas);
    fitIcon(canvas, QUICK_ICON);
    const b = el('button', { type: 'button', className: 'hud-quick-slot' }, canvas);
    b.setAttribute('aria-label', count > 0 ? `${label}, ${count}` : label);
    b.setAttribute('aria-pressed', String(api.held() === id));
    if (count > 1) b.append(el('span', { className: 'hud-count' }, String(count)));
    b.addEventListener('click', () => {
      api.hold(api.held() === id && !isTool(id) ? 'hands' : id);
      say.textContent = heldLine(api.held(), api.seeds());
      say.classList.add('hud-quick-said');
      clearTimeout(timer);
      timer = setTimeout(() => say.classList.remove('hud-quick-said'), SAY_MS);
    });
    return b;
  };

  // Her broom isn't held but ridden: a tap and she's off home (0.2's P1).
  const broom = () => {
    const canvas = el('canvas', { className: 'hud-icon' });
    api.broomIcon(canvas);
    fitIcon(canvas, QUICK_ICON);
    const b = el('button', { type: 'button', className: 'hud-quick-slot hud-quick-broom' }, canvas);
    b.setAttribute('aria-label', 'Broom home');
    b.addEventListener('click', () => api.flyHome());
    return b;
  };

  const render = () => {
    element.hidden = !api.shown();
    if (element.hidden) return;
    const seeds = api.seeds();
    slots.replaceChildren(
      ...(api.hasBroom() ? [broom()] : []),
      ...TOOL_IDS.map((id) => slot(id, TOOLS[id].name, (c) => api.toolIcon(c, id))),
      ...seeds.map((s) => slot(s.id, ITEMS[s.id].name, (c) => api.itemIcon(c, s.id), s.count)),
    );
  };
  render();
  return { element, render };
}
