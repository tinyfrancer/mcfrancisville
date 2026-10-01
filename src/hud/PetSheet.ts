import { ACCESSORIES, PET_NAME_MAX, PETS } from '../data/pets';
import type { AccessoryId, PetId } from '../types/ids';
import { fitIcon, SLOT_ICON } from './collection';
import { button, el, openSheet } from './dom';

/** A pet, as its sheet shows it. */
export interface PetView {
  name: string;
  wearing: AccessoryId | null;
  /** Out walking with her. */
  walking: boolean;
}

/** What the pet sheet may ask of the game. Like the others, it never reaches the world directly. */
export interface PetApi {
  pet(id: PetId): PetView;
  /** Pets them: what they do about it. */
  pat(id: PetId): string;
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

  const show = () => {
    const pet = api.pet(id);
    sheet.title(pet.name);
    api.portrait(portrait, id, pet.wearing);
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
      }),
    );
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
    for (const accessory of api.accessories()) {
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

  sheet.body.append(speech, note, extra);
  speech.textContent = api.pat(id);
  render();
  return close;
}
