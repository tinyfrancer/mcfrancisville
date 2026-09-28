import { FURNITURE } from '../data/furniture';
import type { FlooringId, FurnitureId, WallpaperId } from '../types/ids';
import { CRAFTED_ART } from './crafted';
import { GIFT_ART } from './gifts';
import { KEEPSAKE_ART } from './keepsakes';
import { MUSEUM_ART } from './museum';
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

const DUCK: SpriteSource = {
  rows: [
    '.....oooooo.....',
    '...oo......oo...',
    '..o.G........o..',
    '.o.G..........o.',
    '.o.G.hhh..hhh.o.',
    '.o..yhkh..hkhyo.',
    '.o.G..hh..hh..o.',
    '.o....ww..ww..o.',
    '.o.....nnnn...o.',
    '.o....bbbbbb..o.',
    '.o...bbBBBBbb.o.',
    '.o...dbbbbbbd.o.',
    '.o...ddbbbbdd.o.',
    '.o....dddddd..o.',
    '.o.....yy.yy..o.',
    '.o..pppppppp..o.',
    '.oooooooooooooo.',
    'oWWWWWWWWWWWWWWo',
    'oxxxxxxxxxxxxxxo',
    'oooooooooooooooo',
  ],
};

const PUMPKIN_CHAIR: SpriteSource = {
  rows: [
    '.......oo.......',
    '......oso.......',
    '..oooooooooooo..',
    '.oPpPppPPppPpPo.',
    '.oPpPppPPppPpPo.',
    '.oPpPppPPppPpPo.',
    '.oPpPppPPppPpPo.',
    'oPpocccccccccopo',
    'oPpocCCCCCCCcopo',
    'oPpocccccccccopo',
    'oPpPpPPppPPpPpPo',
    'oPpPpPPppPPpPpPo',
    'oPpPpPPppPPpPpPo',
    '.oPpPPPppPPPpPo.',
    '..oooooooooooo..',
  ],
};

const PUMPKIN_CHAIR_SIDE: SpriteSource = {
  rows: [
    '..oo............',
    '..oso...........',
    '.oooooo.........',
    'oPpPpPPo........',
    'oPpPpPPo........',
    'oPpPpPPo........',
    'oPpPpPPoooooooo.',
    'oPpPpPPcCCCCCCo.',
    'oPpPpPPccccccco.',
    'oPpPpPPPpPPpPPpo',
    'oPpPpPPPpPPpPPpo',
    'oPpPpPPPpPPpPPpo',
    'oPpPpPPPpPPpPPpo',
    '.oPpPPPpPPpPPpo.',
    '..oooooooooooo..',
  ],
};

const PUMPKIN_CHAIR_BACK: SpriteSource = {
  rows: [
    '.......oo.......',
    '......oso.......',
    '..oooooooooooo..',
    '.oPpPppPPppPpPo.',
    '.oPpPppPPppPpPo.',
    '.oPpPppPPppPpPo.',
    '.oPpPppPPppPpPo.',
    'oPpPpPPppPPpPpPo',
    'oPpPpPPppPPpPpPo',
    'oPpPpPPppPPpPpPo',
    'oPpPpPPppPPpPpPo',
    'oPpPpPPppPPpPpPo',
    'oPpPpPPppPPpPpPo',
    '.oPpPPPppPPPpPo.',
    '..oooooooooooo..',
  ],
};

const COFFIN_BOOKSHELF: SpriteSource = {
  rows: [
    '....oooooooo....',
    '...oWWWWWWWWo...',
    '..oWWwwwwwwWWo..',
    '.oWWwbbryytlWWo.',
    '.oWWwbbryytlWWo.',
    '.oWWwbbryytlWWo.',
    '.oWWWWWWWWWWWWo.',
    '.oWWtgglrwbbWWo.',
    '.oWWtgglrwbbWWo.',
    '.oWWtgglrwbbWWo.',
    '.oWWWWWWWWWWWWo.',
    '.oWWyrrbwlgtWWo.',
    '.oWWyrrbwlgtWWo.',
    '.oWWyrrbwlgtWWo.',
    '..oWWWWWWWWWWo..',
    '..oWbgwryytlWo..',
    '..oWbgwryytlWo..',
    '..oWbgwryytlWo..',
    '..oWWWWWWWWWWo..',
    '..oWtbbwwrygWo..',
    '..oWtbbwwrygWo..',
    '..oWtbbwwrygWo..',
    '...oWWWWWWWWo...',
    '....oooooooo....',
  ],
};

