import { birthdaysOn } from '../data/birthdays';
import { CALENDAR, type CalendarId, type FestivalId } from '../data/calendar';
import { HAPPENINGS } from '../data/happenings';
import { SHOPS } from '../data/shop';
import { VILLAGERS } from '../data/villagers';
import type { HappeningId, VillagerId } from '../types/ids';
import { WINDOW_FROM, type DayWindow } from '../systems/clock';
import {
  festivalDay,
  partsOf,
  shiftDay,
  type CalendarDay,
  type FestivalDay,
} from '../systems/calendar';
import type { Today } from '../world/services/Calendar';
import { el, openSheet, PICTURE } from './dom';
import { fitIcon } from './collection';
import { countdown } from './messages';

/** What the calendar may ask of the game. Like the other sheets, it never reaches the world. */
export interface CalendarApi {
  today(): Today;
  /** Every day of a month (1–12), and what's on each. */
  month(year: number, month: number): CalendarDay[];
  comingUp(): CalendarDay[];
  /** Called when a window of the day begins; returns a way to stop. */
  onChange(listener: () => void): () => void;
  /** Draws a day's mark at 1×. */
  mark(canvas: HTMLCanvasElement, id: CalendarId): void;
  /** Draws a neighbour's birthday cake, or a plain page of the calendar, at 1× (0.2's U4). */
  plain(canvas: HTMLCanvasElement, mark: 'neighbourBirthday' | 'page'): void;
  /** The neighbours whose birthdays she knows: those she has met (0.2's U4). */
  birthdays(): VillagerId[];
}

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const WINDOW_ICON: Record<DayWindow, string> = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌙',
};

const WEATHER_WORDS = { clear: 'clear', rain: 'rainy', fog: 'foggy' } as const;

/** "Saturday 31 October". */
export function longDate(day: string): string {
  const { month, date, weekday } = partsOf(day);
  return `${WEEKDAYS[weekday]} ${date} ${MONTHS[month - 1]}`;
}

/** "Oct 31", for the little chip under her Candy. */
export function shortDate(day: string): string {
  const { month, date } = partsOf(day);
  return `${MONTHS[month - 1]!.slice(0, 3)} ${date}`;
}

/** "12pm", "6pm", "5am". */
function clockHour(hour: number): string {
  if (hour === 12) return '12pm';
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}

/** How long this window runs, and what comes next. */
function windowLine(window: DayWindow): string {
  if (window === 'morning') return `It's the morning, until ${clockHour(WINDOW_FROM.afternoon)}.`;
  if (window === 'afternoon') return `It's the afternoon, until ${clockHour(WINDOW_FROM.evening)}.`;
  return `It's the evening, until the new day at ${clockHour(WINDOW_FROM.morning)}.`;
}

function happeningRow(id: CalendarId): HTMLElement {
  const row = CALENDAR[id];
  return el(
    'div',
    { className: 'hud-cal-event' },
    el('span', { className: 'hud-cal-icon' }, row.icon),
    el('span', {}, el('strong', {}, row.name), el('small', {}, row.about)),
  );
}

/** The festival on today: what it is, how far in, and the countdown to its big day. */
function festivalRow(festival: FestivalDay): HTMLElement {
  const row = CALENDAR[festival.id];
  return el(
    'div',
    { className: 'hud-cal-event hud-cal-festival' },
    el('span', { className: 'hud-cal-icon' }, row.icon),
    el(
      'span',
      {},
      el('strong', {}, row.name),
      el('span', { className: 'hud-cal-countdown' }, `${countdown(festival)}!`),
      el('small', {}, `Day ${festival.nth} of ${festival.of}. ${row.about}`),
    ),
  );
}

/** "Maude", "Maude and Agatha", "Cody, Rufus and Wrapunzel". */
function names(who: readonly VillagerId[]): string {
  const all = who.map((v) => VILLAGERS[v].name);
  return all.length < 2 ? (all[0] ?? '') : `${all.slice(0, -1).join(', ')} and ${all.at(-1)}`;
}

/** One of the neighbours' happenings today: when, where, and who. */
function gatheringRow(id: HappeningId): HTMLElement {
  const row = HAPPENINGS[id];
  const hour = (h: number) => (h % 24 === 0 ? 'midnight' : clockHour(h % 24));
  const when = `${hour(row.from)} to ${hour(row.until)}`;
  return el(
    'div',
    { className: 'hud-cal-event' },
    el('span', { className: 'hud-cal-icon' }, row.icon),
    el(
      'span',
      {},
      el('strong', {}, row.name),
      el('small', {}, `${when}, ${row.place}, with ${names(row.who)}.`),
    ),
  );
}

