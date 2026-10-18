import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { precacheList, withPrecache } from './src/precache';

/** Every file under `dir`, relative to it. */
function filesIn(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)));
}

/**
 * Once the build has written everything, public files included, lists it into `dist/sw.js` with a
 * version from the files' contents (V1's S3): the same build makes the same worker, and any change
 * makes a new one, which the phone picks up and swaps its cache for.
 */
function precache(): Plugin {
  let outDir = 'dist';
  return {
    name: 'mcfrancisville:precache',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const files = filesIn(outDir);
      const list = precacheList(files);
      const worker = join(outDir, 'sw.js');
      const source = readFileSync(worker, 'utf8');
      // The worker's own code too, so a change to how it caches starts a cache of its own.
      const hash = createHash('sha256').update(source);
      for (const file of files.filter((f) => f !== 'sw.js').sort()) {
        hash.update(file).update(readFileSync(join(outDir, file)));
      }
      const version = hash.digest('hex').slice(0, 12);
      writeFileSync(worker, withPrecache(source, list, version));
    },
  };
}

// Vitest reads `vitest.config.ts` instead; this is only the build's.
export default defineConfig({
  plugins: [precache()],
});
