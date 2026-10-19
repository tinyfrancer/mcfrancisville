/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRECACHE_MARK, precacheList, VERSION_MARK, withPrecache } from '../../src/precache';

const WROTE = [
  'index.html',
  'assets/index-C8iYXVqq.js',
  'assets/index-C8iYXVqq.js.map',
  'manifest.webmanifest',
  'sw.js',
  'icons/icon-192.png',
  'icons\\icon-512.png',
  'splash/750x1334.png',
  '.vite/manifest.json',
];

describe("the service worker's precache (V1's S3)", () => {
  const list = precacheList(WROTE);

  it('keeps the page as / first, then everything the page asks for, by URL', () => {
    expect(list).toEqual([
      '/',
      '/assets/index-C8iYXVqq.js',
      '/icons/icon-192.png',
      '/icons/icon-512.png',
      '/manifest.webmanifest',
      '/splash/750x1334.png',
    ]);
  });

  it('never lists the worker itself, a source map or anything hidden', () => {
    expect(list.some((u) => u.endsWith('sw.js') || u.endsWith('.map') || u.includes('/.'))).toBe(
      false,
    );
  });

  it('lists each once, whichever way it was named', () => {
    expect(precacheList(['index.html', '/index.html', 'a.png', 'a.png'])).toEqual(['/', '/a.png']);
  });

  it('is written into the worker with its version', () => {
    const source = readFileSync(join(process.cwd(), 'public', 'sw.js'), 'utf8');
    expect(source).toContain(PRECACHE_MARK);
    expect(source).toContain(VERSION_MARK);
    const built = withPrecache(source, list, 'abc123');
    expect(built).toContain(`const PRECACHE = ${JSON.stringify(list)};`);
    expect(built).toContain('const VERSION = "abc123";');
    expect(built).not.toContain(PRECACHE_MARK);
  });

  it('refuses a worker that has lost its marks, rather than ship one that keeps nothing', () => {
    expect(() => withPrecache('const PRECACHE = [];', list, 'v')).toThrow();
  });

  it("never keeps or answers a server's routes (V1's S2)", () => {
    const source = readFileSync(join(process.cwd(), 'public', 'sw.js'), 'utf8');
    expect(source).toMatch(/pathname\.startsWith\('\/api\/'\)\) return;/);
  });
});