const CAULDRON: SpriteSource = {
  rows: [
    '...........oo...',
    '..........oro...',
    '.........oro....',
    '..oooooooroooo..',
    '.ommmmmmrmmmmmo.',
    '.omMmmwmmmMmwmo.',
    'oiiiiiiiiiiiiiio',
    'oiIIiiiiiiiiiiio',
    'oiIiiiiiiiiiiiio',
    'oiIiiiiiiiiiiiio',
    '.oiiiiiiiiiiiio.',
    '.oiiiiiiiiiiiio.',
    '..oiiiiiiiiiio..',
    '...oooooooooo...',
    '...oo......oo...',
  ],
};

const BAT_LAMP: SpriteSource = {
  rows: [
    '......o..o......',
    '......oooo......',
    'oo...okooko...oo',
    '.oooooooooooooo.',
    '...o.oooooo.o...',
    '....oooooooo....',
    '....oyyyyyyo....',
    '...oyYYyyyyyo...',
    '...oyyyyyyyyo...',
    '..oyyyyyyyyyyo..',
    '..oyyyyyyyyyyo..',
    '..oooooooooooo..',
    '.......ii.......',
    '.......ii.......',
    '.......ii.......',
    '.......ii.......',
    '.......ii.......',
    '.......ii.......',
    '.......ii.......',
    '.......ii.......',
    '.......ii.......',
    '.......ii.......',
    '.....oiiiio.....',
    '....oiiiiiio....',
    '....oooooooo....',
  ],
};

const MARBLE_RUN: SpriteSource = {
  rows: [
    '..oo........oo..',
    '..oW.r......Wo..',
    '..oWtttt....Wo..',
    '..oW..tttt..Wo..',
    '..oW....ttttWo..',
    '..oW......b.Wo..',
    '..oW....ttttWo..',
    '..oW..tttt..Wo..',
    '..oWtttt....Wo..',
    '..oW.y......Wo..',
    '..oWtttt....Wo..',
    '..oW..tttt..Wo..',
    '..oW....ttttWo..',
    '..oW......g.Wo..',
    '..oW....ttttWo..',
    '..oW..tttt..Wo..',
    '..oWtttt....Wo..',
    '..oW.l......Wo..',
    '.oWWWWWWWWWWWWo.',
    '.oWrbybgrlybgWo.',
    '.oWWWWWWWWWWWWo.',
    '.oooooooooooooo.',
  ],
};

const RECORD_PLAYER: SpriteSource = {
  rows: [
    '.oooooooooooooo.',
    'oWWWWWWWWWWWWWWo',
    'oWWoooooooWWWWWo',
    'oWokkkkkkkoWWiWo',
    'oWokkkrrkkoWiWWo',
    'oWokkkkkkkoiWWWo',
    'oWWoooooooWWWWWo',
    'oWWWWWWWWWWWWWWo',
    'owwwwwwwwwwwwwwo',
    'oooooooooooooooo',
    '.oCCCCCCCCCCCCo.',
    '.oCooooCCooooCo.',
    '.oCoccoCCoccoCo.',
    '.oCoccoCCoccoCo.',
    '.oCoccoCCoccoCo.',
    '.oCooooCCooooCo.',
    '.oCCCCCCCCCCCCo.',
    '.oooooooooooooo.',
    '..oo........oo..',
  ],
};

const MONSTERA: SpriteSource = {
  rows: [
    '.....oo..oo.....',
    '...ooLLooLLoo...',
    '..oLLlLLLLlLLo..',
    '.oLl.lLlLl.lLLo.',
    '.oLlllLlLlllLlo.',
    'oLl.llLlLll.lLLo',
    'oLllllLlLllllLlo',
    'olL.lLlllLl.lLlo',
    '.olllLlllLlllLo.',
    '..ollLlsslLllo..',
    '...oollsslloo...',
    '.....oossoo.....',
    '......osso......',
    '....oooooooo....',
    '...oPPPPPPPPo...',
    '....oppppppo....',
    '....oppppppo....',
    '....oppppppo....',
    '.....oppppo.....',
    '.....oooooo.....',
  ],
};

