import { CUES } from '../../audio/cues';
import type { SoundBoard } from '../../audio/SoundBoard';
import type { FilterId } from '../../data/photo';
import type { CameraApi } from '../../hud/CameraSheet';
import { drawItemIcon } from '../../render/items';
import { drawForPhoto, pngOf, printOf } from '../../render/photo';
import type { SceneView } from '../../render/scene';
import { frameOf, photoFrom, POLAROID } from '../../render/viewfinder';
import { stickerChoices } from '../../systems/photo';
import type { Closeness } from '../../types/view';
import type { World } from '../../world/World';

/** What the viewfinder draws over each frame while the camera is up (`main.ts` draws it). */
export interface Viewfinder {
  up: boolean;
  filter: FilterId;
}

/** What the photo mode needs of the boot beyond the world: the canvas, its view and its fit. */
export interface CameraWiring {
  world: World;
  sound: SoundBoard;
  canvas: HTMLCanvasElement;
  view: () => SceneView;
  viewfinder: Viewfinder;
  /** How close the view is drawn now, and to draw it closer or farther for the viewfinder alone. */
  lens(): Closeness;
  setLens(to: Closeness | null): void;
  /** One step of the town, to let those close by turn and pose before it holds still. */
  settle(): void;
}

/**
 * Her camera (1.5's G5): lifting it holds the town still (the loop stops stepping while
 * `world.posing`) after one step for everyone close to turn and pose; the viewfinder is drawn over
 * each frame; the shutter cuts the photo from a frame drawn clean. Nothing is kept in the save:
 * the phone keeps the picture.
 */
export function cameraApi(w: CameraWiring): CameraApi {
  const { world, canvas, viewfinder } = w;
  return {
    lift() {
      world.posing = true;
      viewfinder.up = true;
      viewfinder.filter = 'plain';
      w.settle();
    },
    lower() {
      world.posing = false;
      viewfinder.up = false;
      viewfinder.filter = 'plain';
      w.view().pan(null);
      w.setLens(null);
    },
    pan(dx, dy) {
      const box = canvas.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) return;
      // The town follows her finger: the camera looks the other way, in the canvas's pixels.
      w.view().pan({
        x: (-dx * canvas.width) / box.width,
        y: (-dy * canvas.height) / box.height,
      });
    },
    lens: () => w.lens(),
    zoom: (to) => w.setLens(to),
    frame() {
      const box = canvas.getBoundingClientRect();
      const frame = frameOf(canvas.width, canvas.height);
      if (!frame || box.width === 0) return null;
      const unit = box.width / canvas.width;
      return {
        left: box.left + frame.x * unit,
        top: box.top + frame.y * unit,
        width: frame.width * unit,
        height: frame.height * unit,
        foot: POLAROID.foot * unit,
        unit,
      };
    },
    filter(id) {
      viewfinder.filter = id;
    },
    stickers: () =>
      stickerChoices(
        world.bag.contents.map((s) => s.id),
        (id) => world.cabinet.caughtOn(id) !== null,
        (id) => world.cabinet.shinyOn(id) !== null,
      ),
    stickerIcon: drawItemIcon,
    shoot(stickers, caption) {
      // Drawn once more without the viewfinder over it, nor the bubbles over heads (1.7's Y1),
      // then the next frame puts them back.
      drawForPhoto(() => w.view().draw(performance.now()));
      const picture = photoFrom(canvas, viewfinder.filter, stickers);
      if (!picture) return null;
      w.sound.cue(CUES.shutter);
      return {
        picture,
        print: () => {
          const made = printOf(picture, caption);
          return made ? pngOf(made) : Promise.resolve(null);
        },
      };
    },
    takenAt: () => world.clock.now(),
  };
}
