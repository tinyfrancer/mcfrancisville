# Handoff: picking up the game cold

Written 2026-09-26 for version 0, and kept since by every plan's sessions; rewritten at the top by
V1's review (decision 324) for after 1.0. Read "In progress" and "After 1.0" first; "Where
things stand" further down is the long history.

## In progress

Nothing is in progress.

## After 1.0

**The V1 plan is complete, and 1.0 is the release PR (#198, `v1-dev` → `main`), opened by
V1's review ready and green and left for the user to merge: the release is theirs.** Her phone
has 0.4 (2026-10-07, PR #175), which carried 0.5's sessions too, so it last showed her the
mayor's "0.5" card; 1.0 brings everything else of the plan's 29 sessions, and she reads one card,
`1.0`, five lines folding 0.6 to 0.9 (decision 324). The save goes from v43 (0.4 changed nothing
in it) to v53 through P1's v44 to R6c's v53, all held by `livedIn.test.ts`'s fixtures, the 0.3
town's and a 1.0 town played by taps (`lived-in-v53.json`). **Her notes leave the cloud save
out** (decision 324): it does nothing until the store is linked, so nothing promises her it.

**The user's steps, after merging the release PR:**

1. **Link the cloud save's store and redeploy** (README's "Cloud save": Vercel → Storage → Create
   Database → Upstash for Redis, the free plan, connected to the project with the `KV` prefix, then
   **Redeploy** the production deployment, since a deployment only sees the variables it was built
   with). Until then the game plays exactly as before and Settings → Backup says "The cloud isn't
   set up yet". Check the deployment's Functions tab lists `api/save` (nobody has run it on Vercel
   yet; if the build trips on TypeScript, the fallback is `api/save.js` with JSDoc types, decision
   323), then README's `curl`, then Settings on her phone.
2. **Time her phone**: open the deployed game in Safari with `?perf` on the end, go in, walk the
   town at Close for 30 s from the first tap, at about 21:30 and again at noon, and write the
   readings (frame p50/p95, work p50/p95, fps, the phone and its iOS) into the table under "On her
   iPhone" in `docs/architecture.md`. The container's numbers for 1.0 are the table just above it
   (town at Close 32.6–32.8 ms mean at 21:30 and 22.3 at noon, 4× throttled Chromium).
3. **Listen**: whether the game is heard with the silent switch on (S1, decision 321).

**`v1-dev` ends with 1.0.** A later plan's integration branch is made from `main` after the
release merges (as `v1-dev` was from 0.3's `main`), and added to `vercel.json`'s no-preview list
the day it's made (decision 265). A session starting cold with nothing asked of it does nothing to
the game and asks the user what they'd like next. **The 1.1 notes are collected already**: "Where
it hurts" in `docs/architecture.md` (1.0.x's first candidates are 1 and 7–9: Vercel and her
phone's first readings, a card before a project moves her things, the reel under reduced motion,
rare events in October), the "Art notes for the final pass" below, and each lane's "For" notes
under "Notes for 1.1".

### V1 (after the lanes)

