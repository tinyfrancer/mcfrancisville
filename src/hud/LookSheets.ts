import { EYES, HAIR_COLOURS, HAIR_STYLES, idsOf, SKINS, TATTOOS } from '../data/looks';
import { FABRICS, OUTFITS } from '../data/outfits';
import { EYE_COLOURS, FABRIC_TONES, HAIR_TONES, SKIN_TONES } from '../sprites/lookColours';
import { cleanName, isDress, NAME_MAX, takeOff, wear } from '../systems/wardrobe';
import type { HairColourId, HairStyleId, OutfitId, Slot, TattooId } from '../types/ids';
import type { Look, Worn } from '../types/look';
import { el, openSheet } from './dom';
import { choiceRow, dollPreview, section, type Choice, type LookApi } from './pickers';

function hairSwatch(id: HairColourId): string {
  const { left, right } = HAIR_TONES[id];
  // As she'd be seen from the front: her right half on the viewer's left.
  return `linear-gradient(90deg, ${right.main} 50%, ${left.main} 50%)`;
}

const hairStyleRow = (look: Look, onPick: (id: HairStyleId) => void) =>
  choiceRow(
    idsOf(HAIR_STYLES).map((id) => ({ id, label: HAIR_STYLES[id].name })),
    look.hairStyle,
    onPick,
  ).element;

const hairColourRow = (look: Look, onPick: (id: HairColourId) => void) =>
  choiceRow(
    idsOf(HAIR_COLOURS).map((id) => ({ id, label: HAIR_COLOURS[id].name, swatch: hairSwatch(id) })),
    look.hairColour,
    onPick,
  ).element;

const tattooRow = (look: Look, onPick: (id: TattooId | null) => void) =>
  choiceRow<TattooId | null>(
    [{ id: null, label: 'None' }, ...idsOf(TATTOOS).map((id) => ({ id, label: TATTOOS[id].name }))],
    look.tattoos,
    onPick,
  ).element;

const gaugeRow = (look: Look, onPick: (on: boolean) => void) =>
  choiceRow(
    [
      { id: true, label: 'Gauges' },
      { id: false, label: 'None' },
    ],
    look.gauges,
    onPick,
  ).element;

/** A little something on her face, on or off. */
const faceRow = (label: string, on: boolean, onPick: (on: boolean) => void) =>
  choiceRow(
    [
      { id: true, label },
      { id: false, label: 'None' },
    ],
    on,
    onPick,
  ).element;

/** Her freckles and her nose stud. */
const faceSection = (look: Look, put: (patch: Partial<Look>) => void) =>
  section(
    'Face',
    faceRow('Freckles', look.freckles, (freckles) => put({ freckles })),
    faceRow('Nose stud', look.nosePiercing, (nosePiercing) => put({ nosePiercing })),
  );

/** The pieces she owns for a slot, and "None" first where the slot can be left bare. */
function pieceRow(
  look: Look,
  owned: readonly OutfitId[],
  pieces: (id: OutfitId) => boolean,
  selected: OutfitId | null,
  bare: Slot | null,
  put: (next: Look) => void,
): HTMLElement {
  const choices: Choice<OutfitId | null>[] = owned
    .filter(pieces)
    .map((id) => ({ id, label: OUTFITS[id].name }));
  if (bare) choices.unshift({ id: null, label: 'None' });
  return choiceRow(choices, selected, (id) =>
    put(id === null ? takeOff(look, bare!) : wear(look, id, owned)),
  ).element;
}

/** The colours the piece she has on comes in. Empty when there's only one. */
function fabricRow(
  look: Look,
  worn: Worn | undefined,
  owned: readonly OutfitId[],
  put: (next: Look) => void,
) {
  if (!worn || OUTFITS[worn.id].fabrics.length < 2) return el('div');
  const choices = OUTFITS[worn.id].fabrics.map((id) => ({
    id,
    label: FABRICS[id].name,
    swatch: FABRIC_TONES[id].main,
  }));
  return choiceRow(choices, worn.fabric, (fabric) => put(wear(look, worn.id, owned, fabric)))
    .element;
}

