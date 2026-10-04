import { describe, expect, it } from 'vitest';
import { FakeClock } from '../../src/systems/clock';
import type { Placed } from '../../src/data/home';
import type { Stack } from '../../src/world/Bag';
import { Home } from '../../src/world/Home';
import { fromSave, World } from '../../src/world/World';
import { harness } from './harness';

/** Her bag for these: a moth and a frog to show, roses, a squishy, her skates and a bone. */
const BAG: Stack[] = [
  { id: 'lunaMoth', count: 1 },
  { id: 'lilyFrog', count: 2 },
  { id: 'rose', count: 3 },
  { id: 'ghostGooBall', count: 1 },
  { id: 'iceSkates', count: 1 },
  { id: 'wood', count: 4 },
];

const JAR: Placed = { id: 'bellJar', tx: 2, ty: 4, turn: 0 };
const VASE: Placed = { id: 'budVase', tx: 6, ty: 6, turn: 0 };
const SHELF: Placed = { id: 'squishyShelf', tx: 9, ty: 4, turn: 0 };

/** Walks her in through her front door, with a bell jar, a bud vase and her squishy shelf out. */
function atHome(placed: Placed[] = [JAR, VASE, SHELF], bag: Stack[] = BAG) {
  const h = harness(undefined, {
    finds: { bag },
    home: { placed: placed.map((p) => ({ ...p })) },
  });
  const house = h.world.map.props.find((p) => p.id === 'homeHouse')!;
  h.world.tapTile(house.tx + 1, house.ty + 1);
  h.until(() => h.world.scene === 'home', 'going in');
  return h;
}

/** Walks her up to the piece at a tile, as a tap does. */
function walkUp(h: ReturnType<typeof atHome>, tx: number, ty: number) {
  h.world.tapTile(tx, ty);
  return h.until(() => !h.world.player.moving, 'walking up to it');
}

const piece = (world: World, id: string) => world.home.placed.find((p) => p.id === id)!;

describe('display pieces show one thing from her bag (0.3’s H2)', () => {
  it('opens on the piece she walks up to, and offers only what it takes', () => {
    const h = atHome();
    const events = walkUp(h, JAR.tx, JAR.ty);
    expect(events).toContainEqual(expect.objectContaining({ kind: 'arrived', piece: 'bellJar' }));
    expect(h.world.display.piece).toBe(piece(h.world, 'bellJar'));
    // Critters, squishies and flowers, never her skates or the wood.
    expect(h.world.display.offers().map((s) => s.id)).toEqual([
      'lunaMoth',
      'lilyFrog',
      'rose',
      'ghostGooBall',
    ]);
    walkUp(h, VASE.tx, VASE.ty);
    expect(h.world.display.offers()).toEqual([{ id: 'rose', count: 3 }]);
  });

  it('puts a moth in a jar and gives it back, nothing lost', () => {
    const h = atHome();
    walkUp(h, JAR.tx, JAR.ty);
    expect(h.world.display.show('lunaMoth')).toBe(true);
    expect(h.world.bag.count('lunaMoth')).toBe(0);
    expect(piece(h.world, 'bellJar').shows).toBe('lunaMoth');
    expect(h.world.display.contents(piece(h.world, 'bellJar'))).toEqual(['lunaMoth']);
    // A frog swapped in sends the moth back to her bag.
    expect(h.world.display.show('lilyFrog')).toBe(true);
    expect(h.world.bag.count('lunaMoth')).toBe(1);
    expect(h.world.bag.count('lilyFrog')).toBe(1);
    expect(h.world.display.empty()).toBe(true);
    expect(h.world.bag.count('lilyFrog')).toBe(2);
    expect(piece(h.world, 'bellJar').shows).toBeUndefined();
    expect(h.world.display.empty()).toBe(false);
  });

  it('takes nothing it can’t hold, nothing she hasn’t got, and nothing away from home', () => {
    const h = atHome();
    walkUp(h, VASE.tx, VASE.ty);
    expect(h.world.display.show('lunaMoth')).toBe(false);
    expect(h.world.display.show('iceSkates')).toBe(false);
    expect(h.world.bag.count('lunaMoth')).toBe(1);
    const outside = harness(undefined, { finds: { bag: BAG } });
    expect(outside.world.display.piece).toBeNull();
    expect(outside.world.display.show('rose')).toBe(false);
  });

  it('gives back what was on show when the piece is put away', () => {
    const h = atHome();
    walkUp(h, JAR.tx, JAR.ty);
    h.world.display.show('lunaMoth');
    h.world.decorating.start(piece(h.world, 'bellJar'));
    expect(h.world.decorating.putAwaySelected()).toBe(true);
    expect(h.world.bag.count('lunaMoth')).toBe(1);
    expect(h.world.home.stored).toContainEqual({ id: 'bellJar', count: 1 });
    expect(h.world.display.piece).toBeNull();
  });

  it('keeps what is on show in the save', () => {
    const h = atHome();
    walkUp(h, JAR.tx, JAR.ty);
    h.world.display.show('lunaMoth');
    const clock = new FakeClock(new Date(2026, 8, 26, 12));
    const again = new World({ clock, ...fromSave(h.world.save()) });
    expect(piece(again, 'bellJar').shows).toBe('lunaMoth');
    expect(again.bag.count('lunaMoth')).toBe(0);
  });

  it('puts in her chest anything saved on show that the piece can no longer hold', () => {
    const home = new Home({
      placed: [
        { ...VASE, shows: 'lunaMoth' },
        { ...JAR, shows: 'rose' },
        { id: 'pumpkinChair', tx: 4, ty: 6, turn: 0, shows: 'wood' },
        { ...JAR, tx: 2, ty: 4, shows: 'ghostGooBall' },
        { ...JAR, tx: 3, ty: 9, shows: 'someDayThing' as never },
      ],
    });
    expect(home.placed.find((p) => p.id === 'budVase')?.shows).toBeUndefined();
    expect(home.placed.find((p) => p.id === 'bellJar' && p.tx === 2)?.shows).toBe('rose');
    expect(home.placed.find((p) => p.id === 'pumpkinChair')?.shows).toBeUndefined();
    // The second jar on the first's tile goes in the chest, and its squishy with it.
    expect(home.stored).toContainEqual({ id: 'bellJar', count: 1 });
    expect(home.items).toEqual([
      { id: 'lunaMoth', count: 1 },
      { id: 'wood', count: 1 },
      { id: 'ghostGooBall', count: 1 },
    ]);
  });
});

describe('set pieces show what she owns (0.3’s H2)', () => {
  it('fills the squishy shelf with one of each she has, bag, chest and on show alike', () => {
    const bag: Stack[] = [
      { id: 'swampGooBall', count: 2 },
      { id: 'ghostGooBall', count: 1 },
      { id: 'booBao', count: 1 },
    ];
    const h = atHome([JAR, SHELF], bag);
    const shelf = () => h.world.display.contents(piece(h.world, 'squishyShelf'));
    // In the set's order, not the bag's.
    expect(shelf()).toEqual(['ghostGooBall', 'swampGooBall', 'booBao']);
    h.world.chest.putAway('booBao', 1);
    walkUp(h, JAR.tx, JAR.ty);
    h.world.display.show('ghostGooBall');
    expect(shelf()).toEqual(['ghostGooBall', 'swampGooBall', 'booBao']);
    h.world.bag.remove('swampGooBall', 2);
    expect(shelf()).toEqual(['ghostGooBall', 'booBao']);
  });
});
