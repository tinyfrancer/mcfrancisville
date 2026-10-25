import { describe, expect, it } from 'vitest';
import { LANTERN_SHORE, TOWN, WHISPERWOOD } from '../../src/data/maps';
import { lifeOf, sheenFrom, SHEEN_EVERY } from '../../src/render/life';
import { wetAround } from '../../src/sprites/banks';
import { MELT, meltNear } from '../../src/sprites/ice';
import { seasonPieces } from '../../src/sprites/seasons';
import { groundPieces, snowOnIce, TILE } from '../../src/sprites/terrain';
import { parseMap, tileAt } from '../../src/systems/grid';

const wood = parseMap(WHISPERWOOD);
const shore = parseMap(LANTERN_SHORE);
const at = (map: typeof wood) => (tx: number, ty: number) => tileAt(map, tx, ty);

/** The keys of the piece laid over the grass at a tile. */
function keys(map: typeof wood, tx: number, ty: number): string[] {
  const pieces = groundPieces(at(map), tx, ty);
  return pieces[pieces.length - 1]!.source.rows.flatMap((r) => [...r]);
}

function tilesOf(map: typeof wood, id: string): [number, number][] {
  const out: [number, number][] = [];
  for (let ty = 0; ty < map.height; ty++)
    for (let tx = 0; tx < map.width; tx++) if (tileAt(map, tx, ty) === id) out.push([tx, ty]);
  return out;
}