**V1's review landed** (PR #197, decision 324; no save change). It played a new town by real taps
over four days (14–17 September 2026, a scratch Playwright driver under `?loop=manual&day=`) and
kept it as `tests/persistence/fixtures/lived-in-v53.json`; opened the 0.3 lived-in town as her
phone will, at Close, Far and sideways (one 1.0 card, Cody's hello, no errors); looked at smoke's
reel, trick, reveal, winter, Far and sideways screenshots; fixed three small things (a toast half
the room wide, the quick bar's line off the left edge, the hooked "!" over the tension bar); put
the 0.5 notes row back as it shipped (L6, L2 and L4 had written into it after it was on her phone,
so the ground and seasons now open 1.0's card); timed 1.0 at Close and Far by day and night
(`docs/architecture.md`, "V1's review"); and brought `docs/architecture.md`, its "Where it hurts",
the art notes, `CLAUDE.md`, the README and this file up to 1.0.

### How V1 was run, for whoever plans 1.1

`docs/v1_analysis.md` found the game wide but not deep (five findings: nothing reacts, the
neighbours don't know her, no direction or rhythm, the presentation sells it short, sound and
platform), an interview with the user settled ten questions (decisions 266–275), and
`docs/v1_plan.md` cut the answer into 29 sessions of one context window each, in five lanes by the
files they own (feel, look, people, rhythm, sound/platform/her fixes), two lanes at a time, with
this review alone after. One coordinating session ran each plan session as an Opus sub-agent in a
worktree of its own, as 0.3 was run (below): `npm ci`, a branch from `v1-dev`, the whole suite and
smoke on a dev-server port of its own before every push, a draft PR through the REST API (`gh
api`; GraphQL is blocked in the container), merged by the session with a merge commit once CI was
green, and its heading here and line on the plan's status line written as it went. What was new:
**patches to her phone at the user's word** (0.4 went out with 0.5's first five sessions in it,
since a patch is whatever has merged; the rest waited for 1.0, so four `NOTES` rows she never saw
were folded into one); **ten save bumps** (v44–v53), each in a session's last commit
after merging `v1-dev`, one at a time, with no collision; **cross-lane "For X" notes** that told the
next session in another lane exactly which seam to use (E1's effects for everyone, L4's palette
swaps for anything drawn outdoors, P3b's `inTown` for anything looping over neighbours, R2's
`TodayFacts` for R3, R4 and R6), the best habit of the plan; and **smoke sections in second browser
contexts** for anything that wanted a new town (R1's `firstDay`, S2's `cloud`). What cost the most:
the suite and smoke grew to half an hour a push ("Where it hurts" 2), and lanes that both wanted
the 0.x `NOTES` row spent lines folding each other's. Worth keeping for 1.1: the analysis before
the plan, lanes by files owned, two at a time, the "For X" notes, saves bumped last, and a review
that plays a real town by taps and keeps it as a fixture. Worth changing: smoke split by area, and
the patch notes written once per release by the review rather than a line per session.

### What V1 built (a line a session; the decisions hold the detail)

- **Lane 1, feel:** E1 (PR #165, 280) the effects layer; E2 (PR #166, 281) her verbs have a body;
  E3 (PR #168, 282) neighbours alive at their stops; E4 (PR #171, 283) taps felt and an iris through
  doors; E5 (PR #172, 284) props and furniture animate, crows, bats and leaves.
- **Lane 2, look:** L1 (PR #164, 290) Close and Far, rooms in a house; L3 (PR #167, 291) light; L6
  (PR #177, 292) the art pass; L2 (PR #179, 293) the ground; L4 (PR #182, 294) the seasons; L5 (PR
  #185, 295) the UI polished, glyphs for emoji; L7 (PR #188, 296) faces.
- **Lane 3, people:** P1 (PR #178, 300, v44) talks with memory; P2 (PR #180, 301, v45) her voice and
  heart moments; P3a (PR #181, 302, v46) the mystery chapter by chapter; P3b (PR #183, 303, v47) Rob
  Boo; P4 (PR #184, 304, v48) jobs seen and happenings with a verb; P5 (PR #186, 305, v49) Cody,
  married.
- **Lane 4, rhythm:** R5 (PR #173, 310) critters for all; R1 (PR #187, 311, v50) the first day; R2
  (PR #190, 312) Today; R3 (PR #192, 313) weeks that differ; R4 (PR #194, 314, v51) town projects;
  R6b (PR #193, 315) the fair games; R6a (PR #196, 316, v52) fishing with a floor; R6c (PR #195, 317,
  v53) pets that grow.
- **Lane 5, sound, platform and her fixes:** S4 (PR #169, 320) her fixes; S1 (PR #170, 321) heard;
  S3 (PR #189, 322) safe; S2 (PR #191, 323) the cloud save.
- **V1** (PR #197, decision 324): the review and 1.0, under "After 1.0" above.

### Notes for 1.1 (the lanes' "For" notes, kept as they left them)

Each lane's running session left notes for the sessions after it: how to add a moment, a topic, a
happening, a rare event, a project, a fish, a trick, a working pose; which seam to use; and what
was left. They're kept here as written, the newest first in each lane, because they're the best
how-to the code has; what they say about `NOTES` rows and patches is history now (the rows are
folded into 1.0), and every "Left for the review" item is in "Where it hurts" in
`docs/architecture.md`.

#### Lane 1: feel (E1 → E2 → E3 → E4 → E5; decisions from 280; never the save)

**For L6, L2 and L4 (from E5, decision 284):** what moves on its own is `frames` on a prop's,
piece's or fixture's art (`sprites/frames.ts`): whole-size `sources` (each frame the art's size,
in its place) or `glows` alone, a `period`, an `order`. **A redraw of framed art must redraw its
frames too** (`tests/sprites/frames.test.ts` holds each the art's size and different, and the
catalogue's `<name>:f<i>` rows show them); the castle's banners, the stalls' awnings, the wheel's
rim, the fountain's jet, the pop-up's banner and the indoor fires, cauldrons, clock, tank, kettle
and teapot are `sources`, the windows, lamps, pumpkins, lanterns and bulbs `glows` (`candlelit`,
`flame` in `sprites/motion.ts`), so a windows-only redraw needs nothing. An open door is a patch
cut from the building's `door` rect (`sprites/doorsOpen.ts`), so a building redrawn with a new
door rect opens right. **L4:** leaves fall under the trees September to November
(`render/leaves.ts`, `FALLING_LEAVES` in `data/leaves.ts`, two a tree in four autumn colours);
L4's seasons can take the months from its own rule, or recolour them, and keep them falling.
Crows and bats are `SKY` rows a place (`data/sky.ts`). `view.motion()` in a dev build says each
moving prop's frame and how many flyers and leaves were drawn.

**For L5 (from E4):** a tap is felt in `wiring/taps.ts` (`feelTap`, from `main.ts`'s
pointerup with what the view's `tap` returns): a `ring` and an `outline` effect in E1's layer
(`render/effects.ts`; `World.aim` says what she set off toward, `Resolve.figure` where a
neighbour is, seated too) and a cue; an unreachable tap is `World.tapTile`'s false, which shrugs
her (`Poses.shrug`, the `shrug` action pose). Between places is `render/transition.ts`
(`Transitions`, made in `main.ts`, started from `wiring/moments.ts` by `entered`, `flew` and
`window`, stepped in the tick, drawn by `drawFrame` over the view only while one runs, and
`view.transition()` in a dev build). Smoke runs reduced motion, so its pixel reads after going
in or flying should wait for `view.transition() === null` (the greenhouse's does). **L5:** the
sheets' slide is a block in `hud/styles.ts` (`hud-sheet-up`/`-down`, `hud-backdrop-in`/`-out`,
`hud-title-out`) with `leave` and `moving()` in `hud/dom.ts` (`SHEET_LEAVE_MS` must match the
CSS); a sheet going isn't open, takes no taps and one opened over another cuts it. Restyle
round those names rather than replacing the animations.

**For P4 (from E3):** a neighbour's life at their stop is `systems/neighbourLife.ts` (decision 282):
`stopNow` says when they're at their own stop (never at a happening, a visit or her party),
`stanceOf` how they're drawn (`Stance` in `types/stance.ts`), and `Neighbourhood.step` sets each
`Neighbour`'s `seat`, `working` and wave. **To add a working pose** (P4's jobs seen): add a
`WorkId` to `types/ids.ts`, a `WORKS` row in `data/work.ts` (the way they face to do it, each
frame's length, `kneels` to fold them down), its two frames in `FRAMES` in `sprites/working.ts`
(an `ActionArms` each, `arm` from the shoulder or `forearm` from the elbow, and what they hold as
`Held` grids at 32×48, `front` to go over their hands, `lit` for what glows), and `doing: '<id>'`
on the stops where they'd do it (`data/villagers.ts`, add-only). It's drawn only for the way the
row faces, and they stop to look at her within two tiles; the gallery's `figure:<id>:work:*` rows
and `tests/sprites/villagers.test.ts` pick it up from the stops. A seat beside a stop sits them
on their own (`sits: false` to stop it). E5's flickers can take
`workFrame` as the pattern for a two-frame loop with a phase per thing. Chatter's bubbles come
from `wiring/chatter.ts`, which `main.ts`'s tick calls; `view.figures()` in a dev build says how
each neighbour is drawn.

**For any lane (from E1):** to show something where it happens, give the moment what it needs to say where
(its tiles, or rely on `arrived.toward`, the box of what she walked up to, which the moments after
it in the same batch are placed from) and add or change its case in `effectsOf`
(`src/wiring/effectsOf.ts`); `playMoments` pushes the result into the shared `Effects`
(`src/render/effects.ts`). An `Effect` is a `pop` (an icon from an anchor to over her head, "+n"),
a `burst` (a `ParticleKind` at an anchor, a count, a spread) or an `emote` (♥ ♪ … ! ? over an
anchor); an anchor is a world point, `{ her: true }` or `{ villager }`, the last two followed as
they move (`resolverFor`). A new particle is a `MOTION` row and a `PARTICLE_ART` row; a new
bubble grows `NEIGHBOUR_BUBBLES` (`Emote`). Something that isn't a moment (E3's chatter, a
neighbour's wave) can push straight to `effects.push(zone, effect)` from `main.ts`'s tick, as
the footfall dust does (`Effects.walking`). Reduced motion is handled inside: bursts are
dropped, pops and emotes kept short and still. The 0.5 `NOTES` row is full at five lines (E1's,
E2's, L3's, E3's and E5's); a later 0.5 session folds two to make room.

**Smoke and the hour:** CI runs smoke at UTC's hour, a local container at its own; at 14:00 Nessa
visits her home, and E1 found two sections that tripped on her (the bell jar came out where she
stood; she was on the front mat after following through from the back room). `clearMat` now
waits for visitors too and `display` moves the jar off anyone. Run smoke with `TZ=UTC` as well
when CI fails and a local run doesn't. L2 found two more (decision 293): on 11 October before 05:00
UTC the first walk south (at Close) fails "her, on the screen never shimmers" at frame 241 on
`v1-dev` too, someone near her path bending it into a corner just before she stops; it passes from
the morning window, so re-run the CI job then (`gh api …/actions/jobs/<id>/rerun --method POST`)
rather than loosening the check. And the date chip's ellipsis with a meal's chip up, fixed.

#### Lane 2: look (L1 → L3 → L6 → L2 → L4 → L5 → L7; decisions from 290; never the save)

**For V1's review (from L7, decision 296):** a face's feeling is a `Feeling` (`types/mood.ts`).
**To give a line a feeling**: a heart moment's `moods` (parallel to its `lines`), a reply's `mood`
(theirs) or `feels` (hers, on her chip; a `TopicReplies` row's `feels` by chip), a topic's
`TOPIC_MOODS` row (`data/moods.ts`); everything else is worked out by `feelingOf`
(`systems/moods.ts`: row, topic, the words' `FEELING_CUES`, `KIND_MOODS`, `BAND_MOODS`), and a
gift by `GIFT_MOODS`. `Neighbourhood` puts it on `Chat.feels`/`moreFeels`, `GiftResult.feels` and a
favour's thanks; the talk sheet shows it on the bust and calls `TalkApi.feel`, and
`Neighbourhood.feelingOf` puts it in the world sprite's `Stance.feel` while she talks and 2.4 s
after. **To draw a new face of its own** (a neighbour without the doll's eyes): its touch reads the
`feel` passed as a `Touch`'s fourth argument (`sprites/moodFaces.ts` has the four), and
`tests/sprites/villagers.test.ts` wants every feeling different from the face as usual. **Her**
face: `feelOf` beside `verbOf` (`world/services/Poses.ts`) and the `felt` signal; `poses.face()`
goes into `bakeDoll` as `Rest.feel`. `view.faces()` in a dev build says hers and the neighbours'.
**Left for the review:** the plan's two or three body builds (every clothing cut, action and work
pose is painted on the one body, so it's a pass of its own); the noticeboard's 48-pixel
`drawPortrait` faces and the greeting/neighbours-sheet busts are still neutral (`drawBust`'s
`mood` takes a feeling if a caller wants one).

**For L7 (from L5, decision 295):** the portrait is `drawBust(canvas, id, costume, mood, shadow)`
in `render/villagers.ts`: the figure facing her (`bakeFigure(id, 'down', 0, costume)`), framed from
the first row with anything in it (25 rows over the shoulders' line at most, 7 under), drawn at 64
by `scale2x` (`render/scale2x.ts`) over an oval of evening. `mood` is a `BustMood`, only
`'neutral'` so far, read nowhere yet (`void mood`): widen the type with L7's moods, and draw the
face before the frame is cut, either by passing the mood into `bakeFigure`/`figureLayers` (so the
world sprite and the bust share one face, as the plan wants) or by stamping the face's rows over
the 32-pixel crop before `scale2x` (eyes sit at rows 14–18, the mouth under; a stamp after the
scale would be at the wrong density). The talk sheet, the greeting, the neighbours sheet, the
corkboard and the fortune table call it through their Apis in `wiring/apis.ts`; the noticeboard's
48-pixel faces are still `drawPortrait`. A mood that wants a mark in the chrome (a sweat drop, a
note) is a glyph: a `GlyphId` in `data/glyphs.ts` and a drawing in `GLYPHS` (`sprites/ui.ts`),
shown by `glyph()`; never an emoji (`tests/hud/noEmoji.test.ts` reads `src/hud/` and `src/data/`,
all but Cody's lines in `greetings.ts`). Hearts are `heartsRow(now, was)` (`hud/hearts.ts`): pass
the hearts shown before and the new ones pop.

**For L5/L7 (from L4, decision 294):** the season is `seasonOf(dayKey)` (`systems/seasons.ts`,
by `SEASON_MONTHS`); the ground's look by month is `groundLookIdOf` (`data/seasons.ts`, six looks:
autumn's three build the drifts). Everything seasonal is a palette swap in `sprites/seasons.ts`
baked under `<key>@<season>`: `seasonPiece` for the ground, `seasonLook` for a prop (use it, not
`lookOf`, for anything drawn outdoors, so a new leafy prop or building turns: a crown is a `CROWNS`
row by colouring, a building with a door gets snow on its `ROOF` keys unless `noEaves`), and
`tuftColours`. Autumn is always the town as it was. A view bakes its season when made and
`OutdoorView.turn()` re-bakes props and lets the ground's chunks go when the day's season changes.
The light takes `SEASON_LIGHT` into `gradeOf` (a `season` argument after `outdoors`). **L5:** the
title's night-sky picture and the app icon are season-free, as they should be; if the title wants
snow in winter it can read `seasonOf` too. A calendar mark per season isn't there. **L7:** Nessa's
skating (`skating` work, `data/skating.ts`) has her face as any working pose. `view.season()` in a
dev build says the season, the look and the lawn's baked colour; smoke's `seasons` reads it.

**For L4 (from L2, decision 293):** a season's palette swap touches, on the ground: the lawn's
five tones (`GRASS_TONES` in `sprites/lawn.ts`, a fill and a tuft's blade, tip and under each,
from `PALETTE.grassShade`/`grassCool`/`moss`/`grassWarm`/`grassWorn`), the meadow's and long
grass's palettes (`MEADOW_PALETTE`, `LONG_GRASS_PALETTE` in `sprites/tracks.ts`: `meadow`,
`meadowLight`, `longGrass`, `longGrassLight`, the flowers' colours), the swaying tufts
(`TUFT_PALETTE`, `sprites/life.ts`) and the decals (`DECAL_PALETTE`, `sprites/clutter.ts`: the
daisies, dandelions, clover and leaf drifts are the seasonal ones); dirt and gravel can stay. On
the trees: `TREE_LEAVES` colours all six forms of the town tree (the conifer, dead tree and birch in
`sprites/treeForms.ts` are in the same keys, so they swap with it; the birch's bark `i`–`J` and a
hollow `k` come from `leaves()` and needn't change), and `OLD_TREE_LEAVES` the old trees. **How the
ground re-bakes:** each tile is a piece keyed by its kind, look and (for grass) its four lawn
corners (`groundPieces(at, tx, ty, lawn)` in `sprites/terrain.ts`), baked through `bake` into the
chunks; `Ground` works out the lawn once (`lawnOf` in `render/lawn.ts`) and its chunks are let go
with `chunks.release()` as `Ground.wet` does. A season swap should put the season in the pieces'
keys (or their palettes' names), so the cache doesn't hand back last season's canvas, and release
the chunks; it costs one bake per chunk on the change, never a frame (the town has 696 distinct
pieces). Leaf drifts building through autumn can be a `CLUTTER` rule per season (a `oneIn` that
falls as the weeks go), or a lawn tone; snow on the ground is a palette of `GRASS_TONES` and
wants no puddles. `tests/render/lawn.test.ts` holds every place's commonest colour under a quarter
from its overview: a winter all one white would break it, so give snow tones too.

**For L2/L4 (from L6, decision 292):** a tile of water or ice by a bank, and grass beside one, is
drawn from the water round it (`bankField`, `wetAround` in `sprites/banks.ts`, wired in
`groundPieces`): L2's reeds and any new water tile should go through `WET` in `terrain.ts`, and a
new ground kind beside water just isn't wet. Flower patches side by side draw as a bed
(`patchLook`); L2's meadow tiles can sit beside them. Handed on from the art notes: **L2** the
grass tufts (subtle) and the old trees' crowns (barely bigger than the town's); **L4** nobody
else skates on the frozen pond; **lane 4 (R2/R4)** the noticeboard's art is the same whatever is
pinned. The 0.5 `NOTES` row is full again (E1's and E2's folded into one, L6's added): L2 and L4
fold two more each to make room. `docs/review/l6/` has the before-and-after PNGs, made by
rendering `origin/main` and the branch with `npm run sprite` and pairing crops.

**For L6/L2/L4:** the light reads no sprite's keys. The grade (`src/render/grade.ts`, `GRADE` a
row per sky, its colours the palette's `light*`) is the light map's multiply and one `screen` or
`color-burn` fill, so any palette swap is graded as it is drawn. Bloom reads a sprite's `glow`
canvas (its lit keys, `glowOf`), so a new piece or prop that glows gets its halo for free; the
moon's rim reads a sprite's alpha (solid pixels with air above or to the left). Both are cached
per canvas in a `WeakMap`, so **always bake through `bake`/`bakeLayers`**: a canvas made fresh
each frame would be halo'd or rimmed afresh each frame. Wet ground is `PALETTE.wetGround`
multiplied over a chunk under its shadows, and puddles lie only on `path` tiles
(`render/puddles.ts`): L2's dirt or gravel tiles should join `puddlesOf` if they'd hold water.
A season's palette swap (L4) that re-bakes the ground should let go of the chunks as
`Ground.wet` does (`chunks.release()`), and keep the ground calmer than what stands on it so the
cloud shadows and vignette still read; snow on the ground wants no puddles (`Ground.wet` is
decided in `OutdoorView.draw` from the weather). A season's light, if L4 wants one, is a `tint`
into `gradeOf` as rain's is, not a new pass. `?hour=`, `?weather=` and `?day=2026-10-26` (a
full moon; add `&weather=clear`) show it all, and `npm run perf -- --hour=12` measures the day.

**For L5 (from L1):** the perf baseline is at **Close** (`docs/architecture.md`, "Performance
baseline", L3's table the latest); measure a new pass with `npm run perf` (Close) and `npm run
perf -- --view=far`. The scale is never read directly: everything reads it through the canvas's
backing size, which is 390×724 at Close and 585×1086 at Far on smoke's phone, so a pass sized in
tiles is in world pixels. Smoke's `tapTile` taps through the world when the tile is off the view.

#### Lane 3: people (P1 → P2 → P3a → P3b → P4 → P5; decisions from 300)

**For R1 (from P5, decision 305):** on a new town, Cody's three reward letters are posted quietly
(no toast) the first time a day is stepped once her first visit is counted (`Marriage.check`), so
her mailbox has his record, tee and portrait from her first day; R1's thread can point at them.
He's `married` from the first day (`Friends.hearts('cody')` is always ten; `bandOf`/`tierOf` take
the villager), at hers most evenings from seven (`atHers` in `systems/cody.ts`), and of an evening
asks "how was your day?" (`Marriage.tell`) until she answers, which stands alone with Bye like a
question: a first-day card that wants him to say something else of an evening should come before
it or after her answer. His story's scenes start on her third day (`OUR_STORY`).

**For P5 (from P4, decision 304):** **To add a talk action** (a button beside Chat and Give), add
a block to `wiring/talkActions.ts` reading the service's own `canX`/`X`: a `TalkAction` is a
`label`, `lit` and `run()`, whose `TalkOutcome` is `lines` said one after another ("Go on…"
between), an `aside`, a `beat(k)` as each line shows (the bake's steps; return a string to say it
under that line), `choices` (more `TalkAction`s, drawn as `.hud-reply` chips with "Never mind")
or `close`. Never a field on `TalkApi`. Cody's "how was your day" can be one, or P2's question
shape. **To add a happening**, a row in a const of its own spread into `HAPPENINGS` (the weekly
ones are `WEEKLY_HAPPENINGS`, the parties `BIRTHDAY_PARTIES`), a `HappeningId` (add to `WeeklyId`
or a union of its own), a `HAPPENING_CALLED` name in `data/smallTalk.ts`, and **its verb** in
`VERBS` (`data/happeningVerbs.ts`: a `label`, `ask` and `choices` dealt by the week with `deal`,
or `done` for one press; `remembers` with `{choice}` for what the host says next time, and the
choice ids are saved in `happenings`, so never change one once out); `tests/data/happeningVerbs.test.ts`
reads them all. A row may stand beyond the town (`where: { zone, at }`), want a clear day
(`clear`) and give the host a working pose there (`doing`). Cody's evenings at hers aren't a
happening (her home isn't an interior): P2's calls (`CALLING` in `Neighbourhood`) are the way in. **To add a working pose**, as E3 said: a `WorkId`, a row (`P4_WORKS` in
`data/work.ts` shows a const of its own), two frames in `FRAMES` (`sprites/working.ts`) and
`doing` on a stop; `tests/world/jobsSeen.test.ts` wants every stop job someone's (skating is L4's,
by rule) and every neighbour at a job some stop weekday and weekend, and
`tests/sprites/villagers.test.ts` counts the jobs (14). **Errands:** `Neighbourhood`'s keeps
take an `errand(id)` (a place and a job, ahead of the plan; Ollie's post round is the one), and a
`recall(happening, id)` for a host's remembering line. Cody's birthday is "always tomorrow", so
he has no birthday line, party or double gift; P5 may give him one. The 0.7 `NOTES` row has three
lines, all P4's: P5, L5 and L7 add or fold, five at most.

**For P4/P5 (from P3b, decision 303):** Rob Boo is `robBoo`, a `VillagerId` like the rest
(`data/robBoo.ts`, art `sprites/robBoo.ts`), but **he isn't about until she has met him**:
`systems/mayor.ts` (`knowMayor`, told by `tellTheMayor` in `areas/mystery.ts` before the town is
made and by `Mystery.pin`/`unmask` after) answers `inTown(id)` and `townsfolk()`, and
`Neighbourhood.neighbours` (walking, drawn, talked to), `visitsOn`'s callers, `dressingUp`, the
calendar's birthdays, trick or treat's doors, keepsake hints and the neighbours sheet (a shape,
`.hud-unmet`) all read it. **Anything new that loops over every neighbour** (P4's jobs seen,
birthdays as a day with a party, weekly happenings, a participation verb) should skip him while
`!inTown('robBoo')`, or name him only after; `VILLAGER_IDS` still has him, so tables keyed by
`VillagerId` need his row. He has no `doing` at his stops (the doll's `reading` frames read as
nothing on him; P4 can give him a job of his own, a stamp say, as a `WORKS` row). His stops are
`mayorsOffice` (stands 0–2), `townHallSteps` and `squareSouthEast` (new `TOWN_SPOTS`); his town
hall is the `townHall` lot at the square's south-east corner, door step (27, 27). The unmasking is
the `unmasking` happening (`on: { unmasking: true }`, `unmaskingOn`), first of everything on its
evenings, ten more `stands` in `castleHall` for the crowd; once met it never comes again. A
happening with the whole town now lists `robBoo` last in `who` (and film night has a thirteenth
seat, `filmBehindLeft`); the costume contest still has eleven, him and Boothoven out of it. The
met day is the `unmasked` clue (`UNMASKED`, `Mystery.met()`, `Around.met`); the talk topic
`mayorMet` fits for three days after. **P5:** his five heart moments end with ringing the town hall
bell at New Year with her; if Cody's married evenings want the whole town anywhere, Rob is in
`PARTY_SPOTS` (`wellFrontMiddle`) and `STAGE_SPOTS` (`crowdMiddleNear`). The 0.6 `NOTES` row is
full at five lines (P3b's added): P4 and P5 fold two to make room.

**For P3b (from P3a, decision 302):** **the flag** is `world.mystery.ready()`: the day the chain's
last clue, the mayor's promise (`CHAIN_LAST`, `promise`), was pinned, or null (`readyOn` in
`systems/mysteryChain.ts`); the unmasking can be a happening at the castle hall from then, by the
day key. **The empty pin** is `LAST_PIN` (`data/mysteryChain.ts`), drawn last on the corkboard
(`.hud-last-pin`, `hud/CorkboardSheet.ts`, saying `ready` once the promise is in): replace it with
the reveal's clue (a `ClueId` row, pinned by the happening) and drop the `???` row when it is
pinned. **To add a clue to the chain**, add its id to `ChainClueId`, a `CHAIN_CLUES` row and a
`CHAIN` step: `{ clue, letter }` (a mayor's letter, `mayor:n` numbered after the last, pinning
the clue as she reads it) or `{ clue, at }` (pinned as she walks up to that prop in town, from
`World.arrival` through `Mystery.visit`); it comes `CHAIN_DAYS` after the one before is read or
found. A clue may `clears` a suspect (`SUSPECTS[id].cleared` says so on the board); Wes and the
Moon Pie Man are both cleared by the end. **Wes** isn't a villager: his lines are `data/wes.ts`
(`WES_FIRST`, `WES_TALK` by `wesBand`, `WES_READY` leading the day's first chat once the promise
is in: rewrite those for after the reveal), his chat is `Mystery.chat` (a `wesChat` moment opening
`hud/WesSheet.ts`), and what's kept is `mystery.wes` (`glimpses`, `chats`, `talked`, on the
`Casebook`); he stays from `WES_GLIMPSES` (three) times run. The neighbours' theorising is the
`mystery` topic (`data/mysteryTalk.ts`), fitting three days after any clue is pinned
(`Around.clue`, `stillNews`): after the reveal P3b may want it to fit no more, or a new topic.
The mayor's letters already sign "The Mayor", type with a sticky W, own up to being shy and
see-through and to the initials R.B. (the stamp), and promise to say hello at the castle; the
0.6 `NOTES` row has four lines (P3a's in the mayor's voice), so P3b adds one or folds two.

**For P3a/P3b/P5 (from P2, decision 301):** a talk is now the hello, then on the next talk (any
with `talks > 0`) a **heart moment** or a **question** if one is due (`Neighbourhood.tell`, rules
in `systems/voice.ts`), before puffs, happenings and drop-bys. **To add a moment**, add a
`HeartMoment` row to that neighbour in `HEART_MOMENTS` (`data/heartMoments.ts`: `hearts` from
`MOMENT_HEARTS`, three to six `lines`, optional `replies` on the last and a `gift` item); one is
told a day, lowest unseen first, and kept in `Friendship.moments`. **To add a question**, it's
one per neighbour in `QUESTIONS` (`data/questions.ts`, answers with an `id` never changed once out
and a `called` for `{answer}` in `ANSWER_TALK`); kept in `Friendship.answered`. **To add replies
to a topic**, add a `REPLIES` row (`data/replies.ts`: her `say` chips, and a `back` per neighbour
per chip); any line on that topic offers them. A question's or moment's chips stand alone with
Bye (`Chat.asked`); a topic's sit beside Chat and Give. `Neighbourhood.reply(id, k)` answers;
smoke taps `.hud-talk-sheet .hud-reply`. Best friends (ten hearts, `BEST_HEARTS`) get `missed`
for `away`, `invite` for `happening` (both read `Between.band`), a call by choice
(`systems/calls.ts`, placed in `Neighbourhood.plan` as `CALLING`) and a letter (`dear:` ids,
`Neighbourhood.check`). **P5:** Cody has a question (a perfect night in) and `missed`/`invite`
lines, but no moments, calls or letters: give him a `HEART_MOMENTS.cody` row (the type is
`Partial`, so a row is all it takes, and `tests/data/heartMoments.test.ts` expects it undefined,
so change that line), and his married band can be a `Band` above `best` that `bandOf` returns for
him alone, with `BEST_CALLS.cody`/`BEST_LETTERS.cody` turning on his calls and letters (both
skip him only because his rows are missing). His "how was your day" fits the question shape: a
daily `Told` with replies, from a rule beside `questionDue`. **P3a:** Wes after the third glimpse
can take a `QUESTIONS`-style row of his own if he's a villager; theorising lines are a new topic.
The 0.6 `NOTES` row has three lines (P1's two folded into one, P2's, P1's promises): P3a and P3b
fold or add, five at most, each line 160 characters at most.

**For P2/P5 (from P1, decision 300):** what a neighbour brings up is a **topic**: a `Topic` in
`data/smallTalk.ts` (in `TOPICS`, which orders them; `band` and `away` are `URGENT` in
`systems/dialogue.ts` and lead a day's first talk), three lines a neighbour in `SMALL_TALK` (a
memory topic's in `MEMORY_TALK`, `data/memoryTalk.ts`), and the rule for when it fits with what
it fills in `memoryTopics` (`systems/remembering.ts`) or `aroundNow` (`systems/dialogue.ts`).
`tests/data/dialogue.test.ts` reads every line with every way its placeholder can be said
(`SAID_AS`: add a key for a new placeholder) and needs the topic to fit in one of `scenesOn`'s
scenes. A new **scene fact** is a field on `Around` (filled in `build.ts`'s `talkScene`) or on
`Between` (filled in `Neighbourhood.between` from the friendship as it was before the talk; give
`STRANGERS` its empty value). A new **saved history field** on a friendship is an optional field
on `Friendship` (`world/Friends.ts`: repaired in the constructor, checked in `isFriendsShape`),
set in `Neighbourhood.talk`/`remember` or `give`; one about her rather than a neighbour goes on
`Lately` (`world/Lately.ts`, the `lately` save field) through a signal wired in
`areas/neighbours.ts`. The day's first line is `talkLine` with `talks: 0` (`openerOf`); P5's
"how was your day" can be a topic of Cody's alone (a row with lines only for him would need the
`SMALL_TALK` shape loosened, or an urgent topic that fits only for `cody`). P2's answers and
moments seen want a save field of their own, the next number being v45. The 0.6 `NOTES` row has
three lines, all P1's: P2, P3a and P3b fold two into one each to make room, five at most.

#### Lane 4: rhythm (R5 → R1 → R2 → R3 → R4 → R6a → R6b → R6c; decisions from 310)

**For R6/V1 (from R4, decision 314):** the save is v51 (`projects: { current, given, built }`).
**To add a project**: a `ProjectId` in `types/ids.ts` and a `PROJECTS` row in `data/projects.ts`
(its `zone`, `where`, `candy`, `needs` of things she gathers or grows, never sold, its pieces at
each of `posts`, `frames` and `done` by top-left tile, `picture`, and `deck` or `beds` if it's
walked on or grown in), a `PropId`, `PROP_FOOTPRINT` row and art in `sprites/projects.ts` for its
frame and what's built (the posts are `sitePost` at the corners, `corners()`), a picture in
`PROJECT_PICTURES`, and what it does once built (a case in `World.arriveOn`, a `PROP_SEATS` row, a
happening's `bandstand`-style move). `tests/data/projectSites.test.ts` holds its tiles clear and
nothing cut off; `economy.test.ts` its worth between three and fourteen thorough days. A site in her
yard is kept from the day she starts it (`keptFor` in `areas/shared.ts`, `Yard.makeRoom`). What's
drawn is `Sites` per place, read off `Works`; `world.projects.preview(id, stage)` shows a stage in a
dev build, and `npm run sprite -- 'stage:*'` draws each. **Gathering is capped** at
`GATHERS_PER_WINDOW` (48) a place a window (`gatheredIn` from `Takings`): a new place with more than
48 things is capped too, and the economy test holds every place's best capped round within 1.6 of
the town's. The 0.8 `NOTES` row is full at five lines (R1's two folded into one, R2's, R3's, R4's):
a later 0.8 session folds two.

##### R6c (beside R6a)

**For V1 (from R6c, decision 317):** the save is v53 (`pets.affection`, a `Fondness` per pet:
`points`, and the day's `pat`/`walk`/`treat` counts). Fondness rows are `data/affection.ts`
(`FONDNESS` per kind and day, `WALK_TILES`, `LEVEL_AT` 20 and 60), rules `systems/affection.ts`
(`fonder`, `levelOf`, `progressOf`, `patLineAt`, `isFondness`), kept on `Pets` (`fonder`, `level`,
`points`; `setPoints` is the dev handle smoke uses). **To give a pet more to say at a level**,
`GROWN_PATS` (three a level, `tests/systems/affection.test.ts` counts nine distinct). **A job** is
a `JOBS` row and its rule in `systems/pets.ts`, decided in `Pet.follow` from
`PetSurroundings.finds` (read off `Fossils`, `Collecting`, `SmallEvents` in `areas/pets.ts`) as a
`PetDeed`, and made so in `PetCare.deed`; the critters' side is `Collecting.settle(key)` (a barked
critter neither drifts nor flutters for its hour) and `Collecting.draw(key, to)` (a hop, as a
drift). **A trick** is a `TRICKS` row (`ms`), its frames in `PET_ART[id].trick` and its beats in
`TRICK_STEPS` (`sprites/pets.ts`: frame, flip against her facing, lift, dx, alpha), read by
`lookOf` in `render/pets.ts`; the gallery's `pet:<id>:trick<n>` rows show them. **Rest spots**
are `PET_RESTS` (a hearth, beds, sofas, rugs; a new piece a pet should use is a row) and
`REST_LIKES`, worked out by `systems/petRest.ts` per room and layout; a perched pet is
`Pet.perch` (drawn lifted, in front of the piece). Every pet has `sitFront` and `sitBack`; a sit
beside her shows its back when she's further up. **Left for the review:** Florence's on-her-back
frame and Gary's front are serviceable rather than lovely (an art pass could redraw them; frame
sizes are free); a trick asked for on the sheet can happen behind it when the pet is low on the
screen (a trick on its own is seen in full); Cody's evening pats (`wiring/codyHome.ts`) don't count
towards fondness, which felt right (they're his pats). The 0.9 `NOTES` row is full at five lines
(S3's offline and backup in one, S3's photo folded into S2's cloud, R6b's, R6a's, R6c's). Smoke on
a container: a stale vite from another worktree held 5176, so R6c ran its dev server on 5186
(`SMOKE_URL`) and the preview on 5187 (`PREVIEW_URL`).

##### R6a (beside R6c)

**For V1 (from R6a, decision 316):** the save is v52: the `Cabinet` keeps the biggest of each fish
(`best`, by `CritterId`, in quarters of a hand; `measure`, `bestOf`). **A fish's bite** is
`BITE_MS[rarity]`; a tier in `REELS` (`systems/fishing.ts`, rare and legendary now) is hooked on its
bite and reeled on the tension bar (`reelOf`, `needleAt`, `reelGrade`; drawn by `drawReel` in
`render/fishing.ts` from `world.fishing.line.reeling`); `world.fishing.bestTapAt()` says when a tap
does best, bite or bar, for tests and smoke. **A new fish** wants a `FISH_SIZES` row
(`data/fishSizes.ts`) inside its shadow's band (`catchSize.test.ts` holds it); its size is said by
`handsOf`. **Shy critters** are `drifts(id)` in `systems/drift.ts` (rare, legendary and the finer
moths; never a fish or a creepy-crawly): `Collecting.notice(her, walked)` from `World.update` hops one
a tile away (`Critter.hop`, drawn by `hopOf` in `render/critters.ts`) when she comes within
`NOTICE_TILES` having walked more than `CREEP_TILES` since she last stood still, unless she's behind a
flier (north of it, more than to its side); `shiedFrom` stops the net on that walk. **Left for the
review:** the bar doesn't slow under reduced motion (the world doesn't know the phone's setting;
a tap out of time costs nothing), and the bar's window is a dark green that reads less well over
the night's water than over the day's. Smoke's `drifter` finds a shy critter by trying a few
`?day=`s and hours; the 0.9 `NOTES` row is full at five (S3's first two folded into one, S3's other,
S2's, R6b's, R6a's): R6c folds two. The rarity test is unchanged by this (9.1–10.2 months, the
longest wait 30 days).

##### R6b (beside R4)

**For R6a/R6c/V1 (from R6b, decision 315):** a fair game's throw is `patternOf(game, seed, n,
slow)` scored by `score(pattern, tapAt, startedAt, at)` on the world's clock
(`systems/activities.ts`); the sheet's stage (`render/fairGames.ts`) draws from the same reads, so
**a new game is a `Motion`, its position read and its `offBy`, a backdrop and pieces in
`sprites/fairGames.ts`, and a case in `drawFairGame`**; a new stall is `drawStall` with wares, a
`PropId`, a footprint, a legend character (`FAIR_LEGEND` has used `9` and `0`) and an `ACTIVITIES`
row. R6a's reel can borrow the shape (a pattern dealt from the cast, graded 0–2, the floor always
something). `world.activities.bestTapAt(id)` says when a tap does best, which smoke's `tapInTime`
waits for. The free go is `fortune:freeGo` in `Takings` (the `fortune:` prefix makes it once a
day); a **Today line for it** ("your first go at the duck pond is free") was left for later, as R4
was growing Today beside this session: a `TodayFacts` field read from `activities.freeGo()` and
`freeToday`. The 0.9 `NOTES` row is full at five lines (S3's three, S2's, R6b's): R6a and R6c fold
two. A new squishy moves `figurines.test.ts`'s count and smoke's Cabinet "sets" count (now 17).

**For R4/R6 (from R3, decision 313):** no save change; the 0.8 `NOTES` row is full at five lines
(R1's three, R2's, R3's): **R4 folds two to make room**.

- **To add a rare event**: a `RareEventId` and a `RARE_EVENTS` row in `data/rareEvents.ts` (its
  `name`, `glyph`, the `heralds` toast, Today's `small`, a `keepsake` (a `RareKeepsakeId` with an
  item row in `RARE_KEEPSAKES`, a 0 in `RARE_KEEPSAKE_VALUES`, art in `sprites/rareEvents.ts`, and
  the selling test's kept list) and its `letter`; `months`, `clear` or `week` if it wants them),
  a line in `RHYTHM_GREETINGS` (`data/greetings.ts`), and what it does: dealt by `rareEventOn`
  (`systems/rareEvents.ts`, cached per day; a one-day event is any that `fits`), told and its
  keepsake posted by `RareEvents.check` (`world.rareEvents`; quietly, the toast says "And there's
  a letter", since a letter's toast takes the line), seen in the sky by `rareSkyAt` (the view's
  `rareEvents.sky()`), stood in town through `Decorations` as the stall is, or someone passing
  through (`PASSERS`, a `Figure` row in `sprites/villagers.ts` and a voice in `audio/cues.ts`).
  Everything she has done of one is a `rare:` key in `Takings` (once a day). Rerun
  `tests/systems/rareEvents.test.ts` (about one day in nine, never two at once).
- **To add a festival**: a `FestivalId` and a `CALENDAR` row with a `from`/`until` span (never
  overlapping another: `festivalOn` reads the first), a `banner`, a `CALENDAR_MARKS` row, a shelf
  `on` it in `SHOPS`, a beat `on: { festival, weekdays }` in `RHYTHM_HAPPENINGS` (never on its
  finale), a `RHYTHM_GREETINGS` line and `FESTIVAL_LINES` (said on its first day and Saturday). Only
  `TunedFestival`s have a tune (`audio/music.ts`); add a `THEMES` row and widen it to give one.
- **To add a daytime happening**: a `RhythmId`, a `RHYTHM_HAPPENINGS` row, a `HAPPENING_CALLED`
  name and a `RHYTHM_VERBS` row. Mind the neighbours' stops that tests lean on (Rufus's Monday
  wildflowers in `tests/world/travel.test.ts`), and that a happening beats a visit to hers:
  `callersOn` now leaves out a caller at a happening.
- **R4's projects**: a Today line is a `TodayFacts` field and a `TodayLine` member as R2 said;
  `outOfTheOrdinary` in `systems/today.ts` shows where R3's went. A project in the world could
  stand through `Decorations` as the wandering stall does (a prop row, `PROP_FOOTPRINT`, a tile kept
  clear in `tests/data/digSpots.test.ts`'s `keptClear`). **R6b**: the wayfarer and Moira are taps
  (`Visit` `passer`); a fair game could borrow `metPasser`'s toast. `tests/world/weeksDiffer.test.ts`
  holds no two days alike in any month for two years: rerun it if a happening or event goes.

**For R3/R4 (from R2, decision 312):** the calendar's Today is `todayLines(facts)` in
`systems/today.ts`, worked out each time from `TodayFacts`, which `areas/upNow.ts` reads off the
services (`world.upNow.lines()`); nothing is kept. **To add a Today line** (R3's rare event, a
travelling stall, a visitor for the week; R4's project to fund): add a field to `TodayFacts` and
its read in `areas/upNow.ts` (a plain read of a service, made before `upNow` in `build.ts`), a
member of the `TodayLine` union with a `key` (it changes when the line is news again: put the day,
window or week in it, so the date chip's dot comes back) and a `go` if a tap should take her
somewhere (`{ zone, prop }` walks up to a prop, `{ zone, tile, bed }` to a bed, `{ villager }` to
a neighbour; `wiring/todayGo.ts` flies her there first by `Travel.fly` when she's elsewhere), its
push in `todayLines` where it belongs in the order, its words in `hud/todayWords.ts` (a case:
`text`, `small`, a `Glyph`, never an emoji), and a case in `holds()` in `tests/world/today.test.ts`
asking the world itself whether it's true. If what it reads changes without one of
`TODAY_TOLD_BY`'s events (`wiring/todayGo.ts`), add the event there so the dot is asked again.
R3's rare events can be Today's lines first and toasts second; R4's projects a line while one's
being funded (what it still wants) with a `go` to the noticeboard. The favour parcel is `+` in
`NEIGHBOUR_BUBBLES`, picked by `bubblesOver`; a new bubble over a head goes beside it there. The
0.8 `NOTES` row has four lines (R1's three, R2's one): R3 and R4 fold to stay at five.

**For R2/R3 (from R1, decision 311):** her first day is `world.firstDay` (`FirstDay`, made by
`areas/firstDay.ts`): six steps (`FIRST_DAY_STEPS`, `data/firstDay.ts`) worked out by
`systems/firstDay.ts` from `FirstDayFacts` the area reads off the town (the candy tree's
`shakenAt`, any bed growing or crop picked, the stall's stock, sales or tin, a `notice:n` key in
the takings, friendships' `talked` but Cody's, any meal's time). It's `open` once her look is made
and her first visit counted, until every step is done; `saw(events)` in `World.update` re-reads the
facts only when a moment came or the bag, Candy, friends or stall changed, and returns a `firstDay`
moment per step done (with `keepsake` on the last). Saved as `firstDay: { done, over }`; an old
town's is over. **R2's Today** can read the same facts (they're plain reads of the world) or
`world.firstDay.steps()` to show "Cody's list: 4 of 6" while it's open. **The card** is
`hud/FirstDayCard.ts` through `FirstDayApi` (`open`, `steps`, `portrait`, `onChange` on the
`firstDay` state event), opened by `hud.openFirstDay()` (only with no sheet up), from the greeting's
`then` on his `first` hello only, and from `.hud-first-day-button`, first in the "more" tray, hidden
when the thread is over. **The one-time glow** is `hud/hints.ts`: `hintOnce(button, id, wanted)` sets
`data-hint` (an outline pulse in `hud/firstDayStyles.ts`) while `wanted()` and the phone hasn't
pressed it (`mcfrancisville:hintsSeen`, a list of `HintId`s), put out by the first click; add a
`HintId` to glow something else once (R2's dot on the date chip is its own thing, but can sit beside
`todayHint` in `Hud.ts`). The starter bag has four seed kinds. Smoke's `firstDay` runs in a second
browser context (`PHONE_CONTEXT`, `page` swapped and restored), so a section that wants a new town
of its own can do the same. The 0.8 `NOTES` row has three lines (R1's): R2, R3 and R4 add or fold,
five at most.

**For R1/R2/R6a (from R5, decision 310):** whether a critter comes out on a day is `comesOut`
(in its season and weather, or `isVisiting`: the day after a full moon, `isVisitDay`), read by
`isAbout`, which every dealer, the lure and the Cabinet go through; add a rule there, never
beside it. Weights are `RARITY_WEIGHT` 24:10:4:2 with a visitor at `VISIT_WEIGHT` 1, a holiday
critter off its days at `HOLIDAY_VISIT_WEIGHT` 5 and moon-bound at 24; any change to a critter or
a weight reruns `tests/systems/rarity.test.ts`, which holds both the 31-day wait (29 now) and the
Cabinet filling in 8.5–11 months (9.1–10.2 now). `nextChance(id, day, hour)` is the next day a
critter could be out (R2's Today can say "the fireflies are visiting" from it). There are 70
critters; a family's case holds 12 (`MUSEUM_NOOKS`), and the crawlies (14) run on into the ninth
case (`RoomView.onShow`), so a family past 12 needs another `museumCase` row with its `shows`.
**R6a:** a size per catch and a personal best want to go on the `Cabinet`, keyed by `CritterId`
like the rest; the holiday critters and spiders are ordinary rows (`holiday` on a row only moves
its season), so `wary` and a bite window by rarity apply to them as to any.

#### Lane 5: sound, platform and her fixes (S4 → S1 → S3 → S2; decisions from 320)

**For V1 (from S2, decision 323):**

- **Nobody has run the function on Vercel yet.** It's Web `GET`/`PUT` handlers in `api/save.ts`
  with its own `api/tsconfig.json` (Vercel compiles a function with the nearest tsconfig; the
  app's never emits). The first deploy to `main` that carries it is the first real test: check
  the deployment's Functions tab lists `api/save`, then the README's `curl`. If the build trips
  on TypeScript, the fallback is the same file as `api/save.js` with JSDoc types.
- **Cut 0.9 after the store is linked**, or its note ("floats up to the cloud") runs ahead of
  the game; until then Settings says "The cloud isn't set up yet" and nothing else changes.
- The QR holds the code as text (the camera shows it to copy); restoring is typed or pasted on
  the new phone. The backup code stays and is still the way for a phone with no signal.
- Smoke fakes the function with a Playwright route (`fakeCloud` in `scripts/smoke.mjs`) on the
  main context and the `cloud` section's own; other contexts reach the dev server, which serves
  `api/save.ts` as JavaScript, read as out of reach, so nothing is ever PUT there.

**For S2 (from S3, decision 322):**

- **The service worker** is `public/sw.js`; `vite build` writes its `PRECACHE` list and `VERSION`
  in (the plugin in `vite.config.ts`, `precacheList`/`withPrecache` in `src/precache.ts`, marks
  `/* precache */ []` and `/* version */ 'dev'` that must stay). The version hashes every file
  and the worker's code, so any deploy makes a new cache and the old ones go on activate.
  Navigation is network first, kept under `/`; `/assets/` cache first; anything else network
  first with the cache behind it. **It never answers or keeps `/api/`** (an early `return` before
  `respondWith`, held by `tests/pwa/precache.test.ts`), so `api/save` always reaches the network
  and fails honestly offline: the client's debounced, offline-tolerant PUT has to queue and retry
  itself, as the worker won't. Don't make an `api/` file under `public/` (it would be precached);
  a Vercel function lives in the root `api/`, outside `dist/`. `npm run smoke:offline` (and its CI
  step) runs the built game offline: if S2 adds a sync on boot, it must not throw or log a console
  error with no signal, or that run fails its "no errors" check.
- **What's the phone's** is a key beside the save in `localStorage`, read and written in
  try/catch with a `Storage` parameter for tests, as `src/settings.ts`, `src/safekeeping.ts`
  (`mcfrancisville:backedUpAt`, `:nudgedAt`) and `src/errorNotes.ts` (`:errors`) do. S2's secret
  belongs there too (a new module of its own). A cloud save is a backup: S2 can call
  `markBackedUp(now)` after a successful PUT, so the Backup tab's "last backed up" and Cody's
  nudge (`nudgeFor` in `src/systems/backupNudge.ts`) count it.
- **The error notes**: `catchErrors(window)` runs first in `main.ts` and notes every uncaught error
  and unhandled rejection (the last five, repeats counted); Settings' Sound tab mentions the
  newest for a month with Copy note. A sync's failures that are expected (offline, a 5xx) should be
  caught where they happen, not left as unhandled rejections, or every walk through a tunnel
  becomes a note.
- **The 0.9 `NOTES` row** has three lines, all S3's (a row needs three to five): S2 and lane 4's
  R6 sessions fold S3's into one or two to make room. `?perf` (production too) is for her phone's
  number, which `docs/architecture.md` has a table waiting for.

**For S3/S2 (from S1):** the sound is `src/audio/` (decision 321): `graph.ts`'s `Mixer` is the
node graph, `SoundBoard` what plays when, `session.ts` the silent switch (`audioSession` or a
loop of made silence, unlocked before the context in her touch). S3's service worker should
precache nothing of it (no audio files exist; the silence is a data URI). Only her iPhone can
say the switch is beaten: ask the user to try it on silent when 0.4 is on her phone, and if it
isn't, the next thing to try is starting the silent `<audio>` on iOS 17 too (`SilentSwitch.unlock`
skips it when `audioSession` exists). S3's error note in Settings goes beside the silent-switch
hint in the Sound tab's pattern (`silentHint`, once per phone, kept beside the switches, never in
the save). The 0.4 `NOTES` row is full at five lines (L1's three, S4's, S1's): a later 0.4
session folds two to make room.

**For S1/S3/S2:** any − n + or other button that should repeat while held takes `held(button,
step)` from `hud/dom.ts` (timing in `HELD`/`heldGap`); smoke holds a button with a real touch
through `holdElement`. The 0.4 `NOTES` row has four lines now (L1's three and S4's); one more fits.

### How 0.3 was run, for whoever plans 0.4

The plan (decision 212) cut 0.3 into sessions of one context window each, in five lanes by the
files they own, and the user chose two lanes at a time. One coordinating session ran each plan
session as a sub-agent in a worktree of its own, two at once (lanes 1 and 2 first, lane 3 when
lane 1 finished, lane 5 when lane 2 did, lane 4 last), with W1 alone before and V1 alone after.
Each sub-agent ran `npm ci`, branched from `v0.3-dev`, ran the whole suite and smoke (on a dev
server port of its own) before every push, opened its draft PR through the REST API (`gh api`;
GraphQL is blocked in the container), merged it itself with a merge commit once CI passed, and
wrote its heading here and its line on the plan's status line. Usage limits cut sessions off
with no warning (A1 and H1 a few minutes in, F3 part way, F0's first attempt), and the rule to
push at least every half hour with the heading saying where things stood made each cut-off
cheap: a fresh sub-agent picked the branch up from its heading. Save bumps went last in a
session, after merging `v0.3-dev`, and merged one at a time, so v35 to v43 came in nine steps
with no collision; lane rule 7 (new rows in a const of their own, new art in a file of its own,
shared files only added to) kept two lanes from ever conflicting. Worth keeping for 0.4: the
lanes by files owned, the cross-lane "For X:" notes each heading left for a later session, and a
V1 that measures and makes fixtures from a real browser.

### What 0.3 built (a line a session; the decisions hold the detail)

- **W1** (PR #126, decision 218): the world made by area, `src/world/areas/`.
- **Lane 1, her and the view:** A1 (PR #130, 220) shoes under any hem, a neighbour's too; A2 (PR
  #132, 221) capes and wings behind and over her, hair tucked into the collar; A3 (PR #134, 222)
  see-through trees; A4 (PR #135, 223) food says what it does, and the meal chips.
- **Lane 2, her home:** H1 (PR #131, 230, v35) the chest takes things; H2 (PR #133, 231, v36)
  set and display pieces; H3 (PR #136, 232, v37) small things on surfaces; H4 (PR #139, 233,
  v39) rooms and the back room; H5 (PR #141, 234, v40) her yard.
- **Lane 3, the farm:** F0 (PR #138, 240, v38) the way round the lake; F1 (PR #140, 241) Boo
  Acres; F2 (PR #142, 242) the orchard, seed cart, greenhouse and barn; F3 (PR #144, 243, v42)
  Scarah and Cornelius.
- **Lane 4, collecting:** C1 (PR #146, 250, v43) fossils; C2 (PR #151, 251) the creepy-crawlies
  and the Cabinet to sixty; C3 (PR #153, 252) figurines.
- **Lane 5, shopping:** S1 (PR #143, 260, v41) Ollie's catalogue; S2 (PR #145, 261) Gourdon's
  workshop; S3 (PR #147, 262) four furniture sets and the set of the week; S4 (PR #149, 263)
  four more sets, window wallpapers and floors.
- **V1 landed** (PR #155, decision 264): the suite and smoke green, smoke's toast taps made robust, lived-in v34 and v43 saves as fixtures, the architecture review and "where it hurts", perf against 0.2.5 with no frame doubled, the art notes, the mayor's five notes, `CLAUDE.md` and this handoff; then the release PR, #156. The 0.3 plan is complete. After it, `v0.3-dev` stopped making Vercel previews, as the other dev branches had (`vercel.json`, decision 265); a later integration branch goes in that list the day it is made.

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
  plays the cue for each moment `update()` returns. Neighbours talk in `voiceOf` blips, lifting at
  the end of a question. The music is a `THEMES` row per place (`music.ts`), an A and an 8-bar
  `b`, arranged by time of day (`night` from ten) and varied pass to pass (`variationOf`); a new
  theme needs its `b`, and the tests read every pass of every key.
- Every voice plays through `Mixer` (`src/audio/graph.ts`, V1's S1): buses into a compressor and
  a generated reverb. A new layer of ambience is a `Layer`, a rule in `ambienceFor` and a case in
  `noiseLayer` (or a `Tune` on a loop, as the crickets are); a new ground for footsteps a
  `Ground`, a `groundOf` case and a `FOOTSTEPS` pair.
- A record's tune is a row in `RECORD_TUNES` (`src/audio/records.ts`), original, in its band's
  style; a test holds that every record item has one. `SoundBoard.playRecord` hushes the music
  until it ends, and going out stops it.
- `SoundBoard` starts on her first touch (iOS), schedules long tunes a moment ahead, and suspends
  when the app is hidden. `settings.ts` keeps the two switches per phone. Loudness is checked by
  rendering offline in Chromium through the real graph (`new Mixer(new OfflineAudioContext(…))`
  from a dev server page, `mixer.voice` for each note, then RMS and peak of the render): records
  sit around 0.05–0.09 RMS with peaks under 0.45, the music 0.019–0.022, the ambience under it
  (0.004–0.015), footsteps and the tick peaking near 0.03 (decision 321). The master is 0.55
  because the compressor's make-up gain and the reverb add about half again.
- The silent switch is `session.ts`: only a real iPhone shows it working; a test holds the order
  (the session's hint or the silence first, then the context).

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

What still looks off, kept as sessions notice it (the user reviews the art all together: "Before
phase G" in `docs/personal_touches.md`). L6 emptied the list (decision 292); **V1's review**
(decision 324) looked again after L6, L2, L4 and L7, at `npm run sprite -- 'place:*'`, the smoke
screenshots and its own four days of play at phone size, and found:

- **The lavender cobble still carries the town.** L2 gave the woods and farm dirt and the castle
  gravel, but the town's roads, its square and the fairground's paths are all one cobble, and the
  square is a big empty plaza with a small well in the middle; it draws the eye more than the
  buildings round it. A worn middle, a second paving for the square (flagstones, a ring round the
  well), benches or planters on it, or the square made smaller, would each help.
- **Woods are walls of one crown.** Whisperwood, the shore and the castle hill are edged with the
  same round teal crown over and over (the purple and orange ones and the conifers break it up, but
  not much at a distance); the forms L2 added are few beside it. More variety in the edge crowns,
  and an uneven edge rather than a straight hedge of trees.
- **Ice and the creeks are flat paint.** The frozen creek in Whisperwood and the one feeding the
  lake at Lantern Shore are a flat pale blue ribbon with hard edges, beside water that L6 gave banks
  and glints; and a frozen creek running into an open lake reads oddly. A texture on the ice
  (cracks, a sheen) and the banks' soft edge would bring it in line.
- **Big empty lawns** in the hidden clearing's middle and the fairground's south-east: L2's decals
  are there but thin. A meadow patch or a few standing props.
- **The castle garden's beds are the same rectangle** four times over.
- **She holds her rod indoors**: the quick bar hides at home, but what she held outside stays in
  her hand in the house (seen with Cody on the sofa at 19:30). Harmless, a little odd.
- **The tension bar is small** (44 world pixels, about a tile and a half at Close): it reads, but
  only just, and its dark green window less well at night (R6a's note).
- **Lane notes still open:** the body builds and the neutral faces on the noticeboard and the
  neighbours sheet (L7), Florence's on-her-back frame and Gary's front (R6c), the noticeboard's art
  the same whatever is pinned (L6). Each is in "Where it hurts" too.

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
