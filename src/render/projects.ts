import { PROJECT_PICTURES } from '../sprites/projects';
import { bake } from '../sprites/bake';
import type { ProjectId } from '../types/ids';

/** A town project as it'll look built (V1's R4), at 1× for the noticeboard to scale up. */
export function drawProjectPicture(canvas: HTMLCanvasElement, id: ProjectId): void {
  const { source, palette } = PROJECT_PICTURES[id];
  const sprite = bake(`project:${id}`, source, palette);
  canvas.width = sprite.width;
  canvas.height = sprite.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sprite, 0, 0);
}
