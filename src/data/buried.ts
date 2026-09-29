import type { BuriedId, ItemId, MapZoneId } from '../types/ids';

/** Something buried under a mound (`mound` in a map), dug up the first time she walks up to it. */
export interface BuriedRow {
  zone: MapZoneId;
  /** The mound's tile. */
  tx: number;
  ty: number;
  item: ItemId;
  /** What she reads as she digs it up. */
  found: string;
}

/**
 * What's buried (phase I). The castle's key is in the middle of the ring of toadstools in the
 * hidden clearing, which is where the castle gate's hint sends her. The castle hall's key (phase
 * U) is on the bank where the frozen creek bends, where they'd have skated on their first date,
 * which is where the castle doors' hint sends her.
 */
export const BURIED: Record<BuriedId, BuriedRow> = {
  castleKey: {
    zone: 'hiddenClearing',
    tx: 8,
    ty: 11,
    item: 'castleKey',
    found:
      'You dig where the earth is soft, in the middle of the ring, and find an old iron key with ' +
      'a butterfly on its bow! It must be the key to the castle gate.',
  },
  hallKey: {
    zone: 'whisperwood',
    tx: 21,
    ty: 28,
    item: 'hallKey',
    found:
      'You dig by the bend in the frozen creek, where the ice is smoothest, and find a little ' +
      'brass key with a heart for its bow. Something up at the castle must have a heart-shaped lock.',
  },
};

export const BURIED_IDS = Object.keys(BURIED) as BuriedId[];

/** What's buried under the mound on a tile of a place, if anything. */
export function buriedAt(zone: MapZoneId, tx: number, ty: number): BuriedId | undefined {
  return BURIED_IDS.find((id) => {
    const row = BURIED[id];
    return row.zone === zone && row.tx === tx && row.ty === ty;
  });
}
