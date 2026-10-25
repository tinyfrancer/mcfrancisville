import type { CutId } from '../../types/ids';
import { CLEAR } from '../sketch';
import { ARM, DOLL_WIDTH, type Grid, HEM, HIPS, measureOf, SHOULDER, type View } from './body';
import { paint, stamp } from './paint';

/*
 * The winter wardrobe's cuts (1.4's G2, decision 371): coats, knitwear, nightwear and what goes on
 * her head, hands and feet when it snows. Painted onto her regions like every other cut, every
 * detail stepped in from what her body measures (`measureOf`), so each lands on any build.
 */

/** How many rows above a foot pixel (r, c) is, straight down her leg; Infinity if not on one. */
function aboveFoot(body: Grid, r: number, c: number): number {
  for (let rr = r + 1; rr < body.length; rr++) {
    const key = body[rr]![c];
    if (key === 'f') return rr - r;
    if (key !== 'l') return Infinity;
  }
  return Infinity;
}

/** Whether a pixel of her arm is beside a part of it further down: where a sleeve ends. */
function cuffOf(body: Grid, r: number, c: number, beyond: string): boolean {
  return [body[r + 1]?.[c], body[r - 1]?.[c], body[r]?.[c - 1], body[r]?.[c + 1]].some(
    (k) => k !== undefined && beyond.includes(k),
  );
}

/** Whether (r, c) is the outline just under a foot pixel, where a sole would be. */
function underFoot(body: Grid, r: number, c: number): boolean {
  return body[r]![c] === 'o' && body[r - 1]?.[c] === 'f';
}

/**
 * Whether an outline pixel is where her side meets the air, so something thick can bulge out
 * over it: never on a line across her, and never beside her hand.
 */
function besideHer(body: Grid, r: number, c: number, covered: string): boolean {
  if (body[r]?.[c] !== 'o') return false;
  const sides = [body[r]?.[c - 1] ?? CLEAR, body[r]?.[c + 1] ?? CLEAR];
  return sides.some((k) => covered.includes(k)) && sides.includes(CLEAR) && !sides.includes('A');
}

/** The column down her middle, the right of the two middle ones: where a coat does up. */
function middleOf(body: Grid, view: View): number {
  const m = measureOf(body);
  return view === 'side' ? m.front : Math.round((m.left + m.right + 1) / 2);
}

/** A coat's skirts below her hips, `rows` long and `flare` wider each side by its hem. */
function skirts(body: Grid, view: View, rows: number, flare: number): string[] {
  const m = measureOf(body);
  const [from, to] = view === 'side' ? [m.back, m.front] : m.hips;
  const half = (to - from + 1) / 2;
  const middle = (from + to + 1) / 2;
  return body.map((line, y) =>
    [...line]
      .map((key, x) => {
        const i = y - HIPS;
        if (i < 0 || i >= rows || ARM.includes(key)) return CLEAR;
        const w = half + (flare * i) / (rows - 1);
        return Math.abs(x + 0.5 - middle) > w ? CLEAR : 'm';
      })
      .join(''),
  );
}

/** A long sleeve, ending in a cuff of `cuff` where her hand comes out. */
function sleeve(body: Grid, k: string, r: number, c: number, cuff: string): string | null {
  if (!'aew'.includes(k)) return null;
  return k === 'w' && cuffOf(body, r, c, 'A') ? cuff : 'm';
}

/**
 * A duffel coat: to the knee and done up, its wooden toggles on dark loops down the front, and its
 * hood lying between her shoulder blades behind.
 */
function duffelRows(body: Grid, view: View): string[] {
  const m = measureOf(body);
  const mid = middleOf(body, view);
  const toggles = [SHOULDER + 3, SHOULDER + 6, HIPS + 1];
  const [hoodL, hoodR] = [m.neck[0] - 2, m.neck[1] + 2];
  const coat = (r: number, c: number) => {
    if (view === 'front') {
      if (c === mid && r > SHOULDER) return 'M';
      if (toggles.includes(r)) {
        if (c === mid - 2 || c === mid - 1) return 'x';
        if (c === mid + 1) return 'y';
      }
      if (r === SHOULDER && (c <= hoodL || c >= hoodR)) return 'M';
    }
    if (view === 'side') {
      if (c === m.front && r > SHOULDER) return 'M';
      if (toggles.includes(r) && c === m.front - 1) return 'x';
      if (c <= m.back + 2 && r <= SHOULDER + 3)
        return r === SHOULDER + 3 || c === m.back + 2 ? 'M' : 'm';
    }
    if (view === 'back') {
      // The hood, its rim round it, lying over her back.
      if (r <= SHOULDER + 5 && (c === hoodL || c === hoodR)) return 'M';
      if (r === SHOULDER + 5 && c > hoodL && c < hoodR) return 'M';
      if (r > HIPS + 3 && c === mid) return 'M';
    }
    return 'm';
  };
  const top = paint(body, (k, r, c) => {
    const s = sleeve(body, k, r, c, 'M');
    if (s) return s;
    return k === 'b' || k === 'p' ? coat(r, c) : null;
  });
  const below = skirts(body, view, 8, 2).map((line, y) =>
    [...line].map((ch, x) => (ch === CLEAR ? ch : coat(y, x))).join(''),
  );
  return stamp(below, top, 0);
}

