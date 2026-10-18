import { describe, expect, it } from 'vitest';
import {
  FONDNESS,
  GROWN_PATS,
  JOBS,
  LEVEL_AT,
  PET_RESTS,
  REST_LIKES,
  TREAT_LINES,
  TRICKS,
  type FondKind,
} from '../../src/data/affection';
import { FURNITURE } from '../../src/data/furniture';
import { PET_IDS, PETS } from '../../src/data/pets';
import { fonder, levelOf, patLineAt, progressOf } from '../../src/systems/affection';
import { restSpots } from '../../src/systems/petRest';
import {
  barkTarget,
  drawTarget,
  fetchable,
  FETCH_REACH,
  sniffGoal,
  SNIFF_FAR,
  type FoundCritter,
} from '../../src/systems/pets';

const open = () => true;
const critter = (key: string, tx: number, ty: number, shy: boolean, orb = false): FoundCritter => ({
  key,
  tx,
  ty,
  shy,
  orb,
});

describe('fondness, by the rule', () => {
  it('counts each kind only so far a day, and starts again the next', () => {
    let fond = undefined;
    let total = 0;
    for (const kind of ['pat', 'walk', 'treat'] as FondKind[]) {
      for (let i = 0; i < 10; i++) {
        const next = fonder(fond, kind, '2026-10-18');
        fond = next.fondness;
        total += next.gained;
      }
    }
    const most = FONDNESS.pat.perDay + FONDNESS.walk.perDay + FONDNESS.treat.perDay;
    expect(total).toBe(most);
    expect(fond!.points).toBe(most);
    expect(fonder(fond, 'pat', '2026-10-18').gained).toBe(0);
    expect(fonder(fond, 'pat', '2026-10-19').gained).toBe(FONDNESS.pat.points);
  });

  it('reaches the first level in a few days of care, and the second in a week or so of everything', () => {
    const most = FONDNESS.pat.perDay + FONDNESS.walk.perDay + FONDNESS.treat.perDay;
    expect(Math.ceil(LEVEL_AT[1] / most)).toBeGreaterThanOrEqual(2);
    expect(Math.ceil(LEVEL_AT[2] / most)).toBeLessThanOrEqual(7);
    // A pat a day alone gets there too, in time: nothing is out of reach.
    expect(Math.ceil(LEVEL_AT[2] / FONDNESS.pat.perDay)).toBeLessThanOrEqual(31);
    expect(levelOf(0)).toBe(0);
    expect(levelOf(LEVEL_AT[1])).toBe(1);
    expect(levelOf(LEVEL_AT[2] + 500)).toBe(2);
    expect(progressOf(LEVEL_AT[1] + 4)).toEqual({ into: 4, span: LEVEL_AT[2] - LEVEL_AT[1] });
    expect(progressOf(LEVEL_AT[2])).toBeNull();
  });

  it('gives each pet three more pat lines a level, said newest first', () => {
    for (const id of PET_IDS) {
      for (const band of GROWN_PATS[id]) expect(band, id).toHaveLength(3);
      const all = new Set([...PETS[id].pats, ...GROWN_PATS[id].flat()]);
      expect(all.size, id).toBe(9);
      expect(patLineAt(id, 'X', 0, 0)).toBe(PETS[id].pats[0]!.replaceAll('{name}', 'X'));
      expect(patLineAt(id, 'X', 0, 2)).toBe(GROWN_PATS[id][1][0]!.replaceAll('{name}', 'X'));
      const heard = new Set(Array.from({ length: 9 }, (_, i) => patLineAt(id, 'X', i, 2)));
      expect(heard.size, id).toBe(9);
    }
  });

  it('has a trick, a job, a treat line and somewhere to rest for each, in their own words', () => {
    for (const id of PET_IDS) {
      expect(TRICKS[id].line, id).toContain('{name}');
      expect(TRICKS[id].ms, id).toBeGreaterThan(800);
      expect(TREAT_LINES[id], id).toContain('{treat}');
      expect(JOBS[id].does.length, id).toBeGreaterThan(10);
      expect(REST_LIKES[id].length, id).toBeGreaterThan(0);
    }
    for (const id of Object.keys(PET_RESTS) as (keyof typeof PET_RESTS)[]) {
      expect(FURNITURE[id], id).toBeDefined();
      expect(FURNITURE[id].layer === 'rug', id).toBe(PET_RESTS[id]!.kind === 'rug');
    }
  });
});

