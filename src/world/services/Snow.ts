import { LAUGH_MS, THROW_AT_TILES, THROW_BACK_MS, THROW_TILES } from '../../data/snow';
import { dayKey } from '../../systems/clock';
import { tileAt } from '../../systems/grid';
import type { Tile } from '../../systems/pathfinding';
import { hatOf, snowyOn, thawsOn } from '../../systems/snow';
import type { Facing, MapZoneId, VillagerId } from '../../types/ids';
import type { Feeling } from '../../types/mood';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Home } from '../Home';
import type { Movement } from '../Movement';
import type { Yard } from '../Yard';
import type { Zones } from '../zones/Zones';
import type { Neighbourhood } from './Neighbourhood';

/** What playing in the snow reads of the rest of the world. */
export interface SnowKeeps {
  yard: Yard;
  home: Home;
  bag: Bag;
  zones: Zones;
  neighbourhood: Neighbourhood;
  movement: () => Movement;
  /** The place outdoors she's in, or null indoors. */
  outside: () => MapZoneId | null;
}

/** Where a snowball is thrown to: a neighbour, her, or a spot on the ground. */
export type Target = { villager: VillagerId } | { her: true } | Tile;

const STEP: Record<Facing, Tile> = {
  down: { tx: 0, ty: 1 },
  up: { tx: 0, ty: -1 },
  left: { tx: -1, ty: 0 },
  right: { tx: 1, ty: 0 },
};

/**
 * Snow days (1.6's X4, decision 383). A tap on herself on the snow with empty hands: in her yard
 * she rolls a snowball beside her, walks up to it to roll it bigger, and again to stand it up as a
 * snowman (a yard piece like any, saved by `Yard`); anywhere else she throws one, at a neighbour
 * close by if there is one, who laughs and throws one back, gently. At the thaw her snowmen come
 * in, a keepsake each. Nothing here is saved: the snowball, the laughter and the snowball coming
 * back are the moment's.
 */
export class Snow {
  private readonly ctx: WorldContext;
  private readonly keeps: SnowKeeps;
  /** Who throws one back at her, and when. */
  private comingBack: { by: VillagerId; at: number } | null = null;
  /** Who's laughing, till when. */
  private readonly laughs = new Map<VillagerId, number>();
  /** The day she was told what the snow in her yard is for, while the game is open. */
  private hinted = '';

  constructor(ctx: WorldContext, keeps: SnowKeeps) {
    this.ctx = ctx;
    this.keeps = keeps;
  }

  /** Whether there's snow underfoot to play in where she stands. */
  underfoot(here: Tile): boolean {
    const zone = this.keeps.outside();
    if (!zone) return false;
    const map = this.keeps.zones.outdoor(zone)?.map;
    return !!map && snowyOn(dayKey(this.ctx.clock.now()), tileAt(map, here.tx, here.ty));
  }

  /**
   * A tap on herself in the snow, her hands empty: a snowball rolled beside her in her yard, or
   * thrown. Nothing (and false) where there's no snow underfoot.
   */
  play(here: Tile, facing: Facing): WorldEvent[] | null {
    if (!this.underfoot(here)) return null;
    const { yard } = this.keeps;
    if (this.keeps.outside() === 'town' && yard.contains(here.tx, here.ty)) {
      const rolled = this.rollBeside(here, facing);
      if (rolled) return [rolled];
    }
    return [this.throwFrom(here, facing)];
  }

  /** The tile she faces first, then the rest round her, for a snowball in her yard. */
  private rollBeside(here: Tile, facing: Facing): WorldEvent | null {
    const { yard } = this.keeps;
    const order: Facing[] = [facing, 'down', 'right', 'left', 'up'];
    for (const f of order) {
      const at = { tx: here.tx + STEP[f].tx, ty: here.ty + STEP[f].ty };
      if (!yard.contains(at.tx, at.ty) || !this.underfoot(at)) continue;
      if (yard.rollSnowball(at, here)) {
        this.keeps.movement().player.facing = f;
        return { kind: 'snowball', did: 'rolled', tx: at.tx, ty: at.ty };
      }
    }
    return null;
  }

