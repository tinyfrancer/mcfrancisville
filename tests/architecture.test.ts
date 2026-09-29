/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, normalize, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The layers of `docs/architecture.md` and what each may import (phase V's review). A layer is a
 * folder of `src/`; `main.ts`, `loop.ts`, `pwa.ts` and `wiring/` are where they meet, so they may
 * import anything. `type` means only `import type`: the shape, never code that runs.
 */
const MAY: Record<string, Record<string, 'all' | 'type'>> = {
  types: {},
  data: { types: 'all' },
  config: { types: 'all', data: 'type' },
  systems: { data: 'all', types: 'all' },
  sprites: { data: 'all', types: 'all', systems: 'all' },
  world: { systems: 'all', data: 'all', config: 'all', types: 'all', persistence: 'type' },
  persistence: { data: 'all', systems: 'all', types: 'all', world: 'type' },
  render: {
    world: 'all',
    sprites: 'all',
    systems: 'all',
    data: 'all',
    config: 'all',
    types: 'all',
  },
  ui: { sprites: 'all' },
  hud: { data: 'all', systems: 'all', types: 'all', ui: 'all', sprites: 'all', world: 'type' },
  audio: { data: 'all', systems: 'all', types: 'all', sprites: 'type', world: 'type' },
};

/**
 * What the sprites and sounds may call from `systems/`: the seeded random, the pets' habits' type,
 * and the wardrobe's `wear` to dress the doll for the catalogue. Everything else there is a rule.
 */
const SYSTEMS_FOR: Record<string, readonly string[]> = {
  sprites: ['random', 'pets', 'wardrobe'],
  audio: ['random'],
};

const SRC = join(__dirname, '..', 'src');

function* files(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (path.endsWith('.ts')) yield path;
  }
}

const layerOf = (path: string) => relative(SRC, path).split(sep)[0]!.replace(/\.ts$/, '');

interface Import {
  file: string;
  from: string;
  to: string;
  module: string;
  typeOnly: boolean;
}

function imports(): Import[] {
  const found: Import[] = [];
  for (const file of files(SRC)) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/^import\s+(type\s+)?[^;]*?from\s+'(\.[^']+)'/gms)) {
      const target = normalize(join(dirname(file), m[2]!));
      found.push({
        file: relative(SRC, file),
        from: layerOf(file),
        to: layerOf(target),
        module: relative(SRC, target),
        typeOnly: m[1] !== undefined,
      });
    }
  }
  return found;
}

describe('the layers', () => {
  const all = imports();

  it('finds the imports it checks', () => {
    expect(all.length).toBeGreaterThan(500);
  });

  it('imports only what each layer may', () => {
    const wrong = all
      .filter((i) => i.from !== i.to && i.from in MAY)
      .filter((i) => {
        const may = MAY[i.from]![i.to];
        return may === undefined || (may === 'type' && !i.typeOnly);
      })
      .map((i) => `${i.file} imports ${i.typeOnly ? 'the type of ' : ''}${i.module}`);
    expect(wrong).toEqual([]);
  });

  it('draws and plays with no game rules', () => {
    const wrong = all
      .filter((i) => i.to === 'systems' && i.from in SYSTEMS_FOR && !i.typeOnly)
      .filter((i) => !SYSTEMS_FOR[i.from]!.includes(i.module.split(sep)[1]!))
      .map((i) => `${i.file} calls ${i.module}`);
    expect(wrong).toEqual([]);
  });
});
