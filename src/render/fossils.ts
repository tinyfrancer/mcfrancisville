import { bake } from '../sprites/bake';
import { FOSSIL_ART, fossilSilhouette } from '../sprites/fossils';
import type { FossilId } from '../types/ids';

/** A fossil she hasn't dug up yet, as a shadow of itself for the Curiosity Cabinet (0.3's C1). */
export function drawFossilSilhouette(canvas: HTMLCanvasElement, id: FossilId): void {
  const art = FOSSIL_ART[id];
  const sprite = bake(`fossil:${id}:missing`, art.source, fossilSilhouette(id));
  canvas.width = sprite.width;
  canvas.height = sprite.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sprite, 0, 0);
}
