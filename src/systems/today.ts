import { ACTIVITIES, type ActivityId } from '../data/activities';
import { HAPPENINGS } from '../data/happenings';
import { WANDERING_STALL_AT, type PasserId, type RareEventId } from '../data/rareEvents';
import type {
  CritterId,
  HappeningId,
  ItemId,
  MapZoneId,
  ProjectId,
  PropId,
  VillagerId,
  ZoneId,
} from '../types/ids';
import type { ProjectStage } from '../data/projects';
import { VILLAGER_IDS } from '../data/villagers';
import { callOn } from './calls';
import { shiftDay, weekOf } from './calendar';
import { atHers, isHusband } from './cody';
import { isVisitDay } from './critters';
import { happeningOf, hourOfNight } from './happenings';
import { inTown } from './mayor';
import type { Tile } from './pathfinding';
import { visitsOn } from './schedules';

/*
 * What's up now (V1's R2, decision 312): the calendar's Today tab, a line for each thing in the
 * town that's waiting for her or on today, every one read off the world as it is, never kept.
 */

/** A call on her at home today: a neighbour's visit, a best friend's call, or Cody's evening. */
export interface Caller {
  who: VillagerId;
  from: number;
  until: number;
}

/**
 * Who calls on her at home on a day, and when: the visit dealt to hers, a best friend's call (`best`
 * says who is one), and her husband's evening, from when he's there until he walks home.
 */
export function callersOn(day: string, best: (villager: VillagerId) => boolean): Caller[] {
  const callers: Caller[] = visitsOn(day)
    // A happening of theirs comes first (V1's R3's daytime beats meet more of the visits).
    .filter((v) => v.host === 'her' && happeningOf(v.guest, v.from + 0.25, day) === null)
    .map(({ guest, from, until }) => ({ who: guest, from, until }));
  for (const who of VILLAGER_IDS) {
    if (isHusband(who) || !inTown(who) || !best(who)) continue;
    const call = callOn(who, day);
    if (call) callers.push({ who, from: call.from, until: call.until });
  }
  const evening: number[] = [];
  for (let hour = 18; hour < 24; hour += 0.5) if (atHers(hour, day)) evening.push(hour);
  const husband = VILLAGER_IDS.find(isHusband);
  if (husband && evening.length > 0) {
    callers.push({ who: husband, from: evening[0]!, until: evening.at(-1)! + 0.5 });
  }
  return callers.sort((a, b) => a.from - b.from);
}

/** A favour a neighbour is asking today, and where they are just now (null where nobody knows). */
export interface Asking {
  who: VillagerId;
  item: ItemId;
  count: number;
  zone: ZoneId | null;
}

/** A ripe bed, wherever it is. */
export interface RipeBed extends Tile {
  zone: ZoneId;
  crop: ItemId;
}

/** Everything the lines are worked out from, read off the town's services when Today is asked. */
export interface TodayFacts {
  day: string;
  /** The hour now, by the clock (two in the morning is 2). */
  hour: number;
  /** The window's key (`windowKey`), for what comes back each window. */
  window: string;
  /** Cody's list for her first day, while it's open. */
  firstDay: { done: number; of: number } | null;
  /** The noticeboard's notes this window, and whether each is answered. */
  notes: readonly { from: VillagerId; done: boolean }[];
  favours: readonly Asking[];
  /** The Candy the candy tree by her house would shake down now. */
  tree: number;
  /** The honesty stall's tin, and how many things have sold into it. */
  stall: { tin: number; sold: number };
  ripe: readonly RipeBed[];
  /** Each place's mound today, and whether it's dug. */
  mounds: readonly { zone: MapZoneId; tile: Tile; dug: boolean }[];
  /** Cobweb Corner's wanted list this week. */
  wanted: readonly ItemId[];
  /** Her neighbours' happenings today, earliest first. */
  happenings: readonly HappeningId[];
  /** Where each of today's happenings is. */
  venue: (id: HappeningId) => ZoneId;
  callers: readonly Caller[];
  /** The critters visiting today out of their time (R5's `isVisiting`), and those she's never had. */
  critters: { visiting: readonly CritterId[]; fresh: readonly CritterId[] };
  /** Today's rare event (V1's R3), and the day it began: the wandering stall's Monday. */
  rare: { id: RareEventId; began: string } | null;
  /** The Moon Pie Man and the pop-up, those in town today, and where each stands. */
  peddlers: readonly { shop: 'moonPie' | 'popUp'; tile: Tile }[];
  /** Who is passing through today, where, and their hours. */
  passers: readonly { who: PasserId; zone: MapZoneId; from: number; until: number }[];
  /** A critter gone astray today: where it waits, or that she's carrying it home. */
  stray: {
    owner: VillagerId;
    name: string;
    critter: CritterId;
    zone: MapZoneId;
    carrying: boolean;
  } | null;
  /** The town project she's funding (V1's R4), how it stands and how far along it is, 0 to 1. */
  project: { id: ProjectId; stage: ProjectStage | null; progress: number } | null;
  /** The fair's free go today (V1's R6b), until she has had it, and whether its stall is open. */
  freeGo: { id: ActivityId; open: boolean } | null;
  /** A shiny out where she is this hour (1.4's G1), and where. */
  shiny?: { critter: CritterId; zone: MapZoneId; tile: Tile; hour: number } | null;
}

