import type { SpotName } from './maps';
import type { VillagerId } from '../types/ids';
import { CODY_NICKNAME } from './villagers';
import type { Ware } from './shop';

/**
 * The days that matter (decisions.md 20), by month and day only: her birth year stays out of the
 * repo. The day before her birthday is the one Cody always swears is the day.
 */
export type SpecialDayId =
  'earlyBirthday' | 'birthday' | 'anniversary' | 'septemberSong' | 'dollyDay';

/**
 * The 21st of September is the day they always sing the Earth, Wind & Fire song, and the 25th is
 * Dolly Parton day, as of 2026 (personal_touches.md, "Dates"; 0.2's D2).
 */
export const SPECIAL_DAYS: Record<SpecialDayId, string> = {
  earlyBirthday: '04-08',
  birthday: '04-09',
  anniversary: '06-06',
  septemberSong: '09-21',
  dollyDay: '09-25',
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
    boothoven:
      "Your birthday's tomorrow, isn't it, {name}? I've been practising the song. Cody says it's today. Agatha says it isn't.",
    scarah:
      "{name}, Cody's been all round the farm telling everyone it's your birthday. My calendar says tomorrow. Cornelius sides with the calendar.",
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
    boothoven:
      "Happy birthday, {name}! I've written you a birthday song. It's the usual one, but much more dramatic.",
    scarah:
      "Happy birthday, {name}! I've planted a whole row of sunflowers in the shape of your name. Give them a week.",
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
    boothoven:
      "Happy anniversary! {years} years, {name}. That's a long, lovely duet. I'm playing it a little encore.",
    scarah:
      "Happy anniversary, {name}! {years} years. That's {years} harvests, and every one of them a good one.",
  },
  // Their song is theirs to sing: the lines only know what day it is, and the town hums along.
  septemberSong: {
    cody: "It's the twenty-first of September, babe. You know what that means. Sing it with me. Louder.",
    agatha:
      "The twenty-first of September. I can hear you two singing from here, {name}. Don't stop.",
    maude:
      "Is it the twenty-first already? I've heard a certain song through the library walls all morning. I'm humming it now.",
    rufus:
      "IT'S THE TWENTY-FIRST OF SEPTEMBER!!! Cody told me! I don't know the words! I'm singing anyway!",
    wrapunzel:
      "The twenty-first of September, my darling! Your song day. I've iced a little record on every bun.",
    barty:
      "Twenty-first of September, eh? Cody's been dancing down the lane since dawn. Join him, {name}.",
    ollie:
      "Big day, {name}! Twenty-first of September. I've been whistling your song on the round. Badly.",
    nessa:
      "It's the twenty-first. I heard you both singing by the lake last year. I hummed along. Quietly.",
    gourdon:
      'Twenty-first of September. Built a little stage by the well for the two of you. Sing away.',
    hazel:
      'The twenty-first of September! The stars are all out dancing tonight. They know the song too.',
    boothoven:
      "The twenty-first of September! {name}, there's a song for today. The whole town's humming it. So am I.",
    scarah:
      "It's the twenty-first of September! {name}, I don't know the words, but I've been dancing in the field all morning. The crows joined in.",
  },
  // Dolly Parton day (her favourite): butterflies in every place, and a nod or two, never a likeness.
  dollyDay: {
    cody: "Happy Dolly Parton day, mi amor! I've backcombed my hair. As high as it goes. Higher.",
    agatha:
      "Dolly Parton day, {name}. I've stitched a patch of every colour on my cloak. A coat of many colours. Well, a cloak.",
    maude:
      "It's Dolly Parton day! I've put her books at the front. And the butterflies are everywhere today. Look!",
    rufus:
      "Is it Dolly's day?! The dog?! …Oh! Dolly PARTON! Even better! I've put rhinestones on my collar!",
    wrapunzel:
      'Happy Dolly Parton day, dear! Big hair, big heart, big biscuits. I can only do the biscuits.',
    barty:
      'Dolly Parton day, {name}! Butterflies all over the beds this morning. They know a good woman when they hear one.',
    ollie:
      "Dolly Parton day! I'm working nine till five today just to feel close to her. I usually do eight till four.",
    nessa:
      "Happy Dolly Parton day. The butterflies came down to the lake this morning. So many. I didn't even blush.",
    gourdon:
      "Dolly Parton day. Carved a butterfly into the bench by the well. Rhinestones would've been too much. Nearly did it.",
    hazel:
      "Happy Dolly Parton day, {name}! There's a whole cloud of butterflies over the town. Brightest stars I've seen by day.",
    boothoven:
      "Happy Dolly Parton day, {name}! I've learned three chords and the truth. The butterflies approve.",
    scarah:
      "Happy Dolly Parton day, {name}! A country girl through and through, like me. I've sung to the sweetcorn since sunrise. It's grown an inch.",
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
    // Signed by all twelve (V1's P2), each in their own way.
    letter:
      'Happy birthday, {name}!\n\nFrom all of us in McFrancisVille:\n\n' +
      'Maude (in pencil, very neatly)\nRufus!!! (and a pawprint)\n' +
      'Wrapunzel (with love and flour)\nAgatha (just the A)\nBarty (and Terry the worm)\n' +
      'Ollie (first class)\nNessa (a little damp)\nGourdon (carved, not written)\n' +
      'Hazel (with a star by it)\nBoothoven (fortissimo)\nScarah (and Cornelius, who wrote "Pumpkin")\n' +
      'and Cody, who says he wished you happy birthday first, and technically he did.' +
      "\n\nThere's cake. There's always cake.",
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
  boothoven: 'wellEastUp',
  scarah: 'wellWestUp',
};
