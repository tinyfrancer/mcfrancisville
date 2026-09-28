import { describe, expect, it } from 'vitest';
import { arrange, collection, fitIcon, slotCount, type Entry } from '../../src/hud/collection';
import { openSheet } from '../../src/hud/dom';

const ENTRIES: Entry[] = [
  { id: 'wood', name: 'Wood', group: 'gathered', count: 3 },
  { id: 'rose', name: 'Rose', group: 'gathered', count: 1, isNew: true },
  { id: 'cafe', name: 'Café au lait', group: 'food', count: 7 },
  { id: 'pumpkin', name: 'Pumpkin', group: 'food', count: 2, isNew: true },
];

const ids = (entries: readonly Entry[]) => entries.map((e) => e.id);

describe('arranging a collection', () => {
  it('keeps its own order by kind, and filters by group', () => {
    const view = { group: null, sort: 'kind' as const, query: '' };
    expect(ids(arrange(ENTRIES, view))).toEqual(['wood', 'rose', 'cafe', 'pumpkin']);
    expect(ids(arrange(ENTRIES, { ...view, group: 'food' }))).toEqual(['cafe', 'pumpkin']);
  });

  it('sorts by name, new first, or most first, falling back on its own order', () => {
    const view = { group: null, query: '' };
    expect(ids(arrange(ENTRIES, { ...view, sort: 'name' }))).toEqual([
      'cafe',
      'pumpkin',
      'rose',
      'wood',
    ]);
    expect(ids(arrange(ENTRIES, { ...view, sort: 'new' }))).toEqual([
      'rose',
      'pumpkin',
      'wood',
      'cafe',
    ]);
    expect(ids(arrange(ENTRIES, { ...view, sort: 'most' }))).toEqual([
      'cafe',
      'wood',
      'pumpkin',
      'rose',
    ]);
  });

  it('finds by every word typed, whatever the case or accents', () => {
    const view = { group: null, sort: 'kind' as const };
    expect(ids(arrange(ENTRIES, { ...view, query: 'CAFE' }))).toEqual(['cafe']);
    expect(ids(arrange(ENTRIES, { ...view, query: 'au cafe' }))).toEqual(['cafe']);
    expect(ids(arrange(ENTRIES, { ...view, query: '  pum ' }))).toEqual(['pumpkin']);
    expect(arrange(ENTRIES, { ...view, query: 'bat' })).toEqual([]);
  });

  it('never changes the list it was given', () => {
    const before = ids(ENTRIES);
    arrange(ENTRIES, { group: null, sort: 'name', query: '' });
    expect(ids(ENTRIES)).toEqual(before);
  });
});

describe('the collection', () => {
  const make = (entries: Entry[], picks: string[] = []) =>
    collection({
      label: 'a test',
      entries: () => entries,
      groups: [
        { id: 'gathered', label: 'Gathered' },
        { id: 'food', label: 'Food' },
        { id: 'critters', label: 'Critters' },
      ],
      sorts: ['kind', 'name'],
      layout: 'grid',
      icon: (canvas) => {
        canvas.width = 16;
        canvas.height = 16;
      },
      pick: (e) => picks.push(e.id),
      empty: 'Nothing yet.',
    });

  it('draws a slot for each, with its count and a "new", padded out to whole rows', () => {
    const c = make(ENTRIES);
    const slots = [...c.list.querySelectorAll('button.hud-slot')];
    expect(slots.map((s) => s.getAttribute('aria-label'))).toEqual([
      'Wood',
      'Rose, new',
      'Café au lait',
      'Pumpkin, new',
    ]);
    expect(slots[0]!.querySelector('.hud-count')?.textContent).toBe('3');
    expect(slots[1]!.querySelector('.hud-new')).not.toBeNull();
    expect(c.list.querySelectorAll('.hud-slot-empty').length).toBe(slotCount(4) - 4);
  });

  it('hides a filter with nothing under it, and filters with a tap', () => {
    const c = make(ENTRIES);
    const chips = [...c.tools.querySelectorAll<HTMLButtonElement>('.hud-filters .hud-chip')];
    expect(chips.map((b) => [b.textContent, b.hidden])).toEqual([
      ['All', false],
      ['Gathered', false],
      ['Food', false],
      ['Critters', true],
    ]);
    chips[2]!.click();
    expect(c.list.querySelectorAll('button.hud-slot').length).toBe(2);
    expect(chips[2]!.getAttribute('aria-pressed')).toBe('true');
  });

  it('changes its order with a tap, and says it has nothing when empty', () => {
    const picks: string[] = [];
    const c = make(ENTRIES, picks);
    c.tools.querySelector<HTMLButtonElement>('.hud-sort')!.click();
    const first = c.list.querySelector<HTMLButtonElement>('button.hud-slot')!;
    expect(first.getAttribute('aria-label')).toBe('Café au lait');
    first.click();
    expect(picks).toEqual(['cafe']);
    expect(make([]).list.textContent).toBe('Nothing yet.');
  });

  it('offers a search only once there are enough to need one', () => {
    expect(make(ENTRIES).tools.querySelector<HTMLElement>('.hud-find')!.hidden).toBe(true);
    const many = Array.from({ length: 14 }, (_, i) => ({
      id: `e${i}`,
      name: `Thing ${i}`,
      group: 'food',
    }));
    const c = make(many);
    const search = c.tools.querySelector<HTMLInputElement>('.hud-search')!;
    expect(c.tools.querySelector<HTMLElement>('.hud-find')!.hidden).toBe(false);
    search.value = 'thing 12';
    search.dispatchEvent(new Event('input'));
    expect(c.list.querySelectorAll('button.hud-slot').length).toBe(1);
    search.value = 'bat';
    search.dispatchEvent(new Event('input'));
    expect(c.list.textContent).toContain('Nothing here matches');
  });
});

describe('icons', () => {
  it('are scaled to the largest whole number that fits the box', () => {
    const canvas = document.createElement('canvas');
    for (const [side, box, size] of [
      [16, 48, '48px'],
      [24, 48, '48px'],
      [32, 64, '64px'],
      [64, 64, '64px'],
      [32, 48, '32px'],
    ] as const) {
      canvas.width = side;
      canvas.height = side;
      fitIcon(canvas, box);
      expect(canvas.style.width, `${side} in ${box}`).toBe(size);
    }
  });
});

describe('a sheet', () => {
  it('has a head, a body and a foot, with Done last, and closes once', () => {
    const hud = document.createElement('div');
    let closed = 0;
    const sheet = openSheet(hud, { title: 'Bag', line: 'Hello', onClose: () => closed++ });
    const parts = [...sheet.element.children].map((c) => c.className);
    expect(parts).toEqual(['hud-sheet-head', 'hud-sheet-body', 'hud-sheet-foot']);
    expect(sheet.head.querySelector('h2')?.textContent).toBe('Bag');
    expect(sheet.head.querySelector('p')?.textContent).toBe('Hello');
    const done = sheet.foot.querySelector<HTMLButtonElement>('.hud-done')!;
    expect(done.textContent).toBe('Done');
    done.click();
    sheet.close();
    expect(closed).toBe(1);
    expect(hud.children.length).toBe(0);
  });

  it('closes whatever sheet was open before it', () => {
    const hud = document.createElement('div');
    const first = openSheet(hud, { title: 'One' });
    openSheet(hud, { title: 'Two', done: null });
    expect(first.element.isConnected).toBe(false);
    expect(hud.querySelectorAll('.hud-sheet').length).toBe(1);
    expect(hud.querySelector('.hud-done')).toBeNull();
  });
});
