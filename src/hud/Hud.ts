import { openBag, type BagApi } from './BagSheet';
import { el, sheetOpen } from './dom';
import { readDismissedAt, shouldShowInstallHint, writeDismissedAt } from './installHint';
import { openCreator, openSalon, openWardrobe } from './LookSheets';
import type { LookApi } from './pickers';
import type { Toast } from './messages';
import { openSettings, type SaveApi } from './SettingsSheet';
import { injectHudStyles } from './styles';

export interface HudOptions {
  save: SaveApi;
  looks: LookApi;
  bag: BagApi;
  standalone: boolean;
}

/** What the game may open on the HUD from outside it. */
export interface Hud {
  element: HTMLElement;
  openCreator(onDone: () => void): void;
  /** Opens the salon, unless a sheet is already up. */
  openSalon(): void;
  /** A line across the top for a moment: what she just found. */
  toast(toast: Toast): void;
}

/** How long a toast stays, long enough to read twice. */
const TOAST_MS = 2800;

function cornerButton(className: string, label: string, text: string, onClick: () => void) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `hud-round ${className}`;
  button.setAttribute('aria-label', label);
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
}

/**
 * The overlay over the game. It is `pointer-events: none` with each control opting back in, so a
 * tap anywhere else falls straight through to the town.
 */
export function mountHud(root: HTMLElement, options: HudOptions): Hud {
  injectHudStyles();
  const hud = document.createElement('div');
  hud.className = 'hud';

  const corner = document.createElement('div');
  corner.className = 'hud-corner';
  const bag = cornerButton('hud-bag-button', 'Bag', '🎒', () => {
    bag.removeAttribute('data-new');
    openBag(hud, options.bag);
  });
  // A little dot on the bag when something new has gone in since she last looked.
  options.bag.onChange(() => bag.setAttribute('data-new', ''));
  corner.append(
    bag,
    cornerButton('hud-closet', 'Closet', '👗', () => openWardrobe(hud, options.looks)),
    cornerButton('hud-settings', 'Settings', '⚙︎', () => openSettings(hud, options.save)),
  );
  hud.append(corner);

  const now = Date.now();
  const showHint = shouldShowInstallHint({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone: options.standalone,
    dismissedAt: readDismissedAt(),
    now,
  });
  if (showHint) {
    const card = document.createElement('div');
    card.className = 'hud-card hud-install';
    const text = document.createElement('p');
    text.textContent =
      'Add McFrancisVille to your Home Screen to keep your town safe: tap Share, then Add to Home Screen.';
    const ok = document.createElement('button');
    ok.type = 'button';
    ok.textContent = 'Got it';
    ok.addEventListener('click', () => {
      writeDismissedAt(Date.now());
      card.remove();
    });
    card.append(text, ok);
    hud.append(card);
  }

  const toastLine = el('div', { className: 'hud-toast' });
  toastLine.setAttribute('role', 'status');
  toastLine.setAttribute('aria-live', 'polite');
  hud.append(toastLine);
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  root.append(hud);
  return {
    element: hud,
    openCreator: (onDone) => openCreator(hud, options.looks, onDone),
    openSalon() {
      if (!sheetOpen(hud)) openSalon(hud, options.looks);
    },
    toast({ text, special }) {
      toastLine.textContent = special ? `🌙 ${text}` : text;
      toastLine.classList.toggle('hud-toast-special', special === true);
      toastLine.classList.add('hud-toast-shown');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastLine.classList.remove('hud-toast-shown'), TOAST_MS);
    },
  };
}
