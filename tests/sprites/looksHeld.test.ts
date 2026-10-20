import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { idsOf, HAIR_STYLES, TATTOOS } from '../../src/data/looks';
import { DEFAULT_LOOK, OUTFITS } from '../../src/data/outfits';
import { VILLAGER_IDS, VILLAGERS } from '../../src/data/villagers';
import { WORK_IDS, WORKS } from '../../src/data/work';
import { BRACELET_BEADS } from '../../src/sprites/bracelets';
import {
  ACTION_BODY,
  ACTION_FRAMES,
  ACTION_POSES,
  BODY,
  DOLL_FRAMES,
  dollLayers,
  HAIR,
  hairRows,
  hangsOver,
  pieceRows,
  POSE_BODY,
  POSES,
  POUR_HAND,
  SWING_HAND,
  tattooRows,
  wristRows,
  type Grid,
  type View,
} from '../../src/sprites/doll';
import type { Layer } from '../../src/sprites/sprite';
import { figureLayers, pumpkinHead, type Figure, type Stance } from '../../src/sprites/villagers';
import { workPose } from '../../src/sprites/working';
import { wear } from '../../src/systems/wardrobe';
import type { BraceletId, Facing, OutfitId, Pose } from '../../src/types/ids';
import type { Look } from '../../src/types/look';
import { FEELINGS } from '../../src/types/mood';

/**
 * Her looks and her neighbours', held as hashes of their layers (1.1's A5a, decision 354): every
 * piece in every fabric, facing, frame, pose and action, every hairstyle, tattoo and bracelet, her
 * bodies and the parts painted on them; and every figure in every facing, frame, costume, stance,
 * job and feeling. Taken from the code before the second body came, so a body's build never moves
 * a pixel of hers. A figure given another build changes its own hashes and no one else's: rerun
 * this, never with `-u`, unless a change means to alter how someone looks, and then only theirs.
 */

const FACINGS: Facing[] = ['down', 'up', 'left', 'right'];
const VIEWS: View[] = ['front', 'back', 'side'];
const EVERYTHING = Object.keys(OUTFITS) as OutfitId[];
const BRACELETS = Object.keys(BRACELET_BEADS) as BraceletId[];

const hash = (thing: unknown) =>
  createHash('sha1').update(JSON.stringify(thing)).digest('hex').slice(0, 16);

const layered = (layers: readonly Layer[]) =>
  layers.map((l) => [l.source.rows, Object.entries(l.palette)]);

/** Her, every way she stands and moves, in one look. */
function everyWay(look: Look, full: boolean): unknown[] {
  const out: unknown[] = [];
  const at = (facing: Facing, frame: number, pose?: Pose, rest = {}) =>
    out.push(layered(dollLayers(look, facing, frame, pose, rest)));
  for (const facing of FACINGS) {
    for (let frame = 0; frame < DOLL_FRAMES; frame++) at(facing, frame);
  }
  if (!full) return out;
  for (const facing of FACINGS) {
    at(facing, 0, undefined, { out: true });
    at(facing, 0, undefined, { blink: true });
  }
  for (const pose of POSES) at('down', 0, pose);
  at('down', 0, 'sit');
  at('up', 0, 'sit');
  for (const pose of ACTION_POSES) {
    for (const facing of FACINGS) {
      for (let frame = 0; frame < ACTION_FRAMES[pose]; frame++) at(facing, frame, pose);
    }
  }
  for (const feel of FEELINGS) {
    at('down', 0, undefined, { feel });
    at('right', 0, undefined, { feel, blink: true });
  }
  return out;
}

/** Every body of hers: standing and walking, posed, and every action's. */
function bodies(): [string, Grid][] {
  const out: [string, Grid][] = [];
  for (const view of VIEWS) BODY[view].forEach((b, i) => out.push([`${view}:${i}`, b]));
  for (const pose of POSES) {
    out.push([`pose:${pose}`, POSE_BODY[pose].body]);
    const over = POSE_BODY[pose].over;
    if (over) out.push([`pose:${pose}:over`, over]);
  }
  for (const pose of ACTION_POSES) {
    for (const view of VIEWS) {
      ACTION_BODY[pose][view].forEach(({ body, over }, i) => {
        out.push([`${pose}:${view}:${i}`, body]);
        if (over) out.push([`${pose}:${view}:${i}:over`, over]);
      });
    }
  }
  return out;
}

