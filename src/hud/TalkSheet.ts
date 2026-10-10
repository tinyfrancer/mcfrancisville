import { TUNES, type TuneId } from '../data/instruments';
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
  /** What she says back, by her chip's place on their last line (V1's P2), and their answer. */
  reply(id: VillagerId, k: number): Chat | null;
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
  /** At the Halloween finale (0.2's J4): whether she can crown them best costume, and doing it. */
  canCrown(id: VillagerId): boolean;
  crown(id: VillagerId): { line: string; aside: string } | null;
  /** At Crumbs & Curios (0.2's E1): whether she can bake with them today, and doing it. */
  canBake(id: VillagerId): boolean;
  bake(id: VillagerId): { line: string; item: ItemId; count: number; candy: number } | null;
  /** In his parlour (0.2's L2): whether Boothoven can give her a piano lesson today, and having it. */
  canLearn(id: VillagerId): boolean;
  learn(id: VillagerId): { line: string; tune: TuneId } | null;
  /** Whether Cody's there for their photo, and taking it, which closes the talk. */
  canPhoto(id: VillagerId): boolean;
  photo(): void;
}

/** "♥♥♥♡♡♡♡♡♡♡": how close they are, out of ten. */
export function heartsRow(hearts: number): string {
  return '♥'.repeat(hearts) + '♡'.repeat(MAX_HEARTS - hearts);
}

/** Their portrait, name and kind, for the head of a sheet that's them talking. */
function speaker(id: VillagerId, portrait: TalkApi['portrait']) {
  const picture = el('canvas', { className: 'hud-portrait' });
  portrait(picture, id);
  const row = VILLAGERS[id];
  return { picture, title: row.name, line: `The ${row.creature}` };
}

/**
 * Talking to a neighbour: what they say, how close they are, and what she can do: chat some more,
 * give them something from her bag, or bring what they asked for. After Cody lets one go, she can
 * tell him exactly what she thinks of that.
 */
export function openTalk(hud: HTMLElement, api: TalkApi, id: VillagerId): () => void {
  const sheet = openSheet(hud, {
    ...speaker(id, api.portrait),
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
    let at = 0;
    const next = () => {
      say(lines[at]!, at === 0 ? asideTo(said) : '');
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
        if (back) say(back.line);
        render();
      });
      chip.classList.add('hud-reply');
      return chip;
    });

  const chat = () => show(api.talk(id));

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
          if (done) say(done.line, `${VILLAGERS[id].name} gave you ${candy(done.candy)}.`);
          render();
        },
        have >= favour.count,
      );
      hand.disabled = have < favour.count;
      row.push(hand);
    }
    if (api.canBake(id)) {
      row.push(
        button(
          '🧁 Bake together',
          () => {
            const baked = api.bake(id);
            if (baked) {
              const home = quantity(baked.item, baked.count);
              const paid = `${VILLAGERS[id].name} paid you ${candy(baked.candy)}`;
              say(baked.line, `${paid}, and sent you home with ${home}.`);
            }
            render();
          },
          true,
        ),
      );
    }
    if (api.canLearn(id)) {
      row.push(
        button(
          '🎹 A lesson',
          () => {
            const learnt = api.learn(id);
            if (learnt) {
              const name = TUNES[learnt.tune].name;
              say(learnt.line, `You learnt "${name}". Every piano you play knows it now.`);
            }
            render();
          },
          true,
        ),
      );
    }
    if (api.canCrown(id)) {
      row.push(
        button(
          '👑 Best costume!',
          () => {
            const crowned = api.crown(id);
            if (crowned) say(crowned.line, crowned.aside);
            render();
          },
          true,
        ),
      );
    }
    if (api.canPhoto(id)) {
      row.push(
        button(
          '📸 Our photo',
          () => {
            close();
            api.photo();
          },
          true,
        ),
      );
    }
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
    ...speaker(card.from, api.portrait),
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
