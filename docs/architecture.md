# Architecture

How McFrancisVille is put together, as of V1's review (the review before 1.0, after the V1 plan's
five lanes and 29 sessions; before it, 0.3's V1, 0.2's V1 and phase V of `docs/v0.1_plan.md`). Read it before
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
wiring/                  the sheets' Apis by area, each moment played, the save kept, touch
main.ts                  runs it: the boot, the loop and the views
api/  (outside src/)     the cloud save's one function, its own tsconfig (V1's S2, decision 323)
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
  the layers meet, and so may the phone's own keepers beside the save (`safekeeping.ts`,
  `errorNotes.ts`) and the build's `precache.ts`. `api/save.ts` imports nothing from `src/` (the
  sealed save is opaque to it); the client is `persistence/cloud.ts`.
- V1 added no import across the layers: its effects layer is `render/`'s, its faces and frames
  `sprites/`', its rules (`systems/firstDay.ts`, `today.ts`, `rareEvents.ts`, `projects.ts`,
  `affection.ts`, `catchSize.ts`, `drift.ts`, `moods.ts`, `voice.ts`, `mayor.ts`, `cody.ts`…)
  `systems/`', read by services in `world/` and drawn or shown by `render/` and `hud/` as before.

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
stove and `Belongings`), `passive` (visits, the candy tree), V1's `firstDay` (`FirstDay`, R1,
reading the stall, the tree and the visits), `places` (the zones and stalls), the everyday
services the constructor makes itself (the garden, the barn, gathering, the shops, the mailbox and
V1's `Projects`, over the `Works` keeper and the `Sites` overlay), `shopping` (Ollie's deliveries
and catalogue, 0.3's S1, after the mailbox; Gourdon's book, S2; his figurines, C3), `neighbours`
(since 1.1's W3 `Talk` first, then the `Neighbourhood` that reads it), `mystery`, `festivals`
(`calendar.ts`), `outdoors` (weather, fountain), `fairground`, `catching` (`collecting.ts`: the
net, the rod and, since 0.3's C1, the fossils; since 1.1's W1 the buried keys' `Digging` too, so
the mound's two owners are in one area), `going` (`travel.ts`: her movement, travel, the broom),
the world's own reset as she crosses, `homeServices` (`home.ts`: decorating, the record player,
what plays, and since 0.3's H1 and H2 the chest and what's on show), `petServices` (`pets.ts`),
`her` (hands, novelty, milestones, sitting, poses), and V1's `upNow` (`UpNow`, R2: Today, a plain
read of the services made before it), in that order. V1 also put `Joining` (P4's verbs at a
happening), `PostRound` (Ollie's walk to her box) and `Marriage` (P5) in `neighbours`, and
`RareEvents` (R3) in `festivals`: a service listens for its signals in the order it was made, and
anything made later is read through a function.

**The order is named once** (1.1's W3, decision 342): `AREAS` in `src/world/areas/order.ts`, a row
a step, each with what its services listen for on each bus (`signals`, `state`) in the order they
start to, and why it stands where it does; the constructor's own two steps (`everyday`, `forget`)
are rows too. The constructor tells `options.areaMade` after each step, and
`tests/world/areaOrder.test.ts` holds the steps made in `AREAS`' order, each listening for exactly
what its row says in that order (so who hears her cross, a letter opened or the bag first is
read off the table: `crossed` the neighbourhood, the reset, the record player, decorating, the
pets; `opened` the mystery, then the broom; `bag` `Belongings`, the first day, hands, novelty,
milestones), and nothing sent on either bus while the world is made, so no service made later
misses one. A new service is a line in its area's function and its interface, a field here and
its assignment, and, if it listens for anything, a word in its area's row; one that must hear a
signal after another goes in a later area. An area whose service does
something when she walks up to a prop also returns its rows of the arrivals table (`arrivals`, a
`PropArrivals`, 1.1's W1, decision 340), which the constructor joins into `propArrivals` with
`arrivalsOf` (see "Taps and arrivals"). The options a world is made
from (`WorldOptions`, `fromSave`) are `src/world/options.ts`. What the services that talk with
her neighbours read of the town (her name, where she is, where a neighbour is, their hearts,
whether they live here, and `thank`) is one `TownReads` object made at the top of the constructor
and handed to each in `Shared`, so a new one takes it rather than writing the same six functions
again. `build.ts` is about 540 lines, the constructor about 180 of them (1.1's W3 added a line
telling `areaMade` after each step). `src/world/World.ts`
(about 580 lines, from 884 at 0.1's end and 1,686 as `Town`) extends it: it turns a tap into a walk and a walk's end into an
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
`wiring/music.ts` (`Music`, 1.1's W3) names a `MusicKey` from the zone, the window (`windowOf`) and an `Occasion` (the
festivals, the decorations, and whether `world.fountain` is playing), and the `SoundBoard`
crossfades to it (decisions 172, 173), so `audio/` still reads no rule. The one thing back the
other way is the music's beat (`SoundBoard.musicBeat`), which `Music.fountainBeat` hands the
town's view for the fountain's lamps to pulse to (`fountainBeat`); the view never imports `audio/`.
The ambience is told the same way (V1's S1, decision 321): `wiring/hearing.ts` reads the place,
the hour, the weather and how near water she stands when she changes tile or place (or once a
minute), and hands `SoundBoard.setAmbience` a `Bed` from `ambienceFor`; it also counts her
footfalls off her walk cycle into `SoundBoard.footstep`. Inside `audio/`, `graph.ts`'s `Mixer`
is the node graph (buses, compressor, reverb, a voice per note) and `SoundBoard` only what
plays when, so a script can build the same graph on an `OfflineAudioContext` to measure it.

### Keepers and services

A **keeper** holds state and its snapshot, and checks what it's given: `Bag`, `Wardrobe`, `Farm`,
`Home`, `Rooms`, `Yard`, `Friends`, `Letters`, `Cabinet`, `Pets`, `Casebook`, `Atlas`, `Porch`, `Keepsakes`,
`Dug`, `Lately`, `Works` (in `src/world/`; `Lately`, V1's P1, keeps the last piece she placed, crop she picked and thing she gave the museum, for her neighbours to remember, and since P5 her answer to Cody's "how was your day?" and the scenes of their story told; `Works`, V1's R4, the project under way, what she has given each and what's built). V1 also grew keepers' snapshots rather than adding keepers: `Friendship` keeps the moments told and the question answered (P1, P2), the `Casebook` the chain's clues and Wes (P3a), the `Cabinet` each fish's best (R6a), `Pets` each pet's fondness (R6c). Her rooms (0.3's H4) are `Rooms` since 1.1's W2 (decision 341, `src/world/Rooms.ts`): each
room's pieces, with what a display piece shows (`Placed.shows`, H2) and what stands on a surface
(`Placed.on`, H3), since both belong to the piece, its paper, floor and size, and `here`, the one
she's in, which everything that reads "the room" reads; building a room, growing the front one,
and the decorating moves. `Home` is what the rooms share: the storage chest's furniture and her
things from her bag (`stored`, `items`, H1), and the papers and floors she owns, with its rooms
as `home.rooms`; whatever reads the room she's in reads it there (`home.rooms.placed`,
`home.rooms.room`, `home.rooms.pieceAt`…), `Home` having no forwarding reads since 1.3's F6
(decision 365).
`Yard` keeps what stands on the grass round her house and puts what it takes out and away
through `Home`'s chest (H5). `Rooms` and `Yard` are both `Decorable`, so `Decorator` works on
whichever she's in, and both take the chest rather than owning one. A keeper doesn't
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
| `Neighbourhood` | where each is, and their walks in every place and room         | friends, `Talk`, `errand`, `pets`          |
| `Talk`          | the hello, heart moments, questions, replies, gifts, favours   | friends, bag, wallet, mailbox, `scene`     |
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
| `RareEvents`    | today's rare event, passers-by, a stray, arrivals told (R3)    | bag, takings, wallet, mailbox, stalls      |
| `Baking`        | the day's bake with Wrapunzel at Crumbs & Curios (0.2's E1)    | bag, wallet, takings, `thank`              |
| `Activities`    | the fairground's games, fortune and snack stalls (0.2's M2)    | bag, wallet, takings, weather, Agatha      |
| `Noticeboard`   | the notes on the board this window, answering them             | bag, wallet, takings, `thank` (friends)    |
| `Projects`      | the town's projects: starting one, giving, building it (R4)    | `Works`, bag, wallet, mailbox, yard        |
| `Visits`        | visits counted by day, their gifts, Cody's greeting; `visit`   | bag, wallet, belongings, her name          |
| `CandyTree`     | shaking it (a sweet, a sapling), the saplings in her yard (E1) | wallet, bag                                |
| `HonestyStall`  | what's on the stall, its sales by window, the tin, its shelf   | bag, wallet                                |
| `Fountain`      | whether the music box plays now (0.2's H2), read off the clock | where she stands outdoors                  |
| `FirstDay`      | Cody's list for her first day, its steps and gifts (V1's R1)   | bag, wallet, mailbox; reads the town       |
| `UpNow`         | Today's lines, worked out from the services when asked (R2)    | a `TodayFacts` read (`areas/upNow.ts`)     |
| `Joining`       | the verb at each happening and what the host remembers (P4)    | bag, `JoiningReads`; `happenings` saved    |
| `PostRound`     | Ollie walking a letter to her box when one comes (P4)          | `posted` signal, where she and he are      |
| `Marriage`      | Cody married (P5): his evenings, "how was your day?", story    | lately, takings, bag, mailbox              |

`Talk` (1.1's W3, decision 342) is the talk: the hello and what they bring up, a heart moment or
their question and what she says back, the faces they say them with, the calls' and visits' first
lines, gifts, favours, friendship growing (`thank`, `befriend`) and best friends' letters
(`check`). `Neighbourhood` is who's where and the walking, and reads who she's talking to from
`Talk`, so they wait for her; everything that asks of a talk (`talk`, `reply`, `give`, `favour`,
`doFavour`, `feel`, `feelingOf`, `startTalk`, `endTalk`, `talkingTo`) asks `world.talk`, the view
and the tests too, `Neighbourhood` having no forwarding reads since 1.3's F6 (decision 365).
`Talk`'s `scene` is the `TalkScene` (0.2's D2) that `build.ts` puts together at each
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
town's also has the day's `Stalls` (the pop-up and the Moon Pie cart; R3's wandering stall stands
through its `Decorations`), every place with a project has its `Sites` (V1's R4: posts, a frame or
the thing built, solid, its deck walked on and its planters beds), and a place with
`lots` has `Lots` (phase T): the houses of those who once moved in later, standing from the
first day (decision 211), solid like a stall and gone into by the door in its map's `doors`. The town has `Decorations` too (phase U): the
piece standing in the square while a holiday's decorations are up, and what's set out for a
happening on its day (film night's screen and popcorn table, 0.2's J3), worked out from the day
key and solid like a stall; the fairground has its own `Decorations` for what's set out for a
happening that has moved there (0.2's M3). A way out with a `gate`
has it stand in the way, one tile in, while the place beyond is shut (`shutGates`, decision 104).
Every place has its `Mounds` (0.3's C1): today's mound on one of its map's `digSpots`, solid and
walked up to. The town's yard (0.3's H5) is solid under each piece of hers standing there. Each
of these is an `Overlay` (`zones/Overlay.ts`, 1.1's W1, decision 340: an optional `propAt` and a
`blocks`), and `MapZone` holds them as one list, in the order `propAt` asks them: the lots, the
decorations, the sites, the stalls (the pop-up, then the cart), a shut gate (`Gates`), today's
mound, the farm's built rows (`Plots`) and the yard, the last two only in the way. `canWalk` is the
map (or the ice) and no overlay `blocks`; `propAt` is the first overlay's prop on the tile, else
the map's. A ninth thing standing in a place is an `Overlay` and a line in that list. `HomeZone` is her home: the room
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
165, and a planter's by its room too, decision 341), each crop a day sooner where it `thrives` and in its `season`, read from the day it was
planted (`ripeDays`, decision 176); the stalls, the snack, Wes and Fibi's bone are still only ever in town (or at home, for the
bone).

Her path is A\* over the zone's tiles (`systems/pathfinding.ts`) pulled taut (`stringPull`): she
heads straight for the farthest point along it she can reach in a clear line, where "clear" is her
body, just under half a tile either side of her middle, never overlapping anything solid
(`clearLine`, exact rather than sampled). So she walks straight across open ground and turns only
at corners, and a new tap mid-step heads straight on from wherever she is. Her neighbours' paths
are pulled the same way since phase S, and her pets' since 1.1's W1 (`Pet.walk`, against her
`BODY_RADIUS`, decision 340): where a pet goes is still `systems/pets.ts`'s, only the way there is
pulled; the zoomies' lap stays a ring of tiles.

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
what arriving does. A prop, or open ground, goes through `arriveOn`: she faces it, sits if it's a
seat and reads a signpost, then its row in the **arrivals table** (`propArrivals`, a
`PropArrivals` keyed by prop id, `src/world/arrivals.ts`, 1.1's W1, decision 340), then a door or
a way out (`Travel.cross`, a knock first on a festival evening), then, outdoors, whatever there is
to gather (the orchard's trees among it), and on open ground what lies there and the stray. Each
row is given by the area that makes the service doing it: `making` the honesty stall's tin,
`passive` the porch pots, the candy tree and its saplings, `festivals` the pumpkin patch and the
geese, `catching` the mound (today's fossil mound first, `Fossils.isToday`, then the buried keys'
`Digging`, in one row), `homeServices` the built bandstand. A row returns the moments after her
arrival, or null to let the prop go on to the door (a goose or a mound indoors). `arrivalsOf`
refuses a prop two areas claim, so no two rows race, and a new one is a row in its area.
`tests/world/arrivingAtProps.test.ts` walks up to every kind of prop in every place and holds what
each does to a snapshot taken from the chain of `if`s the table replaced. A `piece` arrival is
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
once in `main.ts` and handed to the fit and to Settings' View tab (`ViewApi`). The rod's is read in `wiring/apis/her.ts` and handed to the drawing by `paintRod`
in `render/scene.ts`, so neither the world nor the save knows it.

The cloud save (V1's S2, decision 323) is the one thing a server answers: `api/save.ts`, a Vercel
function (Web `GET`/`PUT` handlers on the Node runtime, `handle(request, store)` testable with a
faked store, Upstash's REST API through plain `fetch`), outside `src/` and `dist/`, with its own
`api/tsconfig.json`. The phone's key is kept beside the save (`persistence/cloudKey.ts`: 128
random bits, a 28-symbol Crockford code with two check symbols); `persistence/cloudSeal.ts`
hashes it into the id the function files under and the AES-GCM key the town is sealed with;
`persistence/cloud.ts` (`CloudSave`) is made by `keepTown` (`wiring/keeping.ts`), told each local write by the
`AutoSaver`'s write, and flushed on `visibilitychange`, `pagehide` and `online`. It asks the
cloud once (`check`) before anything goes up, against the loaded save's `updatedAt` (stamped by
the world's clock: the real one on her phone, a dev build's `?day=` the day it was played on), and a newer
town is offered by `hud/CloudCard.ts` after the title (`offerCloud`), never swapped in. What goes
up is the backup code sealed, so restoring runs the backup's migrations. Settings' Backup tab
shows the code and its QR (`hud/qr.ts`, our own encoder) through `SaveApi.cloud`.

## The loop

`main.ts` is the boot, the loop and the views (1.1's W3: 278 lines, from 546); what it made
besides is `wiring/`'s, each made where it was: `keepTown` (`wiring/keeping.ts`: the autosave, the
flushes as the page hides, the cloud's check and its newer town offered past the title), `enterer`
(`wiring/greeting.ts`: the creator, Cody's hello and the backup nudge), `listenForTaps`
(`wiring/touch.ts`), `Music` (`wiring/music.ts`) and `exposeForDebugging` (`wiring/debug.ts`, a
dev build's handles).

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
neighbour mask (`sprites/terrain.ts`, decision 93; the square's paving, laid on the world's grid,
also by which neighbours are its own kind, `ownMask`, decision 350), and a frame copies only the chunks under the
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

**A place outdoors is drawn in passes** (1.1's A4, decision 353). `OutdoorView` keeps the
frame's setup: the camera, the ground (retiled as the pond freezes or the rows are built, its
look turned with the season, the props baked again by `turnProps`), the one sort of what stands
by its feet, the crowns, the moon's rims and the light. Everything else is a `Pass`
(`render/passes/pass.ts`): a name and a part in any of a frame's layers, `ground(ctx, frame)`
(on the ground), `stand(frame)` (its drawables, sorted with everything else's), `wanted()` (of
those, what she might want behind a crown), `over(ctx, frame)` (over everything standing),
`lights(frame)` (its pools of light) and `lit(ctx, frame)` (over the light), handed a `Frame`
(the clock's `nowMs`, the camera, the weather, whether it's snowing, the season, the ground's
life and her drawable; a `LitFrame` adds the `Daylight`). The order of each layer is
`OUTDOOR_LAYERS` in `OutdoorView.ts`, by name, which `composeLayers` turns into the passes once as
the view is made, refusing a name with no pass or no part there and a part no layer names; held
by `tests/render/outdoorPasses.test.ts`, it is the order the view drew in before the split, so
where two things stand level the one named first is drawn first, as before. The passes are in
`render/passes/` (`props.ts` bakes the place's props once and hands each pass its share; the
frames' `moving.ts` and the lanterns; `givers.ts`; `sites.ts`, the lots, decorations and projects,
asking `filmNight.ts` for the film; `stalls.ts`, the pop-up and the cart; `mounds.ts`;
`dressed.ts`, the mailbox, noticeboards, pots, geese, candy tree and gates; `aloft.ts`, the
monarchs, flyers and leaves; `folk.ts`, who's about and her; `snack.ts`; `life.ts`; `weather.ts`,
with the fireworks and meteors; `crowns.ts`, the see-through crowns; `standing.ts`, what they
share) or beside what they draw (`yardPass`, `bedsPass` in `garden.ts`, `fishingPass`,
`fountainPass`, `holidaysPass`, `doorsPass`, `effectsPass`). A new thing drawn outdoors is a pass
and its name in `OUTDOOR_LAYERS`.

**See-through trees** (0.3's A3, decision 222) are view state, never the world's: after
`OutdoorView.draw` sorts what stands in a place, `coveredCrowns` (`render/occlusion.ts`) counts the
pixels each crown draws over her or over something near her she might want (the passes' `wanted`),
from each sprite's mask (read once and kept), and `SeeThrough` eases each such crown to half alpha
by the fixed step, as the camera is (`Crowns`, `render/passes/crowns.ts`). A faded crown is a copy
in the frame's own list. **Her yard** (0.3's H5) is drawn among the town's props by
`render/yard.ts`. **At home** (0.3's H3, S4) a small piece on a surface
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
chosen by `world.poses`; the view only asks which. Since 1.1's A5a (decision 354) `doll.ts` is
the putting together (`dollLayers`, `dollKey`, where shoes go) and the public exports, and its
families are files in `sprites/doll/`: `body.ts` (the regions, the `Parts` a build draws them
with, the `Measure` a cut steps in from, `measureOf`), `builds.ts` (each build's `Physique`:
parts, measure, where an arm drawn for her lands, its bodies), `stout.ts`, `poses.ts` (her poses,
the action bodies for every build, the folds), `paint.ts` (painting, `finish`, the rows
remembered per body), `face.ts`, `ink.ts` (tattoos and bracelets), `hair.ts`, `hats.ts`,
`prints.ts`, `backs.ts` (cape and wings) and `cuts.ts`. A figure's build is `build` on its
villager row (`data/builds.ts`), read by `buildOf` in `sprites/villagers.ts`; she is always
`regular`. Her looks and every figure's are held by `tests/sprites/looksHeld.test.ts`, hashes of
their layers taken before the second body came.

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
`sprites/effects.ts`. Chatter's bubbles and her footfall dust are pushed straight in from
`main.ts`'s tick (`wiring/chatter.ts`, `Effects.walking`); reduced motion drops the bursts.

**What V1 added to the view, all view state:** the light (L3, decision 291) is a grade by hour from
`render/grade.ts` folded into the light map's cached base, with bloom read from each sprite's cached
`glow` canvas and the moon's rims cached per sprite, so a new glowing prop gets its halo for
free; **motion** (E5, decision 284) is `frames` on a prop's, piece's or fixture's art picked from the
clock and a phase per tile (`render/frames.ts`), doors opening as she nears (`render/doors.ts`), the
sky's crows and bats and autumn's leaves (`render/sky.ts`, `leaves.ts`); **taps and passing
through** (E4, decision 283) are a ring and brackets in the effects layer and an iris, the broom's
flight or a window's wash from `render/transition.ts`, drawn by `main.ts` over the view only while
one runs; **the seasons** (L4, decision 294) are palette swaps baked under `<key>@<season>`
(`sprites/seasons.ts`): the ground re-bakes by `Ground.look`, letting its chunks go, and props by
`OutdoorView.turn()`, once at a change of season, never a frame; **faces** (L7, decision 296) are a
`Feeling` in a figure's `Stance` and her `Rest`, baked like any pose; **a project** (R4) stands
through the town's `Sites`, drawn among the props; **the reel** (R6a) is `drawReel` in
`render/fishing.ts`, the tension bar over her head read off the world's clock as the score is; and
**a fair game's stage** (R6b) is `render/fairGames.ts`, drawn into the sheet's canvas from the same
reads that score a tap. None of them is a rule: each reads the world, the clock or the day key.

## The HUD

An HTML overlay, `pointer-events: none` except its controls. Each sheet takes an Api interface
(`ShopApi`, `HomeApi`, `PetApi`, `CraftApi`, `TalkApi`, `MailApi`, `CabinetApi`, `MysteryApi`,
`MapApi`, `FarmApi`, `BagApi`, `LookApi`, `SaveApi`, `SoundApi`, `CalendarApi`, `NoticeApi`,
`StallApi`, `BarnApi`, `NeighboursApi`, `FairApi`, `BroomApi`, `RodApi`, `TitleApi`, `NotesApi`,
`DisplayApi`, `CatalogueApi`, `MealsApi` (the top bar's meal chips), V1's `FirstDayApi` (Cody's
list), `ProjectsPanelApi` (the noticeboard's Projects tab, inside `NoticeApi`), `CloudApi` (inside
`SaveApi`) and `ViewApi` (Close or Far), and
`QuickApi`, `BedApi` and `FreshApi` for the quick bar, a bed's card and the dots on the corner
buttons), which `sheetApis` in
`wiring/apis.ts` composes from a builder an area in `wiring/apis/` (1.1's W3: `her`, `travel`,
`making`, `garden`, `shopping`, `home`, `neighbours`, `collecting`, `pets`, `mystery`,
`fairground`, `calendar` and `welcome`, matching `world/areas/` where they fit, what they share in
`apis/shared.ts`), each from the world's services; Settings' save and sound are
`apis/settings.ts`'s, which `main.ts` hands the HUD with its view, and the photo mode's
`CameraApi` (1.5's G5) is `apis/camera.ts`'s, made by `main.ts` too, since it needs the canvas,
the view and the fit: it sets `world.posing`, which stops the loop stepping the world while the
viewfinder is up (the view draws on). So a sheet is testable with a
stub and never reaches into the world. The world's moments, from the loop
or from a sheet, go through `playMoments` (`wiring/moments.ts`): each one's cue, the sheet it
opens, and its toast. A bed's card (phase P) is the one piece of the HUD that follows the world:
`main.ts` tells it each frame where its bed is on the page (`hud.placeBed`), and where she is
(`hud.playerAt`), so a toast can keep out of her way. The toast line is `hud/ToastLine.ts`: one
toast at a time, for as long as it takes to read, and gone at a tap on it (decision 140); since
V1's review it takes its own width up to its max (`width: max-content`), where `left: 50%` had
left it half the room and a three-line toast had run to ten.

Since V1 the chrome draws no emoji (L5, decision 295): every mark is a 16-pixel `Glyph`
(`sprites/ui.ts`, `data/glyphs.ts`) shown by `glyph()` as an SVG of whole squares, held by
`tests/hud/noEmoji.test.ts`. A sheet slides (`hud-sheet-up`/`-down` in `hud/styles.ts`, `leave` and
`moving()` in `hud/dom.ts`), and a sheet going takes no taps. A talk's buttons are `TalkAction`s
from `wiring/talkActions.ts` (P4); a reply chip is a `.hud-reply` (P2). The busts are
`drawBust` (`render/villagers.ts`, Scale2x at 64) with the line's `Feeling` (L7), the same face as
the world sprite's. The date chip opens the calendar on Today (R2, `UpNow`), its dot asked again on
`TODAY_TOLD_BY`'s events (`wiring/todayGo.ts`), and a Today line's `go` walks or flies her there.

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

**E5's props and furniture animate** (2026-10-07, decision 284) add no pass: a frame is another
baked sprite under the art's key (its glow cached per frame), picked from the clock and a phase
per tile; an open door is one patch over its building; the crows, bats and autumn leaves are a
handful of small drawables sorted with the rest. Measured beside a copy of `v1-dev` (E4 and S1
in) on the same machine, alternating, two runs each at 21:30 (`npm run perf`; Far one run of
`v1-dev`) and one each at noon on 14 October (`-- --hour=12 --day=2026-10-14`, crows out and
leaves falling); draw means, ms (p50):

| Scene       | Close, E5             | Close, v1-dev         | Far, E5               | Far, v1-dev | Noon, E5 / v1-dev        |
| ----------- | --------------------- | --------------------- | --------------------- | ----------- | ------------------------ |
| Town        | 26.1–27.1 (18.5–19.9) | 24.3–25.9 (17.3–18.5) | 46.9–48.6 (32.8–34.3) | 46.6 (32.6) | 13.1 (8.5) / 12.1 (7.5)  |
| Home        | 15.2–15.3 (9)         | 15.5–15.9 (9.1–9.4)   | 15.3–16.6 (8.8–9.7)   | 16.4 (9.6)  | 4.9 (2.1) / 5.7 (2.1)    |
| Fairground  | 18.6–18.8 (13.2–13.3) | 16.6–17.6 (11.2–12.1) | 34.7–39.2 (24.6–27.7) | 34.4 (23.8) | 6.9 (3.9) / 5.6 (2.6)    |
| Whisperwood | 20.7–20.8 (14.4–14.5) | 19.4–19.9 (13.2–13.5) | 42.4–46.2 (29.8–32.6) | 40.9 (28.7) | 7.8 (3.7) / 7 (3)        |
| Boo Acres   | 17.3–17.6 (11.8–12)   | 16.5–17.1 (11–11.4)   | 34.7–36.9 (24–25.6)   | 33.5 (23.2) | 6.8 (3.6) / 6.3 (3.2)    |
| Her yard    | 27.4–28.4 (21.7–22.4) | 27.7–28.2 (21.7–22.1) | 49.5–52 (36.4–38.5)   | 47.6 (35.1) | 13.8 (10.3) / 12.5 (8.9) |
| Back room   | 18.3–18.6 (12.1–12.3) | 18.9–19.2 (12.7)      | 18.5–19.4 (12.1–13)   | 18.7 (12.4) | 6.8 (3.7) / 6.8 (3.7)    |

Outdoors at Close it is a millisecond or two dearer (the fairground most, its wheel, cars,
awnings and bulbs), inside the container's spread; rooms are unchanged; updates are unchanged
(0.4–0.9 ms), since nothing moves in the world; the heap is about 1 MB higher (23–24.5 MB), the
frames' baked canvases, each baked the first time it's drawn.

**S1's sound** (2026-10-07, decision 321) adds no pass and nothing to `world.update`: the audio
graph is built once on her first touch, a bed of ambience once as it comes in (its slow
oscillators do the moving), and `Hearing.step` compares a tile and a time each step, reading the
ambience again only when she changes tile or a minute passes. One run at 21:30 at Close with
lane 1's session beside it, updates: town 0.76, home 0.63, the fairground 0.55, Whisperwood
0.52, Boo Acres 0.53, her yard 0.75, the back room 1.1 ms, inside E3's 0.5–1.08 (the perf page
never touches the screen, so no audio context starts there; what it measures is the reading).

**L2's ground** (2026-10-10, decision 293) adds no pass: the lawn's tones, the dirt, gravel,
meadow and long grass and the ten decals are all baked into the ground's chunks, as the grass was.
What it costs is baking: a tile's piece is now keyed by its four lawn corners as well as its look,
so a place has more distinct pieces to bake once (the town 195 → 696, Whisperwood 105 → 379, the
castle hill 50 → 392, Boo Acres 97 → 442; each a 32-pixel canvas, a couple of MB across every
place), and the tufts are drawn a few more a frame on meadow and long grass. Measured beside a copy
of `v1-dev` (P2 in) on the same machine, alternating, two runs each at 21:30 and one at noon
(`npm run perf`, `-- --hour=12`); draw means, ms (p50):

| Scene       | Close, L2             | Close, v1-dev         | Noon, L2 / v1-dev         | Heap, L2 / v1-dev |
| ----------- | --------------------- | --------------------- | ------------------------- | ----------------- |
| Town        | 28.5–29.4 (21.7–22.9) | 30.4–31.4 (22.8–23.9) | 19.1 (13.5) / 17.2 (12.6) | 24.7–24.9 / 24    |
| Home        | 16.5 (9.6–10)         | 15.1–15.8 (9.2–9.7)   | 5.4 (1.9) / 5.1 (2.2)     | 25.8 / 24.7       |
| Fairground  | 19.4–19.5 (13.6–14.1) | 19.2–19.7 (13.5–14.3) | 6.5 (3.9) / 6.9 (3.8)     | 26.2–26.6 / 25    |
| Whisperwood | 20.6–21.7 (14.8–15.4) | 20.6–22.3 (14.4–16)   | 8.3 (4.2) / 7.6 (3.8)     | 26.6 / 25.3       |
| Boo Acres   | 17.8–18.6 (12.2–12.7) | 16.5–17.3 (11.8–12.2) | 6.8 (3.3) / 6.6 (3.4)     | 27.3–27.5 / 25.4  |
| Her yard    | 33.7–34.7 (27.7–28.9) | 31.7–31.9 (26.8–26.9) | 19 (15.1) / 17.7 (13.5)   | 27.4 / 25.6       |
| Back room   | 18.8–19.7 (12.8–13)   | 16.6–18.6 (11.2–12.9) | 6 (3.9) / 7.1 (3.9)       | 27.6–27.9 / 25.7  |

Within the runs' spread everywhere but her yard, a millisecond or two dearer. That is baking, not
drawing: perf's yard comes back to town after Boo Acres, and a view lets its chunks go as she
leaves (`rest()`), so the yard's 450 frames bake the town's ground afresh as she walks. A second
script walked one seeded route twice in each place, the first pass baking what it reveals and the
second drawing it already baked: the second passes came out the same on both builds (town 18
against 15.9–19.3 ms, her yard 17–17.7 against 17.2–17.7, Whisperwood 18.6–19.5 against
18.5–19.2, Boo Acres 16.9–17.2 against 19–19.1), so a frame of ground costs what it did. The heap
is 1–2 MB higher, the pieces' canvases. Updates are unchanged (0.4–0.9 ms). L4's season swap
re-bakes this ground, so it pays the bake once at a change of season, never a frame.

**L4's seasons** (2026-10-11, decision 294) add no pass: every season is a palette swap of pieces
and props already baked (under a key with `@<season>`), snow on a track is one more piece a tile
baked into the chunks, and a season's light is multiplied into the grade's. Measured on clear and
rainy days in autumn and winter (draw means, town at 21:30 and noon, ms): clear autumn 25.9–26.2
and 10.4–11.1, clear winter 25.2–26.3 and 8.9–12.4; rainy autumn 29.5–30.4 and 25.6–26.5, winter
with the rain falling as snow 29.1 and 27.2; the heap the same. A season's change lets the
ground's chunks go and bakes the turning props again once, as the weather's wet does.

**L5's polish** (2026-10-17, decision 295) adds nothing to a frame: the chrome's glyphs are
`<img>`s of SVGs made once, the busts are drawn when a sheet opens, the title's sky is drawn once
into its picture and its bats are three DOM sprites only while it's up. One `npm run perf` at
Close on a container shared with another session's runs (draw means, ms (p50), heap MB): town
35.6 (25.6) 26.9, home 17.8 (10.1) 27.8, fairground 22.3 (15.4) 28.7, Whisperwood 25.9 (17.8)
29.3, Boo Acres 21.1 (14.2) 29.8, her yard 35.9 (28.9) 30.6, back room 21.3 (13.7) 30.2; higher
than L2's table by about what a busy machine costs, with no drawing code in the frame changed, so
the next quiet run should be compared against `v1-dev` side by side.

**V1's review** (2026-10-18, decision 324), 1.0 as it goes to her phone, against L1's Close
baseline above. `npm run perf` on `v1-dev`'s head with V1's fixes, on a quiet container (nothing
else running), two runs at 21:30 at Close and Far and one at noon each (`-- --hour=12`,
`-- --view=far`); draw means, ms (p50), updates in ms, the heap in MB:

| Scene       | Close, 21:30          | Close, noon | Far, 21:30            | Far, noon   | Updates (Close) | Heap      |
| ----------- | --------------------- | ----------- | --------------------- | ----------- | --------------- | --------- |
| Town        | 32.6–32.8 (22.2–22.9) | 22.3 (15.3) | 53.6–58 (36.6–39.8)   | 29.9 (17.1) | 1.11–1.13       | 28.5–29.1 |
| Home        | 19.1–20 (11.3–12.1)   | 5.6 (2.4)   | 20.3–21.9 (11.7–12.8) | 5.5 (2.3)   | 0.89–0.96       | 29.2–29.6 |
| Fairground  | 22.1 (15.1–15.2)      | 9 (4.9)     | 41.7–42.3 (28.6–29.6) | 12.9 (5.4)  | 0.72–0.75       | 29.5–31   |
| Whisperwood | 25.6–28 (17.7–19.4)   | 9.2 (4.3)   | 51.2–51.9 (34.8–35.4) | 15.8 (5.8)  | 0.86–0.93       | 30.5–30.7 |
| Boo Acres   | 20–20.7 (13.3–13.4)   | 7.5 (3.7)   | 38–39.2 (25.6–26.3)   | 12.8 (4.7)  | 0.78–0.79       | 30.7–31.7 |
| Her yard    | 32.1–32.5 (24.6–25.1) | 21.9 (16.8) | 54.6–55.5 (39.4–40.3) | 29.7 (18.5) | 0.99–1.04       | 31.1–31.8 |
| Back room   | 22.6–22.7 (15.1–15.3) | 8.5 (4.7)   | 21.7–23.3 (14.6–15.6) | 8.5 (4.8)   | 1.36–1.4        | 31.2–32.1 |

Against L1's baseline the whole plan cost about 2–4 ms of a Close night's mean (town 28.6–29.3
→ 32.6–32.8, its median 21.2–22 → 22.2–22.9), a little more at Far (town 49–50 → 54–58), and no
frame doubled: the light (L3), the frames (E5), the ground's tones (L2) and the seasons each added
a millisecond or two and were measured as they landed (above). Updates are up by a few tenths
(town 0.87–0.93 → 1.1, the back room 1–1.1 → 1.4): Cody at hers, the neighbours' strolls, jobs,
faces and chatter, the pets' jobs and rest spots, all stepped where she is. The heap is 28.5–32
MB against 21–22, the lanes' rows and baked art (faces, frames, the seasons' swaps, busts). Noon is
dearer in town than E5 measured (22.3 against 13.1 ms), mostly L2's lawn tones baked as perf walks
into chunks it hasn't seen; the second-pass check under L2 holds. Her phone is the real test:
"On her iPhone" below.

**1.1's W1** (2026-10-19, decision 340), the arrivals table, the overlays as a list and the pets'
pulled paths, changes no drawing. `canWalk` was timed directly, as the hot path it is: 400 A\*
paths between seeded open tiles across the town (722,889 `canWalk` calls, every project built),
three runs each, alternating, on a quiet container: 958–1,023 ms (median of seven) on `v1.1-dev`
against 984–1,072 ms on W1, and `canWalk` alone 981–1,040 ns against 952–1,066 ns a call, so the
list costs nothing measurable over the inline checks (each path across town is about 2.5 ms, both
ways). `npm run perf` at Close, 21:30, two runs each alternating, on a container shared with
another session (draw means, ms (p50); updates, ms):

| Scene       | Draw, W1              | Draw, v1.1-dev        | Update W1 → v1.1-dev  |
| ----------- | --------------------- | --------------------- | --------------------- |
| Town        | 36.7–37.4 (25.5–26.9) | 34.5–38.2 (24.5–27.9) | 1.18–1.25 → 1.12–1.35 |
| Home        | 17–18 (10.6–11.1)     | 16.5–17.9 (10.5–11.1) | 0.92 → 0.89–1.03      |
| Fairground  | 24–24.1 (15.8–17.1)   | 22.4–22.7 (15.2–16)   | 0.79–0.85 → 0.7–0.77  |
| Whisperwood | 26.8–27.5 (17.6–18.4) | 28–28.3 (18.3–19.2)   | 0.89–0.94 → 0.96–1.01 |
| Boo Acres   | 18.1–18.8 (12.1–12.4) | 19.8–22 (13.2–13.3)   | 0.65–0.69 → 0.72–0.81 |
| Her yard    | 33–33.5 (26.5–26.8)   | 33.3–39.2 (26.7–29.1) | 1.04–1.1 → 1.07–1.24  |
| Back room   | 21.1–21.7 (14.7–15.4) | 20–21.4 (14.8–15.1)   | 1.15–1.38 → 1.17–1.32 |

Every row within the other's spread or a millisecond of it, one way and the other: the
container's noise. A pet's pulled path is planned when its goal moves, as before, with a
`stringPull` over a path of a few tiles.

**1.1's W2** (2026-10-19, decision 341), her rooms a keeper of their own and a planter's bed
keyed by its room, changes no drawing; `Home`'s reads are one call deeper, through `Rooms`, and
the farm asks which room she's in for a bed at home. `npm run perf` at Close, 21:30, four runs
each alternating, `v1.1-dev` and W2 each served from a copy of its own, on a container shared
with lane A's session (draw means, ms (p50); updates, ms):

| Scene       | Draw, W2              | Draw, v1.1-dev        | Update W2 → v1.1-dev  |
| ----------- | --------------------- | --------------------- | --------------------- |
| Town        | 33.7–47.3 (25.6–32.4) | 34.2–44.5 (25.3–31.1) | 1.22–1.69 → 1.19–1.51 |
| Home        | 15.6–23.6 (10.2–14.2) | 15.4–23.5 (9.8–14.5)  | 0.83–1.44 → 0.87–1.47 |
| Fairground  | 22.1–30.3 (15.7–20.4) | 20.5–35.8 (14.4–23.1) | 0.77–1.03 → 0.69–1.35 |
| Whisperwood | 24.7–33.2 (16.7–22.9) | 23.5–37.2 (16.2–24.2) | 0.8–1.26 → 0.77–1.41  |
| Boo Acres   | 21.8–29.5 (13.4–18)   | 21.2–29.4 (13.1–18.8) | 0.83–1.16 → 0.74–1.13 |
| Her yard    | 35.4–44.1 (26.6–34.9) | 34.8–49.7 (27.2–37.7) | 1.14–1.52 → 1.08–1.58 |
| Back room   | 19.7–28 (14.1–19.3)   | 21.5–27.8 (14.5–19)   | 1.12–1.76 → 1.34–1.79 |

Every row within the other's spread, one way and the other; the spread itself is the container
(a quiet pair, the second, had Home at 15.6 against 17.2 and the back room at 19.7 against 22.7).

**1.1's A1** (2026-10-19, decision 350), the square's flagstones and setts and the cobbles' worn
middle, adds no pass: it is all baked into the ground's chunks. What it costs is baking: the
flagstones are drawn for 64 places in their eight-tile repeat, so the town has 769 distinct
pieces against 696. `edges`, which every ground piece asks for its field, made a closure and
three tables a pixel; it hoists the tables now and hands every tile with ground on all sides one
shared field (a cache of every field was tried and held 6–10 MB of heap). Every place, its
winter and every ground piece draw pixel for pixel as before that change. The town's whole
ground drawn and rasterized fresh in Node (CPU ms, three runs): 805–887 on `v1.1-dev`, 777–863 on
A1; the fairground's 475–503 and 428–546. `npm run perf` at Close, alternating, on a container
shared with lane W's session (draw means, ms (p50); heap, MB):

| Scene       | 21:30, A1             | 21:30, v1.1-dev       | Noon, A1 / v1.1-dev       | Heap, A1 / v1.1-dev   |
| ----------- | --------------------- | --------------------- | ------------------------- | --------------------- |
| Town        | 34–35.8 (23.8–24.8)   | 33.2–47.6 (23.2–33.9) | 32.6 (22.6) / 34.2 (24.8) | 29.5–29.6 / 28.9–29.2 |
| Home        | 17–17.6 (10.1–10.6)   | 16.1–18.6 (10.1–11.1) | 5.4 (2.3) / 4.8 (1.8)     | 30.2–30.7 / 29.5–30   |
| Fairground  | 22.9–23.5 (15.1–15.5) | 22.7–27.9 (15.3–19)   | 23.5 (15.9) / 23.6 (16.4) | 30.8 / 30.1–30.6      |
| Whisperwood | 25.6–26 (16.8–16.9)   | 25.3–32.4 (16.1–22.9) | 25.6 (16.7) / 29 (19.7)   | 31.5–31.8 / 30.8–31   |
| Boo Acres   | 20.7–20.9 (12.7–12.9) | 19.3–26.5 (12.3–17)   | 21.7 (14.1) / 21.4 (14.7) | 32.1–32.3 / 31.3–31.5 |
| Her yard    | 34.9–36.6 (26.4–27.3) | 33.5–42.9 (25.7–34.8) | 33.7 (25.1) / 31.4 (24.8) | 31.9–32 / 31.4–31.7   |
| Back room   | 20.4–20.9 (13.4–13.8) | 21.1–25.5 (13.6–17.8) | 7.5 (4.3) / 7.4 (4.4)     | 32.2 / 31.5–32        |

Within the spread everywhere; the heap half a megabyte up, the square's pieces.

**1.1's W3** (2026-10-19, decision 342), `Talk` out of `Neighbourhood`, the Apis by area,
`main.ts` slimmed and the areas' order named, changes no drawing; a neighbour's walk asks `Talk`
who she's talking to, a call one function deeper. Timed in Node (vitest, a fake clock, the town
settled 400 steps), alternating with `v1.1-dev`, each from its own copy: a talk opened and its
buttons worked out (`neighbourhood.talk` and `talkActions`, every neighbour four times a day for
six days, 312 a run) and the step that crosses into the afternoon or the evening (20 a run),
medians of each run, quartiles across runs (24 runs on W3, 27 on `v1.1-dev`): a talk 0.089 ms
(0.079–0.098) against 0.085 (0.077–0.095), a window's turn 3.3 ms (2.86–4.19) against 2.93
(2.59–3.57), an ordinary step 0.19 against 0.18 ms. `npm run perf` at Close, 21:30, three runs
each alternating (draw means, ms (p50); updates, ms):

| Scene       | Draw, W3              | Draw, v1.1-dev        | Update W3 → v1.1-dev  |
| ----------- | --------------------- | --------------------- | --------------------- |
| Town        | 29.2–42.3 (20.4–29.8) | 29.1–42.8 (20.8–29.1) | 0.96–1.44 → 0.89–1.46 |
| Home        | 14.6–21 (9.1–12.8)    | 14.2–20.3 (9–12.4)    | 0.73–1.18 → 0.68–1.16 |
| Fairground  | 20.3–24.8 (13.8–16.9) | 18–24.5 (12.5–17)     | 0.61–0.79 → 0.52–0.8  |
| Whisperwood | 21.5–28.5 (14.3–18.6) | 22–26.1 (14.4–18.8)   | 0.67–0.93 → 0.67–0.84 |
| Boo Acres   | 16.4–20.5 (11.1–13.1) | 17.6–25.4 (11.3–15.3) | 0.57–0.69 → 0.58–0.88 |
| Her yard    | 26.9–35.5 (20.7–27.2) | 27.4–40.9 (21.8–31.7) | 0.77–1.13 → 0.85–1.38 |
| Back room   | 14.8–22 (10.1–15.2)   | 16.5–23.1 (11.5–16.4) | 0.89–1.24 → 0.9–1.42  |

Every row within the other's spread, one way and the other; the window's turn leans a few tenths
of a millisecond dearer in the middle of its runs and overlaps them end to end, the container's
noise on a step that does a window's dealing.

**1.1's A4** (2026-10-19, decision 353), `OutdoorView` drawn in passes, draws the same things in
the same order: a frame walks seven short lists of passes where it called methods, makes one
`Frame` and one `LitFrame`, and flattens each pass's drawables into the one list it sorted before.
`npm run perf` at Close, 21:30, three runs each alternating, `v1.1-dev` and A4 each served from its
own copy, on a container shared with A3's session (draw means, ms (p50); updates, ms; heap, MB):

| Scene       | Draw, A4              | Draw, v1.1-dev        | Update A4 → v1.1-dev  | Heap, A4 / v1.1-dev   |
| ----------- | --------------------- | --------------------- | --------------------- | --------------------- |
| Town        | 35.2–39.2 (25.1–28)   | 36.3–39.7 (25.5–28)   | 1.15–1.47 → 1.21–1.49 | 29.8–31.9 / 29.8      |
| Home        | 15.1–20.8 (10.1–12.4) | 16.2–19.3 (10.4–12.3) | 0.84–1.11 → 0.83–1.07 | 30.4–31 / 30.6–31     |
| Fairground  | 23.5–28 (16.8–18.6)   | 23.3–25.3 (16.7–17.3) | 0.74–1.04 → 0.81–0.99 | 31.2–31.8 / 31–31.1   |
| Whisperwood | 24.6–29.3 (16.6–19.9) | 26.8–28.2 (18.3–19.2) | 0.8–1.04 → 0.91–1.03  | 32–32.9 / 31.6–32.7   |
| Boo Acres   | 17.5–23.8 (12–15.3)   | 18.8–20.8 (13–13.9)   | 0.64–0.86 → 0.65–0.75 | 32.5–33.3 / 32.2–32.5 |
| Her yard    | 34.3–37 (26.6–29.2)   | 33.6–38.3 (25.3–30.2) | 1.19–1.3 → 1.17–1.19  | 32.4–34.2 / 32.2–32.8 |
| Back room   | 18.1–26.2 (13.6–18.4) | 19.7–21.6 (13.9–15.7) | 1.17–1.73 → 1.21–1.37 | 32.6–33.1 / 32.4–33.2 |

Every row within the other's spread or overlapping it, one way and the other; the home and the
back room, whose views didn't change, spread as wide as the places that did, which is the
container. The town's heap was 29.8 and 30.1 MB in two of A4's runs and 31.9 in the other, a
collection's timing (its home in that run was the lowest of all six, 30.4). `?perf`'s overlay (`wiring/perf.ts`) is untouched.

**1.2, V1.1's review** (2026-10-20, decision 356): the 1.1 plan whole (the lanes' tables above
each against `v1.1-dev` before it) against 1.0 as it is on her phone, `v1.1-dev`'s head served
from one copy and `origin/main` (1.0) from another, the same `scripts/perf.mjs` (which now walks
Lantern Shore last, so every scene before it is walked as for 1.0's table), alternating, on a
quiet container: two runs each at Close at 21:30, one each at noon and at Far by night and by
day. Draw means, ms (p50 at Close by night); updates, ms (Close, 21:30); heap, MB (Close, 21:30):

| Scene         | Close 21:30, 1.2      | Close 21:30, 1.0      | Noon, 1.2 / 1.0 | Far 21:30, 1.2 / 1.0 | Far noon, 1.2 / 1.0 | Updates 1.2 / 1.0     | Heap 1.2 / 1.0 |
| ------------- | --------------------- | --------------------- | --------------- | -------------------- | ------------------- | --------------------- | -------------- |
| Town          | 37.8–39.2 (26.9–27.4) | 33.8–36.7 (25.3–26.3) | 21.2 / 19.4     | 66.8 / 66.1          | 27.7 / 27.1         | 1.42–1.52 / 1.38–1.42 | 30.6 / 29      |
| Home          | 19.8–20.5 (12.1–12.2) | 20.4–22.2 (12.6–13.3) | 6.7 / 6.3       | 21.1 / 21.6          | 6.7 / 6.5           | 1.06–1.09 / 1.08–1.13 | 31.6 / 29.6    |
| Fairground    | 23.7–25 (16.8–17.4)   | 24.1–26.1 (16.9–18)   | 9.7 / 9.6       | 48.4 / 47.7          | 16.1 / 13.5         | 0.89–0.9 / 0.86–0.99  | 32.1 / 30.3    |
| Whisperwood   | 29.7–30.8 (20.3–20.9) | 30.4–30.6 (20–20.6)   | 13 / 10.8       | 59.4 / 60            | 18.6 / 18.6         | 1.13–1.16 / 1.12–1.18 | 32.7 / 30.5    |
| Boo Acres     | 22.6–22.9 (14.9–15.4) | 22.6–22.9 (14.8–14.9) | 10.4 / 9.2      | 44.3 / 46            | 14.7 / 15.1         | 0.9–0.92 / 0.91–1.04  | 33.2 / 31.2    |
| Her yard      | 37.6–40.8 (29.1–30.7) | 37.5–39.1 (29–30.2)   | 17.9 / 18.3     | 65.6 / 70.8          | 28.5 / 24.6         | 1.41–1.52 / 1.31–1.44 | 33.1 / 31.5    |
| Back room     | 24.4–26.6 (16.4–18.8) | 24–26 (16.3–17.1)     | 8.8 / 8.2       | 25.5 / 27.1          | 8.9 / 8.6           | 1.35–1.77 / 1.34–1.58 | 33.5 / 31.7    |
| Lantern Shore | 26–27.7 (19.5–20.1)   | 25.9–26.1 (18.2–18.6) | 12 / 11.1       | 55.3 / 53            | 18 / 18.3           | 1.01–1.04 / 1–1.03    | 34.3 / 32      |

No frame doubled, and every update overlaps 1.0's runs or is within a tenth or two. The town at
Close by night is the one row clear of its spread, 2–4 ms of mean and a millisecond of median:
most likely A1's flagstones and setts, pieces of their own baked as the walk reveals them (769
against 696), since the noon and Far runs, which bake the same, sit within a millisecond or two.
Whisperwood at noon is 2 ms dearer in its one run (A3's ice and A2's new forms are baked there
too) and the same by night and at Far; Lantern Shore, whose ice meets the lake, a millisecond or
two at most. Everywhere else 1.2 and 1.0 cross each other.
The heap is about 2 MB higher everywhere (30.6 against 29 MB in town), the bodies' and builds'
baked figures, the ice's and paving's pieces, each baked once. Against 1.0's own table above (a
different day's container), the same: the town 37.8–39.2 against 32.6–32.8 there and 33.8–36.7
here, so most of that gap is the day.

**1.3's F2** (2026-10-25, decision 361), `happeningsAt` kept for the hour and the day key kept by
the minute in `Decorations` and `Mounds`, changes no drawing and no rule. Measured on a container
shared with F1's session, `v1.3-dev` and F2 each served from a copy of its own, alternating, three
runs each. A long A\* across town (400 seeded paths between open tiles, 669,726 `canWalk` calls,
timed in a world test at 21:30 on 24 October, the festival's square up; W1's method, decision
340), the median of seven passes per run, and a world step (`World.update(16)` with the clock
advancing, the same town, the median of five runs of 2,000 steps), then `npm run perf` at Close,
21:30 (draw means, ms (p50); updates, ms), then the suite's wall time:

| Measure                         | `v1.3-dev`  | F2          |
| ------------------------------- | ----------- | ----------- |
| 400 A\* paths, ms               | 1,057–1,094 | 349–378     |
| `canWalk`, ns a call (harness)  | 1,579–1,633 | 521–565     |
| A town step in a world test, µs | 220–228     | 66–67       |
| `npm run test`, s (wall)        | 147.7–152.2 | 122.9–125.8 |

| Scene         | Draw, F2              | Draw, v1.3-dev        | Update F2 → v1.3-dev  |
| ------------- | --------------------- | --------------------- | --------------------- |
| Town          | 33–37.1 (23.2–27.2)   | 33.1–39.8 (24.7–28.8) | 0.69–0.83 → 1.11–1.35 |
| Home          | 17.9–20.8 (10.2–12.3) | 18.9–20.1 (11.3–11.6) | 0.62–0.89 → 0.89–0.95 |
| Fairground    | 18.3–22.4 (13.7–15.6) | 23.4–23.5 (16.6–16.9) | 0.4–0.54 → 0.65–0.77  |
| Whisperwood   | 25.3–26.4 (17.1–18.7) | 26.4–27.8 (18.3–19.6) | 0.38–0.69 → 0.61–0.92 |
| Boo Acres     | 17.4–20.1 (12.3–13.2) | 20.4–21.3 (13.9–14.3) | 0.39–0.51 → 0.62–0.77 |
| Her yard      | 28.9–37.8 (22.8–30.5) | 34.5–40.7 (26.2–33)   | 0.58–0.66 → 1.05–1.27 |
| Back room     | 21.2–23 (13.9–15.6)   | 22.2–24 (14.9–16.1)   | 0.79–1.25 → 1.04–1.27 |
| Lantern Shore | 23.6–25.2 (17.1–17.8) | 25.1–26 (18–18.9)     | 0.41–0.64 → 0.61–0.83 |

The updates are down by a third to a half wherever neighbours are about (the town's 1.1–1.35 ms
is 0.7–0.8; 1.2's baseline was 1.42–1.52), the draws within each other's spread or a little under
(`Decorations.frozen` and the overlays are asked while the view draws too). The heavier saving is
the walk: `canWalk` was most of its microsecond in `dayKey` (`new Date` and a padded string, three
times a call in town: the decorations, the pond's ice, the mound), and a path across town is a
third of what it was. The suite is 17% shorter, its world tests' steps (the settling cases in
`finale.test.ts` run 0.15–0.7 s a case against 0.18–1.9 s, so their stated 30 s timeout is gone).

**1.3, V1.3's review** (2026-10-25, decision 366): the 1.3 plan whole against 1.2 as it is on her
phone, `v1.3-dev`'s head (with the review's notes row) served from one copy and `origin/main`
(1.2, PR #201) from another, both measured with 1.3's `scripts/perf.mjs`, alternating, on a
container to itself: two runs each at Close at 21:30, one each at noon and at Far by night and by
day, as 1.2's table was. Draw means, ms (p50 at Close by night); updates, ms (Close, 21:30); heap,
MB (Close, 21:30):

| Scene         | Close 21:30, 1.3      | Close 21:30, 1.2      | Noon, 1.3 / 1.2 | Far 21:30, 1.3 / 1.2 | Far noon, 1.3 / 1.2 | Updates 1.3 / 1.2     | Heap 1.3 / 1.2        |
| ------------- | --------------------- | --------------------- | --------------- | -------------------- | ------------------- | --------------------- | --------------------- |
| Town          | 37.7–40 (25–28.5)     | 39.7–40.9 (26.2–30.6) | 22.4 / 25.3     | 70.5 / 62.8          | 30.8 / 30.5         | 0.93–0.98 / 1.29–1.32 | 30.4 / 30.2           |
| Home          | 21.1–22 (11.9)        | 23.8–24.2 (14.3–14.6) | 5.2 / 7.3       | 22.5 / 22.1          | 5.7 / 7.1           | 0.83–0.96 / 1.22–1.24 | 31.1 / 30.9           |
| Fairground    | 24.5–25.8 (16.8–17.1) | 28.8–29.5 (19.3–20.8) | 10 / 10.3       | 47.6 / 46.1          | 14.9 / 15.7         | 0.59–0.64 / 0.95–0.98 | 31.7–32.1 / 31.8–31.9 |
| Whisperwood   | 28.6–29.5 (18.2–19.1) | 31.5–32.9 (21.3–21.4) | 11.3 / 12.5     | 58.2 / 58.3          | 17.6 / 20           | 0.67–0.7 / 1.04–1.15  | 32.3–32.7 / 32.2–32.8 |
| Boo Acres     | 22.5–23.1 (13.8–14.7) | 24.8–28.9 (16.1–17.4) | 8.6 / 9         | 45 / 43.7            | 13.5 / 14.3         | 0.56–0.6 / 0.9–1.1    | 32.9–33 / 32.7–33.7   |
| Her yard      | 34–36.5 (25.5–25.7)   | 40–43.6 (29.5–33.3)   | 23.4 / 26.3     | 66.9 / 67            | 29.1 / 29.8         | 0.7–0.74 / 1.26–1.4   | 33 / 32.9–33.4        |
| Back room     | 26.3–27.8 (16.4–18.4) | 25.4–27.3 (16–18.1)   | 8.4 / 9.5       | 23.3 / 27.7          | 7.4 / 10.1          | 1.26–1.36 / 1.49–1.57 | 33.1–33.5 / 33–33.9   |
| Lantern Shore | 28.4–29.7 (19.3)      | 30.4–31.5 (20.5–20.9) | 10.2 / 11.8     | 52.3 / 54.3          | 16.8 / 19           | 0.76–0.83 / 1.07–1.08 | 34–34.2 / 33.7–34.1   |

F2's gains hold against her phone's build: every update at Close by night is a quarter to a half
under 1.2's (the town 0.93–0.98 ms against 1.29–1.32, the yard 0.7–0.74 against 1.26–1.4; the back
room least, its pets and pieces being most of its step), and so is every noon update. Draws at
Close by night sit 1–4 ms under 1.2's almost everywhere (the yard 4–9), the back room crossing; at
noon and at Far by day a little under or crossing. The one row over is the town at Far by night,
70.5 against 62.8 in one run each, where 1.2's own table had Far's town swing by as much from 1.0
(66.8 / 66.1) to here; the yard and the woods at Far, which draw as much, cross. No frame doubled.
The heap is the same within half a megabyte everywhere: F3's creatures are baked at the sizes
they were, and F4's trees are the same forms dealt elsewhere. Against 1.2's own table above (a
different day's container), the town at Close by night is 37.7–40 here against 37.8–39.2 there,
so the two days' machines were alike.

**1.5, V1.5's review** (2026-10-25, decision 377): the 1.4 plan's second half (1.5: the photo
mode, the attic, Pickle) against 1.4 as it is on her phone, `v1.4-dev`'s head served from the
worktree and `origin/main` (1.4, PR #231) from a copy of its own, both measured with 1.5's
`scripts/perf.mjs` (a new town; Pickle is at home in 1.5's), alternating, three runs each at Close
at 21:30 and three at noon. Draw means, ms (p50 at 21:30); updates, ms (21:30); heap, MB (21:30):

| Scene         | Close 21:30, 1.5      | Close 21:30, 1.4      | Noon, 1.5 / 1.4     | Updates 1.5 / 1.4     | Heap 1.5 / 1.4        |
| ------------- | --------------------- | --------------------- | ------------------- | --------------------- | --------------------- |
| Town          | 34.8–36.6 (23.7–24.5) | 33.2–35.7 (22.9–24.7) | 21.4–24.5 / 21.6–23 | 0.79–0.84 / 0.7–0.9   | 32.1–32.5 / 31.7–31.8 |
| Home          | 20.1–20.4 (11.1–11.5) | 20–20.5 (11.3–11.4)   | 5.7–6.5 / 5.4–6.1   | 0.73–0.82 / 0.78–0.85 | 32.7–33 / 32.4–32.5   |
| Fairground    | 21.9–22.5 (14.8–15.3) | 23.2–24.8 (15.4–16.6) | 8.1–8.5 / 6.5–8.8   | 0.49–0.57 / 0.55–0.61 | 33.8–33.9 / 33–33.7   |
| Whisperwood   | 26.9–27.8 (18.1–18.4) | 27.1–29.2 (17.7–19)   | 9.6–10.9 / 10–10.6  | 0.57–0.66 / 0.58–0.72 | 34.1–35 / 33.7–34.2   |
| Boo Acres     | 20.3–20.9 (13.1–13.2) | 21.1–21.5 (13.3–13.6) | 7–7.5 / 7–8         | 0.5–0.53 / 0.55–0.57  | 34.7–34.8 / 34.2–34.6 |
| Her yard      | 32.6–33.5 (24.2–24.8) | 33.7–35.7 (25–27.1)   | 19.4–20.8 / 20–22.1 | 0.65–0.72 / 0.71–0.8  | 34.7–35 / 34.4–34.5   |
| Back room     | 22–22.9 (13.6–14.6)   | 22.1–23.4 (14.4–14.7) | 7.6–8.6 / 7.4–7.5   | 1.05–1.13 / 0.96–1.02 | 34.9–35.2 / 34.8–34.9 |
| Lantern Shore | 24.7–25.8 (16.9–17.5) | 26.2–28.4 (17.5–19)   | 9.9–10.2 / 9.6–10.2 | 0.57–0.66 / 0.67–0.72 | 35.6–35.9 / 35.5–35.6 |

Every draw and update crosses 1.4's runs or sits a millisecond or two under, by night and at noon;
no frame doubled. The one row a shade over is the back room's update, 0.1 ms, which is Pickle: a
seventh pet pottering about her rooms (his steps are the pets' own, `Pet`). The heap is up 0.3 MB
at most, his frames baked three times over (bare, the bow, the lantern). G4's stars are drawn only
on the castle hill on a clear night and G1's glints only over a shiny, neither on perf's walk.
**The camera up** (a scratch timer, not kept, of a whole cranked frame, `view.step(16)`, standing
in town at 21:30, 300 frames, two runs each, 4× throttle): 33.6–36 ms a frame with it
down, 30–36 under each filter with it up (plain 33.2–34.4, sepia 30–32.1, spooky 33.4–34.5,
moonlit 31.6–36.4): the filters' read-back eight times a second costs about what the world's step
saved by being held still. Against 1.3's table above, the town at Close by night is 34.8–36.6 here
against 37.7–40 there, so this container was a little quicker that day. **The build** is one
chunk, 1,963.9 kB (660.7 kB gzipped), against 1.84 MB (615 kB) at 1.3.

**1.6, V1.6's review** (2026-10-26, decision 386): the 1.6 plan (the lights, the big wheel, the
hens, snow and the rainbow, the delights, Gerald and the kites) against 1.5 as it is on her phone,
the worktree served beside `origin/main` (1.5, PR #234) from a copy of its own, both measured with
1.6's `scripts/perf.mjs` (a new town), alternating, two runs each at Close at 21:30 and two at
noon, on 26 October (the festival's lights up in both). Draw means, ms (p50 at 21:30); updates, ms
(21:30); heap, MB (21:30):

| Scene         | Close 21:30, 1.6      | Close 21:30, 1.5      | Noon, 1.6 / 1.5       | Updates 1.6 / 1.5     | Heap 1.6 / 1.5        |
| ------------- | --------------------- | --------------------- | --------------------- | --------------------- | --------------------- |
| Town          | 36–36.7 (25.2–25.9)   | 37.8–39 (26.2–26.8)   | 34.2–34.9 / 34.6–35.6 | 0.89–0.9 / 0.89–0.93  | 33.7–33.9 / 32.4–32.5 |
| Home          | 18.2–18.5 (10.7–11)   | 19.1–19.5 (11–11.1)   | 5.4–5.7 / 5.2–5.3     | 0.83–0.84 / 0.78–0.92 | 34.7–34.8 / 33.2–33.3 |
| Fairground    | 23.9–24 (15.7–15.9)   | 24.6 (16.3)           | 23.6–24 / 23.3–24     | 0.6–0.63 / 0.63–0.67  | 34.9–35 / 33.6–33.7   |
| Whisperwood   | 28–28.2 (18.4–18.6)   | 28.5–29.1 (18.9–19)   | 26.8–28.1 / 26.9–28.2 | 0.67–0.68 / 0.67–0.69 | 35.7–35.8 / 34.5      |
| Boo Acres     | 22.2 (13.6–13.8)      | 22–22.4 (13.6–13.8)   | 22.5–23.2 / 22.5–23.9 | 0.61–0.63 / 0.54–0.63 | 36.3–36.5 / 34.9      |
| Her yard      | 37.2–39.3 (28.2–28.9) | 37.2 (27.7–27.8)      | 34–35.9 / 34.4–37.3   | 0.9–0.93 / 0.83–0.9   | 36.5–36.6 / 35–35.2   |
| Back room     | 21.8–22.3 (15–15.2)   | 21.6–23.8 (14.1–15.8) | 8.1–8.4 / 7.9–8.3     | 1.27–1.32 / 1.21–1.3  | 36.7–37 / 35.2–35.5   |
| Lantern Shore | 27.4–27.9 (18.9–19.3) | 27.2–27.9 (18.6–19.2) | 24.9–25.2 / 25.5–26.3 | 0.74–0.78 / 0.69–0.73 | 37.5–37.9 / 36.1–36.4 |

Every draw and update crosses 1.5's runs or sits under, by night and at noon; no frame doubled. Her
yard by night is the one row a run over (39.3 against 37.2), its other run level; Boo Acres, where
the hens are drawn, is the same. The heap is up 1.2 to 1.5 MB everywhere, most likely the day's new
art baked (the hens, the kites, the snowmen, the wheel's stage, the delights' effects). Outdoors at
noon both builds draw nearly as much as by night here, where 1.5's own table had the town at 21–24
at noon a day earlier; the cause wasn't looked into, and it's alike in both builds, so compare
within this table. **The build** is one chunk, 2,048.9 kB (690.5 kB gzipped), against 1,963.9 kB
(660.7 kB) at 1.5.

**On her iPhone** (V1's S3, decision 322). Everything above is a cloud container's Chromium at 4×
throttle, which says how a change moves the numbers, not what her phone does. The way to read
her phone: open the deployed game in Safari with `?perf` on the end (`https://<the site>/?perf`,
or a dev server's `?perf` over the LAN), go in, and walk about the town at Close for 30 s from the
first tap, as she plays; the corner (`src/wiring/perf.ts`) then stops and shows the gap from one
frame to the next (p50 and p95: 16.7 ms is 60 fps; a ProMotion screen may show 8.3, 120 fps),
the step and draw inside a frame (p50, p95) and the fps. It costs
nothing without the query. The same at 21:30 (the lamps) and at noon tells the light's cost.
Write each reading here, with the phone and its iOS:

| Phone, iOS | Where, when   | Frame p50 / p95 (ms) | Work p50 / p95 (ms) | fps |
| ---------- | ------------- | -------------------- | ------------------- | --- |
| (not read) | Town, evening |                      |                     |     |
| (not read) | Town, noon    |                      |                     |     |

**The shell offline** (decision 322) adds nothing to a frame: the worker keeps the build's sixteen
files (`/`, the one chunk, the manifest, the icons and the launch screens, about 2 MB) once a
version, on install, and the page loads from that cache only when the network fails, or for a
hashed chunk it already has. The chunk is 1.66 MB (555 kB gzipped) and still one: precached, it
costs a download per deploy, not a launch.

## Where it hurts

Honest notes for whatever comes after 1.6, most pressing first, rewritten at V1.6's review
(decision 386), the last of the user's subscription. The 1.6 plan was content, not repair: it did
none of 1.5's list and added the rough edges of its own new systems (4 below). What was done is
said once at the end, so the list is what's left. There is no plan after 1.6: a session that takes
one of these up does it on a branch from `main`, as a PR the user merges.

1. **Two things only her phone and Vercel can say** (as at 1.0, 1.2, 1.3 and 1.5; the user's, not
   a session's). The cloud save's function (`api/save.ts`) has never run on Vercel: it's tested
   with a faked store, and smoke fakes it with a route. The first deploy to `main` that carries it
   (1.0 did, unlinked) is its test: the deployment's Functions tab should list `api/save`, then
   README's `curl` should answer `{"save":null}` once the store is linked (README's "Cloud save").
   If the build trips on TypeScript, the fallback is the same file as `api/save.js` with JSDoc
   types. And no frame has been timed on her iPhone: `?perf` (production too, `wiring/perf.ts`) is
   waiting, with the table under "On her iPhone" above.
2. **One chunk, growing with the content.** The build is one chunk, 2,048.9 kB (690.5 kB
   gzipped) at 1.6, against 1.96 MB (661 kB) at 1.5, 1.84 MB (615 kB) at 1.3 and 1.66 MB (555
   kB) at S3: 1.6's rows and art are about 85 kB of it (30 kB gzipped). Precached once a version
   (decision 322), it costs a download per deploy, not a launch; one chunk stays the right shape
   for an installed app (decision 328) until it costs her a slow first launch on a new version.
   The big files are data, fine as data (`sprites/items.ts`, `data/villagers.ts`,
   `sprites/pets.ts`, `types/ids.ts`); a redraw should split by family as `sprites/doll/` was.
3. **A tool used with a seed in her hand** (1.5's, still open). Decision 110's rule, that what she
   holds follows what she does "unless she's holding a seed", is older than the rod: a tap on a
   fish with a seed in hand casts and lands it, but the rod is never taken up, so the line is drawn
   from the seed packet. The mend is a line in `World`'s `fish` arrival and a decision re-opening
   110 for the rod alone. A kite in hand (1.6's X6) falls under the same rule: `Hands.use` takes a
   tool up only from another tool, so with a kite held the rod isn't taken up either.
4. **The new systems' rough edges** (1.4 to 1.6).
   - **The big wheel's company is rare** (X2, decision 381): she rides with her husband or the
     neighbour she's closest to _at the fair_, and nobody's schedule brings them there but the
     fair's happenings and Agatha's weekend afternoons, so most rides are alone with the mayor's
     plaque. A neighbour's weekend stop at the fair (a `Stop` row) would mend it. The ride's
     picture (`sprites/fairRide.ts`) is lit by the hour but drawn green all year, so in January
     she rides over a summer town from a snowy fair; and the sheet's line "your first ride today
     is on the house" stays after the free ride is spent (the button says 10).
   - **Snow** (X4, decision 383): the snowball half rolled in her yard isn't saved (`Yard`'s
     `ball`), so a reload loses it (a snowman, once stood, is saved); the rainbow's ten minutes are
     kept in memory (`Forecast.rainbow`), so a reload brings ten more, which harms nothing. Only her
     yard builds snowmen.
   - **The kite's wind** (X6, decision 385): `windyOn` deals a windy day per place from the day
     key, and the ambience follows it (`breezy`, +0.3 wind there); but the ambience's own wind is
     still fixed by place (none at Lantern Shore but on a kite day), so two rules say "wind". The
     `holding` cue on `PoseCues` (her `holdUp` while it flies) is optional, like `swinging`, and
     is asked before every action pose, so a kite up masks any other pose; harmless, since any tap
     winds it in first. The castle's `lookout` field is under the woods' crowns, so she flies it
     from under a see-through tree; the pier's end is the open one.
   - **The photos** (X1, G5): the party photo and the camera's are cut from the frame as it
     stands, so the neighbours' chatter bubbles and a question's "?" are in them; a mend would
     draw the shot without the effects layer.
   - **The hens and the delights** (X3, X5): the hens are worked out from the clock and drawn
     only by the view (`henAt`), so nothing can walk up to one; a delight (butterfly, fireflies,
     the crow) is only what the view shows, never a thing in the world. Both on purpose, both
     cheap; a hen to pat would need a stepped walker like `Pet`.
   - **Earlier ones, still so**: the camera's drawer covers the polaroid's foot on a phone on its
     side (`hud/cameraStyles.ts`); the attic's `TALL` list is held to the art by a test; the lake
     never freezes (decision 372); shinies are charmed after nine months (decision 370).
5. **Smoke on the real clock, and on part of a run.** Most sections open on a named day (`openOn`,
   `PLAIN_DAY`), but a whole run's first sections play on the container's real date and hour, so the
   town they meet changes with the day (the known flakes, `camera`'s top row with a toast up,
   `interiors` at 19:00 and `faces`' `tapToastAway`, are the kind). And a section run alone may miss
   what one before it left: X5's `delights` checks pass in a whole run and can fail in a partial one
   (`npm run smoke -- feel`), so a failure there alone is checked in a whole run before it's
   believed. A whole run is 707 checks and about half an hour now (forty with the container busy).
   The helpers plan walks over the map's ground (`nextTapToward` reads `map.solid`), so they can't
   walk her off the frozen pond; a tap to the bank first does.
6. **What a build doesn't reach.** The cast is cast (decision 355), but the passers-by (the
   wayfarer and Moira) are hers, `UNROWED_BUILDS`'s default.
7. **The bed card's pause.** Its buttons wait `SETTLE_MS` after the card shows (on purpose, against
   a stray tap; the second tap on the bed does the job at once).
8. **The art notes** at the end of `docs/handoff.md` are the art's list: X1's photo and 1.6's
   four (the hens' heap at one side of their run, the ride's green town in winter, the barn and
   coop unlit at the festival, the castle's kite field under the trees), 1.5's five, F4's three, F3's left for her eye, the frozen pond's ring and the builds at Close. None is
   clearly wrong; each is for her eye on her phone.

**Done since 1.0** (decisions 325–386), kept short; the decisions and the tables above hold the
detail. The 1.1 plan made smoke a file per area and the suite two vitest projects (T1, T2: 346 s
to 121 s), gave the cast three bodies (A5a, A5b: `Build`s, `measureOf`, `looksHeld`), turned
arriving into a table and the overlays into one list (W1, both held by snapshots), gave her rooms
a keeper and a planter's bed its room (W2, save v55), drew `OutdoorView` in passes and split
`Talk`, the Apis and `main.ts` (A4, W3), named the areas' order (`AREAS`), the legend's rule, and
pulled the pets' paths taut. 1.0.1 fixed 1.0's small things (X1, X2). **1.3** kept `happeningsAt`
for the hour and the day key by the minute (F2: a town step at Close a third to a half cheaper, a
long A\* three times faster, the suite 17% shorter), dropped `Home`'s 27 and `Neighbourhood`'s 10
forwarders and stamped the save by the world's clock (F6). **1.4 and 1.5** added content on those
seams and changed nothing in the code's shape: shinies (save v56), the winter wardrobe and sets,
ice fishing and the ice hut, the night sky (v57), the photo mode, the attic (v58) and Pickle.
**1.6** fixed the festival's lights (X1: the eave strings from the roofs' own edges, the fair's
poles pole to pole, both held by `eaveLights.test.ts`) and added content the same way: the big
wheel's ride, the hens (v59), snow days and the rainbow, the small delights, Gerald and the kites;
its review kept the kite in view on a phone on its side.
