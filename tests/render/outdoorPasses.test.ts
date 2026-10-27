import { describe, expect, it } from 'vitest';
import { OUTDOOR_LAYERS } from '../../src/render/OutdoorView';
import { composeLayers, LAYER_NAMES, type Pass } from '../../src/render/passes/pass';

/**
 * A frame outdoors as `OutdoorView.draw` drew it before its passes went to files of their own
 * (1.1's A4): the order of each layer is what it was, so nothing she sees changes. What stands is
 * sorted by its feet once, and the sort keeps the order things were listed in where two stand
 * level, so `stand`'s order is part of the picture too.
 */
describe('the passes outdoors', () => {
  it('draw each layer in the order the view drew it before the split', () => {
    expect(OUTDOOR_LAYERS).toEqual({
      // Glints and long grass, footprints in the snow (1.6's X4), rain's splashes, the yard's
      // dots, her hole in the ice (1.4's G3), where she's walking to; autumn's leaf piles under
      // the prints (1.7's Y2).
      ground: ['life', 'leafPiles', 'effects', 'weather', 'yard', 'fishing', 'target'],
      stand: [
        'props',
        'moving',
        'doors',
        'yard',
        'givers',
        'beds',
        'snack',
        'popUp',
        'sites',
        'mailbox',
        'boards',
        'pots',
        'geese',
        'candy',
        'mounds',
        'holidays',
        'gates',
        'lanterns',
        'butterflies',
        'flyers',
        'leaves',
        'cart',
        'passers',
        'stray',
        'neighbours',
        'wes',
        'critters',
        'pets',
        // The hens in their run at Boo Acres (1.6's X3), the one part added since to `stand`.
        'hens',
        'bone',
        'her',
      ],
      // Wes is meant to be half hidden, so he isn't wanted.
      // Autumn's heaped leaf piles (1.7's Y2), last.
      wanted: [
        'givers',
        'snack',
        'mounds',
        'holidays',
        'neighbours',
        'critters',
        'pets',
        'bone',
        'leafPiles',
      ],
      // Her kite (1.6's X6), the one part added since to `over`, under the rain.
      over: [
        'yard',
        'holidays',
        'beds',
        'life',
        'neighbours',
        'critters',
        'fishing',
        'kite',
        'weather',
      ],
      lights: [
        'props',
        'fountain',
        'critters',
        'popUp',
        'sites',
        'cart',
        'snack',
        'givers',
        'beds',
        'yard',
      ],
      lit: [
        // 1.5's G4: the month's constellation over the castle hill, behind everything else lit.
        'stars',
        'holidays',
        'fountain',
        'weather',
        'snack',
        'beds',
        'critters',
        'lost',
        'pets',
        'neighbours',
        'fishing',
        'effects',
      ],
    });
  });

  it('name every layer, and her last of what stands', () => {
    expect(Object.keys(OUTDOOR_LAYERS)).toEqual([...LAYER_NAMES]);
    expect(OUTDOOR_LAYERS.stand.at(-1)).toBe('her');
  });

  const draws = () => {};
  const none = () => [];
  const order = (o: Partial<Record<(typeof LAYER_NAMES)[number], string[]>>) => ({
    ground: [],
    stand: [],
    wanted: [],
    over: [],
    lights: [],
    lit: [],
    ...o,
  });

  it("are composed in the order's order", () => {
    const a: Pass = { name: 'a', stand: none, over: draws };
    const b: Pass = { name: 'b', stand: none, lit: draws };
    const layers = composeLayers([a, b], order({ stand: ['b', 'a'], over: ['a'], lit: ['b'] }));
    expect(layers.stand).toEqual([b, a]);
    expect(layers.over).toEqual([a]);
    expect(layers.lit).toEqual([b]);
    expect(layers.ground).toEqual([]);
  });

  it('refuse a name with no pass, or no part in its layer', () => {
    const a: Pass = { name: 'a', stand: none };
    expect(() => composeLayers([a], order({ stand: ['a', 'b'] }))).toThrow('no pass named b');
    expect(() => composeLayers([a], order({ stand: ['a'], over: ['a'] }))).toThrow('a has no over');
  });

  it("refuse a pass's part that no layer names, which would never be drawn", () => {
    const a: Pass = { name: 'a', stand: none, lit: draws };
    expect(() => composeLayers([a], order({ stand: ['a'] }))).toThrow("a's lit isn't in the order");
  });

  it('refuse two passes of one name', () => {
    const a: Pass = { name: 'a', stand: none };
    expect(() => composeLayers([a, { ...a }], order({ stand: ['a'] }))).toThrow(
      'two passes named a',
    );
  });
});
