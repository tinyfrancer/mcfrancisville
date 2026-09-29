# Architecture

How McFrancisVille is put together, as of phase N of `docs/v0.1_plan.md` (time windows and the calendar). Read it before adding
a system, and update it when a seam moves. The plan's review checklist asks the questions; this
page is the map they're asked against. `CLAUDE.md` "Where things are" says where each feature
lives; this page says how the pieces talk.

## The layers

```
data/  types/  config/   rows and ids: what exists, with no logic beyond lookups
systems/                 pure rules: functions of (state, day key, now) that keep no time
sprites/                 pixel grids and palettes: what things look like, as data
world/                   state and its owners: the World, its services, zones and keepers
persistence/             the save: its shape, migrations, localStorage, the backup code
render/                  drawing: reads the world once a frame, writes it only by taps
hud/  ui/                the HTML overlay: reaches the world only through its Api interfaces
audio/                   tunes and the SoundBoard: hears moments, never reads the world
wiring/                  the sheets' Apis from the world's services, and each moment played
main.ts                  runs it: the loop, the save, the views and touch
```

What may import what (checked again 2026-09-28, in phase K):

- `data/` imports only `types/`; `systems/` only `data/` and `types/`. `systems/random.ts`
  (`hashString`, `seeded`) is a leaf anything may use.
- `sprites/` imports `data/`, `types/` and `systems/random`, plus a type from `systems/pets`;
  `sprites/catalogue.ts` also dresses the doll with `wear`, a pure rule, to draw every look.
- `world/` imports `systems/`, `data/`, `config/` and `types/`, and the save's types from
  `persistence/`. `persistence/` imports the keepers' snapshot types from `world/`. This is a
  type-only loop, fine because the save's shape _is_ the keepers' snapshots; nothing that runs
  crosses it.
- `render/` imports `world/`, `sprites/` and `systems/`. `hud/` and `audio/` import `world/` for
  types only (`WorldEvent`, `Chat`, `MailView`, `Stack`, `Place`), never the World itself. They may
  call a pure rule from `systems/` to show something (`wear` for the creator's preview,
  `linksBetween` for the map's roads, `hoursOf` for a critter's hours), never to change anything.
- `wiring/` and `main.ts` may import anything: they are where the layers meet.

Everything that happens over time takes `now` from an injected `Clock` and is worked out from a
stored timestamp or the 5am day key when it's read (decision 4), so tests fake the clock and a
closed phone costs nothing.
Since phase N a day has three windows, morning, afternoon and evening (decisions 81, 111), keyed
`YYYY-MM-DD@window` (`windowKey`): what refreshes each window is compared against that key the
same way, and the calendar (decision 112) is worked out from the day key alone.

## The world

`src/world/World.ts` is a thin composer (about 665 lines, from 1,686 as `Town`; half of it is the
constructor handing each service its parts). It builds the parts, turns a tap into a walk and a
walk's end into an arrival, steps everything in `update(deltaMs)`, and gathers the save
(`save()`, the one way its state goes out). It holds no game rule of its own.

### What every part shares: `WorldContext`

`src/world/context.ts` is handed to every service:

- `clock`: the phone's, or a test's.
- `events`: an `EventBus<WorldState>`, the state the HUD re-renders from (candy, bag, home, scene,
  decorating, mail…). Emitted by whoever changed it.
- `signals`: an `EventBus<Signals>`, what one service tells another it did (`bought`, `opened`).
  Never seen outside the world. It's how the mystery pins a clue when she buys from the Moon Pie
  Man, without `Shops` knowing the mystery exists.
- `moments`: moments that come from a tap or a sheet rather than a step (a letter, a clue, a
  refusal), queued until the next `update` returns them with its own.

So there are **two channels out of the world**: the state bus, which the HUD follows, and the list
of moments `update()` returns (a catch, a harvest, a heart), which the view, the messages and the
sound play.

### Keepers and services

A **keeper** holds state and its snapshot, and checks what it's given: `Bag`, `Wardrobe`, `Farm`,
`Home`, `Friends`, `Letters`, `Cabinet`, `Pets`, `Casebook`, `Atlas`, `Porch`, `Keepsakes`, `Dug` (in `src/world/`). A keeper doesn't
know the clock or the other keepers.

