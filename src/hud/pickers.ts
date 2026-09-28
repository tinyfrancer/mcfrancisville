import type { Facing, OutfitId } from '../types/ids';
import type { Look } from '../types/look';
import { el } from './dom';

/** What the look sheets may ask of the game. Like `SaveApi`, they never reach the world directly. */
export interface LookApi {
  look(): Look;
  owned(): readonly OutfitId[];
  /** Dresses her in `look` and saves it. */
  apply(look: Look): void;
  /** Draws `look` into a canvas at 1×, for the sheet to scale up. */
  preview(canvas: HTMLCanvasElement, look: Look, facing: Facing): void;
  /** Draws her in `look` wearing a piece, close up on where it's worn, at 1×. */
  detail(canvas: HTMLCanvasElement, look: Look, outfit: OutfitId): void;
  /** Whether a piece came to her closet since she last looked. */
  isNew(id: OutfitId): boolean;
  /** She has looked in her closet. */
  seen(): void;
}

export interface Choice<T> {
  id: T;
  label: string;
  /** A CSS background. With one, the choice is a round swatch labelled for VoiceOver only. */
  swatch?: string;
}

/** A row of buttons, one of them pressed. `set` presses another without calling `onPick`. */
export function choiceRow<T>(
  choices: readonly Choice<T>[],
  selected: T,
  onPick: (id: T) => void,
): { element: HTMLElement; set(id: T): void } {
  const buttons = choices.map((choice) => {
    const button = el('button', { type: 'button' });
    if (choice.swatch) {
      button.className = 'hud-swatch';
      button.style.background = choice.swatch;
      button.setAttribute('aria-label', choice.label);
      button.title = choice.label;
    } else {
      button.className = 'hud-chip';
      button.textContent = choice.label;
    }
    button.addEventListener('click', () => {
      set(choice.id);
      onPick(choice.id);
    });
    return button;
  });
  const set = (id: T) =>
    buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(choices[i]!.id === id)));
  set(selected);
  return { element: el('div', { className: 'hud-choices' }, ...buttons), set };
}

const TURN: Record<Facing, Facing> = { down: 'left', left: 'up', up: 'right', right: 'down' };

/** Her, big, turning a quarter each tap. `show` redraws her in a new look. */
export function dollPreview(
  api: LookApi,
  look: Look,
): { element: HTMLElement; show(l: Look): void } {
  const canvas = el('canvas', { className: 'hud-doll' });
  canvas.setAttribute('role', 'img');
  let facing: Facing = 'down';
  let current = look;
  const draw = () => {
    api.preview(canvas, current, facing);
    canvas.setAttribute('aria-label', current.name ? `${current.name}, facing ${facing}` : 'You');
  };
  const turn = el('button', { type: 'button', className: 'hud-turn', textContent: 'Turn ↻' });
  const spin = () => {
    facing = TURN[facing];
    draw();
  };
  canvas.addEventListener('click', spin);
  turn.addEventListener('click', spin);
  draw();
  return {
    element: el('div', { className: 'hud-stage' }, canvas, turn),
    show(l) {
      current = l;
      draw();
    },
  };
}

export function section(title: string, ...children: (Node | string)[]): HTMLElement {
  return el('section', {}, el('h3', {}, title), ...children);
}
