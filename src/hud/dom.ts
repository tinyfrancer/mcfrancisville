export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

export interface SheetOptions {
  /** What it's called, at the top. */
  title?: string;
  /** A line under the title: a greeting, or how many she has found. */
  line?: string;
  /** Something in place of the title, a neighbour's portrait and name, say. */
  head?: Node;
  /** A tap on the backdrop closes it. The creator isn't: she has to finish it. */
  dismissable?: boolean;
  className?: string;
  /** Called once it closes, however it closes. */
  onClose?: () => void;
  /** What the button in its foot that closes it says; null for none, when it has its own. */
  done?: string | null;
}

/**
 * Every sheet is built the same way (phase M): a head that stays put, with its title, a line and
 * anything that should stay in sight (her Candy, a search box); a body that scrolls; and a foot
 * with what can be done, and the button that closes it last.
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
}

const open = new WeakMap<HTMLElement, () => void>();

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
  const head = el('div', { className: 'hud-sheet-head' }, options.head ?? title, line);
  const body = el('div', { className: 'hud-sheet-body' });
  const actions = el('div', { className: 'hud-sheet-actions' });
  const foot = el('div', { className: 'hud-sheet-foot' }, actions);
  element.append(head, body, foot);
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
  };
}

/** A button for a sheet: a primary one is the thing to do. */
export function button(text: string, onClick: () => void, primary = false): HTMLButtonElement {
  const b = el('button', { type: 'button', textContent: text });
  if (primary) b.className = 'hud-primary';
  b.addEventListener('click', onClick);
  return b;
}

/** Whether a sheet is up, so the town can hold off opening another over it. */
export function sheetOpen(hud: HTMLElement): boolean {
  return open.has(hud);
}
