import { describe, expect, it } from 'vitest';
import {
  changedTiles,
  Chunks,
  chunkGrid,
  chunkRect,
  chunksInView,
  chunksTouching,
  CHUNK_TILES,
} from '../../src/render/chunks';
import { TILE_SIZE } from '../../src/config/world';

/** The town: 40×50 tiles, which is 5 chunks across and 7 down, the last row two tiles high. */
const TOWN = chunkGrid({ width: 40, height: 50 });
/** Her phone's view in world pixels, at two device pixels a game pixel. */
const VIEW = { width: 585, height: 1266 };

describe('chunkGrid', () => {
  it('divides the town into whole chunks with a short last row', () => {
    expect(TOWN).toEqual({ cols: 5, rows: 7, size: 256, width: 1280, height: 1600 });
    expect(CHUNK_TILES * TILE_SIZE).toBe(256);
  });

  it('cuts the chunks at the map edge short', () => {
    expect(chunkRect(TOWN, 0)).toEqual({ x: 0, y: 0, width: 256, height: 256 });
    expect(chunkRect(TOWN, 6)).toEqual({ x: 256, y: 256, width: 256, height: 256 });
    expect(chunkRect(TOWN, 34)).toEqual({ x: 1024, y: 1536, width: 256, height: 64 });
    const odd = chunkGrid({ width: 26, height: 38 });
    expect(chunkRect(odd, odd.cols - 1)).toEqual({ x: 768, y: 0, width: 64, height: 256 });
  });

  it('can take a whole map as one chunk', () => {
    const one = chunkGrid({ width: 40, height: 50 }, 50);
    expect(one.cols).toBe(1);
    expect(one.rows).toBe(1);
    expect(chunkRect(one, 0)).toEqual({ x: 0, y: 0, width: 1280, height: 1600 });
  });
});

describe('chunksInView', () => {
  it('finds the chunks under the view at the top-left of the map', () => {
    const seen = chunksInView(TOWN, { x: 0, y: 0 }, VIEW);
    // 585 pixels across reach into the third column; 1266 down into the fifth row.
    expect(seen).toEqual([0, 1, 2, 5, 6, 7, 10, 11, 12, 15, 16, 17, 20, 21, 22]);
  });

  it('takes in the next chunk the pixel the view crosses into it', () => {
    expect(chunksInView(TOWN, { x: 0, y: 0 }, { width: 256, height: 256 })).toEqual([0]);
    expect(chunksInView(TOWN, { x: 0, y: 0 }, { width: 257, height: 256 })).toEqual([0, 1]);
    expect(chunksInView(TOWN, { x: 1, y: 0 }, { width: 256, height: 256 })).toEqual([0, 1]);
  });

  it('stops at the bottom-right of the map', () => {
    const cam = { x: TOWN.width - VIEW.width, y: TOWN.height - VIEW.height };
    const seen = chunksInView(TOWN, cam, VIEW);
    expect(seen[0]).toBe(1 * 5 + 2);
    expect(seen[seen.length - 1]).toBe(6 * 5 + 4);
    expect(seen).toHaveLength(3 * 6);
  });

  it('never asks for a chunk off the map', () => {
    const seen = chunksInView(TOWN, { x: -100, y: 5000 }, VIEW);
    expect(seen.every((i) => i >= 0 && i < TOWN.cols * TOWN.rows)).toBe(true);
    expect(seen.length).toBeGreaterThan(0);
  });
});

describe('chunksTouching', () => {
  it('is the tile’s own chunk well inside it', () => {
    expect([...chunksTouching(TOWN, [{ tx: 4, ty: 4 }])]).toEqual([0]);
  });

  it('reaches the chunks beside a tile on a seam, since its neighbours draw from it', () => {
    expect([...chunksTouching(TOWN, [{ tx: 8, ty: 8 }])].sort((a, b) => a - b)).toEqual([
      0, 1, 5, 6,
    ]);
    expect([...chunksTouching(TOWN, [{ tx: 7, ty: 3 }])].sort((a, b) => a - b)).toEqual([0, 1]);
    expect([...chunksTouching(TOWN, [{ tx: 7, ty: 3 }], 0)]).toEqual([0]);
  });

  it('stays on the map at the edges', () => {
    expect([...chunksTouching(TOWN, [{ tx: 0, ty: 0 }])]).toEqual([0]);
    expect([...chunksTouching(TOWN, [{ tx: 39, ty: 49 }])]).toEqual([34]);
  });
});

describe('changedTiles', () => {
  it('names each tile that differs, by column and row', () => {
    const before = ['grass', 'water', 'water', 'grass'];
    const after = ['grass', 'ice', 'water', 'hedge'];
    expect(changedTiles(before, after, 2)).toEqual([
      { tx: 1, ty: 0 },
      { tx: 1, ty: 1 },
    ]);
    expect(changedTiles(before, before, 2)).toEqual([]);
  });
});

describe('Chunks', () => {
  const made = () => {
    const bakes: number[] = [];
    const chunks = new Chunks(TOWN, (i) => {
      bakes.push(i);
      return `chunk ${i} (${bakes.length})`;
    });
    return { bakes, chunks };
  };

  it('bakes a chunk the first time it is asked for, and hands back the same one after', () => {
    const { bakes, chunks } = made();
    expect(chunks.baked).toBe(0);
    expect(chunks.get(3)).toBe('chunk 3 (1)');
    expect(chunks.get(3)).toBe('chunk 3 (1)');
    expect(bakes).toEqual([3]);
    expect(chunks.baked).toBe(1);
    expect(chunks.has(3)).toBe(true);
    expect(chunks.has(4)).toBe(false);
  });

  it('bakes an invalidated chunk afresh and leaves the others', () => {
    const { bakes, chunks } = made();
    chunks.get(3);
    chunks.get(4);
    chunks.invalidate(chunksTouching(TOWN, [{ tx: 24, ty: 4 }]));
    expect(chunks.has(3)).toBe(false);
    expect(chunks.has(4)).toBe(true);
    expect(chunks.get(3)).toBe('chunk 3 (3)');
    expect(chunks.get(4)).toBe('chunk 4 (2)');
    expect(bakes).toEqual([3, 4, 3]);
  });

  it('lets go of everything when released', () => {
    const { chunks } = made();
    for (const i of chunksInView(TOWN, { x: 0, y: 0 }, VIEW)) chunks.get(i);
    expect(chunks.baked).toBe(15);
    chunks.release();
    expect(chunks.baked).toBe(0);
  });
});
