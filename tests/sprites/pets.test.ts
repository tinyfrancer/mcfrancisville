import { describe, expect, it } from 'vitest';
import { ACCESSORIES, ACCESSORY_IDS, PET_IDS } from '../../src/data/pets';
import { SHOPS } from '../../src/data/shop';
import { rasterize, spriteSize } from '../../src/sprites/sprite';
import {
  accessoryIcon,
  BUBBLE_ART,
  PET_ART,
  petPalette,
  petSource,
  TRICK_STEPS,
  trickStep,
} from '../../src/sprites/pets';

const FRAMES = [
  'side0',
  'side1',
  'sitFront',
  'sitBack',
  'rest',
  'trick0',
  'trick1',
  'trick2',
] as const;

describe('pet art', () => {
  it('draws every pet in every frame, bare and in every accessory', () => {
    for (const id of PET_IDS) {
      for (const frame of FRAMES) {
        for (const accessory of [null, ...ACCESSORY_IDS]) {
          expect(() => rasterize(petSource(id, frame), petPalette(id, accessory))).not.toThrow();
        }
      }
    }
  });

  it('keeps both walking frames the same size, so a pet does not jump as it trots', () => {
    for (const id of PET_IDS) {
      const [a, b] = PET_ART[id].side;
      expect(spriteSize(a), id).toEqual(spriteSize(b));
    }
  });

  it('shows what they wear: a worn accessory changes the picture', () => {
    for (const id of PET_IDS) {
      const bare = rasterize(petSource(id, 'side0'), petPalette(id, null)).data;
      const dressed = rasterize(petSource(id, 'side0'), petPalette(id, 'blueBandana')).data;
      expect(dressed, id).not.toEqual(bare);
    }
  });

  it('sits each facing her and with its back to her, two different pictures (V1 R6c)', () => {
    for (const id of PET_IDS) {
      const front = rasterize(petSource(id, 'sitFront'), petPalette(id, null)).data;
      const back = rasterize(petSource(id, 'sitBack'), petPalette(id, null)).data;
      expect(back, id).not.toEqual(front);
    }
  });

  it('draws every trick in one to three frames of its own, and steps only through its frames', () => {
    for (const id of PET_IDS) {
      const frames = PET_ART[id].trick.length;
      expect(frames, id).toBeGreaterThanOrEqual(1);
      expect(frames, id).toBeLessThanOrEqual(3);
      const steps = TRICK_STEPS[id];
      expect(steps[0]!.at, id).toBe(0);
      for (let i = 1; i < steps.length; i++) expect(steps[i]!.at).toBeGreaterThan(steps[i - 1]!.at);
      for (const step of steps) {
        if (step.frame.startsWith('trick')) {
          expect(Number(step.frame.slice(-1)), `${id} ${step.frame}`).toBeLessThan(frames);
        }
        expect(step.at, id).toBeLessThan(1);
      }
      // Every frame of its own is seen somewhere in it.
      const seen = new Set(steps.map((s) => s.frame));
      for (let i = 0; i < frames; i++) {
        expect(seen.has(`trick${i}` as never), `${id} ${i}`).toBe(true);
      }
      expect(trickStep(id, 0.999).frame).toBe(steps[steps.length - 1]!.frame);
    }
  });

  // 1.0.1's redraws: the two frames R6c left serviceable rather than lovely.
  it("draws Gary's front with an eye up on each stalk, clear above his shell", () => {
    const rows = petSource('gary', 'sitFront').rows;
    const top = rows.slice(0, 5);
    const half = rows[0]!.length / 2;
    const eyes = top.flatMap((row, y) =>
      [...row].flatMap((key, x) => (key === 'e' || key === 'w' ? [{ x, y }] : [])),
    );
    expect(eyes.some((e) => e.x < half)).toBe(true);
    expect(eyes.some((e) => e.x >= half)).toBe(true);
    expect(rows.slice(0, 5).some((row) => row.includes('C'))).toBe(false);
  });

  it('rolls Florence onto her back with her paws in the air, beans and all', () => {
    const back = petSource('florence', 'trick1').rows;
    const side = petSource('florence', 'trick0').rows;
    expect(back).not.toEqual(side);
    const upper = back.slice(0, 8).join('');
    expect(upper).toContain('p');
    expect(upper).toContain('f');
  });

  it("keeps every pet's every frame, dressed or not, within the pets' size", () => {
    for (const id of PET_IDS) {
      for (const frame of FRAMES) {
        for (const accessory of [null, ...ACCESSORY_IDS]) {
          const { width, height } = spriteSize(petSource(id, frame, accessory));
          expect(width, `${id} ${frame}`).toBeLessThanOrEqual(38);
          expect(height, `${id} ${frame}`).toBeLessThanOrEqual(32);
        }
      }
    }
  });

  // 1.5's G7: Pickle the possum.
  it('draws Pickle in his bow and with his lantern in every frame, the same size as bare', () => {
    for (const accessory of ['ribbonBow', 'tailLantern'] as const) {
      for (const frame of FRAMES) {
        const bare = petSource('pickle', frame);
        const dressed = petSource('pickle', frame, accessory);
        expect(spriteSize(dressed), `${accessory} ${frame}`).toEqual(spriteSize(bare));
        const a = rasterize(bare, petPalette('pickle', null)).data;
        const b = rasterize(dressed, petPalette('pickle', accessory)).data;
        expect(b, `${accessory} ${frame}`).not.toEqual(a);
      }
    }
    // His lantern's glass, which glows after dark, is in every frame he carries it.
    for (const frame of FRAMES) {
      expect(petSource('pickle', frame, 'tailLantern').rows.join(''), frame).toMatch(/G/);
    }
    // A scarf is painted on, as every pet's neckwear is.
    const scarf = rasterize(petSource('pickle', 'side0'), petPalette('pickle', 'tinyScarf')).data;
    const bare = rasterize(petSource('pickle', 'side0'), petPalette('pickle', null)).data;
    expect(scarf).not.toEqual(bare);
  });

  it('gives Pickle a white face, a pink nose and a bare pink tail, from every side', () => {
    for (const frame of ['side0', 'sitFront', 'rest', 'trick0', 'trick1'] as const) {
      const keys = petSource('pickle', frame).rows.join('');
      expect(keys, frame).toMatch(/u/);
      expect(keys, frame).toMatch(/p/);
    }
    for (const frame of FRAMES) {
      if (frame === 'sitFront' || frame === 'rest' || frame.startsWith('trick')) continue;
      expect(petSource('pickle', frame).rows.join(''), frame).toMatch(/t/);
    }
    // Playing dead, his eye is a little "x"; hanging, a branch is drawn over him.
    const dead = petSource('pickle', 'trick0').rows;
    expect(dead.some((row, y) => row.includes('e') && dead[y + 2]?.includes('e'))).toBe(true);
    expect(petSource('pickle', 'trick1').rows[1]).toMatch(/B/);
    expect(trickStep('pickle', 0.2).frame).toBe('trick0');
    expect(trickStep('pickle', 0.5).frame).toBe('trick1');
    expect(trickStep('pickle', 0.5).lift).toBeGreaterThan(0);
  });

  it('gives the ghost pets a glow, and only them', () => {
    expect(PET_IDS.filter((id) => PET_ART[id].glow)).toEqual(['wybie', 'elvira']);
  });

  it('draws every accessory and bubble on its own', () => {
    for (const id of ACCESSORY_IDS) {
      const { source, palette } = accessoryIcon(id);
      expect(() => rasterize(source, palette)).not.toThrow();
    }
    for (const art of Object.values(BUBBLE_ART)) {
      expect(() => rasterize(art.source, art.palette)).not.toThrow();
    }
  });
});

describe('accessories', () => {
  it('are all sold at Cobweb Corner, but for the ones she has from the start', () => {
    const sold = SHOPS.corner.shelves
      .flatMap((s) => s.picks.flatMap((p) => p.from))
      .flatMap((w) => ('accessory' in w ? [w.accessory] : []));
    for (const id of ACCESSORY_IDS) {
      expect(sold.includes(id), id).toBe(ACCESSORIES[id].price !== undefined);
    }
  });

  it('come in blue (personal_touches.md), with a bandana in blue for Dolly', () => {
    expect(ACCESSORIES.blueBandana.style).toBe('bandana');
    expect(ACCESSORIES.pinkSpikedCollar.style).toBe('spiked');
  });
});