const inSlot = (slot: Slot) => (id: OutfitId) => OUTFITS[id].slot === slot;

/**
 * The character creator (phase 3). It opens on a look that is already her, so all she has to do is
 * type her name, and it can't be dismissed until she has: the game needs someone to follow.
 */
export function openCreator(hud: HTMLElement, api: LookApi, onDone: () => void): void {
  let draft = api.look();
  const owned = api.owned();
  const { sheet, close } = openSheet(hud, { dismissable: false, className: 'hud-creator' });
  const stage = dollPreview(api, draft);
  const update = (next: Look) => {
    draft = next;
    stage.show(draft);
  };
  const change = (patch: Partial<Look>) => update({ ...draft, ...patch });

  const name = el('input', {
    type: 'text',
    className: 'hud-name',
    maxLength: NAME_MAX,
    placeholder: 'Your name',
    autocomplete: 'off',
    value: draft.name,
  });
  name.setAttribute('autocapitalize', 'words');
  name.setAttribute('enterkeyhint', 'done');
  name.setAttribute('aria-label', 'Your name');
  const finish = el('button', {
    type: 'button',
    className: 'hud-primary',
    textContent: "That's me!",
  });
  const message = el('p', { className: 'hud-message' });
  const ready = () => {
    finish.disabled = cleanName(name.value) === '';
  };
  name.addEventListener('input', ready);
  name.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') name.blur();
  });
  ready();

  sheet.append(
    el('h2', {}, 'Welcome to McFrancisVille!'),
    el('p', {}, 'A little plum house at the top of town is waiting for someone. Is it you?'),
    stage.element,
    section('Your name', name),
    section(
      'Skin',
      choiceRow(
        idsOf(SKINS).map((id) => ({ id, label: SKINS[id].name, swatch: SKIN_TONES[id].main })),
        draft.skin,
        (skin) => change({ skin }),
      ).element,
    ),
    section(
      'Eyes',
      choiceRow(
        idsOf(EYES).map((id) => ({ id, label: EYES[id].name, swatch: EYE_COLOURS[id] })),
        draft.eyes,
        (eyes) => change({ eyes }),
      ).element,
    ),
    section(
      'Hair',
      hairStyleRow(draft, (hairStyle) => change({ hairStyle })),
      hairColourRow(draft, (hairColour) => change({ hairColour })),
    ),
    faceSection(draft, change),
    section('Glasses', slotRow('glasses')),
    section('Necklace', slotRow('necklace')),
    section(
      'Ears',
      gaugeRow(draft, (gauges) => change({ gauges })),
    ),
    section(
      'Tattoos',
      tattooRow(draft, (tattoos) => change({ tattoos })),
    ),
    el(
      'p',
      {},
      'Your closet is behind the 👗 up top, and the Muse Hair Salon in town can change your hair any time.',
    ),
    el('div', { className: 'hud-row' }, finish),
    message,
  );

  // Unlike `pieceRow`, this reads `draft` when tapped: the creator's rows are built only once.
  function slotRow(slot: Slot): HTMLElement {
    const choices: Choice<OutfitId | null>[] = [
      { id: null, label: 'None' },
      ...owned.filter(inSlot(slot)).map((id) => ({ id, label: OUTFITS[id].name })),
    ];
    return choiceRow(choices, draft.outfit[slot]?.id ?? null, (id) =>
      update(id === null ? takeOff(draft, slot) : wear(draft, id, owned)),
    ).element;
  }

  finish.addEventListener('click', () => {
    const typed = cleanName(name.value);
    if (!typed) {
      message.textContent = 'Type your name first.';
      name.focus();
      return;
    }
    api.apply({ ...draft, name: typed });
    close();
    onDone();
  });
}

type Tab = 'Tops' | 'Dresses' | 'Bottoms' | 'Shoes' | 'Extras';
const TABS: readonly Tab[] = ['Tops', 'Dresses', 'Bottoms', 'Shoes', 'Extras'];

