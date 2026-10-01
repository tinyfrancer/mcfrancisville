# CLAUDE.md

This file gives guidance to Claude Code (claude.ai/code) when working in this repository.

## Project

**McFrancisVille** is a cozy, spooky-cute pixel-art life sim for the phone, made as a gift for the
user's wife. It is Animal Crossing and Stardew Valley by way of The Nightmare Before Christmas: dress
up, decorate a house, farm, befriend monster neighbours, and collect critters, pets, furniture and
clothes. **Cozy and relaxing is the brief**: nothing punishes, expires or is lost (decision 11).

It is a static site (TypeScript + Vite, Canvas 2D, no backend), deployed by Vercel from `main` and
installed on her iPhone as a home-screen app. Saves live in `localStorage`.

**The live plan is `docs/v0.2_plan.md`** (0.1's and 0's are complete; 0.2 went to her phone on
2026-09-30 and the rest of the plan ships as 0.2.x releases, decision 158). Its status line says
which session landed and which is next; its sessions each fit one context window.
**A session starting cold reads `docs/handoff.md` first.** Forks that closed off a real alternative
go in **`docs/decisions.md`**: appended, numbered, never edited. Read it before re-opening a
settled question. `docs/personal_touches.md` holds the real-life details only the user can supply.

## Commands

```bash
npm run dev          # Vite dev server (http://localhost:5173); add `-- --host` to try it on a phone over LAN
npm run build        # production build to dist/ (no typecheck; that is its own step)
npm run preview      # serve the production build (the only way to exercise the service worker)
npm run test         # Vitest, once
npm run coverage     # the same with coverage reported (never gated)
npm run typecheck    # tsc over src/tests and, separately, scripts/
npm run lint         # ESLint
npm run format       # Prettier --write
npm run format:check # what CI runs
npm run icons        # regenerate public/icons/ from the pixel grid in scripts/make-icons.mjs
npm run sprite       # render sprites to PNGs in .sprites/ (`-- 'prop:*' --zoom=6`, `--list`, `--sheet`)
npm run smoke        # Playwright check on an iPhone-sized touch viewport; needs `npm run dev` running
```

In a Claude Code cloud container, smoke needs `CHROMIUM_PATH=/opt/pw-browsers/chromium`. Never run
`playwright install` there.

