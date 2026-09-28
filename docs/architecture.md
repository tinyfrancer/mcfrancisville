# Architecture

How McFrancisVille is put together, as of phase A of `docs/v0.1_plan.md`. Read it before adding
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
main.ts                  wires them together: the loop, the save, the Apis
```

What may import what (checked 2026-09-27, and worth re-checking in each review):

- `data/` imports only `types/`; `systems/` only `data/` and `types/`; `sprites/` those, and one type
  from `systems/`.
- `world/` imports `systems/`, `data/`, `config/` and `types/`, and the save's types from
  `persistence/`. `persistence/` imports the keepers' snapshot types from `world/`. This is a
  type-only loop, fine because the save's shape _is_ the keepers' snapshots; nothing that runs
  crosses it.
- `render/` imports `world/`, `sprites/` and `systems/`. `hud/` and `audio/` import `world/` for
  types only (`WorldEvent`, `Chat`, `MailView`), never the World itself.

Everything that happens over time takes `now` from an injected `Clock` and is worked out from a
stored timestamp or the 5am day key when it's read (decision 4), so tests fake the clock and a
closed phone costs nothing.

## The world

`src/world/World.ts` is a thin composer (about 550 lines, from 1,686 as `Town`). It builds the
parts, owns which zone she is in, turns a tap into a walk and a walk's end into an arrival, and
steps everything in `update(deltaMs)`. It holds no game rule of its own.

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
`Home`, `Friends`, `Letters`, `Cabinet`, `Pets`, `Casebook` (in `src/world/`). A keeper doesn't
know the clock or the other keepers.

A **service** (`src/world/services/`) is a feature's behaviour over one or more keepers. It takes
the context and exactly the keepers or services it needs in its constructor, and reads anything
else through a narrow function it's handed (`outside()`, `standing()`), never a back-reference to
the World.

| Service         | Owns                                                     | Uses                                      |
| --------------- | -------------------------------------------------------- | ----------------------------------------- |
| `Wallet`        | her Candy                                                | state bus                                 |
| `Takings`       | what she has taken today, by key                         | clock                                     |
| `Belongings`    | where something bought or given goes                     | bag, wardrobe, home, workbench, pets      |
| `Workbench`     | recipes known, crafting                                  | bag, home                                 |
| `Garden`        | tending and planting beds                                | bag, farm                                 |
| `Gathering`     | trees, rocks, flowers, the snack, Fibi's bone            | bag, takings, map                         |
| `Shops`         | stock, buying, selling; sends `bought`                   | wallet, bag, belongings, stalls           |
| `Mailbox`       | posting and opening letters; sends `opened`              | letters, belongings, wardrobe             |
| `Mystery`       | clues, Wes, the mayor's letters; hears `bought`/`opened` | casebook, mailbox, friends, cabinet       |
| `Collecting`    | critters out this hour, the net, the museum              | bag, takings, cabinet, mailbox, town zone |
| `Neighbourhood` | their walks, talk, gifts, favours, friendship            | friends, bag, wallet, mailbox, town zone  |
| `PetCare`       | the pets, walking, patting, names, accessories, bones    | pets, bag, takings, movement, both zones  |
| `Decorator`     | picking up, moving, turning, storing pieces              | home                                      |
| `RecordPlayer`  | the next record, and the dance                           | bag                                       |
| `Poses`         | standing still, idling, rocking out; hears `thrilled`    | whether she's moving or busy              |

Callers (HUD Apis, the renderer, tests, smoke) go straight to the service: `world.shops.buy`,
`world.petCare.rename`, `world.decorating.start()`. There are no forwarding methods on the World.

### Zones and movement

A `Zone` (`src/world/zones/Zone.ts`, decision 78) is one place she can be: its size, what's
walkable, what's walked up to rather than onto, where to stand to use a thing, and its doors.
`TownZone` is the map plus the day's `Stalls` (the pop-up and the Moon Pie cart); `HomeZone` is
her room and its furniture. `Movement` owns her position, facing and path, and walks in whichever
zone it's handed. Nothing else needs to know which zone it is.

Her path is A\* over the zone's tiles (`systems/pathfinding.ts`) pulled taut (`stringPull`): she
heads straight for the farthest point along it she can reach in a clear line, where "clear" is her
body, just under half a tile either side of her middle, never overlapping anything solid
(`clearLine`, exact rather than sampled). So she walks straight across open ground and turns only
at corners, and a new tap mid-step heads straight on from wherever she is. Neighbours and pets
still walk tile to tile; their paths could be pulled the same way when their walks are redone
(phase S).

### Taps and arrivals

A tap goes to `World.tapTile`: decorating takes it if she's decorating; otherwise a neighbour,
Wes, a critter, a pet, a prop, a piece or a bed on that tile becomes a **visit**, and she walks to
the nearest open tile beside it. Her arrival does the visit (`arriveAt`): talk, swing the net, pat
the pet, tend the bed, play the record, go through the door, or gather. Every arrival comes from
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

`main.ts` keeps one `SceneView` per zone (`TownView`, `HomeView`, sharing `render/scene.ts`) and
draws whichever she's in. Each view keeps a `FollowCamera` (`render/camera.ts`), stepped with the
simulation: an eased focus trailing her, turned into a whole-pixel lead of her drawn pixel over the
camera. The lead changes one pixel at a time, and only on a step where that can't move the ground
back the way it came, so while the camera keeps pace she and the ground move by exactly the same
pixels (decision 85). It cuts rather than eases when she jumps more than three tiles (a door). Sprites are pixel grids baked to cached canvases by palette swap
(decision 2); `render/ground.ts` bakes the ground once; `render/lighting.ts` multiplies the
hour's light over each frame. The canvas is fitted at the whole number of device pixels that
shows nearest 16 tiles across (`render/pixelScale.ts`, decision 86).

**The art is mid-redraw** (decisions 79, 86). A tile is 32 pixels, but most grids are still
version 0's, drawn for 16. `render/legacy.ts` is the bridge: the world bakes those with
`bakeOld` (twice the size) and measures offsets against them with `old(n)`; the ground and the
room are drawn at 16 and enlarged once. The HUD bakes the same grids at 1×, so the scale belongs
to where a grid is drawn, never to the grid. As each phase redraws its sprites, their `bakeOld`
and `old` calls go; when none are left, so does `legacy.ts`.

**People are paper dolls.** She is `sprites/doll.ts`: a body in region keys, a stack of layers
painted onto it (clothes) or drawn over it (hair, hats), each finished with its own light and soft
outline (decision 88). The neighbours, Wes and the Moon Pie Man (`sprites/villagers.ts`) are the
same parts in their own colours, with touches of their own on top. Poses are bodies of their own,
chosen by `world.poses`; the view only asks which.

**Making art.** `sprites/sketch.ts` draws grids of keys with shapes, lit spheres, bevels,
outlines from a mask and dithering; `ramp` in `sprites/palette.ts` gives five hue-shifted tones.
`sprites/catalogue.ts` names every sprite once and draws it purely: `?gallery`
(`render/gallery.ts`), `npm run sprite` (PNGs through Vite's module runner) and a test that draws
everything all read it. The rules are `docs/art_style.md`; the scale sheet is
`sprites/scaleSheet.ts`.

## The HUD

An HTML overlay, `pointer-events: none` except its controls. Each sheet takes an Api interface
(`ShopApi`, `HomeApi`, `PetApi`, `CraftApi`, `TalkApi`, `MailApi`, `CabinetApi`, `MysteryApi`,
`FarmApi`, `BagApi`, `LookApi`, `SaveApi`, `SoundApi`), which `main.ts` builds from the world's
services, so a sheet is testable with a stub and never reaches into the world.

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
`main` on the same machine: town draw mean 43.8 ms against 42.7, home 33.8 against 33.1, heap
6.6–6.9 MB on both. Every look and pose is baked once, so more layers cost a bake, not a frame.

## Where it hurts

Honest notes for the phases ahead, most pressing first:

1. **`main.ts` has two jobs** (about 440 lines): the loop and save, and building a dozen Api
   adapters. As zones and sheets multiply (phases E–L), the Apis should move to `src/hud/apis/` (or
   beside each sheet) as functions of the world, leaving `main.ts` the loop.
2. **Zone doors aren't used yet.** `Zone.entry` and `Zone.doorAt` exist, but `World` still goes in
   and out of her house by hand (`goIn`, `goOut`). Phase E, the connected zones, should make every
   crossing go through `doorAt`/`entry`, with a zone registry instead of `where: 'town' | 'home'`.
3. **The arrival switch.** `arriveAt` is one method that knows every kind of visit. It's still
   readable, but each new thing to walk up to (fishing spots, stoves, doors) adds a branch; when
   it passes about eight kinds, give visits a small handler table keyed by kind.
4. **Pets at home rebuild the open floor every step** (why home updates cost 3× town's, and since
   phase B there are two steps a frame). Cache
   `HomeZone`'s walkable tiles and drop the cache on the `home` event.
5. **Tests go through the whole world.** Every service is constructed from plain parts and could
   be tested alone, but the suites drive it through `harness()`. That's the right level for rules
   she feels, and slow only in aggregate (the suite runs in about 16 s); new services with fiddly
   rules of their own should get a direct test as well.
6. **Big data files.** `sprites/items.ts` and `sprites/furniture.ts` are 1,200+ lines of grids.
   Fine as data, but the redraw (phases D, J) should split them by family (records, food,
   seating…) as it replaces them, and draw big pieces with `Sketch` rather than typing them.
7. **The critters and her doll draw at two densities.** A critter's bag icon is still its 16×16
   grid while the town draws a 24×24 one; the HUD's portraits and close-ups crop her and her
   neighbours at 32. Phase M should give the HUD one size for icons and drop the old grids.
8. **The bridge is a seam to close.** Until every sprite is redrawn, positions near old art are
   `old(n)` sums; a new sprite dropped beside old ones must be placed in world pixels, not
   `old()`, or it lands at twice the offset. `grep -rn "old(" src/render` is what's left.
