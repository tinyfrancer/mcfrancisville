import { CRITTERS, flies, isCritter } from '../../data/critters';
import { MUSEUM_LABELS, MUSEUM_LETTERS, MUSEUM_SPECIAL } from '../../data/museum';
import { dayKey, hourOf } from '../../systems/clock';
import {
  critterKey,
  crittersOut,
  flutterTo,
  townHabitats,
  type Habitats,
  type OutCritter,
} from '../../systems/critters';
import { hashString } from '../../systems/gathering';
import { walkable, type TileMap } from '../../systems/grid';
import type { Tile } from '../../systems/pathfinding';
import type { CritterId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { Cabinet } from '../Cabinet';
import type { WorldContext } from '../context';
import type { Critter, WorldEvent } from '../events';
import type { TownZone } from '../zones/TownZone';
import type { Mailbox } from './Mailbox';
import type { Takings } from './Takings';

/** How long a swing of her net takes. */
export const NET_MS = 420;

/** What catching and donating reach into: where she keeps what she catches, and her mail. */
export interface CollectingKeeps {
  bag: Bag;
  takings: Takings;
  cabinet: Cabinet;
  mailbox: Mailbox;
}

/**
 * Her net and her Curiosity Cabinet: the critters out in town this hour and where, catching them,
 * and giving them to Wrapunzel's museum (decisions.md 62–66).
 */
export class Collecting {
  private readonly ctx: WorldContext;
  private readonly keeps: CollectingKeeps;
  private readonly town: TownZone;
  private readonly map: TileMap;
  private readonly outside: () => boolean;
  /** Where critters can be in town, from the map. */
  readonly habitats: Habitats;
  /** The hour's critters, dealt once an hour, before today's catches are taken out. */
  private dealt: { hour: string; out: OutCritter[] } | null = null;
  /** Critters that have fluttered off this hour, by key: where to, and how often. */
  private fluttered = new Map<string, { tile: Tile; times: number }>();
  /** When her net's swing ends. */
  private netUntil = 0;

  constructor(
    ctx: WorldContext,
    keeps: CollectingKeeps,
    town: TownZone,
    peopled: boolean,
    outside: () => boolean,
  ) {
    this.ctx = ctx;
    this.keeps = keeps;
    this.town = town;
    this.map = town.map;
    // A town without neighbours (a test's small map) has no critters either.
    this.habitats = townHabitats(this.map, peopled);
    this.outside = outside;
  }

  /**
   * The critters out in town now, and where, less any she has caught this hour. The hour's are
   * dealt once (decisions.md 4); one that has fluttered off is wherever it went.
   */
  critters(): Critter[] {
    const now = this.ctx.clock.now();
    const day = dayKey(now);
    const hour = Math.floor(hourOf(now));
    const which = `${day}@${hour}`;
    if (this.dealt?.hour !== which) {
      this.dealt = { hour: which, out: crittersOut(day, hour, this.habitats, this.canBe) };
      this.fluttered.clear();
    }
    const out: Critter[] = [];
    for (const c of this.dealt.out) {
      const key = critterKey(hour, c.slot);
      if (!this.keeps.takings.isReady(key)) continue;
      const moved = this.fluttered.get(key);
      out.push(moved ? { ...c, ...moved.tile, key } : { ...c, key });
    }
    return out;
  }

  /** One of this hour's critters, by its key, if it's still out. */
  find(key: string): Critter | undefined {
    return this.critters().find((c) => c.key === key);
  }

  /**
   * Where a critter may be today: open ground nothing is standing on, or the pond where it can be
   * reached from open ground.
   */
  private canBe = (t: Tile): boolean => {
    if (this.town.canWalk(t.tx, t.ty)) return true;
    if (walkable(this.map, t.tx, t.ty)) return false;
    for (let y = t.ty - 1; y <= t.ty + 1; y++) {
      for (let x = t.tx - 1; x <= t.tx + 1; x++) if (this.town.canWalk(x, y)) return true;
    }
    return false;
  };

  /** The critter on a tile out in town; one that flies can be tapped in the air above it too. */
  critterAt(tx: number, ty: number): Critter | undefined {
    if (!this.outside()) return undefined;
    const air =
      this.town.propAt(tx, ty) === undefined &&
      !this.map.patches.some((p) => p.tx === tx && p.ty === ty);
    return this.critters().find(
      (c) => c.tx === tx && (c.ty === ty || (air && flies(c.critter) && c.ty - 1 === ty)),
    );
  }

  /** Whether her net is mid-swing, and how far through: 0 as it starts, 1 as it ends. */
  netSwing(): number | null {
    const left = this.netUntil - this.ctx.clock.now();
    return left > 0 && left <= NET_MS ? 1 - left / NET_MS : null;
  }

  /**
   * A swing of her net at a critter within reach. A wary one flutters off to somewhere near the
   * first time or two; otherwise it's caught, into her bag and her Curiosity Cabinet.
   */
  swing(critter: Critter): WorldEvent {
    const now = this.ctx.clock.now();
    const day = dayKey(now);
    this.netUntil = now + NET_MS;
    const id = critter.critter;
    const row = CRITTERS[id];
    const times = this.fluttered.get(critter.key)?.times ?? 0;
    if (times < row.wary) {
      const others = new Set(this.critters().map((c) => `${c.tx},${c.ty}`));
      const to = flutterTo(
        critter,
        this.habitats[row.habitat],
        (t) => this.canBe(t) && !others.has(`${t.tx},${t.ty}`),
      );
      if (to) {
        this.fluttered.set(critter.key, { tile: to, times: times + 1 });
        return { kind: 'fled', critter: id };
      }
    }
    const { bag, takings, cabinet } = this.keeps;
    takings.take(critter.key);
    bag.add(id, 1);
    const first = cabinet.record(id, day);
    this.ctx.events.emit('bag', bag.contents);
    if (first) this.ctx.events.emit('cabinet', cabinet);
    if (row.rarity === 'rare') this.ctx.signals.emit('thrilled', { by: 'catch' });
    return { kind: 'caught', critter: id, first };
  }

  /**
   * Gives a critter from her bag to Wrapunzel's museum, to go on show: what its label says, or null
   * if she hasn't one, or one is already on show. Wrapunzel writes as the cases fill.
   */
  donate(id: CritterId): string | null {
    const { bag, cabinet, mailbox } = this.keeps;
    if (!isCritter(id) || cabinet.isDonated(id) || !bag.remove(id)) return null;
    cabinet.donate(id);
    this.ctx.events.emit('bag', bag.contents);
    this.ctx.events.emit('cabinet', cabinet);
    const day = dayKey(this.ctx.clock.now());
    for (const letter of MUSEUM_LETTERS) {
      if (cabinet.onShow >= letter.donated) mailbox.post(`museum:${letter.donated}`, day);
    }
    const label = MUSEUM_SPECIAL[id] ?? MUSEUM_LABELS[hashString(id) % MUSEUM_LABELS.length]!;
    return label.replaceAll('{critter}', CRITTERS[id].name.toLowerCase());
  }
}
