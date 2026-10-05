import type { VillagerId } from '../types/ids';

/**
 * Ollie's catalogue (0.3's S1): everything she has ever had that could come twice, ordered at his
 * counter and brought round next morning in her mailbox, a letter from him with it.
 */

/** Who brings an order round, and writes the letter it comes with. */
export const DELIVERER: VillagerId = 'ollie';

/** The catalogue's kinds, in the order the sheet shows them. */
export type CatalogueGroup =
  'furniture' | 'squishy' | 'doll' | 'record' | 'clothes' | 'surfaces' | 'pets';

export const CATALOGUE_GROUPS: readonly { id: CatalogueGroup; label: string }[] = [
  { id: 'furniture', label: 'Furniture' },
  { id: 'squishy', label: 'Squishies' },
  { id: 'doll', label: 'Dolls' },
  { id: 'record', label: 'Records' },
  { id: 'clothes', label: 'Clothes' },
  { id: 'surfaces', label: 'Walls & floors' },
  { id: 'pets', label: "Pets' things" },
];

/** What Ollie says over his counter as the catalogue opens. */
export const CATALOGUE_GREETING =
  "Anything you've ever had, I can get you another! Order today, and it's in your mailbox in the morning.";

/**
 * Ollie's letters with an order, by what kind of thing came, one dealt by the order's number.
 * `{name}` is filled in as any letter's is.
 */
export const DELIVERY_LETTERS: Record<CatalogueGroup, readonly string[]> = {
  furniture: [
    "Dear {name}, your order! Parcel and I carried it up the hill between us. Mostly Parcel. I've popped it in your storage chest so it doesn't get rained on. Love, Ollie",
    "{name}! Special delivery, and I do mean special: I tied the bow myself. It's waiting in your storage chest. Sign here. Only joking, there's nothing to sign. Ollie",
    "Good morning, {name}! One parcel, delivered with care and only one wobble on the bridge. It's tucked in your storage chest. Your mailbox and I are great friends now. Ollie",
  ],
  squishy: [
    "Dear {name}, this one squeaked the whole way round my route. I think it's pleased to be yours. It's in your bag. Love, Ollie",
    '{name}! Your squishy, safe and sound. I gave it a little squeeze to check. Strictly for quality. Ollie',
  ],
  doll: [
    "Dear {name}, your doll rode in Parcel's basket and waved at everyone we passed. It's in your bag now. Love, Ollie",
    "{name}! One monster doll, delivered. It stared at me the whole way. In a friendly way, I'm nearly sure. Ollie",
  ],
  record: [
    "Dear {name}, your record! I held it very flat the whole way, like a pancake made of music. It's in your bag. Love, Ollie",
    "{name}! A record for you. I didn't play it first. I hummed what I thought it might sound like. Enjoy! Ollie",
  ],
  clothes: [
    "Dear {name}, your order, folded with my very best folding. It's hanging in your closet now. Love, Ollie",
  ],
  surfaces: [
    "Dear {name}, one roll, delivered. I didn't unroll it to peek. Well, a little. It's lovely. Ollie",
  ],
  pets: [
    "Dear {name}, something for one of your pets! I'd say which, but they'd only argue. Love, Ollie",
  ],
};