/**
 * A puffer jacket: quilted into fat pillows, a row of stitching every three, puffed out a pixel
 * past her all down her sides and arms, done up with a silver zip to a collar round her chin.
 */
function pufferRows(body: Grid, view: View): string[] {
  const mid = middleOf(body, view);
  const covered = 'bpaew';
  return paint(body, (k, r, c) => {
    if (k === 'n') return r === SHOULDER - 1 ? 'm' : null;
    if ('aew'.includes(k)) {
      if (k === 'w' && cuffOf(body, r, c, 'A')) return 'M';
      // The sleeves quilted a row out of step with the body, so her arms read against it.
      return (r - SHOULDER) % 3 === 0 ? 'M' : 'm';
    }
    if (k === 'b' || (k === 'p' && r <= HIPS + 1)) {
      if (view === 'front' && c === mid) return 'x';
      const beside = [body[r]?.[c - 1], body[r]?.[c + 1]];
      if (view !== 'side' && beside.some((n) => n !== undefined && ARM.includes(n))) return 'M';
      if (r === HIPS + 1) return 'M';
      return (r - SHOULDER) % 3 === 2 ? 'M' : 'm';
    }
    if (r > SHOULDER && r <= HIPS + 1 && besideHer(body, r, c, covered)) {
      return (r - SHOULDER) % 3 === 2 ? 'M' : 'm';
    }
    return null;
  });
}

/**
 * A long scarf wound twice round her neck, two tails hanging down her front, one longer, fringed at
 * the ends; from behind, one tail is flung back over her shoulder. Her arms are always in front of
 * it, so a pose crossing them over her chest goes over the tails.
 */
function scarfRows(body: Grid, view: View): string[] {
  const m = measureOf(body);
  const s: string[][] = body.map(() => Array.from({ length: DOLL_WIDTH }, () => CLEAR));
  const set = (r: number, c: number, key: string) => {
    if (r < 0 || r >= s.length || c < 0 || c >= DOLL_WIDTH) return;
    if (ARM.includes(body[r]?.[c] ?? CLEAR)) return;
    s[r]![c] = key;
  };
  const [neckL, neckR] = view === 'side' ? [m.back + 2, m.front - 2] : m.neck;
  // The wrap: two turns round her neck, a fold between them.
  for (let c = neckL - 1; c <= neckR + 1; c++) set(SHOULDER - 1, c, 'm');
  for (let c = neckL - 2; c <= neckR + 2; c++) set(SHOULDER, c, c === neckL - 2 ? 'M' : 'm');
  for (let c = neckL - 1; c <= neckR + 1; c++) set(SHOULDER + 1, c, 'm');
  const tail = (left: number, length: number) => {
    for (let r = SHOULDER + 2; r < SHOULDER + 2 + length; r++) {
      for (let c = left; c < left + 3; c++) set(r, c, 'm');
    }
    const fringe = SHOULDER + 2 + length;
    set(fringe, left, 'M');
    set(fringe, left + 2, 'M');
  };
  if (view === 'front') {
    tail(neckL - 2, 8);
    tail(neckL + 2, 5);
  } else if (view === 'side') {
    tail(m.front - 3, 8);
  } else {
    tail(neckR, 6);
  }
  return s.map((row) => row.join(''));
}

/** Knitted mittens: a snowflake on the back of each, and a cream cuff round the wrist. */
function mittenRows(body: Grid): string[] {
  return paint(body, (k, r, c) => {
    if (k === 'A') {
      const inside = [body[r]?.[c - 1], body[r]?.[c + 1], body[r - 1]?.[c], body[r + 1]?.[c]];
      return inside.every((n) => n === 'A') && (r + c) % 2 === 0 ? 'x' : 'm';
    }
    return k === 'w' && cuffOf(body, r, c, 'A') ? 'y' : null;
  });
}

