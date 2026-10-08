import { describe, expect, it } from 'vitest';
import {
  GRADE,
  grade,
  gradeOf,
  gradePixel,
  passOf,
  vignetteShade,
  VIGNETTE_FROM,
  VIGNETTE_TO,
  type Rgb,
} from '../../src/render/grade';
import { daylight, underFullMoon } from '../../src/systems/clock';
import { PALETTE } from '../../src/sprites/palette';

const saturation = ([r, g, b]: Rgb) => (Math.max(r, g, b) - Math.min(r, g, b)) / Math.max(r, g, b);
const luma = ([r, g, b]: Rgb) => 0.3 * r + 0.59 * g + 0.11 * b;
/** The light map's multiply alone, without the grade's pass over the shadows. */
const multiplied = (hour: number, c: Rgb): Rgb => {
  const { light } = grade(hour);
  return c.map((v, i) => Math.round((v * light[i]!) / 255)) as unknown as Rgb;
};

const DARK: Rgb = [40, 40, 40];
const LIGHT: Rgb = [220, 220, 220];
const PUMPKIN: Rgb = [255, 140, 40];

describe('the grade by hour', () => {
  it('gives midday a touch of warm sun, and nothing over its shadows', () => {
    const noon = grade(12);
    expect(noon.light).not.toEqual([255, 255, 255]);
    expect(noon.light.every((c) => c >= 235)).toBe(true);
    expect(noon.light[0]).toBeGreaterThan(noon.light[2]);
    expect(passOf(noon.shadows)).toBeNull();
    expect(noon.clouds).toBe(1);
    expect(noon.vignette).toBe(0);
  });

  it('cools the shadows and warms the highlights at dusk', () => {
    const g = grade(19.5);
    const dark = gradePixel(g, DARK);
    const light = gradePixel(g, LIGHT);
    expect(dark[2]).toBeGreaterThan(dark[0]);
    expect(light[0]).toBeGreaterThan(light[2]);
    expect(passOf(g.shadows)?.mode).toBe('screen');
  });

  it('deepens the shadows for contrast at the golden hour', () => {
    const g = grade(18);
    expect(passOf(g.shadows)?.mode).toBe('color-burn');
    const graded = luma(gradePixel(g, LIGHT)) / Math.max(1, luma(gradePixel(g, DARK)));
    const plain = luma(multiplied(18, LIGHT)) / luma(multiplied(18, DARK));
    expect(graded).toBeGreaterThan(plain * 1.2);
    expect(gradePixel(g, [255, 255, 255])[0]).toBeGreaterThan(240);
  });

  it('desaturates the night a little and shifts it blue, without turning it black', () => {
    const g = grade(23);
    const pumpkin = gradePixel(g, PUMPKIN);
    expect(saturation(pumpkin)).toBeLessThan(saturation(multiplied(23, PUMPKIN)));
    expect(saturation(pumpkin)).toBeGreaterThan(saturation(PUMPKIN) * 0.5);
    const grey = gradePixel(g, LIGHT);
    expect(grey[2]).toBeGreaterThan(grey[0]);
    expect(Math.min(...gradePixel(g, LIGHT))).toBeGreaterThan(100);
    expect(g.vignette).toBeGreaterThan(0.3);
    expect(g.clouds).toBe(0);
  });

  it('is pink and soft at dawn, with its shadows lifted', () => {
    const g = grade(6.5);
    expect(g.light[0]).toBeGreaterThan(g.light[1]);
    expect(passOf(g.shadows)?.mode).toBe('screen');
  });

  it('brightens the night to silver under a full moon, and leaves the day alone', () => {
    const night = gradeOf(daylight(23));
    const moon = gradeOf(underFullMoon(daylight(23)));
    for (let i = 0; i < 3; i++) expect(moon.light[i]).toBeGreaterThan(night.light[i]!);
    expect(moon.vignette).toBeLessThan(night.vignette);
    expect(gradeOf(underFullMoon(daylight(12)))).toEqual(gradeOf(daylight(12)));
  });

  it('greys for rain or fog, a rainy night darker than a clear one, and hides the clouds', () => {
    const rain = gradeOf(daylight(12), PALETTE.skyRain);
    expect(rain.clouds).toBe(0);
    for (let i = 0; i < 3; i++) expect(rain.light[i]).toBeLessThan(grade(12).light[i]!);
    const rainyNight = gradeOf(daylight(23), PALETTE.skyRain);
    for (let i = 0; i < 3; i++) expect(rainyNight.light[i]).toBeLessThan(grade(23).light[i]!);
    expect(Math.min(...rainyNight.light)).toBeGreaterThan(80);
    expect(gradeOf(daylight(12), PALETTE.skyFog).clouds).toBe(0);
  });

  it('is softer indoors: lighter, gentler at the edges, never clouded', () => {
    const inside = gradeOf(daylight(23), null, 0.5, false);
    const outside = grade(23);
    for (let i = 0; i < 3; i++) expect(inside.light[i]).toBeGreaterThan(outside.light[i]!);
    expect(inside.vignette).toBeLessThan(outside.vignette);
    expect(Math.abs(inside.shadows[2])).toBeLessThan(Math.abs(outside.shadows[2]));
    expect(gradeOf(daylight(12), null, 0.5, false).clouds).toBe(0);
  });

  it('adds one pass at most at any hour, and moves smoothly through the day', () => {
    let last = grade(0);
    for (let minutes = 6; minutes <= 24 * 60; minutes += 6) {
      const g = grade(minutes / 60);
      const pass = passOf(g.shadows);
      if (pass) expect(['screen', 'color-burn']).toContain(pass.mode);
      for (let i = 0; i < 3; i++) {
        expect(Math.abs(g.light[i]! - last.light[i]!)).toBeLessThanOrEqual(8);
        expect(Math.abs(g.shadows[i]! - last.shadows[i]!)).toBeLessThan(0.02);
      }
      expect(Math.abs(g.vignette - last.vignette)).toBeLessThan(0.03);
      last = g;
    }
  });

  it('never blends a lift and a deepening at once, and a pass of nothing is none', () => {
    expect(passOf([0, 0, 0])).toBeNull();
    expect(passOf([0.1, -0.02, 0.05])).toEqual({ mode: 'screen', colour: [26, 0, 13] });
    expect(passOf([-0.1, 0.01, -0.1])?.mode).toBe('color-burn');
    expect(passOf([-0.1, 0.01, -0.1])?.colour[1]).toBe(255);
  });

  it('keeps every row in range', () => {
    for (const row of Object.values(GRADE)) {
      expect(row.vignette).toBeGreaterThanOrEqual(0);
      expect(row.vignette).toBeLessThanOrEqual(1);
      expect(row.clouds).toBeGreaterThanOrEqual(0);
      for (const s of row.shadows) expect(Math.abs(s)).toBeLessThan(0.2);
    }
  });
});

describe('the vignette', () => {
  it('leaves the middle alone and darkens toward the edges, measured in world pixels', () => {
    expect(vignetteShade(0)).toBe(0);
    expect(vignetteShade(VIGNETTE_FROM)).toBe(0);
    expect(vignetteShade(VIGNETTE_TO)).toBe(1);
    expect(vignetteShade(VIGNETTE_TO * 2)).toBe(1);
    let last = 0;
    for (let d = VIGNETTE_FROM; d <= VIGNETTE_TO; d += 8) {
      expect(vignetteShade(d)).toBeGreaterThanOrEqual(last);
      last = vignetteShade(d);
    }
  });
});
