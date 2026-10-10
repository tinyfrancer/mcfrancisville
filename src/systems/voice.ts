import { HEART_MOMENTS, type HeartMoment } from '../data/heartMoments';
import { QUESTIONS, type Answer, type Question } from '../data/questions';
import { REPLIES, type Reply } from '../data/replies';
import type { Topic } from '../data/smallTalk';
import type { VillagerId } from '../types/ids';
import { hashMixed } from './random';

/*
 * Her voice, and their stories (V1's P2, decision 301): which heart moment a neighbour has to tell
 * her, the question they ask once they're friends, what she can say back to a line, and how her
 * answer comes up again.
 */

/**
 * The heart moment a neighbour has to tell her, if any: the first of theirs (lowest hearts first)
 * whose hearts she has reached and that she hasn't been told (`seen`, the hearts of those she
 * has). A friendship that jumped several at once is told them one at a time, in order.
 */
export function momentDue(
  villager: VillagerId,
  hearts: number,
  seen: readonly number[],
): HeartMoment | null {
  const moments = HEART_MOMENTS[villager] ?? [];
  return moments.find((m) => m.hearts <= hearts && !seen.includes(m.hearts)) ?? null;
}

/** They ask their question once they're friends: three hearts, the `friend` band. */
export const QUESTION_HEARTS = 3;

/** The question a neighbour has to ask her, until she has answered it. */
export function questionDue(
  villager: VillagerId,
  hearts: number,
  answered: string | undefined,
): Question | null {
  if (hearts < QUESTION_HEARTS || answerOf(villager, answered)) return null;
  return QUESTIONS[villager];
}

/** One of a neighbour's answers by the id it's kept as, if it's one this build knows. */
export function answerOf(villager: VillagerId, id: string | undefined): Answer | null {
  return QUESTIONS[villager].answers.find((a) => a.id === id) ?? null;
}

/** Her answer to a neighbour as they say it later ("the little red star"), if she has answered. */
export function answerSaid(villager: VillagerId, id: string | undefined): string | null {
  return answerOf(villager, id)?.called ?? null;
}

/** Her answer comes up about one day in three, so it stays something they remember. */
export const ANSWER_EVERY = 3;

export function answerComesUp(villager: VillagerId, day: string): boolean {
  return hashMixed(`answer:${villager}:${day}`) % ANSWER_EVERY === 0;
}

/** What she can say back to a line on a topic, and what this neighbour says to each. */
export function repliesTo(villager: VillagerId, topic: string | null): Reply[] {
  const row = topic ? REPLIES[topic as Topic] : undefined;
  if (!row) return [];
  return row.say.map((say, i) => ({ say, back: row.back[villager][i] ?? row.back[villager][0]! }));
}
