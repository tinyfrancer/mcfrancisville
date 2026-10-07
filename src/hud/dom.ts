import { THEME } from '../ui/theme';

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

/** One of a sheet's sections, a tab along its head. */
export interface SheetTab {
  id: string;
  label: string;
}

export interface SheetOptions {
  /** What it's called, at the top. */
  title?: string;
  /** A line under the title: a greeting, or how many she has found. */
  line?: string;
  /**
   * A picture beside the title, drawn by the sheet: a neighbour's portrait, her broom. Sized by
   * the sheet to a whole scale of at most `PICTURE`.
   */
  picture?: HTMLElement;
  /** Its sections, a tab each along the head; each has a panel in the body (`panel`). */
  tabs?: readonly SheetTab[];
  /** The tab it opens on, if not the first or the one she was last on. */
  tab?: string;
  /** Called when she picks another tab, after its panel is shown. */
  onTab?(id: string): void;
  /** Remembers the tab she was last on while the game is open, under this name. */
  memory?: string;
  /** A tap on the backdrop closes it. The creator isn't: she has to finish it. */
  dismissable?: boolean;
  className?: string;
  /** Called once it closes, however it closes. */
  onClose?: () => void;
  /** What the button in its foot that closes it says; null for none, when it has its own. */
  done?: string | null;
}

/** The box beside a sheet's title, in CSS pixels. */
export const PICTURE = THEME.picture;

/**
 * Every sheet is built the same way (phase M, redrawn in 0.2's U2): a head that stays put, with a
 * picture, its title and a line, its tabs, and anything that should stay in sight (her Candy, a
 * search box); a body that scrolls, a panel per tab; and a foot with what can be done, and the
 * button that closes it last.
 */
export interface Sheet {
  element: HTMLElement;
  head: HTMLElement;
  body: HTMLElement;
  foot: HTMLElement;
  close(): void;
  title(text: string): void;
  line(text: string): void;
  /** Puts these in the foot, before its Done. */
  actions(...buttons: HTMLElement[]): void;
  /** The body's panel for a tab, shown only while that tab is. */
  panel(id: string): HTMLElement;
  /** The tab shown. */
  tab(): string;
  /** Shows another tab, as a tap on it would. */
  show(id: string): void;
}

const open = new WeakMap<HTMLElement, () => void>();
const lastTab = new Map<string, string>();
let sheets = 0;

/**
 * A sheet that rises from the bottom over a backdrop, one at a time: opening one closes whatever
 * was open.
 */
export function openSheet(hud: HTMLElement, options: SheetOptions = {}): Sheet {
  open.get(hud)?.();
  const backdrop = el('div', { className: 'hud-backdrop' });
  const element = el('div', {
    className: `hud-sheet ${options.className ?? ''}`.trim(),
    role: 'dialog',
  });
  const title = el('h2', {}, options.title ?? '');
  const line = el('p', { className: 'hud-sheet-line' }, options.line ?? '');
  line.hidden = !options.line;
  const named = el('div', { className: 'hud-sheet-named' }, title, line);
  const titled = el('div', { className: 'hud-sheet-title' });
  if (options.picture) {
    titled.append(el('div', { className: 'hud-sheet-picture' }, options.picture));
  }
  titled.append(named);
  const head = el('div', { className: 'hud-sheet-head' }, titled);
  const body = el('div', { className: 'hud-sheet-body' });
  const actions = el('div', { className: 'hud-sheet-actions' });
  const foot = el('div', { className: 'hud-sheet-foot' }, actions);
  element.append(head, body, foot);

  const n = ++sheets;
  const tabs = options.tabs ?? [];
  const panels = new Map<string, HTMLElement>();
  const buttons = new Map<string, HTMLButtonElement>();
  const kept = options.memory ? lastTab.get(options.memory) : undefined;
  const has = (id: string | undefined) => id !== undefined && tabs.some((t) => t.id === id);
  let current = has(options.tab) ? options.tab! : has(kept) ? kept! : (tabs[0]?.id ?? '');
  const paint = () => {
    for (const t of tabs) {
      const on = t.id === current;
      buttons.get(t.id)!.setAttribute('aria-selected', String(on));
      buttons.get(t.id)!.tabIndex = on ? 0 : -1;
      panels.get(t.id)!.hidden = !on;
    }
  };
  const show = (id: string) => {
    if (!has(id) || id === current) return;
    current = id;
    if (options.memory) lastTab.set(options.memory, id);
    paint();
    body.scrollTop = 0;
    options.onTab?.(id);
  };
  if (tabs.length > 0) {
    const bar = el('div', { className: 'hud-sheet-tabs' });
    bar.setAttribute('role', 'tablist');
    for (const t of tabs) {
      const b = el('button', { type: 'button', className: 'hud-sheet-tab', textContent: t.label });
      const panel = el('div', { className: 'hud-sheet-panel' });
      b.id = `hud-tab-${n}-${t.id}`;
      panel.id = `hud-panel-${n}-${t.id}`;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', b.id);
      b.addEventListener('click', () => show(t.id));
      buttons.set(t.id, b);
      panels.set(t.id, panel);
      bar.append(b);
      body.append(panel);
    }
    head.append(bar);
    paint();
  }

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    backdrop.remove();
    element.remove();
    if (open.get(hud) === close) open.delete(hud);
    options.onClose?.();
  };
  if (options.done !== null) {
    const done = el('button', {
      type: 'button',
      className: 'hud-primary hud-done',
      textContent: options.done ?? 'Done',
    });
    done.addEventListener('click', close);
    foot.append(done);
  }
  if (options.dismissable !== false) backdrop.addEventListener('click', close);
  hud.append(backdrop, element);
  open.set(hud, close);
  return {
    element,
    head,
    body,
    foot,
    close,
    title: (text) => (title.textContent = text),
    line(text) {
      line.textContent = text;
      line.hidden = text === '';
    },
    actions: (...buttons) => actions.replaceChildren(...buttons),
    panel(id) {
      const panel = panels.get(id);
      if (!panel) throw new Error(`No tab ${id} on this sheet`);
      return panel;
    },
    tab: () => current,
    show,
  };
}