const SNAKE_PLANT: SpriteSource = {
  rows: [
    '.......o........',
    '......oyo.......',
    '...o..oGo.......',
    '..oyo.oGo..o....',
    '..oGo.ogGo.oyo..',
    '..oGgoogGooGGo..',
    '..ogGoGgGoGgGo..',
    '...oGoGgGoGgo...',
    '...ogGoGgGogGo..',
    '...oGgoGgGoGgo..',
    '...oGgoGgGGgo...',
    '....oGgGgGGgo...',
    '....oGgGgGgGo...',
    '....ogGgGgGgo...',
    '...oooooooooo...',
    '...oPPPPPPPPo...',
    '....oppppppo....',
    '....oppppppo....',
    '....oppppppo....',
    '.....oooooo.....',
  ],
};

const VENUS_FLYTRAP: SpriteSource = {
  rows: [
    '..oooo....oooo..',
    '.oLwLwo..owLwLo.',
    '.oLLLLo..oLLLLo.',
    '.orrrro..orrrro.',
    '.oLLLLo..oLLLLo.',
    '.owLwLo..oLwLwo.',
    '..oooso..osooo..',
    '.....oso.so.....',
    '......osso......',
    '.......ss.......',
    '....oooooooo....',
    '...oPPPPPPPPo...',
    '....oppppppo....',
    '....oppppppo....',
    '.....oppppo.....',
    '.....oooooo.....',
  ],
};

const SUCCULENTS: SpriteSource = {
  rows: [
    '................',
    '..o.o......o.o..',
    '.oLoLo....oBoBo.',
    '.oLlLo.oo.oBbBo.',
    '..olo.oLLo.obo..',
    '.oooooLlLooooo..',
    '.oPPPooloopppo..',
    '.oPPPooooopppo..',
    '.ooooooRRoooooo.',
    '.oWWWWWWWWWWWWo.',
    '.owwwwwwwwwwwwo.',
    '.oooooooooooooo.',
  ],
};

const SKELETON_FRIEND: SpriteSource = {
  rows: [
    '......oo........',
    '.....oyro.......',
    '....oyrryo......',
    '...oyyryyyo.....',
    '...oooooooo.....',
    '...obbbbbbo.....',
    '..obbbbbbbbo....',
    '..obkkbbkkbo....',
    '..obkkbbkkbo....',
    '..obbbbbbbbo....',
    '...obbkkbbo.....',
    '...obwbwbbo.....',
    '....oooooo......',
    '.....obbo.......',
    '...oobbbboo.....',
    '..obobbbbobo....',
    '..ob.oboo.bo....',
    '..obobbbbobo....',
    '..ob.oboo.bo....',
    '..obobbbbo.o....',
    '....obbbbo......',
    '...obbbbbbbbboo.',
    '...obbooooobbbbo',
    '....oo.....oooo.',
  ],
};

const CANDELABRA: SpriteSource = {
  rows: [
    '.......y........',
    '..y...yYy...y...',
    '.yYy..yYy..yYy..',
    '.yYy...y...yYy..',
    '..o...owo...o...',
    '.owo..owo..owo..',
    '.owo..owo..owo..',
    '.owo..owo..owo..',
    '.owo..owo..owo..',
    '.ogo..ogo..ogo..',
    '.oggo.ogo.oggo..',
    '..oggooggoogo...',
    '...ooggggggo....',
    '.....oggoo......',
    '......ogo.......',
    '......ogo.......',
    '......ogo.......',
    '......ogo.......',
    '......ogo.......',
    '.....ogggo......',
    '....oggggggo....',
    '....oooooooo....',
  ],
};

const CRYSTAL_BALL: SpriteSource = {
  rows: [
    '.....oooooo.....',
    '...ooccccccoo...',
    '..occCCcccccco..',
    '..ocCcccccccco..',
    '.occcccsccccco..',
    '.occccssscccco..',
    '.occcccsccccco..',
    '.occcccccccccco.',
    '..occccccccco...',
    '..occccccccco...',
    '...ooccccoo.....',
    '....ogggggo.....',
    '...ogGggggGo....',
    '..oggggggggo....',
    '..oooooooooo....',
  ],
};

