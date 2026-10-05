import type { Tile } from './maps';
import type { LostId, VillagerId } from '../types/ids';

/**
 * The town's small events (phase S2), one a window: a neighbour with a bit of news, or something
 * one of them has lost somewhere in town. `{name}` is her name; `{where}` is where the lost thing
 * is, as the neighbour remembers it ("by the willow").
 */

/** A bit of news a neighbour can't wait to tell her. */
export interface News {
  who: VillagerId;
  line: string;
}

export const NEWS: readonly News[] = [
  {
    who: 'maude',
    line: 'Big news, {name}! A book came back to the library all by itself. It had been out since 1887. It said sorry.',
  },
  {
    who: 'maude',
    line: 'Have you heard? The moths have started a choir. They only sing at the lanterns, and very softly.',
  },
  {
    who: 'rufus',
    line: "NEWS! I found a stick that's shaped exactly like another stick! I'm keeping both!",
  },
  {
    who: 'rufus',
    line: "Guess what! A frog sat on my head all morning. I think we're friends now. I've named him Kevin Two.",
  },
  {
    who: 'wrapunzel',
    line: 'Such news, dear: someone asked for a cake shaped like a coffin shaped like a cake. I rose to it.',
  },
  {
    who: 'wrapunzel',
    line: "The museum had a visitor at midnight, and nobody was there. The guest book says 'lovely', in very old writing.",
  },
  {
    who: 'agatha',
    line: 'A little bird told me something, {name}. Well, a bat. The mayor has bought a new hat. Theories to follow.',
  },
  {
    who: 'agatha',
    line: "My cauldron blew a perfect smoke ring this morning. It's never done that. I'm choosing to be proud.",
  },
  {
    who: 'barty',
    line: "You'll never guess! A pumpkin in the graveyard garden grew a face all on its own. It's smiling.",
  },
  {
    who: 'barty',
    line: "News from the shed: the spiders have spun a web shaped like a heart. I'm not moving the rake till they're done.",
  },
  {
    who: 'cody',
    line: 'Babe. News. Somebody left one sock on the well. It has been there all day. I have questions.',
  },
  {
    who: 'cody',
    line: "Babe. The Moon Pie Man waved at me. I waved back. We're friends now, I think. Don't tell him I said so.",
  },
  // Scarah's (0.3's F3), from Boo Acres.
  {
    who: 'scarah',
    line: '{name}, news from the farm! A sunflower grew taller than the barn overnight. Cornelius has moved in at the top.',
  },
  {
    who: 'scarah',
    line: "Guess what! The barn owl laid an egg in my hat. I'm wearing it very, very carefully today.",
  },
];

/** Something a neighbour has lost, what they say about it, and how it turns up. */
export interface LostRow {
  who: VillagerId;
  /** What it is, as she'd say it: "Maude's reading glasses". */
  thing: string;
  /** How they ask after it. */
  ask: string;
  /** What she thinks as she picks it up. */
  found: string;
  /** How they take it back. */
  thanks: string;
}

export const LOST: Record<LostId, LostRow> = {
  readingGlasses: {
    who: 'maude',
    thing: "Maude's reading glasses",
    ask: "{name}, have you seen my reading glasses? I think I put them down {where}. I can't read a word without them. Well, I can. I just prefer to.",
    found: "Maude's reading glasses, folded neatly on the grass. She'll be glad of these.",
    thanks: 'My glasses! Oh, thank you, {name}. Now I can see you properly. Lovely as ever.',
  },
  tennisBall: {
    who: 'rufus',
    thing: "Rufus's ball",
    ask: "I lost my ball! My favourite one! It's green and a bit chewed and I think it's {where}!",
    found: "Rufus's ball, green and a bit chewed. Very, very loved.",
    thanks:
      "MY BALL! You found my BALL! You're the best, {name}! I'm going to chew it to celebrate!",
  },
  rollingPin: {
    who: 'wrapunzel',
    thing: "Wrapunzel's rolling pin",
    ask: "I've mislaid my rolling pin, dear. It's three thousand years old and it rolls a little to the left. I last had it {where}.",
    found: "Wrapunzel's rolling pin. It rolls a little to the left.",
    thanks: "My rolling pin! Bless you, dear. Tonight's pastry thanks you, and so do I.",
  },
  hatPin: {
    who: 'agatha',
    thing: "Agatha's hat pin",
    ask: 'My hat pin has gone walkabout, silver with a little moon on it. It likes to see the town. Try {where}.',
    found: "Agatha's hat pin, silver with a little moon. It looks pleased with itself.",
    thanks: 'There you are, you little wanderer. Thank you, {name}. I owe you a very small favour.',
  },
  fingerBone: {
    who: 'barty',
    thing: "Barty's little finger",
    ask: "Bit embarrassing, this. I've lost my little finger. It'll be {where}, waving, probably.",
    found: "A little finger bone, waving cheerfully. That'll be Barty's.",
    thanks:
      "There it is! Pop it on, right there. Good as new. Cheers, {name}, you're a proper mate.",
  },
  sunglasses: {
    who: 'cody',
    thing: "Cody's sunglasses",
    ask: "Babe. I've lost my sunglasses. Vampire. Daytime. You see the problem. I had them {where}.",
    found: "Cody's sunglasses. Very dark. Very dramatic.",
    thanks: 'My shades. Babe. You saved my whole afternoon. And my face.',
  },
  // Boothoven's (0.2's L1), lost only once he lives here.
  lostNote: {
    who: 'boothoven',
    thing: "Boothoven's lost note",
    ask: "{name}, a page of my new piece has blown away! The one with the best note on it. I think it's {where}.",
    found:
      "A page of music, every note in pencil, and one of them circled three times. Boothoven's.",
    thanks:
      "My note! The best one! Oh, {name}, the whole piece was missing its middle. Now it's got one. Bravo!",
  },
};

export const LOST_IDS = Object.keys(LOST) as LostId[];

/** Where a lost thing turns up in town, and where its owner remembers having it. */
export const LOST_SPOTS: readonly { at: Tile; where: string }[] = [
  { at: { tx: 22, ty: 37 }, where: 'by the willow' },
  { at: { tx: 5, ty: 39 }, where: 'in the graveyard garden' },
  { at: { tx: 32, ty: 40 }, where: 'down by the pond' },
  { at: { tx: 17, ty: 13 }, where: 'by the farm gate' },
  { at: { tx: 5, ty: 29 }, where: 'in the west meadow' },
  { at: { tx: 32, ty: 2 }, where: 'up at the lookout' },
  { at: { tx: 38, ty: 26 }, where: 'in the east meadow' },
  { at: { tx: 24, ty: 32 }, where: 'along the avenue' },
];

/** What handing a lost thing back brings: a little Candy, and a little friendship. */
export const LOST_CANDY = 40;
export const LOST_POINTS = 20;
