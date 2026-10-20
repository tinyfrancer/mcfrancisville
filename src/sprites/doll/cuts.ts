import { OUTFITS } from '../../data/outfits';
import type { CutId } from '../../types/ids';
import type { Worn } from '../../types/look';
import { CLEAR } from '../sketch';
import { capeRows } from './backs';
import {
  ARM,
  DOLL_WIDTH,
  EMPTY,
  type Grid,
  HEM,
  HIPS,
  measureOf,
  SHOULDER,
  type View,
} from './body';
import { glassesRows, HATS } from './hats';
import { centred, finish, paint, remember, stamp } from './paint';
import { OUTFIT_ART, type OutfitArt, withPattern } from './prints';

/*
 * The cuts: each piece of clothing painted onto her body's regions for one view (decision 27),
 * tailored with seams and folds worked out from the shape (decision 152).
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

/**
 * Which end of a foot a foot pixel is. From the side she faces right in the grid, so the heel is a
 * foot's left end and the toe its right; from the front they are just its two sides.
 */
function footEnd(body: Grid, r: number, c: number): 'heel' | 'toe' | 'both' | null {
  const row = body[r]!;
  if (row[c] !== 'f') return null;
  const heel = row[c - 1] !== 'f';
  const toe = row[c + 1] !== 'f';
  return heel && toe ? 'both' : heel ? 'heel' : toe ? 'toe' : null;
}

/** Whether (r, c) is the outline just under a foot pixel, where a sole or a heel would be. */
function underFoot(body: Grid, r: number, c: number): boolean {
  return body[r]![c] === 'o' && body[r - 1]?.[c] === 'f';
}

/** A heel is drawn under the back of each foot, and shows only from the side. */
function underHeel(body: Grid, view: View, r: number, c: number): boolean {
  if (view !== 'side' || !underFoot(body, r, c)) return false;
  const end = footEnd(body, r - 1, c);
  return end === 'heel' || end === 'both';
}

/** Whether a pixel of her arm is beside a part of it further down: where a sleeve ends. */
function cuffOf(body: Grid, r: number, c: number, beyond: string): boolean {
  return [body[r + 1]?.[c], body[r - 1]?.[c], body[r]?.[c - 1], body[r]?.[c + 1]].some(
    (k) => k !== undefined && beyond.includes(k),
  );
}

/**
 * A skirt flaring from her hips, `rows` long and `flare` pixels wider each side by its hem, and
 * behind her arms and hands, which stay in front of it.
 */
function skirt(body: Grid, view: View, rows: number, flare: number, pleats: boolean): string[] {
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
        if (Math.abs(x + 0.5 - middle) > w) return CLEAR;
        return pleats && i > 0 && x % 3 === 0 ? 'M' : 'm';
      })
      .join(''),
  );
}

/** One piece of clothing's layer, for one facing and frame, finished and ready for its colours. */
export function pieceRows(worn: Worn, view: View, body: Grid): readonly string[] {
  return remember(body, `piece:${worn.id}:${view}`, () => drawPiece(worn, view, body));
}

function drawPiece(worn: Worn, view: View, body: Grid): string[] {
  const art = OUTFIT_ART[worn.id];
  const cut = OUTFITS[worn.id].cut;
  const rows = withPattern(tailor(cutRows(cut, art, view, body), cut, view, body), art.pattern);
  // Glass is see-through, so the bubble helmet is a rim with no outline.
  if (NECKLACES.includes(cut) || GLASSES.includes(cut) || cut === 'helmet') return rows;
  return finish(rows, body, HATS[cut] ? 'drawn' : 'painted');
}

const TOPS: readonly CutId[] = [
  'tee',
  'jersey',
  'threeQuarterTee',
  'sundress',
  'collarDress',
  'jacket',
  'turtleneck',
  'hoodie',
  'cardigan',
  'bigTee',
  'longTee',
  'moto',
  'denimJacket',
  'operaCoat',
  'velvetDress',
  'spacesuit',
];

const CREW_NECKS: readonly CutId[] = ['tee', 'jersey', 'threeQuarterTee', 'bigTee', 'longTee'];

