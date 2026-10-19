import {
  ACTIVITIES,
  HOW_TO,
  PRIZE_FOR,
  THROWN_LINES,
  type ActivityId,
  type Game,
} from '../data/activities';
import { FAIR_PRIZES } from '../data/fairPrizes';
import { ITEMS } from '../data/items';
import type { Grade } from '../systems/activities';
import type { CritterId, ItemId } from '../types/ids';
import type { OnStall, Reading, Round, Thrown, Won } from '../world/services/Activities';
import { fitIcon, ROW_ICON } from './collection';
import { button, el, moving, openSheet, PICTURE } from './dom';
import { aboutFood } from './food';
import { candy, quantity } from './messages';
import type { Glyph } from '../data/glyphs';
import { glyph, price, price as priceTag } from './glyph';

/** What the fairground's sheets may ask of the game. Like the others, they never reach the world. */
export interface FairApi {
  candy(): number;
  round(id: ActivityId): Round | null;
  /** Starts a go; `slow` with reduced motion, so it all goes gentler (V1's R6b). */
  start(id: ActivityId, slow: boolean): Round | null;
  /** Takes hold at the strength bell. */
  hold(id: ActivityId): Round | null;
  /** A throw now; at the duck pond, at `at` along the pond (0 to 1). */
  toss(id: ActivityId, at?: number): { thrown: Thrown; won: Won | null } | null;
  /** Whether a game's first go today is free, and which game's is while it's still to be had. */
  freeToday(id: ActivityId): boolean;
  freeGo(): ActivityId | null;
  /** Draws a game's stage as it is now, with where the last throw went. */
  stage(canvas: HTMLCanvasElement, id: ActivityId, last: Thrown | null): void;
  readToday(): boolean;
  readFortune(): Reading | null;
  menu(id: ActivityId): OnStall[];
  buy(id: ActivityId, item: ItemId): boolean;
  count(item: ItemId): number;
  icon(canvas: HTMLCanvasElement, id: ItemId | CritterId): void;
  /** Draws who reads her fortune: Agatha behind her ball, or the ball by itself. */
  reader(canvas: HTMLCanvasElement): void;
}

/** The stage's width in the art's pixels: `sprites/fairGames.ts`'s. */
const STAGE_PIXELS = 96;

/** A throw's tally mark, by how it went; a throw still to come. */
const TALLY: Record<Grade, Glyph> = { 0: 'tallyMiss', 1: 'tallyHit', 2: 'star' };

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

