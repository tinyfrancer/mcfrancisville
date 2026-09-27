import { openBag, type BagApi } from './BagSheet';
import { openCabinet, openMuseum, type CabinetApi } from './CabinetSheet';
import { el, sheetOpen } from './dom';
import { openWorkbench, type CraftApi } from './CraftSheet';
import { decorBar, openStorage, type HomeApi } from './HomeSheets';
import { readDismissedAt, shouldShowInstallHint, writeDismissedAt } from './installHint';
import { openCreator, openSalon, openWardrobe } from './LookSheets';
import type { LookApi } from './pickers';
import type { Toast } from './messages';
import { candy } from './messages';
import { openSeeds, type FarmApi } from './SeedSheet';
import { openSettings, type SaveApi } from './SettingsSheet';
import { openMail, type MailApi } from './MailSheet';
import { openShop, type ShopApi } from './ShopSheet';
import { openGreeting, openTalk, type TalkApi } from './TalkSheet';
import type { ShopId, VillagerId } from '../types/ids';
import { injectHudStyles } from './styles';

export interface HudOptions {
  save: SaveApi;
  looks: LookApi;
  bag: BagApi;
  farm: FarmApi;
  shop: ShopApi;
  home: HomeApi;
  craft: CraftApi;
  talk: TalkApi;
  mail: MailApi;
  cabinet: CabinetApi;
  standalone: boolean;
}

/** What the game may open on the HUD from outside it. */
export interface Hud {
  element: HTMLElement;
  openCreator(onDone: () => void): void;
  /** Opens the salon, unless a sheet is already up. */
  openSalon(): void;
  /** Asks which seed to plant, unless a sheet is already up. */
  openSeeds(): void;
  /** Opens a shop's counter, unless a sheet is already up. */
  openShop(shop: ShopId): void;
  /** Opens her storage chest, unless a sheet is already up. */
  openStorage(): void;
  /** Opens her workbench, unless a sheet is already up. */
  openWorkbench(): void;
  /** Talks to a neighbour, unless a sheet is already up; false if one was. */
  openTalk(id: VillagerId): boolean;
  /** Opens her mailbox, unless a sheet is already up. */
  openMail(): void;
  /** Opens Wrapunzel's museum, unless a sheet is already up. */
  openMuseum(): void;
  /** A neighbour says one thing, and she answers with `reply`, over whatever sheet is up. */
  greet(id: VillagerId, line: string, reply: string): void;
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
    cornerButton('hud-cabinet', 'Curiosity Cabinet', '📖', () => openCabinet(hud, options.cabinet)),
    cornerButton('hud-settings', 'Settings', '⚙︎', () => openSettings(hud, options.save)),
  );
  hud.append(corner);

  // At home, a button to start decorating, and the bar that shows while she does.
  const home = options.home;
  const decorate = cornerButton('hud-decorate', 'Decorate', '🛋️', () => home.startDecorating());
  corner.prepend(decorate);
  const bar = decorBar(hud, home);
  hud.append(bar.element);
  const showHome = () => {
    decorate.hidden = !home.indoors() || home.selected() !== undefined;
    bar.render();
  };
  showHome();
  home.onChange(showHome);

  // Her Candy, in the corner opposite the buttons. It's only to read, so taps fall through it.
  const purse = el('div', { className: 'hud-candy' });
  purse.setAttribute('aria-label', 'Candy');
  const showCandy = (amount: number) => (purse.textContent = candy(amount));
  showCandy(options.shop.candy());
  options.shop.onCandy(showCandy);
  hud.append(purse);

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
    openSeeds() {
      if (!sheetOpen(hud)) openSeeds(hud, options.farm);
    },
    openShop(shop) {
      if (!sheetOpen(hud)) openShop(hud, options.shop, shop);
    },
    openStorage() {
      if (!sheetOpen(hud)) openStorage(hud, home);
    },
    openWorkbench() {
      if (!sheetOpen(hud)) openWorkbench(hud, options.craft);
    },
    openTalk(id) {
      if (sheetOpen(hud)) return false;
      openTalk(hud, options.talk, id);
      return true;
    },
    openMail() {
      if (!sheetOpen(hud)) openMail(hud, options.mail);
    },
    openMuseum() {
      if (!sheetOpen(hud)) openMuseum(hud, options.cabinet);
    },
    greet(id, line, reply) {
      openGreeting(hud, options.talk, id, line, reply);
    },
    toast({ text, special, icon }) {
      toastLine.textContent = icon ? `${icon} ${text}` : text;
      toastLine.classList.toggle('hud-toast-special', special === true);
      toastLine.classList.add('hud-toast-shown');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastLine.classList.remove('hud-toast-shown'), TOAST_MS);
    },
  };
}
