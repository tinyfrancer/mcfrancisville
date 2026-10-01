import { CRITTERS } from '../data/critters';
import { HAPPENINGS } from '../data/happenings';
import { ITEMS } from '../data/items';
import { HAPPENING_CALLED, SMALL_TALK, TOPICS, type Topic } from '../data/smallTalk';
import { SPECIAL_DAYS } from '../data/specialDays';
import { isTool, type Held } from '../data/tools';
import type { Weather } from '../data/weather';
import type { CritterId, HappeningId, VillagerId } from '../types/ids';
import { windowAtHour } from './clock';
import { happeningsOn, hourOfNight } from './happenings';

/**
 * What's going on round her as she talks to someone (0.2's D2), for what they bring up. The
 * world fills it in at the talk; a test can make one up. Nothing in it is saved: what she caught
 * today is forgotten by a reload, and only means a line or two fewer.
 */
export interface TalkScene {
  weather: Weather;
  storm: boolean;
  /** What's in her hand, from the quick bar. */
  holding: Held;
  /** The last critter she caught today, if any. */
  caught: CritterId | null;
  /** The pet out walking with her, by the name she has given it. */
  pet: string | null;
}

/** A critter as it's spoken of, with its "a": "a candle moth", "an axolotl", "a Hercules beetle". */
export function aCritter(id: CritterId): string {
  const name = CRITTERS[id].name;
  const word = /^Hercules\b/.test(name) ? name : name.charAt(0).toLowerCase() + name.slice(1);
  return `${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word}`;
}

/**
 * A happening of theirs still to come today, if any: one they're part of that hasn't begun. On
 * her birthday the whole town is at her party instead.
 */
export function comingUp(villager: VillagerId, day: string, hour: number): HappeningId | null {
  if (day.slice(5) === SPECIAL_DAYS.birthday) return null;
  const h = hourOfNight(hour);
  return (
    happeningsOn(day).find((id) => {
      const row = HAPPENINGS[id];
      return row.who.includes(villager) && h < row.from;
    }) ?? null
  );
}

/** Which topics fit now, the first first, with what each line leaves to fill. */
function topicsNow(
  villager: VillagerId,
  scene: TalkScene,
  day: string,
  hour: number,
): { topic: Topic; fill: Record<string, string> }[] {
  const fits: { topic: Topic; fill: Record<string, string> }[] = [];
  const coming = comingUp(villager, day, hour);
  const held = scene.holding;
  for (const topic of TOPICS) {
    if (topic === 'storm' && scene.weather === 'rain' && scene.storm)
      fits.push({ topic, fill: {} });
    if (topic === 'rain' && scene.weather === 'rain' && !scene.storm)
      fits.push({ topic, fill: {} });
    if (topic === 'fog' && scene.weather === 'fog') fits.push({ topic, fill: {} });
    if (topic === 'happening' && coming) {
      const fill = { happening: HAPPENING_CALLED[coming], place: HAPPENINGS[coming].place };
      fits.push({ topic, fill });
    }
    if (topic === 'caught' && scene.caught) {
      fits.push({ topic, fill: { catch: aCritter(scene.caught) } });
    }
    if (topic === 'pet' && scene.pet) fits.push({ topic, fill: { pet: scene.pet } });
    if (topic === held) fits.push({ topic, fill: {} });
    if (topic === 'seed' && !isTool(held) && ITEMS[held].kind === 'seed')
      fits.push({ topic, fill: {} });
    if (topic === windowAtHour(hour)) fits.push({ topic, fill: {} });
  }
  return fits;
}

/**
 * What a neighbour could bring up now, in the order they would: the sky first, then what's on,
 * then what she's doing, and her day last. Each is that topic's line in their words, with all but
 * her name filled in.
 */
export function smallTalk(
  villager: VillagerId,
  scene: TalkScene,
  day: string,
  hour: number,
): string[] {
  return topicsNow(villager, scene, day, hour).map(({ topic, fill }) =>
    Object.entries(fill).reduce(
      (line, [key, value]) => line.replaceAll(`{${key}}`, value),
      SMALL_TALK[topic][villager],
    ),
  );
}
