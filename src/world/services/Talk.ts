import { isKept } from '../../data/items';
import { HAPPENINGS } from '../../data/happenings';
import { VILLAGER_IDS, VILLAGERS, type Favour } from '../../data/villagers';
import { dayKey, hourOf } from '../../systems/clock';
import {
  dayLine,
  declineLine,
  FAVOUR_POINTS,
  favourCandy,
  favourOf,
  fill,
  GIFT_POINTS,
  giftLine,
  PUFF_MS,
  puffLine,
  puffsOnTalk,
  reactionTo,
  rewardsBetween,
  TALK_POINTS,
  talkLine,
  yearsMarried,
} from '../../systems/friendship';
import { bandOf, bandReached, OPENERS_KEPT } from '../../systems/remembering';
import { BEST_CALLS } from '../../data/bestFriends';
import type { Reply } from '../../data/replies';
import { BEST_HEARTS, bestLetterId, writesOn } from '../../systems/bestFriends';
import { callNow } from '../../systems/calls';
import type { HerDayAnswer } from '../../data/cody';
import { isHusband } from '../../systems/cody';
import { answerSaid, momentDue, questionDue, repliesTo } from '../../systems/voice';
import { FEEL_AFTER_MS, feelingOf, giftFeeling, herFeeling } from '../../systems/moods';
import type { LineKind } from '../../data/moods';
import type { Feeling } from '../../types/mood';
import { happeningOf } from '../../systems/happenings';
import { holidayOn } from '../../systems/holidays';
import { HOLIDAY_TREATS } from '../../data/holidays';
import { isBirthday } from '../../data/birthdays';
import { BIRTHDAY_GIFT_TIMES } from '../../data/birthdayParties';
import { HOLIDAY_GIFTS } from '../../data/flowerShop';
import { visitOf, whereabouts } from '../../systems/schedules';
import type { Around, Between } from '../../systems/dialogue';
import { isBracelet } from '../../systems/wardrobe';
import type { HappeningId, ItemId, VillagerId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { Chat, GiftResult } from '../events';
import type { Friends, Friendship } from '../Friends';
import type { Wardrobe } from '../Wardrobe';
import type { Mailbox } from './Mailbox';
import type { SmallEvents } from './SmallEvents';
import type { Takings } from './Takings';
import type { Wallet } from './Wallet';

/** What a talk reaches into: what she gives from, is paid into, and is written to. */
export interface TalkKeeps {
  friends: Friends;
  bag: Bag;
  wallet: Wallet;
  mailbox: Mailbox;
  wardrobe: Wardrobe;
  /** Where a happening's gift, once handed over, is kept till it comes round again. */
  takings: Takings;
  /** The window's news, or what someone has lost. */
  smallEvents: SmallEvents;
  /** What's going on round her, for what a neighbour brings up (0.2's D2, V1's P1). */
  scene?: () => Around;
  /** What a host says at their happening, remembering what she did there last time (V1's P4). */
  recall?: (happening: HappeningId, id: VillagerId) => string | null;
  /** Her husband's evening question and their story (V1's P5): `Marriage`. */
  married?: Married;
}

/** What being married adds to a talk with Cody (V1's P5, `Marriage`). */
export interface Married {
  tell(talks: number): Told | null;
  hasToTell(): boolean;
  answered(answer: HerDayAnswer): void;
}

/**
 * Talking with her neighbours (decisions.md 56–61, 1.1's W3): the hello and what they bring up, a
 * heart moment or their question when one is due and what she says back (V1's P2), the faces they
 * say it with (V1's L7), gifts and favours, and friendships that grow and post a letter at each
 * milestone; best friends' letters. Where they are and walking there is `Neighbourhood`'s, which
 * reads who she's talking to here so they wait for her.
 */
export class Talk {
  private readonly ctx: WorldContext;
  private readonly keeps: TalkKeeps;
  /** Who she's talking to, if anyone: they wait for her. */
  private talking: VillagerId | null = null;
  /** How many times she has talked to each today, for their lines to move on. */
  private talks = new Map<VillagerId, { day: string; count: number; said: string[] }>();
  /** Who last let one go on a talk, and when it clears. */
  private puffed: { id: VillagerId; until: number } | null = null;
  /** What each has said their piece for: a visit to her (`day@from`) or a happening. */
  private heard = new Map<VillagerId, string>();
  /** What she can say back to the last line, and to whom (V1's P2). */
  private pending: { id: VillagerId; replies: readonly Answering[] } | null = null;
  /** The feeling on the face of whoever she's talking to, and until when after (V1's L7). */
  private feeling: { id: VillagerId; feel: Feeling | null; until: number } | null = null;
  /** The day each last told her a heart moment, and asked their question: one a day. */
  private told = new Map<VillagerId, string>();
  private asked = new Map<VillagerId, string>();
  /** The last day a best friend's letter was looked for, so it's looked for once a day. */
  private wroteOn: string | null = null;

  constructor(ctx: WorldContext, keeps: TalkKeeps) {
    this.ctx = ctx;
    this.keeps = keeps;
  }

  private get name(): string {
    return this.keeps.wardrobe.look.name;
  }

  /** Who she's talking to, if anyone. */
  get talkingTo(): VillagerId | null {
    return this.talking;
  }

  /** She has walked up to them, and they stop to talk. */
  startTalk(id: VillagerId): void {
    this.talking = id;
  }

  /** She's done talking, and they can be on their way. */
  endTalk(): void {
    this.talking = null;
    this.pending = null;
    // Their face keeps the last line's feeling a moment as she goes (V1's L7).
    if (this.feeling) this.feeling.until = this.ctx.clock.now() + FEEL_AFTER_MS;
  }

  /**
   * How a neighbour feels about the line she's reading (V1's L7): the talk sheet says so as it
   * shows each line, so their face in the world is the one on their bust.
   */
  feel(id: VillagerId, feel: Feeling | null): void {
    this.feeling = { id, feel, until: this.ctx.clock.now() + FEEL_AFTER_MS };
  }

  /** The feeling on a neighbour's face now: while she talks to them, and a moment after. */
  feelingOf(id: VillagerId): Feeling | null {
    const f = this.feeling;
    if (!f || f.id !== id) return null;
    return this.talking === id || this.ctx.clock.now() < f.until ? f.feel : null;
  }

  /** How a line is said (V1's L7), from what it is and how close they are now. */
  private feelingFor(
    id: VillagerId,
    kind: LineKind,
    text: string,
    extra: { topic?: string | null; mood?: Feeling | null } = {},
  ): Feeling | null {
    const band = bandOf(this.keeps.friends.hearts(id), id);
    return feelingOf({ kind, text, band, ...extra });
  }

  /** Who has just let one go on a talk, while the puff lasts. */
  puffedNow(now: number): VillagerId | null {
    return this.puffed && now < this.puffed.until ? this.puffed.id : null;
  }

  private talksToday(id: VillagerId): { count: number; said: string[] } {
    const t = this.talks.get(id);
    return t && t.day === dayKey(this.ctx.clock.now()) ? t : { count: 0, said: [] };
  }

  /**
   * Talks to a neighbour: what they say, and whether it was the day's first talk, which brings
   * them a little closer. Cody lets one go now and then.
   */
  talk(id: VillagerId): Chat {
    const now = this.ctx.clock.now();
    const day = dayKey(now);
    const today = this.talksToday(id);
    const talks = today.count;
    const { friends } = this.keeps;
    const before = friends.of(id);
    const bonus = before.talked !== day;
    if (bonus) this.befriend(id, TALK_POINTS, { talked: day });
    this.pending = null;
    // Her husband's evening question or a scene from their story first (V1's P5); after anyone's
    // hello, a heart moment or their question (V1's P2).
    const married = isHusband(id) ? (this.keeps.married?.tell(talks) ?? null) : null;
    const told = married ?? (talks > 0 ? this.tell(id, day) : null);
    const puff = !told && puffsOnTalk(id, day, talks);
    const hour = hourOf(now);
    const at = puff || told ? null : this.atHappening(id, hour, day, talks);
    const dropping = puff || at || told ? null : this.dropsBy(id, hour, day, talks);
    const small = puff || at || dropping || told ? null : this.keeps.smallEvents.talk(id);
    const around = this.keeps.scene?.();
    const own =
      puff || at || dropping || small || told
        ? null
        : talkLine(id, {
            hearts: friends.hearts(id),
            day,
            hour,
            talks,
            said: today.said,
            scene: around ? { ...around, ...this.between(id, before) } : undefined,
            opened: before.opened ?? [],
          });
    const said = told
      ? told.line
      : puff
        ? puffLine(id, day, talks)
        : (at?.line ?? dropping ?? small?.line ?? own!.line);
    this.talks.set(id, { day, count: talks + 1, said: [...today.said, said] });
    if (own) this.remember(id, before, own.topic, own.opener);
    if (puff) this.puffed = { id, until: now + PUFF_MS };
    const say = (text: string) => fill(text, { name: this.name, years: yearsMarried(day) });
    const chat: Chat = { line: say(said), bonus, puff };
    const treat = talks === 0 ? this.treat(id, day) : null;
    if (treat) chat.gift = treat;
    if (at?.gift) chat.gift = at.gift;
    if (small?.candy) chat.candy = small.candy;
    // Her voice (V1's P2): the rest of a moment, and what she can say back to it, to their
    // question, or to a line on a topic she can answer.
    if (told?.more.length) chat.more = told.more.map(say);
    if (told?.gift) chat.gift = told.gift;
    const replies = told?.replies ?? (own ? repliesTo(id, own.topic) : []);
    if (replies.length > 0) {
      this.pending = { id, replies };
      chat.replies = replies.map((r) => say(r.say));
      if (told) chat.asked = true;
    }
    const story = isHusband(id) && this.keeps.married?.hasToTell() === true;
    if (!told && (story || this.hasToTell(id, day))) chat.waiting = true;
    // How they feel saying it (V1's L7): the row's feeling, or one worked out from the line.
    const kind: LineKind = told
      ? (told.kind ?? 'question')
      : puff
        ? 'puff'
        : at
          ? 'happening'
          : dropping
            ? 'dropBy'
            : small
              ? 'small'
              : own?.topic
                ? 'topic'
                : 'pool';
    const moodAt = (k: number) =>
      told?.moods && k < told.moods.length ? told.moods[k] : undefined;
    chat.feels = this.feelingFor(id, kind, chat.line, { topic: own?.topic, mood: moodAt(0) });
    if (chat.more) {
      chat.moreFeels = chat.more.map((l, k) =>
        this.feelingFor(id, kind, l, { mood: moodAt(k + 1) }),
      );
    }
    this.feel(id, chat.feels);
    return chat;
  }

  /**
   * What she says back (V1's P2): the `k`th of the chips on their last line, and what they say to
   * it. Her answer to their question is kept. Null if there's nothing to answer.
   */
  reply(id: VillagerId, k: number): Chat | null {
    const answering = this.pending?.id === id ? this.pending.replies[k] : undefined;
    if (!answering) return null;
    this.pending = null;
    if (answering.answer) this.keeps.friends.update(id, { answered: answering.answer });
    if (answering.herDay) this.keeps.married?.answered(answering.herDay);
    // A chip that's a feeling shows on her face as she says it (V1's L7).
    const hers = herFeeling(answering.say, answering.feels);
    if (hers) this.ctx.signals.emit('felt', { feeling: hers });
    const day = dayKey(this.ctx.clock.now());
    const line = fill(answering.back, { name: this.name, years: yearsMarried(day) });
    const feels = this.feelingFor(id, 'reply', line, { mood: answering.mood });
    this.feel(id, feels);
    return { line, bonus: false, puff: false, feels };
  }

  /**
   * A heart moment a neighbour has to tell her (V1's P2), the next of theirs she has reached, one a
   * day; or else their question, until she answers it, asked once a day. Telling a moment keeps it
   * told, and hands her whatever comes with it.
   */
  private tell(id: VillagerId, day: string): Told | null {
    const { friends, bag } = this.keeps;
    const friendship = friends.of(id);
    const seen = friendship.moments ?? [];
    const moment = this.told.get(id) === day ? null : momentDue(id, friends.hearts(id), seen);
    if (moment) {
      this.told.set(id, day);
      friends.update(id, { moments: [...seen, moment.hearts] });
      if (moment.gift) {
        bag.add(moment.gift, 1);
        this.ctx.events.emit('bag', bag.contents);
      }
      const [line, ...more] = moment.lines;
      const told: Told = { line: line!, more, replies: moment.replies ?? [], kind: 'moment' };
      if (moment.gift) told.gift = moment.gift;
      if (moment.moods) told.moods = moment.moods;
      return told;
    }
    const asking =
      this.asked.get(id) === day ? null : questionDue(id, friends.hearts(id), friendship.answered);
    if (!asking) return null;
    this.asked.set(id, day);
    const replies = asking.answers.map((a) => ({ say: a.say, back: a.back, answer: a.id }));
    return { line: asking.ask, more: [], replies };
  }

  /** Whether a neighbour has a moment to tell her or a question to ask on her next talk today. */
  private hasToTell(id: VillagerId, day: string): boolean {
    const { friends } = this.keeps;
    const f = friends.of(id);
    const hearts = friends.hearts(id);
    const moment = this.told.get(id) !== day && momentDue(id, hearts, f.moments ?? []) !== null;
    return moment || (this.asked.get(id) !== day && questionDue(id, hearts, f.answered) !== null);
  }

  /** A best friend's letter now and then (V1's P2), looked for the first time a day is stepped. */
  check(): void {
    const day = dayKey(this.ctx.clock.now());
    if (day === this.wroteOn) return;
    this.wroteOn = day;
    const { friends, mailbox } = this.keeps;
    for (const id of VILLAGER_IDS) {
      if (friends.hearts(id) >= BEST_HEARTS && writesOn(id, day)) {
        mailbox.post(bestLetterId(id, day), day);
      }
    }
  }

  /**
   * What's between her and a neighbour as she talks to them (V1's P1), from their friendship as it
   * was before this talk: the last gift and its day, the last talk before today, a band reached
   * since they last spoke to her, and the bracelet of hers they wear.
   */
  private between(id: VillagerId, before: Friendship): Between {
    const { gave, gifted, talked, spoke, wears } = before;
    const hearts = this.keeps.friends.hearts(id);
    return {
      gave: gave && gifted ? { item: gave, day: gifted } : null,
      talked,
      reached: bandReached(spoke, hearts, id),
      wears: wears ?? null,
      band: bandOf(hearts, id),
      answer: answerSaid(id, before.answered),
    };
  }

  /**
   * What a neighbour keeps of a talk (V1's P1): the line they opened the day with, and how close
   * they were, once a band reached has been said (or there wasn't one), so it's said just once.
   */
  private remember(
    id: VillagerId,
    before: Friendship,
    topic: string | null,
    opener: number | null,
  ): void {
    const { friends } = this.keeps;
    const hearts = friends.hearts(id);
    const change: Partial<Friendship> = {};
    if (opener !== null) change.opened = [...(before.opened ?? []), opener].slice(-OPENERS_KEPT);
    if (topic === 'band' || bandReached(before.spoke, hearts, id) === null) change.spoke = hearts;
    friends.update(id, change);
  }

  /**
   * What a neighbour hands her with their holiday line (phase U): a treat on Halloween, once each,
   * whoever she talks to. Null on any other day, or once she has theirs.
   */
  private treat(id: VillagerId, day: string): ItemId | null {
    const holiday = holidayOn(day);
    const treat =
      holiday && dayLine(id, day)
        ? (HOLIDAY_TREATS[holiday] ?? HOLIDAY_GIFTS[holiday]?.[id])
        : undefined;
    const { bag, takings } = this.keeps;
    const key = `treat:${id}`;
    if (!treat || !takings.isReady(key)) return null;
    takings.take(key);
    bag.add(treat, 1);
    this.ctx.events.emit('bag', bag.contents);
    return treat;
  }

  /**
   * What a neighbour says the first time she talks to them at one of their happenings, unless the
   * day's own line comes first, and what the host hands her, once.
   */
  private atHappening(
    id: VillagerId,
    hour: number,
    day: string,
    talks: number,
  ): { line: string; gift?: ItemId } | null {
    if (talks === 0 && dayLine(id, day)) return null;
    const happening = happeningOf(id, hour, day);
    // What she did there last time, remembered (V1's P4), before their usual welcome.
    const recalled = happening ? this.keeps.recall?.(happening, id) : null;
    const line = happening && (recalled ?? HAPPENINGS[happening].says[id]);
    if (!happening || !line) return null;
    const key = `${happening}:${day}`;
    if (this.heard.get(id) === key) return null;
    this.heard.set(id, key);
    const { gift, who } = HAPPENINGS[happening];
    const { bag, takings } = this.keeps;
    const taking = `happening:${happening}`;
    if (!gift || who[0] !== id || !takings.isReady(taking)) return { line };
    takings.take(taking);
    bag.add(gift, 1);
    this.ctx.events.emit('bag', bag.contents);
    return { line, gift };
  }

  /**
   * What a neighbour says first when she finds them visiting her at home, once a visit, unless
   * the day's own line comes first.
   */
  private dropsBy(id: VillagerId, hour: number, day: string, talks: number): string | null {
    // A best friend who called by choice says so (V1's P2).
    if (callNow(id, this.keeps.friends.hearts(id), hour, day)) {
      if (talks === 0 && dayLine(id, day)) return null;
      const key = `${day}@call`;
      if (this.heard.get(id) === key) return null;
      this.heard.set(id, key);
      return BEST_CALLS[id] ?? null;
    }
    const visit = visitOf(id, hour, day);
    const where = whereabouts(id, hour, day);
    if (!visit || !('host' in where) || where.host !== 'her') return null;
    if (talks === 0 && dayLine(id, day)) return null;
    const key = `${day}@${visit.from}`;
    if (this.heard.get(id) === key) return null;
    this.heard.set(id, key);
    return VILLAGERS[id].dropsBy;
  }

  /**
   * Gives a neighbour something from her bag. Only the first gift of the day counts; a second is
   * politely turned down, and stays in her bag. Null if she hasn't got it.
   */
  give(id: VillagerId, item: ItemId): GiftResult | null {
    const { bag, friends } = this.keeps;
    if (bag.spare(item) === 0 || isKept(item)) return null;
    const day = dayKey(this.ctx.clock.now());
    if (friends.of(id).gifted === day) {
      const feels = giftFeeling(null);
      this.feel(id, feels);
      return { declined: true, line: fill(declineLine(id), { name: this.name }), feels };
    }
    bag.remove(item);
    this.ctx.events.emit('bag', bag.contents);
    const reaction = reactionTo(id, item);
    const wears = isBracelet(item) ? { wears: item } : {};
    // On their birthday a gift counts double (V1's P4).
    const birthday = isBirthday(id, day);
    const points = GIFT_POINTS[reaction] * (birthday ? BIRTHDAY_GIFT_TIMES : 1);
    this.befriend(id, points, { gifted: day, gave: item, ...wears });
    if (reaction === 'loved') this.ctx.signals.emit('thrilled', { by: 'gift' });
    this.ctx.moments.push({ kind: 'gave', villager: id, item, reaction });
    const line = fill(giftLine(id, item), { name: this.name });
    // A loved gift makes them laugh for joy, on their face and their bust alike (V1's L7).
    const feels = giftFeeling(reaction);
    this.feel(id, feels);
    return {
      declined: false,
      reaction,
      line,
      feels,
      ...(birthday ? { birthday: true as const } : {}),
    };
  }

  /** What a neighbour has to ask of her today, until she's done it. */
  favour(id: VillagerId): Favour | null {
    const day = dayKey(this.ctx.clock.now());
    if (this.keeps.friends.of(id).favour === day) return null;
    return favourOf(id, day);
  }

  /**
   * Hands over what a neighbour asked for, and takes their thanks and some Candy. Null if they
   * asked nothing today or she hasn't enough of it.
   */
  doFavour(id: VillagerId): { line: string; candy: number; feels: Feeling | null } | null {
    const favour = this.favour(id);
    const { bag, wallet } = this.keeps;
    if (!favour || !bag.remove(favour.item, favour.count)) return null;
    const candy = favourCandy(favour);
    this.ctx.events.emit('bag', bag.contents);
    wallet.earn(candy);
    this.befriend(id, FAVOUR_POINTS, { favour: dayKey(this.ctx.clock.now()) });
    const line = fill(VILLAGERS[id].thanks, { name: this.name });
    const feels = this.feelingFor(id, 'favour', line);
    this.feel(id, feels);
    return { line, candy, feels };
  }

  /** A little more friendship for something done for them away from a talk: a note answered. */
  thank(id: VillagerId, points: number): void {
    this.befriend(id, points, {});
  }

  /** Adds to a friendship, and posts a letter for each milestone it passes. */
  private befriend(id: VillagerId, points: number, change: Parameters<Friends['update']>[1]): void {
    const { friends, mailbox } = this.keeps;
    const before = friends.of(id).points;
    friends.update(id, { ...change, points: before + points });
    const day = dayKey(this.ctx.clock.now());
    for (const reward of rewardsBetween(id, before, friends.of(id).points)) {
      mailbox.post(`${id}:${reward.hearts}`, day);
    }
    this.ctx.events.emit('friends', friends);
  }
}

/**
 * Something she can say back, and what's kept if it's her answer to their question, or to her
 * husband's "how was your day?" (V1's P5).
 */
export type Answering = Reply & { answer?: string; herDay?: HerDayAnswer };

/** A heart moment or a question, told on a talk (V1's P2), or one of Cody's (V1's P5). */
export interface Told {
  line: string;
  more: string[];
  replies: readonly Answering[];
  gift?: ItemId;
  /** A heart moment or a question (V1's L7), for how it's said; a question if not said. */
  kind?: 'moment' | 'question';
  /** How each line is said, where the row says (V1's L7). */
  moods?: readonly (Feeling | null)[];
}
