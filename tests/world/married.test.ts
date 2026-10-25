import { describe, expect, it } from 'vitest';
import { ASKS, HER_DAY_BACKS, HER_DAY_SAYS, OUR_STORY, YESTERDAY } from '../../src/data/cody';
import { shiftDay } from '../../src/systems/calendar';
import { dayKey } from '../../src/systems/clock';
import { atHers } from '../../src/systems/cody';
import { QUESTIONS } from '../../src/data/questions';
import { fill } from '../../src/systems/friendship';
import { SNACK_KEY, snackOn } from '../../src/systems/gathering';
import { fromSave, World } from '../../src/world/World';
import { FakeClock } from '../../src/systems/clock';
import { harness, type Harness } from './harness';

const DAY_MS = 24 * 3_600_000;

/** The first evening from 1 October that he spends at hers, at eight. */
function anEveningAtHers(): Date {
  let day = '2026-10-01';
  while (!atHers(20, day)) day = shiftDay(day, 1);
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y!, m! - 1, d!, 20);
}

function at(when: Date): Harness {
  const h = harness();
  h.clock.set(when);
  return h;
}

const said = (line: string, h: Harness) => fill(line, { name: h.world.wardrobe.look.name });

describe("Cody, married (V1's P5)", () => {
  it('is as close as can be from the first day, and his letters are all in her mailbox', () => {
    const h = harness();
    expect(h.world.friends.hearts('cody')).toBe(10);
    expect(h.world.friends.of('cody').points).toBe(0);
    h.tick(1);
    // His letters wait for her first visit, as Agatha's does.
    expect(h.world.letters.has('cody:3')).toBe(false);
    h.world.visits.welcome(null);
    const events = h.tick(1);
    for (const n of [3, 6, 10]) expect(h.world.letters.has(`cody:${n}`)).toBe(true);
    // They come quietly, as though they'd always been there.
    expect(events.filter((e) => e.kind === 'mail' && e.from === 'cody')).toEqual([]);
  });

  it('sends an old save only the letters it lacks, and nothing is lost', () => {
    const h = harness();
    h.world.visits.welcome(null);
    h.world.mailbox.post('cody:3', '2026-09-20');
    h.world.mailbox.open('cody:3');
    h.tick(1);
    const cody = h.world.letters.all.filter((m) => m.id.startsWith('cody:'));
    expect(cody.map((m) => m.id).sort()).toEqual(['cody:10', 'cody:3', 'cody:6']);
    expect(cody.find((m) => m.id === 'cody:3')!.opened).toBe(true);
  });

  it('asks how her day was of an evening, about what she did, and keeps her answer', () => {
    const h = at(anEveningAtHers());
    const day = dayKey(h.clock.now());
    const plain = h.world.talk.talk('cody');
    expect(plain.asked).toBe(true);
    expect(plain.replies).toEqual([HER_DAY_SAYS.good, HER_DAY_SAYS.long, HER_DAY_SAYS.later]);
    expect(ASKS.map((l) => said(l, h))).toContain(plain.line);
    h.world.talk.endTalk();
    // His evening line changes with what she did today.
    h.world.ctx.signals.emit('harvested', { crop: 'pumpkin' });
    const after = h.world.talk.talk('cody');
    expect(after.asked).toBe(true);
    expect(after.line).not.toBe(plain.line);
    expect(after.line).toMatch(/pumpkin/i);
    const back = h.world.talk.reply('cody', 1)!;
    expect(HER_DAY_BACKS.long.map((l) => said(l, h))).toContain(back.line);
    expect(h.world.lately.last.herDay).toEqual({ day, answer: 'long' });
    // Answered, he doesn't ask again tonight (his question about a night in, answered too).
    h.world.friends.update('cody', { answered: QUESTIONS.cody.answers[0]!.id });
    expect(h.world.talk.talk('cody').asked).toBeUndefined();
    // And it's kept through a save.
    const again = new World({ clock: new FakeClock(h.clock.now()), ...fromSave(h.world.save()) });
    expect(again.lately.last.herDay).toEqual({ day, answer: 'long' });
  });

  it("doesn't ask by day, and brings her answer up first the next day", () => {
    const h = at(anEveningAtHers());
    h.world.talk.talk('cody');
    h.world.talk.reply('cody', 0);
    h.world.friends.update('cody', { answered: QUESTIONS.cody.answers[0]!.id });
    h.clock.advance(15 * 3_600_000);
    const next = h.world.talk.talk('cody');
    expect(next.asked).toBeUndefined();
    expect(YESTERDAY.good.map((l) => said(l, h))).toContain(next.line);
  });

  it('walks round to hers of an evening, and sits on her chair', () => {
    const h = at(anEveningAtHers());
    expect(h.world.neighbourhood.whereIs('cody')?.doing).toEqual({ visiting: 'her' });
    expect(h.world.travel.home()).toBe(true);
    h.tick(2);
    expect(h.world.scene).toBe('home');
    h.until(() => h.world.neighbourhood.neighbour('cody').seat !== null, 'Cody sitting', 120_000);
    const cody = h.world.neighbourhood.neighbour('cody');
    expect(cody.zone).toBe('home');
    // The pumpkin chair on her first day's rug.
    expect(cody.tile).toEqual({ tx: 3, ty: 7 });
  });

  it('keeps the manor and his day as it was', () => {
    const h = harness();
    h.clock.set(new Date(2026, 9, 5, 10));
    expect(h.world.neighbourhood.whereIs('cody')?.zone).not.toBe('home');
  });

  it('tells a scene of their story after his hello, one a day, from her third day', () => {
    const h = harness();
    for (let i = 0; i < 3; i++) {
      h.world.visits.welcome(h.clock.now() - DAY_MS);
      h.clock.advance(DAY_MS);
    }
    expect(h.world.visits.count).toBeGreaterThanOrEqual(3);
    const hello = h.world.talk.talk('cody');
    expect(hello.waiting).toBe(true);
    const scene = h.world.talk.talk('cody');
    expect(said(OUR_STORY[0]!.lines[0]!, h)).toBe(scene.line);
    expect(scene.more).toHaveLength(OUR_STORY[0]!.lines.length - 1);
    expect(h.world.lately.last.told).toEqual(['ice']);
    expect(h.world.talk.talk('cody').line).not.toBe(scene.line);
  });

  it('does things together at hers at night, each once a night', () => {
    const when = anEveningAtHers();
    when.setHours(21);
    const h = at(when);
    const day = dayKey(h.clock.now());
    h.world.travel.home();
    h.tick(2);
    expect(h.world.marriage.canDo('snackRun')).toBe(true);
    expect(h.world.marriage.canDo('ourSong')).toBe(true);
    const run = h.world.marriage.together('snackRun')!;
    expect(run.lines).toHaveLength(3);
    expect(h.world.bag.count(snackOn(day))).toBe(1);
    expect(h.world.takings.isReady(SNACK_KEY)).toBe(false);
    expect(h.world.marriage.canDo('snackRun')).toBe(false);
    expect(h.tick(1)).toContainEqual({ kind: 'together', what: 'snackRun', does: 'show' });
    h.world.marriage.together('ourSong');
    expect(h.world.recordPlayer.dance()).not.toBeNull();
    expect(h.world.marriage.canDo('ourSong')).toBe(false);
    // Not out in town.
    h.clock.advance(DAY_MS);
    expect(h.world.marriage.canDo('ourSong')).toBe(true);
  });
});
