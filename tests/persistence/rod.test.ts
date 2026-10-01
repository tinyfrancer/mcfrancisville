import { describe, expect, it } from 'vitest';
import { FIRST_ROD, ROD_COLOUR_IDS } from '../../src/data/rods';
import { readRodColour, ROD_KEY, writeRodColour } from '../../src/persistence/rod';
import { ROD_PAINT, rodPalette, TOOL_ART } from '../../src/sprites/tools';

describe("her rod's colour", () => {
  it('starts as plain wood, keeps what she picks, and ignores a colour it does not know', () => {
    localStorage.removeItem(ROD_KEY);
    expect(readRodColour()).toBe(FIRST_ROD);
    writeRodColour('teal');
    expect(readRodColour()).toBe('teal');
    localStorage.setItem(ROD_KEY, 'tartan');
    expect(readRodColour()).toBe(FIRST_ROD);
  });

  it('paints only the rod, never its float or line', () => {
    for (const id of ROD_COLOUR_IDS) {
      const palette = rodPalette(id);
      expect(palette.W).toBe(ROD_PAINT[id]);
      for (const key of ['P', 'p', 'L', 'g', 'H'])
        expect(palette[key]).toBe(TOOL_ART.rod.palette[key]);
    }
    expect(new Set(Object.values(ROD_PAINT)).size).toBe(ROD_COLOUR_IDS.length);
  });
});
