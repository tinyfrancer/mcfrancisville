/**
 * The small questions only whatever is drawing can answer, exposed to the smoke check as
 * `window.view` in dev builds.
 */
export interface DebugView {
  /** Steps the world `frames` times by `deltaMs` each, then draws. Only under `?loop=manual`. */
  step(deltaMs: number, frames?: number): void;
  /** Where on the page the middle of a tile is drawn, in client pixels. */
  tileToClient(tx: number, ty: number): { x: number; y: number };
  /** The world pixel at the view's top-left. */
  cameraOrigin(): { x: number; y: number };
}
