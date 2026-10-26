import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../../src/config/world';
import { FAIRGROUND } from '../../src/data/maps';
import { LIGHT_POLE_JOINS } from '../../src/sprites/fairground';
import { EAVE_MIN, eaveLights } from '../../src/sprites/holidays';
import { PROP_ART } from '../../src/sprites/props';
import { parseMap, POLE_SPAN } from '../../src/systems/grid';

const ROOF = 'nmrRL';
const lit = (ch: string) => ch === 's' || /\d/.test(ch);

/** The lit pixels of a building's lights, gathered into strings: each touching the next. */
function strings(rows: readonly string[]): { x: number; y: number; ch: string }[][] {
  const seen = new Set<string>();
  const found: { x: number; y: number; ch: string }[][] = [];
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (!lit(ch) || seen.has(`${x},${y}`)) return;
      const group: { x: number; y: number; ch: string }[] = [];
      const queue = [{ x, y }];
      seen.add(`${x},${y}`);
      while (queue.length > 0) {
        const p = queue.pop()!;
        group.push({ ...p, ch: rows[p.y]![p.x]! });
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const q = { x: p.x + dx, y: p.y + dy };
            const c = rows[q.y]?.[q.x];
            if (c === undefined || !lit(c) || seen.has(`${q.x},${q.y}`)) continue;
            seen.add(`${q.x},${q.y}`);
            queue.push(q);
          }
      }
      found.push(group);
    }),
  );
  return found;
}

const BUILDINGS = Object.entries(PROP_ART).filter(([, art]) => art.door && !art.noEaves);

describe('the lights along the eaves', () => {
  it('strings bulbs under every building with a roof, and only above its door', () => {
    for (const [id, art] of BUILDINGS) {
      const lights = eaveLights(art.source, 2, art.door!.y);
      expect(lights.rows.length, id).toBe(art.source.rows.length);
      // A pop-up's sign has no eaves to hang anything from.
      if (id === 'popUpShop') continue;
      const bulbs = lights.rows.flatMap((row, y) =>
        [...row].flatMap((ch) => (/\d/.test(ch) ? [y] : [])),
      );
      expect(bulbs.length, id).toBeGreaterThan(0);
      expect(Math.max(...bulbs), id).toBeLessThan(art.door!.y);
    }
  });

  // 1.6's X1: "the colored lights up around the festival aren't connected properly".
  it('hangs every bulb on a string, each string a long unbroken run', () => {
    for (const [id, art] of BUILDINGS) {
      const lights = eaveLights(art.source, 2, art.door!.y);
      for (const group of strings(lights.rows)) {
        const where = `${id} at ${group[0]!.x},${group[0]!.y}`;
        expect(
          group.some((p) => p.ch === 's'),
          `${where}: a bulb off the string`,
        ).toBe(true);
        const xs = group.map((p) => p.x);
        expect(Math.max(...xs) - Math.min(...xs) + 1, where).toBeGreaterThanOrEqual(EAVE_MIN);
      }
    }
  });

  it("keeps the string to the roof's edge, never more than two pixels off it", () => {
    for (const [id, art] of BUILDINGS) {
      const rows = art.source.rows;
      const lights = eaveLights(art.source, 2, art.door!.y);
      lights.rows.forEach((row, y) =>
        [...row].forEach((ch, x) => {
          if (ch !== 's') return;
          let near = false;
          for (let dy = -2; dy <= 0 && !near; dy++)
            for (let dx = -2; dx <= 2 && !near; dx++)
              near = ROOF.includes(rows[y + dy]?.[x + dx] ?? '.');
          expect(near, `${id}: the string floats at ${x},${y}`).toBe(true);
        }),
      );
    }
  });

  it('runs one string along the eaves, over a gable and round the corners', () => {
    // Cody's manor's front gable once broke its string in two, and her post office's eave tips
    // and gable were each a string of their own.
    for (const id of ['codyHouse', 'ollieHouse', 'homeHouse', 'bartyHouse'] as const) {
      const art = PROP_ART[id];
      const rows = art.source.rows;
      const lights = eaveLights(art.source, 2, art.door!.y);
      const roofXs = rows.flatMap((row, y) =>
        y < art.door!.y ? [...row].flatMap((ch, x) => (ROOF.includes(ch) ? [x] : [])) : [],
      );
      const left = Math.min(...roofXs);
      const right = Math.max(...roofXs);
      const spans = strings(lights.rows).map((g) => g.map((p) => p.x));
      const whole = spans.some((xs) => Math.min(...xs) <= left + 2 && Math.max(...xs) >= right - 2);
      expect(whole, `${id}: ${spans.length} strings`).toBe(true);
    }
  });
});

describe("the fairground's light poles", () => {
  const map = parseMap(FAIRGROUND);
  const poles = map.props.filter((p) => p.id === 'lightPole');

  it('reach half way to the next pole, so two halves meet', () => {
    expect(LIGHT_POLE_JOINS[10]!.rows[0]!.length).toBe(POLE_SPAN * TILE_SIZE);
    const right = LIGHT_POLE_JOINS[2]!.rows;
    const left = LIGHT_POLE_JOINS[8]!.rows;
    const end = right[0]!.length - 1;
    const meets = right.findIndex((row) => row[end] !== '.');
    expect(meets).toBeGreaterThan(0);
    // The right-hand half ends a pixel short of where the next pole's half begins, a row apart
    // at most: the bottom of one curve.
    const begins = left.findIndex((row) => row[0] !== '.');
    expect(Math.abs(meets - begins)).toBeLessThanOrEqual(1);
  });

  it('hang nothing off the end of a row', () => {
    const alone = LIGHT_POLE_JOINS[0]!.rows;
    const mid = alone[0]!.length / 2;
    for (const row of alone) {
      expect(row.slice(0, mid - 5)).toMatch(/^\.*$/);
      expect(row.slice(mid + 6)).toMatch(/^\.*$/);
    }
  });

  it('are strung to a neighbour along their row, every one', () => {
    expect(poles.length).toBeGreaterThan(0);
    const at = new Set(poles.map((p) => `${p.tx},${p.ty}`));
    for (const p of poles) {
      expect(p.joins, `${p.tx},${p.ty}`).toBeGreaterThan(0);
      if (p.joins! & 2) expect(at.has(`${p.tx + POLE_SPAN},${p.ty}`)).toBe(true);
      if (p.joins! & 8) expect(at.has(`${p.tx - POLE_SPAN},${p.ty}`)).toBe(true);
    }
  });
});
