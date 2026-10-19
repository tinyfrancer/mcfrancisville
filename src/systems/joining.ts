import type { VerbChoice, VerbRow } from '../data/happeningVerbs';
import { tunesOf, TUNES, type TuneId } from '../data/instruments';
import type { HappeningId } from '../types/ids';
import { weekOf } from './calendar';
import { hashString } from './random';

/*
 * Joining in at a happening (V1's P4): which of a verb's picks are on offer, and what the host
 * says the next time it's on, remembering. From the rows, the day key and what she did, nothing
 * else; `world/services/Joining.ts` does it and keeps it.
 */

/** What she did at a happening, the last time: the day, and what she picked, if there was a pick. */
export interface Joined {
  on: string;
  choice?: string;
}

/** What's kept of joining in, by happening (save v48). */
export type JoinedSnapshot = Partial<Record<HappeningId, Joined>>;

/** How many tunes the recital takes requests from: the latest she has learnt first. */
const REQUESTS = 3;

/** A tune as one of the recital's picks. */
function tuneChoice(tune: TuneId): VerbChoice {
  const { name } = TUNES[tune];
  return {
    id: tune,
    say: name,
    back: `"${name}"! An excellent request, {name}. A one, a two, a one-two-three…`,
    called: `"${name}"`,
  };
}

/**
 * The recital's requests: the piano tunes she has learnt from Boothoven, the latest first, and the
 * ones every piano knows after them, three in all.
 */
export function requestsFrom(learnt: readonly TuneId[]): TuneId[] {
  const known = tunesOf('piano', learnt);
  const hers = [...learnt].reverse().filter((t) => known.includes(t));
  return [...hers, ...known.filter((t) => !hers.includes(t))].slice(0, REQUESTS);
}

/**
 * What she can pick at a happening on a day: the tunes she knows for the recital; `deal` of the
 * row's picks, the same all week and turning over each Monday; or all of them.
 */
export function choicesOn(
  id: HappeningId,
  row: VerbRow,
  day: string,
  learnt: readonly TuneId[] = [],
): VerbChoice[] {
  if (!row.choices) return [];
  if (row.choices === 'tunes') return requestsFrom(learnt).map(tuneChoice);
  const all = row.choices;
  if (!row.deal || row.deal >= all.length) return [...all];
  const start = hashString(`verb:${id}:${weekOf(day)}`) % all.length;
  return Array.from({ length: row.deal }, (_, k) => all[(start + k) % all.length]!);
}

/** A pick as it's said afterwards, by its id, or null for one this build doesn't know. */
export function calledOf(row: VerbRow, choice: string): string | null {
  if (row.choices === 'tunes') return choice in TUNES ? tuneChoice(choice as TuneId).called : null;
  return row.choices?.find((c) => c.id === choice)?.called ?? null;
}

/**
 * What the host says, remembering the last time she joined in, on a later day than that: with a
 * pick, what she picked; null if she hasn't yet, it was today, or the pick is one this build
 * doesn't know (forgotten, never refused).
 */
export function recalled(row: VerbRow, joined: Joined | undefined, day: string): string | null {
  if (!joined || joined.on >= day) return null;
  if (!row.choices) return row.remembers;
  const called = joined.choice ? calledOf(row, joined.choice) : null;
  return called ? row.remembers.replaceAll('{choice}', called) : null;
}
