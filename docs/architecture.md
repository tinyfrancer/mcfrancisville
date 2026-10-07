# Architecture

How McFrancisVille is put together, as of 0.3's V1 (the review before the 0.3 release, after its
five lanes; before it, 0.2's V1 and phase V of `docs/v0.1_plan.md`). Read it before
adding a system, and update it when a seam moves. The plan's review checklist asks the questions; this
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

What may import what, held by `tests/architecture.test.ts` since phase V (a new import across
layers fails the suite until the table there, and this list, say it may):

- `data/` imports only `types/`; `systems/` only `data/` and `types/`. `systems/random.ts`
  (`hashString`, `hashMixed`, `seeded`) is a leaf anything may use. `config/` takes a type from `data/`.
- `sprites/` imports `data/`, `types/` and `systems/random`, plus a type from `systems/pets`;
  `sprites/catalogue.ts` also dresses the doll with `wear`, a pure rule, to draw every look. No
  other rule from `systems/` is called from `sprites/` or `audio/` (the test's second half).
- `world/` imports `systems/`, `data/`, `config/` and `types/`, and the save's types from
  `persistence/`. `persistence/` imports the keepers' snapshot types from `world/`, and the
  starters (bag, closet, home, pets, Candy) from `data/`. This is a type-only loop, fine because
  the save's shape _is_ the keepers' snapshots; nothing that runs crosses it.
- `render/` imports `world/`, `sprites/`, `systems/`, `data/` and `config/`. `hud/` and `audio/`
  import `world/` for types only (`WorldEvent`, `Chat`, `MailView`, `Stack`, `Place`), never the
  World itself. They may call a pure rule from `systems/` to show something (`wear` for the
  creator's preview, `linksBetween` for the map's roads, `hoursOf` for a critter's hours), never to
  change anything. `hud/` takes the doll's colour tables from `sprites/` for its swatches, and its
  theme from `ui/`, which takes the palette from `sprites/`; `audio/` takes a neighbour's figure's
  type from `sprites/` for their voice.
- `wiring/`, `main.ts`, `loop.ts`, `pwa.ts` and `settings.ts` may import anything: they are where
  the layers meet.

Everything that happens over time takes `now` from an injected `Clock` and is worked out from a
stored timestamp or the 5am day key when it's read (decision 4), so tests fake the clock and a
closed phone costs nothing.
Since phase N a day has three windows, morning, afternoon and evening (decisions 81, 111), keyed
`YYYY-MM-DD@window` (`windowKey`): what refreshes each window is compared against that key the
same way, and the calendar (decision 112) is worked out from the day key alone.

## The world

The world is three files and a folder (decision 139, 210 for the third, 218 for the folder).
`src/world/build.ts` is `WorldParts`: every keeper, zone and service as a field, the constructor
that has them made and assigns them, and the save (`save()`, the one way its state goes out). The
making is by area, a function each in `src/world/areas/` taking the shared parts and returning
its services (0.3's W1, decision 218): `keepersOf` and the `Shared` parts in `shared.ts` (`ctx`,
the keepers, `town`, the options, and `movement` read late), then `making` (the stall, workbench,
stove and `Belongings`), `passive` (visits, the candy tree), `places` (the zones and stalls),
`shopping` (Ollie's deliveries and catalogue, 0.3's S1, after the mailbox; Gourdon's book, S2; his figurines, C3), `neighbours`, `mystery`, `festivals` (`calendar.ts`), `outdoors` (weather, fountain),
`fairground`, `catching` (`collecting.ts`: the net, the rod and, since 0.3's C1, the fossils),
`going` (`travel.ts`: her movement, travel, the broom), `homeServices` (`home.ts`: decorating, the
record player, what plays, and since 0.3's H1 and H2 the chest and what's on show), `petServices`
(`pets.ts`) and `her` (hands, novelty, milestones, sitting, poses), in that order: a service listens for its signals in the order it
was made, and anything made later is read through a function. A new service is a line in its
area's function and its interface, a field here and its assignment. The options a world is made
from (`WorldOptions`, `fromSave`) are `src/world/options.ts`. What the services that talk with
her neighbours read of the town (her name, where she is, where a neighbour is, their hearts,
whether they live here, and `thank`) is one `TownReads` object made at the top of the constructor
and handed to each in `Shared`, so a new one takes it rather than writing the same six functions
again. `build.ts` is about 410 lines, the constructor about 110 of them. `src/world/World.ts`
(about 470 lines, from 884 at 0.1's end and 1,686 as `Town`) extends it: it turns a tap into a walk and a walk's end into an
arrival, and steps everything in `update(deltaMs)`. The parts call back into it only through
`forget()`, when she crosses somewhere or starts decorating. Neither holds a game rule of its own.

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
sound play. The music is the one thing told where she is rather than what happened: each step,
`main.ts` names a `MusicKey` from the zone, the window (`windowOf`) and an `Occasion` (the
festivals, the decorations, and whether `world.fountain` is playing), and the `SoundBoard`
crossfades to it (decisions 172, 173), so `audio/` still reads no rule. The one thing back the
other way is the music's beat (`SoundBoard.musicBeat`), which `main.ts` hands the town's view
for the fountain's lamps to pulse to (`fountainBeat`); the view never imports `audio/`.
The ambience is told the same way (V1's S1, decision 321): `wiring/hearing.ts` reads the place,
the hour, the weather and how near water she stands when she changes tile or place (or once a
minute), and hands `SoundBoard.setAmbience` a `Bed` from `ambienceFor`; it also counts her
footfalls off her walk cycle into `SoundBoard.footstep`. Inside `audio/`, `graph.ts`'s `Mixer`
is the node graph (buses, compressor, reverb, a voice per note) and `SoundBoard` only what
plays when, so a script can build the same graph on an `OfflineAudioContext` to measure it.

### Keepers and services

A **keeper** holds state and its snapshot, and checks what it's given: `Bag`, `Wardrobe`, `Farm`,
`Home`, `Yard`, `Friends`, `Letters`, `Cabinet`, `Pets`, `Casebook`, `Atlas`, `Porch`, `Keepsakes`,
`Dug` (in `src/world/`). Since 0.3 `Home` keeps her rooms (H4: `rooms`, each its pieces, paper,
floor and size, and `here`, the one she's in, which everything that read "the room" reads), the
chest's furniture and her things from her bag (`stored`, `items`, H1), what a display piece shows
(`Placed.shows`, H2) and what stands on a surface (`Placed.on`, H3); `Yard` keeps what stands on the
grass round her house and puts what it takes out and away through `Home`'s chest (H5). Both are
`Decorable`, so `Decorator` works on whichever she's in. A keeper doesn't
know the clock or the other keepers, but for two narrow functions `keepersOf` (`world/areas/shared.ts`) hands across (0.2's W1,
decision 164): the `Wardrobe` asks the bag how many of each bracelet she has, so none is worn that
isn't there, and the `Bag` asks the wardrobe how many she has on (`keepWorn`), which `remove`
never takes and `spares` leaves out, so selling, giving and the stall can't part her from one.

A **service** (`src/world/services/`) is a feature's behaviour over one or more keepers. It takes
the context and exactly the keepers or services it needs in its constructor, and reads anything
else through a narrow function it's handed (`outside()`, `standing()`), never a back-reference to
the World.

| Service         | Owns                                                           | Uses                                       |
| --------------- | -------------------------------------------------------------- | ------------------------------------------ |
| `Wallet`        | her Candy                                                      | state bus                                  |
| `Takings`       | what she has taken this window (the snack, the bone: today)    | clock                                      |
| `Belongings`    | where something bought or given goes; `ever`, all she has had  | bag, wardrobe, home, workbench, pets, yard |
| `Workbench`     | recipes known (her recipe book), crafting                      | bag, home                                  |
| `Kitchen`       | the stove's dishes, cooking, eating, what a meal still does    | bag, workbench, takings                    |
| `Garden`        | every place's beds (N1, the greenhouse's raised beds since F2) | bag, farm                                  |
| `Barn`          | the barn's wall (0.3's F2): fields, sprinkling one whole       | bag, garden                                |
| `Gathering`     | trees, rocks, flowers, the orchard's fruit, the snack, a bone  | bag, takings, map                          |
| `Shops`         | stock, buying, selling, the week's wanted list; sends `bought` | wallet, bag, belongings, stalls            |
| `Mailbox`       | posting and opening letters; sends `opened`                    | letters, belongings, wardrobe              |
| `Deliveries`    | Ollie's round: orders on their way, posted next morning (S1)   | mailbox                                    |
| `Catalogue`     | what she can order again, and ordering it; sends `ordered`     | wallet, belongings, deliveries             |
| `Workshop`      | Gourdon's book: any priced piece made to order (S2)            | wallet, deliveries                         |
| `Figurines`     | carving three of a kind into a figurine (C3); sends `carved`   | bag, belongings, `hasHad` (milestones)     |
| `Mystery`       | clues, Wes, the mayor's letters; hears `bought`/`opened`       | casebook, mailbox, friends, cabinet        |
| `Collecting`    | each place's critters this hour (and a lured one), the net     | bag, takings, cabinet, mailbox, `Lurer`    |
| `Fishing`       | her line in the water: the cast, nibbles, bite, reeling in     | collecting (its fish, `keep`), `eager`     |
| `Neighbourhood` | their walks in every place and room, talk, gifts, favours      | friends, bag, wallet, mailbox, `scene`     |
| `SmallEvents`   | the window's news or lost thing, the errand she carries        | wallet, takings, `thank` (friends)         |
| `Travel`        | where she is, crossings, finding and opening places, flying    | zones, atlas, movement, mailbox            |
| `Broom`         | Agatha's letter, the stand, the broom's colours, flying home   | bag, home, mailbox, travel, visits         |
| `PetCare`       | the pets, walking, patting, names, accessories, bones          | pets, bag, takings, movement, both zones   |
| `Decorator`     | picking up, moving, turning, storing pieces, home or yard      | home, yard (both `Decorable`)              |
| `Chest`         | things from her bag put away at home and taken out (0.3's H1)  | bag, home, whether she's home              |
| `Display`       | what set pieces and display pieces show (0.3's H2)             | bag, home, whether she's home              |
| `RecordPlayer`  | the next record, and the dance                                 | bag                                        |
| `Instruments`   | what `plays` (G2), lessons, the duet, learnt tunes (L2, v33)   | takings; reads places                      |
| `Poses`         | standing still, idling, rocking out; hears `thrilled`          | whether she's moving or busy               |
| `Sitting`       | the seat she's sat on (0.2's G1), never saved                  | where she is                               |
| `Interiors`     | walking up to things in buildings, and the keepsakes           | keepsakes, belongings, friendships         |
| `Digging`       | digging up what's buried, once                                 | dug, bag                                   |
| `Fossils`       | the day's mound in each place, digging it, donating (0.3's C1) | bag, takings, wallet, cabinet, zones       |
| `Forecast`      | weather and storms today (`world.weather`), telling her of it  | clock, where she is                        |
| `Hands`         | what she holds from the quick bar; a held seed's planting      | bag (a seed she runs out of is let go)     |
| `Novelty`       | what's new on each collection until she looks                  | reads bag, closet, home, cabinet, recipes  |
| `Milestones`    | shelves to finish, their letters; squishies/dolls she has had  | bag, cabinet, mailbox                      |
| `Calendar`      | the day's window, what's on today, the month; `window`         | clock, stalls                              |
| `Holidays`      | whose decorations are up, the sky, Easter's eggs, costumes     | bag, takings, where she is, residents      |
| `TrickOrTreat`  | a sweet at a neighbour's door on a festival evening            | bag, takings, residents, happenings        |
| `PumpkinPatch`  | how the farm's patch is coming on, picking from it (0.2's J3)  | bag, takings                               |
| `Finale`        | the 31st: crowning a costume, Cody's half, their photo (J4)    | takings, her look, neighbours, `thank`     |
| `Baking`        | the day's bake with Wrapunzel at Crumbs & Curios (0.2's E1)    | bag, wallet, takings, `thank`              |
| `Activities`    | the fairground's games, fortune and snack stalls (0.2's M2)    | bag, wallet, takings, weather, Agatha      |
| `Noticeboard`   | the notes on the board this window, answering them             | bag, wallet, takings, `thank` (friends)    |
| `Visits`        | visits counted by day, their gifts, Cody's greeting; `visit`   | bag, wallet, belongings, her name          |
| `CandyTree`     | shaking it (a sweet, a sapling), the saplings in her yard (E1) | wallet, bag                                |
| `HonestyStall`  | what's on the stall, its sales by window, the tin, its shelf   | bag, wallet                                |

`Neighbourhood`'s `scene` is the `TalkScene` (0.2's D2) that `build.ts` puts together at each
talk from `Forecast`, `Hands`, `Collecting.caughtToday` and `PetCare`, for what a neighbour brings
up (`systems/dialogue.ts`); it is read, never kept.

Callers (HUD Apis, the renderer, tests, smoke) go straight to the service: `world.shops.buy`,
`world.petCare.rename`, `world.decorating.start()`. There are no forwarding methods on the World.

### Zones and movement

A `Zone` (`src/world/zones/Zone.ts`, decision 78) is one place she can be: its size, what's
walkable, what's walked up to rather than onto, where to stand to use a thing, where she comes in
(`entry`) and its ways out (`doorAt`). Every place is a row in `ZONES` (`src/data/zones.ts`,
decision 90). A `MapZone` is a place outdoors drawn from a map (the town, Whisperwood, Lantern
Shore, the castle hill, the hidden clearing, the Hollow Fairground, Boo Acres), with its exits at the edges and its doors; the
town's also has the day's `Stalls` (the pop-up and the Moon Pie cart), and a place with
`lots` has `Lots` (phase T): the houses of those who once moved in later, standing from the
first day (decision 211), solid like a stall and gone into by the door in its map's `doors`. The town has `Decorations` too (phase U): the
piece standing in the square while a holiday's decorations are up, and what's set out for a
happening on its day (film night's screen and popcorn table, 0.2's J3), worked out from the day
key and solid like a stall; the fairground has its own `Decorations` for what's set out for a
happening that has moved there (0.2's M3). A way out with a `gate`
has it stand in the way, one tile in, while the place beyond is shut (`shutGates`, decision 104).
Every place has its `Mounds` (0.3's C1): today's mound on one of its map's `digSpots`, solid and
walked up to. The town's yard (0.3's H5) is solid under each piece of hers standing there. So
`MapZone.canWalk` and `propAt` ask seven overlays besides the map (the stalls, a shut gate, the lots,
the decorations, the farm's built rows, the yard, the mound). `HomeZone` is her home: the room
she's in and its furniture, and since 0.3's H4 a doorway in the front room's back wall into the
back room, crossed within `home` (`doorAt` gives a `Crossing` with a `room`, which `Travel.cross`
turns into `HomeZone.through`, which enters it), so the rooms are one place to the pets, guests and music. A `RoomZone` is the inside
of one of the town's buildings (phase H, decision 98), a fixed room from its row in
`data/interiors.ts`, with the mat back out to the door step; a fixture that is a `planter` (the
greenhouse's raised beds, 0.3's F2) is one of her beds, keyed by the room as a bed outdoors is by
its place. `Zones` holds them all by id, and
`inside(id)` and `outdoor(id)` say which kind she's in. `Movement` owns her position, facing and path, and walks in whichever zone it's handed.

`Travel` owns which zone she's in, and every crossing goes through it: a way out she arrives at, a
door, or the world map. It sends `crossed`, which the decorator, the record player and the pets
hear, and finds and opens places (decision 91), kept in the `Atlas`; it also lists the ways out
of where she is for the map (`waysOut`, decision 148). Flying is its too (decision 149): `home()`
swoops her onto her mat keeping the spot she flew from (`left`, saved), `back()` returns her to
it, and the map's `go` flies, each with a `flew` moment; `Broom` decides whether she can, and
what she calls out. Every place outdoors has its
own critters (decision 102) and gathering (trees, toadstools, flowers, keyed with the place), and
shares the day's weather (decision 107), which the critters' deal and the garden read from the day
key themselves, and the views from `world.weather`; beds
grow in town, by the creek, by the lake and in her planters (`Farm` keys them by place, decision
165), each crop a day sooner where it `thrives` and in its `season`, read from the day it was
planted (`ripeDays`, decision 176); the stalls, the snack, Wes and Fibi's bone are still only ever in town (or at home, for the
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
(`systems/happenings.ts`: the book club, the midnight bake, the seed swap…, and each big
holiday's gathering, which comes first, some of them everyone round the well, phase U), and her birthday
party over all of it. Every happening is read off the day key alone, and everyone lives in town
from the first day (decision 211), so any neighbour may be anyone's guest or host.
Where a happening stands is `venueOf` (0.2's M3, decision 202): a row with `fair` gathers before
the fairground's stage (`STAGE_SPOTS`, the contest's line-up) once the fairground is open, and
where its row says until then. `Travel` tells `systems/venues.ts` (`knowFairground`) as the world
is made and as the gate opens, and the happenings, the calendar's words (`wordsOf`), Cobweb
Corner's market table (a shelf that `moves` to the `market` shop) and the noticeboard's posters
(`postersOn`) all read it from there; nothing of it is saved.
`Neighbourhood` turns that into a tile each step (`plan`, guests after everyone else so no two
share one) and walks whoever is where she is, out by an edge, a building's door step or a room's
mat when they're going somewhere else; anyone elsewhere is simply where they should be.

### Taps and arrivals

A tap goes to `World.tapTile`: decorating takes it if she's decorating; otherwise a neighbour,
Wes, a critter, a pet, a prop, a piece or a bed on that tile becomes a **visit**, and she walks to
the nearest open tile beside it. A visit carries its `kind`, and her arrival looks it up in
`arrivals`, one handler per kind (phase K): talk, swing the net, pat the pet, tend the bed, use a
thing in a building (`Interiors`), or a piece at home (its line, and the record player); anything whose row `plays` adds a `tune` from `Instruments`. The table
is typed over every kind, so a new kind (a fishing spot, a stove) doesn't compile until it says
what arriving does. A prop, or open ground, goes through `arriveOn`: the porch pots, a mound to dig
(today's fossil mound first, `Fossils.isToday`, then the buried keys' `Digging`), a way out
(`Travel.cross`), then whatever there is to gather (the orchard's trees among it). These are a
chain of `if`s on the prop's id in `World.arriveOn` (see "Where it hurts"). A `piece` arrival is
a piece at home or in her yard: its line, the record player, a seat, or (from the `arrived`
moment in `main.ts`) a display piece's sheet. Every arrival comes from
`update`, even one with no walk, so the moments have one source.

### Saving

`World.save()` returns everything a save keeps (typed as `SaveState` less its version and
times, so a new field that isn't saved fails to compile), and `fromSave(save)` turns a loaded save
back into the World's options. `src/persistence/` owns the shape (`SaveState.ts`), the migration
chain (`migrations.ts`; 0.1's starts at version 12, decision 80), `localStorage`, and the backup
code, which runs the same migrations. A save that can't be read is moved aside, never deleted
(decision 25).

Three things are kept by the phone beside the save, never in it, and a backup code doesn't carry
them: the sound switches (`audio/settings.ts`), her rod's colour (`persistence/rod.ts`, 0.2's
K2, decision 171) and how close the camera is (`src/settings.ts`, V1's L1, decision 290), read
once in `main.ts` and handed to the fit and to Settings' View tab (`ViewApi`). The rod's is read in `wiring/apis.ts` and handed to the drawing by `paintRod`
in `render/scene.ts`, so neither the world nor the save knows it.

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
(decision 2); `render/ground.ts` bakes the ground in 8×8-tile chunks (`render/chunks.ts`, decision
138), each the first time the camera reaches it, each tile grass with its ground laid over it by
neighbour mask (`sprites/terrain.ts`, decision 93), and a frame copies only the chunks under the
view; the day the pond freezes or thaws only the chunks it touches are baked again, and a view
she has left `rest`s, letting its chunks go until she's back; `render/lighting.ts` multiplies the
hour's light over each frame. The canvas is fitted at the whole number of device pixels that
shows nearest `TILES_ACROSS[closeness]` tiles across the short side, 12 at Close (the default) and
16 at Far (`render/pixelScale.ts`, decisions 86 and 290); indoors `fitRoom` comes up to one step
closer so the room shows whole, and `main.ts` refits whenever the closeness or the room she's in
changes. Everything after the fit reads the scale through the canvas's backing size
(`screenToWorld`, `tileToClient`), so nothing else knows it. A room stands in a house
(`drawRoomFrame`, `sprites/roomSurround.ts`) rather than a void.

**Everything in the world is drawn at 32** since phase L, which redrew the last of version 0's
props and removed the bridge that baked old grids at 2× (decisions 86, 108). Item icons and the
pets' speech bubbles are still 16-pixel grids on purpose (decision 105): the HUD bakes them at 1×,
and the world at `ICON_SCALE` through `bakeIcon` (`render/items.ts`), so the scale belongs to where
a grid is drawn, never to the grid.

**See-through trees** (0.3's A3, decision 222) are view state, never the world's: after
`OutdoorView.draw` sorts what stands in a place, `coveredCrowns` (`render/occlusion.ts`) counts the
pixels each crown draws over her or over something near her she might want, from each sprite's
mask (read once and kept), and `SeeThrough` eases each such crown to half alpha by the fixed step,
as the camera is. A faded crown is a copy in the frame's own list. **Her yard** (0.3's H5) is drawn
among the town's props by `render/yard.ts`. **At home** (0.3's H3, S4) a small piece on a surface
is drawn raised just after it; a window wallpaper's windows are hung by `windowsAlong` and painted
with the sky of the hour and weather (`windowSky`, read off the same `Daylight` the room is lit
by) into the room's cached shell; and a `WATCHERS` piece is drawn looking toward her.

**Life and weather** (phase L, decisions 107–108) are drawn over the baked ground each frame, only
where the camera is: `render/life.ts` works out once per place where its open water, its tufts of
long grass and its chimneys are (`lifeOf`), and draws glints, swaying grass and smoke;
`render/weather.ts` covers the frame with repeating tiles of rain and its splashes, or two layers
of drifting fog, anchored in the world, and greys the light by a `tint` through `drawLight`. On a
stormy day (0.2's K1, decision 170) `drawFlash` brightens the frame over the light when
`world.weather.sinceFlash()` says a flash was just now; the flashes are worked out from the clock
(`systems/weather.ts`), and `Forecast.check` pushes the `thunder` moment its rumble plays on. The
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

**The effects layer** (V1's E1, decision 280): `render/effects.ts` is one queue of pops,
pooled particles and emotes, made in `main.ts`, stepped by the fixed step after the world and
drawn last by every view, each drawing its own place's. What a moment looks like is
`effectsOf` in `wiring/effectsOf.ts`, which `playMoments` pushes from; the world only says
where (a moment's tiles, `arrived.toward` for what she walked up to), never what's drawn. A new
moment's look is a case there; a new effect kind is a `MOTION` row and its art in
`sprites/effects.ts`.

## The HUD

An HTML overlay, `pointer-events: none` except its controls. Each sheet takes an Api interface
(`ShopApi`, `HomeApi`, `PetApi`, `CraftApi`, `TalkApi`, `MailApi`, `CabinetApi`, `MysteryApi`,
`MapApi`, `FarmApi`, `BagApi`, `LookApi`, `SaveApi`, `SoundApi`, `CalendarApi`, `NoticeApi`,
`StallApi`, `BarnApi`, `NeighboursApi`, `FairApi`, `BroomApi`, `RodApi`, `TitleApi`, `NotesApi`,
`DisplayApi`, `CatalogueApi`, `MealsApi` (the top bar's meal chips), and
`QuickApi`, `BedApi` and `FreshApi` for the quick bar, a bed's card and the dots on the corner
buttons), which `sheetApis` in
`wiring/apis.ts` builds from the world's services (the save's and the sound's are `main.ts`'s), so a
sheet is testable with a stub and never reaches into the world. The world's moments, from the loop
or from a sheet, go through `playMoments` (`wiring/moments.ts`): each one's cue, the sheet it
opens, and its toast. A bed's card (phase P) is the one piece of the HUD that follows the world:
`main.ts` tells it each frame where its bed is on the page (`hud.placeBed`), and where she is
(`hud.playerAt`), so a toast can keep out of her way. The toast line is `hud/ToastLine.ts`: one
toast at a time, for as long as it takes to read, and gone at a tap on it (decision 140).

Since phase M every sheet is one design (decision 109): `openSheet` (`hud/dom.ts`) returns a head
that stays put, a body that scrolls and a foot whose Done comes last, and a sheet fills those
rather than building its own frame. Since 0.2's U2 (decision 179) the frame also owns a picture
beside the title and a sheet's tabs, a panel each in the body (`sheet.panel(id)`), so no sheet
draws its own head or tab row. The five collections (bag, closet, storage chest, Cabinet,
workbench) are `collection()` (`hud/collection.ts`), whose rule is the pure `arrange` (filter,
search, order); each sheet hands it its entries and how to draw one. An icon is always drawn at
1× by the renderer and sized by `fitIcon` to the largest whole scale that fits its box, so the HUD
has one rule for icons whatever size a grid is. A thing tapped in her bag, in the bag or at the
shop's Sell tab, is one card in the foot (`hud/itemCard.ts`, decision 146), so it's in sight
however full the bag.

Since 0.2's U1 the HUD is a frame (decisions 135, 147): a grid of a bar along the top (her Candy,
the day's chip, the month's trim, Settings), the world's room (`hud.viewport`) and a bar along the
bottom (the quick bar outdoors, or the decorating bar while she decorates, over the menu row of
the bag, closet, map and book). `main.ts` fits the canvas to the room at a whole device pixel
(`placeBetweenBars`, then `fitPixelScale`) whenever the root or the room changes size, and every
view already maps taps and sizes its camera from the canvas's own box, so nothing else had to
know. The toast, the fade and the install hint live in the room; a bed's card keeps to it.
Decorating takes the menu's row rather than adding one, so the room doesn't jump when it starts. Since
0.2.1 (decision 159) the bottom bar is one row: outdoors the quick bar takes it, with the bag and
a ☰ tray for the closet, map and book at its end (`data-compact` on the bar, set from the quick
bar's visibility); on a phone on its side a media query puts both bars side by side in one strip
along the bottom (decision 160), so the room keeps the whole width and nearly all the height,
and a sheet there is two columns the whole height, its head (scrolling if crowded) and foot down
the left and its body on the right (decision 178).

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

Phase V (2026-09-29), the last review before 0.1. Measured beside `v0.1-dev`, alternating, two
runs each: town draw mean 55–56.5 ms against 55–56.7 (p50 33 on both), home 35.1–35.4 against
35.8–37.1, updates 1.1 ms in town and 1.3 at home on both, the heap 13.1–13.2 MB on both, so the
balance and the art pass cost nothing. Against phase K, on this day's slower container: each
town update has grown from about 0.3 to 1.1 ms (phases S to U: neighbours walked by schedule in
every place, their happenings, the lots and the holidays' checks), still two steps a
frame at well under a tenth of it throttled; the heap has grown from 10.1 to 13.1 MB (the art of
phases L to U, the lots' houses and homes, the holidays' pieces), each baked once.

Session A1 of 0.2 (2026-09-30) baked the ground in chunks (decision 138). Measured beside a
worktree of `v0.2-dev` on the same machine, alternating, two runs each: town draw mean 60.2–61.3 ms
against 58.8–59.8 (p50 34.4–36.3 against 33.6–35.1; up to two dozen `drawImage`s of a chunk a
frame instead of one of the map, a millisecond in a container that draws in software and within
its noise), home 37.5–38.1 against 37.6–37.9, updates unchanged, the JS heap 0.1 MB higher (13.3
against 13.2 MB, the chunks' bookkeeping). The ground's canvas memory, which `npm run perf` now
prints as `groundMb`: 7.44 MB after perf's walk round the whole town (32 of 35 chunks baked)
against the one canvas's 7.8 MB, 3.8 MB at boot (15 chunks under the view), and 0 while she's at
home, where the one canvas was kept for good; a winter's day no longer bakes a second one.

0.2's V1 (2026-10-01), the review before 0.2.4, after the three lanes (U2–U4, G2, L1, L2,
M1–M3). `npm run perf` now walks the fairground as well, after the town and her home. Measured
beside 0.2.3 (`origin/main`) on the same machine, alternating, two runs each: town draw mean
55.4–59.9 ms against 58–60.2 (p50 35.1–37.8 against 36.5–38.4), home 34 against 31.3–32.4 (p50
22.6 against 21), so no frame doubled and the draws are within the day's noise; each town update
unchanged (1–1.1 ms against 1–1.05), each one at home about 0.15 ms dearer (1.31–1.34 against
1.15–1.16: Boothoven is walked, and every happening now asks `venueOf` where it is); the JS heap
1.1 MB higher (17.3–17.6 against 16.2 MB in town), the fairground's map, art and rows, Boothoven's
house and parlour, and the lanes' sheets. The fairground itself draws like the town: 55.2–55.6 ms
mean (p50 35.1–35.4), updates 1–1.04 ms, its ground 3.98 MB of chunks after the walk (20 of them).
Its string lights are drawn into the poles' own sprites, baked once, so they cost no pass over
the frame.
Since 0.1's phase V the heap has grown from 13.1 to 17.5 MB, the art and rows of 0.2's sessions,
each baked once.

0.3's V1 (2026-10-05), the review before the 0.3 release, after its five lanes. `npm run perf`
now walks four scenes more after the fairground: Whisperwood (its trees, the see-through crowns of
0.3's A3), Boo Acres, her yard with all ten outdoor pieces out (the town, walked within a few
tiles of her house) and her back room built, papered with arched windows and holding all 52
pieces of the eight furniture sets it would take; a build without a scene skips it. Measured
beside 0.2.5 (a copy of `main`) on the same machine, alternating, two runs each, at 21:30:

| Scene       | Draw mean (p50) 0.3 → 0.2.5       | Update mean 0.3 → 0.2.5 | Heap 0.3 → 0.2.5 |
| ----------- | --------------------------------- | ----------------------- | ---------------- |
| Town        | 59.4–59.7 (41) → 57.3–58.1 (40)   | 1.1 → 1.0–1.05          | 20.8 → 17.3 MB   |
| Home        | 31.4–32.3 (21) → 29.2–30.1 (19.5) | 1.1 → 1.0               | 21.2 → 17.7 MB   |
| Fairground  | 43.7–45.2 (31) → 42.1–44.9 (29)   | 0.82–0.87 → 0.76–0.81   | 21.1 → 17.8 MB   |
| Whisperwood | 52.3–54.8 (37) → 54.1 (35.5)      | 0.87–0.92 → 0.82–0.85   | 21.2 → 18 MB     |
| Boo Acres   | 42.7–47.3 (31)                    | 0.76–0.87               | 21.3 MB          |
| Her yard    | 59.7–60 (43.5)                    | 1.06–1.08               | 21.4 MB          |
| Back room   | 36.8 (25)                         | 1.38–1.43               | 21.5 MB          |

No frame doubled. Every draw is within a few milliseconds of 0.2.5's, the container's day-to-day
noise: Whisperwood, where the crowns fade as she passes under them, draws as it did before the
see-through pass; the yard's ten pieces are drawn among the town's props for what the town costs;
and a back room crammed with set pieces under a window paper draws about 5 ms dearer than her
front room (each piece is a baked sprite, and the windows' sky is baked into the room's shell,
cached by the sky). Each update is about a tenth of a millisecond dearer, and the back room's
about 0.4 (more pieces for the pets' floor and her path to go round). The JS heap is 3.5 MB
higher (20.8 against 17.3 MB in town), the art and rows of 0.3's lanes (the sets, the crawlies,
the fossils, the figurines, Boo Acres and Scarah), each baked once.

V1's E1 (2026-10-07), the effects layer. `npm run perf` walks as before (her footfalls kick up
dust outdoors; nothing else she does there is a moment). Measured beside `v1-dev` on the same
machine, alternating, two runs each, at 21:30:

| Scene       | Draw mean (p50) E1    | v1-dev                | Update E1 → v1-dev    | Heap E1 → v1-dev    |
| ----------- | --------------------- | --------------------- | --------------------- | ------------------- |
| Town        | 45.5–51.8 (34–38.7)   | 47.6–48.3 (34.4–34.6) | 0.87–0.98 → 0.87–0.9  | 21.2–21.8 → 21 MB   |
| Home        | 25.2–30.4 (18.5–21.3) | 25.5–28 (18.3–19.9)   | 0.8–0.96 → 0.75–0.87  | 21.5 → 21.4 MB      |
| Fairground  | 33–36.3 (25.2–28.1)   | 34.9–35 (25.2–25.4)   | 0.6–0.64 → 0.61       | 21.6 → 21.6 MB      |
| Whisperwood | 41.1–43.7 (31.6–33.3) | 42.1–43.3 (30.9–31.8) | 0.63–0.68 → 0.62      | 21.6–21.9 → 21.5 MB |
| Boo Acres   | 31.4–37.8 (24.5–28)   | 32.5–34.4 (24.4–25)   | 0.55–0.64 → 0.54–0.6  | 21.5–21.8 → 21.5 MB |
| Her yard    | 45.3–51.1 (34.5–39)   | 46.5–50.3 (36.2–37.9) | 0.82–0.86 → 0.85      | 21.6–21.9 → 21.4 MB |
| Back room   | 29–29.1 (22.7–22.9)   | 26.3–29.6 (20.4–22.1) | 1.06–1.22 → 1.06–1.12 | 21.9–22 → 21.8 MB   |

No frame doubled and no pass was added: the second runs of each sit within or under the
first runs of the other, the container's noise. The layer draws a few baked sprites where
something happened and nothing when nothing is; its art is baked once, and the heap is within a megabyte of before.

**V1's baseline is at Close** (L1, 2026-10-07, decision 290): every later V1 session measures
against these numbers. `npm run perf` now opens at Close, as a new phone does; `npm run perf --
--view=far` measures Far, the view of every row above. Measured on `v1-dev` with E1's effects in
and L1 merged, two runs each, alternating Close and Far, same machine, at 21:30:

| Scene       | Draw mean (p50) at Close | Draw mean (p50) at Far | Update mean Close / Far | Heap  |
| ----------- | ------------------------ | ---------------------- | ----------------------- | ----- |
| Town        | 28.6–29.3 (21.2–22)      | 49.1–50 (35.4–36.2)    | 0.87–0.93 / 0.89–0.95   | 21 MB |
| Home        | 16.5–17.2 (11.1–11.3)    | 15.2–16.6 (10.1–10.6)  | 0.8–0.83 / 0.68–0.85    | 22 MB |
| Fairground  | 19.3–20.1 (13.6–14.1)    | 35.8–37.5 (26–27.1)    | 0.61–0.65 / 0.62–0.71   | 22 MB |
| Whisperwood | 23.2–23.3 (16.8–17)      | 44.5–46.1 (32.8–33.7)  | 0.6–0.61 / 0.67–0.7     | 22 MB |
| Boo Acres   | 18.2–19.3 (13.1–13.6)    | 36.6–36.9 (26.2–26.9)  | 0.57–0.59 / 0.65–0.68   | 22 MB |
| Her yard    | 30.4–31.7 (24.4–25.5)    | 52.3–52.6 (39.1–39.7)  | 0.78–0.88 / 0.92–0.93   | 22 MB |
| Back room   | 19.9–20.6 (13.9–14.4)    | 20.7–21.3 (14.7–15.1)  | 1–1.11 / 1.09–1.15      | 22 MB |

Close draws outdoors in a little over half Far's time: the canvas is 390×724 game pixels against
585×1086, so every full-frame pass (the ground's chunks, the light, the glow layer) touches 2.25
times fewer pixels, and fewer props and neighbours are on screen. The ground keeps fewer chunks
(6.38 MB in town after the walk, 27 of them, against 7.44 MB and 32). Her rooms draw alike at
either, since a room is fitted at scale 3 either way on this phone (her first room and the back
room are 13 and 11 tiles); the house round a room is four baked images and a pattern fill, a
millisecond at most (her home's draw is within a millisecond at either, the house included). So
the closer camera buys headroom for L3's light and the passes after it rather than costing it:
measure a new pass at Close, and at Far as the worse case.

**E2's poses** (2026-10-07, decision 281) add no pass: an action, a breath or a blink is another
baked picture of her, and the tipped can one more drawable. Two runs each at Close and Far with
L3's session running beside it on the same machine: town 28.1–30.9 (21.3–22.9) at Close and
45.7–50.1 (34.2–37.9) at Far, home 14.7–15.1 / 15.6–16, the fairground 17.8–18.3 / 33.9–37,
Whisperwood 21.8–25.2 / 42.5–52.1, Boo Acres 18.8–19.4 / 33–36.3, her yard 30.8–36.9 /
47.4–55.2, the back room 20.4–20.6 / 17.5–18.8; updates 0.5–1.1 ms. Within the baseline's spread
and the container's noise.

V1's L3 (2026-10-07, decision 291), the light: a grade by hour, dithered lamp pools, bloom, a
night vignette, moon rims, cloud shadows and wet ground. One pass is added over the frame at
night and in the golden hour and dawn (the grade's `screen` or `color-burn` fill over the
shadows); the vignette and clouds are folded into the light map, its base cached until the
hour's colour changes; bloom is a cached halo per glowing sprite in the glow layer, and the
moon's rims a cached copy per sprite. By day, with nothing lit and no vignette, there is no map:
the light and clouds are one tile multiplied straight over the frame, where before midday drew
nothing at all. Measured beside a copy of `v1-dev` on the same machine, alternating, two runs
each at 21:30 (`npm run perf`, `-- --view=far`) and one each at noon (`-- --hour=12`), while
lane 1's session ran beside it:

| Scene       | Close, L3             | Close, v1-dev         | Far, L3               | Far, v1-dev           | Noon at Close, L3 / v1-dev |
| ----------- | --------------------- | --------------------- | --------------------- | --------------------- | -------------------------- |
| Town        | 29.1–31.6 (22.3–23)   | 23–29.6 (17.9–23.6)   | 47–60.2 (33.9–42.3)   | 46–48.2 (34.6–34.9)   | 13.4 (8.3) / 10.6 (8.5)    |
| Home        | 16.3–18.6 (11.2–12.5) | 13.4–17.4 (10–11.6)   | 17.1–17.8 (11.1–12.1) | 14.6–15.5 (10.1–11)   | 4.7 (2.2) / 3.2 (1.9)      |
| Fairground  | 18.7–19.4 (14–14.5)   | 16.8–21 (12.9–15.3)   | 35.5–44.8 (26.2–31.5) | 32.7–37.1 (25.4–27.6) | 5.9 (2.6) / 4 (2.6)        |
| Whisperwood | 21.3–25 (16.2–17.5)   | 16.7–21.5 (13.9–16.5) | 41–54 (29.6–37.8)     | 36.8–46.4 (28.4–34.8) | 8.3 (3.7) / 5.7 (3.4)      |
| Boo Acres   | 16.8–18.9 (12.5–14.2) | 15.4–19.6 (12.1–14.6) | 35.4–36 (25.5–26.7)   | 30–38.1 (23.5–27.9)   | 7.2 (3.6) / 5.1 (3.5)      |
| Her yard    | 30.2–33.5 (25.7–28)   | 26.6–29 (21.4–23.7)   | 49.4–54.4 (37.3–40)   | 41.4–52 (33.3–40.8)   | 14 (10.1) / 12.5 (10.1)    |
| Back room   | 20.4–25.9 (14.9–18)   | 17.7–22 (13.3–15.6)   | 18.5–20.7 (14.1)      | 16.5–21.9 (12.4–16.1) | 8.1 (4.4) / 7.1 (4.9)      |

Draw means, ms (p50). No frame doubled: at night the light costs about 2–4 ms more at Close
and a few at Far, the grade's one fill and the bloom's copies, inside the runs' own spread; the
heap is unchanged (21–22 MB). Noon costs 1–3 ms more than the nothing it drew before, its
medians the same. A full moon's night (`-- --day=2026-10-26 --hour=22`, its rims on every
sprite) drew the town in 27.9 ms (19.9), no dearer than a plain night. A first version laid the
day's light through the map like the night's and cost noon 14 ms in town: copying a canvas the
frame's size and multiplying it over is two passes, where one tile multiplied over is one.

**E3's neighbours alive** (2026-10-07, decision 282) add no pass: a breath, a blink, a wave, a
seat and a job are baked pictures like a walk frame (a few more per neighbour, baked the first
time each is drawn), a stroll is a walk, and chatter is an emote in E1's layer. A first version
asked each step for the seat beside every neighbour's stop and cost the town's update about a
millisecond (`MapZone.propAt` searching the props round each); seats and strolls are now found
once a stop. Two runs each at 21:30 with lane 5's session running beside it (draw means, ms, p50):

| Scene       | Close, E3             | Far, E3               | Updates   |
| ----------- | --------------------- | --------------------- | --------- |
| Town        | 30.5–31.1 (22.2–23)   | 53.4–53.7 (36.9–37.6) | 0.87–0.93 |
| Home        | 17.4–17.6 (11.1–11.3) | 16.5–17.7 (10.3–11.1) | 0.67–0.79 |
| Fairground  | 20–20.4 (13.8–14.1)   | 40.5–41.1 (27.9–28.4) | 0.55–0.68 |
| Whisperwood | 22.9–23.7 (15.8–16.4) | 47.6–48 (33–33.4)     | 0.5–0.65  |
| Boo Acres   | 19.9–20.3 (13.6–14.1) | 39.7–40.3 (27.1–27.3) | 0.52–0.64 |
| Her yard    | 32–32.9 (25.2–25.9)   | 56.4–56.8 (40.7–41.3) | 0.87–1.02 |
| Back room   | 21.6–22 (14.7–14.8)   | 21.9–22.5 (14.7–15.3) | 0.97–1.08 |

Within L3's runs at Close everywhere; at Far Boo Acres and her yard came out a few ms over L3's
two runs, with the town, fairground and Whisperwood inside theirs, and no frame doubled; the
heap is unchanged (22–23 MB).

**E4's taps and transitions** (2026-10-07, decision 283) add no pass in play: a tap's ring and
brackets are a few 2-pixel rects for under a second, and the iris, the broom's flight and a
window's wash (`render/transition.ts`) are drawn by `main.ts` over the view only while one is
under way, a few hundred milliseconds; the copy of the frame she left is made once as she goes
and let go when the iris has opened. Two runs each at 21:30 with lane 5's session beside it
(draw means, ms, p50; the walk goes through the house's door, so its irises are in these):

| Scene       | Close, E4             | Far, E4               | Updates   |
| ----------- | --------------------- | --------------------- | --------- |
| Town        | 29.7–30 (21.4–21.8)   | 53.1–54.1 (37.3–37.7) | 0.84–0.97 |
| Home        | 18.2 (11–11.1)        | 17.9–18.8 (10.6–11)   | 0.69–0.77 |
| Fairground  | 20–20.1 (14–14.1)     | 39.2–40.4 (27.1–27.9) | 0.53–0.61 |
| Whisperwood | 23.6–24.6 (16.5–17)   | 48.3 (33.6)           | 0.58–0.63 |
| Boo Acres   | 19.6–20.2 (13.4–13.9) | 40.1–40.7 (27.3–27.7) | 0.51–0.63 |
| Her yard    | 32–32.1 (24.7–25.4)   | 55.3–56.3 (40.5–40.9) | 0.85–0.97 |
| Back room   | 22.1–22.5 (14.9–15.2) | 20.8–22 (13.9–14.8)   | 0.92–1.1  |

E3's runs to within a millisecond everywhere, no frame doubled, the heap unchanged (22–24 MB).

**S1's sound** (2026-10-07, decision 321) adds no pass and nothing to `world.update`: the audio
graph is built once on her first touch, a bed of ambience once as it comes in (its slow
oscillators do the moving), and `Hearing.step` compares a tile and a time each step, reading the
ambience again only when she changes tile or a minute passes. One run at 21:30 at Close with
lane 1's session beside it, updates: town 0.76, home 0.63, the fairground 0.55, Whisperwood
0.52, Boo Acres 0.53, her yard 0.75, the back room 1.1 ms, inside E3's 0.5–1.08 (the perf page
never touches the screen, so no audio context starts there; what it measures is the reading).

## Where it hurts

Honest notes for whatever comes after 0.3, most pressing first, rewritten at 0.3's V1 after its
five lanes. Of 0.2's list, W1 closed the long constructor (decision 218: the world made by area);
what's still true of the rest is folded in below.

1. **Arriving at a prop is a chain of `if`s.** `World.arriveOn` asks the prop's id in turn: the
   porch pots, the candy tree, a sapling, the pumpkin patch, the honesty stall, a goose, a mound
   (today's fossil first, then the buried keys), a door, then gathering (the orchard among it).
   The order matters (a fossil mound and a key's mound are the same prop), and each feature that
   does something on arrival has added a line. The next one should make them a table keyed by
   prop id, as phase K made `arrivals` a table keyed by visit kind, with the mound's two owners
   asked in one handler.
2. **`MapZone` asks seven overlays where it can walk.** `canWalk` and `propAt` each check the
   stalls, a shut gate, the lots, the decorations, the farm's built rows, her yard (H5) and
   today's mound (C1) after the map, and `tests/data/zones.test.ts` and `digSpots.test.ts` keep
   them out of one another's way. A new thing standing in a place should make them a list of
   overlays, each with its own `propAt` and `blocks`, rather than an eighth line in both.
3. **Her home's bed key doesn't know the room.** A planter's bed is keyed `home` and its tile,
   so planters stay in the front room (`refusesHere`, decision 233) and the greenhouse's raised
   beds are keyed by their own room. A planter in the back room needs the key to carry the room,
   a save change; until then the refusal says so kindly.
4. **`Home` holds four features.** Her rooms (H4), the chest's two lists (H1), what's on show
   (H2) and what stands on what (H3) are one 480-line keeper, with `Yard` beside it reusing the
   surface rules from `systems/decor.ts` through `Decorable`. The rules are in `systems/` and
   tested there, so it reads well; a fifth (a second chest, a room of the yard's own) should take
   rooms out into a `Room` keeper of their own first.
5. **Big view and wiring files.** `render/OutdoorView.ts` is about 990 lines (the yard, the
   mounds, the see-through crowns, the fishing line, film night and the fountain all hand it
   something to sort), and `wiring/apis.ts` about 700 (every sheet's Api in one `sheetApis`).
   0.3's lanes drew new things in files of their own (`render/yard.ts`, `render/fossils.ts`,
   `render/occlusion.ts`), which is the way; `apis.ts` could be split by area as `world/areas/`
   was, the next time a sheet is added.
6. **Every full-frame pass costs a few milliseconds on a slow phone.** The ground is baked in
   chunks (decision 138), and the window wallpapers' skies are baked into a room's shell, cached
   by the sky, so they add no pass; but the rain or fog and the light are each a pass over the
   frame, a few milliseconds in a container that draws in software. The see-through crowns count
   mask pixels each frame only for crowns near her, and cost nothing measurable in perf's walk of
   Whisperwood (above); a festival's sky that adds a pass should be measured first. Since L3
   (decision 291) the light is a pass at every hour (by day one tile multiplied over the frame),
   and the night has the grade's one fill over its shadows besides; a canvas the frame's size
   copied onto another and then drawn over the frame costs two, so fold a new full-frame look
   into the light map's cached base, or into the day's tile, rather than a canvas of its own.
7. **The areas' order still matters.** A service listens for a signal in the order it was made,
   so one that hears a signal another already hears goes in an area made after it, and the
   honesty stall is made with the workbench (decision 218). 0.3 added services to six areas and
   moved none.
8. **Tests go through the whole world, and the suite has grown.** About 1,800 tests in 150
   files now take about 90 s in the container (24 s at phase K), most of it building worlds
   through `harness()` and the rarity test's simulated years. Services are made from plain parts
   and could be tested alone; a fiddly new rule should get a direct test as well, and a slow file
   should share one world across its cases where they don't touch each other.
9. **Big data files.** `sprites/items.ts` and `sprites/doll.ts` are about 2,600 lines each,
   `data/villagers.ts` 1,600, `sprites/sets.ts` and `setsTwo.ts` over a thousand, `types/ids.ts`
   1,200. Fine as data; a redraw should split items by family and draw with `Sketch`, as phase J
   did for furniture and the 0.3 sets did (a file per lane's art). C3's `FigurineId`, worked out
   from the rows it's carved from, is the way to keep an id union from growing by hand.
10. **The town's legend is running out of characters.** About a dozen single characters are left
    in `data/maps.ts`'s shared legend. The fairground (`FAIR_LEGEND`) and Boo Acres
    (`FARM_LEGEND`) have legends of their own, which is the way for the next new place.
11. **The talk sheet grows a pair per feature.** Crowning a costume, baking, a lesson and their
    photo are each a `canX`/`X` pair on `TalkApi` (still four after 0.3); the next should make
    them a list of talk actions that `apis.ts` builds and the sheet draws.
12. **What she ate isn't saved** (A4, decision 223): after a reload a meal's chip shows the first
    dish with the same effect. One optional field in `kitchen` for the next session that changes
    the save anyway.
13. **Pets walk tile to tile.** She and her neighbours walk paths pulled taut; the pets' pottering
    would look smoother the same way (`stringPull`), if an art pass wants it.
