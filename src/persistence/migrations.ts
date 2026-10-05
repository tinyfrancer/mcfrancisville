import { FIRST_VERSION, isSaveState, SAVE_VERSION, type SaveState } from './SaveState';
import { FIRST_BROOM } from '../data/broom';

/** Upgrades a save from exactly version N (its key) to N + 1. */
export type MigrationStep = (state: Record<string, unknown>) => Record<string, unknown>;

// Each step says why the default it fills in is honest for a save made before the field existed.
// A step's data is written out in full rather than imported, so a later change to the starters
// can't change what an old save upgrades to. Version 0's steps (1 to 11) went with its saves
// (decisions.md 80); 0.1's chain starts at `FIRST_VERSION`.
export const MIGRATIONS: Record<number, MigrationStep> = {
  // Phase D1: her face's freckles and nose stud, and the crops she has picked. A look chosen
  // before either was offered didn't have them, so she keeps the face she chose. No crop has been
  // recorded as picked, so the first of each after this still gets her rocking out once.
  12: (state) => {
    const look = state.look as Record<string, unknown> | null;
    return {
      ...state,
      look: look ? { ...look, freckles: false, nosePiercing: false } : null,
      harvested: [],
    };
  },
  // Phase E: the places beyond the town. Before them there was only the town and her home, and
  // she had been to both; nothing shut had been opened, because nothing was shut.
  13: (state) => ({ ...state, atlas: { found: ['town', 'home'], opened: [] } }),
  // Phase F: the town re-laid as the hub. Her farm is the same two rows of eight beds, moved two
  // tiles right and one down, so each bed she tilled (and what's growing in it) moves with it.
  // Anywhere she stood in the old town is somewhere else in the new one, so she's at her door.
  14: (state) => {
    const player = state.player as Record<string, unknown>;
    const beds = state.beds as { tx: number; ty: number }[];
    const oldFarm = (b: { tx: number; ty: number }) =>
      b.tx >= 9 && b.tx <= 16 && b.ty >= 5 && b.ty <= 6;
    return {
      ...state,
      player: player.zone === 'town' ? { ...player, tx: 4, ty: 9, facing: 'down' } : player,
      beds: beds.map((b) => (oldFarm(b) ? { ...b, tx: b.tx + 2, ty: b.ty + 1 } : b)),
    };
  },
  // Phase G: the pots by her door, which were first drawn with mums in them, so that's what's in
  // them. The buildings grew too, but where she stood is checked on load, and anywhere a house
  // now stands puts her at her door.
  15: (state) => ({ ...state, porch: { plant: 'mums' } }),
  // Phase H: the insides of the buildings, and the keepsakes in her neighbours' houses. Nobody had
  // been in to see one before, so she hasn't been given any.
  16: (state) => ({ ...state, keepsakes: [] }),
  // Phase I: the places beyond the town, and what's buried in them. Nothing was buried before
  // them, so she has dug nothing up.
  17: (state) => ({ ...state, dug: [] }),
  // Phase J: her stained-glass lamp, which a new home has beside the armchair from the first day.
  // A home furnished before it came has no room kept for it, so it waits in her storage chest.
  18: (state) => {
    const home = state.home as {
      placed: { id: string }[];
      stored: { id: string; count: number }[];
    };
    const has = [...home.placed, ...home.stored].some((p) => p.id === 'floralLamp');
    if (has) return state;
    return {
      ...state,
      home: { ...home, stored: [...home.stored, { id: 'floralLamp', count: 1 }] },
    };
  },
  // Phase M: the quick bar and the "new" marks. She was holding nothing, and everything she had
  // she had already seen.
  19: (state) => ({
    ...state,
    held: 'hands',
    fresh: { bag: [], closet: [], storage: [], cabinet: [], recipes: [] },
  }),
  // Phase O: visits, the candy tree and the honesty stall. No visit had been counted, the tree had
  // never been shaken, and the stall was empty.
  20: (state) => ({
    ...state,
    visits: { count: 0, last: '' },
    candyTree: { shaken: null },
    stall: { stock: [], since: state.lastPlayedAt, sold: [], tin: 0 },
  }),
  // Phase P: sprinklers, which nobody had made yet.
  21: (state) => ({ ...state, sprinklers: [] }),
  // Phase R: cooking. She hadn't eaten anything yet, and a home furnished before her stove finds
  // it waiting in the storage chest, as the lamp did (step 18).
  22: (state) => {
    const home = state.home as {
      placed: { id: string }[];
      stored: { id: string; count: number }[];
    };
    const has = [...home.placed, ...home.stored].some((p) => p.id === 'stove');
    return {
      ...state,
      kitchen: { pep: null, bites: null, lure: null },
      home: has ? home : { ...home, stored: [...home.stored, { id: 'stove', count: 1 }] },
    };
  },
  // Phase S: small events. She wasn't carrying anything back to anyone yet.
  23: (state) => ({ ...state, errand: null }),
  // Phase T: newcomers. Nobody has written yet, and the month till the first runs from today.
  24: (state) => ({ ...state, newcomers: { since: '', wrote: {} } }),
  // Version 0.1 ended at 25, and 0.2 begins there. Her phone holds 0.1's saves, so from here on
  // no step is ever dropped (decision 80 dropped 0's).
  // 0.2's P1: her broom, which hasn't come yet, in the colours it comes in, and nowhere to fly back to.
  25: (state) => ({ ...state, left: null, broom: { ...FIRST_BROOM } }),
  // 0.2's K3, after her look at it: split dye is any two colours now, picked apart, so the two
  // fixed pairs become their halves; and her striped sleeve goes on her right arm, as it really is.
  26: (state) => {
    const look = state.look as Record<string, unknown> | null;
    if (!look) return state;
    const halves: Record<string, [string, string | null]> = {
      pinkSplit: ['pink', 'darkBrown'],
      splitDye: ['coral', 'blonde'],
    };
    const [hairColour, splitColour] = halves[look.hairColour as string] ?? [
      look.hairColour,
      look.splitColour ?? null,
    ];
    const stripesArm = look.stripesArm ?? 'right';
    return { ...state, look: { ...look, hairColour, splitColour, stripesArm } };
  },
  // 0.2's W1: bracelets on her wrist. She couldn't wear one before, so her wrist is bare, and
  // every bracelet she made is still in her bag, hers to put on.
  27: (state) => {
    const look = state.look as Record<string, unknown> | null;
    return look ? { ...state, look: { ...look, wrist: [] } } : state;
  },
  // 0.2's N1: beds grow beyond the farm, so each bed and sprinkler says which place it's in (every
  // one so far is in town), and the farm's extension rows are counted, none built yet.
  28: (state) => {
    const inTown = (list: unknown) =>
      Array.isArray(list)
        ? list.map((b) => (typeof b === 'object' && b !== null ? { zone: 'town', ...b } : b))
        : list;
    return {
      ...state,
      beds: inTown(state.beds),
      sprinklers: inTown(state.sprinklers),
      farmRows: 0,
    };
  },
  // 0.2's F2: the squishies and monster dolls she has ever had are kept, for the sets she
  // collects. None are known from before; whatever is in her bag is counted as the game opens.
  29: (state) => ({ ...state, collected: [] }),
  // 0.2's E1: candy saplings planted in her yard, and a second shelf on the honesty stall. None
  // of either before.
  30: (state) => ({
    ...state,
    candyTree: { ...(state.candyTree as object), saplings: [] },
    stall: { ...(state.stall as object), shelves: 0 },
  }),
  // 0.2's L1: Boothoven writes soon after the game first knows of him, so the save keeps the day
  // it first did. No newcomer had been heard of that way before; he is heard of on loading.
  31: (state) => ({
    ...state,
    newcomers: { ...(state.newcomers as object), heard: {} },
  }),
  // 0.2's L2: the tunes Boothoven teaches her are kept. None were taught before.
  32: (state) => ({ ...state, tunes: [] }),
  // Everyone lives in town from the start (decision 211): nobody writes or moves in any more, so
  // when each newcomer wrote is let go. Their letters stay in her mailbox.
  33: (state) => {
    const next = { ...state };
    delete next.newcomers;
    return next;
  },
  // 0.3's saves begin at v35: 0.2.5, on her phone, writes v34, so 0.3's first step is keyed 34.
  // 0.3's H1: her storage chest keeps things from her bag too. None had been put away before.
  34: (state) => ({ ...state, home: { ...(state.home as object), items: [] } }),
  // 0.3's H2: a placed piece may have something on show in it. Nothing was before, so an old
  // save's pieces stand as they were.
  35: (state) => state,
  // 0.3's H3: a small piece may stand on a surface. Nothing did before, so an old save's pieces
  // all stand on the floor as they were.
  36: (state) => state,
  // 0.3's F0: Lantern Shore's beds moved from the foot of the west bank (row 22) to a block up it,
  // so the way round the lake is whole (decision 240). A bed she had there, and a sprinkler in
  // one, moves with what's in it, left to right along the old row to the block's top row, then
  // its bottom row. The tiles are written out, not read from the map, as every step's data is.
  37: (state) => {
    const moved: Record<string, { tx: number; ty: number }> = {
      '1,22': { tx: 1, ty: 19 },
      '2,22': { tx: 2, ty: 19 },
      '3,22': { tx: 1, ty: 20 },
      '4,22': { tx: 2, ty: 20 },
    };
    const up = (list: unknown) =>
      Array.isArray(list)
        ? list.map((b) => {
            if (typeof b !== 'object' || b === null || b.zone !== 'lanternShore') return b;
            const to = moved[`${b.tx},${b.ty}`];
            return to ? { ...b, ...to } : b;
          })
        : list;
    return { ...state, beds: up(state.beds), sprinklers: up(state.sprinklers) };
  },
  // 0.3's H4: her home becomes rooms. The one room she had is the front room, everything in it
  // where it was, and she's in it.
  38: (state) => ({ ...state, home: homeInRooms(state.home as Record<string, unknown>) }),
};