A **service** (`src/world/services/`) is a feature's behaviour over one or more keepers. It takes
the context and exactly the keepers or services it needs in its constructor, and reads anything
else through a narrow function it's handed (`outside()`, `standing()`), never a back-reference to
the World.

| Service         | Owns                                                           | Uses                                      |
| --------------- | -------------------------------------------------------------- | ----------------------------------------- |
| `Wallet`        | her Candy                                                      | state bus                                 |
| `Takings`       | what she has taken this window (the snack, the bone: today)    | clock                                     |
| `Belongings`    | where something bought or given goes                           | bag, wardrobe, home, workbench, pets      |
| `Workbench`     | recipes known (her recipe book), crafting                      | bag, home                                 |
| `Kitchen`       | the stove's dishes, cooking, eating, what a meal still does    | bag, workbench, takings                   |
| `Garden`        | the bed looked at, tending, planting (a row too), sprinklers   | bag, farm                                 |
| `Gathering`     | trees, rocks, flowers, the snack, Fibi's bone                  | bag, takings, map                         |
| `Shops`         | stock, buying, selling; sends `bought`                         | wallet, bag, belongings, stalls           |
| `Mailbox`       | posting and opening letters; sends `opened`                    | letters, belongings, wardrobe             |
| `Mystery`       | clues, Wes, the mayor's letters; hears `bought`/`opened`       | casebook, mailbox, friends, cabinet       |
| `Collecting`    | each place's critters this hour (and a lured one), the net     | bag, takings, cabinet, mailbox, `Lurer`   |
| `Fishing`       | her line in the water: the cast, nibbles, bite, reeling in     | collecting (its fish, `keep`), `eager`    |
| `Neighbourhood` | their walks in every place and room, talk, gifts, favours      | friends, bag, wallet, mailbox, zones      |
| `SmallEvents`   | the window's news or lost thing, the errand she carries        | wallet, takings, `thank` (friends)        |
| `Newcomers`     | who has written and moved in, the next one's letter; `movedIn` | mailbox, unlock facts                     |
| `Travel`        | where she is, crossings, finding and opening places            | zones, atlas, movement, mailbox           |
| `PetCare`       | the pets, walking, patting, names, accessories, bones          | pets, bag, takings, movement, both zones  |
| `Decorator`     | picking up, moving, turning, storing pieces                    | home                                      |
| `RecordPlayer`  | the next record, and the dance                                 | bag                                       |
| `Poses`         | standing still, idling, rocking out; hears `thrilled`          | whether she's moving or busy              |
| `Interiors`     | walking up to things in buildings, and the keepsakes           | keepsakes, belongings, friendships        |
| `Digging`       | digging up what's buried, once                                 | dug, bag                                  |
| `Forecast`      | today's weather (`world.weather`), and telling her of it       | clock, where she is                       |
| `Hands`         | what she holds from the quick bar; a held seed's planting      | bag (a seed she runs out of is let go)    |
| `Novelty`       | what's new on each collection until she looks                  | reads bag, closet, home, cabinet, recipes |
| `Calendar`      | the day's window, what's on today, the month; `window`         | clock, stalls                             |
| `Noticeboard`   | the notes on the board this window, answering them             | bag, wallet, takings, `thank` (friends)   |
| `Visits`        | visits counted by day, their gifts, Cody's greeting; `visit`   | bag, wallet, belongings, her name         |
| `CandyTree`     | when she last shook it, what it holds, shaking it              | wallet                                    |
| `HonestyStall`  | what's on the stall, its sales by window, the tin              | bag, wallet                               |

Callers (HUD Apis, the renderer, tests, smoke) go straight to the service: `world.shops.buy`,
`world.petCare.rename`, `world.decorating.start()`. There are no forwarding methods on the World.

### Zones and movement

