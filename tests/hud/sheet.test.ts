import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openSheet, SHEET_LEAVE_MS, sheetOpen } from '../../src/hud/dom';

const TABS = [
  { id: 'clothes', label: 'Clothes' },
  { id: 'face', label: 'Face' },
];

let hud: HTMLElement;
beforeEach(() => {
  document.body.replaceChildren();
  hud = document.createElement('div');
  document.body.append(hud);
});

const shown = () =>
  [...hud.querySelectorAll<HTMLElement>('.hud-sheet-panel')].filter((p) => !p.hidden);
const tab = (label: string) =>
  [...hud.querySelectorAll<HTMLButtonElement>('.hud-sheet-tab')].find(
    (b) => b.textContent === label,
  )!;

describe('the sheet frame (0.2 U2)', () => {
  it('puts a picture beside the title, and the line under it', () => {
    const picture = document.createElement('canvas');
    openSheet(hud, { title: 'Maude', line: 'The mummy', picture });
    const title = hud.querySelector('.hud-sheet-title')!;
    expect(title.querySelector('.hud-sheet-picture canvas')).toBe(picture);
    expect(title.querySelector('h2')!.textContent).toBe('Maude');
    expect(title.querySelector('h2 + .hud-sheet-line')!.textContent).toBe('The mummy');
  });

  it('has no picture box and no tabs when it has none', () => {
    openSheet(hud, { title: 'Your bag' });
    expect(hud.querySelector('.hud-sheet-picture')).toBeNull();
    expect(hud.querySelector('[role="tablist"]')).toBeNull();
    expect(hud.querySelector('.hud-sheet-panel')).toBeNull();
  });

  it('shows the first tab, and only its panel', () => {
    const sheet = openSheet(hud, { title: 'Closet', tabs: TABS });
    expect(sheet.tab()).toBe('clothes');
    expect(shown()).toEqual([sheet.panel('clothes')]);
    expect(tab('Clothes').getAttribute('aria-selected')).toBe('true');
    expect(tab('Face').getAttribute('aria-selected')).toBe('false');
    expect(sheet.panel('face').getAttribute('aria-labelledby')).toBe(tab('Face').id);
  });

  it('turns to a tab when it is tapped, and says so', () => {
    const turned: string[] = [];
    const sheet = openSheet(hud, { title: 'Closet', tabs: TABS, onTab: (id) => turned.push(id) });
    tab('Face').click();
    expect(sheet.tab()).toBe('face');
    expect(shown()).toEqual([sheet.panel('face')]);
    tab('Face').click();
    expect(turned).toEqual(['face']);
    sheet.show('clothes');
    expect(turned).toEqual(['face', 'clothes']);
  });

  it('opens on the tab asked for', () => {
    const sheet = openSheet(hud, { title: 'Closet', tabs: TABS, tab: 'face' });
    expect(shown()).toEqual([sheet.panel('face')]);
  });

  it('remembers the tab she was last on, by its memory', () => {
    openSheet(hud, { title: 'Closet', tabs: TABS, memory: 'test-closet' });
    tab('Face').click();
    const again = openSheet(hud, { title: 'Closet', tabs: TABS, memory: 'test-closet' });
    expect(again.tab()).toBe('face');
    const other = openSheet(hud, { title: 'Closet', tabs: TABS, memory: 'test-other' });
    expect(other.tab()).toBe('clothes');
  });

  it('has no panel for a tab it has not got', () => {
    const sheet = openSheet(hud, { title: 'Closet', tabs: TABS });
    expect(() => sheet.panel('hats')).toThrow();
  });
});

/** Whether the phone lets things move, as `matchMedia` would say. */
function motion(on: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: on && query.includes('no-preference'),
    media: query,
  }));
}

describe('a sheet sliding (V1, decision 283)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('slides away as it closes, out of reach and not counted as open, then is gone', () => {
    vi.useFakeTimers();
    motion(true);
    let closed = 0;
    const sheet = openSheet(hud, { title: 'Your bag', onClose: () => closed++ });
    sheet.close();
    expect(closed).toBe(1);
    expect(sheetOpen(hud)).toBe(false);
    const going = hud.querySelector<HTMLElement>('.hud-sheet-leaving')!;
    expect(going).not.toBeNull();
    expect(going.inert).toBe(true);
    expect(going.getAttribute('role')).toBeNull();
    expect(hud.querySelector('.hud-backdrop')).toBeNull();
    expect(hud.querySelector('.hud-backdrop-leaving')).not.toBeNull();
    vi.advanceTimersByTime(SHEET_LEAVE_MS);
    expect(hud.children).toHaveLength(0);
  });

  it('one opened over another cuts the first, so they never stack', () => {
    motion(true);
    openSheet(hud, { title: 'Your bag' });
    openSheet(hud, { title: 'Your closet' });
    expect(hud.querySelectorAll('.hud-sheet')).toHaveLength(1);
    expect(hud.querySelector('.hud-sheet-leaving')).toBeNull();
  });

  it('with reduced motion, it goes at once', () => {
    motion(false);
    openSheet(hud, { title: 'Your bag' }).close();
    expect(hud.children).toHaveLength(0);
  });
});
