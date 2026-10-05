import { describe, expect, it } from 'vitest';
import { FakeClock } from '../../src/systems/clock';
import { fromSave, tileOf, World } from '../../src/world/World';
import { harness } from './harness';

type H = ReturnType<typeof harness>;
const here = (h: H) => tileOf(h.world.player.x, h.world.player.y);

/** Her, at her door in her yard, with a garden bench and a birdbath in her storage chest. */
function inHerYard(): H {
  const h = harness();
  h.world.home.store('gardenBench');
  h.world.home.store('birdbath');
  return h;
}

/** Walks her onto a tile, to see what happens there. */
function walkOnto(h: H, tx: number, ty: number) {
  expect(h.world.tapTile(tx, ty)).toBe(true);
  return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`);
}

describe('decorating her yard (0.3’s H5)', () => {
  it('starts while she stands in her yard, and says when she steps in or out', () => {
    const h = inHerYard();
    const said: boolean[] = [];
    h.world.events.on('inYard', (v) => said.push(v));
    h.tick(1);
    expect(h.world.decorating.canDecorateYard).toBe(true);
    walkOnto(h, 20, 16);
    expect(h.world.decorating.canDecorateYard).toBe(false);
    expect(h.world.decorating.start()).toBe(false);
    expect(said).toEqual([true, false]);
  });

  it('takes a piece out of the chest onto the lawn by her, and moves it with a tap', () => {
    const h = inHerYard();
    expect(h.world.decorating.start()).toBe(true);
    expect(h.world.decorating.outdoors).toBe(true);
    expect(h.world.decorating.takeOut('gardenBench')).toBe(true);
    const bench = h.world.decorating.state?.selected;
    expect(bench?.id).toBe('gardenBench');
    expect(h.world.yard.placed).toEqual([bench]);
    expect(h.world.home.stored.some((s) => s.id === 'gardenBench')).toBe(false);
    // Onto the corner of the lawn by the road, a tap on its right end.
    expect(h.world.decorating.tap(7, 13)).toBe(true);
    expect(h.world.yard.pieceAt(6, 13)).toBe(bench);
    expect(h.world.yard.pieceAt(7, 13)).toBe(bench);
    // Never onto her path.
    expect(h.world.decorating.tap(4, 11)).toBe(false);
    expect(h.world.yard.pieceAt(6, 13)).toBe(bench);
  });

  it('keeps indoor pieces in, and her walls and floor for the house', () => {
    const h = inHerYard();
    h.world.home.store('batLamp');
    h.world.decorating.start();
    expect(h.world.decorating.fits('batLamp')).toBe(false);
    expect(h.world.decorating.fits('birdbath')).toBe(true);
    expect(h.world.decorating.takeOut('batLamp')).toBe(false);
    const refused = h.tick(1).find((e) => e.kind === 'refused');
    expect(refused).toMatchObject({ why: 'indoors' });
    expect(h.world.home.stored.some((s) => s.id === 'batLamp')).toBe(true);
  });

  it('stands its pieces solid: she, and everyone, walks round them', () => {
    const h = inHerYard();
    h.world.decorating.takeOut('gardenBench');
    h.world.decorating.tap(7, 13);
    h.world.decorating.stop();
    expect(h.world.canWalk(6, 13)).toBe(false);
    expect(h.world.townZone.canWalk(7, 13)).toBe(false);
    walkOnto(h, 5, 13);
    const trod: string[] = [];
    h.world.tapTile(8, 12);
    h.until(() => {
      const t = here(h);
      trod.push(`${t.tx},${t.ty}`);
      return !h.world.player.moving;
    }, 'walking round the bench');
    expect(here(h)).toEqual({ tx: 8, ty: 12 });
    expect(trod).not.toContain('6,13');
    expect(trod).not.toContain('7,13');
  });

  it('sits her on her bench when she walks up to it', () => {
    const h = inHerYard();
    h.world.decorating.takeOut('gardenBench');
    h.world.decorating.tap(7, 13);
    h.world.decorating.stop();
    h.world.tapTile(6, 13);
    const events = h.until(() => !h.world.player.moving, 'walking up to the bench');
    events.push(...h.tick(2));
    expect(events.find((e) => e.kind === 'arrived')).toMatchObject({ piece: 'gardenBench' });
    expect(h.world.sitting.seat).not.toBeNull();
  });

  it('puts a piece away in the chest at home', () => {
    const h = inHerYard();
    h.world.decorating.takeOut('birdbath');
    expect(h.world.decorating.putAwaySelected()).toBe(true);
    expect(h.world.yard.placed).toEqual([]);
    expect(h.world.home.stored.find((s) => s.id === 'birdbath')?.count).toBe(1);
  });

  it('stops when she leaves town', () => {
    const h = inHerYard();
    h.world.decorating.start();
    h.world.travel.home();
    h.tick(2);
    expect(h.world.decorating.state).toBeNull();
    expect(h.world.decorating.outdoors).toBe(false);
  });

  it('is saved, and comes back where she left it', () => {
    const h = inHerYard();
    h.world.decorating.takeOut('gardenBench');
    h.world.decorating.tap(7, 13);
    h.world.decorating.stop();
    const save = h.world.save();
    expect(save.yard.placed).toEqual([{ id: 'gardenBench', tx: 6, ty: 13, turn: 0 }]);
    const again = new World({ clock: new FakeClock(h.clock.now()), ...fromSave(save) });
    expect(again.yard.pieceAt(7, 13)?.id).toBe('gardenBench');
    expect(again.canWalk(6, 13)).toBe(false);
  });

  it('puts what no longer fits, or this build doesn’t know, in the chest, never losing it', () => {
    const h = harness(undefined, {
      yard: {
        placed: [
          { id: 'gardenBench', tx: 6, ty: 13, turn: 0 },
          // On her path: no room there.
          { id: 'birdbath', tx: 4, ty: 11, turn: 0 },
          // Indoor things stay indoors.
          { id: 'batBed', tx: 1, ty: 12, turn: 0 },
          { id: 'noSuchThing' as 'birdbath', tx: 1, ty: 13, turn: 0 },
        ],
      },
    });
    expect(h.world.yard.placed.map((p) => p.id)).toEqual(['gardenBench']);
    const stored = h.world.home.stored.map((s) => s.id);
    expect(stored).toContain('birdbath');
    expect(stored).toContain('batBed');
  });

  it('counts what stands in her yard as hers', () => {
    const h = inHerYard();
    h.world.home.store('catLantern');
    h.world.novelty.seen('storage');
    h.world.decorating.takeOut('catLantern');
    expect(h.world.yard.placed.some((p) => p.id === 'catLantern')).toBe(true);
    expect(h.world.novelty.isNew('storage', 'catLantern')).toBe(false);
    // Back in the chest, it's the same lantern, not a new one.
    h.world.decorating.putAwaySelected();
    expect(h.world.novelty.isNew('storage', 'catLantern')).toBe(false);
  });
});
