# McFrancisVille: plan for V1

**Status:** settled 2026-10-06 (the analysis is `docs/v1_analysis.md`; the user's answers to its
interview are decisions 266–275). Sessions append "**Session X landed** (…, decision n, PR #n)"
here as they merge; patches to her phone are marked ⬆ and cut at the user's word. **Session E1 landed** (the effects layer: pops, particles and emotes from every moment, decision 280, PR #165).
**Session L1 landed** (Close and Far: the camera at 12 tiles across by default, toggleable, rooms
fit to the width in a surround, decision 290, PR #164).
**Session E2 landed** (her verbs have a body: she faces what she arrives at, crouches, tilts the can, swings, holds a find up, blinks and breathes, decision 281, PR #166).
**Session L3 landed** (light: a grade by hour, dithered lamp pools, bloom, a night vignette,
moonlight, cloud shadows and wet ground, decision 291, PR #167).
**Session S4 landed** (her fixes: hold − and + to sell more, the greenhouse's beds show what's planted, bat wings in red and every piece in its own colours, decision 320, PR #169).
**Session E3 landed** (neighbours come alive: a wander round the stop, a breath and a blink, a wave as she comes near, chatter between two, sitting, a working pose with a prop at their job, Maude walks, decision 282, PR #168).
**Session E4 landed** (taps and transitions: a ring and an outline on a tap, a shrug where she can't go, held presses, an iris wipe through doors, the broom seen flying, the title fading, sheets sliding, a wash when a window turns, decision 283, PR #171).
**Session S1 landed** (heard: the silent switch, reverb and a compressor, a B section and a night arrangement for every theme, ambience by place, hour and weather, footsteps, a UI tick, decision 321, PR #170).
**Session R5 landed** (critters for all: every critter out the day after each full moon when out of its season or weather, never more than 29 days away, the Cabinet still a year's work and saying when the next chance is, seven holiday critters that stay, three jumping spiders and a ninth museum case, decision 310, PR #173). **⬆ 0.4 cut** (2026-10-07, PR #175 from `v1-dev` to `main`, at the user's word: 0.4's five and 0.5's first five, E1–E3, E5 and L3, together; the notes card shows both versions, PR #174).
**Session E5 landed** (props and furniture animate: the fountain's jet, the big wheel turning, awnings and banners in the breeze, candlelit windows and lamps that flicker, doors that open as she arrives, fires, bubbles, a pendulum, fish and steam indoors, crows and bats crossing the sky, a crow on the scarecrow, leaves falling in autumn, decision 284, PR #172).
**Session L6 landed** (the art pass: water with organic banks instead of an octagon pond and an L-shaped creek, flower beds instead of dot grids, frogs, the mist newt, the firefly, the Hercules beetle, the fog eel and the pike redrawn, the mourning cloak, tombstone toad and reed frog marked, the scale sheet's tree, a bigger rowboat, the banner's lettering doubled, bulbs and seeds that read, the art notes emptied, decision 292, PR #177).
**Session P1 landed** (talks with memory: what she wears, gave, picked, donated and put out, how long since and how long here, a band reached and the bracelet they wear; three lines a topic, ten new topics, a day's first line that never repeats in a week, the promising lines kept or rewritten, decision 300, save v44, PR #178).
**Session P2 landed** (her voice and heart moments: reply chips on four topics, a question each kept and brought up after, five heart moments for every neighbour but Cody told one a day, best friends who miss her, ask her along, call by choice and write now and then, the birthday letter signed by all twelve, decision 301, save v45, PR #180).
**Session L2 landed** (ground: the lawn in tones by noise, shade under trees and worn doorsteps, dirt tracks in the woods and the farm, gravel up the castle hill, meadow and long grass, soft edges instead of the kerb, ten decals, reeds in the clearing, a conifer, a dead spooky tree and a birch, the old trees a third bigger, tufts that read; the town's commonest colour 42% → 15%, every place under a quarter, decision 293, PR #179).

## What V1 is for

She has a town, a farm, twelve neighbours, sixty critters, eight sets of furniture and a yard,
and it feels flat. The analysis says why: wide, not deep. Nothing reacts to her, nobody remembers
her, nothing points her anywhere, and the presentation sells the good art short. **V1 adds
almost no content.** It makes the world react (lane 1), makes the game look and sound finished
(lanes 2 and 5), makes the neighbours know her and finishes the story (lane 3), and gives the
days a shape and the months a goal (lane 4). The one new neighbour is the one the story has been
promising: Rob Boo, the mayor (decision 270).

Three things shape how it's built, as before:

- **Sessions are small.** Every session fits one context window and ends with a green PR into
  `v1-dev`; a session can be stopped at any moment and nothing waits on one that isn't finished.
- **Lanes run side by side, two at a time** (decision 266), by the files they own, so sessions
  merge by adding lines.
- **Patches, not a launch.** She checks in every day. Each lane's first sessions are the ones
  she'd notice first, and ⬆ marks where a patch makes sense on its own (0.4, 0.5…); the whole
  plan done is 1.0.

## The workflow for V1

- **`v1-dev` is the integration branch** (made from `main` at 0.3 on 2026-10-06, in
  `vercel.json`'s no-preview list). Each session branches from it, its PR targets it, merged with
  a merge commit once green. `main` (her phone) gets a patch only at the user's word, as one PR
  from `v1-dev`, each with its own `NOTES` row in `src/data/patchNotes.ts`.
- **Saves:** V1 begins at save v44. A session that changes the save bumps in its last commit after
  merging the latest `v1-dev`, taking the next number, says so in its handoff heading, and the
  coordinator merges save-bumping PRs one at a time. Each patch adds a lived-in fixture when the
  shape changed (decision 210).
- **Personal touches stay parked** (decision 177): no session asks; the warmest default, named in
  the decision. The exception is what the user already said (decisions 267–275): that is the
  brief.
- **Both orientations.** She flips between upright and on its side (decision 267). Every session
  that touches the view or the HUD looks at both in smoke before marking ready.

## Principles for every session

The earlier principles hold (`docs/v0.3_plan.md`, "Principles for every session"): rules in
`world/` and `systems/`, never in drawing code; time from the clock and the day key; content as
rows in a const of their own; saves migrated with a test; nothing punishes, expires or is lost
(decision 11); nothing is gated (decision 211). For V1, four more:

- **Every moment reaches the world.** A thing that happens is seen where it happens (an effect, a
  pose, a bubble), heard, and only then told. A new moment that is "cue and toast" only is a
  review callout.
- **Nothing she can't get for a month** (decision 271). A critter, a piece, a reward: the hint
  says when, and when is never more than a month off.
- **Skill with a floor** (decision 272). A go may ask for timing; it always wins something and
  never loses anything.
- **Measured on the phone.** Any session that adds a pass over the frame (light, bloom, snow,
  particles) measures against `docs/architecture.md`'s baseline before it merges, and the
  closer camera (L1) sets a new baseline for everything after it.

### The design review checklist (in every session's PR)

Unchanged: wrong layer? a file with a second job? new state saved, migrated, tested, repaired?
deterministic from the clock and day key? content as data, art in `sprites/`, drawn by a test?
the next three features? frame time or memory? what got harder? **And now: both orientations
looked at? every new moment seen in the world?**

## Where the interview's answers land

| The user said (decision)                                         | Sessions                |
| ---------------------------------------------------------------- | ----------------------- |
| Night, both orientations, daily, sound half the time (267)       | L3 first in lane 2; all |
| Never the fairground; loves collecting; creatures look funny     | R6b, R5, L6             |
| The camera closer, toggleable (268)                              | L1                      |
| Cody keeps his manor, married from the start; no kids (269)      | P5                      |
| Rob Boo is the mayor; the mystery finishes (270)                 | P3a, P3b                |
| Arrivals on a schedule; no critter a year away; holiday critters | R3, R5                  |
| Skill with a floor; the fair games reworked (272)                | R6a, R6b, R6c           |
| Polish the UI, don't restyle it; the town turns with the seasons | L5, L4                  |
| Something to build over weeks (274)                              | R4                      |
| Patches, not one launch (266)                                    | the ⬆ marks             |
| Jumping spiders (275)                                            | R5                      |
| The greenhouse planters' art (275)                               | S4                      |
| Not everything blue; bat wings in red (275)                      | S4                      |
| Cloud save (275)                                                 | S2                      |
| Hold − and + to sell more (275)                                  | S4                      |

## The sessions

Each is one PR into `v1-dev`, one context window, with the checklist. **S** is a short session,
**M** a full one. The letter is the lane. ⬆ marks a patch point.

### E. Feel: the world reacts (lane 1; never the save)

**E1. The effects layer (M).** The foundation everything in this lane uses: a world-space effects
queue in `src/render/effects.ts` that `wiring/moments.ts` can push to (a kind, a world position,
a lifetime), drawn by every view after its drawables: **pops** (the item's icon arcing from its
source to over her head and floating up with "+n"; the bag or quick-bar button bumping with a
keyframe in `styles.ts`), **particles** (a small pool: leaves on a shake, dust on landing and
footsteps, a splash where the float lands, sparkles on a first catch, hearts over a neighbour on a
loved gift, confetti on a shelf finished, coins on a sale), and **emotes** (♥ ♪ … ! ? over her and
over neighbours, `NEIGHBOUR_BUBBLES` grown). Every moment kind in `moments.ts` that was cue and
toast only gets its effect here (`bought`, `sold`, `made`, `cooked`, `found`, `delivered`, `won`,
`flew`, `gathered`, `harvested`, `caught`, `dug`…), listed in the decision. Honour reduced motion.
_Done when smoke sees a pop on a gather and a heart over a neighbour, and perf shows no pass
added._

**E2. Her verbs have a body (M).** She faces what she arrives at (`arriveOn` and the bed arrival
set facing); short action poses in `systems/poses.ts` and `sprites/doll.ts` (a crouch-and-reach
for gather and dig, a can-tilt for watering, a swing for the net that moves her arm, a
hold-it-up over her head for catches, finds and first harvests, a wave on greeting), ~300 ms
each, every pose in every outfit held by `doll.test.ts`; a blink and a breath before the phone
idle. _Done when the gallery shows every action pose dressed and smoke sees her crouch at a rock._

**E3. Neighbours come alive (M).** A wander round the stop every half minute, a breathe and a
blink, a wave or `!` when she comes within two tiles, visible chatter bubbles (… ♪ ♥) when two
stand together, sitting on benches and chairs (`seat` rows, the sit pose from decision 174 on a
neighbour), and **a working pose with a prop at their job** (Rufus with a bucket, Gourdon
sawing, Barty digging, Wrapunzel with a tray, Nessa lighting a lantern at dusk, Ollie with the
satchel, a `doing` on a `Stop` in `villagers.ts`, art as `Touch`es). Maude gets walk frames.
_Done when a neighbour at a stop is never one still frame for more than a few seconds._

**E4. Taps and transitions (S).** A ring at the tap point, an outline on the thing tapped (the
`drawPicked` outline), a soft `CUES.tap`, a shrug and a cue on an unreachable tap (the `walkTo`
result read), a held press counted as a tap; an iris wipe on her for doors and rooms, the broom
seen flying across on `flew`, the title fading out, sheets sliding up in 180 ms, a tint when a
window turns. _Done when smoke's tap on a hedge gets a shrug._ ⬆ (with L1, S1, S4, R5: **0.4**)

**E5. Props and furniture animate (M).** A `frames` and a period on `PropArt` and on furniture
art: the fountain's jet, the big wheel turning, flags and bunting, lamp flicker, windows that
flicker at night, doors that open as she goes in; indoors the hearth's fire, the cauldron's
bubbles, the clock's pendulum, the bubble tank's fish, the kettle's steam; crows and a few bats
crossing the sky (`render/butterflies.ts` as the pattern), leaves falling under trees in autumn
(with L4). Baked frames, drawn by the views' existing passes. _Done when nothing a row says moves
is still._

### L. Look (lane 2; never the save)

**L1. Closer (S).** Decision 268: `TILES_ACROSS` about 12 (scale 3 on an iPhone) as **Close**, the
view she has now as **Far**, a switch in Settings kept per phone (`settings.ts`); rooms fit the
width in a drawn surround (a roofline and dark wood, not `ink`) at either; the camera, taps and
smoke's `smooth` section checked at both; a new perf baseline at Close. _Done when she's about
8 mm tall at Close and the toggle survives a reload._ ⬆

**L3. Light (M).** First after L1 because she plays at night (decision 267): grading by hour in
`lighting.ts` (cool shadows and warm highlights at dusk, more contrast at golden hour, a little
desaturation at night, something at midday), lamp pools with dithered falloff instead of five
rings, a bloom pass for bulbs, windows and glows, a soft night vignette, moonlit rim light on a
full moon, cloud shadows drifting by day, wet dark ground and puddles in rain, measured against
the baseline. _Done when the night screenshot has depth and perf shows at most one pass added._

**L6. Creatures and scenery that look funny (M).** Decision 267: render every critter at 16, 24
and in the world at Close, every place's overview and the scale sheet, look at them all, and fix
what reads wrong (shapes that don't read at phone size, palettes on the wrong family's shape,
the pond's octagon, the creek's L, the castle's dot-grid beds, the old lollipop tree on the scale
sheet), with a before-and-after page in the PR. No new creatures. _Done when the art notes'
list is empty and the page is in the PR._

**L2. Ground (M).** Large-scale grass tones from low-frequency noise, darker under crowns, worn
by doors and gates; a dirt track tile for the woods and the farm and gravel for the castle,
cobble kept for the town, soft path-to-grass edges instead of the kerb; meadow and long-grass
tiles; ten more flat decals (clover, mushroom rings, leaf drifts on open lawn, puddles, acorns);
water with organic banks and reeds; three more tree forms (a conifer, a dead spooky tree, a
birch) and the old trees bigger. Rows in `clutter.ts`, kinds in `terrain.ts`, the maps touched
only where a tile kind changes. _Done when the town's single most common colour is under a
quarter of its pixels._

**L4. Seasons (M).** Decision 273: palette swaps of grass, leaves and hedges by month
(`TREE_LEAVES`, `GRASS_PALETTE`, a season read from the day key, the ground re-baked on a
change); snow that settles on ground and roofs through winter, not only on two days; blossom
crowns in spring; leaf drifts building through autumn; October still the heart of it. _Done when
`?day=` in each season shows a different town._ ⬆ (with L2, L3, L6, E1–E3: **0.5**)

**L5. The UI polished (M).** Decision 273, the style kept: drawn 16-pixel icons where emoji sit
in the chrome (🍬 👥 ⚙ 🎒 ☰ 🛋 👗 🗺 📖 🪴 and the hearts) and then in toasts, the calendar and
the map; sheets that slide (E4's) with an eased backdrop; hearts that fill with a pop and Candy
that counts up; "new" marks that settle; the date chip that looks like a button; portraits at 64
drawn as busts; a title with a night sky, a moon and bats and a fade; an app icon drawn at 512
and a splash. _Done when no emoji is left in the chrome._

**L7. Faces (M).** Moods chosen by the line (`Mood` on a line or a topic: happy, surprised, sad,
a laugh), shown on the world sprite and the bust portrait in the talk sheet; her own face
reacting in the world to a catch, a gift, a fright; blink frames. _Done when a loved gift changes
a face._ ⬆

### P. People (lane 3; changes the save)

**P1. Talks with memory (M).** `TalkScene` carries her outfit and costume, her newest piece
placed, today's harvest and donation, the last gift she gave them and its day, days since the
last talk, a band just reached, the bracelet they wear, how long she has lived here; a small
saved history beside `Friends` (a save bump); three or four lines per topic per neighbour instead
of one, and the window line no longer leads every first talk. The lines that promise things no
system gives are made true or rewritten. _Done when the dialogue test reads every topic with every
scene and a week of talks never repeats a first line._

**P2. Her voice, and heart moments (M).** Reply chips on some lines (two or three answers she
picks, the neighbour answering back); questions a neighbour asks and keeps the answer to (Hazel's
star, Rufus's flower, Maude's book), referred to later; **heart moments** at 2, 4, 5, 8 and 10
hearts, a short multi-line scene each that tells their story (Maude's "after", Nessa's whole name,
Wrapunzel's princess years, Boothoven's lost symphony), rows in `src/data/heartMoments.ts`;
best-friend content after 10 (a visit by choice, an invitation, a letter now and then, missing
her when she's away a few days); the birthday letter signed by all twelve. A save bump for the
answers and the moments seen. _Done when every neighbour has five moments and smoke answers a
question._

**P3a. The mystery, chapter by chapter (M).** Decision 270. The clues and the mayor's letters
from where they stop to the unmasking: a letter or a clue about a week apart in play from the
day she reads the last one (`Mystery.check`, time-released, never locked), the neighbours
theorising in small talk (Agatha's corkboard, Hazel's "a ghost nobody's met"), Wes someone she
can talk to after the third glimpse (a row of his own; the creeper turns out to be the mayor's
nervous assistant), and the corkboard filling to one empty pin. Warm and silly, never scary.
_Done when a simulated two months of reading reaches the last clue._

**P3b. Rob Boo (M).** After P3a. The reveal: on the last clue a happening at the castle hall where
everyone gathers, a sheet off, and **Rob Boo**, a ghost mayor in a sash who has been shy, not
sinister; from then on a neighbour like the rest (a row in `src/data/robBoo.ts`, a town hall on a
lot by the square with his inside and two keepsakes, lines in every band and per window, loves,
likes, favours, rewards, a birthday, a place in every happening and a costume), the neighbour who
comes with this release (decision 211). Art from the doll's parts, a sash and a top hat as
touches. A save bump for the reveal seen. _Done when smoke reaches the reveal with `?day=` and
talks to him the next morning._ ⬆ (with P1, P2: **0.6**)

**P4. Jobs seen, and happenings that do something (M).** Rufus's flower buckets a shop
(`SHOPS` row, the fixture `opens`); Wrapunzel baking in view and the 🧁 a short scene; Ollie
walking to her mailbox with the post when a letter comes; Nessa lighting the lanterns at dusk
as a daily happening she can watch; birthdays a day with a line, a gift bonus and a small party
from `BIRTHDAYS`; a weekly happening each for Hazel (stargazing at the lookout), Boothoven (a
recital), Nessa, Ollie and Gourdon; and one participation verb per happening (pick next week's
book, howl, request a tune) with an outcome next week's line remembers. _Done when every
neighbour is seen doing their job once a day and every happening has a verb._

**P5. Cody, married (M).** Decision 269: a band of his own above best friends from the start (the
sheet never says "getting to know you"), the manor kept, evenings at her house more often than
chance (a stop `inside: home` most evenings), a daily "how was your day" with answers she picks,
comments on her outfit, her newest piece, her pets and her yard, and things they do together at
night (a snack run, stargazing from the yard, the dance). _Done when his evening line changes
with what she did today._ ⬆

### R. Rhythm (lane 4; changes the save)

**R5. Critters for all (S–M).** Decision 271 and 275: every critter findable some day in every
month (a season is when it's common; out of season a few days round the full moon, in
`isAbout`), the rarity test holding no critter waits more than 31 days and the Cabinet still
taking most of a year; holiday critters (one per big holiday, out first on the day and now and
then after); **jumping spiders**, three cute ones among the crawlies, gentle as the art style
asks; the Cabinet's hint saying when the next chance is. _Done when the rarity test holds both
bounds._ ⬆ (0.4)

**R1. The first day (M).** A gentle thread from Cody over her first day (shake the candy tree,
plant a seed, put something on the stall, answer a note, meet three neighbours, eat something from
the bag), each step a card with one line and a small reward, the last a keepsake, never blocking
anything; four starter seed kinds, not 22; the date chip and the ☰ tray shown once. For an old
save, nothing (she knows). A save bump for the step reached. _Done when smoke plays the thread
through from a new town._

**R2. Today (S–M).** The calendar's Today tab lists what's up now (notes on the board, who's
asking a favour by name, the tree's Candy, the stall's tin, ripe beds, the day's mound, the
wanted list, tonight's happening, who's visiting); a favour bubble beside `!` and `?`; a dot on
the date chip when Today has something new. _Done when Today matches the world in a test._

**R3. Weeks that differ (M).** A daytime happening on Monday, Tuesday and Thursday; a
rare-event table (`src/data/rareEvents.ts`: a meteor shower, a travelling stall for a week, a
stranger passing through, a snow day in winter, a lost critter to find) dealt from the day key
and announced; the Moon Pie Man and the pop-up announced when they arrive; a festival a season
(a spring blossom week, a summer fireworks week, a winter lights week) each with a shelf and a
weekly beat; arrivals on a schedule that aren't locks (a visitor who stays a week, a seasonal
resident at the shore in summer). Rows, read by `systems/calendar.ts`. _Done when a simulated
month has no two days alike._

**R4. Something to build (M).** Decision 274: town projects in `src/data/projects.ts` (a bandstand
on the square, the castle garden restored, a bridge over the creek, a greenhouse at home), each
funded over weeks in Candy and materials through a sheet at the noticeboard, its progress seen
in the world (posts, then frames, then the thing), a finished project usable (the bandstand plays
Boothoven's recital, the bridge a short cut); `world.projects` with the save; the economy test's
"dearest within a day" relaxed for projects only and Whisperwood's gathering capped per place per
window. _Done when a project's three stages draw and the economy test holds the cap._ ⬆ (with R1,
R2, R3: **0.8**)

**R6a. Fishing and catching with a floor (M).** Decision 272: a bite window by rarity (1.5 s
common down to about 0.7 s legendary), a short reel moment for rare and legendary fish (a tap in
time or the line goes slack and the bite comes round again), a size per catch from the shadow and
a hash, a personal best per fish kept in the Cabinet (a save bump); rares and moths that drift a
tile away as she nears and settle again, approaching slowly or from behind helping; legendaries
`wary` 2–3. Commons stay easy. _Done when a simulated session's catches differ in size and a
missed reel loses nothing._

**R6b. The fair games reworked (S–M).** Decision 272: ring toss and hook-a-ghost become games of
timing (a swing meter, ghosts that bob past a hook, a moving glint tapped in its window), a
bottom prize every go, prizes by how well she did, a new stall or two if a row is all it takes
(a duck pond, a strength bell), and a reason to go (a daily "first go free", a prize only won
there). _Done when a go can be won well or won badly and never lost._

**R6c. Pets that grow (M).** Per-pet affection from pats, walks and treats (a save bump), new pat
lines and a trick each at two levels, a job on walks (Fibi sniffs toward today's mound, Dolly
barks a hidden critter out, Elvira draws orbs, Wybie fetches a dropped thing), a pet that sits by
the fire or on the bed at home, a front and back sit frame. _Done when a pet's level changes
what it does._ ⬆

### S. Sound, platform and her fixes (lane 5)

**S4. Her fixes (S).** Decision 275: hold − and + to repeat and speed up on every − n + (selling,
putting away, ordering); the greenhouse's raised beds showing what's planted (a test on the
room's drawing); the "comes in a blue" rule replaced by each piece's own colours, bat wings in
red first, a pass over every recolourable piece's fabrics so the lists suit the piece; the
outfits test rewritten. _Done when smoke holds + to ten and the greenhouse screenshot shows a
sprout._ ⬆ (0.4)

**S1. Heard (M).** The silent switch (`navigator.audioSession.type = 'playback'` where it
exists and a silent looping `<audio>` fallback, a one-time hint), a reverb send from a generated
impulse, a lowpass on the triangle and square voices, a master compressor; each theme a B
section and a night arrangement, varied pass to pass; ambience by place, hour and weather in
`src/audio/ambience.ts` (crickets, rain, wind, water by the shore, footsteps by ground, a soft UI
tick); a lift in a voice on a question. _Done when the night at Lantern Shore sounds like a
place._ ⬆ (0.4)

**S3. Safe (S).** A splash image, a service worker that precaches the shell and prunes old
assets, a "last backed up N days ago" line and a nudge in the greeting when not installed, the
party photo saveable through the share sheet, an error handler that keeps a note for Settings, a
real-iPhone frame measurement written into `architecture.md`. _Done when the first offline launch
after install works in a test._

**S2. Cloud save (M).** Decision 275, the first thing that isn't a static site: an `api/save`
Vercel serverless function over a key-value store (Vercel KV or Blob; the user provisions it and
sets the env vars, the session writes the function, the client, and the steps in `README.md`), a
secret the phone makes once (`localStorage`, beside the save), the save PUT after each local
write (debounced, offline-tolerant, last-write-wins by timestamp), restore on a new phone by the
key as a short code or a QR in Settings, the backup code kept; nothing of hers readable without
the key. `CLAUDE.md`'s "no backend" becomes "a tiny one". _Done when a save round-trips through
the function in a test with the store faked, and the user's phone restores from the key._ ⬆

### V. Release

**V1. Review and 1.0 (S).** After every lane: the architecture review and "where it hurts" for
V1, perf on the phone against the Close baseline, the art notes, decisions for what changed, the
1.0 `NOTES` row folded to five, a lived-in fixture, `CLAUDE.md` brought up to date (rooms,
effects, projects, Rob Boo, the cloud save), the release PR. ⬆ (**1.0**)

## Suggested order and the patches

Two lanes at a time (decision 266). **Lanes 1 and 2 first** (what she'd see first: effects and
the camera), then **lane 5 when lane 2's L1 and L3 are in** (0.4 wants S4 and S1), then lanes 3
and 4 as seats free, V1 last. Within a lane the order above is the order (L1 → L3 → L6 → L2 →
L4 → L5 → L7; P1 → P2 → P3a → P3b → P4 → P5; R5 → R1 → R2 → R3 → R4 → R6a → R6b → R6c; S4 → S1 →
S3 → S2). Dependencies across lanes: **E1 before E2, E3, E5** (they push effects); **L1 before L3
and L5** (the baseline and the icons' size); **L2 before L4** (the ground is redrawn before it
turns); **P1 before P2 before P5**; **P3a before P3b**; **E5 and L4 together** for the leaves
(whichever is second adds them).

| Patch | What's in it (cut when all have merged)                                          |
| ----- | -------------------------------------------------------------------------------- |
| 0.4   | L1 closer, E4 taps and transitions, S4 her fixes, S1 heard, R5 critters for all  |
| 0.5   | E1 effects, E2 her verbs, E3 neighbours alive, L3 light, L6 the art pass, L2, L4 |
| 0.6   | P1 memory, P2 her voice, P3a and P3b Rob Boo, E5 animation                       |
| 0.7   | P4 jobs and happenings, P5 Cody, L5 the UI, L7 faces                             |
| 0.8   | R1 the first day, R2 today, R3 weeks that differ, R4 something to build          |
| 0.9   | R6a fishing and catching, R6b the fair games, R6c pets, S3 safe, S2 cloud save   |
| 1.0   | V1 review                                                                        |

The user may cut a patch earlier or later; a patch is any set of merged sessions that makes
sense on its own, and every session is whole on its own.

## What V1 is not

A seventh place, more sets, more neighbours beyond Rob Boo, the kids as characters (decision 269),
a pixel-frame HUD (decision 273), a bigger doll (decision 79), online anything beyond the save
itself (decision 275), punishment of any kind (decision 11).

## Running it in parallel

As 0.3 ran (`docs/handoff.md`, "How 0.3 was run"): a chain of Opus 5.5 sessions per lane, each
one plan session in its own worktree, started by a coordinating session, two lanes at a time.

```
Lane 1 (feel)    E1 ─► E2 ─► E3 ─► E4 ─► E5
Lane 2 (look)    L1 ─► L3 ─► L6 ─► L2 ─► L4 ─► L5 ─► L7
Lane 3 (people)  P1 ─► P2 ─► P3a ─► P3b ─► P4 ─► P5
Lane 4 (rhythm)  R5 ─► R1 ─► R2 ─► R3 ─► R4 ─► R6a ─► R6b ─► R6c
Lane 5 (sound, platform, fixes)  S4 ─► S1 ─► S3 ─► S2
                                                      └──► V1 (after all five)
```

### What each lane owns

| Lane | Owns                                                                                                                                                                                                                                                                                                                                                                                                                         | Decisions from | Save                 |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | -------------------- |
| 1    | a new `render/effects.ts`, `render/scene.ts`, `render/villagers.ts`, `render/critters.ts`, `sprites/doll.ts` (poses), `systems/poses.ts`, `world/Neighbour.ts`, `sprites/props.ts` (`frames`), the views' effect passes                                                                                                                                                                                                      | 280            | never                |
| 2    | `render/pixelScale.ts`, `render/lighting.ts`, `render/weather.ts`, `render/ground.ts`, `render/room.ts`, `sprites/terrain.ts`, `sprites/nature.ts`, `sprites/critters.ts` (fixes), `hud/styles.ts`, `ui/theme.ts`, a new `sprites/ui.ts`, `render/title.ts`, `settings.ts`                                                                                                                                                   | 290            | never                |
| 3    | `data/villagers.ts`, `data/smallTalk.ts`, `systems/dialogue.ts`, `systems/friendship.ts`, `world/Friends.ts`, `hud/TalkSheet.ts`, `data/mystery.ts`, `data/story.ts`, `world/services/Mystery.ts`, new `data/heartMoments.ts`, `data/robBoo.ts`, `sprites/robBoo.ts`, `data/happenings.ts`, `data/birthdays.ts`                                                                                                              | 300            | P1, P2, P3a, P3b     |
| 4    | `data/critters.ts`, `data/crawlies.ts`, `systems/critters.ts`, `systems/fishing.ts`, `world/services/Fishing.ts`, `world/services/Collecting.ts`, `data/activities.ts`, `systems/activities.ts`, `hud/FairSheet.ts`, `data/pets.ts`, `world/Pet.ts`, `world/services/PetCare.ts`, `data/calendar.ts`, new `data/rareEvents.ts`, `data/projects.ts`, `data/firstDay.ts`, `hud/CalendarSheet.ts`, `tests/data/economy.test.ts` | 310            | R1, R3, R4, R6a, R6c |
| 5    | `src/audio/**`, `public/sw.js`, `hud/SettingsSheet.ts`, `hud/PhotoCard.ts`, `persistence/**`, a new `api/`, `data/outfits.ts` (fabrics), `hud/dom.ts` (the held button), `render/RoomView.ts` (the greenhouse beds)                                                                                                                                                                                                          | 320            | S2                   |

Shared hot spots, add-only: `src/types/ids.ts`, `src/wiring/moments.ts` (lane 1 adds effects,
lane 3 adds moments), `src/wiring/apis.ts`, `src/main.ts`, `src/hud/Hud.ts`, `src/world/build.ts`
and `src/world/areas/*` (a line in the area), `scripts/smoke.mjs` (a section per session),
`src/data/patchNotes.ts` (a line in the patch's row), and the three docs. `sprites/critters.ts`
is lane 2's for fixes and lane 4's for new rows: lane 4 adds rows in a const of its own and never
reshapes.

### Rules every lane session follows

The 0.3 rules, unchanged (`docs/handoff.md`, "How 0.3 was run"), with the V1 lines:

1. Branch from the latest `v1-dev`; the PR targets `v1-dev`, a draft at the first push, merged
   by the session with a merge commit once green. Nothing goes to `main`.
2. Before starting: `CLAUDE.md`, the handoff's "In progress" (the lane's heading and the rules),
   the session's paragraph here, `docs/v1_analysis.md`'s finding it answers, and decisions
   266–275. Personal touches parked (decision 177).
3. The whole suite, smoke included, before every push; both orientations looked at; a frame
   pass measured.
4. Push and update the lane's heading at least every half hour.
5. Decisions in the lane's block, appended. A line in the current patch's `NOTES` row.
6. A save bump only in the last commit after merging `v1-dev`, said in the heading; lanes 1 and
   2 never touch the save.
7. Rows in a const of their own, art in a file of its own, a new rule in a system of its own;
   shared files get lines added.
8. Merge `v1-dev` in before marking ready; rerun; merge.
9. When merged: this status line, the lane's heading ("X landed (PR #n). Next: Y."), stop.

### The coordinating session

As 0.3's (`docs/handoff.md`, "How 0.3 was run", and "The coordinating session" there): one
session, Opus 5.5 sub-agents in worktrees one plan session each, two at a time, checking in every
half hour, save-bumping PRs merged one at a time, V1 last, never merging to `main`. It tells the
user when a patch's sessions have all merged so they can cut it.

## Timeline

By 0.3's pace (a medium session 2–4 hours wall clock, a short one 1–2) with two seats: about
30 sessions, roughly 50–60 hours of wall clock, a week or so of running; the first patch (0.4)
within the first day or two.
