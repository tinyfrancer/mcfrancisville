import type { Tone } from '../lookColours';
import { ramp } from '../palette';
import { CLEAR } from '../sketch';
import type { Palette } from '../sprite';
import { ARM, DOLL_WIDTH, type Grid } from './body';

/*
 * Painting a layer onto her body and finishing it: light from the top left, shade and a soft
 * outline in its own darkest tone (decision 88); and the rows remembered for each body.
 */

/** Keeps a painted pixel, or leaves it clear so what is underneath shows. */
type Painter = (key: string, row: number, col: number) => string | null;

export function paint(body: Grid, painter: Painter): string[] {
  return body.map((line, r) => [...line].map((key, c) => painter(key, r, c) ?? '.').join(''));
}

/** Lays `top` over `base` from row `at` down (and column `left` across); `.` lets `base` show. */
export function stamp(base: readonly string[], top: Grid, at: number, left = 0): string[] {
  const out = base.map((row) => [...row]);
  top.forEach((line, i) => {
    const row = out[at + i];
    if (!row) return;
    [...line].forEach((ch, j) => {
      if (ch !== '.' && left + j >= 0 && left + j < row.length) row[left + j] = ch;
    });
  });
  return out.map((row) => row.join(''));
}

/** Moves a layer down by `by` rows, for her head as it bangs. */
export function lower(rows: readonly string[], by: number): string[] {
  if (by === 0) return [...rows];
  const blank = '.'.repeat(DOLL_WIDTH);
  return [...Array.from({ length: by }, () => blank), ...rows.slice(0, rows.length - by)];
}

/**
 * Light from the top left on a piece's `m`, and a soft outline round it: `M` where it turns away
 * from the light, `L` where it catches it, `O` round its edge. A piece painted onto her body
 * (`painted`) is outlined only where it meets her own outline or the air, so a tee doesn't draw a
 * line across her arm; a piece drawn over her (a hat) is outlined all round.
 */
export function finish(rows: readonly string[], body: Grid, mode: 'painted' | 'drawn'): string[] {
  const g = rows.map((row) => [...row]);
  const inPiece = (x: number, y: number) => {
    const key = rows[y]?.[x];
    return key !== undefined && key !== CLEAR;
  };
  for (let y = 0; y < g.length; y++) {
    for (let x = 0; x < DOLL_WIDTH; x++) {
      const key = rows[y]![x]!;
      if (key === 'm') {
        if (!inPiece(x + 1, y) || !inPiece(x, y + 1)) g[y]![x] = 'M';
        else if (!inPiece(x - 1, y) || !inPiece(x, y - 1)) g[y]![x] = 'L';
      } else if (key === CLEAR) {
        const under = body[y]?.[x] ?? CLEAR;
        if (mode === 'painted' && under !== 'o' && under !== CLEAR) continue;
        if (inPiece(x, y + 1) || inPiece(x - 1, y) || inPiece(x + 1, y) || inPiece(x, y - 1)) {
          g[y]![x] = 'O';
        }
      }
    }
  }
  return g.map((row) => row.join(''));
}

const drawnFor = new WeakMap<object, Map<string, readonly string[]>>();

/**
 * Remembers rows drawn for something (a body, a hairstyle): the same skin, hair or cut on the same
 * body is the same rows whatever else she wears, so a look is quick to put together. The rows are
 * shared, so nothing may change them.
 */
export function remember(
  owner: object,
  key: string,
  draw: () => readonly string[],
): readonly string[] {
  let drawn = drawnFor.get(owner);
  if (!drawn) {
    drawn = new Map();
    drawnFor.set(owner, drawn);
  }
  let rows = drawn.get(key);
  if (!rows) {
    rows = draw();
    drawn.set(key, rows);
  }
  return rows;
}

/** A number for each body, for a remembered drawing that depends on the body too. */
const bodyIds = new WeakMap<Grid, number>();

let bodies = 0;

export function bodyId(body: Grid): number {
  let id = bodyIds.get(body);
  if (id === undefined) {
    id = bodies++;
    bodyIds.set(body, id);
  }
  return id;
}

/** Her skin, shaded along the bottom and right of each part: head, torso, arms, legs. */
export function skinRows(body: Grid): readonly string[] {
  return remember(body, 'skin', () => shadeSkin(body));
}

function shadeSkin(body: Grid): string[] {
  const groups = ['sn', 'bp', ARM, 'lf'];
  const group = (key: string | undefined) => groups.findIndex((g) => key && g.includes(key));
  return body.map((row, y) =>
    [...row]
      .map((key, x) => {
        if (key === CLEAR || key === 'o') return key;
        const mine = group(key);
        const shaded = group(row[x + 1]) !== mine || group(body[y + 1]?.[x]) !== mine;
        return shaded ? 'S' : 's';
      })
      .join(''),
  );
}

export function centred(grid: Grid): number {
  return 16 - Math.ceil((grid[0]?.length ?? 0) / 2);
}

/** Her skin: its outline, its shade and itself. */
export function skinPalette(skin: Tone): Palette {
  const r = ramp(skin.main);
  return { '.': null, o: r[0], S: r[1], s: skin.main };
}
