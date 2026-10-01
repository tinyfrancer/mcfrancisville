import {
  EYES,
  HAIR_COLOURS,
  HAIR_STYLES,
  idsOf,
  SKINS,
  STRIPES_ARMS,
  TATTOOS,
} from '../data/looks';
import { FABRICS, OPTIONAL_SLOTS, OUTFITS, recolours } from '../data/outfits';
import { EYE_COLOURS, FABRIC_TONES, hairTone, SKIN_TONES } from '../sprites/lookColours';
import { ITEMS } from '../data/items';
import {
  cleanName,
  NAME_MAX,
  onWrist,
  putOn,
  slipOff,
  takeOff,
  wear,
  WRIST_MAX,
} from '../systems/wardrobe';
import type { HairColourId, HairStyleId, OutfitId, Slot, TattooId } from '../types/ids';
import type { Look, Worn } from '../types/look';
import { collection, type Entry, type Group } from './collection';
import { el, openSheet } from './dom';
import { choiceRow, dollPreview, section, type Choice, type LookApi } from './pickers';

function hairSwatch(id: HairColourId): string {
  return hairTone(id).main;
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

/** Her other half's colour, for split dye, each picked on its own; or none, all one colour. */
const splitColourRow = (look: Look, onPick: (id: HairColourId | null) => void) =>
  choiceRow<HairColourId | null>(
    [
      { id: null, label: 'None' },
      ...idsOf(HAIR_COLOURS).map((id) => ({
        id,
        label: `${HAIR_COLOURS[id].name} split`,
        swatch: hairSwatch(id),
      })),
    ],
    look.splitColour,
    onPick,
  ).element;

/** Her hair's colour, and her split dye's other half. */
const hairColours = (look: Look, put: (patch: Partial<Look>) => void) => [
  el('small', {}, 'Her right side'),
  hairColourRow(look, (hairColour) => put({ hairColour })),
  el('small', {}, 'Her left side (a split dye, or none)'),
  splitColourRow(look, (splitColour) => put({ splitColour })),
];

const tattooRow = (look: Look, onPick: (id: TattooId | null) => void) =>
  choiceRow<TattooId | null>(
    [{ id: null, label: 'None' }, ...idsOf(TATTOOS).map((id) => ({ id, label: TATTOOS[id].name }))],
    look.tattoos,
    onPick,
  ).element;

/** Which arm the striped sleeve is on, with the stars and flowers on the other. */
const stripesRow = (look: Look, onPick: (arm: Look['stripesArm']) => void) =>
  choiceRow<Look['stripesArm']>(
    idsOf(STRIPES_ARMS).map((id) => ({ id, label: `Stripes: ${STRIPES_ARMS[id].name}` })),
    look.stripesArm,
    onPick,
  ).element;

/** Her tattoos, and which arm her striped sleeve is on. */
const tattoos = (look: Look, put: (patch: Partial<Look>) => void) => [
  tattooRow(look, (tattoos) => put({ tattoos })),
  stripesRow(look, (stripesArm) => put({ stripesArm })),
];

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

/** The colours the piece she has on comes in. Empty when it only comes in one. */
function fabricRow(
  look: Look,
  worn: Worn | undefined,
  owned: readonly OutfitId[],
  put: (next: Look) => void,
) {
  if (!worn || !recolours(worn.id)) return el('div');
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
  const sheet = openSheet(hud, {
    title: 'Welcome to McFrancisVille!',
    line: 'A little plum house at the top of town is waiting for someone. Is it you?',
    dismissable: false,
    className: 'hud-creator',
    done: null,
    tabs: CREATOR_TABS,
  });
  const { body, actions, close } = sheet;
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

  body.prepend(stage.element);
  sheet.panel('you').append(
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
  );
  sheet.panel('hair').append(
    section(
      'Style',
      hairStyleRow(draft, (hairStyle) => change({ hairStyle })),
    ),
    section('Colour', ...hairColours(draft, change)),
  );
  sheet.panel('face').append(
    faceSection(draft, change),
    section('Glasses', slotRow('glasses')),
    section('Necklace', slotRow('necklace')),
    section(
      'Ears',
      gaugeRow(draft, (gauges) => change({ gauges })),
    ),
  );
  sheet
    .panel('tattoos')
    .append(
      section('Tattoos', ...tattoos(draft, change)),
      el(
        'p',
        {},
        'Your closet is behind the 👗 up top, and the Muse Hair Salon in town can change your hair any time.',
      ),
    );
  actions(message, finish);

  // This reads `draft` when tapped: the creator's rows are built only once.
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
      sheet.show('you');
      message.textContent = 'Type your name first.';
      name.focus();
      return;
    }
    api.apply({ ...draft, name: typed });
    close();
    onDone();
  });
}

