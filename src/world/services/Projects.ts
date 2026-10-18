import { PROJECT_IDS, PROJECTS, type ProjectStage } from '../../data/projects';
import { dayKey } from '../../systems/clock';
import { knowBandstand } from '../../systems/venues';
import {
  candyIn,
  candyLots,
  progressOf,
  stillWants,
  type ProjectNeedLeft,
} from '../../systems/projects';
import type { FurnitureId, ItemId, ProjectId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Works } from '../Works';
import type { Yard } from '../Yard';
import type { Mailbox } from './Mailbox';
import type { Wallet } from './Wallet';

/** A project as the noticeboard shows it. */
export interface ProjectView {
  id: ProjectId;
  stage: ProjectStage | null;
  built: boolean;
  /** The one she's funding now. */
  current: boolean;
  /** How much of its worth is in, 0 to 1. */
  progress: number;
  /** The Candy still wanted, and what she has to give. */
  candy: { wanted: number; has: number };
  /** Each thing it asks for: how many, how many are in, and how many she has spare. */
  items: (ProjectNeedLeft & { has: number })[];
}

/** What giving to a project takes: lots of Candy, or so many of a thing. */
export type Gift = { candy: number } | { item: ItemId; count: number };

/** What funding the projects reaches into. */
export interface ProjectsKeeps {
  works: Works;
  bag: Bag;
  wallet: Wallet;
  mailbox: Mailbox;
  /** Her yard, which makes room for a project going up in it. */
  yard: Yard;
}

/** The letter's id for a project built, from the mayor. */
export const projectLetter = (id: ProjectId) => `project:${id}`;

/**
 * The town's projects (V1's R4, decision 314), funded at the noticeboard: one at a time, picked
 * from those not yet built, given to in lots of Candy and what she gathers and grows, a little or a
 * lot whenever she likes, and built the moment the last of it is in, with the mayor's letter. What's
 * in each is saved (`Works`); what stands on its site is `Sites`, read off the same.
 */
export class Projects {
  private readonly ctx: WorldContext;
  private readonly keeps: ProjectsKeeps;

  constructor(ctx: WorldContext, keeps: ProjectsKeeps) {
    this.ctx = ctx;
    this.keeps = keeps;
    knowBandstand(keeps.works.isBuilt('bandstand'));
  }

  /** The one she's funding now, if she has started one. */
  get current(): ProjectId | null {
    return this.keeps.works.current;
  }

  /** Every project, in order, as the noticeboard shows it. */
  view(): ProjectView[] {
    const { works, bag, wallet } = this.keeps;
    return PROJECT_IDS.map((id) => {
      const row = PROJECTS[id];
      const given = works.givenTo(id);
      const wants = stillWants(row, given);
      const built = works.isBuilt(id);
      return {
        id,
        stage: works.stage(id),
        built,
        current: works.current === id,
        progress: built ? 1 : progressOf(row, given),
        candy: { wanted: wants.candy, has: wallet.candy },
        items: wants.items.map((n) => ({ ...n, has: bag.spare(n.item) })),
      };
    });
  }

  /**
   * Starts funding a project: null if one is under way already, or it's built. Anything of hers
   * standing on its site in her yard goes in the storage chest, to make room; those are returned.
   */
  start(id: ProjectId): FurnitureId[] | null {
    const { works, yard } = this.keeps;
    if (!works.start(id)) return null;
    const moved = yard.makeRoom();
    if (moved.length > 0) this.ctx.events.emit('yard', yard);
    this.ctx.events.emit('projects', works.version);
    return moved;
  }

  /** How many lots of Candy she could give the current project now. */
  candyLots(): number {
    const id = this.current;
    if (!id) return 0;
    const wanted = stillWants(PROJECTS[id], this.keeps.works.givenTo(id)).candy;
    return candyLots(wanted, this.keeps.wallet.candy);
  }

  /**
   * Gives the current project lots of Candy (`{ candy: lots }`) or so many of a thing it asks for,
   * never more than it still wants or she has. Null if nothing could go. When the last of it is in,
   * it's built: it stands for good, and the mayor writes.
   */
  give(gift: Gift): WorldEvent | null {
    const id = this.current;
    if (!id) return null;
    const { works, bag, wallet } = this.keeps;
    const row = PROJECTS[id];
    const wants = stillWants(row, works.givenTo(id));
    const was = works.stage(id);
    if ('candy' in gift) {
      const candy = candyIn(gift.candy, wants.candy, wallet.candy);
      if (candy <= 0 || !wallet.spend(candy)) return null;
      works.add(id, { candy });
    } else {
      const need = wants.items.find((n) => n.item === gift.item);
      const count = need ? Math.min(gift.count, need.of - need.given, bag.spare(gift.item)) : 0;
      if (count <= 0 || !bag.remove(gift.item, count)) return null;
      works.add(id, { item: gift.item, count });
      this.ctx.events.emit('bag', bag.contents);
    }
    if (works.build(id)) {
      knowBandstand(works.isBuilt('bandstand'));
      this.keeps.mailbox.post(projectLetter(id), dayKey(this.ctx.clock.now()));
      this.ctx.events.emit('projects', works.version);
      return { kind: 'built', project: id };
    }
    this.ctx.events.emit('projects', works.version);
    const stage = works.stage(id);
    return { kind: 'pitchedIn', project: id, ...(stage !== was && stage ? { raised: stage } : {}) };
  }

  /** Shows a project at a stage, or as it is with `undefined`: a dev build's handle (V1's R4). */
  preview(id: ProjectId, stage: ProjectStage | null | undefined): void {
    this.keeps.works.preview(id, stage);
    this.ctx.events.emit('projects', this.keeps.works.version);
  }
}