describe('the frozen creeks (1.1 A3)', () => {
  it('draws no two tiles of the creek alike, and each the same every time', () => {
    const ice = tilesOf(wood, 'ice');
    expect(ice.length).toBeGreaterThan(20);
    const drawn = ice.map(([tx, ty]) => keys(wood, tx, ty).join(''));
    expect(new Set(drawn).size).toBe(drawn.length);
    const [tx, ty] = ice[3]!;
    expect(keys(wood, tx, ty).join('')).toBe(drawn[3]);
  });

  it('has patches of clear and frosted ice, and cracks, rather than one flat paint', () => {
    const all = tilesOf(wood, 'ice').flatMap(([tx, ty]) => keys(wood, tx, ty));
    const share = (k: string) => all.filter((c) => c === k).length / all.length;
    // Plain, clear and clear over the deep: none of them the whole creek.
    for (const k of ['w', 'd', 'D']) {
      expect(share(k), k).toBeGreaterThan(0.04);
      expect(share(k), k).toBeLessThan(0.6);
    }
    expect(share('c')).toBeGreaterThan(0.003);
    expect(share('r')).toBeGreaterThan(0.02);
    // Stones set in the bank's lip.
    expect(share('s') + share('S') + share('t')).toBeGreaterThan(0);
  });

  it('meets itself across a seam: a crack running out of one tile runs on into the next', () => {
    const ice = new Set(tilesOf(wood, 'ice').map(([x, y]) => `${x},${y}`));
    let met = 0;
    let ran = 0;
    for (const key of ice) {
      const [tx, ty] = key.split(',').map(Number) as [number, number];
      if (!ice.has(`${tx + 1},${ty}`)) continue;
      const left = keys(wood, tx, ty);
      const right = keys(wood, tx + 1, ty);
      for (let y = 1; y < TILE - 1; y++) {
        if (left[y * TILE + TILE - 1] !== 'c') continue;
        ran++;
        // A hairline steps on straight or on the diagonal.
        if ([y - 1, y, y + 1].some((j) => right[j * TILE] === 'c')) met++;
      }
    }
    expect(ran).toBeGreaterThan(2);
    expect(met / ran).toBeGreaterThan(0.8);
  });

  it('melts where the creek meets the lake: plates and open water on its last tile, none above', () => {
    const mouth = keys(shore, 12, 8).concat(keys(shore, 13, 8));
    const water = mouth.filter((k) => k === 'u' || k === 'v' || k === 'V').length;
    expect(water).toBeGreaterThan(40);
    expect(water).toBeLessThan(mouth.length * 0.75);
    // Still ice over most of the tile above it, and none of it melted three tiles up.
    const above = keys(shore, 12, 7);
    expect(above.filter((k) => k === 'u' || k === 'v').length).toBeLessThan(above.length / 4);
    expect(keys(shore, 12, 4).some((k) => k === 'u' || k === 'v' || k === 'V')).toBe(false);
    expect(meltNear(at(shore), 12, 4)).toBeNull();
    // Floes drift off on the lake just past it.
    const floes = [11, 12, 13, 14].flatMap((tx) => keys(shore, tx, 9).concat(keys(shore, tx, 8)));
    expect(floes.filter((k) => k === 'i').length).toBeGreaterThan(5);
    // The melt is worked out on the world, so the two sides of a seam agree.
    const melt = meltNear(at(shore), 12, 8)!;
    const other = meltNear(at(shore), 13, 8)!;
    for (let y = 8 * TILE; y < 9 * TILE; y++) {
      expect(melt(13 * TILE, y)).toBeCloseTo(other(13 * TILE, y));
    }
    expect(melt(12 * TILE + 16, 8 * TILE + 31)).toBeLessThan(MELT);
  });

  it('lies under snow in winter along its banks and in patches, never on the lawn past them', () => {
    const tiles = tilesOf(wood, 'ice');
    let snowy = 0;
    for (const [tx, ty] of tiles) {
      const winter = seasonPieces(at(wood), tx, ty, undefined, 'winter', true);
      const top = winter[winter.length - 1]!;
      expect(top.key, `${tx},${ty}`).toMatch(/^ground:iceSnow:/);
      snowy += top.source.rows.join('').replace(/\./g, '').length;
      // Autumn has none.
      const autumn = seasonPieces(at(wood), tx, ty, undefined, 'autumn', false);
      expect(autumn.some((p) => p.key.startsWith('ground:iceSnow'))).toBe(false);
    }
    const share = snowy / (tiles.length * TILE * TILE);
    expect(share).toBeGreaterThan(0.08);
    expect(share).toBeLessThan(0.5);
    expect(snowOnIce(at(wood), 5, 5)).toBeNull();
  });

  it('gives each tile of ice a sheen to pass over, on its open face alone', () => {
    const life = lifeOf(wood);
    expect(life.sheen.length).toBe(tilesOf(wood, 'ice').length);
    for (const { tx, ty, pixels } of life.sheen) {
      const face = keys(wood, tx, ty);
      for (let i = 0; i < pixels.length; i += 2) {
        expect(['w', 'd', 'D']).toContain(face[pixels[i + 1]! * TILE + pixels[i]!]);
      }
    }
    expect(lifeOf(parseMap(TOWN)).sheen).toHaveLength(0);
  });

  it('glides the sheen a whole pixel at a time, slowly, and round again', () => {
    expect(sheenFrom(100, 100, 0)).toBe(sheenFrom(100, 100, 0));
    let steps = 0;
    let last = sheenFrom(100, 100, 0);
    for (let ms = 0; ms < 1000; ms += 16) {
      const now = sheenFrom(100, 100, ms);
      expect(Math.abs(now - last)).toBeLessThanOrEqual(1);
      if (now !== last) steps++;
      last = now;
    }
    // Under a dozen pixels a second.
    expect(steps).toBeLessThan(12);
    expect(steps).toBeGreaterThan(2);
    expect(sheenFrom(100 + SHEEN_EVERY, 100, 500)).toBe(sheenFrom(100, 100, 500));
  });
});

// 1.3's F4 (decision 363): Whisperwood's creek stopped square against the hedge at its east end.
describe('where a creek meets the edge (1.3 F4)', () => {
  /** The wet round a tile as rows of five, top first. */
  const ring = (map: typeof wood, tx: number, ty: number) =>
    wetAround(at(map), tx, ty, (id) => id === 'ice' || id === 'water').match(/.{5}/g)!;

  it('curls its bank round where it meets the hedge unbroken', () => {
    for (const ty of [25, 26]) {
      const rows = ring(wood, 24, ty);
      // The hedge beyond the creek's last tile is dry, so the bank closes it there.
      expect(rows.map((r) => r.slice(3)).join(''), `24,${ty}`).not.toContain('1');
      expect(rows[2]![1], `24,${ty}`).toBe('1');
    }
  });

  it('runs on off the map where it leaves through a gap in the hedge', () => {
    // Whisperwood's creek out to the shore at the bottom, and the shore's in from the woods.
    expect(ring(wood, 17, 36)[4]).toMatch(/11/);
    expect(ring(shore, 12, 1)[0]).toMatch(/11/);
  });
});
