import { ITEMS } from '../data/items';
import { PROJECT_IDS, PROJECTS, type ProjectStage } from '../data/projects';
import { isFunded, NOTHING_GIVEN, stageOf, type Given } from '../systems/projects';
import type { ItemId, ProjectId } from '../types/ids';

/** The town's projects as saved (V1's R4): the one she's funding, what's in each, those built. */
export interface WorksSnapshot {
  current: ProjectId | null;
  given: Partial<Record<ProjectId, Given>>;
  built: ProjectId[];
}

/**
 * The town's projects (V1's R4): which one she's funding now, what she has given each, and which
 * are built. It keeps state only; `Projects` takes what she gives from her bag and purse. A project
 * this build doesn't know, or a thing it no longer asks for, is let go; a built one stays built.
 */
export class Works {
  private now: ProjectId | null;
  private readonly given = new Map<ProjectId, Given>();
  private readonly finished: Set<ProjectId>;
  /** A stage shown in place of a project's own, for a dev build to look at (never saved). */
  private readonly previews = new Map<ProjectId, ProjectStage | null>();
  private changes = 0;

  constructor(saved?: Partial<WorksSnapshot>) {
    const known = (id: unknown): id is ProjectId =>
      typeof id === 'string' && (PROJECT_IDS as string[]).includes(id);
    this.finished = new Set((Array.isArray(saved?.built) ? saved.built : []).filter(known));
    for (const [id, g] of Object.entries(saved?.given ?? {})) {
      if (!known(id) || !g || this.finished.has(id)) continue;
      const asks = new Set(PROJECTS[id].needs.map((n) => n.item));
      const items = Object.fromEntries(
        Object.entries(g.items ?? {}).filter(
          ([item, n]) => item in ITEMS && asks.has(item as ItemId) && Number.isInteger(n) && n! > 0,
        ),
      ) as Partial<Record<ItemId, number>>;
      const candy = Number.isInteger(g.candy) && g.candy > 0 ? g.candy : 0;
      this.given.set(id, { candy, items });
    }
    const current = saved?.current;
    this.now = known(current) && !this.finished.has(current) ? current : null;
  }

  /** The project she's funding now, if she has started one. */
  get current(): ProjectId | null {
    return this.now;
  }

  /** Counts every change, for a view that redraws a site when it changes. */
  get version(): number {
    return this.changes;
  }

  givenTo(id: ProjectId): Given {
    return this.given.get(id) ?? NOTHING_GIVEN;
  }

  isBuilt(id: ProjectId): boolean {
    return this.finished.has(id);
  }

  /** Whether she has started a project, given to it, or built it: its site is spoken for. */
  begun(id: ProjectId): boolean {
    return this.now === id || this.given.has(id) || this.finished.has(id);
  }

  /** What stands on a project's site now: nothing, its posts, its frame, or the thing built. */
  stage(id: ProjectId): ProjectStage | null {
    if (this.previews.has(id)) return this.previews.get(id)!;
    return stageOf(PROJECTS[id], this.givenTo(id), this.finished.has(id));
  }

  /** Starts funding a project, if none is under way and it isn't built. */
  start(id: ProjectId): boolean {
    if (this.now !== null || this.finished.has(id)) return false;
    this.now = id;
    this.changes++;
    return true;
  }

  /** Puts Candy or things toward the current project. */
  add(id: ProjectId, what: { candy: number } | { item: ItemId; count: number }): void {
    const was = this.givenTo(id);
    const next: Given = { candy: was.candy, items: { ...was.items } };
    if ('candy' in what) next.candy += what.candy;
    else next.items[what.item] = (next.items[what.item] ?? 0) + what.count;
    this.given.set(id, next);
    this.changes++;
  }

  /** Builds a project once everything's in: it stands for good, and none is under way. */
  build(id: ProjectId): boolean {
    if (this.finished.has(id) || !isFunded(PROJECTS[id], this.givenTo(id))) return false;
    this.finished.add(id);
    this.given.delete(id);
    if (this.now === id) this.now = null;
    this.changes++;
    return true;
  }

  /** Shows a project at a stage, or as it is with `undefined` (a dev build's handle). */
  preview(id: ProjectId, stage: ProjectStage | null | undefined): void {
    if (stage === undefined) this.previews.delete(id);
    else this.previews.set(id, stage);
    this.changes++;
  }

  snapshot(): { projects: WorksSnapshot } {
    return {
      projects: {
        current: this.now,
        given: Object.fromEntries(this.given) as Partial<Record<ProjectId, Given>>,
        built: PROJECT_IDS.filter((id) => this.finished.has(id)),
      },
    };
  }
}
