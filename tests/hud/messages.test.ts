import { HOUSES, type HouseId } from '../../src/data/houses';
import { PROP_FOOTPRINT, TOWN } from '../../src/data/maps';
import { VILLAGER_IDS, VILLAGERS } from '../../src/data/villagers';
import { parseMap } from '../../src/systems/grid';
import { describe, expect, it } from 'vitest';
import {
  arrivalToast,
  boughtLine,
  eventToast,
  madeToast,
  quantity,
  soldLine,
  wontBuy,
} from '../../src/hud/messages';

describe('what the HUD says', () => {
  it('counts things the way they are said', () => {
    expect(quantity('wood', 3)).toBe('3 wood');
    expect(quantity('forgetMeBoo', 2)).toBe('2 forget-me-boos');
    expect(quantity('ghostDaisy', 2)).toBe('2 ghost daisies');
    expect(quantity('moonpetal', 1)).toBe('1 moonpetal');
    expect(quantity('recordLadyGhoulga', 2)).toBe('2 Lady Ghoul-ga records');
  });

  it('says where a purchase went, and what a sale fetched', () => {
    expect(boughtLine({ item: 'booBao' })).toBe('Boo bao, into your bag!');
    expect(boughtLine({ outfit: 'glitterHeels' })).toBe(
      'Glitter heels, into your closet! Try them on from the 👗.',
    );
    expect(boughtLine({ outfit: 'sundressDots' })).toMatch(/Try it on/);
    expect(soldLine('wood', 3, 12)).toBe('Sold 3 wood for 12 Candy. Thank you kindly!');
    expect(boughtLine({ furniture: 'cauldron' })).toBe(
      'Cauldron, into your storage chest at home!',
    );
    expect(boughtLine({ wallpaper: 'batDamask' })).toMatch(/^Bat damask wallpaper, yours!/);
    expect(boughtLine({ flooring: 'checkerboard' })).toMatch(/^Checkerboard flooring, yours!/);
  });

  it('says where she has got to, what opened, and what would open a way still shut', () => {
    expect(eventToast({ kind: 'found', zone: 'whisperwood' })?.text).toBe(
      "You found Whisperwood! It's on your map now.",
    );
    expect(eventToast({ kind: 'opened', zone: 'lanternShore' })?.text).toMatch(/skates on/);
    expect(eventToast({ kind: 'shut', zone: 'lanternShore' })?.text).toMatch(/skates/);
    expect(wontBuy('iceSkates')).toMatch(/first-date/);
  });

  it('cheers each find', () => {
    expect(eventToast({ kind: 'gathered', from: 'tree', item: 'wood', count: 3 })).toEqual({
      text: 'The tree shook loose 3 wood.',
    });
    expect(
      eventToast({ kind: 'gathered', from: 'flowers', item: 'forgetMeBoo', count: 2 })?.text,
    ).toBe('You picked 2 forget-me-boos!');
  });

  it('makes a fuss over the night snack', () => {
    expect(
      eventToast({ kind: 'gathered', from: 'snack', item: 'midnightPizza', count: 1 }),
    ).toEqual({
      text: 'Late-night snackies! A midnight pizza slice, just for you.',
      special: true,
      icon: '🌙',
    });
  });

  it('promises more tomorrow, never scolds', () => {
    const text = eventToast({ kind: 'resting', from: 'tree', item: 'wood' })?.text;
    expect(text).toMatch(/tomorrow/);
  });

  it('talks her through the garden, and always says when it will be ripe', () => {
    expect(eventToast({ kind: 'planted', crop: 'spiderLily', tx: 1, ty: 1 })?.text).toBe(
      'You planted a spider lily bulb. Tap it again to water it.',
    );
    expect(eventToast({ kind: 'watered', crop: 'rose', days: 1 })?.text).toBe(
      'You watered the roses. Ripe tomorrow!',
    );
    expect(eventToast({ kind: 'growing', crop: 'ghostPepper', days: 3 })?.text).toMatch(
      /ghost peppers.*Ripe in 3 days!/,
    );
    const picked = {
      kind: 'harvested',
      crop: 'ghostPepper',
      seed: 'ghostPepperSeed',
      first: false,
    } as const;
    expect(eventToast({ ...picked, item: 'ghostPepper', count: 3 })?.text).toBe(
      'You picked 3 ghost peppers, and saved a seed.',
    );
  });

  it('makes a fuss over a blue rose, from a bed or the bush', () => {
    const bed = eventToast({
      kind: 'harvested',
      crop: 'rose',
      item: 'blueRose',
      count: 1,
      first: false,
      seed: 'roseSeed',
    });
    expect(bed?.special).toBe(true);
    expect(eventToast({ kind: 'gathered', from: 'roseBush', item: 'blueRose', count: 1 })).toEqual(
      bed,
    );
  });

  it('says nothing about plain arrivals', () => {
    expect(eventToast({ kind: 'arrived', tx: 1, ty: 1 })).toBeNull();
  });

  it('says what a piece says when she walks up to it, and plays her records', () => {
    const says = 'Boom tap boom tap boom!';
    expect(eventToast({ kind: 'arrived', tx: 1, ty: 4, piece: 'marbleRun', says })?.text).toBe(
      says,
    );
    expect(eventToast({ kind: 'arrived', tx: 1, ty: 4, piece: 'batLamp' })).toBeNull();
    expect(eventToast({ kind: 'played', record: 'recordBoneJovi' })?.text).toBe(
      'You put on the Bone Jovi record. What a tune!',
    );
    expect(eventToast({ kind: 'played', record: null })?.text).toMatch(/No records yet/);
  });

  it('says kindly why a piece will not go somewhere', () => {
    for (const why of ['noRoom', 'standing', 'blocking'] as const) {
      expect(eventToast({ kind: 'refused', why })?.text).toBeTruthy();
    }
  });
});

