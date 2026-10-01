import {
  DUET,
  LESSONS,
  TUNE_IDS,
  TUNES,
  tunesOf,
  type Instrument,
  type TuneId,
} from '../../data/instruments';
import { dayKey } from '../../systems/clock';
import { fill, specialDayOf } from '../../systems/friendship';
import { hashMixed } from '../../systems/random';
import type { VillagerId, ZoneId } from '../../types/ids';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Takings } from './Takings';

/** Who teaches her, where, and where they play together. */
const TEACHER: VillagerId = 'boothoven';
const PARLOUR: ZoneId = 'boothovenParlour';
const HALL: ZoneId = 'castleHall';

/** Kept in `Takings`, once a day. */
export const LESSON_KEY = 'lesson:boothoven';

/** A lesson is worth a little friendship, like a bake with Wrapunzel. */
const LESSON_POINTS = 15;

/** What the instruments read of the rest of the world. */
export interface InstrumentsReads {
  /** Her name, for Boothoven's lines. */
  name: () => string;
  /** Where she is, and where a neighbour is. */
  scene: () => ZoneId;
  zoneOf: (villager: VillagerId) => ZoneId;
  /** A little more friendship, letters and all. */
  thank: (villager: VillagerId, points: number) => void;
}

/**
 * What plays when she walks up to it (0.2's G2): a piano or the hall's music box, each tune of its
 * instrument in turn, starting the day on one dealt from the day key. And Boothoven's lessons
 * (0.2's L2): once a day in his parlour he teaches her the next of his tunes, which every piano
 * plays from then on; and on her anniversary the hall's piano plays their duet while he's there
 * beside it. Neither waits on hearts (decision 211). The tunes she has learnt are saved (v33).
 */
export class Instruments {
  private readonly ctx: WorldContext;
  private readonly takings: Takings;
  private readonly reads: InstrumentsReads;
  /** How many times she has played each, since the game opened. */
  private readonly plays = new Map<Instrument, number>();
  private readonly known: Set<TuneId>;

  constructor(
    ctx: WorldContext,
    takings: Takings,
    reads: InstrumentsReads,
    learnt: readonly string[] = [],
  ) {
    this.ctx = ctx;
    this.takings = takings;
    this.reads = reads;
    // A tune this build doesn't know, or one known from the start, is let go.
    this.known = new Set(
      TUNE_IDS.filter((id) => TUNES[id].learnt !== undefined && learnt.includes(id)),
    );
  }

  /** The tunes she has learnt from Boothoven, in the order they're listed. */
  get learnt(): TuneId[] {
    return TUNE_IDS.filter((id) => this.known.has(id));
  }

  /** What she plays walking up to an instrument in a room (or at home): the duet, or the next tune. */
  play(instrument: Instrument, room: ZoneId | null = null): WorldEvent {
    if (instrument === 'piano' && room === HALL && this.duetNow()) {
      this.known.add(DUET);
      return {
        kind: 'tune',
        tune: DUET,
        line: `${this.say(DUET)} You play it together, four hands on the keys.`,
      };
    }
    const tunes = tunesOf(instrument, this.learnt);
    const played = this.plays.get(instrument) ?? 0;
    this.plays.set(instrument, played + 1);
    const start = hashMixed(`${instrument}:${dayKey(this.ctx.clock.now())}`);
    return { kind: 'tune', tune: tunes[(start + played) % tunes.length]! };
  }

  /** The next tune Boothoven has to teach her, or null once she has learnt them all. */
  nextLesson(): TuneId | null {
    return LESSONS.find((id) => !this.known.has(id)) ?? null;
  }

  /** Whether he can teach her now: both in his parlour, a tune left, not yet today. */
  canLearn(villager: VillagerId): boolean {
    return (
      villager === TEACHER &&
      this.reads.scene() === PARLOUR &&
      this.reads.zoneOf(TEACHER) === PARLOUR &&
      this.nextLesson() !== null &&
      this.takings.isReady(LESSON_KEY)
    );
  }

  /** Today's lesson: he teaches her the next tune and plays it through. Null if he can't now. */
  learn(villager: VillagerId): { line: string; tune: TuneId } | null {
    const tune = this.nextLesson();
    if (!this.canLearn(villager) || !tune) return null;
    this.takings.take(LESSON_KEY);
    this.known.add(tune);
    this.reads.thank(TEACHER, LESSON_POINTS);
    this.ctx.moments.push({ kind: 'tune', tune, line: this.taughtAside(tune) });
    return { line: this.say(tune), tune };
  }

  /** Whether it's her anniversary and he's waiting at the hall's piano. */
  private duetNow(): boolean {
    return (
      specialDayOf(dayKey(this.ctx.clock.now())) === 'anniversary' &&
      this.reads.zoneOf(TEACHER) === HALL
    );
  }

  private say(tune: TuneId): string {
    return fill(TUNES[tune].taught ?? TUNES[tune].line, { name: this.reads.name() });
  }

  private taughtAside(tune: TuneId): string {
    return `Boothoven taught you "${TUNES[tune].name}". Every piano you play knows it now.`;
  }

  snapshot(): { tunes: TuneId[] } {
    return { tunes: this.learnt };
  }
}
