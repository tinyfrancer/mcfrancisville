import { describe, expect, it } from 'vitest';
import { NOTICES_UP } from '../../src/data/notices';
import { NOTE_SLOTS_UP, NOTICEBOARD, noticeboardLook } from '../../src/sprites/clutter';
import { PROP_ART } from '../../src/sprites/props';
import { rasterize, spriteSize } from '../../src/sprites/sprite';

/** How many of a look's pixels are paper: the notes' and the poster's keys, as painted. */
function paper(open: number, poster: boolean): number {
  const { source } = noticeboardLook(open, poster);
  const { data } = rasterize(source, PROP_ART.noticeboard.palette);
  let n = 0;
  // Paper is lighter than the board's wood: count the bright pixels on the board's face.
  const { width } = spriteSize(source);
  for (let y = 16; y < 42; y++) {
    for (let x = 11; x < 53; x++) {
      const i = (y * width + x) * 4;
      if (data[i]! + data[i + 1]! + data[i + 2]! > 420) n++;
    }
  }
  return n;
}

describe('the noticeboard shows what is pinned on it (1.0.1)', () => {
  it('has a slot for every note a window puts up', () => {
    expect(NOTE_SLOTS_UP).toBe(NOTICES_UP);
  });

  it('shows more notes the more are still to answer, and a poster when an event is on', () => {
    const keys = new Set<string>();
    for (let open = 0; open <= NOTE_SLOTS_UP; open++) {
      for (const poster of [false, true]) {
        const look = noticeboardLook(open, poster);
        keys.add(look.key);
        expect(spriteSize(look.source)).toEqual(spriteSize(NOTICEBOARD));
      }
      if (open > 0) expect(paper(open, false)).toBeGreaterThan(paper(open - 1, false));
      expect(noticeboardLook(open, true).source).not.toEqual(noticeboardLook(open, false).source);
    }
    expect(keys.size).toBe((NOTE_SLOTS_UP + 1) * 2);
  });

  it('is the whole board as the catalogue shows it, and keeps to its slots', () => {
    expect(noticeboardLook(NOTE_SLOTS_UP, false).source).toBe(NOTICEBOARD);
    expect(noticeboardLook(9, false).key).toBe(noticeboardLook(NOTE_SLOTS_UP, false).key);
    expect(noticeboardLook(-1, true).key).toBe(noticeboardLook(0, true).key);
  });
});
