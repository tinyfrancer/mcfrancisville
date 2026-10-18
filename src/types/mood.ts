/**
 * How a face feels for a line or a moment (V1's L7, decision 296): glad, taken aback, a little
 * sad, laughing, bashful, or cross in the fond way. No feeling is the face as it always is.
 * `systems/moods.ts` picks one; `sprites/faces.ts` draws it.
 */
export type Feeling = 'happy' | 'surprised' | 'sad' | 'laugh' | 'shy' | 'cross';

export const FEELINGS: readonly Feeling[] = ['happy', 'surprised', 'sad', 'laugh', 'shy', 'cross'];