const TROUSERS: readonly CutId[] = ['jeans', 'cutoffs', 'overalls'];

/** Bottoms worn over the top, not under it: overalls, their bib and straps across it. */
export const BIBS: readonly CutId[] = ['overalls'];

/**
 * Seams, folds and shade, the same on every piece of a cut: a top creases under her arms and
 * pulls in toward her waist, a crew neck has its rim, and trousers have a fly, pockets and a
 * knee catching the light. Only plain fabric (`m`) is touched, so a print or a trim stays whole.
 */
function tailor(rows: string[], cut: CutId, view: View, body: Grid): string[] {
  const top = TOPS.includes(cut);
  const trousers = TROUSERS.includes(cut);
  if (!top && !trousers) return rows;
  const front = view === 'front';
  const m = measureOf(body);
  const [hipL, hipR] = m.hips;
  const folds = new Set<string>();
  const fold = (x: number, y: number) => folds.add(`${x},${y}`);
  if (top && view !== 'side') {
    for (let y = SHOULDER + 2; y <= HEM; y++) {
      for (let x = 0; x < DOLL_WIDTH; x++) {
        const beside = [body[y]?.[x - 1], body[y]?.[x + 1]];
        if (body[y]?.[x] === 'b' && beside.some((k) => k !== undefined && ARM.includes(k))) {
          fold(x, y);
        }
      }
    }
    // Pulling in toward her waist, two and three in from each side.
    for (const [x, y] of [
      [m.left + 2, 30],
      [m.left + 3, 31],
      [m.right - 2, 30],
      [m.right - 3, 31],
    ] as const) {
      fold(x, y);
    }
    if (front && CREW_NECKS.includes(cut)) {
      for (let x = m.neck[0] - 1; x <= m.neck[1] + 1; x++) fold(x, SHOULDER);
    }
  }
  if (trousers && view !== 'side') {
    const seams: [number, number][] = front
      ? [
          [16, HIPS],
          [16, HIPS + 1],
          [hipL + 1, HIPS],
          [hipL + 2, HIPS + 1],
          [hipR - 1, HIPS],
          [hipR - 2, HIPS + 1],
        ]
      : [hipL + 1, hipL + 2, hipL + 3, hipR - 3, hipR - 2, hipR - 1].map((x) => [x, HIPS + 1]);
    for (const [x, y] of seams) fold(x, y);
  }
  // A knee two rows tall, stepping in from the outside of each leg.
  const knees = new Set(
    trousers && cut === 'jeans' ? m.legs.flatMap(([x]) => [`${x + 1},40`, `${x + 2},41`]) : [],
  );
  return rows.map((line, y) =>
    [...line]
      .map((ch, x) => {
        if (ch !== 'm') return ch;
        if (folds.has(`${x},${y}`)) return 'M';
        return front && knees.has(`${x},${y}`) && body[y]?.[x] === 'l' ? 'L' : ch;
      })
      .join(''),
  );
}

const NECKLACES: readonly CutId[] = ['chainPendant', 'pearls'];

const GLASSES: readonly CutId[] = ['roundGlasses', 'catEyeGlasses', 'squareGlasses'];

