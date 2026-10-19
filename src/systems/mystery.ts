import { CLUES, SECOND_LETTER_DAYS, type ClueId, type SuspectId } from '../data/mystery';
import { CHAPTERS, STORY_FESTIVAL } from '../data/story';
import { festivalDay, festivalsOn } from './calendar';
import { daysBetween } from './farming';
import { hashString } from './random';
import type { TileMap } from './grid';
import type { Tile } from './pathfinding';

/** Somewhere Wes can lurk: beside a tree, peering round it from the `side` he's on. */
export interface Lurk extends Tile {
  side: 'left' | 'right';
}

/** Open ground just left or right of a tree, where Wes can half hide behind it. */
export function lurksOf(map: TileMap, open: (tx: number, ty: number) => boolean): Lurk[] {
  const lurks: Lurk[] = [];
  for (const tree of map.props.filter((p) => p.id === 'tree')) {
    if (open(tree.tx - 1, tree.ty)) lurks.push({ tx: tree.tx - 1, ty: tree.ty, side: 'left' });
    if (open(tree.tx + tree.w, tree.ty)) {
      lurks.push({ tx: tree.tx + tree.w, ty: tree.ty, side: 'right' });
    }
  }
  return lurks;
}

/** Wes turns up for a minute at a time, now and then. */
export const WES_SLOT_MS = 60_000;

/**
 * He only lurks where she'd glimpse him on a phone's screen, which shows a little more than 18
 * tiles across and 40 down: not too near, and not off the edge.
 */
export const WES_NEAREST = 5;
export const WES_ACROSS = 7;
export const WES_DOWN = 14;

/** Once she's this close, he's gone. */
export const WES_SPOOKS_AT = 3;

/** Whether Wes lurks in a slot: about one minute in four. */
export function wesLurks(slot: number): boolean {
  return hashString(`wes@${slot}`) % 4 === 0;
}

/**
 * Where Wes lurks in a slot, chosen as it starts from where she is then: somewhere she'd just
 * catch sight of him. Null if he isn't out, or nowhere suits.
 */
export function wesSpot(slot: number, lurks: readonly Lurk[], her: Tile): Lurk | null {
  if (!wesLurks(slot)) return null;
  const edge = lurks.filter((l) => {
    const dx = Math.abs(l.tx - her.tx);
    const dy = Math.abs(l.ty - her.ty);
    return Math.max(dx, dy) >= WES_NEAREST && dx <= WES_ACROSS && dy <= WES_DOWN;
  });
  return edge[hashString(`wesAt@${slot}`) % Math.max(1, edge.length)] ?? null;
}

/** Whether the mayor's second letter is due, a week after the first came. */
export function secondLetterDue(firstCame: string, today: string): boolean {
  return daysBetween(firstCame, today) >= SECOND_LETTER_DAYS;
}

/** Who her clues point at so far, in the order they were first pointed at. */
export function suspectsOf(found: readonly ClueId[]): SuspectId[] {
  const suspects: SuspectId[] = [];
  for (const id of found) {
    const who = CLUES[id].points;
    if (who && !suspects.includes(who)) suspects.push(who);
  }
  return suspects;
}

/** Who her clues have cleared so far (V1's P3a). */
export function clearedOf(found: readonly ClueId[]): SuspectId[] {
  return found.flatMap((id) => {
    const who = CLUES[id].clears;
    return who ? [who] : [];
  });
}

/** A chapter of the mayor's October story, as its letter's id. */
export const chapterId = (n: number) => `story:${n}`;

/**
 * The chapters of the mayor's story due by a day (0.2's J3), by number: those whose week of the
 * festival has come. None outside it; a chapter not had this year comes the next.
 */
export function chaptersDue(day: string): number[] {
  if (!festivalsOn(day).includes(STORY_FESTIVAL)) return [];
  const { nth } = festivalDay(STORY_FESTIVAL, day);
  return CHAPTERS.flatMap((c, i) => (c.day <= nth ? [i] : []));
}
