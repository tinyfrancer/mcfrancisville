import { FIRST_VERSION, isSaveState, SAVE_VERSION, type SaveState } from './SaveState';
import { FIRST_BROOM } from '../data/broom';
import { everOf } from '../systems/catalogue';

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
  // 0.3's H5: her yard, with nothing out in it yet.
  39: (state) => ({ ...state, yard: { placed: [] } }),
  // 0.3's S1: Ollie's catalogue. What she has had is seeded from what she owns and wears now, which
  // is all a save before it knew; nothing has been ordered yet.
  40: (state) => ({ ...state, ever: everOwned(state), orders: [] }),
  // 0.3's F3: Scarah, a neighbour of her own in friendships. Nobody had met her before, so every
  // friendship stays as it was and hers starts when she first talks to her.
  41: (state) => state,
  // 0.3's C1: fossils, which the museum's seventh case shows from `cabinet.donated` and which count
  // as had in `collected`. Nobody had dug one up before, so both lists stay as they were.
  42: (state) => state,
  // V1's P1: what her neighbours remember of her. Nothing was remembered before, so nothing she
  // did then is brought up as though they'd been listening: no piece placed, crop picked or thing
  // given the museum lately. Each friendship stays as it was; what it gave, spoke and opened with
  // is kept from the first talk after.
  43: (state) => ({ ...state, lately: { placed: null, harvested: null, donated: null } }),
  // V1's P2: their questions and heart moments, kept on each friendship once asked or told.
  // Nobody had asked her anything or told her a story before, so every friendship stays as it
  // was: each question is still to ask, and each moment she has the hearts for is still to come.
  44: (state) => state,
  // V1's P3a: the mystery's chain and Wes. The day this build first sees her town is set on its
  // first look, so the chain starts the next morning; Wes ran off once if his button is on her
  // board (that was a glimpse), and nobody had chatted with him.
  45: (state) => {
    const mystery = (state.mystery ?? {}) as Record<string, unknown>;
    const clues = (mystery.clues ?? {}) as Record<string, unknown>;
    const glimpses = typeof clues.button === 'string' ? 1 : 0;
    return {
      ...state,
      mystery: { ...mystery, began: null, wes: { glimpses, chats: 0, talked: null } },
    };
  },
  // V1's P3b: Rob Boo, the mayor, met at the castle; the day she met him is the `unmasked` clue's
  // in `mystery.clues`, and his friendship goes in `friends` as anyone's. Nobody had met him
  // before, so nothing changes: the mystery and every friendship stay as they were.
  46: (state) => state,
  // V1's P4: what she did at her neighbours' happenings, which the host remembers next time.
  // Nobody had a verb to join in with before, so there's nothing to remember: an empty record.
  47: (state) => ({ ...state, happenings: {} }),
  // V1's P5: Cody, married. Nobody had asked her how her day was or told her their story before,
  // so there's no answer to bring up and no scene told: each is still to come.
  48: (state) => {
    const lately = (state.lately ?? {}) as Record<string, unknown>;
    return { ...state, lately: { ...lately, herDay: null, told: [] } };
  },
  // V1's R1: Cody's list for her first day. A town saved before it isn't new, and she knows her
  // way round it already, so its first day is over, with no step counted and no gift given.
  49: (state) => ({ ...state, firstDay: { done: [], over: true } }),
  // V1's R4: the town's projects. A town saved before them has none begun and none built.
  50: (state) => ({ ...state, projects: { current: null, given: {}, built: [] } }),
  // V1's R6a: the biggest of each fish she lands. No fish was ever measured before, so none has a
  // best yet; the next of each she lands is its first, and the Cabinet asks her to land another.
  51: (state) => {
    const cabinet = (state.cabinet ?? {}) as Record<string, unknown>;
    return { ...state, cabinet: { ...cabinet, best: {} } };
  },
  // V1's R6c: how fond each pet has grown of her. Nothing counted before, so each starts at none,
  // and every pat from here on counts.
  52: (state) => {
    const pets = (state.pets ?? {}) as Record<string, unknown>;
    return { ...state, pets: { ...pets, affection: {} } };
  },
  // 1.0.1: what she ate for each of a meal's effects (`kitchen.ate`). Nothing was kept of it
  // before, so it's left absent, and a meal still on shows the first dish that does the same, as
  // it did; the next she eats is kept.
  53: (state) => state,
  // 1.1's W2: a planter's bed knows its room. Until then a planter stood only in her front room,
  // so every bed and sprinkler at home is the front room's; nothing anywhere else changes.
  54: (state) => {
    const inFrontRoom = (spot: unknown) =>
      typeof spot === 'object' && spot !== null && (spot as { zone?: unknown }).zone === 'home'
        ? { ...spot, room: 'main' }
        : spot;
    const each = (list: unknown) => (Array.isArray(list) ? list.map(inFrontRoom) : list);
    return { ...state, beds: each(state.beds), sprinklers: each(state.sprinklers) };
  },
  // 1.4's G1: the shinies. None was ever dealt before, so a town has caught none and shows none;
  // the first she nets is the first of its kind.
  55: (state) => {
    const cabinet = (state.cabinet ?? {}) as Record<string, unknown>;
    return { ...state, cabinet: { ...cabinet, shinies: {}, shinyShown: [] } };
  },
  // 1.5's G4: her star chart. There was no telescope before, so a town has traced nothing yet.
  56: (state) => {
    const cabinet = (state.cabinet ?? {}) as Record<string, unknown>;
    return { ...state, cabinet: { ...cabinet, stars: {} } };
  },
  // 1.5's G6: the attic. Her rooms were a record by room already, and a room not saved is one not
  // built, so a town has no attic until she builds one; the bump keeps a build that doesn't know
  // an attic from opening (and dropping) one.
  57: (state) => state,
  // 1.6's X3: the hens at Boo Acres. There were none before, so a town has never fed them and has
  // no eggs waiting; the coop stands there from the moment it opens.
  58: (state) => ({ ...state, henhouse: { fed: null, waiting: 0 } }),
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

