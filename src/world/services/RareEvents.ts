import {
  PASSERS,
  STRAY_CANDY,
  STRAY_POINTS,
  type PasserId,
  type RareEventId,
  type StrayRow,
} from '../../data/rareEvents';
import { dayKey, hourOf } from '../../systems/clock';
import { fill } from '../../systems/friendship';
import type { Tile } from '../../systems/pathfinding';
import {
  arrivesOn,
  helloOf,
  passersAt,
  rareEventBegan,
  rareEventOn,
  rareSkyAt,
  strayOn,
  type Passing,
} from '../../systems/rareEvents';
import { popUpLot, peddlerSpot } from '../../systems/shop';
import type { MapZoneId, VillagerId, ZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { Herald, WorldEvent } from '../events';
import type { Stalls } from '../zones/Stalls';
import type { Mailbox } from './Mailbox';
import type { Takings } from './Takings';
import type { Wallet } from './Wallet';

/** What the rare events reach into. */
export interface RareEventKeeps {
  bag: Bag;
  takings: Takings;
  wallet: Wallet;
  mailbox: Mailbox;
  stalls: Stalls;
  /** A little more friendship with whoever she carried a critter home to. */
  thank: (villager: VillagerId, points: number) => void;
  /** The place outdoors she is in, or null indoors. */
  outside: () => MapZoneId | null;
  /** Her name, for what's said to her. */
  name: () => string;
  /** Where the town's pop-up lots and the Moon Pie Man's spots are, to tell an arrival. */
  lots: { popUp: readonly Tile[]; peddler: readonly Tile[] };
}

/** A critter gone astray today, where it waits, until she has found it. */
export type Stray = StrayRow & Tile;

/** Takings keys, each once a day (`onceADay`'s `rare:`). */
const HERALD = 'rare:herald:';
const MET = 'rare:met:';
const FOUND = 'rare:stray';
const HOME = 'rare:strayHome';

/**
 * Rare events (V1's R3): what's out of the ordinary today, worked out from the day key; who's
 * passing through and what they say; the critter gone astray and carrying it home; and telling her
 * of it all the first time she's out that day, with a keepsake in the mail the first time each comes.
 * What she has done today is kept in `Takings`, and the keepsakes are letters, so nothing new is
 * saved.
 */
export class RareEvents {
  private readonly ctx: WorldContext;
  private readonly keeps: RareEventKeeps;
  /** When it last looked for anything to tell, by the day, hour and whether she was in town. */
  private looked = '';

  constructor(ctx: WorldContext, keeps: RareEventKeeps) {
    this.ctx = ctx;
    this.keeps = keeps;
  }

  private get day(): string {
    return dayKey(this.ctx.clock.now());
  }

  /** Today's rare event, if there is one. */
  today(): RareEventId | null {
    return rareEventOn(this.day);
  }

  /** The day today's rare event began: the stall's Monday, or today. */
  began(): string {
    return rareEventBegan(this.day);
  }

  /** What a rare event puts in the sky now: shooting stars, or snow all day. */
  sky(): 'meteors' | 'snow' | null {
    const now = this.ctx.clock.now();
    return rareSkyAt(dayKey(now), hourOf(now));
  }

  /** Who is passing through now, and where each stands, in a place or everywhere. */
  passers(zone?: ZoneId): Passing[] {
    const now = this.ctx.clock.now();
    return passersAt(dayKey(now), hourOf(now)).filter((p) => zone === undefined || p.zone === zone);
  }

  /** Who stands on a tile of a place, if anyone passing through does. */
  passerAt(zone: ZoneId, tx: number, ty: number): Passing | null {
    return this.passers(zone).find((p) => p.tx === tx && p.ty === ty) ?? null;
  }

  /** Whether she has said hello to someone passing through today. */
  hasMet(id: PasserId): boolean {
    return !this.keeps.takings.isReady(`${MET}${id}`);
  }

  /** She has walked up to someone passing through: their hello and a little gift, once a day. */
  meet(id: PasserId): WorldEvent {
    const key = `${MET}${id}`;
    if (!this.keeps.takings.isReady(key)) {
      return { kind: 'metPasser', who: id, line: this.said(PASSERS[id].again), gift: null };
    }
    this.keeps.takings.take(key);
    const { line, gift } = helloOf(id, this.day);
    this.keeps.bag.add(gift, 1);
    this.ctx.events.emit('bag', this.keeps.bag.contents);
    // The wayfarer's postcard follows the first hello ever.
    const posted = id === 'wayfarer' && this.keepsake('stranger');
    return {
      kind: 'metPasser',
      who: id,
      line: this.said(line),
      gift,
      ...(posted ? { posted } : {}),
    };
  }

  /** The critter gone astray today, while it's still waiting to be found. */
  stray(): Stray | null {
    const stray = strayOn(this.day);
    return stray && this.keeps.takings.isReady(FOUND) ? stray : null;
  }

  /** The critter she's carrying home, if she's found it today and not yet handed it back. */
  carrying(): Stray | null {
    const stray = strayOn(this.day);
    if (!stray || this.keeps.takings.isReady(FOUND)) return null;
    return this.keeps.takings.isReady(HOME) ? stray : null;
  }

  /** She has walked onto a tile outdoors: the critter gone astray, if it waits there, comes with her. */
  pickUp(zone: MapZoneId, here: Tile): WorldEvent[] {
    const stray = this.stray();
    if (!stray || stray.zone !== zone || stray.tx !== here.tx || stray.ty !== here.ty) return [];
    this.keeps.takings.take(FOUND);
    return [{ kind: 'foundStray', critter: stray.critter, line: this.said(stray.found) }];
  }

  /** Whether she's carrying a neighbour's critter home to them. */
  canHandBack(villager: VillagerId): boolean {
    return this.carrying()?.owner === villager;
  }

  /** She hands the critter back: their thanks, a little Candy, and the rosette the first time. */
  handBack(villager: VillagerId): { line: string; candy: number; posted: boolean } | null {
    const stray = this.carrying();
    if (!stray || stray.owner !== villager) return null;
    this.keeps.takings.take(HOME);
    this.keeps.wallet.earn(STRAY_CANDY);
    this.keeps.thank(villager, STRAY_POINTS);
    const posted = this.keepsake('lostCritter');
    return { line: this.said(stray.thanks), candy: STRAY_CANDY, posted };
  }

  /** A line with her name in it. */
  private said(line: string): string {
    return fill(line, { name: this.keeps.name() });
  }

  /**
   * Posts a rare event's keepsake the first time it comes (a letter is only ever sent once),
   * quietly, so the mail's toast doesn't take the line from the moment's: that says so instead.
   * True if it was posted now.
   */
  private keepsake(id: RareEventId): boolean {
    const letter = `rare:${id}`;
    if (this.keeps.mailbox.letters.all.some((m) => m.id === letter)) return false;
    this.keeps.mailbox.post(letter, this.day, true);
    return this.keeps.mailbox.letters.all.some((m) => m.id === letter);
  }

  /** What's out of the ordinary today that she hasn't been told of. */
  private heralds(zone: MapZoneId): Herald[] {
    const day = this.day;
    const now = this.ctx.clock.now();
    const told: Herald[] = [];
    const rare = this.today();
    // The stall is told each day of its week she's out, its first day as an arrival.
    if (rare) told.push({ rare });
    for (const p of this.passers()) {
      if (PASSERS[p.id].when && arrivesOn(p.id, day)) told.push({ passer: p.id });
    }
    if (zone === 'town') {
      const yesterday = now - 86_400_000;
      const { popUp, peddler } = this.keeps.lots;
      if (this.keeps.stalls.moonPieCart() && !peddlerSpot(peddler, yesterday)) {
        told.push({ shop: 'moonPie' });
      }
      if (this.keeps.stalls.popUp() && !popUpLot(popUp, yesterday)) told.push({ shop: 'popUp' });
    }
    return told.filter((h) => this.keeps.takings.isReady(keyOf(h)));
  }

  /**
   * Tells her what's out of the ordinary today the first time she's out (in town, for the Moon Pie
   * Man and the pop-up), once a day each, and posts a rare event's keepsake the first time it
   * comes (the wayfarer's after their hello, the stray's once it's home).
   */
  check(): void {
    const zone = this.keeps.outside();
    if (!zone || !this.ctx.moments.quiet) return;
    // What there is to tell changes with the hour and with being in town, so it's looked at as
    // they change, not every step.
    const now = this.ctx.clock.now();
    const looked = `${dayKey(now)}@${Math.floor(hourOf(now))}:${zone === 'town'}`;
    if (looked === this.looked) return;
    this.looked = looked;
    for (const what of this.heralds(zone)) {
      this.keeps.takings.take(keyOf(what));
      const kept = 'rare' in what && what.rare !== 'stranger' && what.rare !== 'lostCritter';
      const posted = kept && this.keepsake(what.rare);
      this.ctx.moments.push({ kind: 'heralded', what, ...(posted ? { posted } : {}) });
    }
  }
}

/** The takings key a herald is kept under, today's. */
function keyOf(what: Herald): string {
  if ('rare' in what) return `${HERALD}${what.rare}`;
  if ('passer' in what) return `${HERALD}${what.passer}`;
  return `${HERALD}${what.shop}`;
}
