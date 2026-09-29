import type { InteriorId, ItemId, MapZoneId, VillagerId } from '../types/ids';
import type { ItemKind } from './items';
import type { SpotName } from './maps';
import type { Ware } from './shop';
import type { Unlock } from './zones';

type Elsewhere = Exclude<MapZoneId, 'town'>;

/**
 * From `from` o'clock (0–23) until the next stop, a villager is found `at` a spot named in the
 * map of the place it's in (the town, unless it says `zone`), or `inside` a building, at one of
 * the places people stand in it (`stands` in `data/interiors.ts`, the first unless it says).
 */
export type Stop =
  | { from: number; zone?: 'town'; at: SpotName<'town'> }
  | { [Z in Elsewhere]: { from: number; zone: Z; at: SpotName<Z> } }[Elsewhere]
  | { from: number; inside: InteriorId; stand?: number };

/**
 * Where a villager is through a day (phase S), earliest first, on weekdays and at the weekend,
 * with a stop starting in every window; the last stop runs on past midnight until the first.
 */
export interface Schedule {
  weekday: readonly Stop[];
  weekend: readonly Stop[];
}

/** A small thing a villager might ask her for, on a day they have a favour to ask. */
export interface Favour {
  item: ItemId;
  count: number;
  /** How they ask. `{what}` is what they want, in a sentence ("3 wood"). */
  ask: string;
}

/** What a villager sends her, by mail, when a friendship reaches `hearts`. */
export interface Reward {
  hearts: number;
  /** The letter. `{name}` is the name she typed. */
  letter: string;
  gift: Ware;
}

/**
 * What a villager says, by how close they are: `hello` at first, `friend` from three hearts, and
 * `close` from seven. `night` lines join the rest after 8pm. `{name}` is the name she typed.
 */
export interface Lines {
  hello: readonly string[];
  friend: readonly string[];
  close: readonly string[];
  night: readonly string[];
}

/** How a villager takes a gift: loved, liked, or anything else, which is still very kind. */
export interface Reactions {
  loved: string;
  liked: string;
  fine: string;
}

/**
 * Someone who moves to town after she has settled in (phase T, decisions.md 125): they write to
 * say they're coming, and move in the next day, into their house on its lot (`lots` in their
 * place's map). One comes a month at most, in the order they're written, but for one still waiting
 * on something to happen first.
 */
export interface Newcomer {
  /** Their letter, the day before they move in. `{name}` is the name she typed. */
  letter: string;
  /** Where their house is, for the moving-in toast: "down by the south road". */
  where: string;
  /** What has to have happened before they'll come, if anything: a place found, a friendship. */
  after?: Unlock;
  /** The months (1 to 12) they'll come in, if they're particular about it. */
  months?: readonly number[];
  /** What they say first on moving day, among their boxes. */
  unpacking: string;
}

export interface VillagerRow {
  name: string;
  /** What they are, as they'd put it. */
  creature: string;
  schedule: Schedule;
  /** What they say first when she finds them visiting her at home. `{name}` is her name. */
  dropsBy: string;
  lines: Lines;
  loves: readonly ItemId[];
  likes: readonly ItemKind[];
  reactions: Reactions;
  /** What they say to one particular gift, instead of their usual reaction. */
  says?: Partial<Record<ItemId, string>>;
  /** What they say to a bracelet, if it's more than "loved". Everyone loves a bracelet. */
  bracelet?: string;
  favours: readonly Favour[];
  /** Said as she hands over what they asked for. */
  thanks: string;
  /**
   * What they say when they let one go (phase S2): anyone might, now and then, and nobody is
   * bothered. Cody does it most (personal_touches.md, "The neighbours"), and her answer to him is
   * her own catchphrase.
   */
  puffs: readonly string[];
  rewards: readonly Reward[];
  /** Not here on her first day: they move in later (phase T). */
  newcomer?: Newcomer;
}

/** What the other villagers call Cody (personal_touches.md, "Cody's villager"). */
export const CODY_NICKNAME = 'Pimp Daddy Francis';

/**
 * Her neighbours (decisions.md 16), in the order they're shown. They're somewhere she can find
 * them at every hour: out in town or beyond it, or in at home, at work or at a shop, walking
 * between their stops as the clock moves on (phase S). Cody calls her "babe"; everyone else uses
 * the name she typed. Each teaches a recipe at three hearts, gives something to wear at six, and a
 * piece for her home at ten.
 */