function cutRows(cut: CutId, art: OutfitArt, view: View, body: Grid): string[] {
  const front = view === 'front';
  const m = measureOf(body);
  switch (cut) {
    case 'tee':
    case 'jersey':
    case 'threeQuarterTee': {
      const sleeve = cut === 'threeQuarterTee' ? 'ae' : 'a';
      let rows = paint(body, (k, r, c) => {
        if (k === 'b' || sleeve.includes(k)) {
          if (cut === 'threeQuarterTee' && k === 'e' && cuffOf(body, r, c, 'wA')) return 'M';
          return 'm';
        }
        // The jersey's sleeves are a stripe longer, in its stripes.
        if (cut === 'jersey' && k === 'e' && cuffOf(body, r, c, 'a')) {
          return (r + c) % 2 ? 'y' : 'x';
        }
        return null;
      });
      // A print ends at the hem, however tall it is, below where a pendant hangs.
      if (front && art.print) {
        rows = stamp(rows, art.print, HEM + 1 - art.print.length, centred(art.print));
      }
      if (view === 'back' && art.backPrint) {
        rows = stamp(rows, art.backPrint, SHOULDER + 2, centred(art.backPrint));
      }
      return rows;
    }
    case 'sundress': {
      const straps =
        view === 'side' ? [m.front - 2] : [m.left + 1, m.left + 2, m.right - 2, m.right - 1];
      let rows = paint(body, (k, r, c) => {
        if (k !== 'b') return null;
        // A scooped neck: straps only, for the top four rows of her, room for her rose.
        if (r <= SHOULDER + (front ? 3 : 2) && !(view === 'back' && r > SHOULDER)) {
          return straps.includes(c) ? 'm' : null;
        }
        return 'm';
      });
      if (front && art.print) {
        rows = stamp(rows, art.print, HEM - art.print.length, centred(art.print));
      }
      rows = stamp(rows, skirt(body, view, 8, 3, false), 0);
      if (front && art.skirtPrint) {
        rows = stamp(rows, art.skirtPrint, HIPS + 2, centred(art.skirtPrint));
      }
      return rows;
    }
    case 'collarDress': {
      // A Peter Pan collar round her neck.
      const [neckL, neckR] = m.neck;
      const collar =
        view === 'side'
          ? [neckR - 1, neckR, neckR + 1]
          : front
            ? [neckL - 2, neckL - 1, neckR + 1, neckR + 2]
            : null;
      const rows = paint(body, (k, r, c) => {
        if (k === 'b') {
          const peter = r === SHOULDER && (collar === null || collar.includes(c));
          return peter || (r === SHOULDER + 1 && collar?.includes(c)) ? 'x' : 'm';
        }
        if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'x' : 'm';
        return null;
      });
      return stamp(rows, skirt(body, view, 8, 3, false), 0);
    }
    case 'jeans':
      return paint(body, (k, r, c) => {
        if (k === 'p') return 'm';
        if (k === 'l') return aboveFoot(body, r, c) === 1 ? 'M' : 'm';
        return null;
      });
    case 'cutoffs':
      return paint(body, (k, r) => {
        if (k === 'p') return 'm';
        if (k === 'l' && r <= HIPS + 5) return r === HIPS + 5 ? 'x' : 'm';
        return null;
      });
    case 'pleatedSkirt':
      return skirt(body, view, 7, 2, true);
    case 'sneakers':
      return paint(body, (k, r, c) => {
        if (k === 'f') return 'm';
        if (underFoot(body, r, c)) return 'x';
        const up = k === 'l' ? aboveFoot(body, r, c) : Infinity;
        return up === 1 ? 'm' : up === 2 ? 'x' : null;
      });
    case 'boots':
      return paint(body, (k, r, c) => {
        if (k === 'f') return 'm';
        const up = k === 'l' ? aboveFoot(body, r, c) : Infinity;
        return up <= 4 ? 'm' : up === 5 ? 'M' : null;
      });
    case 'maryJanes':
      return paint(body, (k, r, c) => {
        if (k === 'f') return r > 0 && body[r - 1]?.[c] === 'l' ? 'M' : 'm';
        return k === 'l' && aboveFoot(body, r, c) <= 2 ? 'x' : null;
      });
    case 'heels':
      return paint(body, (k, r, c) => {
        if (k === 'f') return 'm';
        return underHeel(body, view, r, c) ? 'M' : null;
      });
    case 'platforms':
      return paint(body, (k, r, c) => {
        if (k === 'f') return 'm';
        if (underFoot(body, r, c)) return 'x';
        return k === 'l' && aboveFoot(body, r, c) === 1 ? 'M' : null;
      });
    case 'flats':
      // A little bow on each: on the toe from the side, and on the inside of each foot from the front.
      return paint(body, (k, r, c) => {
        if (k !== 'f') return null;
        if (view === 'side') return footEnd(body, r, c) === 'toe' ? 'x' : 'm';
        return front && (c === m.legs[0][1] - 1 || c === m.legs[1][0] + 1) ? 'x' : 'm';
      });
    case 'tallBoots':
      return paint(body, (k, r, c) => {
        if (k === 'f') return 'm';
        if (underHeel(body, view, r, c)) return 'M';
        const up = k === 'l' ? aboveFoot(body, r, c) : Infinity;
        return up <= 7 ? 'm' : up === 8 ? 'M' : null;
      });
    case 'sandals':
      // Straps with her toes showing between them, a thin sole, and a shining ankle strap.
      return paint(body, (k, r, c) => {
        if (k === 'f') return (r + c) % 2 === 0 ? 'm' : null;
        if (underFoot(body, r, c)) return 'M';
        return k === 'l' && aboveFoot(body, r, c) === 1 ? 'x' : null;
      });
    case 'beanie':
    case 'witchHat':
    case 'catEars':
    case 'flowerCrown':
    case 'sunHat':
    case 'explorerHat':
    case 'antennae':
    case 'topHat':
    case 'mane':
      return HATS[cut]!(view).rows;
    case 'chainPendant':
    case 'pearls': {
      if (view === 'back') return [...EMPTY];
      const pearls = cut === 'pearls';
      if (view === 'side') {
        const chain = pearls ? ['.......m...', '........Lm.'] : ['.......m...', '........m..'];
        const rows = stamp(EMPTY, chain, SHOULDER, 11);
        return pearls ? rows : stamp(rows, ['m', 'M'], SHOULDER + 2, 19);
      }
      const chain = pearls ? ['...m....m...', '....LmLm....'] : ['...m....m...', '....m..m....'];
      const rows = stamp(EMPTY, chain, SHOULDER, 10);
      if (!art.pendant) return rows;
      return stamp(rows, art.pendant, SHOULDER + 2, centred(art.pendant));
    }
    case 'roundGlasses':
    case 'catEyeGlasses':
    case 'squareGlasses':
      return glassesRows(cut, view);
    case 'jacket': {
      // A ringmaster's: gold cuffs and buttons, and dark lapels down the front.
      const lapels = [14, 15, 16, 17];
      const buttons = [SHOULDER + 3, SHOULDER + 5, SHOULDER + 7];
      return paint(body, (k, r, c) => {
        if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'x' : 'm';
        if (k !== 'b') return null;
        if (!front) return 'm';
        if (lapels.includes(c) && r <= SHOULDER + 3 + Math.abs(c - 15.5)) return 'y';
        return (c === 12 || c === 19) && buttons.includes(r) ? 'x' : 'm';
      });
    }
    case 'turtleneck':
      // Long sleeves, and a folded collar up her neck.
      return paint(body, (k, r, c) => {
        if (k === 'n') return 'M';
        if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'M' : 'm';
        return k === 'b' ? 'm' : null;
      });
    case 'wings':
      return stamp(
        paint(body, (k) => (k === 'b' ? 'm' : null)),
        skirt(body, view, 6, 2, false),
        0,
      );
    case 'hoodie':
      return hoodieRows(body, view, art);
    case 'cardigan':
      return cardiganRows(body, view);
    case 'bigTee':
      return bigTeeRows(body);
    case 'longTee':
      return paint(body, (k, r, c) => {
        if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'M' : 'm';
        return k === 'b' ? 'm' : null;
      });
    case 'leggings':
      return paint(body, (k) => ('pl'.includes(k) ? 'm' : null));
    case 'joggers':
      // Cuffed at the ankle, with a drawstring's two ends at the front of the waist.
      return paint(body, (k, r, c) => {
        if (k === 'p') return front && r <= HIPS + 1 && (c === 14 || c === 17) ? 'x' : 'm';
        if (k === 'l') return aboveFoot(body, r, c) <= 2 ? 'M' : 'm';
        return null;
      });
    case 'sweats':
      return sweatsRows(body, front);
    case 'overalls':
      return overallRows(body, view);
    case 'skaterSkirt': {
      // Short and flared, a band at the waist and a soft fold here and there.
      const flared = skirt(body, view, 6, 3.5, false);
      return flared.map((line, y) =>
        [...line]
          .map((ch, x) => {
            if (ch !== 'm') return ch;
            if (y === HIPS) return 'M';
            return y > HIPS + 2 && x % 5 === 1 ? 'M' : ch;
          })
          .join(''),
      );
    }
    case 'wellies':
      // Up the shin, a rolled rim at the top and a thick sole.
      return paint(body, (k, r, c) => {
        if (k === 'f') return 'm';
        if (underFoot(body, r, c)) return 'M';
        const up = k === 'l' ? aboveFoot(body, r, c) : Infinity;
        return up <= 5 ? 'm' : up === 6 ? 'M' : null;
      });
    case 'gloves':
      // Her hands, and a frill at the wrist.
      return paint(body, (k, r, c) => {
        if (k === 'A') return 'm';
        return k === 'w' && cuffOf(body, r, c, 'A') ? 'x' : null;
      });
    case 'pomBeanie':
    case 'hairBow':
    case 'tiara':
    case 'helmet':
    case 'horns':
    case 'farmHat':
      return HATS[cut]!(view).rows;
    case 'corset':
      return corsetRows(body, view);
    case 'gown': {
      // Its skirt to the floor, sparkling here and there like the sky at midnight.
      const sky = skirt(body, view, 12, 6, false).map((line, y) =>
        [...line]
          .map((ch, x) => (ch === 'm' && (x * x * 3 + y * 7 + x * y) % 13 === 0 ? 'x' : ch))
          .join(''),
      );
      return stamp(corsetRows(body, view), sky, 0);
    }
    case 'tulleSkirt':
      return tulleRows(body, view);
    case 'fishnets':
      // A net of little diamonds over her legs and feet, her skin showing through.
      return paint(body, (k, r, c) =>
        'plf'.includes(k) && ((r + c) % 4 === 0 || (r - c + DOLL_WIDTH) % 4 === 0) ? 'M' : null,
      );
    case 'tights':
      return paint(body, (k) => ('plf'.includes(k) ? 'm' : null));
    case 'moto':
    case 'denimJacket':
    case 'operaCoat':
      return jacketRows(cut, body, view);
    case 'velvetDress':
      return velvetRows(body, view);
    case 'spacesuit':
      return spacesuitRows(body, view);
    case 'wraps':
      // Bandages round and round her, a line where each turn lies over the last.
      return paint(body, (k, r, c) =>
        'nbpaewl'.includes(k) ? ((r + Math.floor(c / 3)) % 3 ? 'm' : 'M') : null,
      );
    case 'platformBoots':
      // Laced up the shin, on soles two pixels thick.
      return paint(body, (k, r, c) => {
        if (k === 'f') return body[r + 1]?.[c] === 'o' ? 'y' : 'm';
        if (underFoot(body, r, c)) return 'y';
        const up = k === 'l' ? aboveFoot(body, r, c) : Infinity;
        if (up > 6) return null;
        if (up === 6) return 'M';
        const laces = c === m.legs[0][0] + 2 || c === m.legs[1][1] - 2;
        return front && laces && up % 2 === 0 ? 'x' : 'm';
      });
    case 'cape':
      return capeRows(body, view, 'on');
    case 'batWings':
      // All of them is on her back (`backRows`).
      return [...EMPTY];
  }
}

