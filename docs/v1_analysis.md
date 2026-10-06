# McFrancisVille: why it feels flat, and what V1 is for

_Written 2026-10-06 after 0.3 shipped (PR #156), from five audits of `main` (motion and
feedback, the neighbours, the loop and economy, graphics and UI, activity depth and the
platform) and the game's own screenshots in `.smoke/`. It is the analysis before the V1 plan;
the interview questions are at the end, and the plan (`docs/v1_plan.md`) follows their answers._

## The diagnosis in one paragraph

Three plans have made the game **wide**: twelve neighbours, seven critter families, eight
furniture sets, six places, a calendar full of days. They haven't made it **deep**. Nearly every
system has the same shape: walk up to a thing, it happens at once, a sound plays and a text box
says so. Nothing in the world moves for her, nothing remembers her, nothing points her anywhere,
and the presentation (a camera too far out, one flat green, a flat night, a web-app HUD, thin
dry music) sells even the good art short. 0.3 added a farm, a neighbour, fossils, rooms and a
yard and she still says "flat", which is the proof: **V1 is not a features release.** It is a
_feel_ release (things react), a _people_ release (the neighbours know her, the story goes
somewhere, Cody is a partner), a _rhythm_ release (a first day, a today, weeks that differ,
something to save for) and a _presentation_ release (closer, richer ground, real light,
seasons, a HUD that belongs to the world, sound that fills a room).

## What is good, and must not be lost

- **The sprite craft.** Buildings, the jack-o'-lantern house, the fairground, the castle and
  the furniture sets hold up at 4× next to Stardew. The palette is one system (173 colours,
  every sprite a five-tone `ramp`), the light comes from one direction, outlines are coloured and
  consistent. The problem is never the drawing of a thing; it is everything around it.
- **The architecture.** Rules in `world/` and `systems/`, content as rows, time from the clock,
  saves migrated with tests, 1,800 tests, a smoke run of 437 checks. It can take a feel pass
  without breaking.
- **The writing's texture.** The `friend` band's gossip, Cody's letters and greetings, the
  mayor's notes, the item descriptions. Warm and funny when it lands.
- **The collecting meta.** Hours, places, weather, seasons, the moon, lures from dishes, the
  fortune's "lucky critter": a real reason to come back at 10pm in the fog. This is what she
  loves, and it is the deepest system in the game.
- **Decorating** is a real sandbox now (rooms, tables, the yard, 120 pieces). It only lacks an
  audience.
- **Cozy** (decision 11): nothing punishes, expires or is lost. V1 keeps that. Skill with a floor
  (a miss tries again) and time-released beats (not locks) both fit it.

## Where it is flat: five findings, with evidence

### 1. Nothing reacts

Audit of `src/render/`, `src/wiring/moments.ts`, `src/world/Neighbour.ts`, `src/systems/poses.ts`.

- **Her verbs have no body.** She has 3 frames per view and five front-only idle poses. Harvest,
  gather, water, till, plant, dig, shake, buy, cook, craft, eat, pat, give, enter a door: all
  instant, no animation. She doesn't even turn to face a bed or a tree (`World.arriveOn` never
  sets facing). Only the net swing, the cast and the dance move.
- **Neighbours are statues.** Stops change every 2–5 _real_ hours; standing is frame 0; there is
  no idle, no gesture, no wave, no carrying, no sitting; they never visibly talk to each other
  (pairs stand facing with no bubble). The only bubbles are `!` and `?`. Pets are the most alive
  things in the game (zoomies, naps, bubbles).
- **Rewards vanish.** A gathered thing swaps sprite; a catch disappears; nothing travels to her,
  nothing pops on the HUD. **About 30 moment kinds are "cue + toast" and nothing in the world**
  (`bought`, `made`, `cooked`, `found`, `delivered`, `won`, `flew`…). `playMoments` can reach only
  the HUD and the sound: there is **no particle or emote layer at all**, no screen shake (one
  pixel on the candy tree), no hold-it-up pose.
