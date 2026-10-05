import { birthdayOf, isBirthday } from '../data/birthdays';
import { HAPPENINGS } from '../data/happenings';
import { INTERIORS, isInterior } from '../data/interiors';
import { ITEMS, type ItemKind } from '../data/items';
import type { Ware } from '../data/shop';
import { VILLAGERS } from '../data/villagers';
import { ZONES } from '../data/zones';
import { MAX_HEARTS, tierOf } from '../systems/friendship';
import type { ItemId, VillagerId, ZoneId } from '../types/ids';
import type { Whereabout } from '../world/services/Neighbourhood';
import { fitIcon, ROW_ICON, SLOT_ICON } from './collection';
import { button, el, openSheet } from './dom';
import { wareName } from './messages';
import { heartsRow } from './TalkSheet';

/** One neighbour, as the sheet lists them. */
export interface NeighbourView {
  id: VillagerId;
  hearts: number;
  /** Where they are now; null in a town without them. */
  where: Whereabout | null;
}

/** What the neighbours sheet may ask of the game (0.2's U3). It never reaches the world directly. */
export interface NeighboursApi {
  /** Everyone, in the order they're shown. */
  neighbours(): readonly NeighbourView[];
  /** Today's day key, for a birthday. */
  today(): string;
  /** Whether she has found a place outdoors, so a neighbour there isn't a spoiler. */
  found(zone: ZoneId): boolean;
  /** Walks her up to them, if they're where she is; false if they aren't. */
  seek(id: VillagerId): boolean;
  /** Draws a neighbour's head and shoulders at 1×. */
  portrait(canvas: HTMLCanvasElement, id: VillagerId): void;
  icon(canvas: HTMLCanvasElement, id: ItemId): void;
  /** Draws what a neighbour gives her at a band of hearts, at 1×. */
  gift(canvas: HTMLCanvasElement, ware: Ware): void;
}

/** What each kind of thing is called when a neighbour likes it. */
const LIKED: Record<ItemKind, string> = {
  material: 'wood and stone',
  flower: 'flowers',
  treat: 'treats',
  snack: 'snacks',
  crop: 'things from the garden',
  seed: 'seeds',
  squishy: 'squishies',
  doll: 'monster dolls',
  record: 'records',
  bead: 'beads',
  bracelet: 'bracelets',
  critter: 'critters',
  bone: 'bones',
  keepsake: 'keepsakes',
  gear: 'garden gear',
  dish: 'home cooking',
};

/** "flowers, snacks and records". */
export function likesLine(kinds: readonly ItemKind[]): string {
  const said = kinds.map((k) => LIKED[k]);
  if (said.length < 2) return said.join('');
  return `${said.slice(0, -1).join(', ')} and ${said.at(-1)}`;
}

/** How close they are, in a word or two. */
export function bandOf(hearts: number): string {
  if (hearts >= MAX_HEARTS) return 'Best friends';
  return { hello: 'Getting to know you', friend: 'Friends', close: 'Close friends' }[
    tierOf(hearts)
  ];
}

const IN: Partial<Record<ZoneId, string>> = {
  town: 'out in town',
  home: 'at your house',
  whisperwood: 'in Whisperwood',
  hiddenClearing: 'in the hidden clearing',
};

/** "The Muse Hair Salon" in a sentence: "the Muse Hair Salon". */
function inSentence(name: string): string {
  return name.replace(/^The /, 'the ');
}

/** Where a place is, said of a neighbour: "at home", "in Whisperwood". */
export function placeOf(zone: ZoneId, id: VillagerId, found: boolean): string {
  if (isInterior(zone)) {
    return INTERIORS[zone].owner === id ? 'at home' : `at ${inSentence(ZONES[zone].name)}`;
  }
  if (!found) return "somewhere you haven't been yet";
  return IN[zone] ?? `at ${inSentence(ZONES[zone].name)}`;
}

/** "Maude is at home. Book club is on!" */
export function whereLine(id: VillagerId, where: Whereabout, found: boolean): string {
  const name = VILLAGERS[id].name;
  const place = placeOf(where.zone, id, found);
  const doing = where.doing;
  if (!doing) return `${name} is ${place}.`;
  if ('party' in doing) return `${name} is at your birthday party!`;
  if ('happening' in doing)
    return `${name} is ${place}. ${HAPPENINGS[doing.happening].name} is on!`;
  if (doing.visiting === 'her') return `${name} is at your house, visiting you!`;
  const host = VILLAGERS[doing.visiting].name;
  if (isInterior(where.zone) && INTERIORS[where.zone].owner === doing.visiting)
    return `${name} is visiting ${host}.`;
  return `${name} is ${place}, with ${host}.`;
}

/** What a band's gift is, under its name. */
function giftKind(ware: Ware): string {
  if ('recipe' in ware) return 'A recipe to make at your workbench';
  if ('outfit' in ware) return 'Something to wear';
  if ('accessory' in ware) return 'Something for a pet to wear';
  if ('item' in ware) return ITEMS[ware.item].description;
  return 'Something for your home';
}

function portraitOf(api: NeighboursApi, view: NeighbourView): HTMLCanvasElement {
  const picture = el('canvas', { className: 'hud-portrait' });
  api.portrait(picture, view.id);
  return picture;
}

