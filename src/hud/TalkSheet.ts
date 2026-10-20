import { isKept, ITEMS } from '../data/items';
import { CODY_COMEBACKS, HER_REPLY, VILLAGERS, type Favour } from '../data/villagers';
import type { Glyph } from '../data/glyphs';
import { MAX_HEARTS } from '../systems/friendship';
import { feelingOf } from '../systems/moods';
import { bandOf } from '../systems/remembering';
import type { Feeling } from '../types/mood';
import type { ItemId, VillagerId } from '../types/ids';
import type { Stack } from '../world/Bag';
import type { Chat, GiftResult } from '../world/World';
import { fitIcon, SLOT_ICON } from './collection';
import { button, el, openSheet } from './dom';
import { glyph, glyphed } from './glyph';
import { heartsRow } from './hearts';
import { asked, candy, quantity } from './messages';

/** What the talk sheet may ask of the game. Like the others, it never reaches the world directly. */
export interface TalkApi {
  hearts(id: VillagerId): number;
  talk(id: VillagerId): Chat;
  /** What she says back, by her chip's place on their last line (V1's P2), and their answer. */
  reply(id: VillagerId, k: number): Chat | null;
  bag(): readonly Stack[];
  give(id: VillagerId, item: ItemId): GiftResult | null;
  /** What they'd like her to bring today, until she has. */
  favour(id: VillagerId): Favour | null;
  doFavour(id: VillagerId): { line: string; candy: number; feels?: Feeling | null } | null;
  /** She's said goodbye. */
  endTalk(): void;
  icon(canvas: HTMLCanvasElement, id: ItemId): void;
  /** Draws a neighbour's head and shoulders, feeling as they do about a line (V1's L7). */
  portrait(canvas: HTMLCanvasElement, id: VillagerId, feel?: Feeling | null): void;
  /**
   * How they feel about the line she's reading (V1's L7), for their face in the world to match
   * their bust's.
   */
  feel?(id: VillagerId, feel: Feeling | null): void;
  /** Draws the little red Tesla at 1×, for a greeting it drives across. */
  redOne(canvas: HTMLCanvasElement): void;
  /**
   * What else she can do with them just now (V1's P4, "where it hurts" 11): crown a costume, bake,
   * a lesson, their photo, a happening's verb. Asked afresh each time the buttons are drawn.
   */
  actions(id: VillagerId): readonly TalkAction[];
}

/** Something she can do with a neighbour as they talk, a button beside Chat (V1's P4). */
export interface TalkAction {
  /** On the button: "Bake together". */
  label: string;
  /** Beside it on the button (V1's L5). */
  glyph?: Glyph;
  /** Lit as the one to press. */
  lit?: boolean;
  /** Pressed: what comes of it, or null if it can't be done after all. */
  run(): TalkOutcome | null;
}

/** What comes of a talk action. */
export interface TalkOutcome {
  /** What's said, one line after another, "Go on…" between them. */
  lines: readonly string[];
  /** How each is said (V1's L7), where it isn't worked out from its words. */
  feels?: readonly (Feeling | null)[];
  /** Under the last line, unless a beat says something of its own. */
  aside?: string;
  /** As each line is shown, by its place: a scene's beat, which may say something under it. */
  beat?(k: number): string | void;
  /** What she can pick from after the last line, instead of the talk's buttons. */
  choices?: readonly TalkAction[];
  /** The talk is over (their photo). */
  close?: true;
}

/** Under their thanks: what she gave, and on their birthday that it counts double (V1's P4). */
function givenAside(given: GiftResult, what: string): string {
  if (given.declined) return '';
  return given.birthday
    ? `You gave ${what}. On their birthday, it means twice as much!`
    : `You gave ${what}.`;
}

/** Their portrait, name and kind, for the head of a sheet that's them talking. */
function speaker(id: VillagerId, portrait: TalkApi['portrait'], feel: Feeling | null = null) {
  const picture = el('canvas', { className: 'hud-portrait' });
  portrait(picture, id, feel);
  const row = VILLAGERS[id];
  return { picture, title: row.name, line: `The ${row.creature}` };
}

/**
 * Talking to a neighbour: what they say, how close they are, and what she can do: chat some more,
 * give them something from her bag, or bring what they asked for. After Cody lets one go, she can
 * tell him exactly what she thinks of that.
 */
