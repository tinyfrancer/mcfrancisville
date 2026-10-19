import type { Celebrant, InteriorId, PartyId, VillagerId } from '../types/ids';
import type { HappeningRow } from './happenings';

/*
 * Her neighbours' birthdays as days (V1's P4; `docs/v1_analysis.md`: "Birthdays are a cake
 * icon"): their own line first thing that day, a gift that counts double (`BIRTHDAY_GIFT_TIMES`),
 * and a small party at theirs from five, two friends round, with cake. Personal touches parked
 * (decision 177): who comes to whose is the warmest default their lines suggest.
 */

/** What each says first thing on their birthday, before anything else that day. */
export const BIRTHDAY_LINES: Record<Celebrant, string> = {
  maude:
    "{name}! It's my birthday! My two hundred and somethingth. There's cake at the library from five. I can't eat it, but I can admire it.",
  rufus:
    "IT'S MY BIRTHDAY, {name}! I'm a whole year older and a whole year fluffier! Party at my cabin at five! There's CAKE!",
  wrapunzel:
    "Oh, {name}, it's my birthday! Three thousand and something, but who's counting? I baked my own cake. Come to the bakery at five, dear!",
  agatha:
    "{name}, it's my birthday. Midsummer's eve, as a witch's should be. Come round to mine at five. The cauldron's doing a cake. Don't ask.",
  barty:
    "{name}! It's my birthday! First day of spring, same as every year. Come to my cottage at five. I've grown a cake. Well, the flowers on it.",
  ollie:
    "{name}! It's my birthday! I've posted myself a card. It came this morning. Party at my cottage at five, if you're passing!",
  nessa:
    "{name}, it's… my birthday. Hazel says I have to tell people. So I'm telling you. There's cake at the boathouse at five. Only if you like.",
  gourdon:
    'Birthday. Mine. Pumpkin Day. Cake at the workshop at five. Built the table for it. Come, {name}.',
  hazel:
    "{name}! It's my birthday, the night the shooting stars are thickest! Cake at the observatory at five, and wishes after dark!",
  boothoven:
    "{name}! It is my birthday, and my namesake's! I've composed myself a little fanfare. Party in the parlour at five. Bring your ears!",
  scarah:
    "{name}, it's my birthday! The day I woke up in the far field. Cornelius has made a cake. It's mostly corn. Come to the farmhouse at five!",
  robBoo:
    "Ahem. {name}. It's, um, my birthday. Groundhog Day. I peek out once a year. Wes says there's cake in my office at five. Will you come?",
};

/** How many times a gift on their birthday counts, against any other day's. */
export const BIRTHDAY_GIFT_TIMES = 2;

/** Where each has their party: at home, and their name, as the calendar says it. */
const HOMES: Record<Celebrant, { name: string; inside: InteriorId; place: string }> = {
  maude: { name: 'Maude', inside: 'library', place: "in Maude's library" },
  rufus: { name: 'Rufus', inside: 'rufusCabin', place: "at Rufus's cabin" },
  wrapunzel: { name: 'Wrapunzel', inside: 'crumbs', place: 'at Crumbs & Curios' },
  agatha: { name: 'Agatha', inside: 'agathaCottage', place: "at Agatha's cottage" },
  barty: { name: 'Barty', inside: 'bartyCottage', place: "at Barty's cottage" },
  ollie: { name: 'Ollie', inside: 'ollieCottage', place: "at Ollie's cottage" },
  nessa: { name: 'Nessa', inside: 'nessaBoathouse', place: "at Nessa's boathouse" },
  gourdon: { name: 'Gourdon', inside: 'gourdonPumpkin', place: "at Gourdon's workshop" },
  hazel: { name: 'Hazel', inside: 'hazelObservatory', place: "at Hazel's observatory" },
  boothoven: { name: 'Boothoven', inside: 'boothovenParlour', place: "in Boothoven's parlour" },
  scarah: { name: 'Scarah', inside: 'scarahFarmhouse', place: "at Scarah's farmhouse" },
  robBoo: { name: 'Rob Boo', inside: 'mayorsOffice', place: "in the mayor's office" },
};

