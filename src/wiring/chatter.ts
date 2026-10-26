import { CUES } from '../audio/cues';
import type { SoundBoard } from '../audio/SoundBoard';
import type { Effects } from '../render/effects';
import type { World } from '../world/World';

/**
 * Her neighbours' chatter seen (V1's E3, decision 282): what two standing together say is the
 * world's (`Neighbourhood.chatter`), a bubble a beat; this puts each beat over its speaker in the
 * effects layer once, as the footfall dust is put there, since it isn't a moment. In the snow, a
 * beat may be a snowball thrown at the other instead, with its thwump (1.6's X4).
 */
export class Chatter {
  private shown = new Set<string>();

  show(world: World, effects: Effects, sound?: SoundBoard): void {
    const zone = world.scene;
    for (const said of world.neighbourhood.chatter(zone)) {
      if (this.shown.has(said.beat)) continue;
      this.shown.add(said.beat);
      if (said.chat === 'snowball') {
        const from = { villager: said.by };
        effects.push(zone, { kind: 'throw', from, to: { villager: said.to } });
        sound?.cue(CUES.thwump);
        continue;
      }
      effects.push(zone, { kind: 'emote', emote: said.chat, over: { villager: said.by } });
    }
    if (this.shown.size > 64) this.shown = new Set([...this.shown].slice(-32));
  }
}
