import type {
  Facing,
  FurnitureId,
  HappeningId,
  InteriorId,
  ItemId,
  PropId,
  VillagerId,
} from '../types/ids';
import type { FestivalId, HolidayId } from './calendar';
import type { SpecialDayId } from './specialDays';
import type { SpotName } from './maps';
import type { MapZoneId } from '../types/ids';

/**
 * Which days a happening is on: some weekdays (0 is Sunday) by the day key, the night of a full
 * moon, about one day in `oneIn`, dealt from the day key, a holiday (phase U), some weekdays of
 * a festival but its finale, which is the finale's own (0.2's J3), or one of her special days
 * (0.2's L2).
 */
export type HappeningDays =
  | { weekdays: readonly number[] }
  | { fullMoon: true }
  | { oneIn: number }
  | { holiday: HolidayId }
  | { festival: FestivalId; weekdays: readonly number[] }
  | { special: SpecialDayId };

/**
 * Gathered outdoors in a place: round the host at a spot, everyone at their own place for a party
 * the whole town comes to (round the well in town, before the stage at the fairground), or each in
 * a seat of their own, in the order of `who`.
 */
export type Outdoors<Z extends MapZoneId> =
  { at: SpotName<Z> } | { party: true } | { seats: readonly SpotName<Z>[] };

/** A piece set out for a happening, standing all its day, by its top left. */
export interface SetPiece {
  prop: PropId;
  tx: number;
  ty: number;
  /** Put out only if she has one of this furniture (her carving, put out with the town's). */
  hers?: FurnitureId;
}

export interface HappeningRow {
  name: string;
  /** Beside its name on the calendar. */
  icon: string;
  /** Where, as the calendar says it: "in Maude's library". */
  place: string;
  on: HappeningDays;
  /**
   * The hours of the day key it runs, from `from` until `until`; an `until` past 24 runs on past
   * midnight (a Friday's 26 is two in the morning, still Friday's).
   */
  from: number;
  until: number;
  /**
   * Inside a building, round whoever keeps it, at a spot in town, or all round the well, each at
   * their place at her birthday party (`PARTY_SPOTS`), for a party the whole town comes to, or
   * each in a seat of their own, in the order of `who` (0.2's J3's film night).
   */
  where: { inside: InteriorId } | Outdoors<'town'>;
  /** Who's there, the host first, standing at the place; the rest gather round them. */
  who: readonly VillagerId[];
  /** What each says to her the first time she talks to them there. `{name}` is her name. */
  says: Partial<Record<VillagerId, string>>;
  /** What she finds as she walks in on it, after the room's own welcome. */
  welcome?: string;
  /** Something the host hands her, once, the first time she talks to them there. */
  gift?: ItemId;
  /** Something about it she can see from across the room: sparkles over the host, for a spell. */
  sparkles?: boolean;
  /** Which way everyone there looks, when she isn't close by: at a film, say. */
  faces?: Facing;
  /**
   * What's set out in town for it, standing all its day (a screen, a table), by top left; a piece
   * with `hers` only if she has one of that furniture (her carving, put out with the town's).
   */
  set?: readonly SetPiece[];
  /**
   * Where it goes once the Hollow Fairground is open to her (0.2's M3, decision 202): how they
   * gather there, where the calendar says it is, and what's set out there. Until the gate opens
   * it's in town, as `where` says, so she can always get to it (decisions.md 11).
   */
  fair?: { where: Outdoors<'fairground'>; place: string; set?: readonly SetPiece[] };
}

/** Where each stands at a gathering before the fairground's stage (0.2's M3). */
export const STAGE_SPOTS: Record<VillagerId, SpotName<'fairground'>> = {
  boothoven: 'crowdFront',
  cody: 'crowdFrontLeft',
  maude: 'crowdFrontRight',
  rufus: 'stageLeft',
  wrapunzel: 'stageRight',
  agatha: 'crowdMiddleLeft',
  barty: 'crowdMiddleRight',
  ollie: 'crowdMiddle',
  nessa: 'crowdBackLeft',
  gourdon: 'crowdBackRight',
  hazel: 'crowdBack',
};

