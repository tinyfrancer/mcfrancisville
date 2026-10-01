import { beforeEach, describe, expect, it } from 'vitest';
import { openBag, type BagApi } from '../../src/hud/BagSheet';
import { howMany } from '../../src/hud/itemCard';
import { openShop, type ShopApi } from '../../src/hud/ShopSheet';
import type { ItemId } from '../../src/types/ids';
import type { Stack } from '../../src/world/Bag';

function shopStub(stacks: Stack[]): ShopApi & { sold: [ItemId, number][] } {
  const api = {
    sold: [] as [ItemId, number][],
    candy: () => 100,
    onCandy: () => () => {},
    stock: () => [],
    bag: () => stacks,
    owns: () => false,
    sellValue: (id: ItemId) => (id === 'purseButter' ? 0 : id === 'pumpkin' ? 20 : 5),
    wanted: () => ['lunaMoth', 'pumpkin', 'pumpkinSoup'] as ItemId[],
    buy: () => false,
    sell(id: ItemId, count: number) {
      const stack = stacks.find((s) => s.id === id)!;
      stack.count -= count;
      if (stack.count === 0) stacks.splice(stacks.indexOf(stack), 1);
      api.sold.push([id, count]);
      return true;
    },
    icon: () => {},
    tryOn: () => {},
    pieceIcon: () => {},
    recipeIcon: () => {},
    surfaceIcon: () => {},
    accessoryIcon: () => {},
  };
  return api;
}

const tap = (root: ParentNode, selector: string) =>
  root.querySelector<HTMLButtonElement>(selector)!.click();
const foot = (hud: HTMLElement) => hud.querySelector<HTMLElement>('.hud-sheet-foot')!;

let hud: HTMLElement;
beforeEach(() => {
  document.body.replaceChildren();
  hud = document.createElement('div');
  document.body.append(hud);
});

describe('how many', () => {
  it('counts from one up to all she has, and no further either way', () => {
    const seen: number[] = [];
    const pick = howMany(3, (n) => seen.push(n));
    const [less, , more] = [...pick.element.children] as HTMLButtonElement[];
    expect(pick.value()).toBe(1);
    expect(less!.disabled).toBe(true);
    more!.click();
    more!.click();
    expect(pick.value()).toBe(3);
    expect(more!.disabled).toBe(true);
    less!.click();
    expect(seen).toEqual([2, 3, 2]);
  });
});

describe("selling at Cobweb Corner's counter", () => {
  it('shows what she tapped in the foot, where it stays in sight', () => {
    const stacks: Stack[] = [
      { id: 'purseButter', count: 5 },
      { id: 'wood', count: 30 },
      { id: 'stone', count: 4 },
    ];
    openShop(hud, shopStub(stacks), 'corner');
    tap(hud, '.hud-tabs .hud-chip:last-child');
    tap(hud, '.hud-sheet-body .hud-slot[aria-label^="Stone"]');
    const card = foot(hud).querySelector('.hud-item-card')!;
    expect(card.querySelector('h3')!.textContent).toBe('Stone ×4');
    expect(card.querySelector('p')!.textContent).toContain('🍬 5 each');
    expect(card.querySelector('.hud-sell-one')!.textContent).toBe('Sell 1 for 🍬 5');
  });

  it('sells one, as many as she counts up to, or all', () => {
    const stacks: Stack[] = [{ id: 'wood', count: 6 }];
    const api = shopStub(stacks);
    openShop(hud, api, 'corner');
    tap(hud, '.hud-tabs .hud-chip:last-child');
    tap(hud, '.hud-sheet-body .hud-slot');
    tap(foot(hud), '.hud-sell-one');
    tap(foot(hud), '.hud-how-many [aria-label="One more"]');
    tap(foot(hud), '.hud-how-many [aria-label="One more"]');
    expect(foot(hud).querySelector('.hud-sell-one')!.textContent).toBe('Sell 3 for 🍬 15');
    tap(foot(hud), '.hud-sell-one');
    tap(foot(hud), '.hud-sell-all');
    expect(api.sold).toEqual([
      ['wood', 1],
      ['wood', 3],
      ['wood', 2],
    ]);
    expect(foot(hud).querySelector('h3')!.textContent).toBe('Tap something to sell it');
    expect(hud.querySelector('.hud-message')!.textContent).toMatch(/Sold/);
  });

  it("says what's wanted this week, and when what she tapped is (0.2's E1)", () => {
    openShop(hud, shopStub([{ id: 'pumpkin', count: 2 }]), 'corner');
    tap(hud, '.hud-tabs .hud-chip:last-child');
    expect(hud.textContent).toContain(
      'Wanted this week, for double Candy: a luna moth, a pumpkin and a pumpkin soup.',
    );
    tap(hud, '.hud-sheet-body .hud-slot');
    expect(foot(hud).querySelector('p')!.textContent).toContain('Wanted this week, so double!');
  });

  it("says why it won't take her purse butter, with nothing to press", () => {
    openShop(hud, shopStub([{ id: 'purseButter', count: 5 }]), 'corner');
    tap(hud, '.hud-tabs .hud-chip:last-child');
    tap(hud, '.hud-sheet-body .hud-slot');
    expect(foot(hud).querySelector('.hud-sell-one')).toBeNull();
    expect(foot(hud).querySelector('.hud-row')!.hasAttribute('hidden')).toBe(true);
  });

  it('keeps the counter out of the foot while she buys', () => {
    openShop(hud, shopStub([{ id: 'wood', count: 2 }]), 'corner');
    expect(foot(hud).querySelector('.hud-item-card')).toBeNull();
    expect(hud.querySelector<HTMLElement>('.hud-shop-finder')!.hidden).toBe(true);
  });
});