/** Who comes round, and what each says there, the host first. */
const PARTIES: Record<Celebrant, Partial<Record<VillagerId, string>>> = {
  maude: {
    maude:
      "You came! {name}, sit anywhere. Not on that chair, that's where I keep my best book. Anywhere else!",
    agatha: "{name}, I've charmed the candles not to drip on the books. Maude made me promise.",
    boothoven: "{name}, I'm on the cake. Well. Hovering near it. Ghosts guard cake beautifully.",
  },
  rufus: {
    rufus:
      "BIRTHDAY PARTY! {name}! You're here! There's cake AND there's a bone-shaped cake! I can't choose! I'm having both!",
    wrapunzel: 'I made the bone-shaped one, dear. He cried. Good tears. Wolf tears.',
    barty: "{name}! I brought him a bunch of everything in my garden. He's eaten two of them.",
  },
  wrapunzel: {
    wrapunzel:
      "My darling, you came! Sit, sit. I've made seven cakes. One for each century I remember properly.",
    rufus: "SEVEN CAKES, {name}! I'm on cake four! Wrapunzel says pace myself! I'm pacing!",
    maude:
      "Happy birthday to her, {name}. She'll say she's three thousand. She's had that birthday before.",
  },
  agatha: {
    agatha:
      "{name}, you came. The cauldron baked the cake itself. It's a little smug about it. Have a slice.",
    maude:
      '{name}, Agatha made the candles float. One of them is following me. I think it likes me.',
    hazel:
      "{name}, I gave her a chart of midsummer stars. She's reading her fortune in it already.",
  },
  barty: {
    barty:
      "{name}! Come in, mind the seedlings. The cake's got real violets on top. I grew them, so you're allowed to eat them.",
    rufus:
      "Barty's so OLD, {name}! He's SO old! He's the best at being old! Happy birthday, Barty!",
    scarah:
      "{name}, Cornelius brought him a pumpkin. A small one. It's Cornelius's best pumpkin. That's love.",
  },
  ollie: {
    ollie:
      "You came! I've delivered myself fourteen cards today, {name}. That's a record. Have some cake, it's shaped like a stamp.",
    nessa:
      "{name}, I wrote him a card. And then I gave it to him in person, so he wouldn't have to carry it.",
    gourdon: 'Built him a letter rack. Fourteen slots. Seemed right.',
  },
  nessa: {
    nessa:
      "You came, {name}. That's… that's lovely. There's cake. It's blue. Everything I like is a little bit blue.",
    hazel:
      "I told her to tell everyone, {name}. She told four people. That's a lot for Nessa. I'm proud.",
    ollie:
      "I brought balloons, {name}. Lake-blue. She's let one go already. It's off on an adventure.",
  },
  gourdon: {
    gourdon:
      "Came. Good. Cake's on the table I built. Table holds. Cake's pumpkin. Obviously. Have some, {name}.",
    hazel:
      "He built his own birthday table, {name}. He's very pleased with it. He keeps knocking on it.",
    barty:
      "{name}! Pumpkin cake on Pumpkin Day, for a pumpkin. It's the most sensible party in town.",
  },
  hazel: {
    hazel:
      "{name}! You came! Cake now, and at midnight we make a wish on every shooting star. I've counted. There'll be forty.",
    nessa:
      "I made Hazel a lantern with stars cut out of it, {name}. When it's lit, the ceiling's a sky.",
    gourdon: "Built her a step for the telescope. She's short. Don't tell her I said.",
  },
  boothoven: {
    boothoven:
      "{name}! Ta-da-daaa! That's my fanfare. I've written myself a symphony as well, but we'll start with cake.",
    maude:
      "{name}, he's played the fanfare nine times. It's very good. It was very good the first time.",
    wrapunzel: "I iced a little piano on his cake, dear. He's refused to cut it. He's playing it.",
  },
  scarah: {
    scarah:
      "{name}, you came! Cornelius made the cake. It's corn. Corn cake with corn on. And a candle. Also corn.",
    barty:
      "Happy birthday, Scarah! {name}, I've brought her a new hat. The crows took her last one.",
    rufus: "CORN CAKE! {name}, it's actually REALLY good! Cornelius is a genius! Don't tell him!",
  },
  robBoo: {
    robBoo:
      "Ahem. You came, {name}. Nobody's come to my birthday in a hundred and twelve years. I've gone very pink. I'm so glad.",
    wrapunzel: 'Meringue, dear, for the mayor. I promised. Ghosts can have a little meringue.',
    agatha:
      "{name}, I've charmed his hat to stay on in the excitement. It's already tried to leave twice.",
  },
};

const ROWS = Object.keys(HOMES) as Celebrant[];

/** Each one's party, a happening on their birthday, at theirs from five till eight. */
export const BIRTHDAY_PARTIES = Object.fromEntries(
  ROWS.map((id): [PartyId, HappeningRow] => {
    const { name } = HOMES[id];
    const says = PARTIES[id];
    return [
      `${id}Birthday`,
      {
        name: `${name}'s birthday party`,
        icon: 'neighbourCake',
        place: HOMES[id].place,
        on: { birthday: id },
        from: 17,
        until: 20,
        where: { inside: HOMES[id].inside },
        who: [id, ...(Object.keys(says) as VillagerId[]).filter((v) => v !== id)],
        says,
        welcome: `It's ${name}'s birthday party! Streamers, candles, and a cake with your name on a slice.`,
        gift: 'moonpetalCake',
      },
    ];
  }),
) as Record<PartyId, HappeningRow>;

export const PARTY_IDS = Object.keys(BIRTHDAY_PARTIES) as PartyId[];
