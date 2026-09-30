import { describe, expect, it } from 'vitest';
import { heldLine, quickBar, type QuickApi } from '../../src/hud/QuickBar';
import type { Stack } from '../../src/world/Bag';

function stub(
  seeds: Stack[],
  outdoors = true,
  broom = false,
): QuickApi & { holding: string; flown: number } {
  const api = {
    holding: 'hands',
    flown: 0,
    hasBroom: () => broom,
    flyHome: () => (api.flown += 1),
    broomIcon: () => {},
    held: () => api.holding,
    seeds: () => seeds,
    hold: (held: string) => (api.holding = held),
    shown: () => outdoors,
    onChange: () => () => {},
    toolIcon: () => {},
    itemIcon: () => {},
  };
  return api;
}

const labels = (element: HTMLElement) =>
  [...element.querySelectorAll('.hud-quick-slot')].map((b) => b.getAttribute('aria-label'));

describe('the quick bar', () => {
  it('has her hands, net, can and rod, then each seed in her bag', () => {
    const bar = quickBar(stub([{ id: 'pumpkinSeed', count: 4 }]));
    expect(labels(bar.element)).toEqual([
      'Hands',
      'Bug net',
      'Watering can',
      'Fishing rod',
      'Pumpkin seed, 4',
    ]);
  });

  it('picks a seed up with a tap, and puts it down with another', () => {
    const api = stub([{ id: 'pumpkinSeed', count: 4 }]);
    const bar = quickBar(api);
    const seed = () => bar.element.querySelector<HTMLButtonElement>('[aria-label^="Pumpkin"]')!;
    seed().click();
    expect(api.holding).toBe('pumpkinSeed');
    expect(bar.element.querySelector('.hud-quick-say')?.textContent).toBe(
      'Pumpkin seed ×4: tap a bed to plant one, or a whole row.',
    );
    bar.render();
    expect(seed().getAttribute('aria-pressed')).toBe('true');
    seed().click();
    expect(api.holding).toBe('hands');
  });

  it('keeps a tool in her hand when it is tapped again', () => {
    const api = stub([]);
    const bar = quickBar(api);
    const net = bar.element.querySelector<HTMLButtonElement>('[aria-label="Bug net"]')!;
    net.click();
    net.click();
    expect(api.holding).toBe('net');
  });

  it('is put away indoors', () => {
    expect(quickBar(stub([], false)).element.hidden).toBe(true);
  });

  it('says what a tool is for', () => {
    expect(heldLine('can', [])).toMatch(/water/);
  });
});

describe("her broom on the quick bar (0.2's P1)", () => {
  it('is first on the bar once she has it, and a tap flies her home rather than being held', () => {
    expect(labels(quickBar(stub([])).element)).not.toContain('Broom home');
    const api = stub([], true, true);
    const bar = quickBar(api);
    expect(labels(bar.element)[0]).toBe('Broom home');
    bar.element.querySelector<HTMLButtonElement>('[aria-label="Broom home"]')!.click();
    expect(api.flown).toBe(1);
    expect(api.holding).toBe('hands');
  });
});