const TOMBSTONE: SpriteSource = {
  rows: [
    '....oooooooo....',
    '...oAAaaaaaao...',
    '..oAaaaaaaaaao..',
    '..oAakkkakkkao..',
    '..oAakakakakao..',
    '..oAakkaakkaao..',
    '..oAakakakaaao..',
    '..oAakakakaaao..',
    '..oAaaaaaaaaao..',
    '..oAaappappaao..',
    '..oAappppppppo..',
    '..oAaappappaao..',
    '..oAaaaaaaaaao..',
    '..okkkkkkkkkko..',
    '.ommmmmmmmmmmmo.',
    '.oooooooooooooo.',
  ],
};

const BAT_BED: SpriteSource = {
  rows: [
    '.oo..........oooo..........oo...',
    '.oPo.oo....ooHHHHoo....oo.oPo...',
    '.oPooHHoooooHHHHHHHHoooooHHooPo.',
    '.oPoHHHHHHHHHHHkHHkHHHHHHHHHoPo.',
    '.oPoHhHHhHHHhHHHHHHhHHHhHHhHoPo.',
    '.oPooHooHooHooHHHHooHooHooHooPo.',
    '.oPo.o..o..o..oooo..o..o..o.oPo.',
    '.oPooooooooooooooooooooooooooPo.',
    '.oPowwwwwwwoooooooowwwwwwwwwoPo.',
    '.oPowWWWWWwowwwwwwowWWWWWWwwoPo.',
    '.oPowwwwwwwoowwwwoowwwwwwwwwoPo.',
    '.oPooooooooooooooooooooooooooPo.',
    '.oPoqqqqqqqqqqqqqqqqqqqqqqqqoPo.',
    '.oPoqQqqqqyqqqqqqqqqqQqqqqqqoPo.',
    '.oPoqqqqqyyqqqqqQqqqqqqqqyqqoPo.',
    '.oPoqqqqqqqqqqqqqqqqqqqqyyqqoPo.',
    '.oPoqqQqqqqqqqqyqqqqqqqqqqqqoPo.',
    '.oPoqqqqqqqqqqyyqqqqqQqqqqqqoPo.',
    '.oPoqqqqqyqqqqqqqqqqqqqqqqqqoPo.',
    '.oPoqqqqyyqqqqqqqQqqqqqqyqqqoPo.',
    '.oPoqqqqqqqqqqqqqqqqqqqyyqqqoPo.',
    '.oPoqQqqqqqqqyqqqqqqqqqqqqqqoPo.',
    '.oPoqqqqqqqqyyqqqqqqqqqqQqqqoPo.',
    '.oPoqqqqqqqqqqqqqqqqqqqqqqqqoPo.',
    '.oPoQQQQQQQQQQQQQQQQQQQQQQQQoPo.',
    '.oPoqqqqqqqqqqqqqqqqqqqqqqqqoPo.',
    '.oPoqqqqqqqqqqqqqqqqqqqqqqqqoPo.',
    '.oPooooooooooooooooooooooooooPo.',
    '.oPoWWWWWWWWWWWWWWWWWWWWWWWWoPo.',
    '.oPowwwwwwwwwwwwwwwwwwwwwwwwoPo.',
    '.oPooooooooooooooooooooooooooPo.',
    '.ooo........................ooo.',
  ],
};

const GHOST_PORTRAIT: SpriteSource = {
  rows: [
    'oooooooooooooooo',
    'oGGGGGGGGGGGGGGo',
    'oGoooooooooooogo',
    'oGoddddddddddogo',
    'oGodddhhhhdddogo',
    'oGoddhhhhhhddogo',
    'oGoddhkhhkhddogo',
    'oGoddrhhhhrddogo',
    'oGodhhhhhhhhdogo',
    'oGodhpppppphdogo',
    'oGodhhhhhhhhdogo',
    'oGodhhhhhhhhdogo',
    'oGodhhdhhdhhdogo',
    'oGoooooooooooogo',
    'oggggggggggggggo',
    'oooooooooooooooo',
  ],
};

