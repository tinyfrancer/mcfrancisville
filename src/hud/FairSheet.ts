import { ACTIVITIES, type ActivityId, type Game } from '../data/activities';
import { ITEMS } from '../data/items';
import type { CritterId, ItemId } from '../types/ids';
import type { OnStall, Reading, Round, Won } from '../world/services/Activities';
import { fitIcon, ROW_ICON } from './collection';
import { button, el, openSheet, PICTURE } from './dom';
import { candy, quantity } from './messages';

/** What the fairground's sheets may ask of the game. Like the others, they never reach the world. */
export interface FairApi {
  candy(): number;
  round(id: ActivityId): Round | null;
  start(id: ActivityId): Round | null;
  toss(id: ActivityId, target: number): { landed: boolean; won: Won | null } | null;
  readToday(): boolean;
  readFortune(): Reading | null;
  menu(id: ActivityId): OnStall[];
  buy(id: ActivityId, item: ItemId): boolean;
  count(item: ItemId): number;
  icon(canvas: HTMLCanvasElement, id: ItemId | CritterId): void;
  /** Draws who reads her fortune: Agatha behind her ball, or the ball by itself. */
  reader(canvas: HTMLCanvasElement): void;
}

/** What each game throws at, as she sees it. */
const TARGET_FACE: Record<string, string> = { bottle: '🍾', ghost: '👻' };

/**
 * A stall at the Hollow Fairground, or the fortune table (0.2's M2): one small sheet on the frame
 * for each kind of thing to do there, a game of taps, a fortune, or a stall of snacks.
 */
export function openFair(hud: HTMLElement, api: FairApi, id: ActivityId): () => void {
  const row = ACTIVITIES[id];
  const does = row.does;
  if ('game' in does) return openGame(hud, api, id, does.game);
  if ('fortune' in does) return openFortune(hud, api);
  return openSnacks(hud, api, id);
}

const iconOf = (api: FairApi, item: ItemId | CritterId, box = ROW_ICON) => {
  const canvas = el('canvas', { className: 'hud-icon' });
  api.icon(canvas, item);
  fitIcon(canvas, box);
  return canvas;
};

function openGame(hud: HTMLElement, api: FairApi, id: ActivityId, game: Game['game']) {
  const row = ACTIVITIES[id];
  const top = game.prizes[game.prizes.length - 1]!;
  const sheet = openSheet(hud, {
    picture: iconOf(api, top, PICTURE),
    title: row.name,
    line: row.line,
    tabs: [
      { id: 'play', label: 'Play' },
      { id: 'prizes', label: 'Prizes' },
    ],
    className: 'hud-fair-sheet hud-game-sheet',
  });
  const play = sheet.panel('play');
  const message = el('p', { className: 'hud-message hud-fair-message' });
  let won: Won | null = null;

  const render = () => {
    const round = api.round(id);
    const targets = el('div', { className: 'hud-fair-targets' });
    for (let t = 0; t < game.targets; t++) {
      const glints = round !== null && round.glint === t;
      const b = el('button', {
        type: 'button',
        className: `hud-fair-target${glints ? ' hud-fair-glint' : ''}`,
        textContent: TARGET_FACE[game.at] ?? '⭐',
      });
      b.setAttribute('aria-label', `${game.at} ${t + 1}${glints ? ', glinting' : ''}`);
      b.disabled = round === null;
      b.addEventListener('click', () => {
        const tossed = api.toss(id, t);
        if (!tossed) return;
        won = tossed.won;
        message.textContent = tossed.landed
          ? `Clink! Your ${game.thrown} landed.`
          : `So close! Your ${game.thrown} bounced off.`;
        render();
      });
      targets.append(b);
    }
    const thrown = round?.throws ?? [];
    const tally = el(
      'p',
      { className: 'hud-fair-tally' },
      Array.from({ length: game.throws }, (_, i) =>
        i < thrown.length ? (thrown[i]!.landed ? '🟣' : '⚪') : '◌',
      ).join(' '),
    );
    const parts: (HTMLElement | string)[] = [targets, tally];
    if (round) {
      parts.push(
        el(
          'p',
          { className: 'hud-message' },
          `${game.thrown[0]!.toUpperCase()}${game.thrown.slice(1)} ${thrown.length + 1} of ${game.throws}. Tap a ${game.at}; the one that glints is a sure thing.`,
        ),
      );
    } else {
      if (won) {
        const prize = won;
        parts.push(
          el(
            'div',
            { className: 'hud-ware hud-fair-prize' },
            el('span', { className: 'hud-icon-box' }, iconOf(api, prize.item)),
            el(
              'span',
              { className: 'hud-ware-text' },
              el('strong', {}, prize.top ? `You won the ${ITEMS[prize.item].name}!` : 'A prize!'),
              el(
                'small',
                {},
                `${prize.landed} of ${game.throws} landed: ${quantity(prize.item, 1)}.`,
              ),
            ),
          ),
        );
      }
      const go = button(
        `${won ? 'Another go' : 'Have a go'} · ${candy(row.cost)}`,
        () => {
          won = null;
          if (!api.start(id))
            message.textContent = `A go is ${candy(row.cost)}. Come back with a little more!`;
          else message.textContent = '';
          render();
        },
        true,
      );
      go.classList.add('hud-fair-go');
      go.disabled = api.candy() < row.cost;
      parts.push(go);
    }
    play.replaceChildren(...parts, message);
  };

  sheet
    .panel('prizes')
    .append(
      el(
        'div',
        { className: 'hud-wares' },
        ...game.prizes.map((item, landed) =>
          el(
            'div',
            { className: 'hud-ware' },
            el('span', { className: 'hud-icon-box' }, iconOf(api, item)),
            el(
              'span',
              { className: 'hud-ware-text' },
              el('strong', {}, ITEMS[item].name),
              el(
                'small',
                {},
                landed === game.prizes.length - 1
                  ? `Every ${game.thrown} lands. Hers to keep!`
                  : landed === 0
                    ? 'For trying. Everybody wins something.'
                    : `${landed} ${game.thrown}${landed === 1 ? '' : 's'} land.`,
              ),
            ),
          ),
        ),
      ),
    );
  render();
  return sheet.close;
}

