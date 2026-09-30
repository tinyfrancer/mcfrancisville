import { CALENDAR, type FestivalId } from '../../data/calendar';
import { EGG_ITEM, EGGS_HIDDEN, type DecorId } from '../../data/holidays';
import { festivalsOn } from '../../systems/calendar';
import type { Tile } from '../../data/maps';
import { dayKey, hourOf } from '../../systems/clock';
import { decorOn, eggKey, eggsOn, freezesOn, goesUpOn, skyAt } from '../../systems/holidays';
import { dressingUp, inCostume } from '../../systems/costumes';
import type { MapZoneId, VillagerId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Takings } from './Takings';

/**
 * The holidays in town (phase U): whose decorations are up, what's in the sky tonight, and
 * Easter's eggs, hidden round town for her to find by walking onto them, and her neighbours in
 * costume through the Halloween Festival (0.2's J2). All of it is worked out
 * from the day key; the eggs she has found are kept in `Takings`, once a day. The morning the
 * decorations go up she's told, the first time she's out in town; like the weather's word, that's
 * kept only while the game is open.
 */
export class Holidays {
  private readonly ctx: WorldContext;
  private readonly bag: Bag;
  private readonly takings: Takings;
  /** The place outdoors she is in, or null indoors. */
  private readonly outside: () => MapZoneId | null;
  /** Who lives in town today. */
  private readonly residents: () => readonly VillagerId[];
  /** The day she was last told the decorations went up. */
  private told = '';

  constructor(
    ctx: WorldContext,
    keeps: { bag: Bag; takings: Takings },
    outside: () => MapZoneId | null,
    residents: () => readonly VillagerId[],
  ) {
    this.ctx = ctx;
    this.bag = keeps.bag;
    this.takings = keeps.takings;
    this.outside = outside;
    this.residents = residents;
  }

  /** Whether a neighbour is in their costume today. */
  inCostume(villager: VillagerId): boolean {
    return inCostume(villager, this.day);
  }

  private get day(): string {
    return dayKey(this.ctx.clock.now());
  }

  /** Whose decorations are up today, if anyone's. */
  decor(): DecorId | null {
    return decorOn(this.day);
  }

  /** The festival whose banner is strung across the square today, if one is on. */
  banner(): FestivalId | null {
    return festivalsOn(this.day).find((id) => CALENDAR[id].banner) ?? null;
  }

  /** What's in the sky over town now: fireworks, snow, or nothing special. */
  sky(): 'fireworks' | 'snow' | null {
    const now = this.ctx.clock.now();
    return skyAt(dayKey(now), hourOf(now));
  }

  /** Easter's eggs still hidden in town: none on any other day, or once she has found them all. */
  eggs(): Tile[] {
    return eggsOn(this.day).filter((t) => this.takings.isReady(eggKey(t)));
  }

  /** She has walked onto a tile in town: the egg hidden there, if there is one, is hers. */
  pickUp(here: Tile): WorldEvent[] {
    const egg = this.eggs().find((t) => t.tx === here.tx && t.ty === here.ty);
    if (!egg) return [];
    this.takings.take(eggKey(egg));
    this.bag.add(EGG_ITEM, 1);
    this.ctx.events.emit('bag', this.bag.contents);
    const left = this.eggs().length;
    if (left === 0) this.ctx.signals.emit('thrilled', { by: 'find' });
    return [{ kind: 'foundEgg', found: EGGS_HIDDEN - left, left }];
  }

  /**
   * Tells her the decorations are up, on the day they go up, that the pond has frozen over, on
   * the day it does, and who has put a costume on this morning, when she's first out in town.
   */
  check(): void {
    const day = this.day;
    if (this.told === day || this.outside() !== 'town') return;
    this.told = day;
    const decor = goesUpOn(day);
    if (decor) this.ctx.moments.push({ kind: 'decorated', decor });
    if (freezesOn(day)) this.ctx.moments.push({ kind: 'frozen' });
    const living = this.residents();
    const dressed = dressingUp(day).filter((id) => living.includes(id));
    if (dressed.length > 0) this.ctx.moments.push({ kind: 'dressedUp', villagers: dressed });
  }
}