export function openTalk(hud: HTMLElement, api: TalkApi, id: VillagerId): () => void {
  const head = speaker(id, api.portrait);
  const sheet = openSheet(hud, {
    ...head,
    className: 'hud-talk-sheet',
    onClose: () => api.endTalk(),
    done: null,
  });
  // The face on their bust, as they feel about the line shown (V1's L7), redrawn as it changes.
  let shownFeel: Feeling | null = null;
  const feel = (f: Feeling | null) => {
    api.feel?.(id, f);
    if (f === shownFeel) return;
    shownFeel = f;
    api.portrait(head.picture, id, f);
    head.picture.dataset['feel'] = f ?? 'neutral';
  };
  /** How a line with no feeling of its own is said: from its words, and how close they are. */
  const worked = (text: string) =>
    feelingOf({ kind: 'action', text, band: bandOf(api.hearts(id), id) });
  const close = sheet.close;
  const hearts = el('p', { className: 'hud-hearts' });
  const speech = el('p', { className: 'hud-speech' });
  const note = el('p', { className: 'hud-message' });
  const gifts = el('div', { className: 'hud-bag' });
  gifts.hidden = true;
  let comeback = 0;
  // The hearts shown last, so one won while they talk pops in (V1's L5).
  let shownHearts = api.hearts(id);

  const say = (line: string, aside = '', feels?: Feeling | null) => {
    feel(feels === undefined ? worked(line) : feels);
    speech.textContent = line;
    note.textContent = aside;
    const now = api.hearts(id);
    hearts.replaceChildren(...heartsRow(now, shownHearts));
    shownHearts = now;
    hearts.setAttribute('aria-label', `${now} hearts of ${MAX_HEARTS}`);
  };

  /**
   * What's said under a line: a present handed over, that they're glad she stopped by, or that
   * they've something to tell her if she stays to chat (V1's P2).
   */
  const asideTo = (said: Chat): string => {
    const name = VILLAGERS[id].name;
    if (said.gift) return `${name} gave you ${asked(said.gift, 1)}.`;
    if (said.candy) return `${name} gave you ${candy(said.candy)}.`;
    if (said.waiting) return `${name} has something to tell you.`;
    return said.bonus ? `${name} is glad you stopped by.` : '';
  };

  /**
   * Shows what they said (V1's P2): a heart moment's lines one after another, then what she can
   * say back to the last of them, if anything, or the talk's buttons.
   */
  const show = (said: Chat) => {
    const lines = [said.line, ...(said.more ?? [])];
    const feels = [said.feels, ...(said.moreFeels ?? [])];
    let at = 0;
    const next = () => {
      say(lines[at]!, at === 0 ? asideTo(said) : '', feels[at]);
      if (++at < lines.length) {
        sheet.actions(button('Go on…', next, true));
        return;
      }
      const chips = chipsFor(said.replies ?? []);
      // A question waits for her answer (or a goodbye); a line she may answer leaves the rest.
      if (said.asked && chips.length > 0) sheet.actions(...chips, button('Bye', close));
      else render(said.puff, said.waiting, chips);
    };
    next();
  };

  /** Her chips (V1's P2), where the talk's buttons are: one picked, they answer. */
  const chipsFor = (replies: readonly string[]): HTMLElement[] =>
    replies.map((text, k) => {
      const chip = button(text, () => {
        const back = api.reply(id, k);
        if (back) say(back.line, '', back.feels);
        render();
      });
      chip.classList.add('hud-reply');
      return chip;
    });

  const chat = () => show(api.talk(id));

  /** A talk action's button (V1's P4): pressed, its lines one after another, then its picks. */
  const actionButton = (action: TalkAction): HTMLElement => {
    const pressed = button(
      action.label,
      () => {
        const outcome = action.run();
        if (!outcome) return render();
        if (outcome.close) return close();
        play(outcome);
      },
      action.lit ?? true,
    );
    if (action.glyph) pressed.prepend(glyph(action.glyph), ' ');
    return pressed;
  };

  const play = (outcome: TalkOutcome) => {
    const { lines } = outcome;
    let at = 0;
    // After the last line, her picks if there are any, or the talk's buttons again.
    const finish = () => {
      const picks = (outcome.choices ?? []).map((c) => {
        const chip = actionButton(c);
        chip.classList.add('hud-reply');
        return chip;
      });
      if (picks.length > 0)
        sheet.actions(
          ...picks,
          button('Never mind', () => render()),
        );
      else render();
    };
    const next = () => {
      const last = at === lines.length - 1;
      const aside = outcome.beat?.(at);
      const under = typeof aside === 'string' ? aside : last ? (outcome.aside ?? '') : '';
      say(lines[at]!, under, outcome.feels?.[at]);
      if (++at < lines.length) sheet.actions(button('Go on…', next, true));
      else finish();
    };
    if (lines.length > 0) next();
    else finish();
  };

  const render = (puffed = false, waiting = false, chips: readonly HTMLElement[] = []) => {
    gifts.hidden = true;
    const row: HTMLElement[] = [...chips];
    // Her catchphrase is for Cody; anyone else's puff is let pass politely.
    if (puffed && id === 'cody') {
      row.push(
        button(
          HER_REPLY,
          () => {
            say(CODY_COMEBACKS[comeback++ % CODY_COMEBACKS.length]!);
            render();
          },
          true,
        ),
      );
    }
    const favour = api.favour(id);
    if (favour) {
      const have = api.bag().find((s) => s.id === favour.item)?.count ?? 0;
      const what = quantity(favour.item, favour.count);
      const hand = button(
        have >= favour.count ? `Here's ${what}!` : `Bring ${what}`,
        () => {
          const done = api.doFavour(id);
          if (done)
            say(done.line, `${VILLAGERS[id].name} gave you ${candy(done.candy)}.`, done.feels);
          render();
        },
        have >= favour.count,
      );
      hand.disabled = have < favour.count;
      row.push(hand);
    }
    for (const action of api.actions(id)) row.push(actionButton(action));
    // With a story waiting (V1's P2), Chat is the one to press.
    row.push(button('Chat', chat, waiting), button('Give a gift', pickGift), button('Bye', close));
    sheet.actions(...row);
  };

  const pickGift = () => {
    // Fibi's bones are hers, for her to have back.
    const stacks = api.bag().filter((s) => !isKept(s.id));
    if (stacks.length === 0) {
      note.textContent = 'Your bag is empty! Gather something, then come back.';
      return;
    }
    gifts.replaceChildren(
      ...stacks.map((stack) => {
        const icon = el('canvas', { className: 'hud-icon' });
        api.icon(icon, stack.id);
        fitIcon(icon, SLOT_ICON);
        const b = el('button', { type: 'button', className: 'hud-slot' }, icon);
        b.setAttribute('aria-label', `Give ${ITEMS[stack.id].name}`);
        if (stack.count > 1) b.append(el('span', { className: 'hud-count' }, String(stack.count)));
        b.addEventListener('click', () => {
          const given = api.give(id, stack.id);
          if (given) say(given.line, givenAside(given, ITEMS[stack.id].name), given.feels);
          render();
        });
        return b;
      }),
    );
    gifts.hidden = false;
    note.textContent = 'What would you like to give?';
    sheet.actions(button('Never mind', () => render()));
  };

  sheet.body.append(hearts, speech, note, gifts);
  const favour = api.favour(id);
  const first = api.talk(id);
  show(first);
  if (favour && !first.puff && !first.more && !first.replies) {
    speech.textContent += ` ${favour.ask.replace('{what}', quantity(favour.item, favour.count))}`;
  }
  return close;
}