/** The creator's sections (0.2's U2): her doll stays above them all. */
const CREATOR_TABS = [
  { id: 'you', label: 'You' },
  { id: 'hair', label: 'Hair' },
  { id: 'face', label: 'Face' },
  { id: 'tattoos', label: 'Tattoos' },
];

/** The closet's sections: her clothes, and the rest of her look. */
const CLOSET_TABS = [
  { id: 'clothes', label: 'Clothes' },
  { id: 'wrists', label: 'Wrists' },
  { id: 'tattoos', label: 'Tattoos' },
  { id: 'face', label: 'Face' },
];

/**
 * Her wrist (0.2's W1): a chip for each bracelet in her bag, pressed while she wears it, a tap to
 * put it on (nearest her hand) or take it off.
 */
function wristRow(look: Look, api: LookApi, put: (next: Look) => void): HTMLElement[] {
  const bracelets = api.bracelets();
  if (bracelets.length === 0) {
    return [el('p', {}, 'Bracelets you string at your workbench can be worn here, up to three.')];
  }
  const have = (id: (typeof bracelets)[number]['id']) =>
    bracelets.find((b) => b.id === id)?.count ?? 0;
  const full = look.wrist.length >= WRIST_MAX;
  const chips = bracelets.map(({ id }) => {
    const on = onWrist(look, id) > 0;
    const chip = el('button', { type: 'button', className: 'hud-chip' }, ITEMS[id].name);
    chip.setAttribute('aria-pressed', String(on));
    chip.disabled = !on && full;
    chip.addEventListener('click', () => {
      let next = look;
      if (on) while (onWrist(next, id) > 0) next = slipOff(next, id);
      else next = putOn(look, id, have);
      put(next);
    });
    return chip;
  });
  const line = full
    ? 'Your wrist is stacked full. Take one off to wear another.'
    : `Up to ${WRIST_MAX} on your left wrist. They stay in your bag while you wear them.`;
  return [el('div', { className: 'hud-choices' }, ...chips), el('p', {}, line)];
}

/** The closet's shelves: a dress is a top, but it hangs on a rail of its own. */
const CLOSET_GROUPS: readonly (Group & { slot: Slot; dress?: boolean })[] = [
  { id: 'top', label: 'Tops', slot: 'top', dress: false },
  { id: 'dress', label: 'Dresses', slot: 'top', dress: true },
  { id: 'outer', label: 'Jackets', slot: 'outer' },
  { id: 'bottom', label: 'Bottoms', slot: 'bottom' },
  { id: 'tights', label: 'Tights', slot: 'tights' },
  { id: 'shoes', label: 'Shoes', slot: 'shoes' },
  { id: 'hat', label: 'Hats', slot: 'hat' },
  { id: 'necklace', label: 'Necklaces', slot: 'necklace' },
  { id: 'glasses', label: 'Glasses', slot: 'glasses' },
  { id: 'gloves', label: 'Gloves', slot: 'gloves' },
];

function closetGroup(id: OutfitId): string {
  const row = OUTFITS[id];
  return row.dress ? 'dress' : row.slot;
}

interface ClosetEntry extends Entry {
  id: OutfitId;
}

/** Whether she has it on. */
function wearing(look: Look, id: OutfitId): boolean {
  return look.outfit[OUTFITS[id].slot]?.id === id;
}

/**
 * Her closet: every piece she owns, a close-up of her in each, worn with a tap (and a hat,
 * necklace, glasses or shoes taken off with another), the colours of the last one she picked,
 * and her tattoos, ears and face.
 */
