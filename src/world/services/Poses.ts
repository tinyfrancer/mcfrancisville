import { isFish } from '../../data/critters';
import {
  actionMs,
  actionPose,
  blinking,
  breathingOut,
  idlePose,
  rockPose,
  swingFrame,
  type Verb,
} from '../../systems/poses';
import type { Pose } from '../../types/ids';
import type { WorldContext } from '../context';
import type { Thrill, WorldEvent } from '../events';
import { NET_MS } from './Collecting';

/** What her poses need to know of her: whether she's walking, or busy with something. */
export interface PoseCues {
  moving(): boolean;
  /** Sat down on a seat, which she stays on whatever thrills her. */
  seated(): boolean;
  /** Talking, petting, decorating or dancing: no time for her phone. */
  busy(): boolean;
  /** How far through a swing of her net she is, 0 to 1, or null when she isn't swinging it. */
  swinging?(): number | null;
}

/** A thrill waits for what brought it to finish: her net's swing, for a catch. */
const AFTER: Record<Thrill, number> = {
  catch: NET_MS,
  gift: 0,
  harvest: 0,
  letter: 0,
  find: 0,
};

/**
 * What she does as a moment happens (V1's E2, decision 281), and how long after it she starts: a
 * critter caught in her net is held up once the net has come down.
 */
export function verbOf(e: WorldEvent): { verb: Verb; afterMs: number } | null {
  const now = (verb: Verb) => ({ verb, afterMs: 0 });
  switch (e.kind) {
    case 'gathered':
    case 'tilled':
    case 'bare':
    case 'planted':
    case 'sowedRow':
    case 'fitted':
    case 'unfitted':
    case 'potted':
    case 'foundLost':
      return now('pick');
    case 'harvested':
      return now(e.first ? 'find' : 'pick');
    case 'shook':
      return e.candy > 0 || e.sweet || e.sapling ? now('pick') : null;
    case 'sapling':
      return e.did === 'planted' ? now('pick') : null;
    case 'patch':
      return e.picked ? now('pick') : null;
    case 'watered':
      return now('water');
    case 'dug':
    case 'foundEgg':
      return now('find');
    case 'unearthed':
      return now('fossil' in e.find ? 'find' : 'pick');
    case 'caught':
      return { verb: 'show', afterMs: isFish(e.critter) ? 0 : NET_MS };
    case 'won':
    case 'trickOrTreat':
      return now('show');
    case 'arrived':
      // A wave hello to a neighbour, and down to pat a pet.
      if (e.villager) return now('greet');
      return e.pet ? now('pick') : null;
    default:
      return null;
  }
}

/**
 * How she stands: idling after a while still, rocking out when something thrills her, and for a
 * moment as she does something, the pose of what she's doing. It keeps only how long she has
 * stood still, when she was last thrilled and what she's doing since when; the view asks `pose`.
 */
export class Poses {
  private readonly ctx: WorldContext;
  private readonly cues: PoseCues;
  private stillMs = 0;
  private rockFrom = -Infinity;
  private doing: Verb | null = null;
  private doingFrom = -Infinity;

  constructor(ctx: WorldContext, cues: PoseCues) {
    this.ctx = ctx;
    this.cues = cues;
    ctx.signals.on('thrilled', ({ by }) => {
      this.rockFrom = Math.max(ctx.clock.now() + AFTER[by], this.doneAt());
      this.stillMs = 0;
    });
  }

  step(deltaMs: number): void {
    if (this.cues.moving() || this.cues.busy()) this.stillMs = 0;
    else this.stillMs += deltaMs;
  }

  /** Sees what just happened, and does the last thing of it there's a pose for. */
  saw(events: readonly WorldEvent[]): void {
    let chosen: ReturnType<typeof verbOf> = null;
    for (const e of events) chosen = verbOf(e) ?? chosen;
    if (!chosen) return;
    const now = this.ctx.clock.now();
    this.doing = chosen.verb;
    this.doingFrom = now + chosen.afterMs;
    this.stillMs = 0;
    // A rock-out just thrilled waits for her to finish, so the find is held up first.
    if (this.rockFrom >= now) this.rockFrom = Math.max(this.rockFrom, this.doneAt());
  }

  /** She's been asked to do something: whatever she was doing standing there, she stops. */
  stir(): void {
    this.stillMs = 0;
    this.rockFrom = -Infinity;
    this.doing = null;
  }

  private doneAt(): number {
    return this.doing ? this.doingFrom + actionMs(this.doing) : -Infinity;
  }

  /** The action pose she's in now, and its frame. */
  private acting(): { pose: Pose; frame: number } | null {
    const swing = this.cues.swinging?.() ?? null;
    if (swing !== null) return { pose: 'swing', frame: swingFrame(swing) };
    if (!this.doing) return null;
    return actionPose(this.doing, this.ctx.clock.now() - this.doingFrom);
  }

  /** Her pose now, or null for standing (or walking) as usual. */
  pose(): Pose | null {
    if (this.cues.moving()) return null;
    if (this.cues.seated()) return 'sit';
    const acting = this.acting();
    if (acting) return acting.pose;
    const rock = rockPose(this.ctx.clock.now() - this.rockFrom);
    if (rock) return rock;
    return this.cues.busy() ? null : idlePose(this.stillMs);
  }

  /** Which frame of her pose: a wave's hand, a swing's arm. */
  frame(): number {
    if (this.cues.moving() || this.cues.seated()) return 0;
    return this.acting()?.frame ?? 0;
  }

  /**
   * Standing as usual, whether she's breathing out and whether she's blinking; null in a pose or
   * walking, which have their own.
   */
  rest(): { out: boolean; blink: boolean } | null {
    if (this.cues.moving() || this.pose() !== null) return null;
    const now = this.ctx.clock.now();
    return { out: breathingOut(now), blink: blinking(now) };
  }
}
