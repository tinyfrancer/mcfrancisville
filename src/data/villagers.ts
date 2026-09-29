import type { InteriorId, ItemId, MapZoneId, VillagerId } from '../types/ids';
import type { ItemKind } from './items';
import type { SpotName } from './maps';
import type { Ware } from './shop';

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
        "I saved you a bookmark, {name}. It's shaped like a bat. It's only a little bit haunted.",
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
        'The moon is the best reading lamp there is. Pull up a gravestone, {name}.',
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
        "I made you a bouquet, {name}, but I got excited and ate it. I'll make another!",
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
        "Have you eaten, {name}? You look as if you haven't eaten. Nobody in this town eats enough.",
        "My museum's cases are waiting for something wonderful. If you ever find anything curious, bring it by.",
      ],
      friend: [
        "I've been wrapped for three thousand years and I've never once been as cozy as in this town.",
        "Rufus eats the broken cookies. I break a few on purpose. Don't tell him.",
        `${CODY_NICKNAME} came in for a croissant at midnight. He only calls you babe, you know. The rest of us get "hey".`,
        "'Let down your hair,' they used to say to me. So I did. It's bandages all the way down.",
      ],
      close: [
        'You are the sweetest thing to come out of my oven, {name}, and you never went in it.',
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
        "Everyone in this town has a secret, {name}. Mine is that I can't fly in a straight line.",
        'If you see a broom going by on its own, just wave. It gets lonely.',
        'Nobody has ever met the mayor, you know. I have theories. I have a whole corkboard of theories.',
      ],
      friend: [
        "I read your tea leaves, {name}. They said 'lovely person'. I didn't need the leaves for that.",
        "Maude and I have a book club. It's two members, and one of them is see-through. Care to join?",
        `${CODY_NICKNAME} owes me three potions and an apology. The apology is for the potions.`,
        "I've been watching that Moon Pie Man. Where does he come from? Where does he go? Why watermelon?",
        "Have you seen Wes? Trench coat, hat pulled down, always behind a tree. Worst hider I've ever met.",
      ],
      close: [
        "I'd brew you a love potion, {name}, but you clearly don't need one. The whole town adores you.",
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
};

export const VILLAGER_IDS = Object.keys(VILLAGERS) as VillagerId[];

/** Her catchphrase, jokingly, and never meant (personal_touches.md, "The neighbours"). */
export const HER_REPLY = "You're getting on mah nerves!";

export const CODY_COMEBACKS: readonly string[] = [
  'Love you too, babe.',
  'And yet here you are.',
  "That's the nicest thing you've said to me all day.",
];