- **Taps are dead.** A tap draws a destination sparkle; the thing tapped isn't highlighted; an
  unreachable tap does nothing at all; a slow thumb press (>500 ms) is dropped; `CUES.tap` never
  plays on a tap.
- **Props promise motion they don't have.** `PropArt` has no frames: the fountain's jet, the big
  wheel, flags, doors, lamps, windows are one baked image. Furniture rows say "always bubbling",
  "a crackling fire", "swings a bit slow" and are static.
- **Transitions are a cut and a 320 ms fade.** The broom "flies" as a sound. The title vanishes
  on tap. Sheets appear with no slide. The camera only follows.

### 2. The neighbours don't know her

Audit of `src/data/villagers.ts`, `systems/dialogue.ts`, `systems/friendship.ts`, `hud/TalkSheet.ts`,
`data/mystery.ts`, `data/happenings.ts`.

- **A talk is one line and three buttons.** No choices, no questions she can answer, no memory.
  `TalkScene` carries the weather, what she holds, today's catch (not saved) and her pet's
  name; it does not know her outfit, her house, what she built, bought, cooked, donated, the last
  gift she gave them, how long since they talked, or that they just reached a new band. The
  day's first line is nearly fixed (the window topic always wins).
- **Hearts are a timer with flat steps.** 10 a talk, 50 a loved gift; 10 hearts in 17–29 days
  of daily play; at each band a letter and a new line pool, nothing else; **after 10 hearts,
  nothing**. The `close` lines are interchangeable ("I came for X, I stayed for you" three times).
  Birthdays are a cake icon. No visits by choice, no invitations, no missing her.
- **Jobs are words.** Rufus never sells a flower; Wrapunzel never bakes in view; Ollie never
  delivers; Nessa says "do you want to watch?" and there is nothing to watch. Lines promise
  things no system gives (a bookmark, a little box, "plant something with me").
- **The story stops in week one.** Two mayor letters, a handful of clues, Wes glimpsed, October's
  four chapters, then nothing; the reveal was never built, though the user already chose it
  ("someone new… over a few months… an unmasking she's been working towards",
  `personal_touches.md`). No lore: why monsters live here, the castle, the manor.
- **Cody is a greeter.** The best writing in the game is his, but mechanically he is one more
  neighbour at 0 hearts who lives in a manor and visits her house one day in twelve.
- **Happenings are watched.** Five or six a week, each a welcome line and a one-time gift;
  participation exists only at the egg hunt, the contest, the photo and the duet. Nothing
  persists from one to the next.

### 3. No direction, no rhythm

Audit of `src/main.ts`, `hud/`, `data/calendar.ts`, `data/happenings.ts`, `data/passive.ts`,
`tests/data/economy.test.ts`, decisions 128, 129, 211.

- **No first day.** Title, dedication, creator, Cody's card, three letter toasts, then nothing:
  no hint that walking up to things does things, that the date chip opens the calendar, that the
  bag has Eat, that the candy tree holds 60 Candy. The quick bar opens with 22 seeds.
- **No "today".** Goals (42 critters, 12 fossils, 23 shelves, 12 × 10 hearts, 51 recipes,
  figurines, sets) live only inside sheets; the HUD shows Candy and the date. Favours are
  invisible until she talks. Nothing says "three notes are up, Barty's asking for a rose, the
  tree is full, two beds are ripe".
- **Every weekday is the same.** Tuesday is Thursday. The weekly happenings are evenings
  (a morning player sees the seed swap only); 85% of the year's days have no mark; nothing
  rare ever happens (no meteor shower, no stranger, snow two days a year); news lines repeat
  within a week.
- **Nothing to save for.** The economy test _forbids_ anything dearer than a day's play
  (`economy.test.ts:147`); Whisperwood alone pays about 2,200 Candy a window; the seed cart,
  Gourdon's book and the catalogue mean every thing is available any day. Buying is
  frictionless, which is why it stopped being exciting.
- **Decision 211 removed the pacing.** Opening everything was right for her; but the monthly
  arrivals, the places found, the letters after N days were also the only things that made one
  week different from the last, and nothing replaced them.
