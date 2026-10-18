import type { HappeningId, ItemId } from '../types/ids';
import type { Glyph } from './glyphs';
import { PARTY_IDS } from './birthdayParties';

/*
 * What she does at a happening (V1's P4; `docs/v1_analysis.md`: "Happenings are watched"): one
 * verb each, a button in the host's talk while it's on, with an outcome the host remembers the
 * next time it comes round. The four that already had one (the crown, the eggs, the duet, the
 * mayor's hello) say which it is. Done in `world/services/Joining.ts`, rules in
 * `systems/joining.ts`; what she picked is kept in the save, by happening, with its day.
 */

/** One of the things she can pick. Its `id` is kept in the save: never change one once out. */
export interface VerbChoice {
  id: string;
  /** Her chip. */
  say: string;
  /** What the host says back. `{name}` is her name. */
  back: string;
  /** How it's said mid-sentence afterwards, for `{choice}`: "Wuthering Frights". */
  called: string;
  /** What it hands her: the seed swap's packet. */
  gives?: ItemId;
}

export interface VerbRow {
  /** On the talk sheet's button: "Pick next week's book". */
  label: string;
  /** Beside it on the button (V1's L5). */
  glyph: Glyph;
  /** What the host asks as she presses it, when there's a pick. */
  ask?: string;
  /** What she picks from: these, or the piano tunes she knows (the recital's requests). */
  choices?: readonly VerbChoice[] | 'tunes';
  /** How many of `choices` are offered at a time, dealt by the week; all of them if not said. */
  deal?: number;
  /** What the host says once it's done, when there's nothing to pick. */
  done?: string;
  /**
   * What the host says the next time it's on, instead of their welcome, remembering it. `{choice}`
   * is what she picked, as it's `called`.
   */
  remembers: string;
  /** Leaves one of her seeds in exchange for the packet she takes, if she has one (the swap). */
  swaps?: 'seed';
}

/** A happening whose verb was there before: what it is, for the tests and the docs. */
export interface OwnVerb {
  own: string;
}

const pick = (id: string, say: string, back: string, called: string): VerbChoice => ({
  id,
  say,
  back,
  called,
});

const seed = (id: ItemId, say: string, back: string, called: string): VerbChoice => ({
  ...pick(id, say, back, called),
  gives: id,
});

/** Singing to someone on their birthday (V1's P4), the same at every party. */
const SING: VerbRow = {
  label: 'Sing Happy Birthday',
  glyph: 'neighbourCake',
  done: '…and many mooore! Oh, {name}. Thank you. That was the best present of the lot.',
  remembers:
    "You sang to me last birthday, {name}. I've hummed it all year. Will you sing it again?",
};

