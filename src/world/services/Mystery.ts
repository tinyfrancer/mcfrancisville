import { MAYOR_LETTERS, VISITOR_BOOK_CRITTERS, type ClueId } from '../../data/mystery';
import { VILLAGER_IDS } from '../../data/villagers';
import { dayKey } from '../../systems/clock';
import { hashString } from '../../systems/random';
import {
  secondLetterDue,
  WES_SLOT_MS,
  WES_SPOOKS_AT,
  wesSpot,
  type Lurk,
} from '../../systems/mystery';
import type { Tile } from '../../systems/pathfinding';
import type { Cabinet } from '../Cabinet';
import type { Casebook } from '../Casebook';
import type { WorldContext } from '../context';
import type { Friends } from '../Friends';
import { reach } from '../Movement';
import type { Wardrobe } from '../Wardrobe';
import type { Mailbox } from './Mailbox';

/** What the mystery reads of the rest of the world, and changes nothing in. */
export interface MysteryReads {
  mailbox: Mailbox;
  friends: Friends;
  cabinet: Cabinet;
  wardrobe: Wardrobe;
  /** Whether she's out in town, where Wes lurks. */
  outside: () => boolean;
}

/**
 * The mayor's mystery (decisions.md 19): the mayor's letters, the clues pinned to her corkboard as
 * she goes, and Wes, lurking at the edge of what she can see.
 */
export class Mystery {
  private readonly ctx: WorldContext;
  readonly casebook: Casebook;
  private readonly reads: MysteryReads;
  /** Where Wes can lurk: the tiles beside trees. */
  readonly lurks: readonly Lurk[];
  /** The minute Wes's spot was last worked out, and where he is; dev handles poke these. */
  wesSlot = -1;
  wesHere: Lurk | null = null;

  constructor(ctx: WorldContext, casebook: Casebook, reads: MysteryReads, lurks: readonly Lurk[]) {
    this.ctx = ctx;
    this.casebook = casebook;
    this.reads = reads;
    this.lurks = lurks;
    ctx.signals.on('bought', ({ shop }) => {
      if (shop === 'moonPie') this.pin('wrapper');
    });
    ctx.signals.on('opened', ({ letter }) => {
      const [key, n] = letter.split(':');
      const mayor = key === 'mayor' ? MAYOR_LETTERS[Number(n)] : undefined;
      if (mayor) this.pin(mayor.clue);
    });
  }

  /** Pins a clue to her corkboard. False if it was pinned already. */
  pin(id: ClueId): boolean {
    if (!this.casebook.pin(id, dayKey(this.ctx.clock.now()))) return false;
    this.ctx.moments.push({ kind: 'clue', clue: id });
    this.ctx.events.emit('mystery', this.casebook);
    return true;
  }

  /**
   * The mystery, as it moves on: the mayor's first letter once she has a name, the second a week
   * later, and the clues her friendships and her Curiosity Cabinet turn up.
   */
  check(): void {
    const { mailbox, friends, cabinet, wardrobe } = this.reads;
    if (!wardrobe.created) return;
    const day = dayKey(this.ctx.clock.now());
    const letters = mailbox.letters;
    if (!letters.has('mayor:0')) mailbox.post('mayor:0', day);
    const first = letters.all.find((m) => m.id === 'mayor:0');
    if (first && !letters.has('mayor:1') && secondLetterDue(first.on, day)) {
      mailbox.post('mayor:1', day);
    }
    if (!this.casebook.foundOn('rumour') && VILLAGER_IDS.some((v) => friends.hearts(v) >= 3)) {
      this.pin('rumour');
    }
    if (cabinet.found >= VISITOR_BOOK_CRITTERS) this.pin('visitorBook');
  }

  /**
   * Wes turns up now and then, at the edge of where she can see, and is gone by the time she gets
   * near. The first time, he leaves a button behind. `taken` is the tiles her neighbours stand on,
   * which he won't.
   */
  step(her: Tile, taken: readonly Tile[]): void {
    const outside = this.reads.outside();
    const slot = Math.floor(this.ctx.clock.now() / WES_SLOT_MS);
    if (slot !== this.wesSlot) {
      this.wesSlot = slot;
      const free = this.lurks.filter((l) => !taken.some((t) => t.tx === l.tx && t.ty === l.ty));
      this.wesHere = outside ? wesSpot(slot, free, her) : null;
    }
    const wes = outside ? this.wesHere : null;
    if (!wes || reach(her, wes) > WES_SPOOKS_AT) return;
    this.wesHere = null;
    if (!this.pin('button')) {
      this.ctx.moments.push({ kind: 'wesGone', line: hashString(`wesGone@${slot}`) });
    }
  }

  /** Where Wes is lurking, if she's out in town and he's about. */
  wes(): Lurk | null {
    return this.reads.outside() ? this.wesHere : null;
  }

  /** Wes, on a tile in town: at his feet, or his hat just above. */
  wesAt(tx: number, ty: number): Lurk | null {
    const wes = this.wes();
    return wes && wes.tx === tx && (wes.ty === ty || wes.ty - 1 === ty) ? wes : null;
  }
}
