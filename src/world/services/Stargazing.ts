import { CONSTELLATION_IDS, FIRST_STARS } from '../../data/constellations';
import type { Weather } from '../../data/weather';
import { partsOf } from '../../systems/calendar';
import { dayKey, hourOf } from '../../systems/clock';
import {
  constellationOf,
  findableOn,
  showersOn,
  skyOf,
  tapStar,
  type SkyOpen,
  type TapResult,
  type Trace,
} from '../../systems/stars';
import type { ConstellationId } from '../../types/ids';
import type { Cabinet } from '../Cabinet';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Mailbox } from './Mailbox';

/** What the night sky reads of the rest of the world. */
export interface SkyKeeps {
  cabinet: Cabinet;
  mailbox: Mailbox;
  weather: () => Weather;
}

/** Tonight's sky as the sheet shows it. */
export interface Tonight {
  open: SkyOpen;
  /** What she can trace tonight, the month's first. */
  findable: ConstellationId[];
  /** This month's constellation. */
  month: ConstellationId;
  /** A meteor shower's night (V1's R3): every one is out at once. */
  showers: boolean;
}

/**
 * The night sky (1.5's G4, decision 373): looking through a telescope after dark on a clear
 * night, tracing a constellation by its stars, and her star chart in the Cabinet. Tonight is
 * worked out from the clock and the weather; only what she has traced is kept, by the Cabinet.
 * The trace under way isn't saved: a sheet closed halfway starts the shape again, which costs a
 * few taps and nothing else.
 */
export class Stargazing {
  private readonly ctx: WorldContext;
  private readonly keeps: SkyKeeps;
  private tracing: Trace | null = null;

  constructor(ctx: WorldContext, keeps: SkyKeeps) {
    this.ctx = ctx;
    this.keeps = keeps;
  }

  private get day(): string {
    return dayKey(this.ctx.clock.now());
  }

  /** Whether the stars can be seen now. */
  sky(): SkyOpen {
    return skyOf(hourOf(this.ctx.clock.now()), this.keeps.weather());
  }

  tonight(): Tonight {
    const day = this.day;
    return {
      open: this.sky(),
      findable: findableOn(day),
      month: constellationOf(partsOf(day).month),
      showers: showersOn(day),
    };
  }

  /**
   * She looks through a telescope: the castle's always says how the sky is; one at home only
   * opens on a clear night, and is otherwise just a telescope.
   */
  lookUp(atHome = false): WorldEvent | null {
    const sky = this.sky();
    if (atHome && sky !== 'open') return null;
    this.tracing = null;
    return { kind: 'stargaze', sky };
  }

  /** The day she traced a constellation first, or null. */
  tracedOn(id: ConstellationId): string | null {
    return this.keeps.cabinet.tracedOn(id);
  }

  /** Her star chart: every constellation, and the day she first traced it, or null. */
  chart(): { id: ConstellationId; on: string | null }[] {
    return CONSTELLATION_IDS.map((id) => ({ id, on: this.tracedOn(id) }));
  }

  /** The trace under way, if any. */
  get trace(): Trace | null {
    return this.tracing;
  }

  /** Starts tracing one of tonight's constellations; null if it isn't out, or the sky isn't. */
  begin(id: ConstellationId): Trace | null {
    if (this.sky() !== 'open' || !findableOn(this.day).includes(id)) return null;
    this.tracing = { id, lit: 0 };
    return this.tracing;
  }

  /** Taps one of its stars: the next lights, the last finishes it, any other just twinkles. */
  tap(star: number): TapResult | null {
    if (!this.tracing) return null;
    const { trace, result } = tapStar(this.tracing, star);
    this.tracing = trace;
    this.ctx.moments.push({ kind: 'starTapped', lit: result.kind !== 'twinkle' });
    if (result.kind === 'done') this.traced(trace.id);
    return result;
  }

  /** Puts it on her chart, the first time, and Hazel's letter after the first of all. */
  private traced(id: ConstellationId): void {
    const { cabinet, mailbox } = this.keeps;
    const day = this.day;
    const firstOfAll = cabinet.stars === 0;
    const first = cabinet.chart(id, day);
    let posted = false;
    if (firstOfAll && first && !mailbox.letters.has(FIRST_STARS)) {
      mailbox.post(FIRST_STARS, day, true);
      posted = mailbox.letters.has(FIRST_STARS);
    }
    if (first) this.ctx.events.emit('cabinet', cabinet);
    this.ctx.moments.push({
      kind: 'traced',
      constellation: id,
      first,
      ...(posted ? { posted: true as const } : {}),
    });
  }
}
