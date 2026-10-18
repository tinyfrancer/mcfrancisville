/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GLYPHS, glyphArt, glyphUrl } from '../../src/sprites/ui';
import { svgOf } from '../../src/sprites/svg';
import { spriteSize } from '../../src/sprites/sprite';
import { ZONE_IDS, ZONES } from '../../src/data/zones';
import { HAPPENING_IDS, HAPPENINGS } from '../../src/data/happenings';
import { BAR_TRIMS } from '../../src/data/trims';
import { verbRow } from '../../src/data/happeningVerbs';
import type { Glyph } from '../../src/data/glyphs';

/**
 * No emoji in the chrome (V1's L5, decision 295): every mark on the bars, the sheets, the toasts,
 * the calendar and the map is one of the game's own drawings. What a neighbour says may have one
 * (Cody's "Red one! 👊" is his line, `data/greetings.ts`), and the world's emote bubbles are keyed
 * by the symbols they draw (♥ ♪), never shown as text.
 */
const SRC = join(__dirname, '..', '..', 'src');
const EMOJI = /\p{Extended_Pictographic}/u;
/** The chrome, and everything it reads its words from. */
const CHROME = ['hud', 'data', 'wiring/talkActions.ts', 'wiring/apis.ts', 'wiring/moments.ts'];
/** Said by someone, not the chrome's. */
const SPOKEN = ['data/greetings.ts'];

function* files(path: string): Generator<string> {
  if (path.endsWith('.ts')) {
    yield path;
    return;
  }
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    yield* files(join(path, entry.name));
  }
}

describe('the chrome', () => {
  it('has no emoji left in it', () => {
    const found: string[] = [];
    for (const root of CHROME) {
      for (const file of files(join(SRC, root))) {
        const name = relative(SRC, file);
        if (SPOKEN.includes(name)) continue;
        readFileSync(file, 'utf8')
          .split('\n')
          .forEach((line, i) => {
            if (EMOJI.test(line)) found.push(`${name}:${i + 1}: ${line.trim()}`);
          });
      }
    }
    expect(found).toEqual([]);
  });

  it('marks every place, happening, verb and month with a drawing', () => {
    const glyphs: Glyph[] = [
      ...ZONE_IDS.map((id) => ZONES[id].icon),
      ...HAPPENING_IDS.map((id) => HAPPENINGS[id].icon),
      ...BAR_TRIMS.map((t) => t.icon),
      ...HAPPENING_IDS.flatMap((id) => verbRow(id)?.glyph ?? []),
    ];
    for (const g of glyphs) expect(glyphArt(g), JSON.stringify(g)).toBeDefined();
  });
});

describe('the glyphs', () => {
  it('are each drawn within 16 pixels, in keys their palettes have', () => {
    for (const [id, art] of Object.entries(GLYPHS)) {
      const { width, height } = spriteSize(art.source);
      expect(width <= 16 && height <= 16, id).toBe(true);
      for (const row of art.source.rows) {
        expect(row.length, id).toBe(width);
        for (const key of row) expect(key in art.palette, `${id} '${key}'`).toBe(true);
      }
    }
  });

  it('come out as an SVG of whole squares, centred in sixteen', () => {
    const svg = svgOf({ rows: ['ab', 'a.'] }, { a: '#112233', b: '#445566', '.': null }, 4);
    expect(svg).toContain('viewBox="0 0 4 4"');
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(svg).toContain('<path fill="#112233" d="M1 1h1v1h-1zM1 2h1v1h-1z"/>');
    expect(svg).toContain('<path fill="#445566" d="M2 1h1v1h-1z"/>');
    expect(glyphUrl('heart')).toMatch(/^data:image\/svg\+xml,/);
    expect(glyphUrl({ item: 'pumpkin' })).toBe(glyphUrl({ item: 'pumpkin' }));
  });
});