/**
 * 0.3's H4: her home becomes rooms, and the one room she had is the front room, `rooms.main`,
 * with everything in it where it was, its walls, floor and size. She's in it whenever she's home,
 * there being no other yet.
 */
export function homeInRooms(home: Record<string, unknown>): Record<string, unknown> {
  const { placed, wallpaper, flooring, size, ...rest } = home;
  return { ...rest, rooms: { main: { placed, wallpaper, flooring, size } }, here: 'main' };
}

/** Whether a parsed save is one of version 0's, which 0.1 sets aside rather than reads. */
export function isVersionZero(raw: unknown): boolean {
  if (typeof raw !== 'object' || raw === null) return false;
  const version = (raw as Record<string, unknown>).version;
  return typeof version === 'number' && version < FIRST_VERSION;
}

/**
 * Walks a parsed save up to `current`, one step at a time. Null for anything that isn't a save, a
 * save from version 0, a version with a gap in the chain, a save from a newer build than this one,
 * or a result that isn't the current shape.
 */
export function migrateSave(
  raw: unknown,
  current: number = SAVE_VERSION,
  steps: Record<number, MigrationStep> = MIGRATIONS,
): SaveState | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  let state = raw as Record<string, unknown>;
  let version = state.version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version > current) return null;
  if (isVersionZero(state)) return null;
  while (version < current) {
    const step = steps[version];
    if (!step) return null;
    state = step(state);
    version += 1;
    state.version = version;
  }
  return isSaveState(state) ? state : null;
}