describe('the bag', () => {
  it('shows a thing on the same card, with Eat for what can be eaten', () => {
    const stacks: Stack[] = [
      { id: 'wood', count: 3 },
      { id: 'pumpkinSoup', count: 1 },
    ];
    const api: BagApi = {
      contents: () => stacks,
      canEat: (id) => id === 'pumpkinSoup',
      eat(id) {
        stacks.splice(
          stacks.findIndex((s) => s.id === id),
          1,
        );
        return 'Yum!';
      },
      worn: () => 0,
      canWear: () => false,
      wear: () => false,
      takeOff: () => false,
      icon: () => {},
      isNew: () => false,
      seen: () => {},
    };
    openBag(hud, api);
    tap(hud, '.hud-slot[aria-label^="Wood"]');
    expect(foot(hud).querySelector('.hud-item-card h3')!.textContent).toBe('Wood ×3');
    expect(foot(hud).querySelector('.hud-eat')).toBeNull();
    tap(hud, '.hud-slot[aria-label^="Pumpkin soup"]');
    tap(foot(hud), '.hud-eat');
    expect(foot(hud).querySelector('.hud-item-card p')!.textContent).toBe('Yum!');
    expect(foot(hud).querySelector('.hud-eat')).toBeNull();
  });

  it('puts a bracelet on her wrist and takes it off, marking it worn', () => {
    const stacks: Stack[] = [{ id: 'loveBracelet', count: 1 }];
    let worn = 0;
    const api: BagApi = {
      contents: () => stacks,
      canEat: () => false,
      eat: () => null,
      worn: () => worn,
      canWear: () => worn === 0,
      wear: () => (worn = 1) === 1,
      takeOff: () => (worn = 0) === 0,
      icon: () => {},
      isNew: () => false,
      seen: () => {},
    };
    openBag(hud, api);
    tap(hud, '.hud-slot[aria-label^="LOVE bracelet"]');
    const buttons = () => [...foot(hud).querySelectorAll('.hud-eat')].map((b) => b.textContent);
    expect(buttons()).toEqual(['Wear']);
    tap(foot(hud), '.hud-eat');
    expect(buttons()).toEqual(['Take off']);
    expect(foot(hud).querySelector('.hud-item-card p')!.textContent).toContain('on your wrist');
    expect(
      hud.querySelector('.hud-slot[aria-label="LOVE bracelet, 1, wearing"] .hud-tag'),
    ).not.toBeNull();
    tap(foot(hud), '.hud-eat');
    expect(buttons()).toEqual(['Wear']);
  });
});
