/**
 * What the service worker keeps from the first visit, so the installed app opens with no signal
 * the very first time it's asked to (V1's S3). The build lists what it wrote (`vite.config.ts`),
 * and this turns that into the worker's list and writes it into `public/sw.js`'s copy in `dist/`.
 * Plain string work, so a test holds its shape without a build.
 */

/** Where `public/sw.js` keeps its list and version for the build to fill in. */
export const PRECACHE_MARK = '/* precache */ []';
export const VERSION_MARK = "/* version */ 'dev'";

/**
 * Every file the build wrote, as the paths the page asks for: the page itself as `/` (what a
 * launch from the Home Screen navigates to), the hashed chunks, the manifest, the icons and the
 * launch screens. Not the worker itself (the browser fetches that on its own terms), source maps,
 * or anything hidden. `files` are relative to `dist/`, with either slash.
 */
export function precacheList(files: readonly string[]): string[] {
  const urls = new Set<string>();
  for (const file of files) {
    const path = file.split('\\').join('/').replace(/^\/+/, '');
    if (path === '' || path === 'sw.js' || path.endsWith('.map')) continue;
    if (path.split('/').some((part) => part.startsWith('.'))) continue;
    urls.add(path === 'index.html' ? '/' : `/${path}`);
  }
  return [...urls].sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a < b ? -1 : a > b ? 1 : 0));
}

/**
 * The worker with its list and version filled in. The version names its cache, so a deploy that
 * changes anything starts a cache of its own and the last one's is let go as it takes over.
 */
export function withPrecache(source: string, list: readonly string[], version: string): string {
  if (!source.includes(PRECACHE_MARK) || !source.includes(VERSION_MARK)) {
    throw new Error('sw.js has lost its precache or version mark');
  }
  return source
    .replace(PRECACHE_MARK, JSON.stringify(list))
    .replace(VERSION_MARK, JSON.stringify(version));
}
