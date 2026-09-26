import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
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