function openFortune(hud: HTMLElement, api: FairApi) {
  const row = ACTIVITIES.fortune;
  const picture = el('canvas', { className: 'hud-icon' });
  api.reader(picture);
  fitIcon(picture, PICTURE);
  const sheet = openSheet(hud, {
    picture,
    title: 'The fortune tent',
    line: row.line,
    className: 'hud-fair-sheet hud-fortune-sheet',
  });
  const show = (reading: Reading) => {
    sheet.line(reading.opening);
    sheet.body.replaceChildren(
      el('p', { className: 'hud-fortune' }, `“${reading.line}”`),
      reading.lucky
        ? el(
            'div',
            { className: 'hud-ware hud-lucky' },
            el('span', { className: 'hud-icon-box' }, iconOf(api, reading.lucky.critter)),
            el('span', { className: 'hud-ware-text' }, el('small', {}, reading.lucky.line)),
          )
        : el('p', { className: 'hud-fact' }, 'No critter shows in the ball today. A quiet one!'),
    );
    sheet.actions();
  };
  if (api.readToday()) {
    const reading = api.readFortune();
    if (reading) show(reading);
    return sheet.close;
  }
  const message = el('p', { className: 'hud-message' });
  sheet.body.append(
    el(
      'p',
      { className: 'hud-fact' },
      'One reading a day: the day ahead, and a critter to look for.',
    ),
    message,
  );
  const read = button(
    `Read my fortune · ${candy(row.cost)}`,
    () => {
      const reading = api.readFortune();
      if (reading) show(reading);
      else message.textContent = `A reading is ${candy(row.cost)}. The ball can wait!`;
    },
    true,
  );
  read.classList.add('hud-fortune-read');
  read.disabled = api.candy() < row.cost;
  sheet.actions(read);
  return sheet.close;
}

function openSnacks(hud: HTMLElement, api: FairApi, id: ActivityId) {
  const row = ACTIVITIES[id];
  const menu = api.menu(id);
  const sheet = openSheet(hud, {
    picture: iconOf(api, menu[0]!.item, PICTURE),
    title: row.name,
    line: row.line,
    className: 'hud-fair-sheet hud-snack-sheet',
  });
  const message = el('p', { className: 'hud-message' });
  const render = () => {
    const wares = api.menu(id).map(({ item, price }) => {
      const buy = el('button', {
        type: 'button',
        className: 'hud-price',
        textContent: candy(price),
      });
      buy.disabled = api.candy() < price;
      buy.addEventListener('click', () => {
        message.textContent = api.buy(id, item)
          ? `${ITEMS[item].name}, still warm. Eat it from your bag for a spring in your step!`
          : 'Not quite enough Candy for that one.';
        render();
      });
      const have = api.count(item);
      return el(
        'div',
        { className: 'hud-ware' },
        el('span', { className: 'hud-icon-box' }, iconOf(api, item)),
        el(
          'span',
          { className: 'hud-ware-text' },
          el('strong', {}, ITEMS[item].name),
          el(
            'small',
            {},
            have > 0 ? `${ITEMS[item].description} You have ${have}.` : ITEMS[item].description,
          ),
        ),
        buy,
      );
    });
    sheet.body.replaceChildren(el('div', { className: 'hud-wares' }, ...wares), message);
  };
  render();
  return sheet.close;
}
