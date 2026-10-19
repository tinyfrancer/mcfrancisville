import { PROJECTS } from '../../data/projects';
import type { PlacedProp } from '../../systems/grid';
import type { Tile } from '../../systems/pathfinding';
import { FLAT, piecesAt, projectsIn } from '../../systems/projects';
import type { MapZoneId } from '../../types/ids';
import type { Works } from '../Works';
import type { Overlay } from './Overlay';
import { covers } from './Zone';

/**
 * The town's projects as they stand in a place (V1's R4), the way `Decorations` stands a holiday's
 * pieces: the posts, the frame or what's built on each site, solid as any prop, but for a built
 * footbridge, whose deck is walked on (wood, not ice), and a built greenhouse's planters, which
 * are beds. Worked out again whenever what's been given changes.
 */
export class Sites implements Overlay {
  private readonly works: Works;
  private readonly zone: MapZoneId;
  private cache: {
    version: number;
    solid: PlacedProp[];
    flat: PlacedProp[];
    deck: Set<string>;
    beds: Tile[];
  } | null = null;

  constructor(works: Works, zone: MapZoneId) {
    this.works = works;
    this.zone = zone;
  }

  /** Whether any project goes up here at all. */
  get any(): boolean {
    return projectsIn(this.zone).length > 0;
  }

  private now() {
    const version = this.works.version;
    if (this.cache?.version === version) return this.cache;
    const solid: PlacedProp[] = [];
    const flat: PlacedProp[] = [];
    const deck = new Set<string>();
    const beds: Tile[] = [];
    for (const id of projectsIn(this.zone)) {
      const stage = this.works.stage(id);
      if (stage === null) continue;
      for (const p of piecesAt(id, stage)) (FLAT.has(p.id) ? flat : solid).push(p);
      if (stage !== 'done') continue;
      for (const t of PROJECTS[id].deck ?? []) deck.add(`${t.tx},${t.ty}`);
      beds.push(...(PROJECTS[id].beds ?? []));
    }
    this.cache = { version, solid, flat, deck, beds };
    return this.cache;
  }

  /** What stands solid on the sites: walked up to, never through. */
  props(): readonly PlacedProp[] {
    return this.now().solid;
  }

  /** What's drawn but walked over: a built bridge's rails. */
  flat(): readonly PlacedProp[] {
    return this.now().flat;
  }

  propAt(tx: number, ty: number): PlacedProp | undefined {
    return this.now().solid.find((p) => covers(p, tx, ty));
  }

  /** Whether a tile is a built bridge's deck. */
  isDeck(tx: number, ty: number): boolean {
    return this.now().deck.size > 0 && this.now().deck.has(`${tx},${ty}`);
  }

  /** The beds a built project has made here. */
  beds(): readonly Tile[] {
    return this.now().beds;
  }

  isBed(tx: number, ty: number): boolean {
    return this.now().beds.some((b) => b.tx === tx && b.ty === ty);
  }

  /** What stands going up, or built, and a built project's planters, which are beds. */
  blocks(tx: number, ty: number): boolean {
    return this.propAt(tx, ty) !== undefined || this.isBed(tx, ty);
  }

  /** A key that changes whenever the ground here does (a built project's beds), for the view. */
  get shown(): string {
    return String(this.now().beds.length);
  }
}