/** Sets off to them if they're here; otherwise says where they are. Never a hop there. */
function find(api: NeighboursApi, view: NeighbourView, said: HTMLElement, close: () => void) {
  if (api.seek(view.id)) {
    close();
    return;
  }
  const name = VILLAGERS[view.id].name;
  const where = view.where;
  said.textContent = where
    ? `${name} is ${placeOf(where.zone, view.id, api.found(where.zone))}. Head over and say hello!`
    : `${name} isn't here just now.`;
}

/**
 * Her neighbours (0.2's U3): everyone in town, how close they are and where they are just now. A
 * tap on someone opens their page.
 */
export function openNeighbours(hud: HTMLElement, api: NeighboursApi): () => void {
  const views = api.neighbours();
  const sheet = openSheet(hud, {
    title: 'Your neighbours',
    line: `${views.length} ${views.length === 1 ? 'neighbour' : 'neighbours'} in McFrancisVille`,
    className: 'hud-neighbours-sheet',
  });
  const rows = views.map((view) => {
    const name = VILLAGERS[view.id].name;
    const where = view.where;
    const about = where ? whereLine(view.id, where, api.found(where.zone)) : '';
    const cake = isBirthday(view.id, api.today()) ? ' 🎂' : '';
    const text = el(
      'span',
      { className: 'hud-seed-text' },
      el('strong', {}, name),
      el('span', { className: 'hud-hearts' }, heartsRow(view.hearts), cake),
      el('small', {}, about),
    );
    const row = el(
      'button',
      { type: 'button', className: 'hud-seed hud-neighbour' },
      portraitOf(api, view),
      text,
    );
    row.addEventListener('click', () => openNeighbour(hud, api, view.id));
    row.dataset.villager = view.id;
    row.setAttribute('aria-label', `${name}, ${view.hearts} hearts of ${MAX_HEARTS}`);
    return row;
  });
  sheet.body.append(el('div', { className: 'hud-neighbour-list' }, ...rows));
  return sheet.close;
}

const TABS = [
  { id: 'about', label: 'About' },
  { id: 'gifts', label: 'Gifts' },
] as const;

/**
 * One neighbour's page: their hearts, birthday, where they are, what they love and like, and
 * what they'll give her as they grow close, with a button to walk up to them.
 */
export function openNeighbour(hud: HTMLElement, api: NeighboursApi, id: VillagerId): () => void {
  const view = api.neighbours().find((v) => v.id === id)!;
  const row = VILLAGERS[id];
  const sheet = openSheet(hud, {
    picture: portraitOf(api, view),
    title: row.name,
    line: `The ${row.creature}`,
    tabs: TABS,
    memory: 'neighbour',
    className: 'hud-neighbour-sheet',
  });

  const about = sheet.panel('about');
  const hearts = el('p', { className: 'hud-hearts' }, heartsRow(view.hearts));
  hearts.setAttribute('aria-label', `${view.hearts} hearts of ${MAX_HEARTS}`);
  const fact = (label: string, text: string) =>
    el('p', { className: 'hud-fact' }, el('strong', {}, label), ' ', text);
  const today = isBirthday(id, api.today()) ? " It's today! 🎉" : '';
  about.append(hearts, fact('💞', bandOf(view.hearts)));
  if (view.where) {
    about.append(fact('📍', whereLine(id, view.where, api.found(view.where.zone))));
  }
  about.append(fact('🎂', `${birthdayOf(id)}${today}`));
  about.append(el('h3', {}, 'Loves'));
  about.append(
    el(
      'div',
      { className: 'hud-loves' },
      ...row.loves.map((item) => {
        const icon = el('canvas', { className: 'hud-icon' });
        api.icon(icon, item);
        fitIcon(icon, SLOT_ICON);
        return el('div', { className: 'hud-love' }, icon, el('small', {}, ITEMS[item].name));
      }),
    ),
  );
  about.append(el('h3', {}, 'Likes'));
  const likes = likesLine(row.likes);
  about.append(el('p', {}, `${likes.charAt(0).toUpperCase()}${likes.slice(1)}.`));

  const gifts = sheet.panel('gifts');
  gifts.append(el('p', { className: 'hud-fact' }, `As you grow close, ${row.name} will send you:`));
  gifts.append(
    el(
      'div',
      { className: 'hud-wares' },
      ...row.rewards.map((reward) => {
        const icon = el('canvas', { className: 'hud-icon' });
        api.gift(icon, reward.gift);
        fitIcon(icon, ROW_ICON);
        const sent = view.hearts >= reward.hearts;
        const when = el('span', { className: 'hud-band' }, sent ? '✓ Sent' : `♥ ${reward.hearts}`);
        const gift = el(
          'div',
          { className: 'hud-ware' },
          el('span', { className: 'hud-icon-box' }, icon),
          el(
            'span',
            { className: 'hud-ware-text' },
            el('strong', {}, reward.called ?? wareName(reward.gift)),
            el('small', {}, giftKind(reward.gift)),
          ),
          when,
        );
        gift.toggleAttribute('data-sent', sent);
        gift.setAttribute(
          'aria-label',
          `${reward.called ?? wareName(reward.gift)}, ${sent ? 'sent to you' : `at ${reward.hearts} hearts`}`,
        );
        return gift;
      }),
    ),
  );

  const said = el('p', { className: 'hud-message', role: 'status' });
  sheet.foot.prepend(said);
  sheet.actions(
    button('Everyone', () => openNeighbours(hud, api)),
    button(`👣 Find ${row.name}`, () => find(api, view, said, sheet.close), true),
  );
  return sheet.close;
}