/** A neighbour's greeting as she opens the game, and what her visit brought. */
export interface GreetingCard {
  from: VillagerId;
  line: string;
  /** How she answers, on the button. */
  reply: string;
  /** Today's visit and its gift, under the line. */
  gift?: string;
  /** Said once she has answered: getting him first. */
  after?: string;
  /** The red Tesla drives across the card (personal_touches.md, "Version 0.1"). */
  redOne?: boolean;
  /** What follows once she has answered, when nothing else has come up (V1's R1: her first day's list). */
  then?: () => void;
  /** A gentle word about keeping the town safe, under the rest (V1's S3). */
  nudge?: string;
  /** Their face on the card as they say it (1.0.1); as usual if none. */
  feel?: Feeling | null;
}

/**
 * One thing a neighbour says, with a button to answer: Cody's welcome back, say. `answered` is told
 * what to say after, once the card goes.
 */
export function openGreeting(
  hud: HTMLElement,
  api: Pick<TalkApi, 'portrait' | 'redOne'>,
  card: GreetingCard,
  answered: (after: string) => void,
): () => void {
  const { body, close } = openSheet(hud, {
    ...speaker(card.from, api.portrait, card.feel ?? null),
    className: 'hud-talk-sheet',
    done: card.reply,
    onClose: () => {
      if (card.after) answered(card.after);
      // After the sheet has gone, so whatever opens next isn't opened inside its closing.
      if (card.then) setTimeout(card.then, 0);
    },
  });
  if (card.redOne) {
    const car = el('canvas', { className: 'hud-red-one' });
    api.redOne(car);
    body.append(el('div', { className: 'hud-road' }, car));
  }
  body.append(el('p', { className: 'hud-speech', textContent: card.line }));
  if (card.gift) {
    body.append(el('p', { className: 'hud-gift' }, glyphed({ mark: 'earlyBirthday' }, card.gift)));
  }
  if (card.nudge) body.append(el('p', { className: 'hud-nudge', textContent: card.nudge }));
  return close;
}
