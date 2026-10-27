import { describe, expect, it } from 'vitest';
import {
  actionPose,
  BANG_MS,
  hopOf,
  JUMP_CROUCH_MS,
  JUMP_PX,
  JUMP_UP_MS,
  IDLE_AFTER_MS,
  IDLE_GAP_MS,
  IDLE_SPELL_MS,
  idlePose,
  ROCK_MS,
  rockPose,
} from '../../src/systems/poses';

describe('her poses', () => {
  it('waits a while before she gets her phone out, then takes turns with her arms crossed', () => {
    expect(idlePose(0)).toBeNull();
    expect(idlePose(IDLE_AFTER_MS - 1)).toBeNull();
    expect(idlePose(IDLE_AFTER_MS)).toBe('phone');
    expect(idlePose(IDLE_AFTER_MS + IDLE_SPELL_MS)).toBeNull();
    const turn = IDLE_SPELL_MS + IDLE_GAP_MS;
    expect(idlePose(IDLE_AFTER_MS + turn)).toBe('arms');
    expect(idlePose(IDLE_AFTER_MS + turn + IDLE_SPELL_MS)).toBeNull();
    expect(idlePose(IDLE_AFTER_MS + 2 * turn)).toBe('phone');
  });

  it('rocks out on the beat, and only for a moment', () => {
    expect(rockPose(-1)).toBeNull();
    expect(rockPose(0)).toBe('horns');
    expect(rockPose(BANG_MS)).toBe('bang');
    expect(rockPose(2 * BANG_MS)).toBe('horns');
    expect(rockPose(ROCK_MS)).toBeNull();
  });

  it("jumps in a leaf pile: down into a crouch, then up off the ground with her arms up (1.7's Y2)", () => {
    expect(actionPose('jump', 0)?.pose).toBe('crouch');
    expect(actionPose('jump', JUMP_CROUCH_MS)?.pose).toBe('holdUp');
    expect(actionPose('jump', JUMP_CROUCH_MS + JUMP_UP_MS)).toBeNull();
    expect(hopOf('jump', 0)).toBe(0);
    expect(hopOf('jump', JUMP_CROUCH_MS + JUMP_UP_MS / 2)).toBe(JUMP_PX);
    expect(hopOf('jump', JUMP_CROUCH_MS + JUMP_UP_MS)).toBe(0);
    expect(hopOf('pick', JUMP_CROUCH_MS + JUMP_UP_MS / 2)).toBe(0);
  });
});
