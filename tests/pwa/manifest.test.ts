/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// From the working directory rather than import.meta.url, which jsdom gives an http:// origin.
const publicDir = join(process.cwd(), 'public');

interface ManifestIcon {
  src: string;
  sizes: string;
}

describe('the web app manifest', () => {
  const manifest = JSON.parse(readFileSync(join(publicDir, 'manifest.webmanifest'), 'utf8'));

  it('installs as a standalone portrait app, which is what earns iOS its own storage', () => {
    expect(manifest.display).toBe('standalone');
    expect(manifest.orientation).toBe('portrait');
    expect(manifest.start_url).toBe('/');
  });

  it('points only at icons that exist', () => {
    const icons = manifest.icons as ManifestIcon[];
    expect(icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
    for (const icon of icons) {
      expect(existsSync(join(publicDir, icon.src)), icon.src).toBe(true);
    }
  });

  it('has the apple-touch-icon index.html links to', () => {
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    const href = /rel="apple-touch-icon" href="([^"]+)"/.exec(html)?.[1];
    expect(href).toBeDefined();
    expect(existsSync(join(publicDir, href!))).toBe(true);
  });
});
