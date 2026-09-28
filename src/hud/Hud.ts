import { openBag, type BagApi, type FreshApi } from './BagSheet';
import { openCabinet, openMuseum, type CabinetApi } from './CabinetSheet';
import { openCalendar, shortDate, WINDOW_ICON, type CalendarApi } from './CalendarSheet';
import { el, sheetOpen } from './dom';
import { openWorkbench, type CraftApi } from './CraftSheet';
import { decorBar, openStorage, type HomeApi } from './HomeSheets';
import { readDismissedAt, shouldShowInstallHint, writeDismissedAt } from './installHint';
import { openCreator, openSalon, openWardrobe } from './LookSheets';
import type { LookApi } from './pickers';
import type { Toast } from './messages';
import { candy } from './messages';
import { openSeeds, type FarmApi } from './SeedSheet';
import { openSettings, type SaveApi, type SoundApi } from './SettingsSheet';
import { openMail, type MailApi } from './MailSheet';
import { openMap, type MapApi } from './MapSheet';
import { openShop, type ShopApi } from './ShopSheet';
import { openPet, type PetApi } from './PetSheet';
import { quickBar, type QuickApi } from './QuickBar';
import { openCorkboard, type MysteryApi } from './CorkboardSheet';
import { openNotices, type NoticeApi } from './NoticeSheet';
import { openGreeting, openTalk, type TalkApi } from './TalkSheet';
import { CALENDAR } from '../data/calendar';
import type { PetId, ShelfId, ShopId, VillagerId } from '../types/ids';
import { injectHudStyles } from './styles';

export interface HudOptions {
  save: SaveApi;
  sound: SoundApi;
  looks: LookApi;
  bag: BagApi;
  fresh: FreshApi;
  farm: FarmApi;
  shop: ShopApi;
  home: HomeApi;
  craft: CraftApi;
  talk: TalkApi;
  mail: MailApi;
  cabinet: CabinetApi;
  pets: PetApi;
  mystery: MysteryApi;
  map: MapApi;
  calendar: CalendarApi;
  notices: NoticeApi;
  quick: QuickApi;
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
  /** Opens her mystery corkboard, unless a sheet is already up. */
  openCorkboard(): void;
  /** Opens the noticeboard by the square, unless a sheet is already up. */
  openNotices(): void;
  /** Sees to a pet, unless a sheet is already up; false if one was. */
  openPet(id: PetId): boolean;
  /** A neighbour says one thing, and she answers with `reply`, over whatever sheet is up. */
  greet(id: VillagerId, line: string, reply: string): void;
  /** A line across the top for a moment: what she just found. */
  toast(toast: Toast): void;
  /** Fades the game in from dark, as she comes into a new place. */
  fade(): void;
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
  // Under everything else on the HUD: it only ever covers the game.
  const fader = el('div', { className: 'hud-fade' });
  hud.append(fader);

  const corner = document.createElement('div');
  corner.className = 'hud-corner';
  const bag = cornerButton('hud-bag-button', 'Bag', '🎒', () => openBag(hud, options.bag));
  const closet = cornerButton('hud-closet', 'Closet', '👗', () => openWardrobe(hud, options.looks));
  const cabinet = cornerButton('hud-cabinet', 'Curiosity Cabinet', '📖', () =>
    openCabinet(hud, options.cabinet),
  );
  corner.append(
    bag,
    closet,
    cornerButton('hud-map-button', 'Map', '🗺️', () => openMap(hud, options.map)),
    cabinet,
    cornerButton('hud-settings', 'Settings', '⚙︎', () =>
      openSettings(hud, options.save, options.sound),
    ),
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

  // What she's holding, along the bottom while she's outdoors.
  const quick = quickBar(options.quick);
  hud.append(quick.element);
  options.quick.onChange(quick.render);

  // A little dot on a button while something new is waiting behind it.
  const dotted: [HTMLElement, ShelfId][] = [
    [bag, 'bag'],
    [closet, 'closet'],
    [cabinet, 'cabinet'],
    [decorate, 'storage'],
  ];
  const showFresh = () => {
    const counts = options.fresh.counts();
    for (const [button, shelf] of dotted) button.toggleAttribute('data-new', counts[shelf] > 0);
  };
  showFresh();
  options.fresh.onChange(showFresh);

  // Her Candy, in the corner opposite the buttons. It's only to read, so taps fall through it.
  const purse = el('div', { className: 'hud-candy' });
  purse.setAttribute('aria-label', 'Candy');
  const showCandy = (amount: number) => (purse.textContent = candy(amount));
  showCandy(options.shop.candy());
  options.shop.onCandy(showCandy);
  hud.append(purse);

  // The day under her Candy: its window and date, and what's on, a tap away from the calendar.
  const day = el('button', { type: 'button', className: 'hud-today' });
  const showDay = () => {
    const today = options.calendar.today();
    const on = today.happening[0];
    day.textContent = `${WINDOW_ICON[today.window]} ${shortDate(today.day)}`;
    if (on) day.append(' ', el('span', { className: 'hud-today-on' }, CALENDAR[on].icon));
    const what = today.happening.map((id) => CALENDAR[id].name);
    day.setAttribute('aria-label', ['Calendar', today.window, ...what].join(', '));
  };
  day.addEventListener('click', () => openCalendar(hud, options.calendar));
  showDay();
  options.calendar.onChange(showDay);
  hud.append(day);

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
  let showing: Toast | null = null;
  const waiting: Toast[] = [];
  const show = (toast: Toast) => {
    const { text, special, icon } = toast;
    showing = toast;
    toastLine.textContent = icon ? `${icon} ${text}` : text;
    toastLine.classList.toggle('hud-toast-special', special === true);
    toastLine.classList.add('hud-toast-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      showing = null;
      toastLine.classList.remove('hud-toast-shown');
      const next = waiting.shift();
      if (next) show(next);
    }, TOAST_MS);
  };

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
    openCorkboard() {
      if (!sheetOpen(hud)) openCorkboard(hud, options.mystery);
    },
    openNotices() {
      if (!sheetOpen(hud)) openNotices(hud, options.notices);
    },
    openPet(id) {
      if (sheetOpen(hud)) return false;
      openPet(hud, options.pets, id);
      return true;
    },
    greet(id, line, reply) {
      openGreeting(hud, options.talk, id, line, reply);
    },
    toast(toast) {
      // Two big moments at once (a new place, and a letter about it) each get their turn; anything
      // else simply takes the line.
      if (showing?.special && toast.special) waiting.push(toast);
      else show(toast);
    },
    fade() {
      // Taking the class off and reading the layout restarts the animation from dark.
      fader.classList.remove('fading');
      void fader.offsetWidth;
      fader.classList.add('fading');
    },
  };
}