/**
 * A game's sheet (V1's R6b): its stage, where the moving thing goes by and a tap (or a hold and a
 * let-go, at the bell) throws, drawn every frame while the sheet is up; under it the tally, what
 * to do, and Have a go (free, the day's first at one stall); and its prizes by how well a go went.
 */
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
  const stage = el('canvas', { className: 'hud-fair-stage' });
  stage.setAttribute('aria-hidden', 'true');
  const message = el('p', { className: 'hud-message hud-fair-message' });
  const below = el('div', { className: 'hud-fair-below' });
  const throwButton = el('button', { type: 'button', className: 'hud-primary hud-fair-throw' });
  let last: Thrown | null = null;
  let won: Won | null = null;
  // This go's throws, kept after it ends so the tally still says how it went.
  const thrown: Thrown[] = [...(api.round(id)?.throws ?? [])];
  last = thrown[thrown.length - 1] ?? null;
  let holding = false;

  const fit = () => {
    const room = Math.min(play.clientWidth || 300, 420);
    const scale = Math.max(2, Math.floor(room / STAGE_PIXELS));
    stage.style.width = `${STAGE_PIXELS * scale}px`;
    stage.style.height = `${(STAGE_PIXELS * scale * 56) / 96}px`;
  };

  const tossed = (result: { thrown: Thrown; won: Won | null } | null) => {
    holding = false;
    if (!result) return;
    last = result.thrown;
    thrown.push(result.thrown);
    won = result.won;
    message.textContent = THROWN_LINES[game.motion][result.thrown.grade];
    render();
  };

  // A tap on the stage throws (where along it, at the duck pond); at the bell, a press takes hold
  // and letting go swings. The button below does the same for a thumb that wants a big target.
  const press = (e: PointerEvent, along?: number) => {
    if (!api.round(id)) return;
    e.preventDefault();
    if (game.motion === 'bell') {
      if (!holding) {
        holding = true;
        api.hold(id);
      }
      return;
    }
    tossed(api.toss(id, along));
  };
  const release = () => {
    if (game.motion === 'bell' && holding) tossed(api.toss(id));
  };
  stage.addEventListener('pointerdown', (e) => {
    const box = stage.getBoundingClientRect();
    press(e, box.width > 0 ? (e.clientX - box.left) / box.width : 0.5);
  });
  throwButton.addEventListener('pointerdown', (e) => press(e, 0.5));
  for (const node of [stage, throwButton]) {
    node.addEventListener('pointerup', release);
    node.addEventListener('pointercancel', release);
    node.addEventListener('pointerleave', release);
  }
  // A keyboard or VoiceOver's double tap is a click with no press before it.
  throwButton.addEventListener('click', (e) => {
    if (e.detail !== 0 || !api.round(id)) return;
    if (game.motion === 'bell') api.hold(id);
    tossed(api.toss(id, 0.5));
  });

  const render = () => {
    const round = api.round(id);
    const tally = el(
      'p',
      { className: 'hud-fair-tally' },
      ...Array.from({ length: game.throws }, (_, i) => {
        const t = thrown[i];
        return glyph(t ? TALLY[t.grade] : 'tallyLeft');
      }),
    );
    const parts: (HTMLElement | string)[] = [];
    if (round) {
      throwButton.textContent =
        game.motion === 'bell' ? 'Hold, and let go!' : game.motion === 'ducks' ? 'Pick!' : 'Throw!';
      const step =
        game.throws > 1
          ? `${game.thrown[0]!.toUpperCase()}${game.thrown.slice(1)} ${round.throws.length + 1} of ${game.throws}. `
          : '';
      parts.push(
        tally,
        throwButton,
        el('p', { className: 'hud-message' }, `${step}${HOW_TO[game.motion]}`),
      );
    } else {
      if (thrown.length > 0) parts.push(tally);
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
                `${PRIZE_FOR[game.prizes.length as 3 | 4]?.[prize.rank] ?? ''} ${quantity(prize.item, 1)}${prize.free ? ', and the go was free' : ''}.`,
              ),
            ),
          ),
        );
      }
      const free = api.freeToday(id);
      const go = button(
        free ? 'Free go!' : won ? 'Another go ' : 'Have a go ',
        () => {
          won = null;
          last = null;
          thrown.length = 0;
          if (!api.start(id, !moving())) {
            message.textContent = `A go is ${candy(row.cost)}. Come back with a little more!`;
          } else message.textContent = '';
          render();
        },
        true,
      );
      if (!free) go.append(price(row.cost));
      go.classList.add('hud-fair-go');
      go.disabled = !free && api.candy() < row.cost;
      parts.push(go);
      const elsewhere = api.freeGo();
      if (!free && elsewhere && elsewhere !== id) {
        parts.push(
          el(
            'p',
            { className: 'hud-fact' },
            `Your first go at the ${ACTIVITIES[elsewhere].name.toLowerCase()} is free today.`,
          ),
        );
      }
    }
    below.replaceChildren(...parts, message);
  };

  play.replaceChildren(stage, below);
  const draw = () => {
    if (!stage.isConnected) return;
    api.stage(stage, id, last);
    requestAnimationFrame(draw);
  };

  sheet
    .panel('prizes')
    .append(
      el(
        'div',
        { className: 'hud-wares' },
        ...game.prizes.map((item, rank) =>
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
                `${PRIZE_FOR[game.prizes.length as 3 | 4]?.[rank] ?? ''}${(FAIR_PRIZES as readonly ItemId[]).includes(item) ? ' Only ever won at the fairground.' : ''}`,
              ),
            ),
          ),
        ),
      ),
    );
  render();
  fit();
  api.stage(stage, id, last);
  requestAnimationFrame(() => {
    fit();
    draw();
  });
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
      ...(reading.fair ? [el('p', { className: 'hud-fact hud-fortune-fair' }, reading.fair)] : []),
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
    'Read my fortune ',
    () => {
      const reading = api.readFortune();
      if (reading) show(reading);
      else message.textContent = `A reading is ${candy(row.cost)}. The ball can wait!`;
    },
    true,
  );
  read.append(price(row.cost));
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
      const buy = el('button', { type: 'button', className: 'hud-price' }, priceTag(price));
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
          el('small', {}, have > 0 ? `${aboutFood(item)} You have ${have}.` : aboutFood(item)),
        ),
        buy,
      );
    });
    sheet.body.replaceChildren(el('div', { className: 'hud-wares' }, ...wares), message);
  };
  render();
  return sheet.close;
}
