import {
  CROWN_POINTS,
  CROWNED,
  GOOD_SPORTS,
  HALF_NAMES,
  HER_PLAIN,
  PHOTO_CAPTION,
  PRIZE,
  type Costume,
} from '../../data/finale';
import { VILLAGER_IDS, VILLAGERS } from '../../data/villagers';
import { dayKey, hourOf } from '../../systems/clock';
import { inCostume } from '../../systems/costumes';
import { codyHalf, crownKey, herHalf } from '../../systems/finale';
import { fill } from '../../systems/friendship';
import { happeningOf } from '../../systems/happenings';
import { hashString } from '../../systems/random';
import type { HappeningId, VillagerId, ZoneId } from '../../types/ids';
import type { Look } from '../../types/look';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Takings } from './Takings';

/** The finale's happenings: the contest, then the party. */
const FINALE: readonly HappeningId[] = ['costumeContest', 'halloweenParty'];

/** What the finale reads of the rest of the world. */
export interface FinaleReads {
  look: () => Look;
  /** Where she is. */
  scene: () => ZoneId;
  /** Where a neighbour is, and whether they live here. */
  zoneOf: (villager: VillagerId) => ZoneId;
  livesHere: (villager: VillagerId) => boolean;
  /** A little more friendship, letters and all. */
  thank: (villager: VillagerId, points: number) => void;
}

/**
 * The Halloween Festival's finale on the 31st (0.2's J4, decision 157): she judges the costume
 * contest, crowning one neighbour a night (kept in `Takings`), Cody wears the other half of her
 * costume, and they have their photo taken.
 */
export class Finale {
  private readonly ctx: WorldContext;
  private readonly takings: Takings;
  private readonly reads: FinaleReads;

  constructor(ctx: WorldContext, takings: Takings, reads: FinaleReads) {
    this.ctx = ctx;
    this.takings = takings;
    this.reads = reads;
  }

  /** Whether a neighbour is at the finale now, where she is. */
  private here(villager: VillagerId): boolean {
    const now = this.ctx.clock.now();
    const at = happeningOf(villager, hourOf(now), dayKey(now));
    return (
      at !== null &&
      FINALE.includes(at) &&
      this.reads.livesHere(villager) &&
      this.reads.zoneOf(villager) === this.reads.scene()
    );
  }

  /** Who she crowned best costume tonight, if she has. */
  crowned(): VillagerId | null {
    return VILLAGER_IDS.find((v) => !this.takings.isReady(crownKey(v))) ?? null;
  }

  /** Whether she can crown a neighbour: at the finale, in costume, with nobody crowned yet. */
  canCrown(villager: VillagerId): boolean {
    const day = dayKey(this.ctx.clock.now());
    return this.crowned() === null && this.here(villager) && inCostume(villager, day);
  }

  /**
   * Crowns a neighbour best costume: they're thrilled, take home the prize, and the others are
   * good sports. Null if she can't.
   */
  crown(villager: VillagerId): { line: string; aside: string } | null {
    if (!this.canCrown(villager)) return null;
    this.takings.take(crownKey(villager));
    this.reads.thank(villager, CROWN_POINTS);
    this.ctx.moments.push({ kind: 'crowned', villager });
    const name = this.reads.look().name;
    const winner = VILLAGERS[villager].name;
    const others = VILLAGER_IDS.filter((v) => v !== villager && this.here(v));
    const sport = others[hashString(`sport:${villager}`) % Math.max(1, others.length)];
    const cheer = sport ? ` ${GOOD_SPORTS[sport].replaceAll('{winner}', winner)}` : '';
    return {
      line: fill(CROWNED[villager], { name }),
      aside: `${winner} wins best costume, and takes home ${PRIZE}!${cheer}`,
    };
  }

  /** What a neighbour is dressed as now: Cody at the finale in the other half of hers. */
  costumeOf(villager: VillagerId): Costume | null {
    const now = this.ctx.clock.now();
    const day = dayKey(now);
    if (!inCostume(villager, day)) return null;
    if (villager !== 'cody' || !this.here('cody')) return 'own';
    const half = codyHalf(this.reads.look());
    return half === 'lion' ? 'own' : half;
  }

  /** Whether Cody's at the finale with her, for their photo. */
  canPhoto(villager: VillagerId): boolean {
    return villager === 'cody' && this.here('cody');
  }

  /** Their photo, in their costumes (question 75): a moment the view takes the picture for. */
  photo(): WorldEvent | null {
    if (!this.canPhoto('cody')) return null;
    const look = this.reads.look();
    const hers = herHalf(look);
    const caption = PHOTO_CAPTION.replace('{year}', dayKey(this.ctx.clock.now()).slice(0, 4))
      .replace('{her}', hers ? HALF_NAMES[hers] : HER_PLAIN)
      .replace('{him}', HALF_NAMES[codyHalf(look)]);
    const event: WorldEvent = { kind: 'photo', with: 'cody', caption };
    this.ctx.moments.push(event);
    return event;
  }
}
