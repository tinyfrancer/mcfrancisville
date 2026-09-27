import { describe, expect, it } from 'vitest';
import { TOWN } from '../../src/data/maps';
import { CLUE_IDS, CLUES, SUSPECTS } from '../../src/data/mystery';
import { parseMap, walkable } from '../../src/systems/grid';
import {
  lurksOf,
  secondLetterDue,
  suspectsOf,
  WES_ACROSS,
  WES_DOWN,
  WES_NEAREST,
  wesLurks,
  wesSpot,
} from '../../src/systems/mystery';

const map = parseMap(TOWN);
const lurks = lurksOf(map, (tx, ty) => walkable(map, tx, ty));

describe('the mayor mystery', () => {
  it('has a hint for every clue, and suspects for those that point anywhere', () => {
    for (const id of CLUE_IDS) {
      expect(CLUES[id].hint.length, id).toBeGreaterThan(0);
      const who = CLUES[id].points;
      if (who) expect(SUSPECTS[who], id).toBeDefined();
    }
  });

  it('finds somewhere to lurk beside the trees, on open ground', () => {
    expect(lurks.length).toBeGreaterThan(4);
    for (const l of lurks) {
      expect(walkable(map, l.tx, l.ty)).toBe(true);
      const tx = l.side === 'left' ? l.tx + 1 : l.tx - 1;
      expect(map.props.some((p) => p.id === 'tree' && p.tx === tx && p.ty === l.ty)).toBe(true);
    }
  });

  it('has Wes out about one minute in four', () => {
    const out = Array.from({ length: 400 }, (_, slot) => wesLurks(slot)).filter(Boolean).length;
    expect(out).toBeGreaterThan(60);
    expect(out).toBeLessThan(140);
  });

  it('puts Wes at the edge of what she can see, the same all minute', () => {
    const her = map.spawn;
    let seen = 0;
    for (let slot = 0; slot < 200; slot++) {
      const spot = wesSpot(slot, lurks, her);
      if (!wesLurks(slot)) expect(spot).toBeNull();
      if (!spot) continue;
      seen += 1;
      const dx = Math.abs(spot.tx - her.tx);
      const dy = Math.abs(spot.ty - her.ty);
      expect(Math.max(dx, dy)).toBeGreaterThanOrEqual(WES_NEAREST);
      expect(dx).toBeLessThanOrEqual(WES_ACROSS);
      expect(dy).toBeLessThanOrEqual(WES_DOWN);
      expect(wesSpot(slot, lurks, her)).toEqual(spot);
    }
    expect(seen).toBeGreaterThan(20);
  });

  it("brings the mayor's second letter a week after the first", () => {
    expect(secondLetterDue('2026-09-27', '2026-10-03')).toBe(false);
    expect(secondLetterDue('2026-09-27', '2026-10-04')).toBe(true);
  });

  it('names each suspect once, in the order the clues point at them', () => {
    expect(suspectsOf(['welcome'])).toEqual([]);
    expect(suspectsOf(['rumour', 'wrapper', 'button'])).toEqual(['wes', 'moonPieMan']);
  });
});