/** Her closet: every piece she owns, each in every colour it comes in, worn with a tap. */
export function openWardrobe(hud: HTMLElement, api: LookApi): void {
  const owned = api.owned();
  let look = api.look();
  let tab: Tab = 'Tops';
  const { sheet, close } = openSheet(hud, { className: 'hud-wardrobe' });
  const stage = dollPreview(api, look);
  const body = el('div', { className: 'hud-tab-body' });

  const put = (next: Look) => {
    api.apply(next);
    look = api.look();
    stage.show(look);
    render();
  };
  const top = (dress: boolean) => (id: OutfitId) =>
    OUTFITS[id].slot === 'top' && (OUTFITS[id].dress === true) === dress;

  const render = () => {
    const worn = look.outfit;
    const dressed = isDress(worn.top);
    const withColours = (slot: Slot, bare: boolean) => [
      pieceRow(look, owned, inSlot(slot), worn[slot]?.id ?? null, bare ? slot : null, put),
      fabricRow(look, worn[slot], owned, put),
    ];
    switch (tab) {
      case 'Tops':
        body.replaceChildren(
          pieceRow(look, owned, top(false), dressed ? null : worn.top!.id, null, put),
          dressed ? el('div') : fabricRow(look, worn.top, owned, put),
        );
        break;
      case 'Dresses':
        body.replaceChildren(
          pieceRow(look, owned, top(true), dressed ? worn.top!.id : null, null, put),
          dressed ? fabricRow(look, worn.top, owned, put) : el('div'),
        );
        break;
      case 'Bottoms':
        body.replaceChildren(
          ...(dressed
            ? [el('p', {}, 'Your dress has that covered. Pick one to change back.')]
            : []),
          ...withColours('bottom', false),
        );
        break;
      case 'Shoes':
        body.replaceChildren(...withColours('shoes', true));
        break;
      case 'Extras':
        body.replaceChildren(
          section('Hat', ...withColours('hat', true)),
          section('Necklace', ...withColours('necklace', true)),
          section('Glasses', ...withColours('glasses', true)),
          section(
            'Tattoos',
            tattooRow(look, (tattoos) => put({ ...look, tattoos })),
          ),
          section(
            'Ears',
            gaugeRow(look, (gauges) => put({ ...look, gauges })),
          ),
          faceSection(look, (patch) => put({ ...look, ...patch })),
        );
        break;
    }
  };

  const tabs = choiceRow(
    TABS.map((id) => ({ id, label: id })),
    tab,
    (next) => {
      tab = next;
      render();
    },
  );
  tabs.element.classList.add('hud-tabs');
  const done = el('button', { type: 'button', className: 'hud-primary', textContent: 'Done' });
  done.addEventListener('click', close);

  render();
  sheet.append(
    el('h2', {}, 'Closet'),
    stage.element,
    tabs.element,
    body,
    el('div', { className: 'hud-row' }, done),
  );
}

/**
 * The Muse Hair Salon (decisions.md 18), named for the salon she dreams of opening. Until phase 7
 * gives buildings an inside, walking up to it opens this.
 */
export function openSalon(hud: HTMLElement, api: LookApi): void {
  let look = api.look();
  const { sheet, close } = openSheet(hud, { className: 'hud-salon' });
  const stage = dollPreview(api, look);
  const put = (patch: Partial<Look>) => {
    api.apply({ ...look, ...patch });
    look = api.look();
    stage.show(look);
  };
  const done = el('button', { type: 'button', className: 'hud-primary', textContent: 'Love it!' });
  done.addEventListener('click', close);
  const who = look.name ? `, ${look.name}` : '';
  sheet.append(
    el('h2', {}, 'Muse Hair Salon'),
    el('p', {}, `Welcome to the Muse${who}! Pull up a chair. What are we dreaming up today?`),
    stage.element,
    section(
      'Style',
      hairStyleRow(look, (hairStyle) => put({ hairStyle })),
    ),
    section(
      'Colour',
      hairColourRow(look, (hairColour) => put({ hairColour })),
    ),
    el('div', { className: 'hud-row' }, done),
  );
}
