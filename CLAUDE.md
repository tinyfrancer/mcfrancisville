# CLAUDE.md

This file gives guidance to Claude Code (claude.ai/code) when working in this repository.

## Project

**McFrancisVille** is a cozy, spooky-cute pixel-art life sim for the phone, made as a gift for the
user's wife. It is Animal Crossing and Stardew Valley by way of The Nightmare Before Christmas: dress
up, decorate a house, farm, befriend monster neighbours, and collect critters, pets, furniture and
clothes. **Cozy and relaxing is the brief**: nothing punishes, expires or is lost (decision 11).

It is a static site (TypeScript + Vite, Canvas 2D, no backend), deployed by Vercel from `main` and
installed on her iPhone as a home-screen app. Saves live in `localStorage`.

**The live plan is `docs/v0.1_plan.md`** (version 0's, `docs/v0_plan.md`, is complete). Its status
line says which phase landed and which is next.
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
job on Node 22, on a PR **only once it is marked ready**, never on a draft (Actions minutes are
metered, decision 117); Node 25's gates run on a push to `main` or by hand. So the container is
where a change is tested: run every one of those, smoke included, before each push. Don't commit on
a red suite.

## Workflow

Work happens on a branch and merges through a PR with a merge commit (not a squash), even for a doc
fix. Each phase of the plan is one PR. Keep commits separable when a change has independent parts.
Merging to `main` deploys to her phone, so a merge publishes.

**`v0.1-dev` stands in for `main` while merging to `main` is on hold (2026-09-28).** The Vercel
project hit its deployment limit, so `main` (her phone) is left alone until the user says it has
reset. Until then, `v0.1-dev` is the integration branch: each phase branches from it, its PR
targets it (not `main`), and it is merged into it with a merge commit as soon as it is green, just
as phases were merged to `main`. Vercel previews are off for `v0.1-dev` and every `claude/**` branch
(`git.deploymentEnabled` in `vercel.json`, the user's call), so pushes cost no deployments; only
`main` deploys. When the user says the limit has reset, one PR from `v0.1-dev` to `main` (merge
commit) publishes everything, and phases go back to targeting `main`. Previews stay off until the
user asks for them back (remove those two lines).

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
  it ready when the phase is done. A draft runs no CI; marking it ready does, so mark it ready
  only once the whole suite has passed in the container.
- A session that starts and finds "In progress" filled in, or uncommitted changes, resumes that
  work before anything else, and says so to the user.
- When the phase merges, empty "In progress".

**Between phases, ask for personal touches.** When a phase is done and before the next begins, ask
the user whether any new secrets, inside jokes or familiar things have come to mind. Suggest 2–3
specific prompts tied to the phase coming up (before the wardrobe: "a band shirt you'd put in her
closet?"). Record the answers in `docs/personal_touches.md`, under the phase they land in. v0 is a
surprise (decision 14), so the user answers, never her. For 0.1 the user will answer them all
together near the end (2026-09-29): keep asking briefly and writing them down, never hold a phase
for an answer, and note where each would land.

**Write the questions down too.** Before the session ends, copy the exact prompts into
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
- **The HUD is an HTML overlay** with `pointer-events: none` and furniture opting back in. Its
  controls are at least 44px, and they are kept clear of the notch and home bar with
  `env(safe-area-inset-*)`. Each sheet reaches the game through an Api built in `src/wiring/apis.ts`, and
  every moment's cue, sheet and toast is played in `src/wiring/moments.ts` (decision 106). Every
  sheet is built by `openSheet` (`src/hud/dom.ts`: a head, a scrolling body, a foot with Done
  last), and every list of her things by `collection()` (`src/hud/collection.ts`: filters, order,
  search, "new" marks), with icons sized by `fitIcon` to a whole scale (decision 109).

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
  Whisperwood (old trees, toadstools, the frozen creek), Lantern Shore (the lake, its pier and
  floating lanterns), the castle hill (Castle Mac-A-Boo, behind a `gate` at the lookout that opens
  with the castle key) and the hidden clearing (a `secret` zone, not on the map until found), all
  in `maps.ts`, their props in `src/sprites/wilds.ts` and `castle.ts`. What's buried is
  `src/data/buried.ts`, dug up by `world.digging` (the `Dug` keeper, save v18). `src/world/zones/` has `MapZone` (a place outdoors), `HomeZone` and the `Zones`
  registry; `world.travel` is where she is, every crossing, and `go` by the map; `world.atlas`
  keeps the places found and opened (save v14). `tests/data/zones.test.ts` holds every way out
  joined both ways and everything reachable. The world map is `src/hud/MapSheet.ts` (🗺️, `MapApi`).
- **Her look:** `src/sprites/doll.ts` draws the paper doll in layers, painting most clothes onto a
  body drawn in region keys (decision 27). The pieces are rows in `src/data/outfits.ts` (a new one
  is a row, plus a print in `OUTFIT_ART` if it has one); the rules for wearing them are
  `src/systems/wardrobe.ts`; `src/world/Wardrobe.ts` holds what she wears and owns. The creator,
  closet and salon sheets are `src/hud/LookSheets.ts`, and reach the game only through `LookApi`.
  She is 32×48 (decision 79): a cut paints body regions (upper arm, elbow, forearm…), never rows,
  and each layer is lit and softly outlined by `finish` (decision 88). Her poses (her phone, arms
  crossed, rocking out) are `src/systems/poses.ts` and `world.poses`, thrilled by the `thrilled`
  signal (decision 89).
- **The world:** `src/world/World.ts` composes services (`src/world/services/`, one per feature,
  built from a shared `WorldContext`) over keepers (`Bag`, `Farm`, `Home`…) and zones
  (`src/world/zones/`), and steps in `update(deltaMs)`; rules read `ctx.clock`. Callers use the
  service (`world.shops.buy`), never a forwarding method; `docs/architecture.md` is the layout and
  decision 84 the why. `World.save()` and `fromSave()` are the whole save.
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
  are `src/sprites/townProps.ts`.
- **The garden:** Hosta La Vista Farm, beside her house. Beds are `x` in the map (a `bed` tile,
  solid), crops are rows in `src/data/crops.ts`, the growing rules are `src/systems/farming.ts`,
  and `src/world/Farm.ts` holds which beds are tilled, what's in them and her sprinklers (save
  v22). What a visit to a bed does is one rule, `bedAction` in `src/systems/beds.ts` (phase P,
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
  derived from the day key in `src/systems/shop.ts`. `world.wallet` holds her Candy and
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
- **Her neighbours:** rows in `src/data/villagers.ts` (stops by the hour at named spots, in any place outdoors,
  walked only where she is (decision 92), lines by closeness,
  loves and likes, favours, and the three rewards), special days in `src/data/specialDays.ts`, the
  rules in `src/systems/friendship.ts`, friendships and mail in `src/world/Friends.ts`, and each
  villager's walk in `src/world/Neighbour.ts`. `world.neighbourhood` has `talk`, `give`,
  `favour`/`doFavour`, and `world.mailbox` the letters; tapping a villager walks up to them and arrives with `villager`. Their art is
  `src/sprites/villagers.ts`, built from the doll's parts; the talk and mail sheets are
  `src/hud/TalkSheet.ts` and `src/hud/MailSheet.ts`. The Moon Pie Man is a shop (`moonPie`) whose
  cart stands on one of the map's `peddlerSpots` on his days.
- **Critters:** rows in `src/data/critters.ts` (hours, habitat, the places it lives in `where`,
  rarity, `wary`), each also an item in her bag. Which are out, and where, is
  `src/systems/critters.ts`: habitats found from each place's map, and each place's critters
  dealt from the day key (decision 102). `world.collecting` has `critters`, `critterAt`,
  `netSwing` and `donate`; tapping one walks up and swings (`caught`, `fled`). `src/world/Cabinet.ts` is the
  Curiosity Cabinet, `src/hud/CabinetSheet.ts` the book (📖) and Wrapunzel's museum at Crumbs &
  Curios (through `CabinetApi`), `src/data/museum.ts` her labels and letters. Art is
  `src/sprites/critters.ts`, drawn by `src/render/critters.ts`.
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
- **Sound:** `src/audio/`. Every sound is a `Tune` of note lines (`tune.ts`); the cues, the
  neighbours' voices and the music-box waltz are `cues.ts` (`cueOf` maps a moment to a cue), each
  record's tune is `records.ts`, and `SoundBoard.ts` plays them with Web Audio, starting on her
  first touch. The switches are per phone (`settings.ts`), in Settings. Walk the Tomb gets her
  dancing (`world.recordPlayer.dance()`), with Cody.
- **The bag:** `src/world/Bag.ts`, with items as rows in `src/data/items.ts` and art in
  `src/sprites/items.ts`. The HUD follows it through `world.events` (an `EventBus`). What's new on
  the bag, closet, storage chest, Cabinet and workbench is `world.novelty` (`Novelty`, save v20),
  shown as a "new" in the collection and a dot on its button (decision 109).
- **The quick bar** (phase M, decision 110): `src/hud/QuickBar.ts` (through `QuickApi`), outdoors
  only: her hands, net, can (`src/data/tools.ts`, art in `src/sprites/tools.ts`) and her seeds.
  `world.hands` (`Hands`, save v20) keeps what she holds; a held seed is planted straight into an
  empty bed (`world.garden.sow`). `playerDrawable` in `src/render/scene.ts` draws it in her hand.
- **The day's windows and the calendar** (phase N, decisions 111–113): morning from 5, afternoon
  from noon, evening from 6 (`windowOf`, `windowKey` in `src/systems/clock.ts`, the type in
  `src/data/windows.ts`). `Takings` keeps the window a thing was taken in, so gathering and the
  noticeboard's notes come back each window; the snack and Fibi's bone once a day (`onceADay`).
  Cobweb Corner's special is a shelf dealt `everyWindow` with an `off`. The calendar is rows in
  `src/data/calendar.ts` (her special days, the holidays, the town's events) with rules worked out
  from the day key in `src/systems/calendar.ts`; `world.calendar` (`Calendar`) is today, the month
  and what's coming up, and says so when a window turns (`window`). Market day puts out a shelf
  `on` it, a full moon brings out moths and orbs (`isMoonlit`) and a silver night, a lucky Friday
  beads. The day's chip under her Candy opens `src/hud/CalendarSheet.ts` (`CalendarApi`). The
  noticeboard by the square (`noticeboard`, `N`) is `world.noticeboard`: three notes a window
  from `src/data/notices.ts`, dealt in `src/systems/notices.ts`, opened as
  `src/hud/NoticeSheet.ts` (`NoticeApi`).
- **Greetings, visits and passive Candy** (phase O, decisions 114–116): Cody's greeting as she
  opens the game is `greetingFor` in `src/systems/greetings.ts` (lines in `src/data/greetings.ts`:
  his welcomes by time away and window, a line per holiday, the red Tesla, the Pokémon reminder),
  shown by `hud.greet` (`GreetingCard` in `src/hud/TalkSheet.ts`; the car is
  `src/sprites/greetings.ts`). `world.visits` (`Visits`, save v21) counts a visit a day and gives
  its gift (`giftFor` in `src/systems/visits.ts`, rows in `src/data/visits.ts`): `welcome` from
  `main.ts`, `check` when a day turns while she plays. The candy tree (`J`, `world.candyTree`) fills
  a little each window, and the honesty stall (`E`, `world.stall`, `src/hud/StallSheet.ts` through
  `StallApi`) sells what she grows a few a window; both are worked out from a stored time by
  `windowsBetween` (`src/systems/clock.ts`) in `src/systems/passive.ts`, numbers in
  `src/data/passive.ts`, art in `src/sprites/nature.ts` and `clutter.ts`.
- **Dev handles:** under `npm run dev`, `window.world` (the `World`), `window.view` (a
  `DebugView`) and `window.sound` (the `SoundBoard`). `?loop=manual` stops the loop so smoke can crank `view.step(ms, frames)`, which
  runs through the same fixed 120Hz step (`src/loop.ts`) as the loop.

## Verifying a change

Game rules belong in vitest (`tests/world/`, `tests/systems/`) with a fake clock. Smoke
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