/** Where a line takes her, if it can: up to a neighbour, or to a place, and up to what's there. */
export type TodayGo =
  { villager: VillagerId } | { zone: ZoneId; prop?: PropId; tile?: Tile; bed?: boolean };

/** One line of what's up now. */
export type TodayLine = { key: string; go?: TodayGo } & (
  | { kind: 'firstDay'; done: number; of: number }
  | { kind: 'tree'; candy: number }
  | { kind: 'stall'; candy: number; sold: number }
  | { kind: 'ripe'; zone: ZoneId; beds: number; crop: ItemId }
  | { kind: 'notes'; open: number; from: readonly VillagerId[] }
  | { kind: 'favour'; who: VillagerId; item: ItemId; count: number; zone: ZoneId | null }
  | { kind: 'mounds'; zones: readonly MapZoneId[] }
  | { kind: 'callers'; who: VillagerId; from: number; until: number; now: boolean }
  | { kind: 'happening'; id: HappeningId; zone: ZoneId; now: boolean }
  | { kind: 'critters'; visiting: readonly CritterId[]; fresh: readonly CritterId[] }
  | { kind: 'visitsSoon'; days: number }
  | { kind: 'wanted'; items: readonly ItemId[] }
  // V1's R3: what's out of the ordinary, who's in town for the day, who's passing through, a stray.
  | { kind: 'rare'; id: RareEventId }
  | { kind: 'peddler'; shop: 'moonPie' | 'popUp' }
  | { kind: 'passer'; who: PasserId; zone: MapZoneId; now: boolean }
  | {
      kind: 'stray';
      owner: VillagerId;
      name: string;
      critter: CritterId;
      zone: MapZoneId;
      carrying: boolean;
    }
  // V1's R4: the town project she's funding, while it's under way.
  | { kind: 'project'; id: ProjectId; percent: number }
  // 1.0.1: the day's first go at one of the fair's stalls is free, until she has had it.
  | { kind: 'freeGo'; id: ActivityId; open: boolean }
  // 1.4's G1: something glittering where she is, a shiny critter.
  | { kind: 'shiny'; critter: CritterId; zone: MapZoneId }
);

export type TodayKind = TodayLine['kind'];

/** How many days ahead she's told the critters are coming to visit. */
export const VISITS_SOON_DAYS = 3;

/** How many days until the critters next come visiting, the day after a full moon; null if not soon. */
export function visitsIn(day: string, within = VISITS_SOON_DAYS): number | null {
  for (let k = 1; k <= within; k++) if (isVisitDay(shiftDay(day, k))) return k;
  return null;
}

/** Whether an hour of the day key is before a span's end, a span's hours counted on past midnight. */
const notOver = (hour: number, until: number) => hourOfNight(hour) < until;
const isOn = (hour: number, from: number, until: number) =>
  from <= hourOfNight(hour) && hourOfNight(hour) < until;

/**
 * What's up now, in the order she'd want it: Cody's list, then what's hers to collect, what's ripe
 * and asked of her, who's coming round and what's on tonight, and the critters and the wanted list.
 * A line is there only while it's true; each has a `key` that changes when it's news again.
 */
