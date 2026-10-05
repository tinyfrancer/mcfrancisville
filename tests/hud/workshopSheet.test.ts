import { beforeEach, describe, expect, it } from 'vitest';
import type { Ware } from '../../src/data/shop';
import { BOOK_LINE, WORKSHOP } from '../../src/data/workshop';
import { openShop, type ShopApi } from '../../src/hud/ShopSheet';
import type { BookPage } from '../../src/systems/workshop';
import type { FurnitureId } from '../../src/types/ids';

const PAGES: BookPage[] = [
  { piece: 'pumpkinChair', group: 'floor', price: 438 },
  { piece: 'gardenBench', group: 'yard', price: 650 },
];

function workshopStub(candy: number): ShopApi & { ordered: FurnitureId[] } {
  const coming: Ware[] = [];
  const api = {
    ordered: [] as FurnitureId[],
    candy: () => candy,
    onCandy: () => () => {},
    stock: () => [
      {
        name: 'Fresh from the bench',
        offers: [{ ware: { furniture: 'batLamp' } as Ware, price: 420 }],
      },
    ],
    bag: () => [],
    owns: () => false,
    sellValue: () => 0,
    wanted: () => [],
    buy: () => false,
    sell: () => false,
    book: () => PAGES,
    orderMade(piece: FurnitureId) {
      api.ordered.push(piece);
      coming.push({ furniture: piece });
      return true;
    },
    onTheWay: () => coming,
    icon: () => {},
    tryOn: () => {},
    pieceIcon: () => {},
    recipeIcon: () => {},
    surfaceIcon: () => {},
    accessoryIcon: () => {},
  };
  return api;
}

let hud: HTMLElement;
beforeEach(() => {
  document.body.replaceChildren();
  hud = document.createElement('div');
  document.body.append(hud);
});

const tab = (label: string) =>
  [...hud.querySelectorAll<HTMLButtonElement>('.hud-sheet-tab')].find(
    (b) => b.textContent === label,
  )!;
const line = () => hud.querySelector('.hud-sheet-line')!.textContent;
const shown = () => hud.querySelector('.hud-sheet-panel:not([hidden])')!;

describe("Gourdon's workshop counter", () => {
  it('opens on what is fresh from the bench, with his greeting', () => {
    openShop(hud, workshopStub(1000), 'workshop');
    expect(tab('The bench').getAttribute('aria-selected')).toBe('true');
    expect(line()).toBe(WORKSHOP.greeting);
    expect(shown().textContent).toContain('Fresh from the bench');
    expect(shown().textContent).toContain('Bat lamp');
  });

  it('orders from his book, and says it is on its way', () => {
    const api = workshopStub(1000);
    openShop(hud, api, 'workshop');
    tab('His book').click();
    expect(line()).toBe(BOOK_LINE);
    const order = shown().querySelector<HTMLButtonElement>(
      'button[aria-label="Order Garden bench for 650"]',
    )!;
    order.click();
    expect(api.ordered).toEqual(['gardenBench']);
    expect(hud.querySelector('.hud-message')!.textContent).toMatch(/Gourdon.*morning/);
    expect(shown().textContent).toContain('One on its way.');
  });

  it("can't order what she can't afford", () => {
    openShop(hud, workshopStub(500), 'workshop');
    tab('His book').click();
    const dear = shown().querySelector<HTMLButtonElement>('button[aria-label^="Order Garden"]')!;
    expect(dear.disabled).toBe(true);
  });
});
