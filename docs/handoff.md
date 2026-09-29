# Handoff: picking up version 0 cold

Written 2026-09-26, updated at the end of phase 12 for a fresh session. Version 0 is built; keep
this current until it's in her hands, then trim it to what version 1 needs.

## In progress

**Vercel previews are off** for `v0.1-dev` and every `claude/**` branch (2026-09-28, the user's
call: `git.deploymentEnabled` in `vercel.json`), so no push counts against the deployment limit.
Only `main` deploys. Turn them back on (remove those two lines) only if the user asks.

**The integration branch is `v0.1-dev`** (2026-09-28, the user's call): merging to `main` is on
hold for Vercel's deployment limit, so phase PRs target `v0.1-dev` and merge there when green, and
`main` waits for one PR from `v0.1-dev` once the user says the limit has reset (`CLAUDE.md`,
"Workflow").

**CI runs only once a PR is ready** (2026-09-29, decision 117): Actions minutes are metered on
this private repo, so a draft PR runs nothing, and gates plus smoke are one job on Node 22. Run the
whole suite, smoke included, in the container before each push; mark the PR ready only once it
passes there.

**Phase P (the farming revamp) is merged** into `v0.1-dev` (PR #50, 2026-09-29, CI green;
decisions 118–120, save v22).

**Phase Q (fishing) is merged** into `v0.1-dev` (PR #51, 2026-09-29, CI green; decision 121,
no save bump).

**Phase R (cooking) is merged** into `v0.1-dev` (PR #52, 2026-09-29, CI green; decision 122,
save v23).

**Phase S (neighbours with lives) is merged** into `v0.1-dev` (PR #53, 2026-09-29, CI green;
decisions 123–124, save v24).

**Phase T (newcomers) is merged** into `v0.1-dev` (PR #54, 2026-09-29, CI green; decision 125,
save v25).

Next: **phase U** (holidays in town), on a branch from `v0.1-dev`, its PR a draft until the whole
suite passes in the container.

Questions 1–30 below are still open; 28–30 are phase U's, and the user will answer them all near
the end of 0.1.

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

**The user will answer these together near the end of 0.1**, once it's all built (2026-09-29).
So don't hold a phase for them: keep appending each phase's questions here, numbered on, and put
them to the user in chat briefly. Each has a "Lands in" line saying where its answer goes, so the
session that receives the answers can land them in one pass (with or just before phase V's art
pass), recording each in `docs/personal_touches.md` and clearing it from here.

Asked on 2026-09-28, after phase J, for phases K and L (map detail, life and weather), and asked
again after phase L: they can still land (a weather ritual as a rainy-day touch, clutter as props,
a piece of furniture in a shop).

1. Is there a kind of weather she loves, or a rainy-day or foggy-morning ritual, that the town's
   rain and fog days could nod to (a smell, a drink, a blanket, a sound)?
   _Lands in:_ the weather's lines (`src/data/weather.ts`, its toast in `src/hud/messages.ts`), or a
   rainy-day snack or piece.
2. Any little things from a street or yard you know (a porch decoration, a garden gnome, a
   particular mailbox, wind chimes, a painted rock) to scatter round town as clutter?
   _Lands in:_ standing clutter props (`src/sprites/clutter.ts`, `townProps.ts`), placed in
   `src/data/maps.ts`.
3. Now that her home is drawn bigger, is there a piece of furniture from your real home (a chair,
   a rug, a shelf of something she collects) you'd like her to find in a shop or be given?
   _Lands in:_ a row in `src/data/furniture.ts`, art in `src/sprites/pieces.ts`, a shelf in
   `src/data/shop.ts` or a neighbour's letter.

Asked on 2026-09-28, after phase L, for phase M (the collection UI and the quick bar):

4. When she sorts her own things (clothes, records, squishies), how does she do it: by colour, by
   newest, by favourites? And is there a little mark she'd use for a favourite (a heart, a star,
   a ghost)?
   _Lands in:_ the orders in `src/hud/collection.ts`; a favourite mark would be new state.
5. Is there something she collects in real life, and a way she keeps it (a shelf of squishies, a
   crate of records, a jar of something), that her bag or storage chest could look like?
   _Lands in:_ the bag and chest sheets (`src/hud/BagSheet.ts`, `HomeSheets.ts`), or a piece.
6. Is there anything she always has on her (her phone, a lip balm, a particular keychain) that
   could sit on the quick bar of what she's holding?
   _Lands in:_ a row in `src/data/tools.ts`, art in `src/sprites/tools.ts`.

Asked on 2026-09-28, after phase M, for phase N (the morning, afternoon and evening windows, and
the calendar of holidays and town events):

7. What does a good day of hers look like, morning, afternoon and evening (coffee first thing, a
   walk after work, a show before bed)? The town's three windows could each nod to one.
   _Lands in:_ lines by window (`src/data/greetings.ts`, `src/data/notices.ts`), neighbours'
   stops in `src/data/villagers.ts`.