CI (`.github/workflows/ci.yml`) runs lint, format, typecheck, coverage, build and browser smoke in one
job on Node 22, and typecheck, tests and build on Node 25, on every push to a PR, draft or ready
(decision 139; the repo is public, so its minutes aren't metered). The
container is where a change is tested first: run every one of those, smoke included, before each
push. Don't commit on a red suite.

## Workflow

Work happens on a branch and merges through a PR with a merge commit (not a squash), even for a doc
fix. Each phase of the plan is one PR. Keep commits separable when a change has independent parts.
Merging to `main` deploys to her phone, so a merge publishes.

**`v0.2-dev` is the integration branch for 0.2 (decision 132).** Each session branches from it,
its PR targets it, and it is merged with a merge commit as soon as it is green. `main` (her phone)
gets a release only when the user says so, as one PR from `v0.2-dev`, because Vercel deployments
are limited. Each 0.2.x release adds its own `NOTES` row in `src/data/patchNotes.ts`. Vercel previews stay off for every `claude/**` branch and the dev branches, by
`git.deploymentEnabled` in `vercel.json` (the user's call), so pushes cost no deployments; only
`main` deploys. They stay off until the user asks for them back (remove those lines).

**Checkpoint as you go: a session can end at any moment.** Usage limits cut sessions off without
warning, a resumed session starts with no memory of the earlier one, and the container (with any
uncommitted work) can be reclaimed. Nobody can see the limit coming, so don't try to predict it;
make being cut off cheap instead:

- Commit and **push** after every meaningful step (a system and its tests, a sheet, the art for a
  feature), at least every half hour of work. Uncommitted work in the container is not saved.
- With each push, update the **"In progress"** section at the top of `docs/handoff.md`: the
  branch, what is done, what is half done and exactly where, the next steps in order, and any
  question put to the user and not yet answered. Write it for a session that knows nothing else.
- Open the phase's PR as a **draft** at the first push, so the work is visible on GitHub, and mark
  it ready when the phase is done. CI runs on the draft too, so a red check there is work now.
- A session that starts and finds "In progress" filled in, or uncommitted changes, resumes that
  work before anything else, and says so to the user.
- When the phase merges, empty "In progress".

**Personal touches are parked (decision 177, 2026-10-01).** The user wants a working game for her
first and the easter eggs after. Sessions don't ask for personal touches between phases and add no
new questions; where a touch would go, they pick the warmest sensible default and say so in the
decision. The questions already asked stay in `docs/handoff.md` under "Still to put to the user",
kept, not cleared, until the user takes them up again, and answers that arrive are recorded in
`docs/personal_touches.md` as before. v0 is a surprise (decision 14), so the user answers, never
her.

**Write the questions down too.** When touches are asked again, copy the exact prompts into
`docs/handoff.md` under "Still to put to the user", numbered, and push them. The user often answers
in a later session, and a new session can't see an earlier one's chat, only the repo. A session
that receives numbered answers reads the numbered questions there first, and clears them once the
answers are recorded.

Ask open-ended questions like these **in plain chat**, not through the multiple-choice question
tool. On Claude Code mobile that tool can't take a picked option and typed text together, and its
last question can't be revisited, so typed answers get lost.

## Architecture (the target shape; phases fill it in)

`docs/architecture.md` is the full map: the layers and what may import what, the services and
what each owns, and where it hurts. Update it when a seam moves.

- **Nothing but `src/render/` knows it is drawing.** `world/`, `systems/`, `data/`, `persistence/`,
  `hud/` and `types/` are plain TypeScript, testable with no canvas. The simulation steps in
  `update(deltaMs, now)`. The renderer reads it once a frame. New rules go in the world or a
  system, never in drawing code (decision 9).
- **Two channels out of the world:** an `EventBus` of state the HUD re-renders from, and the list
  of moments `update()` returns (a catch, a harvest, a heart) for the view and the sound.
- **Time is the real clock, injected** (decision 4). Every rule takes `now` from a `Clock`, and
  tests fake it. Anything that happens over time is derived from a stored timestamp and the 5am
  day key when it is read, never ticked while the game is closed.
- **Sprites are pixel grids in TypeScript**, recoloured by palette swap and baked to cached canvases
  (decision 2). No image files, except the generated icons.
- **Pixels are whole device pixels.** `src/render/pixelScale.ts` fits the canvas at an integer scale
  of _device_ pixels, nearest 16 tiles across. Don't set a CSS size that isn't `fitPixelScale`'s.
  The canvas fills the room between the HUD's bars (`placeBetweenBars`, from a whole device pixel),
  never the whole screen (decisions 135, 147).
- **Tiles are 32 pixels, and everything in the world is drawn at 32** (decisions 79, 108). Art is
  placed in world pixels. Item icons and the pets' bubbles are 16-pixel grids on purpose
  (decision 105): the HUD bakes them at 1×, and the world through `bakeIcon` (`src/render/items.ts`)
  at 2×. The bridge that baked version 0's art at 2× (`legacy.ts`) was removed in phase L.
- **Data-driven content.** Items, outfits, furniture, crops, critters, villagers, recipes and pets
  are rows in `src/data/`, keyed by id unions in `src/types/ids.ts`. Prefer a row over code.
- **Saves are versioned from the first day** (`src/persistence/`). Import the `saveService`
  singleton, never the class. When `SaveState` changes shape, bump `SAVE_VERSION`, add a step to
  `migrations.ts` with a test, and extend `isSaveState`. A save that can't be read is moved aside
  under `mcfrancisville:save:unreadable:*`, never deleted (decision 25). The backup code runs the
  same migrations, so an old code still restores.
- **The HUD is an HTML overlay** with `pointer-events: none` and furniture opting back in, framed
  (0.2's U1, decision 147): a bar along the top (her Candy, the day, the month's little touch from
  `src/data/trims.ts`, Settings) and one along the bottom, one row high (the quick bar outdoors,
  with the bag and a ☰ tray for the rest, `data-compact`; or the decorating bar, or the menu
  indoors), with the world in `hud.viewport` between them. On a phone on its side both bars sit
  side by side in one thin strip along the bottom, so the world keeps the whole width, and a
  sheet is two columns the whole height, its head and foot on the left and its body on the right
  (a landscape media query in `src/hud/styles.ts`, decisions 159, 160, 178). Its
  controls are at least 44px, and they are kept clear of the notch and home bar with
  `env(safe-area-inset-*)`. Each sheet reaches the game through an Api built in `src/wiring/apis.ts`, and
  every moment's cue, sheet and toast is played in `src/wiring/moments.ts` (decision 106); a toast
  stays as long as it takes to read and goes at a tap (`src/hud/ToastLine.ts`, decision 140). Every
  sheet is built by `openSheet` (`src/hud/dom.ts`: a head with a `picture` beside the title and
  its `tabs`, a scrolling body with a `panel` per tab, a foot with Done last; 0.2's U2, decision
  179), and every list of her things by `collection()` (`src/hud/collection.ts`: filters, order,
  search, "new" marks), with icons sized by `fitIcon` to a whole scale (decision 109). A thing tapped in her bag is told
  by `itemCard` (`src/hud/itemCard.ts`) in the sheet's foot, in the bag and at the shop's Sell tab
  alike (decision 146).

## Where things are

- **Art:** `src/sprites/`, drawn to `docs/art_style.md` (read it before drawing anything). Props
  are grids keyed by `PropId`. The ground is `src/sprites/terrain.ts`: grass under everything, and
  each other `TileId` a piece drawn from which of its neighbours carry it on (decision 93); trees,
  the willow, the rose bush, rocks and flowers are `src/sprites/nature.ts` (leaves painted by `paintCrown`; a prop can
  take `forms` as well as `variants`), the fountain `src/sprites/park.ts`. Buildings are built
  from the kit in `src/sprites/buildings.ts` (walls, roofs, windows, doors, awnings, signs, all in
  shared keys, decision 95): her house, Skelly and her pots in `houses.ts`, the shops, the pop-up
  and the cart in `shops.ts`, the neighbours' houses in `neighbourHouses.ts`. Water smooths a
  diagonal staircase of tiles into a slope (`slopes` in `terrain.ts`). A new prop is a grid, a palette, a `PROP_FOOTPRINT`
  row and a map legend character. Big art is drawn with `Sketch` (`src/sprites/sketch.ts`: shapes,
  lit spheres, bevels, outlines from a mask) and `ramp` in `palette.ts`. Every sprite is a row in
  `src/sprites/catalogue.ts` (decision 87), which `?gallery` shows, in production too (decision
  21), and `npm run sprite` renders. The scale sheet (`src/sprites/scaleSheet.ts`) is first in both.
  `npm run sprite -- 'place:*'` draws each place outdoors whole (`src/render/overview.ts`), to
  judge a layout.
- **The town:** `src/data/maps.ts`, a picture in characters, 40×50 since phase F (decision 94). A
  multi-tile prop is a block of its letter the size of its footprint. Where neighbours stand is
  named, not numbered: `TOWN_SPOTS` (and `SPOTS` for every place), which a schedule names with
  `at` (decision 93). `tests/data/maps.test.ts` holds the edge solid but for its ways out, the
  spawn at her door, and nothing walkable out of reach. Smoke finds a building by its prop id
  (`tapProp`), never by a tile number.
- **Places and travel:** every place is a row in `src/data/zones.ts` (decision 90): its map (with
  `exits`, runs of edge tiles into the place beyond, and `doors`), the `unlock` rule that opens it
  (decision 91), and its spot on the world map. Beyond the town (phase I, decisions 102–104):
  Whisperwood (old trees, toadstools, the frozen creek, which she walks only on her skates:
  `MapZone.slippery`, `src/systems/ice.ts`, decision 140), Lantern Shore (the lake, its pier and
  floating lanterns), the castle hill (Castle Mac-A-Boo, behind a `gate` at the lookout that opens
  with the castle key) and the hidden clearing (a `secret` zone, not on the map until found), all
  in `maps.ts`, their props in `src/sprites/wilds.ts` and `castle.ts`. What's buried is
  `src/data/buried.ts`, dug up by `world.digging` (the `Dug` keeper, save v18). `src/world/zones/` has `MapZone` (a place outdoors), `HomeZone` and the `Zones`
  registry; `world.travel` is where she is, every crossing, and `go` by the map; `world.atlas`
  keeps the places found and opened (save v14). `tests/data/zones.test.ts` holds every way out
  joined both ways and everything reachable, and every way out paved to the edge with a
  signpost naming it (0.2's C1, decision 148): `signs` in a map, the word and line in
  `src/data/signposts.ts`, the board drawn by `signpostTo` and picked by `lookOf`
  (`src/sprites/props.ts`). The world map is `src/hud/MapSheet.ts` (🗺️, `MapApi`), whose first tab
  lays the ways out of where she is round it as a compass (`world.travel.waysOut()`, 0.2's U4),
  a tap on a known one flying her; smoke's `edges` walks every one.
  The Hollow Fairground (0.2's M1, decision 200) is through a `gate` at the town's south-east,
  open once she has a heart with Boothoven: `FAIRGROUND` in `maps.ts` (its own `FAIR_LEGEND`,
  `FAIRGROUND_SPOTS` at the stage and each stall), art in `src/sprites/fairground.ts` (the stage,
  four stalls, the big wheel, the fortune tent, light poles whose strings meet three tiles apart),
  and the fortune tent a room (`INTERIORS.fortuneTent`, Agatha's on weekend afternoons).
  Her broom (0.2's P1, decision 149) swoops her home from anywhere outside and back again:
  `world.travel.home()` and `back()` keep the spot she flew from (save v26, `left`), and the
  map's `go` flies too, each with a `flew` moment. `world.broom` (`Broom`) posts Agatha's letter
  on her second day in town, sets its stand (a cauldron, `broomStand`) out by her mat, and keeps
  its colours; rows in `src/data/broom.ts`, art in `src/sprites/broom.ts`, the slot first on the
  quick bar and the sheet at the stand `src/hud/BroomSheet.ts` (`BroomApi`).
- **Her look:** `src/sprites/doll.ts` draws the paper doll in layers, painting most clothes onto a
  body drawn in region keys (decision 27). The pieces are rows in `src/data/outfits.ts` (a new one
  is a row with a description, plus a print in `OUTFIT_ART` if it has one; `fixed` if it comes in
  one colour only, decision 141); the rules for wearing them are
  `src/systems/wardrobe.ts`; `src/world/Wardrobe.ts` holds what she wears and owns, and tops an
  older save up with any first-day piece (`STARTER_WARDROBE`) it lacks, marked new (decision
  155). Gloves are a slot of their own, and overalls (`BIBS`) go on over the top. A jacket, coat,
  cape or wings is `outer`, drawn over the top, and tights are `tights`, under the bottom (0.2's
  W3, decision 161); a jacket's sleeves come up with her arms (`JACKETS`), a cape stays behind. The creator,
  closet and salon sheets are `src/hud/LookSheets.ts`, and reach the game only through `LookApi`;
  a piece's close-up is framed to the pixels it changes on her (`closeUpOf`, `src/sprites/closeUp.ts`).
  She is 32×48 (decision 79): a cut paints body regions (upper arm, elbow, forearm…), never rows,
  and each layer is lit and softly outlined by `finish` (decision 88). Hair's shine and strands
  (`groom`) and clothes' seams and folds (`tailor`) are worked out from the shape, and her
  tattoos are a grid per design laid along an arm from the hand up (`SLEEVES`, decision 152),
  all black and white, the stripes on whichever arm she picks (`stripesArm`, her right to start);
  her hair is `hairColour` on her right and `splitColour` (or none) on her left (decision 153).
  Her bracelets stack on her left wrist (`wrist` in her look, three at most, 0.2's W1, decision
  164), drawn by `wristRows` up her arm from the hand in their beads' colours
  (`src/sprites/bracelets.ts`); a worn one stays in her bag, which never gives it up
  (`Bag.keepWorn`, `spare`, `spares`), and a neighbour wears the last one she gave them
  (`Friendship.wears`). A tall hat (the witch hat)
  rises `HAT_ROOM` rows above her, and every layer is lifted with it (`raised`, decision 131), so
  place her by her feet or measure from `sprite.height - DOLL_HEIGHT`, never from the top. Her poses (her phone, arms
  crossed, rocking out) are `src/systems/poses.ts` and `world.poses`, thrilled by the `thrilled`
  signal (decision 89). Sitting (0.2's G1, decision 174) is a `seat` on a furniture row or a
  `PROP_SEATS` row (`src/data/seats.ts`): arriving sits her (`world.sitting`, not saved), the next
  tap stands her up, and the `sit` pose is her standing layers folded at the thighs (`seated`).
- **The world:** `src/world/World.ts` composes services (`src/world/services/`, one per feature,
  built from a shared `WorldContext`) over keepers (`Bag`, `Farm`, `Home`…) and zones
  (`src/world/zones/`), and steps in `update(deltaMs)`; rules read `ctx.clock`. Callers use the
  service (`world.shops.buy`), never a forwarding method; `docs/architecture.md` is the layout and
  decision 84 the why. The parts are made and wired in `src/world/build.ts` (`WorldParts`, which
  `World` extends with the tap, the walk and the step, decision 139), and a new service is a field
  and a line there. `World.save()` and `fromSave()` are the whole save.
  `src/render/OutdoorView.ts` draws a place outdoors and forwards taps to `tapTile`. A tap on something solid walks
  to the open tile beside it, and its arrival names the prop (`at`), which is how walking up to
  a building goes in. Arriving is also how she gathers: trees, rocks and flower patches (yields in
  `src/data/gathering.ts`, rules in `src/systems/gathering.ts`, `world.gathering`), and the night's
  snack.
- **Walking and the camera:** `src/world/Movement.ts` walks her along an A\* path pulled taut
  (`stringPull` in `src/systems/pathfinding.ts`); `FollowCamera` (`src/render/camera.ts`) eases
  after her by whole pixels. Smoke's `smooth` section fails on any pixel that shimmers (decision 85).
- **Light and depth:** `src/render/ground.ts` lays the ground once, with its clutter and shadows;
  `src/render/lighting.ts` is the time of day, multiplied over each frame. `?hour=21.5` shows
  another hour's light (decision 34).
- **Weather and life outdoors** (phase L, decisions 107–108): a day is clear, rainy or foggy by its
  key (`src/systems/weather.ts`, always clear on her special days), and `world.weather`
  (`Forecast`) says which. Rain waters every bed (`rainsOn` in `systems/farming.ts`); critters are
  weighted by the weather (`WEATHER_WEIGHT`), and a few come out only in theirs (`weather` on a
  critter row). `src/render/weather.ts` draws rain and fog and greys the light; `?weather=rain`
  shows it on any day. `src/render/life.ts` draws glints on the water, swaying grass tufts and
  chimney smoke (a building marks its chimneys with `smoke` on its art) over the baked ground,
  never re-baking it. Flat clutter (leaves, pebbles, lily pads, twigs) is baked into the ground by
  each place's rules in `src/data/clutter.ts`; standing clutter (bushes, stumps, logs, benches,
  signposts, barrels, a hay bale, the scarecrow) is props in the maps, art in
  `src/sprites/clutter.ts`. The well, lamps, fences, jack-o'-lanterns, gravestones and her mailbox
  are `src/sprites/townProps.ts`; a fence takes its shape from the fence beside it (`joins` from
  `parseMap`, `FENCE_JOINS`, 0.2's K1, decision 170). The porch geese (`goose`, hers and Barty's)
  dress for the month or the holiday (`data/geese.ts`, `gooseOn` in `systems/holidays.ts`, art
  `src/sprites/geese.ts`). About a third of rainy days are thunderstorms (`stormOn`, `lastFlash`
  in `systems/weather.ts`): `drawFlash` in `src/render/weather.ts`, and a `thunder` moment's
  rumble from `world.weather`.
- **The garden:** Hosta La Vista Farm, beside her house. Beds are `x` in the map (a `bed` tile,
  solid), crops are rows in `src/data/crops.ts`, the growing rules are `src/systems/farming.ts`,
  and `src/world/Farm.ts` holds which beds are tilled, what's in them and her sprinklers (save
  v22). Beds grow beyond the farm too (0.2's N1, decisions 165–166): `Farm` keys each by place
  and tile (a `Plot`, save v29), with plots by Whisperwood's creek and Lantern Shore's lake, where
  a crop's `thrives` makes it a day sooner (`Planting.quick`), and a crop planted in its own
  `season` a day sooner again, read from the day it went in (`plantedInSeason`, 0.2's N2,
  decision 176; `thrives` may name `home`, where basil likes a planter); the farm's extension rows are grass
  kept in the town map (`1`, `2`: `TileMap.plots`) until a `{ beds }` recipe builds them; and a
  `planter` piece at home is a bed wherever it stands, carried by the decorator's `moved` signal. What a visit to a bed does is one rule, `bedAction` in `src/systems/beds.ts` (phase P,
  decisions 118–120): the first tap looks (`world.garden.looking`, a card from
  `src/hud/BedCard.ts` through `BedApi`, placed each frame by `main.ts`) and the second, or the
  card's button, walks up and does it (`world.tendBed`, `world.garden.visit`); with a seed in hand
  the card offers the row. A sprinkler waters its bed and the eight round it from a stored day
  key (`growth` takes it as `sprinkled`); taken out, its days become waterings
  (`keepSprinkling`). The HUD's seed sheet (`src/hud/SeedSheet.ts`) calls `world.garden.plant`.
  Crop and sprinkler art is `src/sprites/garden.ts`, where a ripe crop is its leaves with the
  fruit stamped on; the farm is drawn by `src/render/garden.ts` (dry or watered soil, the
  sprinklers' spray, the ripe twinkle, the brackets round the bed looked at).
- **The shops:** Cobweb Corner and the Spirit Halloweenie pop-up are rows in `SHOPS`
  (`src/data/shop.ts`), with prices in `ITEM_VALUE`; the day's stock and the pop-up's lot are
  derived from the day key in `src/systems/shop.ts`. Cobweb Corner's boutique is dealt once a
  week (`everyWeek`, from `weekOf`), a whole look at a time (`sets` in a `Pick`, decision 161). `world.wallet` holds her Candy and
  `world.shops` does the buying and selling; `src/hud/ShopSheet.ts` reaches it only through `ShopApi`.
- **Inside the buildings** (phase H, decisions 98–100): every building's door (`doors` in
  `TOWN`) goes into a room that is a row in `src/data/interiors.ts` (`INTERIORS`: size, paper,
  floor, fixtures, furniture, keepsakes and the line she reads coming in), a zone of its own
  (`InteriorId`; `RoomZone` in `src/world/zones/`, drawn by `src/render/RoomView.ts`). The mat
  goes back out onto the building's door step (`doorStep`, from `PROP_FOOTPRINT`'s `door`).
  What stands there for good is a `FIXTURES` row with art at 32 in `src/sprites/interiors.ts`;
  one that `opens` a sheet (the shop counter, her salon chair, the museum's cases, which show
  what she has donated) does it through the `arrived` event in `main.ts`. Each neighbour's home
  has two keepsakes (`keepsake` hearts on a piece), hers to have one like by walking up once
  they're close (`world.interiors`, the `Keepsakes` keeper, save v17; art in
  `src/sprites/keepsakes.ts`). Walking up to Skelly or the farm sign is a toast from
  `arrivalToast` in `src/hud/messages.ts`. The pots by her door are `world.porch` (`Porch`, save
  v16): walking up to one puts the next plant in `src/data/porch.ts` round in both.
- **Her home:** `world.scene` is `home` there; walking up to her house goes in, the door mat
  goes out. The room's shape, the mat, the chest and the first day's furniture are
  `src/data/home.ts`; pieces, wallpapers and floorings are rows in `src/data/furniture.ts` (a new
  piece is a row, a drawing at 32 in `src/sprites/pieces.ts` or its family's file, and a place on
  a shop's shelf). Furniture is drawn in the building kit's materials with the helpers in
  `src/sprites/furnish.ts` (decision 105); walls, floors and the mat are `src/sprites/surfaces.ts`. What fits
  where is `src/systems/decor.ts`, `src/world/Home.ts` keeps the room and the storage chest, and
  decorating is `world.decorating` (`Decorator`). `src/render/HomeView.ts` draws it (shared drawing is
  `src/render/scene.ts`), and `src/hud/HomeSheets.ts` reaches it only through `HomeApi`.
- **Crafting:** her workbench is a piece of furniture (`workbench`), and arriving at it opens
  `src/hud/CraftSheet.ts`, which reaches the game only through `CraftApi`. Recipes are rows in
  `src/data/recipes.ts` (a new one is a row, plus a card price if it isn't known from the start);
  why one can't be made is `src/systems/crafting.ts`, and `world.workbench.craft` makes it. Made-only
  furniture art is `src/sprites/crafted.ts`. Her room's size comes from `roomOf` in
  `src/data/home.ts`, and an extension is a recipe that makes `{ room }`.
- **Cooking** (phase R, decision 122): a dish is a `RECIPES` row with `at: 'stove'` making an item
  of kind `dish`; a need can be `{ any: 'fish' | 'crop' | 'snack' }`, which `reckon`
  (`src/systems/crafting.ts`) fills from the plainest she has. What eating each does is
  `src/data/dishes.ts` (`effectOf`: pep, bites or a lure, a snack or treat is pep), how long and
  what a lure brings out `src/systems/cooking.ts`. `world.kitchen` (`Kitchen`) cooks, eats and says
  what a meal still does (`pace`, `eager`, `lure`, save v23); `Collecting` puts the lured critter
  out, `Fishing` reads `eager` at the cast, `Movement.step` takes the `pace`. Her stove is the
  `stove` piece (art in `crafted.ts`), and the bakery's oven `opens: { sheet: 'stove' }`; both open
  `openStove` in `src/hud/CraftSheet.ts`. Eating is the bag's Eat button (`BagApi.eat`). A new
  dish is an `ItemId` in `DishId`, an item row, a `DISHES` row, a recipe row, a value, an icon
  in `src/sprites/items.ts`, and someone who loves it.
- **Her neighbours:** rows in `src/data/villagers.ts` (a weekday and a weekend schedule of stops
  by the hour, with one in every window, at named spots in any place outdoors or `inside` a
  building at one of its `stands` in `src/data/interiors.ts`; lines by closeness, loves and
  likes, favours, and the three rewards). Where each is now is `src/systems/schedules.ts`
  (phase S, decision 123): the schedule, visits to each other and to her dealt from the day key,
  and her birthday party; `Neighbourhood` walks only those where she is (decision 92), through
  doors and mats, and they're drawn in every view by `neighbourDrawables` (`src/render/villagers.ts`).
  Their happenings (the book club, the midnight bake…) are rows in `src/data/happenings.ts`,
  worked out in `src/systems/happenings.ts`; the window's small event (news, or something lost
  to hand back) is `world.smallEvents` (`SmallEvents`, rows in `src/data/smallEvents.ts`, the
  errand she carries in save v24); anyone may let one go on a talk (`puffs` on a villager row,
  `puffsOnTalk`), and `fill` puts her name into a line, a capital where it starts a sentence
  (decision 124; `tests/data/dialogue.test.ts` reads every line with sample names). Each has at
  least eight lines a band and a line per window, said once a day each (`linesNow`, `lineFor`
  with what's `said`, 0.2's D1, decision 151); Cody's "babe" is held to about one line in four. What
  they bring up (0.2's D2, decision 175) is `SMALL_TALK` (`src/data/smallTalk.ts`: the weather,
  a happening of theirs later, her catch today, her pet, what she holds, her day by the window),
  chosen in `src/systems/dialogue.ts` from the `TalkScene` the world hands `lineFor`, before the
  band's line every other talk.
  Newcomers (phase T, decision 125) are villager rows with a `newcomer` field: one writes a month
  at most (`systems/newcomers.ts`, once what they wait on has happened), or, with `soon`, that many
  days after the game first knew of them (`heard`, save v32, 0.2's L1: Boothoven, the ghost
  composer east of the square, art in `src/sprites/boothoven.ts`), and moves in the next day
  onto their lot (`lots` in a place's map, drawn by `Lots` in `src/world/zones/`: a sign, then the
  house, art in `src/sprites/newcomerHouses.ts` and `newcomerPieces.ts`); `world.newcomers`
  (`Newcomers`, save v25) says who lives here, and only they are walked, drawn or dealt visits.
  A newcomer's welcome party is a happening `on: { welcome }`, the evening two days after their
  letter (`knowWelcomes` in `systems/happenings.ts`), and they lose nothing in town before they
  live here (`smallEventOf`'s `livesHere`).
  Special days are in `src/data/specialDays.ts` (21 September, their song day, plays its own tune in town; 25 September, Dolly Parton day, fills every place with monarchs, `monarchsOn`), the rules in `src/systems/friendship.ts`, friendships and mail in `src/world/Friends.ts`, and each
  villager's walk in `src/world/Neighbour.ts`. `world.neighbourhood` has `talk`, `give`,
  `favour`/`doFavour`, and `world.mailbox` the letters; tapping a villager walks up to them and arrives with `villager`. Their art is
  `src/sprites/villagers.ts`, built from the doll's parts with touches of their own on top
  (`Touch`: Rufus's ears and tail, Barty's bones, Wrapunzel's wraps, decision 154); the talk and mail sheets are
  `src/hud/TalkSheet.ts` and `src/hud/MailSheet.ts`. The top bar's 👥 is the neighbours sheet (0.2's U3, decision
  180, `src/hud/NeighboursSheet.ts` through `NeighboursApi`): a page each with hearts, birthday
  (`src/data/birthdays.ts`), loves, likes and gifts by band, where they are now
  (`world.neighbourhood.whereIs`), who she's met (`knows`) and Find, which walks to one where she
  is (`world.seek`) and never hops. The Moon Pie Man is a shop (`moonPie`) whose
  cart stands on one of the map's `peddlerSpots` on his days.
- **Critters:** rows in `src/data/critters.ts` (hours, habitat, the places it lives in `where`,
  rarity, `wary`, a `season` in months, `moon`), each also an item in her bag. Which are out, and
  where, is `src/systems/critters.ts`: habitats found from each place's map, and each place's
  critters dealt from the day key (decision 102). Rarity is four tiers, 12:5:2:1, with a
  legendary one waiting for its hours, weather or full moon, and `isAbout` is the one test of
  whether a critter could be out (0.2's F1, decision 150). `tests/systems/rarity.test.ts` holds
  a simulated year filling the Cabinet in about ten months: rerun it when a critter changes. `world.collecting` has `critters`, `critterAt`,
  `netSwing` and `donate`; tapping one walks up and swings (`caught`, `fled`). Fish are critters
  too, dealt into the water in slots of their own and drawn as shadows (phase Q, decision 121):
  tapping one walks her to the bank and casts her rod (`world.fishing`,
  `src/world/services/Fishing.ts`), the line's nibbles and bite are worked out from the cast in
  `src/systems/fishing.ts`, any tap reels in, and `src/render/fishing.ts` draws the line, float
  and "!". `src/world/Cabinet.ts` is the
  Curiosity Cabinet, `src/hud/CabinetSheet.ts` the book (📖) and Wrapunzel's museum at Crumbs &
  Curios (through `CabinetApi`), `src/data/museum.ts` her labels and letters; the museum's
  cases, three tiles wide, show each donated critter's 24-pixel art in a `nooks` box. Art is
  `src/sprites/critters.ts`, drawn by `src/render/critters.ts`. Shelves to finish (0.2's F2,
  decision 167) are rows in `src/data/milestones.ts`: a family caught, a season's own, a wing of
  the museum, every squishy or monster doll (kind `doll`, art `src/sprites/dolls.ts`) she has
  had; `world.milestones` works them out (`src/systems/milestones.ts`) and posts a `shelf:<id>`
  letter, the only record of one finished. Only what she has had is saved (`collected`, save
  v30). The framed critters and domes it sends are `src/sprites/milestones.ts`.
- **Her pets:** rows in `src/data/pets.ts` (the six pets and their accessories), with art in
  `src/sprites/pets.ts` drawn by `src/render/pets.ts`. `src/world/Pet.ts` is one pet following her
  or pottering at home, its habits read off the clock in `src/systems/pets.ts`, which also says
  where Fibi's bone is today; `src/world/Pets.ts` is what's saved. `world.petCare` has `walkWith`,
  `patPet`, `rename`, `dress` and `returnBone`; tapping a pet walks up to it and arrives with `pet`,
  which opens `src/hud/PetSheet.ts` (through `PetApi`). Ghost pets are see-through and glow.
- **The mayor's mystery:** clues, suspects and the mayor's letters are `src/data/mystery.ts`; where
  Wes lurks and when the second letter is due, `src/systems/mystery.ts`; the pinned clues,
  `src/world/Casebook.ts`. `world.mystery` has `wes()` and pins clues as she goes (a `clue`
  moment); walking up to her corkboard opens `src/hud/CorkboardSheet.ts` (through `MysteryApi`).
  Wes is drawn half behind his tree in `TownView`, from the doll's parts like the Moon Pie Man.
- **Sound:** `src/audio/`. Every sound is a `Tune` of note lines (`tune.ts`); the cues and the
  neighbours' voices are `cues.ts` (`cueOf` maps a moment to a cue), each record's tune is
  `records.ts`, and `SoundBoard.ts` plays them with Web Audio, starting on her first touch. The
  music (0.2's H1, decision 172) is a `THEMES` row per place in `music.ts` (a melody bar by bar,
  a chord a bar, a feel), arranged by `arrange` for the window; `musicFor(zone, window,
occasion)` names a `MusicKey` and `SoundBoard.setMusic` crossfades to it. The hall strums like
  "Wonderwall"; the festival's tune plays in town, and Christmas's jingle while the tree is up.
  The pond's fountain (0.2's H2, decision 173) plays after dark while she's on its bank
  (`world.fountain`, `systems/fountain.ts`): any theme on its music box (`musicBox`, the key
  `fountain@musicBox`), its lamps pulsing to `SoundBoard.musicBeat` and notes floating off it
  (`src/render/fountain.ts`, through the view's `fountainBeat`). Anything she walks up to that plays (0.2's G2, decision 190) is a `plays` on its furniture or fixture row: her `piano` (a card at Cobweb Corner), Boothoven's grand, the hall's and its music box play their tunes in turn (`TUNES` in `src/data/instruments.ts`, notes in `src/audio/pianos.ts`, `world.instruments`), a `tune` moment played on the record's bus. Boothoven teaches a tune a day at friend in his parlour (0.2's L2, decision 192: a 🎹 in his talk, `world.instruments.learn`, `learnt` on a `TUNES` row, the tunes kept in save v33) and plays their duet, "Forever Orbs", at the hall's piano on her anniversary once they're close (`anniversaryDuet`, a happening `on: { special }`). The switches are per phone (`settings.ts`), in Settings. Walk the Tomb gets her
  dancing (`world.recordPlayer.dance()`), with Cody.
- **The bag:** `src/world/Bag.ts`, with items as rows in `src/data/items.ts` and art in
  `src/sprites/items.ts`. The HUD follows it through `world.events` (an `EventBus`). What's new on
  the bag, closet, storage chest, Cabinet and workbench is `world.novelty` (`Novelty`, save v20),
  shown as a "new" in the collection and a dot on its button (decision 109).
- **The quick bar** (phase M, decision 110): `src/hud/QuickBar.ts` (through `QuickApi`), outdoors
  only: her hands, net, can, rod (`src/data/tools.ts`, art in `src/sprites/tools.ts`) and her seeds.
  A second tap on the rod she holds paints it (`src/hud/RodSheet.ts`, `data/rods.ts`); the colour
  is kept by the phone beside the save (`src/persistence/rod.ts`, decision 171) and handed to the
  drawing by `paintRod` (`render/scene.ts`).
  `world.hands` (`Hands`, save v20) keeps what she holds; a held seed is planted straight into an
  empty bed (`world.garden.sow`). `playerDrawable` in `src/render/scene.ts` draws it in her hand:
  the net and rod from `HELD_ART`, a seed as `HELD_PACKET`, with her fist drawn over the grip
  (decision 131).
- **The day's windows and the calendar** (phase N, decisions 111–113): morning from 5, afternoon
  from noon, evening from 6 (`windowOf`, `windowKey` in `src/systems/clock.ts`, the type in
  `src/data/windows.ts`). `Takings` keeps the window a thing was taken in, so gathering and the
  noticeboard's notes come back each window; the snack and Fibi's bone once a day (`onceADay`).
  Cobweb Corner's special is a shelf dealt `everyWindow` with an `off`. The calendar is rows in
  `src/data/calendar.ts` (her special days, the holidays, the town's events) with rules worked out
  from the day key in `src/systems/calendar.ts`; `world.calendar` (`Calendar`) is today, the month
  and what's coming up, and says so when a window turns (`window`). Market day puts out a shelf
  `on` it, a full moon brings out moths and orbs (`isMoonlit`) and a silver night, a lucky Friday
  beads. A festival (0.2's J1, decision 143) is a row whose `when` spans days, kept apart from
  the day's own rows (`festivalsOn`, `festivalOn` and its countdown to a `finale`); the Halloween
  Festival is all October, with a banner across the square (`drawBanner` in
  `src/render/holidays.ts`) and one of its notes first on the board. Its evenings are trick or
  treat (J2, decision 144): walking up to a neighbour's door knocks for a sweet
  (`world.trickOrTreat`, `src/data/trickOrTreat.ts`, `src/systems/trickOrTreat.ts`); the pop-up
  puts out a Halloween shelf of costumes (a shelf may be `on` a festival); the neighbours dress up
  a few more each week (`src/data/costumes.ts`, `src/systems/costumes.ts`, `COSTUMES` in
  `src/sprites/villagers.ts`); lights hang under every building's eaves, found from its roof keys
  (`eaveLights` in `src/sprites/holidays.ts`); and it has a tune of its own (`musicFor` in
  `src/audio/cues.ts`). Its middle weeks are J3's (decision 156): the pumpkin patch on her farm
  (`pumpkinPatch`, `i` in the map) grows by the festival's day (`src/systems/pumpkinPatch.ts`,
  rows in `src/data/pumpkinPatch.ts`, art in `src/sprites/pumpkinPatch.ts`) and gives a patch
  pumpkin a day once ripe (`world.pumpkinPatch`), carved into her cat-o'-lantern at the
  workbench; film night is a happening on the festival's Saturdays (`on: { festival, weekdays }`)
  with `seats`, `faces` and a `set` (the screen and popcorn table, which `Decorations` puts out;
  art in `src/sprites/filmNight.ts`, the film shown by `OutdoorView`); and the mayor's story
  comes a chapter a week (`CHAPTERS` in `src/data/story.ts`, `story:n` letters), the last dropped
  by Wes (`world.mystery`), pinning a clue. The 31st is J4's (decision 157, `src/data/finale.ts`,
  `world.finale`): the costume contest (a happening before the party, the town lined up at the
  stage, a 👑 in the talk sheet to crown one), the party's `set` (chili, jack-o'-lanterns, her
  cat-o'-lantern if she has one: a piece that's `hers`), Cody in the other half of her costume
  (`costumeOf`, `CODY_HALVES` in `src/sprites/villagers.ts`), their photo (a 📸 in his talk,
  cropped from the canvas by `src/render/photo.ts`, shown by `src/hud/PhotoCard.ts`) and his
  letter on 1 November with it framed (art in `src/sprites/finale.ts`). The day's chip under her
  Candy opens `src/hud/CalendarSheet.ts` (`CalendarApi`), its days marked in drawn 16-pixel marks
  (`src/sprites/calendarMarks.ts`), on tabs Today, Month and Coming up (0.2's U4, decision 181): a
  festival is one band across its days, and the birthdays of neighbours she has met are cakes
  (`birthdaysOn`, `CalendarApi.birthdays`). The
  noticeboard by the square (`noticeboard`, `N`) is `world.noticeboard`: three notes a window
  from `src/data/notices.ts`, dealt in `src/systems/notices.ts`, opened as
  `src/hud/NoticeSheet.ts` (`NoticeApi`).
- **Holidays in town** (phase U, decisions 126–127): each big holiday's decorations are a row in
  `DECOR` (`src/data/holidays.ts`), up for days either side of it by `decorOn`
  (`src/systems/holidays.ts`, from the day key); `world.holidays` (`Holidays`) says whose are up,
  what's in the sky (fireworks, snow: `SKIES`) and where Easter's eggs are (found into `Takings`).
  The square's piece and the pond frozen over in winter (`FROZEN`, walked on through
  `MapZone.isIce`) are `Decorations` (`src/world/zones/`); the door dressings,
  garlands, eggs and fireworks are drawn by `src/render/holidays.ts`, snow by `drawSnow` in
  `src/render/weather.ts`, and Skelly at Christmas (only), the pieces and the dressings are
  `src/sprites/holidays.ts`. A holiday's gathering is a `HAPPENINGS` row with `on: { holiday }`
  (`where: { party: true }` is everyone round the well); each neighbour's holiday line is
  `HOLIDAY_LINES` (`src/data/holidayLines.ts`, said first through `dayLine`), with a treat on
  Halloween (`HOLIDAY_TREATS`); the day's letters are `HOLIDAY_LETTERS`. Castle Mac-A-Boo's great
  hall (`castleHall`, art in `src/sprites/hall.ts`) opens with the heart key buried in Whisperwood.
- **The title screen** (decision 130): `src/hud/TitleScreen.ts` (`TitleApi`), every time she opens
  the game, its picture `src/render/title.ts`; the first time, his dedication to her follows it
  (`DEDICATION` in `src/data/greetings.ts`), and after that it's written on the title. The first
  time a phone opens a new version, the mayor's typed notes follow (decision 142): a `NOTES` row
  per version in `src/data/patchNotes.ts`, the newest being the version on her phone (a release
  adds or finishes its row), shown by `src/hud/NotesCard.ts` and again from Settings. Then the
  creator or Cody's welcome. A dev build's `?skiptitle` goes straight in.
- **Greetings, visits and passive Candy** (phase O, decisions 114–116): Cody's greeting as she
  opens the game is `greetingFor` in `src/systems/greetings.ts` (lines in `src/data/greetings.ts`:
  his welcomes by time away and window, a line per holiday, the red Tesla, the Pokémon reminder),
  shown by `hud.greet` (`GreetingCard` in `src/hud/TalkSheet.ts`; the car is
  `src/sprites/greetings.ts`). `world.visits` (`Visits`, save v21) counts a visit a day and gives
  its gift (`giftFor` in `src/systems/visits.ts`, rows in `src/data/visits.ts`): `welcome` from
  `main.ts`, `check` when a day turns while she plays. The candy tree (`J`, `world.candyTree`) fills
  a little each window, and the honesty stall (`E`, `world.stall`, `src/hud/StallSheet.ts` through
  `StallApi`) sells what she grows and makes a few a window; both are worked out from a stored time by
  `windowsBetween` (`src/systems/clock.ts`) in `src/systems/passive.ts`, numbers in
  `src/data/passive.ts`, art in `src/sprites/nature.ts` and `clutter.ts`. More Candy (0.2's E1,
  decision 168): the tree now and then drops a sapling (`dropsSapling`), planted in a ring of
  earth in her yard (`saplingPlot`, `V`) and a tree of its own three days later
  (`CandyTree.tend`, `stage`, save v31); a `stallShelf` recipe (`Made` `{ shelf }`) builds the
  stall a second shelf; Cobweb Corner pays double for its week's wanted list (`src/data/wanted.ts`,
  `wantedOn` and `paysOn` in `src/systems/shop.ts`); and once a day she bakes with Wrapunzel at
  Crumbs & Curios (`world.baking`, rows in `src/data/baking.ts`, a 🧁 in her talk). Everything a
  recipe makes is worth a quarter more than its inputs, held by the economy test.
- **Dev handles:** under `npm run dev`, `window.world` (the `World`), `window.view` (a
  `DebugView`) and `window.sound` (the `SoundBoard`). `?loop=manual` stops the loop so smoke can crank `view.step(ms, frames)`, which
  runs through the same fixed 120Hz step (`src/loop.ts`) as the loop. `?day=2026-12-24` opens a dev build on
  another day (at `?hour=`, or noon), to see a holiday.

## Verifying a change

Game rules belong in vitest (`tests/world/`, `tests/systems/`) with a fake clock. The layers'
imports are held by `tests/architecture.test.ts`, and the economy's shape (what gathering pays
against prices, no loop that makes Candy) by `tests/data/economy.test.ts` (decision 128). Smoke
(`scripts/smoke.mjs`) covers only what needs a real browser: booting, real touch, layout at phone
size, and the save surviving a reload. For anything visual, look at `.smoke/*.png` and the
sprites (`npm run sprite`); with previews off, the real iPhone sees it once it reaches `main`.

## Conventions

- Prettier is the source of truth (single quotes, semicolons, trailing commas, 100 columns). Run
  `npm run format` rather than hand-wrapping.
- `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` and `erasableSyntaxOnly` are
  on, so no `enum`s and no parameter properties.
- Comments are sparing and explain a non-obvious _why_, never narrate what the code does.
- Tone in anything she reads (dialogue, item names, UI copy) is warm, gently silly and spooky-cute,
  never scary or snarky.
