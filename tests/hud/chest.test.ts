import { beforeEach, describe, expect, it } from 'vitest';
import { openBag, type BagApi } from '../../src/hud/BagSheet';
import { openStorage, type HomeApi } from '../../src/hud/HomeSheets';
import type { ItemId } from '../../src/types/ids';
import type { Stack } from '../../src/world/Bag';

const tap = (root: ParentNode, selector: string) =>
  root.querySelector<HTMLButtonElement>(selector)!.click();
const foot = (hud: HTMLElement) => hud.querySelector<HTMLElement>('.hud-sheet-foot')!;
const buttons = (hud: HTMLElement) =>
  [...foot(hud).querySelectorAll('.hud-item-card .hud-price')].map((b) => b.textContent);

/** Moves `count` of `id` from one list of stacks to the other, as the world's chest does. */
function move(from: Stack[], to: Stack[], id: ItemId, count: number): boolean {
  const stack = from.find((s) => s.id === id);
  if (!stack || stack.count < count) return false;
  stack.count -= count;
  if (stack.count === 0) from.splice(from.indexOf(stack), 1);
  const there = to.find((s) => s.id === id);
  if (there) there.count += count;
  else to.push({ id, count });
  return true;
}

function bagStub(bag: Stack[], chest: Stack[], home = true): BagApi {
  return {
    contents: () => bag,
    canEat: () => false,
    eat: () => null,
    worn: () => 0,
    canWear: () => false,
    wear: () => false,
    takeOff: () => false,
    icon: () => {},
    canPutAway: (id) =>
      home && id !== 'iceSkates' ? (bag.find((s) => s.id === id)?.count ?? 0) : 0,
    putAway: (id, count) => move(bag, chest, id, count),
    isNew: () => false,
    seen: () => {},
  };
}

function homeStub(bag: Stack[], chest: Stack[]): HomeApi {
  return {
    indoors: () => true,
    inYard: () => false,
    outdoors: () => false,
    onChange: () => () => {},
    stored: () => [],
    selected: () => undefined,
    startDecorating: () => {},
    stopDecorating: () => {},
    takeOut: () => false,
    turn: () => false,
    putAway: () => false,
    wallpapers: () => [],
    floorings: () => [],
    wallpaper: () => 'plumStripes',
    flooring: () => 'oakBoards',
    paper: () => {},
    lay: () => {},
    isNew: () => false,
    seen: () => {},
    icon: () => {},
    items: () => chest,
    takeOutItem: (id, count) => move(chest, bag, id, count),
    itemIcon: () => {},
    surfaceIcon: () => {},
  };
}

let hud: HTMLElement;
beforeEach(() => {
  document.body.replaceChildren();
  hud = document.createElement('div');
  document.body.append(hud);
});

describe('putting things away in her storage chest (0.3’s H1)', () => {
  it('offers one, some or all of a stack from her bag at home', () => {
    const bag: Stack[] = [
      { id: 'wood', count: 3 },
      { id: 'iceSkates', count: 1 },
    ];
    const chest: Stack[] = [];
    openBag(hud, bagStub(bag, chest));
    tap(hud, '.hud-slot[aria-label^="Ice skates"]');
    expect(buttons(hud)).toEqual([]);
    tap(hud, '.hud-slot[aria-label^="Wood"]');
    expect(buttons(hud)).toEqual(['Put away 1', 'Put away all']);
    tap(foot(hud), '.hud-put-away');
    expect(chest).toEqual([{ id: 'wood', count: 1 }]);
    expect(foot(hud).querySelector('.hud-item-card h3')!.textContent).toBe('Wood ×2');
    tap(foot(hud), '.hud-put-all');
    expect(bag.map((s) => s.id)).toEqual(['iceSkates']);
    expect(chest).toEqual([{ id: 'wood', count: 3 }]);
    expect(foot(hud).querySelector('.hud-item-card p')!.textContent).toContain('chest');
    expect(hud.querySelector('.hud-slot[aria-label^="Wood"]')).toBeNull();
  });

  it('offers nothing away from home', () => {
    const bag: Stack[] = [{ id: 'wood', count: 3 }];
    openBag(hud, bagStub(bag, [], false));
    tap(hud, '.hud-slot[aria-label^="Wood"]');
    expect(buttons(hud)).toEqual([]);
  });

  it('keeps them on the chest’s Items tab, to take some or all back out', () => {
    const bag: Stack[] = [];
    const chest: Stack[] = [{ id: 'stone', count: 4 }];
    openStorage(hud, homeStub(bag, chest));
    tap(hud, '.hud-sheet-tab:nth-child(2)');
    expect(hud.querySelector('.hud-sheet-tab[aria-selected="true"]')!.textContent).toBe('Items');
    tap(hud, '.hud-slot[aria-label^="Stone"]');
    expect(buttons(hud)).toEqual(['Take out 1', 'Take out all']);
    tap(foot(hud), '.hud-take-out');
    expect(bag).toEqual([{ id: 'stone', count: 1 }]);
    tap(foot(hud), '.hud-take-all');
    expect(bag).toEqual([{ id: 'stone', count: 4 }]);
    expect(chest).toEqual([]);
    expect(hud.querySelector('.hud-slot[aria-label^="Stone"]')).toBeNull();
    tap(hud, '.hud-sheet-tab:nth-child(1)');
    expect(foot(hud).querySelector('.hud-item-card')).toBeNull();
  });
});
