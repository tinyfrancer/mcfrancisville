import type { DollId } from '../types/ids';
import type { ItemArt } from './items';
import { PALETTE as C } from './palette';
import type { Palette, SpriteSource } from './sprite';

// Her monster dolls (0.2's F2), as bag icons at 16: one doll, big head and little dress, with
// what makes each herself laid on top. The game's own dolls, never a brand's.

const DOLL: readonly string[] = [
  '................',
  '.....oooooo.....',
  '....ohHhhhho....',
  '...ohHhhhhhho...',
  '...ohssssssho...',
  '...ohsessesho...',
  '...ohcsmmscho...',
  '....ohssssho....',
  '....ohossoho....',
  '...osddddddso...',
  '...osdDddDdso...',
  '....oddddddo....',
  '...oddDddDddo...',
  '...oooooooooo...',
  '.....os..so.....',
  '.....oo..oo.....',
];

/** What's laid over the doll for each: `.` leaves her as she is. */
const TOUCHES: Record<DollId, readonly string[]> = {
  // A cape behind her shoulders and one fang out.
  vampDoll: [
    '',
    '',
    '',
    '',
    '',
    '',
    '........w',
    '',
    '',
    '..a..........a',
    '..a..........a',
    '..aa........aa',
    '..a..........a',
  ],
  // Bolts at her neck and a stitch across her brow.
  stitchDoll: ['', '', '', '', '......k.k', '', '', '', '...b........b', '', '', '..........k'],
  // Fluffy ears up top.
  wolfDoll: ['...oo......oo', '...oHo....oHo', '....o......o'],
  // Wraps across her brow and her dress.
  mummyDoll: ['', '', '', '', '.....wwww', '', '', '', '', '', '.....ww..ww', '', '....ww...ww'],
  // A veil over her head and a wavy hem.
  ghostDoll: ['.....vvvvvv', '....vvvvvvvv', '...vv......vv', '...v........v', '...v........v'],
  // A tiny pointed hat.
  witchDoll: ['.......oo', '......oaao', '...oaaaaaaaao'],
  // Little snakes for hair, peeking up.
  gorgonDoll: ['....o.o..o.o', '....a.a..a.a', '...aa......aa'],
  // Fins at her ears and pearls at her neck.
  seaDoll: ['', '', '', '', '..a..........a', '.aa..........aa', '', '', '', '.....wwwww'],
};

function dollSource(id: DollId): SpriteSource {
  const touches = TOUCHES[id];
  return {
    rows: DOLL.map((row, j) => {
      const over = touches[j] ?? '';
      return [...row].map((k, i) => (over[i] && over[i] !== '.' ? over[i] : k)).join('');
    }),
  };
}

const doll = (colours: {
  skin: string;
  hair: string;
  hairLight: string;
  dress: string;
  dressShade: string;
  accent?: string;
}): Palette => ({
  '.': null,
  o: C.ink,
  e: C.ink,
  s: colours.skin,
  c: C.cheek,
  m: C.berry,
  h: colours.hair,
  H: colours.hairLight,
  d: colours.dress,
  D: colours.dressShade,
  a: colours.accent ?? colours.dress,
  w: C.white,
  b: C.silver,
  k: C.ink,
  v: C.ghost,
});

const PALETTES: Record<DollId, Palette> = {
  vampDoll: doll({
    skin: C.skinPorcelain,
    hair: C.rose,
    hairLight: C.roseLight,
    dress: C.inkFabric,
    dressShade: C.inkFabricShade,
    accent: C.scarlet,
  }),
  stitchDoll: doll({
    skin: C.skinMinty,
    hair: C.hairBlack,
    hairLight: C.hairSilver,
    dress: C.denim,
    dressShade: C.denimDark,
  }),
  wolfDoll: doll({
    skin: C.skinHoney,
    hair: C.fur,
    hairLight: C.furLight,
    dress: C.plum,
    dressShade: C.plumLight,
  }),
  mummyDoll: doll({
    skin: C.cream,
    hair: C.hairAuburn,
    hairLight: C.hairCoral,
    dress: C.teal,
    dressShade: C.tealShade,
  }),
  ghostDoll: doll({
    skin: C.skinGhostly,
    hair: C.hairLavender,
    hairLight: C.hairLavenderShade,
    dress: C.lavender,
    dressShade: C.lavenderShade,
  }),
  witchDoll: doll({
    skin: C.skin,
    hair: C.hairCoral,
    hairLight: C.pumpkinLight,
    dress: C.pumpkin,
    dressShade: C.pumpkinShade,
    accent: C.plumLight,
  }),
  gorgonDoll: doll({
    skin: C.skinBronze,
    hair: C.leaf,
    hairLight: C.leafLight,
    dress: C.gold,
    dressShade: C.goldShade,
    accent: C.leafLight,
  }),
  seaDoll: doll({
    skin: C.skyShade,
    hair: C.teal,
    hairLight: C.tealLight,
    dress: C.coral,
    dressShade: C.coralShade,
    accent: C.sky,
  }),
};

export const DOLL_ART: Record<DollId, ItemArt> = Object.fromEntries(
  (Object.keys(TOUCHES) as DollId[]).map((id) => [
    id,
    { source: dollSource(id), palette: PALETTES[id] },
  ]),
) as Record<DollId, ItemArt>;
