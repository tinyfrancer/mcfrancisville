import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEDICATION } from '../../src/data/greetings';
import {
  DEDICATION_SEEN_KEY,
  openTitle,
  TITLE_FADE_MS,
  type TitleApi,
} from '../../src/hud/TitleScreen';

const api: TitleApi = { art: () => {}, dedication: DEDICATION, festival: () => null };

function click(hud: HTMLElement, selector: string) {
  (hud.querySelector(selector) as HTMLElement).click();
}

describe('the title screen', () => {
  beforeEach(() => localStorage.clear());

  it('shows his dedication after it the first time, then starts the game once she answers', () => {
    const hud = document.createElement('div');
    let started = 0;
    openTitle(hud, api, () => started++);
    expect(hud.querySelector('.hud-title h1')?.textContent).toBe('McFrancisVille');
    expect(hud.querySelector('.hud-title-dedication')).toBeNull();

    click(hud, '.hud-title-begin');
    expect(hud.querySelector('.hud-title')).toBeNull();
    expect(hud.querySelector('.hud-dedication-line')?.textContent).toBe(
      'To my beautiful perfect angel baby wife, who is my whole world.',
    );
    expect(started).toBe(0);

    click(hud, '.hud-dedication-reply');
    expect(hud.querySelector('.hud-dedication')).toBeNull();
    expect(started).toBe(1);
  });

  it('greets her with his words on the title every time after, and starts at a tap', () => {
    localStorage.setItem(DEDICATION_SEEN_KEY, '1');
    const hud = document.createElement('div');
    let started = 0;
    openTitle(hud, api, () => started++);
    expect(hud.querySelector('.hud-title-dedication')?.textContent).toBe(DEDICATION.line);
    const title = hud.querySelector('.hud-title') as HTMLElement;
    title.click();
    title.click();
    expect(started).toBe(1);
    expect(hud.querySelector('.hud-dedication')).toBeNull();
  });

  it('says which festival is on, and how long till its big day', () => {
    const hud = document.createElement('div');
    openTitle(
      hud,
      {
        ...api,
        festival: () => ({ name: '🦇 The Halloween Festival', countdown: '26 days to Halloween!' }),
      },
      () => {},
    );
    expect(hud.querySelector('.hud-title-festival')?.textContent).toMatch(/26 days to Halloween/);
    const quiet = document.createElement('div');
    openTitle(quiet, api, () => {});
    expect(quiet.querySelector('.hud-title-festival')).toBeNull();
  });

  it('fades into the town rather than vanishing, where the phone lets things move (V1)', () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('no-preference'),
      media: query,
    }));
    localStorage.setItem(DEDICATION_SEEN_KEY, '1');
    const hud = document.createElement('div');
    let started = 0;
    openTitle(hud, api, () => started++);
    click(hud, '.hud-title-begin');
    expect(started).toBe(1);
    expect(hud.querySelector('.hud-title.hud-title-leaving')).not.toBeNull();
    // A second tap as it fades starts nothing more.
    click(hud, '.hud-title');
    expect(started).toBe(1);
    vi.advanceTimersByTime(TITLE_FADE_MS);
    expect(hud.querySelector('.hud-title')).toBeNull();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
});
