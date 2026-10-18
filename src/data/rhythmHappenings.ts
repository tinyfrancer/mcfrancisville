import type { RhythmId } from '../types/ids';
import type { HappeningRow } from './happenings';

/*
 * The weeks' new beats (V1's R3, `docs/v1_analysis.md` finding 3's "Every weekday is the same"):
 * something in the daytime on Monday, Tuesday and Thursday, so a morning or afternoon player
 * finds a week with a shape; and the one beat a week of each season's festival. What she does at
 * each is `data/happeningVerbs.ts`, as every happening's is.
 */
export const RHYTHM_HAPPENINGS: Record<RhythmId, HappeningRow> = {
  // Monday mornings: Scarah weighs out the week's seed at her cart, Cornelius on her shoulder.
  marketRound: {
    name: "Scarah's market round",
    icon: { item: 'pumpkinSeed' },
    place: "at Scarah's seed cart",
    on: { weekdays: [1] },
    from: 8,
    until: 11,
    where: { zone: 'booAcres', at: 'seedCart' },
    who: ['scarah'],
    says: {
      scarah:
        "Market round, {name}! Every Monday I weigh out the week's seed and pick a star crop for the sign. Cornelius helps. He pecks.",
    },
  },
  // Tuesday afternoons: Hazel on her back at the lookout, naming the clouds.
  cloudWatching: {
    name: 'Cloud watching',
    icon: 'fog',
    place: 'up at the lookout',
    on: { weekdays: [2] },
    from: 14,
    until: 17,
    where: { at: 'lookout' },
    who: ['hazel', 'nessa'],
    says: {
      hazel:
        "The stars are asleep, {name}, so in the afternoons I do the clouds. That one's a teapot. Look, it's pouring!",
      nessa:
        'Hazel says every cloud is something. I think that one is just a cloud. I like it anyway.',
    },
  },
  // Thursday afternoons: Agatha's herb walk in the woods, a basket for the week's brews.
  herbWalk: {
    name: "Agatha's herb walk",
    icon: 'plant',
    place: 'among the herbs in Whisperwood',
    on: { weekdays: [4] },
    from: 13,
    until: 16,
    where: { zone: 'whisperwood', at: 'herbs' },
    who: ['agatha', 'barty'],
    says: {
      agatha:
        "{name}! The herb walk. One basket, one week of brews. You choose what goes in today's, and I'll brew whatever it does.",
      barty:
        "{name}, I come for the mushrooms. Agatha comes for the magic. The mushrooms come for nobody. They're very independent.",
    },
  },

  // Blossom week's Saturday (spring): a picnic under the willow, in a snow of petals.
  blossomPicnic: {
    name: 'The blossom picnic',
    icon: 'blossom',
    place: 'under the willow',
    on: { festival: 'blossomWeek', weekdays: [6] },
    from: 12,
    until: 16,
    where: { at: 'willow' },
    who: ['wrapunzel', 'barty', 'rufus', 'maude'],
    says: {
      wrapunzel:
        "A picnic under the blossom, dear! Sandwiches with the crusts off. I took the crusts off with a spell. Agatha's.",
      barty: "{name}! Petals in my eye sockets again. Best week of the year. I'm not complaining.",
      rufus: "I'm catching the petals! I've caught nine! I ate one. It was pink-flavoured!",
      maude: 'The blossom falls straight through me, {name}. It tickles. I come every year.',
    },
  },
  // Fireworks week's Saturday (summer): sparklers along the shore, practice for the Fourth.
  sparklerNight: {
    name: 'Sparklers at the shore',
    icon: 'sparkle',
    place: 'along the shore at Lantern Shore',
    on: { festival: 'fireworksWeek', weekdays: [6] },
    from: 20,
    until: 23,
    where: { zone: 'lanternShore', at: 'shoreWest' },
    who: ['ollie', 'nessa', 'gourdon'],
    says: {
      ollie:
        "Sparkler night, {name}! You write your name in the air before it goes. I always run out of sparkler at the 'l'.",
      nessa: 'The lake does them twice, {name}. Once in the air, and once on the water. Look.',
      gourdon: 'Made the sparkler box. Safety first. Then sparkles.',
    },
  },
  // Winter lights week's Saturday: a walk round every lit window, ending at the well.
  lightsWalk: {
    name: 'The lights walk',
    icon: 'lantern',
    place: 'by the well',
    on: { festival: 'lightsWeek', weekdays: [6] },
    from: 18,
    until: 21,
    where: { at: 'byTheWell' },
    who: ['nessa', 'hazel', 'boothoven'],
    says: {
      nessa:
        "We walk round every lit window, {name}, and say which is best. It's always yours. Don't tell the others.",
      hazel:
        '{name}, every window in town is a little star tonight. I counted. I have a book for it.',
      boothoven:
        '{name}! A walk with a hum! I hum a carol at each window. The windows hum back. Mostly the haunted ones.',
    },
  },
};
