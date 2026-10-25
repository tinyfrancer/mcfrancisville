import { describe, expect, it } from 'vitest';
import { FakeClock, dayKey } from '../../src/systems/clock';
import { moundSpot } from '../../src/systems/fossils';
import { Decorations } from '../../src/world/zones/Decorations';
import { MinuteDay } from '../../src/world/zones/MinuteDay';
import { Mounds } from '../../src/world/zones/Mounds';

/* The overlays keep the day key by the minute, as Stalls does (1.3's F2, decision 361). */

const at = (month: number, date: number, hour = 12, minute = 0, second = 0, ms = 0) =>
  new Date(2026, month, date, hour, minute, second, ms);

/** The first 5am in 2026 after which `read` of the day's noon is not what it was the day before. */
function firstTurn<T>(read: (noon: Date) => T, same: (a: T, b: T) => boolean): Date {
  for (let i = 0; i < 365; i++) {
    if (!same(read(at(0, 1 + i)), read(at(0, 2 + i)))) return at(0, 2 + i, 5);
  }
  throw new Error('nothing changed all year');
}

const shown = (decor: Decorations) => decor.props().map((p) => `${p.id}@${p.tx},${p.ty}`);

describe('MinuteDay', () => {
  it('is dayKey, read afresh only when the minute turns', () => {
    const clock = new FakeClock(at(9, 24, 12));
    let reads = 0;
    const days = new MinuteDay(() => (reads++, clock.now()));
    expect(days.get()).toBe('2026-10-24');
    clock.set(at(9, 24, 12, 0, 59, 999));
    expect(days.get()).toBe('2026-10-24');
    clock.set(at(9, 25, 12));
    expect(days.get()).toBe('2026-10-25');
    expect(reads).toBe(3);
  });

  it('turns with the day at 5am to the millisecond, across a year of days', () => {
    const clock = new FakeClock(at(0, 1, 4, 59, 59, 999));
    const days = new MinuteDay(() => clock.now());
    for (let i = 0; i < 366; i++) {
      for (const [h, m, s, ms] of [
        [4, 58, 0, 0],
        [4, 59, 59, 999],
        [5, 0, 0, 0],
        [5, 0, 30, 0],
        [23, 59, 59, 999],
        [0, 0, 0, 0],
      ] as const) {
        clock.set(new Date(2026, 0, 1 + i, h, m, s, ms));
        expect(days.get(), `${i} ${h}:${m}`).toBe(dayKey(clock.now()));
      }
    }
  });

  it('follows a clock set back as well as forward', () => {
    const clock = new FakeClock(at(9, 24, 12));
    const days = new MinuteDay(() => clock.now());
    expect(days.get()).toBe('2026-10-24');
    clock.set(at(9, 20, 12));
    expect(days.get()).toBe('2026-10-20');
  });
});

describe('Decorations through 5am', () => {
  it("change the square's piece the moment the day turns, while she plays", () => {
    const piece = (d: Date) => shown(new Decorations(() => d.getTime()));
    const turn = firstTurn(piece, (a, b) => a.join() === b.join());
    const was = piece(new Date(turn.getTime() - 3_600_000));
    const now = piece(turn);
    expect(was).not.toEqual(now);

    const clock = new FakeClock(turn.getTime() - 120_000);
    const decor = new Decorations(() => clock.now());
    // Asked on every step through the last two minutes of the old day, then at the turn.
    for (let ms = -120_000; ms < 0; ms += 997) {
      clock.set(turn.getTime() + ms);
      expect(shown(decor), `${ms}`).toEqual(was);
    }
    clock.set(turn.getTime() - 1);
    expect(shown(decor)).toEqual(was);
    clock.set(turn);
    expect(shown(decor)).toEqual(now);
  });

  it('freeze the pond with the winter day, and thaw it with the morning after', () => {
    const frozen = (d: Date) => new Decorations(() => d.getTime()).frozen;
    const turn = firstTurn(frozen, (a, b) => a === b);
    const was = frozen(new Date(turn.getTime() - 3_600_000));
    const clock = new FakeClock(turn.getTime() - 60_000);
    const decor = new Decorations(() => clock.now());
    expect(decor.frozen).toBe(was);
    clock.set(turn.getTime() - 1);
    expect(decor.frozen).toBe(was);
    clock.set(turn);
    expect(decor.frozen).toBe(!was);
  });
});

describe('Mounds through 5am', () => {
  const spots = Array.from({ length: 12 }, (_, i) => ({ tx: i + 1, ty: 3 }));

  it('move the mound the moment the day turns, while she plays', () => {
    const spotOn = (d: Date) => moundSpot('town', spots, dayKey(d.getTime()))!;
    const turn = firstTurn(spotOn, (a, b) => a.tx === b.tx);
    const was = spotOn(new Date(turn.getTime() - 1));
    const now = spotOn(turn);
    expect(was.tx).not.toBe(now.tx);

    const clock = new FakeClock(turn.getTime() - 120_000);
    const mounds = new Mounds('town', spots, clock);
    expect(mounds.today()).toMatchObject(was);
    expect(mounds.blocks(was.tx, was.ty)).toBe(true);
    clock.set(turn.getTime() - 1);
    expect(mounds.blocks(was.tx, was.ty)).toBe(true);
    expect(mounds.blocks(now.tx, now.ty)).toBe(false);
    clock.set(turn);
    expect(mounds.today()).toMatchObject(now);
    expect(mounds.blocks(now.tx, now.ty)).toBe(true);
    expect(mounds.blocks(was.tx, was.ty)).toBe(false);
  });

  it('has no mound where there is nowhere to dig', () => {
    const mounds = new Mounds('town', [], new FakeClock(at(9, 24)));
    expect(mounds.today()).toBeNull();
    expect(mounds.blocks(1, 3)).toBe(false);
  });
});