const CAT_PORTRAIT: SpriteSource = {
  rows: [
    'oooooooooooooooo',
    'oGGGGGGGGGGGGGGo',
    'oGoooooooooooogo',
    'oGoddkddddkddogo',
    'oGodkkkddkkkdogo',
    'oGodkkkkkkkkdogo',
    'oGodkykkkkykdogo',
    'oGodkkkrrkkkdogo',
    'oGoddkkkkkkddogo',
    'oGodwwwwwwwwdogo',
    'oGowwwwwwwwwwogo',
    'oGodkkkkkkkkdogo',
    'oGodkkkkkkkkdogo',
    'oGoooooooooooogo',
    'oggggggggggggggo',
    'oooooooooooooooo',
  ],
};

const MOON_PAINTING: SpriteSource = {
  rows: [
    'oooooooooooooooo',
    'oGGGGGGGGGGGGGGo',
    'oGoooooooooooogo',
    'oGonnnnnnnnnnogo',
    'oGonnnnnnMMnnogo',
    'oGonwnnnMMMMnogo',
    'oGonnnnnMMMMnogo',
    'oGonnnnnnMMnnogo',
    'oGonnnwnnnnnnogo',
    'oGonnnnnnnnwnogo',
    'oGohhhnnnnnhhogo',
    'oGoHhhhhnhhhHogo',
    'oGoHHhhhhhhHHogo',
    'oGoooooooooooogo',
    'oggggggggggggggo',
    'oooooooooooooooo',
  ],
};

const BAT_CLOCK: SpriteSource = {
  rows: [
    '................',
    '.....oooooo.....',
    'oo..oFFFFFFo..oo',
    'owooFFFkFFFFoowo',
    'owwoFFFkFFFFowwo',
    'owwoFkFkFFkFowwo',
    'owwoFFFkkkFFowwo',
    'oowoFFFFFFFFowoo',
    '..ooFkFFFFkFoo..',
    '...oFFFFFFFFo...',
    '....oFFkFFFo....',
    '.....oooooo.....',
    '.......oo.......',
    '.......oo.......',
    '......oBBo......',
    '.......oo.......',
  ],
};

const WALL_SHELF: SpriteSource = {
  rows: [
    '................',
    '................',
    '...oo......oo...',
    '..oggo....obbo..',
    '..ogko.oo.obbo..',
    '..oggoorro.bbo..',
    '..oggoorroobbo..',
    '..ooooooooooo...',
    '.oWWWWWWWWWWWWo.',
    '.owwwwwwwwwwwwo.',
    '..oo........oo..',
    '...o........o...',
    '................',
    '................',
    '................',
    '................',
  ],
};

const POTHOS: SpriteSource = {
  rows: [
    '.......oo.......',
    '......o..o......',
    '.....o....o.....',
    '....o......o....',
    '...oooooooooo...',
    '...oPPPPPPPPo...',
    '..oLloppppolLo..',
    '.oLl.oppppo.lLo.',
    '.ol...oooo...lo.',
    '.oLo........oLo.',
    '..lo.........lo.',
    '..oLo.......oLo.',
    '...lo........lo.',
    '...oLo.......oLo',
    '....lo........l.',
    '....oo........o.',
  ],
};

const GOTHIC_MIRROR: SpriteSource = {
  rows: [
    '.......oo.......',
    '......oGGo......',
    '.....oGooGo.....',
    '....oGo..oGo....',
    '...oGommmmoGo...',
    '...oGmMmmmmoGo..',
    '..oGomMmmmmmoGo.',
    '..oGomMmmmmmoGo.',
    '..oGommmmmmmoGo.',
    '..oGommmmmmmoGo.',
    '..oGommmmmmmoGo.',
    '..oGommmmmmmoGo.',
    '..oGommmmmmmoGo.',
    '..oGommmmmmmoGo.',
    '..oGommmmmmmoGo.',
    '..oGomMmmmmmoGo.',
    '..oGommMmmmmoGo.',
    '..oGommmmmmmoGo.',
    '..oGommmmmmmoGo.',
    '..oGommmmmmmoGo.',
    '..oGommmmmmmoGo.',
    '..oGommmmmmmoGo.',
    '..oGommmmmmmoGo.',
    '..oGommmmmmmoGo.',
    '..oGommmmmmmoGo.',
    '...oGommmmmoGo..',
    '...oGommmmmoGo..',
    '....oGommmoGo...',
    '.....oGoooGo....',
    '......oGGGo.....',
    '.......ooo......',
    '................',
  ],
};