/** Each run of a key along a row: its first and last column. */
function runsOf(line: string, key: string): [number, number][] {
  const runs: [number, number][] = [];
  for (let c = 0; c < line.length; c++) {
    if (line[c] !== key) continue;
    const from = c;
    while (line[c + 1] === key) c++;
    runs.push([from, c]);
  }
  return runs;
}

/** Cable-knit tights: a cable twisting up the middle of each leg, the feet plain. */
function cableRows(body: Grid): string[] {
  const cables = new Map<string, string>();
  body.forEach((line, r) => {
    for (const [from, to] of runsOf(line, 'l')) {
      const centre = Math.floor((from + to) / 2);
      if (r % 3 === 0) cables.set(`${r},${centre}`, 'M');
      else if (r % 3 === 1) {
        cables.set(`${r},${centre - 1}`, 'M');
        cables.set(`${r},${centre + 1}`, 'M');
      } else cables.set(`${r},${centre}`, 'L');
    }
  });
  return paint(body, (k, r, c) => {
    if (!'plf'.includes(k)) return null;
    return cables.get(`${r},${c}`) ?? 'm';
  });
}

/**
 * Snow boots: a chunky shaft up her shin, a pixel wider than her leg, a fluffy cuff scalloped
 * along its top, and a thick dark sole.
 */
function snowBootRows(body: Grid): string[] {
  return paint(body, (k, r, c) => {
    if (k === 'f') return 'm';
    if (underFoot(body, r, c)) return 'y';
    if (k === 'l') {
      const up = aboveFoot(body, r, c);
      if (up <= 3) return 'm';
      if (up === 4) return 'x';
      return up === 5 && c % 2 === 0 ? 'x' : null;
    }
    if (k !== 'o') return null;
    const sides = [body[r]?.[c - 1] ?? CLEAR, body[r]?.[c + 1] ?? CLEAR];
    if (sides.includes('f')) return sides.includes(CLEAR) ? 'm' : null;
    if (!sides.includes('l') || !sides.includes(CLEAR)) return null;
    const up = aboveFoot(body, r, sides[0] === 'l' ? c - 1 : c + 1);
    return up <= 3 ? 'm' : up === 4 ? 'x' : null;
  });
}

/**
 * A Fair Isle jumper: long sleeves and a ribbed hem and cuffs, a band of little diamonds round its
 * yoke between two lines, each with a white heart, and a row of dots near the hem.
 */
function jumperRows(body: Grid): string[] {
  const band = (r: number, c: number): string | null => {
    const i = r - SHOULDER;
    if (i === 1 || i === 5) return 'y';
    if (i === 2 || i === 4) return c % 4 === 2 ? 'y' : null;
    if (i === 3) return c % 4 === 2 ? 'x' : c % 2 === 1 ? 'y' : null;
    if (r === HEM - 1) return c % 2 === 0 ? 'y' : null;
    return null;
  };
  return paint(body, (k, r, c) => {
    if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'M' : 'm';
    if (k === 'p') return r === HIPS ? 'M' : null;
    if (k !== 'b') return null;
    return band(r, c) ?? 'm';
  });
}

/**
 * A chunky cardigan, worn open and long: a shawl collar down both edges, big wooden buttons down
 * one, a cable up each side, and skirts to the top of her thighs.
 */
function chunkyCardiganRows(body: Grid, view: View): string[] {
  const m = measureOf(body);
  const mid = middleOf(body, view);
  const buttons = [SHOULDER + 4, SHOULDER + 7, HIPS + 2];
  const cables = view === 'side' ? [m.back + 3] : [m.left + 2, m.right - 2];
  const open = (r: number, c: number) => {
    if (view === 'back') return false;
    if (view === 'side') return c >= m.front - 1;
    const spread = r > HIPS ? Math.floor((r - HIPS) / 3) : 0;
    return c >= mid - 2 - spread && c <= mid + 1 + spread;
  };
  const knit = (r: number, c: number) => {
    if (open(r, c)) return CLEAR;
    if (view === 'front') {
      const left = c === mid - 3 || c === mid - 4;
      const right = c === mid + 2 || c === mid + 3;
      if (c === mid - 3 && buttons.includes(r)) return 'x';
      if (left || right) return 'M';
    }
    if (view === 'side' && c === m.front - 2) return 'M';
    for (const at of cables) {
      if (c === at + (r % 2)) return 'M';
    }
    return 'm';
  };
  const top = paint(body, (k, r, c) => {
    const s = sleeve(body, k, r, c, 'M');
    if (s) return s;
    return k === 'b' || k === 'p' ? knit(r, c) : null;
  });
  const below = skirts(body, view, 6, 1).map((line, y) =>
    [...line]
      .map((ch, x) => {
        if (ch === CLEAR) return ch;
        return y === HIPS + 5 && !open(y, x) ? 'M' : knit(y, x);
      })
      .join(''),
  );
  return stamp(below, top, 0);
}

