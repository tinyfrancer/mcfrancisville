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
  /** A tap on the backdrop closes it. The creator isn't: she has to finish it. */
  dismissable?: boolean;
  className?: string;
  /** Called once it closes, however it closes. */
  onClose?: () => void;
}

const open = new WeakMap<HTMLElement, () => void>();

/**
 * A sheet that rises from the bottom over a backdrop, one at a time: opening one closes whatever
 * was open. Returns the sheet to fill and a function that closes it.
 */
export function openSheet(
  hud: HTMLElement,
  options: SheetOptions = {},
): { sheet: HTMLElement; close: () => void } {
  open.get(hud)?.();
  const backdrop = el('div', { className: 'hud-backdrop' });
  const sheet = el('div', {
    className: `hud-sheet ${options.className ?? ''}`.trim(),
    role: 'dialog',
  });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    backdrop.remove();
    sheet.remove();
    if (open.get(hud) === close) open.delete(hud);
    options.onClose?.();
  };
  if (options.dismissable !== false) backdrop.addEventListener('click', close);
  hud.append(backdrop, sheet);
  open.set(hud, close);
  return { sheet, close };
}

/** Whether a sheet is up, so the town can hold off opening another over it. */
export function sheetOpen(hud: HTMLElement): boolean {
  return open.has(hud);
}
