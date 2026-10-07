import { describe, expect, it } from 'vitest';
import { bumpsOf, effectsOf, type Placing } from '../../src/wiring/effectsOf';
import type { WorldEvent } from '../../src/world/World';

const HER = { x: 160, y: 176 };
const alone: Placing = { her: HER, toward: null, float: null };
/** She walked up to the tree whose footprint is the tile 4,3. */
const atTree: Placing = {
  her: HER,
  toward: { box: { tx: 4, ty: 3, w: 1, h: 1 }, prop: 'tree' },
  float: null,
};

/**
 * One of every moment that was cue and toast only before V1's E1, as the analysis listed them:
 * each is seen in the world now (decision 280).
 */
const SEEN: WorldEvent[] = [
  { kind: 'gathered', from: 'tree', item: 'wood', count: 3 },
  { kind: 'gathered', from: 'rock', item: 'stone', count: 2, bead: 'heartBead' },
  { kind: 'gathered', from: 'flowers', item: 'moonpetal', count: 1 },
  { kind: 'resting', from: 'tree', item: 'wood', back: 'evening' },
  { kind: 'tilled', tx: 2, ty: 2 },
  { kind: 'planted', crop: 'pumpkin', tx: 2, ty: 2 },
  { kind: 'sowedRow', crop: 'pumpkin', count: 3 },
  { kind: 'watered', crop: 'pumpkin', days: 2 },
  { kind: 'growing', crop: 'pumpkin', days: 2 },
  { kind: 'fitted', beds: 9 },
  { kind: 'unfitted' },
  {
    kind: 'harvested',
    crop: 'pumpkin',
    item: 'pumpkin',
    count: 1,
    seed: 'pumpkinSeed',
    first: true,
  },
  { kind: 'bought', shop: 'corner', ware: { item: 'wood' }, price: 5 },
  { kind: 'ordered', ware: { item: 'wood' }, price: 5 },
  { kind: 'sold', item: 'wood', count: 2, candy: 10 },
  { kind: 'answered', from: 'maude', item: 'wood', count: 2, candy: 10 },
  { kind: 'stallSold', sold: [], candy: 10 },
  { kind: 'made', recipe: 'loveBracelet', made: { item: 'loveBracelet' } },
  { kind: 'ate', item: 'booBao', effect: { pep: 1 }, until: 'evening' },
  { kind: 'caught', critter: 'lunaMoth', first: true },
  { kind: 'fled', critter: 'lunaMoth' },
  { kind: 'potted', plant: 'succulent' },
  { kind: 'visit', count: 3, gift: { candy: 20 } },
  { kind: 'shook', candy: 12, sweet: 'booBao', sapling: true },
  { kind: 'shook', candy: 0, back: 'evening' },
  { kind: 'sapling', did: 'planted', days: 3 },
  { kind: 'baked', item: 'booBao', candy: 30 },
  { kind: 'tossed', activity: 'ringToss', landed: true },
  { kind: 'won', activity: 'ringToss', item: 'booBao', landed: 3, top: true },
  { kind: 'readFortune' },
  { kind: 'snackBought', activity: 'ringToss', item: 'booBao', price: 5 },
  { kind: 'patch', stage: 'ripe', picked: true },
  { kind: 'foundLost', lost: 'maudeSpectacles' },
  { kind: 'decorated', decor: 'christmas' },
  { kind: 'frozen' },
  { kind: 'dressedUp', villagers: ['maude'] },
  { kind: 'foundEgg', found: 3, left: 0 },
  { kind: 'trickOrTreat', villager: 'maude', item: 'booBao', home: true, line: 'Boo!' },
  { kind: 'keepsake', piece: 'workbench', from: 'maude' },
  { kind: 'mail', from: 'cody' },
  { kind: 'delivered', wares: [{ item: 'wood' }] },
  { kind: 'clue', clue: 'button' },
  { kind: 'wesGone', line: 0 },
  { kind: 'crowned', villager: 'maude' },
  { kind: 'flew', to: 'home' },
  { kind: 'found', zone: 'whisperwood' },
  { kind: 'slipped' },
  { kind: 'played', record: null },
  { kind: 'shelved', shelf: 'mothFamily' },
  { kind: 'gave', villager: 'maude', item: 'wood', reaction: 'fine' },
] as WorldEvent[];

describe('what each moment looks like', () => {
  it.each(SEEN.map((e) => [e.kind, e] as const))('%s is seen in the world', (_, event) => {
    expect(effectsOf(event, atTree).length).toBeGreaterThan(0);
    expect(effectsOf(event, alone).length).toBeGreaterThan(0);
  });

  it('a gather at a tree shakes leaves from its crown and pops the wood from it to her', () => {
    const shown = effectsOf({ kind: 'gathered', from: 'tree', item: 'wood', count: 3 }, atTree);
    const leaves = shown.find((e) => e.kind === 'burst' && e.particle === 'leaf');
    const wood = shown.find((e) => e.kind === 'pop');
    expect(leaves).toBeDefined();
    expect(wood).toMatchObject({ kind: 'pop', icon: { item: 'wood' }, count: 3 });
    // From the tree, over its tile and up its picture, not from her.
    const from = wood!.kind === 'pop' ? wood!.from : null;
    expect(from).toMatchObject({ x: 4.5 * 32 });
    expect(from && 'y' in from ? from.y : Infinity).toBeLessThan(4 * 32);
  });

  it('a bead found with it pops after, as a second thing', () => {
    const pops = effectsOf(
      { kind: 'gathered', from: 'rock', item: 'stone', count: 2, bead: 'heartBead' },
      alone,
    ).filter((e) => e.kind === 'pop');
    expect(pops.map((p) => p.kind === 'pop' && p.icon)).toEqual([
      { item: 'stone' },
      { item: 'heartBead' },
    ]);
  });

  it('a loved gift throws hearts over the neighbour, and a ♥ bubble', () => {
    const shown = effectsOf(
      { kind: 'gave', villager: 'rufus', item: 'wood', reaction: 'loved' },
      alone,
    );
    expect(shown).toEqual([
      { kind: 'burst', particle: 'heart', at: { villager: 'rufus' } },
      { kind: 'emote', emote: '♥', over: { villager: 'rufus' } },
    ]);
  });

  it('the float splashes as it lands, a cast later', () => {
    const shown = effectsOf({ kind: 'cast' }, { ...alone, float: { x: 80, y: 80 } });
    expect(shown).toEqual([expect.objectContaining({ particle: 'splash', delayMs: 600 })]);
  });

  it('shows nothing for what has its own look elsewhere', () => {
    for (const event of [
      { kind: 'arrived', tx: 1, ty: 1 },
      { kind: 'entered', scene: 'home' },
      { kind: 'thunder' },
    ] as WorldEvent[]) {
      expect(effectsOf(event, alone)).toEqual([]);
    }
  });
});

describe('the buttons that bump', () => {
  it('bumps the bag for a thing, and the purse for Candy', () => {
    expect(bumpsOf({ kind: 'gathered', from: 'tree', item: 'wood', count: 3 })).toEqual(['bag']);
    expect(bumpsOf({ kind: 'sold', item: 'wood', count: 1, candy: 4 })).toEqual(['purse']);
    expect(bumpsOf({ kind: 'shook', candy: 3, sweet: 'booBao' })).toEqual(['purse', 'bag']);
    expect(
      bumpsOf({ kind: 'bought', shop: 'corner', ware: { furniture: 'workbench' }, price: 1 }),
    ).toEqual([]);
  });
});
