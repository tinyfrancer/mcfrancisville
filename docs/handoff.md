# Handoff: picking up version 0 cold

Written 2026-09-26, updated at the end of phase 7 for a fresh session. Keep it current as phases
land, and delete it when v0 ships.

## In progress

**Phase 8, crafting**, on `claude/handoff-document-continuation-usez8t` (branched from `main` after
PR #13), with a draft PR against `main`. The design, so a session that is cut off can carry on:

- **The workbench** is a piece of furniture (`workbench`, floor, 2×1, mirrors), hers from the
  first day at (4, 3) in her room and never sold. Walking up to it (`arrived` with
  `piece: 'workbench'`) opens the craft sheet.
- **Recipes** are rows in `src/data/recipes.ts`, keyed by `RecipeId`: what it `needs` (items and
  counts from the bag) and what it `makes` (`{ furniture }` into the chest, `{ item }` into the
  bag, or `{ room: n }`, the house growing to size n). Some are known from the start; the rest are
  recipe cards, a ware `{ recipe }` on Cobweb Corner's shelf, bought once and kept. Phase 9's
  villagers teach more through `town.learn(id)`. `src/systems/crafting.ts` says why a recipe can't
  be made; `Town.craft(id)` makes it at once.
- **Beads** (hearts, LOVE letters, smileys, a tiger-orange football, a scarlet-and-grey football, a
  bat and a ghost) turn up as a bonus when she chips a rock or shakes a tree (a `bonus` on the
  `Yield`, seeded by the day), and in a bead bin at Cobweb Corner. **Bracelets** are items made
  from beads, for gifts in phase 9.
- **A bigger house:** `home.size` 0, 1 or 2; the room grows wider and deeper (13×11 floor, then
  17×13, then 21×15) with the door mat always bottom-centre. Two extension recipes, lots of wood
  and stone. Growing never makes a placed piece fit less well.
- **Crafted furniture** is sold nowhere: a stool, a jack-o'-lantern, a vase of roses, pressed
  flowers, a stone hearth, a moonflower lamp, a candy-corn wreath, a hosta planter, a little
  gargoyle, a blue rose under glass and a ghost-pepper garland.
- **Save v7** adds `recipes` (known) and `home.size`, and puts the workbench in an older house
  (into the chest if its spot is taken).

**Done:** the growing room (`roomOf` in `src/data/home.ts`, `Home.grow`); the rows and art
(`src/sprites/crafted.ts` for the furniture, beads and bracelets in `src/sprites/items.ts`);
`src/data/recipes.ts` and `src/systems/crafting.ts`; `Town.craft`, `learn`, `knows`, `recipes`
and `cantMake`; recipe cards and beads on Cobweb Corner's "Crafting" shelf; beads as a `bonus`
from rocks and trees (a `foundBead` event); save v7 with its migration and tests. The shop sheet
shows recipe cards, and toasts are written for `made` and `foundBead`.

**Next, in order:** the craft sheet (`src/hud/CraftSheet.ts`, opened by `main.ts` when she
arrives at the `workbench` piece, reaching the town through a `CraftApi`); a smoke section that
walks to the workbench and makes a stool; docs and decisions 51 onward; CI green; merge.

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
(the gear) holds the backup code. Everything is saved as she goes.

Since phase 6 she has Candy (🍬, top left; 100 to start). Walking up to the teal shop opens
**Cobweb Corner**: shelves of seeds, fancy shoes, clothes, squishies, records and a pizza, dealt
fresh at 5am, and a Sell tab that buys anything in her bag but her purse butter. On about four days
in seven, **Spirit Halloweenie**, the parody pop-up, stands on one of six lots around town ("NOW
OPEN!") selling costumes and fancy shoes.

Since phase 7 she has **a home**. Walking up to her plum house (a bat on its door) goes in, onto
the door mat; walking onto the mat goes back out. It's furnished from the first day: a bat-wing
bed, a pumpkin armchair on a moon rug, Duckworth & Duckworth (the two-headed duck) under their
dome, pictures on the wall and the mystery corkboard, with her succulents in the storage chest.
Indoors, the 🛋️ button starts decorating: a tap picks a piece up, the next puts it down, and the
bar turns it or puts it away, opens the storage chest, or changes the walls and floor. Cobweb
Corner sells furniture, wallpaper and flooring, and the pop-up spooky decor. Walking up to the
marble run, the duck and a few others gets a line from them, and the record player puts on her
records. **Next is phase 8**: crafting (`docs/v0_plan.md`).

**Branches and PRs.** Phases 0–7, each one PR, are merged into `main` with merge commits. The user wants each phase's PR merged as soon as its CI is green, so the next phase
branches from `main`.

**Starting phase 8 in a new session:**

1. Attach `tinyfrancer/mcfrancisville`.
2. Branch from `main`, open the phase's PR against `main` as a draft at the first push, and merge
   it (merge commit) once CI is green.
3. Read "Crafting" in `docs/personal_touches.md` first: phase 8's touches are answered. In short:
   bracelet beads of hearts and LOVE, smiley faces and a little football in her teams' colours,
   and she'd love to build a bigger house.
4. The workbench can be a piece of furniture (a row in `FURNITURE`, which `Town` arrives at with
   `piece`, as the record player does), and what it makes can be furniture straight into the
   storage chest with `town.home.store(id)`. Wood and stone are already in her bag from gathering.

**How her home works, for whoever adds a piece or something to do at home:**

- A piece is a row in `FURNITURE` (`src/data/furniture.ts`): its `layer` (`floor`, `rug` or
  `wall`), `size` in tiles, `turns` (none, `mirror` or `four`), `price`, and an optional `says`
  for when she walks up to it. Its grid is a row in `FURNITURE_ART` (`src/sprites/furniture.ts`),
  as wide as its footprint; a floor piece may stand taller, a rug or wall piece is exactly its
  footprint (`tests/sprites/furniture.test.ts` holds this). A `four` piece needs a `side` and
  `back`. A `glow` and `lights` light it after dark, as a prop's do.
- To sell it, put it in a pool in `src/data/shop.ts`; a test says every piece is sold somewhere
  but the corkboard.
- What fits where is `refusal` in `src/systems/decor.ts`. `Home` keeps the pieces and the chest;
  `Town` has the scene, going in and out, and decorating (`startDecorating`, `tapTile` while
  decorating, `turnSelected`, `putAwaySelected`, `takeOut`), and emits `scene`, `decorating` and
  `home` on its `EventBus` for the HUD.
- To look at the room in a dev build: `world.tapTile(4, 4)` walks her in.

**How the shops work, for whoever adds a ware or a shop:**

- A shop is a row in `SHOPS` (`src/data/shop.ts`): its name, greeting and shelves. A shelf deals
  so many wares a day from its pool; `stockOf(shop, dayKey)` (`src/systems/shop.ts`) is a seeded
  shuffle, so stock is never saved (decision 42). A shelf that must always show something (fancy
  shoes, the pizza) says so in its row, and a test holds it.
- Prices: an item costs twice its `ITEM_VALUE`, which is also what Cobweb Corner pays for it
  (decision 45); a piece of clothing has its own price in the same file. A new item needs a value,
  or the `Record` won't compile.
- Candy lives on `Town` (`town.candy`, `town.buy`, `town.sell`) and is announced on
  `town.events` as `'candy'`; the HUD's pill and the sheet follow that. Clothes bought go through
  `town.wardrobe.give(id)`, which is how phase 9's gifts can give clothes too.
- The pop-up stands on one of the map's `popUpLots` (`src/data/maps.ts`) on days that hash to it
  (`popUpLot`, decision 44), and `town.popUp()` says where. `?gallery` shows it lit and unlit.

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

**Her look, for whoever adds clothes next (the shops sell them, phase 9 gives them):**

- She is 16×32 (decision 32): head rows 0–10, shoulders at 11, hem at 19, waist at 20, legs 21–31.
  The row constants the cuts are measured against are at the top of the cut code in
  `src/sprites/doll.ts`.
- A new piece is a row in `OUTFITS` (`src/data/outfits.ts`) with a slot, a cut and its fabrics, at
  least one of them a blue; a print or pendant goes in `OUTFIT_ART` (`src/sprites/doll.ts`). A new
  _cut_ is a case in `cutRows`. `tests/sprites/doll.test.ts` draws every piece in every colour,
  facing and frame, so a broken grid fails there.
- Giving her a piece is `town.wardrobe.give(id)`, which the shops use; it returns false if she
  already owns it.
- The layer order, and why gauges sit over the hair, is on `dollLayers`.
- Look at new art with `?gallery`, which shows every piece on her from the front and turning.
  Villagers and pets are drawn to her scale.

**Where saves live, and how to add to one:**

- `src/persistence/SaveState.ts` holds the shape and `SAVE_VERSION` (6). `main.ts` builds each
  save from `town.snapshot()`, `town.wardrobe.snapshot()`, `town.finds()` (the bag, and what
  was taken today), `town.garden()` (the tilled beds and their plantings), `town.wallet()`
  (her Candy) and `town.homeSnapshot()` (her home).
- **Adding a field:**
  1. Add it to `SaveState`.
  2. Bump `SAVE_VERSION`.
  3. Add the N→N+1 step to `migrations.ts`, with a comment on why its default is honest, and its
     data written out rather than imported (see the v1 → v2 step).
  4. Extend `isSaveState`. Check shapes only; repair unknown ids where the data is used, as
     `repairLook` does, rather than setting a whole town aside.
  5. Add a migration test.
- Smoke's `save`, `closet`, `salon`, `gather`, `bag`, `farm`, `shop`, `home`, `settings` and
  `night` sections cover the round trips. The `shop` section visits the pop-up only on days it's in
  town, and says so when it skips it. Smoke gets
  through the creator in `boot`, because a fresh browser has no save.

## Starting cold

1. Check "In progress" at the top of this file and `git status`: if either shows unfinished
   work, resume that first. Then read `CLAUDE.md`, the status line and your phase in `docs/v0_plan.md`, then
   `docs/decisions.md` (short, and it holds every fork already argued).
2. `git log --oneline -20` to see what actually landed.
3. Branch before the first commit. One PR per phase, opened as a draft at the first push and
   merged with a merge commit as soon as it is green. Commit, push and update "In progress" after
   every meaningful step: the session can be cut off at any moment.
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
- **Phase 6's forks** are decisions 41–45: Candy as a number in the save, stock dealt from pools
  by the day key that never sells out, furniture waiting for the house, the pop-up on about four
  days in seven, and fixed prices with clothes that stay hers.
- **Phase 7's forks** are decisions 46–50: her home as a second scene she walks about in, three
  layers of furniture that can never shut anything off, tap to pick up and put down with pieces
  that mirror, furniture bought into the chest with walls and floors owned like clothes, and a
  house furnished from the first day.
