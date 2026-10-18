/**
 * Scale2x (EPX): a picture at twice its size, each pixel four, where a corner takes its
 * neighbours' colour when two of them that meet there agree and the other two don't. Steps on a
 * diagonal become half-steps and round things rounder, while every straight edge stays as crisp
 * as it was. The busts (V1's L5) are a neighbour's own pixels drawn at 64 this way.
 */
export function scale2x(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(width * height * 16);
  const at = (x: number, y: number) =>
    (Math.min(height - 1, Math.max(0, y)) * width + Math.min(width - 1, Math.max(0, x))) * 4;
  const same = (i: number, j: number) =>
    (data[i + 3] === 0 && data[j + 3] === 0) ||
    (data[i] === data[j] &&
      data[i + 1] === data[j + 1] &&
      data[i + 2] === data[j + 2] &&
      data[i + 3] === data[j + 3]);
  const put = (x: number, y: number, from: number) =>
    out.set(data.subarray(from, from + 4), (y * width * 2 + x) * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = at(x, y);
      const a = at(x, y - 1);
      const b = at(x + 1, y);
      const c = at(x - 1, y);
      const d = at(x, y + 1);
      put(x * 2, y * 2, same(c, a) && !same(c, d) && !same(a, b) ? a : p);
      put(x * 2 + 1, y * 2, same(a, b) && !same(a, c) && !same(b, d) ? b : p);
      put(x * 2, y * 2 + 1, same(d, c) && !same(d, b) && !same(c, a) ? c : p);
      put(x * 2 + 1, y * 2 + 1, same(b, d) && !same(b, a) && !same(d, c) ? d : p);
    }
  }
  return out;
}