/** Jackets worn open over her top, in the `outer` slot: their sleeves come up with her arms. */
export const JACKETS: readonly CutId[] = ['moto', 'denimJacket', 'operaCoat'];

/**
 * Whether an outline pixel is where her side meets the air, so something loose can hang out over
 * it: never on a line across her, and never beside her hand.
 */
function besideHer(body: Grid, r: number, c: number, covered: string): boolean {
  if (body[r]?.[c] !== 'o') return false;
  const sides = [body[r]?.[c - 1] ?? CLEAR, body[r]?.[c + 1] ?? CLEAR];
  return sides.some((k) => covered.includes(k)) && sides.includes(CLEAR) && !sides.includes('A');
}

/**
 * A corset (0.2's W3), and a ball gown's bodice: from a sweetheart neckline edged in lace, laced
 * up the front (and the back), with boning down it and a point over her hips. Her arms are bare.
 */
function corsetRows(body: Grid, view: View): string[] {
  const front = view === 'front';
  const laced = view !== 'side';
  const m = measureOf(body);
  const boning = laced ? [m.left + 2, m.right - 2] : [m.back + 3, m.front - 2];
  return paint(body, (k, r, c) => {
    if (k === 'p')
      return laced && r <= HIPS + 1 && Math.abs(c + 0.5 - 16) < HIPS + 2 - r ? 'm' : null;
    if (k !== 'b' || r === SHOULDER) return null;
    const middle = c === 15 || c === 16;
    if (r === SHOULDER + 1) return front && middle ? null : 'x';
    if (front && r === SHOULDER + 2 && middle) return 'x';
    if (laced && middle) return (r + c) % 2 === 0 ? 'x' : 'M';
    if (boning.includes(c)) return 'M';
    return 'm';
  });
}

