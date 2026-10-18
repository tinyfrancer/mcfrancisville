import { PROP_FOOTPRINT } from '../data/maps';
import {
  CANDY_LOT,
  FRAMES_FROM,
  PROJECT_IDS,
  PROJECTS,
  type ProjectRow,
  type ProjectStage,
} from '../data/projects';
import { ITEM_VALUE } from '../data/shop';
import type { ItemId, MapZoneId, ProjectId } from '../types/ids';
import type { PlacedProp } from './grid';
import type { Tile } from './pathfinding';

/*
 * The town's projects (V1's R4, decision 314): how far along one is from what's been given, what it
 * still wants, and what stands on its site at each stage. Nothing here keeps anything; `Works`
 * keeps what's been given and `Projects` does the giving.
 */

/** What's been given to a project: Candy, and so many of each thing. */
export interface Given {
  candy: number;
  items: Partial<Record<ItemId, number>>;
}

export const NOTHING_GIVEN: Given = { candy: 0, items: {} };

/** A project's whole worth, its Candy and its things at what the shops pay for them. */
export function worthOf(row: ProjectRow): number {
  return row.candy + row.needs.reduce((s, n) => s + n.count * ITEM_VALUE[n.item], 0);
}

/** How much of a project's worth is in, from 0 to 1, counting nothing beyond what it asks. */
export function progressOf(row: ProjectRow, given: Given): number {
  const candy = Math.min(given.candy, row.candy);
  const items = row.needs.reduce(
    (s, n) => s + Math.min(given.items[n.item] ?? 0, n.count) * ITEM_VALUE[n.item],
    0,
  );
  return (candy + items) / worthOf(row);
}

/** Whether everything a project asks for is in. */
export function isFunded(row: ProjectRow, given: Given): boolean {
  return given.candy >= row.candy && row.needs.every((n) => (given.items[n.item] ?? 0) >= n.count);
}

/**
 * What stands on a project's site: nothing before anything's given, the posts once something is,
 * its frame from halfway, and the thing itself once it's built.
 */
export function stageOf(row: ProjectRow, given: Given, built: boolean): ProjectStage | null {
  if (built) return 'done';
  const progress = progressOf(row, given);
  if (progress <= 0) return null;
  return progress >= FRAMES_FROM ? 'frames' : 'posts';
}

/** What a project still wants: Candy, and each thing it asks for, so many more. */
export function stillWants(
  row: ProjectRow,
  given: Given,
): { candy: number; items: ProjectNeedLeft[] } {
  return {
    candy: Math.max(0, row.candy - given.candy),
    items: row.needs.map((n) => ({
      item: n.item,
      of: n.count,
      given: Math.min(given.items[n.item] ?? 0, n.count),
    })),
  };
}

export interface ProjectNeedLeft {
  item: ItemId;
  of: number;
  given: number;
}

/** How many lots of Candy she can give: up to what she has and what's still wanted. */
export function candyLots(wanted: number, has: number): number {
  return Math.ceil(Math.min(wanted, has) / CANDY_LOT);
}

/** The Candy in `lots` lots, never more than what's wanted or what she has. */
export function candyIn(lots: number, wanted: number, has: number): number {
  return Math.max(0, Math.min(lots * CANDY_LOT, wanted, has));
}

/** What stands on a project's site at a stage, each with its footprint, as the zone holds it. */
export function piecesAt(id: ProjectId, stage: ProjectStage): PlacedProp[] {
  return PROJECTS[id].stages[stage].map((p) => ({
    id: p.prop,
    tx: p.tx,
    ty: p.ty,
    ...PROP_FOOTPRINT[p.prop],
  }));
}

/** The projects that go up in a place. */
export function projectsIn(zone: MapZoneId): ProjectId[] {
  return PROJECT_IDS.filter((id) => PROJECTS[id].zone === zone);
}

/**
 * Every tile any stage of a project covers, its deck and its beds: kept clear of everything else
 * (the dig spots, the yard), so the site is always there to build on.
 */
export function siteOf(id: ProjectId): Tile[] {
  const row = PROJECTS[id];
  const tiles = new Map<string, Tile>();
  for (const stage of Object.values(row.stages)) {
    for (const p of stage) {
      const { w, h } = PROP_FOOTPRINT[p.prop];
      for (let ty = p.ty; ty < p.ty + h; ty++) {
        for (let tx = p.tx; tx < p.tx + w; tx++) tiles.set(`${tx},${ty}`, { tx, ty });
      }
    }
  }
  for (const t of [...(row.deck ?? []), ...(row.beds ?? [])]) tiles.set(`${t.tx},${t.ty}`, t);
  return [...tiles.values()];
}

/** What isn't solid of a built project: the bridge's rails stand over its deck. */
export const FLAT: ReadonlySet<string> = new Set(['footbridge']);

/** How near the bandstand, in tiles from its middle, she hears its music box after dark. */
export const BANDSTAND_REACH = 3;

/** Whether `tile` is within hearing of a bandstand among `props`. */
export function byBandstand(props: readonly PlacedProp[], tile: Tile): boolean {
  return props.some(
    (p) =>
      p.id === 'bandstand' &&
      Math.hypot(tile.tx + 0.5 - (p.tx + p.w / 2), tile.ty + 0.5 - (p.ty + p.h / 2)) <=
        BANDSTAND_REACH,
  );
}