/** A neighbour's birthday, as a row like the day's own. */
function birthdayRow(id: VillagerId, today: boolean): HTMLElement {
  const name = VILLAGERS[id].name;
  return el(
    'div',
    { className: 'hud-cal-event hud-cal-birthday' },
    el('span', { className: 'hud-cal-icon' }, '🎂'),
    el(
      'span',
      {},
      el('strong', {}, `${name}'s birthday`),
      el('small', {}, today ? 'A gift today would make it.' : 'Something they love would suit.'),
    ),
  );
}

/** The first and last day of a festival, around one of its days. */
function spanOf(id: FestivalId, day: string): { first: string; last: string } {
  const { nth, of } = festivalDay(id, day);
  const first = shiftDay(day, 1 - nth);
  return { first, last: shiftDay(first, of - 1) };
}

/** "1 October to 31 October", or "28 December to 2 January". */
function spanWords(id: FestivalId, day: string): string {
  const { first, last } = spanOf(id, day);
  const words = (d: string) => `${partsOf(d).date} ${MONTHS[partsOf(d).month - 1]}`;
  return `${words(first)} to ${words(last)}`;
}

/** A festival's band across the month, said under the grid. */
function spanKey(id: FestivalId, day: string): HTMLElement {
  const row = CALENDAR[id];
  return el(
    'p',
    { className: 'hud-cal-key' },
    el('span', { className: 'hud-cal-swatch' }),
    `${row.icon} ${row.name}, ${spanWords(id, day)}`,
  );
}

/**
 * The calendar (phase N, onto the frame in 0.2's U4): today's mark beside the title, then a tab
 * each for today, with its window, weather, the festival on and whatever else; a month of days to
 * page through, each marked with what falls on it and a festival banded across its days as one
 * span, a tap on one saying what; and what's coming up, a festival with its span. The neighbours'
 * birthdays she knows are cakes on their days.
 */
