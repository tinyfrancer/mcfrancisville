import { openBag, type BagApi, type FreshApi } from './BagSheet';
import { openBroom, type BroomApi } from './BroomSheet';
import { bedCard, type BedApi, type BedSpot } from './BedCard';
import { openCabinet, openMuseum, type CabinetApi } from './CabinetSheet';
import { openCalendar, shortDate, WINDOW_ICON, type CalendarApi } from './CalendarSheet';
import { el, sheetOpen } from './dom';
import { openStove, openWorkbench, type CraftApi } from './CraftSheet';
import { decorBar, openStorage, type HomeApi } from './HomeSheets';
import { readDismissedAt, shouldShowInstallHint, writeDismissedAt } from './installHint';
import { openCreator, openSalon, openWardrobe } from './LookSheets';
import { openTitle, type TitleApi } from './TitleScreen';
import type { LookApi } from './pickers';
import type { Toast } from './messages';
import { toastLine } from './ToastLine';
import { candy, countdown } from './messages';
import { openSeeds, type FarmApi } from './SeedSheet';
import { openSettings, type SaveApi, type SoundApi } from './SettingsSheet';
import { openMail, type MailApi } from './MailSheet';
import { openMap, type MapApi } from './MapSheet';
import { openNotes, whatsNew, type NotesApi } from './NotesCard';
import { openShop, type ShopApi } from './ShopSheet';
import { openPet, type PetApi } from './PetSheet';
import { quickBar, type QuickApi } from './QuickBar';
import { openCorkboard, type MysteryApi } from './CorkboardSheet';
import { openNotices, type NoticeApi } from './NoticeSheet';
import { openStall, type StallApi } from './StallSheet';
import { openGreeting, openTalk, type GreetingCard, type TalkApi } from './TalkSheet';
import { CALENDAR } from '../data/calendar';
import { trimOn } from '../data/trims';
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
  /** The same as the workbench's, for the stove's dishes (phase R). */
  stove: CraftApi;
  talk: TalkApi;
  mail: MailApi;
  cabinet: CabinetApi;
  pets: PetApi;
  mystery: MysteryApi;
  map: MapApi;
  calendar: CalendarApi;
  notices: NoticeApi;
  stall: StallApi;
  quick: QuickApi;
  broom: BroomApi;
  bed: BedApi;
  title: TitleApi;
  notes: NotesApi;
  standalone: boolean;
}