/**
 * A tulle skirt (0.2's W3): full and wide, gathered at a band, a scallop of light along each
 * layer, and a hem as soft and uneven as tulle is.
 */
function tulleRows(body: Grid, view: View): string[] {
  const rows = 8;
  return skirt(body, view, rows, 5, false).map((line, y) =>
    [...line]
      .map((ch, x) => {
        if (ch !== 'm') return ch;
        if (y === HIPS) return 'M';
        if (y === HIPS + rows - 1 && x % 2 === 1) return CLEAR;
        return (y - HIPS) % 3 === 0 && x % 2 === 0 ? 'L' : ch;
      })
      .join(''),
  );
}

/**
 * A jacket worn open over whatever she has on (0.2's W3), its own layer: long sleeves, and from
 * the front two panels either side of her top. The moto is cropped at her waist, with studded
 * lapels and a silver zip down one edge; the denim jacket has a collar, chest pockets and brass
 * buttons; the opera coat runs on past her knees, flaring and opening as it goes, with gold buttons.
 */
function jacketRows(cut: CutId, body: Grid, view: View): string[] {
  const front = view === 'front';
  const coat = cut === 'operaCoat';
  const open = (r: number, c: number) => {
    if (view === 'back') return false;
    if (view === 'side') return c >= measureOf(body).front - 1;
    const spread = r > HIPS ? Math.floor((r - HIPS) / 3) : 0;
    return c >= 14 - spread && c <= 17 + spread;
  };
  const jacket = paint(body, (k, r, c) => {
    if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'M' : 'm';
    if (k === 'p' && coat) return open(r, c) ? null : 'm';
    if (k !== 'b' || open(r, c)) return null;
    if (!front) return view === 'back' && coat && c === 16 && r > SHOULDER + 2 ? 'M' : 'm';
    const edge = c === 13 || c === 18;
    const lapel = r <= SHOULDER + 2 && c >= 12 && c <= 19;
    if (cut === 'moto') {
      if (lapel) return r === SHOULDER && (c === 12 || c === 19) ? 'x' : 'M';
      if (c === 13) return 'x';
      if (r === HEM) return 'M';
    } else if (cut === 'denimJacket') {
      if (r === SHOULDER && (c <= 13 || c >= 18)) return 'M';
      if (r === SHOULDER + 2 && (c === 11 || c === 12 || c === 19 || c === 20)) return 'M';
      if (edge && (r - SHOULDER) % 3 === 2) return 'x';
      if (r === HEM) return 'M';
    } else {
      if (lapel && r <= SHOULDER + 1) return 'M';
      if (c === 13 && r > SHOULDER && (r - SHOULDER) % 3 === 0) return 'x';
    }
    return edge ? 'M' : 'm';
  });
  if (!coat) return jacket;
  const skirts = skirt(body, view, 10, 3, false).map((line, y) =>
    [...line]
      .map((ch, x) => {
        if (ch === CLEAR) return ch;
        if (open(y, x)) return CLEAR;
        return view === 'back' && (x === 15 || x === 16) && y > HIPS + 4 ? 'M' : ch;
      })
      .join(''),
  );
  return stamp(skirts, jacket, 0);
}

