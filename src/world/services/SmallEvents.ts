import { LOST, LOST_CANDY, LOST_POINTS } from '../../data/smallEvents';
import { windowKey } from '../../systems/clock';
import type { Tile } from '../../systems/pathfinding';
import { smallEventOf, type SmallEvent } from '../../systems/smallEvents';
import type { LostId, VillagerId } from '../../types/ids';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Takings } from './Takings';
import type { Wallet } from './Wallet';

/** What the small events reach into. */
export interface SmallEventKeeps {
  wallet: Wallet;
  takings: Takings;
  /** A little more friendship with whoever she handed something back to. */
  thank: (villager: VillagerId, points: number) => void;
  /** Whether a neighbour lives in town yet, to lose anything in it. */
  livesHere?: (villager: VillagerId) => boolean;
}

/** What a neighbour has to say about the window's small event, when she talks to them. */
export interface SmallTalk {
  line: string;
  /** What they gave her for handing back what they'd lost. */
  candy?: number;
}

/**
 * The town's small events (phase S2), one a window from its key: a neighbour with news, a "!"
 * over their head until she's heard it, or something one of them has lost in town, glinting
 * where it lies until she walks onto it and carries it back. Whether she's heard the news or
 * found the thing is kept in `Takings` for the window; what she's carrying is saved (`errand`,
 * save v24), so a window turning on the way loses nothing.
 */
export class SmallEvents {
  private readonly ctx: WorldContext;
  private readonly keeps: SmallEventKeeps;
  /** The lost thing she's carrying back to its owner, if any. */
  private carrying: LostId | null;

  constructor(ctx: WorldContext, keeps: SmallEventKeeps, errand: string | null = null) {
    this.ctx = ctx;
    this.keeps = keeps;
    this.carrying = errand !== null && errand in LOST ? (errand as LostId) : null;
  }

  /** This window's small event. */
  now(): SmallEvent {
    return smallEventOf(windowKey(this.ctx.clock.now()), this.keeps.livesHere);
  }

  /** What she's carrying back, if anything. */
  get errand(): LostId | null {
    return this.carrying;
  }

  /**
   * What shows over a neighbour's head: "!" for news she hasn't heard, "?" while what they've lost
   * is lying in town or she's carrying it back to them.
   */
  bubble(id: VillagerId): '!' | '?' | null {
    if (this.hasNews(id)) return '!';
    if (this.carrying && LOST[this.carrying].who === id) return '?';
    const lying = this.lying();
    return lying && LOST[lying.lost].who === id ? '?' : null;
  }

  /** Whether a neighbour has news she hasn't heard yet. */
  hasNews(id: VillagerId): boolean {
    const event = this.now();
    return event.kind === 'news' && event.news.who === id && this.keeps.takings.isReady('news');
  }

  /** The lost thing lying in town this window, until she picks it up. */
  lying(): { lost: LostId; at: Tile } | null {
    const event = this.now();
    if (event.kind !== 'lost' || event.lost === this.carrying) return null;
    return this.keeps.takings.isReady('lost') ? { lost: event.lost, at: event.at } : null;
  }

  /** She has walked onto a tile in town: the lost thing, if it's lying there, is hers to carry. */
  pickUp(here: Tile): WorldEvent[] {
    const lying = this.lying();
    if (!lying || lying.at.tx !== here.tx || lying.at.ty !== here.ty) return [];
    this.keeps.takings.take('lost');
    this.carrying = lying.lost;
    return [{ kind: 'foundLost', lost: lying.lost }];
  }

  /**
   * What a neighbour says about the small event: thanks, if she's carrying back what they lost;
   * their news, the first time she talks to them this window; or asking after what they've lost.
   */
  talk(id: VillagerId): SmallTalk | null {
    if (this.carrying && LOST[this.carrying].who === id) {
      const { thanks } = LOST[this.carrying];
      this.carrying = null;
      this.keeps.wallet.earn(LOST_CANDY);
      this.keeps.thank(id, LOST_POINTS);
      return { line: thanks, candy: LOST_CANDY };
    }
    const event = this.now();
    if (this.hasNews(id) && event.kind === 'news') {
      this.keeps.takings.take('news');
      return { line: event.news.line };
    }
    // They ask after it once a window, so as not to go on about it.
    const lost = event.kind === 'lost' && this.lying() && LOST[event.lost].who === id;
    if (lost && this.keeps.takings.isReady('lostAsked')) {
      this.keeps.takings.take('lostAsked');
      return { line: LOST[event.lost].ask.replaceAll('{where}', event.where) };
    }
    return null;
  }

  snapshot(): { errand: LostId | null } {
    return { errand: this.carrying };
  }
}
