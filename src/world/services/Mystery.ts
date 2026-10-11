import { MAYOR_LETTERS, VISITOR_BOOK_CRITTERS, type ClueId } from '../../data/mystery';
import { CHAIN } from '../../data/mysteryChain';
import { WES_DELIVERS, WES_FIRST, WES_GLIMPSES, WES_READY, WES_TALK } from '../../data/wes';
import type { PropId } from '../../types/ids';
import { daysBetween as daysApart } from '../../systems/calendar';
import { fill } from '../../systems/friendship';
import { daysUntil, dueStep, readyOn, wesBand } from '../../systems/mysteryChain';
import { VILLAGER_IDS } from '../../data/villagers';
import { dayKey } from '../../systems/clock';
import { hashString } from '../../systems/random';
import { CHAPTERS } from '../../data/story';
import {
  chapterId,
  chaptersDue,
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
import type { WorldEvent } from '../events';
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
  /** The last day the story's chapters were looked for, so they're looked for once a day. */
  private storyOn: string | null = null;
  /** The minute up to which Wes stays put for her, since she set off to chat (V1's P3a). */
  private heldTo = -1;
  /** Her chats with Wes today, so each brings the next of the day's lines. */
  private chatsToday = 0;

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
      if (key === 'story' && CHAPTERS[Number(n)]?.wes) this.pin('lastChapter');
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
   * later, their October story a chapter a week (but the one Wes drops), and the clues her
   * friendships and her Curiosity Cabinet turn up.
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
    if (first && this.storyOn !== day) {
      this.storyOn = day;
      for (const n of chaptersDue(day)) if (!CHAPTERS[n]!.wes) mailbox.post(chapterId(n), day);
    }
    if (!this.casebook.foundOn('rumour') && VILLAGER_IDS.some((v) => friends.hearts(v) >= 3)) {
      this.pin('rumour');
    }
    if (cabinet.found >= VISITOR_BOOK_CRITTERS) this.pin('visitorBook');
    this.chain(day);
  }

  /**
   * The chain to the unmasking (V1's P3a, decision 302): the mayor's next letter once its week has
   * come, posted once. A clue to find waits where it is for her to walk up to it (`visit`).
   */
  private chain(day: string): void {
    if (this.casebook.began === null) this.casebook.began = day;
    const due = this.due(day);
    const step = due === null ? undefined : CHAIN[due];
    if (!step || !('letter' in step)) return;
    const n = MAYOR_LETTERS.findIndex((m) => m.clue === step.clue);
    const id = `mayor:${n}`;
    if (!this.reads.mailbox.letters.has(id)) this.reads.mailbox.post(id, day);
  }

  /** The step of the chain due today, if one is. */
  private due(day: string): number | null {
    return dueStep((id) => this.casebook.foundOn(id), this.casebook.began, day);
  }

  /** She walked up to something in town: the chain's clue, if it waits there today. */
  visit(at: PropId): void {
    const due = this.due(dayKey(this.ctx.clock.now()));
    const step = due === null ? undefined : CHAIN[due];
    if (step && 'at' in step && step.at === at) this.pin(step.clue);
  }

  /** How many days until a clue of the chain comes: 0 once it's due, null if further off. */
  daysUntil(id: ClueId): number | null {
    const found = (c: ClueId) => this.casebook.foundOn(c);
    return daysUntil(id, found, this.casebook.began, dayKey(this.ctx.clock.now()));
  }

  /**
   * The day the chain's last clue was pinned, when the mayor promised to say hello: the unmasking
   * (P3b) can come from then. Null until then.
   */
  ready(): string | null {
    return readyOn((id) => this.casebook.foundOn(id));
  }

  /** Whether Wes stays for a chat now, rather than running: after the third time he ran. */
  get tame(): boolean {
    return this.casebook.glimpses >= WES_GLIMPSES;
  }

  /**
   * She sets off to chat with Wes, who stays put for her until she gets there or the next minute
   * is out. Where he is, or null if he isn't about or would rather run.
   */
  approach(): Lurk | null {
    const wes = this.wes();
    if (!wes || !this.tame) return null;
    this.heldTo = this.wesSlot + 1;
    return wes;
  }

  /**
   * A chat with Wes, if he's still there beside her: the first time he owns up, one line after
   * another; after that a line a talk, in turn, by the days she has chatted, the mayor getting
   * ready leading once the chain is done. If the October story's last chapter is due, he hands it
   * over first. Null if he has gone.
   */
  chat(her: Tile): Extract<WorldEvent, { kind: 'wesChat' }> | null {
    const wes = this.wes();
    this.heldTo = -1;
    if (!wes || !this.tame || reach(her, wes) > 1) return null;
    const day = dayKey(this.ctx.clock.now());
    const book = this.casebook;
    const first = book.chats === 0;
    if (book.talked !== day) {
      book.chats += 1;
      book.talked = day;
      this.chatsToday = 0;
    }
    // Once the mayor has promised, the day's first chat is about that.
    const pool = this.ready() && this.chatsToday === 0 ? WES_READY : WES_TALK[wesBand(book.chats)];
    const start = (daysApart('2000-01-01', day) + this.chatsToday++) % pool.length;
    const lines = first ? [...WES_FIRST] : [pool[start]!];
    if (this.dropChapter(false)) lines.unshift(WES_DELIVERS);
    const name = this.reads.wardrobe.look.name;
    return { kind: 'wesChat', lines: lines.map((l) => fill(l, { name })) };
  }

  /**
   * Wes turns up now and then, at the edge of where she can see, and is gone by the time she gets
   * near. The first time, he leaves a button behind, and in the story's last week, its last
   * chapter. `taken` is the tiles her neighbours stand on, which he won't.
   */
  step(her: Tile, taken: readonly Tile[]): void {
    const outside = this.reads.outside();
    const slot = Math.floor(this.ctx.clock.now() / WES_SLOT_MS);
    if (slot !== this.wesSlot) {
      this.wesSlot = slot;
      const free = this.lurks.filter((l) => !taken.some((t) => t.tx === l.tx && t.ty === l.ty));
      // Waiting for her to get there for a chat (V1's P3a), he stays where he is.
      const waiting = outside && this.wesHere !== null && slot <= this.heldTo;
      if (!waiting) this.wesHere = outside ? wesSpot(slot, free, her) : null;
    }
    const wes = outside ? this.wesHere : null;
    if (!wes || this.tame || reach(her, wes) > WES_SPOOKS_AT) return;
    this.wesHere = null;
    this.casebook.glimpses += 1;
    if (this.pin('button') || this.dropChapter()) return;
    if (this.tame) {
      this.ctx.moments.push({ kind: 'wesStays' });
      return;
    }
    this.ctx.moments.push({ kind: 'wesGone', line: hashString(`wesGone@${slot}`) });
  }

  /** The story's last chapter, dropped as he scarpers once it's due. True if he dropped it. */
  private dropChapter(told = true): boolean {
    const day = dayKey(this.ctx.clock.now());
    const n = chaptersDue(day).find((c) => CHAPTERS[c]!.wes);
    const { mailbox } = this.reads;
    if (n === undefined || mailbox.letters.has(chapterId(n))) return false;
    mailbox.post(chapterId(n), day, true);
    if (told) this.ctx.moments.push({ kind: 'wesDropped' });
    return true;
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