/**
 * A velvet dress (0.2's W3): long sleeves, a square neck, and a long skirt, with the deep sheen
 * velvet has wherever it folds.
 */
function velvetRows(body: Grid, view: View): string[] {
  const front = view === 'front';
  const [neckL, neckR] = measureOf(body).neck;
  const bodice = paint(body, (k, r, c) => {
    if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'M' : 'm';
    if (k !== 'b') return null;
    if (front && r === SHOULDER && c >= neckL - 1 && c <= neckR + 1) return null;
    return front && c === neckL - 1 && r > SHOULDER + 1 ? 'L' : 'm';
  });
  const long = skirt(body, view, 10, 3, false).map((line, y) =>
    [...line].map((ch, x) => (ch === 'm' && y > HIPS + 1 && x % 4 === 1 ? 'L' : ch)).join(''),
  );
  return stamp(bodice, long, 0);
}

/** The spaceman suit's chest: a panel of switches, two of them lit. */
const CONTROLS: Grid = ['yyyyyy', 'yxyLyy', 'yyyyxy'];

/**
 * A spaceman suit (0.2's W3): all of her but her head and hands, puffed out a pixel all round
 * like her comfy shirt, with rings at her neck, wrists and ankles, a belt, moon boots, and a panel
 * of lights on her chest.
 */
