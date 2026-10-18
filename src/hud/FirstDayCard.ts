import { FIRST_DAY, FIRST_DAY_STEPS } from '../data/firstDay';
import type { FirstDayStepView } from '../world/services/FirstDay';
import { el, openSheet } from './dom';
import { glyph } from './glyph';
import { giftLine } from './messages';

/** What the first-day card may ask of the game (V1's R1). Like the others, it never reaches the world. */
export interface FirstDayApi {
  /** Whether her first day is under way, with a step still to do. */
  open(): boolean;
  /** Every step, done or not, and how far along. */
  steps(): readonly FirstDayStepView[];
  /** Draws Cody's head and shoulders, for the card's head. */
  portrait(canvas: HTMLCanvasElement): void;
  /** A step was done. */
  onChange(listener: () => void): void;
}

/** One step on the card: done or not, what to do, his line, and what it brings. */
function stepRow(step: FirstDayStepView): HTMLElement {
  const row = FIRST_DAY_STEPS[step.id];
  const title = el('strong', { className: 'hud-first-day-title' }, row.title);
  if (!step.done && step.need > 1) {
    title.append(el('span', { className: 'hud-first-day-count' }, ` ${step.have} of ${step.need}`));
  }
  const gift = giftLine(row.reward);
  const item = el(
    'li',
    { className: 'hud-first-day-step' },
    el('span', { className: 'hud-first-day-mark' }, glyph(step.done ? 'heart' : 'heartEmpty')),
    el('span', { className: 'hud-first-day-icon' }, glyph(row.glyph, 32)),
    el(
      'div',
      { className: 'hud-first-day-text' },
      title,
      el('p', { className: 'hud-first-day-line' }, step.done ? row.after : row.before),
      el(
        'p',
        { className: 'hud-first-day-gift' },
        step.done ? `${FIRST_DAY.gotIt} ${gift}.` : `${FIRST_DAY.forYou} ${gift}.`,
      ),
    ),
  );
  item.toggleAttribute('data-done', step.done);
  item.setAttribute('aria-label', `${row.title}, ${step.done ? 'done' : 'to do'}`);
  return item;
}

/**
 * Cody's little list for her first day (V1's R1): every step, those done with a full heart and his
 * line after, those to do with his line on how, in any order. Nothing waits on it; Got it closes it.
 */
export function openFirstDay(hud: HTMLElement, api: FirstDayApi): () => void {
  const picture = el('canvas', { className: 'hud-portrait' });
  api.portrait(picture);
  const sheet = openSheet(hud, {
    picture,
    title: FIRST_DAY.title,
    line: FIRST_DAY.line,
    className: 'hud-first-day',
    done: FIRST_DAY.reply,
  });
  sheet.body.append(
    el('p', { className: 'hud-speech' }, FIRST_DAY.intro),
    el('ul', { className: 'hud-first-day-steps' }, ...api.steps().map(stepRow)),
  );
  return sheet.close;
}
