# Decisions

Append at the bottom; never edit an entry except to mark it superseded (and then add the entry that
supersedes it). An entry belongs here when a choice closed off a real alternative: it says what was
chosen, who chose it, what was rejected, and why, so the same argument is not had twice. A choice
with no alternative is not a decision and belongs as a comment beside the code instead.

Entries 1–12 were settled while planning version 0 (`docs/v0_plan.md`), in one conversation on
2026-09-26.

## 1. Pixel art, 2D, top-down

**2026-09-26 · the user · supersedes nothing** · _her size superseded by 32; the density by 79_

The game is drawn as 2D top-down pixel art on 16×16 tiles, with characters 16×24.

**Rejected:** low-poly 3D in Three.js, which is the pipeline the user's other game already has and
would have been cheaper to start.

**Why:** Stardew Valley's look is the closer match to what she loves, and pixel art reads as cozy
at phone size.

## 2. Sprites are drawn in code

**2026-09-26 · the user, on Claude's recommendation · supersedes nothing**

Every sprite is a grid of characters in a TypeScript file plus a palette of semantic keys (`s`
skin, `h` hair, `t` top…). They are baked to cached canvases at runtime. There are no image files,
except the app icons, which iOS insists on and which are generated from the same kind of grid by
`scripts/make-icons.mjs`.

**Rejected:** free CC0 asset packs (Kenney, itch.io), and a mix of packs for terrain and code for
characters.

**Why:** a palette swap makes every outfit, hair colour, furniture piece and pet recolourable for
free, and collecting is the heart of the game, so variety has to be cheap. Packs have a fixed
style, their spooky-cute coverage is patchy, and they are hard to recolour.

## 3. Spooky-cute all the time

**2026-09-26 · the user · supersedes nothing**

The whole town is Halloweentown-cozy all year: pumpkin lanterns, bats, friendly ghost and monster
neighbours, gothic-cute furniture and clothes. It is never scary. Dusky plum and moss stand in for
black, and anything inviting is lit in warm pumpkin and candle colours.

**Rejected:** cozy by day with spooky only at night, and a normal cozy town with spooky
collectibles mixed in.

**Why:** she loves Beetlejuice, The Nightmare Before Christmas and Wednesday, and a town that is
always that is the game's identity rather than a seasonal event.

## 4. The real-world clock, with the day rolling over at 5am

**2026-09-26 · the user (the clock); Claude (5am) · supersedes nothing**

Day and night, crop growth, daily resets, shop stock and critter hours follow the phone's local
clock, as in Animal Crossing. Anything that happens over time is _derived_ from stored timestamps
when it is read, never ticked while the game is closed. The "day key" rolls over at 5am local time.

**Rejected:** in-game days that you sleep to advance (Stardew); a midnight rollover.

**Why:** she'll play in short check-ins, and a real clock rewards coming back without ever
punishing time away. 5am rather than midnight is so a late-night session doesn't flip the shop
mid-play.

## 5. iPhone first: a home-screen app, autosave, and a backup code

**2026-09-26 · the user, on Claude's recommendation · supersedes nothing**

She plays on an iPhone. The game is an installable web app (manifest, `display: standalone`,
apple-touch-icon) that she adds to her Home Screen. It autosaves to `localStorage` on every
meaningful change and on `visibilitychange`/`pagehide`, asks for `navigator.storage.persist()`, and
offers a copy/paste backup code in Settings.

**Rejected:** cloud save on a small Vercel backend. It is deferred, not refused, and could be a
later version.

**Why:** Safari deletes a website's script-written storage after seven days without a visit, and a
Home Screen app is exempt. The backup code covers a lost or replaced phone with no server, no
login and nothing to run.

## 6. What version 0 contains

**2026-09-26 · the user · supersedes nothing**

Version 0 has a character creator and wardrobe, house decorating, farming, villager friendships,
critter catching with a collection book, pets, crafting, and a shop whose stock changes daily.

**Rejected:** nothing was left out of what was offered. Fishing, seasons, festivals, multiplayer
and cloud save are simply not in v0.

**Why:** these are the loops she enjoys (collecting, homemaking, friends), and each is small enough
to build in a session or two.

## 7. Personal touches

**2026-09-26 · the user · supersedes nothing**

The game includes their real pets, the user as a villager, and inside jokes and places. The details
are collected in `docs/personal_touches.md`.

**Rejected:** keeping it generic.

**Why:** it is a gift.

## 8. No game engine: a Canvas 2D renderer at a low, whole-number-scaled resolution

**2026-09-26 · Claude · supersedes nothing**

The game draws with the browser's Canvas 2D API into a small backing canvas, about 15 tiles across
the short side of the screen. That canvas is scaled up by a whole number of _device_ pixels with
smoothing off (`src/render/pixelScale.ts`).

**Rejected:** Phaser, which is a large API to learn for a tile-and-sprite game and which the
user's other project moved off; PixiJS, whose WebGL isn't needed at this sprite count; and scaling
by whole CSS pixels.

**Why:** a cozy top-down game needs tiles, sprites sorted by y, and a camera, and those take a few
hundred lines. Keeping the renderer thin also keeps the game engine-free (decision 9). Whole CSS
pixels are not whole device pixels at a devicePixelRatio of 3, and the art would shimmer.

## 9. The simulation is engine-free, and the renderer only draws it

**2026-09-26 · Claude · supersedes nothing**

`src/world/` owns the town, the player, villagers, critters and pets, and steps them in
`update(deltaMs, now)`. `src/render/` reads them and draws. There are two channels out of the
world: an `EventBus` of state for the HUD, and a list of moments (a catch, a harvest, a heart) that
`update` returns for the view and the sound.

**Rejected:** writing rules inside rendering code.

**Why:** it's the seam that made the user's MMO testable, and it lets whole days of farming,
friendship and collecting run in vitest with a fake clock.

## 10. Tap to move, with A\* on the tile grid

**2026-09-26 · Claude · supersedes nothing**

Tapping the ground walks there along an A\* path. Tapping a thing (a villager, a crop, a critter,
furniture) walks next to it and then acts on it.

**Rejected:** a virtual joystick. It could come later as an option.

**Why:** one thumb, no precision, and it's how the user's other game already plays on a phone.

## 11. Cozy rules: nothing punishes, expires or is lost

**2026-09-26 · Claude · supersedes nothing**

- Crops never wither, and watering only speeds them up.
- Friendship never decays.
- Nothing is lost for being away.
- There is no stamina bar, and catching can be retried forever.

**Rejected:** Stardew-style withering, stamina and friendship decay.

**Why:** "cozy and relaxing" is the brief, and she should never open the game to bad news.

## 12. A new private repo, deployed by Vercel

**2026-09-26 · Claude, as the plan the user approved · supersedes nothing**

The game lives in `tinyfrancer/mcfrancisville` (private). Vercel builds and deploys it from `main`,
and every PR gets a preview URL to try on her phone.

**Rejected:** a folder inside the user's MMO repo.

**Why:** the two projects share tools, not code, and a separate repo keeps each one's history,
CI and CLAUDE.md about itself.

## 13. The service worker is network first

**2026-09-26 · Claude · supersedes nothing**

`public/sw.js` fetches from the network and caches what it gets. It serves the cache only when the
network fails. It is registered in production only, and Vercel serves it with `no-cache`.

**Rejected:** cache first (the usual app-shell pattern), and no service worker at all.

**Why:** cache first serves the old build until a second launch, which is confusing when the new
thing was just announced. With no service worker, the installed app shows an error with no signal.
Network first costs nothing noticeable at this size.

## 14. Version 0 is a surprise

**2026-09-26 · the user · supersedes nothing**

She doesn't see the game until v0 is handed to her. Every question that would have been hers (her
colours, the currency's name, what goes in the starter wardrobe) is the user's to answer, and
nothing she might see (a shared link, a notification, a Home Screen icon on a shared device) should
give it away before then. The repo stays private, and the handover in phase 12 includes a first
launch that opens straight into the character creator, with no test save of the user's carried over.

**Rejected:** showing her as it grows and letting her steer it.

**Why:** it's a gift.

Entries 15–20 came from the user's answers to `docs/personal_touches.md`, on 2026-09-26.

## 15. Her likes are scattered through the game, not the theme of it

**2026-09-26 · the user · supersedes nothing**

Her favourite things (Dolly Parton, roses, bats, bracelets, squishies, pizza, blue, true crime) turn
up as things to find, catch, craft, buy and be given, among plenty of generic spooky-cute content.
Roughly one find in five is one of hers.

**Rejected:** a game built around her likes.

**Why:** the user's words: "here's your game with only things you like" might be boring. Stumbling
on them is the delight.

## 16. Every neighbour is a spooky creature, and Cody's villager is a vampire

**2026-09-26 · the user, with Claude · supersedes nothing**

All the villagers are spooky-cute creatures, including Cody's, who is a vampire drawn with Cody's
real look: long curly hair, glasses, jeans and a maroon ¾-sleeve tee.

**Rejected:** a human villager for Cody.

**Why:** the user chose a vampire if the others are creatures, and decision 3 makes them all
creatures.

## 17. Pets who have passed are gentle ghost pets

**2026-09-26 · Claude, on the user's answers · supersedes nothing**

Wybie and Elvira are adoptable as translucent, softly glowing ghost pets. They keep their real
markings and habits: Elvira's heart over one eye and her cuddling, Wybie's zoomies. They are never
sad or frightening in tone. Florence, Fibi, Dolly and Gary are adoptable as themselves.

**Rejected:** leaving them out, or remembering them with a memorial object only.

**Why:** a friendly ghost pet is at home in a spooky-cute town, and it keeps them with her.

## 18. Hair is changed at the Muse Hair Salon

**2026-09-26 · Claude · supersedes nothing**

The character creator sets hair once. After that, hair style and colour change at the Muse Hair
Salon in town, named for the salon she dreams of opening. It isn't in the wardrobe.

**Rejected:** hair as one more tab of the wardrobe.

**Why:** it gives her dream a building in v0, and it makes a visit to town part of changing her
look.

## 19. The mayor's letter is a cozy mystery that runs through the game

**2026-09-26 · the user (a mystery); Claude (its shape) · supersedes nothing**

Her first letter comes from a mayor nobody in town has seen. Clues arrive as friendship, collection
and real-date milestones are reached, and they pin to a corkboard-and-red-string furniture piece in
her house, a nod to her love of true crime and Judge Judy. v0 ships the letter, the corkboard and
the first few clues. The reveal is later work.

**Rejected:** a plain welcome letter from a known mayor.

**Why:** it's a long-running reason to come back, told in the genres she loves, and it can grow
with the game.

## 20. Special days follow the real clock

**2026-09-26 · Claude, on the user's answers · supersedes nothing**

- **04-08:** Cody's villager wishes her a happy birthday a day early, as Cody always jokes, and
  another villager corrects the date.
- **04-09:** the real birthday party.
- **06-06:** an anniversary letter and an orb gift ("forever orbs") that counts the years since 2020.

Only month-day pairs are in code. Her birth year is kept out, because the production URL is
public.

**Rejected:** nothing; this was simply offered.

**Why:** the real clock (decision 4) makes a date-keyed surprise nearly free, and these are the
days that matter.

## 21. `?gallery` ships in production

**2026-09-26 · Claude · supersedes nothing**

`?gallery` swaps the game for a scrolling page of every sprite at 4×. It is available in production
builds too, not only under `npm run dev`.

**Rejected:** a dev-only gallery.

**Why:** Vercel previews are production builds, and a real phone is where pixel art has to be
judged. The trade-off is that anything drawn is visible to whoever knows the URL. That's fine while
nothing in it is secret; revisit it before the personal-touch art (the pets, Cody's villager) lands,
if that matters.

## 22. Paths are eight-way, and never cut a corner

**2026-09-26 · Claude · supersedes nothing**

A\* steps diagonally as well as straight. A diagonal step is allowed only when both tiles it passes
between are open.

**Rejected:** four-way paths, which zig-zag across open ground; and unrestricted diagonals, which
walk through the corners of fences and houses.

**Why:** tap to move should look like walking straight to where you tapped.

## 23. The ground is drawn once, and each frame copies the visible part

**2026-09-26 · Claude · supersedes nothing**

`TownView` draws every tile of the map once, to an offscreen canvas the size of the map (480×768 for
the town). Each frame then blits the visible window of it, and draws props and the player on top,
sorted by where their feet are.

**Rejected:** drawing each visible tile every frame.

**Why:** the ground never changes, so one `drawImage` replaces a few hundred, which matters on the
cheap phones decision 8 is protecting. Anything that changes — crops, dug soil, the day/night tint
— is drawn on top rather than into the ground canvas.

## 24. Cody's vampire villager is the one who welcomes her back

**2026-09-26 · the user · supersedes nothing**

When she opens the game, Cody's vampire villager greets her with a sarcastic-but-loving line that
depends on how long she's been away. It arrives with the villager in phase 9, and phase 2's save
keeps `lastPlayedAt` so the line has something to go on.

**Rejected:** a rotating pet greeting; no greeting at all.

**Why:** the user's pick. It also puts Cody in the first thing she sees each day.

## 25. A save the game can't read is set aside, never deleted

**2026-09-26 · Claude · supersedes nothing**

If the stored save won't parse, won't migrate or doesn't have the right shape, it is copied to
`mcfrancisville:save:unreadable:<timestamp>` and the game starts fresh. If it can't be copied, it
is left where it is.

**Rejected:** the MMO's approach of deleting an unmigratable save.

**Why:** the cozy rules (decision 11) say nothing is lost, and a bug in a migration is exactly how
something would be. A set-aside save can be recovered by a later fix; a deleted one can't.

## 26. The backup is a line of text, not a file

**2026-09-26 · Claude · supersedes nothing**

Settings shows the save as a code: `MFV1-` followed by the save's JSON, deflated and in URL-safe
base64. On browsers without `CompressionStream` it is `MFV0-` followed by plain base64 JSON.
Restoring runs the code through the same migrations as a stored save, so an old code still works.
Restoring stops the autosaver and reloads, so the page's exit can't save the old town back over
the restored one.

**Rejected:** downloading and uploading a save file; cloud save (decision 5 defers it).

**Why:** a code pastes anywhere — Notes, a text to Cody — and needs no file picker. File downloads
from an iOS Home Screen app are awkward and easy to lose.

Entries 27–31 came from building phase 3, the creator and the wardrobe, on 2026-09-26.

## 27. Clothes are painted onto a body drawn in region keys

**2026-09-26 · Claude · supersedes nothing**

The paper doll's body is drawn once per facing and walk frame in keys that name body regions (`b`
torso, `a` arm, `l` leg, `f` foot…), all of which map to her skin. Most clothes are rules over
those regions ("the torso down to the hem, and the top of each arm"), so a tee, jeans or boots is
worked out for every facing and frame from the body. Only what changes the silhouette (skirts,
hair, the hat, glasses) or sits on top (prints, pendants) is drawn by hand (`src/sprites/doll.ts`).

**Rejected:** a hand-drawn grid per piece, per facing and per frame, the way phase 1's placeholder
was drawn.

**Why:** that is about twelve grids a piece, and collecting clothes is the heart of the game.
Painting keeps a new piece to a row in `src/data/outfits.ts`, and walk frames can never
disagree with the clothes on them.

## 28. A save from before the creator has no look, so the creator opens

**2026-09-26 · Claude · supersedes nothing**

The v1 → v2 migration sets `look: null`, and a save with no look opens the creator, just as a new
game does. The closet is filled with the phase 3 starters either way.

**Rejected:** giving an old save the default look, as the phase 2 handoff had planned.

**Why:** a v1 save has no name in it, and only she can type that. The only v1 saves are test
saves (decision 14), so the cost is one extra trip through the creator.

## 29. Colours are part of what she wears, not separate items

**2026-09-26 · Claude · supersedes nothing**

Each piece of clothing lists the fabrics it comes in, at least one of them a blue, and she switches
between them freely in the closet. The save stores which piece she owns by id, and what she wears as
a piece and a fabric.

**Rejected:** each colourway as its own item to find or buy.

**Why:** a palette swap is free (decision 2), and "a blue in every palette" is easiest to keep when
every piece has its colours in one row. Phase 6 can still sell pieces; it doesn't have to sell
colours.

## 30. The creator opens on a look that is already her

**2026-09-26 · Claude · supersedes nothing**

The creator's starting look is her split dye, gauges, tattoo sleeves, a Scream Dion tee, jeans,
boots and the bat pendant. She can change any of it, but all she has to do is type her name.

**Rejected:** a neutral starting look for her to build up.

**Why:** it's a gift from someone who knows her, and seeing herself on the first screen says so.

## 31. Gauges and tattoos can be changed in the closet

**2026-09-26 · Claude · supersedes nothing**

The creator sets gauges and tattoos, and so does the closet's Extras tab afterwards. Only hair is
kept for the salon (decision 18).

**Rejected:** leaving them to the creator only, which runs once.

**Why:** nothing should be fixed forever by one early tap, and she may simply want her arms bare in
a sundress.

