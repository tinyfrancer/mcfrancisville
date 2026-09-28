import { FURNITURE } from '../data/furniture';
import { INTERIORS, INTERIOR_IDS } from '../data/interiors';
import { VILLAGERS } from '../data/villagers';
import type { FurnitureId, VillagerId } from '../types/ids';

/** A keepsake in a neighbour's house: whose it is, and at how many hearts she can have one. */
export interface KeepsakeOf {
  owner: VillagerId;
  hearts: number;
}

/** Every keepsake in every house, by the piece. */
export function keepsakes(): Map<FurnitureId, KeepsakeOf> {
  const all = new Map<FurnitureId, KeepsakeOf>();
  for (const id of INTERIOR_IDS) {
    const { owner, furniture } = INTERIORS[id];
    if (!owner) continue;
    for (const piece of furniture) {
      if (piece.keepsake !== undefined) all.set(piece.id, { owner, hearts: piece.keepsake });
    }
  }
  return all;
}

/**
 * What she's told of a keepsake she can't have yet: whose it is, and that they might part with one
 * once they're a little closer. Never how many hearts: a friendship isn't a sum. Cody is her
 * husband, so he's only saving one for her.
 */
export function keepsakeHint(piece: FurnitureId, owner: VillagerId, hearts: number): string {
  const name = VILLAGERS[owner].name;
  const what = FURNITURE[piece].name.toLowerCase();
  if (owner === 'cody') {
    return `Cody's ${what}. He's saving one just like it for you. Spend a little more time with him!`;
  }
  const soon = hearts <= 2 ? 'once you know each other a little' : "once you're good friends";
  return `${name}'s ${what}. ${name} might let you have one just like it, ${soon}.`;
}
