import { OUTFITS } from '../../data/outfits';
import type { CutId } from '../../types/ids';
import type { Worn } from '../../types/look';
import { CLEAR, Sketch } from '../sketch';
import {
  DOLL_HEIGHT,
  DOLL_WIDTH,
  EMPTY,
  type Grid,
  HIPS,
  measureOf,
  REGULAR_MEASURE,
  SHOULDER,
  type View,
} from './body';
import { finish, remember } from './paint';
import { OUTFIT_ART, withPattern } from './prints';

/*
 * What she wears on her back (0.3's A2, decision 221): the cape and the wings, behind all of her
 * or over all of her but her hat.
 */

/**
 * A butterfly's wings (0.2's J2), worn on the back of a dress with a short flared skirt: an upper
 * and a lower wing each side, veined, with white dots at their edges. From the side they're one
 * pair behind her back. The wings are a layer of their own (`backRows`), the dress `pieceRows`.
 */
function butterflyRows(view: View, body: Grid): string[] {
  const wings = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const { out, back } = broader(body);
  const pair = (x: number, lean: number, wide = 5.5) => {
    wings.ellipse(x, 24, wide, 9, 'm').ellipse(x + lean, 36, 4, 4.5, 'm');
    for (let i = 0; i < 7; i++) wings.set(x + Math.round((i - 3) * 0.5 * lean), 19 + i * 3, 'y');
    for (const [dx, y] of [
      [-1, 16],
      [2, 17],
      [-3, 20],
      [3, 23],
      [-3, 27],
    ] as const) {
      wings.set(x + dx * lean, y, 'x');
    }
    wings.set(x - 2 * lean, 39, 'x');
  };
  if (view === 'side') pair(7 - back, 1);
  else if (view === 'front') {
    pair(4 - out, 1);
    pair(27 + out, -1);
  } else {
    // From behind, as wide, but reaching in to meet down her spine, where they're sewn on.
    pair(7 - out, 1, 7);
    pair(24 + out, -1, 7);
    wings.rect(15, 17, 2, 21, 'y');
  }
  return wings.rows;
}

/**
 * How much broader a body is than hers (1.1's A5a): each side from the front and behind, and at
 * the back from the side, so what hangs round her hangs round a stout body as far out.
 */
function broader(body: Grid): { out: number; back: number } {
  const m = measureOf(body);
  return { out: m.spread, back: REGULAR_MEASURE.back - m.back };
}

/**
 * Where each part of what she wears on her back is drawn (0.3's A2): `behind` all of her, before
 * her skin, so her body, skirts and hair cover it; `on` in the piece's own place among her
 * clothes; `over` all of her but her hat, after her hair.
 */
type Part = 'behind' | 'on' | 'over';

/** How high the points of the cape's collar stand, beside her head. */
const COLLAR_TIP = 8;

/**
 * A vampire's cape (0.2's W3), hung from her shoulders and flaring to her ankles, its high collar
 * standing up round her head with her hair tucked inside it. From the front it is all behind her
 * (the collar's points beside her head, wide of every style, its maroon lining where it turns in
 * beside her) but where it lies over her shoulders; from the side it falls behind her, over her
 * hair down to her hips and under her skirt below them; from behind it covers all of her but the
 * top of her head.
 */