/**
 * 0.3's S1: what Ollie's catalogue lists of everything a save holds: her bag, her chest's pieces
 * and things, every room's and the yard's pieces and what they show, her closet (what she wears is
 * in it), her walls and floors, and her pets' things. Read loosely, since it's an older shape.
 */
export function everOwned(state: Record<string, unknown>): string[] {
  const list = (value: unknown): Record<string, unknown>[] =>
    Array.isArray(value) ? value.filter((v) => typeof v === 'object' && v !== null) : [];
  const ids = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
  const field = (o: Record<string, unknown>, key: string): string[] =>
    typeof o[key] === 'string' ? [o[key] as string] : [];
  const home = (state.home ?? {}) as Record<string, unknown>;
  const rooms = Object.values((home.rooms ?? {}) as Record<string, unknown>);
  const pieces = [
    ...rooms.flatMap((r) => list((r as Record<string, unknown> | null)?.placed)),
    ...list((state.yard as Record<string, unknown> | undefined)?.placed),
  ];
  const pets = (state.pets ?? {}) as Record<string, unknown>;
  return everOf({
    items: [
      ...list(state.bag).flatMap((s) => field(s, 'id')),
      ...list(home.items).flatMap((s) => field(s, 'id')),
      ...pieces.flatMap((p) => field(p, 'shows')),
      ...ids(state.collected),
    ],
    furniture: [
      ...pieces.flatMap((p) => field(p, 'id')),
      ...list(home.stored).flatMap((s) => field(s, 'id')),
    ],
    outfits: ids(state.wardrobe),
    wallpapers: ids(home.wallpapers),
    floorings: ids(home.floorings),
    accessories: ids(pets.accessories),
  });
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