A `Zone` (`src/world/zones/Zone.ts`, decision 78) is one place she can be: its size, what's
walkable, what's walked up to rather than onto, where to stand to use a thing, where she comes in
(`entry`) and its ways out (`doorAt`). Every place is a row in `ZONES` (`src/data/zones.ts`,
decision 90). A `MapZone` is a place outdoors drawn from a map (the town, Whisperwood, Lantern
Shore, the castle hill, the hidden clearing), with its exits at the edges and its doors; the
town's also has the day's `Stalls` (the pop-up and the Moon Pie cart), and a place with
newcomers' `lots` has `Lots` (phase T): a sign, then the house and its boxes, solid like a stall
and gone into by the door in its map's `doors`. A way out with a `gate`
has it stand in the way, one tile in, while the place beyond is shut (`shutGates`, decision 104). `HomeZone` is her room and its furniture. A `RoomZone` is the inside
of one of the town's buildings (phase H, decision 98), a fixed room from its row in
`data/interiors.ts`, with the mat back out to the door step. `Zones` holds them all by id, and
`inside(id)` and `outdoor(id)` say which kind she's in. `Movement` owns her position, facing and path, and walks in whichever zone it's handed.

`Travel` owns which zone she's in, and every crossing goes through it: a way out she arrives at, a
door, or the world map. It sends `crossed`, which the decorator, the record player and the pets
hear, and finds and opens places (decision 91), kept in the `Atlas`. Every place outdoors has its
own critters (decision 102) and gathering (trees, toadstools, flowers, keyed with the place), and
shares the day's weather (decision 107), which the critters' deal and the garden read from the day
key themselves, and the views from `world.weather`; the
farm, the stalls, the snack, Wes and Fibi's bone are still only ever in town (or at home, for the
bone).

Her path is A\* over the zone's tiles (`systems/pathfinding.ts`) pulled taut (`stringPull`): she
heads straight for the farthest point along it she can reach in a clear line, where "clear" is her
body, just under half a tile either side of her middle, never overlapping anything solid
(`clearLine`, exact rather than sampled). So she walks straight across open ground and turns only
at corners, and a new tap mid-step heads straight on from wherever she is. Her neighbours' paths
are pulled the same way since phase S; pets still walk tile to tile.

Where a neighbour should be is worked out from the hour and the day key alone
(`systems/schedules.ts`, phase S): the day's schedule (weekday or weekend, a stop in every window,
outdoors at a named spot or inside a building at one of its `stands`), a visit dealt over it (a
guest stands beside their host, or just inside her door), a happening over that
(`systems/happenings.ts`: the book club, the midnight bake, the seed swap…), and her birthday
party over all of it. Only those living in town are anyone's guest or host (the `callers`
argument, phase T: her first neighbours, and each newcomer from the day after their letter,
`systems/newcomers.ts`), and a newcomer spends their moving day by their new door.
`Neighbourhood` turns that into a tile each step (`plan`, guests after everyone else so no two
share one) and walks whoever is where she is, out by an edge, a building's door step or a room's
mat when they're going somewhere else; anyone elsewhere is simply where they should be.

### Taps and arrivals

A tap goes to `World.tapTile`: decorating takes it if she's decorating; otherwise a neighbour,
Wes, a critter, a pet, a prop, a piece or a bed on that tile becomes a **visit**, and she walks to
the nearest open tile beside it. A visit carries its `kind`, and her arrival looks it up in
`arrivals`, one handler per kind (phase K): talk, swing the net, pat the pet, tend the bed, use a
thing in a building (`Interiors`), or a piece at home (its line, and the record player). The table
is typed over every kind, so a new kind (a fishing spot, a stove) doesn't compile until it says
what arriving does. A prop, or open ground, goes through `arriveOn`: the porch pots, a mound to dig
(`Digging`), a way out (`Travel.cross`), then whatever there is to gather. Every arrival comes from
`update`, even one with no walk, so the moments have one source.

### Saving

