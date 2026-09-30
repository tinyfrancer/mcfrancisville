import { beforeEach, describe, expect, it } from 'vitest';
import { DEDICATION } from '../../src/data/greetings';
import { DEDICATION_SEEN_KEY, openTitle, type TitleApi } from '../../src/hud/TitleScreen';

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
});
