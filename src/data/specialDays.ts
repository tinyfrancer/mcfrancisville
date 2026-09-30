import type { SpotName } from './maps';
import type { VillagerId } from '../types/ids';
import { CODY_NICKNAME } from './villagers';
import type { Ware } from './shop';

/**
 * The days that matter (decisions.md 20), by month and day only: her birth year stays out of the
 * repo. The day before her birthday is the one Cody always swears is the day.
 */
export type SpecialDayId = 'earlyBirthday' | 'birthday' | 'anniversary';

export const SPECIAL_DAYS: Record<SpecialDayId, string> = {
  earlyBirthday: '04-08',
  birthday: '04-09',
  anniversary: '06-06',
};

/** The year they were married, for counting the years (personal_touches.md, "Dates"). */
export const WEDDING_YEAR = 2020;

/**
 * What each villager says first on a special day, before anything else. `{name}` is her name, and
 * `{years}` how many years they've been married. On the early birthday, Cody wishes her a happy
 * birthday and everyone else, Agatha first, gently puts him right.
 */
export const SPECIAL_LINES: Record<SpecialDayId, Record<VillagerId, string>> = {
  earlyBirthday: {
    cody: "Happy birthday, babe! …What? It's the eighth. It's your birthday. I'm sure of it. Pretty sure.",
    agatha:
      `${CODY_NICKNAME} has been telling the whole town it's your birthday. It's tomorrow, isn't ` +
      'it? I checked. I always check.',
    maude:
      "Cody says it's your birthday, {name}. My calendar says tomorrow, and my calendar is never wrong.",
    rufus:
      "Is it your birthday?! Cody said it's your birthday! …Agatha says it's tomorrow. TWO birthdays?!",
    wrapunzel:
      "Cody ordered a cake for today. I've told him it's for tomorrow. Act surprised twice, dear.",
    barty:
      "Cody's jumped the gun again, eh? Happy birthday-eve, {name}. The real thing's tomorrow.",
    ollie:
      "Cody's had me deliver nine birthday cards to you today, {name}. I've put them back in the bag till tomorrow.",
    nessa: "Cody says it's your birthday. The lake says tomorrow. The lake is usually right.",
    gourdon:
      "Happy birthday-eve, {name}. Cody's a day early. He's built like that. Can't be sanded down.",
    hazel:
      '{name}, the stars say your birthday is tomorrow. Cody says the stars are a day slow. They are not.',
  },
  birthday: {
    cody: "Happy birthday, mi amor. For real this time. Told you I was only a day early. Everyone's here for you.",
    agatha: 'Happy birthday, {name}. Today is the day. I checked twice.',
    maude:
      'Happy birthday, {name}! I wrote you a poem. It rhymes "birthday" with "worth a day". It\'s a work in progress.',
    rufus:
      "HAPPY BIRTHDAY!!! I've been awake since four! I'm so excited! Are you excited?! I'm excited!",
    wrapunzel: "Happy birthday, my darling! There's a cake in your mailbox. Don't ask how it fits.",
    barty:
      'Many happy returns, {name}! Another year young. Take it from a fellow who stopped counting.',
    ollie:
      "Happy birthday, {name}! Your mailbox is full to the flag. I've never been so proud of a mailbox.",
    nessa:
      'Happy birthday, {name}. I lit every lantern on the lake for you last night. Did you see?',
    gourdon: 'Happy birthday, {name}. Carved a fresh grin special for today. Wider than usual.',
    hazel: "Happy birthday, {name}! On the night you were born, I'd bet the sky was showing off.",
  },
  anniversary: {
    cody: '{years} years today, honey bunny. Still my orb. Still the best thing that ever happened to this vampire.',
    agatha: `Happy anniversary to you and ${CODY_NICKNAME}. {years} years. That's real magic, and I'd know.`,
    maude:
      "Happy anniversary, {name}! {years} years. That's longer than most books. And a much better story.",
    rufus:
      "HAPPY ANNIVERSARY! Cody keeps smiling! With the fangs! It's the best thing I've ever seen!",
    wrapunzel:
      '{years} years, my darling! I was married for four hundred. The first {years} are the sweetest.',
    barty: 'Happy anniversary, {name}! {years} years, and still growing. Just like a good garden.',
    ollie:
      "Happy anniversary, {name}! {years} years. Cody's sent you a letter. By me. Across the road.",
    nessa: "Happy anniversary, {name}. {years} years. That's longer than I was shy for. Nearly.",
    gourdon: '{years} years, {name}. Built to last, that is. Good joinery. Happy anniversary.',
    hazel:
      "Happy anniversary! {years} years, {name}. There's a star for every one of them. I've counted.",
  },
};

/** A letter that comes on a special day, once each year. */
export interface SpecialLetter {
  from: VillagerId | 'everyone';
  letter: string;
  gift?: Ware;
}

export const SPECIAL_LETTERS: Partial<Record<SpecialDayId, SpecialLetter>> = {
  birthday: {
    from: 'everyone',
    letter:
      'Happy birthday, {name}!\n\nFrom all of us in McFrancisVille: Maude, Rufus, Wrapunzel, ' +
      'Agatha, Barty and Cody (who says he wished you happy birthday first, and technically he ' +
      "did).\n\nThere's cake. There's always cake.",
    gift: { furniture: 'birthdayCake' },
  },
  // Just the one line, in Cody's words (personal_touches.md, "The finishing touches"); the orb that
  // comes with it counts the years.
  anniversary: {
    from: 'cody',
    letter: 'Babe,\n\nI love you to the moon and back.\n\nForever orbs,\nCody',
    gift: { furniture: 'foreverOrbs' },
  },
};

/** Where everyone stands on her birthday: all round the well, for the party. */
export const PARTY_SPOTS: Record<VillagerId, SpotName<'town'>> = {
  cody: 'wellNorthWest',
  maude: 'wellNorthEast',
  rufus: 'wellWest',
  wrapunzel: 'wellSouthWest',
  agatha: 'wellEast',
  barty: 'wellSouthEast',
  ollie: 'wellBackLeft',
  nessa: 'wellBackRight',
  gourdon: 'wellFrontLeft',
  hazel: 'wellFrontRight',
};
