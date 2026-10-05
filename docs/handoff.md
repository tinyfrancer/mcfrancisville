# Handoff: picking up version 0 cold

Written 2026-09-26, updated at the end of phase 12 for a fresh session. Version 0 is built; keep
this current until it's in her hands, then trim it to what version 1 needs.

## In progress

**0.3 is under way (settled 2026-10-04, decisions 212–217; the plan is `docs/v0.3_plan.md`).**
Five lanes of sessions on `v0.3-dev`, **two lanes at a time**: lanes 1 and 2 first, lane 3 when
lane 1 finishes, lane 5 when lane 2 finishes, lane 4 last. W1 (the `build.ts` split by area) runs
alone before any lane; V1 (review and release) alone after all five. Each lane's heading below
is kept by its running session (what's done, what's half done and where, the next steps); a
session that starts cold and finds a heading mid-way resumes that work on its branch. **A session
starting cold with no lane named reads the plan's status line and these headings, and asks the
user which lane to take.**

### The coordinating session (read this first if you are it)

Written 2026-10-04 at the end of the planning session, for a fresh **Fable** session that runs
the lanes as **Opus 5.5 sub-agents** (the `Agent` tool, `model: "opus"`, `isolation: "worktree"`,
one agent per plan session, two at a time: decision 212). The planning session had no tool to
start separate cloud sessions, so this is how 0.3 runs; the user watches the draft PRs and these
headings on GitHub. What's true now:

- **W1 landed** (PR #126, decision 218). **Next: A1 (lane 1) and H1 (lane 2), side by side.**
  Then A2/H2 and so on; lane 3 when lane 1 finishes, lane 5 when lane 2 finishes, lane 4 last.
- **Two cut-off starts exist, untested:** `claude/a1-boots-under-skirts` (one WIP commit, 3
  files, branched before W1 merged) and `claude/h1-chest-takes-things` (one WIP commit, 10
  files). The suite was never run on either. The A1 and H1 sessions may build on them (merge
  `origin/v0.3-dev` in first) or delete the branch and start over; either is fine.
- **No PR is open** against `v0.3-dev`.

How to run a session as a sub-agent (what worked for W1):

1. One `Agent` call per plan session, with the prompt from the plan ("A prompt for a lane
   session") filled in, **plus** the paragraph below on GitHub, the setup line, and the suite
   line. Two independent sessions go in one message so they run at once. The call returns when
   the agent finishes (hours), with its report; between calls, check in with `send_later` every
   half hour so the session is never idle with a lane unstarted.
2. **Setup in a worktree:** `node_modules` isn't there, so the agent runs `npm ci` (never
   deletes the lockfile). It branches with `git fetch origin v0.3-dev && git checkout -b
claude/<session> origin/v0.3-dev` and checks `git log --oneline -1` matches GitHub's
   `v0.3-dev` (a stale remote-tracking ref bit the planning session once; `git fetch origin`
   with no refspec, then `git reset --hard <sha>`, fixes it).
3. **Two dev servers at once:** smoke needs `npm run dev` running; with two agents the second
   must use another port and tell smoke (check how `scripts/smoke.mjs` finds the server before
   assuming). Every agent kills its dev server when done; a stray `vite` was left once.
4. **GitHub from the container:** GraphQL is blocked, so `gh pr …` fails. Use the REST API:
   open a draft PR with a JSON body file and `gh api repos/tinyfrancer/mcfrancisville/pulls
--method POST --input body.json`; mark ready with `gh api …/pulls/<n>/ccr/ready_for_review
--method POST`; CI with `gh api …/commits/<sha>/check-runs --jq '.check_runs[] | "\(.name):
\(.status) \(.conclusion)"'` polled until both runs are `completed success`; merge with `gh api
…/pulls/<n>/merge --method PUT -f merge_method=merge -f commit_title="Merge pull request #<n>
from tinyfrancer/claude/<branch>"`. Put all four in every agent's prompt.
5. **Save bumps:** an agent that changes the save bumps in its last commit after merging
   `v0.3-dev`; if two save-bumping PRs are ready at once, merge one, have the other merge
   `v0.3-dev` again and renumber, then merge it. Lane 1 never bumps.
6. **When an agent returns:** read its report, confirm on GitHub that its PR merged and the
   plan's status line and its lane heading were updated (W1's agent did both in its last
   commit), then start the lane's next session. If it returns without merging (cut off, a red
   suite it couldn't fix), its heading says where it stopped: start a fresh agent on the same
   branch to resume.
7. Never merge to `main`; the release is the user's. ⬆ in the plan marks the suggested points;
   the first is after lane 1 (A4).

### The lane rules (every lane session, from the plan)

1. Branch from the latest `v0.3-dev` (`git fetch origin v0.3-dev && git checkout -b
claude/<session> origin/v0.3-dev`); the PR targets `v0.3-dev`, is opened as a draft at the first
   push, and is merged by the session itself with a merge commit once green. Nothing goes to
   `main`.
2. Before starting: read `CLAUDE.md`, this section (your lane's heading and these rules), your
   session's paragraph in `docs/v0.3_plan.md`, and decisions 212–217. Personal touches are parked
   (decision 177): ask no questions, add none; pick the warmest default and name it in the
   decision.
3. The whole suite in the container before every push: lint, format:check, typecheck, test,
   build, and smoke with `CHROMIUM_PATH=/opt/pw-browsers/chromium`. CI runs on the draft too.
4. Commit and push at least every half hour, and update your lane's heading here with each push.
5. Decisions in your lane's block (lane 1 from 220, lane 2 from 230, lane 3 from 240, lane 4 from
   250, lane 5 from 260), appended, never edited. Add your line to the 0.3 `NOTES` row in
   `src/data/patchNotes.ts`; V1 folds them to five.
6. A session that changes the save bumps `SAVE_VERSION` in its last commit, after merging the
   latest `v0.3-dev`, taking the next number, and says so in its heading; save-bumping PRs merge
   one at a time. Lane 1 never touches the save.
7. New rows in a const of their own, new art in a file of its own, a new rule in a system of its
   own; a shared file gets lines added, never reshaped.
8. Merge `v0.3-dev` into the branch before marking the PR ready, resolve any conflict, rerun the
   suite, then merge.
