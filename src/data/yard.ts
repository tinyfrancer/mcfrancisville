import type { FurnitureId, YardPiece } from '../types/ids';
import type { FurnitureRow } from './furniture';
import type { Placed } from './home';

/*
 * Her yard (0.3's H5): the grass round her house, decorated as her rooms are, with pieces made to
 * stand outdoors. They come in to the house too, if she likes; only the outdoor ones go out.
 */

/** Her yard as saved (save v40, 0.3's H5): what stands out there, as a room's pieces are. */
export interface YardSnapshot {
  placed: Placed[];
}

/** The pieces made for her yard, sold at Cobweb Corner. */
const YARD_PIECES: Record<YardPiece, FurnitureRow> = {
  gardenBench: {
    name: 'Garden bench',
    description:
      'A curly iron bench with a bat on its back, for sitting out on a warm evening and waving at the neighbours.',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'You sit a while and watch the town go by. Lovely.',
    price: 520,
    seat: { height: 13 },
  },
  yardLantern: {
    name: 'Garden lantern',
    description:
      'A little iron lantern with a candle inside, for the path, the steps or the picnic table.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The candle flickers in its little house.',
    price: 300,
  },
  toadstoolGnome: {
    name: 'Toadstool gnome',
    description:
      'A garden gnome in a spotty toadstool hat, holding a very small lantern. He guards the lawn from nothing in particular.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'The gnome looks very serious about his job. You thank him for his service.',
    price: 380,
  },
  flowerPots: {
    name: 'Pots of flowers',
    description: 'Three clay pots of marigolds, asters and something purple that smells of jam.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You sniff the purple ones. Jam. Definitely jam.',
    price: 280,
  },
  birdbath: {
    name: 'Birdbath',
    description:
      'A stone birdbath on a fluted stand. The bats like it even more than the birds do.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'A little bat is having a splash. It waves a wing at you.',
    price: 460,
  },
  picnicTable: {
    name: 'Picnic table',
    description:
      'A long wooden picnic table with a gingham cloth, room on top for a lantern and some snacks.',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'A perfect spot for a picnic. Or three.',
    price: 600,
  },
  pumpkinPile: {
    name: 'Pumpkin pile',
    description: 'Three pumpkins stacked just so, the littlest on top. Autumn in a heap.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The littlest pumpkin wobbles, then thinks better of it.',
    price: 320,
  },
  fairyLights: {
    name: 'Fairy lights',
    description:
      'A string of little lights swagged between two posts. They come on all by themselves at dusk.',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'The little lights twinkle. Every one a different colour.',
    price: 420,
  },
  picketFence: {
    name: 'Little fence',
    description:
      'A bit of picket fence with pointy tops, for edging the lawn. Put a few side by side for a whole fence.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'A very good fence. It keeps the grass in.',
    price: 240,
  },
  yardScarecrow: {
    name: 'Scarecrow of your own',
    description:
      'A friendly little scarecrow in a witch hat and a patched coat. The crows come and sit on it to chat.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'The scarecrow seems pleased to see you. A crow on its arm says "Caw."',
    price: 540,
  },
};

/** Every new piece of 0.3's H5, spread into `FURNITURE`. */
export const YARD_FURNITURE = YARD_PIECES;

/** What Cobweb Corner's shelf for the yard deals from. */
export const YARD_WARES = Object.keys(YARD_PIECES) as YardPiece[];

/**
 * What may stand outdoors in her yard: the pieces made for it, and the ones she has already that
 * belong outside as much as in, a gnome, the pumpkins and lanterns, a stool from a stump. Every
 * other piece stays indoors, where it's dry.
 */
export const OUTDOOR: ReadonlySet<FurnitureId> = new Set<FurnitureId>([
  ...YARD_WARES,
  'boneGnome',
  'jackOLantern',
  'catLantern',
  'tombstone',
  'stumpStool',
  'pumpkinStool',
]);

export function isOutdoor(id: FurnitureId): boolean {
  return OUTDOOR.has(id);
}
