import type { SaveState } from './SaveState';

export interface SaveService {
  load(): SaveState | null;
  save(state: SaveState): void;
}