export function openWardrobe(hud: HTMLElement, api: LookApi): void {
  const owned = api.owned();
  let look = api.look();
  // The close-ups are of her as she came in, so each is drawn once, not again at every change.
  const base = look;
  let picked: OutfitId | null = look.outfit.top?.id ?? null;
  const sheet = openSheet(hud, {
    title: 'Closet',
    className: 'hud-wardrobe',
    onClose: () => api.seen(),
    tabs: CLOSET_TABS,
    memory: 'closet',
    onTab: () => render(),
  });
  const stage = dollPreview(api, look);

  const put = (next: Look) => {
    api.apply(next);
    look = api.look();
    stage.show(look);
    render();
  };

  // What the piece she last picked is, and the colours it comes in, if it comes in more than one.
  const colours = () => {
    const worn = picked ? look.outfit[OUTFITS[picked].slot] : undefined;
    if (!worn || worn.id !== picked) return [];
    const row = OUTFITS[worn.id];
    return [
      el(
        'div',
        { className: 'hud-colours' },
        el('small', {}, row.name),
        el('p', {}, row.description),
        fabricRow(look, worn, owned, put),
      ),
    ];
  };

  const closet = collection<ClosetEntry>({
    label: 'your closet',
    entries: () =>
      owned.map((id) => ({
        id,
        name: OUTFITS[id].name,
        group: closetGroup(id),
        isNew: api.isNew(id),
      })),
    groups: CLOSET_GROUPS,
    sorts: ['kind', 'new', 'name'],
    layout: 'grid',
    icon: (canvas, e) => api.detail(canvas, base, e.id),
    describe: (e) => (wearing(look, e.id) ? `${e.name}, wearing` : e.name),
    pick(e) {
      const slot = OUTFITS[e.id].slot;
      const off = wearing(look, e.id) && OPTIONAL_SLOTS.includes(slot);
      picked = off ? null : e.id;
      put(off ? takeOff(look, slot) : wear(look, e.id, owned));
    },
    pressed: (e) => wearing(look, e.id),
    empty: 'Your closet is empty. Cobweb Corner has new clothes every morning!',
    memory: 'closet',
  });

  // Only the tab she's on is drawn again; the others are drawn as she turns to them.
  const render = () => {
    const tab = sheet.tab();
    const patch = (p: Partial<Look>) => put({ ...look, ...p });
    closet.tools.hidden = tab !== 'clothes';
    sheet.actions(...(tab === 'clothes' ? colours() : []));
    if (tab === 'clothes') closet.refresh();
    else if (tab === 'wrists') sheet.panel(tab).replaceChildren(...wristRow(look, api, put));
    else if (tab === 'tattoos') sheet.panel(tab).replaceChildren(...tattoos(look, patch));
    else {
      sheet.panel(tab).replaceChildren(
        faceSection(look, patch),
        section(
          'Ears',
          gaugeRow(look, (gauges) => patch({ gauges })),
        ),
      );
    }
  };

  sheet.head.append(closet.tools);
  sheet.body.prepend(stage.element);
  sheet.panel('clothes').append(closet.list);
  render();
}

/**
 * The Muse Hair Salon (decisions.md 18), named for the salon she dreams of opening. Until phase 7
 * gives buildings an inside, walking up to it opens this.
 */
export function openSalon(hud: HTMLElement, api: LookApi): void {
  let look = api.look();
  const who = look.name ? `, ${look.name}` : '';
  const { body } = openSheet(hud, {
    title: 'Muse Hair Salon',
    line: `Welcome to the Muse${who}! Pull up a chair. What are we dreaming up today?`,
    className: 'hud-salon',
    done: 'Love it!',
  });
  const stage = dollPreview(api, look);
  const put = (patch: Partial<Look>) => {
    api.apply({ ...look, ...patch });
    look = api.look();
    stage.show(look);
  };
  body.append(
    stage.element,
    section(
      'Style',
      hairStyleRow(look, (hairStyle) => put({ hairStyle })),
    ),
    section('Colour', ...hairColours(look, put)),
  );
}