## 32. She stands 16×32, two tiles tall

**2026-09-26 · the user · supersedes the character size in 1** · _superseded by 79_

Her paper doll is 16×32: a 12-pixel-wide head, a torso with room for two-row sleeves and a print,
and legs long enough for a skirt to end above boots. Villagers and pets are drawn to her scale.

**Rejected:** staying at 16×24, which is the Animal Crossing proportion and cheaper to draw.

**Why:** the user wanted more visibility into her styles, and clothes are the heart of the game.
The cost of changing her size grows with every cut, print and hairstyle, and every villager drawn
to her scale, so it was settled before the shop (phase 6) and villagers (phase 9) add more.

## 33. The bag has no limit

**2026-09-26 · Claude · supersedes nothing**

The bag holds any number of stacks of any size, with no weight. The sheet shows at least four rows
of five slots and adds a row whenever the last one fills, so it looks roomy without ever saying no.

**Rejected:** a fixed number of slots with a "bag full" message, and stack caps.

**Why:** a full bag means leaving something behind, and nothing she finds should ever be turned
away (decision 11). The plan's "generous slots" is kept as how it looks, not as a limit.

## 34. Time of day is a light map multiplied over the finished frame

**2026-09-26 · Claude · supersedes nothing**

Each frame is multiplied by a light map: the sky's colour for the hour (dawn pink, golden hour,
dusk, a lavender-blue night) plus warm stepped pools around lanterns, windows, jack-o'-lanterns,
moonpetals, the night's snack and her. What glows (window glass, lantern glass, carved faces) is a
palette of the sprite's own keys, baked as a layer and drawn back over the night through a layer
that everything in front of it rubs out. By day the lamps are out. `?hour=` draws the town in
another hour's light; in production it changes only the light, and in a dev build it moves the
town's clock too, so the smoke check can find the night's snack.

**Rejected:** a second, night-time palette for every sprite; a flat translucent overlay with no
lamplight; and letting `?hour=` move the clock in production.

**Why:** one light map works on every sprite, present and future, for free, and pools of lamplight
are what make a night feel cozy rather than just dark. A production `?hour=` that moved the clock
could hand out tomorrow's wood.

## 35. What she gathers comes back whole at 5am, and nothing is felled

**2026-09-26 · Claude · supersedes nothing**

A tree gives 3 wood and a rock 2 stone once a day, and a flower patch gives 2 flowers. Each
remembers the day key it was taken on, and is ready again when the key changes. Trees stay standing,
rocks show as pebbles and patches as sprouts until then. Flowers are picked by walking onto the
patch; walking through it picks nothing.

**Rejected:** chopping trees down and replanting (Animal Crossing, Stardew); respawn timers of so
many hours; picking flowers by walking through them.

**Why:** the town never looks worse for her visit (decision 11), the day key already exists
(decision 4) so nothing new ticks, and a patch picked only where she stops can't be emptied by
accident on the way somewhere else.

## 36. The late-night snack is one treat a night, somewhere in town

**2026-09-26 · Claude · supersedes nothing**

From 8pm until the day turns over at 5am, one snack waits at one of four spots (beside her door, the
top of the square, by the well, down by the pond). Which snack and which spot come from a hash of the
day key, so it is the same all night with nothing saved but whether she found it. It glows,
twinkles and sits in its own pool of light, and finding it gets a special toast.

**Rejected:** a snack always by her door; a snack chosen at random and saved; one snack per spot.

**Why:** "late-night snackies" should feel like a small treat she goes looking for
(personal_touches.md), and deriving it from the day key keeps it within decision 4's rule that
nothing is ticked or rolled while the game is closed.

## 37. Garden beds are tended from beside them, never walked on

**2026-09-26 · Claude · supersedes nothing**

Her farm is two rows of raised garden beds with a path all round. A bed is solid: tapping it walks
her to the open tile beside it, and arriving tills it, waters what's growing or picks what's ripe,
as decision 10 already said a crop would work. A tilled, empty bed opens a sheet asking which seed
to plant. She tills a bed once and it stays tilled.

**Rejected:** open soil she walks over, acting on the tile she stops on as flower patches do; and
a separate tap to open the seed sheet after tilling.

**Why:** a crop she stood on would hide her or be hidden by her, and beds two deep can always be
reached from the path. Opening the seed sheet right after tilling makes a new bed one tap, not two.

## 38. Growth is counted in mornings, and a watered day counts twice

**2026-09-26 · Claude · supersedes nothing**

A planting stores when it went in, how many days it was watered on, and the last day key it was
watered. Its growth is the number of 5am mornings since planting plus the days it was watered,
each watering counting from the next morning. A crop is ripe when its growth reaches its `days`
(2 for pumpkins and hostas, 3 or 4 for the rest), so watering every day halves the wait. Watering
is once a day and never needed, and a ripe crop waits forever.

**Rejected:** growth in real hours from the planted-at timestamp; watering as a flat bonus of
hours; a watering that counts the same day, which would ripen a pumpkin while the can was still
dripping.

**Why:** "come back tomorrow" is how the rest of the town works (decisions 4 and 35), and a
whole-day count can say exactly when something will be ripe, which every toast does.

## 39. Every harvest gives its seed back

**2026-09-26 · Claude · supersedes nothing**

Picking a crop puts the crop and one of its seed in her bag, and leaves the bed tilled and empty.
A new game (and a save from before phase 5) starts with a few of every seed: four pumpkin, two of
the rest.

**Rejected:** seeds only from the shop, which isn't built until phase 6; a daily free seed packet;
crops that regrow in place.

**Why:** she can never run out and be stuck with an empty garden (decision 11), and it needs
nothing new saved. Phase 6's shop still matters: it's where more seeds, and more beds' worth of
them, come from.

## 40. A blue rose is decided when the rose is planted

**2026-09-26 · Claude · supersedes nothing**

One rose planting in eight comes up as a blue rose instead of two pink ones, and one day in twelve
the rose bush gives a blue rose. Which is decided by a hash of the bed and the moment it was planted
(for the bush, its place and the day key), so a rose bound to be blue shows blue blooms in the bed
before she picks it. The same `rare` field on a yield could make anything else rare later.

**Rejected:** a random roll at picking time.

**Why:** nothing is rolled or ticked while the game is closed (decision 4), and seeing a blue rose
open in her own garden is the moment, better than learning of it from a toast.

Entries 41–45 came from building phase 6, Candy and the shops, on 2026-09-26.

## 41. Candy is a number in the save, not something in the bag

**2026-09-26 · Claude · supersedes nothing**

_How much a new game starts with is superseded by decision 77 (300)._

Her Candy is one whole number in the save (v5), shown in a pill in the top-left corner and at the
top of each shop's sheet. A new game starts with 100, and so does a save from before the shops.

**Rejected:** a stack of Candy in the bag, like the MMO's gold item.

**Why:** the bag holds things to look at, sell and give. Candy there would need a rule saying it
can't be sold for Candy, and it would scroll out of sight. A counter always on screen is how every
game she loves shows money.

## 42. The day's stock is dealt from pools by the day key, and never sells out

**2026-09-26 · Claude · supersedes nothing**

Each shop's shelves are rows in `src/data/shop.ts`: so many wares a day, drawn from a pool. What is on
them is a seeded shuffle of the pool, keyed by the shop, the shelf and the day key, so it's the same
all day and new at 5am with nothing saved. She can buy as many of a bag item as she likes; a piece
of clothing is bought once and then shows as hers. Cobweb Corner always has two pairs of fancy shoes
and the pop-up one, because she loves shoes.

**Rejected:** Animal Crossing's one of each thing a day, with what's left saved; stock rolled at 5am
and saved.

**Why:** deriving it keeps decision 4 (nothing is rolled or ticked while the game is closed), and a
shelf that sells out is a small "no" that the cozy rules (decision 11) don't need.

## 43. The furniture shelf waits for the house

**2026-09-26 · Claude · supersedes nothing**

Phase 6 sells seeds, clothes, squishies, records and pizza. Furniture, and the pop-up's spooky
decor, arrive with phase 7, as more shelves in `SHOPS`.

**Rejected:** selling furniture into the bag now, for the house to use later.

**Why:** phase 7 settles what a piece of furniture is (its footprint, its turns, its art at room
scale). Selling pieces first would fix that shape before the room they go in exists, and a shelf is
one row to add once it does.

## 44. The pop-up shop is in town on about four days in seven, on one of six lots

**2026-09-26 · Claude · supersedes nothing**

Spirit Halloweenie, the parody pop-up, stands on one of the map's `popUpLots` on days whose key
hashes to it (about four in seven), and on which lot is from the same hash: an empty lot, beside
the well, among the graves, overhanging the pond, and so on. While it's there it is solid, and
walking up to it opens its counter. It sells costumes and fancy shoes, and buys nothing. A save
standing on its lot starts her at her door instead.

**Rejected:** a building always in the same place; a pop-up that waits until she has visited; a
wandering position saved in the save.

**Why:** "they always pop up in random places" is the joke (personal_touches.md), and the day key
makes it free. Four days in seven keeps it a surprise without her going a week without seeing it.

## 45. Cobweb Corner pays a fixed price for anything but purse butter, and clothes stay hers

**2026-09-26 · Claude · supersedes nothing**

Every item has a value in `ITEM_VALUE`; the shop pays it at once, and sells what it stocks for
twice that. A harvest is worth about 20 a day of growing, so waiting longer pays a little more.
Purse butter is worth nothing to anyone but her, so the shop politely won't take it. Clothes have
their own prices and are never sold back.

**Rejected:** prices that change by the day (a turnip market); a shipping bin that pays overnight
(Stardew Valley); selling clothes back.

**Why:** a fixed price is easy to trust and paying at once means no waiting. Purse butter is her
joke and a gift for later (phase 9). A closet that only ever grows keeps decision 11.

Entries 46–50 came from building phase 7, her home and decorating it, on 2026-09-26.

## 46. Her home is a second scene on the town, and she walks about in it

**2026-09-26 · Claude · supersedes nothing**

`Town` knows which scene she is in (`town` or `home`). Walking up to her plum house goes in, onto a
door mat, and walking onto the mat goes back out to her front step. Indoors she walks, taps and
arrives exactly as in town, with the room's own walkability, and the save says whether she was
indoors. The room is a fixed shape in `src/data/home.ts` (a back wall three tiles tall over a floor
eleven deep), not a map in characters, and a view of its own draws it.

**Rejected:** a room as a second `MapSource` (its tiles would need the town's tile art, and nothing
in it is fixed but the chest and the mat); a decorating screen with no her in it, as a menu.

**Why:** walking into her own house and about her own room is the Animal Crossing moment, and
reusing the town's walking means a tap on a lamp walks her to the lamp for free.

## 47. Furniture stands, lies or hangs, and nothing she places can shut anything off

**2026-09-26 · Claude · supersedes nothing**

A piece is on one of three layers: the floor (solid), a rug (walked on, and stood on by floor
pieces), or the wall (three rows of it, so a house can be as full of pictures as hers is). A piece
fits if it's on its own layer, off the mat and the chest, off her, and over nothing else on that
layer, and a floor piece only if every bit of open floor can still be reached from the door and the
chest from some of it. A saved piece that no longer fits goes in the chest.

**Rejected:** free placement that can wall her in; a separate wall-decor mode; wall pieces only in a
few fixed hooks.

**Why:** the cozy rules (decision 11) mean the room can never trap her or lose something she owns,
and one rule of reachability allows every layout that isn't a trap.

## 48. Decorating is tap to pick up and tap to put down, and a piece turns by mirroring

**2026-09-26 · Claude · supersedes nothing**

While decorating, a tap on a piece picks it up (it floats in a candlelit outline), a tap elsewhere
puts it down there if it fits (choosing whichever way round covers the tapped tile), and a tap on
it again sets it down. Turning flips most pieces left to right; the pumpkin armchair has a side and
a back and turns all four ways; symmetrical pieces don't turn.

**Rejected:** dragging pieces, and drawing four sides of every piece.

**Why:** a tap is what the town already understands (the tap slop in `main.ts`), a drag under a
thumb hides the piece being dragged, and four sides of thirty pieces would be the whole phase's art
again for a difference she'd rarely see.

## 49. Furniture is bought into the chest in any number; walls and floors are owned like clothes

**2026-09-26 · Claude · supersedes nothing**

Cobweb Corner deals two floor pieces, a wall piece, a wallpaper and a flooring each day; the pop-up
deals two pieces of spooky decor, the second two-headed duck among them. Furniture can be bought
again and again, into her storage chest, and is never sold back. A wallpaper or flooring is bought
once and is hers to put up whenever she likes. The mystery corkboard isn't sold: it's hers from the
start, for the mayor's mystery (decision 19).

**Rejected:** selling furniture back; wallpaper as a stack of rolls used up when hung.

**Why:** a room of two of the same lamp is her choice to make, and nothing she owns should be spent
by using it (decision 11). Prices run from 240 to 900 Candy, a day or two of the garden.

## 50. Her house is furnished from the first day, old saves included

**2026-09-26 · the user (a house that isn't bare); Claude (what's in it) · supersedes nothing**

A new game's home has a bat-wing bed, a pumpkin armchair on a moon rug, Duckworth & Duckworth (the
two-headed duck) under their dome, four pictures and spooky things on the wall and the mystery
corkboard, with her succulents in the chest to put out herself. Save v6 gives an older save the
same house, written out in the migration.

**Rejected:** an empty house to fill; an older save arriving at an empty house.

**Why:** she keeps her real house fully decorated (personal_touches.md, "Her home"), so a bare one
wouldn't be hers, and the duck is there from day one because hers always are.

Entries 51–55 came from building phase 8, crafting, on 2026-09-27.

## 51. She makes things at a workbench in her home, hers from the first day

**2026-09-27 · Claude · supersedes nothing**

The workbench is a piece of furniture (2×1, it mirrors) standing in her room from the first day, and
walking up to it opens the craft sheet. It can be moved or put away like any piece, and it is sold
nowhere. Save v7 puts one into an older house where a new game's stands, or into the chest if she
has put something there.

**Rejected:** a workbench in town, as a prop; crafting from the bag, anywhere.

**Why:** making things at home is the Animal Crossing moment, and a piece of furniture needed
nothing new: `Town` already arrives at pieces (as at the record player), and the house already
keeps everything she owns safe.

## 52. Recipes are known or learned from cards, and making is instant

**2026-09-27 · Claude · supersedes nothing**

A recipe is a row in `src/data/recipes.ts`: what it needs from her bag and what it makes (a thing
for her bag, a piece for her chest, or her house bigger). Most bracelets, a few pieces and both
extensions are known from the start; the rest are recipe cards, one a day on Cobweb Corner's
Crafting shelf, bought once and kept like a wallpaper. Phase 9's villagers teach recipes through
`town.learn`. Making one takes what it needs and gives what it makes there and then. The save keeps
what she has learned; the starting ones are known whatever the save says, so a later build can add
one without a migration.

**Rejected:** crafting that takes time and is collected later; recipes found at random in the
town; recipes that are used up.

**Why:** waiting has no part in a cozy rule (decision 11) when a garden already asks her to wait,
and a card on a shelf is a small, clear promise of what's next.

## 53. Beads turn up in rocks and trees, and in a bead bin; bracelets are gifts

**2026-09-27 · the user (love, smiles and football); Claude (the rest) · supersedes nothing**

Seven beads, hearts, LOVE letters, smileys, a tiger-orange football, a scarlet-and-grey football,
a bat and a ghost, are found as well as the stone in about every other rock and the wood of one tree
in eight, fixed for the day like a blue rose, and two are dealt to Cobweb Corner's shelf each day.
Six bracelets are strung from them. Bracelets are items, worth a little more than their beads, for
phase 9's villagers to love as gifts.

**Rejected:** beads only from the shop; beads as a crop; bracelets she wears on the doll.

**Why:** "found beads" was the brief, and the rocks and trees are already where she finds things.
Rocks are few, so they give beads often. A worn bracelet would be one pixel on her wrist at 16×32.

## 54. Her house grows bigger in two extensions, never a second room

**2026-09-27 · Claude, from the user's wish for a bigger house · supersedes nothing**

The house has a size, 0 to 2, and each extension she builds at the workbench makes the one room
wider and deeper (13×11 floor, then 17×13, then 21×15), growing right and toward her. Every piece
stays where she put it, the chest stays in its corner, and the door mat moves to the middle of the
new front edge. The extensions cost wood and stone only: 60 and 20, then 120 and 40.

**Rejected:** a second room through a doorway; extensions bought with Candy; a bigger house built
overnight.

**Why:** one room that grows keeps decision 46 whole (one scene, one camera, one set of decorating
rules), and growing away from the wall and the chest means no placement is ever made worse (47).
Wood and stone are what she gathers every day, so building is a few days' happy work rather than
saving up.

## 55. Pieces made at the workbench are sold nowhere, and have no price

**2026-09-27 · Claude · supersedes nothing**