/** The costume contest's line-up along the front of the fairground's stage. */
const LINE_UP: readonly SpotName<'fairground'>[] = [
  'lineUp1',
  'lineUp2',
  'lineUp3',
  'lineUp4',
  'lineUp5',
  'lineUp6',
  'lineUp7',
  'lineUp8',
  'lineUp9',
  'lineUp10',
];

/** Before the fairground's stage, as the calendar says it. */
const AT_THE_STAGE = "at the fairground's stage";

/**
 * Her neighbours' own events (phase S2), each on its days and hours, where they gather and what
 * they say. They come before visits and schedules, and after her birthday party, which nobody
 * misses. Nothing is missed by not going: they come round again (decisions.md 11).
 */
export const HAPPENINGS: Record<HappeningId, HappeningRow> = {
  bookClub: {
    name: 'Book club',
    icon: '📚',
    place: "in Maude's library",
    on: { weekdays: [3] },
    from: 19,
    until: 22,
    where: { inside: 'library' },
    who: ['maude', 'agatha'],
    says: {
      maude:
        "Book club! This week's is a mystery. Agatha solved it on page four, so we're discussing the biscuits.",
      agatha:
        "{name}, don't tell Maude, but I come for the gossip. And the book. Mostly the gossip.",
    },
    welcome: "It's book club night. Two members, one of them see-through, and a plate of biscuits.",
  },
  midnightBake: {
    name: 'The midnight bake',
    icon: '🍪',
    place: 'at Crumbs & Curios',
    on: { weekdays: [5] },
    from: 22,
    until: 26,
    where: { inside: 'crumbs' },
    who: ['wrapunzel', 'rufus'],
    says: {
      wrapunzel:
        "The midnight bake! Everything tastes better at midnight, {name}. Have a cookie while they're warm.",
      rufus: "I'm on broken-cookie duty! It's the most important job. Wrapunzel said so!",
    },
    welcome: 'The ovens are on, it smells of chocolate, and it is very nearly midnight.',
    gift: 'batWingCookie',
  },
  spellGoneWrong: {
    name: 'A spell gone mildly wrong',
    icon: '✨',
    place: 'by the well',
    on: { oneIn: 5 },
    from: 14,
    until: 17,
    where: { at: 'byTheWell' },
    who: ['agatha', 'barty'],
    says: {
      agatha:
        "Nobody panic. I was aiming for 'sparkly', and the well is now 'singing'. It only knows sea shanties.",
      barty: "The well's been singing all afternoon. I've learned the chorus. Yo ho, and so forth.",
    },
    sparkles: true,
  },
  moonHowl: {
    name: 'Howling at the full moon',
    icon: '🐺',
    place: 'up at the lookout',
    on: { fullMoon: true },
    from: 21,
    until: 24,
    where: { at: 'lookout' },
    who: ['rufus'],
    says: {
      rufus:
        "AWOOOOO! Full moon, {name}! Howl with me! You don't have to. You totally can, though.",
    },
  },
  seedSwap: {
    name: 'The Sunday seed swap',
    icon: '🌱',
    place: 'at the farm gate',
    on: { weekdays: [0] },
    from: 8,
    until: 11,
    where: { at: 'farmGate' },
    who: ['barty'],
    says: {
      barty:
        "Sunday seed swap! Take a packet, leave a packet. Or just take one, {name}. I've plenty.",
    },
    gift: 'snapdragonSeed',
  },
  movieNight: {
    name: 'Movie night',
    icon: '🎬',
    place: "at Cody's manor",
    on: { weekdays: [6] },
    from: 20,
    until: 23,
    where: { inside: 'codyManor' },
    who: ['cody', 'rufus', 'wrapunzel'],
    says: {
      cody: "Movie night, babe. It's a scary one. Rufus has been behind the settee since the opening credits.",
      rufus: "I'm not scared! I'm just watching from back here. It's a better angle!",
      wrapunzel:
        "I brought popcorn. Cody says it's 'a lot of popcorn'. There's no such thing, dear.",
    },
    welcome: "It's movie night at Cody's. The candles are low and somebody is hiding.",
  },
  // The Halloween Festival's Saturdays (0.2's J3): movie night moves out under the stars, and
  // the whole town watches the friendly ghost film, with popcorn (questions 31 and 71). As a
  // festival's, it comes before any everyday happening, so Cody's own movie night gives way.
  filmNight: {
    name: 'Film night',
    icon: '👻',
    place: 'on the avenue below the square',
    on: { festival: 'halloweenFestival', weekdays: [6] },
    from: 19,
    until: 22,
    where: {
      seats: [
        'filmFrontLeft',
        'filmFrontMiddle',
        'filmFrontRight',
        'filmFrontEnd',
        'filmFrontAisle',
        'filmFrontCorner',
        'filmBackLeft',
        'filmBackMiddle',
        'filmBackRight',
        'filmBackEnd',
        'filmBackCorner',
      ],
    },
    who: [
      'cody',
      'rufus',
      'wrapunzel',
      'maude',
      'agatha',
      'barty',
      'ollie',
      'nessa',
      'gourdon',
      'hazel',
      'boothoven',
    ],
    faces: 'up',
    set: [
      { prop: 'filmScreen', tx: 19, ty: 28 },
      { prop: 'popcornTable', tx: 14, ty: 29 },
    ],
    says: {
      cody: "Film night under the stars, babe. I saved you the best seat. It's the one next to me.",
      rufus: "I'm not hiding this time! It's the FRIENDLY ghost. I checked. Twice.",
      wrapunzel:
        "I made the popcorn, dear. All of it. The table's groaning. Take as much as you like!",
      maude: 'A film about a friendly ghost. Finally, someone gets it right.',
      agatha: "I've seen it forty times. Don't tell anyone I cry at the end.",
      barty: "{name}! I brought a cushion. Bones and cobbles don't mix.",
      ollie: 'I delivered the film myself this morning. Signed for, and everything.',
      nessa: "The screen glows like a lantern on the lake. I'm glad I came up.",
      gourdon: 'Built the screen. It stands. Sit down, the ghost is on.',
      hazel: 'Clear sky for it, too. The stars came out to watch, {name}.',
      boothoven:
        "A silent film, {name}! I'm playing along on a little upright. Do hum if it helps.",
    },
    gift: 'popcorn',
  },

  // The holidays' own (phase U): where one meets an everyday one, the holiday's wins.
  newYearDip: {
    name: "The New Year's dip",
    icon: '🌊',
    place: 'at the pond',
    on: { holiday: 'newYear' },
    from: 10,
    until: 13,
    where: { at: 'pondWest' },
    who: ['rufus', 'barty'],
    says: {
      rufus:
        "NEW YEAR'S DIP! The pond is SO cold, {name}! I've been in four times! I'm going in again!",
      barty:
        "I'm holding the towels. Somebody has to be sensible on New Year's Day, and it's never Rufus.",
    },
  },
  valentineTea: {
    name: "Valentine's tea",
    icon: '💝',
    place: 'at Crumbs & Curios',
    on: { holiday: 'valentines' },
    from: 14,
    until: 18,
    where: { inside: 'crumbs' },
    who: ['wrapunzel', 'maude', 'agatha'],
    says: {
      wrapunzel:
        "Valentine's tea, my darling! Heart cakes, rose tea, and a chocolate heart for you. Go on.",
      maude: 'Rose tea, {name}! And gossip. Mostly the tea. Well. Half and half.',
      agatha:
        "Valentine's tea. I've read everyone's leaves. Wrapunzel's say 'more cake'. They always do.",
    },
    welcome: "It's Valentine's tea! Pink cakes on every stand, and a pot of rose tea on the go.",
    gift: 'chocolateHeart',
  },
  stPatricksJig: {
    name: "A St Patrick's jig",
    icon: '☘️',
    place: 'by the well',
    on: { holiday: 'stPatricks' },
    from: 15,
    until: 19,
    where: { at: 'byTheWell' },
    who: ['barty', 'rufus', 'gourdon'],
    says: {
      barty:
        '{name}, a jig by the well! Old bones, young feet. Here, have a shamrock from the garden. For luck!',
      rufus: "I'm DANCING! I don't know how! Barty says that's the best way! Is it?!",
      gourdon: "I'm keeping time. Tap, tap. Carpenter's rhythm. Can't dance. Can tap.",
    },
    gift: 'shamrock',
  },
  eggHunt: {
    name: 'The Easter egg hunt',
    icon: '🥚',
    place: 'by the willow',
    on: { holiday: 'easter' },
    from: 9,
    until: 13,
    where: { at: 'willow' },
    who: ['barty', 'rufus'],
    says: {
      barty:
        "The egg hunt's on, {name}! Eight eggs, all over town. By trees, by the graves, in the long grass. Off you go!",
      rufus: "I'm helping! I'm not finding them! I'm helping by NOT finding them! It's very hard!",
    },
  },
  fireworksPicnic: {
    name: 'The fireworks picnic',
    icon: '🎆',
    place: 'by the pond',
    on: { holiday: 'fourthOfJuly' },
    from: 19,
    until: 24,
    where: { at: 'pondNorth' },
    who: ['cody', 'rufus', 'barty', 'ollie'],
    says: {
      cody: 'Picnic by the pond, babe. Best seats in town for the fireworks. Have an ice pop. They melt fast.',
      rufus: 'Are they starting?! Are they starting NOW?! …How about NOW?!',
      barty: '{name}! Brought the long blanket. Sit anywhere. Mind the bats, they get twitchy.',
      ollie:
        "I've been told the fireworks come at nine. I've been told this by Rufus, forty times.",
    },
    gift: 'icePop',
  },
  // The Halloween Festival's finale (0.2's J4): first the costume contest, everyone lined up in
  // costume before the stage on the avenue, facing her, the judge (question 48); then the party
  // round the well, with Cody's white chicken chili (question 76) and the carved pumpkins lit
  // round the square, hers among them (question 47). Once the fairground is open, both are at its
  // stage (0.2's M3), as are Thanksgiving and the countdown; carols stay
  // round the well, where the town's Christmas tree stands.
  costumeContest: {
    name: 'The costume contest',
    icon: '👑',
    place: 'at the stage on the avenue',
    on: { holiday: 'halloween' },
    from: 18,
    until: 20,
    where: {
      seats: [
        'filmFrontLeft',
        'filmFrontMiddle',
        'filmFrontRight',
        'filmFrontEnd',
        'filmFrontAisle',
        'filmFrontCorner',
        'filmBackLeft',
        'filmBackMiddle',
        'filmBackRight',
        'filmBackEnd',
      ],
    },
    who: [
      'cody',
      'rufus',
      'wrapunzel',
      'maude',
      'agatha',
      'barty',
      'ollie',
      'nessa',
      'gourdon',
      'hazel',
    ],
    faces: 'down',
    set: [{ prop: 'contestStage', tx: 19, ty: 28 }],
    fair: { where: { seats: LINE_UP }, place: AT_THE_STAGE },
    says: {
      cody: "The costume contest, babe! You're the judge. I'm not saying pick me. I'm just standing here, looking great.",
      maude: "A ghost hunter, {name}! Hat, notebook, and a ghost to hunt. Me. It's very efficient.",
      rufus: "I'm a SHEEP! Baa! Nobody can tell I'm a wolf! …Can they? Pick me, {name}!",
      wrapunzel:
        "A monarch, dear, with proper spots. I stitched every one. Don't let that sway you. Much.",
      agatha: "A black cat. I'm told it's barely a costume. I'm told that by the cat.",
      barty: "A scarecrow, {name}! Straw and all. First time I've worn clothes that aren't a hat.",
      ollie: 'Ladies and gentlemen, ghouls and goblins… the ringmaster! Judge well, {name}.',
      nessa: "I'm a scaredy-cat. It's… quite a lot of people looking at me. Hello, {name}.",
      gourdon:
        "Bug catcher. Built the net myself. Haven't caught a bug. Caught the judge's eye? Maybe.",
      hazel: "A clue-finder! I've found three clues and a sandwich. Judge away, {name}!",
    },
  },
  halloweenParty: {
    name: 'The Halloween party',
    icon: '🎃',
    place: 'round the well',
    on: { holiday: 'halloween' },
    from: 18,
    until: 26,
    where: { party: true },
    who: [
      'cody',
      'maude',
      'rufus',
      'wrapunzel',
      'agatha',
      'barty',
      'ollie',
      'nessa',
      'gourdon',
      'hazel',
      'boothoven',
    ],
    set: [
      { prop: 'chiliTable', tx: 22, ty: 19 },
      { prop: 'pumpkin', tx: 16, ty: 18 },
      { prop: 'pumpkin', tx: 23, ty: 18 },
      { prop: 'pumpkin', tx: 14, ty: 20 },
      { prop: 'pumpkin', tx: 25, ty: 20 },
      { prop: 'pumpkin', tx: 15, ty: 24 },
      { prop: 'pumpkin', tx: 24, ty: 24 },
      { prop: 'catPumpkin', tx: 17, ty: 24, hers: 'catLantern' },
    ],
    fair: {
      where: { party: true },
      place: AT_THE_STAGE,
      set: [
        { prop: 'chiliTable', tx: 20, ty: 6 },
        { prop: 'pumpkin', tx: 10, ty: 5 },
        { prop: 'pumpkin', tx: 19, ty: 5 },
        { prop: 'pumpkin', tx: 9, ty: 6 },
        { prop: 'pumpkin', tx: 8, ty: 7 },
        { prop: 'catPumpkin', tx: 11, ty: 5, hers: 'catLantern' },
      ],
    },
    says: {
      cody: "Happy Halloween, babe! My white chicken chili is on the table, and there's a dance with your name on it.",
      maude: "{name}, I came as a ghost hunter. I've caught myself twice. It's going very well.",
      rufus: "BEST PARTY EVER! I'm a SHEEP! Baa! There's CHILI! I've had four bowls! It's WHITE!",
      agatha:
        "{name}, I came as a black cat. Nobody's noticed it's barely a costume. The punch glows. On purpose.",
      barty: 'A scarecrow, {name}! The crows took one look and sat on me. Very dignified.',
      wrapunzel:
        "Out of my wrappings at last, dear: a butterfly! Have you tried Cody's chili? I've had three.",
      ollie:
        "Ladies and gentlemen, ghouls and goblins! Sorry, {name}. I've been doing that all night.",
      nessa: "I came as a scaredy-cat. It wasn't hard. It's very loud, but I like it, {name}.",
      gourdon:
        'Came as a bug catcher. Caught nothing. The pumpkins round the square are lit. Good.',
      hazel:
        "{name}! I came as a clue-finder. Clue one: there's chili. Clue two: there's more chili!",
      boothoven:
        "A rock star, {name}! I've traded the piano for an air guitar tonight. Requests welcome!",
    },
    gift: 'whiteChickenChili',
  },
  thanksgivingDinner: {
    name: 'Thanksgiving dinner',
    icon: '🦃',
    place: 'round the well',
    on: { holiday: 'thanksgiving' },
    from: 15,
    until: 20,
    where: { party: true },
    fair: { where: { party: true }, place: AT_THE_STAGE },
    who: [
      'wrapunzel',
      'cody',
      'maude',
      'rufus',
      'agatha',
      'barty',
      'ollie',
      'nessa',
      'gourdon',
      'hazel',
      'boothoven',
    ],
    says: {
      wrapunzel:
        'Thanksgiving dinner, my darling! Everyone round the table. Take a pie home. Take two.',
      cody: 'Save me a seat, babe. Next to you. Always next to you.',
      rufus: "I'm thankful for the gravy! And for you! Mostly the gravy! No, mostly you!",
      gourdon: 'Table holds. Told them it would. Pass the pie.',
      maude: "Sit by me, {name}! I don't eat, but I love to pass things. The gravy, the rolls…",
      agatha:
        "I'm thankful for this pie. And for you, {name}. The pie was first. You're a close second.",
      barty: "{name}, the squash is from my garden! And the beans. And, er, the table's flowers.",
      ollie: 'Could somebody pass the stuffing? {name}, you look like a stuffing-passer.',
      nessa:
        "{name}, it's my first Thanksgiving here. I'm thankful for all of it. Especially this.",
      hazel:
        "I'm thankful for clear skies, {name}. And for a table this long. It's like a constellation.",
      boothoven:
        "{name}, I've written a little grace. It's mostly humming. Pass the gravy, would you?",
    },
    gift: 'pumpkinPie',
  },
  carols: {
    name: 'Carols by the well',
    icon: '🎶',
    place: 'round the well',
    on: { holiday: 'christmasEve' },
    from: 18,
    until: 22,
    where: { party: true },
    who: [
      'maude',
      'cody',
      'rufus',
      'wrapunzel',
      'agatha',
      'barty',
      'ollie',
      'nessa',
      'gourdon',
      'hazel',
      'boothoven',
    ],
    says: {
      maude:
        "{name}, it's carols by the well! I've the high notes. Have a gingerbread bat, Wrapunzel made hundreds.",
      cody: 'I only know the words to one carol, babe. I sing it to every tune. Nobody minds.',
      rufus: "I'm singing! I'm howling, a bit! Is that allowed at Christmas?! Barty says yes!",
      nessa: "I'm singing very quietly, {name}. But I'm singing.",
      wrapunzel: 'Gingerbread, dear? I baked a bat for everyone. And three for Rufus. He insisted.',
      agatha: "I've charmed the snow to fall in time with the music. Watch, {name}. …There.",
      barty: '{name}! Old bones, but a fine baritone. Join in! Nobody knows all the words.',
      ollie: "Merry Christmas Eve, {name}! I've no parcels tonight. Only a very loud voice.",
      gourdon: 'I built the song sheets. Wooden. Heavy. Easy to find the page.',
      hazel: "Look up while you sing, {name}. Somewhere up there, something's jingling.",
      boothoven: "{name}, I'll take the low notes. Ghosts have marvellous low notes. Ooooooh.",
    },
    gift: 'gingerbreadBat',
  },
  countdown: {
    name: 'The countdown',
    icon: '🥂',
    place: 'round the well',
    on: { holiday: 'newYearsEve' },
    from: 21,
    until: 26,
    where: { party: true },
    fair: { where: { party: true }, place: AT_THE_STAGE },
    who: [
      'cody',
      'maude',
      'rufus',
      'wrapunzel',
      'agatha',
      'barty',
      'ollie',
      'nessa',
      'gourdon',
      'hazel',
      'boothoven',
    ],
    says: {
      cody: "Counting down with you, babe. Ten, nine… I'll lose count. Doesn't matter. You're here.",
      agatha: 'Fireworks at midnight, {name}. I charmed them to rhyme. Listen closely.',
      hazel:
        "At midnight, look up! The fireworks are nice, but the stars came first. They don't mind.",
      maude: "Ten, nine, eight… I always start too early, {name}. It's the excitement.",
      rufus: "IS IT MIDNIGHT?! Is it NOW?! …What about NOW?! I'll keep asking!",
      wrapunzel: 'Little cakes with sparklers in, dear. Take one. Hold it up at midnight!',
      barty: "Here's to another year of things growing, {name}. Friends included.",
      ollie: "Last day of the year's post, delivered! I'm off duty. Happy New Year, {name}!",
      nessa: "It's so loud. It's so lovely. Happy New Year, {name}. Nearly.",
      gourdon: 'Built the countdown clock. It counts backwards. That was the tricky bit.',
      boothoven:
        "{name}, at midnight I play the last chord of the year. Fortissimo. Cover your ears. Or don't!",
    },
  },
  // Their anniversary at the castle hall (0.2's L2): Boothoven at its piano, and Cody to listen.
  // Once she and Boothoven are close, walking up to the piano plays their duet.
  anniversaryDuet: {
    name: 'A duet at the castle',
    icon: '🎹',
    place: "in Castle Mac-A-Boo's great hall",
    on: { special: 'anniversary' },
    from: 18,
    until: 22,
    where: { inside: 'castleHall' },
    who: ['boothoven', 'cody'],
    says: {
      boothoven:
        "Happy anniversary, {name}! I couldn't let the hall's piano sit quiet tonight. Come and sit by me, and we'll see what it remembers.",
      cody: "Happy anniversary, babe. He's been practising all week. Go on, I'll be right here, clapping the loudest.",
    },
    welcome:
      "Candlelight, roses, and Boothoven at the hall's grand piano. Cody's here too, grinning.",
  },
};

export const HAPPENING_IDS = Object.keys(HAPPENINGS) as HappeningId[];
