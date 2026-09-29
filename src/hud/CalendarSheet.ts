import { CALENDAR, type CalendarId } from '../data/calendar';
import { HAPPENINGS } from '../data/happenings';
import { SHOPS } from '../data/shop';
import { VILLAGERS } from '../data/villagers';
import type { HappeningId, VillagerId } from '../types/ids';
import { WINDOW_FROM, type DayWindow } from '../systems/clock';
import { partsOf, type CalendarDay } from '../systems/calendar';
import type { Today } from '../world/services/Calendar';
import { el, openSheet } from './dom';

/** What the calendar may ask of the game. Like the other sheets, it never reaches the world. */
export interface CalendarApi {
  today(): Today;
  /** Every day of a month (1–12), and what's on each. */
  month(year: number, month: number): CalendarDay[];
  comingUp(): CalendarDay[];
  /** Called when a window of the day begins; returns a way to stop. */
  onChange(listener: () => void): () => void;
}

const MONTHS = [
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

/**
 * The calendar (phase N): today, with its window, weather and whatever's on; a month of days to
 * page through, each marked with what falls on it, a tap on one saying what; and what's coming up.
 */
export function openCalendar(hud: HTMLElement, api: CalendarApi): () => void {
  const today = api.today();
  const sheet = openSheet(hud, {
    title: 'Calendar',
    line: `${longDate(today.day)} · ${WINDOW_ICON[today.window]} ${today.window} · ${WEATHER_WORDS[today.weather]}`,
    className: 'hud-calendar-sheet',
  });

  const todayBox = el('section', { className: 'hud-cal-today' }, el('h3', {}, 'Today'));
  todayBox.append(el('p', {}, windowLine(today.window)));
  for (const id of today.happening) todayBox.append(happeningRow(id));
  for (const id of today.gatherings) todayBox.append(gatheringRow(id));
  for (const shop of today.visitors) {
    todayBox.append(el('p', {}, `${SHOPS[shop].name} is in town today.`));
  }
  if (today.happening.length + today.visitors.length + today.gatherings.length === 0) {
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
  const detail = el('div', { className: 'hud-cal-detail' });

  const showDetail = (day: CalendarDay) => {
    const rows = day.happening.map(happeningRow);
    detail.replaceChildren(
      el('h4', {}, day.day === today.day ? `Today, ${longDate(day.day)}` : longDate(day.day)),
      ...(rows.length > 0 ? rows : [el('p', { className: 'hud-cal-quiet' }, 'Nothing on.')]),
    );
  };

  const render = () => {
    title.textContent = `${MONTHS[month - 1]} ${year}`;
    const days = api.month(year, month);
    const blanks = partsOf(days[0]!.day).weekday;
    grid.replaceChildren(
      ...WEEKDAYS.map((d) => el('span', { className: 'hud-cal-weekday' }, d.slice(0, 1))),
      ...Array.from({ length: blanks }, () => el('span')),
      ...days.map((day) => {
        const cell = el('button', { type: 'button', className: 'hud-cal-day' });
        cell.append(el('span', {}, String(partsOf(day.day).date)));
        const first = day.happening[0];
        if (first) cell.append(el('span', { className: 'hud-cal-mark' }, CALENDAR[first].icon));
        cell.classList.toggle('hud-cal-now', day.day === today.day);
        cell.classList.toggle('hud-cal-picked', day.day === picked);
        const names = day.happening.map((id) => CALENDAR[id].name);
        cell.setAttribute('aria-label', [longDate(day.day), ...names].join(', '));
        cell.addEventListener('click', () => {
          picked = day.day;
          render();
          showDetail(day);
        });
        return cell;
      }),
    );
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
  showDetail({ day: today.day, happening: today.happening });

  const soon = el('section', { className: 'hud-cal-soon' }, el('h3', {}, 'Coming up'));
  for (const day of api.comingUp()) {
    soon.append(
      el(
        'p',
        {},
        el('strong', {}, `${shortDate(day.day)} `),
        day.happening.map((id) => `${CALENDAR[id].icon} ${CALENDAR[id].name}`).join(', '),
      ),
    );
  }

  sheet.body.append(
    todayBox,
    el(
      'section',
      { className: 'hud-cal-month' },
      el('div', { className: 'hud-cal-head' }, back, title, on),
      grid,
      detail,
    ),
    soon,
  );
  return sheet.close;
}
