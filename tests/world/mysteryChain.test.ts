import { describe, expect, it } from 'vitest';
import { CLUES } from '../../src/data/mystery';
import { CHAIN, CHAIN_DAYS, CHAIN_LAST } from '../../src/data/mysteryChain';
import { MYSTERY_TALK } from '../../src/data/mysteryTalk';
import { DEFAULT_LOOK } from '../../src/data/outfits';
import { fill } from '../../src/systems/friendship';
import { WES_FIRST, WES_GLIMPSES } from '../../src/data/wes';
import { daysBetween } from '../../src/systems/calendar';
import { dayKey } from '../../src/systems/clock';
import { WES_SLOT_MS, wesLurks } from '../../src/systems/mystery';
import { harness, type Harness } from './harness';

const her = { closet: { look: { ...DEFAULT_LOOK, name: 'Em' } } };

/** Opens every letter from the mayor waiting in her mailbox. */
function readMayor(h: Harness): void {
  for (const m of h.world.mailbox.view()) {
    if (m.id.startsWith('mayor:') && !m.opened) h.world.mailbox.open(m.id);
  }
}

/** Walks her up to the town's first prop of a kind. */
function walkUpTo(h: Harness, id: string): void {
  const prop = h.world.map.props.find((p) => p.id === id)!;
  expect(h.world.tapTile(prop.tx, prop.ty), `walking to ${id}`).toBe(true);
  h.until(() => !h.world.player.moving && h.world.target === null, `reaching ${id}`);
}

/**
 * A day of her playing: the morning's post read, and, if the chain's clue waits somewhere today,
 * a walk up to it. Back home after, so the next walk starts from her door.
 */
function playDay(h: Harness, date: Date): void {
  h.clock.set(date);
  h.tick(2);
  readMayor(h);
  h.tick(1);
  const step = CHAIN.find((s) => h.world.casebook.foundOn(s.clue) === null);
  if (step && 'at' in step && h.world.mystery.daysUntil(step.clue) === 0) {
    walkUpTo(h, step.at);
    h.tick(1);
  }
}

describe("the mystery, chapter by chapter (V1's P3a)", () => {
  it('reaches its last clue in two months of reading, a week apart', () => {
    const h = harness(undefined, her);
    const start = new Date(2026, 8, 26, 10);
    for (let d = 0; d <= 61 && h.world.mystery.ready() === null; d++) {
      playDay(h, new Date(2026, 8, 26 + d, 10));
    }
    const ready = h.world.mystery.ready();
    expect(ready).not.toBeNull();
    expect(daysBetween(dayKey(start.getTime()), ready!)).toBeLessThanOrEqual(61);
    // Each step a week after the one before, from the mayor's second letter.
    const days = ['typewriter' as const, ...CHAIN.map((s) => s.clue)].map((id) =>
      h.world.casebook.foundOn(id)!,
    );
    for (let i = 1; i < days.length; i++) {
      expect(daysBetween(days[i - 1]!, days[i]!), CHAIN[i - 1]!.clue).toBe(CHAIN_DAYS);
    }
    expect(h.world.casebook.foundOn(CHAIN_LAST)).toBe(ready);
    // Both suspects end up cleared.
    expect(CHAIN.some((s) => CLUES[s.clue].clears === 'wes')).toBe(true);
    expect(CHAIN.some((s) => CLUES[s.clue].clears === 'moonPieMan')).toBe(true);
  });

  it('waits for her to read each letter, and counts the week from the reading', () => {
    const h = harness(undefined, {
      ...her,
      mystery: { clues: { welcome: '2026-09-01', typewriter: '2026-09-08' }, began: '2026-09-01' },
    });
    h.tick(1);
    const letter = () => h.world.mailbox.view().find((m) => m.id === 'mayor:2');
    expect(letter()).toBeDefined();
    // A week unread brings nothing more.
    h.clock.set(new Date(2026, 9, 5, 12));
    h.tick(1);
    expect(h.world.mailbox.view().map((m) => m.id)).not.toContain('mayor:3');
    h.world.mailbox.open('mayor:2');
    h.tick(1);
    expect(h.world.casebook.foundOn('wobblyLetter')).toBe('2026-10-05');
    expect(h.world.mystery.daysUntil('sash')).toBe(CHAIN_DAYS);
  });

  it("keeps a clue to find where it is until it's due, then pins it as she walks up", () => {
    const h = harness(undefined, {
      ...her,
      mystery: {
        clues: { typewriter: '2026-09-10', wobblyLetter: '2026-09-20' },
        began: '2026-09-01',
      },
    });
    h.clock.set(new Date(2026, 8, 25, 12));
    h.tick(1);
    walkUpTo(h, 'noticeboard');
    h.tick(2);
    expect(h.world.casebook.foundOn('sash')).toBeNull();
    h.clock.set(new Date(2026, 8, 27, 12));
    walkUpTo(h, 'noticeboard');
    expect(h.tick(2)).toContainEqual({ kind: 'clue', clue: 'sash' });
  });

  it('starts an old town that has every clue so far the morning after it first opens', () => {
    const h = harness(undefined, {
      ...her,
      mystery: { clues: { welcome: '2026-08-01', typewriter: '2026-08-08' } },
    });
    h.tick(1);
    const mayors = () => h.world.mailbox.view().filter((m) => m.id.startsWith('mayor:'));
    expect(mayors().map((m) => m.id)).not.toContain('mayor:2');
    expect(h.world.casebook.began).toBe('2026-09-26');
    h.clock.set(new Date(2026, 8, 27, 4));
    h.tick(1);
    expect(mayors().map((m) => m.id)).not.toContain('mayor:2');
    h.clock.set(new Date(2026, 8, 27, 6));
    h.tick(1);
    expect(mayors().map((m) => m.id)).toContain('mayor:2');
  });

  it('keeps what it began, and Wes, through a save', () => {
    const h = harness(undefined, her);
    h.tick(1);
    h.world.casebook.glimpses = 2;
    h.world.casebook.chats = 4;
    h.world.casebook.talked = '2026-09-25';
    const saved = h.world.save().mystery;
    expect(saved).toEqual({
      clues: {},
      began: '2026-09-26',
      wes: { glimpses: 2, chats: 4, talked: '2026-09-25' },
    });
  });
});

