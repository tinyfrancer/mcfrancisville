import type { VillagerId } from '../types/ids';
import type { ItemRow } from './items';

/*
 * A ride on the big wheel (1.6's X2, decision 381): once round, slowly, in a car of her own or
 * with whoever she knows at the fair, a stop at the very top, and a ticket stub the first time.
 * The ride is drawn on its sheet's stage (`render/fairRide.ts`); the rules are `systems/fairRide.ts`.
 */

/**
 * How a ride goes, ms: up the near side, a stop at the top while whoever is with her says
 * something, and down the far side. One slow turn, about as long as the wheel takes in the world.
 */
export const RIDE = { up: 8000, top: 5000, down: 8000 } as const;

export const RIDE_MS = RIDE.up + RIDE.top + RIDE.down;

/** A ride after the day's first, in Candy; the day's first is always free. */
export const RIDE_COST = 10;

/**
 * What each neighbour says at the top, three each, one dealt a ride. Cody's are about the view
 * and her; `{name}` is hers. Nobody is afraid of heights here, except, a little, the mayor.
 */
export const RIDE_LINES: Record<VillagerId, readonly [string, string, string]> = {
  maude: [
    "Shh, listen. Up here the whole town is as quiet as my library. Nobody's shushing anyone, {name}!",
    "I can see the graveyard from here. Everybody's asleep. How lovely for them.",
    "I float about this high every night, you know. It's much nicer with company.",
  ],
  rufus: [
    "I can see my flower shop! And all my roses! Hi, roses! …They can't hear me. Can they?",
    "My ears are flapping. Are my ears flapping? Don't look at my ears, look at the view!",
    'If I howl up here, does it count as howling at the moon? Just a little one. Awoo.',
  ],
  wrapunzel: [
    'Ooh, my wraps are fluttering. I feel like a kite! A kite that bakes!',
    'From up here the bakery chimney looks like a little candle. I hope I left it lit, dear.',
    "Hold on to me, {name}, it's breezy. No, really, hold on, I'm coming unwound.",
  ],
  agatha: [
    "I didn't need the crystal ball for this one. I saw us up here days ago. The view's even better.",
    "You can see every rooftop I've ever flown over. It's prettier when you're sitting still.",
    "The stars are close tonight. Don't tell them, but I think they're showing off for you.",
  ],
  barty: [
    "Rattle rattle! That's my knees. Not scared. Just… rattly. It's a lovely view!",
    'I can see my vegetable patch! Every row as straight as a femur. Beautiful.',
    "Up here I feel ten feet tall. I'm usually only about five-foot-bones.",
  ],
  cody: [
    "The whole town's down there, babe, and I'm still only looking at you. Is that weird? It's a little weird.",
    "Look, mi amor, there's your house. Our house. With the light on. That's my favourite spot in the whole view.",
    "I was going to say the view's beautiful, honey bunny, but you're in the way. In a good way.",
  ],
  ollie: [
    'I can see every mailbox from here! Fourteen, fifteen… yours has the best flag, {name}.',
    "Ooh, the post office roof needs sweeping. I'll do it tomorrow. Tonight I'm on my holidays.",
    'Do you think if I wrote a letter to the moon, it would write back? It looks so close from here.',
  ],
  nessa: [
    'The lake looks like a little puddle from up here. My little puddle! Hi, home!',
    "I can see where I skate in winter. And where I fell over that one time. Don't look there.",
    "It's like being on my tiptoes in the deep end, {name}, only drier. I love it.",
  ],
  gourdon: [
    "Sturdy, this wheel. Good joints. I checked them, mind. Couldn't help myself.",
    'See that roof down there? I fixed that roof. And that one. And that porch. Proud of every one.',
    "My candle's flickering in the breeze. Don't worry, {name}, I'm a pumpkin. I always keep my cool.",
  ],
  hazel: [
    "Look up, {name}, not down! Every star's a little nearer at the top of the wheel.",
    "If you squint, the town's lights look like a constellation. I'll call it the Little Town.",
    "This is the best seat in the house for the sky. I'd bring my telescope, but you're better company.",
  ],
  boothoven: [
    'Listen to the fair from up here: a waltz in three-four, every stall a note. Magnificent.',
    'I shall write a piece about this. Andante, at the top. With a little ritardando for the view.',
    "The whole town is humming, {name}. Can you hear it? It's in a very happy key.",
  ],
  scarah: [
    "I've stood in a field my whole life looking up. Looking down is a lovely change!",
    "The crows would love this. They'd want to perch on every car. I'm glad they're not, though.",
    'Look at Boo Acres, all the rows like stitches in a quilt. Mine, all mine. And yours!',
  ],
  robBoo: [
    "Oh dear, oh my, how high we are. …It's wonderful. I'm not even wobbling. Much.",
    "That's my whole town, {name}. Well, everyone's. From up here it looks very well run.",
    "I could make a speech from up here! …No. No, I'll just look. It's a better speech than mine.",
  ],
};

/**
 * Alone, a little brass plaque in the car says it for the mayor's office, one dealt a ride.
 * The mayor writes them whether she has met him yet or not: he writes everything.
 */
export const MAYOR_VIEW: readonly string[] = [
  "A brass plaque in the car reads: 'The view from the top is the whole town. Please wave. The town will wave back. — The Mayor'",
  "A brass plaque in the car reads: 'You are now the tallest person in McFrancisVille. Congratulations. — The Mayor'",
  "A brass plaque in the car reads: 'Every light down there is somebody glad you're here. — The Mayor'",
];

/** The ticket stub, hers to keep from her first ride. */
export const TICKET_ITEMS = {
  ticketStub: {
    name: 'Big wheel ticket stub',
    kind: 'keepsake',
    plural: 'ticket stubs',
    description:
      'A little striped ticket from your very first ride on the big wheel, torn along the dotted line. ADMIT ONE (OR TWO, CUDDLED UP).',
  },
} as const satisfies Record<'ticketStub', ItemRow>;

export const TICKET_VALUES = { ticketStub: 0 } as const;