describe('jobs, by the rule', () => {
  it('Fibi sits beside the mound when near, and leads on its trail when further', () => {
    const near = sniffGoal({ tx: 10, ty: 10 }, { tx: 13, ty: 10 }, open)!;
    expect(near.by).toBe(true);
    expect(Math.max(Math.abs(near.goal.tx - 13), Math.abs(near.goal.ty - 10))).toBe(1);
    const far = sniffGoal({ tx: 10, ty: 10 }, { tx: 20, ty: 10 }, open)!;
    expect(far.by).toBe(false);
    expect(far.goal).toEqual({ tx: 12, ty: 10 });
    expect(sniffGoal({ tx: 0, ty: 0 }, { tx: SNIFF_FAR + 1, ty: 0 }, open)).toBeNull();
  });

  it('Dolly barks at the nearest shy critter in reach she has not barked at', () => {
    const her = { tx: 5, ty: 5 };
    const out = [critter('a', 9, 5, true), critter('b', 7, 5, true), critter('c', 6, 5, false)];
    expect(barkTarget(her, out, () => false)?.key).toBe('b');
    expect(barkTarget(her, out, (k) => k === 'b')?.key).toBe('a');
    expect(barkTarget(her, out, () => true)).toBeNull();
  });

  it('Elvira draws an orb a tile nearer, never onto her', () => {
    const her = { tx: 5, ty: 5 };
    const drawn = drawTarget(her, [critter('o', 9, 5, false, true)], () => false, open)!;
    expect(drawn).toEqual({ key: 'o', to: { tx: 8, ty: 5 } });
    expect(drawTarget(her, [critter('o', 6, 5, false, true)], () => false, open)).toBeNull();
    expect(drawTarget(her, [critter('m', 8, 5, true)], () => false, open)).toBeNull();
  });

  it('Wybie fetches only what lies near enough', () => {
    expect(fetchable({ tx: 0, ty: 0 }, { tx: FETCH_REACH, ty: 2 })).toBe(true);
    expect(fetchable({ tx: 0, ty: 0 }, { tx: FETCH_REACH + 1, ty: 0 })).toBe(false);
    expect(fetchable({ tx: 0, ty: 0 }, null)).toBe(false);
  });
});

describe('resting spots', () => {
  it('put each where it likes best, by the fire with its back to her, one to a tile', () => {
    const placed = [
      { id: 'stoneHearth' as const, tx: 2, ty: 1, turn: 0 },
      { id: 'batBed' as const, tx: 6, ty: 1, turn: 0 },
      { id: 'moonRug' as const, tx: 2, ty: 5, turn: 0 },
    ];
    const solid = new Set(['2,1', '3,1', '6,1', '7,1', '6,2', '7,2']);
    const spots = restSpots(placed, (tx, ty) => !solid.has(`${tx},${ty}`));
    expect(spots.get('florence')).toMatchObject({ kind: 'hearth', looks: 'back', perch: null });
    expect(spots.get('wybie')).toMatchObject({ kind: 'bed', looks: 'front' });
    expect(spots.get('wybie')!.perch!.tile.ty).toBe(2);
    expect(spots.get('fibi')?.kind).toBe('rug');
    const held = [...spots.values()].map((s) => JSON.stringify(s.perch?.tile ?? s.floor));
    expect(new Set(held).size).toBe(held.length);
    expect(restSpots([], open).size).toBe(0);
  });
});