const CORKBOARD: SpriteSource = {
  rows: [
    '................................',
    '.oooooooooooooooooooooooooooooo.',
    '.oWWWWWWWWWWWWWWWWWWWWWWWWWWWWo.',
    '.oWccccccccccccccccccccccccccWo.',
    '.oWcnnnncccccccccccccCnnnnnccWo.',
    '.oWcnnnnrrcccccccccrrnnnnnnccWo.',
    '.oWcnnnncccrrrcccrrccnnnnnnccWo.',
    '.oWcccccccccccrrrccccccccccccWo.',
    '.oWccccccccccyyyyycccccccccccWo.',
    '.oWcccccccccryyyyyrccccccccccWo.',
    '.oWccccccccrccyyycccrccccccccWo.',
    '.oWcCccccrrcccccccccrrcccccccWo.',
    '.oWcnnnnncccccccccccccnnnnnccWo.',
    '.oWWWWWWWWWWWWWWWWWWWWWWWWWWWWo.',
    '.oooooooooooooooooooooooooooooo.',
    '................................',
  ],
};

const BAT_GARLAND: SpriteSource = {
  rows: [
    '................................',
    'oo............................oo',
    '.orr......................rrrro.',
    '...rrrr................rrrr.....',
    '.......rrrr........rrrr.........',
    '.....o...o.rrrrrrrr..o...o......',
    '...o.oooooo.......o.oooooo.o....',
    '...oooookooo......oooookooo.....',
    '....ooooooo........ooooooo......',
    '.....o...o..........o...o.......',
    '..........o....o................',
    '.........oooooooo...............',
    '........oookooko.o..............',
    '.........oooooooo...............',
    '..........o....o................',
    '................................',
  ],
};

/**
 * A round rug, woven in rings: `rings` are the keys from the edge inwards, one pixel each, the last
 * filling the middle. Drawn in code because a circle by hand is thirty-two chances to be lopsided.
 */
function roundRug(size: number, rings: string): SpriteSource {
  const rows: string[] = [];
  const r = size / 2;
  for (let y = 0; y < size; y++) {
    let row = '';
    for (let x = 0; x < size; x++) {
      const d = r - Math.hypot(x + 0.5 - r, y + 0.5 - r);
      row += d < 0 ? '.' : (rings[Math.min(Math.floor(d), rings.length - 1)] ?? '.');
    }
    rows.push(row);
  }
  return { rows };
}

/** Stamps `stamp` onto `base` wherever it has something other than `.`, centred. */
function stampCentre(base: SpriteSource, stamp: readonly string[]): SpriteSource {
  const rows = base.rows.map((r) => [...r]);
  const y0 = Math.floor((rows.length - stamp.length) / 2);
  const x0 = Math.floor(((rows[0]?.length ?? 0) - (stamp[0]?.length ?? 0)) / 2);
  stamp.forEach((line, dy) =>
    [...line].forEach((key, dx) => {
      const row = rows[y0 + dy];
      if (key !== '.' && row) row[x0 + dx] = key;
    }),
  );
  return { rows: rows.map((r) => r.join('')) };
}

const MOON_RUG = stampCentre(roundRug(32, 'oBBbbbbbbbbbbbbb'), [
  '....YYY....',
  '..YYYy.....',
  '.YYYy......',
  '.YYy.......',
  'YYYy.......',
  'YYYy.......',
  'YYYy.......',
  'YYYyy......',
  '.YYYy......',
  '.YYYYy...Y.',
  '..YYYYYYYY.',
  '....YYYY...',
]);

