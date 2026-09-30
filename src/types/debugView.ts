/**
 * The small questions only whatever is drawing can answer, exposed to the smoke check as
 * `window.view` in dev builds.
 */
export interface DebugView {
  /**
   * Runs `frames` frames of `deltaMs` each through the fixed step, as the loop would, then draws.
   * Only under `?loop=manual`.
   */
  step(deltaMs: number, frames?: number): void;
  /** Draws once without stepping, so a frame's drawing can be timed apart from its simulation. */
  draw(): void;
  /** Where on the page the middle of a tile is drawn, in client pixels. */
  tileToClient(tx: number, ty: number): { x: number; y: number };
  /** The world pixel at the view's top-left. */
  cameraOrigin(): { x: number; y: number };
  /** Where her sprite's top-left is drawn, in world pixels, as the last frame drew her. */
  playerDrawnAt(): { x: number; y: number };
  /** Saves at once, as a page being hidden would. */
  saveNow(): void;
  /** The ground chunks baked across every view she has, and the canvas memory they hold. */
  groundMemory(): { chunks: number; bytes: number };
  /**
   * Pixels where the place's ground drawn from chunks differs from it baked whole: none, or there
   * is a seam. `null` indoors, where there's no ground.
   */
  groundSeams(): number | null;
}
