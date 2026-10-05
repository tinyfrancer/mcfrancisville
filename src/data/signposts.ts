import type { MapZoneId } from '../types/ids';

export interface SignpostRow {
  /** On the board, in the sign lettering: a short word in capitals. */
  word: string;
  /** What she reads walking up to it: a small pun that still says plainly where it goes. */
  line: string;
}

/**
 * What a signpost says about each place it may point to (0.2's C1, personal_touches.md question
 * 55): something clever, never a riddle, with the place's name in it.
 */
export const SIGNPOSTS: Record<MapZoneId, SignpostRow> = {
  town: {
    word: 'TOWN',
    line: "McFrancisVille, this way. Mind the pumpkins, they're friendly.",
  },
  whisperwood: { word: 'WOODS', line: 'Whisperwood, this way. Shh.' },
  lanternShore: {
    word: 'SHORE',
    line: 'Lantern Shore, down the frozen creek: mind the glow, and your skates.',
  },
  castleHill: {
    word: 'CASTLE',
    line: 'Castle Mac-A-Boo, up the hill. Please knock before you boo.',
  },
  booAcres: {
    word: 'FARM',
    line: 'Boo Acres, this way. Rows and rows of beds, and plenty of room to grow!',
  },
  fairground: {
    word: 'FAIR',
    line: 'The Hollow Fairground, this way. Fair warning: the corn dogs are very good.',
  },
  hiddenClearing: {
    word: 'PSST',
    line: "Psst! The hidden clearing is this way. Don't tell anyone. Well, maybe Cody.",
  },
};
