import { CRITTERS } from '../../data/critters';
import { lineAt, type LineAt } from '../../systems/fishing';
import type { CritterId } from '../../types/ids';
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
}

/** Her float in the water, over the fish she cast to. */
export interface Cast {
  key: string;
  critter: CritterId;
  tx: number;
  ty: number;
  /** When she cast, which the fish's every nibble and bite are worked out from. */
  at: number;
  /** Whether the fish were biting sooner for her as she cast. */
  eager: boolean;
}

/** Her line as the view draws it: where the float is, and what it's doing. */
export type Line = Cast & LineAt;

/**
 * Her fishing rod (phase Q, decision 121). She casts to a fish's shadow from the bank beside it,
 * it nibbles and then bites, and a tap on the bite lands it, into her bag and her Curiosity
 * Cabinet like anything her net catches. A tap too soon reels in empty and a bite let go comes
 * round again, so nothing is lost for trying.
 */
export class Fishing {
  private readonly ctx: WorldContext;
  private readonly cues: FishingCues;
  private cast: Cast | null = null;
  /** What the line was doing at the last step, so each nibble and bite is told once. */
  private was = '';
  /** She has been told a bite got away since she cast. */
  private toldOfLetGo = false;

  constructor(ctx: WorldContext, cues: FishingCues) {
    this.ctx = ctx;
    this.cues = cues;
  }

  /** Her line, if it's in the water. */
  get line(): Line | null {
    const cast = this.cast;
    if (!cast) return null;
    const wary = CRITTERS[cast.critter].wary;
    return {
      ...cast,
      ...lineAt(`${cast.key}@${cast.at}`, wary, this.ctx.clock.now() - cast.at, cast.eager),
    };
  }

  /** She casts to a fish from beside it. The first time ever, she's told what to wait for. */
  castTo(fish: Critter): WorldEvent {
    const { key, critter, tx, ty } = fish;
    const eager = this.cues.eager();
    this.cast = { key, critter, tx, ty, at: this.ctx.clock.now(), eager };
    this.was = '';
    this.toldOfLetGo = false;
    return this.cues.hasFished() ? { kind: 'cast' } : { kind: 'cast', hint: true };
  }

  /**
   * Each nibble and bite as it comes, and a bite let go. Her line comes in by itself if she walks
   * off, or if the fish has gone (the hour turned, or she went somewhere else).
   */
  step(): WorldEvent[] {
    const line = this.line;
    if (!line) return [];
    if (this.cues.walking() || !this.cues.collecting.find(line.key)) {
      this.cast = null;
      return [];
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

  /** She reels in: the fish, on a bite, or nothing yet, too soon. */
  reel(): WorldEvent | null {
    const line = this.line;
    if (!line) return null;
    this.cast = null;
    const fish = this.cues.collecting.find(line.key);
    if (line.state === 'bite' && fish) return this.cues.collecting.keep(fish);
    return { kind: 'reeled' };
  }
}
