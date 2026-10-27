import { describe, expect, it } from 'vitest';
import { openWell, wellWords, type WellApi } from '../../src/hud/WellCard';
import type { WellView } from '../../src/world/services/Well';

function api(view: WellView, tossed: { n: number }): WellApi {
  return {
    view: () => view,
    toss() {
      tossed.n++;
      return true;
    },
    icon: () => {},
  };
}

const buttons = (hud: HTMLElement) =>
  [...hud.querySelectorAll('.hud-well-sheet button')].map((b) => b.textContent);

describe("the wishing well's card (1.7 Y2)", () => {
  it('offers Toss a Candy or Not today, and goes as she tosses, so the ripple is seen', () => {
    const hud = document.createElement('div');
    const tossed = { n: 0 };
    openWell(hud, api({ wished: false, candy: 5, costs: 1 }, tossed));
    expect(hud.querySelector('.hud-well-sheet h2')?.textContent).toBe('The wishing well');
    expect(buttons(hud)).toEqual(['Toss a Candy', 'Not today']);
    (hud.querySelector('.hud-well-toss') as HTMLButtonElement).click();
    expect(tossed.n).toBe(1);
    expect(hud.querySelector('.hud-well-sheet')).toBeNull();
  });

  it('says kindly when she has no Candy, and only Not today will do', () => {
    const hud = document.createElement('div');
    const tossed = { n: 0 };
    openWell(hud, api({ wished: false, candy: 0, costs: 1 }, tossed));
    expect((hud.querySelector('.hud-well-toss') as HTMLButtonElement).disabled).toBe(true);
    expect(hud.querySelector('.hud-well-words')?.textContent).toMatch(/doesn't mind/);
  });

  it('once she has wished today, says come back tomorrow, with nothing to toss', () => {
    const hud = document.createElement('div');
    openWell(hud, api({ wished: true, candy: 5, costs: 1 }, { n: 0 }));
    expect(buttons(hud)).toEqual(['Done']);
    expect(wellWords({ wished: true, candy: 5, costs: 1 })).toMatch(/tomorrow/);
    expect(wellWords({ wished: false, candy: 5, costs: 1 })).toMatch(/^Toss in 1 Candy/);
  });
});