/** A spiderweb: spokes and rings of silver on plum, with a little friendly spider in the middle. */
function spiderweb(size: number): SpriteSource {
  const rows: string[] = [];
  const r = size / 2;
  for (let y = 0; y < size; y++) {
    let row = '';
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - r;
      const dy = y + 0.5 - r;
      const d = Math.hypot(dx, dy);
      if (d > r) row += '.';
      else if (d > r - 1) row += 'o';
      else {
        const angle = Math.atan2(dy, dx);
        const spoke = Math.abs(Math.sin(angle * 4)) * d < 0.8;
        const ring = Math.abs(((d + 2) % 6) - 3) < 0.55;
        row += spoke || ring ? 'w' : 'p';
      }
    }
    rows.push(row);
  }
  return stampCentre({ rows }, ['o.o..o.o', '.oookoo.', 'ooookooo', '.oookoo.', 'o.o..o.o']);
}

const SPIDERWEB_RUG = spiderweb(48);

const LIT = { y: C.candle, Y: C.candleBright } as const;

const POT = { P: C.teal, p: C.tealShade } as const;

export const FURNITURE_ART: Record<FurnitureId, FurnitureArt> = {
  batBed: {
    source: BAT_BED,
    palette: {
      '.': null,
      o: C.ink,
      P: C.berry,
      H: C.inkFabric,
      h: C.plum,
      k: C.candle,
      w: C.white,
      W: C.cream,
      q: C.blueFabric,
      Q: C.blueFabricShade,
      y: C.gold,
    },
  },
  twoHeadedDuck: {
    source: DUCK,
    palette: {
      '.': null,
      o: C.ink,
      G: C.ghost,
      h: C.leaf,
      k: C.ink,
      y: C.pumpkin,
      w: C.white,
      n: C.bark,
      b: C.wood,
      B: C.rope,
      d: C.stoneDark,
      p: C.barkDark,
      W: C.wood,
      x: C.bark,
    },
  },
  pumpkinChair: {
    source: PUMPKIN_CHAIR,
    side: PUMPKIN_CHAIR_SIDE,
    back: PUMPKIN_CHAIR_BACK,
    palette: {
      '.': null,
      o: C.ink,
      P: C.pumpkinLight,
      p: C.pumpkin,
      s: C.moss,
      c: C.plum,
      C: C.plumLight,
    },
  },
  coffinBookshelf: {
    source: COFFIN_BOOKSHELF,
    palette: {
      '.': null,
      o: C.ink,
      W: C.bark,
      w: C.barkDark,
      b: C.blueFabric,
      r: C.rose,
      y: C.gold,
      t: C.teal,
      l: C.lavender,
      g: C.moss,
    },
  },
  cauldron: {
    source: CAULDRON,
    palette: {
      '.': null,
      o: C.ink,
      i: C.iron,
      I: C.dusk,
      m: C.bark,
      M: C.wood,
      w: C.cream,
      r: C.rope,
    },
  },
  batLamp: {
    source: BAT_LAMP,
    palette: {
      '.': null,
      o: C.ink,
      k: C.candle,
      y: C.lavender,
      Y: C.ghost,
      i: C.iron,
    },
    glow: LIT,
    lights: [{ x: 8, y: 9, radius: 26 }],
  },
  marbleRun: {
    source: MARBLE_RUN,
    palette: {
      '.': null,
      o: C.ink,
      W: C.wood,
      t: C.rope,
      r: C.rose,
      b: C.blueFabric,
      y: C.gold,
      g: C.leafLight,
      l: C.lavender,
    },
  },
  recordPlayer: {
    source: RECORD_PLAYER,
    palette: {
      '.': null,
      o: C.ink,
      W: C.wood,
      w: C.bark,
      k: C.inkFabric,
      r: C.rose,
      i: C.silver,
      C: C.teal,
      c: C.tealLight,
    },
  },
  monstera: {
    source: MONSTERA,
    palette: { '.': null, o: C.ink, L: C.leafLight, l: C.leaf, s: C.leafDark, ...POT },
  },
  snakePlant: {
    source: SNAKE_PLANT,
    palette: { '.': null, o: C.ink, G: C.leaf, g: C.leafDark, y: C.hostaCream, ...POT },
  },
  venusFlytrap: {
    source: VENUS_FLYTRAP,
    palette: {
      '.': null,
      o: C.ink,
      L: C.leafLight,
      w: C.white,
      r: C.rose,
      s: C.leaf,
      ...POT,
    },
  },
  succulents: {
    source: SUCCULENTS,
    palette: {
      '.': null,
      o: C.ink,
      L: C.hostaBlueLight,
      l: C.hostaBlue,
      B: C.leafLight,
      b: C.leaf,
      P: C.coral,
      p: C.sky,
      R: C.rose,
      W: C.wood,
      w: C.bark,
    },
  },
  skeletonFriend: {
    source: SKELETON_FRIEND,
    palette: {
      '.': null,
      o: C.ink,
      b: C.cream,
      k: C.dusk,
      w: C.white,
      y: C.gold,
      r: C.rose,
    },
  },
  candelabra: {
    source: CANDELABRA,
    palette: { '.': null, o: C.ink, y: C.pumpkin, Y: C.pumpkinLight, w: C.cream, g: C.gold },
    glow: LIT,
    lights: [
      { x: 2, y: 2, radius: 14 },
      { x: 7, y: 1, radius: 18 },
      { x: 12, y: 2, radius: 14 },
    ],
  },
  crystalBall: {
    source: CRYSTAL_BALL,
    palette: {
      '.': null,
      o: C.ink,
      c: C.lavender,
      C: C.ghost,
      s: C.plumLight,
      g: C.gold,
      G: C.goldShade,
    },
    glow: { c: C.lavender, C: C.ghost, s: C.candleBright },
    lights: [{ x: 7, y: 6, radius: 16 }],
  },
  tombstone: {
    source: TOMBSTONE,
    palette: {
      '.': null,
      o: C.ink,
      a: C.stone,
      A: C.stoneLight,
      k: C.stoneDark,
      p: C.pumpkin,
      m: C.moss,
    },
  },
  moonRug: {
    source: MOON_RUG,
    palette: { '.': null, o: C.navy, B: C.navyShade, b: C.blueFabric, Y: C.gold, y: C.goldShade },
  },
  spiderwebRug: {
    source: SPIDERWEB_RUG,
    palette: { '.': null, o: C.ink, p: C.plum, w: C.silver, k: C.candle },
  },
  ghostPortrait: {
    source: GHOST_PORTRAIT,
    palette: {
      '.': null,
      o: C.ink,
      G: C.gold,
      g: C.goldShade,
      d: C.plum,
      h: C.ghost,
      k: C.ink,
      r: C.cheek,
      p: C.silver,
    },
  },
  catPortrait: {
    source: CAT_PORTRAIT,
    palette: {
      '.': null,
      o: C.ink,
      G: C.gold,
      g: C.goldShade,
      d: C.teal,
      k: C.inkFabric,
      y: C.gold,
      r: C.rose,
      w: C.white,
    },
  },
  moonPainting: {
    source: MOON_PAINTING,
    palette: {
      '.': null,
      o: C.ink,
      G: C.gold,
      g: C.goldShade,
      n: C.navy,
      M: C.candleBright,
      w: C.ghost,
      h: C.mossDark,
      H: C.moss,
    },
  },
  batClock: {
    source: BAT_CLOCK,
    palette: {
      '.': null,
      o: C.ink,
      w: C.plum,
      F: C.cream,
      k: C.ink,
      B: C.gold,
    },
  },
  wallShelf: {
    source: WALL_SHELF,
    palette: {
      '.': null,
      o: C.ink,
      g: C.leafLight,
      k: C.white,
      r: C.rose,
      b: C.sky,
      W: C.wood,
      w: C.bark,
    },
  },
  pothos: {
    source: POTHOS,
    palette: { '.': null, o: C.ink, L: C.leafLight, l: C.leaf, ...POT },
  },
  gothicMirror: {
    source: GOTHIC_MIRROR,
    palette: { '.': null, o: C.ink, G: C.gold, m: C.sky, M: C.ghost },
  },
  mysteryCorkboard: {
    source: CORKBOARD,
    palette: {
      '.': null,
      o: C.ink,
      W: C.wood,
      c: C.rope,
      C: C.creamShade,
      n: C.white,
      r: C.scarlet,
      y: C.cream,
    },
  },
  batGarland: {
    source: BAT_GARLAND,
    palette: { '.': null, o: C.ink, r: C.pumpkin, k: C.candle },
  },
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
