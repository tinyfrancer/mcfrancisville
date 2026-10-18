import type { Effects } from '../render/effects';
import type { World } from '../world/World';

/**
 * Cody patting one of her pets at hers of an evening (V1's P5, decision 305): whether he is is the
 * world's (`Neighbourhood.patting`), a beat a pat; this puts a heart over the pet once a beat, as
 * the chatter's bubbles are put there, since it isn't a moment.
 */
export class Pats {
  private shown = new Set<string>();

  show(world: World, effects: Effects): void {
    const pat = world.neighbourhood.patting();
    if (!pat || this.shown.has(pat.beat)) return;
    this.shown.add(pat.beat);
    const pet = world.petCare.petAt(pat.pet.tx, pat.pet.ty);
    if (!pet) return;
    effects.push(world.scene, { kind: 'emote', emote: '♥', over: { x: pet.x, y: pet.y - 20 } });
    if (this.shown.size > 32) this.shown = new Set([...this.shown].slice(-16));
  }
}
