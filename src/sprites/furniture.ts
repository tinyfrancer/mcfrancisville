import { FURNITURE } from '../data/furniture';
import type { FlooringId, FurnitureId, WallpaperId } from '../types/ids';
import { CRAFTED_ART } from './crafted';
import { GIFT_ART } from './gifts';
import { KEEPSAKE_ART } from './keepsakes';
import { MUSEUM_ART } from './museum';
import { PIECES_ART } from './pieces';
import { TOUCHES_ART } from './touches';
import { PALETTE as C } from './palette';
import type { PropLight } from './props';
import type { Palette, SpriteSource } from './sprite';

/**
 * A piece of furniture's picture. A floor piece stands with its bottom row on the front edge of its
 * footprint and may rise above it; a rug is exactly its footprint, flat; a wall piece exactly fills
 * the wall tiles it hangs on.
 */
export interface FurnitureArt {
  /** Facing her, which is how it's first put down and how the shops show it. */
  source: SpriteSource;
  palette: Palette;
  /** For a piece that turns all four ways: facing right (and, mirrored, left), and from behind. */
  side?: SpriteSource;
  back?: SpriteSource;
  /** Its keys that light up after dark, in their lit colours, as a prop's do. */
  glow?: Palette;
  lights?: readonly PropLight[];
}

export const FURNITURE_ART: Record<FurnitureId, FurnitureArt> = {
  ...PIECES_ART,
  ...CRAFTED_ART,
  ...GIFT_ART,
  ...KEEPSAKE_ART,
  ...MUSEUM_ART,
  ...TOUCHES_ART,
};

/** The picture a piece shows turned `turn` times, and whether it's drawn mirrored. */
export function furnitureSprite(
  id: FurnitureId,
  turn: number,
): { source: SpriteSource; flip: boolean } {
  const art = FURNITURE_ART[id];
  const turns = FURNITURE[id].turns;
  if (turns === 'four') {
    if (turn === 1) return { source: art.side ?? art.source, flip: false };
    if (turn === 2) return { source: art.back ?? art.source, flip: false };
    if (turn === 3) return { source: art.side ?? art.source, flip: true };
    return { source: art.source, flip: false };
  }
  return { source: art.source, flip: turns === 'mirror' && turn % 2 === 1 };
}

/** A wall or floor pattern: one 16×16 tile, repeated. */
export interface SurfaceArt {
  source: SpriteSource;
  palette: Palette;
}

export const WALLPAPER_ART: Record<WallpaperId, SurfaceArt> = {
  plumStripes: {
    source: {
      rows: Array.from({ length: 16 }, () => 'aaaabbaaaaaabbaa'),
    },
    palette: { a: C.plum, b: C.plumLight },
  },
  batDamask: {
    source: {
      rows: [
        'aaaaaaaaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
        'aaaaabaaaabaaaaa',
        'abbaabbbbbbaabba',
        'aabbbbbbbbbbbbaa',
        'aaabbbabbabbbaaa',
        'aaaaaaaaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
        'baaaaaaaaaaaaaab',
        'bbaaaaaaaaaaaabb',
        'abbaaaaaaaaaabba',
        'aaaaaaaaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
      ],
    },
    palette: { a: C.teal, b: C.tealShade },
  },
  goldDamask: {
    source: {
      rows: [
        'aaaaaaabaaaaaaaa',
        'aaaaaabbbaaaaaaa',
        'aaaaabbabbaaaaaa',
        'aaaabbacabbaaaaa',
        'aaaaabbabbaaaaaa',
        'aaaaaabbbaaaaaaa',
        'aaaaaaabaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
        'baaaaaaaaaaaaaaa',
        'bbaaaaaaaaaaaaab',
        'abbaaaaaaaaaaabb',
        'cabbaaaaaaaaabba',
        'abbaaaaaaaaaaabb',
        'bbaaaaaaaaaaaaab',
        'baaaaaaaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
      ],
    },
    palette: { a: C.ink, b: C.goldShade, c: C.gold },
  },
  ghostPolka: {
    source: {
      rows: [
        'aaaaaaaaaaaaaaaa',
        'aaabbbaaaaaaaaaa',
        'aabbbbbaaaaaaaaa',
        'aabkbkbaaaaaaaaa',
        'aabbbbbaaaaaaaaa',
        'aababbaaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
        'aaaaaaaaaaabbbaa',
        'aaaaaaaaaabbbbba',
        'aaaaaaaaaabkbkba',
        'aaaaaaaaaabbbbba',
        'aaaaaaaaaababbaa',
        'aaaaaaaaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
      ],
    },
    palette: { a: C.lavender, b: C.ghost, k: C.plum },
  },
  moonlitBlue: {
    source: {
      rows: [
        'aaaaaaaaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
        'aaabbaaaaaaaaaaa',
        'aabbaaaaaaaaaaaa',
        'aabbaaaaaaaaacaa',
        'aabbbaaaaaaaaaaa',
        'aaabbbbaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
        'aaaaaaaaaacaaaaa',
        'aaaaaaaaacccaaaa',
        'aaaaaaaaaacaaaaa',
        'aaaaaaaaaaaaaaaa',
        'acaaaaaaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
      ],
    },
    palette: { a: C.navy, b: C.candleBright, c: C.sky },
  },
  mossPanels: {
    source: {
      rows: [
        'bbbbbbbbbbbbbbbb',
        'baaaaaacbaaaaaac',
        'baaaaaacbaaaaaac',
        'baaaaaacbaaaaaac',
        'baaaaaacbaaaaaac',
        'baaaaaacbaaaaaac',
        'baaaaaacbaaaaaac',
        'baaaaaacbaaaaaac',
        'baaaaaacbaaaaaac',
        'baaaaaacbaaaaaac',
        'baaaaaacbaaaaaac',
        'baaaaaacbaaaaaac',
        'baaaaaacbaaaaaac',
        'baaaaaacbaaaaaac',
        'baaaaaacbaaaaaac',
        'cccccccccccccccc',
      ],
    },
    palette: { a: C.moss, b: C.mossLight, c: C.mossDark },
  },
};

