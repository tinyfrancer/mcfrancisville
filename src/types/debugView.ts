import type { ItemId, VillagerId, ZoneId } from './ids';

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
  /**
   * The trees drawn see-through now, because they hide her or something she might want, by the
   * tile each stands on, and how opaque; none indoors.
   */
  seeThroughCrowns(): { tx: number; ty: number; alpha: number }[];
  /**
   * The effects layer (V1's E1): the pops and emotes showing now, and how many particles fly
   * where she is.
   */
  effects(): {
    shown: {
      kind: 'pop' | 'burst' | 'emote' | 'ring' | 'outline';
      zone: ZoneId;
      age: number;
      icon?: { item: ItemId } | { candy: true } | { parcel: true };
      count?: number;
      emote?: string;
      over?: { x: number; y: number } | { her: true } | { villager: VillagerId };
    }[];
    particles: number;
  };
  /**
   * Her neighbours where she is (V1's E3), and how each is drawn this instant: walking, or the
   * stance (a wave, a job and its frame, sitting, breathing out, blinking) as JSON.
   */
  figures(): { id: VillagerId; moving: boolean; stance: string }[];
  /**
   * What's drawn between places now (V1's E4): an iris, the broom's flight, a window's wash, or
   * nothing, and how far through it is (0 to 1).
   */
  transition(): { kind: string; progress: number } | null;
}