A stump stool, a jack-o'-lantern, a vase of roses, pressed flowers, a stone hearth, a moonflower
lamp, a candy-corn wreath, a hosta planter, a little gargoyle, a blue rose under glass and a
ghost-pepper garland can only be made. A piece without a price is one no shop sells; the corkboard
and the workbench have none either.

**Rejected:** also selling the made pieces.

**Why:** something only she can make is worth making, and it gives her crops and flowers a use
beyond selling them.

Entries 56–61 came from building phase 9, villagers and friendship, on 2026-09-27.

## 56. Her neighbours are out in town at every hour, and never asleep

**2026-09-27 · Claude · supersedes nothing**

Six villagers (Maude the ghost librarian, Rufus the werewolf florist, Wrapunzel the mummy baker,
Agatha the witch, Barty the skeleton gardener, and Cody the vampire) each have a stop for each block
of hours and amble there when the block turns, pathfinding round the pop-up and the cart. They have
no houses to go into and never sleep; on her birthday they all gather round the well. They aren't
solid, and one she's walking up to or talking to waits for her. They're drawn from the paper doll's
own parts in their own colours, with creature touches on top; Maude is a sheet. Wrapunzel's bakery,
Crumbs & Curios, stands east of the square with its museum waiting for phase 10.

**Rejected:** a house for each villager; villagers who go home to bed at night; hand-drawn sprites
for each.

**Why:** she may only ever play late at night, and a friend who is always asleep then is a friend she
can never make. Six houses would crowd the map and the art for nothing she could do in them yet.
Built from the doll, a villager is a row of colours and a few touches rather than thirty-six grids.

## 57. Friendship only grows: a talk and a gift count once a day, and nothing is ever lost

**2026-09-27 · Claude · supersedes nothing**

A heart is 100 points, up to ten hearts. The day's first talk is worth 10, the day's first gift 50
if loved, 25 if liked and 10 otherwise, and a favour 40. Nobody dislikes anything, points never go
down, and a second gift the same day is politely turned down and stays in her bag. Every bracelet is
loved by everyone (decision 53). Cody loves his burrito bowl ("chipotle is mah liiiiffeee"), purse
butter and pizza, and says "You're my orb." to a bracelet.

