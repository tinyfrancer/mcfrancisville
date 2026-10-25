import { CONSTELLATIONS } from '../data/constellations';
import type { TapResult, Trace } from '../systems/stars';
import type { ConstellationId } from '../types/ids';
import type { Tonight } from '../world/services/Stargazing';
import { fitIcon } from './collection';
import { el, openSheet, PICTURE } from './dom';
import { glyph } from './glyph';
import { dated } from './MailSheet';

/** What the telescope's view of the sky is drawn from, as the sheet has it now. */
export interface SkyStage {
  id: ConstellationId;
  lit: number;
  done: boolean;
  pulse: number | null;
  twinkle: { star: number; at: number } | null;
  doneAt: number | null;
}

/** What the sky sheet may ask of the game (1.5's G4). Like the others, it never reaches the world. */
export interface SkyApi {
  tonight(): Tonight;
  /** The day she first traced one, or null. */
  tracedOn(id: ConstellationId): string | null;
  /** Starts tracing one of tonight's; false if it isn't out. */
  begin(id: ConstellationId): boolean;
  trace(): Trace | null;
  /** A tap at a fraction across and down the stage: its star tapped, or null if no star's there. */
  tap(id: ConstellationId, fx: number, fy: number): TapResult | null;
  /** Draws the telescope's view as it is now. */
  stage(canvas: HTMLCanvasElement, shape: SkyStage | null): void;
  /** Draws a constellation's 16-pixel mark. */
  mark(canvas: HTMLCanvasElement, id: ConstellationId): void;
  /** Where a constellation's stars are on the stage, as fractions across and down it, in order. */
  points(id: ConstellationId): { fx: number; fy: number }[];
  /** The clock now, for the stars' twinkling. */
  now(): number;
}

/** "The Bat", for the start of a sentence or a chip. */
export function named(id: ConstellationId): string {
  const name = CONSTELLATIONS[id].name;
  return `${name.slice(0, 1).toUpperCase()}${name.slice(1)}`;
}

/** How long a wrong tap shows where to tap instead, by pulsing the next star. */
const HINT_MS = 2400;

/**
 * The sky through a telescope (1.5's G4, decision 373): tonight's constellations to pick from,
 * the one picked on a stage of night, and tracing it by tapping its stars in order, the first
 * twinkling to start her off. A wrong tap only twinkles (and shows the right one a moment), so
 * there's nothing to fail; the last star lights the whole shape, and it goes on her star chart.
 * One she has traced can be looked at again on any clear night.
 */
export function openSky(hud: HTMLElement, api: SkyApi): () => void {
  const tonight = api.tonight();
  const picture = el('canvas', { className: 'hud-icon' });
  api.mark(picture, tonight.month);
  fitIcon(picture, PICTURE);
  const later = tonight.findable.filter((id) => id !== tonight.month).slice(0, 2);
  const sheet = openSheet(hud, {
    picture,
    title: 'The night sky',
    line: tonight.showers
      ? 'The whole sky is out tonight! Every constellation at once, and shooting stars between.'
      : `A clear night. ${named(tonight.month)} is up this month${
          later.length > 0
            ? `, and ${later.map((id) => CONSTELLATIONS[id].name).join(' and ')} still about`
            : ''
        }.`,
    className: 'hud-sky-sheet',
  });
  const panel = sheet.body;
  const stage = el('canvas', { className: 'hud-sky-stage' });
  stage.setAttribute('aria-hidden', 'true');
  const view = el('div', { className: 'hud-sky-view' }, stage);
  const message = el('p', { className: 'hud-message hud-sky-message' });
  message.setAttribute('aria-live', 'polite');
  const chips = el('div', { className: 'hud-sky-chips' });
  chips.setAttribute('role', 'group');
  chips.setAttribute('aria-label', 'Constellations');

  // Tonight's first, the month's and any not yet found first among them; then those found before.
  const all = [
    ...tonight.findable,
    ...(Object.keys(CONSTELLATIONS) as ConstellationId[]).filter(
      (id) => !tonight.findable.includes(id) && api.tracedOn(id) !== null,
    ),
  ];
  let shown: ConstellationId =
    tonight.findable.find((id) => api.tracedOn(id) === null) ?? tonight.findable[0] ?? all[0]!;
  let shape: SkyStage | null = null;

  const show = (id: ConstellationId) => {
    shown = id;
    // Where its stars are, for a test's taps (smoke traces it by touch as she would).
    stage.dataset.stars = JSON.stringify(api.points(id));
    const found = api.tracedOn(id) !== null;
    if (!found && api.begin(id)) {
      shape = { id, lit: 0, done: false, pulse: 0, twinkle: null, doneAt: null };
      message.textContent = `Tap the twinkling star, then the rest of ${CONSTELLATIONS[id].name} in order, star to star.`;
    } else {
      shape = { id, lit: 0, done: true, pulse: null, twinkle: null, doneAt: null };
      message.textContent = `${CONSTELLATIONS[id].about} On your star chart since ${dated(api.tracedOn(id) ?? '')}.`;
    }
    paintChips();
  };

  const paintChips = () => {
    chips.replaceChildren(
      ...all.map((id) => {
        const found = api.tracedOn(id) !== null;
        const chip = el('button', { type: 'button', className: 'hud-sky-chip' });
        if (found) chip.append(glyph('star'));
        chip.append(named(id));
        chip.setAttribute('aria-pressed', String(id === shown));
        chip.addEventListener('click', () => show(id));
        return chip;
      }),
    );
  };

  stage.addEventListener('pointerdown', (e) => {
    if (!shape || shape.done) return;
    e.preventDefault();
    const box = stage.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    const firstOfAll = all.every((id) => api.tracedOn(id) === null);
    const result = api.tap(
      shape.id,
      (e.clientX - box.left) / box.width,
      (e.clientY - box.top) / box.height,
    );
    if (!result) return;
    const now = api.now();
    if (result.kind === 'twinkle') {
      shape.twinkle = { star: result.star, at: now };
      shape.pulse = shape.lit;
      hintUntil = now + HINT_MS;
      return;
    }
    shape.lit = api.trace()?.lit ?? shape.lit + 1;
    shape.twinkle = null;
    shape.pulse = null;
    const of = CONSTELLATIONS[shape.id].stars.length;
    if (result.kind === 'done') {
      shape.done = true;
      shape.doneAt = now;
      const hazel = firstOfAll ? " And there's a letter from Hazel in your mailbox!" : '';
      message.textContent = `${named(shape.id)} lights up! It's on your star chart now.${hazel} ${CONSTELLATIONS[shape.id].about}`;
      paintChips();
    } else message.textContent = `${shape.lit} of ${of} stars. Keep going!`;
  });
  let hintUntil = 0;

  const fit = () => {
    const room = Math.min(view.clientWidth || 300, 480);
    const scale = Math.max(2, Math.floor(room / 96));
    stage.style.width = `${96 * scale}px`;
    stage.style.height = `${64 * scale}px`;
  };
  const draw = () => {
    if (!stage.isConnected) return;
    if (shape && !shape.done && shape.pulse !== null && shape.lit > 0 && api.now() > hintUntil) {
      shape.pulse = null;
    }
    api.stage(stage, shape);
    requestAnimationFrame(draw);
  };

  panel.append(view, message, chips);
  show(shown);
  fit();
  api.stage(stage, shape);
  requestAnimationFrame(() => {
    fit();
    draw();
  });
  return sheet.close;
}
