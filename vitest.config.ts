import { defineConfig } from 'vitest/config';

/**
 * The tests that build a page: the HUD's, and the few elsewhere that make elements, fire DOM
 * events or spy on a canvas, each file in a fresh jsdom as before. Everything else is plain
 * TypeScript (decision 9) and runs in Node, its files sharing their modules (`isolate: false`),
 * since setting jsdom up for a file and importing the game afresh for it were two thirds of the
 * suite's time (1.1's T2, decision 336). A test outside `tests/hud/` that needs `document` or
 * `window` is named here; what a plain file must find as it was is put back in `tests/setup.ts`.
 */
const DOM = [
  'tests/hud/**/*.test.ts',
  'tests/audio/heard.test.ts',
  'tests/errorNotes.test.ts',
  'tests/render/ground.test.ts',
  'tests/render/transition.test.ts',
  'tests/wiring/keeping.test.ts',
  'tests/wiring/perf.test.ts',
];

export default defineConfig({
  test: {
    setupFiles: ['tests/setup.ts'],
    projects: [
      { extends: true, test: { name: 'dom', include: DOM, environment: 'jsdom' } },
      {
        extends: true,
        test: {
          name: 'node',
          include: ['tests/**/*.test.ts'],
          exclude: DOM,
          environment: 'node',
          isolate: false,
        },
      },
    ],
    coverage: {
      // Istanbul rather than v8: v8 reports a file no test imported as 0/0, which rounds up to
      // 100%, so a directory with no tests at all would score perfect.
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      // Boots a page rather than computing anything; smoke is its cover.
      exclude: ['src/main.ts'],
      reporter: ['text-summary', 'text'],
      // Reported, never gated: no `thresholds`.
    },
  },
});
