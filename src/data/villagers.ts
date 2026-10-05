import type { InteriorId, ItemId, MapZoneId, VillagerId } from '../types/ids';
import type { ItemKind } from './items';
import type { SpotName } from './maps';
import type { Ware } from './shop';
import type { DayWindow } from './windows';

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
 * `close` from seven. `night` lines join the rest after 8pm, and each window's line joins them in
 * its window (0.2's D1). `{name}` is the name she typed.
 */
export interface Lines {
  hello: readonly string[];
  friend: readonly string[];
  close: readonly string[];
  night: readonly string[];
  windows: Readonly<Record<DayWindow, string>>;
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
  /**
   * The letter they wrote the day before they moved in, back when neighbours came over time
   * (phase T). Nobody writes one now (decision 211); it's kept so it still reads in a mailbox
   * that has it.
   */
  wrote?: string;
}

/** What the other villagers call Cody (personal_touches.md, "Cody's villager"). */
export const CODY_NICKNAME = 'Pimp Daddy Francis';

/**
 * Her neighbours (decisions.md 16), in the order they're shown. They're somewhere she can find
 * them at every hour: out in town or beyond it, or in at home, at work or at a shop, walking
 * between their stops as the clock moves on (phase S). Cody calls her mi amor, babe, booby or honey
 * bunny, "babe" about one line in four (0.2's D1); everyone else uses the name she typed. Each teaches a recipe at three hearts, gives something to wear at six, and a
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
        'The library is open whenever you like, {name}. The door is mostly for show. I use the wall.',
        'I shelve by feeling, not by author. The sad books go near the window, so they can look out.',
        'A new neighbour! How wonderful. I shall have to find you a library card. I shall have to make one.',
        "Do call in for a cup of tea. I can't drink it, but I do love holding something warm.",
      ],
      friend: [
        "{name}! I saved you a bookmark. It's shaped like a bat. It's only a little bit haunted.",
        `${CODY_NICKNAME} returned a book forty years overdue. He said he'd been busy. For forty years.`,
        'Agatha borrows the mystery novels and solves them by chapter two. It is very annoying. I adore her.',
        'Do you ever feel the town is keeping a secret? The mayor has never once been to the library.',
        'Rufus asked me for a book about sticks. I found him three. He cried at the ending of the second.',
        'Hazel writes to me in the most beautiful hand. I write back in the steam on her window.',
        "I've started a book of McFrancisVille's small wonders, {name}. You're in chapter one. And two.",
        "Wes has had a library book out for eleven years. I've sent notes. He hides behind the notes.",
      ],
      close: [
        "You're my favourite visitor, {name}. Don't tell the other visitors. They're mostly moths.",
        "I'd float through walls to find you a good book. I do anyway, but for you especially.",
        "Some ghosts haunt houses. I'd rather haunt wherever you are. In the nicest possible way.",
        "{name}, if my life were a book, you'd be the bit where it gets good.",
        'I keep a chair by the fire for you. Nobody else sits in it. I shoo them. Very politely.',
        "I've read about friendships like ours. I never thought I'd get one. Certainly not after.",
        "When you're about, the whole library feels less quiet. In the loveliest way.",
        "I wrote your name in the front of my favourite book. In pencil, {name}. I'm not a monster.",
      ],
      night: [
        'The moon is the best reading lamp there is, {name}. Pull up a gravestone.',
        'Night is when the good stories come out. And the moths. Mostly the moths.',
        "Ghosts sleep in the day, you know. I don't. I just pretend so nobody asks me to dust.",
        "The graves are so peaceful at night. Everyone's tucked up. Well, nearly everyone. Hello.",
        'I read to the moths at bedtime. They like anything with a lamp in it.',
        "Out for a moonlit stroll? I'll glow for you, {name}. It saves on lanterns.",
        "A good night for a mystery. I've brought one. It's in my sleeve. I haven't got sleeves.",
        "Listen, {name}. Hear that? That's the library settling. It sighs when it's happy.",
      ],
      windows: {
        morning:
          "Good morning, {name}. The library opens at nine. I've been here since midnight, but it opens at nine.",
        afternoon:
          'Afternoon is for a quiet chapter and a nap between the pages. Not me. The book.',
        evening:
          "Evening already, {name}? The best part of a book is when you can't put it down. The best part of a day is now.",
      },
    },
    loves: [
      'ghostDaisy',
      'moonflower',
      'ghostMallow',
      'moonflowerTea',
      'lavender',
      'lavenderShortbread',
    ],
    likes: ['flower', 'record'],
    reactions: {
      loved: "Oh, {name}! For me? I'm quite overcome. Well, more see-through than usual.",
      liked: "How thoughtful. I'll press it between the pages of my favourite book.",
      fine: "Thank you, {name}. I'll find it a nice shelf. I have so many shelves.",
    },
    says: {
      ghostDaisy: "A ghost daisy! It's nearly as see-through as I am. I adore it.",
      moonflowerTea: 'Moonflower tea! Now I can read till dawn. Well. Longer than usual.',
      lavenderShortbread:
        "Lavender shortbread! A biscuit, a cup of tea and a good book. That's my whole heart.",
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
        // Sniffing the blossom in Boo Acres' orchard of a weekend (0.3's F1).
        { from: 14, zone: 'booAcres', at: 'orchard' },
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
        "Oh! OH! You're new! I love new! New is my favourite thing after flowers and snacks!",
        'I pick the wildflowers in the woods every morning! The early ones taste the best! I mean smell!',
        "If you hear barking, it's Dolly. If you hear howling, it's me. If you hear both, we're friends!",
        'Want to smell a rose? Here! No, closer! Closer! …Okay that was my nose, sorry!',
      ],
      friend: [
        "{name}! I made you a bouquet, but I got excited and ate it. I'll make another!",
        "Barty grows 'em, I arrange 'em. We're a team! He's a skeleton, so he's all heart. No, wait.",
        'Wrapunzel gives me the broken cookies. Best friend a wolf could have! Besides you!',
        `${CODY_NICKNAME} says I'm "a lot". I think that means I'm a lot of fun!`,
        "Cobweb Corner had a plushie with a neck THIS long! Long neck Yoshi! I've never wanted anything more.",
        "Agatha says I'm not allowed in her herb garden. I was only saying hello to the mint!",
        "Hazel named a star after me and I howled at it ALL NIGHT. She says that's the nicest review she's had.",
        "{name}! {name}! I found a stick. It's the best stick. I've named it Stick. I'm giving it to you!",
      ],
      close: [
        "You're my favourite person, {name}! I'd fetch anything for you. I'd fetch a stick! Two sticks!",
        'When the moon is full I get extra fluffy. You can pet me. If you want. No pressure. Please?',
        "If you were a flower you'd be a blue rose. Rare and wonderful and everybody's favourite.",
        "{name}! I told the moon about you! It said you sound amazing! Well, it didn't say anything. It glowed!",
        'Best friends? Best friends! I knew it! I knew it the first time you walked up!',
        "If you ever feel sad, you tell me and I'll bring you every flower in town. EVERY one!",
        "Sometimes I wag so hard I fall over. That's how happy I am when you come by.",
        "You're my favourite smell, {name}. That sounds weird. It's a wolf thing! It's a nice thing!",
      ],
      night: [
        'AWOOOO! …Oh! Hi, {name}! Sorry. The moon is just so pretty tonight.',
        'Moonflowers are open! Best part of the night. Well, second best. Hi, {name}!',
        "The moon's so big tonight! I want to hug it! I can't reach! I've tried!",
        'Night flowers smell different, {name}! Sort of like moonlight! If moonlight had a smell!',
        "I'm not scared of the dark! I AM the dark! A fluffy, friendly bit of the dark!",
        "Want to go for a night walk? I'll sniff out the snack! I'm very good at it! Ask Cody!",
        "Barty's asleep. Wrapunzel's baking. I'm howling. Everybody's got a thing!",
        "Shh! Listen! That's an owl! Hi, owl! …It didn't say hi back. It's shy!",
      ],
      windows: {
        morning:
          "GOOD MORNING! I've been up since five! I've picked forty flowers! I've eaten three!",
        afternoon:
          "Afternoon! That's when I do the arranging! Big flowers at the back, little ones at the front, me in the middle!",
        evening: "It's evening! The moon's nearly up! I can feel it in my ears!",
      },
    },
    // Pizza is one of her favourites, and it's his (personal_touches.md, "Things she loves").
    loves: [
      'rose',
      'blueRose',
      'jackOLanternPizza',
      'midnightPizza',
      'roseJam',
      'midnightPlate',
      'sunflower',
      'marigold',
    ],
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
      sunflower: "A sunflower! It's taller than me. Well. Than me sitting down. I love it!",
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
        "Call in any time, {name}. There's always something warm in the oven and something odd in the cases.",
        "I was a princess once, a very long time ago. Now I'm a baker. I much prefer the aprons.",
        "Mind the stairs to the museum. They're older than the town. Nearly as old as me.",
        'The trick with bread is patience. The trick with mummies is also patience. And a lot of bandages.',
      ],
      friend: [
        "I've been wrapped for three thousand years and I've never once been as cozy as in this town.",
        "Rufus eats the broken cookies. I break a few on purpose. Don't tell him.",
        `${CODY_NICKNAME} came in for a croissant at midnight. He has four pet names for you, you know. The rest of us get "hey".`,
        "'Let down your hair,' they used to say to me. So I did. It's bandages all the way down.",
        "Maude comes in for the smell of the scones. She can't eat them, so I save her the steam.",
        'I tried a new recipe: pumpkin crumble. Barty grew the pumpkin, Rufus ate the crumble. Teamwork.',
        'Gourdon fixed my oven door. Now it closes with a little creak, like a sigh. Very me.',
        'Every critter you bring in gets a label in my very best hand. I practise on the napkins.',
      ],
      close: [
        '{name}, you are the sweetest thing to come out of my oven, and you never even went in it.',
        "If I kept my heart in a jar, as we did in the old days, I'd give you the jar.",
        "I'd put you in my museum as the town's most precious thing, {name}. But you'd hate the glass.",
        "{name}, I've kept a great many treasures. None of them made the shop smell of cinnamon when they walked in.",
        'When I bake something new, I think: would {name} like it? Then I add more sugar.',
        'You make an old mummy feel young, {name}. Well. A few centuries younger.',
        "There's a jar on the counter with your name on it. It's biscuits. It's always biscuits.",
        'If you ever unravel a bit, come to me. I know all about coming undone and winding back up.',
      ],
      night: [
        "Up late, {name}? Me too. The bread won't knead itself. Well, here it does, but I like to help.",
        'The best bread is baked while the town sleeps. Want to help? You can do the flour. I do the magic.',
        "The museum's lovely at night. The glowing critters light the cases. It's like a little sky.",
        '{name}, midnight is when the croissants rise. And Cody. For the croissants.',
        "Can't sleep? A warm scone and a quiet corner. That's what I prescribe.",
        'My bandages glow a little in the moonlight. Very practical. I never trip over the flour sacks.',
        "The oven's the warmest spot in town after dark. Come and stand by it. Everyone does.",
        'I hum old songs while I knead. Very old songs. The tunes have held up better than the words.',
      ],
      windows: {
        morning:
          'Good morning, {name}! First batch is out. The scones are warm and so is the welcome.',
        afternoon:
          'Afternoon is for the museum. The cases need a dust and the critters need a chat.',
        evening: "Evening, {name}. The shop's quiet and the kettle's on. Stay for one?",
      },
    },
    loves: [
      'pumpkin',
      'candyCorn',
      'batWingCookie',
      'pumpkinPudding',
      'pumpkinPie',
      'moonpetalCake',
      'tomato',
      'basil',
      'spaghetti',
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
      spaghetti:
        "Spaghetti! I'm rather good at twirling, dear. I've had three thousand years of practice.",
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
        // Reading fortunes in her tent at the fairground (0.2's M1), behind the crystal ball.
        { from: 13, inside: 'fortuneTent' },
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
        "New in town? I'll know everything about you by Tuesday. It's nothing personal. It's a hobby.",
        'My cottage is the one with the hat for a roof. The hat was a gift. I keep meaning to return it.',
        "Mind the cauldron by my door. It's for soup. Mostly soup.",
        "If a broom ever turns up at your door, it's from me. It flies better than I do. In a straight line.",
      ],
      friend: [
        "I read your tea leaves. They said 'lovely person', {name}. I didn't need the leaves for that.",
        "Maude and I have a book club. It's two members, and one of them is see-through. Care to join?",
        `${CODY_NICKNAME} owes me three potions and an apology. The apology is for the potions.`,
        "I've been watching that Moon Pie Man. Where does he come from? Where does he go? Why watermelon?",
        "Have you seen Wes? Trench coat, hat pulled down, always behind a tree. Worst hider I've ever met.",
        'Rufus got into my herb garden again. Now all my potions smell of wolf. Friendly wolf, at least.',
        "The creeper was behind the willow this morning. Wes, I mean. I've given him a name in my files. It's 'the creeper'.",
        "Hazel says the moon is a rock. I say it's a spell. We agree it's lovely, which is the important bit.",
      ],
      close: [
        "I'd brew you a love potion, but you clearly don't need one, {name}. The whole town adores you.",
        "You're the only one I trust with my case files. Well, you and Maude. Maude can't hold paper.",
        "Whatever this town's mystery is, {name}, I rather hope it's you. The best kind of mystery.",
        "{name}, I've read your tea leaves a hundred times now. They always say the same thing. 'Stay.'",
        "I don't make friends easily. I make potions easily. You're rarer than either.",
        'If anyone ever gives you trouble, you tell me. I have a very particular toad spell.',
        "Every mystery in my files has a question mark on it. Yours has a heart. Don't tell Maude.",
        "You're the best thing that's happened to this town since the Moon Pie Man. And I don't trust him.",
      ],
      night: [
        "The cauldron's warm. Pull up a toadstool. Tonight's brew is hot cocoa. Don't tell anyone.",
        "Herbs are best picked by moonlight. I don't know why. I've got a theory. It's a long one.",
        "The stars are out, {name}. Hazel will be up her tower all night. I'll bring her cocoa at two.",
        'Out late? Me too. The best clues come out after dark. Like the moths.',
        "My broom's gone off on its own again. It likes the night air. So do I, honestly.",
        "Listen. That creak? That's the creeper, somewhere, behind something. Goodnight, Wes!",
        "A spell for a good night's sleep? Warm milk. Oldest spell there is. Works every time.",
        "Night's when a witch does her real work. Crosswords. The big ones.",
      ],
      windows: {
        morning: "Morning. I've done the crossword, two potions and a theory. Your turn.",
        afternoon: "Afternoon. Tea time. I read the leaves, then I drink what's left. Waste not.",
        evening: "Evening, {name}. The cauldron's on. Tonight it's soup. Probably soup.",
      },
    },
    loves: [
      'ghostPepper',
      'batFlower',
      'spiderLily',
      'moonpetal',
      'toadstoolStew',
      'blackTulip',
      'christmasRose',
      'glowGourd',
      'roastGourd',
    ],
    likes: ['flower', 'squishy', 'doll', 'record'],
    reactions: {
      loved:
        "Well, well. You've done your homework, {name}. I'm genuinely touched. Don't spread it around.",
      liked: "Oh, that's nice. That's very nice. I'll find a use for it. I always do.",
      fine: 'Thank you, dear. Into the cauldron it goes. Figuratively. Probably.',
    },
    says: {
      ghostPepper: "A ghost pepper. Perfect. This will liven up Tuesday's potion considerably.",
      toadstoolStew: "Toadstool stew, just like my gran's. Hers had more newt. Yours is better.",
      glowGourd: 'A glow gourd! It saves on candles, and it hums a bit at night. I adore it.',
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
        // Out at Boo Acres of an afternoon (0.3's F1), leaning on a hoe and admiring the rows.
        { from: 16, zone: 'booAcres', at: 'fields' },
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
        "That's my potting cottage down the road, with the greenhouse. Pop by. Mind the rake. I never do.",
        "{name}, soil's the secret. Good soil, a bit of water and a lot of chatting. The plants like a yarn.",
        "I talk to the hostas. They don't talk back. Best listeners in town.",
        "Anything you grow, I'll tell you it's the best I've seen. And I'll mean it every time.",
      ],
      friend: [
        "I've got a bone to pick with you, {name}. It's this one. Here. No, I'll want it back.",
        "Rufus keeps digging up my bulbs. I don't mind. He brings 'em back with a bow on.",
        `${CODY_NICKNAME} helped in the garden once. Said the sun was "a lot", so he did it at midnight. Good lad.`,
        "Every rock in this town has a bead in it somewhere, if you chip it nicely. Don't ask me why.",
        "Gourdon asked me to grow him a new head for autumn. Said 'make it a handsome one'. No pressure!",
        "Found a worm this big in the graveyard beds. Named him Terry. Terry's thriving.",
        "The rain's the best gardener in town. I just take the credit. Don't tell it.",
        'Wrapunzel sends me home with a loaf every Friday. Goes straight through me. Ha! Skeleton joke.',
      ],
      close: [
        "You're a good friend, {name}. I feel it right down to my bones. Which is all of me.",
        "If I had a heart it'd be growing hostas for you. I haven't, so I grow 'em anyway.",
        "Plant something with me some day. It's the best way I know to say 'see you tomorrow'.",
        "You've got a gardener's heart, {name}. Soft, patient, a bit muddy. Best kind.",
        "Every time you come by, I rattle a bit. That's happy rattling. The best kind of rattle.",
        "I planted a row of snapdragons and named each one after you. That's a lot of {name}s. It works.",
        "If I had skin, I'd have goosebumps. That's how chuffed I am you stopped for a chat.",
        'Some folks grow roses. I grow friendships. Yours came up the best of the lot.',
      ],
      night: [
        'Graveyard shift! Get it? Nobody ever laughs at that. Well. They rattle.',
        'The moonflowers are open, {name}. Go on, have a sniff. Best smell in the world.',
        'I sleep in a flower bed. Very comfy. Wakes me up with the dew.',
        "Stars are out. Reckon they're the town's night garden. Somebody's watering them.",
        "Night's when the slugs come out. I have a word with them. Politely. They listen.",
        "Can't sleep? Count sheep. Or count bones. I've got two hundred and six. I always lose count.",
        "Lovely and quiet in the graveyard at night. Everyone's resting. Except me. And you.",
        "Hear that? That's the snails. Racing. My money's on the little one.",
      ],
      windows: {
        morning:
          "Morning, {name}! Dew's on the leaves and the beds want watering. Beautiful day for it.",
        afternoon: "Afternoon! Sun's high, so I'm in the shade. Well. I'm always a bit shady. Ha!",
        evening:
          "Evening! Beds are tucked in. Tools are put away. Mostly. There's a rake somewhere.",
      },
    },
    loves: ['hosta', 'snapdragon', 'spiderLilyBulb', 'pumpkinSoup', 'iris', 'sweetcorn'],
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
      sweetcorn: "Sweetcorn! I grew the corn maze, you know. I've been lost in it since Tuesday.",
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
    dropsBy: 'Mi amor. I let myself in. I basically live here. Also I was bored without you.',
    lines: {
      hello: [
        "Oh look, it's you. My favourite person in this whole town. Don't let it go to your head, babe.",
        `Everyone here calls me ${CODY_NICKNAME}. I did not ask for this. I also did not stop them.`,
        "I'm a vampire, babe. I don't do mornings. I barely do afternoons.",
        'You know what would be great right now? A burrito bowl. You know what else? You. But mostly the bowl.',
        'Hi, honey bunny. I was just walking past. For the fourth time. Total coincidence.',
        "Welcome to town, mi amor. I told everyone you're the best one here. They agreed. Some needed convincing.",
        "The cape? It's for flair. Vampires need flair. Also it's warm.",
        "{name}! Come here. Tell me my hair looks fine. It looks fine, right? Don't answer that.",
      ],
      friend: [
        'Barty says I have no heartbeat. Rude. It just skips one whenever you walk up.',
        'Rufus hugged me. I am covered in fur now. This cape was clean, booby.',
        "Did you do something new with your hair? …Of course you did. You always look good. It's annoying.",
        'Maude shushed me in the library again. I was only breathing. Loudly. On purpose.',
        'Saw the creeper behind a tree again. Wes. Moustache like a push broom. I waved. He hid harder.',
        "Agatha says I owe her three potions. I say two and a half. We're in negotiations, babe.",
        "Wrapunzel gave me a free croissant. She says I'm too thin. I'm a vampire, mi amor. It's the look.",
        "If you're going to Cobweb Corner, get me a squishy. Any squishy. I have a problem, babe, and I've made peace with it.",
      ],
      close: [
        "You're my orb, babe. Always have been.",
        "Honestly? The best thing about living forever is that you're in it.",
        "I'd give you my last burrito bowl. …Don't make me prove it.",
        "Mi amor. I was going to say something cool, and then you smiled, and now I've forgotten it.",
        "Honey bunny, you've made this whole town feel like home. Even the graveyard. Especially the graveyard.",
        "Forever orbs, {name}. That's not a line. That's a promise.",
        "I love you to the moon and back. The moon's far. I checked. Still worth it.",
        'Hold my hand a minute, booby. No reason. Okay, one reason: I like it.',
      ],
      night: [
        'Finally, the good hours. Snack run, babe? I carry, you pick.',
        "Night time. My time. Our time. The snack's around here somewhere.",
        'Look at the stars, mi amor. Not as bright as you. Hazel would argue. Hazel is wrong.',
        'The bats are out. They say hi. Well, they say eee. Same thing.',
        "Midnight pizza? Midnight pizza. I'm not asking. I'm announcing.",
        "Shh, honey bunny. Listen. That's Rufus howling at the moon. He's so proud of it.",
        'Still up, babe? Good. I was going to knock on your window and pretend to be a bat.',
        'Late walks with you are my favourite thing. Second favourite: burrito bowls. Close second.',
      ],
      windows: {
        morning:
          "Morning, babe. Why are we awake? Who decided mornings? I'd like a word with them.",
        afternoon:
          "Afternoon, booby. I've been up an hour. Very productive hour. Mostly lying down.",
        evening:
          "Evening, mi amor. The sun's going down, so I'm coming up. Let's do something fun.",
      },
    },
    loves: [
      'burritoBowl',
      'purseButter',
      'midnightPizza',
      'ghostChili',
      'fishChowder',
      'garlic',
      'avocado',
      'chipsAndGuac',
    ],
    likes: ['snack', 'treat', 'record', 'squishy'],
    reactions: {
      loved: "Babe. …Babe. You shouldn't have. Okay, you should have. Thank you.",
      liked: "Aw, for me? I'll pretend I'm not touched. I'm touched.",
      fine: "Thanks, honey bunny. I'll put it with my stuff. My stuff is mostly your stuff anyway.",
    },
    says: {
      burritoBowl: 'chipotle is mah liiiiffeee',
      purseButter: "Purse butter! See? I told you. That's exactly what it is.",
      ghostChili: 'You made me chili? Booby. Marry me. …Oh wait. Best day ever, again.',
      garlic:
        'Garlic! Vampires love it, actually. That rumour was started by people who wanted it all to themselves.',
      chipsAndGuac: 'Chips and guac, after dark? Honey bunny. You are my whole midnight.',
    },
    bracelet: "You're my orb.",
    favours: [
      {
        item: 'burritoBowl',
        count: 1,
        ask: "Mi amor. I'm starving. Could you grab me {what}? I'd go, but… sunlight.",
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
      "*pfft* …Vampires don't do that. You didn't hear anything, honey bunny.",
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
        letter: "Honey bunny,\n\nNow we match. Don't make it weird.\n\n(Make it weird.)\n\n— Cody",
        gift: { outfit: 'maroonTee' },
      },
      {
        hearts: 10,
        letter:
          "Mi amor,\n\nA portrait, so you can see me even when I'm out. You're welcome. Rufus made " +
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
        "I'll learn your mailbox by heart by Friday, {name}. I learn all of them by heart. I'm very romantic about post.",
        'If a letter ever comes for you soggy, blame Nessa. She reads over my shoulder.',
        'Nice to meet you! Well, nice to deliver you. I mean meet! I mean both!',
        "The town's letters come to me from the mayor's office. I've never seen the mayor. Just the envelopes.",
      ],
      friend: [
        '{name}! I know every mailbox in town by heart now. Yours has a heart on it. My favourite.',
        `${CODY_NICKNAME} sends himself fan mail. I'm not supposed to say. I've said.`,
        'Before here I did the post somewhere very ordinary. Nobody waved. Here even the letters wave.',
        "Agatha's owl tried to take my job on my first day. We've come to an arrangement.",
        "Hazel posts letters to the stars. I haven't the stamps for that yet. I'm saving up.",
        'Parcel got a puncture on the way up to the castle. Gourdon fixed it with a pumpkin stem. Rides better now.',
        'Wes gets letters, you know. No return address. I leave them behind trees. They go.',
        "Rufus waits by the well for me every morning. He doesn't get post. He just likes the bell.",
      ],
      close: [
        "I'd carry a letter anywhere for you, {name}. Up the lookout, across the lake. Well. Round the lake.",
        "I came here for a quiet round and found a home. {name}, that's mostly your fault.",
        "If you ever want to write to someone, I'll take it. First class. My fanciest stamp.",
        "I've delivered thousands of letters, {name}. Yours are the ones I deliver fastest. Don't tell anyone.",
        "If you're ever missing someone, write it down. I'll get it there. That's what post is for.",
        'You make the round feel like a stroll with a friend. The best kind of round.',
        "I've a spare stamp with a little bat on it. I've been saving it for something special. It's yours.",
        "{name}, home's not an address. It's the folk at the end of the round. You're one of mine.",
      ],
      night: [
        'Late round, {name}! Moth mail. They write very small letters.',
        'Night post is my favourite. The lanterns do the looking for me.',
        "Last letter of the night! It's for the moon. Return to sender, probably.",
        "Parcel's lamp is on. We're doing the lantern round. The lanterns get very excited about post.",
        "Quiet night on the round. Just me, Parcel and the owls. The owls think they're helping.",
        "I sort letters by starlight. It's very romantic. It's also very slow.",
        "You're up late, {name}! Nothing for you tonight, but I'll check again. And again.",
        'Night post is magic. Letters get there before you wake up. Well, I get them there. On a bicycle.',
      ],
      windows: {
        morning:
          "Morning, {name}! Fresh bag of post and a fresh pair of legs. The legs won't last.",
        afternoon:
          "Afternoon round! Parcel wants a rest by the well. So do I. So we're having one.",
        evening:
          "Evening, {name}! The round's done. Now I read the postcards. Not yours. Not properly.",
      },
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
    wrote:
      "Dear {name},\n\nHello from your new neighbour! I'm Ollie, the town's new postie, and I'm " +
      "moving into the little red cottage by the south road tomorrow. I'll be the one bringing " +
      "your letters from now on, so if any come a bit crumpled, that's the bicycle.\n\nSee you " +
      'tomorrow!\nOllie',
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
        "I don't come up the bank very often. It's nice up here. Dry. Very dry. Hm.",
        "If you'd like to sit by the lake, you can. I won't splash. I'll try not to splash.",
        "The lanterns are mine to look after. It's a big job. There are a lot of lanterns.",
        "Sorry, I'm not good at hellos. I'm better at waves. Here. *waves*",
      ],
      friend: [
        '{name}! I found you the smoothest stone in the lake. I checked all of them. It took a while.',
        'Rufus tried to swim out to say hello. I carried him back. He said it was the best day of his life.',
        "Wrapunzel taught me to make tea on land. It's much hotter than lake tea. I like it.",
        'The blue moonfish only comes up when everything is very quiet. Like me.',
        'Ollie brings my post in a little boat now. I told him I could just swim up. He likes the boat.',
        "I lent Agatha a bucket of lake water for a potion. She said it was 'full of character'. It had a frog in it.",
        "Hazel says the lake is a mirror for the stars. I've never looked up. Down's where the stars are, for me.",
        'Have you seen the glowing jellyfish? They come up very late. Like tiny lanterns that forgot their strings.',
      ],
      close: [
        "{name}, I was so shy of the town. Now I'd walk right up the main road for you. Dripping, but I would.",
        "You're the first friend I've told my whole name to. It's much longer. It's mostly bubbles.",
        'When I light the lanterns, I light one for you first. It bobs the most.',
        "I used to hide under the lake all day. Now I come up hoping you'll be by.",
        "You don't mind that I'm a monster. I don't mind that you're dry. We're a good pair.",
        "When you smile, {name}, the whole lake goes still to look. I've seen it.",
        "I'd share the bottom of the lake with you if you could breathe down there. It's very cosy.",
        "You're my favourite thing on land. The moon carp know. I talk about you a lot. They're sick of it.",
      ],
      night: [
        "The lanterns are lit, {name}. Aren't they pretty on the water?",
        "Night is when the lake talks. Listen. It's saying hello to you.",
        "The lake is darkest just before the lanterns. Then it's the brightest. Like you walking up.",
        "The moon carp are singing. You can't hear it. I'll hum it. Hmmm-mmm. That's the carp.",
        "I like the night. Nobody's startled by a big head coming out of the water. Much.",
        "Look, {name}. The lanterns and the stars are both on the water. You can't tell which is which.",
        'Sometimes I float on my back and count the stars. I get to about nine and fall asleep.',
        "It's so still tonight. Even the ripples are whispering.",
      ],
      windows: {
        morning: "Morning… The lake's all misty. I like it. Nobody can see me blush.",
        afternoon: "Afternoon. I'm drying off on the pier. It never works. I like trying.",
        evening:
          'Evening, {name}. Time to light the lanterns. Do you want to watch? You can watch.',
      },
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
    wrote:
      "Dear {name},\n\nI'm Nessa. I live in the lake at Lantern Shore. Well, I did. The water is " +
      "lovely, but it's very hard to keep a kettle going. So I've built a little boathouse on the " +
      "shore, and I'm moving in tomorrow, if that's all right.\n\nI'll light the lanterns for " +
      'you every night.\n\nShyly,\nNessa',
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
        'Need a chair mending? Table? Door? Bring it by. Bring the bits. All the bits.',
        "Got my candle lit. Means I'm open for business. Or thinking. Same light.",
        "Folks ask if I'm a pumpkin. I say I'm a carpenter. The pumpkin's just the hat.",
        "Welcome to town. Sturdy place. I've checked most of the steps.",
      ],
      friend: [
        "{name}! Built a birdhouse for Agatha's owl. He's moved in. Pays me in feathers.",
        "Barty and I have an understanding. He grows the pumpkins, and I don't ask about my cousins.",
        `${CODY_NICKNAME} wanted a coffin with cup holders. I've built stranger. Not much stranger.`,
        "When I light up at night, that's just me thinking. Big head. Lots of room for thinking.",
        'Rufus chewed a chair leg. Said sorry. Chewed the other one. Said sorry again. Good lad.',
        'Built a bench by the pond. Maude sits on it. Floats just above it, really. Still counts.',
        "Barty's grown me a new head for next year. Said it's handsome. I'll be the judge. It is.",
        "Wes asked for a bigger tree to hide behind. I said I don't build trees. He seemed let down.",
      ],
      close: [
        '{name}, most folks see a pumpkin. You see a fella. That means the world to a gourd.',
        "I'd build you anything. A shelf, a swing, a bridge to the moon. That last might take a while.",
        "My grin's carved, {name}, but I'd be smiling anyway when you're about.",
        "Built you something. It's a little box. For keeping good days in. You've given me plenty.",
        "Not much for words, me. But you're solid, {name}. Like oak. A good 'un.",
        "My candle burns brighter when you come by. That's not a figure of speech. It's the draught.",
        "{name}, if this town's a house, you're the bit that holds it up. The beam. Best bit.",
        'Carved a new smile this morning. Wider than the old one. Guess why.',
      ],
      night: [
        'Evening, {name}! Lit up with a fresh candle. Mind the moths, they like me.',
        'Nights like this I sit out on the step and glow a bit. Very restful.',
        'Glowing like a lantern tonight. The moths have found me. Hello, moths.',
        'Good night for whittling. Quiet. Just me, the knife and a bit of wood that wants to be a duck.',
        "Late, isn't it? Candle's burning low. Still plenty of think left in it.",
        'Walked the square at midnight. Checked every bench. All sturdy. Sleep well, benches.',
        "Stars are out. Hazel says one's shaped like a hammer. I've looked. It is.",
        "Owls keep landing on my head. Suppose it's the warmth. Don't mind. Company.",
      ],
      windows: {
        morning: 'Morning. Sawdust and sunshine. Best start to a day there is.',
        afternoon: 'Afternoon. Measure twice. Lunch once. Back to it.',
        evening: "Evening. Candle's lit. Tools are away. Mostly. Might do one more chair.",
      },
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
    wrote:
      'Dear {name},\n\nGourdon here. Carpenter. I build things out of wood, and I grow my own ' +
      "head, so you could say I'm handy all over. I'm moving into the pumpkin on the east side " +
      'tomorrow. Yes, the house is a pumpkin. It seemed right.\n\nYours, with a big grin ' +
      '(carved),\nGourdon',
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
        "My observatory's up in the woods, where the trees open. Best view in town. Of up.",
        "I'm usually up all night, so if I yawn, it's not you. It's never you.",
        "Have you ever seen a shooting star? Make a wish. Not out loud. They're shy.",
        "I've got a telescope that can see the castle from the woods. And the castle can see me. I wave.",
      ],
      friend: [
        "{name}! I named a star after you. It's the one next to the one I named after Rufus. He howled.",
        "Agatha and I argue about the moon. She says it's a spell. I say it's a rock. We're both a bit right.",
        "Maude reads me ghost stories while I watch the sky. The stars don't mind.",
        'On a clear night you can see the castle from my roof. And sometimes a very large moth.',
        'Rufus asked me which star is the moon. I told him the moon. He was thrilled.',
        "Ollie brings me letters at dawn. I'm just going to bed. We have a lovely chat in the middle.",
        'Nessa says the stars live in the lake. I say they live in the sky. They visit the lake. We agree.',
        "Gourdon built me a stool for the telescope. It's the perfect height. He measured me asleep.",
      ],
      close: [
        '{name}, I came for the dark skies. I stayed for the company. Mostly yours.',
        "If you ever feel small, look up. Then look at me waving. You're not small here.",
        "I'd give you a star if I could, {name}. I've given you three already. On paper, but still.",
        "I've charted every star over McFrancisVille, {name}. None of them twinkle like you do.",
        "You make the nights feel shorter. That used to be a bad thing. Now it's lovely.",
        'When I look through the telescope, I look for the lights of your house first. Then the stars.',
        "If you were a star, you'd be the one sailors steer by. The steady, bright one.",
        "I found a comet. I'm allowed to name it. I've already written your name on the chart. In pen.",
      ],
      night: [
        "Look, {name}! There. That one's winking. It likes you.",
        "Best time of night. The telescope's warm and the sky's wide open.",
        "It's properly dark now. Come and look. That one's Barty's. It rattles. It doesn't. It twinkles.",
        "The moon's so close tonight I could nearly tap it. I won't. It's been through enough.",
        'A shooting star! Did you see? I wished for another. Here it comes. Oh. That was a bat.',
        "Clear skies, warm cocoa, a friend. That's the whole recipe for a good night.",
        "Agatha's broom went past the moon an hour ago. On its own. I've logged it.",
        "Every night the sky's a little different. So's the town. Every night, a bit better.",
      ],
      windows: {
        morning: "Morning? Already? I've only just said goodnight to the last star.",
        afternoon: "Afternoon… Sorry. I'm usually asleep now. I'm up for you. Well done.",
        evening: "Evening, {name}! The first star's out. I always say hello to it. Hello, star.",
      },
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
    wrote:
      'Dear {name},\n\nMaude and I have written to each other for years. She says McFrancisVille ' +
      'has the darkest skies and the kindest people, and she is never wrong about either. So ' +
      "I'm coming! My little observatory goes up in Whisperwood tomorrow, where the trees open " +
      'to the sky.\n\nLooking up,\nHazel',
  },
  boothoven: {
    name: 'Boothoven',
    creature: 'ghost composer',
    schedule: {
      weekday: [
        // Composing at the piano all morning, out to hear the town at noon, and the fountain at dusk.
        { from: 5, inside: 'boothovenParlour' },
        { from: 9, inside: 'boothovenParlour', stand: 1 },
        { from: 12, at: 'bySalonCorner' },
        { from: 18, at: 'pondNorthEast' },
        { from: 22, inside: 'boothovenParlour', stand: 2 },
      ],
      weekend: [
        { from: 5, inside: 'boothovenParlour', stand: 1 },
        { from: 10, at: 'bySalonCorner' },
        { from: 15, at: 'pondNorthEast' },
        { from: 19, inside: 'boothovenParlour' },
        { from: 23, at: 'pondNorthEast' },
      ],
    },
    dropsBy:
      "{name}! I was passing and I heard your house humming. It's in G. Mind if I listen a while?",
    lines: {
      hello: [
        'Boothoven. Composer. Ghost. In that order, most days. Delighted, {name}. Truly. Fortissimo.',
        "I've written nine symphonies. Well, eight and a half. The ninth keeps haunting me.",
        'Every house in town hums a different note, you know. Yours is a warm one. A nice G.',
        "Forgive the hair. It does this when I'm composing. I'm always composing.",
        'I tried to write a quiet piece once. Pianissimo, start to finish. I fell asleep. Lovely piece.',
        '{name}, the town has a rhythm. The well drips in three-four. The bats flap in common time.',
        "If you hear a piano at three in the morning, that's me. If it's in tune, that's also me.",
        "I've been dead two hundred years and I still can't find a pencil when I need one.",
      ],
      friend: [
        "{name}! I've written you a little tune. It's eight notes. Seven of them are your name.",
        'Maude lets me read sheet music in the library after hours. She says I hum. I do hum.',
        "Rufus howls in perfect pitch. I've told him. He howled about it. Still perfect.",
        "Cody asked me to write him a love song. I asked who for. He said, 'Obviously her.' Obviously.",
        "Agatha's cauldron bubbles in a minor key. Very moody. I've written it a little waltz.",
        'Barty plays the xylophone on his own ribs. I keep meaning to tell him he is very good.',
        'Wrapunzel bakes to music. Pastry likes a slow tempo. Bread prefers a march.',
        'Ollie hums the post round. Same tune every day. I think he made it up. I think it is a hit.',
        "Hazel says the stars have a sound. I listened all night. I think she's right. B major.",
        "Nessa sings on the lake at dusk. I've been writing down what she sings. Don't tell her.",
        'Gourdon tunes my piano stool by ear. He knocks it till it sounds right. It works!',
      ],
      close: [
        '{name}, I came for the quiet. I stayed for the music, and the music, it turns out, is you.',
        "I've written a symphony with a part for you. It's the bit where everyone smiles.",
        "Two hundred years of composing, and the best tune I've heard is your laugh. Don't laugh. Oh, go on.",
        "When I can't find the next note, I think of you, and there it is. Every time.",
        "You make the whole town sound in tune, {name}. I'd know. I've checked every house.",
        "I used to play to empty rooms. Now I play to you. It's a much better audience.",
        'If my life were a piece of music, and it was, this bit would be the encore.',
        "Whatever you're humming, {name}, keep humming it. I'll write the rest around it.",
      ],
      night: [
        'Night is the best time for music, {name}. Everyone else is quiet, so the stars can hear.',
        'Listen. The crickets are tuning up. Any minute now. There! Lovely. A touch sharp.',
        "The fountain plays a little tune after dark. I'm writing it a second verse.",
        "I'm off to the piano. Something's come to me. It goes like this: hmm hm hmmm. You'll see.",
        '{name}, the moon is a whole note. Round, and held a long, long time.',
        "Ghosts don't sleep. We compose. Sometimes we do both, and that's how you get lullabies.",
        "That owl's been hooting the same two notes all night. I've given it a third. It's thrilled.",
        "Goodnight, {name}. Or good evening. Or good adagio. It's all the same tempo to me.",
      ],
      windows: {
        morning:
          "Good morning, {name}! I've been up since five. Well, I'm always up. I've written a sunrise.",
        afternoon: "Afternoon, {name}! The town's at its busiest now. Allegro. Listen to it go.",
        evening: "Good evening, {name}. The light's going all soft and andante. My favourite.",
      },
    },
    loves: ['moonflower', 'moonflowerTea', 'recordFleetwoodMacabre'],
    likes: ['record', 'bead'],
    reactions: {
      loved: "Oh, {name}! It's perfect. I'll play it something in return. Bravo, bravissimo!",
      liked: "How lovely! I'll keep it on the piano, where it can hear everything.",
      fine: 'Thank you, {name}! It shall have a place of honour. Somewhere between the metronomes.',
    },
    says: {
      moonflower:
        'A moonflower! It opens at night, like a good overture. I shall put it on the piano.',
    },
    favours: [
      {
        item: 'wood',
        count: 4,
        ask: 'My piano bench creaks in B flat, and the sonata is in C. Could you bring me {what} to mend it?',
      },
      {
        item: 'stone',
        count: 3,
        ask: "{name}, I'm writing a tune for the fountain. Could you bring me {what} to drop in, to hear what note the water sings?",
      },
      {
        item: 'moonflower',
        count: 1,
        ask: "There's a song in a moonflower, if you listen closely. Could you find me {what}?",
      },
    ],
    thanks: 'Bravo, {name}! Bravissimo! That deserves a standing ovation. Here, for your trouble.',
    puffs: [
      '*pfft* …A tuba. Somewhere. Very distant. Not me. Well. Me.',
      '*pfft* …Ah. A grace note. Excuse me, {name}. Ghosts are mostly air, you understand.',
    ],
    rewards: [
      {
        hearts: 3,
        letter:
          "Dear {name},\n\nI've pressed my newest piece onto a record for you, the Boonlight " +
          "Sonata. It's slow and soft and full of moonlight, and I wrote it thinking of you. Play " +
          'it on a quiet night.\n\nYours, in three-four time,\nBoothoven',
        gift: { item: 'recordBoonlightSonata' },
      },
      {
        hearts: 6,
        letter:
          'Dear {name},\n\nMy old metronome. It has kept time for every piece I ever wrote, and ' +
          "it's very good at it, if a little bossy. Let it keep yours. Tick, tock.\n\nYours, " +
          'allegretto,\nBoothoven',
        gift: { furniture: 'metronome' },
      },
      {
        hearts: 10,
        letter:
          "Dear {name},\n\nI've copied out the plans for a piano, every string and hammer, and " +
          'folded them in here. Build one at your workbench, and play it every day. If you have ' +
          'one already, build another: a house can never have too much music.\n\nYours, ' +
          'fortissimo, forever,\nBoothoven',
        gift: { recipe: 'piano' },
      },
    ],
    wrote:
      "Dear {name},\n\nI've heard such things about McFrancisVille: the bats keep time, the well " +
      'drips in three-four, and the people are kind. A composer needs a town like that. So I am ' +
      "coming! My piano and I move in tomorrow, by the square, east of the salon. There'll be " +
      'a little welcome party round the well the evening after. Do come.\n\nYours, con brio,\n' +
      'Boothoven',
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