const EVERYDAY: Record<Exclude<HappeningId, (typeof PARTY_IDS)[number]>, VerbRow | OwnVerb> = {
  bookClub: {
    label: "Pick next week's book",
    glyph: 'book',
    ask: 'Your turn to choose, {name}! Which shall we read next week?',
    deal: 3,
    choices: [
      pick(
        'hillHousePlants',
        'The Haunting of Hill House Plants',
        "Ferns with secrets! Agatha's already guessed the ending. She's wrong. I hope.",
        '"The Haunting of Hill House Plants"',
      ),
      pick(
        'wutheringFrights',
        'Wuthering Frights',
        'Oh, the moors! The wind! The shrieking! {name}, I do love a good shriek.',
        '"Wuthering Frights"',
      ),
      pick(
        'prideAndPoltergeists',
        'Pride and Poltergeists',
        'A romance with rattling chains. My favourite kind. Agatha will pretend not to cry.',
        '"Pride and Poltergeists"',
      ),
      pick(
        'monteCrypto',
        'The Count of Monte Crypto',
        "A very long one, {name}. Good. Book club's biscuits will need to be very long too.",
        '"The Count of Monte Crypto"',
      ),
      pick(
        'littleWomenInSheets',
        'Little Women in White Sheets',
        "Four sisters, four sheets, and a lot of floating. It's practically my life story.",
        '"Little Women in White Sheets"',
      ),
      pick(
        'frankensteinsBakeOff',
        "Frankenstein's Bake Off",
        'A monster who just wants his sponge to rise. Wrapunzel will want to borrow it, {name}.',
        `"Frankenstein's Bake Off"`,
      ),
    ],
    remembers:
      "{name}! Everyone read {choice}, the one you picked. Agatha read it twice. She says it's 'adequate', which from her is a rave.",
  },
  midnightBake: {
    label: 'Ice a cookie',
    glyph: { item: 'batWingCookie' },
    ask: "Pick your icing, dear! I'll do the wings, you do the face.",
    choices: [
      pick(
        'pink',
        'Pink, please!',
        'Pink it is! A little rosy bat. Oh, it looks like it is blushing.',
        'pink-iced',
      ),
      pick(
        'orange',
        'Pumpkin orange!',
        'Pumpkin orange, very festive! It looks ever so pleased with itself.',
        'pumpkin-orange',
      ),
      pick(
        'glow',
        'The one that glows!',
        'The glow-in-the-dark! Hold it up, {name}… there! A nightlight you can eat.',
        'glow-in-the-dark',
      ),
    ],
    remembers:
      "{name}! Rufus still talks about your {choice} cookie. He ate it first, then he talked about it. He's still talking.",
  },
  spellGoneWrong: {
    label: 'Sing along with the well',
    glyph: { mark: 'septemberSong' },
    done: "{name}, you know the shanty! The well's thrilled. It's taken a second verse. Barty's taken a seat.",
    remembers: "{name}, the well still hums your verse at teatime. I haven't the heart to stop it.",
  },
  moonHowl: {
    label: 'Howl',
    glyph: { item: 'wolfDoll' },
    done: 'AWOOOOOO! {name}! That was BEAUTIFUL! The moon heard you! It went a bit brighter! I SAW it!',
    remembers:
      "{name}! Last full moon you howled with me! I've been practising your bit. AWOO! …Yours was better.",
  },
  seedSwap: {
    label: 'Swap a seed',
    glyph: { item: 'pumpkinSeed' },
    ask: '{name}, take a packet, leave a packet. Which one takes your fancy?',
    swaps: 'seed',
    deal: 3,
    choices: [
      seed(
        'moonflowerSeed',
        'Moonflower',
        'Moonflowers! They open at night, same as you, I hear.',
        'the moonflowers',
      ),
      seed(
        'snapdragonSeed',
        'Snapdragon',
        "Snapdragons. Squeeze the flowers and they talk. Mostly they say 'snap'.",
        'the snapdragons',
      ),
      seed(
        'spiderLilyBulb',
        'Spider lily',
        'A spider lily bulb! Plant it pointy end up. I always forget which end that is.',
        'the spider lily',
      ),
      seed(
        'batFlowerSeed',
        'Bat flower',
        'Bat flowers, {name}! They hang upside down. Very polite of them.',
        'the bat flowers',
      ),
      seed(
        'sunflowerSeed',
        'Sunflower',
        "Sunflowers! Taller than me by August. Not hard, I'll grant you.",
        'the sunflowers',
      ),
      seed(
        'lavenderSeed',
        'Lavender',
        "Lavender. Good for sleep, and for bees. I'm told I snore less near it.",
        'the lavender',
      ),
    ],
    remembers:
      '{name}! How are {choice} from the swap getting on? Talk to them, they love that. I talk to mine all day.',
  },
  movieNight: {
    label: "Pick next week's film",
    glyph: { item: 'popcorn' },
    ask: 'Your pick next week, babe. What are we watching?',
    deal: 3,
    choices: [
      pick(
        'brunch',
        'Nightmare Before Brunch',
        'Ooh, good one, babe. Rufus will hide behind the settee for that. Perfect.',
        '"Nightmare Before Brunch"',
      ),
      pick(
        'werewolf',
        'The Werewolf Who Loved Me',
        'A romance, babe? With a werewolf? Rufus will cry. Happy tears.',
        '"The Werewolf Who Loved Me"',
      ),
      pick(
        'pumpkin',
        'Attack of the 50ft Pumpkin',
        "A classic, babe. Gourdon says it's a documentary. He's joking. I think.",
        '"Attack of the 50ft Pumpkin"',
      ),
      pick(
        'pond',
        'It Came From the Pond',
        'It came from the pond, babe. It went back to the pond. Lovely ending.',
        '"It Came From the Pond"',
      ),
      pick(
        'mummy',
        'The Mummy Bakes Again',
        "Wrapunzel will love it, babe. She'll shout at the screen about the pastry.",
        '"The Mummy Bakes Again"',
      ),
      pick(
        'bats',
        'Bats in the Belfry',
        "Bats in the Belfry, babe! Bring a blanket. There's a lot of flapping.",
        '"Bats in the Belfry"',
      ),
    ],
    remembers:
      "Babe, everyone's still talking about {choice}, your pick. Rufus watched it from behind the settee twice.",
  },
  anniversaryDuet: { own: "the duet at the hall's piano" },
  filmNight: {
    label: 'Pick the film',
    glyph: { item: 'popcorn' },
    ask: "Babe, Gourdon's got three reels. You choose what the whole town watches tonight.",
    choices: [
      pick(
        'friendlyGhost',
        'The friendly ghost film',
        "The friendly ghost! Maude's clapping already, babe. Rufus has checked it's friendly. Twice.",
        'the friendly ghost film',
      ),
      pick(
        'glowlessPumpkin',
        "The pumpkin who couldn't glow",
        "Oh, babe. Gourdon's gone very quiet. I think he's welling up.",
        '"The Pumpkin Who Couldn\'t Glow"',
      ),
      pick(
        'belfryMusical',
        'Bats: The Musical',
        "A musical, babe! Boothoven's playing along. Agatha knows every word, and won't admit it.",
        '"Bats: The Musical"',
      ),
    ],
    remembers:
      'Babe, the whole town is still humming {choice} from last film night. Your pick. Good pick.',
  },
  costumeContest: { own: 'crowning the best costume (the crown in the talk)' },
  newYearDip: {
    label: 'Take the plunge',
    glyph: 'wave',
    done: "YOU WENT IN! {name}! You're SO brave! And SO wet! Here's a towel! Barty, she needs a towel!",
    remembers: "{name}! Remember last New Year? You went IN! It's tradition now! You HAVE to!",
  },
  valentineTea: {
    label: 'Share a heart cake',
    glyph: { mark: 'valentines' },
    done: "One for you and one for me, my darling. Mine's already gone. Don't tell Maude.",
    remembers:
      "Last Valentine's you shared a heart cake with me, dear. I've made two this year, just in case.",
  },
  stPatricksJig: {
    label: 'Dance the jig',
    glyph: { mark: 'stPatricks' },
    done: '{name}! Look at you go! Old bones, young feet, and yours are better than both!',
    remembers:
      '{name}! You danced the jig with us last year. Rufus is still trying to learn your bit.',
  },
  eggHunt: { own: 'finding the eggs round town' },
  fireworksPicnic: {
    label: 'Wish on the first one',
    glyph: { mark: 'newYear' },
    done: "Made your wish, babe? Don't tell me. …Okay, tell me later.",
    remembers: "Babe, did last year's firework wish come true? Mine did. You're still here.",
  },
  halloweenParty: {
    label: 'Dance with Cody',
    glyph: { item: 'recordWalkTheTomb' },
    done: "There she is! Spin, babe, spin! …Okay, now me. I'm spinning. I'm dizzy. Worth it.",
    remembers:
      'Babe, last Halloween we danced till the chili ran out. Tonight we dance till it runs out again.',
  },
  thanksgivingDinner: {
    label: "Say what you're thankful for",
    glyph: { mark: 'thanksgiving' },
    ask: 'Round the table, my darling. What are you thankful for this year?',
    choices: [
      pick(
        'neighbours',
        'All of you',
        "Oh, all of us! That's made me unravel a little, dear. Pass the gravy.",
        'all of us',
      ),
      pick(
        'cody',
        'Cody',
        "Cody! He's gone red to the ears, dear. Look at him. Pass the gravy.",
        'Cody',
      ),
      pick(
        'pie',
        'The pie, obviously',
        'The pie! Honest, my darling. I respect that. Have another slice.',
        'the pie',
      ),
    ],
    remembers:
      'Last year you were thankful for {choice}, dear. I wrote it in my recipe book. Next to the pie.',
  },
  carols: {
    label: 'Pick the next carol',
    glyph: { mark: 'septemberSong' },
    ask: 'Your pick, {name}! What shall we sing next?',
    choices: [
      pick(
        'decktheHalls',
        'Deck the Halls',
        'Deck the halls! Fa-la-la-la-laaa! Rufus is la-la-ing in all the wrong places. Perfect.',
        '"Deck the Halls"',
      ),
      pick(
        'jingleBones',
        'Jingle Bones',
        'Jingle Bones! Barty is ever so pleased. He does the rattly bit himself.',
        '"Jingle Bones"',
      ),
      pick(
        'silentFright',
        'Silent Fright',
        'Silent Fright! Softly, everyone. Boothoven, softly. …Softer. Lovely.',
        '"Silent Fright"',
      ),
    ],
    remembers:
      "{name}, we sang {choice} for you last year. We've been practising it since. Mostly Rufus.",
  },
  countdown: {
    label: 'Make a resolution',
    glyph: { mark: 'newYearsEve' },
    ask: "Resolution time, babe. What's yours?",
    choices: [
      pick(
        'naps',
        'More naps',
        "More naps. Babe, that's the best one I've ever heard. I'm in.",
        'more naps',
      ),
      pick(
        'critters',
        'Catch every critter',
        "Every critter? Babe, I'll hold the net. Well. I'll hold the snacks.",
        'catching every critter',
      ),
      pick(
        'dancing',
        'More dancing',
        'More dancing. Babe, I resolve to step on your feet less. Probably.',
        'more dancing',
      ),
    ],
    remembers: "Babe, last year's resolution was {choice}. How'd we do? I think we smashed it.",
  },
  unmasking: { own: 'saying hello to the mayor' },
  lanternLighting: {
    label: 'Light one with her',
    glyph: 'lantern',
    done: "There. That one's yours, {name}. It's the brightest. I'm not just saying that.",
    remembers:
      "That lantern you lit, {name}. It's still the brightest on the pier. I light it first now.",
  },
  lanternNight: {
    label: 'Float a lantern',
    glyph: 'lantern',
    ask: "What will you wish for, {name}? You don't have to tell me. But you can.",
    choices: [
      pick(
        'cosyWinter',
        'A cosy winter',
        'A cosy winter. I hope so too. Off it goes… look, it caught the breeze.',
        'a cosy winter',
      ),
      pick(
        'everyoneHappy',
        'Everyone happy',
        "Everyone happy. That's a big wish for a little lantern. It's managing, though.",
        'everyone being happy',
      ),
      pick(
        'blueRose',
        'A blue rose',
        'A blue rose! Rufus would faint. There it goes, all the way out.',
        'a blue rose',
      ),
    ],
    remembers:
      "Your lantern last week, {name}, wishing for {choice}. It floated all the way to the far shore. That's a good sign.",
  },
  recital: {
    label: 'Request a tune',
    glyph: { mark: 'septemberSong' },
    ask: 'What would you like to hear, {name}? Anything you know, I know.',
    choices: 'tunes',
    remembers:
      "{name}! Last week you asked for {choice}. I've been playing it ever since. The bats have learnt it.",
  },
  parcelDay: {
    label: 'Help sort the post',
    glyph: 'parcel',
    ask: "{name}, grab a parcel! Which pile's it for?",
    choices: [
      pick('now', 'NOW', 'NOW! Very important. Probably socks. Socks are always NOW.', 'NOW'),
      pick(
        'soon',
        'SOON',
        "SOON. Good call, {name}. It's ticking. Gently. I think it's a clock.",
        'SOON',
      ),
      pick(
        'ghosts',
        'GHOSTS',
        "GHOSTS! Look, it's gone see-through already. That's how you know.",
        'GHOSTS',
      ),
    ],
    remembers:
      "{name}! The parcel you put on the {choice} pile last week got there right on time. You're a natural.",
  },
  stargazing: {
    label: 'Name a star',
    glyph: 'star',
    ask: "That one, {name}, just left of the moon. It's yours to name. What shall we call it?",
    deal: 3,
    choices: [
      pick(
        'pip',
        'Little Pip',
        "Little Pip! For my old cat. Oh, {name}. I'll write it in the book with a star by it.",
        'Little Pip',
      ),
      pick(
        'moonbiscuit',
        'Moonbiscuit',
        'Moonbiscuit! Round and golden. Wrapunzel will want to bake it.',
        'Moonbiscuit',
      ),
      pick(
        'sparkles',
        'Sir Sparkles',
        'Sir Sparkles! A star with a title. Very distinguished. It twinkled, did you see?',
        'Sir Sparkles',
      ),
      pick(
        'batStar',
        'The Bat Star',
        "The Bat Star. It's got two little ones either side, like wings! It's perfect.",
        'the Bat Star',
      ),
      pick(
        'forgetMeGlow',
        'Forget-Me-Glow',
        "Forget-Me-Glow. Nobody will. I'll make sure.",
        'Forget-Me-Glow',
      ),
      pick(
        'kevinTwo',
        'Kevin Two',
        "Kevin Two! Rufus will be beside himself. Kevin One's just over there.",
        'Kevin Two',
      ),
    ],
    remembers:
      '{name}! {choice} is up again tonight, the star you named. I check on it every clear night.',
  },
  openDay: {
    label: "Pick next week's piece",
    glyph: 'hammer',
    ask: 'Pick one. I build it this week. That is the deal.',
    deal: 3,
    choices: [
      pick(
        'stool',
        'A little stool',
        'Stool. Three legs. Never wobbles. Good.',
        'the little stool',
      ),
      pick(
        'birdhouse',
        'A birdhouse',
        'Birdhouse. For bats. Bats are birds, near enough.',
        'the birdhouse',
      ),
      pick(
        'rocker',
        'A rocking chair',
        'Rocking chair. Barty wants one. Barty will get one.',
        'the rocking chair',
      ),
      pick(
        'bookshelf',
        'A bookshelf',
        'Bookshelf. Maude will fill it in a day. Good.',
        'the bookshelf',
      ),
      pick(
        'toyCoffin',
        'A toy coffin',
        'Toy coffin. For the dolls. They sleep better in them.',
        'the toy coffin',
      ),
      pick(
        'bench',
        'A bench for two',
        'Bench for two. Nice and long. For you and Cody.',
        'the bench for two',
      ),
    ],
    remembers: 'Built {choice}. The one you picked. Took all week. Hazel sat on it first. Holds.',
  },
};

/** Every happening's verb: the everyday ones', and singing at every birthday party. */
export const VERBS: Record<HappeningId, VerbRow | OwnVerb> = {
  ...EVERYDAY,
  ...(Object.fromEntries(PARTY_IDS.map((id) => [id, SING])) as Record<
    (typeof PARTY_IDS)[number],
    VerbRow
  >),
};

/** What she does at it, when it's a verb of P4's. */
export function verbRow(id: HappeningId): VerbRow | null {
  const row = VERBS[id];
  return 'own' in row ? null : row;
}

/** A friendship's worth for joining in: a little, as a bake is. */
export const JOIN_POINTS = 5;