function spacesuitRows(body: Grid, view: View): string[] {
  const rows = paint(body, (k, r, c) => {
    if (k === 'n') return 'M';
    if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'M' : 'm';
    if (k === 'b' || k === 'f') return 'm';
    if (k === 'p') return r === HIPS ? 'M' : 'm';
    if (k === 'l') return aboveFoot(body, r, c) === 1 ? 'M' : 'm';
    return r > SHOULDER && besideHer(body, r, c, 'bpaewl') ? 'm' : null;
  });
  return view === 'front' ? stamp(rows, CONTROLS, SHOULDER + 2, centred(CONTROLS)) : rows;
}

/**
 * A hoodie (0.2's W2): long sleeves with ribbed cuffs, a ribbed band at her hips, and from the
 * front its hood gathered round her neck, two drawstrings and the pocket across her tummy; from
 * behind, the hood lies between her shoulder blades.
 */
function hoodieRows(body: Grid, view: View, art: OutfitArt): string[] {
  const front = view === 'front';
  const m = measureOf(body);
  // The hood gathered round her neck, its drawstrings either side of it.
  const [hoodL, hoodR] = [m.neck[0] - 2, m.neck[1] + 2];
  const [pocketL, pocketR] = [m.left + 2, m.right - 2];
  const rows = paint(body, (k, r, c) => {
    if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'M' : 'm';
    if (k === 'p') return r === HIPS ? 'M' : null;
    if (k === 'n') return view === 'back' ? 'm' : null;
    if (k !== 'b') return null;
    if (front) {
      if (r === SHOULDER && (c <= hoodL || c >= hoodR)) return 'M';
      if ((c === hoodL + 1 || c === hoodR - 1) && r > SHOULDER && r <= SHOULDER + 4) return 'x';
      if (r === HEM - 3 && c >= pocketL && c <= pocketR) return 'M';
      if ((c === pocketL || c === pocketR) && r > HEM - 3) return 'M';
    }
    if (view === 'back') {
      if (r <= SHOULDER + 4 && (c === hoodL || c === hoodR)) return 'M';
      if (r === SHOULDER + 5 && c > hoodL && c < hoodR) return 'M';
    }
    if (view === 'side' && c === m.back + 1 && r <= SHOULDER + 3) return 'M';
    return 'm';
  });
  // A band hoodie's print goes on its pocket, below where a pendant hangs.
  if (!front || !art.print) return rows;
  return stamp(rows, art.print, HEM + 1 - art.print.length, centred(art.print));
}