export function capeRows(body: Grid, view: View, part: Part): string[] {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const cx = view === 'side' ? 13 : 16;
  const { out, back: deeper } = broader(body);
  for (let y = SHOULDER; y <= 44; y++) {
    const below = y - SHOULDER;
    // From behind it falls from her shoulders as wide as the collar, to cover all her hair.
    const half = (view === 'back' ? 12 + below * 0.3 : 10 + below * 0.45) + out;
    // From the side it falls straight down from the collar's back, flaring a little.
    const back = 10.5 + below * 0.15 + deeper;
    for (let x = 0; x < DOLL_WIDTH; x++) {
      const d = x + 0.5 - cx;
      if (view === 'side' ? d < -back || d > 1 : Math.abs(d) > half) continue;
      s.set(x, y, 'm');
    }
  }
  if (view === 'back') {
    if (part !== 'over') return [...EMPTY];
    // The collar from outside: a fan rising behind her neck to a point each side, its lining
    // showing along the top; and a seam down the middle of her back.
    for (let x = 0; x < DOLL_WIDTH; x++) {
      const d = Math.abs(x + 0.5 - 16);
      if (d > 12) continue;
      const top = Math.round(17 - (17 - COLLAR_TIP) * (d / 12) ** 1.5);
      for (let y = top; y < SHOULDER; y++) s.set(x, y, y === top ? 'y' : 'm');
    }
    for (let y = SHOULDER + 1; y < 44; y++) s.set(15, y, 'M');
    return s.rows;
  }
  if (view === 'front' && part === 'over') return [...EMPTY];
  // Each point of the collar, from its tip down to her shoulder, lined where it opens toward us.
  const collar = (tip: number, dir: 1 | -1) => {
    for (let y = COLLAR_TIP; y < SHOULDER; y++) {
      const wide = 2 + Math.floor((y - COLLAR_TIP) / 3);
      for (let k = 0; k < wide; k++) {
        s.set(tip + dir * k, y, k === 0 || y === COLLAR_TIP ? 'm' : 'y');
      }
    }
  };
  collar(view === 'side' ? 2 : 1, 1);
  if (view === 'front') collar(30, -1);
  const her = (x: number, y: number) => (body[y]?.[x] ?? CLEAR) !== CLEAR;
  return s.rows.map((line, y) =>
    [...line]
      .map((ch, x) => {
        if (ch === CLEAR) return ch;
        if (part === 'on') return y <= SHOULDER + 1 && body[y]?.[x] === 'a' ? 'm' : CLEAR;
        if (view === 'side' && (part === 'over') !== y < HIPS) return CLEAR;
        if (part === 'over') return her(x, y) ? CLEAR : ch;
        const turned = view === 'front' && y > SHOULDER + 1 && (her(x - 1, y) || her(x + 1, y));
        return turned ? 'y' : ch;
      })
      .join(''),
  );
}

/**
 * Little bat wings (0.2's W3), spreading from her back: a bony top edge rising to a tip, and a
 * scalloped edge underneath. They're behind her from the front and side, and over her from behind.
 */
function batWingRows(view: View, body: Grid): string[] {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const m = measureOf(body);
  const wing = (root: number, out: -1 | 1) => {
    for (let i = 0; i <= 10; i++) {
      const top = Math.round(28 - i * 0.8);
      const bottom = Math.round(35 - i * 0.4 - 2.5 * Math.abs(Math.sin((i * Math.PI) / 3.5)));
      for (let y = top; y <= bottom; y++) s.set(root + out * i, y, y === top ? 'M' : 'm');
    }
  };
  if (view === 'side') wing(m.back + 1, -1);
  else {
    wing(view === 'back' ? 15 : m.left, -1);
    wing(view === 'back' ? 16 : m.right, 1);
  }
  return s.rows;
}

/** What she wears on her back (0.3's A2): a cape or wings, or a dress with wings. */
export const BACKS: readonly CutId[] = ['cape', 'batWings', 'wings'];

/**
 * The part of a piece worn on her back that is drawn behind all of her or over all of her, or
 * null if it has none there: wings are behind her from the front and side and over her from
 * behind, and so is a cape, but for its shoulders (in `pieceRows`) and, from the side, its top
 * half, which goes over her hair to tuck it in.
 */
export function backRows(
  worn: Worn,
  view: View,
  body: Grid,
  part: 'behind' | 'over',
): readonly string[] | null {
  const cut = OUTFITS[worn.id].cut;
  if (!BACKS.includes(cut)) return null;
  const rows = remember(body, `${part}:${worn.id}:${view}`, () => {
    const wings = cut === 'wings' ? butterflyRows(view, body) : batWingRows(view, body);
    const drawn =
      cut === 'cape'
        ? capeRows(body, view, part)
        : (part === 'over') === (view === 'back')
          ? wings
          : [];
    if (!drawn.some((line) => /[^.]/.test(line))) return [];
    const done = finish(withPattern(drawn, OUTFIT_ART[worn.id].pattern), body, 'drawn');
    if (view !== 'side' || part !== 'over') return done;
    // The cape's top half from the side is round her, not over her: her own outline stays.
    return done.map((line, y) =>
      [...line].map((ch, x) => ((body[y]?.[x] ?? CLEAR) === CLEAR ? ch : CLEAR)).join(''),
    );
  });
  return rows.length === 0 ? null : rows;
}
