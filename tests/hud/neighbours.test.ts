import { beforeEach, describe, expect, it } from 'vitest';
import {
  bandOf,
  likesLine,
  openNeighbour,
  openNeighbours,
  placeOf,
  whereLine,
  type NeighbourView,
  type NeighboursApi,
} from '../../src/hud/NeighboursSheet';
import type { VillagerId } from '../../src/types/ids';

let hud: HTMLElement;
beforeEach(() => {
  document.body.replaceChildren();
  hud = document.createElement('div');
  document.body.append(hud);
});

function fakeApi(views: NeighbourView[], here: VillagerId[] = []) {
  const sought: VillagerId[] = [];
  const shadows: VillagerId[] = [];
  const api: NeighboursApi = {
    neighbours: () => views,
    today: () => '2026-11-02',
    found: (zone) => zone !== 'hiddenClearing',
    seek(id) {
      sought.push(id);
      return here.includes(id);
    },
    portrait: () => {},
    shadow: (_, id) => shadows.push(id),
    icon: () => {},
    gift: () => {},
  };
  return { api, sought, shadows };
}

const VIEWS: NeighbourView[] = [
  { id: 'maude', known: 'met', hearts: 4, where: { zone: 'library', doing: null } },
  { id: 'rufus', known: 'met', hearts: 0, where: { zone: 'whisperwood', doing: null } },
  { id: 'ollie', known: 'new', hearts: 0, where: { zone: 'town', doing: null } },
  { id: 'hazel', known: 'coming', hearts: 0, where: null },
];

const rows = () => [...hud.querySelectorAll<HTMLElement>('.hud-neighbour')];

describe("the neighbours sheet (0.2's U3)", () => {
  it('lists everyone, newcomers she has not met as a shape', () => {
    const { api, shadows } = fakeApi(VIEWS);
    openNeighbours(hud, api);
    expect(rows().map((r) => r.dataset.villager)).toEqual(['maude', 'rufus', 'ollie', 'hazel']);
    expect(rows()[0]!.textContent).toContain('Maude');
    expect(rows()[0]!.textContent).toContain('♥♥♥♥♡');
    // It's Maude's birthday.
    expect(rows()[0]!.textContent).toContain('🎂');
    expect(rows()[2]!.textContent).not.toContain('Ollie');
    expect(rows()[3]!.textContent).toContain('Someone new is coming.');
    expect(rows()[3]!.tagName).toBe('DIV');
    expect(shadows).toEqual(['ollie', 'hazel']);
    expect(hud.querySelector('.hud-sheet-line')!.textContent).toBe(
      '2 neighbours in McFrancisVille',
    );
  });

  it("opens a neighbour's page with their hearts, birthday, loves and gifts", () => {
    const { api } = fakeApi(VIEWS);
    openNeighbours(hud, api);
    rows()[0]!.click();
    expect(hud.querySelector('h2')!.textContent).toBe('Maude');
    expect(hud.querySelector('.hud-sheet-picture canvas')).not.toBeNull();
    const about = hud.querySelector<HTMLElement>('.hud-sheet-panel:not([hidden])')!;
    expect(about.textContent).toContain('Friends');
    expect(about.textContent).toContain('Maude is at home.');
    expect(about.textContent).toContain("2 November It's today!");
    expect(about.querySelectorAll('.hud-love').length).toBeGreaterThan(0);
    const gifts = [...hud.querySelectorAll<HTMLElement>('.hud-sheet-tab')].find(
      (t) => t.textContent === 'Gifts',
    )!;
    gifts.click();
    const sent = [...hud.querySelectorAll<HTMLElement>('.hud-ware')];
    expect(sent.map((w) => w.hasAttribute('data-sent'))).toEqual([true, false, false]);
    expect(sent[0]!.textContent).toContain('Recipe:');
  });

  it('walks to a neighbour who is here, and only says where one is otherwise', () => {
    const { api, sought } = fakeApi(VIEWS, ['maude']);
    openNeighbour(hud, api, 'rufus');
    const find = [...hud.querySelectorAll('button')].find(
      (b) => b.textContent === '👣 Find Rufus',
    )!;
    find.click();
    expect(sought).toEqual(['rufus']);
    expect(hud.querySelector('.hud-sheet')).not.toBeNull();
    expect(hud.querySelector('.hud-message')!.textContent).toBe(
      'Rufus is in Whisperwood. Head over and say hello!',
    );
    openNeighbour(hud, api, 'maude');
    [...hud.querySelectorAll('button')].find((b) => b.textContent === '👣 Find Maude')!.click();
    expect(hud.querySelector('.hud-sheet')).toBeNull();
  });

  it('says where they are, and what for, in a sentence', () => {
    expect(placeOf('cobwebCorner', 'cody', true)).toBe('at Cobweb Corner');
    expect(placeOf('muse', 'cody', true)).toBe('at the Muse Hair Salon');
    expect(placeOf('codyManor', 'cody', true)).toBe('at home');
    expect(placeOf('hiddenClearing', 'cody', false)).toBe("somewhere you haven't been yet");
    expect(whereLine('agatha', { zone: 'library', doing: { happening: 'bookClub' } }, true)).toBe(
      "Agatha is at Maude's library. Book club is on!",
    );
    expect(whereLine('maude', { zone: 'rufusCabin', doing: { visiting: 'rufus' } }, true)).toBe(
      'Maude is visiting Rufus.',
    );
    expect(whereLine('maude', { zone: 'home', doing: { visiting: 'her' } }, true)).toBe(
      'Maude is at your house, visiting you!',
    );
  });

  it('says what they like and how close they are', () => {
    expect(likesLine(['flower'])).toBe('flowers');
    expect(likesLine(['flower', 'snack', 'record'])).toBe('flowers, snacks and records');
    expect(bandOf(0)).toBe('Getting to know you');
    expect(bandOf(3)).toBe('Friends');
    expect(bandOf(7)).toBe('Close friends');
    expect(bandOf(10)).toBe('Best friends');
  });
});