**Rejected:** disliked gifts and lost friendship for ignoring someone (Animal Crossing's grumpiness);
unlimited gifts a day.

**Why:** decision 11. A day's talk and gift from ten hearts is about three weeks per friend, so six
friendships are months of reasons to come back without any of them being a chore.

## 58. Rewards come by mail at three, six and ten hearts: a recipe, something to wear, and a piece

**2026-09-27 · Claude, from the plan · supersedes nothing**

A mailbox stands by her door, its flag up while a letter waits. Each villager writes at three hearts
with a recipe they teach (five recipe cards became taught: the moonflower lamp, blue rose dome,
candy-corn wreath, ghost-pepper garland and hosta planter), at six with something to wear, and at
ten with a piece for her home, all sold nowhere. Cody's three-heart letter brings the Walk the Tomb
record, the nod to the song they danced to the night they met. Letters are kept for good, and what
came with one is taken out when she first opens it. On 04-09 everyone writes, with a birthday cake;
on 06-06 Cody writes, counting the years (the orb gift is phase 12's).

**Rejected:** rewards handed over in conversation; a letter for every heart.

**Why:** a letter is a second little moment, and it keeps gifts somewhere she can read them again.
Three a friend is eighteen letters, each worth waiting for.

## 59. Favours are dealt by the day key, and are never missed

**2026-09-27 · Claude · supersedes nothing**

About a third of the villagers ask for a few of something she gathers, grows or can buy on any one
day, the same all day and different tomorrow, as the shop's stock is (decision 42). Handing it over
brings 40 points and some Candy, a little more than the things would sell for. A favour not done is
simply not asked again tomorrow.

**Rejected:** favours saved until done; favours with a deadline.

**Why:** nothing expires on her (decision 11), and a favour that waited forever would become a
to-do list. Today's asks are a suggestion, never a debt.

## 60. Cody welcomes her every time she opens the game

**2026-09-27 · the user (decision 24); Claude (its shape) · supersedes nothing**

Every time the game opens, Cody says one line with his portrait, chosen by how long she has been
away (minutes, hours, a day, a few days, a week, weeks), or the special day's line on 04-08, 04-09
and 06-06; a brand-new game gets his hello after the creator. She answers "Hi, Cody!". He calls her
babe; everyone else uses the name she typed. Now and then he farts, a little lavender puff, and her
answer is her own "You're getting on mah nerves!".

**Rejected:** a toast she might miss; a welcome only once a day.

**Why:** the user's pick (decision 24), and a sheet makes it a moment rather than a flicker. One tap
is little to ask for a hello every time.

## 61. The Moon Pie Man is a shop that turns up, not a villager

**2026-09-27 · the user (who he is); Claude (his shape) · supersedes nothing**

The Chocolate Banana Watermelon Moon Pie Man sets up his cart on one of four spots on about two days
in seven, read from the day key like the pop-up but by a hash of his own. He stands behind his
counter in dark glasses and a hat, and walking up to it opens his shop: moon pies, moon pie bites and
two of the night's snacks. He has no friendship and says almost nothing, for the mayor's mystery.

**Rejected:** a seventh villager; a peddler who wanders about.

**Why:** a mystery is better kept at arm's length, and the pop-up already showed that a shop which
turns up somewhere different is a small delight on its own.

Entries 62–66 came from building phase 10, critters and the collection book, on 2026-09-27.

## 62. Critters are things in her bag, and the Curiosity Cabinet remembers them

**2026-09-27 · Claude · supersedes nothing**

Each of the nineteen critters is also an item (`kind: 'critter'`), so a catch goes in her bag, where
it can be kept, sold at Cobweb Corner, given to a neighbour or donated. The Curiosity Cabinet keeps
the day she first caught each kind and which are on show, and neither is ever forgotten, whatever
became of the critter itself. Save v9 adds it.

**Rejected:** a separate critter collection she keeps them in; a book that only counts what she
still holds.

**Why:** the bag, selling and gifts already work for anything in it, so "donated, kept or sold" is
free. A book that forgot a critter she sold would be a small loss, and nothing is lost (decision 11).

## 63. The hour's critters are dealt from the day key onto habitats found in the map

**2026-09-27 · Claude · supersedes nothing**

Each hour, five different kinds of critter about at that hour are dealt, weighted by rarity (6, 3 and
1), onto tiles of their habitats: open ground by the lanterns, trees, pumpkins, gravestones and
flower patches, the pond's bank, and the pond's edge. The habitats are worked out from the map, and
leave out her door, the snack's spots, the flower patches themselves and every neighbour's stop. A
catch is remembered in `taken` for the rest of the hour. Every hour has at least four kinds about,
so she always finds something whenever she plays, and the luna moth and the orbs are night only.

**Rejected:** spawn timers or positions saved in the save; critters wandering about the town;
hand-placed spots for every critter.

**Why:** decision 4: nothing ticks while the game is closed, and what's out is the same all hour on
any phone. Habitats from the map mean a new lantern or tree brings its critters with it.

## 64. A catch is a walk up and a swing; only a rare critter flutters off, and only once

**2026-09-27 · Claude · supersedes nothing**

Tapping a critter walks her up beside it (or the pond's bank beside a fish) and she swings her net.
The three rare ones (the luna moth, the vampire bat and the pair of orbs) flutter off to the nearest
spot of their habitat at least two tiles away the first time, and are caught the second. A flier can
be tapped in the air above its tile too.

**Rejected:** a timing game at the swing; critters scared off by her running; a chance to miss.

**Why:** "a gentle tap to catch, retryable forever" (the plan, and decision 11). A tiny chase makes a
rare one feel rare without ever making her fail.

## 65. She has had her net from the start

**2026-09-27 · Claude · supersedes nothing**

There is no net to buy or make; she swings one whenever she walks up to a critter, and it's only
drawn mid-swing.

**Rejected:** a net sold at Cobweb Corner or made at the workbench.

**Why:** she has no watering can or axe either (decisions 35 and 37), and a tool to buy first would
be a gate in front of the thing she'd most like to do.

## 66. The museum is a sheet at Crumbs & Curios, and Wrapunzel writes as it fills

**2026-09-27 · the user (whose museum); Claude (its shape) · supersedes nothing**

Walking up to Wrapunzel's bakery opens the museum: the critters in her bag it hasn't got yet, to
donate one of each, with a label from Wrapunzel, and nineteen cases, full or waiting. At ten on show
Wrapunzel writes with a luna moth lamp, and when every case is full, with a curiosity cabinet for her
home (letters `museum:10` and `museum:19`). Wrapunzel needn't be there: she leaves a note.

**Rejected:** a museum room she walks around in; a reward for every donation.

**Why:** a second indoor scene is a lot of map and art for a place she visits to hand things over,
and a sheet shows every case at once on a phone. Two letters are milestones worth waiting for.

Entries 67–71 came from building phase 11, the pets, on 2026-09-27.

## 67. The pets are hers from the first day, all at home, and one at a time walks with her

**2026-09-27 · Claude, from the plan · supersedes nothing**

All six pets live in her home from the first day, old saves included (save v10). Walking up to one
opens its sheet, and "Come for a walk" makes it the one that follows her about town and in and out
of her door; any other that was walking goes home. In town only the walking one is about. Cody's
first hello says the babies are waiting at home.

**Rejected:** adopting them one by one, from a shelter or a letter; several pets following her at
once.

**Why:** they're their real pets, so they were always hers; a shelter would say otherwise. One at a
time keeps the town readable on a phone and gives each a turn out.

## 68. What a pet is doing is worked out as it goes, from her and the clock; only its name and its accessory are saved

**2026-09-27 · Claude · supersedes nothing**

A pet (`src/world/Pet.ts`) follows her or potters about her room, and its habits come from where she
is and stretches of the clock read through a hash: Florence naps under her blanket once she stands
still, and at home is awake only one stretch in four; Elvira curls up beside her; Dolly barks at a
neighbour who comes close and hides on her far side; Wybie runs laps with the zoomies; Fibi whines
and Gary manages a "…"; the two of them smell a little now and then. Gary is slow, and like any pet
more than ten tiles behind, he's simply beside her again. Nothing about where a pet stands is saved.

**Rejected:** saved positions and timers; a mood or needs to look after.

**Why:** decision 4 (nothing ticks while the game is closed) and decision 11 (nothing to neglect). A
pet that's always pleased to see her is the whole point.

## 69. Pets wear one thing round the neck, owned like her walls and floors

**2026-09-27 · Claude · supersedes nothing**

An accessory is a collar (plain, spiked or with a bell) or a bandana, painted over three keys in a
pet's grids: the band, a bandana's point, and a collar's spikes or bell. Once she owns one, any pet
can wear it, and several can wear the same. She starts with Fibi's pink spiked collar and three
bandanas, Dolly in the blue one; eight more are sold two a day on Cobweb Corner's "For the pets"
shelf. Florence's blanket is part of her, not an accessory.

**Rejected:** hats and other slots; accessories used up by wearing them.

**Why:** the neck is where their real ones are (personal_touches.md), and one slot drawn as keys
works on a cat, a dog and a snail without a grid per pet per accessory.

## 70. Fibi's bone turns up on most days, by the day key, in town or under the furniture

**2026-09-27 · Claude, on the user's answer · supersedes nothing**

On about five days in seven, one of Fibi's bones is lying somewhere: beside a tree, pumpkin or
gravestone in town, or, one day in three, on the floor in front of a piece of furniture at home.
Walking onto it picks it up; it can't be sold or given to a neighbour, and giving it to Fibi from
her sheet makes her day, with hearts rather than whines for the rest of it. Where it is comes from
the day key, like the snack, and finding it is remembered in `taken`; only the count of bones
brought back and the day of the last are saved.

**Rejected:** a bone in a garden bed (a tap on a bed tends it); a reward for bringing one back.

**Why:** it's her real habit, and a small errand whose reward is a happy dog is exactly the size of
thing the game is made of.

## 71. Ghost pets are see-through, float a little, and glow after dark

**2026-09-27 · Claude (decision 17's shape) · supersedes nothing**

Wybie and Elvira are drawn in their real colours at about three-quarters opacity, a couple of pixels
off the ground with a small bob, with a pale glow (blue for Wybie, green for Elvira, like the orbs)
that shows after dark. Otherwise they do everything the others do.

**Rejected:** a white, sheet-like ghost look; a glow by day too.

**Why:** their markings are what make them them, Elvira's heart above all, and a soft glow at night
is spooky-cute rather than sad.

Entries 72–77 came from building phase 12, the finishing touches, on 2026-09-27.

## 72. The inside jokes and Dolly nods are things to find in the shops, not gifts

**2026-09-27 · Claude, on the user's answers · supersedes nothing**

The Long neck Yoshi plushie, the rhinestone guitar and the butterfly frame are furniture on Cobweb
Corner's shelves, and the coat of many colours is a patchwork dress-length coat on its clothes
shelf, each dealt by the day key like everything else there. The plushie is its own long-necked
green creature, named for the saying, and Rufus mentions it once they're friends.

**Rejected:** handing them over in a letter on the first day; drawing anyone else's dinosaur.

**Why:** decision 15: stumbling on one of hers among everything else is the delight.

## 73. The mayor's mystery: two letters, six clues pinned by milestones, and no reveal yet

**2026-09-27 · Claude (decision 19's shape) · supersedes nothing**

The mayor writes once she has a name, and again a week after. Clues are pinned to her corkboard as
she reads those letters, reaches three hearts with anyone, catches five kinds of critter, buys from
the Moon Pie Man, and catches Wes lurking; each pinned clue is saved with its day (save v11), and
the corkboard sheet shows those found, a hint for each still to find, and the two suspects (Wes and
the Moon Pie Man) once a clue points at them. The clues point both ways on purpose; who the mayor is
stays open.

**Rejected:** clues as more letters only (a clue found in town belongs on the board at once); a
timed trail that could be missed.

**Why:** every clue comes from something she'd do anyway, so the mystery moves as she plays, and
nothing about it can be failed (decision 11).

## 74. Wes lurks beside a tree at the edge of the screen, a minute at a time, and is gone once she's near

**2026-09-27 · Claude, on the user's answer · supersedes nothing**

About one minute in four, Wes stands half hidden beside a tree somewhere she'd just see him on a
phone (at least five tiles off, and within the screen). Where is worked out as the minute starts,
from where she is; nothing about him is saved. Once she's within three tiles he's gone; the first
time he leaves his trench-coat button, a clue, and after that a silly line. Tapping him walks her
over.

**Rejected:** Wes as a neighbour to talk to; a Wes that runs off along a path.

**Why:** the joke is that he's always lurking and very bad at it; being glimpsed and never caught is
the whole of him until the mystery says more.

## 75. The anniversary letter is one line, and brings a new pair of forever orbs each year

**2026-09-27 · the user (the line); Claude (the orbs) · supersedes nothing**

On 06-06, Cody's letter says "I love you to the moon and back", and nothing else but "Babe" and
"Forever orbs, Cody". It encloses the forever orbs, a green and a blue orb in a glass globe that
glows after dark; walking up to it says how many years it has been since 2020. Each year's letter
brings another.

**Rejected:** counting the years in the letter itself; one orb whose number changes.

**Why:** the user asked for just that line. The orbs keep the count, and a shelf of them grows with
the marriage.

## 76. Sound is synthesised from tunes written as data, and the music hushes for a record

**2026-09-27 · Claude (decision 2, for sound) · supersedes nothing**

Every sound is Web Audio oscillators and a little noise, played from `Tune`s written as note lines
in `src/audio/`: cues for the moments `update()` returns, a patter of blips for each neighbour's
voice, a quiet music-box waltz on a loop, and an original tune per record in the style of its band
(no real melody is copied). Nothing plays until her first touch, as iOS requires. A record stops the
waltz until it ends or she goes out; records follow the Music switch. The Sounds and Music switches
belong to the phone (`localStorage`, not the save or the backup code). Walk the Tomb gets her
dancing, and since Cody never comes indoors otherwise, he comes over from next door to dance with
her for the length of it.

**Rejected:** audio files; a music track per place or hour; putting the switches in the save.

**Why:** no files keeps the build tiny and the style of the art; a phone's own quiet preference
shouldn't travel with her town to another phone.

## 77. A new game starts with 300 Candy

**2026-09-27 · Claude (the balance pass) · supersedes decision 41's amount only**

A new game starts with 300 Candy instead of 100: enough for a record, a squishy or a bandana on the
first visit to Cobweb Corner. Old saves keep what they have. Everything else in the economy stands:
a thorough day earns around 1,500 Candy (flowers and wood most of it, each bed about 20 a day of
growing), a casual one a few hundred, against 250–900 for most furniture and clothes.

**Rejected:** cheaper prices across the board; more Candy from each find.

**Why:** the first day of a gift should end with something bought, and the rest already paces at a
piece or two a day.

Entries 78–83 settled the version 0.1 plan (`docs/v0.1_plan.md`), from the user's answers on
2026-09-27.

## 78. The world grows as connected zones around a bigger town

**2026-09-27 · the user, on Claude's recommendation · supersedes nothing**

The town becomes a larger hub, joined at its edges and doors to separate areas (Whisperwood,
Lantern Shore, the castle hill and more), each its own small map with a short fade between them and
a world map to travel between places she has found. Areas can stay locked until something
happens. Neighbours are placed exactly only in her zone and follow their schedules on paper
elsewhere.

**Rejected:** one big seamless map, whose pre-drawn ground (decision 23) would take ~10 MB and
whose every system would run everywhere at once, and which makes an area hard to gate or hide;
chunk streaming, which is the most engineering of the three for a game this size.

**Why:** small zones stay cheap on her phone, gating and secrets come for free, and a new area
later is a row and a map: room to grow.

## 79. The art doubles in density: 32-pixel tiles and chibi characters at 32×48

**2026-09-27 · the user (bigger, now); Claude (the size and proportions) · supersedes the sizes in
1 and 32**

Tiles are 32×32. She, her neighbours and newcomers are 32×48 in chibi proportions: a big head with
big eyes, a small body. Buildings are 4–6 tiles wide. The redraw is staged across phases C, D, F,
G, J and L; until each part is redrawn, its old 16-pixel grid is baked at double size, so the game
always runs. Sprites stay grids in code with palette swaps (decision 2), with new helpers and a
render-to-PNG script to make bigger grids practical.

**Rejected:** keeping 16-pixel tiles and 16×32 characters with bigger buildings (Claude's first
recommendation), which the user turned down in favour of more detail now rather than a second
redraw later; 32×64 characters, which are more realistic than cute; smaller characters; zooming
out.

**Why:** the user wants more room for detail and a cuter, more stylised look, and redrawing now,
before 0.1 adds a world's worth of new art, is far cheaper than redrawing it all later.

## 80. Version 0 saves are test saves, and 0.1 starts a fresh save chain

**2026-09-27 · Claude, on the user's answer · supersedes nothing**

She hasn't played v0. So 0.1 doesn't migrate v0 saves across the re-laid, re-scaled world: a v0
save (or backup code) is set aside under `mcfrancisville:save:unreadable:*` as decision 25 says,
never deleted, and the game starts fresh. From 0.1's first save on, every change of shape is a
migration with a test again.

**Rejected:** migrating v0 positions, homes and furniture into a world whose tile size, layout and
rooms all change.

**Why:** that would cost a phase to protect saves nobody has. Setting them aside keeps decision 25:
nothing is deleted.

## 81. The day has three check-in windows: morning, afternoon and evening

**2026-09-27 · the user, on Claude's proposal · supersedes nothing**

The day key still rolls at 5am (decision 4). Within a day there are three windows, from 5am, noon
and 6pm. Gathering, the shop's specials, the noticeboard, critter spawns and small events refresh
per window, and neighbours do different things in each. Things that grow (crops) still count
mornings (decision 38).

**Rejected:** one daily refresh (v0), and hourly refreshes, which would make play feel like a chore
to keep up with.

**Why:** she plays in short check-ins, and three a day gives each one something new without asking
for more.

## 82. Passive Candy is a candy tree and an honesty stall

**2026-09-27 · the user · supersedes nothing**

A candy tree by her house fills a little each window, to be shaken when she visits. An honesty
stall at the farm sells whatever crops she leaves in it while she's away, at the shop's price.

**Rejected:** interest on saved Candy, and a daily allowance, which reward nothing she did.

**Why:** the user liked the candy tree, and saw farming as the natural passive income. Both fill
while she's away and wait for her, which is the cozy rule.

## 83. The "backend" is the codebase: no server, and structure first

**2026-09-27 · the user · supersedes nothing**

"Solid backend" means a clean, modular codebase that won't slow down or tangle as the game grows,
not a server. 0.1 has no server; phase A splits `Town` into services, and every phase ends with a
design review.

**Rejected:** a server for cloud saves or live content (decision 5 still defers it).

**Why:** the user's words: avoid spaghetti that causes slowdowns or issues down the line.

## 84. The World is services over a shared context, and callers use the services

**2026-09-27 · Claude, in phase A · supersedes nothing**

`Town` became `World`: a thin composer of services (`src/world/services/`), each built from a
`WorldContext` (clock, state bus, a signal bus between services, queued moments) and exactly the
keepers it needs. Services tell each other things by signal (`bought`, `opened`), never by
reaching into each other. The HUD, renderer and tests call the service (`world.shops.buy`), with
no forwarding methods on the World. The layout is in `docs/architecture.md`.

**Rejected:** an entity-component system (far more machinery than a game with one player and a
dozen neighbours needs, and it would hide the rules she feels in generic loops); one central store
with reducers (every change a message, which makes the simple things verbose in plain TypeScript);
keeping `Town` as a facade over the services (1,700 lines of forwarding that grows with every
feature, the spaghetti decision 83 is about).

**Why:** each feature's rules are one file with its own state, snapshot and dependencies in its
constructor, testable alone; a new feature is a new service rather than more `Town`; and the
signals keep features that react to each other (the mystery and the shops) from knowing each
other.

## 85. Movement steps at 120Hz, the camera eases by whole pixels, and paths are pulled taut

**2026-09-27 · Claude, in phase B · supersedes nothing**

The world steps at a fixed 1/120 s, whatever the frame, with no interpolation. The camera eases
after her (a focus trailing her by about 150 ms). What the view uses is her whole-pixel lead over
it, which changes one pixel at a time and only on a step where the change can't move the ground
backwards. Her paths are A\* pulled taut against a body just under half a tile either side, so she
walks any angle across open ground.

**Rejected:** a camera locked to her (the simplest cure for the shimmer, but the plan asked for
ease, and a dead stop reads as stiff); easing the camera and rounding its focus on its own, which
puts her on one screen pixel and then the next as the two round on different frames, the same
shimmer by another route; rounding her position and the lag separately, which steps the camera
back a pixel as she turns a corner; a 60Hz step with the render interpolated between steps (more
state for every moving thing, for no gain at 120 steps a second); Theta\* or a navmesh (more
machinery than a town of tiles needs; pulling the A\* path gives the same walks here).

**Why:** smoke's frame dump showed her flickering a pixel back and forth on every walk. It no
longer does, and it holds on any phone because the steps are the same length everywhere.

## 86. Old art is baked at 2× where the world draws it, and the screen fits nearest 16 tiles

**2026-09-27 · Claude, in phase C · supersedes the fit in 1 (at least 15 tiles across)**

`TILE_SIZE` is 32. Version 0's grids stay as they are, 16 pixels to a tile, and the world bakes
them twice the size (`bakeOld` in `src/render/legacy.ts`, a `scale` on `bake`), with every length
measured against them (an offset, a shadow, a light's reach) written `old(n)`. The ground and the
rooms are drawn whole at the old size and enlarged once. The HUD's icons and portraits still bake
at 1×. When a phase redraws a sprite at 32, its `bakeOld` and `old` calls go with it, so what is
left to redraw is whatever still says `old`. The screen now fits the whole device-pixel scale
that shows nearest 16 tiles across its short side, judged as a ratio, rather than the largest
that shows at least 15.

**Rejected:** marking each old grid as old in `src/sprites/` (the same grid is drawn into the
world and into the HUD at different sizes, so the scale belongs to where it's drawn, not to the
grid); drawing the whole world at 16 and enlarging the frame (no room for new art at 32); a
scale flag defaulting to 2 everywhere (the HUD would double silently); keeping "at least 15
tiles", which at 32-pixel tiles gives an iPhone SE 23 tiles across and an XR 26, all tiny.

**Why:** the game has to keep running while the art is redrawn over six phases (decision 79),
and the bridge should be easy to see and easy to take down. On a current iPhone the view is the
same as before, about 18 tiles across; the smallest and largest phones now land between 12 and
19 instead of between 15 and 26.

## 87. Every sprite is listed once in a pure catalogue, and the scale sheet stays out of the game

**2026-09-27 · Claude, in phase C · supersedes the gallery's own list**

`src/sprites/catalogue.ts` names every sprite and draws it without a canvas. The gallery, `npm run
sprite` and a test that draws everything all read it, so a new sprite is added in one place and
can't be missing from any of them. Big new art is drawn with `Sketch` (shapes, lit spheres,
bevels, outlines from a mask), and still comes out as a grid of keys and a palette (decision 2).
The scale sheet's her, Cody, house, skeleton, tree and ground are drafts in
`src/sprites/scaleSheet.ts`, shown only in the gallery: the game keeps drawing version 0's art
until phases D, F and G replace it, taking what the user liked from the sheet.

**Rejected:** the gallery keeping its own hand-written list beside a second one for the script;
rendering PNGs in a headless browser (slow, and the grids need no canvas); a PNG encoder
dependency (Node's zlib does it in thirty lines); putting the scale sheet's her into the game
straight away (phase D's job, with her poses and every outfit, and the user wants to judge the
size first).

**Why:** the art is about to be redrawn across six phases, and each needs a quick way to look
at what it drew, on the phone and off it, before it's wired in.

## 88. Her doll at 32×48 is painted onto body regions, and each layer is finished on its own

**2026-09-28 · Claude, in phase D · supersedes the 16×32 of 32 (she is 32×48, decision 79)**

The doll (`src/sprites/doll.ts`) is redrawn with `Sketch` at 32×48, after the scale sheet. Its
body is drawn in region keys finer than before: an upper arm (`a`, a short sleeve), an elbow (`e`,
a ¾ sleeve), a forearm (`w`, a long sleeve), a hand, a torso, hips, legs and feet. A cut paints
regions, never rows, so it follows the arm wherever a pose puts it. Every layer is then finished
on its own (`finish`): light on its top-left edges, shade on its bottom-right ones, and a soft
outline in its colour's darkest `ramp` tone, drawn only where it meets her own outline or the air
(so a tee draws no line across her arm), or all round for something drawn over her, like a hat.
Her poses are whole bodies facing the front (her phone, arms crossed, devil horns, a head-bang),
and a pose's arms that rise in front of her hair are a second part drawn over it. The neighbours,
Wes and the Moon Pie Man are built from the same parts; version 0's doll was kept for them in
`oldDoll.ts` only until they were redrawn in the same phase, and is gone. The pets are sketched
at 32 from round shapes. A critter gets a 24×24 sprite for the town beside its 16×16 grid, which
stays its bag icon until the HUD is redrawn (phase M).

**Rejected:** compositing all her layers and outlining the result once (the soft outline is each
layer's own colour, and palette swaps work per layer); a hand-typed grid per pose and cut (four
poses times every cut, and every new piece of clothing times them all); poses from every side (a
pose is a moment she turns to face you, and three times the art); drawing each critter at 32 and
shrinking its bag icon (the HUD's icons wait for phase M).

**Why:** the user locked in the scale sheet's look, and the paper doll's promise (decision 27), a
new piece of clothing is a row, has to survive a doll that now moves her arms.

## 89. She idles and rocks out from rules on the clock, thrilled by a signal

**2026-09-28 · Claude, in phase D · supersedes nothing**

`world.poses` (`src/world/services/Poses.ts`) keeps how long she has stood still and when she was
last thrilled; `src/systems/poses.ts` turns those into a pose. After eight seconds still she
checks her phone, then crosses her arms, taking turns with a moment's plain standing between; a
tap, a walk, a talk, a pat, decorating or a dance stops it. A rare catch (after her net comes
down), a loved gift, the first of each crop she ever picks, and opening a letter from Cody send a
`thrilled` signal, and she rocks out for 2.4 seconds on the beat. The first of each crop needs a
record, so save v13 adds `harvested` (and her face's `freckles` and `nosePiercing`, which a save
from before them doesn't have: she keeps the face she chose).

**Rejected:** reading the thrills off `update`'s moments in the World (a loved gift and an opened
letter come from the HUD, not a step, and the World would grow a rule); rocking out at every
harvest (a chore of a dance by the tenth pumpkin); idling on a timer the view keeps (rules live in
the world, decision 9).

**Why:** personal_touches.md, "Her, drawn bigger": she checks her phone or crosses her arms, and
rocks out at the big moments.

## 90. Places are rows with their ways out in their maps, and every crossing goes through Travel

**2026-09-28 · Claude, in phase E · builds on 78**

Every place is a row in `ZONES` (`src/data/zones.ts`): its name, a line and an icon for the world
map, its map, the rule that opens it, and where it sits on the map. A map's ways out are runs of
tiles at its edge (`exits` in its `MapSource`), each naming the zone beyond; walking onto one goes
through, and coming back she steps in on the tile just inside, level with where she left the other
side. A building's door is a `doors` row (the town's `homeHouse` into `home`), and she comes back
out onto the map's spawn. Her home stays code (`HomeZone`), since its room is her house's size.

`Travel` (`src/world/services/Travel.ts`) owns which place she is in, and every crossing, by the
edge, a door or the world map, goes through it: it stands her in the new place, sends a `crossed`
signal (the decorator, the record player and the pet out walking hear it), and finds the place the
first time, with a `found` moment and, for Whisperwood, a letter. The world map (🗺️) shows the
places she has found joined by their paths, a question mark down each path not yet taken, and
goes straight to any place found and open, arriving at its spawn. Each new place fades in from dark
in 320 ms, a CSS overlay under the HUD, so the renderer doesn't know about it. Each place outdoors
is drawn by an `OutdoorView` made the first time she goes there. Whisperwood and Lantern Shore
arrive as first drafts drawn from the town's tiles, 36 rows so they fill a phone; phase I redraws
them. Trees and flowers outside the town are keyed with their place (`whisperwood:prop:7,16`).

**Rejected:** exits as a legend character (it can't say where it leads, and would be a second
source of truth beside the row); an exit anywhere she steps on it mid-walk (only arriving counts,
so a path never carries her through by accident); a map that travels only between places joined to
where she is (the map is for going far without the walk); a fade that darkens before the crossing
too (it would hold her in place for a beat on every step off an edge).

**Why:** the plan's phase E, and "Where it hurts" 2: every crossing through `doorAt` and `entry`,
with a registry instead of `town | home`, so a new place is a row and a map.

## 91. A shut place opens by a rule, and once open stays open; the shore opens with their skates

**2026-09-28 · Claude, in phase E · supersedes nothing**

A place's `unlock` is data: open from the start, having something in her bag, so many hearts with
a neighbour, having been somewhere, so many kinds of critter caught, or all of several. The rules
are pure (`holds` in `src/systems/zones.ts`), checked each step, and the first time one holds the
place is opened for good in the `Atlas` (`src/world/Atlas.ts`, save v14, which also keeps the
places found), with an `opened` moment. Walking to the way into a shut place is a `shut` moment
whose toast is the hint. Lantern Shore opens with the ice skates from their first date
(personal_touches.md, "After phase D"): Cody posts them the first time she finds Whisperwood, and
the frozen creek between them is no trouble with skates on. The skates are a `keepsake`: not sold
and not given.

**Rejected:** working out "open" from the rule every time without saving it (skates sold or given
away would freeze the creek again, and decision 11 says nothing is lost); a locked gate prop (new
art for a place phase I redraws, and the frozen creek says it better); the skates as a shop find
(it's their first date; it should come from Cody).

**Why:** the plan's "unlock rules as data", so a place, a neighbour or (in phase U) the frozen pond
can wait on something happening without a new branch in the code.

## 92. Neighbours are walked only in her place, and elsewhere are simply at their stop

**2026-09-28 · Claude, in phase E · builds on 56**

A villager's stop can be in any place outdoors (`zone` on a `Stop`; Rufus picks wildflowers in
Whisperwood in the morning, and Agatha gathers herbs there after dark). Each neighbour knows the
place they're in. In the place she is in, they walk as before, and when their next stop is
somewhere else they walk to the way out toward it (`nextZoneToward`) and are gone. Anywhere else
they aren't walked at all: they're at their stop, and when their stop comes to be where she is,
they come in by the way from where they were, and walk on. While she's at home, everyone is simply
at their stop, so coming out finds the town as the clock says.

**Rejected:** walking every neighbour in every place all the time (paths across maps she can't see,
for nothing); placing them at their stops only when she arrives somewhere (she'd never see anyone
leave or come in); letting her follow a neighbour through an exit to talk (she lets them go).

**Why:** the plan's "neighbours placed exactly only in her zone and by schedule elsewhere", with
room for phase S's schedules per window and visits.

## 93. The ground is auto-tiled from each tile's neighbours, over grass, and where neighbours stand is named in the map

**2026-09-28 · Claude, in phase F · builds on 23**

The ground is redrawn at 32 (`src/sprites/terrain.ts`). Every tile is grass underneath, and any
other ground (path, water, hedge, garden bed, and the new cliff and steps) is a piece laid over it,
drawn by `Sketch` from which of its eight neighbours carry the same ground: a distance to the edge
for every pixel, with outer corners rounded, inner corners wrapped round their point, and each
kind painting from that distance (a pond's far bank a face of earth and its near one a lip, a
path's worn kerb with grass creeping over, a hedge's scalloped front). There are 47 shapes; each
shape and look is drawn once and cached, and the ground is still baked whole once per place
(decision 23). Textures that cross tiles (hedge clumps, cliff stones) repeat every 32 pixels so
tiles meet without a seam, which is why a cliff has one look. Props still drawn at 16 are listed
in `render/legacy.ts` (`propScale`), since the density belongs to where art is drawn (decision 86).

A villager's stop names a spot (`at: 'graves'`) in its place's `SPOTS` (`src/data/maps.ts`),
typed so a stop can only name a spot in the place it's in, rather than giving a tile. Re-laying the
town moved every stop; phase G moves the buildings again and phase S adds a stop per window, and
each of those is now one line in the map rather than a hunt through every schedule. Smoke finds
buildings, beds and ways out from the map for the same reason.

**Rejected:** a hand-drawn tile for each of the 47 shapes of each ground (hundreds of grids, and
a new ground is another 47); the RPG Maker quarter-tile scheme (five quarter pieces per ground,
still hand-drawn, and quarters can't carry a bank that's taller on its far side); drawing the
edges with rectangles in the renderer as v0 did (the ground's look would live in the renderer,
decision 9); spots as characters in the map's picture (too few characters left, and a spot is a
place to stand, not ground).

**Why:** the plan's "tiles redrawn with auto-tiled edges (paths, water, cliffs)", with a new
ground a function and a palette rather than a sheet of tiles, and a town that can be re-laid
without breaking its neighbours.

## 94. The town is re-laid as a 40×50 hub, and her garden moves with it in save v15

**2026-09-28 · Claude, in phase F · builds on 78**

The town grows from 30×48 to 40×50. Her house and the farm are top-left, the lantern-lit square
with the well in the middle with Cobweb Corner, the Muse and Crumbs & Curios round it, the
graveyard garden bottom-left, and a park bottom-right round the pond, with the fountain that lights
up at night in the middle and the big willow on its bank (personal_touches.md, "After phase E").
A lookout sits up a cliff at the top, reached by steps, where the way to the castle hill will open
(phase I). The main road runs east out to Whisperwood. Each building stands in room for the one
phase G draws, 4–6 tiles wide, with its door on the same tile, and the meadows west and east are
left open for the neighbours' houses. Save v15 moves the beds she tilled (and what grows in them)
onto the farm, which is the same two rows of eight a little further along, and stands her at her
door if she was in town.

**Rejected:** keeping the 30×48 town and only swapping its art (no room for bigger buildings,
the park or the lookout); a much bigger town (its ground canvas grows with its area: 40×50 at 32
pixels a tile is 7.8 MB, against 5.9 MB before; decision 78's cheap zones are where to grow);
dropping plantings the new farm doesn't have (decision 11: nothing is lost, even on a test save).

**Why:** the plan's F2, "the town re-laid as the hub, with room for the bigger buildings and
exits to the new zones".

## 95. Buildings are built from one kit of parts, in keys that mean the same in every building

**2026-09-28 · Claude, in phase G · builds on 2, 79**

Every building outdoors is drawn at 32 with `Sketch` from one kit (`src/sprites/buildings.ts`):
walls in six textures, sloped and gable roofs, windows in four shapes with their glass and glint,
doors that return where they are, awnings, sign boards and a small pixel lettering for their
names. Each part paints the same keys in every building (a wall's five tones, a roof's, the
trim's, the door's, stone, two accents, leaves, and the glass), so a building is its shape plus a
palette built from a handful of base colours, and one `WINDOWS_LIT` lights every window after
dark. `PropArt.door` records each front door's frame, and a test holds it at least 28 by 52 and
centred over a tile at the front. Her house, the shops, the pop-up, the cart and the neighbours'
houses (`houses.ts`, `shops.ts`, `neighbourHouses.ts`) are each a function of a page or so.

**Rejected:** one grid recoloured per building, as version 0 did (the plan asks for every
building its own exterior); typing each building's grid by hand (a 176×184 grid is 32,000
characters, and ten of them couldn't share a fix); a building's own keys for its own parts (every
building would need its own glow palette and outline map, and a fix to the windows would be ten).

**Why:** the plan's "every building redrawn with its own exterior (no more one grid in three
colours)", at a cost that lets phase H's interiors and phase T's newcomers' houses come from the
same kit.

## 96. Each neighbour has a house in town, shut until phase H, and Cody lives next door

**2026-09-28 · Claude, in phase G · builds on 16, 94**

Maude, Rufus, Agatha, Barty and Cody each have a house in town, drawn after its owner:
Maude's gothic library up by the lookout, Rufus's thatched log cabin and Agatha's witch-hat
cottage in the west meadow, and Barty's potting cottage and Cody's gothic manor along the road
below the cliff. Wrapunzel lives over Crumbs & Curios. Whose house is whose is a row in
`src/data/houses.ts`; walking up to one names it and finds a note on the shut door (`shut`),
since going in is phase H's. Skelly says his name the same way, and the farm sign's line joined
them in `arrivalToast` rather than as another case in `main.ts`. Cody has a house of his own, as
the game has always had him (he "hears it from next door" when she dances).

**Rejected:** houses only once phase H has insides for them (the plan draws the exteriors here,
and the town needs them to look lived in); houses in a zone of their own (a neighbourhood she
has to travel to, when the town was re-laid with meadows for them); Cody living with her (the
game's Cody is her neighbour, with his own schedule round town; the user can say otherwise).

**Why:** the plan's "each neighbour's house after its owner", ready for phase H to open.

## 97. The pots by her door bring the next plant round each time she walks up

**2026-09-28 · Claude, in phase G · builds on 11**

The two pots by her front door (personal_touches.md, "After phase F") hold one plant between
them, kept by the `Porch` and saved from v16: orange mums to start, then plum mums, succulents
and little hostas (`src/data/porch.ts`). Walking up to either pot puts the next one round in both,
with a `potted` moment. Every plant is hers from the first day.

**Rejected:** a sheet to pick from (a whole sheet for four choices; phase M's collection
component is the place for a bigger outdoor decorating choice); plants bought at a shop first
(nothing to find, for something that's just a nice touch); each pot on its own (a mismatched
pair by the door by accident, from a mistap).

**Why:** "pots she can change: the mums to start, and other potted plants she can swap in", at
the smallest size that does it; a new plant is a row and a shape.

## 98. The insides of buildings are places of their own, laid out as rows, and she comes out at the door

**2026-09-28 · Claude, in phase H · builds on 78, 90**

Every building in town has an inside: Cobweb Corner, the Muse, Crumbs & Curios, and each
neighbour's home. Each is a zone (`InteriorId`, part of `ZoneId`), a row in `ZONES`, and a room
laid out in `INTERIORS` (`src/data/interiors.ts`): its size, its paper and floor, what stands in
it, and a line she reads on coming in. The town's `doors` lead in; the mat inside the door leads
back out, and she comes out on the tile in front of that building's door (`doorStep`, from the
door's column in `PROP_FOOTPRINT`). A room is fixed: `RoomZone` walks it, and `RoomView` draws
it, sharing the walls, floor and furniture placing with her home (`render/room.ts`), whose walls
are now drawn at 32 round the old paper and boards. Going into a building is not finding a place:
buildings aren't on the world map, and being inside one counts as being in the town outside
(`outsideOf`). Her neighbours stay outdoors for now; being at home in their houses by the hour is
phase S's schedules.

**Rejected:** one scene type for every room, her home included (hers is decorated and grows, and
a building's is neither, so the one would carry both sets of rules); drawing the insides in the
town's map (the town's ground canvas would grow, and a door is how the game has always done it);
coming back out onto the map's spawn, as her home did (every building would put her at her own
door); neighbours home by the hour now (their walks through doors are a change to every schedule,
which phase S makes anyway).

**Why:** the plan's phase H, "an interior scene per building, generalised from her home's", with a
new building's inside a row and a picture.

## 99. What stands in a building for good is a fixture, drawn at 32, and the sheets open inside

**2026-09-28 · Claude, in phase H · builds on 95**

Counters, shelves, the salon chairs and mirrors, the oven, the museum's cases and a signature
piece in each home (Maude's bookshelves, Rufus's flower buckets, Agatha's great cauldron, Barty's
potting bench, Cody's pipe organ) are `FIXTURES`, not furniture: never hers, never sold, drawn at
32 from the building kit's materials (`src/sprites/interiors.ts`). A fixture either says a line or
`opens` a sheet: walking up to Cobweb Corner's counter opens the shop, her salon chair the salon,
and any of the museum's six cases (a family each) the museum. Walking up to those buildings
outside now goes in, where it used to open the sheet at the door. The cases show each critter
she has donated in a nook behind their glass. The rooms are furnished with her own furniture's
pieces as well, still drawn at 16 until phase J.

**Rejected:** fixtures as unpriced furniture (every rule and test about furniture would need a
third kind that isn't hers, and they'd be the only furniture at 32); keeping the sheets at the
doors with the insides only to look at (then nothing inside is worth walking up to).

**Why:** a shop you walk into and a counter you walk up to is how every cozy game's town works,
and it makes the insides worth visiting.

## 100. Each neighbour's home has two keepsakes she can have one like, at two and five hearts

**2026-09-28 · Claude, in phase H · builds on 58**

In each neighbour's home (Wrapunzel's in her bakery) two pieces are keepsakes: floating candles
and a wingback chair at Maude's, a bucket of roses and a paw-print rug at Rufus's, a potion shelf
and a witch-hat lamp at Agatha's, a seedling tray and a skull planter at Barty's, a cupcake tower
and a mummy teapot at Wrapunzel's, and a velvet settee and a stained-glass bat at Cody's. Walking
up to one says whose it is and that they might let her have one like it; from two hearts (the
first) and five (the second) walking up to it puts one just like it in her storage chest, once,
with a fuss. Save v17 keeps which she has been given. Cody is her husband, so his line says he's
saving one for her rather than waiting to be friends.

**Rejected:** posting them by letter at the milestones (the letters at three, six and ten hearts
already do that, and a piece seen in their home first is the point of it); selling them once a
friendship allows (paying a friend for their furniture isn't cozy); saying the hearts needed (a
friendship isn't a sum; the talk sheet shows the hearts).

**Why:** the plan's "items only friendship with them unlocks", in the houses themselves.

## 101. Her pin-up portrait in the Muse is painted from her look as it is, and the salon is black and gold

**2026-09-28 · the user (the portrait, black and gold); Claude (how) · builds on 27, 99**

The user asked for a wall painting of Seana as a pin-up girl in the Muse, with black and gold
decorations, "maybe modifiable later" (personal_touches.md, "After phase H"). The portrait is a
wall fixture (`pinUpPortrait`): a gold frame round a black-and-gold sunburst, and her painted
into it by `RoomView` from her doll in a new `pinup` pose (a hand behind her head, the other on
her hip, and a wink), in whatever she's wearing and however her hair is now. The salon's chairs,
dryers and basin are black and gold, its walls a black-and-gold damask (also sold at Cobweb
Corner, so she can have it at home), with gold candelabras either side.

**Rejected:** a fixed painting of her first look (it would stop looking like her the first time
she restyled, and "modifiable" is better met by it following her); a piece of furniture she could
move home (it's the salon's, as its advertisement; one for her home can come later as a row);
the `pinup` pose as an idle she falls into (it's for the portrait; her idles stay her own).

**Why:** her salon should have her on its wall, and a portrait that restyles with her is one she
changes by playing.

## 102. Each place outdoors deals its own critters, and a critter says where it lives

**2026-09-28 · Claude, in phase I · builds on 63**

A critter row names the places it lives (`where`): most of the town's live in one or two of the
new places too (the velvet bat in the woods and at the castle, the lily frog at the shore and in
the clearing), and nine new ones live only beyond the town, two of them in one place only (the
wishing moth in the hidden clearing, the monarch at the castle). Each place's habitats are found
from its map as the town's are (`placeHabitats`), with a new one, beside a clump of toadstools,
and each place deals its own five an hour from the day key and its name, so the woods and the
town differ at the same hour. A catch outside the town is keyed with its place, as a tree is.
`Collecting` holds every place outdoors and is asked for the critters where she is, which closes
"Where it hurts" 2 for critters. The Curiosity Cabinet says where to look, the clearing only as
"somewhere hidden in the woods". The museum's cases hold six each (three a shelf), and
Wrapunzel's last letter comes with all 28 on show; the monarch sits with the moths ("Moths and
butterflies"), so the museum still has six cases.

**Rejected:** a second `Collecting` per place (the net, the takings and the museum are one);
every critter in every place its habitat is (the new places would be the town again); a seventh
museum case for butterflies (the room was laid out for six, and one butterfly isn't a family).

**Why:** the plan's "their critters", and a reason to go to each place at each hour.

## 103. The castle opens with a key buried in a secret clearing, dug up once and for good

**2026-09-28 · Claude, in phase I · builds on 91 · the name, the user's to change**

The plan's secrets, chained: a trail of toadstools in Whisperwood leads to a gap in the thicket,
the hidden way to the hidden clearing, which is a `secret` place (the world map shows no question
mark down the way to it until she has been). In the middle of its ring of toadstools is a mound;
walking up to it digs up the castle key (`BURIED` in `src/data/buried.ts`, the `Digging` service
over a `Dug` keeper, save v18), which opens the castle hill (`unlock: { has: 'castleKey' }`), and
the gate's hint says where to look: "deep in Whisperwood where the toadstools grow in a ring".
What's dug up is remembered apart from the key, so a mound never fills back in. The castle is
Castle Mac-A-Boo, after Mac-A-Cheek, one of the two castles at the place they were married (the
venue's own name stays out of the code, as the user asked; it can be changed). Cody writes the
first time she gets there. Monarchs are everywhere up there: resting on the castle and the wedding
arch, on its gateposts, catchable in the garden, and fluttering about by day, drawn only
(`butterflies` on a map), since a cloud of them to catch would make the net the point.

**Rejected:** the castle open from the start (their wedding castle should be found, and the plan
asks for a locked gate and a buried thing); the key given by a neighbour at some hearts (a secret
she finds herself is the point of this phase); a shovel to dig with (another tool for one hole);
"dug" read from whether she has the key (a sold or given key would fill the hole back in); the
castle's inside now (its hall is better with phase U's anniversary, or when she can do something
there).

**Why:** the plan's I2, "the castle hill and a secret place", and "a hidden path, a locked gate, a
buried thing, a critter found in one place only".

## 104. A gate hangs one tile in from a way out, and stands in the way while the place is shut

**2026-09-28 · Claude, in phase I · builds on 90**

A way out can have a `gate` (the castle hill's, both ends). The gate hangs across the tiles just
inside the edge, between two posts, since nothing on a map's very edge can be seen (the camera
stops at it). While the place beyond is shut, the gate is a thing standing in the way
(`MapZone.shutGates`, a `gate` prop never written in a map): the tiles under it can't be walked
on, and walking up to it is the `shut` moment with its hint, as arriving at the frozen creek is.
Once the place opens the gate is drawn swung back against its posts, and the way is open.

**Rejected:** a gate on the edge row (only its foot would ever be seen); a gate drawn over walkable
tiles while shut (she'd seem to walk through a locked gate to be told it's locked); exits away from
the edge (every rule about ways out, landings and the tests that hold them assumes the edge).

**Why:** the plan's "a locked gate", in a way any way out can use.

## 105. Furniture is drawn in the building kit's materials, and her lamp is hers from the first day

**2026-09-28 · Claude, in phase J · builds on 95 · the lamp's place, the user's to change**

Every piece of furniture, and the walls, floors, door mat and storage chest, is redrawn at 32 the
way phase H drew the fixtures: a shape painted in the building kit's material keys and a palette of
a few base colours (`buildingPalette` with fire, `palette` in `src/sprites/furnish.ts`), finished by
`finish`'s soft outlines. The helpers every indoor thing shares (`slab`, `bevelIn`, `ball`,
`candle`, `frame`, `pot`, `column`, `bat`) live in `furnish.ts`. `slab` bevels only its own box, so
two blocks of one material stay two (the kit's `bevel` works on every pixel of a key). A wall or
floor is drawn over three tiles and folded onto one (`tile` in `src/sprites/surfaces.ts`), so a
motif across an edge repeats. The pieces the shops sell and her first day's moved to
`src/sprites/pieces.ts`, and the surfaces to `surfaces.ts`, which closes "Where it hurts" 6 for
furniture. Item icons stay at 16: they read well in the sheets.

Her floral stained-glass lamp (personal_touches.md, "After phase I") stands beside her pumpkin
armchair from the first day, as a reading lamp, and no shop sells it. Save v19's step puts it in
the storage chest of any home furnished before it, since a room already arranged has no spot kept
for it.

**Rejected:** grids typed a pixel at a time at 32 (four times the pixels of version 0's, and a
recolour would be a retype); a palette of hand-picked keys per piece (the kit's keys already mean
light, fill, shade and outline, and `finish` knows them); the lamp on Cobweb Corner's shelves (a
thing from the user should be hers, not a purchase); placing it in an old save's room (where a
piece goes is hers to decide, and any tile might be taken).

**Why:** the plan's phase J, "furniture and made-only pieces redrawn for the bigger rooms", and the
lamp the user asked for, glowing after dark like the windows.

## 106. The sheets' Apis are built in `wiring/`, and an arrival is a handler per kind of visit

**2026-09-28 · Claude, in phase K · builds on 83, 84 · open to change**

Phase K's review moved two things phase A had marked as hurting. The Api adapters and the routing
of moments to cues, sheets and toasts left `main.ts` for `src/wiring/` (`sheetApis` in `apis.ts`,
`playMoments` in `moments.ts`), a layer of its own that, like `main.ts`, may import anything:
the adapters join the world's services to `render/`'s drawing and the sound. `main.ts` keeps the
loop, the save, the views and touch. In the world, a visit carries its `kind`, and `World.arrivals`
is a table with one handler per kind, typed over every kind, so a new one fails to compile until
it says what arriving does.

**Rejected:** the Apis under `src/hud/apis/`, as phase A's note suggested (the HUD would then
import the World and the renderer at runtime, which the layers forbid it); an Api file beside each
sheet (the same problem, a dozen times); an `Arrivals` class of its own (it would need nearly every
service and her movement handed in, a second World by another name); a `Map` of handlers keyed by
string (it can't check that every kind has one).

**Why:** the plan's phase K, "fix what drifted before the second half builds on it". Phases L to R
add sheets (the collection UI, the calendar, fishing, cooking) and kinds of visit (a fishing spot,
a stove), and each would have landed in the two longest methods in the game.

## 107. The weather is the day's, from its key: rain waters the garden, and two critters wait for theirs

**2026-09-28 · Claude, in phase L · builds on 4, 11, 63 · open to change**

A day is clear, rainy or foggy, dealt from its day key (`weatherOn` in `src/systems/weather.ts`,
about three days in twenty each for rain and fog), the same all day and in every place, and always
clear on her special days. Nothing is saved: the key is the weather. `world.weather` (`Forecast`)
says what today is, and tells her once, the first time she steps outdoors on a rainy or foggy day
(kept only while the game is open, so a reload says hello again rather than nagging).

What it changes: rain waters every bed, so her can has nothing to do that day and each rainy day
since planting counts as a watering (`rainsOn` in `systems/farming.ts`); frogs and fish are
likelier in rain and orbs and moths in fog (`WEATHER_WEIGHT`, by family); and two new critters come
out only in their weather, the raindrop frog in rain and the veil moth in fog, so the museum's
cases have a third shelf and Wrapunzel's last letter comes at thirty. Outdoors, rain falls and
splashes, fog drifts, and the light is greyed a little with the lamps and windows lit at every
hour (`render/weather.ts`). `?weather=rain|fog` draws one on any day, as `?hour=` does the night.

**Rejected:** weather by the hour or the window (a day of it is easier to notice and plan round,
and phase N's windows can split it later); rain that stops her gathering or wilts anything (cozy
rules, decision 11); weather saved in the save (it would need a migration to say what the key
already says); a critter out only on one weather _and_ one hour (one that rare would be a chore);
a weather icon in the HUD (the town shows it, and the toast says it).

**Why:** the plan's phase L, "rain and fog days from the day key, which change what's out".

## 108. What moves outdoors is drawn over the baked ground, and the clutter that doesn't is baked into it

**2026-09-28 · Claude, in phase L · builds on 23, 85, 86, 93**

Everything phase L adds that moves is drawn each frame over the baked ground, only where the
camera is, and the ground is never baked again (`render/life.ts`): glints on open water and ice,
tufts of long grass on about one grass tile in four that lean as gusts cross the place, and smoke
from the chimneys a building marks with `smoke` on its art. Clutter that doesn't move is baked
into the ground once, by each place's rules (`data/clutter.ts`: fallen leaves under trees, pebbles
on paths, lily pads, twigs), placed by tile hash. Clutter that stands (bushes, stumps, logs,
benches, signposts, barrels, a hay bale, the scarecrow) is props placed by hand in the maps, solid
like any prop. The last of version 0's props were redrawn at 32 at the same time, so the bridge of
decision 86 is gone: nothing in the world is baked at 2× but item icons and the pets' bubbles,
which stay at 16 on purpose (decision 105) and go through `bakeIcon`.

**Rejected:** re-baking the ground each frame or on a timer (the town's is 1,280×1,600); animated
tiles in the terrain pieces (every tile would be drawn each frame); scattering standing clutter by
hash (it would land in doorways and on the ways she walks, and the maps' tests couldn't see it);
leaves as a prop (hundreds of drawables for something flat).

**Why:** the plan's phase L, "clutter and small details in every zone; water shimmer, chimney
smoke, swaying grass", within the frame budget: measured beside `main`, a clear day costs a few
milliseconds of draw at 4× throttle, a rainy one about 12% and a foggy one about 19%.

## 109. One sheet design, one collection, and "new" marks worked out by comparing

**2026-09-28 · Claude, in phase M · builds on 33, 106 · open to change**

Every sheet is built by `openSheet` (`src/hud/dom.ts`) the same way: a head that stays put (its
title, a line, and whatever should stay in sight: her Candy, a search box, the filters), a body
that scrolls, and a foot with what can be done and the button that closes it last. The bag, the
closet, the storage chest, the Curiosity Cabinet and the workbench are one component
(`src/hud/collection.ts`): a grid of slots or a list of rows, filter chips (only those with
something under them), an order she can change (by kind, which is the collection's own order,
new first, A to Z, most first), a search box once there are twelve or more, and a little "new"
on anything that arrived since she last looked. How she last filtered and sorted each is kept
while the game is open. Every icon is drawn at 1× and scaled by the largest whole number that
fits its box (48 for a slot, 64 for a row), so a 16-, 24-, 32- or 64-pixel grid is always whole
pixels; a critter's icon is now its 24-pixel art from the town, not the old 16-pixel grid.

What's new is `world.novelty` (`Novelty`): it keeps what was on each collection and, when one
changes, marks what wasn't there before, until she opens that collection and closes it again.
The marks are saved (save v20), so a gift that comes while the game is closed is still new when
she looks. Nothing that gives her things knows about it.

**Rejected:** a timestamp on every bag stack, closet piece and recipe (five save shapes to change
for one badge, and "newest first" would have been the only use); marks set by each service as it
gives something (a dozen places to remember, and one forgotten is a badge that never shows);
marks kept per phone like the sound switches (a restored backup would lose them); clearing a mark
as each slot scrolls into view (hard to be sure she saw it, and it flickers); a tab per shelf, as
the closet and workbench had (they don't scale past five or six, and filters can be searched).

**Why:** the plan's phase M, "one collection component (scroll, sort, filter, search, 'new'
badges) for the closet, bag, furniture storage, cabinet and recipes; one sheet design for every
HUD sheet". Sorting by colour or by favourite waits on the user's answers (questions 4 and 5).

## 110. The quick bar holds one thing, never stops her doing anything, and follows what she does

**2026-09-28 · Claude, in phase M · builds on 11, 37, 109 · open to change**

Outdoors, a bar along the bottom (`src/hud/QuickBar.ts`, through `QuickApi`) shows what she can
hold: her hands, her net, her watering can, and each seed in her bag. `world.hands` (`Hands`)
keeps what she's holding (save v20). A seed in her hand is planted straight into the next empty
bed she walks up to, tilled first if it's wild, without the seed sheet; she keeps holding it
until it runs out, then her hands are empty. Nothing needs a tool: a tap on a bed still does what
the bed needs, and a tap on a critter still swings the net. What she holds follows what she does
instead: watering picks up the can, and a swing the net, unless she's holding a seed. What she
holds is drawn in her hand at 1× (the doll's density), behind her when she faces away, and put
away while she dances, poses or swings.

**Rejected:** tools that gate their action (a tap on a bed with the net doing nothing is a
punishment for a wrong pick, decision 11); the bar indoors (nothing there uses it, and the decor
bar has the bottom); a seed held by the HUD only (a reload would drop it, and the world's rule
that plants it couldn't be tested); a fixed number of slots she arranges herself (too much to
manage for three tools and a few seeds; phase P's rows and phase Q's rod can revisit it).

**Why:** the plan's phase M, "a quick bar for what she's holding (seeds, can, net, rod)". The rod
is phase Q's, and planting a whole row from the bar is phase P's.

## 111. Three windows a day: what she gathers and the special come back each, and the rest keeps its day

**2026-09-28 · Claude, in phase N · builds on 4, 35, 42, 81 · open to change**

The windows are the morning (5am), the afternoon (noon) and the evening (6pm, until the day turns
over at 5), worked out from the clock (`windowOf`, `windowKey` in `systems/clock.ts`, the type in
`data/windows.ts`). What refreshes each window: the trees, rocks, flower patches and toadstools she
gathers (`Takings` now remembers the window a thing was taken in, `2026-09-28@morning`), Cobweb
Corner's special (a shelf dealt each window, a quarter off, its full price struck through), and
the notes on the noticeboard (decision 113). What keeps its day: the rest of the shops' stock
(what she saw in the morning is still there after lunch), the night's snack and Fibi's bone
(`onceADay`), the pop-up and the Moon Pie Man, the weather (decision 107), a neighbour's talk, gift
and favour, and the crops, which still count mornings (decision 38). The critters were already
dealt each hour, finer than a window, and stay so. A resting tree says when it's back ("More this
afternoon!"), and when a window turns while she plays she's told, once, with a soft chime (a
`window` moment); one that turned while the game was closed needs no word.

Nothing new is saved: a save from before kept bare day keys in `taken`, which are simply never
this window, so the first load after the update finds everything ready once (generous, never a
loss), and the bone, compared by its day, stays found.

**Rejected:** refreshing the whole shop each window (a thing she meant to come back for would be
gone by lunch); a window's gathering that has to be collected before the next or it's lost
(decision 11); windows at other hours, or four of them (the user settled three, decision 81);
counting crops by the window (it would make three harvests a day and unbalance Candy);
migrating old takings to window keys (a step to write for one generous reload).

**Why:** the plan's phase N, "the three windows (decision 81) and what refreshes in each".
Neighbours doing different things in each window is phase S's.

## 112. The calendar is rows with rules, worked out from the day key, and opened from the day's chip

**2026-09-28 · Claude, in phase N · builds on 4, 20, 81 · open to change**

Every day on the calendar is a row in `CALENDAR` (`data/calendar.ts`): her special days (from
`SPECIAL_DAYS`, so decision 20's month-days stay the one source), the big holidays (New Year's
Day, Valentine's, St Patrick's, Easter, the Fourth of July, Halloween, Thanksgiving, Christmas
Eve and Day, New Year's Eve) and the town's own events. Each has a rule (`When`): a fixed date,
the nth or last weekday of a month, days from Easter (the Gregorian computus), each full moon (the
day whose noon, in UTC so every phone agrees, is within half a day of full), or a weekday on a
date. `systems/calendar.ts` works out what's on any day from its key alone, so nothing is saved
and every year takes care of itself.

The holidays are only on the calendar for now; their decorations, events and dialogue are phase
U's. The town's events each do one small thing already: on **market day** (the first Saturday of
the month) Cobweb Corner puts out a market table of three extras (a shelf `on` the event); on the
night of a **full moon** the moths and orbs are three times likelier and the night is brighter
and silver outdoors (`underFullMoon`); on a **lucky Friday** (the 13th, which here is the luckiest
day there is) beads turn up four times as often.

`world.calendar` (`Calendar`) says what today is (its window, weather, what's on, and whether the
pop-up or the Moon Pie Man is in town), a month, and what's coming up. The HUD shows the day as a
chip under her Candy (the window's icon, the date, and what's on), which opens the calendar
sheet: today, a month of days to page through with what's on each marked, a tap on a day to say
what, and the next few days with something on.

**Rejected:** a 📅 corner button (the top-right row is full on a phone at home, with the decorate
button); a calendar on her wall at home only (she should see the day's window anywhere);
holidays saved or fetched (a rule per row needs neither); the pop-up's and the Moon Pie Man's
days shown ahead (they're a nice surprise on the day, and the calendar says so on it); lunar
tables (the mean synodic month is right to a day, which is all a day key can hold).

**Why:** the plan's phase N, "the calendar system (fixed and floating holidays, town events) and
its sheet". The user's answer to question 9 (a town event she'd love) can land as a row.

## 113. The noticeboard: three notes a window from three neighbours, answered from her bag

**2026-09-28 · Claude, in phase N · builds on 11, 59, 81 · open to change**

A noticeboard stands at the top of the square, beside the bench. Walking up to it opens its notes:
three each window, each from a different neighbour, dealt from `NOTICES` (`data/notices.ts`) by
the window key, some only in the windows they fit (a moth to read by in the evening). A note asks
for something she can gather, grow, catch or buy, says it in its neighbour's voice, and shows how
many she has; handing it over (`world.noticeboard.answer`) pays her Candy (30, and half again what
it would sell for) and a little friendship with whoever pinned it (15 points, through
`Neighbourhood.thank`, so a heart it crosses still posts its letter). An answered note is kept in
`Takings` as `notice:<slot>` for the window, so the save didn't change. A note she doesn't answer
is simply taken down at the end of the window: nothing is owed.

**Rejected:** folding the notes into the favours (a favour is one neighbour's, asked in a talk,
once a day; the board is the town's, several at once, per window, and a reason to cross the
square); notes that stay up until answered (the board would fill with what she can't do yet and
never change); notes that ask for things from places she hasn't opened (they'd be a list of what
she can't have); a reward item per note (Candy and a heart are enough, and the shops turn Candy
into anything).

**Why:** decision 81 lists the noticeboard among what refreshes each window, and the plan's list
has "a noticeboard of small requests that refresh each window", which no other phase builds.

## 114. Cody still greets her, and what he says is picked from the day key, the window and time away

**2026-09-28 · Claude, in phase O · builds on 24, 81, 112 · open to change**

Cody stays the one who greets her as she opens the game (decision 24); phase O varies what he
says (`greetingFor` in `systems/greetings.ts`, the lines in `data/greetings.ts`). On one of her
special days it's that day's line, every time. On the first visit of any other day, a holiday or
town event on the calendar gets its own line from him, and on a plain day about one in twelve is
**the red Tesla** (it drives across his greeting, he starts to say something, and her answer is
"Red one! 👊": she always gets him first) and about one in ten **the Pokémon reminder**, both
picked by hashing the day key. Otherwise it's his welcome back: within a quarter of an hour, later
in the same window, a new window (good morning, afternoon or evening, by the window), a few days,
a week, a fortnight. Each list is picked from by the window key, so coming and going within a
window doesn't reshuffle what he said. The greeting card also shows what her visit brought
(decision 115).

**Rejected:** a different neighbour or a pet greeting her some days (decision 24 was the user's
pick for Cody; the user's answer to question 10 can still add one); the Tesla or the reminder on
any open rather than a day's first (it would stop being a surprise); a real red Tesla rolling
through town for her to tap (marked "maybe" in the user's list; it's a later touch, and the
greeting's car is drawn so it could be reused).

**Why:** the plan's phase O, "the greeting system, with weighted variants chosen from the day key
(holiday, the red Tesla, the Pokémon reminder, Cody's usual)".

## 115. A visit is a day she opens the game; each brings a gift, and they count up, never down

**2026-09-28 · Claude, in phase O · builds on 11, 81 · open to change**

Each day key she opens the game on is one visit (`world.visits`, the `Visits` service, save v21:
the count and the last day). The first visit of the game's opening is counted by
`welcome(lastPlayedAt)`, which `main.ts` calls to greet her, so the gift is on Cody's card; a day
that turns over while she plays is counted by `check()` with a `visit` moment and a toast. Each
visit brings a gift worked out from its number alone (`giftFor` in `systems/visits.ts`): a round
of seven (Candy, seeds, a bead, Candy, a snack, seeds, Candy, the seeds and beads taking turns
round to round) and a table of milestones (a welcome treat on the first, furniture at 7, 30, 50,
100, 150, 200 and 365, squishies at 14 and 75, Candy every hundredth past the table). Candy goes
in her purse, items in her bag, furniture in her storage chest.

**Rejected:** a streak or a login calendar that resets (decision 11: a missed day is never a loss,
and the plan says "count visits, never streaks"); a gift she has to go and collect, from the
mailbox say (it would be one more thing to miss); one gift a window (three a day is too many
presents, and the tree already fills each window); clothes as milestone gifts (she may have bought
them already).

**Why:** the plan's phase O, "login gifts by visits".

## 116. The candy tree fills by windows up to a week's, and the honesty stall sells four a window

**2026-09-28 · Claude, in phase O · builds on 4, 11, 42, 81, 82 · open to change**

Decision 82's passive Candy. **The candy tree** stands in her front yard (`J`), a little round
tree on a candy-cane trunk hung with sweets. It grows 15 Candy a window since she last shook it
(`windowsBetween` in `systems/clock.ts`), up to a week of windows (21, 315 Candy), and walking up
to it shakes it all down (`world.candyTree.shake`, a `shook` moment); a tree nobody has shaken yet
holds three windows' worth, so the first shake finds something. It's drawn bare, with a few sweets
or laden, and wiggles as she shakes it. Save v21 keeps when she last shook it.

**The honesty stall** stands outside the farm gate (`EE`). Walking up to it takes the Candy in its
tin (a `stallSold` moment, what sold and for how much) and opens its sheet: what's on it, taken
back with a tap, and what she grows in her bag, put out with a tap. It takes only harvests (the
rare ones too), 24 things at most, and sells four things a window, what she left longest ago
first, at Cobweb Corner's price, worked out from when its sales were last worked out
(`settleStall` in `systems/passive.ts`), never ticked while the game is closed. It's drawn with its
crates heaped while anything is on it. Save v21 keeps its stock, what sold since she last came
by, and the tin.

**Rejected:** a tree that fills without end (a month away would be a thousand Candy, more than the
game's prices are balanced for; a week's cap still greets her back from a long trip with a laden
tree); a tree that has to be shaken each window or loses it (decision 11); a stall that sells only
while the game is closed (the windows are how everything else refreshes, and a rule on
"closed" would need the time she left); selling at more than the shop pays (the stall's gift is
that it sells while she's away, not a better price); flowers she picks wild on the stall (it's the
farm's).

**Why:** decision 82, and the plan's phase O, "the candy tree and the honesty stall". The user's
answer to question 12 (which candy, what the sign says) can change the sweets, the sign, and what
the stall takes.

## 117. CI runs once a PR is ready, not on every checkpoint push to a draft

**2026-09-29 · Claude, at the start of phase P, for the user · builds on 3 · open to change**

The repo is private, so GitHub's free plan meters its Actions minutes (2,000 a month), and every
push to a phase's PR ran three jobs (gates on Node 22 and 25, and smoke), each billed rounded up to
the minute: about eight minutes a push, 237 runs in the three days to phase O. The checkpoint rule
pushes every half hour, so most of those runs checked work that was already checked in the
container. Now a **draft PR runs nothing**. Every check (lint, format, typecheck, tests, build and
smoke with the container's Chromium) is run in the container before each push, as it always was,
and CI is the confirmation, **once the PR is marked ready** and on each push after that. Gates and
smoke are **one job** on Node 22 (one `npm ci`, one minute rounded up); Node 25 runs on a push to
`main` or by hand (`workflow_dispatch`). Vercel was already cut to `main` only (`vercel.json`).

**Rejected:** making the repo public for unlimited minutes (her personal touches are in it); a
path filter for docs-only pushes (a PR's paths are its whole diff, so it never skips mid-phase);
dropping CI on PRs altogether (the merge into `v0.1-dev` or `main` would be unchecked by anything
but the session that wrote it).

**Why:** the user, 2026-09-29: "running into issues with our free tiers of GitHub actions and
vercel deploys".

## 118. A tap on a bed looks first; the second tap does what the pop-up said

**2026-09-29 · Claude, in phase P · builds on 11, 37, 110 · open to change**

The user asked for farming that explains itself: "more information on a tap, a pop-up, and easier
planting". The first tap on a bed now does nothing to it and doesn't walk her anywhere: it puts
up a small card (`src/hud/BedCard.ts`, through `BedApi`) saying what's growing, when it will be
ripe, whether it has had a drink today and from what (her can, the rain, a sprinkler), and what a
tap will do, as its button. A second tap on the same bed, or the button, walks her up and does it.
A tap anywhere else takes it down. What the card says and what the visit does come from one rule,
`bedAction` in `systems/beds.ts`, so they can't disagree. `world.garden.looking` is the bed it's
about (the `bed` event), and `world.tendBed` walks up to do a job there.

The card sits over its bed when there's room, and otherwise (the farm is at the top of town, so
usually) docks above the quick bar, with brackets round the bed so it's clear which it means. It's
hidden until it's placed and ignores taps for 400ms, because a phone sends a tap's click after the
finger lifts and it mustn't land on a button that wasn't there. Toasts go along the bottom while
she's in the top part of the screen, so they don't cover the bed she just tended.

**Rejected:** acting on the first tap and saying what happened after (that was version 0, and it
tilled or watered before she knew it would); a long press for the card (nothing on a phone says a
long press is there); a card only once she has walked up (a walk before she knows what it's for);
skipping the card when a seed or the can is in her hand (one rule for every bed is easier to
trust than one that changes with the quick bar).

**Why:** the user's note for 0.1 (`personal_touches.md`, "Version 0.1"), and the plan's phase P,
"a tap always says what it will do before it does it".

## 119. A sprinkler stands in a bed's corner and waters that bed and every bed touching it

**2026-09-29 · Claude, in phase P · builds on 4, 11, 38 · open to change**

A sprinkler is made at the workbench from 6 stone and 3 wood, a recipe known from the start, and
is an item in her bag (a new kind, `gear`, on the Crafts shelf). Held on the quick bar, it goes in
the back corner of whichever bed she walks up to, whatever is growing there, and waters that bed
and the eight around it (`SPRINKLER_REACH`) every day from the day it went in. Three, well placed,
water all sixteen beds. Nothing ticks: the `Farm` keeps each sprinkler's bed and the day key it
went in (save v22), and growth counts a sprinkled day as it counts rain, from the next morning
(`growth` in `systems/farming.ts`), never twice with the rain or with the day she watered by hand
before fitting it. A sprinkled bed needs no can. The card on a bed with one offers to take it out,
and then each day it watered becomes a watering of that crop's own (`keepSprinkling`), so nothing
it grew is undone. A sprinkler in a bed the map no longer has goes back into her bag.

**Rejected:** a sprinkler that takes up a bed (she'd lose beds for it); one on the path (the path
round the beds is how every bed is reached, decision 37); watering from the next morning only (she
would see a thirsty bed under a sprinkler she had just put in); a sprinkler that waters on a
schedule while the game is open (decision 4); sprinklers bought rather than made (the plan says
from the workbench, and stone and wood are what she gathers most).

**Why:** the plan's phase P, "sprinklers from the workbench". Growth is unchanged (decision 38):
a sprinkler waters, it doesn't speed anything past what her can would.

## 120. With a seed in her hand, the card offers to plant the whole row

**2026-09-29 · Claude, in phase P · builds on 110, 118 · open to change**

When the seed in her hand would go into a bed, its card also offers "Plant the row (n)": the empty
beds in that bed's row either side of it, the nearest first and left before right, tilled as it
goes, as far as her seeds go (`rowToSow` in `systems/beds.ts`, a `sowedRow` moment). Only when
more than one bed would be planted. The seed stays in her hand until it runs out, as before.

**Rejected:** the whole farm at once (more than she might want of one crop); a drag along the beds
(hard to get right on a small screen, and nothing else in the game drags); watering a row with the
can (the sprinklers are for that, and a row of seedlings a day needs no can).

**Why:** the plan's phase P, "planting a row from the quick bar", and the user's "easier planting".

## 121. Fish are critters caught on a rod: a shadow, a cast, nibbles, and a bite that comes round again

**2026-09-29 · Claude, in phase Q · builds on 4, 11, 62, 102, 110 · open to change**

Every fish is still a row in `CRITTERS` (family `fish`), so her bag, the Curiosity Cabinet,
Wrapunzel's museum and the save take them unchanged, and no save version moves. What changes is
how they're caught. They are dealt into each place's water apart from the net's critters, into
slots of their own after them (`FISH_PER_HOUR`, three, and one more in the rain, which they love;
the net's critters are four an hour now, since fish no longer take their slots). In the water a
fish is only its shadow (its shape in the pond's deepest colour, a small one its 16-pixel shape)
with a ring on the water now and then so it can be found; what glows on it still glows after dark.

A tap on a shadow, with anything in her hands, walks her to the bank beside it and casts her rod
(a tool on the quick bar, from the first day, like the net). From the float landing, the fish
takes an interest in rounds (`roundOf` in `systems/fishing.ts`): a wait of one to two and a half
seconds, up to two nibbles that dip the float (two more for a rare, wary fish), then a bite, the
float under and a "!" over her head, for 1.5 seconds. A tap anywhere on the bite lands it. A tap
earlier reels in empty, the fish still there to cast to again; a bite let go is followed by
another round, forever, and she's told so once. Every round is worked out from the cast's time and
the fish's key, never rolled or ticked; walking off, or the hour turning, brings the line in.

Four new fish make nine, a full museum case: the pumpkinseed, the black catfish, the fog eel (fog
only) and ✦ the rare **blue moonfish**, after dark at Lantern Shore, told like the blue rose.
Wrapunzel's last letter comes at 34 kinds.

**Rejected:** a separate `FishId` and table (the Cabinet, museum, bag and save would each need a
second path for the same thing); netting fish as before (the plan asks for a rod); a timing bar or
a tug of war (the plan's "a forgiving catch"; tapping on the bite is the whole of it); a fish that
swims off after a miss ("retryable forever"); fish drawn whole in the water (the shadow makes
reeling one in a small surprise, and the Cabinet still says what's where); casting into empty water
(nothing would bite, and a tap on water already walks her to its edge).

**Why:** the plan's phase Q: "a rod, fish as data (windows, zones, weather, rarity), a forgiving
catch (tap on a bite, retryable forever), fish in the cabinet and museum, ✦ a rare blue fish".
Question 17 (the water creature she adores) may yet rename or redraw the rare one.

## 122. Dishes are stove recipes; eating one does a small thing until the window turns

**2026-09-29 · Claude, in phase R · builds on 4, 11, 52, 81, 110, 121 · open to change**

Cooking is crafting at another station. A dish is a `RECIPES` row with `at: 'stove'` that makes an
item of the new kind `dish`, so it's learned, sold as a card (on a Cobweb Corner shelf of its own,
the Cookbook), marked new and saved exactly as the workbench's recipes are, and the stove's sheet
is the workbench's with another title (`openStove`). Her recipe book stays on the `Workbench`
(`known`); `world.kitchen` (`Kitchen`) lists the stove's and cooks them. A need at the stove can be
**any fish, any crop or any snack** as well as a named thing (`Need` is `{ item }` or `{ any }`):
`reckon` in `systems/crafting.ts` sets the named things aside first, then takes the cheapest she has
of the kind, and what she has most of, so a rare fish goes in the pot only when it's all she has.
Her **little black stove** stands beside the workbench from the first day (an old home finds it in
its storage chest, save v23), and Wrapunzel's oven opens the same sheet (`opens: { sheet: 'stove' }`).

**Late-night snackies count:** the night's snacks go into dishes as "any snack", the midnight
snackie plate is cooked only after dark (`night` on its row, `CantMake` `'night'`), a dish cooked
after dark is told as a late-night snackie, and a snack or treat can be eaten from the bag.

Eating is a button in the bag. Each dish has one **effect**, lasting from when she ate until the
window turns (`lasts` in `systems/cooking.ts`, from a stored time, never ticked): **pep** (she walks
35% quicker, `Movement.step`'s `pace`), **bites** (the fish bite sooner and hardly nibble, fixed at
the cast) or a **lure** for a family (moth, bat, frog, orb, beetle): one of that family that lives
in the place she's in comes out on its habitat near her, one out at this hour first and then one
she hasn't caught, and is caught once (its takings key is `lure:<when she ate>`). A snack or a treat
is pep. The `Kitchen` keeps when she last ate for each effect (`kitchen` in the save); eating
another of the same kind starts it again. Every neighbour likes a dish (`reactionTo`), and each
loves one or two with a line of their own.

**Rejected:** a separate `DishId` table and sheet (the recipe book, cards, "new" marks and save
would each need a second path); cooking as a timed minigame (the plan asks for cozy, and
nothing else in the game is timed); effects that last a day or stack in strength (one window is a
check-in's worth, and nothing to plan around); a lure that brings out a critter outside its place
(the Cabinet's "where to look" would stop being true); growth or Candy boosts (decision 38 keeps
growth as it is, and a Candy effect would want balancing in phase V); dishes spoiling (decision 11).

**Why:** the plan's phase R: "a stove at home and in the bakery; recipes from crops, fish and
finds; dishes neighbours love, and ✦ small, cozy effects (a snack that lures a critter).
Late-night snackies count." Questions 19–21 (her favourite dish, her late-night snack, a kitchen
thing she'd recognise) may add a dish or redraw the stove.

## 123. Neighbours keep a weekday and a weekend, go indoors, and visit each other and her

**2026-09-29 · Claude, in phase S · builds on 56, 81, 92, 98 · open to change**

A neighbour's schedule is two lists of stops by the hour, **weekday** and **weekend** (Saturday
and Sunday by the day key, so Friday night past midnight is still Friday's), each with a stop
starting in every window. A stop can be **inside** a building (`{ inside, stand }`): at home, at
work (Maude in her library, Wrapunzel behind her counter), or at a shop (Cody among the records
at Cobweb Corner, Agatha at the Muse). Each room has `stands`, the places people stand in it, the
first for whoever keeps it, all clear of the mat and of anything she'd tap. They're drawn in
every view, and tapped and talked to indoors as outdoors. At noon at the weekend everyone is out
in town, so the square is lively.

**Visits** are dealt from the day key (`visitsOn`), a few hours in each window (9–11, 2–5, 7–10,
never at noon or across midnight): in about two windows in three one neighbour calls on another,
standing beside them wherever the host is and turned to them; and once a day, in one window,
someone **pops round to hers**, waiting just inside her door, with a line of their own for when
she finds them (`dropsBy`, once a visit). Nobody is a guest and a host at once, and there are no
visits on her birthday, when everyone is at the party. Nothing is saved: where anyone is comes
from the hour and the day key (`whereabouts` in `systems/schedules.ts`), and `Neighbourhood`
places guests after everyone else so no two share a tile.

Neighbours walk in and out through the doors she uses: to a building's door step and gone, in on
a room's mat; their paths are pulled taut with `stringPull`, as hers are. One she's talking to,
or walking up to, stops where they are (mid-stride if need be) rather than finishing the tile.

**Rejected:** neighbours asleep at home at night (decision 56's reason holds: she may only ever
play late, so everyone is always somewhere she can go and find them, and those at home are
awake); a schedule per window as three separate lists (hours already fall into windows, and the
test holds each window to a stop); visits written into the schedules (dealt by the day key, the
same pair doesn't meet at the same time every week); a guest sent to the host's own house
whether or not the host is in (a visit that finds nobody is no visit); visits to her home
announced with a toast wherever she is (she finds them, or doesn't: nothing is missed, decision
11); saving where anyone is (it's all derived).

**Why:** the plan's phase S1: "a schedule per neighbour for each window, weekdays and weekends,
visiting each other and her". Phase H gave every neighbour a house worth going into; this puts
them in it some of the time. Question 22 (a lazy weekend of theirs) may yet reshape the weekends.

## 124. Happenings, one small event a window, a puff now and then, and lines that read with any name

**2026-09-29 · Claude, in phase S · builds on 11, 111, 123 · open to change**

Her neighbours' **happenings** are rows (`src/data/happenings.ts`: who, which days, the hours,
where, a line each, and maybe a small gift once, kept in `Takings`), worked out from the day key
over their schedules and visits, and under her birthday party: Maude and Agatha's book club in
the library, Wrapunzel's midnight bake, a spell of Agatha's gone mildly wrong, Rufus howling at
the full moon from the lookout, Barty's Sunday seed swap, movie night at Cody's. Nothing about
them is saved.

The town has **one small event a window**, dealt from the window key (`smallEventOf`): about half
the time a neighbour has news (a "!" over their head until she's heard it), otherwise one of them
has lost something in town, which glints where it lies until she walks onto it and carries it
back for a little Candy and friendship. What she's carrying is saved (`errand`, save v24), so a
window turning on the way loses nothing; whether she's heard or found it is kept in `Takings`.

**Anyone can let one go**, not only Cody: a small chance on a talk, never the first of the day,
with each neighbour's own excuses (`puffs`), Cody's still the likeliest, and his keys unchanged
so his fall where they always have. The puff is drawn over whoever it is, indoors too.

**Her name reads right in every line** (the dialogue fix): `fill` tidies stray spaces, gives her
name a capital where it starts a sentence, and says "friend" when there's none; lines where a
two-word name read like one more thing on a list ("Have you eaten, Pumpkin Pie?") put her name
first or after a greeting; and `tests/data/dialogue.test.ts` renders everything she can read with
one-word, two-word, long, lower-case and empty names.

**Rejected:** small events that can be missed or expire with a cost (decision 11: a lost thing
waits, and one she's carrying stays hers to hand back); a timed event queue saved in the save
(derived from the window key instead, as the notices are); happenings as schedule stops (they
come and go by day and hour, and the schedules stay readable); a fart on the first talk of the
day (hello first); lowercasing or "correcting" the name she typed beyond the first letter of a
sentence (it's her name as she wrote it).

**Why:** the plan's phase S2: personal events, random small events, a small chance anyone farts,
and the dialogue fix with its sample-names test.

## 125. Newcomers write a month apart, move in the next day, and live on lots of their own

**2026-09-29 · Claude, in phase T · builds on 4, 11, 91, 92, 95, 98, 123 · open to change**

A newcomer is a neighbour like any other (a `VILLAGERS` row with a schedule, lines, loves,
favours, keepsakes and three rewards) that isn't in town on her first day: its row has a
`newcomer` field with its letter, where it lives, what it waits on and what it says on moving day.
Four for now: **Ollie** the postie (a human, in a red post cottage by the south road), **Nessa**
the shy lake monster who lights the lanterns (a boathouse at Lantern Shore, once she's found the
shore), **Gourdon** the pumpkin-headed carpenter (a pumpkin past the bakery, who only comes in
September to November), and **Hazel** the stargazer, Maude's pen pal (an observatory in
Whisperwood, once Maude is at three hearts).

**One a month:** thirty days after her first day, and thirty after each letter since, the first
newcomer in order who is happy to come that month and isn't waiting on anything (an `Unlock`, as a
place's) writes; one who is waiting lets the next come first. They **move in the next day**. Only
the day each wrote is saved (`newcomers`, save v25, with `since`, the day the month runs from);
who lives here, who's moving in and whether a letter is due are worked out from it
(`systems/newcomers.ts`), looked at once a day. After a long time away only one comes, and the
next a month later: they arrive one at a time, never in a crowd, and nothing is missed (decision
11).

**Lots:** each newcomer's house stands on a lot (`lots` in their place's map), open ground until
then with a "SOON" sign, "SOLD" the day their letter comes, and from moving day their house, drawn
from the building kit, with their boxes stacked by the door for the day. `Lots` makes all of it
solid like the stalls, and the door (in the map's `doors`) goes in like any other. On moving day
they stand by their door and say so first; after it they keep their hours, and pay and get
visits like everyone else (only those settled here are dealt visits: `callers`).

**Rejected:** newcomers by visit count (the plan says a month, and the calendar is the game's
clock); a date fixed per newcomer from her first day (after a long absence several would land at
once, and one waiting on a place would never come); houses written in the map and shut until
their owner comes (four empty houses on her first day, and no moment of it going up); a newcomer
who can leave (decision 11: nobody is lost); a moving van driving in (question 27 may yet ask for
one, or a welcome basket or a housewarming, as the way they arrive).

**Why:** the plan's phase T: "one newcomer a month, humans and monsters, random townsfolk for now;
some arrive only after something happens (a zone opens, a friendship, a holiday). Each with a house
spot, a schedule and a story." Questions 25–27 (a neighbour she'd love, friends or family moving
in, how an arrival should feel) may add a newcomer or change how they come.

## 126. Holidays dress the town for days either side, from the day key, and gather everyone

**2026-09-29 · Claude, in phase U · builds on 4, 11, 93, 112, 123, 124 · open to change**

Each of the eight big holidays has a **set of decorations** (`DECOR` in `data/holidays.ts`), up
for some days before it and after it: Christmas all December (to the 30th), Halloween all
October, the others a few days to a week. Christmas Eve's are Christmas's, New Year's Eve's New
Year's. Which set is up is worked out from the day key (`decorOn` in `systems/holidays.ts`), never
saved; where two could share a day (Easter can come days after St Patrick's), the nearer holiday
wins, and a holiday's own day is always its own. While a set is up, every front door in every
place wears its dressing (a wreath, a heart, a shamrock, a rosette…), garlands of bulbs or bunting
hang between the square's lamps (`GARLANDS`), and one piece stands in the square (`Decorations`, a zone
part solid like the stalls: a spooky tree, a pumpkin tower, a long harvest table…). She's told the
morning a set goes up, the first time she's out in town, and only while the game is open, like the
weather's word. The sky has fireworks on the Fourth and round New Year's midnight, and snow on
Christmas Eve and Day (`SKIES`), drawn only. **Skelly dresses up for Christmas and nothing else**
(a Santa hat and fairy lights, lit after dark): the user's "he does nothing else through the year:
he only dresses up for Christmas". **In winter the park pond freezes over** for skating, their
first date (`FROZEN`, 15 December to 15 January): its water is walked on (`MapZone.isIce`), nothing
is dealt into it to fish, and the view bakes a winter ground once, with the pond as ice.

**Events** are happenings with `on: { holiday }` (decision 124's table), and a new place for them,
`{ party: true }`: everyone round the well at their birthday-party spots. Halloween, Thanksgiving,
carols on Christmas Eve and the countdown are parties; the dip, the Valentine's tea, the jig, the
egg hunt and the fireworks picnic are a few friends at a spot or indoors. A holiday's gathering
comes before any everyday happening it meets (Halloween's party over a Friday's midnight bake).
**Dialogue**: every neighbour has a line for every holiday (`HOLIDAY_LINES`), their first on the
day after her own days' (`dayLine`); on Halloween each also hands her candy corn, once (`treat:`
in `Takings`). **Letters** come on the day (`HOLIDAY_LETTERS`, `holiday:year`): a little spooky
tree for her house from everyone at Christmas, Cody on Valentine's, the mayor at New Year.
**Easter's egg hunt**: eight eggs hidden on grass by the year (`EGG_SPOTS`), found by walking onto
them, kept for the day in `Takings` (`egg:`, once a day). No save version moves.

**Rejected:** decorations saved and put up by her (a chore, and one she'd have to take down);
props written into the maps for every holiday (eight sets of tiles that are only sometimes
solid, and a test for each); every holiday its own event system (a happening already has who,
where, when, lines and a gift); a holiday line that replaces the neighbour's usual pool all day
(once is a greeting, all day is a script); eggs that stay hidden past Easter (a hunt is a day's
fun, and nothing is lost by missing it: decision 11); Skelly in a hat for every holiday (drawn,
then taken out: the user asked for Christmas only); the pond frozen all winter, December to
February (three months of no fishing in town is too long a wait, decision 11), or skating as a
minigame (walking on the ice is the skate).

**Why:** the plan's phase U: "decorations up and down with the calendar, events and dialogue for
the big holidays… Halloween, which is every day here but gets a party… At Christmas her yard
skeleton wears a Christmas hat and is strung with lights", and personal_touches.md, "After
phase D": "the frozen pond for skating is still phase U's". Questions 28–29 (the holiday she loves
most, a decoration from their own home) may add to any of it.

## 127. The castle's hall opens with a heart key buried where the frozen creek bends

**2026-09-29 · Claude, in phase U · builds on 91, 98, 103, 104 · open to change**

Castle Mac-A-Boo gets an inside (personal_touches.md, "After phase I"): its great doors (a door in
the castle hill's map) go into **the great hall** (`castleHall`, a room like any building's), shut
until she has the **heart key** (`unlock: { has: 'hallKey' }`). The key is buried under a mound on
the bank where Whisperwood's frozen creek bends, where they'd have skated on their first date, and
the locked doors' hint says as much ("somewhere you once went skating"). The hall is set for their
anniversary: their wedding cake, a portrait of the two of them in a gilt frame (painted in from
how she and Cody look now, as her pin-up is), a music box with two dancers, and stained-glass
windows of monarchs. The first time she goes in, Cody writes (`found:castleHall`, the first room
with a letter); a room isn't on the world map, so there's no "found" toast.

**Rejected:** the key in the anniversary letter (she'd wait up to a year to go in); the key at the
castle itself (no finding in it); the hall only open on their anniversary (decision 11: nothing is
kept from her by the calendar); a second castle zone outdoors (the hall is a room).

**Why:** the user's "Castle Mac-A-Boo keeps its name, and she should be able to go inside it
eventually: a hall, say, for their anniversary", and "another hidden key: yes". Question 30 (what
she should find inside, and somewhere meaningful for the key) may yet change what's in it or
where the key is.

## 128. What she gathers is small change; Candy comes from growing, catching and her neighbours

**2026-09-29 · Claude, in phase V · builds on 35, 41, 45, 77, 82, 111 · open to change**

Phase V's balance pass measured a round of each place (every tree, rock and flower patch she can
reach, once a window) against the shops' prices. Gathering paid about 16 Candy a tap: a round of
the town, a couple of minutes' walking, was worth 740 (more than any outfit), and a round of
Whisperwood's 175 trees nearly 2,900, so every price in the game was a few minutes away and the
candy tree, the notes, favours and visit gifts were rounding errors beside a forest. The sprinkler
was also worth less than the stone and wood it's made of.

So **raw finds are small change**: wood 2, stone 3, wildflowers, toadstools and milkweed 4, and
the rose bush a rose a window (a bed's harvest takes four days, and the castle's five bushes paid
like twenty beds). That's about 8 Candy a tap everywhere, so a place with more trees is only more
walking. A round of the town is now about 390 (between a squishy and an outfit), a day of three
rounds and the candy tree buys the dearest thing in the shops, and Candy comes mostly from what
takes care: growing (unchanged, about 20 a day a bed), catching, cooking, and her neighbours'
notes and favours, which pay on top of what she hands over. Prices are unchanged. Starting Candy
stays 300 (decision 77).

`tests/data/economy.test.ts` holds the shape, not the numbers: nothing sold is free, nothing
made is worth less than what went in or can be bought, made and sold at a profit, a note or a
favour pays more than it takes, every tap pays about the same in every place, a round of the town
sits between a squishy and twice the cheapest outfit, and the dearest thing is within a day.

**Rejected:** raising prices instead (every shelf re-priced, and the candy tree and gifts, sized
against prices, shrink with them); fewer trees that shake in the wilds (a forest where only some
trees give is a rule she'd have to learn); a daily cap on what the shops buy (a limit is a
punishment, decision 11).

**Why:** the plan's phase V ("a balance pass: Candy, prices, rewards, windows"). Question 33
(saving up for something big, or buying on a whim) is still to be answered: the knobs are
`ITEM_VALUE` and `PROP_YIELDS`, and the test's bands say what moving them does.

## 129. A whim buyer finds a treat on a short visit, and never everything at once

**2026-09-29 · the user, answering question 33; Claude, after phase V · builds on 82, 128 · open to change**

The user: "She's a whim buyer. But she shouldn't just get everything immediately. But not so slow
she doesn't enjoy it." Decision 128's balance already keeps her from everything at once (a round
of the town is about 390 Candy; the dearest pieces take a day), so it stays, and the candy tree
grows a little more (20 a window, from 15), so a short visit once a day finds a handful waiting.
`tests/data/economy.test.ts` now holds both halves: half a round of the town, a day on the tree and
a visit's Candy buy the cheapest outfit, and the dearest piece in the shops costs more than a whole
round and the tree.

**Rejected:** prices cut for a whim buyer (she'd have everything in a week, and the shelves are
the only thing that turns over); a daily allowance (Candy for opening the game, not for playing it).

## 130. A title screen every time, and his dedication to her after it the first time

**2026-09-29 · the user, answering question 31 · builds on 24, 114 · open to change**

The user: "I want a title screen, and then I greet her and say 'to my beautiful perfect angel baby
wife, who is my whole world.'" The game opens on its title every time (`src/hud/TitleScreen.ts`):
McFrancisVille over her plum house, Skelly and the candy tree, cut from the town and drawn as it
lays out with her at her door (`src/render/title.ts`), and "Tap to begin". The first time, his
words follow on a card of their own, signed "Love, Cody", with a heart for her answer (`DEDICATION`
in `src/data/greetings.ts`); after that they're written on the title, so he greets her every
time. Whether she has seen the card is kept per phone (`mcfrancisville:dedicationSeen`), like the
install hint: a new phone shows him saying it again, which is no hardship. Then the creator or
Cody's welcome, as before. A dev build's `?skiptitle` goes straight in (smoke's reloads).

**Rejected:** the card every time (three taps to get in, and his words would become a hurdle);
the card only once and never again (he asked to greet her, and the title keeps doing it); the
dedication in the save (a save version for one flag she can't lose anything by).

## 131. Tall hats get room above her; what she holds is drawn at the world's size, in her fist

**2026-09-29 · Claude, from the user's notes after phase V · builds on 79, 88, 110 · open to change**

Her hair reaches the top row of her 32×48, so the witch hat was squashed into it (its point cut
off, her hair bulging round the cone). A tall hat now has `HAT_ROOM` (12) rows above her: every
layer of her is lifted by blank rows (`raised` in `src/sprites/doll.ts`), so her feet stay put and
whatever places her by her feet needs nothing; her hand, the portraits, the closet's close-up, a
neighbour's bubble and the HUD's preview measure from her body instead of the picture's top.

What she holds was a 16-pixel icon beside a hand that hung empty. The net and rod are now drawn at
the world's size (`HELD_ART` in `src/sprites/tools.ts`), a seed is a packet the size of her fist
(`HELD_PACKET`), and her own fist, a patch of her picture, is drawn again over the handle
(`fist` on a drawable's `held`), so it runs through her hand. The quick bar keeps the icons.

**Rejected:** a taller doll for everyone (every offset in the game, for one hat); a gripping hand
drawn into the doll (a pose per tool and facing, when re-drawing her own fist does it); the tools
doubled from their icons (a watering can as wide as she is).

## 132. 0.2 lands as small sessions on `v0.2-dev`, fixes first, releases to `main` at the user's word

**2026-09-29 · the user · builds on 83, 117**

Version 0.2 is planned as sessions that each fit one context window and end with a green PR into
`v0.2-dev` (`docs/v0.2_plan.md`). Fixes and the "is it fun" rebalance come first (she's playing
now), then October's festival, then new content, but the sessions are small enough that the order
is a preference: nothing is cut for running out. `main` gets a release only when the user says so
(Vercel deployments are limited); the repo is public now, so CI runs on drafts again.

**Rejected:** phases the size of 0.1's (a session that can't finish loses its context); merging
each session to `main` (a deployment each).

**Why:** the user: "an iterative approach, so we shouldn't run out if the sessions are small
enough."

## 133. October is a festival that unfolds week by week

**2026-09-29 · the user · builds on 111, 126**

The town already dresses for Halloween for the 30 days before it (decision 126), but nothing says
so and there's nothing to do. October becomes the Halloween Festival: the calendar shows it as an
event that spans the month, with a countdown, and each week of October opens something new (trick
or treat, costumes, a pumpkin patch, a story in chapters, the finale on the 31st). Each week is a
session, so they can land while October is on; whatever's left lands next year by the calendar.

**Rejected:** one big Halloween day (it's every day here, and a month is what the user asked
for); everything landing on 1 October (it can't, and unfolding is better anyway).

**Why:** the user: "all of October should be an in-game Halloween event"; "are there any special
events we can add, or something on the calendar to know it's Halloween?"

## 134. Fun is both the hunt and the checklist

**2026-09-29 · the user · builds on 62, 102**

She had half the Cabinet in under an hour. Critters get four tiers with real odds, a season and
their places, so the last of them takes the year (the hunt); and finishing a shelf or a museum
wing earns something (the checklist). Both, because the user said both.

**Rejected:** rarity alone (a finished Cabinet is still finished); rewards alone (a Cabinet that
fills in an hour has nothing to reward).

## 135. The UI is a frame: bars top and bottom, the world between, every sheet redesigned

**2026-09-29 · the user · builds on 109**

Fixed bars top and bottom with the world's viewport between them, never under them, so the edges
of a place (the way above the farm, the clearing's gap) are always reachable. Every sheet is
redesigned to one frame for a game that will keep growing, and nothing 0.1 could do is lost (a
smoke check per sheet). A relationships sheet is new.

**Rejected:** overlays that stay as they are (they cover the edges: the user's "getting above the
plants" and "the mushroom circle is impossible"); a redesign that drops a sheet.

**Why:** the user: "total redesign, but we don't want to lose anything"; "UI always present on top
and bottom, gameplay always interactive."

## 136. Sitting is just sitting, and the piano plays a tune

**2026-09-29 · the user**

Walking up to a seat sits her down and the next tap stands her up; nothing else happens. A piano
plays one of a few tunes when she walks up to it. Furniture that does a small thing on arrival is
a `plays` on its row.

**Rejected:** sitting that passes time or opens a menu; a playable keyboard.

## 137. The new neighbour is Boothoven, and the new place is the Hollow Fairground

**2026-09-29 · Claude, at the user's "your call" · open to change**

The town has no music maker, and 0.2 adds a piano, the fountain's tune and music for every place:
so the newcomer is Boothoven, a ghostly composer who moves in with a grand piano, teaches it,
and plays a duet with her at the hall on their anniversary. The new place answers "more to do"
rather than "more to walk": the Hollow Fairground beyond the graveyard, a stage and a ring of
stalls where the calendar's events happen and there's always a game, an activities table so the
next stall is a row.

**Rejected:** another wild place (there are three; what's missing is somewhere things happen);
a villager without a job the town lacks.