/** What the game may open on the HUD from outside it. */
export interface Hud {
  element: HTMLElement;
  /** The world's room between the bars (0.2's U1): the canvas is fitted to it, never under a bar. */
  viewport: HTMLElement;
  /** The title screen, and his dedication after it the first time; then `onStart`. */
  openTitle(onStart: () => void): void;
  /** The mayor's notes the first time she opens a new version; then `onDone`. */
  whatsNew(onDone: () => void): void;
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
  openStove(): void;
  /** Talks to a neighbour, unless a sheet is already up; false if one was. */
  openTalk(id: VillagerId): boolean;
  /** Opens her mailbox, unless a sheet is already up. */
  openMail(): void;
  /** Opens her broom at its stand, unless a sheet is already up (0.2's P1). */
  openBroom(): void;
  /** Opens Wrapunzel's museum, unless a sheet is already up. */
  openMuseum(): void;
  /** Opens her mystery corkboard, unless a sheet is already up. */
  openCorkboard(): void;
  /** Opens the noticeboard by the square, unless a sheet is already up. */
  openNotices(): void;
  /** Opens the honesty stall at the farm gate, unless a sheet is already up. */
  openStall(): void;
  /** Sees to a pet, unless a sheet is already up; false if one was. */
  openPet(id: PetId): boolean;
  /** A neighbour says one thing, and she answers, over whatever sheet is up. */
  greet(card: GreetingCard): void;
  /** A line across the top for a moment: what she just found. */
  toast(toast: Toast): void;
  /** Fades the game in from dark, as she comes into a new place. */
  fade(): void;
  /** Keeps a bed's pop-up over its bed, where the camera has it this frame. */
  placeBed(spot: BedSpot | null): void;
  /** Where she is on the page this frame (client y), so a toast can keep out of her way. */
  playerAt(clientY: number): void;
}

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
  // The frame (0.2's U1, decision 135): a bar along the top for what she has and what day it is,
  // one along the bottom for what she can do, and the world between them, never under them, so
  // every edge of a place is in reach.
  const top = el('div', { className: 'hud-bar hud-top' });
  const viewport = el('div', { className: 'hud-view' });
  const bottom = el('div', { className: 'hud-bar hud-bottom' });
  hud.append(top, viewport, bottom);
  // Over the world only, never the bars.
  const fader = el('div', { className: 'hud-fade' });
  viewport.append(fader);

  // Her Candy, first along the top. It's only to read.
  const purse = el('div', { className: 'hud-candy' });
  purse.setAttribute('aria-label', 'Candy');
  const showCandy = (amount: number) => (purse.textContent = candy(amount));
  showCandy(options.shop.candy());
  options.shop.onCandy(showCandy);

  // The day beside it: its window and date, and what's on, a tap away from the calendar.
  const day = el('button', { type: 'button', className: 'hud-today' });
  // A little something for the month at the end of the bar (question 53), just to look at.
  const trim = el('span', { className: 'hud-trim' });
  trim.setAttribute('aria-hidden', 'true');
  const showDay = () => {
    const today = options.calendar.today();
    const on = today.happening[0];
    const { festival } = today;
    day.textContent = `${WINDOW_ICON[today.window]} ${shortDate(today.day)}`;
    if (on) day.append(' ', el('span', { className: 'hud-today-on' }, CALENDAR[on].icon));
    // A festival counts down on the chip till its big day, which is marked like any other.
    if (festival && festival.left > 0) {
      const days = festival.left === 1 ? '1 day' : `${festival.left} days`;
      day.append(
        ' ',
        el('span', { className: 'hud-today-on' }, CALENDAR[festival.id].icon),
        ' ',
        el('span', { className: 'hud-today-left' }, days),
      );
    }
    const what = today.happening.map((id) => CALENDAR[id].name);
    if (festival) what.push(CALENDAR[festival.id].name, countdown(festival));
    day.setAttribute('aria-label', ['Calendar', today.window, ...what].join(', '));
    const season = trimOn(today.day);
    trim.textContent = season.icon;
    trim.title = season.name;
  };
  day.addEventListener('click', () => openCalendar(hud, options.calendar));
  showDay();
  options.calendar.onChange(showDay);
  const settings = cornerButton('hud-settings', 'Settings', '⚙︎', () =>
    openSettings(hud, options.save, options.sound, (notes) => openNotes(hud, options.notes, notes)),
  );
  top.append(purse, day, trim, settings);

  // What she's holding, outdoors; the decorating bar, at home while she decorates.
  const quick = quickBar(options.quick);
  options.quick.onChange(quick.render);
  const home = options.home;
  const bar = decorBar(hud, home);

  // Her things and the map, always along the bottom.
  const menu = el('div', { className: 'hud-menu' });
  menu.setAttribute('role', 'toolbar');
  menu.setAttribute('aria-label', 'Your things');
  const decorate = cornerButton('hud-decorate', 'Decorate', '🛋️', () => home.startDecorating());
  const bag = cornerButton('hud-bag-button', 'Bag', '🎒', () => openBag(hud, options.bag));
  const closet = cornerButton('hud-closet', 'Closet', '👗', () => openWardrobe(hud, options.looks));
  const cabinet = cornerButton('hud-cabinet', 'Curiosity Cabinet', '📖', () =>
    openCabinet(hud, options.cabinet),
  );
  menu.append(
    decorate,
    bag,
    closet,
    cornerButton('hud-map-button', 'Map', '🗺️', () => openMap(hud, options.map)),
    cabinet,
  );
  bottom.append(quick.element, bar.element, menu);
  // Decorating takes the menu's row, so the bar keeps its height and the room doesn't jump.
  const showHome = () => {
    const decorating = home.selected() !== undefined;
    decorate.hidden = !home.indoors() || decorating;
    menu.hidden = decorating;
    bar.render();
  };
  showHome();
  home.onChange(showHome);

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
    viewport.append(card);
  }

  const toasts = toastLine(viewport);
  viewport.append(toasts.element);

  // A bed's pop-up, over the bed she tapped (phase P). After the toast, so a toast about something
  // else never covers what she's reading; every sheet still opens over it. It keeps to the world.
  const bed = bedCard(options.bed, () => {
    const room = viewport.getBoundingClientRect();
    return { top: room.top, bottom: room.bottom };
  });
  hud.append(bed.element);
  root.append(hud);
  const api: Hud = {
    element: hud,
    viewport,
    openTitle: (onStart) => openTitle(hud, options.title, onStart),
    whatsNew: (onDone) => whatsNew(hud, options.notes, onDone),
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
    openStove() {
      if (!sheetOpen(hud)) openStove(hud, options.stove);
    },
    openTalk(id) {
      if (sheetOpen(hud)) return false;
      openTalk(hud, options.talk, id);
      return true;
    },
    openMail() {
      if (!sheetOpen(hud)) openMail(hud, options.mail);
    },
    openBroom() {
      if (!sheetOpen(hud)) openBroom(hud, options.broom, () => openMap(hud, options.map));
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
    openStall() {
      if (!sheetOpen(hud)) openStall(hud, options.stall);
    },
    openPet(id) {
      if (sheetOpen(hud)) return false;
      openPet(hud, options.pets, id);
      return true;
    },
    greet(card) {
      openGreeting(hud, options.talk, card, (after) => api.toast({ text: after, icon: '👊' }));
    },
    toast: toasts.show,
    placeBed: bed.place,
    playerAt: toasts.playerAt,
    fade() {
      // Taking the class off and reading the layout restarts the animation from dark.
      fader.classList.remove('fading');
      void fader.offsetWidth;
      fader.classList.add('fading');
    },
  };
  return api;
}
