import { HAPPENINGS } from '../../data/happenings';
import { JOIN_POINTS, verbRow } from '../../data/happeningVerbs';
import { ITEM_VALUE } from '../../data/shop';
import { ITEMS } from '../../data/items';
import { TUNES, type TuneId } from '../../data/instruments';
import { VILLAGERS } from '../../data/villagers';
import { dayKey, hourOf } from '../../systems/clock';
import { fill, specialDayOf } from '../../systems/friendship';
import { happeningOf, venueOf } from '../../systems/happenings';
import { choicesOn, recalled, type Joined, type JoinedSnapshot } from '../../systems/joining';
import type { HappeningId, ItemId, VillagerId, ZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';

/** What joining in reads of the rest of the world. */
export interface JoiningReads {
  name: () => string;
  /** Where she is, and where a neighbour is. */
  scene: () => ZoneId;
  zoneOf: (villager: VillagerId) => ZoneId;
  /** A little more friendship, letters and all. */
  thank: (villager: VillagerId, points: number) => void;
  /** The tunes she has learnt from Boothoven, for the recital's requests. */
  learnt: () => readonly TuneId[];
}

/** A verb she can do now with the host she's talking to: its button, and what she can pick. */
export interface VerbNow {
  happening: HappeningId;
  label: string;
  /** What the host asks, when there's a pick. */
  ask?: string;
  choices: { id: string; say: string }[];
}

/**
 * Joining in at her neighbours' happenings (V1's P4, decision 304): while one is on and she's
 * there, its host's talk has its verb (`data/happeningVerbs.ts`), once a day; doing it brings
 * them a little closer and is kept, so the next time it's on they remember it. Kept in the save
 * as `happenings`, the day and the pick by happening.
 */
export class Joining {
  private readonly ctx: WorldContext;
  private readonly bag: Bag;
  private readonly reads: JoiningReads;
  private readonly joined = new Map<HappeningId, Joined>();

  constructor(ctx: WorldContext, bag: Bag, reads: JoiningReads, saved: JoinedSnapshot = {}) {
    this.ctx = ctx;
    this.bag = bag;
    this.reads = reads;
    for (const [id, j] of Object.entries(saved)) {
      // A happening this build doesn't know is forgotten; a pick it doesn't is let go when read.
      if (!(id in HAPPENINGS) || typeof j?.on !== 'string') continue;
      this.joined.set(id as HappeningId, typeof j.choice === 'string' ? { ...j } : { on: j.on });
    }
  }

  /** The happening a neighbour is hosting where she is now, if she's there with them. */
  private hosting(villager: VillagerId): HappeningId | null {
    const now = this.ctx.clock.now();
    const day = dayKey(now);
    // On her birthday everyone is at her party instead.
    if (specialDayOf(day) === 'birthday') return null;
    const id = happeningOf(villager, hourOf(now), day);
    if (!id || HAPPENINGS[id].who[0] !== villager) return null;
    const here = this.reads.scene();
    if (venueOf(id).zone !== here || this.reads.zoneOf(villager) !== here) return null;
    return id;
  }

  /** What she can do with the host she's talking to, if their happening has a verb not yet done today. */
  verbFor(villager: VillagerId): VerbNow | null {
    const id = this.hosting(villager);
    const row = id ? verbRow(id) : null;
    if (!id || !row) return null;
    const day = dayKey(this.ctx.clock.now());
    if (this.joined.get(id)?.on === day) return null;
    const name = this.reads.name();
    const choices = choicesOn(id, row, day, this.reads.learnt()).map((c) => ({
      id: c.id,
      say: c.say,
    }));
    return {
      happening: id,
      label: row.label,
      ...(row.ask ? { ask: fill(row.ask, { name }) } : {}),
      choices,
    };
  }

  /**
   * Joins in: the verb done (with her pick, if it has one), and what the host says to it, kept so
   * they remember. Null if there's no verb for her with them now, or that isn't one of its picks.
   */
  join(villager: VillagerId, choice?: string): { lines: string[]; aside?: string } | null {
    const verb = this.verbFor(villager);
    if (!verb) return null;
    const row = verbRow(verb.happening)!;
    const day = dayKey(this.ctx.clock.now());
    const picked = choicesOn(verb.happening, row, day, this.reads.learnt()).find(
      (c) => c.id === choice,
    );
    if (verb.choices.length > 0 ? !picked : choice !== undefined) return null;
    this.joined.set(verb.happening, picked ? { on: day, choice: picked.id } : { on: day });
    this.reads.thank(villager, JOIN_POINTS);
    const aside = this.hand(picked?.gives, row.swaps === 'seed');
    if (row.choices === 'tunes' && picked) {
      const tune = picked.id as TuneId;
      const by = VILLAGERS[villager].name;
      this.ctx.moments.push({
        kind: 'tune',
        tune,
        line: `${by} plays "${TUNES[tune].name}" for you, and the whole room sways.`,
      });
    }
    this.ctx.moments.push({ kind: 'joined', happening: verb.happening, villager });
    const said = picked ? picked.back : (row.done ?? '');
    return { lines: [fill(said, { name: this.reads.name() })], ...(aside ? { aside } : {}) };
  }

  /**
   * What a pick hands her (the swap's packet), and at the swap one of her own seeds left in
   * exchange, the plainest she has, if she has one to spare.
   */
  private hand(gives: ItemId | undefined, swap: boolean): string | undefined {
    if (!gives) return undefined;
    const { bag } = this;
    const theirs = ITEMS[gives].name;
    const mine = swap
      ? bag.spares
          .filter((s) => s.count > 0 && s.id !== gives && ITEMS[s.id].kind === 'seed')
          .sort((a, b) => ITEM_VALUE[a.id] - ITEM_VALUE[b.id])[0]?.id
      : undefined;
    if (mine) bag.remove(mine, 1);
    bag.add(gives, 1);
    this.ctx.events.emit('bag', bag.contents);
    return mine
      ? `You left ${ITEMS[mine].name} and took ${theirs}.`
      : `You took ${theirs}. Leave one next time, if you like.`;
  }

  /**
   * What a host says at their happening remembering the last time she joined in, on an earlier
   * day; null if there's nothing to remember yet. `{name}` is left for the talk to fill.
   */
  recall(happening: HappeningId, villager: VillagerId): string | null {
    const row = verbRow(happening);
    if (!row || HAPPENINGS[happening].who[0] !== villager) return null;
    return recalled(row, this.joined.get(happening), dayKey(this.ctx.clock.now()));
  }

  /** The day she last joined in at a happening, if ever. */
  lastJoined(happening: HappeningId): Joined | null {
    return this.joined.get(happening) ?? null;
  }

  snapshot(): { happenings: JoinedSnapshot } {
    return { happenings: Object.fromEntries([...this.joined].map(([id, j]) => [id, { ...j }])) };
  }
}
