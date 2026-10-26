import { JOBS, TRICKS, type PetLevel } from '../data/affection';
import { ACCESSORIES, fitsPet, PET_NAME_MAX, PETS } from '../data/pets';
import type { AccessoryId, PetId } from '../types/ids';
import { fitIcon, SLOT_ICON } from './collection';
import { button, el, openSheet } from './dom';
import { glyph } from './glyph';

/** A pet, as its sheet shows it. */
export interface PetView {
  name: string;
  wearing: AccessoryId | null;
  /** Out walking with her. */
  walking: boolean;
  /** How fond of her it is (V1's R6c): its level, and how far to the next, or null at the top. */
  level: PetLevel;
  progress: { into: number; span: number } | null;
  /** Whether a treat from her bag would count today. */
  canTreat: boolean;
}

/** What the sheet says it has learnt, and what it learns next (V1's R6c). */
export function fondWords(id: PetId, name: string, level: PetLevel): string {
  const job = `On walks, ${name} ${JOBS[id].does}`;
  if (level === 0) return `Next: ${job.charAt(0).toLowerCase()}${job.slice(1)}`;
  if (level === 1) return `${job} Next: ${name} ${TRICKS[id].name}.`;
  return `${job} And ${name} ${TRICKS[id].name}, on the Trick button.`;
}

/** What the pet sheet may ask of the game. Like the others, it never reaches the world directly. */
export interface PetApi {
  pet(id: PetId): PetView;
  /** Pets them: what they do about it. */
  pat(id: PetId): string;
  /** Gives them a treat from her bag (V1's R6c): what they do with it, or null. */
  treat(id: PetId): string | null;
  /** Their trick, once they know it: what they do, or null. */
  trick(id: PetId): string | null;
  rename(id: PetId, name: string): string;
  /** Takes them for a walk, or sends them home. */
  walk(id: PetId, on: boolean): void;
  /** Whether she's at home, where she can choose who comes for a walk. */
  indoors(): boolean;
  accessories(): readonly AccessoryId[];
  dress(id: PetId, accessory: AccessoryId | null): void;
  /** Whether she has one of Fibi's bones in her bag. */
  hasBone(): boolean;
  /** Gives Fibi her bone back: what she does. */
  returnBone(): string | null;
  /** She's done, and they can go back to what they were doing. */
  endPet(): void;
  /** Draws them sitting, dressed as they are, at 1×. */
  portrait(canvas: HTMLCanvasElement, id: PetId, accessory: AccessoryId | null): void;
  accessoryIcon(canvas: HTMLCanvasElement, id: AccessoryId): void;
}

/**
 * Seeing to a pet she has walked up to: they're petted as it opens, and she can pet them again,
 * take them for a walk or send them home, dress them, change their name, or, for Fibi, hand back a
 * bone she found.
 */
