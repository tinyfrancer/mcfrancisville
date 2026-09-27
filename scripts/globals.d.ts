/**
 * The dev-only handles the smoke check reaches the game through. `src/main.ts` installs them behind
 * an `import.meta.env.DEV` guard; declaring them here lets `tsconfig.scripts.json` check the smoke
 * script against the real shapes rather than against `any`.
 */
import type { DebugView } from '../src/types/debugView';
import type { World } from '../src/world/World';
import type { SoundBoard } from '../src/audio/SoundBoard';

declare global {
  interface Window {
    world: World;
    sound: SoundBoard;
    view: DebugView;
  }
}
