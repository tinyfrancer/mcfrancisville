import {
  BAND_MOODS,
  FEELING_CUES,
  GIFT_MOODS,
  KIND_MOODS,
  TOPIC_MOODS,
  type LineKind,
} from '../data/moods';
import type { Topic } from '../data/smallTalk';
import type { Feeling } from '../types/mood';
import type { Band } from './remembering';

/*
 * How a face feels for a line (V1's L7, decision 296): a row's own feeling where it has one, and
 * where it says nothing, one worked out from the line's words, the kind of line it is and how
 * close they are. The talk sheet shows it on their bust and the world on their sprite, the same
 * face.
 */

/** What's known of a line as it's said. */
export interface LineFacts {
  kind: LineKind;
  text: string;
  band: Band;
  /** The topic it's on, for one on a topic. */
  topic?: string | null;
  /** The row's own feeling, if it gives one: null for a row that says "as usual". */
  mood?: Feeling | null;
}

/** The feeling a line's own words give it ("Ha!", "Hmph.", "Oh!", "…!"), if any. */
export function feelingIn(text: string): Feeling | null {
  return FEELING_CUES.find(({ cue }) => cue.test(text))?.feel ?? null;
}

/**
 * How a neighbour feels saying a line: its row's feeling, then its topic's, then its words', then
 * its kind's, then their band's; null for their face as usual.
 */
export function feelingOf(facts: LineFacts): Feeling | null {
  if (facts.mood !== undefined) return facts.mood;
  const topical = facts.topic ? TOPIC_MOODS[facts.topic as Topic] : undefined;
  if (topical) return topical;
  return feelingIn(facts.text) ?? KIND_MOODS[facts.kind] ?? BAND_MOODS[facts.band];
}

/** How a neighbour takes a gift, or a gift turned down (a second in a day). */
export function giftFeeling(reaction: 'loved' | 'liked' | 'fine' | null): Feeling | null {
  return GIFT_MOODS[reaction ?? 'declined'];
}

/**
 * How she feels saying what's on her chip (V1's L7): its row's feeling if it has one, or else the
 * one in her words, if any; a chip that's no feeling ("I picked it just for today.") leaves her
 * face as it is.
 */
export function herFeeling(say: string, mood?: Feeling | null): Feeling | null {
  return mood !== undefined ? mood : feelingIn(say);
}

/** How long a face keeps a feeling after the line that brought it, once the talk is over. */
export const FEEL_AFTER_MS = 2_400;