export function todayLines(facts: TodayFacts): TodayLine[] {
  const { day, hour, window } = facts;
  const lines: TodayLine[] = [];
  if (facts.firstDay && facts.firstDay.done < facts.firstDay.of) {
    const { done, of } = facts.firstDay;
    lines.push({ kind: 'firstDay', done, of, key: `firstDay:${done}` });
  }
  lines.push(...outOfTheOrdinary(facts));
  if (facts.tree > 0) {
    lines.push({
      kind: 'tree',
      candy: facts.tree,
      key: `tree:${window}`,
      go: { zone: 'town', prop: 'candyTree' },
    });
  }
  if (facts.stall.sold > 0) {
    lines.push({
      kind: 'stall',
      candy: facts.stall.tin,
      sold: facts.stall.sold,
      key: `stall:${window}`,
      go: { zone: 'town', prop: 'honestyStall' },
    });
  }
  const byPlace = new Map<ZoneId, RipeBed[]>();
  for (const bed of facts.ripe) byPlace.set(bed.zone, [...(byPlace.get(bed.zone) ?? []), bed]);
  for (const [zone, beds] of byPlace) {
    const first = beds[0]!;
    lines.push({
      kind: 'ripe',
      zone,
      beds: beds.length,
      crop: first.crop,
      key: `ripe:${zone}:${beds.length}:${day}`,
      go: { zone, tile: { tx: first.tx, ty: first.ty }, bed: true },
    });
  }
  const open = facts.notes.filter((n) => !n.done);
  if (open.length > 0) {
    lines.push({
      kind: 'notes',
      open: open.length,
      from: open.map((n) => n.from),
      key: `notes:${window}`,
      go: { zone: 'town', prop: 'noticeboard' },
    });
  }
  if (facts.project) {
    const { id, stage, progress } = facts.project;
    lines.push({
      kind: 'project',
      id,
      percent: Math.floor(progress * 100),
      key: `project:${id}:${stage ?? 'none'}:${weekOf(day)}`,
      go: { zone: 'town', prop: 'noticeboard' },
    });
  }
  for (const f of facts.favours) {
    lines.push({
      kind: 'favour',
      ...f,
      key: `favour:${f.who}:${day}`,
      go: { villager: f.who },
    });
  }
  const mounds = facts.mounds.filter((m) => !m.dug);
  if (mounds.length > 0) {
    const first = mounds[0]!;
    lines.push({
      kind: 'mounds',
      zones: mounds.map((m) => m.zone),
      key: `mounds:${day}`,
      go: { zone: first.zone, tile: first.tile },
    });
  }
  for (const c of facts.callers) {
    if (!notOver(hour, c.until)) continue;
    const now = isOn(hour, c.from, c.until);
    lines.push({
      kind: 'callers',
      ...c,
      now,
      key: `callers:${c.who}:${c.from}:${day}`,
      ...(now ? { go: { zone: 'home' as const } } : {}),
    });
  }
  // Tonight's happening, or whichever is on or next: the rest are listed under the day's own rows.
  const next = facts.happenings.find((id) => notOver(hour, HAPPENINGS[id].until));
  if (next) {
    const row = HAPPENINGS[next];
    const zone = facts.venue(next);
    lines.push({
      kind: 'happening',
      id: next,
      zone,
      now: isOn(hour, row.from, row.until),
      key: `happening:${next}:${day}`,
      go: { zone },
    });
  }
  if (facts.freeGo) {
    const { id, open } = facts.freeGo;
    const at = ACTIVITIES[id].at;
    lines.push({
      kind: 'freeGo',
      id,
      open,
      key: `freeGo:${day}`,
      ...('prop' in at ? { go: { zone: 'fairground' as const, prop: at.prop } } : {}),
    });
  }
  if (facts.critters.visiting.length > 0) {
    lines.push({ kind: 'critters', ...facts.critters, key: `critters:${day}` });
  } else {
    const days = visitsIn(day);
    if (days !== null) lines.push({ kind: 'visitsSoon', days, key: `visitsSoon:${day}` });
  }
  if (facts.wanted.length > 0) {
    lines.push({
      kind: 'wanted',
      items: facts.wanted,
      key: `wanted:${weekOf(day)}`,
      go: { zone: 'town', prop: 'shopHouse' },
    });
  }
  return lines;
}

/**
 * What's out of the ordinary today (V1's R3): a rare event, the Moon Pie Man and the pop-up when
 * they're in town, whoever's passing through until they go, and a stray until it's home.
 */
function outOfTheOrdinary(facts: TodayFacts): TodayLine[] {
  const { day, hour } = facts;
  const lines: TodayLine[] = [];
  if (facts.shiny) {
    const { critter, zone, tile } = facts.shiny;
    lines.push({
      kind: 'shiny',
      critter,
      zone,
      key: `shiny:${zone}:${day}@${facts.shiny.hour}:${tile.tx},${tile.ty}`,
      go: { zone, tile },
    });
  }
  if (facts.rare) {
    const { id, began } = facts.rare;
    lines.push({
      kind: 'rare',
      id,
      key: `rare:${id}:${began}`,
      ...(id === 'wanderingStall'
        ? { go: { zone: 'town' as const, tile: WANDERING_STALL_AT } }
        : {}),
    });
  }
  for (const p of facts.passers) {
    if (!notOver(hour, p.until)) continue;
    lines.push({
      kind: 'passer',
      who: p.who,
      zone: p.zone,
      now: isOn(hour, p.from, p.until),
      key: `passer:${p.who}:${day}`,
      go: { zone: p.zone },
    });
  }
  if (facts.stray) {
    const { carrying, owner, zone } = facts.stray;
    lines.push({
      kind: 'stray',
      ...facts.stray,
      key: `stray:${day}:${carrying ? 'home' : 'lost'}`,
      go: carrying ? { villager: owner } : { zone },
    });
  }
  for (const { shop, tile } of facts.peddlers) {
    lines.push({
      kind: 'peddler',
      shop,
      key: `peddler:${shop}:${day}`,
      go: { zone: 'town', tile },
    });
  }
  return lines;
}

/** Whether any of the lines is news since `seen` (the keys of the lines she last saw). */
export function hasFresh(lines: readonly TodayLine[], seen: readonly string[]): boolean {
  return lines.some((line) => !seen.includes(line.key));
}

/** The bubbles over a neighbour's head, in order: news or a lost thing, then a favour asked today. */
export function bubblesOver(told: '!' | '?' | null, asking: boolean): ('!' | '?' | '+')[] {
  return [...(told ? [told] : []), ...(asking ? (['+'] as const) : [])];
}