8. Beyond the special days already in the game, which dates matter to you two (a yearly trip, a
   team's opening day, a concert you went to, the day you moved in)?
   _Lands in:_ rows in `src/data/calendar.ts` (and `src/data/specialDays.ts` for letters).
9. Is there a town event she'd love on the calendar (a night market, a pumpkin-carving contest, a
   watch party for her team, a craft fair)?
   _Lands in:_ an event row in `src/data/calendar.ts`, its rule in `src/systems/calendar.ts`.

Asked on 2026-09-28, after phase N, for phase O (greetings, login gifts, the candy tree and the
honesty stall):

10. Besides Cody's welcome, how would she love to be greeted when she opens the game (a pet
    running up, a silly line, a song)? Any in-jokes the greetings could use?
    _Lands in:_ `src/data/greetings.ts` (the greeting's lines and weights).
11. The plan already has the red Tesla ("Red one!") and the Pokémon reminder. Are there other
    little rituals or road games of yours the greeting could now and then nod to?
    _Lands in:_ `src/data/greetings.ts`, with art in `src/sprites/greetings.ts` if it has a picture.
12. The candy tree by her house: what candy should it grow (a favourite of hers)? And what would
    the honesty stall's sign say, or what would she want to sell on it?
    _Lands in:_ the tree's sweets (`src/sprites/nature.ts`, `src/data/passive.ts`), the stall's
    sign (`src/sprites/clutter.ts`) and what it takes (`stallTakes` in `src/systems/passive.ts`).

Asked on 2026-09-28, after phase O, for phase P (the farming revamp: a pop-up on each bed saying
what it will do, clear dry, watered and ready looks, planting a row, sprinklers):

13. Is there something she grows or would love to grow in real life (a herb, a flower, a
    vegetable) that could be a new crop in her garden?
    _Lands in:_ a row in `src/data/crops.ts`, its seed and harvest in `src/data/items.ts`, art in
    `src/sprites/garden.ts`, a seed on Cobweb Corner's shelf.
14. When she gardens, is there a tool, a hat, gloves or a watering can she'd recognise?
    _Lands in:_ the can (`src/data/tools.ts`, `src/sprites/tools.ts`), or a hat or gloves in
    `src/data/outfits.ts`.
15. The farm is Hosta La Vista Farm: any other garden puns or signs she'd laugh at, for the
    sprinklers, the beds or the stall?
    _Lands in:_ names and lines (the sprinkler in `src/data/items.ts`, the bed card's words in
    `src/hud/BedCard.ts`, the farm sign's in `arrivalToast`, `src/hud/messages.ts`).

Asked on 2026-09-29, after phase P, for phase Q (fishing: a rod, fish by window, place and
weather, a forgiving catch, fish in the cabinet and museum, and a rare blue fish):

16. Does she fish, or is there a lake, pier or beach you two love that Lantern Shore and its pier
    could nod to (a name, a snack stand, a view)?
    _Lands in:_ Lantern Shore's map and props (`src/data/maps.ts`, `src/sprites/wilds.ts`).
17. The rare fish: is there a water creature she adores (an axolotl, a koi, a jellyfish, a
    particular goldfish) that could be the one she's proudest to catch?
    _Lands in:_ phase Q's fish rows (the rare one).
18. Her fishing rod: what would be on it (a colour, a charm, a sticker, a name she'd give it)?
    _Lands in:_ phase Q's rod (`src/data/tools.ts`, `src/sprites/tools.ts`).

Asked on 2026-09-29, after phase Q, for phase R (cooking: a stove at home and in the bakery,
recipes from crops, fish and finds, dishes the neighbours love, small cozy effects, late-night
snackies):

19. Is there a dish she loves, or one you two cook together (a comfort food, a family recipe, a
    takeout order you always get), that her stove could make?
    _Lands in:_ phase R's recipe rows and their art.
20. Late-night snackies count: what is her go-to late-night snack?
    _Lands in:_ a dish in phase R, and the night's snack (`src/data/`'s snack rows).
21. Is there a kitchen thing she'd recognise (a mug, a pan, an apron, a cookbook, a particular
    stove) for her kitchen corner at home?
    _Lands in:_ the stove's art or a piece in `src/data/furniture.ts`.

Asked on 2026-09-29, after phase R, for phase S (neighbours with lives: a schedule for each
window, weekdays and weekends, visiting each other and her; personal events like a book club or a
midnight bake; a small chance anyone farts):

22. What does a lazy weekend look like for you two (a brunch spot, a long walk, a show you
    binge, a drive)? The neighbours' weekends could borrow it.
    _Lands in:_ weekend stops in `src/data/villagers.ts`, and a personal event in phase S2.
23. Is there a standing ritual with friends or family (a weekly game night, a Sunday call, a
    group chat running joke) that one of the neighbours could have as their own event?
    _Lands in:_ a personal event in phase S2 (its row and lines).
24. The plan has a small chance anyone farts. Is there a running joke about it between you (who
    blames the dog, a phrase you say)? And is anything off limits?
    _Lands in:_ the farts' lines in phase S2 (Cody's "You're getting on mah nerves!" is already his).