- **Almost no activity is fun in itself.** Fishing is the one timing input and can't be failed
  (a 1.5 s window, a missed bite comes round again); the fair games tell you which target
  lands; netting a statue; everything else is tap-and-it-happens. That is fine for gathering and
  digging; it is not fine for the two things she plays for.

### 4. The presentation sells it short

Audit of `src/render/pixelScale.ts`, `lighting.ts`, `sprites/terrain.ts`, `hud/styles.ts`, the
smoke screenshots and `npm run sprite -- 'place:*'`.

- **The camera is too far out.** `TILES_ACROSS = 16` gives scale 2 on an iPhone 15: 18 tiles
  across, she is 64×96 device pixels (about 3.5 × 5.3 mm), her face 1.8 mm. Faces don't read, a
  one-tile prop is a 21 pt tap target (Apple's minimum is 44), and the town reads as a map, not
  a diorama. **Everything below is amplified by this.** Scale 3 would be 12 tiles across.
- **One flat green.** 42% of the town's pixels are a single moss colour; a grass tile is flat
  fill plus a few tufts; no darker grass under crowns, no worn ground, no meadow; 9 tile kinds,
  4 flat clutter kinds; every place shares one lavender cobble with a hard kerb that draws the
  eye more than the buildings; the pond is an octagon, the creek a right-angled L; Whisperwood is
  a wall of three trees.
- **Night is one multiply.** A flat colour over the frame, lamps as five hard rings; no bloom, no
  vignette, no grade by hour (nothing at all at midday), no cloud shadows, no wet ground in
  rain, the sky never visible outdoors.
- **Rooms float in a void.** At the same scale a room fills 75% of the width inside black; the
  bigger home is an empty plank floor with tiny furniture; pets indoors are 10 pixels.
- **No seasons.** "Always October" by comment; the pond freezes and snow falls two days; the
  ground never changes. Every sprite is palette-keyed, so seasonal swaps are the cheapest big
  change in the game.
- **One body, one face.** The doll has five moods, used only by idle poses; a talk never changes
  a face; portraits are the world sprite's top 32 pixels at 64; below the neck every neighbour is
  the same silhouette.
- **The HUD is a generic iOS web app.** SF Rounded, 14 px rounded rectangles, flat fills,
  **120 distinct emoji** (🎒 ☰ 👥 ⚙ 🛋 👗 🗺 📖 and every toast and map mark), sheets that pop
  in, no animation on hearts or Candy. Pixel tools sit beside a glossy Apple backpack. The title
  is a gradient and a crop of the town.

### 5. Sound and platform

Audit of `src/audio/`, `public/sw.js`, `hud/SettingsSheet.ts`.

- **On a phone with the silent switch on, the game is mute.** No `audioSession` playback hint,
  no `<audio>` fallback. If she plays on silent she has never heard it.
- **The music is a dry music box.** Raw oscillators, no reverb, filter, panning or compressor;
  14 themes, each one 18–53 s melody looped identically forever; the evening arrangement covers
  6pm–5am. **No ambience at all**: no crickets, rain, wind, water, footsteps, UI tick.
- **Platform gaps, each small:** no splash image, a service worker with no precache (first
  offline launch can fail), a 1.25 MB single chunk, no backup nudge (a Safari-tab player who
  never copied a code loses the town after a week away), the party photo can't be saved, no
  error reporting, 60 fps on a real iPhone never measured.

## What V1 should be

Ranked by how much of "flat" each removes per session of work. Sizes are plan sessions (S/M).

**A. Feel: the world reacts (the biggest single lever).**

1. A world-space **effects layer** that `moments.ts` can push to: item icons arcing to her and a
   "+1" floating up, the bag button bumping; particles (leaves on a shake, a splash on the cast,
   hearts over a neighbour on a loved gift, sparkles on a first catch, dust on landing); emote
   bubbles over her and the neighbours (♥ ♪ … ! ?). One foundation, then every moment uses it. (M)
2. **Her verbs get a body**: she faces what she arrives at; a crouch/reach for gather and dig, a
   can-tilt for watering, a hold-it-up for catches, finds and first harvests; a blink and a
   breath before the phone idle. (M)
3. **Neighbours come alive**: a wander round the stop every half minute, a breathe/blink idle, a
   wave or `!` when she comes near, visible chatter bubbles when two stand together, sitting on
   benches, a working pose at their job (Rufus with a bucket, Gourdon sawing, Nessa lighting a
   lantern at dusk). (M, with art)
4. **Taps and transitions**: a ring at the tap point, an outline on the thing tapped, a soft tap
   cue, a shrug on an unreachable tap, held presses count; an iris wipe on her for doors, the
   broom seen flying across, the title fading, sheets sliding up. (S)
5. **Props and furniture animate** (`frames` on `PropArt` and furniture art): the fountain, the
   wheel, flags, lamp flicker, the hearth, the cauldron, the clock, the tank; crows and leaves
   crossing the sky. (M)

**B. People: the neighbours know her, the story goes somewhere.**

6. **Talks with memory**: `TalkScene` carries her outfit, her newest piece, today's harvest and
   donation, the last gift and its day, days since the last talk, a band just reached; three or
   four lines per topic per neighbour instead of one; the window line no longer leads. (M)
7. **Her voice**: reply chips on some lines; neighbours ask questions and keep the answers
   (Hazel's star, Rufus's flower); heart moments at 2, 4, 5, 8 and 10 hearts (a short scene that
   tells their story: Maude's "after", Nessa's name, Wrapunzel's princess years); best-friend
   content after 10 (visits by choice, invitations, missing her). (M)
8. **The mystery finishes**: a chapter a month to the reveal the user already chose, the
   neighbours theorising in small talk, Wes someone she can finally talk to. (M)
9. **Cody as a partner**: home in the evening, married from the start (no hearts to earn), a
   daily "how was your day" she answers, comments on her outfit, her rooms, her pets, things they
   do together at night. (M; personal, needs the interview)
10. **Jobs seen**: Rufus's flower buckets as a shop, Wrapunzel baking in view, Ollie walking to
    her mailbox with the post, Nessa's lantern lighting as a dusk happening; birthdays as a day
    with a line, a gift bonus and a party; one weekly happening each for Hazel, Boothoven,
    Nessa, Ollie and Gourdon, each with one thing to _do_. (M)

**C. Rhythm: a first day, a today, weeks that differ, something to save for.**

11. **The first day**: a gentle thread from Cody (shake the tree, plant a seed, put something on
    the stall, meet three neighbours, eat something) with a keepsake at the end; four starter
    seeds, not 22. (M)
12. **Today**: the calendar's Today tab (or a pip on the HUD) lists what's up now (notes, who's
    asking a favour, the tree, the stall, ripe beds, the mound, the wanted list, tonight's
    happening, who's in town), and a favour bubble beside `!` and `?`. (S–M)
13. **Weeks that differ**: a daytime happening on Monday, Tuesday and Thursday; a rare-event
    table (a meteor shower, a travelling stall, a stranger, snow days, a lost critter) with a
    keepsake; the Moon Pie Man and the pop-up announced; a festival a season, not only October;
    time-released beats that aren't locks (a visitor who comes for a week, a seasonal resident,
    monthly letters). (M)
14. **Something to save for**: one or two town projects funded over weeks in Candy and materials
    with visible progress in the world (a bandstand, the castle garden restored, a bridge); house
    exterior tiers; the economy test's "nothing dearer than a day" relaxed for that category; the
    Whisperwood faucet capped per place. (M)
15. **A little skill, with a floor**: fishing's bite window by rarity and a size per catch with
    a personal best; rares that drift when she comes close; fair games scored on timing with a
    bottom prize for everyone; pets with affection that unlocks a trick and a job on walks
    (Fibi sniffs toward the mound, Dolly flushes a critter). (M)

**D. Presentation: closer, richer, lit, seasonal, a HUD of its own.**

16. **Closer**: `TILES_ACROSS` to about 12 (scale 3 on an iPhone), rooms fitting the width in a
    drawn surround instead of a void. The cheapest, largest change to the first impression. (S)
17. **Ground**: large-scale grass tones, darker under crowns, worn by doors; a dirt track for the
    woods and farm, cobble for the town only, soft edges instead of a kerb; meadow and long
    grass; ten more decals; organic water shapes with banks; three more tree forms. (M–L)
18. **Light**: grading by hour (cool shadows, warm highlights at dusk, contrast at golden
    hour), dithered lamp falloff, a bloom pass for bulbs and windows, a night vignette, cloud
    shadows by day, wet ground in rain. (M)
19. **Seasons**: palette swaps of grass, leaves and hedge by month; snow that settles on ground
    and roofs in winter; blossom in spring; leaf drifts through autumn. (M)
20. **Faces and portraits**: moods chosen by the line (happy, surprised, sad, laugh), drawn
    64×64 bust portraits with expressions for the talk sheet, two or three body builds. (L)
21. **The HUD belongs to the world**: nine-slice pixel frames (plum wood, parchment, pumpkin
    corners), a pixel display font for headings and numbers, drawn 16-pixel icons for the chrome
    first and then the 120 emoji, sheets that slide, hearts that fill with a pop, a pixel title
    logo and a night sky behind it, a drawn app icon. (M–L)

**E. Sound and platform.**

22. **Heard**: the silent-switch fix (`audioSession` + an `<audio>` fallback), reverb, a lowpass,
    a compressor; each theme with a B section and a night arrangement, varied pass to pass;
    ambience by place, hour and weather (crickets, rain, wind, water, footsteps, a UI tick);
    neighbour voices with a lift on a question. (M)
23. **Safe**: a splash image, a precaching service worker, a backup nudge with "last backed up",
    the photo saveable, an error handler, a real-iPhone frame measurement. (S)

## What V1 is not

More places, more neighbours, more sets, more critters. The content is enough; a seventh place
would be as flat as the sixth until the above is done. A server, online anything, the kids as
characters (unless the interview says so), a bigger doll (decision 79 holds).

## Interview

Answers change the plan's shape, so these come first (plain chat, numbered; the answers become
decisions):

1. **How she plays.** When in the day, how long a sitting, how many days a week, portrait or on
   its side, and **sound on or on silent?** (If silent, sound drops down the list; if she plays
   mornings, evening happenings are invisible to her and the week needs daytime beats.)
2. **"Flat" in her words.** What does she do first when she opens it, what made her smile last
   week, what does she never touch (fishing? talking? the fairground? the calendar?)? Has she
   said anything about it looking small, dark, or the menus?
3. **Closer.** A one-session experiment: the camera at scale 3 (12 tiles across) and rooms fit to
   the width, released to her phone first, before anything else. Yes?
4. **Cody.** Should he live with her (home in the evenings, married from the start, no hearts to
   earn), and should the kids exist in the game at all (named, in small talk only, or as
   characters who come home at family time)? This is yours to call.
5. **The mystery.** You chose "someone new, over months, an unmasking". Ready to decide who the
   mayor is and what the reveal does (a party? a new place? a letter?), or should the plan
   propose it?
6. **Time-released beats.** Nothing gets locked again, but may things _arrive_ on a schedule
   (a visitor for a week, a seasonal resident, a chapter a month, a project finishing)? Yes/no.
7. **Skill with a floor.** A bite window that's shorter for a rare fish, a critter that drifts
   away as she nears, a fair game won by timing, always with a bottom prize and never a loss:
   yes, or keep everything a sure thing?
8. **The look.** A HUD drawn in the game's own pixels (wood, parchment, a pixel font, drawn
   icons) is a big visual change from the rounded iOS look she knows. Want it, or keep the
   current style and only polish it? And seasons: should the town visibly turn (snow in winter,
   blossom in spring), or stay always-October with Halloween as its heart?
9. **Something to save for.** A town project that takes weeks (a bandstand, the castle garden,
   a bridge to somewhere) with her Candy going into it visibly: yes? Any real-life project of
   theirs it could nod to?
10. **Release shape.** V1 as one big release, or 0.4, 0.5… to her phone as each lane finishes
    (the closer camera first)? Two lanes at a time again? Any date it should be done by?
