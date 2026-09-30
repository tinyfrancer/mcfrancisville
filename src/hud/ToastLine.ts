import type { Toast } from './messages';

/** A toast shows along the bottom instead while she's in this top share of the screen. */
const TOAST_LOW_ABOVE = 0.45;

/** The shortest a toast stays, however little it says. */
export const TOAST_MIN_MS = 3000;
/** The longest, for a letter's worth; a tap sends one off sooner. */
export const TOAST_MAX_MS = 12000;

/**
 * How long a toast stays: a second to look up, then about as long as reading it takes, at a gentle
 * pace (sixty milliseconds a letter is two hundred words a minute), never under three seconds.
 */
export function toastMs(toast: Toast): number {
  const letters = toast.text.length + (toast.icon ? 2 : 0);
  return Math.min(TOAST_MAX_MS, Math.max(TOAST_MIN_MS, 1000 + letters * 60));
}

export interface ToastLine {
  element: HTMLElement;
  show(toast: Toast): void;
  /** Where she is on the page this frame (client y), so a toast can keep out of her way. */
  playerAt(clientY: number): void;
}

/**
 * The line a toast is said on: one at a time, each for as long as it takes to read, and gone at a
 * tap (which reaches it and not the world under it). Two big moments at once (a new place, and a
 * letter about it) each get their turn; anything else simply takes the line.
 */
export function toastLine(hud: HTMLElement): ToastLine {
  const element = document.createElement('div');
  element.className = 'hud-toast';
  element.setAttribute('role', 'status');
  element.setAttribute('aria-live', 'polite');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let showing: Toast | null = null;
  const waiting: Toast[] = [];
  let playerY: number | null = null;

  const done = () => {
    clearTimeout(timer);
    showing = null;
    element.classList.remove('hud-toast-shown');
    const next = waiting.shift();
    if (next) show(next);
  };

  const show = (toast: Toast) => {
    const { text, special, icon } = toast;
    showing = toast;
    // Up by the farm, the top of town, a toast at the top would cover what she just tended.
    const box = hud.getBoundingClientRect();
    const high = playerY !== null && playerY - box.top < box.height * TOAST_LOW_ABOVE;
    element.classList.toggle('hud-toast-low', high);
    element.textContent = icon ? `${icon} ${text}` : text;
    element.classList.toggle('hud-toast-special', special === true);
    element.classList.add('hud-toast-shown');
    clearTimeout(timer);
    timer = setTimeout(done, toastMs(toast));
  };

  element.addEventListener('pointerdown', (e) => {
    if (!showing) return;
    e.preventDefault();
    e.stopPropagation();
    done();
  });

  return {
    element,
    show(toast) {
      if (showing?.special && toast.special) waiting.push(toast);
      else show(toast);
    },
    playerAt(y) {
      playerY = y;
    },
  };
}