describe("the neighbours theorising (V1's P3a)", () => {
  /** What Agatha says over a dozen talks today. */
  const heard = (h: Harness) =>
    Array.from({ length: 12 }, () => h.world.neighbourhood.talk('agatha').line);
  const theories = MYSTERY_TALK.agatha.map((l) => fill(l, { name: 'Em' }));

  it('bring the mystery up for a few days after a clue is pinned, and not after', () => {
    const h = harness(undefined, her);
    h.tick(1);
    h.world.mystery.pin('button');
    expect(h.world.casebook.newest).toEqual({ id: 'button', day: '2026-09-26' });
    expect(heard(h).some((l) => theories.includes(l))).toBe(true);
    h.clock.set(new Date(2026, 9, 3, 12));
    h.tick(1);
    expect(heard(h).some((l) => theories.includes(l))).toBe(false);
  });
});

describe("Wes, once he stays (V1's P3a)", () => {
  /** A harness at noon in a minute when Wes is out lurking somewhere she can see him. */
  function wesOut(options = {}, day = new Date(2026, 8, 26, 12)) {
    const first = Math.floor(day.getTime() / WES_SLOT_MS);
    for (let slot = first; slot < first + 200; slot++) {
      if (!wesLurks(slot)) continue;
      const h = harness(undefined, { ...her, ...options });
      h.clock.set(new Date(slot * WES_SLOT_MS + 1000));
      h.tick(1);
      if (h.world.mystery.wes() && wesTile(h)) return h;
    }
    throw new Error('Wes never came out');
  }

  /**
   * Where to tap Wes, at his feet or his hat: not where a neighbour stands in front of him, whom
   * the tap would go to instead.
   */
  function wesTile(h: Harness) {
    const wes = h.world.mystery.wes()!;
    return [wes.ty, wes.ty - 1]
      .map((ty) => ({ tx: wes.tx, ty }))
      .find((t) => !h.world.neighbourhood.villagerAt(t.tx, t.ty));
  }

  function tapWes(h: Harness): boolean {
    const at = wesTile(h)!;
    return h.world.tapTile(at.tx, at.ty);
  }

  it('runs off the first three times, and says he will stay the third', () => {
    const h = wesOut({ mystery: { clues: { button: '2026-09-20' }, wes: { glimpses: 2 } } });
    tapWes(h);
    const events = h.until(() => h.world.mystery.wes() === null, 'Wes to scarper');
    expect(events).toContainEqual({ kind: 'wesStays' });
    expect(h.world.casebook.glimpses).toBe(WES_GLIMPSES);
  });

  it('stays for a chat after that, owning up the first time, and a line a talk after', () => {
    const h = wesOut({
      mystery: { clues: { button: '2026-09-20' }, wes: { glimpses: WES_GLIMPSES } },
    });
    expect(tapWes(h)).toBe(true);
    const events = h.until(() => h.world.target === null && !h.world.player.moving, 'arriving');
    const chat = events.find((e) => e.kind === 'wesChat');
    expect(chat).toBeDefined();
    if (chat?.kind !== 'wesChat') return;
    expect(chat.lines).toHaveLength(WES_FIRST.length);
    expect(chat.lines.join(' ')).toMatch(/assistant/);
    expect(chat.lines.join(' ')).not.toMatch(/[{}]/);
    expect(h.world.mystery.wes()).not.toBeNull();
    expect(h.world.casebook.chats).toBe(1);
    expect(h.world.casebook.talked).toBe('2026-09-26');

    // Again, the same day: one line, and still one day of chats.
    tapWes(h);
    // Already beside him, she arrives on the next step.
    const again = h.tick(2);
    const second = again.find((e) => e.kind === 'wesChat');
    expect(second?.kind === 'wesChat' && second.lines).toHaveLength(1);
    expect(h.world.casebook.chats).toBe(1);
  });

  it("hands over the October story's last chapter in its week, rather than dropping it", () => {
    const h = wesOut(
      { mystery: { clues: { button: '2026-09-20' }, wes: { glimpses: 5, chats: 2 } } },
      new Date(2026, 9, 23, 12),
    );
    tapWes(h);
    const events = h.until(() => h.world.target === null && !h.world.player.moving, 'arriving');
    const chat = events.find((e) => e.kind === 'wesChat');
    expect(chat?.kind === 'wesChat' ? chat.lines[0] : '').toMatch(/last chapter/);
    expect(h.world.mailbox.view().map((m) => m.id)).toContain('story:3');
  });
});
