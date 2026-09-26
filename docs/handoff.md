# Handoff: picking up version 0 cold

Written 2026-09-26, updated at the end of phase 5 for a fresh session. Keep it current as phases
land, and delete it when v0 ships.

## Where things stand

Phases 0–5 are built. The game boots into a first draft of the town: her house beside Hosta La
Vista Farm, the square and its well, the shop, the Muse Hair Salon, the graveyard garden and the
pond. A new game opens on the character creator, already dressed as her, and waits for her name.
After that she walks wherever you tap. The town follows the phone's clock: dawn, day, a golden
hour, dusk and a lavender-blue night, with lanterns, windows and jack-o'-lanterns lit after dark.
Tapping a tree shakes loose wood, a rock gives stone, and walking onto a patch of flowers picks
them, all once a day until 5am. After 8pm a snack waits somewhere in town. On the farm, tapping a
bed tills it and asks which seed to plant; tapping it again waters it, and once it's ripe, picks it
with the seed given back. The rose bush in the corner gives roses daily, now and then a blue one.
Everything goes in the bag (🎒), which starts with five Purse butter and a few of every seed. The
👗 button opens her closet, and walking up to the pink salon opens the Muse Hair Salon. Settings
(the gear) holds the backup code. Everything is saved as she goes. **Next is phase 6**: Candy and
the daily shop (`docs/v0_plan.md`).

**Branches and PRs.** Phases 0–5, each one PR, are merged into `main` with merge commits. The user wants each phase's PR merged as soon as its CI is green, so the next phase
branches from `main`.

**Starting phase 6 in a new session:**

1. Attach `tinyfrancer/mcfrancisville`.
2. Branch from `main`, open the phase's PR against `main`, and merge it (merge commit) once CI
   is green.
3. Read "The shop, and things to come" in `docs/personal_touches.md` first: phase 6's touches
   are answered. In short: fancy shoes in the clothes stock every day (she loves shoes); the
   squishies are NeeDoh-style squeeze balls and squishy dumplings; a parody Spirit Halloween
   pop-up shop that turns up in a different spot every so often (and, separately, goofy real
   ghosts who pop up too); and a "Shut Up and Dance" record that is a
   gift for later, not a shop item. A castle (they married at Piatt Castles) is noted for after v0.
4. The shop builds on what's there: stock seeded by the day key is `hashString(dayKey(now))` in
   `src/systems/gathering.ts`, as the night's snack does it. Walking up to the teal shop house
   arrives with `at: 'shopHouse'`, the way the salon opens (see `onWorldEvents` in `main.ts`).
   Buying seeds is `town.bag.add`; selling needs `Bag.remove`, which planting already uses. Every
   item has a `kind` in `src/data/items.ts` that a price table can key off. Candy is a new field
   in the save (see below), not a bag item, unless you decide otherwise and say why.
5. Clothes: nothing adds to `town.wardrobe.owned` yet; the shop is where that method arrives.

**How the garden works, for whoever adds a crop:**

- A crop is a row in `CROPS` (`src/data/crops.ts`): its sentence name, seed item, harvest and
  `days`. Its seed and harvest are items (`kind: 'seed'`, and `'flower'` or `'crop'`), and the
  seed's description must say "Ready in N days" (a test holds it). Add the seed to `STARTER_BAG`
  only if every new game should have it, and then to a migration too.
- Its art is a row in `CROP_ART` (`src/sprites/garden.ts`): `LOW` or `TALL` leaves while growing,
  and a ripe picture made by `overlay`ing small parts (fruit, blooms) on those leaves. A `glow`
  palette makes it shine at night; a `rarePalette` shows a rare harvest in the bed.
- `?gallery` shows every crop at every stage. To see a garden in the town, the dev handles can
  plant one: `world.farm.till(bed)` and `world.farm.set(bed, { crop, plantedAt, waterings: 0,
lastWatered: null })` for each of `world.map.beds`.

**How the town is lit, for whoever adds something that glows:**

- A prop's `glow` in `PROP_ART` is a palette of just its lit keys in their lit colours, and its
  `lights` are pools of lamplight in its own pixels. Its day palette should show those keys unlit.
- The night is a light map multiplied over the frame (`src/render/lighting.ts`), then glows are
  drawn back over it through a layer that whatever is in front rubs out (`drawLight` in
  `TownView`). Nothing else in the renderer needs to know it is night.
- Review the light with `?hour=21.5` (any hour). In production it changes only the light; in a dev
  build it moves the town's clock too, which is how smoke finds the snack (decision 34).

**Her look, for whoever adds clothes next (phase 6 sells them, phase 9 gives them):**

- She is 16×32 (decision 32): head rows 0–10, shoulders at 11, hem at 19, waist at 20, legs 21–31.
  The row constants the cuts are measured against are at the top of the cut code in
  `src/sprites/doll.ts`.