describe('crafting', () => {
  it('says a bead was found along with the wood or stone', () => {
    const toast = eventToast({
      kind: 'gathered',
      from: 'rock',
      item: 'stone',
      count: 2,
      bead: 'heartBead',
    });
    expect(toast?.text).toBe('You chipped off 2 stone. And look, a heart bead!');
    const love = eventToast({
      kind: 'gathered',
      from: 'tree',
      item: 'wood',
      count: 3,
      bead: 'loveBeads',
    });
    expect(love?.text).toMatch(/some LOVE beads!$/);
  });

  it('says where what she made went', () => {
    expect(madeToast({ item: 'loveBracelet' }).text).toBe("LOVE bracelet, made! It's in your bag.");
    expect(madeToast({ furniture: 'stumpStool' }).text).toMatch(/Stump stool.*storage chest/);
    expect(madeToast({ room: 1 })).toMatchObject({ special: true });
  });

  it('says a recipe card was learned', () => {
    expect(boughtLine({ recipe: 'stoneHearth' })).toBe(
      'Recipe learned: Stone hearth! Make it at your workbench at home.',
    );
  });
});

describe('walking up to something with nothing to open', () => {
  it("names each neighbour's house, and Skelly, and says nothing at a shop", () => {
    for (const [id, house] of Object.entries(HOUSES) as [HouseId, (typeof HOUSES)[HouseId]][]) {
      const toast = arrivalToast(id);
      expect(toast?.text, id).toContain(house.name);
      expect(PROP_FOOTPRINT[id], id).toBeDefined();
      expect(VILLAGERS[house.owner], id).toBeDefined();
    }
    expect(arrivalToast('skelly')?.text).toBe('Skelly.');
    expect(arrivalToast('farmSign')).not.toBeNull();
    expect(arrivalToast('shopHouse')).toBeNull();
    expect(arrivalToast('homeHouse')).toBeNull();
  });

  it('gives every neighbour but Wrapunzel, who lives over her bakery, a house in town', () => {
    const map = parseMap(TOWN);
    const owners = Object.values(HOUSES).map((h) => h.owner);
    expect(new Set(owners).size).toBe(owners.length);
    for (const id of VILLAGER_IDS) {
      if (id === 'wrapunzel') continue;
      expect(owners, id).toContain(id);
    }
    for (const id of Object.keys(HOUSES)) {
      expect(
        map.props.filter((p) => p.id === id),
        id,
      ).toHaveLength(1);
    }
  });
});