/**
 * A flannel pyjama top: long sleeves piped at the cuffs, a little collar, piping down the front
 * where it buttons and along the hem, and a pocket on her chest.
 */
function pyjamaTopRows(body: Grid, view: View): string[] {
  const m = measureOf(body);
  const mid = middleOf(body, view);
  const [neckL, neckR] = m.neck;
  const [pocketL, pocketR] = [m.right - 4, m.right - 2];
  return paint(body, (k, r, c) => {
    if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'x' : 'm';
    if (k === 'p') return r === HIPS ? 'x' : null;
    if (k !== 'b') return null;
    if (view === 'front') {
      if (
        r === SHOULDER &&
        (c === neckL - 1 || c === neckL - 2 || c === neckR + 1 || c === neckR + 2)
      )
        return 'x';
      if (r === SHOULDER + 1 && (c === neckL || c === neckR)) return 'x';
      if (c === mid && r > SHOULDER) return 'x';
      if (r === SHOULDER + 3 && c >= pocketL && c <= pocketR) return 'x';
    }
    if (view === 'side' && c === m.front && r > SHOULDER) return 'x';
    if (view === 'back' && r === SHOULDER) return 'x';
    return 'm';
  });
}

/**
 * Flannel pyjama bottoms: baggy, a pixel out past her outside edge, piped at the ankle, with a
 * drawstring's two ends at the front of the waist.
 */
function pyjamaBottomRows(body: Grid, view: View): string[] {
  const m = measureOf(body);
  const mid = middleOf(body, view);
  return paint(body, (k, r, c) => {
    if (k === 'p')
      return view === 'front' && r <= HIPS + 1 && (c === mid - 2 || c === mid + 1) ? 'x' : 'm';
    if (k === 'l') return aboveFoot(body, r, c) === 1 ? 'x' : 'm';
    if (k !== 'o') return null;
    const sides = [body[r]?.[c - 1] ?? CLEAR, body[r]?.[c + 1] ?? CLEAR];
    if (!sides.includes('l') || !sides.includes(CLEAR)) return null;
    // Only her outside edges: between her legs stays clear.
    if (view === 'front' && c > m.legs[0][1] && c < m.legs[1][0]) return null;
    const leg = sides[0] === 'l' ? c - 1 : c + 1;
    return aboveFoot(body, r, leg) > 1 ? 'm' : null;
  });
}

/**
 * A long fluffy dressing gown, wrapped over and tied: a shawl collar round a V at her neck, wide
 * turned-back cuffs, a belt with its ends hanging, a pocket, and skirts to her shins; fluffy, so a
 * pixel out past her sides.
 */
function gownRows(body: Grid, view: View): string[] {
  const m = measureOf(body);
  const mid = middleOf(body, view);
  const knot = view === 'side' ? m.front - 1 : mid - 3;
  const fluff = 'bpaew';
  const gown = (r: number, c: number): string => {
    if (view === 'front') {
      const i = r - SHOULDER;
      const reach = 3 - i * 0.75;
      if (i >= 0 && i < 4 && Math.abs(c + 0.5 - mid) < reach) return CLEAR;
      if (i >= 0 && i < 5 && Math.abs(c + 0.5 - mid) < reach + 1.5) return 'L';
      if (r > HIPS && c === mid - 1) return 'M';
      if (r === HIPS + 2 && c >= m.left + 1 && c <= m.left + 3) return 'M';
    }
    if (view === 'side' && r <= SHOULDER + 3 && c >= m.front - 1)
      return c === m.front ? CLEAR : 'L';
    // The belt, knotted at one side, its ends hanging.
    if (r === HEM - 1 || r === HEM)
      return (c === knot || c === knot + 1) && view !== 'back' ? 'L' : 'M';
    if (r > HEM && r <= HEM + 4 && (c === knot || c === knot + 1) && view !== 'back') return 'M';
    return 'm';
  };
  const top = paint(body, (k, r, c) => {
    if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'L' : 'm';
    if (k === 'b' || k === 'p') return gown(r, c);
    if (r > SHOULDER && r <= HIPS + 1 && besideHer(body, r, c, fluff)) return 'm';
    return null;
  });
  const below = skirts(body, view, 10, 3).map((line, y) =>
    [...line].map((ch, x) => (ch === CLEAR ? ch : gown(y, x))).join(''),
  );
  return stamp(below, top, 0);
}