export const VILLAGERS: Record<VillagerId, VillagerRow> = {
  maude: {
    name: 'Maude',
    creature: 'ghost librarian',
    schedule: {
      weekday: [
        { from: 5, at: 'graves' },
        { from: 9, inside: 'library' },
        { from: 14, at: 'squareWest' },
        { from: 16, inside: 'library' },
        { from: 18, at: 'pondWest' },
        { from: 22, at: 'gravesEast' },
      ],
      weekend: [
        { from: 5, at: 'graves' },
        // Browsing Cobweb Corner's dustiest shelf, then reading under the willow.
        { from: 9, inside: 'cobwebCorner', stand: 1 },
        { from: 11, at: 'squareWest' },
        { from: 15, at: 'willow' },
        { from: 18, inside: 'library' },
        { from: 21, at: 'gravesEast' },
      ],
    },
    dropsBy: "I hope you don't mind, {name}. I floated in. The door was rather in the way.",
    lines: {
      hello: [
        "Oh! Hello, {name}. I'm Maude. I run the library. Well, I haunt it. Same thing, really.",
        'Shh… oh, sorry. Force of habit. You can be as loud as you like out here.',
        "I've read every book in McFrancisVille twice. Once alive, and once… after. The endings hold up.",
        "If you ever hear a page turn at night, that's just me. Or the wind. Mostly me.",
      ],
      friend: [
        "{name}! I saved you a bookmark. It's shaped like a bat. It's only a little bit haunted.",
        `${CODY_NICKNAME} returned a book forty years overdue. He said he'd been busy. For forty years.`,
        'Agatha borrows the mystery novels and solves them by chapter two. It is very annoying. I adore her.',
        'Do you ever feel the town is keeping a secret? The mayor has never once been to the library.',
      ],
      close: [
        "You're my favourite visitor, {name}. Don't tell the other visitors. They're mostly moths.",
        "I'd float through walls to find you a good book. I do anyway, but for you especially.",
        "Some ghosts haunt houses. I'd rather haunt wherever you are. In the nicest possible way.",
      ],
      night: [
        'The moon is the best reading lamp there is, {name}. Pull up a gravestone.',
        'Night is when the good stories come out. And the moths. Mostly the moths.',
      ],
    },
    loves: ['ghostDaisy', 'moonflower', 'ghostMallow', 'moonflowerTea'],
    likes: ['flower', 'record'],
    reactions: {
      loved: "Oh, {name}! For me? I'm quite overcome. Well, more see-through than usual.",
      liked: "How thoughtful. I'll press it between the pages of my favourite book.",
      fine: "Thank you, {name}. I'll find it a nice shelf. I have so many shelves.",
    },
    says: {
      ghostDaisy: "A ghost daisy! It's nearly as see-through as I am. I adore it.",
      moonflowerTea: 'Moonflower tea! Now I can read till dawn. Well. Longer than usual.',
    },
    favours: [
      {
        item: 'ghostDaisy',
        count: 2,
        ask: 'Could you find me {what}? They make the best bookmarks.',
      },
      { item: 'moonpetal', count: 3, ask: "I'd love {what} for the reading room, if you see any." },
      { item: 'wood', count: 5, ask: 'The library needs another shelf. Could you spare {what}?' },
    ],
    thanks: "Oh, perfect! You're a treasure, {name}. Here, a little something for your trouble.",
    puffs: [
      '*pfft* …Oh dear. That was the floorboards. Very old building. Very old floorboards.',
      "*pfft* …Ghosts don't do that. That was a draught. A warm, particular draught.",
    ],
    rewards: [
      {
        hearts: 3,
        letter:
          'Dear {name},\n\nReading by moonflower light is the loveliest thing. Here is how to make ' +
          "the lamp I read by. Don't stay up too late. (Do.)\n\nFondly, Maude",
        gift: { recipe: 'moonflowerLamp' },
      },
      {
        hearts: 6,
        letter:
          'Dear {name},\n\nA tee for a fellow bookworm. I had it made with a little open book on ' +
          'it, so everyone knows.\n\nFondly, Maude',
        gift: { outfit: 'bookwormTee' },
      },
      {
        hearts: 10,
        letter:
          'Dearest {name},\n\nThese are my favourite ghost stories. Every one of them is true, and ' +
          'I want you to have them. Read them by the candle, not too close.\n\nWith all my ' +
          'heart (it is somewhere about),\nMaude',
        gift: { furniture: 'ghostStories' },
      },
    ],
  },
  rufus: {
    name: 'Rufus',
    creature: 'werewolf florist',
    schedule: {
      weekday: [
        // Picking wildflowers in Whisperwood first thing, and arranging them at home after lunch.
        { from: 5, inside: 'rufusCabin' },
        { from: 7, zone: 'whisperwood', at: 'wildflowers' },
        { from: 11, at: 'squareNorth' },
        { from: 15, inside: 'rufusCabin' },
        { from: 18, at: 'farmGate' },
        { from: 21, at: 'pondEast' },
      ],
      weekend: [
        { from: 6, zone: 'whisperwood', at: 'wildflowers' },
        { from: 10, at: 'squareNorth' },
        // Chasing his own tail round the park.
        { from: 14, at: 'parkSouth' },
        { from: 17, at: 'farmGate' },
        { from: 20, inside: 'rufusCabin' },
        { from: 23, at: 'pondEast' },
      ],
    },
    dropsBy: "Surprise! I came to visit! Your house smells SO good. Is that you? It's you!",
    lines: {
      hello: [
        "Hi hi hi! I'm Rufus! I do the flowers! I'm a werewolf, but only a little!",
        "You smell like flowers! That's a compliment. That's the best compliment I know.",
        "Every flower in town has a name. That one's Kevin.",
        "Don't worry about the howling at night. That's just me being happy about the moon.",
      ],
      friend: [
        "{name}! I made you a bouquet, but I got excited and ate it. I'll make another!",
        "Barty grows 'em, I arrange 'em. We're a team! He's a skeleton, so he's all heart. No, wait.",
        'Wrapunzel gives me the broken cookies. Best friend a wolf could have! Besides you!',
        `${CODY_NICKNAME} says I'm "a lot". I think that means I'm a lot of fun!`,
        "Cobweb Corner had a plushie with a neck THIS long! Long neck Yoshi! I've never wanted anything more.",
      ],
      close: [
        "You're my favourite person, {name}! I'd fetch anything for you. I'd fetch a stick! Two sticks!",
        'When the moon is full I get extra fluffy. You can pet me. If you want. No pressure. Please?',
        "If you were a flower you'd be a blue rose. Rare and wonderful and everybody's favourite.",
      ],
      night: [
        'AWOOOO! …Oh! Hi, {name}! Sorry. The moon is just so pretty tonight.',
        'Moonflowers are open! Best part of the night. Well, second best. Hi, {name}!',
      ],
    },
    // Pizza is one of her favourites, and it's his (personal_touches.md, "Things she loves").
    loves: ['rose', 'blueRose', 'jackOLanternPizza', 'midnightPizza', 'roseJam', 'midnightPlate'],
    likes: ['flower', 'snack'],
    reactions: {
      loved:
        "For me?! Oh wow, oh wow, oh wow! My tail is wagging. I can't stop it. I don't want to!",
      liked: "Ooh, thank you! I'm putting it in the window so everyone can see.",
      fine: "Thanks, {name}! I'll find a spot for it. Probably my den!",
    },
    says: {
      blueRose: "A BLUE ROSE?! {name}! I'm going to cry! Happy tears! Wolf tears!",
      jackOLanternPizza:
        "PIZZA! A whole one! With a face! I love it and I'm going to eat its face.",
      midnightPlate: 'A whole plate of midnight snacks?! {name}, you get me. You really get me.',
    },
    favours: [
      {
        item: 'rose',
        count: 2,
        ask: "Somebody wants roses and I'm all out! Could you bring {what}?",
      },
      { item: 'forgetMeBoo', count: 3, ask: "I'm making a posy. Could you find me {what}?" },
      {
        item: 'spiderLily',
        count: 1,
        ask: "Could you grow me {what}? It's for a very fancy bouquet.",
      },
      {
        item: 'hosta',
        count: 1,
        ask: 'I need {what} for the edges of a bouquet. Have you got one?',
      },
    ],
    thanks: "YOU'RE THE BEST! Here, here, take this! Thank you, thank you!",
    puffs: [
      "*pfft* …Hehe. Sorry! That was me! I'm very honest!",
      "*pfft* …Wasn't me! Was a squirrel! …Okay, it was me.",
    ],
    rewards: [
      {
        hearts: 3,
        letter:
          "Hi {name}!!!\n\nI figured out how to keep a blue rose forever! Under glass! Here's how! " +
          "Now you'll never have to say goodbye to one!\n\nYour pal,\nRUFUS",
        gift: { recipe: 'blueRoseDome' },
      },
      {
        hearts: 6,
        letter:
          "Hi {name}!!!\n\nI made you a flower crown! I only ate a little of it! It'll look SO " +
          'good on you!\n\nYour best pal,\nRUFUS',
        gift: { outfit: 'flowerCrown' },
      },
      {
        hearts: 10,
        letter:
          'Dear {name},\n\nThis is the biggest bouquet I have ever made. I picked every flower ' +
          'under a full moon, so the moonflowers will glow for you. You make every day feel like ' +
          'a full moon.\n\nLove, your best friend,\nRufus',
        gift: { furniture: 'moonBouquet' },
      },
    ],
  },
  wrapunzel: {
    name: 'Wrapunzel',
    creature: 'mummy baker',
    schedule: {
      weekday: [
        { from: 5, inside: 'crumbs' },
        { from: 11, at: 'squareSouth' },
        { from: 13, inside: 'crumbs' },
        { from: 17, at: 'bakeryField' },
        { from: 22, at: 'byTheWell' },
      ],
      weekend: [
        { from: 6, inside: 'crumbs' },
        { from: 11, at: 'squareSouth' },
        // Saturday is for having her bandages set at the Muse.
        { from: 14, inside: 'muse' },
        { from: 16, at: 'bakeryField' },
        { from: 19, inside: 'crumbs' },
        { from: 22, at: 'byTheWell' },
      ],
    },
    dropsBy:
      'I popped round with a warm loaf, dear. …I may have eaten it on the way. The thought was warm.',
    lines: {
      hello: [
        "Welcome, welcome! I'm Wrapunzel. I bake at the front and I curate at the back. Both take patience, and I've three thousand years of it.",
        'Crumbs & Curios: cake at the front, curiosities at the back. Never the other way round. We learned that the hard way.',
        "{name}, have you eaten? You look as if you haven't. Nobody in this town eats enough.",
        "My museum's cases are waiting for something wonderful. If you ever find anything curious, bring it by.",
      ],
      friend: [
        "I've been wrapped for three thousand years and I've never once been as cozy as in this town.",
        "Rufus eats the broken cookies. I break a few on purpose. Don't tell him.",
        `${CODY_NICKNAME} came in for a croissant at midnight. He only calls you babe, you know. The rest of us get "hey".`,
        "'Let down your hair,' they used to say to me. So I did. It's bandages all the way down.",
      ],
      close: [
        '{name}, you are the sweetest thing to come out of my oven, and you never even went in it.',
        "If I kept my heart in a jar, as we did in the old days, I'd give you the jar.",
        "I'd put you in my museum as the town's most precious thing, {name}. But you'd hate the glass.",
      ],
      night: [
        "Up late, {name}? Me too. The bread won't knead itself. Well, here it does, but I like to help.",
      ],
    },
    loves: [
      'pumpkin',
      'candyCorn',
      'batWingCookie',
      'pumpkinPudding',
      'pumpkinPie',
      'moonpetalCake',
    ],
    likes: ['crop', 'treat', 'snack'],
    reactions: {
      loved:
        "Oh, my darling! I'm going to cry, and at my age that means a great deal of unwrapping.",
      liked: 'How lovely! This is going straight into something delicious.',
      fine: 'Thank you, dear. Everything is useful to a baker. Eventually.',
    },
    says: {
      pumpkin: "A pumpkin! I'll make pies. Twelve pies. Fourteen. You'll have the first slice.",
      pumpkinPie: 'You baked this? The lattice! The little bats! Oh, I could unravel with pride.',
    },
    favours: [
      { item: 'pumpkin', count: 1, ask: 'The pie case is empty! Could you bring me {what}?' },
      {
        item: 'candyCorn',
        count: 2,
        ask: "I'm icing a cake and I'm short of candy corn. Could you spare {what}?",
      },
      { item: 'batWingBean', count: 3, ask: "It's bean-bun day. Could you find me {what}?" },
      { item: 'wood', count: 4, ask: 'The oven is hungry too. Could you bring {what}?' },
    ],
    thanks: 'Bless you, dear. Here, for your trouble, and take a bun on your way out.',
    puffs: [
      '*pfft* …Three thousand years, dear. Things settle.',
      '*pfft* …That was the oven. Ovens do that.',
    ],
    rewards: [
      {
        hearts: 3,
        letter:
          'My dear {name},\n\nA wreath of candy corn for your door, as we hang in the bakery. ' +
          "The recipe is enclosed. It's older than it looks. So am I.\n\nWith love and flour,\nWrapunzel",
        gift: { recipe: 'candyCornWreath' },
      },
      {
        hearts: 6,
        letter:
          'My dear {name},\n\nA Crumbs & Curios tee, with our cupcake on it. You are officially ' +
          'part of the bakery family. There is no leaving the bakery family.\n\nWith love and ' +
          'flour,\nWrapunzel',
        gift: { outfit: 'crumbsTee' },
      },
      {
        hearts: 10,
        letter:
          "My darling {name},\n\nI've baked for pharaohs, and I've never baked anything as " +
          'carefully as this. It is far too pretty to eat, so please never eat it.\n\nWith all my ' +
          'love (and more flour than is sensible),\nWrapunzel',
        gift: { furniture: 'coffinCake' },
      },
    ],
  },
  agatha: {
    name: 'Agatha',
    creature: 'witch',
    schedule: {
      weekday: [
        { from: 5, inside: 'agathaCottage' },
        { from: 8, at: 'graveyardGate' },
        { from: 11, at: 'salonFront' },
        { from: 14, at: 'avenue' },
        // Tea and mysteries at Maude's, then herbs in Whisperwood by moonlight.
        { from: 16, inside: 'library', stand: 1 },
        { from: 19, zone: 'whisperwood', at: 'herbs' },
      ],
      weekend: [
        { from: 6, at: 'graveyardGate' },
        { from: 9, inside: 'muse', stand: 1 },
        { from: 11, at: 'salonFront' },
        // Watching the sky from the lookout, for brooms and theories.
        { from: 15, at: 'lookout' },
        { from: 19, zone: 'whisperwood', at: 'herbs' },
      ],
    },
    dropsBy:
      "Don't mind me. I'm only admiring your curtains. And your corkboard. Mostly the corkboard.",
    lines: {
      hello: [
        'Agatha. Witch. Mostly retired. I do the odd potion for a friend and a great many crosswords.',
        "Everyone in this town has a secret. Mine, {name}, is that I can't fly in a straight line.",
        'If you see a broom going by on its own, just wave. It gets lonely.',
        'Nobody has ever met the mayor, you know. I have theories. I have a whole corkboard of theories.',
      ],
      friend: [
        "I read your tea leaves. They said 'lovely person', {name}. I didn't need the leaves for that.",
        "Maude and I have a book club. It's two members, and one of them is see-through. Care to join?",
        `${CODY_NICKNAME} owes me three potions and an apology. The apology is for the potions.`,
        "I've been watching that Moon Pie Man. Where does he come from? Where does he go? Why watermelon?",
        "Have you seen Wes? Trench coat, hat pulled down, always behind a tree. Worst hider I've ever met.",
      ],
      close: [
        "I'd brew you a love potion, but you clearly don't need one, {name}. The whole town adores you.",
        "You're the only one I trust with my case files. Well, you and Maude. Maude can't hold paper.",
        "Whatever this town's mystery is, {name}, I rather hope it's you. The best kind of mystery.",
      ],
      night: [
        "The cauldron's warm. Pull up a toadstool. Tonight's brew is hot cocoa. Don't tell anyone.",
      ],
    },
    loves: ['ghostPepper', 'batFlower', 'spiderLily', 'moonpetal', 'toadstoolStew'],
    likes: ['flower', 'squishy', 'record'],
    reactions: {
      loved:
        "Well, well. You've done your homework, {name}. I'm genuinely touched. Don't spread it around.",
      liked: "Oh, that's nice. That's very nice. I'll find a use for it. I always do.",
      fine: 'Thank you, dear. Into the cauldron it goes. Figuratively. Probably.',
    },
    says: {
      ghostPepper: "A ghost pepper. Perfect. This will liven up Tuesday's potion considerably.",
      toadstoolStew: "Toadstool stew, just like my gran's. Hers had more newt. Yours is better.",
    },
    favours: [
      { item: 'ghostPepper', count: 2, ask: 'My brew wants a kick. Could you find me {what}?' },
      {
        item: 'batFlower',
        count: 1,
        ask: 'I need {what} for a very particular potion. Nothing sinister.',
      },
      {
        item: 'stone',
        count: 5,
        ask: 'The cauldron needs new stones under it. Could you spare {what}?',
      },
      {
        item: 'moonpetal',
        count: 2,
        ask: "Moonpetals, for a sleeping draught. {what}, if you'd be so kind.",
      },
    ],
    thanks: "Splendid. You're a natural at this, {name}. Here, take this. I insist.",
    puffs: [
      "*pfft* …A small side effect of Tuesday's potion. We shan't speak of it.",
      "*pfft* …Hm. There's a toad in my pocket. Don't ask.",
    ],
    rewards: [
      {
        hearts: 3,
        letter:
          '{name},\n\nA garland of ghost peppers, to keep bad luck out and good luck in. I have ' +
          "enclosed the method. Follow it exactly. Or don't; it works either way.\n\nAgatha",
        gift: { recipe: 'pepperGarland' },
      },
      {
        hearts: 6,
        letter:
          '{name},\n\nA dress with the night sky on it, for a friend who is out at all hours. ' +
          'It sparkles. I refuse to apologise for that.\n\nAgatha',
        gift: { outfit: 'starryDress' },
      },
      {
        hearts: 10,
        letter:
          'Dear {name},\n\nMy spare broom. It has flown a thousand miles and never once in a ' +
          "straight line, and it has decided it would like to live with you. I can't say I blame " +
          'it.\n\nYour friend (and I have very few),\nAgatha',
        gift: { furniture: 'broomstick' },
      },
    ],
  },
  barty: {
    name: 'Barty',
    creature: 'skeleton gardener',
    schedule: {
      weekday: [
        { from: 5, at: 'farmHostas' },
        { from: 9, inside: 'bartyCottage' },
        { from: 12, at: 'gravesWest' },
        { from: 16, at: 'farmNorth' },
        { from: 19, inside: 'bartyCottage' },
        { from: 22, at: 'gravesSouth' },
      ],
      weekend: [
        // Fishing off the pier at the weekend. He never catches anything. He's never minded.
        { from: 5, zone: 'lanternShore', at: 'pierEnd' },
        { from: 11, at: 'gravesWest' },
        { from: 14, at: 'westMeadow' },
        { from: 17, at: 'farmNorth' },
        { from: 20, inside: 'bartyCottage' },
        { from: 22, at: 'gravesSouth' },
      ],
    },
    dropsBy:
      "G'day! Thought I'd pop round and see how the hostas are doing. Then I remembered they live outside.",
    lines: {
      hello: [
        "G'day! Barty Bones, groundskeeper. I keep the graveyard garden tidy and the hostas happy.",
        "Gardening's easy when you've no back to put out. Ha! Skeleton joke.",
        "Lovely beds at Hosta La Vista Farm, {name}. You've a green thumb. I've a white one.",
        'Nothing in McFrancisVille ever wilts, you know. Takes all the worry out of it.',
      ],
      friend: [
        "I've got a bone to pick with you, {name}. It's this one. Here. No, I'll want it back.",
        "Rufus keeps digging up my bulbs. I don't mind. He brings 'em back with a bow on.",
        `${CODY_NICKNAME} helped in the garden once. Said the sun was "a lot", so he did it at midnight. Good lad.`,
        "Every rock in this town has a bead in it somewhere, if you chip it nicely. Don't ask me why.",
      ],
      close: [
        "You're a good friend, {name}. I feel it right down to my bones. Which is all of me.",
        "If I had a heart it'd be growing hostas for you. I haven't, so I grow 'em anyway.",
        "Plant something with me some day. It's the best way I know to say 'see you tomorrow'.",
      ],
      night: ['Graveyard shift! Get it? Nobody ever laughs at that. Well. They rattle.'],
    },
    loves: ['hosta', 'snapdragon', 'spiderLilyBulb', 'pumpkinSoup'],
    likes: ['seed', 'crop', 'flower', 'material'],
    reactions: {
      loved: "Oh, you shouldn't have! You really, truly should have, and I'm glad you did.",
      liked: "Now that's a fine thing. Thank you kindly, {name}.",
      fine: 'Much obliged, {name}. Everything comes in handy in a garden.',
    },
    says: {
      snapdragon:
        'A skull snapdragon! Look at its little face. The spitting image of me. Handsome devil.',
      pumpkinSoup: "Pumpkin soup! It'll warm me right down to the bones. Which is all of me.",
    },
    favours: [
      { item: 'hosta', count: 1, ask: "I'm planting a border. Could you bring me {what}?" },
      { item: 'wood', count: 6, ask: 'The graveyard fence wants mending. Could you spare {what}?' },
      {
        item: 'snapdragon',
        count: 2,
        ask: 'Could you grow me {what}? The graves look so cheerful with them.',
      },
      { item: 'stone', count: 4, ask: "I'm laying a path. {what} would do it nicely." },
    ],
    thanks: "That's grand, {name}. Here's a little something from the shed.",
    puffs: [
      '*pfft* …Ha! Wind through the ribs. Happens to the best of us.',
      "*pfft* …Nothing in there to blame, mate. I'm all bones.",
    ],
    rewards: [
      {
        hearts: 3,
        letter:
          "G'day {name},\n\nA planter for your hostas, so you can have a bit of the garden " +
          "indoors. Here's how I make mine.\n\nCheers,\nBarty",
        gift: { recipe: 'hostaPlanter' },
      },
      {
        hearts: 6,
        letter:
          "G'day {name},\n\nA sun hat for the garden. I don't need one (no skin to burn), but " +
          'you do. Wide brim. Very smart.\n\nCheers,\nBarty',
        gift: { outfit: 'strawSunHat' },
      },
      {
        hearts: 10,
        letter:
          'Dear {name},\n\nI made you a gnome. He is a skeleton, like me, so he will never get ' +
          "cold and he will never leave. You've been a proper friend. Chuffed to my bones.\n\n" +
          'Barty',
        gift: { furniture: 'boneGnome' },
      },
    ],
  },
  // Cody's own villager (personal_touches.md, "Cody's villager" and "The neighbours"): sarcastic
  // but loving, calls her babe, and farts now and then, unbothered.
  cody: {
    name: 'Cody',
    creature: 'vampire',
    schedule: {
      weekday: [
        // He doesn't do mornings, so he does them at home.
        { from: 5, at: 'byHerHouse' },
        { from: 9, inside: 'codyManor' },
        { from: 13, at: 'squareEast' },
        { from: 17, at: 'shopFront' },
        { from: 20, inside: 'codyManor' },
        { from: 22, at: 'herPath' },
      ],
      weekend: [
        { from: 5, at: 'byHerHouse' },
        { from: 11, at: 'squareEast' },
        // Flicking through the records at Cobweb Corner.
        { from: 15, inside: 'cobwebCorner', stand: 2 },
        { from: 18, at: 'shopFront' },
        { from: 21, inside: 'codyManor' },
        { from: 23, at: 'herPath' },
      ],
    },
    dropsBy: 'Babe. I let myself in. I basically live here. Also I was bored without you.',
    lines: {
      hello: [
        "Oh look, it's you. My favourite person in this whole town. Don't let it go to your head, babe.",
        `Everyone here calls me ${CODY_NICKNAME}. I did not ask for this. I also did not stop them.`,
        "I'm a vampire, babe. I don't do mornings. I barely do afternoons.",
        'You know what would be great right now? A burrito bowl. You know what else? You. But mostly the bowl.',
      ],
      friend: [
        'Barty says I have no heartbeat. Rude. It just skips one whenever you walk up.',
        'Rufus hugged me. I am covered in fur now. This cape was clean, babe.',
        "Did you do something new with your hair? …Of course you did. You always look good. It's annoying.",
        'Maude shushed me in the library again. I was only breathing. Loudly. On purpose.',
      ],
      close: [
        "You're my orb, babe. Always have been.",
        "Honestly? The best thing about living forever is that you're in it.",
        "I'd give you my last burrito bowl. …Don't make me prove it.",
      ],
      night: [
        'Finally, the good hours. Snack run, babe? I carry, you pick.',
        "Night time, babe. My time. Our time. The snack's around here somewhere.",
      ],
    },
    loves: ['burritoBowl', 'purseButter', 'midnightPizza', 'ghostChili', 'fishChowder'],
    likes: ['snack', 'treat', 'record', 'squishy'],
    reactions: {
      loved: "Babe. …Babe. You shouldn't have. Okay, you should have. Thank you.",
      liked: "Aw, for me? I'll pretend I'm not touched. I'm touched.",
      fine: "Thanks, babe. I'll put it with my stuff. My stuff is mostly your stuff anyway.",
    },
    says: {
      burritoBowl: 'chipotle is mah liiiiffeee',
      purseButter: "Purse butter! See? I told you. That's exactly what it is.",
      ghostChili: 'You made me chili? Babe. Marry me. …Oh wait. Best day ever, again.',
    },
    bracelet: "You're my orb.",
    favours: [
      {
        item: 'burritoBowl',
        count: 1,
        ask: "Babe. I'm starving. Could you grab me {what}? I'd go, but… sunlight.",
      },
      {
        item: 'pumpkin',
        count: 1,
        ask: "Carve a jack-o'-lantern with me later? Bring {what}. I'll bring the knife skills.",
      },
      { item: 'wood', count: 5, ask: "My coffin has a squeak. Could you spare {what}? Don't ask." },
    ],
    thanks:
      "That's why you're my favourite, babe. Here. Don't spend it all on shoes. (Spend it all on shoes.)",
    puffs: [
      '*pfft* …That was a bat.',
      "*pfft* …Don't look at me. That was Rufus.",
      "*pfft* …Vampires don't do that. You didn't hear anything, babe.",
      '*pfft* …Excuse me. The burrito bowl sends its regards.',
    ],
    rewards: [
      {
        hearts: 3,
        letter:
          'Babe,\n\nFound this. It was playing the night we met, remember? You danced. I… also ' +
          "danced. Don't tell anyone.\n\n— Cody",
        gift: { item: 'recordWalkTheTomb' },
      },
      {
        hearts: 6,
        letter: "Babe,\n\nNow we match. Don't make it weird.\n\n(Make it weird.)\n\n— Cody",
        gift: { outfit: 'maroonTee' },
      },
      {
        hearts: 10,
        letter:
          "Babe,\n\nA portrait, so you can see me even when I'm out. You're welcome. Rufus made " +
          'the brass plate. I did not approve the brass plate.\n\nForever orbs,\nCody',
        gift: { furniture: 'codyPortrait' },
      },
    ],
  },
  // ---- Newcomers (phase T): not here on her first day, they move in one a month ----
  ollie: {
    name: 'Ollie',
    creature: 'postie',
    schedule: {
      weekday: [
        // Sorting the post first thing, out on the round all morning, and sorting again after.
        { from: 5, inside: 'ollieCottage' },
        { from: 7, at: 'postRound' },
        { from: 10, at: 'byNoticeboard' },
        { from: 13, inside: 'ollieCottage' },
        { from: 16, at: 'southRoad' },
        { from: 20, inside: 'ollieCottage' },
      ],
      weekend: [
        { from: 6, inside: 'ollieCottage' },
        { from: 9, at: 'postRound' },
        { from: 12, at: 'byNoticeboard' },
        { from: 15, at: 'southRoad' },
        { from: 19, inside: 'ollieCottage' },
      ],
    },
    dropsBy:
      'Special delivery! Well, just me. I was passing, {name}, and your door looked friendly.',
    lines: {
      hello: [
        "Ollie, postie! I'm still learning the round. Is it left at the well or right? Both, it turns out.",
        'Ghosts send the most letters of anyone. Maude writes to herself, just to get post.',
        "My bicycle's called Parcel. She's got a basket, a bell, and no brakes to speak of.",
        "Hello, {name}! Nothing for you just now, but I'll keep an eye out. Both eyes.",
      ],
      friend: [
        '{name}! I know every mailbox in town by heart now. Yours has a heart on it. My favourite.',
        `${CODY_NICKNAME} sends himself fan mail. I'm not supposed to say. I've said.`,
        'Before here I did the post somewhere very ordinary. Nobody waved. Here even the letters wave.',
        "Agatha's owl tried to take my job on my first day. We've come to an arrangement.",
      ],
      close: [
        "I'd carry a letter anywhere for you, {name}. Up the lookout, across the lake. Well. Round the lake.",
        "I came here for a quiet round and found a home. {name}, that's mostly your fault.",
        "If you ever want to write to someone, I'll take it. First class. My fanciest stamp.",
      ],
      night: [
        'Late round, {name}! Moth mail. They write very small letters.',
        'Night post is my favourite. The lanterns do the looking for me.',
      ],
    },
    loves: ['moonPie', 'pumpkinPie', 'candyCorn'],
    likes: ['snack', 'record'],
    reactions: {
      loved: "For me? {name}, that's first class. That's a gold star with a stamp on it.",
      liked: "Ooh, lovely! That's going straight in the satchel.",
      fine: "Thank you, {name}! I'll give it a nice spot on the sorting shelf.",
    },
    says: {
      moonPie:
        "A Moon Pie! The Moon Pie Man won't tell me where he lives. I've asked. I'm the postie!",
    },
    favours: [
      {
        item: 'wood',
        count: 3,
        ask: 'My sorting shelf is more sorting than shelf. Could you spare {what}?',
      },
      {
        item: 'forgetMeBoo',
        count: 2,
        ask: 'Could you find me {what}? I tuck them in letters that need cheering up.',
      },
      { item: 'candyCorn', count: 2, ask: 'A postie runs on candy corn. Could you spare {what}?' },
    ],
    thanks: 'Signed, sealed, delivered! Thank you, {name}. Here, for your trouble.',
    puffs: [
      "*pfft* …That was Parcel's tyre. She's got a slow puncture. Very slow. Very particular.",
      '*pfft* …Excuse me! Special delivery. Sorry. Return to sender.',
    ],
    rewards: [
      {
        hearts: 3,
        letter:
          'Dear {name},\n\nA letter from your postie, delivered by your postie! Here is how to ' +
          'build pigeonholes like mine, for your own letters. Every letter deserves a little ' +
          'home.\n\nFirst class,\nOllie',
        gift: { recipe: 'pigeonholes' },
      },
      {
        hearts: 6,
        letter:
          'Dear {name},\n\nI had a tee made with a little envelope on it, and then I had another ' +
          "made for you. Now we're both on the round.\n\nFirst class,\nOllie",
        gift: { outfit: 'postieTee' },
      },
      {
        hearts: 10,
        letter:
          'Dear {name},\n\nThis is the desk I wrote my first letter here at. It was to my mum, to ' +
          "say I'd found the friendliest town in the world. I'd like you to have it, so you can " +
          'write the next one.\n\nWith love (and a stamp),\nOllie',
        gift: { furniture: 'writingDesk' },
      },
    ],
    newcomer: {
      letter:
        "Dear {name},\n\nHello from your new neighbour! I'm Ollie, the town's new postie, and I'm " +
        "moving into the little red cottage by the south road tomorrow. I'll be the one bringing " +
        "your letters from now on, so if any come a bit crumpled, that's the bicycle.\n\nSee you " +
        'tomorrow!\nOllie',
      where: 'in the little red cottage by the south road',
      unpacking:
        "Hi! {name}, isn't it? I've had your name on forty letters already. I'm Ollie! Mind the boxes.",
    },
  },
  nessa: {
    name: 'Nessa',
    creature: 'lake monster',
    schedule: {
      weekday: [
        // Tending the lanterns on the lake: lit at dusk, and trimmed in the morning.
        { from: 5, inside: 'nessaBoathouse' },
        { from: 8, zone: 'lanternShore', at: 'shoreEast' },
        { from: 12, zone: 'lanternShore', at: 'lakeSouth' },
        { from: 15, inside: 'nessaBoathouse' },
        { from: 18, zone: 'lanternShore', at: 'pierMiddle' },
        { from: 22, zone: 'lanternShore', at: 'shoreEast' },
      ],
      weekend: [
        { from: 6, inside: 'nessaBoathouse' },
        // Brave enough, at the weekend, to come into town and look at the fountain.
        { from: 11, at: 'pondNorth' },
        { from: 15, zone: 'lanternShore', at: 'lakeSouth' },
        { from: 18, zone: 'lanternShore', at: 'pierMiddle' },
        { from: 23, inside: 'nessaBoathouse' },
      ],
    },
    dropsBy: "Oh! {name}, you're home. I, um. I brought a very smooth stone. It's for you. Hello.",
    lines: {
      hello: [
        "Hello… I'm Nessa. Sorry, I'm a bit damp. I'm always a bit damp.",
        'I light the lanterns on the lake every evening. They like being lit. So do I, a little.',
        'People used to say there was a monster in the lake. There was. Hello.',
        "The moon carp are my oldest friends. They don't say much. Neither do I, usually.",
      ],
      friend: [
        '{name}! I found you the smoothest stone in the lake. I checked all of them. It took a while.',
        'Rufus tried to swim out to say hello. I carried him back. He said it was the best day of his life.',
        "Wrapunzel taught me to make tea on land. It's much hotter than lake tea. I like it.",
        'The blue moonfish only comes up when everything is very quiet. Like me.',
      ],
      close: [
        "{name}, I was so shy of the town. Now I'd walk right up the main road for you. Dripping, but I would.",
        "You're the first friend I've told my whole name to. It's much longer. It's mostly bubbles.",
        'When I light the lanterns, I light one for you first. It bobs the most.',
      ],
      night: [
        "The lanterns are lit, {name}. Aren't they pretty on the water?",
        "Night is when the lake talks. Listen. It's saying hello to you.",
      ],
    },
    loves: ['moonflower', 'moonflowerTea', 'ghostMallow'],
    likes: ['squishy', 'flower'],
    reactions: {
      loved: 'For me? Oh… {name}. Nobody has ever given me anything that stayed dry before.',
      liked: "Thank you. I'll keep it on the windowsill, where the lanterns can see it.",
      fine: "Oh! Thank you, {name}. I'll find it a place. I have lots of places now. I have shelves.",
    },
    says: {
      ghostMallow:
        "A ghost mallow! It's so soft. It's like a little cloud that doesn't mind being eaten.",
    },
    favours: [
      {
        item: 'stone',
        count: 3,
        ask: 'The lanterns need new anchors, or they drift. Could you bring me {what}?',
      },
      {
        item: 'toadstool',
        count: 2,
        ask: "Could you find me {what}? They grow in the woods, and I'm still shy of the woods.",
      },
      {
        item: 'moonpetal',
        count: 3,
        ask: 'I float {what} in the lanterns. Could you pick me some?',
      },
    ],
    thanks: 'Oh, thank you, {name}. Really. Here. I found this at the bottom of the lake.',
    puffs: [
      '*blub* …That was a bubble. From the lake. Inside me. Sorry.',
      '*blub* …Oh no. Oh, I do apologise. The lake does that. I do that.',
    ],
    rewards: [
      {
        hearts: 3,
        letter:
          'Dear {name},\n\nThis is how I make the lanterns that float on the lake: a lily pad, a ' +
          'candle and a bit of moonflower. Now you can have one indoors, where it stays dry.\n\n' +
          'Shyly,\nNessa',
        gift: { recipe: 'lilyLantern' },
      },
      {
        hearts: 6,
        letter:
          'Dear {name},\n\nI sewed you a dress the colour of the lake, with bubbles on it. I sewed ' +
          "the bubbles one at a time. It's very relaxing, sewing bubbles.\n\nShyly,\nNessa",
        gift: { outfit: 'bubbleDress' },
      },
      {
        hearts: 10,
        letter:
          'Dear {name},\n\nA little bit of my lake, for your home, with a lantern fish in it who ' +
          "asked to come. Now you'll never be far from the water, and neither will I.\n\n" +
          'Your friend (my first),\nNessa',
        gift: { furniture: 'bubbleTank' },
      },
    ],
    newcomer: {
      letter:
        "Dear {name},\n\nI'm Nessa. I live in the lake at Lantern Shore. Well, I did. The water is " +
        "lovely, but it's very hard to keep a kettle going. So I've built a little boathouse on the " +
        "shore, and I'm moving in tomorrow, if that's all right.\n\nI'll light the lanterns for " +
        'you every night.\n\nShyly,\nNessa',
      where: 'in a boathouse at Lantern Shore',
      after: { found: 'lanternShore' },
      unpacking:
        "Oh! {name}. Hello. I've never had boxes before. Or a door. I keep opening it just to see.",
    },
  },
  gourdon: {
    name: 'Gourdon',
    creature: 'pumpkin-headed carpenter',
    schedule: {
      weekday: [
        { from: 5, inside: 'gourdonPumpkin' },
        { from: 8, at: 'eastRoad' },
        { from: 11, inside: 'gourdonPumpkin' },
        // Sitting out on the verge of an evening, glowing a bit.
        { from: 17, at: 'pastTheBakery' },
        { from: 22, inside: 'gourdonPumpkin' },
      ],
      weekend: [
        { from: 6, inside: 'gourdonPumpkin' },
        { from: 10, at: 'eastRoad' },
        { from: 12, at: 'squareCorner' },
        { from: 16, inside: 'gourdonPumpkin' },
        { from: 19, at: 'pastTheBakery' },
      ],
    },
    dropsBy:
      "Door was stiff, {name}. Gave the hinge a little oil on my way in. Hope you don't mind. Hello!",
    lines: {
      hello: [
        'Gourdon. I make things out of wood. Chairs, mostly. Sometimes a chair wants to be a table.',
        'They grow me a fresh head every autumn. Same fella inside. Keeps me looking sharp.',
        'Measure twice, cut once. Carve a smile every time.',
        "You can knock on my house. It's hollow. Everybody does.",
      ],
      friend: [
        "{name}! Built a birdhouse for Agatha's owl. He's moved in. Pays me in feathers.",
        "Barty and I have an understanding. He grows the pumpkins, and I don't ask about my cousins.",
        `${CODY_NICKNAME} wanted a coffin with cup holders. I've built stranger. Not much stranger.`,
        "When I light up at night, that's just me thinking. Big head. Lots of room for thinking.",
      ],
      close: [
        '{name}, most folks see a pumpkin. You see a fella. That means the world to a gourd.',
        "I'd build you anything. A shelf, a swing, a bridge to the moon. That last might take a while.",
        "My grin's carved, {name}, but I'd be smiling anyway when you're about.",
      ],
      night: [
        'Evening, {name}! Lit up with a fresh candle. Mind the moths, they like me.',
        'Nights like this I sit out on the step and glow a bit. Very restful.',
      ],
    },
    loves: ['pumpkinPie', 'ghostChili', 'batWingCookie'],
    likes: ['material', 'crop'],
    reactions: {
      loved: "Well, would you look at that. For me? {name}, you've lit my candle right up.",
      liked: "That's handsome, that is. Thank you kindly.",
      fine: "Thank you, {name}. I'll build it a little shelf of its own.",
    },
    says: {
      pumpkinPie: "Pumpkin pie. I… won't ask where it came from. I will eat it, though. Thank you.",
      wood: "Good wood, this. Straight grain. You've an eye, {name}.",
    },
    favours: [
      { item: 'wood', count: 6, ask: "I've a table to finish. Could you bring me {what}?" },
      {
        item: 'stone',
        count: 3,
        ask: "My house needs a proper step, it's rolling off. Could you spare {what}?",
      },
      {
        item: 'pumpkin',
        count: 1,
        ask: 'Could you grow me {what}? For a lantern. Not a relative. I checked.',
      },
    ],
    thanks: 'Much obliged, {name}. Here, something for your trouble. Made it myself.',
    puffs: [
      "*pfft* …That was the house settling. Pumpkins settle. It's a known thing.",
      '*pfft* …Pardon me. Seeds. You understand.',
    ],
    rewards: [
      {
        hearts: 3,
        letter:
          'Dear {name},\n\nA stool with a pumpkin for a seat. Sturdy, and it smiles at you. ' +
          "Here's how I build them.\n\nYours, with a big grin (carved),\nGourdon",
        gift: { recipe: 'pumpkinStool' },
      },
      {
        hearts: 6,
        letter:
          'Dear {name},\n\nA good flannel shirt, same as mine. Sawdust comes right out of it. ' +
          'Snug for sitting out on autumn nights.\n\nYours, with a big grin (carved),\nGourdon',
        gift: { outfit: 'flannelShirt' },
      },
      {
        hearts: 10,
        letter:
          'Dear {name},\n\nI built you a clock. Took me all summer. The pendulum is a little pumpkin, ' +
          'and it swings a bit slow, because the good times ought to last.\n\nYour friend,\n' +
          'Gourdon',
        gift: { furniture: 'pumpkinClock' },
      },
    ],
    newcomer: {
      letter:
        'Dear {name},\n\nGourdon here. Carpenter. I build things out of wood, and I grow my own ' +
        "head, so you could say I'm handy all over. I'm moving into the pumpkin on the east side " +
        'tomorrow. Yes, the house is a pumpkin. It seemed right.\n\nYours, with a big grin ' +
        '(carved),\nGourdon',
      where: 'in the pumpkin house past the bakery',
      // Pumpkin season: he only comes in the autumn.
      months: [9, 10, 11],
      unpacking:
        "Well, hello there, {name}. Gourdon. Don't mind the sawdust. I built most of these boxes, and one's a chair now.",
    },
  },
  hazel: {
    name: 'Hazel',
    creature: 'stargazer',
    schedule: {
      weekday: [
        // Up all night with her telescope, so she sleeps the afternoon away.
        { from: 5, inside: 'hazelObservatory' },
        { from: 9, zone: 'whisperwood', at: 'starGlade' },
        { from: 12, inside: 'hazelObservatory', stand: 1 },
        { from: 18, at: 'lookoutEast' },
        { from: 22, zone: 'whisperwood', at: 'starGlade' },
      ],
      weekend: [
        { from: 5, inside: 'hazelObservatory' },
        { from: 10, at: 'lookoutEast' },
        { from: 14, inside: 'hazelObservatory', stand: 1 },
        { from: 19, zone: 'whisperwood', at: 'starGlade' },
        { from: 23, at: 'lookoutEast' },
      ],
    },
    dropsBy: "{name}! I brought my star chart. I thought we might find yours. Everyone's got one.",
    lines: {
      hello: [
        "I'm Hazel. I look at stars for a living. Well, for a hobby. Well, all night.",
        "Maude and I have been pen pals for twelve years. We'd never met. She's exactly like her handwriting.",
        'Every star has a name, you know. Most of them I made up. They seem to like them.',
        "I sleep in the afternoons. That's when the sky's least interesting.",
      ],
      friend: [
        "{name}! I named a star after you. It's the one next to the one I named after Rufus. He howled.",
        "Agatha and I argue about the moon. She says it's a spell. I say it's a rock. We're both a bit right.",
        "Maude reads me ghost stories while I watch the sky. The stars don't mind.",
        'On a clear night you can see the castle from my roof. And sometimes a very large moth.',
      ],
      close: [
        '{name}, I came for the dark skies. I stayed for the company. Mostly yours.',
        "If you ever feel small, look up. Then look at me waving. You're not small here.",
        "I'd give you a star if I could, {name}. I've given you three already. On paper, but still.",
      ],
      night: [
        "Look, {name}! There. That one's winking. It likes you.",
        "Best time of night. The telescope's warm and the sky's wide open.",
      ],
    },
    loves: ['moonflower', 'moonpetalCake', 'moonflowerTea'],
    likes: ['dish', 'bead'],
    reactions: {
      loved: "Oh, {name}! It's like being handed a little piece of the night sky.",
      liked: "How lovely. I'll put it by the telescope, where I'll see it every night.",
      fine: 'Thank you, {name}! I have just the shelf. Between the moon rocks and the other moon rocks.',
    },
    says: {
      moonpetalCake:
        "Moonpetal cake! I'll save a slice for three in the morning. That's when the good stars come out.",
    },
    favours: [
      {
        item: 'stone',
        count: 2,
        ask: "The telescope's wobbly. Could you bring me {what}? Stones are very good at not wobbling.",
      },
      {
        item: 'moonpetal',
        count: 3,
        ask: 'Could you pick me {what}? I press them in my star charts, to mark the best nights.',
      },
      {
        item: 'ghostDaisy',
        count: 2,
        ask: 'Could you find me {what}? They glow just enough to read by.',
      },
    ],
    thanks: "Perfect! You're a star, {name}. Literally. I've checked. Here, for your trouble.",
    puffs: [
      '*pfft* …That was a shooting star. Very low. Make a wish?',
      "*pfft* …Oh! Excuse me. Too much moonflower tea. It's a known side effect. Known to me.",
    ],
    rewards: [
      {
        hearts: 3,
        letter:
          'Dear {name},\n\nHow to make a star chart of your own, with every star you can see from ' +
          "McFrancisVille. I've marked the one with your name. It's small, but it's very bright." +
          '\n\nLooking up,\nHazel',
        gift: { recipe: 'starChart' },
      },
      {
        hearts: 6,
        letter:
          'Dear {name},\n\nA tee with the night sky on it: a crescent moon and a star. Wear it on ' +
          "a cloudy night and there'll still be a star out.\n\nLooking up,\nHazel",
        gift: { outfit: 'nightSkyTee' },
      },
      {
        hearts: 10,
        letter:
          "Dear {name},\n\nMy first telescope. I found every star I've named with it, and yours " +
          'was the brightest. I want you to have it, so you can find mine.\n\nLooking up, and at ' +
          'you,\nHazel',
        gift: { furniture: 'telescope' },
      },
    ],
    newcomer: {
      letter:
        'Dear {name},\n\nMaude and I have written to each other for years. She says McFrancisVille ' +
        'has the darkest skies and the kindest people, and she is never wrong about either. So ' +
        "I'm coming! My little observatory goes up in Whisperwood tomorrow, where the trees open " +
        'to the sky.\n\nLooking up,\nHazel',
      where: 'in Whisperwood, where the trees open to the sky',
      // Maude has written to her about the town, once she and Maude are friends.
      after: { hearts: 3, with: 'maude' },
      unpacking:
        "{name}! Maude's told me all about you. All of it. She writes very long letters. I'm Hazel. Mind the telescope, it's shy.",
    },
  },
};

export const VILLAGER_IDS = Object.keys(VILLAGERS) as VillagerId[];

/** Her catchphrase, jokingly, and never meant (personal_touches.md, "The neighbours"). */
export const HER_REPLY = "You're getting on mah nerves!";

export const CODY_COMEBACKS: readonly string[] = [
  'Love you too, babe.',
  'And yet here you are.',
  "That's the nicest thing you've said to me all day.",
];
