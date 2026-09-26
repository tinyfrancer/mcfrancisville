import { LocalStorageSaveService } from './LocalStorageSaveService';
import type { SaveService } from './SaveService';

// Depend on this instance, typed as the interface, rather than on the class: a cloud save (deferred
// by decisions.md 5) would swap in here without touching a caller.
export const saveService: SaveService = new LocalStorageSaveService();

export type { SaveService } from './SaveService';
export { newSave, SAVE_VERSION, type SaveState, type SavedPlayer } from './SaveState';