export function openPet(hud: HTMLElement, api: PetApi, id: PetId): () => void {
  const portrait = el('canvas', { className: 'hud-portrait' });
  const sheet = openSheet(hud, {
    picture: portrait,
    line: PETS[id].what,
    className: 'hud-talk-sheet hud-pet-sheet',
    onClose: () => api.endPet(),
    done: null,
  });
  const close = sheet.close;
  const speech = el('p', { className: 'hud-speech' });
  const note = el('p', { className: 'hud-message' });
  const extra = el('div', {});
  const fond = el('div', { className: 'hud-pet-fond' });

  /** Two hearts for its two levels, a bar to the next, and what it learns next. */
  const showFond = () => {
    const pet = api.pet(id);
    const hearts = el(
      'span',
      { className: 'hud-pet-hearts' },
      glyph(pet.level >= 1 ? 'heart' : 'heartEmpty'),
      glyph(pet.level >= 2 ? 'heart' : 'heartEmpty'),
    );
    hearts.setAttribute('aria-label', `Fondness ${pet.level} of 2`);
    const fill = el('span');
    const bar = el('div', { className: 'hud-pet-bar' }, fill);
    const percent = pet.progress ? Math.round((pet.progress.into / pet.progress.span) * 100) : 100;
    fill.style.width = `${percent}%`;
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuenow', String(percent));
    const next = el('p', { className: 'hud-pet-next' }, fondWords(id, pet.name, pet.level));
    fond.dataset.level = String(pet.level);
    fond.replaceChildren(hearts, bar, next);
  };

  const show = () => {
    const pet = api.pet(id);
    sheet.title(pet.name);
    api.portrait(portrait, id, pet.wearing);
    showFond();
  };

  const render = () => {
    show();
    extra.replaceChildren();
    const pet = api.pet(id);
    const row: HTMLElement[] = [];
    if (id === 'fibi' && api.hasBone()) {
      row.push(
        button(
          "Here's your bone!",
          () => {
            speech.textContent = api.returnBone() ?? speech.textContent;
            note.textContent = '';
            render();
          },
          true,
        ),
      );
    }
    row.push(
      button('Pet', () => {
        speech.textContent = api.pat(id);
        note.textContent = '';
        render();
      }),
    );
    if (pet.level >= 2) {
      row.push(
        // Down first, so the trick is seen wherever the pet is on the screen (1.0.1); its line
        // comes as a toast.
        button('Trick', () => {
          close();
          api.trick(id);
        }),
      );
    }
    if (pet.canTreat) {
      row.push(
        button('Treat', () => {
          speech.textContent = api.treat(id) ?? speech.textContent;
          note.textContent = '';
          render();
        }),
      );
    }
    if (pet.walking) {
      row.push(
        button('Home you go', () => {
          api.walk(id, false);
          if (api.indoors()) {
            note.textContent = `${pet.name} will stay home for now.`;
            render();
          } else {
            close();
          }
        }),
      );
    } else if (api.indoors()) {
      row.push(
        button('Come for a walk', () => {
          api.walk(id, true);
          note.textContent = `${pet.name} will come along wherever you go.`;
          render();
        }),
      );
    }
    row.push(button('Dress up', dressUp), button('Rename', rename), button('Bye', close));
    sheet.actions(...row);
  };

  const dressUp = () => {
    const pet = api.pet(id);
    const grid = el('div', { className: 'hud-bag' });
    grid.setAttribute('role', 'list');
    for (const accessory of api.accessories().filter((a) => fitsPet(a, id))) {
      const icon = el('canvas', { className: 'hud-icon' });
      api.accessoryIcon(icon, accessory);
      fitIcon(icon, SLOT_ICON);
      const slot = el('button', { type: 'button', className: 'hud-slot' }, icon);
      slot.setAttribute('role', 'listitem');
      slot.setAttribute('aria-label', ACCESSORIES[accessory].name);
      slot.setAttribute('aria-pressed', String(pet.wearing === accessory));
      slot.addEventListener('click', () => {
        const off = api.pet(id).wearing === accessory;
        api.dress(id, off ? null : accessory);
        note.textContent = off
          ? `${pet.name} took off the ${ACCESSORIES[accessory].name.toLowerCase()}.`
          : `${pet.name} looks wonderful in the ${ACCESSORIES[accessory].name.toLowerCase()}!`;
        dressUp();
      });
      grid.append(slot);
    }
    extra.replaceChildren(grid);
    note.textContent ||= 'Tap one to put it on, and again to take it off.';
    sheet.actions(button('Done', render, true));
    show();
  };

  const rename = () => {
    const pet = api.pet(id);
    const input = el('input', {
      type: 'text',
      className: 'hud-name',
      maxLength: PET_NAME_MAX,
      value: pet.name,
      autocomplete: 'off',
    });
    input.setAttribute('autocapitalize', 'words');
    input.setAttribute('aria-label', 'Their name');
    const save = () => {
      const named = api.rename(id, input.value);
      note.textContent = `${named} it is!`;
      render();
    };
    input.addEventListener('keydown', (e) => e.key === 'Enter' && save());
    extra.replaceChildren(input);
    note.textContent = `Leave it empty to call them ${PETS[id].name} again.`;
    sheet.actions(button('Save', save, true), button('Never mind', render));
  };

  sheet.body.append(fond, speech, note, extra);
  speech.textContent = api.pat(id);
  render();
  return close;
}
