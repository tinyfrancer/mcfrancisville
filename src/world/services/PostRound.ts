import { MAILBOX_STEP, POSTMAN, roundState, walksIt } from '../../systems/postRound';
import type { VillagerId, ZoneId } from '../../types/ids';
import type { WorldContext } from '../context';
import type { Neighbour } from '../Neighbour';
import type { Errand } from './Neighbourhood';

/** What the round reads of the rest of the world. */
export interface PostRoundReads {
  /** Where she is. */
  here: () => ZoneId;
  /** Who she's talking to, if anyone. */
  talkingTo: () => VillagerId | null;
  /** Ollie, or null in a town without neighbours (a test's small map). */
  postman: () => Neighbour | null;
}

/**
 * Ollie's round to her mailbox (V1's P4, decision 304): a letter posted to her while she's in town
 * sends him to her mailbox from wherever he is, to stand there a moment putting it in; her
 * mailbox's flag stays down until he leaves it (`carrying`). If she goes somewhere else, or it
 * takes him too long, the letter is simply there. Nothing of it is saved.
 */
export class PostRound {
  private readonly reads: PostRoundReads;
  /**
   * How long the round has gone on, and how long he has stood at her mailbox, in stepped time, as
   * a stroll is timed (decision 282), so a test's stopped clock still sees him through it.
   */
  private round: { ms: number; postingMs: number | null } | null = null;

  constructor(ctx: WorldContext, reads: PostRoundReads) {
    this.reads = reads;
    ctx.signals.on('posted', () => this.letterCame());
  }

  private letterCame(): void {
    if (this.round || !this.reads.postman()) return;
    if (!walksIt(this.reads.here(), this.reads.talkingTo())) return;
    this.round = { ms: 0, postingMs: null };
  }

  /** Whether he's on his way with her post, so the flag isn't up yet. */
  get carrying(): boolean {
    return this.round !== null;
  }

  /** Where Ollie is off to while he has her post, and what he does there: sorting it in. */
  errandOf(id: VillagerId): Errand | null {
    if (id !== POSTMAN || !this.round) return null;
    return { place: { zone: 'town', ...MAILBOX_STEP }, doing: 'post' };
  }

  /** Moves the round on: he's there and posting it, or it's in and he's off. */
  step(deltaMs: number): void {
    const round = this.round;
    if (!round) return;
    if (this.reads.here() !== 'town') {
      this.round = null;
      return;
    }
    round.ms += deltaMs;
    const ollie = this.reads.postman();
    const t = ollie?.tile;
    const there =
      ollie?.zone === 'town' &&
      !ollie.moving &&
      t?.tx === MAILBOX_STEP.tx &&
      t.ty === MAILBOX_STEP.ty;
    if (there) round.postingMs = (round.postingMs ?? -deltaMs) + deltaMs;
    if (roundState(round.ms, round.postingMs) === 'done') this.round = null;
  }
}
