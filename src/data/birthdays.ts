import type { VillagerId } from '../types/ids';

/**
 * Each neighbour's birthday, as `MM-DD`, shown on the neighbours sheet (0.2's U3, decision 180):
 * a day that suits them, picked while personal touches are parked. Cody's is his own to tell, so
 * he has a line instead of a date.
 */
export const BIRTHDAYS: Record<VillagerId, `${number}-${number}` | { says: string }> = {
  // All Souls' Day.
  maude: '11-02',
  // May Day, for the flowers.
  rufus: '05-01',
  // The day the boy king's tomb was found.
  wrapunzel: '11-04',
  // Midsummer's eve.
  agatha: '06-21',
  // The first day of spring, for planting.
  barty: '03-20',
  cody: { says: "He says it's tomorrow. It's always tomorrow." },
  // World Post Day.
  ollie: '10-09',
  // The day the lake monster's famous photo was printed.
  nessa: '04-21',
  // Pumpkin Day.
  gourdon: '10-26',
  // The night the shooting stars are thickest.
  hazel: '08-12',
  // The great composer's, whose name he borrowed and won't give back.
  boothoven: '12-16',
};

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

/** "2 November", or Cody's line. */
export function birthdayOf(id: VillagerId): string {
  const birthday = BIRTHDAYS[id];
  if (typeof birthday !== 'string') return birthday.says;
  const [month, date] = birthday.split('-').map(Number);
  return `${date} ${MONTHS[month! - 1]}`;
}

/** Whether it's their birthday on a day key (`YYYY-MM-DD`). */
export function isBirthday(id: VillagerId, day: string): boolean {
  const birthday = BIRTHDAYS[id];
  return typeof birthday === 'string' && day.slice(5) === birthday;
}

/** Whose birthdays, of these neighbours, fall on a day key (0.2's U4: the calendar's cakes). */
export function birthdaysOn(day: string, who: readonly VillagerId[]): VillagerId[] {
  return who.filter((id) => isBirthday(id, day));
}
