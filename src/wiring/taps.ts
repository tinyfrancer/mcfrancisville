import { CUES } from '../audio/cues';
import type { SoundBoard } from '../audio/SoundBoard';
import type { Effects } from '../render/effects';
import type { Tapped } from '../render/scene';
import type { World } from '../world/World';

/** What a tap is felt on. */
export interface TapStage {
  world: World;
  effects: Effects;
  sound: SoundBoard;
}

/**
 * A tap on the world, felt (V1's E4, decision 283): a ring where her finger came down, brackets
 * round what she set off toward for a beat, and a soft tick. Where she can't go, she shrugs (the
 * world's: `World.tapTile`), a ? over her and a soft "no", never a toast.
 */
export function feelTap({ went, at }: Tapped, { world, effects, sound }: TapStage): void {
  const zone = world.scene;
  effects.push(zone, { kind: 'ring', at });
  const aim = world.aim;
  if (went && aim) effects.push(zone, { kind: 'outline', around: aim });
  if (went || world.decorating.state) {
    sound.cue(CUES.tap);
    return;
  }
  effects.push(zone, { kind: 'emote', emote: '?', over: { her: true } });
  sound.cue(CUES.refused);
}