`World.save()` returns everything a save keeps (typed as `SaveState` less its version and
times, so a new field that isn't saved fails to compile), and `fromSave(save)` turns a loaded save
back into the World's options. `src/persistence/` owns the shape (`SaveState.ts`), the migration
chain (`migrations.ts`; 0.1's starts at version 12, decision 80), `localStorage`, and the backup
code, which runs the same migrations. A save that can't be read is moved aside, never deleted
(decision 25).

## The loop

`main.ts` runs the loop, and `src/loop.ts` (`FixedStep`) turns each frame into whole steps of
1/120 s, so a walk is the same on every phone and a 60Hz frame always gets two steps (it allows a
millisecond of slack for browsers whose frame times wobble). Each step runs `world.update` and the
current view's `follow`; then the frame is drawn once. The dev-only `view.step(ms, frames)` goes
through the same `FixedStep`, so smoke and perf crank what the phone runs. There's no
interpolation between steps: at 120 steps a second there's nothing for it to smooth on a 60Hz or
120Hz screen.

## The view

`main.ts` keeps one `SceneView` per zone, made the first time she goes there (an `OutdoorView` for
each place outdoors, a `HomeView` for her room and a `RoomView` for each building's inside, sharing
`render/scene.ts`, and the two rooms `render/room.ts`), and draws whichever
she's in. A new place fades in from dark, a CSS overlay on the HUD, so no view knows it. Each view keeps a `FollowCamera` (`render/camera.ts`), stepped with the
simulation: an eased focus trailing her, turned into a whole-pixel lead of her drawn pixel over the
camera. The lead changes one pixel at a time, and only on a step where that can't move the ground
back the way it came, so while the camera keeps pace she and the ground move by exactly the same
pixels (decision 85). It cuts rather than eases when she jumps more than three tiles (a door). Sprites are pixel grids baked to cached canvases by palette swap
(decision 2); `render/ground.ts` bakes the ground once, each tile grass with its ground laid
over it by neighbour mask (`sprites/terrain.ts`, decision 93); `render/lighting.ts` multiplies the
hour's light over each frame. The canvas is fitted at the whole number of device pixels that
shows nearest 16 tiles across (`render/pixelScale.ts`, decision 86).

**Everything in the world is drawn at 32** since phase L, which redrew the last of version 0's
props and removed the bridge that baked old grids at 2× (decisions 86, 108). Item icons and the
pets' speech bubbles are still 16-pixel grids on purpose (decision 105): the HUD bakes them at 1×,
and the world at `ICON_SCALE` through `bakeIcon` (`render/items.ts`), so the scale belongs to where
a grid is drawn, never to the grid.

**Life and weather** (phase L, decisions 107–108) are drawn over the baked ground each frame, only
where the camera is: `render/life.ts` works out once per place where its open water, its tufts of
long grass and its chimneys are (`lifeOf`), and draws glints, swaying grass and smoke;
`render/weather.ts` covers the frame with repeating tiles of rain and its splashes, or two layers
of drifting fog, anchored in the world, and greys the light by a `tint` through `drawLight`. The
clutter that doesn't move is baked into the ground with it (`render/clutter.ts` places each place's
decals by its rules in `data/clutter.ts`).

**People are paper dolls.** She is `sprites/doll.ts`: a body in region keys, a stack of layers
painted onto it (clothes) or drawn over it (hair, hats), each finished with its own light and soft
outline (decision 88). The neighbours, Wes and the Moon Pie Man (`sprites/villagers.ts`) are the
same parts in their own colours, with touches of their own on top. Poses are bodies of their own,
chosen by `world.poses`; the view only asks which.

**Making art.** `sprites/sketch.ts` draws grids of keys with shapes, lit spheres, bevels,
outlines from a mask and dithering; `ramp` in `sprites/palette.ts` gives five hue-shifted tones.
`sprites/catalogue.ts` names every sprite once and draws it purely: `?gallery`
(`render/gallery.ts`), `npm run sprite` (PNGs through Vite's module runner) and a test that draws
everything all read it. `render/overview.ts` draws a place outdoors whole, ground and props, for
`npm run sprite -- 'place:*'`; it lives in `render/` because it needs `propScale`. The rules are `docs/art_style.md`; the scale sheet is
`sprites/scaleSheet.ts`.

## The HUD

An HTML overlay, `pointer-events: none` except its controls. Each sheet takes an Api interface
(`ShopApi`, `HomeApi`, `PetApi`, `CraftApi`, `TalkApi`, `MailApi`, `CabinetApi`, `MysteryApi`,
`MapApi`, `FarmApi`, `BagApi`, `LookApi`, `SaveApi`, `SoundApi`, `CalendarApi`, `NoticeApi`,
`StallApi`, and
`QuickApi`, `BedApi` and `FreshApi` for the quick bar, a bed's card and the dots on the corner
buttons), which `sheetApis` in
`wiring/apis.ts` builds from the world's services (the save's and the sound's are `main.ts`'s), so a
sheet is testable with a stub and never reaches into the world. The world's moments, from the loop
or from a sheet, go through `playMoments` (`wiring/moments.ts`): each one's cue, the sheet it
opens, and its toast. A bed's card (phase P) is the one piece of the HUD that follows the world:
`main.ts` tells it each frame where its bed is on the page (`hud.placeBed`), and where she is
(`hud.playerAt`), so a toast can keep out of her way.

Since phase M every sheet is one design (decision 109): `openSheet` (`hud/dom.ts`) returns a head
that stays put, a body that scrolls and a foot whose Done comes last, and a sheet fills those
rather than building its own frame. The five collections (bag, closet, storage chest, Cabinet,
workbench) are `collection()` (`hud/collection.ts`), whose rule is the pure `arrange` (filter,
search, order); each sheet hands it its entries and how to draw one. An icon is always drawn at
1× by the renderer and sized by `fitIcon` to the largest whole scale that fits its box, so the HUD
has one rule for icons whatever size a grid is. The quick bar (`hud/QuickBar.ts`) is the one
control along the bottom outdoors; the decor bar has the bottom at home. The top-right row of
round buttons is full on a phone at home, so the day (phase N) is a chip under her Candy on the
left, which opens the calendar; a toast sits below it.

## Performance baseline

`npm run perf` (`scripts/perf.mjs`) walks her round the town and the house on a phone-sized
Chromium at 4× CPU throttle, with the loop cranked by hand, and reports per-frame times and the
heap. Measured before the split and again after it, 2026-09-27:

| Scene | Update mean (p95) before → after | Draw mean (p50, p95) after | Heap   |
| ----- | -------------------------------- | -------------------------- | ------ |
| Town  | 0.15 ms → 0.19 ms (0.9)          | 13.6 ms (9.3, 21.8)        | 6 MB   |
| Home  | 0.6 ms → 0.58 ms (1.3)           | 8.9 ms (6, 10.7)           | 6.2 MB |

Phase B (2026-09-27) left each update's cost where it was (town 0.16–0.2 ms, home 0.57–0.64 ms),
but a 60Hz frame now runs two of them, so a frame's simulation is about 0.4 ms in town and 1.2 ms
at home. Draw means and medians didn't move. The town's draw p95 swings between about 17 and
60 ms from run to run in a cloud container, on `main` as much as on phase B's branch, so treat it
as noise there and measure it on a quieter machine.

The split cost nothing measurable. Drawing is where the time goes, and it's comfortably inside a
60 fps frame (16.7 ms) at p50 even throttled; the town's p95 isn't.

Phase C (2026-09-27) doubled every sprite and the ground's canvas. The container measured slower
that day across the board, so `main` was measured beside the branch, three runs alternating:
town draw mean 39.6–39.9 ms (p50 about 26) on both, home 30.4–32.2 ms on both, heap 6.2–6.4 MB
on both. The doubling cost nothing measurable, since the frame covers the same device pixels
whatever the art's density. Absolute numbers from a cloud container aren't comparable across
days; compare against `main` on the same machine.

Phase D (2026-09-28) redrew her, her neighbours, the pets and the critters. Measured beside
`origin/main` on the same machine, two runs each, alternating: town draw mean 40.7–42.9 ms
against 41.9–43.9, home 31.9–33.7 against 32.7–34.4, so no change; the heap is about 0.4 MB
higher (6.6 against 6.2 MB in town), the grids and baked canvases of her poses and the new art.
Every look and pose is baked once, so more layers cost a bake, not a frame.

Phase E (2026-09-28) added the zones. Measured beside `origin/main`, two runs each, alternating:
draw means unchanged (town 41.9–42.6 ms against 42.1–43.3, home 31.9–32.1 against 32.3–32.6);
each update is about 0.06 ms dearer (town 0.33 against 0.27, home 0.77 against 0.74), the unlock
check and the neighbours' place bookkeeping, a fraction of a percent of a frame; the heap is 0.2 MB
higher, the new places' parsed maps (a place's view and ground are only made when she goes there).