describe("her looks, held as they were (1.1's A5a)", () => {
  it('keeps her bodies and where her hands are', () => {
    const held = Object.fromEntries(bodies().map(([name, body]) => [name, hash(body)]));
    expect({ ...held, hands: hash([POUR_HAND, SWING_HAND]) }).toMatchSnapshot();
  });

  it('paints every piece, hairstyle, tattoo and bracelet onto each of her bodies as it did', () => {
    const held: Record<string, string> = {};
    for (const [name, body] of bodies()) {
      const view: View = name.startsWith('side') || name.includes(':side:') ? 'side' : 'front';
      const views: View[] = view === 'side' ? ['side'] : ['front', 'back'];
      const facings: Facing[] = view === 'side' ? ['left', 'right'] : ['down', 'up'];
      held[name] = hash([
        views.map((v) => EVERYTHING.map((id) => pieceRows({ id, fabric: 'ink' }, v, body))),
        facings.map((f) => idsOf(HAIR_STYLES).map((s) => hairRows(HAIR[s], f, body))),
        facings.map((f) =>
          idsOf(TATTOOS).map((t) => [
            tattooRows(t, 'left', body, f),
            tattooRows(t, 'right', body, f),
          ]),
        ),
        facings.map((f) => wristRows(BRACELETS.slice(0, 3), body, f)),
      ]);
    }
    expect(held).toMatchSnapshot();
  }, 60_000);

  it('draws every piece in every fabric, and in every pose and action, as it did', () => {
    const held: Record<string, string> = {};
    for (const id of EVERYTHING) {
      const [first, ...rest] = OUTFITS[id].fabrics;
      held[id] = hash([
        everyWay(wear(DEFAULT_LOOK, id, EVERYTHING, first), true),
        ...rest.map((fabric) => everyWay(wear(DEFAULT_LOOK, id, EVERYTHING, fabric), false)),
      ]);
    }
    expect(held).toMatchSnapshot();
  }, 120_000);

  it('draws her hair, ink, bracelets and face every way, as it did', () => {
    const bare: Look = { ...DEFAULT_LOOK, gauges: false, tattoos: null, outfit: {} };
    const looks: Record<string, Look> = {
      default: DEFAULT_LOOK,
      bare,
      bracelets: { ...DEFAULT_LOOK, wrist: BRACELETS.slice(0, 3) },
      stripesLeft: { ...DEFAULT_LOOK, stripesArm: 'left' },
      freckled: { ...DEFAULT_LOOK, freckles: true, nosePiercing: true },
      ...Object.fromEntries(
        idsOf(HAIR_STYLES).map((hairStyle) => [
          `hair:${hairStyle}`,
          { ...DEFAULT_LOOK, hairStyle },
        ]),
      ),
      ...Object.fromEntries(
        idsOf(TATTOOS).map((tattoos) => [`tattoos:${tattoos}`, { ...DEFAULT_LOOK, tattoos }]),
      ),
    };
    const held = Object.fromEntries(
      Object.entries(looks).map(([name, look]) => [name, hash(everyWay(look, true))]),
    );
    expect(held).toMatchSnapshot();
  }, 60_000);

  it('dresses her in pieces together as it did: shoes under hems, backs over hair', () => {
    const held: Record<string, string> = {};
    const hems = EVERYTHING.filter((id) => hangsOver(OUTFITS[id].cut, 'front'));
    const shoes = EVERYTHING.filter((id) => OUTFITS[id].slot === 'shoes');
    for (const hem of hems) {
      const on = wear(DEFAULT_LOOK, hem, EVERYTHING);
      held[`hem:${hem}`] = hash(shoes.map((s) => everyWay(wear(on, s, EVERYTHING), true)));
    }
    const backs = EVERYTHING.filter((id) =>
      ['cape', 'batWings', 'wings'].includes(OUTFITS[id].cut),
    );
    for (const back of backs) {
      held[`back:${back}`] = hash(
        idsOf(HAIR_STYLES).map((hairStyle) =>
          everyWay(wear({ ...DEFAULT_LOOK, hairStyle }, back, EVERYTHING), true),
        ),
      );
    }
    const outers = EVERYTHING.filter((id) => OUTFITS[id].slot === 'outer');
    const tops = EVERYTHING.filter((id) => OUTFITS[id].slot === 'top');
    for (const outer of outers) {
      held[`outer:${outer}`] = hash(
        tops.map((top) =>
          everyWay(wear(wear(DEFAULT_LOOK, top, EVERYTHING), outer, EVERYTHING), false),
        ),
      );
    }
    expect(held).toMatchSnapshot();
  }, 120_000);
});

