import type { Effects } from '../render/effects';
import type { World } from '../world/World';

/**
 * Her neighbours' chatter seen (V1's E3, decision 282): what two standing together say is the
 * world's (`Neighbourhood.chatter`), a bubble a beat; this puts each beat over its speaker in the
 * effects layer once, as the footfall dust is put there, since it isn't a moment.
 */
export class Chatter {
  private shown = new Set<string>();

  show(world: World, effects: Effects): void {
    const zone = world.scene;
    for (const said of world.neighbourhood.chatter(zone)) {
      if (this.shown.has(said.beat)) continue;
      this.shown.add(said.beat);
      effects.push(zone, { kind: 'emote', emote: said.chat, over: { villager: said.by } });
    }
    if (this.shown.size > 64) this.shown = new Set([...this.shown].slice(-32));
  }
}
