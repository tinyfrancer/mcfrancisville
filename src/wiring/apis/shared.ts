import type { SoundBoard } from '../../audio/SoundBoard';
import type { HudOptions } from '../../hud/Hud';
import { ITEMS } from '../../data/items';
import type { Plot } from '../../world/Farm';
import type { Stack } from '../../world/Bag';
import type { World, WorldEvent } from '../../world/World';

/** What the sheets' Apis need beyond the world. */
export interface ApiWiring {
  world: World;
  sound: SoundBoard;
  /** Something changed that the next save should keep. */
  changed: () => void;
  /** Moments a sheet made (a planting, a purchase), played as the loop's are. */
  play: (events: WorldEvent[]) => void;
  waiting: Waiting;
}

/** What's waiting on a sheet: the bed she's standing at, for the seed she picks. */
export interface Waiting {
  bed: Plot | null;
}

/** The seeds in her bag. */
export function seedsIn(world: World): Stack[] {
  return world.bag.contents.filter((s) => ITEMS[s.id].kind === 'seed');
}

/** What in her bag the quick bar holds: her seeds, then her sprinklers (phase P), then her kites. */
export function holdablesIn(world: World): Stack[] {
  const gear = world.bag.contents.filter((s) => ITEMS[s.id].kind === 'gear');
  const kites = world.bag.contents.filter((s) => ITEMS[s.id].kind === 'kite');
  return [...seedsIn(world), ...gear, ...kites];
}

/** Every sheet's Api: the HUD's options but those `main.ts` makes itself (the camera: 1.5's G5). */
export type SheetApis = Omit<HudOptions, 'save' | 'sound' | 'view' | 'camera' | 'standalone'>;