/**
 * A bat onesie: all of her but her head and hands, feet and all, a pale oval tummy on the front,
 * ribbed cuffs, and two little scalloped wings on her back.
 */
function onesieRows(body: Grid, view: View): string[] {
  const m = measureOf(body);
  const mid = view === 'side' ? m.front - 1 : (m.left + m.right + 1) / 2;
  const tummy = (r: number, c: number) => {
    if (view === 'back' || r < SHOULDER + 3 || r > HIPS + 1) return false;
    const dy = (r + 0.5 - (SHOULDER + 3 + HIPS + 2) / 2) / 4.5;
    const dx = (c + 0.5 - mid) / (view === 'side' ? 2 : 3.2);
    return dx * dx + dy * dy <= 1;
  };
  const wing = (r: number, c: number) => {
    const i = r - (SHOULDER + 1);
    if (i < 0 || i > 4) return false;
    const spans: [number, number][] =
      view === 'back'
        ? [
            [mid - 6, mid - 1],
            [mid, mid + 5],
          ]
        : view === 'side'
          ? [[m.back + 1, m.back + 4]]
          : [];
    return spans.some(([from, to]) => {
      if (c < from || c > to) return false;
      // The bottom edge scalloped between the wing's fingers.
      return i < 4 || (c - from) % 2 === 0;
    });
  };
  return paint(body, (k, r, c) => {
    if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'M' : 'm';
    if (k === 'f') return 'm';
    if (k === 'l') return aboveFoot(body, r, c) === 1 ? 'M' : 'm';
    if (k === 'b' || k === 'p') {
      if (tummy(r, c)) return 'x';
      if (wing(r, c)) return r === SHOULDER + 1 || (c - mid) % 3 === 0 ? 'M' : 'L';
      return 'm';
    }
    return underFoot(body, r, c) ? 'M' : null;
  });
}

/** Fluffy slippers: round and puffed a pixel round her feet, a fluffy rim and a pompom on top. */
function slipperRows(body: Grid, view: View): string[] {
  return paint(body, (k, r, c) => {
    if (k === 'f') {
      const top = body[r - 1]?.[c] !== 'f';
      if (!top) return 'm';
      // A pompom on the toe: the front of each foot from the side, its middle from the front.
      const row = body[r]!;
      if (view === 'side') return row[c + 1] !== 'f' || row[c + 2] !== 'f' ? 'x' : 'm';
      const run = runsOf(row, 'f').find(([from, to]) => c >= from && c <= to);
      return run && Math.abs(c + 0.5 - (run[0] + run[1] + 1) / 2) < 1 ? 'x' : 'm';
    }
    if (underFoot(body, r, c)) return 'M';
    if (k === 'l') return aboveFoot(body, r, c) === 1 ? 'x' : null;
    if (k !== 'o') return null;
    const sides = [body[r]?.[c - 1] ?? CLEAR, body[r]?.[c + 1] ?? CLEAR];
    return sides.includes('f') && sides.includes(CLEAR) ? 'm' : null;
  });
}

/** The winter wardrobe's painted cuts, by cut. */
export const WINTER_CUTS: Partial<Record<CutId, (body: Grid, view: View) => string[]>> = {
  duffel: duffelRows,
  puffer: pufferRows,
  scarf: scarfRows,
  mittens: (body) => mittenRows(body),
  knitTights: (body) => cableRows(body),
  snowBoots: (body) => snowBootRows(body),
  jumper: (body) => jumperRows(body),
  chunkyCardigan: chunkyCardiganRows,
  pyjamaTop: pyjamaTopRows,
  pyjamaBottoms: pyjamaBottomRows,
  dressingGown: gownRows,
  onesie: onesieRows,
  slippers: slipperRows,
};
