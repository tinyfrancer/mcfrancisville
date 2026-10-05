import { describe, expect, it } from 'vitest';
import { WALLPAPERS } from '../../src/data/furniture';
import { roomOf } from '../../src/data/home';
import {
  isWindowPaper,
  WINDOW_PAPER_IDS,
  WINDOW_SKIES,
  type WindowSky,
} from '../../src/data/wallsAndFloors';
import { daylight } from '../../src/systems/clock';
import { windowSky, windowsAlong } from '../../src/systems/windowSky';
import { rasterize } from '../../src/sprites/sprite';
import { windowArt } from '../../src/sprites/wallsAndFloors';

describe("the sky through her windows (0.3's S4)", () => {
  it('shows the hour: dawn, day, the golden hour, dusk and night', () => {
    expect(windowSky(daylight(6.5), 'clear')).toBe('dawn');
    expect(windowSky(daylight(12), 'clear')).toBe('day');
    expect(windowSky(daylight(18), 'clear')).toBe('golden');
    expect(windowSky(daylight(19.5), 'clear')).toBe('dusk');
    expect(windowSky(daylight(22), 'clear')).toBe('night');
    expect(windowSky(daylight(2), 'clear')).toBe('night');
  });

  it('shows the weather: rain by day and by night, fog by day', () => {
    expect(windowSky(daylight(12), 'rain')).toBe('rain');
    expect(windowSky(daylight(22), 'rain')).toBe('rainyNight');
    expect(windowSky(daylight(12), 'fog')).toBe('fog');
    expect(windowSky(daylight(22), 'fog')).toBe('night');
  });

  it('hangs windows every few tiles, balanced, clear of the corners, arches and pictures', () => {
    expect(windowsAlong(13)).toEqual([2, 6, 10]);
    expect(windowsAlong(17)).toEqual([4, 8, 12]);
    expect(windowsAlong(21)).toEqual([2, 6, 10, 14, 18]);
    expect(windowsAlong(11)).toEqual([1, 5, 9]);
    expect(windowsAlong(13, [1])).toEqual([6, 10]);
    expect(windowsAlong(13, [], [2, 3])).toEqual([6, 10]);
    for (const size of [0, 1, 2]) {
      expect(windowsAlong(roomOf(size).width).length).toBeGreaterThan(1);
    }
  });

  it('draws six window wallpapers, every window under every sky, on the wall', () => {
    expect(WINDOW_PAPER_IDS).toHaveLength(6);
    for (const id of WINDOW_PAPER_IDS) {
      expect(isWindowPaper(id)).toBe(true);
      expect(WALLPAPERS[id].price).toBeGreaterThan(0);
      for (const sky of WINDOW_SKIES) {
        const art = windowArt(id, sky);
        const { height } = rasterize(art.source, art.palette);
        // Under the moulding at the top of the wall, above the skirting board at its foot.
        expect(art.foot - height, `${id} ${sky}`).toBeGreaterThanOrEqual(10);
        expect(art.foot, `${id} ${sky}`).toBeLessThanOrEqual(86);
      }
    }
    expect(isWindowPaper('plumStripes')).toBe(false);
  });

  it('puts the stars out only at dusk and night, and the rain only when it rains', () => {
    const keys = (sky: WindowSky) => new Set(windowArt('archWindow', sky).source.rows.join(''));
    expect(keys('night').has('4')).toBe(true);
    expect(keys('day').has('4')).toBe(false);
    expect(keys('rain').has('7')).toBe(true);
    expect(keys('day').has('7')).toBe(false);
  });
});
