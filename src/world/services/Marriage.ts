import {
  HER_DAY_ANSWERS,
  HER_DAY_SAYS,
  HUSBAND,
  TOGETHER,
  type HerDayAnswer,
  type TogetherId,
} from '../../data/cody';
import { ITEMS } from '../../data/items';
import { VILLAGERS } from '../../data/villagers';
import { dayKey, hourOf, isNight } from '../../systems/clock';
import {
  answeredOn,
  askOf,
  asksNow,
  atHers,
  backOf,
  storyDue,
  yesterdayOf,
} from '../../systems/cody';
import type { Around } from '../../systems/dialogue';
import { SPECIAL_DAYS } from '../../data/specialDays';
import { dayLine } from '../../systems/friendship';
import { happeningOf } from '../../systems/happenings';
import { SNACK_KEY, snackOn } from '../../systems/gathering';
import { aThing } from '../../systems/remembering';
import type { ZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { Lately } from '../Lately';
import type { Mailbox } from './Mailbox';
import type { Told } from './Talk';
import type { Takings } from './Takings';

/** What being married reaches into: her memory of the day, tonight's takings, her bag, her mail. */
export interface MarriageKeeps {
  lately: Lately;
  takings: Takings;
  bag: Bag;
  mailbox: Mailbox;
}

/** What it reads of the world, each when it's asked. */
export interface MarriageReads {
  /** What's going on round her, as a talk sees it. */
  scene: () => Around;
  here: () => ZoneId;
  /** Puts their song on, where she stands, with him dancing beside her. */
  dance: () => void;
  /** How many days she has come to town (`Visits`): his letters wait for her first. */
  visits: () => number;
}

/**
 * Cody, married to her from the first day (V1's P5, decision 269): his reward letters all sent,
 * his "how was your day?" of an evening and her answer kept for the next, the scenes from their
 * story told over her first weeks, and what they do together at hers at night. Where he is of an
 * evening is `systems/cody.ts`'s `atHers`, which the neighbourhood reads to walk him there.
 */
export class Marriage {
  private readonly ctx: WorldContext;
  private readonly keeps: MarriageKeeps;
  private readonly reads: MarriageReads;
  /** The day a scene was last told: one a day. */
  private toldOn: string | null = null;
  /** The last day his letters were looked for. */
  private sentOn: string | null = null;

  private readonly peopled: boolean;

  constructor(ctx: WorldContext, keeps: MarriageKeeps, reads: MarriageReads, peopled: boolean) {
    this.ctx = ctx;
    this.keeps = keeps;
    this.reads = reads;
    this.peopled = peopled;
  }

  private get day(): string {
    return dayKey(this.ctx.clock.now());
  }

  /** Whether he's at hers just now. */
  get atHers(): boolean {
    const now = this.ctx.clock.now();
    return atHers(hourOf(now), dayKey(now));
  }

  /**
   * What he has to say on a talk before anything else (`Neighbourhood.talk`): after his hello,
   * the next scene of their story she has lived here long enough for, one a day; and of an
   * evening, until she has answered, how her day was, with her three answers. A special day's
   * line comes first of all.
   */
  tell(talks: number): Told | null {
    const now = this.ctx.clock.now();
    const day = dayKey(now);
    if (talks === 0 && dayLine(HUSBAND, day)) return null;
    const { lately } = this.keeps;
    // The day after she told him how hers was, that's the first thing he says.
    const yesterday = talks === 0 ? yesterdayOf(lately.last.herDay, day) : null;
    if (yesterday) return { line: yesterday, more: [], replies: [] };
    const scene = this.reads.scene();
    const due = talks > 0 && this.toldOn !== day ? storyDue(scene.visits, lately.last.told) : null;
    if (due) {
      this.toldOn = day;
      lately.tell(due.id);
      const [line, ...more] = due.lines;
      return { line: line!, more, replies: due.replies ?? [] };
    }
    // At one of his happenings, what's on comes first; he asks when they're home after.
    const hour = hourOf(now);
    if (!asksNow(hour) || happeningOf(HUSBAND, hour, day)) return null;
    if (day.slice(5) === SPECIAL_DAYS.birthday || answeredOn(lately.last.herDay, day)) return null;
    const replies = HER_DAY_ANSWERS.map((answer) => ({
      say: HER_DAY_SAYS[answer],
      back: backOf(answer, day),
      herDay: answer,
    }));
    return { line: askOf(scene, day), more: [], replies };
  }

  /** Whether he has a scene to tell on her next talk today. */
  hasToTell(): boolean {
    const day = this.day;
    return (
      this.toldOn !== day &&
      storyDue(this.reads.scene().visits, this.keeps.lately.last.told) !== null
    );
  }

  /** She told him how her day was; he brings it up tomorrow. */
  answered(answer: HerDayAnswer): void {
    this.keeps.lately.answered(answer, this.day);
  }

  /**
   * What they can do together now: at hers, of an evening, each once a night; the snack run while
   * tonight's snack is still out, and stargazing on a clear night, both after dark.
   */
  canDo(id: TogetherId): boolean {
    const now = this.ctx.clock.now();
    const hour = hourOf(now);
    if (this.reads.here() !== 'home' || !asksNow(hour)) return false;
    const row = TOGETHER[id];
    const { takings } = this.keeps;
    if (row.night && !isNight(hour)) return false;
    if (row.clear && this.reads.scene().weather !== 'clear') return false;
    if (id === 'snackRun' && !takings.isReady(SNACK_KEY)) return false;
    return takings.isReady(togetherKey(id));
  }

  /**
   * Does it: the scene's lines, what comes of it (tonight's snack, fetched; their song, on), and
   * her pose and his heart as the last line shows. Null if it can't be done now.
   */
  together(id: TogetherId): { lines: string[]; aside?: string } | null {
    if (!this.canDo(id)) return null;
    const { takings, bag } = this.keeps;
    const day = this.day;
    takings.take(togetherKey(id));
    const row = TOGETHER[id];
    let aside: string | undefined;
    let snack = '';
    if (id === 'snackRun') {
      const item = snackOn(day);
      takings.take(SNACK_KEY);
      bag.add(item, 1);
      this.ctx.events.emit('bag', bag.contents);
      snack = aThing(ITEMS[item].name);
      aside = `${VILLAGERS[HUSBAND].name} brought back ${snack}.`;
    }
    if (id === 'ourSong') {
      this.reads.dance();
      aside = 'Your song is on. Close the chat to dance.';
    }
    this.ctx.moments.push({ kind: 'together', what: id, does: row.does });
    return {
      lines: row.lines.map((l) => l.replaceAll('{snack}', snack)),
      ...(aside ? { aside } : {}),
    };
  }

  /**
   * His letters (decision 269: nothing to earn), all of them, the first time a day is stepped:
   * on a new town's first day, or an old save's first day of this version, whatever its hearts.
   * They come quietly, as though they'd always been there (no toast, only the mailbox's flag), and
   * one already sent is never sent again. They wait for her first visit to be counted, as
   * Agatha's does, and there are none in a town without neighbours (a test's small map).
   */
  check(): void {
    const day = this.day;
    if (day === this.sentOn || !this.peopled || this.reads.visits() < 1) return;
    this.sentOn = day;
    for (const reward of VILLAGERS[HUSBAND].rewards) {
      this.keeps.mailbox.post(`${HUSBAND}:${reward.hearts}`, day, true);
    }
  }
}

/** What's kept in `Takings` once they've done something together tonight. */
export function togetherKey(id: TogetherId): string {
  return `together:${id}`;
}