Phase F (2026-09-28) redrew the ground and re-laid the town at 40×50. Measured beside
`origin/main`, alternating, over three runs: draw means unchanged (town 40.3–41 ms against
42.9, home 32.8 against 32.7; the frame covers the same pixels whatever is in it); updates
unchanged (town 0.37 against 0.32 ms, noise at this size); the JS heap about 0.7 MB higher (7.6
against 6.9 MB in town), the ground's grids and the bigger map. The town's ground canvas is
1,280×1,600, 7.8 MB of canvas memory outside the JS heap, against 5.9 MB before.

Phase H (2026-09-28) added the insides of the buildings. Measured beside `origin/main`,
alternating, two runs each: town draw mean 35.1–37 ms against 37.3–38.1, home 29.4–29.7 against
27.9–28.8 (both within the day's noise; perf doesn't walk into a building, and a room draws less
than the town); updates unchanged; the JS heap 0.3–0.4 MB higher (8.9–9 against 8.6 MB in town),
the fixtures' grids and the interiors' rows. Each room's view, and its baked walls and floor, is
only made the first time she goes in.

Phase G (2026-09-28) redrew every building and added five houses. Measured beside `origin/main`,
alternating, two runs each: town draw mean 38.1–39 ms against 35.1–38 (within the day's noise,
perhaps a millisecond for the bigger sprites and their glows), home 31–31.3 against 28.6–29.8
(untouched by this phase, so that gap is the container); updates unchanged; the JS heap 0.9 MB
higher (8.6 against 7.7 MB in town), the buildings' grids and baked canvases, each baked once.