- A new piece is a row in `OUTFITS` (`src/data/outfits.ts`) with a slot, a cut and its fabrics, at
  least one of them a blue; a print or pendant goes in `OUTFIT_ART` (`src/sprites/doll.ts`). A new
  _cut_ is a case in `cutRows`. `tests/sprites/doll.test.ts` draws every piece in every colour,
  facing and frame, so a broken grid fails there.
- Giving her a piece means adding its id to `town.wardrobe.owned` and saving. Nothing adds to it
  yet, so that method doesn't exist: add it with the shop.
- The layer order, and why gauges sit over the hair, is on `dollLayers`.
- Look at new art with `?gallery`, which shows every piece on her from the front and turning.
  Villagers and pets are drawn to her scale.

**Where saves live, and how to add to one:**

- `src/persistence/SaveState.ts` holds the shape and `SAVE_VERSION` (4). `main.ts` builds each
  save from `town.snapshot()`, `town.wardrobe.snapshot()`, `town.finds()` (the bag, and what
  was taken today) and `town.garden()` (the tilled beds and their plantings).
- **Adding a field:**
  1. Add it to `SaveState`.
  2. Bump `SAVE_VERSION`.
  3. Add the N→N+1 step to `migrations.ts`, with a comment on why its default is honest, and its
     data written out rather than imported (see the v1 → v2 step).
  4. Extend `isSaveState`. Check shapes only; repair unknown ids where the data is used, as
     `repairLook` does, rather than setting a whole town aside.
  5. Add a migration test.
- Smoke's `save`, `closet`, `salon`, `gather`, `bag`, `farm`, `settings` and `night` sections
  cover the round trips. Smoke gets
  through the creator in `boot`, because a fresh browser has no save.

## Starting cold

1. Read `CLAUDE.md`, then the status line and your phase in `docs/v0_plan.md`, then
   `docs/decisions.md` (short, and it holds every fork already argued).
2. `git log --oneline -20` to see what actually landed.
3. Branch before the first commit. One PR per phase, merged with a merge commit as soon as it is
   green.
4. Before pushing: `npm run lint && npm run format:check && npm run typecheck && npm run test &&
npm run build`, then `npm run dev` in one shell and `npm run smoke` in another.
5. As part of the phase's own PR: update the plan's status line, append any real forks to
   `decisions.md`, and correct this file.
6. When the phase is done, ask the user for new personal touches before starting the next one,
   with 2–3 prompts tied to what comes next (see CLAUDE.md, Workflow). Ask them in plain chat:
   the multiple-choice tool loses typed answers on mobile. **Also write the exact, numbered
   questions under "Still to put to the user" below, and push them**: the answers often arrive
   in the next session, which can't see this one's chat.
7. If a phase touches something the MMO already solved (saves, the HUD overlay, the harness,
   smoke's hand crank, sound), attach `tinyfrancer/untitled-boomer-mmo` read-only and adapt it. The
   plan's "Borrowed from" table says where each thing lives.

## Environment notes that will otherwise waste time

- **npm's resolver crashed** (`Cannot read properties of null (reading 'edgesOut')`) on a fresh
  install from `package.json` alone. The lockfile was seeded from the MMO's and pruned by
  `npm install`. `npm ci` from the committed lockfile is fine. If a dependency change hits it
  again, keep the lockfile and add the package with `npm install <pkg>`, rather than deleting the
  lockfile.
- **Smoke in a Claude Code cloud container:** the preinstalled Chromium doesn't match the pinned
  Playwright, so run `CHROMIUM_PATH=/opt/pw-browsers/chromium npm run smoke`. Never run
  `playwright install` there. CI installs its own and needs no variable.
- **`tests/setup.ts` installs an in-memory `Storage`.** Keep it: Node 25's own `localStorage`
  global breaks jsdom's.
- **Node types are opt-in per test file** (`/// <reference types="node" />`), so `src/` can't
  quietly use a Node API that doesn't exist in the browser.

## Still to put to the user

<!-- The numbered questions last asked of the user go here, word for word, until answered. -->

- Optional, fleshed out over time: more of her likes and more inside jokes.

## Settled since

- **v0 is a surprise** (decision 14): don't put questions to her, and don't let anything reach her
  before the handover.
- **The personal touches are answered** in `docs/personal_touches.md`, and decisions 15–20 say
  how they're used. Read it before any phase that adds content: it names what lands where.
- **Vercel is connected:** merges to `main` deploy, and PRs get preview URLs.
- **Phase 3's forks** are decisions 27–31: painted clothes, the creator for old saves, colours as
  part of what's worn, a creator that opens on her, and gauges and tattoos in the closet.
- **Phase 4's forks** are decisions 32–36: her at 16×32 (the user's call), a bag with no limit,
  lighting as a light map, gathering that comes back whole at 5am, and one snack a night.
- **Phase 5's forks** are decisions 37–40: beds tended from beside them, growth counted in
  mornings with watered days counting twice, every harvest giving its seed back, and a blue rose
  decided when it's planted.
