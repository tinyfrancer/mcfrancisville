import { CRITTERS } from '../../data/critters';
import { sizeOf } from '../../systems/catchSize';
import {
  BITE_MS,
  bestReelAfter,
  CAST_MS,
  lineAt,
  needleAt,
  nextBite,
  reelGrade,
  reelLength,
  reelOf,
  type LineAt,
  type Nibbler,
  type Reel,
} from '../../systems/fishing';
import type { Grade } from '../../systems/activities';
import type { CritterId, ZoneId } from '../../types/ids';
import type { Tile } from '../../systems/pathfinding';
import type { WorldContext } from '../context';
import type { Critter, WorldEvent } from '../events';
import type { Collecting } from './Collecting';

/** What her rod needs to know of the rest of her. */
export interface FishingCues {
  collecting: Collecting;
  /** She's walking: whatever took her off, her line comes in. */
  walking(): boolean;
  /** She has caught a fish before, so needs no telling how. */
  hasFished(): boolean;
  /** She ate something the fish can smell on her, and they bite sooner (phase R). */
  eager(): boolean;
  /** Her phone asks for reduced motion, so the tension bar sweeps gentler (1.0.1). */
  slow(): boolean;
  /** Where she is, so a line through the ice hut's hole comes in if she's gone (1.4's G3). */
  scene(): ZoneId;
}

/** Her float in the water, over the fish she cast to. */
export interface Cast {
  key: string;
  critter: CritterId;
  tx: number;
  ty: number;
  /**
   * When she cast, which the fish's every nibble and bite are worked out from; after the line goes
   * slack, when the fish began to come round again.
   */
  at: number;
  /** Whether the fish were biting sooner for her as she cast. */
  eager: boolean;
  /** Cast through the ice hut's hole (1.4's G3): where she was, the fish under it, not the water's. */
  hole?: ZoneId;
}

/** A rare fish hooked (V1's R6a): its tension bar, and where the needle is on it. */
export interface Reeling {
  reel: Reel;
  /** When she hooked it. */
  at: number;
  /** Where the needle is along the bar, 0 to 1. */
  needle: number;
}

/** Her line as the view draws it: where the float is, and what it's doing. */
export type Line = Cast & LineAt & { reeling?: Reeling };

/**
 * Her fishing rod (phase Q, decision 121). She casts to a fish's shadow from the bank beside it,
 * it nibbles and then bites, and a tap on the bite lands it, into her bag and her Curiosity
 * Cabinet like anything her net catches. A tap too soon reels in empty and a bite let go comes
 * round again, so nothing is lost for trying. Since V1's R6a the rarer the fish, the shorter its
 * bite; a rare or legendary one is hooked on it and reeled in with a tap in time, and a tap out
 * of time lets the line go slack, the fish still there to bite again. Every fish has its size.
 */
export class Fishing {
  private readonly ctx: WorldContext;
  private readonly cues: FishingCues;
  private cast: Cast | null = null;
  private hooked: { reel: Reel; at: number } | null = null;
  /** What the line was doing at the last step, so each nibble and bite is told once. */
  private was = '';
  /** She has been told a bite got away since she cast. */
  private toldOfLetGo = false;
  /** She has been told a slack line comes round again, since she cast. */
  private toldOfSlack = false;

  constructor(ctx: WorldContext, cues: FishingCues) {
    this.ctx = ctx;
    this.cues = cues;
  }

  private static seed(cast: Cast): string {
    return `${cast.key}@${cast.at}`;
  }

  private static nibbler(cast: Cast): Nibbler {
    const row = CRITTERS[cast.critter];
    return { wary: row.wary, biteMs: BITE_MS[row.rarity], eager: cast.eager };
  }

  /** Her line, if it's in the water. */
  get line(): Line | null {
    const cast = this.cast;
    if (!cast) return null;
    const now = this.ctx.clock.now();
    const hooked = this.hooked;
    if (hooked) {
      const needle = needleAt(hooked.reel, now - hooked.at);
      return { ...cast, state: 'reel', round: 0, reeling: { ...hooked, needle } };
    }
    return { ...cast, ...lineAt(Fishing.seed(cast), Fishing.nibbler(cast), now - cast.at) };
  }

  /**
   * She casts through the ice hut's hole (1.4's G3), to the first fish under it this hour; null if
   * she has had them all, until the hour turns.
   */
  castInHole(hole: Tile): WorldEvent | null {
    const fish = this.cues.collecting.holeFish(hole)[0];
    if (!fish) return null;
    const cast = this.castTo(fish);
    this.cast = { ...this.cast!, hole: this.cues.scene() };
    return cast;
  }

