import { beforeEach, describe, expect, it } from 'vitest';
import type { Ware } from '../../src/data/shop';
import { BOOK_LINE, WORKSHOP } from '../../src/data/workshop';
import { openShop, type ShopApi } from '../../src/hud/ShopSheet';
import type { BookPage } from '../../src/systems/workshop';
import { CARVING_LINE } from '../../src/data/figurines';
import { carvingsFrom } from '../../src/systems/figurines';
import type { Carvable, FurnitureId, ItemId } from '../../src/types/ids';

const PAGES: BookPage[] = [
  { piece: 'pumpkinChair', group: 'floor', price: 438 },
  { piece: 'gardenBench', group: 'yard', price: 650 },
];

function workshopStub(
  candy: number,
  has: Partial<Record<ItemId, number>> = {},
): ShopApi & { ordered: FurnitureId[]; carved: Carvable[] } {
  const coming: Ware[] = [];
  const api = {
    ordered: [] as FurnitureId[],
    carved: [] as Carvable[],
    carvings: () => carvingsFrom((id) => has[id] ?? 0),
    carve(thing: Carvable) {
      if ((has[thing] ?? 0) < 3) return null;
      has[thing]! -= 3;
      api.carved.push(thing);
      return { first: api.carved.length === 1 };
    },
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

  it("carves a figurine from three, and only from three, on Gourdon's Figurines tab (0.3's C3)", () => {
    const api = workshopStub(0, { lunaMoth: 3, trilobite: 2 });
    openShop(hud, api, 'workshop');
    tab('Figurines').click();
    expect(line()).toBe(CARVING_LINE);
    const carve = (name: string) =>
      shown().querySelector<HTMLButtonElement>(`button[aria-label="Carve ${name}"]`)!;
    expect(carve('Trilobite figurine').disabled).toBe(true);
    expect(shown().textContent).toContain('One more');
    carve('Luna moth figurine').click();
    expect(api.carved).toEqual(['lunaMoth']);
    expect(hud.querySelector('.hud-message')!.textContent).toContain('Luna moth figurine, carved');
    // None left of the moths, so only the trilobite is still there to carve one day.
    expect(shown().querySelector('button[aria-label="Carve Luna moth figurine"]')).toBeNull();
  });
});