/** A button for a sheet: a primary one is the thing to do. */
export function button(text: string, onClick: () => void, primary = false): HTMLButtonElement {
  const b = el('button', { type: 'button', textContent: text });
  if (primary) b.className = 'hud-primary';
  b.addEventListener('click', onClick);
  return b;
}

/**
 * How a held button repeats (V1's S4, decision 320): a step as it's pressed, the next after
 * `delay`, then a step every `slow` ms easing down to every `fast` by `rampTo` ms held.
 */
export const HELD = { delay: 400, slow: 120, fast: 50, rampTo: 2000 } as const;

/** How long until the next step of a button held for `heldFor` ms. */
export function heldGap(heldFor: number): number {
  if (heldFor < HELD.delay) return HELD.delay - heldFor;
  const t = Math.min(1, (heldFor - HELD.delay) / (HELD.rampTo - HELD.delay));
  return Math.round(HELD.slow + (HELD.fast - HELD.slow) * t);
}

/**
 * A button that steps once on a tap and over and over while it's held, faster the longer (decision
 * 275: hold − and + to sell more). It stops when she lets go, slides off it, or it's disabled (all
 * she has). A click with no press before it (a keyboard, a script) is one step.
 */
export function held(button: HTMLButtonElement, step: () => void): void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let since = 0;
  // A press already stepped, so the click the browser sends after it doesn't step again.
  let pressed = false;
  const stop = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  const go = (): boolean => {
    step();
    if (!button.disabled && button.isConnected) return true;
    pressed = false;
    stop();
    return false;
  };
  const repeat = () => {
    timer = null;
    if (go()) timer = setTimeout(repeat, heldGap(Date.now() - since));
  };
  button.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || button.disabled) return;
    stop();
    pressed = true;
    since = Date.now();
    if (go()) timer = setTimeout(repeat, HELD.delay);
  });
  for (const end of ['pointerup', 'pointerleave', 'pointercancel'] as const) {
    button.addEventListener(end, stop);
  }
  button.addEventListener('pointercancel', () => (pressed = false));
  button.addEventListener('click', () => {
    if (pressed) pressed = false;
    else go();
  });
  // A long press is a hold, never the phone's own: no text picked, no callout, no menu.
  button.style.setProperty('user-select', 'none');
  button.style.setProperty('-webkit-user-select', 'none');
  button.style.setProperty('-webkit-touch-callout', 'none');
  button.addEventListener('contextmenu', (e) => e.preventDefault());
}

/** Whether a sheet is up, so the town can hold off opening another over it. */
export function sheetOpen(hud: HTMLElement): boolean {
  return open.has(hud);
}