const FIGURES: Figure[] = [...VILLAGER_IDS, 'moonPieMan', 'wes', 'wayfarer', 'moira'];

/** A figure every way it stands, walks, waves, sits, breathes, blinks, works and feels. */
function figureEveryWay(id: Figure): unknown[] {
  const out: unknown[] = [];
  const villager = (VILLAGER_IDS as readonly string[]).includes(id);
  const costumes = villager ? [null, 'own' as const] : [null];
  const at = (facing: Facing, frame: number, costume: (typeof costumes)[number], stance: Stance) =>
    out.push(layered(figureLayers(id, facing, frame, costume, null, stance)));
  for (const costume of costumes) {
    for (const facing of FACINGS) {
      for (let frame = 0; frame < DOLL_FRAMES; frame++) at(facing, frame, costume, {});
      at(facing, 0, costume, { act: 'wave', frame: 0 });
      at(facing, 0, costume, { act: 'wave', frame: 1 });
      at(facing, 0, costume, { blink: true });
      at(facing, 0, costume, { out: true });
      at(facing, 0, costume, { sit: true });
      for (const feel of FEELINGS) {
        at(facing, 0, costume, { feel });
        at(facing, 0, costume, { feel, blink: true });
      }
    }
    if (!villager) continue;
    const { weekday, weekend } = VILLAGERS[id as (typeof VILLAGER_IDS)[number]].schedule;
    const works = new Set([...weekday, ...weekend].flatMap((s) => (s.doing ? [s.doing] : [])));
    works.add('skating');
    for (const work of works) {
      for (const frame of [0, 1]) {
        at(WORKS[work].faces, 0, costume, { act: work, frame });
        at(WORKS[work].faces, 0, costume, { act: work, frame, sit: true, out: true });
      }
    }
  }
  for (const bracelet of BRACELETS) {
    out.push(layered(figureLayers(id, 'down', 0, null, bracelet)));
    out.push(layered(figureLayers(id, 'down', 0, null, bracelet, { act: 'wave', frame: 1 })));
  }
  return out;
}

describe("her neighbours' looks, held as they were (1.1's A5a)", () => {
  it('draws every figure every way it stands, works and feels, as it did', () => {
    const held = Object.fromEntries(FIGURES.map((id) => [id, hash(figureEveryWay(id))]));
    for (const half of [
      'butterfly',
      'bugCatcher',
      'ringmaster',
      'scaredy',
      'clueFinder',
    ] as const) {
      held[`cody:${half}`] = hash(
        FACINGS.map((facing) => layered(figureLayers('cody', facing, 0, half))),
      );
    }
    held.pumpkinHead = hash(
      FACINGS.flatMap((facing) => [0, 1, 2].map((frame) => pumpkinHead(facing, frame))),
    );
    expect(held).toMatchSnapshot();
  }, 120_000);

  it('works every job with the same arms and the same things in hand, as it did', () => {
    const held = Object.fromEntries(
      WORK_IDS.map((work) => [
        work,
        hash(VIEWS.flatMap((view) => [0, 1].map((frame) => workPose(work, view, frame)))),
      ]),
    );
    expect(held).toMatchSnapshot();
  });
});
