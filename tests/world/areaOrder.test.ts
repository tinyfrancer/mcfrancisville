import { afterEach, describe, expect, it, vi } from 'vitest';
import { FakeClock } from '../../src/systems/clock';
import { AREAS, type AreaName, type AreaStep } from '../../src/world/areas/order';
import { EventBus } from '../../src/world/eventBus';
import { World, type WorldOptions } from '../../src/world/World';
import { tinyMap } from './harness';

/** The rows, read as steps, so each may leave out a bus. */
const STEPS: readonly AreaStep[] = AREAS;

/** What each area listens for, by bus, in order. */
type Heard = { signals: string[]; state: string[] };

/** What making a world did, in order: each area told, every listener, and anything sent. */
interface Made {
  areas: AreaName[];
  heard: Map<AreaName, Heard>;
  sent: string[];
}

/** Makes a world with its buses watched, each listener put down to the area made with it. */
function make(options: Omit<WorldOptions, 'clock' | 'areaMade'> = {}): Made {
  const areas: AreaName[] = [];
  const listening = new Map<AreaName, { bus: object; key: string }[]>();
  const sent: string[] = [];
  let waiting: { bus: object; key: string }[] = [];
  const on = EventBus.prototype.on;
  const emit = EventBus.prototype.emit;
  vi.spyOn(EventBus.prototype, 'on').mockImplementation(function (this: object, key, handler) {
    waiting.push({ bus: this, key: String(key) });
    return on.call(this as EventBus<never>, key as never, handler as never);
  });
  vi.spyOn(EventBus.prototype, 'emit').mockImplementation(function (this: object, key, value) {
    sent.push(String(key));
    return emit.call(this as EventBus<never>, key as never, value as never);
  });
  const clock = new FakeClock(new Date(2026, 8, 26, 12));
  const world = new World({
    ...options,
    clock,
    areaMade: (area) => {
      areas.push(area);
      listening.set(area, waiting);
      waiting = [];
    },
  });
  vi.restoreAllMocks();
  expect(waiting, 'listeners after the last area').toEqual([]);
  const keys = (on: { bus: object; key: string }[], bus: object) =>
    on.filter((l) => l.bus === bus).map((l) => l.key);
  const heard = new Map<AreaName, Heard>();
  for (const [area, on] of listening) {
    expect(on.every((l) => l.bus === world.ctx.signals || l.bus === world.ctx.events)).toBe(true);
    heard.set(area, { signals: keys(on, world.ctx.signals), state: keys(on, world.ctx.events) });
  }
  return { areas, heard, sent };
}

describe("the world's areas (1.1's W3)", () => {
  afterEach(() => vi.restoreAllMocks());

  const towns: [string, () => Made][] = [
    ['the town', () => make()],
    ['a small map with no neighbours', () => make({ map: tinyMap(['###', '#.#', '###']) })],
  ];

  for (const [name, made] of towns) {
    describe(name, () => {
      it("are made in `AREAS`' order", () => {
        expect(made().areas).toEqual(STEPS.map((step) => step.area));
      });

      it('each listen for what `AREAS` says, in that order', () => {
        const { heard } = made();
        for (const step of STEPS) {
          expect(heard.get(step.area as AreaName), step.area).toEqual({
            signals: [...(step.hears.signals ?? [])],
            state: [...(step.hears.state ?? [])],
          });
        }
      });

      it('send nothing while the world is made, so none made later misses one', () => {
        expect(made().sent).toEqual([]);
      });
    });
  }

  it('hear each signal in the order the areas are made', () => {
    // What decision 218 kept, read off `AREAS`: who hears her cross, a letter opened, the bag.
    const hearers = (key: string, bus: 'signals' | 'state') =>
      STEPS.flatMap((step) =>
        (step.hears[bus] ?? []).filter((k: string) => k === key).map(() => step.area),
      );
    expect(hearers('crossed', 'signals')).toEqual([
      'neighbours',
      'forget',
      'homeServices',
      'homeServices',
      'petServices',
    ]);
    expect(hearers('opened', 'signals')).toEqual(['mystery', 'going']);
    expect(hearers('bag', 'state')).toEqual(['making', 'firstDay', 'her', 'her', 'her']);
  });
});