export function openCalendar(hud: HTMLElement, api: CalendarApi): () => void {
  const today = api.today();
  const known = api.birthdays();
  const picture = el('canvas', { className: 'hud-icon' });
  const todaysMark = today.happening[0] ?? today.festival?.id;
  if (todaysMark) api.mark(picture, todaysMark);
  else api.plain(picture, birthdaysOn(today.day, known).length > 0 ? 'neighbourBirthday' : 'page');
  fitIcon(picture, PICTURE);
  const sheet = openSheet(hud, {
    title: 'Calendar',
    line: `${longDate(today.day)} · ${WINDOW_ICON[today.window]} ${today.window} · ${WEATHER_WORDS[today.weather]}`,
    picture,
    tabs: [
      { id: 'today', label: 'Today' },
      { id: 'month', label: 'Month' },
      { id: 'soon', label: 'Coming up' },
    ],
    memory: 'calendar',
    className: 'hud-calendar-sheet',
  });

  const todayBox = el('section', { className: 'hud-cal-today' });
  todayBox.append(el('p', {}, windowLine(today.window)));
  if (today.festival) todayBox.append(festivalRow(today.festival));
  for (const id of today.happening) todayBox.append(happeningRow(id));
  for (const id of birthdaysOn(today.day, known)) todayBox.append(birthdayRow(id, true));
  for (const id of today.gatherings) todayBox.append(gatheringRow(id));
  for (const shop of today.visitors) {
    todayBox.append(el('p', {}, `${SHOPS[shop].name} is in town today.`));
  }
  const busy =
    today.happening.length +
    today.visitors.length +
    today.gatherings.length +
    birthdaysOn(today.day, known).length;
  if (busy === 0 && !today.festival) {
    todayBox.append(el('p', { className: 'hud-cal-quiet' }, 'A quiet day in McFrancisVille.'));
  }

  let { year, month } = partsOf(today.day);
  let picked = today.day;
  const title = el('h3', { className: 'hud-cal-title' });
  const back = el('button', { type: 'button', className: 'hud-cal-page', textContent: '‹' });
  back.setAttribute('aria-label', 'Last month');
  const on = el('button', { type: 'button', className: 'hud-cal-page', textContent: '›' });
  on.setAttribute('aria-label', 'Next month');
  const grid = el('div', { className: 'hud-cal-grid' });
  const keys = el('div', { className: 'hud-cal-keys' });
  const detail = el('div', { className: 'hud-cal-detail' });

  const showDetail = (day: CalendarDay) => {
    const rows = [
      ...day.happening.map(happeningRow),
      ...birthdaysOn(day.day, known).map((id) => birthdayRow(id, day.day === today.day)),
      ...day.festivals.map((id) => {
        const { nth, of } = festivalDay(id, day.day);
        const row = happeningRow(id);
        row.querySelector('small')!.textContent = `Day ${nth} of ${of}: ${spanWords(id, day.day)}.`;
        return row;
      }),
    ];
    detail.replaceChildren(
      el('h4', {}, day.day === today.day ? `Today, ${longDate(day.day)}` : longDate(day.day)),
      ...(rows.length > 0 ? rows : [el('p', { className: 'hud-cal-quiet' }, 'Nothing on.')]),
    );
  };

  const render = () => {
    title.textContent = `${MONTHS[month - 1]} ${year}`;
    const days = api.month(year, month);
    const blanks = partsOf(days[0]!.day).weekday;
    const spans = new Map<FestivalId, string>();
    grid.replaceChildren(
      ...WEEKDAYS.map((d) => el('span', { className: 'hud-cal-weekday' }, d.slice(0, 1))),
      ...Array.from({ length: blanks }, () => el('span')),
      ...days.map((day) => {
        const cell = el('button', { type: 'button', className: 'hud-cal-day' });
        cell.append(el('span', {}, String(partsOf(day.day).date)));
        const cakes = birthdaysOn(day.day, known);
        const first = day.happening[0];
        if (first || cakes.length > 0) {
          const mark = el('canvas', { className: 'hud-cal-mark' });
          if (first) api.mark(mark, first);
          else api.plain(mark, 'neighbourBirthday');
          fitIcon(mark, 16);
          cell.append(mark);
        }
        cell.classList.toggle('hud-cal-now', day.day === today.day);
        cell.classList.toggle('hud-cal-picked', day.day === picked);
        // A festival is one band across its days, under the days' own marks, broken only where a
        // week wraps: its ends are rounded where it begins and ends, or a row does.
        const festival = day.festivals[0];
        cell.classList.toggle('hud-cal-span', festival !== undefined);
        if (festival) {
          if (!spans.has(festival)) spans.set(festival, day.day);
          const weekday = partsOf(day.day).weekday;
          const { first, last } = spanOf(festival, day.day);
          cell.classList.toggle('hud-cal-span-start', first === day.day || weekday === 0);
          cell.classList.toggle('hud-cal-span-end', last === day.day || weekday === 6);
        }
        const names = [
          ...day.happening.map((id) => CALENDAR[id].name),
          ...cakes.map((id) => `${VILLAGERS[id].name}'s birthday`),
          ...day.festivals.map((id) => CALENDAR[id].name),
        ];
        cell.setAttribute('aria-label', [longDate(day.day), ...names].join(', '));
        cell.addEventListener('click', () => {
          picked = day.day;
          render();
          showDetail(day);
        });
        return cell;
      }),
    );
    keys.replaceChildren(...[...spans].map(([id, day]) => spanKey(id, day)));
  };
  const page = (by: number) => {
    month += by;
    if (month < 1) [year, month] = [year - 1, 12];
    if (month > 12) [year, month] = [year + 1, 1];
    render();
  };
  back.addEventListener('click', () => page(-1));
  on.addEventListener('click', () => page(1));
  render();
  showDetail(api.month(year, month).find((d) => d.day === today.day)!);

  // What's on soon, and the birthdays she knows in the month ahead, in the order they come.
  const soon: { day: string; text: string }[] = api.comingUp().map((day) => ({
    day: day.day,
    text: day.happening
      .map((id) => {
        const row = CALENDAR[id];
        const span = day.festivals.find((f) => f === id);
        return `${row.icon} ${row.name}${span ? `, ${spanWords(span, day.day)}` : ''}`;
      })
      .join(', '),
  }));
  for (let ahead = 1; ahead <= 31; ahead++) {
    const day = shiftDay(today.day, ahead);
    for (const id of birthdaysOn(day, known)) {
      soon.push({ day, text: `🎂 ${VILLAGERS[id].name}'s birthday` });
    }
  }
  soon.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
  const soonBox = el('section', { className: 'hud-cal-soon' });
  for (const { day, text } of soon) {
    soonBox.append(el('p', {}, el('strong', {}, `${shortDate(day)} `), text));
  }
  if (soon.length === 0) {
    soonBox.append(el('p', { className: 'hud-cal-quiet' }, 'Nothing on for a while.'));
  }

  sheet.panel('today').append(todayBox);
  sheet
    .panel('month')
    .append(
      el(
        'section',
        { className: 'hud-cal-month' },
        el('div', { className: 'hud-cal-head' }, back, title, on),
        grid,
        keys,
        detail,
      ),
    );
  sheet.panel('soon').append(soonBox);
  return sheet.close;
}