Phase I (2026-09-28) filled in the places beyond the town and gave each its critters. Measured
beside `origin/main`, alternating, two runs each: town draw mean 34–39.9 ms against 37–37.8, home
28.8–33.4 against 29.3–32.2 (both within the day's noise; perf walks only the town and her home);
updates unchanged (town 0.24–0.3 ms against 0.25–0.28); the JS heap about 0.6 MB higher (9.5–9.7
against 9 MB in town), the new places' parsed maps, props and critter art. Each place's ground
(Whisperwood and the shore 832×1,216, the castle hill 896×1,344, about 4–4.8 MB of canvas each)
and view are only made the first time she goes there, and a place's habitats the first time its
critters are asked for.

Phase K (2026-09-28), the mid-point review. Measured beside `origin/main`, alternating, two
runs each: each update at home is about 40% cheaper (0.43–0.5 ms against 0.74–0.87; the pets'
open floor is kept until the room changes), the town's unchanged (0.29–0.33 against 0.31); draw
means unchanged (town 38.7 ms against 39.4–40.8, home 31–32.9 against 30.5–31.2); the heap
unchanged at 10.1 MB in town. Since phase A the heap has grown from 6 to 10.1 MB, all of it
accounted for above (the art at 32, the bigger town, the places, the buildings), and the draw
mean has stayed where the container's day puts it: the frame covers the same device pixels
whatever is in it.

Phase M (2026-09-28) was the HUD's: the sheets, the collections and the quick bar, and a held
tool drawn in her hand. Measured beside `origin/main`, alternating: town draw mean 43.8 ms against
40.3, home 26.9 against 29.7 (the container's noise, one each way), updates unchanged, the heap
0.1–0.2 MB higher. A collection draws its icons from the same baked canvases as before, and a
sheet is built only when it opens.

Phase N (2026-09-28) added the windows, the calendar and the noticeboard. Measured beside
`v0.1-dev` on the same machine: town draw mean 40.7 ms against 41.8, home 24.5 against 29 (the
container's noise), updates unchanged (town 0.25 against 0.27 ms; the calendar's check is one
window key a step), the heap 0.2 MB higher (10.9 against 10.7 MB in town), the noticeboard's art
and the calendar's rows. The month and the notes are worked out only when a sheet opens.

Phase O (2026-09-28) added the greetings, visit gifts, the candy tree and the honesty stall.
Measured on the same machine as phase N: town draw mean 40.6 ms against 40.7, updates unchanged
(0.24 against 0.25 ms; the stall works its sales out once a window, the visits compare a day key a
step), the heap 0.3 MB higher (11.2 against 10.9 MB), the tree's three looks and the stall's two.

Phase L (2026-09-28) added life, weather and clutter. Measured beside `origin/main`, alternating,
two runs each, at 21:30: on a clear day the town's draw mean is a few milliseconds dearer (about
45 against 41; the tufts and the smoke, each a couple), on a rainy day 46 (rain is two passes over
the frame, the drops in one tile and the splashes in another; it was 55–59 with three before the
rain's layers were merged and the smoke's puffs baked) and on a foggy day 49 (two layers of fog).
Medians moved less (27 against 26.5). Home is unchanged (33 ms); updates unchanged; the heap 0.5 MB
higher (10.6 against 10.1 MB in town), the new props' grids and each place's life. A full-frame
pass costs about 3 ms in a throttled cloud container, which draws in software; a phone's GPU
composites it for much less.

## Where it hurts

Honest notes for the phases ahead, most pressing first. Phase K fixed three of phase A's: the
Apis left `main.ts` for `wiring/`, arrivals became a table, and the pets' floor at home is kept.
Phase L closed the bridge (phase K's 8) and gave the weather a service of its own (2).

1. **The ground is one canvas per place.** The town's is 1,280×1,600 (7.8 MB) since phase F, and
   each place she has been keeps its view and ground for good: all five outdoors come to about
   23 MB of canvas. Phase L drew its life and weather over the baked ground rather than re-baking
   it, but every full-frame pass (the ground, the rain or fog, the light) costs a few milliseconds
   on a slow phone. A place much bigger than the town, or many more places, should bake its ground
   in chunks the camera pulls from, or let go of the views of places she has left.
2. **Town-only features take the town zone.** `Gathering`'s snack, `Mystery` and `Stalls` still
   assume the town, which is right for them. `Collecting` holds every place (phase I), and
   `PetCare` asks it for the town's habitats for Fibi's bones. The weather is the day's, read from
   the day key by each rule that cares (the critters' deal, the garden) and by the views through
   `world.weather`; phase N's windows should do the same rather than a flag on a service.
3. **The World's constructor is the wiring diagram.** Half of `World.ts` is handing each service
   its keepers and a few `() => this.scene` reads, in an order that matters (`Travel` is made
   after the zones, `PetCare` after `Collecting`). It reads top to bottom, but each new service
   makes it longer (755 lines after phase O); when it passes about 800 lines, split the building into a function per
   area (people, places, home) that returns its services.
4. **Pets walk tile to tile.** She and her neighbours (since phase S) walk paths pulled taut;
   the pets' pottering would look smoother the same way (`stringPull`), if the art pass wants it.
5. **Tests go through the whole world.** Every service is constructed from plain parts and could
   be tested alone, but the suites drive it through `harness()`. That's the right level for rules
   she feels, and slow only in aggregate (the suite runs in about 24 s); new services with fiddly
   rules of their own should get a direct test as well.
6. **Big data files.** `sprites/items.ts` is 1,300 lines of grids at 16, and `sprites/doll.ts` is
   1,300. Fine as data, but a redraw should split items by family (records, food, seating…) as it
   replaces them, and draw with `Sketch` rather than typing, as phase J did for furniture
   (decision 105): `pieces.ts`, `surfaces.ts` and a file per family, over `furnish.ts`.
7. **The critters' 16-pixel grids live on in one place.** Phase M drew every HUD icon by one rule
   (`fitIcon`) and made a critter's bag and Cabinet icon its 24-pixel art, but the museum's cases
   at Crumbs & Curios are sized for the 16-pixel `frames`, so those stay until the art pass
   (phase V) redraws the cases for the bigger critters, and can then drop them.
8. **Map characters are running out.** Each prop is a legend character in `data/maps.ts`, and
   phase L's clutter took eight more (`v q o j s d y c`), phase N's noticeboard one (`N`), phase O's
   candy tree and stall two (`J E`). About a dozen single characters are
   left; a later phase with much more to place should give each place a legend of its own on top
   of the shared one, or place small things by named spots as the neighbours are.
