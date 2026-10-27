import { WELL_PENNY, WISH_CANDY } from '../../data/wishes';
import { dayKey } from '../../systems/clock';
import { fill } from '../../systems/friendship';
import { comesUpOn, WISH_KEY, wishOn } from '../../systems/well';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { TileBox, WorldEvent } from '../events';
import type { Home } from '../Home';
import type { Takings } from './Takings';
import type { Wallet } from './Wallet';

/** What the well's card shows (1.7's Y2): whether she has wished today, and if she can. */
export interface WellView {
  /** Tossed today already. */
  wished: boolean;
  /** Her Candy, for whether she has one to toss. */
  candy: number;
  /** What a wish costs. */
  costs: number;
}

export interface WellKeeps {
  bag: Bag;
  wallet: Wallet;
  takings: Takings;
  home: Home;
}

/**
 * The wishing well on the square (1.7's Y2, decision 389): once a day she may toss in a Candy, and
 * a wish comes back up as a line dealt from the day; about one toss in seven something comes up
 * with it, and with her very first wish a lucky penny to keep. Nothing is lost but the Candy, and
 * nothing is saved but the day's toss in her takings.
 */
export class Well {
  private readonly ctx: WorldContext;
  private readonly keeps: WellKeeps;
  private readonly name: () => string;
  /** Where the well stands on the square, for the ripple over its water. */
  private readonly box: TileBox;

  constructor(ctx: WorldContext, keeps: WellKeeps, name: () => string, box: TileBox) {
    this.ctx = ctx;
    this.keeps = keeps;
    this.name = name;
    this.box = box;
  }

  view(): WellView {
    return {
      wished: !this.keeps.takings.isReady(WISH_KEY),
      candy: this.keeps.wallet.candy,
      costs: WISH_CANDY,
    };
  }

  /** Whether she has a lucky penny anywhere: her bag, her chest or on show. */
  private hasPenny(): boolean {
    const { bag, home } = this.keeps;
    const kept = home.items.find((s) => s.id === WELL_PENNY)?.count ?? 0;
    return bag.count(WELL_PENNY) + kept + home.rooms.onShow(WELL_PENNY) > 0;
  }

  /** Tosses a Candy in for today's wish: the moment, or null if she has wished or has no Candy. */
  toss(): WorldEvent | null {
    const { bag, wallet, takings } = this.keeps;
    if (!takings.isReady(WISH_KEY) || !wallet.spend(WISH_CANDY)) return null;
    takings.take(WISH_KEY);
    const day = dayKey(this.ctx.clock.now());
    const line = fill(wishOn(day).line, { name: this.name() });
    const first = !this.hasPenny();
    const found = first ? WELL_PENNY : comesUpOn(day);
    if (found) {
      bag.add(found, 1);
      this.ctx.events.emit('bag', bag.contents);
    }
    const wished: WorldEvent = {
      kind: 'wished',
      line,
      well: { ...this.box },
      ...(found ? { found } : {}),
      ...(first ? { first: true as const } : {}),
    };
    this.ctx.moments.push(wished);
    return wished;
  }
}
