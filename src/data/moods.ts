import type { Feeling } from '../types/mood';
import type { Topic } from './smallTalk';

/*
 * How a neighbour feels saying something (V1's L7, decision 296), where a row says so. A line on
 * a topic takes its topic's feeling; a heart moment's lines take their `moods`
 * (`data/heartMoments.ts`), a reply its `mood` (`data/replies.ts`). Where nothing here says, the
 * feeling is worked out from the line and how close they are (`systems/moods.ts`).
 */

/** How each topic is said, where it has a feeling of its own. */
export const TOPIC_MOODS: Partial<Record<Topic, Feeling>> = {
  band: 'happy',
  // "There you are!"
  away: 'surprised',
  missed: 'happy',
  storm: 'surprised',
  invite: 'happy',
  happening: 'happy',
  gift: 'happy',
  caught: 'surprised',
  harvest: 'happy',
  donated: 'happy',
  placed: 'happy',
  mystery: 'surprised',
  mayorMet: 'laugh',
  pet: 'happy',
  costume: 'laugh',
  outfit: 'happy',
  bracelet: 'shy',
  answer: 'happy',
};

/** How they take what she gives them: a loved thing makes them laugh for joy. */
export const GIFT_MOODS: Record<'loved' | 'liked' | 'fine' | 'declined', Feeling | null> = {
  loved: 'laugh',
  liked: 'happy',
  fine: null,
  // A second gift in a day, turned down as nicely as they can.
  declined: 'shy',
};

/** What kind of line it is, which says how it's said when the line itself doesn't. */
export type LineKind =
  | 'topic'
  | 'pool'
  | 'moment'
  | 'question'
  | 'reply'
  | 'puff'
  | 'happening'
  | 'dropBy'
  | 'small'
  | 'favour'
  | 'action';

export const KIND_MOODS: Partial<Record<LineKind, Feeling>> = {
  // They let one go, and are a little pink about it.
  puff: 'shy',
  happening: 'happy',
  dropBy: 'happy',
  favour: 'happy',
};

/** How close they are, for a line that says nothing else: friendlier the closer. */
export const BAND_MOODS: Record<'hello' | 'friend' | 'close' | 'best' | 'married', Feeling | null> =
  {
    hello: null,
    friend: null,
    close: 'happy',
    best: 'happy',
    married: 'happy',
  };

/**
 * What a line says of how it's said, in its own words, first that matches: a laugh, a huff, a
 * sorry, an um, an "oh!", and a line that ends glad.
 */
export const FEELING_CUES: readonly { feel: Feeling; cue: RegExp }[] = [
  { feel: 'laugh', cue: /\b(ha(ha)*|hah|heh|hee(hee)*|giggl\w*|chuckl\w*)\b/i },
  { feel: 'cross', cue: /\b(hmph|humph|harrumph|tsk)\b/i },
  { feel: 'sad', cue: /\b(sorry|sad|lonely|sigh|alas)\b/i },
  { feel: 'shy', cue: /\b(um+|erm|blush\w*)\b/i },
  { feel: 'surprised', cue: /^(oh+|ooh+|oho|whoa|wow|goodness|gosh|golly)\b|\?!|!\?/i },
  { feel: 'happy', cue: /!["”']?\s*$/ },
];