/**
 * A cardigan (0.2's W2), worn open: long sleeves and a hem down over her hips, and from the front
 * the vest under it showing between its edges, with moth buttons down one of them.
 */
function cardiganRows(body: Grid, view: View): string[] {
  const buttons = [SHOULDER + 3, SHOULDER + 6];
  return paint(body, (k, r, c) => {
    if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'M' : 'm';
    const open = view === 'front' && c >= 14 && c <= 17;
    if (k === 'p') return r > HIPS + 1 || open ? null : r === HIPS + 1 ? 'M' : 'm';
    if (k !== 'b') return null;
    if (view === 'front') {
      if (open || (r === SHOULDER && (c === 13 || c === 18))) return 'x';
      if (c === 13 && buttons.includes(r)) return 'y';
      if (c === 13 || c === 18) return 'M';
    }
    if (view === 'side' && c === measureOf(body).front) return 'M';
    return 'm';
  });
}

/**
 * Her comfy shirt (0.2's W2, question 34): long sleeves, a hem down over her hips, and a size too
 * big, so it hangs a pixel out past her all down her sides and arms.
 */
function bigTeeRows(body: Grid): string[] {
  const covered = 'bpaew';
  return paint(body, (k, r, c) => {
    if ('aew'.includes(k)) return k === 'w' && cuffOf(body, r, c, 'A') ? 'M' : 'm';
    if (k === 'b') return 'm';
    if (k === 'p') return r <= HIPS + 1 ? 'm' : null;
    return r > SHOULDER && r <= HIPS + 1 && besideHer(body, r, c, covered) ? 'm' : null;
  });
}

/**
 * Her big sweatpants (0.2's W2, question 70): a size too big, so each leg hangs a pixel out past
 * her outside edge until the cuffs gather them in at the ankle, with a drawstring at the waist.
 */
function sweatsRows(body: Grid, front: boolean): string[] {
  return paint(body, (k, r, c) => {
    if (k === 'p') return front && r <= HIPS + 1 && (c === 14 || c === 17) ? 'x' : 'm';
    if (k === 'l') return aboveFoot(body, r, c) <= 2 ? 'M' : 'm';
    if (k !== 'o') return null;
    const sides = [body[r]?.[c - 1] ?? CLEAR, body[r]?.[c + 1] ?? CLEAR];
    if (!sides.includes('l') || !sides.includes(CLEAR)) return null;
    const leg = sides[0] === 'l' ? c - 1 : c + 1;
    return aboveFoot(body, r, leg) > 2 ? 'm' : null;
  });
}

/**
 * Overalls (0.2's W2): trousers to her ankles, and over her top a bib with a pocket and two
 * buttons, held up by straps; from behind the straps cross between her shoulder blades.
 */
function overallRows(body: Grid, view: View): string[] {
  const bibTop = SHOULDER + 4;
  const m = measureOf(body);
  // The bib and its straps two in from her sides; from the side, from her front back.
  const [bibL, bibR] = [m.left + 2, m.right - 2];
  const strap = m.front - 2;
  return paint(body, (k, r, c) => {
    if (k === 'p') return 'm';
    if (k === 'l') return aboveFoot(body, r, c) === 1 ? 'M' : 'm';
    if (k !== 'b') return null;
    if (view === 'front') {
      if (r >= bibTop && c >= bibL && c <= bibR) {
        if (r === bibTop && (c === bibL || c === bibR)) return 'x';
        return r === bibTop + 2 && c >= 14 && c <= 17 ? 'M' : 'm';
      }
      return c === bibL || c === bibR ? 'm' : null;
    }
    if (view === 'back') {
      if (r >= HEM - 1) return c >= bibL && c <= bibR ? 'm' : null;
      const t = (r - SHOULDER) / (HEM - 1 - SHOULDER);
      return c === Math.round(bibL + (bibR - bibL) * t) ||
        c === Math.round(bibR - (bibR - bibL) * t)
        ? 'm'
        : null;
    }
    if (r >= bibTop && c >= strap - 2) return r === bibTop && c === strap ? 'x' : 'm';
    return c === strap ? 'm' : null;
  });
}
