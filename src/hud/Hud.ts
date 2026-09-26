import { readDismissedAt, shouldShowInstallHint, writeDismissedAt } from './installHint';
import { openSettings, type SaveApi } from './SettingsSheet';
import { injectHudStyles } from './styles';

export interface HudOptions {
  save: SaveApi;
  standalone: boolean;
}

/**
 * The overlay over the game. It is `pointer-events: none` with each control opting back in, so a
 * tap anywhere else falls straight through to the town.
 */
export function mountHud(root: HTMLElement, options: HudOptions): HTMLElement {
  injectHudStyles();
  const hud = document.createElement('div');
  hud.className = 'hud';

  const gear = document.createElement('button');
  gear.type = 'button';
  gear.className = 'hud-gear';
  gear.setAttribute('aria-label', 'Settings');
  gear.textContent = '⚙︎';
  gear.addEventListener('click', () => openSettings(hud, options.save));
  hud.append(gear);

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

  root.append(hud);
  return hud;
}
