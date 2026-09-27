import type { AccessoryId, PetId } from '../types/ids';

/**
 * Their six real pets (personal_touches.md, "The pets"; decisions.md 17). Florence, Fibi, Dolly
 * and Gary are themselves; Wybie and Elvira have passed, and are here as gentle ghost pets, never
 * sad. Each is hers from the first day, and lives at home until she takes one for a walk.
 */
export interface PetRow {
  /** Their real name, which she can change. */
  name: string;
  /** What they are, as the pet sheet says under their name. */
  what: string;
  /** Translucent and softly glowing (decisions.md 17). */
  ghost: boolean;
  /** How fast they trot after her, in tiles a second. She walks at four. */
  speed: number;
  /** What happens when she pets them; one a pat, round and round. `{name}` is theirs. */
  pats: readonly string[];
}

export const PET_IDS: readonly PetId[] = ['florence', 'fibi', 'dolly', 'gary', 'wybie', 'elvira'];

export const PETS: Record<PetId, PetRow> = {
  florence: {
    name: 'Florence',
    what: 'Peach sphynx cat. Mostly asleep.',
    ghost: false,
    speed: 4.5,
    pats: [
      '{name} opens one eye, purrs like a little engine, and goes straight back to sleep.',
      "{name} is warm as toast under her blanket. She'd like it tucked in, please.",
      '{name} stretches one paw out from under the blanket, then thinks better of it.',
    ],
  },
  fibi: {
    name: 'Fibi',
    what: 'Black German shepherd. Loses her bones.',
    ghost: false,
    speed: 4.5,
    pats: [
      '{name} whines happily and leans her whole weight on your legs. (She smells a bit.)',
      '{name} whines. It means "more pets". It always means "more pets".',
      '{name} rolls over for belly rubs, whining the entire time. A little stink drifts by.',
    ],
  },
  dolly: {
    name: 'Dolly',
    what: 'Black standard poodle. Brave, from behind you.',
    ghost: false,
    speed: 4.5,
    pats: [
      '{name} wiggles all over. She barked at a leaf earlier and is very proud of herself.',
      '{name} boops your hand with her nose, then checks nobody scary is watching.',
      '{name} leans in for scritches behind the ears, bandana and all. What a good girl.',
    ],
  },
  gary: {
    name: 'Gary',
    what: 'Snail. Barely alive, and happy about it.',
    ghost: false,
    speed: 0.8,
    pats: [
      '{name} is… here. A tiny "…". You think that means he likes it.',
      '{name} pokes one eye stalk out, very slowly, to say hello.',
      "{name} doesn't move. He's having a lovely time, in his way.",
    ],
  },
  wybie: {
    name: 'Wybie',
    what: 'Bambino sphynx. Ghost. Zoomies.',
    ghost: true,
    speed: 5,
    pats: [
      '{name} headbutts your hand, then zooms three laps round you and back.',
      '{name} purrs so hard he flickers a little.',
      '{name} sits still for exactly one pat, then ZOOM.',
    ],
  },
  elvira: {
    name: 'Elvira',
    what: 'Fluffy black-and-white ghost cat. A cuddler.',
    ghost: true,
    speed: 4.5,
    pats: [
      '{name} curls up against you and settles in for a long, glowy cuddle.',
      '{name} kneads your arm and purrs. The heart over her eye is extra fluffy today.',
      '{name} tucks her head under your chin. She is staying right here.',
    ],
  },
};

/** How an accessory sits on a pet: a band round the neck, spiked, belled, or a bandana's point. */
export type AccessoryStyle = 'collar' | 'spiked' | 'bell' | 'bandana';

export interface AccessoryRow {
  name: string;
  style: AccessoryStyle;
  /** What Cobweb Corner asks for it; none if she has it from the start. */
  price?: number;
  description: string;
}

/**
 * What the pets wear, round their necks (decisions.md 69). Owned like her walls and floors: once
 * she has one, any pet can wear it, and several can wear the same.
 */
export const ACCESSORIES: Record<AccessoryId, AccessoryRow> = {
  pinkSpikedCollar: {
    name: 'Pink spiked collar',
    style: 'spiked',
    description: "Fibi's own. Very punk, very pink.",
  },
  plumSpikedCollar: {
    name: 'Plum spiked collar',
    style: 'spiked',
    price: 120,
    description: 'Spikes, but make them plum. For a pet with an edge (a soft one).',
  },
  blueBandana: {
    name: 'Blue bandana',
    style: 'bandana',
    description: "Dolly's favourite. It makes her feel brave.",
  },
  scarletBandana: {
    name: 'Scarlet bandana',
    style: 'bandana',
    description: 'A red bandana, for a very good dog on a very good day.',
  },
  lavenderBandana: {
    name: 'Lavender bandana',
    style: 'bandana',
    description: 'Soft as a moonpetal, and just as purple.',
  },
  pumpkinBandana: {
    name: 'Pumpkin bandana',
    style: 'bandana',
    price: 80,
    description: 'Pumpkin orange, for a pet who is spooky season all year.',
  },
  mossBandana: {
    name: 'Moss bandana',
    style: 'bandana',
    price: 80,
    description: 'The green of the graveyard garden, in the nicest way.',
  },
  skyBandana: {
    name: 'Sky bandana',
    style: 'bandana',
    price: 80,
    description: 'A pale blue bandana, like a clear morning.',
  },
  ghostBandana: {
    name: 'Ghost bandana',
    style: 'bandana',
    price: 90,
    description: 'A bandana so pale it could be a little sheet. Boo!',
  },
  tealCollar: {
    name: 'Teal collar',
    style: 'collar',
    price: 60,
    description: 'A plain teal collar, soft and comfy.',
  },
  roseCollar: {
    name: 'Rose collar',
    style: 'collar',
    price: 60,
    description: 'A rose-pink collar. Classic.',
  },
  bellCollar: {
    name: 'Bell collar',
    style: 'bell',
    price: 100,
    description: 'Jingles a little. Now you always know where they are.',
  },
};

export const ACCESSORY_IDS = Object.keys(ACCESSORIES) as AccessoryId[];

export function isAccessory(id: string): id is AccessoryId {
  return id in ACCESSORIES;
}

export function isPet(id: string): id is PetId {
  return (PET_IDS as readonly string[]).includes(id);
}

/** What the pets' side of a new save is, and what a save from before them is given (save v10). */
export interface PetsSnapshot {
  /** The pet walking with her, or null if they're all at home. */
  walking: PetId | null;
  /** Names she has given them, where she has changed one. */
  names: Partial<Record<PetId, string>>;
  /** What each is wearing, if anything. */
  wearing: Partial<Record<PetId, AccessoryId>>;
  /** The accessories she owns. */
  accessories: AccessoryId[];
  /** How many of Fibi's bones she has brought back. */
  bones: number;
  /** The last day she brought Fibi a bone, which made her day. */
  happy: string | null;
}

/**
 * Fibi in her pink spiked collar and Dolly in her blue bandana, with two more bandanas for her
 * (personal_touches.md, "The pets").
 */
export const STARTER_PETS: PetsSnapshot = {
  walking: null,
  names: {},
  wearing: { fibi: 'pinkSpikedCollar', dolly: 'blueBandana' },
  accessories: ['pinkSpikedCollar', 'blueBandana', 'scarletBandana', 'lavenderBandana'],
  bones: 0,
  happy: null,
};

/** The longest name she can give a pet. */
export const PET_NAME_MAX = 14;
