import { describe, expect, it } from 'vitest';
import { HAPPENING_IDS, HAPPENINGS } from '../../src/data/happenings';
import { PROP_FOOTPRINT, spotOf, TOWN } from '../../src/data/maps';
import { parseMap } from '../../src/systems/grid';
import { DEFAULT_LOOK } from '../../src/data/outfits';
import { harness } from './harness';

/** The tiles a block covers. */
function cover(tx: number, ty: number, w: number, h: number): string[] {
  return Array.from({ length: w * h }, (_, i) => `${tx + (i % w)},${ty + Math.floor(i / w)}`);
}

describe('film night (0.2 J3)', () => {
  it("sets out on open ground, clear of every stall's lot and her neighbours' spots", () => {
    const map = parseMap(TOWN);
    const taken = new Set([
      ...(TOWN.popUpLots ?? []).flatMap((l) => cover(l.tx, l.ty, 3, 2)),
      ...(TOWN.peddlerSpots ?? []).flatMap((l) => cover(l.tx, l.ty, 2, 2)),
      ...(TOWN.lots ?? []).flatMap((l) => {
        const { w, h } = PROP_FOOTPRINT[l.prop];
        return cover(l.tx, l.ty, w, h);
      }),
      ...Object.values(TOWN.spots ?? {}).map((t) => `${t.tx},${t.ty}`),
    ]);
    for (const id of HAPPENING_IDS) {
      const { set = [], where } = HAPPENINGS[id];
      const seats = 'seats' in where ? where.seats.map((s) => spotOf('town', s)) : [];
      for (const piece of set) {
        const { w, h } = PROP_FOOTPRINT[piece.prop];
        for (const t of cover(piece.tx, piece.ty, w, h)) {
          const [tx, ty] = t.split(',').map(Number) as [number, number];
          expect(
            map.props.some((p) => tx >= p.tx && tx < p.tx + p.w && ty >= p.ty && ty < p.ty + p.h),
            t,
          ).toBe(false);
          expect(taken.has(t), `${id} ${piece.prop} at ${t}`).toBe(false);
          expect(
            seats.some((s) => `${s.tx},${s.ty}` === t),
            t,
          ).toBe(false);
        }
      }
      for (const s of seats) {
        const at = `${s.tx},${s.ty}`;
        const inALot = [...(TOWN.popUpLots ?? [])].some((l) =>
          cover(l.tx, l.ty, 3, 2).includes(at),
        );
        expect(inALot, `${id} seat ${at}`).toBe(false);
      }
    }
  });

  it("sets the screen and the popcorn out on its day only, solid while they're there", () => {
    const h = harness(TOWN);
    const town = h.world.zones.outdoor('town')!;
    h.clock.set(new Date(2026, 9, 10, 12));
    const set = town.decorations!.props().map((p) => p.id);
    expect(set).toContain('filmScreen');
    expect(set).toContain('popcornTable');
    expect(town.canWalk(20, 28)).toBe(false);
    h.clock.set(new Date(2026, 9, 11, 12));
    expect(town.decorations!.props().map((p) => p.id)).not.toContain('filmScreen');
    expect(town.canWalk(20, 28)).toBe(true);
  });

  it('seats the town facing the screen, and Cody hands her popcorn', () => {
    const h = harness(TOWN, { closet: { look: { ...DEFAULT_LOOK, name: 'Em' } } });
    h.clock.set(new Date(2026, 9, 10, 20));
    h.tick(1);
    h.until(
      () => h.world.neighbourhood.neighbours.every((n) => n.zone !== 'town' || !n.moving),
      'everyone in their seats',
      600_000,
    );
    h.tick(2);
    const cody = h.world.neighbourhood.neighbour('cody');
    expect(cody.zone).toBe('town');
    expect(cody.tile.ty).toBeGreaterThan(28);
    expect(cody.facing).toBe('up');
    h.world.tapTile(cody.tile.tx, cody.tile.ty);
    h.until(() => h.world.neighbourhood.talkingTo === 'cody', 'walking up to Cody', 120_000);
    h.world.neighbourhood.talk('cody');
    expect(h.world.bag.count('popcorn')).toBe(1);
  });
});
