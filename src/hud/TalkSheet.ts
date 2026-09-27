import { ITEMS } from '../data/items';
import { CODY_COMEBACKS, HER_REPLY, VILLAGERS, type Favour } from '../data/villagers';
import { MAX_HEARTS } from '../systems/friendship';
import type { ItemId, VillagerId } from '../types/ids';
import type { Stack } from '../world/Bag';
import type { Chat, GiftResult } from '../world/World';
import { el, openSheet } from './dom';
import { candy, quantity } from './messages';

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
  const { sheet, close } = openSheet(hud, {
    className: 'hud-talk-sheet',
    onClose: () => api.endTalk(),
  });
  const hearts = el('p', { className: 'hud-hearts' });
  const speech = el('p', { className: 'hud-speech' });
  const note = el('p', { className: 'hud-message' });
  const actions = el('div', { className: 'hud-row' });
  const gifts = el('div', { className: 'hud-bag' });
  gifts.hidden = true;
  let comeback = 0;

  const say = (line: string, aside = '') => {
    speech.textContent = line;
    note.textContent = aside;
    hearts.textContent = heartsRow(api.hearts(id));
    hearts.setAttribute('aria-label', `${api.hearts(id)} hearts of ${MAX_HEARTS}`);
  };

  const button = (text: string, onClick: () => void, primary = false) => {
    const b = el('button', { type: 'button', textContent: text });
    if (primary) b.className = 'hud-primary';
    b.addEventListener('click', onClick);
    return b;
  };

  const chat = () => {
    const said = api.talk(id);
    say(said.line, said.bonus ? `${VILLAGERS[id].name} is glad you stopped by.` : '');
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
    actions.replaceChildren(...row);
  };

  const pickGift = () => {
    // Fibi's bones are hers, for her to have back.
    const stacks = api.bag().filter((s) => s.id !== 'fibisBone');
    if (stacks.length === 0) {
      note.textContent = 'Your bag is empty! Gather something, then come back.';
      return;
    }
    gifts.replaceChildren(
      ...stacks.map((stack) => {
        const icon = el('canvas', { className: 'hud-item' });
        api.icon(icon, stack.id);
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
    actions.replaceChildren(button('Never mind', () => render()));
  };

  sheet.append(head(id, api.portrait), hearts, speech, note, gifts, actions);
  const favour = api.favour(id);
  const first = api.talk(id);
  say(first.line, first.bonus ? `${VILLAGERS[id].name} is glad you stopped by.` : '');
  if (favour && !first.puff) {
    speech.textContent += ` ${favour.ask.replace('{what}', quantity(favour.item, favour.count))}`;
  }
  render(first.puff);
  return close;
}

/** One thing a neighbour says, with a button to answer: Cody's welcome back, say. */
export function openGreeting(
  hud: HTMLElement,
  api: Pick<TalkApi, 'portrait'>,
  id: VillagerId,
  line: string,
  reply: string,
): () => void {
  const { sheet, close } = openSheet(hud, { className: 'hud-talk-sheet' });
  const ok = el('button', { type: 'button', className: 'hud-primary', textContent: reply });
  ok.addEventListener('click', close);
  sheet.append(
    head(id, api.portrait),
    el('p', { className: 'hud-speech', textContent: line }),
    el('div', { className: 'hud-row' }, ok),
  );
  return close;
}