  /** Whether her snowball is on a tile, to walk up to and roll on. */
  snowballAt(tx: number, ty: number): boolean {
    const ball = this.keeps.yard.snowball;
    return this.keeps.outside() === 'town' && ball?.tx === tx && ball.ty === ty;
  }

  /** Walked up to her snowball: rolled bigger, or the second time, stood up as a snowman. */
  roll(here: Tile): WorldEvent[] {
    const { yard } = this.keeps;
    const ball = yard.snowball;
    if (!ball) return [];
    if (ball.size < 2) {
      yard.growSnowball();
      return [{ kind: 'snowball', did: 'grew', tx: ball.tx, ty: ball.ty }];
    }
    const { tx, ty } = ball;
    const id = hatOf(tx, ty);
    if (!yard.standSnowman(id, here)) return [];
    this.ctx.events.emit('home', this.keeps.home);
    return [{ kind: 'snowman', snowman: id, tx, ty }];
  }

  /** A snowball thrown: at the nearest neighbour within reach, or a few tiles the way she faces. */
  private throwFrom(here: Tile, facing: Facing): WorldEvent {
    const zone = this.keeps.outside();
    const near = zone
      ? this.keeps.neighbourhood
          .neighboursIn(zone)
          .map((n) => ({ id: n.id, far: Math.hypot(n.tile.tx - here.tx, n.tile.ty - here.ty) }))
          .filter((n) => n.far <= THROW_AT_TILES)
          .sort((a, b) => a.far - b.far)[0]
      : undefined;
    if (near) {
      const now = this.ctx.clock.now();
      this.laughs.set(near.id, now + THROW_BACK_MS + LAUGH_MS);
      this.comingBack = { by: near.id, at: now + THROW_BACK_MS };
      return { kind: 'threw', by: 'her', at: { villager: near.id } };
    }
    const step = STEP[facing];
    const at = { tx: here.tx + step.tx * THROW_TILES, ty: here.ty + step.ty * THROW_TILES };
    return { kind: 'threw', by: 'her', at };
  }

  /** How a neighbour she threw a snowball at feels: laughing, for a while. */
  feelingOf(id: VillagerId): Feeling | null {
    const until = this.laughs.get(id);
    return until !== undefined && until > this.ctx.clock.now() ? 'laugh' : null;
  }

  /**
   * Each step: a snowball coming back at her once it's due (if they're still about), the thaw
   * once the snow's gone, and the first time she's in her yard on a snowy day, what it's for.
   */
  check(): void {
    const now = this.ctx.clock.now();
    const day = dayKey(now);
    const back = this.comingBack;
    if (back && now >= back.at) {
      this.comingBack = null;
      const zone = this.keeps.outside();
      const there = zone && this.keeps.neighbourhood.neighbour(back.by).zone === zone;
      if (there) this.ctx.moments.push({ kind: 'threw', by: back.by, at: { her: true } });
    }
    if (thawsOn(day)) {
      const count = this.keeps.yard.thaw();
      if (count > 0) {
        this.keeps.bag.add('meltlessSnowman', count);
        this.ctx.events.emit('bag', this.keeps.bag.contents);
        this.ctx.events.emit('home', this.keeps.home);
        this.ctx.moments.push({ kind: 'thawed', count });
      }
      return;
    }
    if (this.hinted === day) return;
    const her = this.keeps.movement().tile;
    if (this.keeps.outside() !== 'town' || !this.keeps.yard.contains(her.tx, her.ty)) return;
    if (!this.underfoot(her)) return;
    this.hinted = day;
    this.ctx.moments.push({ kind: 'snowHint' });
  }
}
