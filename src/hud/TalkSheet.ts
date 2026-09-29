import { isKept, ITEMS } from '../data/items';
import { CODY_COMEBACKS, HER_REPLY, VILLAGERS, type Favour } from '../data/villagers';
import { MAX_HEARTS } from '../systems/friendship';
import type { ItemId, VillagerId } from '../types/ids';
import type { Stack } from '../world/Bag';
import type { Chat, GiftResult } from '../world/World';
import { fitIcon, SLOT_ICON } from './collection';
import { button, el, openSheet } from './dom';
import { asked, candy, quantity } from './messages';

/** What the talk sheet may ask of the game. Like the others, it never reaches the world directly. */
export interface TalkApi {
  hearts(id: VillagerId): number;
  talk(id: VillagerId): Chat;
  bag(): readonly Stack[];
  give(id: VillagerId, item: ItemId): GiftResult | null;
  /** What they'd like her to bring today, until she has. */
  favour(id: VillagerId): Favour | null;
  doFavour(id: VillagerId): { line: string; candy: number } | null;
  /** She's said goodbye. */
  endTalk(): void;
  icon(canvas: HTMLCanvasElement, id: ItemId): void;
  /** Draws a neighbour's head and shoulders at 1×. */
  portrait(canvas: HTMLCanvasElement, id: VillagerId): void;
  /** Draws the little red Tesla at 1×, for a greeting it drives across. */
  redOne(canvas: HTMLCanvasElement): void;
}

/** "♥♥♥♡♡♡♡♡♡♡": how close they are, out of ten. */
export function heartsRow(hearts: number): string {
  return '♥'.repeat(hearts) + '♡'.repeat(MAX_HEARTS - hearts);
}

function head(id: VillagerId, portrait: TalkApi['portrait']): HTMLElement {
  const canvas = el('canvas', { className: 'hud-portrait' });
  portrait(canvas, id);
  const row = VILLAGERS[id];
  return el(
    'div',
    { className: 'hud-talk-head' },
    canvas,
    el('div', {}, el('h2', {}, row.name), el('small', {}, `The ${row.creature}`)),
  );
}

/**
 * Talking to a neighbour: what they say, how close they are, and what she can do: chat some more,
 * give them something from her bag, or bring what they asked for. After Cody lets one go, she can
 * tell him exactly what she thinks of that.
 */
export function openTalk(hud: HTMLElement, api: TalkApi, id: VillagerId): () => void {
  const sheet = openSheet(hud, {
    head: head(id, api.portrait),
    className: 'hud-talk-sheet',
    onClose: () => api.endTalk(),
    done: null,
  });
  const close = sheet.close;
  const hearts = el('p', { className: 'hud-hearts' });
  const speech = el('p', { className: 'hud-speech' });
  const note = el('p', { className: 'hud-message' });
  const gifts = el('div', { className: 'hud-bag' });
  gifts.hidden = true;
  let comeback = 0;

  const say = (line: string, aside = '') => {
    speech.textContent = line;
    note.textContent = aside;
    hearts.textContent = heartsRow(api.hearts(id));
    hearts.setAttribute('aria-label', `${api.hearts(id)} hearts of ${MAX_HEARTS}`);
  };

  /** What's said under a line: a present handed over, or that they're glad she stopped by. */
  const asideTo = (said: Chat): string => {
    const name = VILLAGERS[id].name;
    if (said.gift) return `${name} gave you ${asked(said.gift, 1)}.`;
    return said.bonus ? `${name} is glad you stopped by.` : '';
  };

  const chat = () => {
    const said = api.talk(id);
    say(said.line, asideTo(said));
    render(said.puff);
  };

  const render = (puffed = false) => {
    gifts.hidden = true;
    const row: HTMLElement[] = [];
    if (puffed) {
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
          if (done) say(done.line, `${VILLAGERS[id].name} gave you ${candy(done.candy)}.`);
          render();
        },
        have >= favour.count,
      );
      hand.disabled = have < favour.count;
      row.push(hand);
    }
    row.push(button('Chat', chat), button('Give a gift', pickGift), button('Bye', close));
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
          if (given) say(given.line, given.declined ? '' : `You gave ${ITEMS[stack.id].name}.`);
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
  say(first.line, asideTo(first));
  if (favour && !first.puff) {
    speech.textContent += ` ${favour.ask.replace('{what}', quantity(favour.item, favour.count))}`;
  }
  render(first.puff);
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
    head: head(card.from, api.portrait),
    className: 'hud-talk-sheet',
    done: card.reply,
    onClose: () => {
      if (card.after) answered(card.after);
    },
  });
  if (card.redOne) {
    const car = el('canvas', { className: 'hud-red-one' });
    api.redOne(car);
    body.append(el('div', { className: 'hud-road' }, car));
  }
  body.append(el('p', { className: 'hud-speech', textContent: card.line }));
  if (card.gift) body.append(el('p', { className: 'hud-gift', textContent: `🎁 ${card.gift}` }));
  return close;
}
