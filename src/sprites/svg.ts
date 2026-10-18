import { spriteSize, type Palette, type SpriteSource } from './sprite';

/**
 * A grid as an SVG of whole squares (V1's L5): a path per colour, each run of a row one
 * rectangle, edges kept crisp, centred in a square of at least `box` pixels. The HUD shows its
 * pictures this way, so a mark in a line of text or on a button is the game's own pixels at any
 * whole scale, needs no canvas, and can sit in a stylesheet.
 */
export function svgOf(source: SpriteSource, palette: Palette, box = 16): string {
  const { width, height } = spriteSize(source);
  const w = Math.max(box, width);
  const h = Math.max(box, height);
  const ox = Math.floor((w - width) / 2);
  const oy = Math.floor((h - height) / 2);
  const paths = new Map<string, string>();
  source.rows.forEach((row, y) => {
    if (row.length !== width) throw new Error(`row ${y} is ${row.length} wide, expected ${width}`);
    for (let x = 0; x < width;) {
      const key = row[x]!;
      let end = x + 1;
      while (end < width && row[end] === key) end++;
      if (!(key in palette)) throw new Error(`key '${key}' is not in the palette`);
      const colour = palette[key];
      if (colour) {
        const run = `M${x + ox} ${y + oy}h${end - x}v1h${x - end}z`;
        paths.set(colour, (paths.get(colour) ?? '') + run);
      }
      x = end;
    }
  });
  const body = [...paths].map(([fill, d]) => `<path fill="${fill}" d="${d}"/>`).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" ` +
    `shape-rendering="crispEdges">${body}</svg>`
  );
}

/** An SVG as a URL an `<img>` or a stylesheet can take. */
export function svgUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