export const FLOORING_ART: Record<FlooringId, SurfaceArt> = {
  oakBoards: {
    source: {
      rows: [
        'aaaaaaaaaaaaaaac',
        'bbbbbbbbbbbbbbbc',
        'aaaaaaaaaaaaaaac',
        'cccccccccccccccc',
        'aaaaaaacaaaaaaaa',
        'bbbbbbbcbbbbbbbb',
        'aaaaaaacaaaaaaaa',
        'cccccccccccccccc',
        'aaaaaaaaaaaacaaa',
        'bbbbbbbbbbbbcbbb',
        'aaaaaaaaaaaacaaa',
        'cccccccccccccccc',
        'aaaacaaaaaaaaaaa',
        'bbbbcbbbbbbbbbbb',
        'aaaacaaaaaaaaaaa',
        'cccccccccccccccc',
      ],
    },
    palette: { a: C.wood, b: C.bark, c: C.barkDark },
  },
  checkerboard: {
    source: {
      rows: [
        ...Array.from({ length: 8 }, () => 'aaaaaaaabbbbbbbb'),
        ...Array.from({ length: 8 }, () => 'bbbbbbbbaaaaaaaa'),
      ],
    },
    palette: { a: C.cream, b: C.plum },
  },
  bluePlanks: {
    source: {
      rows: [
        'aaaaaaaaaaaaaaac',
        'bbbbbbbbbbbbbbbc',
        'aaaaaaaaaaaaaaac',
        'cccccccccccccccc',
        'aaaaaaacaaaaaaaa',
        'bbbbbbbcbbbbbbbb',
        'aaaaaaacaaaaaaaa',
        'cccccccccccccccc',
        'aaaaaaaaaaaacaaa',
        'bbbbbbbbbbbbcbbb',
        'aaaaaaaaaaaacaaa',
        'cccccccccccccccc',
        'aaaacaaaaaaaaaaa',
        'bbbbcbbbbbbbbbbb',
        'aaaacaaaaaaaaaaa',
        'cccccccccccccccc',
      ],
    },
    palette: { a: C.blueFabric, b: C.blueFabricShade, c: C.navy },
  },
  mossCarpet: {
    source: {
      rows: [
        'aaaaaaaaaaaaaaaa',
        'aabaaaaaaaaaaaaa',
        'aaaaaaaaaabaaaaa',
        'aaaaaaaaaaaaaaaa',
        'aaaaabaaaaaaaaaa',
        'aaaaaaaaaaaaaaba',
        'aaaaaaaaaaaaaaaa',
        'abaaaaaaabaaaaaa',
        'aaaaaaaaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
        'aaaaaaaabaaaaaaa',
        'aaabaaaaaaaaaaaa',
        'aaaaaaaaaaaaabaa',
        'aaaaaaaaaaaaaaaa',
        'aaaaaabaaaaaaaaa',
        'aaaaaaaaaaaaaaaa',
      ],
    },
    palette: { a: C.moss, b: C.mossLight },
  },
  cobblestone: {
    source: {
      rows: [
        'caaaaaacbbbbbbbc',
        'caaaaaacbbbbbbbc',
        'caaaaaacbbbbbbbc',
        'caaaaaacbbbbbbbc',
        'cccccccccccccccc',
        'bbbbcaaaaaaacbbb',
        'bbbbcaaaaaaacbbb',
        'bbbbcaaaaaaacbbb',
        'bbbbcaaaaaaacbbb',
        'cccccccccccccccc',
        'aaaaaaacbbbbbbbc',
        'aaaaaaacbbbbbbbc',
        'aaaaaaacbbbbbbbc',
        'aaaaaaacbbbbbbbc',
        'aaaaaaacbbbbbbbc',
        'cccccccccccccccc',
      ],
    },
    palette: { a: C.stone, b: C.stoneLight, c: C.stoneDark },
  },
};

/** The mat inside her front door, which she walks onto to go out. */
export const DOOR_MAT_ART: SurfaceArt = {
  source: {
    rows: [
      '................',
      '................',
      '.oooooooooooooo.',
      '.oppppppppppppo.',
      '.opmmmmmmmmmmpo.',
      '.opmmmmmmmmmmpo.',
      '.opmmkmmmmkmmpo.',
      '.opmkkkmmkkkmpo.',
      '.opmmkkkkkkmmpo.',
      '.opmmmkkkkmmmpo.',
      '.opmmmmmmmmmmpo.',
      '.opmmmmmmmmmmpo.',
      '.oppppppppppppo.',
      '.oooooooooooooo.',
      '................',
      '................',
    ],
  },
  palette: { '.': null, o: C.ink, p: C.pumpkin, m: C.berry, k: C.ink },
};