  /** The fish on her line, if it's still there: in the water where she is, or under the hole. */
  private fishOf(cast: Cast): Critter | undefined {
    if (!cast.hole) return this.cues.collecting.find(cast.key);
    if (this.cues.scene() !== cast.hole) return undefined;
    return this.cues.collecting.holeFish(cast).find((c) => c.key === cast.key);
  }

  /** She casts to a fish from beside it. The first time ever, she's told what to wait for. */
  castTo(fish: Critter): WorldEvent {
    const { key, critter, tx, ty } = fish;
    const eager = this.cues.eager();
    this.cast = { key, critter, tx, ty, at: this.ctx.clock.now(), eager };
    this.hooked = null;
    this.was = '';
    this.toldOfLetGo = false;
    this.toldOfSlack = false;
    return this.cues.hasFished() ? { kind: 'cast' } : { kind: 'cast', hint: true };
  }

  /**
   * Each nibble and bite as it comes, and a bite let go; a reel left untapped goes slack. Her line
   * comes in by itself if she walks off, or if the fish has gone (the hour turned, or she went
   * somewhere else).
   */
  step(): WorldEvent[] {
    const line = this.line;
    if (!line) return [];
    if (this.cues.walking() || !this.fishOf(line)) {
      this.cast = null;
      this.hooked = null;
      return [];
    }
    const hooked = this.hooked;
    if (hooked) {
      if (this.ctx.clock.now() - hooked.at < reelLength(hooked.reel)) return [];
      return [this.slacken()];
    }
    const now = `${line.round}:${line.state}:${line.nibble ?? ''}`;
    if (now === this.was) return [];
    const letGo = this.was.endsWith(':bite:') && line.state !== 'bite';
    this.was = now;
    if (letGo) {
      const told = this.toldOfLetGo;
      this.toldOfLetGo = true;
      return [told ? { kind: 'letGo' } : { kind: 'letGo', first: true }];
    }
    if (line.state === 'nibble') return [{ kind: 'nibble' }];
    if (line.state === 'bite') return [{ kind: 'bite' }];
    return [];
  }

  /** The line goes slack: the fish swims round to bite again, from now, as if newly cast to. */
  private slacken(): WorldEvent {
    const cast = this.cast!;
    this.cast = { ...cast, at: this.ctx.clock.now() - CAST_MS };
    this.hooked = null;
    this.was = '';
    const told = this.toldOfSlack;
    this.toldOfSlack = true;
    return told ? { kind: 'slack' } : { kind: 'slack', first: true };
  }

  /**
   * She taps while her line is in: on a bite, the fish (a rare one hooked, to reel in); on the
   * tension bar, landed if the needle's in its window and slack if not; and nothing yet, too soon.
   */
  reel(): WorldEvent | null {
    const line = this.line;
    const cast = this.cast;
    if (!line || !cast) return null;
    const fish = this.fishOf(cast);
    const now = this.ctx.clock.now();
    const hooked = this.hooked;
    if (hooked && fish) {
      const grade = reelGrade(hooked.reel, now - hooked.at);
      return grade > 0 ? this.land(fish, cast, grade) : this.slacken();
    }
    if (line.state === 'bite' && fish) {
      const reel = reelOf(Fishing.seed(cast), CRITTERS[cast.critter].rarity, this.cues.slow());
      if (!reel) return this.land(fish, cast);
      this.hooked = { reel, at: now };
      return { kind: 'hooked' };
    }
    this.cast = null;
    this.hooked = null;
    return { kind: 'reeled' };
  }

  /** The fish landed, its size worked out from the cast it bit on. */
  private land(fish: Critter, cast: Cast, grade?: Grade): WorldEvent {
    this.cast = null;
    this.hooked = null;
    const caught = this.cues.collecting.keep(fish, sizeOf(fish.critter, Fishing.seed(cast)));
    if (caught.kind !== 'caught') return caught;
    const water = { tx: fish.tx, ty: fish.ty };
    return grade ? { ...caught, grade, water } : { ...caught, water };
  }

  /**
   * When a tap does best, from now: the middle of the bite (or now, if she's in it past its
   * middle), or the needle on the window's middle; null with no line in. For the tests and smoke.
   */
  bestTapAt(): number | null {
    const cast = this.cast;
    if (!cast) return null;
    const now = this.ctx.clock.now();
    const hooked = this.hooked;
    if (hooked) return hooked.at + bestReelAfter(hooked.reel, now - hooked.at);
    const bite = nextBite(Fishing.seed(cast), Fishing.nibbler(cast), now - cast.at);
    return Math.max(now, cast.at + (bite.from + bite.to) / 2);
  }
}