9. When the PR has merged: update the plan's status line, set your heading to "<session> landed
   (PR #n). Next in this lane: <session>", and stop.

### W1 (before the lanes)

W1 landed (PR #126). Lanes 1 and 2 may start. The world is made by area in
`src/world/areas/` (decision 218): a new service is a line in its area's function and interface,
a field in `build.ts` and its assignment in the constructor.

### Lane 1: her and the view (A1 → A2 → A3 → A4; decisions from 220; never the save)

A1 landed (PR #130, decision 220: her shoes go on under any hem, a neighbour's too). A2 landed
(PR #132, decision 221: capes and wings have a part behind her and one over her, `backRows`, and
her hair tucks into the cape's collar). A3 landed (PR #134, decision 222: a tree whose crown hides
her, or something within three tiles of her she might want, is drawn at half alpha, eased by the
fixed step, `src/render/occlusion.ts`). A4 landed (PR #135, decision 223: every food's card says what eating it does, from its effect in
`src/hud/food.ts`, the stove's groups say the same, and a chip in the top bar shows each meal's
effect while it lasts, `src/hud/MealChips.ts` and `Kitchen.buffs`). Lane 1 is finished.

### Lane 2: her home (H1 → H2 → H3 → H4 → H5; decisions from 230)

H1 landed (PR #131, decision 230, **save v35**: her storage chest takes things from her bag, put
away from the bag's card at home and taken out on the chest's Items tab).

H2 landed (PR #133, decision 231, **save v36**: set pieces show one of every thing of their kind
she owns, in her bag, her chest or on show, and display pieces hold one thing from her bag,
`Placed.shows`). Next in this lane: H3. For H3: the bead jar, bell jar and bud vase are natural
`small` pieces; a display piece's `shows` must ride along when its surface moves, and come back
to her bag if it's put away.

H3 landed (PR #136, decision 232, **save v37**: a small piece stands on a surface's tile,
`Placed.on`, one to a tile, rides along when the surface moves and goes in the chest with it;
`SURFACES` and `SMALL` in `src/data/tabletop.ts`). Next in this lane: H4. For H4: `on` is per
placed piece, so a room's pieces keep it as they are; a rider's surface is found by its tile
(`surfaceAt`), within the same room's list.

H4 landed (PR #139, decision 233, **save v39**: her home is rooms, `ROOMS` in `data/home.ts`, `Home` keeping each room's pieces, walls, floor and size with the chest shared and `here` the room she's in; the back room through an arch by the chest, built by the `backRoom` recipe; doorways crossed within `home`, `Crossing.room`). Next in this lane: H5. For H5: `Home` reads the room she's in, so a `Yard` keeper beside it is cleanest for `Decorator`; planters are kept to the front room (`refusesHere`) because the garden keys a home bed by tile alone.

H5 landed (PR #141, decision 234, **save v40**: her yard, the town map's `yard` box round her house; `systems/yard.ts` says which tiles take a piece and refuses any that would cut off a tile or anything walked up to; `world/Yard.ts` keeps what stands there, the storage chest shared with `Home`; `Decorator` works on either through `Decorable`; a 🪴 button in the ☰ tray while she stands in it; ten pieces in `data/yard.ts` that `OUTDOOR` lets go out, with six she may have already). Lane 2 is finished. **For S2:** Gourdon's book should list H5's outdoor pieces (`YARD_WARES` in `src/data/yard.ts`); they are sold at Cobweb Corner alone for now.

### Lane 3: the farm (F0 → F1 → F2 → F3; decisions from 240)

F0 landed (PR #138, decision 240, **save v38**: Lantern Shore's beds are a 2×2 block up the west
bank and the lamp a tile over, so the way round the lake is whole; `tests/data/zones.test.ts`
walks every place on foot, with Whisperwood's heart-key bank named as across the ice on purpose
in `ACROSS_THE_ICE`; smoke's `edges` walks the ring). Next in this lane: F1. For F1: Boo Acres
must pass the on-foot test, every lot's house standing and every `{ beds }` row built.

F1 landed (PR #140, decision 241, no save change: Boo Acres down the main road west of town,
`BOO_ACRES` with `FARM_LEGEND` and `BOO_ACRES_SPOTS`, art in `src/sprites/farm.ts`; the farm's
extension rows 3 and 4 are its, `fieldRow` and `lastFieldRow`). Next in this lane: F2. For F2:
the greenhouse (`greenhouse`, door at its middle column) needs only an `INTERIORS` row, a
`ZONES` row and a `doors` entry in `BOO_ACRES`; each fruit tree is its own prop with a `spent`
look already, so a `PROP_YIELDS` row each is all it takes; the pond has town commons (ghost
minnows, pumpkinseeds) in its `where` until C2; the seed cart (`seedCart`, its front at the
`seedCart` spot) and the barn (`barn`, its doors at `barnDoors`) are props to walk up to. F3: the
farmhouse (`farmhouse`, door at its middle) wants its room, `ZONES` and `doors` rows; spots
`porch`, `fields`, `orchard`, `seedCart`, `byTheWell` are there for Scarah's schedule.

F2 landed (PR #142, decision 242, no save change: fruit from the orchard's trees each window and
four dishes in `src/data/orchard.ts`, the seed cart `seeds` in `SHOPS`, the greenhouse room
`greenhouse` with `underGlass` and `raisedBed` fixtures that are beds, `growsQuick` in
`systems/greenhouse.ts`, the barn's wall `world.barn` and `hud/BarnSheet.ts`). Next in this lane:
F3. For F3: the seed cart's greeting in `SEED_CART` (`data/shop.ts`) is neutral, ready to be
Scarah's; the fruit (`apple`, `pear`, `plum`, `persimmon`) and the orchard's dishes are free to be
among her loves; the greenhouse has three `stands` for a visit; a neighbour in the greenhouse
stands among raised beds, so keep any new stand off a bed's only open side.

F3 landed (PR #144, decision 243, **save v42**: Scarah, a plain `VILLAGERS` row in
`src/data/scarah.ts` with her pieces, her farmhouse `scarahFarmhouse` through the farmhouse's
door, her art and Cornelius in `sprites/villagers.ts` and `sprites/scarah.ts`, a `Reward` that
may carry `also` wares and a `called` name, and the meal chip's "till noon"). Lane 3 is finished.
**For C2:** Scarah loves beetles (`ladybug`, `jewelBeetle`, `mossBeetle`); a pond fish of the
farm's own is free to be among her `says` lines.

### Lane 4: collecting (C1 → C2 after F1 → C3 after S2; decisions from 250)

C1 landed (PR #146, decision 250, **save v43**: fossils, twelve rows in `src/data/fossils.ts`,
a mound a day on each map's `digSpots` (`zones/Mounds.ts`, `systems/fossils.ts`,
`world.fossils`), the Cabinet's Fossils tab, the museum's seventh case with Crumbs & Curios three
tiles wider, the `fossilWing` and `fossils` shelves, and `cabinet.donated` taking fossils). Next in
this lane: C2. **For C2:** the eighth case has room below the seventh, at `crumbs` (20, 8), and a
new critter's `where` must keep clear of the dig spots (`tests/data/digSpots.test.ts` reads every
habitat). **For C3:** a fossil has no `price`, so a fossil figurine stays out of Gourdon's book;
`FOSSIL_ART` is a fossil's picture at 24, as `CRITTER_ART`'s `world[0]` is a critter's.

### Lane 5: shopping (S1 → S2 → S3 → S4; decisions from 260)

S1 landed (PR #143, decision 260, **save v41**: `Belongings.ever`, everything she has ever had
that the catalogue lists; Ollie's `postCounter` opens `hud/CatalogueSheet.ts`; an order is paid
as it's placed and `Deliveries` posts it from 5am the next morning as an `order:<kind>:<id>:<n>`
letter from Ollie with the thing in it). Next in this lane: S2. **For S2:** send Gourdon's
made-to-order pieces with `world.deliveries.send(ware)` after taking the Candy
(`Catalogue.order` is the model); `orderPrice` in `systems/catalogue.ts` is the shelf's full
price to put his quarter on; the ware rows on a sheet are `drawWare` and `faceOf` in
`hud/wares.ts`.

S2 landed (PR #145, decision 261, no save change: Gourdon's `carpentersBench` opens the
`workshop` shop, `data/workshop.ts`: **Fresh from the bench**, `WORKSHOP_SHELVES`, three a day from
`WORKSHOP_PIECES`, every piece with a price, at the shelf price; **his book**, every one of them
made to order at `BOOK_MARKUP` over the shelf price, `bookPrice` in `systems/workshop.ts`, sent
with `world.deliveries.send` by `world.workshop`). Next in this lane: S3. **For S3:** a set's
pieces are in Gourdon's book and on his bench the moment their rows have a `price`; nothing to
add there. **For C3:** the workshop's tabs are rows in `COUNTER_TABS` (`hud/ShopSheet.ts`): add a
`figurines` tab id there and a branch in `render`; a figurine piece with no `price` stays out of
his book and off his bench.

S3 landed (PR #147, decision 262, no save change: four furniture sets of seven pieces, rows in
`data/sets.ts` (`SUITES`, `SET_FURNITURE`, `SET_WARES`; a set is a "suite" in code, since H2's
`SetPiece` is taken), art in `sprites/sets.ts`; a set piece a day on Cobweb Corner's Furniture
shelf and **This week's set** dealt whole `everyWeek`; the counter, vanity, nightstand and desk
are `SURFACES`, the kettle, cookie jar, lamps, globe and seeing stone `SMALL`). Next in this lane:
S4. **For S4:** a new set is a const in `data/sets.ts` and a row in `SUITES`, with a `SuiteId` and
its piece type in `types/ids.ts`, and it joins the weekly shelf by itself; `tests/data/sets.test.ts`
expects four sets, so make it eight. The kitchen's worktop height is `WORKTOP_FROM` in
`sprites/sets.ts`, for a bathroom sink to match. Two scratch helpers worth having again: the
gallery sheet (`npm run sprite -- 'furniture:<id>' --sheet`) and a Playwright page that lays
pieces out at home with `world.home.store`, `takeOut` and `move`.

### V1 (after the lanes)

Not started.

**0.2.5 is released to `main` (2026-10-01, PR #123, at the user's word): everything is open
(decision 211).** Every neighbour lives in town from the first day, no place or feature is gated,
and save v34 is on her phone. **From here, new neighbours come with releases**, perhaps themed to
the release: a villager row, a home, art and their place in the happenings, there from the moment
the release lands, never written or moved in over time. A session starting cold with nothing
asked of it does nothing to the game and asks the user what they'd like next.

**0.2.4 is released to `main` (2026-10-01, PR #120, at the user's word); the 0.2 plan is complete.** V1 (PR #119,
decision 210) was its last session: the shakedown, the review, perf, the docs and this handoff.
Her phone goes from 0.2.3 (save v31) to 0.2.4 (save v33). **What comes after 0.2 is the user's call too:** there is no plan after
`docs/v0.2_plan.md`. A session starting cold with nothing asked of it does nothing to the game
and asks the user what they'd like next.

### What 0.2 built, for a later session

Each line points at the decisions that hold the detail; `CLAUDE.md`'s "Where things are" is the
map. All of it is on `v0.2-dev`; 0.2.3 is on `main`, and 0.2.4 is the release PR.

- **The UI lane (A):** one sheet frame, a picture and tabs (U2, decision 179); the neighbours
  sheet from the top bar's 👥, a page each and Find (U3, decision 180); Settings, the map's
  compass of ways out and the calendar's tabs, spans and birthdays (U4, decision 181).
- **The save lane (B):** the piano and anything that `plays` (G2, decision 190); Boothoven, the
  ghost composer, written two days after the game hears of him, welcomed round the well (L1,
  decision 191, save v32); his lessons, a tune a day, and their duet at the castle on her
  anniversary (L2, decision 192, save v33).
- **The place lane (C):** the Hollow Fairground through a gate opened by a heart with Boothoven
  (M1, decision 200; open from the start since decision 211); its stalls, games, snacks and fortune as `ACTIVITIES` rows (M2, decision
  201); the contest, parties and market day at its stage once it's open (M3, decision 202).
- **The lanes before (1 and 2):** her bracelets on her wrist (W1, 164, v28), shelves to finish
  (F2, 167, v30), beds by the creek and lake (N1, 165–166, v29), more Candy (E1, 168, v31); fences,
  storms and geese (K1, 170), the rod's colour per phone (K2, 171), music everywhere (H1, 172),
  the fountain's music box (H2, 173), sitting (G1, 174), small talk (D2, 175), twelve crops (N2,
  176). Before them W3 (161) and the newcomer fix (162); 0.2.2 (160) and 0.2.1 (159).
- **V1 (decision 210):** lived-in 0.2.2 and 0.2.3 saves are test fixtures, Boothoven no longer
  stands on her at the duet, the world's options live in `world/options.ts`, perf walks the
  fairground, and `docs/architecture.md` says where it hurts now (the `build.ts` split by area is
  written down in decision 210).

**Open questions** are under "Still to put to the user" below, kept as they are: personal
touches are parked (decision 177), so no session asks them until the user takes them up.

**Standing notes:** Vercel previews are off for `claude/**` and the dev branches
(`vercel.json`). CI runs on every PR, drafts included (decision 139). Run the whole suite, smoke
included, in the container before each push. Rerun `tests/systems/rarity.test.ts` when adding a
critter. Smoke's `places` section fails "a tap on the toast sends it off" when run alone
(`--section=places`); the whole run passes. Question 35 (a running joke for the mayor's notes)
had no answer.

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

Since phase 6 she has Candy (🍬, top left; 300 to start since phase 12). Walking up to the teal shop opens
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
records.

Since phase 8 she can **make things**. Her workbench stands by the wall at home, and walking up
to it opens it: bracelets strung from beads, furniture from what she gathers and grows, and two
extensions that make her room bigger. Beads (hearts, LOVE, smileys, footballs in her teams'
colours, a bat and a ghost) turn up when she chips a rock or now and then shakes a tree, and
Cobweb Corner's Crafting shelf sells two a day and a recipe card.

Since phase 9 she has **neighbours**: Maude the ghost librarian, Rufus the werewolf florist,
Wrapunzel the mummy baker (at Crumbs & Curios, east of the square, with her museum at the back),
Agatha the witch, Barty the skeleton gardener, and Cody the vampire, "Pimp Daddy Francis" to
everyone else. They amble between stops as the hours turn. Walking up to one opens a talk: their
line, their hearts, Chat, Give a gift, a favour if they have one today, and Bye. A talk and a gift
count once a day; letters with gifts come to her mailbox (by her door, flag up) at three, six and ten
hearts. Cody welcomes her back every time she opens the game, calls her babe, and now and then lets
one go ("You're getting on mah nerves!"). On about two days in seven the Chocolate Banana Watermelon
Moon Pie Man sets up his cart somewhere.

Since phase 10 there are **critters**: nineteen moths, bats, frogs, orbs, beetles and ghost-fish,
five kinds out each hour by the lanterns, trees, pumpkins, graves, flowers and pond. Tapping one
walks her up to it and she swings her net; the luna moth, the vampire bat and the pair of orbs
flutter off once first. Catches go in her bag. The 📖 opens the **Curiosity Cabinet**, with
silhouettes for those still to find and when and where to look, and walking up to Crumbs & Curios
opens **Wrapunzel's museum**, to donate one of each.

Since phase 11 she has **her pets**: Florence, Fibi, Dolly and Gary, and Wybie and Elvira as
see-through, softly glowing ghost pets, all at home from the first day. Walking up to one pets it
and opens its sheet: Pet, Come for a walk (one at a time follows her about town, and in and out of
her door), Dress up (collars and bandanas; Fibi starts in her pink spiked collar, Dolly in her blue
bandana, and Cobweb Corner's "For the pets" shelf sells more), and Rename. Florence naps under her
blanket, Elvira curls up beside her, Dolly barks at neighbours and hides behind her, Wybie gets the
zoomies, Gary lags and turns up anyway, and Fibi whines, smells a bit and loses a bone on most
days, in town or under the furniture, for her to find and hand back.

Since phase 12 the town has **its finishing touches**. Cobweb Corner now and then has the Long neck
Yoshi plushie, a rhinestone guitar and a butterfly frame on its furniture shelves, and a patchwork
coat of many colours on its clothes shelf. Once she has a name, **the mayor** writes to welcome
her, and again a week later; nobody has ever met them. Walking up to the corkboard at home opens
**the case**: clues pinned as she reads those letters, makes a friend, catches five kinds of
critter, buys from the Moon Pie Man, and catches **Wes** (trench coat, hat pulled low, a big
moustache) peeking round a tree at the edge of the screen, gone by the time she's near. On 06-06
Cody writes "I love you to the moon and back" and sends the forever orbs, which count the years.
There is **sound**: soft cues for every find, catch and letter, a patter of blips when a neighbour
talks, a music-box waltz, and an original tune for each record; Walk the Tomb gets her dancing,
and Cody comes over to dance with her. Settings has switches for sounds and music. A new game
starts with 300 Candy. **Next is the handover** (below).

Since phase E (v0.1) there are **places beyond the town**. The road east out of the square runs
on into **Whisperwood**, and past its frozen creek is **Lantern Shore**, both first drafts in the
town's own tiles until phase I. The first time she finds the woods, Cody posts her the ice skates
from their first date, and with them the creek opens for good. The 🗺️ button opens the world map:
the places she has found, their paths, a question mark down each one not yet taken, and a tap to
go straight there. Rufus picks wildflowers in the woods in the morning, and Agatha gathers herbs
there after dark; neighbours walk out by the edge and come in by it.

Since phase F the town is **re-laid and drawn at 32**. The ground is auto-tiled: ponds with banks,
cobbled paths with worn kerbs, bushy hedges, raised garden beds, and a cliff with steps up to a
lookout at the top of town, where the way to the castle hill will open. Trees come in teal, autumn
orange and dusky plum; rocks, wildflowers, every crop, the hostas, her rose bush and the farm sign
are redrawn. The town is bigger (40×50): her house and Hosta La Vista Farm top-left, the square in
the middle with Cobweb Corner, the Muse and Crumbs & Curios round it, the graveyard garden
bottom-left, and a **park** bottom-right round the pond, with a **fountain** that lights up at
night and **the big willow** on its bank. Each building has room round it for phase G's bigger
one. The buildings, lanterns, fences, pumpkins, gravestones and the well are still version 0's.

Since phase G **every building is drawn at 32**, each after whoever it belongs to. Her plum
house has Skelly in the front yard, twelve feet of friendly skeleton with his arms out like a
zombie ("Skelly." on a walk up), and two pots by her door: walking up to one brings the next plant
round (orange mums, plum mums, succulents, little hostas). Cobweb Corner has a curly false front,
cobwebs and a spiderling at home in one; the Muse is pink under a mansard with a salon chair and
a hood dryer in its windows; Crumbs & Curios is a brick bakery beside a little stone museum. The
pop-up hangs its banner, and the Moon Pie Man stands behind his cart's counter. Each neighbour
has a house: Maude's gothic library up by the lookout, Rufus's thatched log cabin and Agatha's
witch-hat cottage (a cauldron by the door) in the west meadow, Barty's potting cottage with its
greenhouse and Cody's gothic manor (a bat on the weathervane) along the road below the cliff.
Walking up to a neighbour's house names it and finds a note on the door; going in is phase H.

Since phase H **every building has an inside**. The Muse is black and gold (a gold damask,
black chairs with gold, candelabras) with a pin-up portrait of Seana on the wall, painted from
her look as it is, winking with a hand behind her head (decision 101). Walking up to one goes in through its door, with
a line about the place, and the mat inside goes back out onto the step. Cobweb Corner has
shelves of jars, a clothes rack and its counter, which opens the shop; the Muse has two pink
chairs at oval mirrors (either opens the salon), a wash basin and two hood dryers; Crumbs &
Curios is a bakery on the left (a brick oven, a case of cakes) and Wrapunzel's museum on the
right, six glass cases, one for each family of critter, which open the museum and show every
critter she has given it. Each neighbour's home is furnished after them around a piece of their
own (Maude's bookshelves, Rufus's flower buckets, Agatha's great cauldron, Barty's potting bench,
Cody's pipe organ), and holds two keepsakes: walking up to one says whose it is, and from two
hearts (the first) and five (the second) they let her have one just like it, into her storage
chest. Her neighbours are out and about rather than at home; being home by the hour is phase S.

Since phase I **the places beyond the town are filled in**. Whisperwood has old trees with sleepy
faces in their bark (more wood, now and then a bead), clumps of toadstools to pick, a herb glade,
and a frozen creek she skates down to Lantern Shore. The shore is a still lake with reeds, lamps
along the bank, paper lanterns afloat on lily pads that light up and bob after dark, and a pier out
into the middle with a rowboat tied beside it. Each place has critters of its own: toadstool toads
and will-o'-the-wisps by the toadstools, moss beetles, mist newts, moon carp, the shy ghost pike
and lantern bats at the shore. At the top of the herb glade a trail of toadstools leads to a gap
in the thicket: the way to **the hidden clearing**, a secret that isn't on her map until she finds
it, with a ring of toadstools round a mound and the wishing moth, found nowhere else. Digging up
the mound gives her the castle key, which opens the gate at the town's lookout (its hint says
where the key is) up to **Castle Mac-A-Boo**: a little stone castle with plum cones on its towers,
orange and black banners, a garden of milkweed and roses round a wedding arch, and monarch
butterflies everywhere, fluttering by day and caught only there. Cody writes when she first gets
up there. The castle's great door is shut ("Closed for dusting").

Since phase J **everything indoors is drawn at 32**: every piece of furniture (her first day's,
the shops', what she makes, what her neighbours give her and the keepsakes in their homes), the
wallpapers, floorings, door mat and storage chest. Beside her pumpkin armchair stands **her
stained-glass lamp**, a domed shade of glass roses and leaves on honey-gold that glows after dark;
a home furnished before it finds it in the storage chest.

Since phase L **the town has weather and small life**. Most days are clear; now and then a day is
rainy or foggy (the same everywhere, from the day key, and never on her special days). Rain falls
and splashes, the light goes a little grey with every window lit, and it waters her whole garden
for her; frogs and fish love it, and a see-through raindrop frog comes out only then. Fog drifts
in dithered clumps, and brings out the orbs, the moths and a soft grey veil moth. She's told once a
day when she first steps out into it. On every day, glints come and go on the water and the frozen
creek, long grass sways as gusts cross the ground, and smoke curls up from her chimney, the
bakery's, Barty's and Cody's two. Fallen leaves lie under the trees, lily pads float on the ponds,
pebbles are scattered on the paths, and every place has clutter placed by hand: bushes, stumps and
fallen logs, benches by the pond and the lake, signposts at the forks, barrels by the shops, and
on the farm a hay bale and a friendly pumpkin-headed scarecrow with a crow on its arm. The last of
version 0's props (the jack-o'-lanterns, lamps, gravestones, iron fence, the well and her mailbox,
now with a heart on it) are drawn at 32, so nothing in the world is baked at 2× any more.

Since phase M **her things are easier to find**. Every sheet looks the same: a title that stays
at the top, the middle that scrolls, and Done at the bottom right. Her bag, closet, storage chest,
Curiosity Cabinet and workbench are one kind of list: chips along the top to show only one kind
(seeds, dresses, rugs, bats…), a button that changes the order (by kind, new first, A to Z, most
first), a search box once there are a dozen or more, and a little yellow "new" on anything that
came since she last looked, with a dot on its button until she does. The closet is a grid of
close-ups of her in each piece, worn with a tap (a hat or glasses off with another), the colours
of the last one picked along the bottom. Critters in her bag and the Cabinet are their bigger,
town-sized pictures. Outdoors, **a quick bar** along the bottom holds her hands, her net, her
watering can and each of her seeds: a seed picked up there is planted straight into the next bed
she walks up to, no questions asked, and she holds whatever she used last, drawn in her hand.

Since phase N **the day has three windows**: morning from 5, afternoon from noon and evening
from 6. The trees, rocks, flowers and toadstools have more for her each window, and a resting one
says when ("More this afternoon!"); Cobweb Corner has a special each window, a quarter off; and
when a window turns while she plays, the town says good morning, afternoon or evening. Under her
Candy a little chip shows the window and the date, and opens **the calendar**: today (its window,
its weather, what's on and who's in town), a month to page through with her birthday, their
anniversary, Cody's early birthday, the big holidays and the town's events marked, and what's
coming up. The town's events already do something: on market day (the first Saturday) Cobweb
Corner puts out a market table, on a full moon the night is brighter and silver and full of moths
and orbs, and on a lucky Friday the 13th beads turn up everywhere. At the top of the square stands
**a noticeboard**: three notes from her neighbours each window ("NEED 3 moonpetals FOR A
BOUQUET!!!"), each paying Candy and a little friendship when she hands over what it asks for.

Since phase O **Cody's greeting changes**. On a holiday or a town event's day he has a line for
it the first time she opens the game; now and then a little red Tesla drives across his greeting
and she gets him first ("Red one! 👊"), or he reminds her to feed her Pokémon; otherwise he says
good morning, afternoon or evening, or how long she's been gone. Every day she opens the game is
**a visit**, and each brings a little gift, shown under his greeting: Candy, seeds, a bead or a
snack, and something for the house at her 7th, 30th, 50th, 100th visit and on. Visits only count
up, so a day away never loses anything. In her front yard stands **the candy tree**, a little
mint-green tree on a candy-cane trunk: it grows a few sweets every morning, afternoon and evening,
up to a week's worth, and walking up to it shakes them down as Candy. Outside the farm gate is
**the honesty stall**: she puts out what she grows, it sells four things each window at Cobweb
Corner's prices, and the Candy waits in its tin for her next walk past.

Since phase Q **she fishes**. Her rod is on the quick bar beside her net, with a pumpkin for a
float. Fish show only as shadows under the water, a ring going out over each now and then, a few
in every pond and the lake each hour (one more in the rain). A tap on a shadow walks her to the
bank and she casts; the float bobs, dips at a nibble or two, then goes right under with a "!" over
her head, and a tap then reels the fish in, into her bag and Curiosity Cabinet. A tap too soon
just reels in empty, and a bite she lets go comes round again. There are four new fish: the
pumpkinseed, the black catfish that purrs, the fog eel (only on foggy days) and the rare blue
moonfish, after dark at Lantern Shore. Barty and Agatha now and then pin up a note asking for one.

Since phase R **she cooks**. Her little black stove stands beside her workbench from the first
day, a kettle on the hob and a fire behind its door that glows after dark, and Wrapunzel lets her
use the oven in the bakery too. Walking up to either opens the stove: pumpkin soup, fish chowder,
moonpetal cake and, only after dark, a plate of the night's snackies to start with, and ghost
pepper chili, batty pumpkin pie, toadstool stew, rose-petal jam and moonflower tea from the
Cookbook shelf at Cobweb Corner. A recipe may want any fish, any crop or any snack, and takes the
plainest she has. In her bag an Eat button eats a dish, a snack or a treat: soup, chili or a snack
puts a spring in her step, chowder or tea has the fish biting sooner, and the cake, pie, stew, jam
and snackie plate each bring a moth, bat, frog, beetle or orb out near her to see what smells so
good, one she hasn't caught if she can, all until the window turns. Everyone likes a dish she
cooked, and each neighbour loves one or two (Cody's chili: "Marry me. …Oh wait. Best day ever,
again."). Barty, Maude and Cody now and then pin up a note asking for one.

Since phase T **newcomers move to town**, one a month at most. A month after her first day a
letter comes from the first of them, and they move in the next day; a month after that, the next.
Until then each one's lot has a little "SOON" sign on it, "SOLD" the day the letter comes. On
moving day their house is up, their boxes are stacked by the door, and they're standing beside it
with a hello. **Ollie** the postie (a human, with a cap and a satchel) lives in a little red post
cottage by the south road; **Nessa**, a shy sea-green lake monster with fins for ears who lights
the lanterns on the lake, builds a teal boathouse at Lantern Shore once she's found the shore;
**Gourdon**, a pumpkin-headed carpenter whose carved face glows after dark, moves into a giant
pumpkin past the bakery, but only in September to November; and **Hazel** the stargazer, Maude's
pen pal of twelve years, puts up a domed observatory in Whisperwood once Maude is a friend. Each
is a neighbour like the rest: a schedule, lines that tell their story as she gets closer, gifts
they love, favours, a home to go into with two keepsakes, and a recipe, something to wear and a
piece of furniture by letter at three, six and ten hearts.

Since phase U **the holidays come to town**. A few days before each big holiday (all December
for Christmas, all October for Halloween) every front door gets its dressing (a wreath, a heart,
a shamrock, a rosette, a corn wreath…), garlands of bulbs or bunting hang between the square's
lamps, and a piece stands in the square: a spooky Christmas tree with a skull on top, a pumpkin
tower, a rose arch, a pot of gold at the end of a rainbow, an egg tree, a flag, a long harvest
table, a glitter ball. At Christmas Skelly wears a Santa hat and fairy lights, and snow falls on
Christmas Eve and Day; there are fireworks on the Fourth and at New Year's midnight; from mid-
December to mid-January the park pond freezes over and she can walk out onto the ice, as on their
first date. Each big holiday has its gathering (the New Year's dip, Valentine's tea, a St
Patrick's jig, the Easter egg hunt with eight chocolate eggs hidden round town, the fireworks
picnic, and everyone round the well for the Halloween party, Thanksgiving dinner, carols on
Christmas Eve and the countdown), every neighbour has a line for every holiday, everyone hands
her candy corn on Halloween, and letters come at Christmas (a little tree for her house), on
Valentine's (Cody) and at New Year (the mayor). **Castle Mac-A-Boo has a great hall** now, set
for their anniversary, behind a heart key buried where the frozen creek bends in Whisperwood.
A dev build's `?day=2026-12-24` opens the game on any day to see them.

Since phase V **0.1 is balanced and reviewed**. What she gathers is small change (a few Candy a
tap wherever she is), so a round of the town is worth about a squishy or two and a day's play the
dearest thing in the shops, and Candy comes mostly from growing, catching, cooking and her
neighbours' notes and favours (decision 128). The art pass fixed what the drawing phases noted:
fireworks burst at places in the world, the lot signs and Skelly's Christmas bulbs read, the
Valentine's arch is wound with a vine, toadstools are bigger, the sprinkler is a bat, the
noticeboard has a slate roof, Nessa hangs a life ring by her door, the blue moonfish has a
crescent, the stove shows the fish it would use, the hall's music box dancers can be seen, and
Gourdon's pumpkin sits clear of the bakery. The layers' imports and the economy's shape are each
held by a test.

**How newcomers work, for phases U and V (decision 125):**

- A newcomer is a `VILLAGERS` row with a `newcomer` field (`letter`, `where`, `after` an `Unlock`,
  `months`, `unpacking`); `NEWCOMER_IDS` is the order they come in, `FIRST_NEIGHBOURS` everyone
  else. A new one is a row, a lot in a map (`lots`, and a door in `doors`), an interior with an
  `owner`, a house prop and a figure, and a party spot and special-day lines.
- `world.newcomers`: `residents()`, `moving(id)` ('away', 'coming', 'moving', 'settled'),
  `check()` once a day. Anything listing her neighbours should ask `residents()` (a holiday
  party, a letter from "everyone"), and anything dealing visits passes the settled ones.
- To try it in a dev build: a save's `newcomers.wrote` (`{ ollie: '2020-01-01' }`) has him
  moved in; smoke's `newcomers` section writes it over the save as the page reloads.

**How cooking works, for phases S, T, U and V (decision 122):**

- A dish is an item of kind `dish` (in `DishId`) and a `RECIPES` row of the same name with
  `at: 'stove'`; `stationOf(id)` says which station. `world.workbench.known` is her whole recipe
  book, `world.workbench.recipes` the bench's, `world.kitchen.recipes` the stove's. A card is a
  `card` price, sold on the Cookbook shelf; a neighbour could teach one as a reward, as at the bench.
- A need is `{ item, count }` or `{ any: Pantry, count }` (`PANTRY` in `data/dishes.ts`: fish, crop,
  snack). `reckon(id, count)` in `systems/crafting.ts` is what each need has to draw on, what would
  be taken and what's short; the stove and the workbench both take through it.
- What eating does is `DISHES[id].effect` (`effectOf` for any item). `lasts(at, now)` in
  `systems/cooking.ts` is true until the window turns; `luredCritter` picks a lure's critter.
  `world.kitchen`: `cook`, `canEat`, `eat`, `pace()`, `eager()`, `lure()`, and `kitchen` in the save.
  A new kind of effect is a branch in `Effect`, `Kitchen.eat`, a `Meals` field (and a migration),
  and whatever reads it.
- Phase U's holiday dishes are rows; phase S's neighbours could ask for a dish in a favour or bring
  one to her door (a `Ware` is `{ item }`).
- To try it in a dev build: `world.bag.add('pumpkin', 3)`, walk up to her stove at home, then
  `world.kitchen.eat('pumpkinSoup')`; `world.bag.add('roseJam', 1)`, `world.kitchen.eat('roseJam')`
  and `world.collecting.critters()` outdoors for the lured beetle.

**How the windows and the calendar work, for phases O, P, Q, S and U:**

- A window is `windowOf(now)`; `windowKey(now)` is `YYYY-MM-DD@window`. Something that refreshes
  each window keeps the key it was taken in (as `Takings` does) and compares; something daily
  keeps the day key, as before. `onceADay` in `systems/gathering.ts` is the list of takings that
  come back once a day.
- A shelf that changes each window is `everyWindow` on its `ShelfRow`, with an `off` for a
  discount; a shelf only on an event's days is `on: TownEventId`.
- A calendar day is a row in `CALENDAR` (`data/calendar.ts`) with a `When` rule, an `about` for
  the sheet and a `morning` line said as its morning begins; `happeningOn(day)` and
  `isHappening(id, day)` in `systems/calendar.ts` are how a rule asks. Phase U's decorations and
  dialogue read `happeningOn`; a new town event is a row and a `TownEventId`.
- `world.calendar.today()` is the day at a glance (the HUD's chip and phase O's greeting can use
  it), and the `today` state event fires when a window turns.
- A note on the board is a row in `NOTICES` (`data/notices.ts`): who, what, how many, the note in
  their words, and `windows` if it only fits some. `noticesIn` deals three from different
  neighbours; `world.noticeboard.answer(slot)` pays and thanks. To try it in a dev build:
  `world.noticeboard.notices()`, then `world.bag.add(item, count)`.

**How fishing works, for phases R and U (decision 121):**

- A fish is a `CRITTERS` row with `family: 'fish'` and a `shadow` (1–3), so it's a `CritterId`
  and an item in her bag like any critter: a recipe in phase R can take one as an ingredient.
  `isFish(id)` says which. A new fish is a row, its art in `CRITTER_ART`, and a nook in the
  museum's fish case (nine, all full now: a tenth fish needs a second case or a bigger one).
- Fish are dealt by `crittersOut` after the net's critters, `FISH_PER_HOUR` a place (`RAIN_FISH`
  more in the rain), onto the `pond` habitat. `world.collecting.critters()` lists both;
  `world.fishing.line` is her line (`castTo`, `step`, `reel`); `systems/fishing.ts` is its timing.
- To try it in a dev build: `world.collecting.critters().filter((c) => !world.canWalk(c.tx,
c.ty))`, then `world.tapTile(tx, ty)` on one, and any tap once `world.fishing.line.state` is
  `'bite'`.

**How greetings, visits and passive Candy work, for phases P, R, S, T and U:**

- Cody's greeting is `greetingFor(now, lastPlayedAt, name)` in `systems/greetings.ts`; its lines
  are `data/greetings.ts` (`WELCOMES` by time away and window, `HOLIDAY_GREETINGS` for every
  holiday and town event, a test holds one for each, `RED_ONE`, `POKEMON`, and
  `EASTER_EGG_ODDS`). A new town event (phase U) needs a line there. A new kind of greeting is a
  `GreetingKind` and a branch in `greetingFor`; the HUD shows any `GreetingCard` (`hud.greet`).
- A visit is a day key; `world.visits.welcome(lastPlayedAt)` counts today's from `main.ts` and
  returns the greeting and the visit's gift; `check()` counts a day turning while she plays (a
  `visit` moment). Gifts are `giftFor(n)` from `VISIT_ROUND` and `VISIT_MILESTONES`
  (`data/visits.ts`): Candy, `{ item, count }` or `{ furniture }`.
- Anything that fills while she's away is worked out from a stored time with
  `windowsBetween(from, to, most)` (`systems/clock.ts`), as the tree and stall are in
  `systems/passive.ts`. The numbers are `data/passive.ts`; the stall takes `STALL_WARES` (every
  crop's harvest), so phase P's new crops, and phase Q's fish if they should, sell there too.
- To try them in a dev build: `world.candyTree.windows()`, `world.stall.view()`,
  `world.bag.add('pumpkin', 6)` then `world.stall.leave('pumpkin', 6)`, and
  `world.visits.count`.

**How the new places work, for phases L, Q, S and T:**

- A place's things to gather are props with a `PROP_YIELDS` row (the old tree, toadstools) or
  patches (`milkweed`), keyed with the place (`whisperwood:prop:14,16`).
- A critter lives where its row's `where` says; each place's habitats come from its map
  (`placeHabitats`, clear of its landings, spawn and neighbours' spots), and each place deals its
  own. `world.collecting.critters(place)`; with no place, where she is.
- Something buried is a `BURIED` row (`src/data/buried.ts`) and a mound (`X`) on its tile;
  `world.digging` digs it up once, and `Dug` keeps which (save v18).
- A place hidden from the world map until found is `secret: true` on its `ZONES` row. A way out
  with `gate: true` stands a gate one tile in while the place beyond is shut (a `gate` prop in
  `MapZone.shutGates`, walked up to for the hint) and draws it swung open after; put `P` posts
  either side of it.
- `butterflies` on a map is how many monarchs flutter about it by day (`render/butterflies.ts`),
  drawn only.
- The castle has a door column in `PROP_FOOTPRINT` but no `doors` row; an inside for it is an
  `INTERIORS` row and a door, like any building (decision 103 left it for later).
- To look in a dev build: `world.travel.cross({ to: 'hiddenClearing', along: 0 })`,
  `world.bag.add('castleKey', 1)` to open the gate, and `npm run sprite -- 'place:*'`.

**How a building's inside works, for phases J, R, S and T:** a room is a row in `INTERIORS`
(`src/data/interiors.ts`) and a row in `ZONES` with no map, keyed by an `InteriorId`; the town's
`doors` row leads in, and the building's `PROP_FOOTPRINT` needs its `door` column.
`tests/data/interiors.test.ts` holds every room's things inside it, none overlapping, all the
floor reachable and something to stand beside each thing. A new fixture is a `FIXTURES` row and a
drawing in `src/sprites/interiors.ts` (the building kit's materials, `finish` to outline); a
keepsake is a piece with `keepsake` hearts in a neighbour's room. To look at a room in a dev
build: `world.travel.cross({ to: 'library', along: 0 })`.

**How buildings are drawn, for phases H, J and T:** read "Buildings" in `docs/art_style.md`.
Every building is a function over the kit in `src/sprites/buildings.ts`, painting shared keys
(decision 95). A new one is a draw function returning `{ source, door }`, a
`buildingPalette(...)`, a `PropArt` row with `WINDOWS_LIT` and its `lights`, a `PROP_FOOTPRINT`,
a map letter, and a place in `BUILDINGS` in `tests/sprites/sprites.test.ts`. A neighbour's house
is also a row in `src/data/houses.ts`. Look at it with `npm run sprite -- 'prop:name*' --sheet`
(the `:lit` one is after dark), and in the town with `npm run sprite -- place:town`.

**Branches and PRs.** Phases 0–12, each one PR, are merged into `main` with merge commits. The user wants each phase's PR merged as soon as its CI is green, so the next phase
branches from `main`.

**Handing v0 over (the user's step).** Decision 14 wants her first launch to open straight into the
character creator, with nothing of the user's testing carried over. Saves live in each browser's
own storage, so the user's own phone and the previews never touch hers.

1. Merge the last PR; Vercel deploys `main` to production in a minute or two.
2. On **her** iPhone, open the production URL in Safari. If that phone has ever opened the game
   before (to test), clear it first: Settings → Safari → Advanced → Website Data, find the site,
   and delete it.
3. Share → Add to Home Screen. The pumpkin icon is the game from then on; open it from there, so
   iOS keeps the town safe (Settings in the game says so with a ✓).
4. Tell her the ringer switch mutes the game's sound: the music and cues follow it, as they should.
5. The creator opens on her look already; she types her name, and Cody says hello.
6. Once she has played for a day, open Settings → the backup code, and keep a copy somewhere safe.

To try anything first, use a different phone, or the PR's Vercel preview, whose storage is separate.

**How the art works at 32 pixels, for whoever redraws something (phases D, F, G, H, J, L):**

- Read `docs/art_style.md` first: sizes (her 32×48 chibi, doors at least 28×52, buildings 4–6
  tiles), light from the top left, five-tone `ramp`s, soft coloured outlines, spiders kept gentle.
- The ground (`src/sprites/terrain.ts`, decision 93): a new kind of ground is a `TileId`, a draw
  function from an edge field (`edges(mask, radius)` gives every pixel its distance in from the
  edge and which way the edge is) and a palette in `TERRAIN_ART`; `continues` says what it joins.
  Anything that crosses tiles must repeat every 32 pixels. `ground:sample` in the gallery shows
  every kind together; `npm run sprite -- 'place:town'` shows the whole town.
- Look at the scale sheet (`src/sprites/scaleSheet.ts`, first in `?gallery` and what
  `npm run sprite` renders with no arguments): it's the drafted look the user judged. Phase D
  grew it into her doll, her neighbours, the pets and the critters; the house, skeleton, tree
  and ground on it are drafts for phases F and G.
- Draw big art with `Sketch` (`src/sprites/sketch.ts`), which still produces a grid of keys and a
  palette (decision 2). Add each sprite to `src/sprites/catalogue.ts`; the catalogue test draws
  it, and `npm run sprite -- 'name*' --zoom=6 --sheet` shows it. Look at the PNG before wiring it in.
- Wiring a redrawn sprite into the world: bake it with `bake` (not `bakeOld`), and turn its
  `old(n)` offsets, shadows and lights into world pixels (`src/render/legacy.ts`, decision 86).
  Its HUD icon may still want the old grid at 1× until the HUD is redone (phase M).
- Her doll is used at 1× by the HUD: the look sheets' preview is 32×48 at 3×, a worn close-up
  (`drawWornDetail`) is a 16- or 24-pixel square of her drawn into 48, and a neighbour's or
  pet's portrait is 32 square. A critter's bag icon is still its 16×16 grid (phase M).

**How places and travel work, for whoever adds a place, a way in, or something that opens one:**

- A place is a row in `ZONES` (`src/data/zones.ts`): name, `blurb` and `icon` for the world map,
  `onMap` (its spot, in percent), its `map`, its `unlock` rule, and `shut`/`opened` lines if it
  starts shut, plus an optional `letter` posted the first time she finds it (id `found:<zone>`).
  Add its id to `ZoneId` (`src/types/ids.ts`); `MapZoneId` is every place but her home.
- A map's ways out are `exits` in its `MapSource` (`src/data/maps.ts`): a run of open tiles on
  the edge, naming the place beyond, and the place beyond needs one back the same length.
  `tests/data/zones.test.ts` holds that, the landings open, and everything reachable.
- An unlock rule (`Unlock`) is open, `has` an item, `hearts` with a neighbour, `found` a place,
  `caught` so many kinds, or `all` of several; `holds` in `src/systems/zones.ts` reads it. Once it
  holds the place is opened for good in the `Atlas`.
- `world.travel`: `here`, `cross` (from an arrival), `go` (the map), `places()` (what the map
  shows), `isOpen`. Moments: `entered`, `found`, `opened`, `shut`. The `crossed` signal tells
  whoever cares that she moved.
- A villager's stop can have a `zone`. Outside her place they're simply at their stop
  (`Neighbourhood.keepAway`); in it, they walk out toward a stop elsewhere (`wayOut`).
- To try it in a dev build: `world.tapTile(39, 14)` walks her into the woods; `world.bag.add
('iceSkates', 1)` opens the shore on the next step; `world.travel.go('town')`.
- The farm, the stalls, the snack and Wes are only ever in town, and Fibi's bone in town or at
  home. Critters and gathering are in every place outdoors since phase I.

**How the mayor's mystery works, for whoever adds a clue, a suspect or the reveal:**

- A clue is a row in `CLUES` (`src/data/mystery.ts`): its card's title and note, the hint shown
  while it's still a question mark, and who it `points` at. A suspect is a row in `SUSPECTS`, and
  their photo is their figure's portrait (`drawPortrait`), so a new suspect needs a figure in
  `src/sprites/villagers.ts`. The mayor's letters are `MAYOR_LETTERS`, ids `mayor:n`, each pinning
  a clue when read.
- `Town` pins clues (`pinClue`, a `clue` moment, the `mystery` event): in `checkMystery` (the
  letters, a friend at three hearts, five kinds caught), in `buy` (the Moon Pie Man), in
  `openLetter`, and in `stepWes`. `Casebook` keeps the day each was pinned (save v11).
- Wes: `lurksOf` finds the tiles beside trees; `wesSpot` picks one each minute he's out, within
  the screen but five tiles off; he's gone within three tiles (decision 74). `TownView` draws him
  half behind his tree. To see him in a dev build, poke `world.wesSlot = Math.floor(Date.now() /
60000)` and `world.wesHere` to one of `world.lurks`.

**How sound works, for whoever adds a cue, a record or a song:**

- A sound is a `Tune` (`src/audio/tune.ts`): a tempo, a length in beats, and parts, each a wave
  (or a `kick`, `snare` or `hat`), a gain and a line of notes written like `E4:1 G4:.5 -:.5
C5+E5:2`. `tests/audio/audio.test.ts` holds every note inside its tune and every record 20–60
  seconds long.
- A cue is a row in `CUES` (`src/audio/cues.ts`), and `cueOf` says which moment makes it; `main.ts`
  plays the cue for each moment `update()` returns. Neighbours talk in `voiceOf` blips. The music
  is `MUSIC`, a waltz on a loop.
- A record's tune is a row in `RECORD_TUNES` (`src/audio/records.ts`), original, in its band's
  style; a test holds that every record item has one. `SoundBoard.playRecord` hushes the music
  until it ends, and going out stops it.
- `SoundBoard` starts on her first touch (iOS), schedules long tunes a moment ahead, and suspends
  when the app is hidden. `settings.ts` keeps the two switches per phone. Loudness was checked by
  rendering each tune offline in Chromium; records sit around 0.04–0.08 RMS with peaks under 0.55.

**How the pets work, for whoever adds a pet, an accessory or a habit:**

- A pet is a row in `PETS` (`src/data/pets.ts`): its name, what it is, `ghost`, its trotting
  `speed` and its `pats`. Its art is a row in `PET_ART` (`src/sprites/pets.ts`): two side-on frames
  facing right (the first is standing; `tests/sprites/pets.test.ts` holds them the same size), a
  sit facing her, an optional `rest` (Florence's blanket, Elvira's curl) and a `glow` for a ghost.
  The keys `n`, `k` and `q` are where an accessory is painted (decision 69).
- An accessory is a row in `ACCESSORIES` with a `style` and a `price` (none if she has it from the
  start), and a colour in `ACCESSORY_ART`. A priced one is on Cobweb Corner's "For the pets"
  shelf, and a test holds that every priced one is sold. It's also a `Ware` (`{ accessory }`), so a
  villager's letter could bring one.
- `src/world/Pet.ts` is one pet, stepped by `Town.stepPets` with what it needs to know
  (`PetSurroundings`); habits that happen now and then are read off the clock in
  `src/systems/pets.ts` (decision 68). `src/world/Pets.ts` is what's saved: names, what's worn,
  what she owns, who's walking, and Fibi's bones.
- `Town` has `petList`, `pet(id)`, `petsHere()`, `petAt`, `walkWith`, `patPet`, `renamePet`,
  `dressPet`, `endPet`, `lostBone` and `returnBone`, and emits `pets`. Tapping a pet walks her up to
  it and arrives with `pet`, which opens `src/hud/PetSheet.ts` through `PetApi`.
- To see them in a dev build: walk in with `world.tapTile(4, 7)`, then `world.walkWith('wybie')`;
  `world.lostBone()` says where today's bone is.

**How critters work, for whoever adds a critter or a habitat:**

- A critter is a row in `CRITTERS` (`src/data/critters.ts`) keyed by `CritterId` (part of
  `ItemId`): name, family, hours (`from`–`to`, wrapping midnight), habitat, rarity, `wary` (rare
  ones only, a test holds it), value and description. Its item row and value are made from it. Its
  art is a row in `CRITTER_ART` (`src/sprites/critters.ts`): two 16×16 frames and a palette, and a
  `glow` for one that shines at night; the first frame is its bag icon.
- `src/systems/critters.ts` finds the habitats in the map (`habitatsOf`, `townHabitats`) and deals
  the hour's critters (`crittersOut`); a test holds at least four kinds about at every hour and
  every critter turning up within two months.
- `Town.critters()` is the hour's, less what she caught (`taken`, keyed `critter:<hour>:<slot>`),
  with any that fluttered off where they went. `Town.donate` puts one on show and posts
  Wrapunzel's letters (`MUSEUM_LETTERS` in `src/data/museum.ts`, ids `museum:<n>`).
- To see them in a dev build: `?hour=22` for the night ones, and `world.critters()`.

**How the neighbours work, for whoever adds a villager, a line or a reward:**

- A villager is a row in `VILLAGERS` (`src/data/villagers.ts`), keyed by `VillagerId`: `schedule`
  (a stop per block of hours, each `at` a spot named in its place's `SPOTS` in `src/data/maps.ts`
  (decision 93), so a new stop is a spot and a line; the tests hold every spot `tests/data/villagers.test.ts` holds to open, reachable
  ground clear of the pop-up, the cart, patches, and with no head over a snack spot), `lines` by
  closeness (`hello`, `friend` from 3 hearts, `close` from 7, and `night`), `loves` (items),
  `likes` (item kinds), `says` for one particular gift, `favours`, `thanks`, and `rewards` at 3, 6
  and 10 hearts. `{name}` is her name; only Cody says babe (a test holds it). A villager's art is a
  row in `FIGURES` (`src/sprites/villagers.ts`): skin, eyes, hair, clothes (the doll's own
  outfits, in a tone of their own if no fabric fits) and touches.
- The rules are pure, in `src/systems/friendship.ts`: points (100 a heart), reactions, which line,
  where a villager is (`stopOf`, with the party on 04-09), favours by the day key, letters by id
  (`villager:hearts`, or `day:year` for a special day's), and Cody's welcome (`welcomeLine`).
- `Friends` (`src/world/Friends.ts`) keeps each friendship's points and the day of its last talk,
  gift and favour, and the mailbox. `Town` owns the `neighbours` (each a `Neighbour`, walking to
  its stop, waiting while she talks) and the verbs: `talk`, `give`, `favour`, `doFavour`,
  `endTalk`, `mail`, `openLetter`, `puffing`. It emits `friends` and `mail`, and a `mail` moment
  when a letter comes.
- Special days are `src/data/specialDays.ts`: month-days only (decision 20), a first line for each
  villager, a letter, and the party spots.
- To see them in a dev build: `world.neighbour('cody')`, `world.talk('rufus')`, and
  `world.friends.update('maude', { points: 295 })` then a talk, for a letter.

**How crafting works, for whoever adds a recipe or something to make:**

- A recipe is a row in `RECIPES` (`src/data/recipes.ts`): what it `needs` from her bag and what it
  `makes`: `{ item }` into the bag, `{ furniture }` into the storage chest, or `{ room: n }`, her
  house grown to size n. With a `card` price it's sold as a recipe card on Cobweb Corner's
  Crafting shelf; without one it's known from the start (`STARTER_RECIPES`), even by old saves.
- `src/systems/crafting.ts` says why one can't be made (`unknown`, `short`, `built`, `notYet`);
  `Town.craft(id)` makes it at once and emits `bag` and `home`. `town.recipes`, `knows` and
  `learn` are the recipe book, emitted as `recipes`.
- A piece made only at the workbench has no `price` in `FURNITURE`, and its art lives in
  `src/sprites/crafted.ts`. A test holds that a priced piece is sold somewhere and a made one isn't.
- Beads are the `BEADS` list in `src/data/gathering.ts`, given as a `bonus` on a `Yield` (now and
  then, fixed for the day), and a `gathered` moment names the `bead` found with it.
- Her room is `roomOf(size)` in `src/data/home.ts`: 13, 17 then 21 wide, with the mat at the middle
  of the front edge. Everything that needs the room's shape asks `town.home.room`.

**How her home works, for whoever adds a piece or something to do at home:**

- A piece is a row in `FURNITURE` (`src/data/furniture.ts`): its `layer` (`floor`, `rug` or
  `wall`), `size` in tiles, `turns` (none, `mirror` or `four`), `price`, and an optional `says`
  for when she walks up to it. Its art is a row in `FURNITURE_ART` (`src/sprites/furniture.ts`
  gathers them from `pieces.ts`, `crafted.ts`, `gifts.ts`, `keepsakes.ts`, `museum.ts` and
  `touches.ts`), drawn at 32 in the building kit's materials with `src/sprites/furnish.ts`
  (decision 105, and "Furniture" in `docs/art_style.md`), 32 wide a tile of footprint; a floor
  piece may stand taller, a rug or wall piece is exactly its footprint
  (`tests/sprites/furniture.test.ts` holds this). Walls, floors and the mat are
  `src/sprites/surfaces.ts`. A `four` piece needs a `side` and
  `back`. A `glow` and `lights` light it after dark, as a prop's do.
- To sell it, put it in a pool in `src/data/shop.ts`; a test says every piece is sold somewhere
  but the corkboard.
- What fits where is `refusal` in `src/systems/decor.ts`. `Home` keeps the pieces and the chest;
  `Town` has the scene, going in and out, and decorating (`startDecorating`, `tapTile` while
  decorating, `turnSelected`, `putAwaySelected`, `takeOut`), and emits `scene`, `decorating` and
  `home` on its `EventBus` for the HUD.
- To look at the room in a dev build: `world.tapTile(4, 7)` walks her in.

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

- She is 32×48 (decision 79): head to row 23, neck 24, torso 25–33, hips 34–36, legs 37–44, feet
  45–46. A cut paints body regions (`a` upper arm, `e` elbow, `w` forearm, `A` hand, `b` torso,
  `p` hips, `l` leg, `f` foot), never rows, so it follows her arms into every pose, and
  `finish` lights and outlines it (decision 88). Only skirts, hats, glasses and necklaces are
  drawn by hand, with `Sketch`.
- A new piece is a row in `OUTFITS` (`src/data/outfits.ts`) with a slot, a cut and its fabrics, at
  least one of them a blue; a print or pendant goes in `OUTFIT_ART` (`src/sprites/doll.ts`). A new
  _cut_ is a case in `cutRows`. `tests/sprites/doll.test.ts` draws every piece in every colour,
  facing and frame, so a broken grid fails there.
- Giving her a piece is `town.wardrobe.give(id)`, which the shops use; it returns false if she
  already owns it.
- The layer order, and why gauges sit over the hair, is on `dollLayers`. A pose (`Pose` in
  `src/types/ids.ts`) is a body of its own facing the front, in `POSE_BODY`; a new one needs its
  body there, and a rule in `src/systems/poses.ts` saying when.
- Look at new art with `?gallery`, which shows every piece on her from the front and turning.
  Villagers and pets are drawn to her scale.

**Where saves live, and how to add to one:**

- `src/persistence/SaveState.ts` holds the shape and `SAVE_VERSION` (23 since phase R, whose step
  gives an old save no meals and her stove in the storage chest; 22, phase P, sprinklers; 21, phase O, whose step
  gives an old save no visits, a tree never shaken and an empty stall; 20, phase M, the quick bar's
  `held` and the `fresh` marks; 19, phase J, whose step
  puts her stained-glass lamp in the storage chest of a home furnished before it; 18, phase I,
  whose step gives an old save nothing dug up yet; 17, phase H, whose step gives an old save no keepsakes yet; 16, phase G, whose step
  puts the mums in the pots by her door; 15, phase F, whose step
  moves her garden beds onto the re-laid farm and stands her at her door; 14, phase E, added the
  `atlas` of places found and opened; 13, phase D, added her face's `freckles` and
  `nosePiercing` and the crops she has `harvested`). `player.zone` is only checked to be a string:
  a place this build doesn't know puts her back at her door. `main.ts` builds each
  save from `town.snapshot()`, `town.wardrobe.snapshot()`, `town.finds()` (the bag, and what
  was taken today), `town.garden()` (the tilled beds and their plantings), `town.wallet()`
  (her Candy), `town.homeSnapshot()` (her home, with its size) and `town.recipeBook()` (the
  recipes she knows), `town.friendsSnapshot()` (her friendships and mail),
  `town.cabinetSnapshot()` (her Curiosity Cabinet), `town.petsSnapshot()` (her pets), and
  `town.mysterySnapshot()` (the clues on her corkboard).
- **Adding a field:**
  1. Add it to `SaveState`.
  2. Bump `SAVE_VERSION`.
  3. Add the N→N+1 step to `migrations.ts`, with a comment on why its default is honest, and its
     data written out rather than imported (see the v1 → v2 step).
  4. Extend `isSaveState`. Check shapes only; repair unknown ids where the data is used, as
     `repairLook` does, rather than setting a whole town aside.
  5. Add a migration test.
- Smoke's `save`, `closet`, `salon`, `gather`, `bag`, `farm`, `shop`, `home`, `craft`, `cook`,
  `neighbours`, `mystery`, `sound`, `settings`, `night`, `critters`, `pets`, `zones`, `places`, `calendar` and `notices` sections cover the round trips. Every load opens Cody's
  welcome, which smoke answers (`answerCody`) after each reload. The `shop` section visits the pop-up only on days it's in
  town, and says so when it skips it. Smoke gets
  through the creator in `boot`, because a fresh browser has no save.

## Starting cold

1. Check "In progress" at the top of this file and `git status`: if either shows unfinished
   work, resume that first. Then read `CLAUDE.md`, the status line and your phase in `docs/v0.1_plan.md`, then
   `docs/decisions.md` (short, and it holds every fork already argued).
2. `git log --oneline -20` to see what actually landed.
3. Branch before the first commit. One PR per phase, opened as a draft at the first push and
   merged with a merge commit as soon as it is green. Commit, push and update "In progress" after
   every meaningful step: the session can be cut off at any moment.
4. Before pushing: `npm run lint && npm run format:check && npm run typecheck && npm run test &&
npm run build`, then `npm run dev` in one shell and `npm run smoke` in another. A draft PR runs
   no CI (decision 117), so this is the only check until the PR is marked ready.
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

**Parked (decision 177, 2026-10-01).** The user wants a working game for her first, and the
easter eggs after. Keep these; don't put them to the user again until they ask, and add no new
ones. Each has a default in the game already.

Asked on 2026-10-01, after 0.2's release, for W3 (cooler clothes to buy):

81. Is there a fancy outfit she'd stop and stare at in a shop window? A dream dress, a label she
    loves, something she's saved a picture of? It could be the boutique's showpiece.
82. Has she worn a Halloween costume in real life that she loved, or one she's always wanted to
    try? It could go on the pop-up's costume shelf.
83. Is there a print or colour she always reaches for (leopard, cherries, gingham, bats, a
    particular shade)? It could run through what the boutique sells.

Asked on 2026-10-01, after W3, for W1 (bracelets on her wrist):

84. Is there a bracelet she never takes off in real life (a charm, a colour, a gift) that her
    stack could start with?
85. Is there a word or a name she'd spell out in letter beads?

Asked on 2026-10-01, with N1 (more places to grow):

86. Is there something she'd love to grow indoors in a planter box (herbs on the windowsill, a
    strawberry, a little chilli plant)? It could be a crop that thrives at home.
87. Is there a plant from a real garden or trip of theirs that would suit the beds by the lake or
    in the woods?

(N2 chose defaults for 86–87 meanwhile, decision 176: basil grows sooner in a planter at home,
Christmas roses in Whisperwood and irises by the lake. Any answer is a crop row or a `thrives`.)

Asked on 2026-10-01, after K1 (lane 2), for the geese and K2 (indoors):

96. The porch geese dress by the month and for each holiday (a witch in October, a Santa hat at
    Christmas, a raincoat in spring). Is there an outfit she'd put on a real porch goose (a team
    shirt, a costume of theirs, a favourite colour)? Until then they keep Claude's wardrobe.
97. Before K2 (indoors and small things): is there something on her real kitchen counter or by
    her bed she'd smile to find in her home? Until then K2 adds the teal stand mixer only.

Asked on 2026-10-01, with F2 (reasons to come back):

88. The eight monster dolls are the game's own (a vampire with a pink bob, a patchwork girl, a
    werewolf, a mummy, a ghost, a witch, a gorgon and a sea ghoul). Is there a monster she'd
    love as a ninth doll, or a doll she had as a girl? Until then the set stays at eight.

Asked on 2026-10-01, with E1 (more ways to make Candy):

89. Wrapunzel bakes bat-wing cookies, pumpkin pudding and ghost mallows with her. Is there
    something they bake together at home (a family recipe, a birthday cake, a cookie she always
    makes) that could be one of the day's bakes? Until then it stays at those three.

Asked on 2026-10-01, after K2 (lane 2), for the rod, the museum and H1 (more music):

98. Her rod now comes in eight paints (tap it twice on the quick bar). Is there a colour or a
    little charm she'd hang on it (a bobber shaped like something, a sticker, a team colour)?
    Until then it's the eight paints and the pumpkin float.
99. Is there something she'd love to see on show in Wrapunzel's museum besides the critters (a
    fossil, a pressed flower, something from a trip)? Until then it's the six cases of critters.
100.  Before H1 (more music): is there a song, besides Wonderwall for the castle hall, that would
      make her smile to hear as a tune somewhere in town (a café's radio, the fountain, rainy
      days)? Until then H1 writes tunes of its own.

Asked on 2026-10-01, after H1 (lane 2), for H2 (the fountain plays):

101. The pond's fountain will play a music-box tune after dark while she stands by it. Is there a
     lullaby, a song from their wedding, or one she hums that it could play something like? Until
     then it plays a tune of the game's own.
102. Christmas gets a tune of its own in H2. Is there a carol or a Christmas song she loves (or
     can't stand)? Until then it's an original jingle in a sleigh-bell style.

Asked on 2026-10-01, after H2 (lane 2), for G1 (sitting):

103. The fountain now plays a music box after dark from its pond's bank, with notes floating up.
     Is there somewhere else in town she'd love to hear a tune (the bench by the willow, the
     graveyard at midnight, the lake's pier)? Until then it's only the fountain.
104. Before G1 (sitting): is there a favourite spot of hers to sit (a porch swing, a window seat,
     a bench in a park you both know) that one of the town's seats could be? Until then G1 seats
     her on the town's benches and the chairs indoors.

Asked on 2026-10-01, after G1 (lane 2), for D2:

105. Her big comfy makeup chair is on Cobweb Corner's furniture shelf (blush-pink velvet, a gold
     footrest ring). Is there something she'd keep beside it (a lit mirror, a particular palette,
     a fluffy rug) or a colour it should come in? Until then it's the pink one alone.

Asked on 2026-10-01, after D2 (lane 2), for its lines and N2 (more to plant):

106. The neighbours now ask about the school run in the mornings, a quiet hour in the
     afternoons and family time in the evenings. Is there something the kids always say or do on
     the way to school, or a family-evening ritual (a show, a game night, a takeaway), that one
     of them could mention? Until then the lines speak of the school run and family time in
     general.
107. On 25 September the town fills with butterflies and everyone wishes her a happy Dolly
     Parton day (big hair, rhinestones, nine to five). Is there a Dolly song she loves most, or
     something she does on the day, for a neighbour to nod to? Until then it's those nods.
108. Before N2 (more to plant): is there a flower or vegetable from a garden she grew up with,
     or something she cooks with home-grown things, that the new crops should include? Until
     then N2 picks from the plan (sunflowers, tomatoes, garlic, avocados and the rest).

Asked on 2026-10-01, after N2 (lane 2, more to plant):

109. Her garden now grows tomatoes, garlic, basil, avocados, sweetcorn and glow gourds, and she
     can cook spaghetti and chips and guacamole. Is there something she makes at home from
     what's in season (a salsa, a soup, a pie for a birthday) that could be a dish at her stove?
     Until then the stove has those two, a roast glow gourd and lavender shortbread.
110. Is there a flower from their wedding, a bouquet he gave her, or a garden she loves that
     should bloom in her beds? Until then the new flowers are sunflowers, black tulips,
     lavender, marigolds, Christmas roses and irises.

Number the next questions from 90 (lane 1) and 111 (lane 2).

Answered on 2026-09-30: 78–80 (no second band yet, baking with Wrapunzel for E1, fried pickles
and vinegar fries at the fairground), under "J4's questions, answered" in
`docs/personal_touches.md`.

Answered on 2026-09-30: 75–77 (the two of them in costume for the photo, white chicken chili,
the letter from Cody), under "J3's questions, answered" in `docs/personal_touches.md`.

Answered on 2026-09-30: 73–74 (a cat on her pumpkin; the spaceman suit was just an idea, and
not everything needs to be personal), under "W2's last two, answered" in
`docs/personal_touches.md`.

Answered on 2026-09-30: 69–72 (the neighbours look good, big black sweatpants, popcorn on film
night, fancy outfits like a spaceman suit and Halloween costumes for W3), under "K4's and W2's
questions, answered" in `docs/personal_touches.md`. The sweatpants landed with W2.

Answered on 2026-09-30: 66–68 (no script on her arm, K4's details Claude's call, a Walk the Tomb
hoodie), under "K3's last three, answered" in `docs/personal_touches.md`.

Answered on 2026-09-30: 64–65 (Cody's maroon cape lining, the framed moth confirmed, and just
the large rose on her chest), under "The characters, closer, answered" in
`docs/personal_touches.md`.

Answered on 2026-09-30: 60–63 (a Hercules beetle, nothing new for Cody, a framed moth for
finishing a shelf), under "Rarity, more to say and reasons to come back, answered" in
`docs/personal_touches.md`.

Answered on 2026-09-30: 57–59 (the broom), under "The broom, answered" in
`docs/personal_touches.md`.

Answered on 2026-09-30: 55–56 (the signposts and the broom), under "The signposts and the broom,
answered" in `docs/personal_touches.md`.

Answered on 2026-09-30: 46–48 (October's last three), under "October's last three, answered" in
`docs/personal_touches.md`.

Answered on 2026-09-30: 53–54 (the bars and the edges), under "The bars and the edges,
answered" in `docs/personal_touches.md`.

Answered on 2026-09-30, the same day: 49–52 (the second list's), under "The second list's
questions, answered" in `docs/personal_touches.md`: a Beetlejuice sleeve and an evenstar and
black-eyed Susan (K3), a broom home (P1), clothes Claude's call (W2, W3), fun crops that feed
dishes and a stack of bracelets on one wrist (N2, W1).

Answered on 2026-09-30, all together: 1–45, under "The open questions, answered all together"
in `docs/personal_touches.md`, each with the session it lands in (and a table in
`docs/v0.2_plan.md`). A session picking up one of those sessions reads its answers there first.

Answered on 2026-09-29, after phase V: an earlier 31–33 (not 0.2's), under "After phase V" in
`docs/personal_touches.md` (a title screen and his dedication to her, decision 130; her hands and
the witch hat fixed, decision 131; a whim buyer, decision 129).

Answered on 2026-09-28, after phase I: all three, under "After phase I" in
`docs/personal_touches.md` (a floral stained-glass lamp for phase J; the castle keeps its name and
gets an inside, opened by a second hidden key, in phase U).

Answered on 2026-09-28, after phase H: all six, under "After phase H" in
`docs/personal_touches.md` (the pin-up portrait of Seana and a black-and-gold Muse, landed in a
follow-up to phase H; Piatt Castles for the castle's name in phase I; jellyfish if there is ever
an ocean).

Answered on 2026-09-28, before phase G: the art is reviewed all together at the end, in an art
pass once 0.1's functionality is in (phase V), not on the phone before each drawing phase merges
("Before phase G" in `docs/personal_touches.md`). Keep a list of what looks off as you go, under
"Art notes for the final pass" below.

Earlier answers: phase F's under "After phase F" in `docs/personal_touches.md` (potted mums
by her door, Skelly the yard skeleton), phase E's under "After phase E" in `docs/personal_touches.md` (the park pond with
its lit fountain and the big willow, both in phase F), phase D's under "After phase D" in `docs/personal_touches.md` (their first date
was ice skating, now the skates that open Lantern Shore), phase C's under "At the scale sheet",
phase B's under "The look, and the scale sheet", phase A's under "Her, drawn bigger", and the v0.1
plan's as decisions 78–83.

- Optional, fleshed out over time: more of her likes and more inside jokes.

## Art notes for the final pass

What still looks off after phase V's art pass (the user reviews the art all together: "Before
phase G" in `docs/personal_touches.md`, and phase V's review page). Fixed in phase V, and so gone
from here: the fireworks in screen space, the lot signs, Skelly's lights, the arch's posts, the
toadstools, the sprinkler's ears, the noticeboard's roof, Nessa's oar, the moonfish's crescent, the
stove's any-fish, the music box, the cake topper, and Gourdon's pumpkin and teeth. The rooms that
looked dim in smoke's screenshots (the hall among them) aren't: smoke took them while the fade
between places was still running, and now runs with reduced motion so it doesn't.
Phase J's furniture, keepsakes, paper and floors at 32 answered phase H's notes.

- F1's seven new critters (the Hercules beetle, the axolotl, the glowing jellyfish, the tombstone
  toad, the mourning cloak, the reed frog, the ladybug) are first drawings; the last four are palettes on their
  family's shapes. The museum's cases show them at 24 since K2, four to a shelf.
- Town: the well is small for the middle of the square, and the square has no clutter; the
  grass tufts are subtle; the fog's clumps are big and even; signposts have no words (a word per
  place in the capitals); the noticeboard's notes are the same whatever is pinned; the garlands'
  bulbs are faint by day; the little spooky tree's bat is lost in its boughs; the pond's ice has
  no skating marks and nobody else skates.
- The wilds: the old trees' crowns are barely bigger than the town's; the clearing's pool is a
  diamond; the rowboat reads small beside the pier; the castle garden is sparse by day; the frozen
  creek meets the lake without an edge; Nessa's boathouse is up the bank from the water.
- Small things: a seed or sprout is faint on watered soil at night. (K2 did the rest: the fish
  shadows, the "!", whiskers, steam, the pie, the kettle, the bed card and the stool's face, and
  the calendar's marks, decision 171.)
- The smaller homes (9 tiles across) fill only about half a phone's width.
- The festival's banner (J1) is in the signs' lettering, so it reads small hung between lamps
  eleven tiles apart; bigger lettering, or bats on its string, would make more of it.

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
- **Phase 8's forks** are decisions 51–55: a workbench at home from the first day, recipes known
  or bought as cards and made at once, beads found in rocks and trees and strung into bracelets,
  a house that grows in two extensions, and pieces that can only be made.
- **Decision 21's second look:** the gallery now shows the villagers, Cody's among them. The game
  itself shows them on the same public URL, so the gallery gives nothing more away; it stays.
- **Phase 9's forks** are decisions 56–61: neighbours out at every hour and never asleep,
  friendship that only grows, rewards by mail at 3, 6 and 10 hearts, favours by the day key,
  Cody's welcome every time, and the Moon Pie Man as a shop that turns up.
- **Phase 10's forks** are decisions 62–66: critters as things in her bag with a Cabinet that
  remembers, the hour's critters dealt from the day key onto habitats from the map, a walk up and a
  swing with only the rare ones fluttering off once, a net from the start, and the museum as a
  sheet with Wrapunzel's letters at ten and nineteen.
- **Phase 11's forks** are decisions 67–71: the pets hers from the first day with one walking at
  a time, their doings worked out as they go rather than saved, accessories round the neck owned
  like walls and floors, Fibi's bone by the day key, and ghost pets see-through and glowing.
- **Decision 21, once more:** the gallery now shows the pets too. The game shows them on the same
  public URL, so the gallery gives nothing more away; it stays.
- **Phase L's forks** are decisions 107–108: the weather as the day's, from its key, with rain
  watering the garden and two critters out only in their weather; and what moves drawn over the
  baked ground, with flat clutter baked into it and standing clutter placed by hand.
- **Phase E's forks** are decisions 90–92: places as rows with their ways out in their maps and
  every crossing through `Travel`, shut places opened by rules and kept open (the shore by their
  first-date skates), and neighbours walked only where she is.
- **Phase B's fork** is decision 85: a fixed 120Hz step, a camera that eases by whole pixels
  and never moves the ground backwards, and A\* paths pulled taut.
- **Phase C's forks** are decisions 86–87: old art baked at 2× where the world draws it (the
  scale belongs to where a grid is drawn) with a fit nearest 16 tiles across, and one pure
  catalogue of every sprite, with the scale sheet kept out of the game until phase D.
- **Phase 12's forks** are decisions 72–77: the inside jokes as shop finds, the mystery's
  milestone clues with no reveal yet, Wes glimpsed and never caught, the anniversary line with a
  new pair of orbs each year, synthesised sound with per-phone switches and the dance, and 300
  Candy to start.
- **Decision 21, for Wes:** the gallery shows him too; he's in the public game, so it gives nothing
  more away.
- **Phase 7's forks** are decisions 46–50: her home as a second scene she walks about in, three
  layers of furniture that can never shut anything off, tap to pick up and put down with pieces
  that mirror, furniture bought into the chest with walls and floors owned like clothes, and a
  house furnished from the first day.