Asked on 2026-09-29, after phase S, for phase T (newcomers: one a month, humans and monsters,
some arriving only after something happens):

25. Is there a kind of neighbour she'd love to see move in (a vampire barista, a mummy florist, a
    witch's cat who runs a bookshop)? Any job the town is missing?
    _Lands in:_ a newcomer's row in phase T (who they are, their job, their house).
26. Are there friends or family who might one day move in as newcomers, or is that for later?
    _Lands in:_ a newcomer in phase T, or noted for after 0.1.
27. What would make a newcomer's arrival feel special to her: a moving van, a welcome basket to
    make, a housewarming, a letter from them first?
    _Lands in:_ how a newcomer arrives in phase T (a letter, the move, the welcome).

Asked on 2026-09-29, after phase T, for phase U (holidays in town: decorations up and down with
the calendar, events and dialogue for the big holidays, Skelly dressed for Christmas, and the
castle's hall for their anniversary behind a second hidden key):

28. Which holiday does she love most, and how do you two celebrate it (a tradition, a food, a
    film you always watch, a place you go)?
    _Lands in:_ phase U's event for that holiday (`src/data/calendar.ts`, its dialogue and
    decorations).
29. Is there a decoration from your own home she'd know at once (a wreath, lights in a colour, a
    special ornament, a Halloween inflatable, a porch display)?
    _Lands in:_ phase U's decorations on her house and in town.
30. The castle's hall for your anniversary: what should she find inside (your first-dance song, a
    photo, a cake like your wedding cake, the flowers you had), and is there somewhere meaningful
    the second key should be hidden?
    _Lands in:_ phase U's castle interior and its key (`src/data/buried.ts`, `src/data/interiors.ts`).

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

What looks off, noted as the drawing phases go, for the art pass the user reviews at the end
(phase V; "Before phase G" in `docs/personal_touches.md`).

- Phase T: Gourdon's pumpkin house rises over the foot of Crumbs & Curios behind it; its carved
  teeth barely read. Nessa's crossed oars look more like scissors, and her oar by the door like a
  broom. The pumpkin stool's face is hard to see. The lot signs' "SOON" and "SOLD" are tiny.
  Nessa's boathouse is up the bank from the water rather than on it.

- Phase N: the noticeboard's roof is a flat dark band; the notes on it are the same whatever is
  pinned; the calendar's full moon (🌕) and other marks are emoji, which look different on her
  iPhone than in the container's screenshots.
- Phase M: what she holds is drawn beside her hand at 1× over a hand that isn't holding it (the
  doll has no gripping hand), and a seed packet is big in it; the museum's cases still show the
  16-pixel critters (the Cabinet and bag now show the 24-pixel ones); the closet's close-ups of a
  hat or glasses are mostly her face.
- Phase L: the well is small for the middle of the square; the grass tufts are subtle enough to
  miss; the fog's clumps are big and even; the signposts' boards have no words (the lettering is
  capitals only and a sign would need a word per place); the scarecrow and bench are the only
  clutter on the farm and in the park, and the square itself has none.
- Phase H's rooms: the smaller homes (9 tiles across) fill only about half a phone's width, with
  dark round them; the keepsakes (at 16, like all furniture until phase J) look plain beside the
  fixtures at 32, the mummy teapot and cupcake tower most of all; the museum's critters are their
  16-pixel bag icons, small in their cases; the paper and floors are still v0's tiles at 2×.
- Phase I's places: the toadstools are small for a clump at 32 (they read as a sprinkle); the old
  trees' crowns are barely bigger than the town's trees; the clearing's pool is a diamond; the
  rowboat reads small beside the pier; the castle garden is sparse by day but for the
  butterflies; the frozen creek meets the lake without an edge.
- Phase R's kitchen: the dishes' steam reads as two chevrons at 16; the pie's bat cut-out is a
  blob; the stove's kettle spout is two pixels; the stove sheet's "any fish" is always the ghost
  minnow's picture, whatever fish she has.
- Phase Q's fish: the shadows are faint on the dark water (the rings are what find them); the
  blue moonfish's crescent reads as an L at 16; her line starts at a rod drawn beside her hand, as
  every held thing is; the "!" is small; the catfish's whiskers are two grey lines.
- Phase P's farm: the sprinkler (12×14 in a bed's corner) is small, and its bat ears read more
  like a cat's; a seed or sprout reads faintly on dark, watered soil at night; the bed card's
  picture is the harvest's 16-pixel icon.

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
