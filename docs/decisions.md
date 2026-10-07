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

## 138. The ground is baked in chunks, lazily, and let go of when she leaves a place

**2026-09-30 · Claude · supersedes 23's one canvas, keeps its "copy, don't redraw"**

The ground of a place outdoors is baked in 8×8-tile chunks (256×256 pixels), each the first time
the camera reaches it, and a frame copies only the chunks under the view (`render/ground.ts`,
`render/chunks.ts`). A chunk is baked with a one-tile ring of its neighbours' tiles and every
prop's shadow, so it comes out pixel for pixel as the whole map would and there's no seam
(smoke's `ground` section counts the pixels that differ from a whole bake: none). When the
tiles change (the pond freezing over or thawing), only the chunks a changed tile reaches are
baked again; when she leaves a place, its view rests and lets every chunk go, to be baked again
as she comes back, behind the fade in from dark.

**Rejected:** one canvas per place kept for good (the town's 7.8 MB, a second one frozen over, and
every place she has been: about 23 MB across five, and a bigger place would make it worse); an
LRU cap on the chunks of the place she's in (on her phone the view covers most of the town at
once, so a cap would thrash; letting go on leaving is where the memory is); re-baking the whole
ground for the frozen pond (a corner of it changes).

**Why:** the fairground is coming (decision 137), and `docs/architecture.md`'s first "where it
hurts" was the one canvas. A chunk bakes in about a millisecond and a place's worth in a few
dozen, so baking as she goes costs nothing she can see.

## 139. The world's wiring is a base class of its parts; CI runs on every PR again

**2026-09-30 · Claude, in session A2 of 0.2 · supersedes 117 · open to change**

`src/world/build.ts` holds `WorldParts`: every keeper, zone and service as a field, the
constructor that makes and wires them (in the order that matters, unchanged from 0.1), the
options a world is made from (`WorldOptions`, `fromSave`) and what of it is saved (`save()`).
`World` extends it with what she does in it: a tap, a walk, an arrival and the step. The one
thing the parts call back into is `forget()`, which drops the walk she was on when she crosses
somewhere or starts decorating. Callers are unchanged (`world.shops`, `fromSave` from
`World.ts`). `World.ts` went from 884 lines to under 400.

**Rejected:** a builder function returning the parts, merged onto the class with
`Object.assign` and a same-named interface (typescript-eslint's recommended rules forbid the
merge, for good reason: nothing would check that every part is made); callers reaching the parts
through `world.parts.shops` (every caller and test would change for no gain); a function per
area (people, places, home), as `docs/architecture.md` weighed at 0.1's end (the forward reads
between areas, `Travel` before the zones' gates and `Neighbourhood` for the small events' thanks,
would cross the functions).

**CI:** the repo is public since 2026-09-29, so its Actions minutes aren't metered, and decision
117's reason is gone. Every PR, draft or ready, runs gates and smoke on Node 22 and the gates on
Node 25 on each push; both jobs also run on a push to `main` and by hand. The container still runs
the whole suite, smoke included, before every push.

**Saves:** 0.2 begins at v25, where 0.1 ended, with no bump; `migrations.ts` says so, and a test
holds a step from every version 0.1 made to today's, since her phone has 0.1's saves.

## 140. Ice needs her skates; toasts last as long as they take to read; puffs from a stirred hash

**2026-09-30 · Claude, in session B1 of 0.2 · open to change**

**Ice:** the frozen creek (and the pond, frozen over in winter) is walked by her only with her
skates in her bag, so the way on to Lantern Shore reads the same as the rule that opens it. It's
her ground, not the zone's: `MapZone.slippery` says what's ice, `World.canWalk` is the ground as
she can walk it, and `Movement.walkTo` takes any `Ground`. Neighbours and pets still cross the
ice, since their paths (Nessa to the shore) mustn't depend on what's in her bag. A tap on ice
without skates walks her to the nearest bank of that stretch (`banksOf`, `src/systems/ice.ts`),
where she steps out and slides straight back facing it (`Movement.slip`), with a `slipped`
moment. Lantern Shore's unlock stays `{ has: 'iceSkates' }`, and nothing shuts it again
(decision 11): without skates she can always leave by the world map. **Rejected:** ice solid
until she has skates, with the shut place's toast at the edge (no slip, and a tap on the ice would
do nothing at all); a walk onto the ice that ends where she tapped and then slides her back the
whole way (a long walk on ice she can't walk on).

**Toasts:** a toast stays a second plus sixty milliseconds a letter (about 200 words a minute),
never under three seconds nor over twelve, and a tap on it sends it off. Only a tap on the toast
itself: a tap on the world is a walk, and shouldn't also throw away what she's reading. The shown
toast takes pointer events, so the tap doesn't walk her too; smoke's `tapTile` taps through the
world where a toast covers the tile, as she'd wait or send it off first.

**Puffs:** FNV-1a's low bits depend only on each letter's low bits, so `hashString(key) % 4` over
keys that count up repeats with the digits: Cody puffed on exactly every fourth talk.
`hashMixed` (FNV-1a with murmur3's finish) deals the talk puffs, their lines and the idle puffs.
The rest of the game's deals keep `hashString`, since changing it would reshuffle every shelf,
critter and forecast on the day she updates; a new deal over keys that count up, taken `%` an
even number, should use `hashMixed`.

**Mounds:** a seed or sprout's mound sits in the middle of the bed's furrows, a grown crop's on
the last furrow, and a test holds every mound inside the soil.

## 141. Every outfit says what it is; a few come in their one colour only; gifts say what they are

**2026-09-30 · Claude, in session B2 of 0.2 · open to change**

**Descriptions:** every `OUTFITS` row has a `description`, which the shop shows (followed by
"Comes in rose, blue or cream." when it recolours) and the closet's foot shows under the name of
the piece she last picked, over its swatches. It says what the piece is and never its colour,
unless it only has one. "Comes in N colours, blue among them" is gone.

**Fixed pieces:** `fixed: true` on a row means it comes in its one fabric, and a test holds
`fixed` exactly when there's one. `recolours(id)` is the one rule the shop and the closet read;
the creator never offered colours. Fixed: the Tigers jersey (Bengals orange, the 49 in white and
black), the scarlet-and-grey jersey (team colours) and Cody's maroon tee (it matches his, and has
the colour in its name). Every piece that recolours still comes in a blue. A saved look wearing a
fixed piece in another colour is put back in its own by `repairLook`, which already falls back to
a row's first fabric, so there's no save change. **Rejected:** fixing the band tees too, as the
plan's line suggested ("the band tees' prints"): their prints were always drawn in their own
colours over any fabric, so it's only the tee that changes, as a real band tee comes in a few;
and she starts in Scream Dion in blue.

**The hand:** "Empty hands. Tap a bed and it gets what it needs: digging, watering or picking."
The old line's "a seed asks which" meant the seed card, and read as if a seed would talk.

**Wes:** the lines when he's gone again say what she sees (a tree, a beetle, the tip of a hat)
rather than a "Wes-shaped gap".

**Gifts:** a piece a neighbour gives her says what it is, not who it's from (the luna moth lamp,
the forever orbs, the telescope…); who gives what is for the neighbours' page (U3). A
description may still name someone when that's what the thing is (Cody's matching tee, the
portrait of Cody, Agatha's spare broom). The dialogue test reads every description (items,
outfits, furniture, accessories, critters, tools) as whole sentences, with no colour counts, and
none of what anyone gives her saying "from" or "by" a neighbour.

## 142. What's new is the mayor's typed notes, the newest only, once per phone, never to a new town

**2026-09-30 · Claude, in session B3 of 0.2 · open to change**

**The notes:** a `NOTES` row per version in `src/data/patchNotes.ts`, oldest first and only
added to, three to five lines and a P.S., typed by the mayor (nobody has met them, and their
letters already say how busy they are). The newest row _is_ the version on her phone
(`currentVersion` in `src/systems/patchNotes.ts`), so there's no second version number to keep
in step: a release to `main` adds its row, or finishes the newest one if it hasn't gone out yet.
`package.json`'s version stays as it is.

**When:** after the title (and the dedication), before Cody's hello, the first time she opens a
version: `notesToShow(lastSeen, hasTown)`. Only the newest row: a phone that skipped a release
hears about the latest, which is all she has. Never to a town that begins today, since nothing
in it is new to her; that phone remembers its version at once. The version seen is kept per phone
under `mcfrancisville:notesSeen`, like the dedication (it's the phone that showed them, not the
town), and written only once she's closed the card, so shutting the app on it shows it again. A
phone from 0.1 has no key and a town, so it gets 0.2's notes. `?skiptitle` skips them too.

**The card:** an ordinary sheet (`openSheet`), the letter's panel in a typewriter face, the lines
arriving one after another (all at once under reduced motion), and "Thank you, Mayor!" to go on.
Settings has "What's new in 0.2" to read them again, so a card tapped away too fast isn't lost.

**Rejected:** every unseen version's notes stacked on one card (only ever one version behind, in
practice, and a longer card is a worse joke); a typewriter that types letter by letter with a
tap to skip (slower to read on the one day it matters, and one more timer in the HUD); showing
0.2's notes to a new town as a "welcome" (they're about things she never saw).

## 143. A festival is a calendar row that spans days, shown beside a day's own rows, never among them

**2026-09-30 · Claude, in session J1 of 0.2 · open to change · builds on 112, 126, 133**

**The shape:** a festival is a `CALENDAR` row of kind `festival` whose `when` is a span
(`{ from: 'MM-DD', until: 'MM-DD' }`, both days kept, allowed to run over the new year), with the
holiday it counts down to (`finale`) and its `banner`'s words. `happeningOn` still means rows
that fall on a day of their own; `festivalsOn(day)` gives the festivals a day falls in, and
`festivalOn(day)` the first as it stands (`FestivalDay`: which of its days, of how many, and how
many till the finale). `Today.festival` carries it to the HUD. A second festival is a row.

**Where it shows:** the calendar sheet puts it first under Today with its countdown, bands its
days in the month (a pumpkin underline, so each day's own marks still show over it) and lists it
under Coming up on its first day only; the day chip counts down beside its date; the morning's
toast says it's on (a day's own row speaks first) and how long to go; the title screen says so
under the picture; a banner hangs from the middle of the square's top garland (drawn with its
string, so a festival without a garland still has one); and while it's on, the first of the
board's three notes is always one of its own (`during` on a `NOTICES` row).

**Rejected:** the festival in `happeningOn` like any other row (every October day would lead with
it, crowding out market day's and the full moon's marks, and Cody would greet her with it 31
days running); a festival as a `DECOR` row (the decorations are the town dressing up, and a
festival is what's on; they coincide for Halloween only because both are October); the banner as
a solid prop in the square (it would block the paths, and hanging it overhead reads as a banner).

**Why:** decision 133 wants the calendar to know October is a festival, and the plan wants the
shape to be one any later festival reuses.

## 144. Trick or treat is a knock at a neighbour's door, and October unfolds in costumes

**2026-09-30 · Claude, in session J2 of 0.2 · open to change · builds on 126, 133, 143**

**Trick or treat:** on an evening of the Halloween Festival (the window from 6pm, by the 5am
day), walking up to a neighbour's door is a knock instead of going in, once a day a door
(`knock:` in `Takings`, `onceADay`). She's handed a sweet dealt from the day key per door, by
them if they're in or from a bowl on the step with a note if they're out; a second walk up goes
in as ever, and a door with a happening on inside (the midnight bake) simply opens. The sweets are
her own (question 43): the gummy cluster, the rare one she hopes for (1 in 12, a little fuss when
it comes), and chewy dots, sour ghouls and candy corn; the candy tree drops one with its Candy all
October. Rules in `systems/trickOrTreat.ts`, the service `world.trickOrTreat`.

**Costumes:** hers are ten outfit rows on a `Halloween` shelf at the pop-up, out on the
festival's days (`on` a shelf takes a festival now), with the pop-up in town every one of them;
three couples' costumes from question 44, named in the game's own words. The neighbours' are one
each (`src/data/costumes.ts`), put on in a week of the festival and kept to the end, so more of
the town dresses up each week (decision 133's unfolding) and everyone by the last; she's told who
the first time she's out on the morning they do. The art overrides a figure's clothes and hats
(`COSTUMES` in `sprites/villagers.ts`), baked under its own key.

**Lights and the tune:** the houses' strings of lights (question 29) are found from each
building's own pixels, under its roof keys and above its door, so a new building is lit with
nothing to measure; a building with no roof opts out (`noEaves`). The festival has its own tune
in place of the waltz, chosen from the day's festivals (`musicFor`).

**Rejected:** a knock that also goes in (the sweet would be lost under the room's welcome toast,
and a knock is the point); a sweet on every talk in October (the talk already gives Halloween's
treat on the 31st, and a door is where trick or treat happens); a costume per neighbour per week
(four times the art for a month, and one costume put on and kept reads as a town dressing up);
measured eave lines per building (fourteen numbers to keep in step with the art).

## 145. The second list joins 0.2, each callout at its cause

**2026-09-30 · Claude, after session J2 of 0.2 · open to change · builds on 11, 79, 128, 132, 135**

**What:** after J2 the user sent eight more callouts, and they join 0.2 as sessions of their own
rather than wait for 0.3: B4 (selling one thing), P1 (a portal), N1 and N2 (the garden), E1
(Candy), W1–W3 (her wardrobe), and K3 split into a bigger pass over her (the tattoo sleeves
redrawn with it) and K4 over the neighbours. The plan's "The second list" table says where each
lands; the touches for crops and dishes move from F2 to N2, and the gloves and comfy tee from K3
to W2.

**The shapes, proposed for their sessions to settle:** the portal is an item on the quick bar
that goes home, with a twin at home that goes out (the map's travel stays as it is, and reads as
the same portal); a bracelet is worn from her bag, where it stays marked worn and can't be sold
or given by accident (not turned into an outfit piece, which would part the one she wears from
the one she could gift); more beds come as extensions of the farm into blocks the map keeps for
them, plots in two other places and planters, with `Farm` keyed by place; new Candy is bounded by
the day or window, and making something adds value only from what she gathered or grew (decision
128's no-loop rule); the starter clothes are added to an old save's closet on load, since pieces
are only ever added.

**Rejected:** holding the list for 0.3 (the fixes and the fun are what she asked for now); the
design pass at a bigger size from the start (it reopens decision 79 and every piece of clothing;
K3 tries 32×48 first and puts a bigger doll to the user only if that can't hold the detail);
fixing the sell counter only in U2's redesign (she hit it now, and it's a small session).

**Why:** decision 132's order, fixes first: B4 goes next, and K3 lands before the wardrobe
sessions so new clothes are drawn once, on the finer doll.

## 146. What she tapped in her bag is a card in the sheet's foot, the same in the bag and the shop

**2026-09-30 · Claude, in session B4 of 0.2 · open to change · builds on 109, 145**

A tapped thing from her bag is told by one card (`itemCard` in `hud/itemCard.ts`): its picture
small beside its name and count, a line about it, and its buttons. It sits in the sheet's foot,
beside Done, so however full her bag and however far down she tapped, it's in sight. The bag uses
it (with Eat), and so does Cobweb Corner's Sell tab, which is now the bag's own collection
(its filters, order and search, `BAG_GROUPS` and `bagEntries`): **Sell 1 for** its price, a − n +
(`howMany`) that counts up to all she has and prices the button as it goes, and **Sell all**.
On the Sell tab the greeting gives its line to her bag. Smoke fills her bag past the fold, taps
its last slot and sells one without scrolling.

**Rejected:** the counter in the head beside her Candy (the head already holds her Candy, the
message, the tabs and the finder, and a card there would push her bag off a phone); scrolling to
the counter after a tap (the body would jump under her thumb, and she'd lose her place); a big
picture on the card (the slot she tapped shows it big and highlighted, and the foot's height is
her bag's room).

## 147. The frame: what she has along the top, what she can do along the bottom

**2026-09-30 · Claude, in session U1 of 0.2 · open to change · builds on 135**

The bars of decision 135 are split by what they hold: along the **top**, what she has and when
it is (her Candy, the day's chip, a little touch for the month, Settings at the end); along the
**bottom**, what she can do (the quick bar outdoors, over the menu row of the bag, closet, map
and book, with Decorate first at home). The world is the room between them: the canvas is fitted
to it from a whole device pixel and nothing of it is drawn under a bar, so a place's top and
bottom rows are always a tap away. The month's touch is a row a month (`data/trims.ts`: a pumpkin
in October, a little tree in December), for the user's "cute, simple, intuitive, not disruptive,
with little seasonal touches" (question 53). Decorating takes the menu's row and its hint floats
over the world, as the quick bar's line does, so the bars keep their height while she plays in a
place and the room never jumps under her thumb; they change only as she goes in or out, under
the fade.

**Rejected:** all the buttons along the top as before (with the day's chip they need two rows,
and the bottom still needs the quick bar); the menu row and the quick bar in one scrolling row
(tools and sheets mixed, and her seeds off the end); the decorating bar as a third row (the room
jumps up as she starts, and a tap lands where the piece used to be); drawing the world under
translucent bars (the edges would be seen but not tapped, the thing the user hit).

## 148. Ways out: a worn way to the edge, a signpost by it, and the map's list

**2026-09-30 · Claude, in session C1 of 0.2 · open to change · builds on 90 and 147**

Every way out of every place is paved to the very edge (path, steps or the frozen creek) and has
a **signpost** by it. A signpost is a row in its map's `signs` naming the place it points to:
`parseMap` puts that on the prop, works out which way its board points from where the way out
is, and refuses a signpost that names nowhere. The board carries the place's word
(`data/signposts.ts`: TOWN, WOODS, SHORE, CASTLE, PSST), and walking up to one reads its line, a
small pun with the place's name in it (question 55). How a prop looks where it stands is one
function, `lookOf` in `sprites/props.ts`, which the view and the overview share.

Whisperwood's hidden way was the callout: a one-tile gap at the top, under the crowns of the
trees in front of it. Its path now leaves the north road at the herb glade, runs east along the
toadstools and up to a gap two tiles wide with a lantern by it, and the trees whose crowns hid
it are gone. The clearing's way back is two tiles wide and paved too. The plan's "past the
creek" is taken as the woods' paths reaching both, since the creek is south and the clearing
north: at the crossroads one signpost points up to the clearing and one down to the shore.

The world map lists the ways out of the place she's in, by edge (`Travel.waysOut`, `sideOf`):
named once she has been, "somewhere still to find" before, and "a way nobody takes" for the
secret one. Smoke's `edges` section walks from each place's start to each of its ways out by
real taps, each on the furthest tile of the way that is on screen and clear of the bars.

**Rejected:** the word drawn over the world by the renderer (a word is part of the sign's
art, and the overview and gallery should show it too); signposts pointing two ways at once
(two boards at 32 pixels crowd each other, and a sign where each way leaves reads plainer);
naming the hidden clearing on the map before she finds it (it stays a secret, as decision 102
had it; the sign's "psst" is the hint).

## 149. Her broom: a tap home from anywhere outside, and back to exactly where she left

**2026-09-30 · Claude, in session P1 of 0.2 · open to change · builds on 90, 145, 147**

**The broom** (question 50) is a keepsake in her bag, first on the quick bar once she has it, and
ridden rather than held: a tap swoops her from anywhere outside onto her mat. Agatha sends it the
day she has come to town on a second day, so a new game's first day isn't crowded and an older
town gets it on its first day of 0.2 (one rule, `visits ≥ 2`). Opening the letter sets its stand
out by her mat: a little cauldron the broom stands in, bristles up, like an umbrella in its pot
(a post with a hook, the first drawing, looked like a gallows). Walking up to the stand opens the
broom: **fly back** to the very tile she flew home from, kept in the save (`left`, v26), or
**anywhere** by the world map, whose travel now flies too and says so. Every flight is a `flew`
moment: the fade, a swoop, and as she hops on one of her calls, now and then "Sistaaaaaaahs!" or
"Booooook!" (question 56). Its ribbon and bristles are hers to colour (question 57), drawn on the
quick bar, in her bag and on the stand. Home is just her house, and nobody waits (58, 59).

**Rejected:** the broom as a tool held in her hand (a tap should do it, not two); flying home from
indoors (the quick bar is outdoors only, and a door is a step away); keeping the spot after she
flies back (the sheet would offer "back" to where she already is); Agatha's spare broom (the
furniture she gives at ten hearts) as the one she rides (it's a keepsake to lean in a corner, and
the broom home shouldn't wait on a friendship); a hook on the wall by the door (her room has no
front wall; the mat is at the open front edge).

## 150. Real rarity: four tiers, seasons, and a Cabinet that takes most of a year

**2026-09-30 · Claude, in session F1 of 0.2 · open to change · builds on 62, 102, 121, 134**

**Four tiers**, dealt 12:5:2:1 by weight (`RARITY_WEIGHT`). A legendary one also waits for its
moment, and a test holds every legendary to one: at most six hours of the night, a weather, or
the full moon. Six are legendary: the pair of orbs (11pm–4am), the wishing moth (11pm–3am in
the hidden clearing), the Hercules beetle (9pm–2am among the old trees, question 60), the axolotl (rainy evenings by Whisperwood's creek), the glowing jellyfish
(10pm–3am at Lantern Shore) and the blue moonfish (only the night of a full moon). The last two
are her top fish (question 17). A critter bound to the moon has a dozen nights a year, and that
is its rarity, so on its night it is dealt at a common's weight (`MOON_BOUND_WEIGHT`). At a
legendary's weight on those nights alone it wasn't found within two years of simulated play.

**Seasons** are months on the row (`season: [from, to]`, round past December), on fifteen of
forty-one critters. Six of them are two months long, one for each pair of months (mist newt,
candle moth, raindrop frog, fireflies, jewel beetle, pumpkin bat), so whenever she starts, the
last case is about ten months off. `isAbout` is the one test of whether a critter could be out
(hours, season, weather, moon), read by the deal, the lure and the Cabinet's ✦. A lure never
brings out a legendary critter, or one out of season.

**How long it takes is a test** (`tests/systems/rarity.test.ts`): a year of play at an hour a
day, the hour dealt from the day between 8am and 1am, going to the two places where the
Cabinet's hints point to the most still to find. From the first of every month, the Cabinet
fills in 9–10 months, and about a third is still to find after the first month. A player who
never reads the hints is not the model: the hints are how the game tells her where to go.

Seasons emptied the town by day, so four daytime critters joined (tombstone toad, mourning
cloak, reed frog, ladybug), each a new palette on an existing family's drawing, and a few
critters' hours were stretched to cover dusk. The Cabinet's hint names the tier, the hours, the
weather or moon, where, and the months. The axolotl lives on the creek's banks (the `creek`
habitat, open ground beside the ice), since the creek is frozen and it can't be fished.

Wrapunzel's last letter comes at 41 cases now. A `museum:34` letter already in a mailbox still
reads as the letter for a full museum (`MUSEUM_FORMERLY_FULL`), so nothing is lost. A town that
had filled all 34 gets the letter, and its cabinet, a second time at 41.

**Rejected:** season as a spring/summer/autumn/winter name (months say it plainly and let a
season span two of them); gating the rarest behind the fairground (M1 isn't built; it brings
its own critters then); a legendary critter at weight 1 on top of the full moon (hardly ever
found); a simulated player who ignores the Cabinet (it measures luck, not the game).

## 151. More to say: once a day each, a line per window, and Cody's four names for her

**2026-09-30 · Claude, in session D1 of 0.2 · open to change · builds on 16, 24, 114**

**Every neighbour has at least eight lines a band** (hello, friend, close, night) and a line for
each window of the day (`Lines.windows`), and **says each only once a day**: `lineFor` takes the
lines said today, orders what she could hear now (`linesNow`: the band, the window's line, and
the night's after dark) by a hash of the day and the line, and says the first she hasn't heard.
Only when every one has been said do they come round again. What's been said is kept in memory
beside the day's talk count, which was never saved either, so a reload can repeat a line;
saving it would be a save change for very little.

**Cody's names for her** (question 36) go round: mi amor, babe, booby and honey bunny, each in
five or more places. "Babe" went from about two lines in three to about one in four (15–30% by
test) across everything he says: talk, greetings, holidays, her special days and his letters.
His orb line keeps its "babe". "Guess what?" "What?" "Chicken butt." (question 10) is a
now-and-then greeting as she opens the game, shaped like the red Tesla's, eight days in a
hundred. Agatha and Cody call Wes the creeper (question 40).

**Rejected:** saving the lines said today (a save change to stop a repeat after a reload);
rotating the pool by the talk count as before (night lines joining at 8pm changed the pool and
brought a line round twice); a line per window per band (thirty more lines a neighbour for a
difference she'd hardly notice; one each is enough to make the time of day heard); swapping
every "babe" for her name (he calls her babe; the callout was how often, not that he does).

## 152. Her in more detail, at 32×48: detail worked out from her shape, and ink laid along each arm

**2026-09-30 · Claude, in session K3 of 0.2 · open to change · builds on 27, 79, 88**

**Decision 79 holds**: the pass showed 32×48 can carry a finer face, hair, clothes and both
sleeves, so no bigger doll was put to the user. What changed is where the detail comes from:

- **Her face** is drawn by hand as before, finer: eyes four wide and round (an ink rim, a tall
  highlight, the iris lightening toward the bottom, mirrored for the other eye), brows that show
  where a fringe allows (the face is under the hair), a nose, lips of two tones and a softer
  blush mixed from her own skin.
- **Hair** gets its shine and strands from the style's own shape (`groom` in `doll.ts`): a band
  of light two rows in from the top of the hair on the lit side, and shaded strands fanning from
  the parting. A new style needs no shine points; the old fixed points were removed.
- **Clothes** get their seams, folds and shade from one pass per kind of cut (`tailor`): a top
  creases where it meets her arms and pulls in to the waist, a crew neck has a rim, and trousers
  a fly, pockets and knees. Only plain fabric is touched, so prints and trims stay whole, and a
  new piece of a known cut is tailored for free.
- **Her arms** are four wide at the shoulder and elbow and three at the wrist, with a hand four
  wide (the art style allowed 3–4), in every pose. Neighbours share the body, so they have it
  too; K4 is their own pass.
- **Her tattoos** are a grid per arm and pattern (`SLEEVES`), shoulder first, laid on by walking
  up each arm from her hand (8-connected, so a row across a straight arm is one step) and across
  it from the outside in. The same grid lands on a hanging, raised or crossed arm, from the
  front, side or back (her right arm on the viewer's left from the front, the other way from
  behind, and the near one from the side), and a sleeve covers what it would. The Beetlejuice
  sleeve (question 49) is stripes and a sandworm through green on her left arm, in the game's own
  shapes; the evenstar, a black-eyed Susan and a line of script are on her right. The rose
  (question 65) is six by four, on her chest only, and the sundress's scoop is a row deeper at
  the front to show it. Tattoos are worked out on her whole body even for the arms raised in
  front of her hair, which fixes the rose showing over her tee in those poses.
- **Cody's cape is lined in maroon** (question 64).

**Rejected:** a bigger doll (48×64 was the fallback; the pass didn't need it, and it would
redraw every piece of clothing); per-style shine points (they didn't follow a new style);
tattoos painted per row and column of a standing arm (they fell apart on a raised or crossed
one); 4-connected distances up the arm (a wider elbow over a narrower wrist skewed the rows).

## 153. Her tattoos black and white, the stripes on the arm she picks, split dye any two colours

**2026-09-30 · the user, on seeing K3 · builds on 27, 152**

She liked K3's designs, and three things changed. **Her tattoos are all black and white**, as hers
are: the ink's keys are ink, three greys and white, so the stripes, the sandworm, the star, the
flower and the rose still read apart. **The striped (Beetlejuice) sleeve is on her right arm**,
and which arm is hers to pick (`stripesArm`, a row under Tattoos in the creator and closet), the
stars and flowers going on the other; `SLEEVES` is keyed by design, not by arm. **Split dye is any
two colours**, picked apart: `hairColour` is her right side and `splitColour` her left, or none for
one colour all over (a row in the creator and the salon). The two fixed pairs became their halves
(pink and dark brown; coral and blonde), and pink and dark brown are colours of their own. Save
v27 turns an old pair into its halves and puts the stripes on her right.

**Rejected:** a coloured and a black-and-white choice for the ink (hers are black and white, and
nobody asked for colour); a mirror setting that swaps both sleeves and the rose (only the sleeves
have a side); keeping the fixed pairs beside free choice (two ways to get the same split).

## 154. The neighbours in more detail: a touch of their own on her parts, drawn as touches

**2026-09-30 · Claude, in session K4 of 0.2 (question 67: "Claude's call") · open to change ·
builds on 27, 88, 152**

The neighbours were already built from her body, face, hair and clothes, so K3's finer face,
hands, hair shine and tailoring reached them for free. K4 gives each **something of their own**,
drawn as touches on those parts (`Touch` in `src/sprites/villagers.ts`, worked out from the body
for every view and frame, like her clothes), rather than a hand-drawn sprite per neighbour:

- **Rufus** has hair gone to a mane (`shaggy`, from any style's shape, as `curly` is for Cody),
  tall wolf ears with his flower crown between them, a muzzle that pushes out past his face from
  the side, flecks of fur, pale claws and a bushy tail behind him.
- **Wrapunzel's** wraps are bands with a lit edge over the next one's shade, open round her eyes,
  with a loose end trailing from her wrist.
- **Barty's** bones are worked out from the body's regions: collarbones, breastbone and curving
  ribs, a spine and shoulder blades from behind, two bones down each forearm, knuckles; his
  skull twinkles and grins, and a daisy is in his hat.
- **Maude** holds a library book and wears her glasses on a chain. Her glow lights her sheet, not
  the book (a test holds it).
- **Cody's** cape has a high collar standing up past his hair, lined in maroon, and a garnet clasp.
- **Agatha** has plum lips (`lips` on a figure's row), a beauty mark, a pointier nose from the side
  and a crescent pendant.
- **The newcomers:** Ollie's cap badge and a letter peeking from his satchel; Nessa's scales and a
  shell in her hair; Gourdon's pumpkin with curved ribs, a curly stalk, carved triangle eyes and a
  toothy grin whose pale flesh shows at each cut (only the carving glows, held by a test), and a
  tool belt; stardust in Hazel's hair.
- **The Moon Pie Man** gets a glint on his shades, a smile, a bow tie and a moon on his hat;
  **Wes** a belted, double-breasted trench coat with its collar up, and a combed moustache.

Costumes keep what isn't replaced (Rufus's tail under his sheep's hood is the joke; Ollie's
satchel comes off for the ringmaster's coat). The before-and-after page went to the user before
merging, as K3's did.

**Rejected:** a hand-drawn sprite per neighbour (twelve people times four facings and three
frames, and the doll's improvements would stop reaching them); folds in Maude's sheet (two
vertical lines read as legs); bandage folds in a darker grey (they read as dirt); a shadow under
Wes's hat brim (the brim's outline sits on that row, and a row lower covers his eyes).

## 155. A fuller closet: twelve pieces from the first day, a slot for gloves, and older saves topped up

_2026-09-30, session W2._ Her closet starts with twelve more everyday pieces, chosen by Claude
(question 51) around her two touches: **her pink gardening gloves** (question 14) and **her comfy
shirt**, oversized with long sleeves (question 34). With them: a cozy hoodie, a moth cardigan worn
open over a vest, a stripy long-sleeve (a nod to a certain striped ghost), leggings, overalls, a
skater skirt, joggers, rain boots (she loves a thunderstorm, question 1), a bobble beanie and a
big hair bow. Each is a row with a description and a cut of its own, drawn to K3's detail.

- **Gloves are a slot of their own** (`gloves`, optional like a hat), not a top's or a
  necklace's, so she can wear them with anything and take them off with a tap. They're drawn over
  her hands and a frill at the wrist, after the top, so they sit over a long sleeve's cuff, and
  they come in pink only (`fixed`): the touch is pink gloves.
- **Overalls go on over the top.** A bottom is drawn under the top, which would hide the bib, so
  a `BIBS` cut is layered just after the top instead. Every other bottom is as it was.
- **Her comfy shirt is a size too big**: it paints over her outline where her side meets the air
  (never on a line across her), so it hangs a pixel out past her sides and arms.
- **A save from before gets the new pieces as it loads** (`Wardrobe.added`): whatever of
  `STARTER_WARDROBE` it lacks is added, and marked new in the closet (`Novelty.mark`), so she finds
  them. Pieces are only ever added, so there's no migration and no save bump.

**Rejected:** gloves as a necklace or a top (the shelf would lie, and she couldn't wear them with
her tees); a scarf (it has no slot that isn't a necklace's, and the closet would call it one);
putting the new pieces on sale instead (the plan asks for them from the first day; W3 is the
shop's pass); leaving an older save's new pieces unmarked (nothing would tell her they'd come).

## 156. October's middle: a patch that grows on the farm, film night on the avenue, and a story Wes ends

**2026-09-30 · Claude, in session J3 of 0.2 · open to change · builds on 133, 143, 144**

**The pumpkin patch** (question 31: they go every October) is a prop on her farm, three tiles by
two below the beds, until the fairground (M1) gives it a home of its own. How it looks is read off
the day, never stored: resting under straw outside the festival, then sprouting (from the 1st),
flowering with little green pumpkins (the 8th) and ripe (the 15th), by the festival's day
(`patchStage`, rows in `data/pumpkinPatch.ts`). Once it's ripe, walking up to it picks her a
**patch pumpkin**, once a day (`pumpkin:` in `Takings`, `onceADay`); before, it says how it's
coming on. **Her carving is a cat** (questions 47 and 73): the workbench's cat-o'-lantern recipe,
known from the start, takes a patch pumpkin, and the carving is a whole cat's head, ears and all,
cut through so it glows after dark with its face left in the skin. It's furniture, so it lives
in her room; J4 lights it round the square.

**Film night** (questions 31 and 71) is a happening on the festival's Saturdays but its finale
(`{ festival, weekdays }` on a row, the finale left to the party), and a festival's happening
comes before an everyday one as a holiday's does, so Cody's movie night gives way to it. Everyone
living in town has a seat of their own on the avenue below the square (`where: { seats }`) and
faces the screen (`faces` on a row) when she isn't near. What's set out for it (the screen and a
table of popcorn) stands all its day, solid, as a `set` on the row that `Decorations` puts out
beside a holiday's piece; the screen shows the friendly ghost film while it's on, lit after dark.
Cody hands her a tub of popcorn. The film is named for what it is (the friendly ghost film),
never its title.

**The story** is four chapters from the mayor, a week apart, each a nod in the game's own words
(question 46): a stranded couple at a castle on a stormy night and a dance everyone knows; a
fuzzy critter with three rules; a phone call asking her favourite scary film, answered with a
giggle; and a film night to end on. The first three come in the post on the festival's 1st, 8th
and 15th (`story:n` letters, all that are due, in order, however late she first opens the game).
**Wes drops the last** as he scarpers, the first time she spooks him from the 22nd, and reading it
pins a clue (`lastChapter`): typed on the mayor's typewriter, sticky W and all. That is the
mystery's step, and nothing is revealed.

**Rejected:** a patch that tracks what she did to it (watering it, a save for it) when the brief is
a patch she visits, not a chore; carving from a menu of faces (the touch is a cat); film night
round the well (the banner hangs over the square's top edge, and a screen there faced the wrong
way or blocked the way north); the last chapter in the post (Wes carrying it is the mystery's
step); a chapter a day, or all four on the 1st (decision 133's unfolding).

## 157. The 31st: a contest she judges by talking, the party's set, Cody's other half, a photo from the game itself

**2026-09-30 · Claude, in session J4 of 0.2 (questions 28, 44, 47, 48, 75–77) · open to change ·
builds on 144, 156**

**The contest** is a holiday happening of its own, before the party on the 31st (six till eight),
so it comes first in the evening's order: everyone in costume stands in the film night's seats on
the avenue, facing the judge, before a stage set out all day (a backdrop, curtains and COSTUME
CONTEST on its valance; the fairground's stage is M1's). **She judges by walking the line** and
talking to each (question 48): the talk sheet has a 👑 for anyone in costume at the contest or
the party, until she crowns one. The winner is thrilled (a line each), takes home the Golden
Gourd, sparkles gold for the rest of the night and is a loved gift's worth closer; one of the
others is a good sport about it. Who she crowned is kept in `Takings` for the night (`crown:`,
once a day), because nothing needs it after.

**The party** keeps its hours and its place round the well, and gets a `set`: Cody's white chicken
chili on a table (question 76; a bowl from him, the host, on a second chat, after his Halloween
line), jack-o'-lanterns round the square, and **her cat-o'-lantern among them if she has carved
one** (question 47): a set's piece may be `hers`, put out only while she owns that furniture,
which `Decorations` asks as it goes. Every neighbour's party line now matches the costume J2 gave
them.

**Cody wears the other half of hers** (question 44): whichever couple's costume she's in, he's its
partner (a bug catcher to her butterfly, a lion to her lion tamer, the other meddling kid), and in
none, his own lion. `world.finale.costumeOf` says what anyone is dressed as, and the figure is
baked under that key.

**Their photo** (question 75: "us in our costumes") is a 📸 in Cody's talk at the finale: the
sheet closes, the screen flashes, and a polaroid shows the game's own canvas cropped round the two
of them, at whole pixels, captioned with what they went as. **Cody writes on 1 November**
(question 77) with the photo framed for her wall: a festival letter, posted the day after its last
day (`finaleLetterId`), its frame a drawn piece of the two of them in costume.

**Rejected:** a judging sheet listing everyone (she asked to walk the line and pick); keeping the
winner in the save (it matters for the night only); drawing the photo from her look and Cody's
half as a grid (the canvas already has them, in her actual clothes, and a crop is what a photo
is); Cody always the butterfly (the touch is the other half of hers); a prize for her as well
(being the judge is hers; the photo is her keepsake).

## 158. 0.2 goes to her phone now, for October; the rest of the plan ships as 0.2.x

**2026-09-30 · the user, with Claude · open to change · builds on 132, 142**

The plan had 0.2 go to `main` once, at V1, after every session. On 30 September the Halloween
Festival (J1–J4) was built and the next day was its first; everything after it was at least
twenty sessions away. **The user released `v0.2-dev` to `main` as 0.2 that day**, so she has
the whole of October, and **the sessions still to do ship as 0.2.x**: `v0.2-dev` stays the
integration branch and the plan stays `docs/v0.2_plan.md`, a release is one PR from `v0.2-dev`
to `main` when the user says so, and each adds a `NOTES` row of its own (0.2.1, 0.2.2…) rather
than finishing 0.2's. V1's review runs before the last of them.

The 0.2 notes were rewritten in B3's five lines (decision 142 holds: a longer card is a worse
joke), biggest first, to cover what had landed. They hint at the 31st's contest and Agatha's
parcel without giving away the photo or Cody's letter.

**Rejected:** holding 0.2 until V1 (the festival's evenings and its 31st don't come back until
next year; the story's chapters would have caught up, the rest wouldn't); a release per session
(Vercel deployments are limited, decision 132).

## 159. 0.2.1: one row along the bottom, the bars down the sides on a phone on its side, and the heart key in the open

_2026-10-01, a priority fix after 0.2 reached her phone._ She hit three things at once:

- **On its side the game was unplayable.** The bars kept their heights (178 of 390px), the world
  was a 212px strip, and the fit picks its zoom from the short side, so the town was drawn at 1×.
  Now a landscape phone (`orientation: landscape` and at most 560px tall) stands the bars down
  either side: what was along the top runs down the left, the quick bar (scrolling) and the menu
  down the right. The world keeps the whole height and its usual zoom.
- **Upright, the bottom bar was too tall** (two rows, 120px). The quick bar and the menu now share
  one row (62px). While the quick bar is out, the bag stays in the row and the closet, map and
  Cabinet wait in a little tray behind ☰ (`.hud-menu-more`, `data-compact`, `data-open`), with a
  "new" dot on ☰ when either has one. Indoors, with no quick bar, they sit in the row as before.
- **The heart key couldn't be found.** Its mound, by the bend in the frozen creek, was under a
  willow's crown and three trees'; the pocket of ground it's in is walled by the creek, so only
  her skates reach it, and without them a tap on the mound did nothing at all. The trees moved
  out of a little glade round it (a test holds it clear), the castle doors' hint names the bend,
  and a tap on anything she could reach only across the ice, without skates, walks her to the
  edge to try it and slip (`toTheIce` in `World`), as a tap on the ice does.

**Rejected:** locking the game upright (iOS ignores a home-screen app's orientation, and she
turned it on purpose); folding the whole menu into one button (the bag is reached for most, so
it stays a tap away); shrinking the buttons below a thumb (44px is the floor); moving the key
somewhere she could reach without skates (it's where they'd have skated, and the skates are the
point).

## 160. On its side, one thin strip along the bottom, not bars down the sides

_2026-10-01, after 0.2.1 reached her phone._ She liked how much of the town a phone on its side
showed, and 0.2.1's bars down either side (decision 159) took that away: about 250 of 844px of
width. Now a landscape phone puts both bars side by side in one strip along the bottom, one row
high (62px): her Candy, the day and Settings at its left, the quick bar, the bag and ☰ at its
right, the tray opening upwards as it does upright. The month's trim is left out there for room.
The world takes the whole width and 328 of 390px, at its usual zoom (2× at a devicePixelRatio of
3, about 39 tiles across: very nearly the whole town's width). It's one CSS grid change; nothing
moves in the DOM.

**Rejected:** floating the buttons over the world (decision 147: nothing of a place hides under
a control); going back to two full bars (that's what made it unplayable); zooming out to 1× on
its side (everything a third the size: the reason 0.2 was unplayable sideways).

## 161. Cooler clothes: a jacket over the top, tights under, and a boutique that deals a whole look a week

_2026-10-01, session W3._ Her answer to question 72 asked for more than tees: fancy, pricey
outfits (a spaceman suit) and Halloween costumes; question 68 for a Walk the Tomb band hoodie.

- **Two new optional slots, `outer` and `tights`.** A jacket is worn _over_ a top, not instead of
  it, so it's a slot of its own, drawn after the top (and after overalls) and before shoes; the
  closet has a Jackets rail and a Tights rail. The moto, the denim jacket and the opera coat are
  worn open, the top showing down the middle; their sleeves come up with her arms in a pose. A
  cape and bat wings are `outer` too, hung round her (only where she isn't, from the front) and
  over her from behind, and stay behind her when her arms go up. Tights are drawn under the
  bottom, so a skirt lies over them and trousers hide them. `outfit` is a partial record, so a
  save is unchanged (no bump), as with W2's gloves.
- **Nineteen pieces, sixteen new cuts:** a corset (laced, a sweetheart neckline in lace), a tulle
  skirt, fishnets and stripy tights, the three jackets, a velvet dress, a ball gown (the corset's
  bodice and a skirt to the floor), a spaceman suit (all of her, a size too big, a panel of
  lights) and its bubble helmet (a rim only: glass is see-through), a tiara, platform boots, the
  vampire cape (Cody's maroon lining), bat wings, mummy wraps and devil horns; the Walk the Tomb
  hoodie has the record's tombstone on its pocket, below where a pendant hangs, and a skirt has a
  bat print.
- **The boutique is one whole look a week**: a shelf at Cobweb Corner dealt from the Monday its
  week starts on (`everyWeek`, `weekOf`), new at 5am Monday, and a pick may deal `sets` whole, so
  the spaceman suit always comes with its helmet. Four looks: space, the midnight ball (gown and
  tiara), velvet (dress and opera coat), and goth (corset, tulle, fishnets, platform boots). Each
  piece is dear (up to 1300 for the gown) but within a day's rounds (decision 128), at full price,
  never a special. The clothes shelf deals two a day from twelve, and the pop-up's Halloween shelf
  five from fourteen (the cape, wings, wraps and horns join it).

**Rejected:** a jacket as a top (she couldn't wear it over her band tees, which is the point);
tights as a bottom (a skirt is a bottom); dealing boutique pieces one at a time (half a spaceman);
a boutique shelf every day (it's meant to be a thing to look forward to, and to save up for);
painting the bubble helmet's glass (it hid her face). On this 32×48 doll a skirt and boots leave
only a row or two of shin, so tights show best with low shoes; they're shown barefoot under a
dress in their close-up, and the fishnets' description says what they're for.

## 162. No one talks of a newcomer before they've moved in

_2026-10-01, from her playing 0.2._ She kept hearing about Hazel, who hadn't come to town: Maude,
Rufus, Agatha, Wrapunzel, Barty and Cody all have everyday lines that name a newcomer (Hazel,
Ollie, Nessa or Gourdon), and they were said from the first day. Hazel writes only once Maude is
a friend (three hearts), and the others come a month apart at most, so for weeks the town talked
of people she couldn't find.

Now a line that names a neighbour who doesn't live in town yet waits till they do: `lineFor`
takes `away` (who hasn't moved in, from `Neighbourhood`) and leaves out any line, and any special
day's or holiday's first line, that names one as a whole word (`mentions`). The same holds for a
newcomer's own lines naming one still to come. The lines are kept, not rewritten: once everyone
has come, they're all said again.

**Rejected:** rewriting the lines without the names (they're the town's little bits of gossip
about each other, and lovely once you've met them); moving the newcomers in sooner (the wait is
how they arrive, one at a time, each with a letter); a list of which lines name whom (the name in
the line is the list, so a new line needs nothing more).

## 163. Two lanes of the plan run side by side, overnight

_2026-10-01, the user's call._ With the rest of 0.2 broken into small sessions, the user asked
whether they could run in parallel, overnight. They run in **two lanes**, each its sessions in
order: lane 1 is the save (W1, N1, F2, E1, each of which changes the save's shape, so they can't
run beside each other), lane 2 art, sound and talk (K1, K2, H1, H2, G1, D2, N2, none of which
does). One coordinating session starts each plan session as a fresh cloud session when the one
before it in its lane has merged, and checks in about every half hour. Each lane session merges
its own PR into `v0.2-dev` once green, as before (decision 132); nothing goes to `main` without
the user.

What the two would otherwise both reach for is split: only lane 1 touches `SAVE_VERSION`;
decisions are numbered in blocks (lane 1 from 164, lane 2 from 170), so they may sit out of order
in this file; questions to the user likewise (86 on, 96 on); each lane writes its own heading
under "In progress" in the handoff. The rules are in the handoff, where every session starts.

**Rejected:** three lanes (with the fairground's, the usage limit goes three times as fast and
the user wanted to see a night of two first); every remaining session at once (four change the
save, and U2 redraws every sheet); one routine taking the next session every few hours (safe,
but no faster); a lane session starting the next itself (a cloud session can't yet message
back, and a fresh session per plan session keeps each one in a single context window).

## 164. Her bracelets are worn on her left wrist, and kept in her bag while they are

_2026-10-01, session W1, overnight (lane 1); the warmest defaults, with questions 84–85 open._ A
bracelet she strings can be worn: the look has a `wrist`, up to three bracelet ids nearest her
hand first (save v28; step 27 starts every look bare, her bracelets all still in her bag). A worn
one **stays in her bag**, counted, and the bag itself won't let it go: `Bag.remove` never takes
what she has on, and the sell tab, the gift list, notices and the honesty stall see only her
`spares`, so nothing goes by accident however a sheet asks. The bag marks a worn one "on", with
Wear and Take off on its card, and the closet has a Wrists row of chips. It's drawn on her
**left** wrist, a band each up her forearm from her hand in its beads' colours (the icons'
colours, `src/sprites/bracelets.ts`), with a darker rim standing out past the line round her arm
so it reads as a ring; it's found by walking up the arm from the hand (`armBands`, shared with her
tattoos), so it follows her arm in every view and pose, and over her sleeves and gloves. From the
side facing right her left wrist is turned away, and none shows. A neighbour she gives a bracelet
to wears the last one given (`Friendship.wears`, optional in the save), on their wrist as on hers;
Maude, a ghost in a sheet, keeps hers out of sight.

**Rejected:** taking a worn bracelet out of her bag (it would vanish from her bag, and
putting one back would need a path of its own); asking each
sheet to check what's worn (one guard in the bag is one place to be right); her right wrist (her
phone and her net are in that hand, and the striped sleeve is there); a slot of its own in the
outfit (a stack isn't one piece, and the pieces are `OUTFITS` rows, not bag items); a bracelet
row per neighbour (the last one given is enough to see, and needs no list).

## 165. Beds are kept by place and tile, and two places beyond the town have a plot of their own

_2026-10-01, session N1 (lane 1)._ `Farm` keys every bed by the zone it's in and its tile (`Plot`,
a zone left off meaning the town), so the town, Whisperwood, Lantern Shore and her home can each
have beds with the same rules: rain, sprinklers (in their own place only), the bed card, the row
planting and the honesty stall all work the same everywhere. Save v29: step 28 puts every saved
bed and sprinkler under `town` and counts no extension rows (`farmRows: 0`). A town bed's key is
what it always was (`bed:tx,ty`), so a rose that was going to come up blue still does. Whisperwood
has four beds by the creek under the trees and Lantern Shore four on the south bank by the lake
(`x` in their maps; the creekside spot moved a tile). A crop row's `thrives` names the plots where
it grows a day sooner: hostas and bat flowers in the shade of the woods, moonflowers and spider
lilies by the lake. That's fixed on the planting as it goes in (`Planting.quick`), never slower
anywhere (decision 11), and her toast says so. A bed a save has that's no longer anywhere (a
planter gone from a save) gives back the seed of what grew in it, as a stray sprinkler does.

**Rejected:** threading the zone through every growing rule (the planting carries the one fact
that differs); new crops for the plots (N2's); rain skipping her indoor planters (one rule
everywhere is easier to trust, and it's never a loss).

## 166. The farm grows by extension rows on grass kept for them, and planters are beds at home

_2026-10-01, session N1 (lane 1)._ The town's map keeps grass for two rows of beds (legend `1`
and `2`, `TileMap.plots`): the first below the farm's two rows, the second along the top past
the hostas, outside the fence. A recipe builds each (`{ beds: n }`, like the room's `{ room }`,
built in order: "New garden row", 30 wood and 10 stone, then the "Hosta-side row", 50 and 20),
both known from the start; `Farm.extend` counts them, `MapZone` makes a built row solid, and
`OutdoorView` re-bakes only the chunks it touches, as for the frozen pond. The scarecrow and the
hay bale moved to keep a way in from the gate. The **planter box** (`planter` on a furniture row,
a recipe known from the start, 4 wood and 2 stone) is a bed wherever it stands at home; her crop
stands on its soil (`PLANTER_SOIL`). Moving it carries what grows in it (`moved` signal from the
decorator); putting it away gives back the seed, or the harvest and the seed if it was ripe. The
workbench has a Garden group for the rows, the planter and the sprinkler.

**Rejected:** Barty offering the rows once he's a friend (the plan's "or": a recipe is one rule
she already knows, and Barty's letters each carry one gift already); planters on the porch (her
porch pots already change, and furniture lives indoors); a third town row (no room left inside
the fence without cutting the farm off from its gate).

## 170. Outdoors polished: fences that join, the willow, the well, the geese and the storms

_2026-10-01, 0.2's K1 (lane 2)._ The outdoor half of "a fresh polish on everything", with two of
her touches.

- **Fences join like the ground.** `parseMap` gives every fence (`fence` and `fencePost` alike) a
  `joins` mask of which neighbours are fence (1 up, 2 right, 4 down, 8 left), and `lookOf` picks
  one of sixteen drawings by it (`FENCE_JOINS`, `PropArt.joined`). A run across is pickets on two
  rails, a run up the screen is end on; a stout post with a ball on top stands at every end,
  corner and junction. The map's letters stay as they were: `f` and `|` now draw the same.
- **The willow** is a smaller dome with single strands of leaves, fewer and thinner, arching out
  and falling; the ones behind are drawn only where nothing else is, and none is outlined.
- **The well is four tiles wide** (`WWWW`), with a trough of mums either side of it and fallen
  leaves round it (a clutter rule on the path `near` the well). The party spots either side of it
  moved a tile out (`wellWest`, `wellEast`).
- **The art notes outdoors:** the fog in three sizes of noise on a wider tile, so it comes in
  banks and wisps with clear air between; the grass tufts taller, in two greens; the little
  tree's bat plum, hanging off the boughs; the frozen creek ending at the lake in a ragged lip
  (`THAW_*` bits on an ice tile's mask, the sides that open onto water); Nessa's boathouse down
  at the water's edge with a little jetty.
- **Porch geese** (`personal_touches.md`, "Clutter (2)"): a plaster goose by her path and one by
  Barty's door (`z`, prop `goose`), in an outfit for the month, or the holiday while its
  decorations are up (`data/geese.ts`, `gooseOn`), all October the festival's. Hers and Barty's
  can differ (a witch and a ghost; Santa and a reindeer). Walking up to one says what it's
  wearing. The first goose in the map is hers. Nothing is saved.
- **Thunderstorms** ("Weather (1)"): about a third of rainy days are storms (`stormOn`, from the
  day key). A flash comes at most once in forty seconds, worked out from the clock
  (`lastFlash`), drawn over the light as two flickers and a fade (one soft brightening with
  reduced motion); a far-off rumble (`thunder`, the `rumble` cue) follows a couple of seconds
  later, indoors too. The day's word says it's a storm. The lines that say rainy days are good
  days are D2's.

**Rejected:** a third map letter for corners (the map should read as a fence, not as its
joints); making the well's sprite bigger on its old two tiles (it would overhang the tiles
people stand on round it); a `storm` weather of its own (the critters, the rain on the beds and
the Cabinet's words all treat a storm as rain, which it is); a flash on a fixed timer (the clock
gives every reload the same storm); a goose that's a keeper she dresses (that's a save change,
and lane 2 doesn't make them; dressing it could be a later session's).

## 167. Shelves to finish are worked out from the Cabinet; only what she has had is saved

_2026-10-01, session F2 (lane 1)._ Reasons to come back (the plan's F2, her answers 5, 63 and
64). Eighteen shelves are rows in `src/data/milestones.ts` (`MILESTONES`), each a `Shelf`: a
family caught (six), a season's own (four: a critter belongs to the season its `season` starts
in, autumn from September, winter from December, spring from March, summer from June; an
all-year critter to none), a wing of the museum (a family donated, six), or every squishy or
every monster doll she has ever had. `world.milestones` (`Milestones`) works each out from the
Cabinet and the bag (`progressOf` in `src/systems/milestones.ts`) when the bag or the Cabinet
changes, and posts the shelf's letter (`shelf:<id>`, read by `letterOf`) once it's full. **The
letter is the only record of a finished shelf**: the mailbox never sends one twice, so no
`given` list is saved, and a shelf finished before this build sends its letter the first time
she plays it.

- **What comes:** a family caught, a framed one for her wall (the framed luna moth for the
  moths, as she answered; a vampire bat, the axolotl, a wisp, the Hercules beetle and a mounted
  blue moonfish); a wing, a little glass dome with one of its critters; a season, a monster doll;
  every squishy, Cody's squishy shelf; every doll, Agatha's haunted dollhouse. All from
  Wrapunzel but the last two. The framed pieces and domes are drawn as a frame or a dome with
  the critter's own town-sized picture laid in (`specimen` in `src/sprites/milestones.ts`, its
  keys moved to ones the building kit never uses), so they're always the critter she caught.
- **Monster dolls** (her answer 5, "the game's own, never the brand's"): eight items of a new
  kind, `doll`, drawn from one doll grid with what makes each herself laid on top
  (`src/sprites/dolls.ts`). One a day on Cobweb Corner's Goodies shelf, and a season's shelf
  sends one. Agatha likes them.
- **Save v30:** `collected`, every squishy and doll she has ever had, so selling one never takes
  a shelf back (decision 11). The step starts it empty; whatever is in her bag is counted as the
  game opens.
- **Where she sees it:** the Cabinet's "Shelves to finish" under the cases (each shelf's count,
  a tick when done, and her squishies and dolls as shadows until she has had them); the museum
  shows a wing per family, each filling as she donates. Wrapunzel's letters at ten and all 41 on
  show stay as they were.

**Rejected:** a saved list of rewards given (the letters already are one); shelves by rarity
(the families and seasons are what the Cabinet already shows); a display piece that shows
whichever critters she donated (one per wing is enough, and a piece's art is baked once); doll
furniture she arranges (a dollhouse is a piece like any other).

## 168. More ways to make Candy: each bounded by a window, a day, a week or a tree, never by a loop

_2026-10-01, session E1 (lane 1)._ The plan's E1 and her answer 79 (baking with Wrapunzel).
Five ways, each held by something time makes, so `tests/data/economy.test.ts` still finds no loop
that makes Candy from nothing (decision 128):

- **Making adds value.** Everything a recipe makes for her bag is worth a quarter more than its
  plainest inputs at least (pumpkin pie 150, rose jam 200 were below it), and what's made only of
  what the shops sell still never sells for more than buying it all cost.
- **The stall takes what she makes.** `STALL_WARES` is every crop's harvest and everything a
  recipe makes for her bag, at the shop's own price. A `stallShelf` recipe (`Made` `{ shelf: 1 }`,
  wood and stone, known from the start) builds a second shelf: 16 more places and 3 more sold a
  window (`stallHolds`, `stallSells`; `stall.shelves`, save v31).
- **Cobweb Corner's wanted list.** Three things a week at double (`WANTED_PAYS`): a common or
  uncommon critter living in town in every season, weather and moon; a crop; and a dish with
  something in it no shop sells (`src/data/wanted.ts`). Dealt from the week (`wantedOn`,
  `paysOn` in `systems/shop.ts`), so nothing is saved; said on the Sell tab's line and pinned on
  the noticeboard. The stall still sells at the plain price: it sells while she's away, across
  weeks.
- **Candy saplings.** A shake of the candy tree that brings down Candy drops a sapling about one
  window in five (`dropsSapling`, hashed from the window, so shaking twice can't fish for one),
  while she has fewer than three trees counting those in her bag. It's a keepsake, never sold or
  given, planted in one of two rings of earth in her yard (`saplingPlot`, `V` in the town map, at
  her yard's west corner and by the farm gate), and a candy tree three days later that fills and
  shakes like the first (`CandyTree.tend`, `stage`; `candyTree.saplings`, save v31).
- **Baking with Wrapunzel.** Once a day, while both are in Crumbs & Curios, a 🧁 in her talk:
  the day's bake (three, dealt from the day key in `src/data/baking.ts`), 60 Candy, two to take
  home and a little friendship (`world.baking`, `Baking`, kept in `Takings` as `bake:`).

**Rejected:** a cap on how many wanted things she sells (a limit is a punishment, decision 11;
the pools are what bound it); saplings anywhere she taps (a tree on a path or in a bed is a mess
the map can't hold, and two named rings are a place to look forward to); the stall selling wanted
things at double (it would pay double for a week she wasn't there); baking as a minigame (her
answer asked for a little job, and a tap in the talk she already opens is the gentlest).

## 171. Indoors and small things: 24-pixel museum cases, close-ups framed to the piece, and a rod she paints

_2026-10-01, 0.2's K2 (lane 2), overnight; the warmest defaults, with questions 98–100 open._ The
indoor and small half of "a fresh polish on everything", with two of her touches.

- **The museum shows the town's 24-pixel critters.** A case is three tiles wide (`museumCase`,
  96×90), four critters a shelf on three shelves behind dusky glass so a pale moth stands out; the
  museum half of Crumbs & Curios is re-laid round them, the room two tiles wider (20), the cases
  in two rows of three with a walkway between, the front row far enough forward that she isn't
  hidden walking behind it. The 16-pixel `frames` are left for the smallest fish shadows and the
  butterflies.
- **The closet's close-ups are framed to the piece** (`closeUpOf`, `src/sprites/closeUp.ts`): the
  pixels that change when she takes it off, centred, at 16, 24 or 48 a side (each a whole number
  of times into the 48-pixel picture). Shoes and a necklace come in at 3×, a top or a hat at 2×
  (a wide brim may lose its tips rather than show all of her), a cape at 1×. Above her is clear
  air, so a hat is centred in its frame.
- **Small things from the art notes:** a fish's shadow has a rim of the water's light
  (`rimmed`), the bite's "!" is a bubble half again as big, the catfish's whiskers curl, a dish's
  steam is wisps paler at the tip, the pie has a bat with ears and wings, the stove's kettle a
  spout two pixels thick with steam off it, the pumpkin stool a carved face in ink, the bed card
  shows the bed as it stands at 32 (`drawBedPicture`) rather than the crop's icon, and the
  calendar's days are marked in drawn 16-pixel marks (`CALENDAR_MARKS`), not emoji. The emoji
  stay in the calendar's lists, as they do across the HUD.
- **Her teal stand mixer** ("The kitchen (21)"): `tealMixer`, the game's own, on Cobweb Corner's
  floor shelf at 420 Candy, in `src/sprites/touches.ts` with the other touches.
- **Her rod's colour** ("The rod (18)"): eight paints (`data/rods.ts`, `ROD_PAINT`), the float
  left as it is. A second tap on the rod she's holding opens `src/hud/RodSheet.ts`. The colour is
  **kept by the phone beside the save** (`src/persistence/rod.ts`), as the sound switches are,
  and handed to the drawing by `paintRod` in `render/scene.ts`: lane 2 doesn't change the save's
  shape (decision 163), and it's only how the rod looks. A backup code doesn't carry it. A later
  save-lane session can fold it into the save by reading the phone's key in a migration.

**Rejected:** cases a family wide each (the fish and frogs would need a case of their own size,
and six sizes of case for one room); overlapping 16-pixel boxes kept with bigger critters (they'd
cover each other); a fixed box per slot for the close-ups (what made a hat mostly her face);
waiting for the save lane to paint the rod (her touch would wait a session for a field that
changes nothing but a colour); tying the rod to the broom's ribbon (one choice for two things she
picks separately); drawing the calendar's lists in pixel marks as well (the rest of the HUD speaks
in emoji; the grid is where they were too small to read).

## 172. Music by place and window: a theme a row, arranged three ways, crossfading

_2026-10-01, 0.2's H1 (lane 2), overnight; "Wonderwall" for the hall (her answer 30), question 100
(another song) open, so the rest are the game's own._

- **A tune is a row, not a score.** `src/audio/music.ts` keeps a `THEMES` row per place: a melody
  written bar by bar between `|`s, a chord a bar, a metre and a feel (`waltz`, `oompah`, `ripple`,
  `rock`, `lute`, `chime`, `strum`). `arrange` writes the parts from it, so a new place's music is
  a row, and a bar the wrong length throws (the tests read every one).
- **Eight places and the festival.** The town keeps its music-box waltz, note for note; Whisperwood
  is a slow waltz over a rippling arpeggio, Lantern Shore a rocking boat song, the castle hill a
  stately air on a lute, the hidden clearing a few held bells, her home a lullaby waltz, and every
  shop and neighbour's house shares one bright browsing tune (`placeOf`). Castle Mac-A-Boo's hall
  strums F♯m7, A, Esus4, B7sus4 with E and A ringing over each, the way their first dance was
  played, under a melody of the game's own: like it, never it, as the records are.
- **Three windows, one row.** A morning plays a touch quicker with a brighter bell and a dewdrop
  over each bar; an evening slower, softer, with a pad holding each chord; the afternoon as
  written. So every place has three tunes without writing twenty-four.
- **The festival plays in town only.** While the Halloween Festival is on its oom-pah takes the
  town's place; the woods, the shore, indoors and home keep their own, so October still sounds
  different from place to place. (J2 had it everywhere, in place of the one waltz.)
- **`SoundBoard.setMusic` takes a `MusicKey`** (`town@evening`), from `musicFor(zone, window,
festivals)`, set on every fixed step in `main.ts` (so smoke's manual steps hear it too). Each tune
  plays through a fader of its own on the music bus; a new key fades the old one out over a second
  and a half while the new one fades in, and stops what of the old was still to come. Records still
  stop the music outright. `sound.musicPlaying` is the key playing, for smoke, which hears her home's
  tune come in at her door and the town's back outside.
- **`audio/` still reads no rule.** The window comes from `windowOf` in `main.ts`; `music.ts` takes
  a `DayWindow` and the zone, and nothing about the save changed.

**Rejected:** a whole tune written out per place and window (twenty-four scores to keep in step,
and a morning that's a different song isn't the same place waking up); crossfading by playing both
tunes on for a few seconds of scheduled notes (the old one stops at the lookahead's edge with a
click; a fader is smooth); the real "Wonderwall" melody (the game copies no tune; the strum and
the ringing strings say it); the festival tune everywhere in October (it would hide H1 all month).

## 173. The fountain's music box: a fourth arrangement, heard from its bank after dark

_2026-10-01, 0.2's H2 (lane 2), overnight; questions 101 (a song for the fountain) and 102 (a
Christmas song) open, so both tunes are the game's own._

- **Who's by it is a rule, what it plays is the music's.** `world.fountain` (`Fountain`, keeping
  nothing) says whether she stands within `FOUNTAIN_REACH` (7.5 tiles) of a fountain's middle
  once its lamps are more than half lit (`fountainLit`, `systems/fountain.ts`): anywhere on the
  bank round the pond, from about a quarter past six till a quarter to seven in the morning. A
  test holds every tile of the bank in reach and her door out of it.
- **A music box is an arrangement, not a theme.** `MusicKey` is `theme@arrangement`, and the
  arrangement is a window or `musicBox` (`musicBox` in `audio/music.ts`): the melody high on
  bright tines (up an octave if the tune sits low), a broken chord under it and a low tine a bar,
  every part plucked, a touch slower. So any theme can go on the box: the fountain's own waltz
  most of the year, the Halloween Festival's while Halloween's things are up, Christmas's jingle
  while the tree is.
- **Christmas plays in town while its tree is up** (1–30 December), as the festival does in
  October: `christmas`, a jingle with sleigh bells (a `sleigh` feel, `hat` noise on the half
  beats). `musicFor` now takes an `Occasion` (festivals, decor, fountain) rather than a list.
- **The lamps pulse to what's heard.** `SoundBoard.musicBeat()` is how far through its tune the
  music is, in beats; `main.ts` hands the view `fountainBeat` (the box's beat, or, with the
  music off, the beat it would be on by the clock), and `render/fountain.ts` swells the
  fountain's lights on each beat (an even step of radius, so only a few pools are drawn) and
  floats a quaver off the jet per beat, left and right in turn. The notes stay still for a phone
  that asks for less motion; the lamps still pulse.

**Rejected:** the fountain as a theme of its own with no box (Halloween and Christmas would need a
box version written each); the fountain's tune layered over the town's (two tunes in different
keys and tempos); hearing it only right at the water's edge (the pond is wide: the bank is the
fountain's place); a flicker by the clock unrelated to the tune (the brief is "pulsing to it").

## 174. Sitting is her standing, folded; seats are rows, and nothing about it is saved

_2026-10-01, 0.2's G1 (lane 2), overnight; question 104 (a favourite spot to sit) open, so the
seats are the town's benches, the log and stump in the woods, and the chairs indoors._

- **A seat is a row.** `seat: { height }` on a furniture row (the pumpkin armchair, the wingback,
  the velvet settee, both stools, her makeup chair), and `PROP_SEATS` (`data/seats.ts`) for the
  bench, the fallen log and the stump. `height` is how far up from the floor at its front edge
  her hips rest, judged against `sit:*` in the gallery (her sat on each). The salon chair stays
  a fixture that opens the salon.
- **Walking up sits her down; the next tap only stands her up** (decision 136). `world.sitting`
  (`Sitting`) holds where she sits (`seatOn`: the end of a long seat nearest her), and the arrival
  that brought her there still says its line. Any walk, crossing or decorating stands her up.
- **The pose is her standing layers with her thighs folded out** (`seated` in
  `sprites/doll.ts`): `SIT_DROP` rows taken out at `SIT_FROM`, measured from her feet so a tall
  hat is untouched, and as many blank rows put on top. Her knees point at us and her hands rest
  on the seat beside her. Every outfit sits without art of its own, since it's the same layers.
  A chair turned to the wall seats her with her back to us, drawn behind its back; sideways she
  still faces us. `scene.ts` draws her with her hips on the seat, just in front of it.
- **Not saved.** She keeps the tile she walked to, so a reload has her standing beside the seat,
  and lane 2 still hasn't changed the save's shape.
- **Her big comfy makeup chair** (personal_touches.md, "Furniture (3)"): blush-pink velvet with
  a buttoned back, rolled arms, a gold heart on top and a gold footrest ring she puts her feet
  on, on Cobweb Corner's furniture shelf (`makeupChair`, art in `sprites/touches.ts`).

**Rejected:** a sitting body drawn per facing with bent legs (every hand-drawn skirt and the
side views would need a sitting version too; the fold works for every look); moving her onto the
seat's tile (it's solid, and her saved tile would be somewhere she can't stand); a side-on sit
for chairs turned sideways (the side view folded reads as short legs, not sitting); sitting
saved across a reload (decision 136: nothing else happens, so there's nothing to come back to).

## 175. What a neighbour brings up is a topic row, chosen before their own lines every other talk

_2026-10-01, 0.2's D2 (lane 2), overnight. Her touches: her day (the school run, a quiet hour,
family evenings), rain and storms, 21 and 25 September (personal_touches.md, "Talk (D1, D2)" and
"Dates")._

- **A topic is a row, a line each.** `SMALL_TALK` (`data/smallTalk.ts`) has thirteen topics
  (storm, rain, fog, a happening of theirs later today, what she caught today, the pet walking
  with her, her net, can, rod or a seed in her hand, and her day by the window), each with a line
  in every neighbour's own voice. `{catch}` is the critter with its "a" (`aCritter`), `{pet}` the
  name she gave it, `{happening}` and `{place}` from `HAPPENING_CALLED` and the happening's row.
  Rainy days are good days: every rain and storm line says so.
- **Chosen in `systems/dialogue.ts`, before the band's line.** `smallTalk` lists what fits now,
  sky first and her day last; `lineFor` says the first she hasn't heard from them today, unless
  the last thing they said was one, so their own lines still come every other talk. The day's own
  line (a special day, a holiday) comes first, and happenings, visits and small events still come
  before any of it. A line naming a newcomer waits as every line does.
- **The world hands it a `TalkScene`** (`talkScene()` in `world/build.ts`): today's weather and
  storm, what's in her hand, her last catch today (`Collecting.caughtToday`), and the pet beside
  her. Nothing is saved: a reload forgets the catch, which only means a line fewer.
- **21 September and 25 September are special days** (`septemberSong`, `dollyDay`): a line from
  everyone first (Cody's is his greeting that day), a row and a drawn mark on the calendar, and
  clear skies as on her other days. Their song is theirs to sing, so the lines only know the date,
  and in town the music is a bouncing tune of the game's own (`septemberSong` in
  `audio/music.ts`, `special` in `Occasion`). On Dolly Parton day every place has at least
  sixteen monarchs (`monarchsOn`, `systems/calendar.ts`), and the lines nod to her (big hair,
  rhinestones, a coat of many colours, nine to five), never a likeness or a lyric.

**Rejected:** small talk mixed into the band's lines by the day's hash (a rainy day might never be
mentioned); small talk every talk while any fits (her day and what she holds nearly always fit,
and the neighbours would stop sounding like themselves); one shared line per topic with a
neighbour's name swapped in (they each have a voice); saving today's catch (lane 2 never changes
the save, and it's worth only a line); a tune like the song itself (it's theirs, and the brief
says never the song's).

## 176. A crop's season is read off the day it went in; each new food crop feeds a dish someone loves

_2026-10-01, 0.2's N2 (lane 2), overnight. Her touches: pretty flowers and a vegetable or two
(question 13), spaghetti and chips and guacamole (19, 20), fun things to grow and food for dishes
the neighbours like (52); questions 86–87 (a crop for a planter, a plant for the new plots)
answered by default (personal_touches.md, "Collecting")._

- **Twelve crops, half flowers.** Tomatoes, garlic, basil, avocado, sweetcorn (the corn maze's)
  and glow gourds (the game's own, glowing after dark like the moonflowers); sunflowers, black
  tulips, lavender, marigolds, Christmas roses and irises. The garden stays at least half
  flowers, and pumpkins stay the quickest. Each is a `CROPS` row, an item and a seed with a value
  (about 20 a day of growing, as before), art in `sprites/garden.ts` (a new `STRAPS` of strap
  leaves for the bulbs) and `sprites/items.ts`, a place on the Seeds shelf, which now deals six
  of its twenty-two a day, and a seed of each in a new game's bag.
- **A season is a row's `season`** (a `SeasonId`, the Cabinet's months), and a crop planted in
  it ripens a day sooner, read from the 5am day it was planted (`plantedInSeason`,
  `systems/farming.ts`), so nothing new is saved. With `thrives` too it's two days sooner, never
  under one. Out of season it's its usual days: nothing is slower (decision 11). The packet and
  the seed sheet say which season, and planting says so.
- **`thrives` can name her home** (`'home'`): basil grows a day sooner in a planter box, the
  herbs on the windowsill of question 86. Christmas roses love Whisperwood's shade and irises the
  lake's wet feet (question 87).
- **Each food crop feeds a new dish someone loves.** Her spaghetti (tomatoes, garlic, basil) and
  her chips and guacamole (avocado, tomato, sweetcorn for the chips) are known from the start,
  like the first four, so an older save knows them too; roast glow gourd (lures orbs) and
  lavender shortbread (lures moths) are cards. Chips and guacamole is one of the night's snacks
  now and then. Every crop is loved by someone or goes into a dish someone loves
  (`tests/data/crops.test.ts`), and every dish is worth a quarter more than what goes in.

**Rejected:** a season that slows a crop out of it (decision 11); storing the season or a
`seasonal` flag on the planting (lane 2 never changes the save, and the day it went in already
says it); a letter with the new seeds for a town already going (one more piece of mail
machinery; the Seeds shelf has them every day, and the mayor's notes say so); giant pumpkins
(the patch pumpkin is already one) and a seventh food crop (the garden must stay half flowers).

## 177. Personal touches are parked until the game works for her

_2026-10-01, after both overnight lanes landed. The user: "Let's skip all of the personalization
questions for now. Keep track of them, but we want a functional game for her right now, then we
can add more personalized easter eggs."_

- **No questions between phases.** Sessions no longer ask for personal touches before a phase,
  and add no new numbered questions. Where a touch would go, a session picks the warmest
  sensible default and names it in its decision, as the lanes did.
- **The asked questions are kept.** 81–89 and 96–110 stay in `docs/handoff.md` under "Still to
  put to the user", marked parked, until the user takes them up again. Each already has a
  default in the game, so an answer is a row or a line, never a blocker.
- **Answers still land the same way.** Anything the user offers anyway goes into
  `personal_touches.md` and the game as before.

**Rejected:** clearing the questions (they're the easter eggs to come); asking them once more in
a batch (the user said not now).

## 178. A sheet on a phone on its side is two columns, the whole height

_2026-10-01, the shakedown before 0.2.3: everything the lanes landed, played with a lived-in
0.2.2 save, upright and on its side. She plays on its side (decisions 159–160)._

- **What was wrong.** On its side a sheet rose from the bottom stacked as upright: the head (title,
  search, filters) and, once a thing was tapped, its card in the foot left the body about 15
  pixels. The bag's bracelets went out of reach as soon as one was picked, the closet showed the
  top of her head, and the title's Tap to begin sat below the screen.
- **Two columns, the whole height.** In the landscape media query a sheet is a grid: its head and
  foot down the left (the head scrolling if they're crowded, as the shop's Sell tab is), its body
  the whole height on the right. Nothing in `openSheet` or any sheet changed; it's all CSS.
- **The title's picture stands beside the words**, scaled to the height.
- **Smoke's `sideways`** checks a sheet's list keeps most of the height with a card up, and that
  the title fits. Both fail without the fix.
- **The rest held.** The save goes from v27 to v31 with nothing lost; every sheet opens by real
  taps upright and on its side with no console errors; frame times match 0.2.2's (town 52ms
  against 49ms at a quarter CPU, home the same, within run-to-run noise).

**Rejected:** a smaller type or tighter head on its side (still no room once a card is up);
covering the strip with a full-screen sheet stacked as upright (the head and card alone fill
390 pixels).

## 190. The piano plays a tune in turn, and anything that plays is a `plays` on its row

_2026-10-01, session G2 (lane B). Personal touches parked (decision 177): the defaults are named
here._

- **`plays` names an instrument** (`'piano' | 'musicBox'`, `data/instruments.ts`), on a
  furniture row or a fixture row alike. Each tune is a `TUNES` row (its name, its instrument and
  the line she reads), its notes a `Tune` in `audio/pianos.ts`. Walking up to anything that
  `plays` sends a `tune` moment, which plays on the record's bus (the music hushed until it ends)
  and toasts its line. The next thing that plays is a row and some notes.
- **Each instrument plays its tunes in turn**, starting the day on one dealt from the day key
  (`world.instruments`, `Instruments`). Nothing is saved; L2's lessons can add tunes as rows.
- **Four piano tunes, all the game's own notes:** "Hush Up and Dance", in the style of "Shut Up
  and Dance" (her answer to question 32, first in the list), the "Moonbite Sonata", "Fur Elise"
  (a werewolf's waltz) and the "Skeleton Rag". The names are puns in the records' manner.
- **The piano is a piece** (`piano`, two tiles, an upright with a candle at each end), made at
  the workbench from the recipe `piano` (20 wood, 4 stone), whose card is on Cobweb Corner's
  shelf at 450. L1 may give the same recipe as Boothoven's third reward; a recipe she already
  knows is simply known.
- **The castle hall has a grand piano** (the `hallPiano` fixture, three tiles by two), and
  Boothoven's `grandPiano` (L1's, which merged first) plays too, its line giving way to the tune's.
  The hall's music box is folded onto `plays`: it now plays their first dance (the hall's
  Wonderwall-like theme on its tines), its line moved onto the tune's row.

**Rejected:** a playable keyboard (decision 136); picking a tune at random each time (two the
same in a row feels broken); folding the record player onto `plays` (it plays what's in her bag,
and dances, so it's not a list of tunes).

## 179. One sheet frame: a picture, tabs where there are sections, larger type

_2026-10-01, session U2 of 0.2 (lane A). Personal touches are parked (decision 177), so the
defaults below are the warmest sensible ones, named here._

- **The frame owns the head.** `openSheet` (`src/hud/dom.ts`) lays out a picture (optional,
  `picture`, a box of `THEME.picture`, 64px) beside the title and its line, then the tabs, then
  whatever the sheet pins under them. The old `head` option (a sheet's own head) is gone: the
  talk, greeting and pet sheets hand in their portrait as the picture, with the name as the title
  and "The vampire" or the pet's kind as the line.
- **Tabs are the frame's, with a panel each.** `tabs` puts a row of folder tabs (`role="tab"`)
  along the head and a panel per tab in the body (`sheet.panel(id)`); `onTab` hears a change,
  `show` changes it, `memory` remembers it while the game is open. Tabs only where a sheet has
  sections that stand apart: the shop (Buy, Sell), the creator (You, Hair, Face, Tattoos, her doll
  above them all), the closet (Clothes, Wrists, Tattoos, Face), the Cabinet (Cases, Shelves), the
  museum (To donate, On show), walls and floors (Wallpaper, Flooring). A collection's filter chips
  stay filters, not tabs: they narrow one list.
- **Pictures where the game has a drawing of the thing:** a neighbour's or pet's portrait, her
  broom and her rod in their colours. The default for the rest is none, rather than an emoji.
- **Larger type:** titles 25px, body 17px, lines 16px, buttons 17px, a row's note 14px.
- **Item cards:** the picture at 64px in a framed box, the name with the description under it
  beside it, the buttons below. The Cabinet's case card is drawn the same way.
- **Smoke** checks every sheet as its section opens it (`framed`): a title in the larger type,
  the picture when it has one, nothing wider than the phone, and every tab showing its own panel.
- **Decision 178 holds:** on its side a sheet is still two columns, the head (with its tabs) and
  foot on the left, the panels on the right; smoke's `sideways` is unchanged and green.
- Settings, the map and the calendar get the frame's type now and their own redesign in U4.

**Rejected:** tabs drawn by each sheet (the shop's old chip row): every sheet would have its own;
the doll as the closet's picture (64px is too small for her, so she stays above the panels);
tabbing the honesty stall (putting out and taking back read best side by side).

## 191. Boothoven writes soon, is welcomed round the well, and gives a record and a metronome

_2026-10-01, session L1 of 0.2 (lane B, beside G2). The plan's L1, and her answer 27: a letter
first, then the move, then a welcome party._

- **He writes two days after the game first knows of him, whatever the month.** A newcomer row
  may say `soon: n`: the save keeps the day the game first knew of them (`newcomers.heard`, save
  v32; an older save hears of him the day it first loads), and they write `n` days later, taking
  no month's turn from the others and not starting the month to the next over. Two days, so she
  meets him in the first week of the release without it being the very first thing she sees.
  A brand-new save hears of him on its first day too, so he is a new player's first newcomer.
- **Then he moves in, east of the square beside the salon** (a lot at 35,21; one bush was taken
  out of the map for it, the east meadow's spot moved to 37,26 and its lost-things spot to 38,26).
  His house is a tall plum townhouse with a quaver for a weather vane; inside, his parlour, a
  grand piano (a fixture, `grandPiano`: G2 and L2 make the town's pianos play), sheet music, and
  his keepsakes, a music stand and a framed page.
- **Then the welcome party, the evening after he moves in, round the well** (a happening
  `on: { welcome: 'boothoven' }`, 6 to 9pm, everyone at their party spot). Happenings are read off
  the day key alone everywhere else; the welcome party is the one exception, told the letters'
  days by `Newcomers` (`knowWelcomes`) rather than threading the save through every caller of
  `happeningOf`. The moving-in toast says when it is. He is at the holidays' parties round the
  well too.
- **His favours:** a lost page of music (a `LOST` row, `lostNote`; small events now deal lost
  things only among those who live here, so he loses nothing before he arrives), a tune for the
  fountain (stones to drop in, to hear its note), wood for his creaking bench, and a moonflower.
  He loves the moonflower, moonflower tea and the Fleetwood Mac-abre record, and likes records.
- **His rewards are his own shape, like Cody's:** at three hearts his record, the Boonlight
  Sonata (slow rolling triplets in a minor key, the game's own tune), and at six his metronome.
  The third, the piano's recipe at ten, waits for L2, since G2's `piano` hadn't merged when L1
  wrote his rewards. `tests/data/villagers.test.ts` names him beside Cody as the exceptions.
- **His look, from the doll's parts:** ghostly skin, shaggy white hair gone wild with composing,
  a black tailcoat and boots, and two touches of his own: a white cravat and a little lavender
  quaver that floats beside his head. At Halloween he goes as a rock star (week three).
- **Defaults chosen** (personal touches are parked, decision 177): his name, lines and loves are
  Claude's; nothing new was put to the user.

**Rejected:** writing in his month's turn (he'd wait up to a month, and the plan wants him in the
first week); a dated `from` on the row (nobody knows the release day); threading the newcomers'
letters through every happening call (eight call sites for one party); a `piano` furniture piece
of his own (G2's).

## 180. The neighbours sheet: a 👥 in the top bar, a list, and a page each

_2026-10-01, session U3 of 0.2 (lane A). Personal touches are parked (decision 177), so the
defaults below are the warmest sensible ones, named here._

- **A 👥 in the top bar**, between the day and Settings, opens `openNeighbours`
  (`src/hud/NeighboursSheet.ts`, through `NeighboursApi`). On a phone on its side it sits in the
  bottom strip with the rest of the top bar. Upright, to keep the bar inside 390 pixels in a
  festival (the day's chip with its countdown is 174 wide), the bar's gaps and the Candy's and
  day's padding are a little tighter, the day's chip gives way first (an ellipsis) on a narrower
  phone, and the month's trim is hidden below 420 pixels, where it had no room left anyway.
- **The list:** everyone in `VILLAGERS`' order, each a row with their portrait, hearts (a 🎂 on
  their birthday) and where they are now. A tap opens their page.
- **Who she has met** is `world.neighbourhood.knows`: her first six neighbours from the start
  (they're the town she moved into), a newcomer once she has talked to them or they're any
  hearts along. A newcomer who has moved in but isn't met yet is their shape (the portrait filled
  with one colour, `drawShadowPortrait`), "Someone new has moved in. Go and say hello!", and a tap
  finds them; one still to come is the shape and "Someone new is coming.", not a button. A new
  newcomer row (Boothoven) needs nothing here but a birthday.
- **A page each** is the U2 frame: their portrait, name and kind, tabs About and Gifts (remembered
  while the game is open). About: hearts, the band in words (getting to know you, friends, close
  friends, best friends at ten), where they are, their birthday, what they love (a grid of the
  items) and like (the kinds, in words). Gifts: the three rewards, each its picture, its name and
  what sort of thing it is, marked ✓ Sent once she's there, ♥ n before. Who gives what lives
  here, as decision 141 said.
- **Where they are** is `world.neighbourhood.whereIs`: the place they're in now, said as a
  sentence ("at home", "out in town", "at the Muse Hair Salon", "in Whisperwood"), with what for
  when it's more than their day: a happening of theirs (once they're there, not on the way), a
  visit (to a neighbour, or to her), her birthday party, or unpacking on moving day. A place
  outdoors she hasn't found is "somewhere you haven't been yet", so the sheet never spoils the
  hidden clearing.
- **Find walks, never hops.** `world.seek(id)` walks her up to them as a tap on them would (and
  the talk opens on arriving), only if they're where she is; otherwise the sheet says where they
  are and to head over. A hop to a neighbour would make the broom (P1) and the walk pointless.
- **Birthdays** are `src/data/birthdays.ts` (`BIRTHDAYS`, `birthdayOf`, `isBirthday`), a day that
  suits each: Maude All Souls' Day (2 November), Rufus May Day, Wrapunzel the day the boy king's
  tomb was found (4 November), Agatha midsummer (21 June), Barty the first day of spring (20
  March), Ollie World Post Day (9 October), Nessa the day the lake monster's photo was printed (21
  April), Gourdon Pumpkin Day (26 October), Hazel the Perseids (12 August), Boothoven Beethoven's own (16 December). Cody's is his own to
  tell, so he has a line, "He says it's tomorrow. It's always tomorrow.", after his habit with
  hers; the user can give a real date any time. For now a birthday is shown, not kept: no party,
  letter or calendar mark (U4's calendar could add the marks).
- **Smoke's `relations`** checks the 👥 is a thumb wide and clear of the day and Settings, the
  sheet and a page are on the frame, newcomers to come are shapes, Find walks her to someone here
  for a talk, and Find on someone elsewhere says where and leaves her standing. `sideways` checks
  the 👥 is on screen on its side.

**Rejected:** a teleport to a neighbour (the plan: never); one sheet with the list and a page
swapped in its body (the U2 frame's picture and tabs belong to the page); hiding the gifts she
hasn't reached yet (the plan asked to know what neighbours give); putting the birthday on
`VillagerRow` (a required field there would break lane B's Boothoven row mid-flight; the
`Record` in its own file asks the same of it, with a one-line fix).

## 192. Boothoven teaches a tune a day, and plays their duet at the castle on her anniversary

_2026-10-01, session L2 of 0.2 (lane B, after G2 and L1). Personal touches are parked (decision
177): the defaults are named here._

- **A lesson is a 🎹 in his talk, once a day, in his parlour, at friend.** Like baking with
  Wrapunzel (decision 168): `world.instruments.canLearn` wants him living here, three hearts or
  more (`tierOf`'s `friend`), the two of them in `boothovenParlour` (he's there most weekday
  mornings), a tune left to teach and today's lesson not yet had (`lesson:boothoven` in
  `Takings`, once a day). `learn` teaches the next, says his line for it, plays it through (a
  `tune` moment with a `line`) and is worth a little friendship (15 points). "Each visit" is read
  as each day: a lesson every talk would run through them in a minute.
- **Four lessons, in order, all the game's own notes:** the "Lantern Waltz" (F major, three-four),
  the "Cobweb Nocturne" (E minor, rolling eighths), the "Belfry Boogie" (a twelve-bar boogie) and
  the "Phantom Galop" (fast, A minor). Each is a `TUNES` row with `learnt: 'lesson'` and a
  `taught` line, its notes in `PIANO_TUNES`; a fifth lesson is a row and some notes.
- **What she has learnt is saved** (`tunes`, save v33; `Instruments.snapshot`), and every piano
  (hers, the hall's, his) plays it in turn with the four she knew: `tunesOf(instrument, learnt)`.
  A saved tune this build doesn't know, or one known from the start, is let go.
- **The duet is on her wedding anniversary (6 June), at the castle hall, in the evening.** A
  happening, `anniversaryDuet`, on a new kind of day, `{ special: 'anniversary' }` (any of
  `SPECIAL_DAYS`), 6 to 10pm, puts Boothoven at the hall's first stand, now beside the grand
  piano, and Cody by the cake to listen. "Their anniversary" is read as hers and Cody's: it's the
  day the hall was made for. Once she and Boothoven are close (seven hearts), walking up to the
  hall's piano while he's there plays "Forever Orbs" (their name for each other, personal
  touches), a duet: her tune on top, his a ghostly sine a third under. It's learnt then, and her
  pianos play it after. Before they're close the piano plays as it always does and he just
  listens; his line at the happening promises nothing.
- **The piano's recipe is his ten-heart reward,** and still a card at Cobweb Corner: the one
  recipe with both a `teacher` and a `card` (she may have bought it before he came; a recipe she
  knows is simply known). His rewards are a record, a piece and a recipe, so the villagers test
  checks three, six and ten hearts for everyone and his kinds on their own.
- **Defaults chosen** (decision 177): the tunes' names and his lines are Claude's; nothing new
  was put to the user.

**Rejected:** a lesson every talk (all four in a minute); a lesson anywhere he is (a piano lesson
wants a piano); taking the piano's card off the shelf (G2 shipped it, and some may have bought
it); the duet as a talk button (walking up to the piano is how everything that plays is played);
a `Tune` the two of them dance to, like the record player (a duet is sitting at the keys).

## 181. Settings, the map and the calendar on the frame: tabs, a compass of ways out, spans and birthdays

_2026-10-01, session U4 of 0.2 (lane A, its last). Personal touches are parked (decision 177), so
the defaults below are the warmest sensible ones, named here._

- **Settings has three tabs: Sound, News and Backup** (remembered while the game is open). The
  line under the title says whether the town is kept safe, where it's seen every time; Sound is
  the two switches, News the mayor's notes for this version, Backup the code (copy, share) and
  bringing a town back. No picture: the game has no drawing of a gear (decision 179's default).
- **The map opens on Ways out, then World.** Ways out is a compass: the place she's in in the
  middle ("you are here"), each edge's ways on that side of it, named once she has been there,
  "a way nobody takes" for a secret one and "somewhere still to find" otherwise; a way to a place
  she knows and can reach is a button that flies her there, the same `go` as a pin. World is
  the pin map as before. Nothing in the sheet names a place: a new `ZoneId` (lane C's fairground)
  is one more `ZONES` row and shows on both tabs by itself.
- **The calendar has tabs Today, Month and Coming up**, and today's mark as its picture (the
  day's first row, else the festival's, else a neighbour's cake, else a plain page with rings, two
  new 16-pixel marks in `calendarMarks.ts`), so it always has one.
- **A festival is one span.** Its days carry a band along their foot, drawn across the gaps
  between days and rounded where it begins and ends and where a week wraps; a key under the month
  names it and its dates ("1 October to 31 October"); a tap on a day says "Day 5 of 31"; Coming up
  gives its dates beside its name.
- **Birthdays of the neighbours she has met** (`knows === 'met'`, so a newcomer's waits until
  she has talked to them) are a lavender cake on their day (hers stays pink), a row in the day's
  detail and Today ("A gift today would make it."), and in Coming up for the month ahead. Kept as
  marks only: no party or letter, as decision 180 left it.
- **Smoke** checks each sheet on the frame (`framed`), the settings line and Backup tab, the
  ways out laid round where she is (west to the left), flying by a way, Coming up, October's band
  as five rounded runs with its key, Maude's and Wrapunzel's cakes in November, and on its side
  the map's compass on screen. Decision 178 holds: the three are two columns on a phone on its side.

**Rejected:** a tab per section of Settings as it was (five tabs for a sheet of a few buttons);
arrows drawn on the World map for the ways out (they crowd the pins, and a list round the place
reads plainly at a glance); every neighbour's birthday from the start (a newcomer she hasn't met
would be named before she knows them, against decision 162).

## 200. The Hollow Fairground, the place (0.2's M1, 2026-10-01)

Lane C's first session. **Decided:**

- **A place of its own, through a gate at the town's south-east** (`fairground` in `ZONES`, a
  new `MapZoneId`; nothing saved changed shape: the atlas keeps it by id). The road down the
  park's east side runs on to the bottom edge (row 49, columns 34–35) between two gate posts, the
  castle hill's kind of `gate` (decision 103), with a signpost (`FAIR`) beside it. Its `unlock`
  is `{ hearts: 1, with: 'boothoven' }`: meeting him and a first heart. The story is his: he
  hears its calliope from his window, the shut gate's hint names him, and he writes the
  `found:fairground` letter. On the world map at 44,80, below the town.
- **Its map** (`FAIRGROUND`, 30×34, its own legend `FAIR_LEGEND` extending `LEGEND`, since the
  shared legend has no free letters: `D` stage, `I` tent, `3`–`6` stalls, `7` big wheel, `!` a
  light pole): the way in from the gate on the west, a midway avenue all round with an aisle down
  the middle, the stage at the top with a square before it, the fortune tent beside it, a ring of
  four stalls facing in (ring toss, corn dogs for question 33, hook-a-ghost, toffee apples, each
  a prop id and a named spot at its counter for M2), and below, the big wheel and a pumpkin
  field. `FAIRGROUND_SPOTS` names the stage, each stall, the tent's flap, the wheel, the midway
  and the field.
- **String lights hang between poles** (`lightPole`): each pole swags its bulbs half way to the
  next, so poles three tiles apart make one unbroken string. The bulbs are keys `0`–`3`, never
  outlined, lit after dark like the festival's eave lights. Art is all in
  `src/sprites/fairground.ts`, from the building kit; the stalls are one drawing with a sign and
  wares each.
- **The fortune tent is a room** (`INTERIORS.fortuneTent`: a fortune table with a crystal ball
  and star charts, fixtures `fortuneTable` and `starCharts`), and Agatha's on weekend afternoons
  (1 to 3pm, behind the table); she's in town at noon still, as the villagers test asks. M2
  makes the table read fortunes.
- **Critters:** pumpkin bats, pumpkin toads and fireflies live only here (by the pumpkin field,
  and drawn to the string lights); candle moths, velvet and lantern bats, owl-eye, veil and
  mourning-cloak moths, skull and moss beetles and ladybugs come here too. Moving three out of
  town left fewer others there for the fog's orbs to crowd out, so the weather test's bar for
  orbs in the fog is 1.15× rather than 1.2× (it was passing by under 1% before). The rarity
  test's year still fills the Cabinet.
- **A tune of its own:** a calliope waltz (`fairground` in `THEMES`), in the three-four
  Boothoven's letter mentions.
- **Defaults chosen** (personal touches parked, decision 177): the stalls' choice, Agatha as the
  fortune teller, the critters and every line are Claude's; nothing new was put to the user.

**Rejected:** the fairground's gate on the graveyard's side (the graveyard is in the south-west
corner, hedged; the park's east road already ran to the bottom edge); an entrance arch over the
way in (a prop is solid over its footprint, so an arch she walks under needs drawing over tiles,
not worth it for M1); new critters of its own (art, items, museum letters: a session of its own).

## 201. The fairground's activities are rows, and a go is paid as it ends (0.2's M2, 2026-10-01)

**Decided:** what there is to do at the Hollow Fairground is a table, `ACTIVITIES`
(`src/data/activities.ts`), worked out in `src/systems/activities.ts` and done by
`world.activities` (`Activities`). A row is what she walks up to (a stall's prop, or the fortune
tent's `fortuneTable` fixture, which now `opens: { activity }`), what a go costs, its `hours`
(windows, `weekends`, and all day through a `festival`), what it `does`, and its keeper's line.
Arriving at one opens it (`hud.openFair`, `src/hud/FairSheet.ts` through `FairApi`, one small
sheet per kind on U2's frame); shut, it toasts when it opens next. Three kinds, five rows:

- **A game of taps** (`game`: ring toss at the ring toss stall, 3 rings at 5 bottles, afternoons
  and evenings; hook-a-ghost, 3 hooks at 4 ghosts, weekend afternoons and evenings; both all day
  in the Halloween Festival). Each throw one target glints, and a throw at it always lands; at
  another it lands 40 times in 100. The prize is by how many landed, from none (a sweet, "for
  trying") to all three (a keepsake: the ring toss rosette, the plush ghost), so there's always
  something (decision 11). **A go is paid for as it ends, with its prize**: a go left half thrown
  costs nothing, and nothing of it is saved. Every prize sells for less than a go
  (`tests/data/economy.test.ts`), and the top ones are keepsakes worth nothing, so no go makes
  Candy however she throws.
- **The fortune** (`fortune`, at the table): once a day for 10 Candy (`fortune:read` in
  `Takings`, `onceADay`), then free to read again all day. The day's line is dealt from the day
  key (`FORTUNES`), and the lucky critter is one `isAbout` from now until the day turns, one she
  hasn't caught if there is one, with the first hour it's out and one of its places. Agatha reads
  it (her portrait, her opening line) while she's in the tent, weekend afternoons; otherwise the
  ball reads by itself.
- **Snack stalls** (`sells`): the corn dog stall sells corn dogs (her answer 33), fried pickles
  and vinegar fries (answer 80), and tonight's snack by day (`tonight`, `snackOn` in
  `systems/gathering.ts`, the same deal as the night's); the toffee apple stall sells toffee
  apples and popcorn. At twice their value, as a shop sells a thing for her bag. They're `snack`
  items, so eating one is a spring in her step (`effectOf`'s pep), as the night's snacks are.

**No save change:** the fortune is a `Takings` key; a go lives only in memory; prizes and snacks
are in her bag. Six new items with icons (`cornDog`, `friedPickles`, `vinegarFries`,
`toffeeApple`, `ringTossRosette`, `plushGhost`).

**Defaults chosen** (personal touches parked, decision 177): the games, their prizes, prices,
hours and every line are Claude's; the snacks are her answers 33 and 80. Nothing was put to the
user.

**Rejected:** paying for a go as it starts (a sheet closed or a reload mid-go would lose it);
games of pure luck (a glinting target gives her taps a point, and makes the top prize hers to
earn); timing-based games (a real-time tap against a moving marker is fiddly on a phone and in
tests); Candy as prizes (any Candy back makes a loop to guard); a shop row for the snack stalls
(`SHOPS` deals stock by the day and window and pays her for selling, more than a stall of four
things needs).

## 202. The calendar comes to the fairground once its gate is open, and stays in town till then (0.2's M3, 2026-10-01)

Lane C's last session. **Decided:**

- **A happening row may say where it goes at the fairground** (`fair` on a `HAPPENINGS` row: how
  they gather there, an `Outdoors<'fairground'>`; the words the calendar says, "at the
  fairground's stage"; and what's set out there). `venueOf` (`systems/happenings.ts`) says where a
  happening is today, and everything that asked `where` or `place` (placing the neighbours, whether
  one is going on in a place, the neighbours sheet, the calendar, small talk, the moving-in toast,
  what's set out) asks it instead.
- **Moved to the stage:** the costume contest (the town lined up along the front of the stage,
  `lineUp1`–`lineUp10`, facing her, crowned with the 👑 as before, `world.finale` unchanged since it
  only asks whether a neighbour is where she is), the Halloween party after it (its chili table, the
  town's pumpkins and her cat-o'-lantern set out round the stage), Thanksgiving dinner, the New
  Year's countdown and the newcomers' welcome parties, each neighbour at a place of their own before
  the stage (`STAGE_SPOTS`, apart from the line-up so Boothoven, at the party during the contest,
  never shares a tile). **Carols stay round the well**: the town's Christmas tree stands in the
  square, and the carols are sung round it ("Carols by the well" is the name). The everyday ones
  (book club, the egg hunt by the willow, the fireworks picnic by the pond…) stay where they are:
  each belongs to its place.
- **Nothing is lost while the gate is shut** (decision 11): until the fairground opens (a heart with
  Boothoven, decision 200) every event happens in town exactly as before. Which it is comes from the
  atlas, already saved: `Travel` tells `systems/venues.ts` (`knowFairground`) as the world is made
  and the moment the gate opens, the same way `Newcomers` tells the happenings its letters
  (`knowWelcomes`). **Nothing new is saved**; `SAVE_VERSION` stays 33.
- **Market day's table moves to a stall by the stage** (`marketStall`, the stall drawing with
  baskets of apples and gourds and jam jars, `8` in `FAIR_LEGEND` west of the stage; two trees moved
  aside for it): a shelf may `moves` to another shop once the fairground is open, dealt the same,
  so Cobweb Corner's `Market table` becomes the `market` shop's (`SHOPS.market`, no shelves of its
  own). Walking up to it opens it on market day; any other day it says when it's full.
- **Saying where to go:** market day's `about` and morning toast have fairground words (`fair` on
  a `CALENDAR` row, read by `wordsOf`); the calendar's gatherings and a newcomer's moving-in toast
  give the venue's place; and the noticeboard pins up a poster for each of the day's events still
  to come (`postersOn`: market day, all day, and each happening with its hours and where, leaving
  out an everyday one whose host is at a holiday's), above the notes.
- **Smoke:** the finale is at the fairground now (the town's version is held by vitest, since smoke's
  earlier `fair` section opens the gate for good), with the chili at the stage; `holidays` has
  Thanksgiving at the stage with its poster, and market day's stall; `newcomers` Boothoven's
  welcome there.

**Defaults chosen** (personal touches parked, decision 177): which events move, where everyone
stands and the stall's wares are Claude's. **Left for later:** her answer 9, a scavenger hunt on
the calendar (clues round town and a prize, `M2, M3` in "Her touches"): it's a feature of its own
(clues, a trail, a prize and its art), more than M3's size, and nothing in M3 stands in its way; a
hunt could start at the stage as one more `fair` row.

**Rejected:** moving every happening to the fairground (the pond's picnic and the willow's egg hunt
are about their places); storing which events have moved (the atlas already knows); a market only
up on market day as a set piece (a stall that's always there, empty between, tells her where to
come back to); putting the market table at one of M2's stalls (they're games and snacks, with
their own hours).

## 210. The review before 0.2.4: old saves as fixtures, his stand at the duet, the world's options apart

_2026-10-01, session V1, the last of the 0.2 plan: the shakedown, the architecture review and perf
after the three lanes (U2–U4, G2, L1, L2, M1–M3). Personal touches parked (decision 177)._

- **Lived-in saves from her phone are fixtures.** One as 0.2.3 wrote it (v31) and one as 0.2.2
  did (v27), each made by that release's own code (a farm, a decorated home, recipes, friends at
  every band, Cabinet finds, bracelets worn, newcomers written, the broom away from home), live in
  `tests/persistence/fixtures/`, and `tests/persistence/livedIn.test.ts` holds that nothing in them
  is lost on the way to this build's save. A later release adds its own when its save changes
  shape. Loaded in a real browser they lost nothing, nothing was set aside, every sheet opened by
  real taps upright and on its side with no console errors, and everything the lanes added played
  through by real taps.
- **Boothoven sits at the piano's upper end for their duet.** His stand in the castle hall was the
  tile walking up to the hall piano puts her on, so she stood inside him while they played. The
  hall's first stand is now one tile up (`INTERIORS.castleHall.stands[0]`), and the duet's test
  holds them on different tiles.
- **The world's options are a file of their own** (`world/options.ts`: `WorldOptions`,
  `fromSave`, `WorldSave`), and the six reads every neighbour-facing service took (her name,
  where she is, where a neighbour is, their hearts, whether they live here, `thank`) are one
  `TownReads` made at the top of `WorldParts`' constructor. `build.ts` went from 730 lines to 612.
- **The split by area is left for the next session that adds a service**, as it can't be done
  cleanly in one sitting alongside a release: the constructor's reads run forward (the
  neighbourhood is read by services made before it), so each area becomes a function taking the
  shared parts (`ctx`, the keepers, `town`) and returning its services, assigned to the fields in
  the constructor, in this order: the home's (`Decorator`, `RecordPlayer`, `Instruments`), the
  passive Candy's (`CandyTree`, `HonestyStall`, `Visits`), the calendar's and festival's
  (`Calendar`, `Holidays`, `TrickOrTreat`, `PumpkinPatch`, `Finale`), the fairground's
  (`Activities`). Those needing no forward reads go first.
- **Perf walks the fairground too.** No frame doubled against 0.2.3; the numbers are in
  `docs/architecture.md`.

**Rejected:** the split by area now (a release isn't the place for a 400-line move that only
reshuffles); one builder class per area holding back-references to the world (the forward reads
are the reason it's one constructor, and a back-reference is what decision 84 took out); making
walking up to a piano avoid a neighbour's tile in general (the stand is the one place they meet).

## 211. Nothing is gated, and new neighbours come with releases (2026-10-01, for 0.2.5)

**Decided:** the user asked that every villager already made live in town now, that nothing keep
her from anything in the game, and that from here on new neighbours arrive with updates, perhaps
themed to the update, rather than over time in play.

- **Everyone lives here from the first day.** The newcomers' arrivals (phase T, decision 125, and
  0.2's L1) are retired: no letter a month, no moving day, no boxes or "coming soon" signs, no
  welcome party, no silhouettes on the neighbours sheet, no lines held back for someone not yet
  here. `Newcomers` and `systems/newcomers.ts` are gone; what's left of the lots is
  `systems/lots.ts` (`LOTS`, `lotOf`, `lotFor`) and a `Lots` that always has its houses up.
  Visits are dealt among all eleven (`visitsOn(day)`), and a lost thing can be anyone's.
- **Save v34 lets go of `newcomers`.** The letters they wrote stay in her mailbox and still read:
  each villager row keeps its `wrote` for that. The lived-in fixtures hold that nothing else is
  lost (`RETIRED` in `livedIn.test.ts` names what was let go on purpose).
- **Every place is open from the start.** Lantern Shore, the castle hill, the great hall and the
  fairground are `{ open: true }`; their `shut` and `opened` lines are gone. The hidden clearing
  stays a `secret`: it was always open, only off the map until she finds it. The `Unlock` rules
  and gates themselves stay, unused, for a later place that wants one.
- **Her skates are in every bag** (first in `STARTER_BAG`, and topped up in an older bag on load),
  so the ice is hers from the start; Cody's Whisperwood letter no longer sends them. A keepsake is
  never given or sold, so they can't be lost. Sliding back off the ice without them is kept, held
  by tests that take them away.
- **The castle key and the heart key are still buried** and dug up as before, keepsakes now: the
  gates they fit stand open anyway.
- **Agatha's broom comes on her first day** (`BROOM_AFTER_DAYS` 1).
- **Boothoven teaches whenever he's in his parlour**, a tune a day, and plays their duet on her
  anniversary, with no hearts asked for either.
- **With the gate open, the calendar's big evenings are at the fairground's stage from the
  start** (decision 202's `fair` rows), the finale included. Boothoven, who lives here now, takes
  a seat at film night (`filmBackCorner`).
- **What still grows with play is what she collects, not what she can do:** a band's reward and
  a keepsake at their hearts, recipes and pieces bought or made, critters caught, the mayor's
  mystery, and the calendar's days. Shops and stalls keep their hours.

**Rejected:** keeping the newcomer machinery and only writing every letter on the first day (a
day of five letters and five moving days is a muddle, and the machinery would be kept for nothing,
since new neighbours now come with releases); deleting the slide off the ice (it is the creek's
character, and costs nothing once she always has her skates); taking the keys out of the ground
(digging them up is still a nice find).

## 212. 0.3 lands as five lanes on `v0.3-dev`, two running at a time (2026-10-04)

**Decided:** `docs/v0.3_plan.md` is the plan after 0.2.5: the user's third list and what she
plays most (collecting critters, buying things, decorating), as sessions sized to one context
window each in five lanes by the files they own, W1 (the `build.ts` split by area, decision 210)
alone first and V1 alone last. **The user asked for two lanes at a time**: lanes 1 (her and the
view) and 2 (her home) start first, lane 3 (the farm) when lane 1 finishes, lane 5 (shopping) when
lane 2 finishes, and lane 4 (collecting) last, by which time F1 and S2, which two of its sessions
wait on, have merged. `v0.3-dev` is the integration branch, made from `main` at 0.2.5; `main`
gets a release only at the user's word. A session that changes the save bumps in its last commit
after merging `v0.3-dev`, and the coordinator merges those PRs one at a time (decision 163's one
save lane doesn't fit four lanes that need the save). Decision blocks: the forks 212–217, lane 1
from 220, lane 2 from 230, lane 3 from 240, lane 4 from 250, lane 5 from 260.

**Rejected:** five lanes at once (the usage limit goes as fast as there are lanes; the user chose
two); one lane (the chains are independent, and 0.2's three ran cleanly).

## 213. A farm of its own west of town, and her kitchen garden stays (2026-10-04, fork 1)

**Decided:** the user keeps "her personal plantation" and builds the farm too. **Boo Acres** is a
new place down the main road west of town (the town's west edge at rows 14–15, mirroring the way
to Whisperwood), with long rows of beds, a greenhouse, an orchard, a pond, a barn, a farmhouse and
a seed cart (F1, F2). Hosta La Vista Farm beside her house keeps every bed and everything planted
in it, as do the plots by the creek and the lake, since a bed she planted yesterday should be
where she left it (decision 11). `Farm` keys beds by place already (decision 165), so the new
place's beds grow, water, sprinkle and sell like any other.

**Rejected:** moving every bed to the new place and giving the fenced farm to her yard (loses
plantings, and the farm by her house is the game's first picture of her).

## 214. Scarah, a scarecrow, is the neighbour who comes with 0.3 (2026-10-04, fork 2)

**Decided:** decision 211's "a new neighbour comes with a release, themed to it": 0.3's is the
farm, so its neighbour is **Scarah**, a scarecrow who came to life one harvest moon (burlap, a
straw bob, a patched sundress, a crow called Cornelius on her shoulder who says one word), living
in the farmhouse at Boo Acres, there from the moment the release lands, with a schedule, lines in
every band and per window, loves, likes, favours, rewards, two keepsakes, her place in every
happening and a costume for October (F3).

**Rejected:** a critter-keeper at the farm instead (the farm wants a farmer; a bug collector can
come with a later release); no neighbour this release.

## 215. Decorating grows in all three directions (2026-10-04, fork 3)

**Decided:** on tables (H3: surfaces and small pieces), into a second room (H4: rooms as rows,
a doorway in the back wall, built by a recipe) and out into her yard (H5: a `yard` rect of the
town map decorated as her home is, with outdoor pieces), in that order, each a shape the next
builds on, after H1 (the chest takes things) and H2 (display pieces). All five in lane 2.

## 216. Fossils are a new collection, dug up daily (2026-10-04, fork 4)

**Decided:** a mound a day in each place she has found, dealt from the day key, dug by walking up
as the keys were, giving a fossil (a new item kind, by rarity) or now and then a bead or Candy;
fossils fill a Fossils tab in the Cabinet, a seventh case at Wrapunzel's museum and a shelf
milestone with a display piece (C1). The collecting she loves with no new verb to learn.

## 217. The lake's plot moves, and the zones test learns to see a break (2026-10-04, fork 5)

**Decided:** the four beds at Lantern Shore's south-west corner and the lamp beside them cut the
west bank off from the rest of the shore, joined only by the frozen creek. The beds move up the
west bank and the lamp a tile over, a migration moves any plot planted at the old tiles with
them, and `tests/data/zones.test.ts` flood-fills every place without ice and with every lot's
house standing, so it can't happen again (F0).

## 218. The world is made by area, and the honesty stall with the workbench (2026-10-04, W1)

_Session W1 of the 0.3 plan, before the lanes: decision 210's split of `build.ts`, done. Nothing
she sees changes; no save change. Personal touches parked (decision 177)._

- **Each area is a function in `src/world/areas/`** taking `Shared` (`ctx`, every keeper, the
  town's reads, the options, the town's map and the places beyond it, and `movement` read late)
  and the services of earlier areas it needs, and returning its own as an interface; the
  constructor in `build.ts` assigns them to the same fields by destructuring, so TypeScript still
  holds every field assigned. The keepers are made by `keepersOf` (`shared.ts`), `Atlas`,
  `Porch`, `Keepsakes` and `Dug` with them. `build.ts` went from 612 lines to 370, its
  constructor from about 310 to about 100.
- **The order is: keepers, `making`, `passive`, `places`, the garden, gathering, shops and
  mailbox (one line each, left in the constructor), `neighbours`, `mystery`, `festivals`,
  `outdoors`, `fairground`, `catching`, `going` (movement, travel, broom), the `crossed` reset,
  digging, `homeServices`, `petServices`, `her`.** The areas needing no forward reads come first,
  as decision 210 asked, and the rest read what's made later through a function. What a service
  listens for (`crossed`, `opened`, `bag`, `cabinet`) is still heard in the order it was before:
  the world's reset, the record player, decorating, then the pets on `crossed`; the mystery
  before the broom on `opened`; hands, novelty, then milestones on `bag`. Services moved past one
  another read nothing at construction that another of them changes.
- **The honesty stall is made in `making`, before the workbench, not in `passive`.** The
  workbench builds the stall's second shelf, so it's handed the stall; `Belongings` is handed the
  workbench; and `Visits` is handed `Belongings` for a gift of furniture. The passive Candy's area
  can't make both the stall (before the workbench) and the visits (after `Belongings`), so it
  keeps the visits and the candy tree, and the stall goes with what builds onto it.
- **A new service** is a line in its area's function and interface, a field in `WorldParts` and
  its assignment in the constructor. One that listens for a signal another already hears goes in
  an area made after that one, so it hears it after, as everything did before. A new area is a
  file in `areas/` and a call in the constructor, after the areas it reads.

**Rejected:** handing the stall to `Workbench` or `Belongings` to `Visits` through a function
(it changes two services' shapes to keep one grouping); `Object.assign(this, area(...))` with the
fields declared `!` (shorter, but a field an area forgot would go unnoticed until it was read);
an area per service, or the four areas of decision 210 alone (they hold twelve of nearly
sixty parts, which would have left most of the constructor as it was; the fourteen functions keep
each under about 45 lines).

## 220. Her shoes go on under the first hem that hangs over her legs (2026-10-04, A1)

_Session A1 of the 0.3 plan, lane 1: the user's "boots don't go under dresses". No save change.
Personal touches parked (decision 177)._

**Decided:** where her shoes go among her clothes is worked out from what else she has on, in
`layerOf` (`src/sprites/doll.ts`), not fixed in `WORN_ORDER`. A piece **hangs over** her legs
(`hangsOver`) if it is a skirt, a dress with a skirt, or the opera coat's tails (`HEMS`: the
sundresses, the collar dresses, the pleated, skater and tulle skirts, the ball gown, the velvet
dress, the butterfly-wing dress, the opera coat), or the vampire cape seen from behind. With one
on, her shoes go **just under the lowest of them**, so a boot's shaft is hidden by a hem as her
shin is and shows again below it; with none, they keep their own place after the outer piece.
Either way they stay over tights and trousers, which are always on first, so knee-highs still
pull up over jeans. Nothing that paints her legs comes between: the only tops that do (the
spaceman suit, the mummy wraps) are dresses, so no skirt goes under them, and an outer hem puts
the shoes after them anyway.

- **The whole shoe moves, not just its shaft.** The plan allowed for a shoe's foot and sole
  staying on top while its shaft went under. Every hem but the gown's ends above her feet, so
  they are on top already; the gown is to the floor, and its last row over the top of her foot
  is the point of it (the bug list had "every shoe over the gown's last row"). Moving the whole
  layer keeps `pieceRows` a function of the piece alone, so its cache key is unchanged, and
  `dollKey` already names everything she wears.
- **A cape is a hem only from behind.** From the front and side it is drawn only round her, never
  over her legs, so where her shoes go makes no difference there; from behind it falls over her
  to the ankle. Giving it a back and front layer is A2's.
- **Held by `tests/sprites/doll.test.ts`**: every shoe over every hem's first cut, from every
  side, standing and both steps, leaves each pixel of the hem as it is barefoot; the sundress
  with knee-highs matches it with flats at the hem, and over jeans they differ. The gallery's
  `doll:hem:<id>` shows each hem with every shoe, standing, both steps, from behind and from the
  side mid-stride (`npm run sprite -- 'doll:hem:*'`).
- **The neighbours follow the same rule.** Their clothes are drawn in the order each figure's art
  lists them, by hand, and Hazel, Wrapunzel and the rest in a skirt list their Mary Janes after
  it, whose straps came over the hem mid-step. `figureLayers` (`src/sprites/villagers.ts`) draws
  them through `shoesUnderHems`, which moves shoes listed after the first hem to just under it,
  so a skirted neighbour (Scarah, in F3, among them) needs nothing of her own. One changed line in
  a lane 3 file, made while lane 3 hasn't started.

**Rejected:** clearing a shoe's pixels wherever a hem is (a mask, the same picture, but the shoe's
rows would come to depend on the rest of her outfit and need a cache key per outfit); a shaft and
a foot layer per shoe (twice the layers for a difference only the gown would show, and there the
wrong way); a flag per boot (the plan asked for a rule, and the hem, not the boot, is what
decides).

## 221. Capes and wings have a layer behind her and one over her, and her hair tucks in (2026-10-04, A2)

_Session A2 of the 0.3 plan, lane 1: the user's "hair and cape/back costumes interact oddly". No
save change. Personal touches parked (decision 177)._

**Decided:** what she wears on her back (`BACKS` in `src/sprites/doll.ts`: the vampire cape, the
bat wings and the butterfly-wing dress) is drawn in up to three places, not one. `backRows(worn,
view, body, 'behind' | 'over')` gives the part **behind all of her**, drawn before her skin, so
her body, any skirt's flare and her hair cover it with no clearing of its own; and the part
**over all of her but her hat**, drawn straight after her hair, so gloves, bracelets, shoes and
hair are under it. `pieceRows` keeps what lies on her in the piece's own place: the cape's
shoulders, the wing dress's dress, nothing of the bat wings.

- **From the front and side**, wings are behind her, and so is the cape but for its shoulders.
  **From behind**, all of each is over her: the wings reach in to meet down her spine (the
  butterfly's with a dark body where they're sewn on), and the cape covers her from its collar
  to her ankles, wider at the shoulders than before so no style shows past it.
- **Her hair is tucked inside the collar, from every side.** That is the one picture that never
  threads hair through the collar: from the front the collar is behind her head and its points
  stand up beside it, from row 8, wide of every style (the bunches included); from behind the
  collar is a fan over the back of her head, lined along its top; from the side the cape's top
  half, collar and all, is over the hair hanging behind her, and its bottom half, from her hips,
  behind her skirt. The cape falls straight from the collar's back from the side now, so long
  hair doesn't show past it.
- **The plan's "front layer for the collar drawn after the hair" is not what was built.** Drawn
  over her hair from the front, a collar that shows past a bob has to cover the sides of it, and
  long hair's locks would come out from under the collar onto her chest. The collar goes behind,
  with points that rise clear of the hair instead (as Cody's do), and what goes over the hair is
  everything from behind (which the plan put only after gloves, shoes and bracelets, leaving long
  hair over the cape and wings).
- **The neighbours do the same.** `figureLayers` (`src/sprites/villagers.ts`) draws `backRows`
  behind them and over them; the over part comes after their `over` touches, since Wrapunzel's
  wraps are as much her hair as her hair. Wrapunzel's and Cody's butterfly costumes are the two
  that wear one today. Cody's own cape is a touch of his and is unchanged.
- **A1's rule is unchanged.** The cape is still a hem from behind (`hangsOver`), so her shoes are
  under it, and the hem test reads its over part as the hem it is.
- **Held by `tests/sprites/doll.test.ts`**: no cape or wings changes a pixel of any skirt below
  her hips from the front or side, standing or mid-step; nothing worn on her back changes a pixel
  of any hair style from the front, and the collar's points show beside every one; from behind,
  each over part is the same pixels whatever her hair, gloves and bracelets; and from behind the
  cape is the same from its collar down whatever her hair. The gallery's `doll:back:<id>` shows
  each piece over every hair style, from the front, behind (standing and a step) and the side,
  then with gloves, bracelets and a flared skirt (`npm run sprite -- 'doll:back:*'`).

**Rejected:** the collar over her hair from the front (above); her hair over the cape and wings
from behind (long hair hid the bat wings whole, and the cape's collar with them); one layer
cleared by hand wherever her skirts and hair are (the cape's rows would depend on the rest of her
outfit, and the cache key with them).

## 222. A tree goes see-through while it hides her, or something near her she might want (2026-10-04, A3)

_Session A3 of the 0.3 plan, lane 1: the user's "things behind trees are hard to see; see-through
when under them". No save change. Personal touches parked (decision 177)._

**Decided:** after `OutdoorView.draw` sorts what stands in a place, a tree, old tree, willow or
candy tree (a grown one in a sapling's ring too) whose crown hides **her**, or hides something
**within three tiles of her** that she might want (a ready rock, toadstool, flower patch or other
giver, the snack, an undug mound, an Easter egg, a neighbour, a critter, a pet, Fibi's bone), is
drawn at half alpha. Wes is never something she wants found: he's meant to be half hidden.

- **What hides what is pixels, not boxes.** `coveredCrowns` (`src/render/occlusion.ts`) counts
  the pixels a crown draws over a thing drawn before it (its feet higher up), from each sprite's
  mask, read once from its pixels and kept (`maskOf`). It takes twelve of them, or all of a thing
  smaller than that, so a leaf over her hair or the corner of a trunk beside her doesn't fade a
  tree, and her standing behind one does.
- **Near her, not anywhere on screen (`nearHer`, three tiles between their feet).** The plan
  had anything she might want on screen. Tried in Whisperwood, that faded about two dozen trees
  at once (toadstools, flower patches and critters stand behind half of them), and the wood
  turned to glass. Near her, the tree in front of what she's walking up to fades as she comes,
  which is when she wants to see it.
- **Eased by the simulation's steps, like the camera.** `SeeThrough` is view state: each draw
  tells it which crowns hide something, and each fixed step (`follow`) moves a crown's fade
  200ms towards half or back, smoothed at both ends. A crown stays faded 250ms after it's clear,
  so her walk frames and a fluttering moth moving a pixel in and out of its edge never flicker
  it; it only ever goes one way until it's done or turned back. Leaving the place clears it.
- **Copies, never mutation.** `this.props` is kept from frame to frame, so a faded crown is a
  copy with `alpha` in the frame's own list. A tree's drawable carries `crown`, its tile's key,
  a field added to `Drawable`.
- **The glow behind a see-through thing keeps its share.** `drawLight`'s erase pass rubs out
  the glow behind each sprite at that sprite's alpha, so a moth glowing behind a faded tree
  still glows through it. A ghost pet and a fish's shadow, the other see-through things, now
  let the glow behind them through as well, as they should have; their own glow is as it was.
- **Held by** `tests/render/occlusion.test.ts` (the pixel count, in front or behind, the
  threshold, near her, the fade only ever one way, the linger, turning back part way) and
  smoke's `seeThrough` section: a real tap walks her in under the tree at Whisperwood's
  crossroads, that tree is drawn at half (`view.seeThroughCrowns()`, `.smoke/see-through.png`),
  and walked back out it comes back solid, frame by frame at 60fps, never going down again.

**Rejected:** fading for anything she might want anywhere on screen (above); a tree's whole box
rather than its pixels (a tree's box is far wider than its crown, and she'd fade a tree she
stood beside); fading by the real clock in `draw` (the fade would run at the phone's frame rate,
and smoke cranks frames faster than real time).

## 223. Food says what it does, and a chip in the top bar while it's doing it (2026-10-04, A4)

_Session A4 of the 0.3 plan, lane 1: the user's "food buffs don't show; what a food does isn't
clear". No save change. Personal touches parked (decision 177): the words are the warmest plain
ones, worked out from the effect._

**Decided:** what eating something does is a fact of its row (`effectOf`, decision 122), so the
words for it are worked out from the effect in one place, `src/hud/food.ts`, and never written
per dish.

- **Every card for a dish, snack or treat says it, under whatever else it says.** `itemCard`
  keeps a line of its own (`.hud-eats`): "Eat it: a spring in your step till the window turns.",
  "Eat it: the fish bite sooner till the window turns.", "Eat it: a moth comes out to see what
  smells so good." (a lure lasts till it's caught as well, so it says no "till"). It stays put
  when the card says something new (`say`, the bag's "Mmm!"), so the bag, the chest's Items tab
  and the shop's Sell tab all have it. The shop's shelves and the fairground's snacks add it to a
  row's line (`aboutFood`), and so does the stove under each dish.
- **The stove's groups are named as the cards say it:** "Spring in your step", "Fish bite
  sooner", "Lures a critter" (`EFFECT_GROUPS`, `effectGroup`), not Pep, Fishing and Lures. The
  filter row scrolls sideways on a phone, as the bag's does.
- **A chip in the top bar for each thing a meal is doing** (`src/hud/MealChips.ts`, through
  `MealsApi`): the dish's 16-pixel picture at 2×, a thumb high, between the day and the 👥.
  Every effect ends as the window turns (decision 122), so "till evening" is said once, small,
  under the last chip, and a tap on any says what it's doing ("A spring in your step till this
  evening."). The chips go when the window turns, or a lured critter is caught: they follow the
  bag (eating and a catch both change it) and the day (`today`, the window turning), drawn again
  only when what they show changes. `Kitchen.buffs()` says what's on: the effect, what she ate
  for it and the window it lasts till.
- **What she ate is kept while the game is open, not in the save.** The save keeps only when
  she ate for each effect (`Meals`), and lane 1 never touches the save. Opened again mid-window,
  a chip shows the first dish that does the same thing (`dishFor`: pumpkin soup for a spring in
  her step, the chowder for the fish, the moonpetal cake for a moth…), which still says the
  right thing; its tap names no dish. Keeping the item would be one optional field in `kitchen`
  for a later save-changing session.
- **On a narrow phone held upright, the day gives up what's on while a chip is up** (the
  festival's icon and countdown, a happening's icon), so its date stays whole beside the chip;
  the calendar, a tap away, still says it all. On its side, the strip has room for everything.
- **The `ate` moment goes through `moments.ts` like every other:** the bag's Eat plays it
  (`play([ate])`, the munch and the save), and says it on the bag's card; `eventToast` gives it
  no toast, since the sheet is up and a toast behind it would only be half seen (as `made` and
  `cooked` do).
- **Held by** `tests/hud/food.test.ts` (a line for every food, the card's line through `say`
  and not for a seed, the stove's groups and rows, the chips: one each, "till" once, the tap,
  gone), `tests/world/cooking.test.ts` (`buffs` till the window turns, a lure till it's caught,
  the stand-in dish after a reload), and smoke's `cook` section: by real taps the soup's card
  says what it does, no chip before she eats, the chip after, a tap on it says it, after a
  reload and on its side too, each a thumb's size, clear of the day (whole), the 👥 and Settings,
  the bar not spilling over (`.smoke/eat-card.png`, `.smoke/meal-chip-*.png`).

**Rejected:** a chip with "till evening" beside each picture (three of them crowd the day off a
phone held upright, and they all end at the same moment); saving what she ate (lane 1 never
touches the save, and the stand-in dish says the same thing); a toast as she eats as well as the
card (behind the bag's sheet, half seen).

## 230. Her storage chest takes things from her bag, at home (2026-10-04, 0.3's H1)

_Session H1 of the 0.3 plan, lane 2. Personal touches parked (decision 177): no question asked;
the words on the buttons and in the card are the warmest plain ones._

- **The chest keeps a second list, `home.items`**: stacks of things from her bag, in the order
  they went in, beside `home.stored` (her furniture), which keeps its shape. `Home` holds both
  (`keep`, `release`); `world.chest` (`Chest`, made in the home area) moves whole counts between
  the bag and the chest, so nothing is lost on the way, and her bag never fills, so whatever is
  in the chest can always come back out. Save v35: `home.items`, an old save given none.
- **She puts things away at home, where the chest is.** The bag's card offers **Put away 1**, a
  − n + and **Put away all** while she's in, as the shop's Sell tab does (decision 146), and
  nothing outdoors. The chest sheet gains tabs, **Furniture** and **Items**; Items lays her
  things out as her bag does (`BAG_GROUPS`, `collection()`), and its card takes one, some or all
  back out. Walking up to the chest opens it, as it did.
- **What stays in her bag:** what's hers to keep with her (`isKept`: Fibi's bone and the
  keepsakes, her skates, her broom, the keys, the fair's prizes), which the ice, the sky and the
  gates read from her bag, and what's on her wrist (`Bag.spare`). The rule is `stowable` in
  `src/systems/chest.ts`.
- **A record put away still plays** on her record player, being home too. Nothing else reads
  the chest: making, cooking, giving, selling, the stall and the museum take from her bag, so a
  thing is taken out first. H2's shelves that show what she owns should count the chest too.
- **Coming back out isn't new.** The bag's "new" marks count the chest's things as known, so a
  stack taken out isn't marked new; one put away before she'd looked keeps its mark until she
  next opens her bag.

**Rejected:** a chest she can reach from anywhere (it's a thing in her house, and the bag never
fills, so nothing needs putting away while she's out); furniture and things in one `stored` list
(reshapes what every reader of `stored` uses, and the two tabs want them apart anyway); the
workbench and stove reading the chest (a later session can, if she asks).

## 231. Shelves that show what she owns, and display pieces that hold one thing (2026-10-04, 0.3's H2)

_Session H2 of the 0.3 plan, lane 2. Personal touches parked (decision 177): no question asked;
the new pieces' names, prices and what each takes are the warmest plain defaults._

- **Two families, both rows in `src/data/display.ts`.** A **set piece** (`SETS`: the squishy
  shelf, the haunted dollhouse, and three new ones, the record crate, the bead jar and the
  bracelet board) shows one of every thing of its kind she **owns**: in her bag, in her storage
  chest (`home.items`, H1's note) or on show in a display piece. A **display piece** (`SHOWS`:
  bell jar, shadow box, little plinth, terrarium, bud vase) holds one thing from her bag, of the
  kinds its row lists (critters, squishies, dolls, records, flowers, beads, bracelets; never what
  `isKept`). The rules are `src/systems/display.ts` (`onShow`, `takes`), the service
  `world.display` (`Display`, in the home area): `contents(piece)` for drawing, and `visit`,
  `offers`, `show`, `empty` for the sheet.
- **A set fills from its first place, packed, in the set's order.** The set is every item of its
  kind in `ITEMS` order (`setOf`), so a squishy always comes before the ones listed after it and
  there is never a gap where one was sold. A thing added to a set later needs no drawing: it is
  drawn from its own bag icon. `tests/sprites/display.test.ts` fails if a set outgrows its
  piece's slots, which is the prompt to add one.
- **What's shown is its bag icon, laid between the piece's back and front** (`showcaseLayers`
  in `src/sprites/display.ts`: back, each thing in its `Slot`, front, as `bakeLayers` layers, each
  thing in its own palette). A piece for many small things (`mini`) halves each icon, a 2×2
  block taking the key most of it is (`halved`); anything too big for its slot is halved too,
  then trimmed to it, so nothing ever spills past its place. The glass of a jar, the rails of the
  rack and the neck of the vase are in front; the cache key names the contents. The squishy
  shelf and the dollhouse lost their painted-on squishies and dolls: the dollhouse is now open at
  the front, two floors of four little rooms. Their art moved from `sprites/milestones.ts` to
  `sprites/display.ts`, which `MILESTONE_ART` points at.
- **Walking up to a display piece opens its sheet** (`src/hud/DisplaySheet.ts`, `DisplayApi`,
  `hud.openDisplay`, from the `arrived` moment): the piece as it is, what in her bag it takes as
  a `collection()`, and a card in the foot to **Put it in** (or **Swap it in**, the old one back
  in her bag) and **Take it out**. Nothing is lost: what's on show comes back to her bag when
  it's taken out, swapped, or the piece is put away (`Home.putAway` hands it back and
  `Decorator` gives it to the bag); a save whose piece can't hold what it showed, or no longer
  fits the room, keeps the thing in her chest.
- **Save v36: a placed piece may carry `shows`** (`Placed.shows`), kept by `Home`, checked by
  `isSaveState`; the step from v35 changes nothing, since an old save has nothing on show.
- **Sold at Cobweb Corner:** one of the eight new pieces a day on the Furniture shelf
  (`DISPLAY_WARES`), 260–480 Candy. The squishy shelf and the dollhouse stay milestone gifts.

**Rejected:** a hand-drawn place per item on each set piece (prettier for today's eight, but every
squishy or doll a later release adds would need art on two pieces); a crate of sleeves standing
one behind another (only the black discs at their tops showed, so it read as a stack of black;
the record crate is two tiers of sleeves facing out); counting only her bag for the sets (H1's
chest is a store, not a loss); display pieces taking anything at all (a bud vase of wood).

## 232. Small things stand on surfaces, one to a tile, and ride along with them (2026-10-04, 0.3's H3)

_Session H3 of the 0.3 plan, lane 2. Personal touches parked (decision 177): no question asked;
the new pieces, their names, words and prices are the warmest plain defaults._

- **Which pieces are which is two tables in `src/data/tabletop.ts`**, not fields on the rows:
  `SURFACES` (each surface's id to how high its top is, in pixels above the front of its
  footprint) and `SMALL` (a set of ids), as H2's `SETS` and `SHOWS` are, so marking thirty-nine
  existing pieces touched no other lane's rows. A surface is one tile deep, the same footprint
  every way round, and a small piece is one tile that stands (both held by
  `tests/systems/tabletop.test.ts`). The surfaces are five new pieces (a bat-leg side table, a
  lace tea table, a moon dresser, a kitchen counter, a low bookshelf) and the curiosity cabinet;
  the small ones are the lamps, vases, jars and domes (H2's bead jar, bell jar, bud vase and
  terrarium among them), cakes, the teapot, little plants, curios, the record player, the stand
  mixer, and twelve new **trinkets** made for tables (a skull mug, spellbooks, drippy candles, a
  toadstool lamp, potion bottles, a haunted snow globe, an hourglass, a pumpkin pail, a waving
  black cat, a ghost vase, an amethyst geode, a jar of fireflies). The writing desk and the
  hearth stay as they were: things are painted on their tops already.
- **A small piece on a surface is `on`** (`Placed.on`), at the surface's tile it stands on, one
  to a tile; a 2×1 table holds two. `refusal` lets it there when it's small, a surface is under
  it and nothing else stands on that tile, and never asks whether it walls her in (it's up on a
  table); a floor piece never minds what's `on` (`surfaceAt`, `riderAt`, `ridersOf` in
  `systems/decor.ts`). Nothing about the floor changes: the tile was the table's already.
- **What stands on a surface rides with it.** `Home.move` shifts a surface's riders by the same
  step; `Home.putAway` puts them in the chest with it and hands back whatever they had on show
  (H2's note), and `Decorator` gives that to her bag and signals `moved` for each. A save whose
  surface is gone stands the small piece on the floor where it was, or puts it in the chest; it
  is never lost. The surfaces load first, so a rider always finds its table.
- **Decorating by taps:** with a small piece picked up, a tap on a surface with room puts it on
  that tile (a tap on something already there picks that up instead); a tap on the floor puts it
  down there. A tap on the top thing picks it up, a second tap on it picks up the table under it
  (with everything on it), and a third puts the table down. `pieceAt` answers with what's on top.
  `HomeView` maps a tap on a wide piece's picture to the tile under the finger, so a tap on a
  table's right end is the right end.
- **Drawn raised** by `surfaceTop` (`pieceSprite`'s `raised`), just after its surface (its foot
  half a pixel later in the sort) and with no shadow on the floor; it lifts with the table when
  the table is picked up. Its lights and glow come up with it.
- **Cobweb Corner's "Little things" shelf** deals a surface and two trinkets a day, 240–620 Candy.
- **Save v37: a placed piece may be `on`**, checked by `isHomeShape`; the step changes nothing,
  since nothing stood on anything before.

**Rejected:** `surface` and `small` fields on every row (thirty-nine rows across four lanes' consts
for a flag); one thing per surface rather than per tile (a long table with one mug on it); a
small piece choosing a spot anywhere along a table's top (a pixel offset in the save, and taps
too fine for a phone); riders falling to the floor when their table is put away (the floor may
be full; the chest always has room); a stack of surfaces (a table on a table).

## 233. Her home is rooms in one place, and a back room through an arch by the chest (2026-10-05, 0.3's H4)

_Session H4 of the 0.3 plan, lane 2. Personal touches parked (decision 177): no question asked;
the room's name, size, where its arch is, what it costs and the words are the warmest plain
defaults._

- **Rooms are rows, `ROOMS` in `src/data/home.ts`** (`RoomId` in `types/ids.ts`): the front
  room (`main`, its three sizes, the chest) and the back room (`back`, 11 by 8 tiles of floor,
  `through: { from: 'main', tx: 1 }`). A third room is a row, a `RoomId` and a recipe. `roomOf`
  gives a room its shape at a size with a doorway in its back wall for each built room through
  it; `Room` gained `chest` (null but in the front room) and `doorways`.
- **`Home` keeps `rooms`, each with its own pieces, wallpaper, flooring and size; the chest,
  her things in it and the papers and floors she owns are shared.** Everything that read "the
  room" (`room`, `placed`, `pieceAt`, `move`, `takeOut`, `paper`, `lay`, `showIn`…) reads the one
  she's in (`here`), so `Decorator`, the sheets and `HomeView` work in either unchanged. What
  counts across rooms says so: `everyPiece` (what she owns, for the shops and holidays),
  `onShow` (H2's sets), `extensions` (the front room's size, for the workbench, wherever she
  stands at it), `placedIn('main')` (her planters, for the garden).
- **One place, not two zones.** The rooms are all `home`, so the pets, guests, music, visits and
  every `'home'` check stay as they were. Walking onto a doorway (or tapping its arch) crosses as
  doors do: `HomeZone.doorAt` gives a `Crossing` with a `room`, and `Travel.cross` goes `within`,
  onto the back room's mat facing in, or back onto the doorway facing out. The back room's mat
  goes back through; the front room's goes out. Leaving home by any way (the mat, the map)
  puts her back in the front room (`HomeZone.leave`), so the front door always opens onto it.
  Her pets at home and anyone visiting follow her through to the room she's in; Fibi's bone is
  under something in the front room only.
- **The doorway is kept clear like the mat:** nothing stands on it and nothing hangs over its
  arch's column, and the reach check keeps it reachable. Building the room re-stands the front
  room's pieces, and anything in the doorway's way goes in the chest (what it showed with it, a
  planter's crop back to her bag through `moved`). Column 1, beside the chest, is clear on the
  first day and stays put as the front room grows.
- **Planters stay in the front room** (`refusesHere`, refusal `frontRoom`): the garden keys a
  home bed by tile only, and two rooms' tiles would share keys. A saved planter anywhere else
  goes in the chest.
- **Built at the workbench** (`backRoom`, `Made` `{ newRoom }`, known from the start, 80 wood and
  30 stone, between the two extensions), on the Home tab, drawn as the blueprint. It's papered
  and floored like the front room until she changes it. The arch is `src/sprites/doorway.ts`,
  drawn into the room's shell (`roomShell`).
- **Save v39: `home` is `{ rooms: { main, back? }, here, stored, items, wallpapers, floorings }`**;
  the step (`homeInRooms`) moves the one room's pieces, walls, floor and size into `rooms.main`,
  so every piece is where it was (the lived-in fixtures hold it), and she's in the front room.

**Rejected:** the back room as a zone of its own (every `'home'` in pets, visits, music, beds and
the views would need a second name, and a planter's bed a second key); a door she walks up to
rather than onto (the plan asks for doorways crossed as doors are, and walking onto is what the
mat does); a chest in each room (the plan shares it, and the chest is a place, not a list);
moving pieces in the doorway's way somewhere near instead of the chest (the chest always has
room, and she sees where they went).

## 234. Her yard is decorated as her rooms are, and nothing of hers ever cuts the town off (2026-10-05, 0.3's H5)

_Session H5 of the 0.3 plan, lane 2, its last. Personal touches parked (decision 177): no question
asked; the yard's extent, the pieces, their names, words and prices are the warmest plain
defaults._

- **The yard is a box in the town's map** (`yard` in `MapSource`, `TileMap.yard`): tiles 1–8,
  rows 1–13, from the hedge to the farm's fence and the road, her house in the middle. Standing
  anywhere in it (her path included) she may decorate it; the ☰ tray shows a 🪴 **Decorate your
  yard** button while she does (`Decorator.check` emits `inYard` as she steps in or out), and the
  decorating bar is the same as indoors, less Walls & floors.
- **Which tiles take a piece is worked out from the map** (`yardOf`, `src/systems/yard.ts`): open
  grass in the box, less her door step and the spawn, the night's snack, every named spot her
  neighbours keep, Barty's egg spots, the lost things' spots, Wes's lurks, the flower patches, the
  farm's kept rows, and the two rows behind her roof, where a piece would be hidden. That leaves 39
  tiles: the strip down the house's west side, beside it to the east, the front lawn round the
  candy tree and the pots, and behind the house.
- **Nothing of hers may cut the town off** (`yardRefusal`, refusal `inTheWay`): with the piece
  down, every tile reached on foot from her door before is reached still, and every prop or bed
  walked up to from the lawn keeps an open side. The yard is part of the town, so this is the
  town's own walk, not a room's. It found that the only way behind her house, and on to the top
  of the farm, is the strip down its west side (Skelly, the mailbox and the hay bale close the
  east), so that strip always stays open; the plan's "the town's tests keep passing with pieces
  placed" is held by `tests/systems/yard.test.ts` filling every bit of lawn that will take a
  fence and walking the town again.
- **`Yard` (`src/world/Yard.ts`) keeps what stands there; the storage chest stays her home's**:
  taking a piece out in the yard takes it from the chest (`Home.unstore`), putting one away puts
  it back. `Decorator` works on either through `Decorable` (`pieceAt`, `move`, `turn`, `putAway`,
  `takeOut`…), which `Home` already was; `outdoors` says which, and `fits` which chest pieces can
  come out where she is, so the chest sheet in the yard lists only those, on one tab. A small
  piece rides on the picnic table as on any surface (H3's rules, `onSurface` exported).
- **What may go out is `OUTDOOR`** (`src/data/yard.ts`): the ten new pieces (a garden bench to
  sit on, a garden lantern, a toadstool gnome, pots of flowers, a birdbath, a picnic table, a
  pumpkin pile, fairy lights, a little fence, a scarecrow of her own) and six she may have already
  that belong outside as much as in (the bone gnome, the jack- and cat-o'-lanterns, the tombstone,
  the stump and pumpkin stools). Anything else is refused `indoors`; an outdoor piece may still
  come into the house. Rows in `YARD_FURNITURE`, art in `src/sprites/yard.ts` at 32 from
  `furnish.ts`, the picnic table a surface and the lantern and the flowers small (lines added to
  `SURFACES` and `SMALL`). Cobweb Corner's "For the yard" shelf deals two a day, 240–600 Candy;
  Gourdon's book (S2) is to list them too.
- **Drawn and walked as the town's own**: `MapZone.canWalk` is false under a standing piece, so
  she, her neighbours and her pets walk round, and no critter is dealt onto one. `render/yard.ts`
  draws each piece among the props with its shadow, glow and lamplight at night, the lawn dotted
  and the picked-up piece outlined while she decorates; a tap on a piece's picture is the piece.
  Walking up to one arrives with `piece` (her bench sits her down, a piece's line is said).
  What's in her yard counts as hers for "new" marks and for the finale's carving.
- **Save v40: `yard: { placed }`**, checked by `isSaveState`; the step gives an old save an empty
  yard. A saved piece that no longer fits, or stays indoors, waits in the chest.

**Rejected:** a yard rect of only the front lawn (the plan says round her house, and the grass
behind it is the roomiest part); a room-style "everything reachable from the mat" check inside the
box alone (the yard is the way to the top of the farm, which a check of the box would miss);
outdoor pieces kept out of the house (nothing is gated, and a gnome indoors is harmless); a chest
of the yard's own (one chest, as H4 decided for the rooms); moving Skelly, the mailbox or the hay
bale to open the east side (the front yard is the game's first picture of her home).

## 240. The way round the lake is whole, and the test walks every place on foot (2026-10-04, 0.3's F0)

_Session F0 of the 0.3 plan, lane 3: the user's "Lantern Shore's lantern and plot block the way
round the pond", settled by decision 217. **Save v38** (a migration step moves the lake's beds).
Personal touches parked (decision 177)._

**Decided:** Lantern Shore's four beds, which ran along the bottom of the west bank (row 22) with
the lamp at their end beside the reeds, stand **in a two-by-two block up the west bank** (tiles
1–2, rows 19–20), and **the lamp a tile west**, at the block's corner (3, 21). The way from the
south shore up the west bank is two tiles wide between the lamp and the water, and she walks right
round the lake on foot to the top of the wood, where only the creek's ice parts the two banks, as
it always has.

- **A block, not a row.** The bank is three or four tiles wide all the way up, so a row of four
  across it would cut it again, and a column down it would leave a one-tile path. A block of four
  is watered whole by one sprinkler in any of its beds, which a row of four never was; sowing a
  row with a seed in hand plants two at a time there now, not four.
- **Any bed she had there moves with what's in it** (decision 213: a bed planted yesterday is
  where she left it). The migration step maps each old tile to its new one, left to right along
  row 22 to the block's top row, then its bottom row, and a sprinkler in one of them moves with
  it, keeping the day it has watered from (step 37 in `migrations.ts`, held by
  `tests/persistence/migrations.test.ts` and, loaded into a world, `tests/world/plots.test.ts`).
- **`tests/data/zones.test.ts` flood-fills every place on foot**, off the ice, with every lot's
  house standing and every row kept for the farm built (`MapZone.canWalk` with `Lots` and every
  row), and every open tile must be reached from where she arrives. It fails on the old shore, as
  does a second test that she reaches the west bank's spot and can stand beside each of the lake's
  beds. It also found **a pocket by Whisperwood's creek** (tile 19, rows 34–36) that only the ice
  reached, shut in by a log and trees; the log is a tile east now, in place of a tree.
- **Whisperwood's far bank of the creek stays across the ice, on purpose**, named in the test
  (`ACROSS_THE_ICE`, by a tile on it): she skates over to dig up the heart key, as
  `tests/world/holidays.test.ts` has her do, and a third test holds that each bank so named is
  cut off on foot and reached on skates, so the list can't go stale. Anything else cut off is a
  break.
- **Smoke's `edges` walks the ring** (`lakeRing`): at Lantern Shore with no skates, by real taps
  on what's on screen, round the south shore to the beds, up the west bank to the top of the wood
  (`.smoke/lake-ring.png`), then on her skates over the creek back where she came in.
  `nextTapToward` takes `onFoot` to keep to the ground as she can walk it now.

**Rejected:** a footbridge over Whisperwood's creek (the cut-off first attempt at this session
tried one): it turns skating over to the heart key into a walk, and that far bank is the woods'
one bit of skating besides the way down to the shore; the beds moved off the shore altogether
(decision 213 keeps them, and the lake makes a crop a day sooner there); the old tiles left as
they were, with the beds dropped and their seeds given back (the `Farm` would, but she'd lose
what was growing).

## 241. Boo Acres, a farm down the main road west of town (2026-10-05, 0.3's F1)

_Session F1 of the 0.3 plan, lane 3: the place decision 213 settled. No save change (`Farm` keys
beds by place already, decision 165, and the extension rows are still a count). Personal touches
parked (decision 177): the layout, the buildings' colours, the tune and every line are Claude's._

**Decided:**

- **A place of its own, open from the first day** (`booAcres` in `ZONES`, a new `MapZoneId`;
  decision 211). The town's main road runs on west through its edge at rows 14–15, as it runs east
  to Whisperwood, with a signpost (`FARM`) by it; on the world map at 12,54, the empty west. Its
  map (`BOO_ACRES`, 34×32) has a legend of its own (`FARM_LEGEND`, as the fairground has): the road
  comes in from the east past the **seed cart** to the farmyard, where **Scarah's farmhouse**
  (five tiles, a door at its middle, for F3 to people) and **the barn** (six tiles, BOO ACRES over
  its doors) stand round **a well** of its own, with hay and barrels; **the orchard** up to the
  north-east is twelve fruit trees in three rows, three each of **apple, pear, plum and
  persimmon**; south of the road, through a gate in a fence that joins, are **the fields**: four
  rows of six beds in pairs with paths between, a scarecrow, and two rows of grass kept for more;
  **the pond** is to the west with reeds, and **the greenhouse** (five tiles, a glass door at its
  middle, its inside F2's) to the east at the end of a path. `BOO_ACRES_SPOTS` names the fields,
  the orchard, the pond's bank, the cart, the porch, the barn doors, the well and the
  greenhouse's door.
- **Each fruit is a prop of its own** (`appleTree`…), so F2 gives each a `PROP_YIELDS` row and
  nothing more: their art already has a picked look (`spent`). They're lower and rounder than the
  woods' trees, two tiles wide, from `paintCrown` (exported from `nature.ts` with `clumpsOf` and
  `leaves`), and go see-through like any tree (`CROWNS`). The greenhouse is glass, so it glows
  after dark and strings no festival lights (`noEaves`). Art is all in `src/sprites/farm.ts`
  (`FARM_PROP_ART`, spread into `PROP_ART`), from the building kit.
- **The extension rows go on at Boo Acres.** The `{ beds }` recipes were the town's two rows, built
  in order and saved as a count (`farmRows`). Boo Acres keeps rows **3 and 4** (`plot: 3`, `4` in
  its legend), built by **Field row** and **Last field row** at the workbench after the town's two;
  `Farm`'s rows are now `Plot`s with their place (`rowsOf` in `world/areas/shared.ts`), every
  `MapZone` reads how many are built, and the toast and "first" line name the place and the row
  before (`plotPlace` in `data/zones.ts`). Nothing in a save changes: a count of two still means
  the town's two.
- **Barty and Rufus come by**: Barty in the fields on weekday afternoons, Rufus in the orchard on
  weekend afternoons (it was the park). **Critters** for now are town commons that suit its
  habitats (candle moths, velvet bats, skull beetles, ladybugs, lily frogs, mourning cloaks, and
  ghost minnows and pumpkinseeds in the pond), since every place must have a few out at every
  hour; its own are C2's. **A tune of its own:** a little hoedown in G (`booAcres` in `THEMES`).
  Barty writes the `found:booAcres` letter.
- Held by `tests/data/zones.test.ts` (walked on foot with both kept rows built; 24 beds and every
  kept tile tended from beside it; the buildings, the orchard and the pond there; the town's west
  way out), `tests/world/plots.test.ts` (its rows built after the town's, planted and saved), and
  smoke's `booAcres` (down the main road by real taps, its tune, and a bed dug and planted by taps
  on the bed, its card and the seed) and `edges` (its way out and back).

**Rejected:** Boo Acres' extension rows counted on their own (a second count in the save, and a
save change F1 isn't for); its rows built before the town's (a save with one or two rows built
must still mean the town's); one `fruitTree` prop in four colours (F2's yields are by prop, and
apples and plums give different things); a footbridge-and-island pond (every tile on foot, decision
240, and the bank wants to be walked round); its own critters now (C2's, after F1, with art).

## 242. What grows at Boo Acres: fruit by the window, every seed every day, a greenhouse that's always the season, and a barn that sprinkles a field (2026-10-05, 0.3's F2)

_Session F2 of the 0.3 plan, lane 3. No save change: fruit and dishes are items, the greenhouse's
beds are beds keyed by their place as every bed is (decision 165), and the barn's sprinklers are
the garden's own. Personal touches parked (decision 177): the dishes, who loves each, the lines and
the greenhouse's layout are Claude's, each the warmest fit._

**Decided:**

- **The orchard gives fruit as a tree gives wood.** Each kind of fruit tree is a `PROP_YIELDS` row
  (`ORCHARD_YIELDS` in `src/data/orchard.ts`): **apples, pears, plums and persimmons**, two a
  window, worth 5 each, so a pick is about a tree's wood and Boo Acres is no richer a round than
  anywhere (it joins the economy test's places). Fruit is kind `crop`, so it fills the stove's "any
  crop" and goes on the honesty stall. The trees already had their picked look (`spent`, decision
  241), so the view shows a tree picked clean until the next window. The toasts name the tree.
- **Four dishes, one for each fruit**, at the stove from cards: **apple pie** (three apples and
  candy corn; it lures the bats, fruit bats being bats), **plum crumble** (pep), **hot cider**
  (apples and pears; the fish bite sooner, as with the tea) and **persimmon pudding** (with a
  pumpkin; it glows, and lures the moths). Each is worth well over a quarter more than what goes
  in. Loved by **Barty** (the pie: he's at the farm most afternoons), **Maude** (the crumble, with
  her tea), **Rufus** (the cider, by his hearth) and **Gourdon** (the pudding, orange as he is).
  Their cards are sold every day at the seed cart and now and then in Cobweb Corner's cookbook.
- **The seed cart is a shop, `seeds`**: a shelf of every seed there is, every day and in the same
  order (a pick of all of a pool keeps its order, in `systems/shop.ts`, so a seed is found where
  it was yesterday), and the orchard's four cards. Walking up to the cart opens it.
- **The greenhouse is a room under glass** (`greenhouse` in `INTERIORS`, `underGlass`), through a
  glass door at the middle of the building (`doors` in `BOO_ACRES`): twelve **raised beds** in two
  blocks, the potting bench and flower buckets by the door, glass along the back wall. A raised bed
  is a fixture that is one of her beds (`planter` on a `FixtureRow`; `bedsInRoom` hands them to
  `Farm` with the places' beds), tapped, looked at and tended like any bed, its crop drawn standing
  in its soil by `RoomView` as a planter's is at home.
- **Under glass, a crop grows as if in its own season, all year** (`growsQuick` in
  `src/systems/greenhouse.ts`, read where `quick` is set): planted out of its season, or with no
  season at all, it is a day sooner (`Planting.quick`); in its season it is the season's day
  already, and the glass adds nothing more. So a tomato in January is as quick as in July, and the
  lake still beats the glass for an iris in spring.
- **The barn's wall** (`world.barn`, `Barn`; `src/hud/BarnSheet.ts` through `BarnApi`): walking up
  to the barn shows her sprinklers (in her bag, and how many stand where) and the farm's
  **fields**, each a block of beds that touch (`fieldsOf` in `src/systems/barn.ts`: rows 1 and 2,
  3 and 4, and the built rows 5 and 6 as they come). **Sprinkle** stands sprinklers from her bag
  in a field's beds, as few as water it whole (`sprinklersFor`: the bed reaching the most dry beds
  first; two for a pair of rows of six), as far as her sprinklers go; **Bring in** takes them back,
  what they watered staying watered. It is the garden's own `fit` and `unfit`, through
  `Garden.fitAll` and `unfitAll`, so it's as if she had walked up to each bed.
- Held by `tests/world/whatGrows.test.ts` (picking, the dishes and who loves them, the cart's
  every seed, the greenhouse's door, beds and season, the barn's fields, sprinkling and bringing
  in), the economy test, the interiors tests, and smoke's `whatGrows` (by real taps: an apple
  picked, a seed bought at the cart, a field sprinkled at the barn, and a raised bed in the
  greenhouse planted, quick).

**Rejected:** the greenhouse as quick on top of a crop's season (two days sooner in season is more
than "its season", and would make the glass beat the lake); fruit as a kind of its own (every rule
that takes a crop would need telling); the barn sprinkling every field at once (a field at a time
lets her choose where her few sprinklers go); a stand of raised beds two tiles long (a tap on a
fixture lands on its first tile, so a bed is a tile); seeds dealt at the cart like Cobweb Corner's
six a day (the plan's point is that a seed she wants is never a wait).

## 243. Scarah lives at Boo Acres: a scarecrow in a straw hat, with Cornelius, who says "Pumpkin" (2026-10-05, 0.3's F3)

_Session F3 of the 0.3 plan, lane 3, its last. **Save v42**: her `VillagerId` in friendships.
Personal touches parked (decision 177): no question asked; her voice, loves, birthday, Cornelius's
word and every line are Claude's, the warmest fit for decision 214, named here so the user can
change any of them._

**Decided:**

- **Scarah is a plain `VILLAGERS` row** (`SCARAH` in `src/data/scarah.ts`, with her pieces), there
  from the moment the release lands, with no arrival of any kind (decision 211). **A weekday** is
  the fields at first light, her seed cart from nine, the orchard after lunch, the porch at five
  and home in the farmhouse from eight; **a weekend** is by the farm's well at first light, into town by
  Cobweb Corner from ten, back to her cart at three, the porch at six and home at nine. The seed
  cart is hers now: "Scarah's seed cart", its greeting with Cornelius counting the Candy.
- **Her voice** (the defaults picked): sunny, earnest and a little bit country, new to being
  alive and delighted by all of it, hopeless at scaring anything; "Howdy!" She woke in the far
  field one harvest moon and sneezed. **Cornelius's one word is "Pumpkin"** (`CORNELIUS_SAYS`),
  said about everything: hello, thank you, the New Year countdown. Eight lines a band and one a
  window, her own `SMALL_TALK` on every topic, two pieces of news, two puffs (straw settling),
  a line for every holiday and special day, at the door on Halloween, and a crown and a good-sport
  line at the costume contest.
- **Her loves**: sweetcorn, sunflowers, ladybugs, jewel beetles, moss beetles (she loves a
  beetle, decision 214), pears and apple pie, from F2's orchard. **Likes** crops, seeds and
  critters. **Favours**: sweetcorn for supper, wood for the fence by the pond, apples for the pie
  she promised Barty. **Her birthday is 23 September**, the autumn equinox, in the harvest moon's
  season.
- **Her rewards** are the plan's, not the shape every other neighbour's takes (a recipe, then
  something to wear, then a piece; Boothoven's are the other exception): at **three hearts a
  packet of every seed there is**, one each, in one envelope (a `Reward` and a `Letter` may carry
  `also`, more wares opened with the gift, and `called`, what it all is, which the mail and the
  neighbours sheets show); at **six her straw hat's twin** (`scarahHat`, a new `farmHat` cut with a
  patch and a band, in straw only, `fixed`); at **ten the straw friend**, a little scarecrow in a
  sundress with a wooden crow, made at her workbench from wood, sweetcorn and a sunflower, and one
  of the pieces that go out in her yard (`OUTDOOR`).
- **Her farmhouse** (`scarahFarmhouse`, a `ZONES` and an `INTERIORS` row, through the farmhouse's
  door at its middle in `BOO_ACRES`): a wall of seed drawers (a fixture), the stone hearth with a
  pumpkin chair, a tea table, pumpkins and flower pots, and her two keepsakes, **Cornelius's
  perch** (a straw nest and a little bell to ring for breakfast) and **the harvest moon quilt**.
- **Her look** is built from the doll's parts with touches of her own (`src/sprites/villagers.ts`):
  burlap for skin, a straw-coloured shaggy bob with straws picked out (`strawy`), a blue gingham
  sundress with two patches sewn on, stitches at her neck and wrists (`SEAMS`), her straw hat,
  and **Cornelius** on her left shoulder at its outer edge, clear of her face: looking out from the
  front, peeking back from behind her head from the side, his tail down her back from behind.
- **Her place in every happening**: the seed swap with Barty, film night (a seat behind the back
  row, `filmBehind`), the costume contest (**a crow**, in black wings and a beak, with Cornelius
  gone as a scarecrow in a hat, the second week of October; at the fairground the line-up's
  eleventh place is at its left end, where a pumpkin of the party's set stood, moved two tiles
  along), the Halloween party, Thanksgiving, carols and the countdown; at a gathering before the
  stage `crowdBackMiddle`, round the well at her birthday party `wellWestUp`.
- Held by `tests/data/villagers.test.ts` (her rewards checked by name, as Boothoven's are),
  `dialogue.test.ts`, the happenings, venues, film night, birthdays, costumes and holiday-line
  tests as for everyone, `tests/world/scarah.test.ts` (her days, her farmhouse's door, the packet
  of every seed opened once and kept, Cornelius saying only his word) and smoke's `scarah` (to her
  at her cart by real taps, a talk, and in at her door). Two tests leaned on how the town's days
  happened to be dealt, which a twelfth neighbour reshuffles: a visit is now looked for where she
  can see it, and a lost thing's "?" is checked in a window when its owner has no news of their own.
  And smoke, run in the morning, found the meal chip's "till afternoon" cutting the day beside it
  short on a phone held upright; the chip now says "till noon" (`tillShort` in `hud/food.ts`).

**Rejected:** a seed packet as a reward of a kind of its own (a letter carrying more wares is the
smaller change, and opens through `Belongings.receive` as every gift does); Cornelius as a figure
of his own (he's a touch on her, as Rufus's tail is); Cornelius looking in at her face from the
front (drawn there, he sat on her cheek); a twelfth seat at film night beside the end of a row
(the pop-up's lots and an Easter egg's spot are there).

## 250. Fossils: a mound a day in each place, a Fossils tab, a seventh case and two shelves (2026-10-05, 0.3's C1)

_Session C1 of the 0.3 plan, lane 4, its first: decision 216 built. Personal touches parked
(decision 177): the twelve fossils, their words, Wrapunzel's labels and letter, Barty's letter
and the two pieces they send are the warmest plain defaults._

- **Twelve fossils** (`FossilId`, rows in `src/data/fossils.ts`, an item kind `fossil` on the
  bag's Treasures shelf): six common (trilobite, fern in slate, ammonite, stone acorn, bat's
  skull, bonefish in slate), four uncommon (ghost shell, dragon's tooth, fairy loaf, toadstone)
  and two rare (moth in amber, dragon's egg), dealt 12:5:2 as the critters' tiers are. Each has
  the places it's buried in (`where`: the commons almost anywhere, the ghost shell only at
  Lantern Shore, the dragon's tooth only on the castle hill), a value Cobweb Corner pays and **no
  price**, so no shop, catalogue page or book ever sells one. Each is drawn once at 24 in
  `src/sprites/fossils.ts`, as a critter is, and that one picture is its bag icon, its case in
  the Cabinet and its nook at the museum; the ghost shell, the amber and the egg's crack glow
  after dark. Barty, the skeleton, likes fossils.
- **A mound a day in each place**, on one of its map's `digSpots` (`MapSource.digSpots`, four to
  eight a place), picked by the day key (`moundSpot` in `src/systems/fossils.ts`). It is the
  keys' mound (`mound`, `X`), solid as theirs is, standing where `zones/Mounds.ts` says in every
  `MapZone` (`canWalk`, `propAt`), so walking up to it is how it's dug, by the same arrival
  (`World.arriveOn` asks `world.fossils.isToday` before the buried keys). What's in it is the day
  key's too (`findIn`): a fossil most days (12 in 16), or a plain bead or 40 Candy (2 in 16 each); dug once a
  day (`mound:<zone>` in `Takings`, `onceADay`), the hole staying till morning. Every place has
  a mound whether found or not: she can only stand by one where she has been, and the hidden
  clearing's is hers once she finds it. `tests/data/digSpots.test.ts` holds every spot on open
  grass with nothing beside it (so a solid mound cuts nothing off), clear of every habitat (no
  critter dealt under it), every neighbour's spot, way in, door, lot, stall, set piece, egg and
  lost thing, her yard and the farm's kept rows, and out from under every tree's crown, so it
  can be seen.
- **Found is had.** A fossil she has dug up counts as had (`isCollectable` in the milestones
  takes fossils, so `collected` keeps them, save v30's list), which is how the Cabinet knows it,
  however many she sold; so a first is a fuss ("New in your Curiosity Cabinet", the first-catch
  cue) and no new list is saved.
- **The Curiosity Cabinet gains a Fossils tab** (between Cases and Shelves): twelve cases by
  tier, the ones still in the ground as plum shadows with a hint of where to dig. The Shelves tab
  keeps the "Every fossil" shelf as a tally only, the tab being its grid.
- **Wrapunzel's museum gains a seventh case**: Crumbs & Curios is three tiles wider (23), the
  fossils' case at the end of the top row (`shows: 'fossil'`, its twelve nooks the case's
  twelve), with room for C2's eighth below it. Donating is the museum sheet's same Donate,
  fossils after critters, each with its own label (`label` on the row), through
  `world.fossils.donate`. Wrapunzel's counted letters (`museum:<n>`) still count critters only
  (`Cabinet.onShow`), so no old letter moves.
- **Two shelves** in `milestones.ts`: **The fossil case** (`fossilWing`, `{ wing: 'fossil' }`),
  all twelve on show, a letter from Wrapunzel with the **amber moth dome** (the milestones' dome
  over the moth in amber, `sprites/fossilPieces.ts`); and **Every fossil** (`fossils`,
  `{ had: 'fossil' }`), a letter from Barty with his **fossil shelf**, a set piece (`SETS`,
  `src/sprites/display.ts`: two tiles wide, three ledges of four, a bone along its top) that
  shows one of every fossil she owns as the squishy shelf shows her squishies. The bell jar and
  the little plinth take a fossil (`SHOWS`, H2's note).
- **Save v43: `cabinet.donated` takes fossils**, critters first, then fossils; checked by
  `isSaveState`; the step changes nothing, since an old save has none on show.
- Held by `tests/world/fossils.test.ts` (solid, dug once a day, a first and not a second, Candy
  now and then, a donation saved), the rarity test's **fossil year** (every fossil found at two
  mounds a day in about two months on average, never more than five, the commons first, a fossil
  in about three mounds in four), the economy test (no fossil on any shelf or catalogue page, a
  rarer one worth more, a day's mounds short of the dearest piece and a mound short of a round
  of the town), and smoke's `fossils` (a real tap on a mound, the Fossils tab, a donation, the
  seventh case).

**Rejected:** a mound she walks onto rather than up to (the keys' mound is solid and walked up
to, and one arrival rule serves both; the spots test keeps a solid one out of the way);
mounds only in places she has found (she can only be by one where she has been); a saved list
of the day each fossil was first dug (what she has had is saved already); fossils on the
critters' Cases tab (a family that's never out and about, with no hours, reads wrong among
them); a fossil sold anywhere (a mound is once a day, and a price would put it in the
catalogue and Gourdon's book); counting fossils toward Wrapunzel's ten-and-full letters (a
letter she has had would change what it was for).

## 251. Creepy-crawlies, a seventh family, and the Cabinet to sixty (2026-10-05, 0.3's C2)

_Session C2 of the 0.3 plan, lane 4. No save change: a critter is a row, and `collected` and
`donated` take any id. Personal touches parked (decision 177): the critters' names, their words,
Wrapunzel's labels and letters and the two pieces they send are the warmest plain defaults._

**Decided:**

- **Nineteen new critters, 41 to 60** (the test's cap is 64), rows in `src/data/crawlies.ts`
  (`CRAWLIES`, `MORE_CRITTERS`, spread into `CRITTERS`):
  - **The creepy-crawlies** (`crawly`, "Creepy-crawlies" on the Cabinet's shelf), on the
    ground and never in the air: the **pumpkin snail** and **woolly bear** (September to
    November) among the crops, the **boo slug** (a slug under a little ghost sheet) and the
    **glowworm** (it glows) by the logs at night, the **bow spider** on the fences at Boo
    Acres only, the **moon cricket** in the hay, the **fiddle hopper** (a grasshopper) along
    the fences, the **twig knight** (a stick insect in an acorn-cap helmet, rare and wary) in
    the castle's trees, the **roly-poly** under rocks, the **wiggle worm** among the crops in
    the rain, and the legendary **golden snail**, out at Boo Acres only on rainy days.
  - **Boo Acres' own**: a **fruit bat** in the orchard (August to November), a **mud puppy**
    on the pond's bank and a **crawdad** in it (caught on the rod, a fish by the rules). Boo
    Acres keeps the velvet bat and the ladybug (Scarah loves beetles) and gives the town's other
    commons back to the town, so it is a place with critters of its own.
  - **The bats' missing tiers**: the uncommon **long-eared bat** in the woods, the castle and the
    clearing, and the legendary **ghost bat** round the castle on the night of a full moon.
  - **Winter's**, December to February: the **snow moth** at the lanterns, the **frost beetle**
    by the logs and the **snowglobe fish** in Boo Acres' pond and the lake. The plan's "fish
    under the pond's ice" is in the waters that never freeze: the town's pond freezes over
    and nothing swims under it (phase U), and a hole in the ice would be a new verb.
- **Six habitats read from the maps** (`habitatsOf` in `systems/critters.ts`): `crops` (open
  ground beside a bed tile), `hay`, `fences` (fences and posts), `logs` (logs and stumps),
  `rocks` and `orchard` (the four fruit trees). `crops` is the ground by the beds, not what's
  in them, so an empty field never keeps a critter away. None of them touches a dig spot: a
  spot has nothing beside it, so `tests/data/digSpots.test.ts` holds unchanged.
- **Art in each family's shapes at 16 and 24** (`src/sprites/crawlies.ts`, `CRAWLY_ART`, each
  shape drawn for either size from the same numbers): the bats, moth, beetle and fish are the
  families' own grids in new colours, the long-eared bat the bat with tall ears (`longEared`).
  **A crawly wiggles slowly where it is** (its two frames, 900ms each, in `render/critters.ts`),
  never pottering toward her; **the bow spider is drawn to the spider rules** (round, fuzzy,
  big shiny eyes, a pink bow, stubby bent legs four a side, sat in a lacy web) and her two
  frames are the same, so she keeps perfectly still. A first crawly catch toasts with a 🐛.
- **Wrapunzel's museum fills its eighth case** (`museumCase` at `crumbs` (20, 8),
  `shows: 'crawly'`; eleven of its twelve nooks). Her full-museum letter moves to 60 kinds
  (`museum:60`, the curiosity cabinet), and 41 joins `MUSEUM_FORMERLY_FULL`, so a letter had
  at 41 still reads as it did, as 34 did at 0.2's F1.
- **Two shelves**: **Every creepy-crawly** (`crawlies`), a letter from Wrapunzel with a **framed
  golden snail**, and **The creepy-crawly case** (`crawlyWing`), with a **glowworm dome**, a
  `small` piece for her tables (`CrawlyPiece`, rows `CRAWLY_FURNITURE`, art
  `sprites/crawlyPieces.ts` from the milestones' `framed` and `domed`). A family shelf she had
  already finished (the bats, the moths, the beetles, the fish, the frogs) keeps its letter and
  gift and shows its new ones still to catch: a letter is posted once and never taken back.
- **A lure may name the crawlies** (`Kitchen`'s `LURES`, the words in `hud/food.ts` and
  `hud/messages.ts`), though no dish lures them yet.
- Held by `tests/systems/critters.test.ts` (the cap, every critter dealt within a year, at
  least two out in every place at every hour, habitats with room), `tests/systems/rarity.test.ts`
  unchanged (the simulated year still fills the Cabinet in nine to ten and a third months from
  every start, the short seasons last, so the bound stays at eleven), the interiors and museum
  tests, the economy test (values by tier), and smoke's `crawlies` (a crawly netted at Boo
  Acres by a real tap, the eighth case there and the crawly given to it).

**Rejected:** fish under the town pond's ice (a new verb, ice fishing, and against phase U's
"nothing swims under it"); `crops` read from what's planted (a critter that leaves when she
harvests, and a habitat that changes within the hour); the crawlies pottering as beetles do
(a spider walking toward her is what the spider rules forbid); Boo Acres keeping every town
common (it would have been the town again with its own few lost among them); the rarity bound
loosened to twelve months when the year still fills inside eleven.

## 252. Figurines: three of a kind carved at Gourdon's bench, one for everything she collects (2026-10-05, 0.3's C3)

_Session C3 of the 0.3 plan, lane 4, its last. No save change: a figurine is a `FurnitureId`
kept like any piece, and `collected` takes any id. Personal touches parked (decision 177): the
figurines' words, Gourdon's lines over the tab, his letter and the figurine of himself are the
warmest plain defaults, in his voice from `villagers.ts` (short, dry, warm, his candle)._

- **A figurine for every critter, squishy, monster doll and fossil, 88 in all**, made from the
  thing's row rather than typed: `FigurineId` is `` `${Carvable}Figurine` `` (`lunaMothFigurine`),
  `Carvable` the critters, the squishies (a `SquishyId` type, held equal to `ITEMS`' squishies by
  the test), the dolls and the fossils, and `FIGURINE_FURNITURE` (`src/data/figurines.ts`) is a
  row for each from `CARVABLE`: "<its name> figurine", a description and a line by kind. A critter
  or fossil added later has its figurine, row and art, with nothing written for it.
- **Drawn from the thing's own picture** (`src/sprites/figurines.ts`): a critter's
  `CRITTER_ART[id].world[0]` and a fossil's `FOSSIL_ART` at 24, a squishy's or doll's bag icon at
  16 at 1× (never doubled, so every pixel in the piece is the same size), its keys moved clear of
  the kit's (`specimenOf`), trimmed and stood on a little turned plinth with a brass plate: warm
  wood for a critter, rose for a squishy, lavender for a doll, stone for a fossil. What glows on
  the thing glows on its figurine. A figurine is one frame and never moves, so the bow spider
  sits as still as she does in the field.
- **Every figurine is `small`** (spread into H3's `SMALL`), so it stands on the floor or on a
  table's tile; one tile, `mirror`-turning, 32×32.
- **Carving is three of the thing, nothing else, done while she waits**: `world.figurines`
  (`Figurines`, `src/world/services/Figurines.ts`, in the shopping area beside the workshop)
  takes three from her bag and puts the figurine in her storage chest through `Belongings`, as a
  bought piece goes; a `carved` moment (the first of one a fuss, `firstCatch`'s cue, after that
  `made`'s) and a `carved` signal. The rule (`carvingsFrom`, `canCarve`, `carvedFrom`,
  `isFigurine`) is `src/systems/figurines.ts`. No Candy is asked: duplicates are what she pays
  with, and a fee would make the cozy use of a fourth luna moth a sum.
- **The workshop's fourth tab, Figurines** (a `COUNTER_TABS` row and a branch in `ShopSheet`'s
  `render`, S2's note): a `collection()` list by kind of everything she has one of or more that
  he carves, the figurine's picture, "You have 2. One more and he'll carve it." and a Carve
  button that wakes at three; his line over it in place of the greeting.
- **No figurine has a price**, so none is on his bench, in his book, on any shelf or in Ollie's
  catalogue; furniture is never sold back, so a figurine is worth nothing in Candy and the
  economy test holds it at no more than three of what it's carved from.
- **Every figurine** (`figurines`, `{ had: 'figurine' }`): `shelfOf` gives `FIGURINE_IDS`, and
  `Milestones` hears `carved` and keeps each figurine in `collected` with the squishies, dolls and
  fossils, so one had and given away still counts. Finishing it brings Gourdon's letter with
  **the Gourdon figurine**, carved by himself, his grin lit by his candle after dark. The
  Cabinet's Shelves tab shows it as a tally: eighty-eight slots are too many for a grid.
- Held by `tests/systems/figurines.test.ts` (one per thing, made from its row, none priced, all
  small, all a tile), `tests/world/figurines.test.ts` (three in, one out into the chest, nothing
  from two, the first a first, kept in the save, the shelf's letter), the workshop sheet's test,
  the economy test, and smoke's `figurines` (up to his bench by real taps with three luna moths,
  Carve, and the figurine in her chest).

**Rejected:** a carving fee in Candy (friction on the one thing duplicates are for, and the plan
asks only for three); a figurine made overnight and posted, as his book's pieces are (a figurine
is a few minutes' whittling, and seeing it made is the fun); figurines priced into his book
(they'd be a way to buy what she hasn't caught); a squishy or doll drawn doubled to match a
critter's size (two pixel sizes in one piece); typed `FigurineId`s (eighty-eight rows to keep in
step with every critter added); a shelf of a figurine per family rather than of every one (the
plan's `had: 'figurine'` is every one, and a long shelf is something to come back to, never a
thing lost).

## 260. Ollie's catalogue: what she has ever had, ordered again and in her mailbox next morning (2026-10-05, 0.3's S1)

_Session S1 of the 0.3 plan, lane 5, its first. Personal touches parked (decision 177): no
question asked; the counter, Ollie's words and his letters are the warmest plain defaults, in his
voice from `villagers.ts`._

- **`Belongings` keeps `ever`**: every ware she has ever had of the kinds the catalogue lists
  (furniture, wallpaper, flooring, clothes, squishies, dolls, records and pets' accessories), as
  `kind:id` keys (`furniture:pumpkinChair`), in the order she first had each. It notes what comes
  through `receive` (the shops, letters), what's in her bag on every `bag` event (so a squishy
  sold the moment it came is had all the same), and, whenever it's read or saved, whatever else
  she has: her chest's pieces and things, every room's and the yard's pieces and what they show,
  her closet, walls, floors and her pets' things. A key this build doesn't know is let go. The
  rules (`keyOf`, `wareOf`, `groupOf`, `everOf`, `orderPrice`) are `src/systems/catalogue.ts`.
- **The catalogue lists what she could have again.** A page is something she has had that a shop
  sells (`orderPrice` is `priceOf`, the shelf's full price, never a special's, so the catalogue
  never undercuts a shop: the economy test holds it). A gift, a keepsake or a made piece has no
  page: a gift is one of a kind, and what she makes she makes again at the workbench. Clothes,
  walls, floors and pets' things are hers for good once had, so they have a page only once they
  aren't, which nothing does yet; furniture and her squishies, dolls and records are what comes
  twice. "Two chairs, at last."
- **Ollie's post counter** (`postCounter`, a fixture in his cottage at the front of the room, by
  his sorting table, art in `src/sprites/postCounter.ts`) `opens: { sheet: 'catalogue' }`:
  `src/hud/CatalogueSheet.ts` through `CatalogueApi`, on the frame with two tabs, **Catalogue**
  (`collection()` by kind, searchable from twelve pages, a price button each) and **On its way**.
  The row's picture, name and words are shared with the shop's shelves (`src/hud/wares.ts`,
  `drawWare` and `faceOf`, lifted out of `ShopSheet`).
- **An order is paid as it's placed and comes the next morning** (`world.catalogue.order`, then
  `world.deliveries.send`): `Deliveries` keeps the orders on its way with the day key each was
  placed on, and from 5am on any later day posts each as its own letter from Ollie,
  `order:<kind>:<id>:<n>` (`n` counting the orders that came before, so two chairs are two
  letters), with the thing in it; a `delivered` moment says so ("Ollie has been round with your
  Pumpkin armchair!"). `letterOf` reads the ware back out of the id, so any build can open it, and
  opening it puts the thing where it belongs, as every letter's gift does. S2's book (Gourdon's
  made-to-order pieces) sends through `Deliveries` the same way.
- **Save v41: `ever` and `orders`**, checked by `isSaveState`; the step (`everOwned` in
  `migrations.ts`, through `everOf`) seeds `ever` from what she owns and wears now, her
  squishies and dolls had (`collected`) among it, and gives an old save no orders.

**Rejected:** clothes, walls and floors listed as "Yours" rows (a lived-in closet would fill the
catalogue with buttons that do nothing); a gift's or made piece's page at a price made up for it
(a gift is one of a kind, and making is the way to a second); one letter a morning with every
order in it (a letter carries one gift, and a parcel each is more like Ollie); the order put
straight in her chest with a toast (the plan asks for the mailbox, and a letter from Ollie is half
the fun); orders that come at the next window rather than the next morning (Ollie's round is
mornings).

## 261. Gourdon's workshop: three fresh off the bench a day, and his book of every piece, made overnight (2026-10-05, 0.3's S2)

_Session S2 of the 0.3 plan, lane 5. Personal touches parked (decision 177): no question asked;
Gourdon's greeting, his word on the book, the tabs' names and the line she reads on ordering are
the warmest plain defaults, in his voice from `villagers.ts` (short sentences, dry, warm, his
candle)._

- **His carpenter's bench opens a shop** (`carpentersBench` `opens: { shop: 'workshop' }`, its
  old line given up, as every fixture that opens something has none): `workshop` is a `ShopId`
  and a row in `SHOPS`, `WORKSHOP` in `src/data/workshop.ts`, open every day, whoever is home.
- **Fresh from the bench is a shelf** (`WORKSHOP_SHELVES`, a row per shelf): three pieces a day
  from every piece he makes, at the shelf's price, dealt from the day key as any shelf is, bought
  through `world.shops.buy` into her chest.
- **His book is every piece with a price** (`WORKSHOP_PIECES`, worked out from `FURNITURE`), so
  the priced furniture, H5's yard pieces and S3's and S4's sets are in it the moment they have a
  price, and a gift, keepsake or made piece never is. The plan's "every piece he makes" taken
  whole: he makes the plants and the record player too ("if a chair wants to be a table…"),
  because a piece she wants should be a day away whatever it is. Its pages are grouped for the
  floor, the walls, little things (`SMALL`) and the yard (`OUTDOOR`) (`bookGroupOf`).
- **Made to order at a quarter over the shelf price, rounded up** (`BOOK_MARKUP`, `bookPrice` in
  `src/systems/workshop.ts`, on S1's `orderPrice`), paid as it's ordered, and sent with
  `world.deliveries.send`, so it comes from 5am the next morning as S1's orders do: an
  `order:furniture:<id>:<n>` letter from Ollie with the piece in it, into her chest when opened.
  `world.workshop` (`Workshop`, `src/world/services/Workshop.ts`, in the shopping area) has
  `book()` and `order(piece)`, which emits S1's `ordered` moment and signal. The economy test
  holds every page at a quarter over the shelf price at least, and above whatever any shelf asks
  over four weeks.
- **A tab on `ShopSheet`**: the tabs a counter has besides its shelves are rows in
  `COUNTER_TABS` (Cobweb Corner's Buy and Sell, the workshop's **The bench** and **His book**), so
  C3's figurines are a row there and a branch in `render`. The book is a `collection()` list,
  searchable, an Order button each, "One on its way." on a piece ordered, his line in place of the
  greeting while she reads it.

**Rejected:** a letter from Gourdon rather than Ollie (an order keeps only its ware and day, so a
letter of his own would need the save, and Ollie is the one who carries everything); the book as
an explicit list (it would fall behind every new priced piece, S3's and S4's sets first); leaving
out what a carpenter wouldn't make (plants, the record player: the point is that nothing she wants
is more than a day away); the book at the shelf price (it would make the shelves' dealing
pointless; a quarter is the price of not waiting); the workshop shut while Gourdon is out (nothing
is gated, decision 211).

## 262. Four furniture sets, a set a week dealt whole, and a kitchen whose worktops meet (2026-10-05, 0.3's S3)

_Session S3 of the 0.3 plan, lane 5. Personal touches parked (decision 177): no question asked;
the sets' pieces, their names, words, colours and prices are the warmest plain defaults._

- **Four sets of seven pieces, 28 in all**, rows in `src/data/sets.ts` (a const per set, spread
  into `FURNITURE` as `SET_FURNITURE`), art in `src/sprites/sets.ts`. In code a set is a
  **suite** (`SuiteId`, `SUITES`, `SuitePiece`), because H2's `SetPiece` already names a piece
  that shows the set of something she owns. The plan's five pieces each, and two more to make
  a room of it:
  - **Cosy kitchen** (sage cupboards, oak tops, copper): a cauldron stove, a bat-magnet icebox,
    a counter with hearts cut in its doors, a farmhouse sink with a gingham curtain, a kettle
    shelf, and a copper kettle and a ghost cookie jar for the counter.
  - **Bedroom** (rose, lavender, cream wood, gold): a canopy bed, a moonlit wardrobe, a vanity
    with a ringed mirror, a nightstand, a tasselled lamp, a heart rug and a DREAM hoop.
  - **Library** (dark oak, teal, brass): a bookcase to stand in a row, a buttoned reading chair
    (a seat), a brass globe, a rolling ladder, a desk with a leather top, a green glass lamp and
    a map of McFrancisVille.
  - **Witch's corner** (plum, moss, glowing green): a potion rack, a seeing stone on a brass
    bat, a hat stand, a broom on a hook, a spellbook lectern, drying herbs and a moon phase rug.
- **The kitchen's worktops meet.** The counter, the sink and the stove share one worktop height
  counted up from the floor (`WORKTOP_FROM`), so side by side they are one run of cupboards;
  `tests/data/sets.test.ts` holds it.
- **Surfaces and small pieces are marked in H3's tables**, as decision 232 asks: the counter,
  the vanity, the nightstand and the desk are `SURFACES`; the kettle, the cookie jar, both lamps,
  the globe and the seeing stone are `SMALL`. The sink and the stove are not surfaces (a basin
  and a cauldron are in the way).
- **Cobweb Corner sells them two ways:** a piece a day from any set on its Furniture shelf, and
  **This week's set**, a shelf dealt `everyWeek` with the boutique's `sets` pick, so one whole set
  is there Monday to Sunday and the four come round in turn, every piece at its full price. Each
  priced piece is in Gourdon's book and on his bench by decision 261, with nothing added.
- **Two colours in the palette**, `sage` and `copper`, for the kitchen.
- **Prices** 280–900 Candy, within the economy test's bounds: a bed or a wardrobe dear, a trinket
  about what H3's are.
- No save change.

**Rejected:** a set sold whole for one price (a set is a way to find pieces, and she may want
only the bed); a discount for a whole set (the shelves never discount but the special); a fifth
shelf of every set every day (the shop would be all furniture; Gourdon's book is where any piece
is a day away); the kitchen's pieces as one wide counter (a run of one-tile pieces can be laid
out to fit any wall); a crystal ball on a tall stand (the plan's word, but H3 asked for the
crystal ball to be small, so it sits on a little brass bat and goes on a table).

## 263. Four more sets, windows that show the sky at the hour, and four floors (2026-10-05, 0.3's S4)

_Session S4 of the 0.3 plan, lane 5. Personal touches parked (decision 177): no question asked;
the pieces, papers, floors, their names, words, colours and prices are the warmest plain
defaults._

- **Four more sets of six pieces, 24 in all**, rows in `src/data/sets.ts` beside S3's (a const per
  set, joined to `SET_FURNITURE` and `SUITES`, so the weekly shelf deals eight sets in turn), art
  in `src/sprites/setsTwo.ts` (`SET_TWO_ART`; S3's `SET_ART` keeps its own `FirstSuitePiece`s):
  - **Bathroom** (white enamel, mint, marble, brass): a clawfoot tub heaped with bubbles, a marble
    washstand, a scalloped mirror, a towel rail, a rubber duck in a witch hat, a bath mat.
  - **Garden room** (wicker, terracotta, green): a potting bench, hanging plants, a little
    watering can, a wicker peacock chair (a seat), a fern on a stand, a little lemon tree.
  - **Music corner** (black, cherry red, chrome): a big amp, a record crate, an old microphone, a
    pumpkin bass drum with its cymbal, a guitar on a stand, a gig poster.
  - **Haunted lounge** (dark wood, crimson velvet, old silver): a coffin sofa (a seat), a silver
    candelabra, a suit of armour holding a feather duster, a watchful portrait, a grandfather
    clock with a ghost for a pendulum, a claw-foot side table.
- **The portrait's eyes follow her.** A piece in `WATCHERS` has its art drawn three ways (looking
  left, ahead, right), and `pieceSprite` takes her x and picks the one that looks at her: ahead
  while she's within a tile of its middle, else toward her side. Nothing is saved.
- **Surfaces and small pieces in H3's tables:** the washstand, the potting bench and the claw-foot
  table are `SURFACES`; the duck, the watering can, the microphone and the candelabra `SMALL`.
  The washstand is two tiles, its basin in the left one, so the duck can sit in the sink.
- **Six wallpapers with windows** (`WindowPaperId`, rows in `src/data/wallsAndFloors.ts` spread
  into `WALLPAPERS`, 560–640 Candy): arched windows on cream stripes, round brass portholes on
  teal, leaded cottage windows with gingham curtains on sage, gothic windows on plum stone, a
  lace-curtained sash on rose hearts, and an ivy-grown window of small panes on whitewashed brick.
  A window wallpaper is an ordinary paper tile (so the walls-and-floors test holds) and a window
  hung on it **every four tiles, balanced on the middle** (`windowsAlong` in
  `src/systems/windowSky.ts`), never in a corner, beside an arch, or **behind anything hung on
  the wall** (a picture is never half over a window). `roomShell` draws them, cached by the sky.
- **The sky through a window is a look per hour and weather** (`windowSky`: dawn, day, the golden
  hour, dusk, night, rain, fog and a rainy night), read off the same `Daylight` the room is lit by
  (so `?hour=` shows any hour) and the day's weather (`?weather=` at home too). Each look is the
  window drawn again with what's in its sky (`windowArt` in `src/sprites/wallsAndFloors.ts`): three
  bands stepping into each other over a dithered row, hills with a cottage whose window is lit
  after dark, clouds by day, the moon at dawn and night, stars at dusk and night, rain in streaks
  one across for four down. The room's light is multiplied over it as over everything; the
  night's sky is painted dark, nothing else. The sheets show a window paper as two tiles each way
  with a window by day; the gallery shows every window under every sky (`window:<id>:<sky>`).
- **Four floorings** (`SetFlooringId`, 380–460 Candy), one a set: mint penny tiles, terracotta
  tiles, a starry carpet and chevron parquet (the plan's herringbone, drawn as a chevron, which
  repeats cleanly in a 32-pixel tile).
- **Cobweb Corner's Walls & floors shelf** puts out a window wallpaper and one of the new floors a
  day as well as its wallpaper and flooring. Ollie's catalogue orders any of them again by
  decision 260, with nothing added.
- **`tile` and `halfDrop`** moved from `surfaces.ts` to `src/sprites/tiling.ts`, unchanged, so the
  new papers fold their motifs the same way without a cycle between the two files.
- **Two colours in the palette**, `mint` and `terracotta`.
- **Smoke's `windows`** hangs the arched windows by taps and reads the night sky's deep blue off
  the canvas at `?hour=22`, and a light blue at noon.
- No save change.

**Rejected:** a window as a wall piece of furniture (the plan's "wallpapers with windows", and a
piece would cover the wall it hangs on rather than look out of it); a window in every tile of
the paper (a wall all glass); the sky as a palette swap of one grid (rain and stars cross the
bands, so each look is drawn as its own grid, still keys and a palette); the windows lit after
dark like the town's (they look out, so they show the night; the room's lamps are what glow);
eyes that follow her pixel by pixel (three looks read at once at 1×); a window that shifts over
to dodge a picture (a window stays where the wall has it, or isn't there).

## 264. The review before 0.3's release: lived-in 0.2.5 and 0.3 saves, where it hurts now, perf (2026-10-05, 0.3's V1)

_Session V1 of the 0.3 plan, alone after its five lanes (W1, A1–A4, H1–H5, F0–F3, C1–C3,
S1–S4), the model being 0.2's V1 (decision 210). No save change. Personal touches parked
(decision 177): the mayor's five notes are the warmest plain words, and nothing was asked._

- **Lived-in saves for 0.2.5 and 0.3 are fixtures.** `lived-in-v34.json` is 0.2.3's fixture
  opened and saved by 0.2.5's own code (`main`'s migrations and world, in a copy of `main`), the
  shape of the save on her phone as 0.3 lands; `lived-in-v43.json` was played over three days by
  0.3's own code in a real browser (a scratch Playwright driver of `window.world` under
  `?loop=manual&day=`): Boo Acres and the greenhouse planted and the barn's field sprinkled, the
  orchard picked, the back room built and papered with windows and furnished from two sets, things
  on tables and in a bell jar, the yard with four pieces out, things in the chest, friends at every
  band with Scarah at three hearts and her packet opened, fossils dug in six places and crawlies
  caught, both given to the museum, a figurine carved and stood on a table, the week's set bought,
  Ollie's and Gourdon's orders delivered and one more on its way. Both are in `LIVED_IN`, so every
  later migration holds them. A dev build's `?day=` moves the game's clock but `main.ts` stamps a
  save from the real one, so the 0.3 fixture's three timestamps were set to the days it was played.
  Loaded in a real browser on 0.3, both came up with nothing set aside and no console errors, and
  the top bar's sheets opened upright and on its side.
- **`livedIn.test.ts` opens a save no sooner than it was put down** (its clock is the later of 1
  October and the save's `lastPlayedAt`), so what she took that window is still taken, as on her
  phone; and her home is put back in its one-room shape only for a save from before her rooms
  (`RESHAPED` asks `was`).
- **Smoke sends off a toast in her way only if it's still there** (`tapToastAway`): `edges`,
  `tapAlong` and the lake ring tapped a toast that could have gone by itself, and waited on
  nothing until they timed out, the known flake.
- **The architecture review**: `tests/architecture.test.ts` holds the layers unchanged (no lane
  needed a new import across them). `docs/architecture.md` names the services, keepers and zones
  the lanes added, and "where it hurts" is rewritten for now. Nothing bigger was moved in a
  release: making `World.arriveOn` a table keyed by prop id, `MapZone`'s seven overlays a list,
  the home bed key carrying its room (a save change), `Home`'s rooms a keeper of their own and
  `wiring/apis.ts` split by area are written down there for the session that next touches each.
- **Perf against 0.2.5** (`npm run perf`, now walking Whisperwood's trees, Boo Acres, her yard with
  every outdoor piece out and her back room full of set pieces under a window paper too, each
  skipped on a build without it), measured beside a copy of `main` on the same machine,
  alternating, two runs each: no frame doubled. Every draw is within a few milliseconds of 0.2.5's
  (town 59.4–59.7 ms against 57.3–58.1, home 31.4–32.3 against 29.2–30.1, Whisperwood with its
  see-through crowns 52.3–54.8 against 54.1), Boo Acres draws like the fairground (43–47), the yard
  like the town, and a back room of 52 set pieces under windows about 5 ms over her front room;
  each update is about a tenth of a millisecond dearer; the heap is 3.5 MB higher (20.8 against
  17.3 MB), 0.3's art and rows, each baked once. The table is in `docs/architecture.md`.
- **The mayor's 0.3 notes are five lines written fresh** from every lane's decision, the details
  the lanes' folding lost among them (a neighbour's boots under hems, tall boots over jeans,
  collars past any hairdo, wings over gloves).
- **0.3 goes to her phone as one release**, `v0.3-dev` into `main`, opened ready by V1 and merged
  only by the user.

**Rejected:** making the arrivals a table and the overlays a list now (a release isn't the place
to move how every arrival and step runs; 0.2's V1 left the `build.ts` split the same way, and W1
did it cleanly); a v34 fixture played fresh on 0.2.5 (the 0.2.3 save carried forward is the road
her phone actually took); keeping the real clock's timestamps in the 0.3 fixture (the test would
open it the day after it was played, and what she took that afternoon would read as gone).

## 265. `v0.3-dev` makes no Vercel previews, as the other dev branches don't (2026-10-05, 0.3's V1)

_Found by V1 after its merge: the release PR's checks showed a Vercel deployment. No save change._

**Decided:** `vercel.json`'s `git.deploymentEnabled` turns previews off for `claude/**`,
`v0.1-dev` and `v0.2-dev`, as `CLAUDE.md` says of every dev branch (the user's call, since Vercel
deployments are limited), but `v0.3-dev` was never added when it was made (decision 212), so each
merge into it during 0.3 made a preview deployment (36 of its commits since 4 October, by
GitHub's deployments list). It is added beside the others. A later plan's integration branch
should be added the day it is made. `main` still deploys, which is the release.

**Rejected:** a pattern such as `v*-dev` (the file names each branch so far, and a glob that
misfired would turn off something the user wanted on).

## 266. V1 is a feel, people, rhythm and presentation release, shipped as patches (2026-10-06)

**Decided:** after 0.3 shipped she still finds the game flat, and `docs/v1_analysis.md` says
why: wide, not deep. V1 (`docs/v1_plan.md`) adds almost no content; it makes the world react,
the neighbours know her, the weeks differ and the game look and sound finished. **It ships as
small patches (0.4, 0.5…) to her phone as the pieces make sense**, each a `NOTES` row, with the
whole plan done being 1.0. `v1-dev` is the integration branch (made from `main` at 0.3,
decision 265's no-preview list), five lanes by the files they own, **two at a time**, save bumps
in a session's last commit after merging `v1-dev` and merged one at a time, as 0.3 ran. Decision
blocks: the interview 266–275, lane 1 from 280, lane 2 from 290, lane 3 from 300, lane 4 from 310,
lane 5 from 320.

**Rejected:** one big V1 release (she checks in every day; a patch she notices beats a release she
waits for); a seventh place or more sets (a seventh place would be as flat as the sixth).

## 267. How she plays, and what it means (2026-10-06, interview 1–2)

**Decided from the user's answers:** she plays mostly at night, flips between upright and on
its side by what she's doing, checks in every day, and has sound on about half the time. She
never goes to the fairground; she loves collecting creatures and things; she has said nothing
about the menus, and has said some creatures and scenery look funny. So: **the night's light
comes first among the presentation sessions** (she sees the night more than the day), evening
happenings are fine but the day needs beats too, both orientations are checked in every session
that touches the view, sound is worth doing but after feel and people, the fairground gets its
games reworked rather than more stalls, and a session renders every creature and the scenery at
phone size and fixes what reads wrong before any art is added.

## 268. The camera comes closer, and she can toggle it (2026-10-06, interview 3)

**Decided:** the user asked for the closer camera as a toggle. **Close is the default** (about
12 tiles across: scale 3 on an iPhone, she about 8 mm tall, faces that read, tap targets near
Apple's 44 pt), **Far is the view she has now**, switched in Settings and kept per phone like
the sound switches; rooms fit the width in a drawn surround instead of a black void at either.
On its side the view keeps whichever she chose.

**Rejected:** close with no way back (she may like the overview for farming), pinch-to-zoom
(continuous scales break whole pixels, decision 85).

## 269. Cody keeps his manor; no kids in the game (2026-10-06, interview 4)

**Decided:** she likes Cody having his own house, so he keeps the manor and his schedule; what
changes is that he is **married to her from the start** (a band of his own above "best friends",
no hearts to earn, the sheet never calling her husband "getting to know you"), spends his
evenings at her house more often than chance, and gets a daily exchange she answers. **The
kids stay out of the game** for now: small talk may mention the school run as it does, but no
one is named and no one appears.

## 270. The mayor is Rob Boo, and the mystery finishes in V1 (2026-10-06, interview 5)

**Decided:** the mayor nobody has met is **Rob Boo, a new ghost**, and V1 builds the rest of the
mystery to his unmasking: the remaining clues and letters a week apart in play (time-released,
never locked), Wes someone she can finally talk to, the neighbours theorising in small talk, and
a reveal she has been working toward, after which **Rob Boo is a neighbour like the others**
(a row, a home, lines, loves, favours, rewards, his place in the happenings), the neighbour who
comes with this release (decision 211). The shape of the reveal and his character are the plan's
P3 sessions' to write, warm and silly, never scary; the user may add touches later (decision 177
holds).

## 271. Things may arrive on a schedule; no critter is ever more than a month away (2026-10-06, interview 6)

**Decided:** time-released beats are fine (a visitor for a week, a chapter a week, a project
finishing), as long as nothing is locked (decision 211). But **she dislikes a creature she can't
get for a year**, so the seasons of 0.2's F1 (decision 150) are softened: a critter keeps its
season as the time it's _common_, and **every critter can be found some day in every month**
(out of season it visits for a few days a month, round the full moon, as a rule in `isAbout`;
the rarity test holds that no critter waits more than 31 days), and the Cabinet's hint says so.
**Holiday creatures are added, not time-limited**: a holiday brings new critters out for the
first time, and they stay in the game after it (common on the holiday, about now and then the
rest of the year). "Open for discussion" on the exact rule: the plan's R5 session may tune it.

**Rejected:** dropping seasons altogether (the hunt is what she loves; the wait is what she
hates).

## 272. A little skill, never frustrating; the fair games reworked (2026-10-06, interview 7)

**Decided:** fishing, bug catching and the fair games may ask something of her as long as it is
never frustrating and there is always a floor: a shorter bite window for a rarer fish, a rare
critter that drifts off as she nears, a fair game won by timing, every go winning something and
nothing ever lost. **The fair games "definitely need a rework"**: they are a win button today.

## 273. The UI keeps its style and is polished; the town turns with the seasons (2026-10-06, interview 8)

**Decided:** no pixel-frame restyle of the HUD; **the current rounded style stays and is
polished**: drawn icons where emoji sit in the chrome, sheets that slide, hearts and Candy that
move, a title with a night sky, an app icon drawn properly, portraits that read. And **the town
changes with the seasons**: grass, leaves and hedges by month, snow that settles in winter,
blossom in spring, drifts in autumn, with October still the heart of it.

**Rejected:** nine-slice wood-and-parchment frames and a pixel font (a big change from the look
she knows and hasn't complained about).

## 274. Long-term goals: something to build (2026-10-06, interview 9)

**Decided:** no real-life project to nod to, but **long-term goals like building something are
wanted**: town projects funded over weeks in Candy and materials, with progress visible in the
world and a finished thing to use. The economy test's "nothing dearer than a day" is relaxed for
that category only, and Whisperwood's gathering is capped per place so a project is a goal, not
nine minutes of tapping.

## 275. Her callouts: jumping spiders, the greenhouse planters, red bat wings, cloud save, selling faster (2026-10-06, interview 10 and after)

**Decided, each a session or part of one in the plan:**

- **Jumping spiders to collect** (R5): a few, cute, among the crawlies, kept gentle as the art
  style asks.
- **The greenhouse's planters don't show the seed planted** (S4): a bug in how a raised bed's
  planting is drawn in the room; fixed and held by a test.
- **Not everything in blue; bat wings in red** (S4): the rule that every recolourable piece comes
  in a blue (`outfits.ts`, held by a test) becomes "comes in the colours that suit it", the bat
  wings in red first, and a pass over the fabrics of every piece so each list is the piece's own.
- **Cloud save** (S2): the first thing that isn't a static site. The save syncs to a store behind
  a Vercel serverless function keyed by a secret the phone makes once, restored on a new phone
  by that key as a short code or a QR; the backup code stays. The user provisions the store in
  Vercel (the only step a session can't do) and the session writes the rest and the steps.
- **Hold − and + to sell more** (S4): a held button repeats and speeds up, on every − n + in the
  game (selling, putting away, ordering).

## 280. The effects layer: pops, particles and emotes from every moment, and the world never names one (2026-10-07, V1's E1)

_Session E1 of the V1 plan, lane 1, answering `docs/v1_analysis.md`'s finding 1 ("Nothing
reacts": about thirty moments were cue and toast and nothing in the world). No save change.
Personal touches parked (decision 177)._

**Decided:** one world-space effects queue, `Effects` in `src/render/effects.ts`, made once in
`main.ts` and shared by every view, stepped by the simulation's fixed step (so smoke cranks it
with the world, as the camera and the see-through crowns are) and drawn by `OutdoorView`,
`HomeView` and `RoomView` last, after the light and the bubbles, each drawing only its own
place's (an effect carries the `ZoneId` it was pushed in). Three families:

- **Pops:** what she got, its own 16-pixel icon baked at 2× by `bakeIcon` (an item's from
  `ITEM_ART`; Candy as a wrapped sweet, `CANDY_POP`; anything that isn't an item, a chair or a
  frock or a recipe, as a parcel, `PARCEL_POP`), arcing from where it came from (`popAt`: 360 ms,
  lifted 22 px at the middle) to over her head, then floating up 14 px with "+n" in a 3×5 pixel
  font outlined in ink (`countArt`) and fading. From her hands (a sheet's purchase, a bake) it
  rises from below her head with no arc. Pops that come together go 200 ms apart, so a bead found
  with the stone is seen as a second thing. As it lands, the HUD's bag or Candy chip bumps
  (`hud.bump`, a `hud-bump` keyframe added to `styles.ts`, starting 300 ms in).
- **Particles:** a pool of 96, reused oldest-first, in seven kinds (`PARTICLE_ART` in
  `src/sprites/effects.ts`: leaf, dust, splash, sparkle, heart, confetti, coin), each a tiny grid
  at 2× in a few palettes, moving by its own `MOTION` row (velocity ranges, gravity, sway, life,
  a twinkle or tumble frame). A burst is a kind, an anchor, a count and a spread. A footfall
  outdoors kicks up one faint puff of dust a step (`Effects.walking`).
- **Emotes:** ♥ ♪ … ! ? over her or a neighbour, following them as they move. **`NEIGHBOUR_BUBBLES`
  is grown** to all five (`Emote` in `sprites/villagers.ts`, the three new grids `EMOTE_BUBBLES`
  in `sprites/effects.ts`), so there is one set of bubbles: the "!" and "?" of a neighbour's news
  and lost things and the effects layer's emotes are the same art. One emote over a head at a
  time, the newest; over a neighbour who already has a "!" or "?" it sits above it.
  `overHead` (`render/villagers.ts`) is where any bubble over a neighbour goes, tall hats and
  Maude's float included.

**The world never names an effect.** A moment says what happened and where; what it looks like
is `effectsOf` in `src/wiring/effectsOf.ts`, which `playMoments` calls for every moment and pushes
from, with `bumpsOf` for the HUD. Where is read from the world as the moment plays (her, her
float) and from two things moments now carry: **`arrived.toward`**, the tiles of what she walked
up to (a prop's footprint, a bed, a critter, a fish, a piece, a fixture; `TileBox` in
`world/events.ts`), set in `World`'s arrivals, which the moments after it in the same batch come
from; and two new moments, **`gave`** (a gift and how it was taken, from
`Neighbourhood.give`) and **`shelved`** (a shelf finished, from `Milestones.check` beside its
letter). Neither has a cue or a toast: the talk sheet already says the first, the letter the
second. `effectsOf`'s switch has no default, so a moment added later doesn't compile until it
says how it looks (or that it has a look elsewhere).

**The mapping, every moment kind:**

| Moment                                                        | Seen in the world                                                                                                                                                                                         |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gathered`                                                    | from a tree, leaves from its crown (the top third of its art); from a rock, dust; flowers, leaves at her feet; the snack and Fibi's bone, sparkles; and the thing popped from where it was, a bead second |
| `resting`, `letGo`, `reeled`, `shut`, `refused`               | … over her                                                                                                                                                                                                |
| `tilled`, `bare`                                              | dust on the bed                                                                                                                                                                                           |
| `planted`                                                     | dust and two leaves on the bed                                                                                                                                                                            |
| `sowedRow`                                                    | dust at her feet, ♪                                                                                                                                                                                       |
| `fitted` / `unfitted`                                         | sparkles at the bed / dust and the sprinkler popped back                                                                                                                                                  |
| `watered`                                                     | a splash on the bed                                                                                                                                                                                       |
| `growing`                                                     | a few sparkles on the bed                                                                                                                                                                                 |
| `harvested`                                                   | leaves and the crop popped from the bed; the first ever, sparkles and !                                                                                                                                   |
| `bought`, `snackBought`                                       | the ware popped from her hands (a parcel if it isn't an item)                                                                                                                                             |
| `ordered`                                                     | ♪                                                                                                                                                                                                         |
| `sold`, `answered`                                            | coins, and Candy "+n"                                                                                                                                                                                     |
| `stallSold`                                                   | coins and Candy from the stall                                                                                                                                                                            |
| `made`                                                        | sparkles and what she made (a parcel for furniture); a room or a shelf, confetti                                                                                                                          |
| `cooked`                                                      | sparkles and the dish                                                                                                                                                                                     |
| `baked`                                                       | sparkles, the bake and its Candy                                                                                                                                                                          |
| `ate`                                                         | ♥                                                                                                                                                                                                         |
| `caught`                                                      | the critter popped from where it was (a fish from the float); a first, sparkles and !                                                                                                                     |
| `fled`                                                        | dust where it was, …                                                                                                                                                                                      |
| `cast` / `nibble` / `bite`                                    | a splash where the float lands, a cast later (600 ms) / a little one / a splash and !                                                                                                                     |
| `potted`                                                      | leaves at the pots, ♪                                                                                                                                                                                     |
| `dug`, `unearthed`                                            | dust and the find popped from the mound (Candy if that's what it was); a first fossil, sparkles and !                                                                                                     |
| `visit`                                                       | the gift popped, ♥                                                                                                                                                                                        |
| `shook`                                                       | leaves from the candy tree's crown, its Candy, the sweet and the sapling popped from it; nothing yet, a few leaves and …                                                                                  |
| `sapling`                                                     | planted, dust and leaves; growing, sparkles; waiting for one, ?                                                                                                                                           |
| `patch`                                                       | a pumpkin picked, leaves and the pumpkin; otherwise …                                                                                                                                                     |
| `tossed`                                                      | landed, sparkles; missed, …                                                                                                                                                                               |
| `won`                                                         | the prize popped; the top prize, confetti                                                                                                                                                                 |
| `readFortune`                                                 | sparkles, ♪                                                                                                                                                                                               |
| `foundLost`                                                   | sparkles at her feet, !                                                                                                                                                                                   |
| `foundEgg`                                                    | sparkles and the egg; the last one, confetti                                                                                                                                                              |
| `trickOrTreat`                                                | the sweet popped from the door, ♥                                                                                                                                                                         |
| `keepsake`                                                    | sparkles at the piece, ♥                                                                                                                                                                                  |
| `decorated` / `frozen` / `dressedUp`                          | confetti and ♪ / sparkles and ♪ / ♪                                                                                                                                                                       |
| `mail`, `delivered`, `wesDropped`                             | ! over her                                                                                                                                                                                                |
| `shelved`                                                     | confetti and sparkles over her                                                                                                                                                                            |
| `clue` / `wesGone`                                            | sparkles and ? / ?                                                                                                                                                                                        |
| `crowned`                                                     | confetti and ♥ over the one crowned                                                                                                                                                                       |
| `gave`                                                        | loved, hearts and ♥ over them; liked, ♥; otherwise ♪                                                                                                                                                      |
| `flew`                                                        | dust at her feet and sparkles as she lands                                                                                                                                                                |
| `found` / `opened`                                            | sparkles and ! / sparkles                                                                                                                                                                                 |
| `slipped`                                                     | dust and !                                                                                                                                                                                                |
| `played`, `tune`                                              | ♪                                                                                                                                                                                                         |
| `arrived`, `entered`, `photo`, `window`, `weather`, `thunder` | none here: the walk, the fade, the flash card, the window's tint (E4) and the weather layer are theirs                                                                                                    |

- **Reduced motion:** with `prefers-reduced-motion` asked for, nothing flies (no bursts, no
  footfall dust), a pop shows still over her head for 800 ms and an emote still for 1 s, and the
  HUD doesn't bump. Smoke runs reduced, so its checks see the still ones.
- **No new full-frame pass.** The layer draws a few small baked sprites where something
  happened; nothing is drawn when nothing is happening. Measured with `scripts/perf.mjs` against
  `v1-dev` on the same machine (the numbers are in the PR and `docs/architecture.md`).
- **Held by** `tests/render/effects.test.ts` (the arc and float on whole pixels, the queue's
  lives and delays, pops spaced, one emote a head, bursts and the pool, footfalls, reduced
  motion), `tests/wiring/effectsOf.test.ts` (every moment that was cue and toast only is seen;
  the tree, the bead, the loved gift, the float; the bumps) and smoke's `effects` section: a real
  tap on a rock pops the stone over her, upright and on its side, and a LOVE bracelet given
  through the talk sheet puts a ♥ over the neighbour (`view.effects()`, `.smoke/effects-*.png`).

**Rejected:** effects named by the world (a `pop` on a `gathered` event: the world would know it
is drawn, decision 9); positions worked out in `moments.ts` by searching round her for the prop
she meant (a guess; `toward` says it); a `letter` on `mail` to find a finished shelf (it would
reshape every test that expects `{ kind: 'mail', from }`; `shelved` is a line added); a canvas
`fillText` "+n" (soft, not whole pixels); a second bubble system for emotes (the plan's word:
grow `NEIGHBOUR_BUBBLES`); particles stepped by the frame's own clock (they'd run at the phone's
frame rate and smoke couldn't crank them).

## 290. Close and Far: the camera at 12 tiles across by default, and rooms fitted in a house (2026-10-07, V1's L1)

_Session L1 of the V1 plan, lane 2's first, for decision 268. No save change. Personal touches
parked (decision 177): nothing was asked._

- **Close is about 12 tiles across, Far is the old 16.** `TILES_ACROSS` in
  `render/pixelScale.ts` is a row per closeness (`close: 12, far: 16`), and `fitPixelScale` takes
  the one she chose; the scale is still the whole number of device pixels nearest that many tiles
  across the short side of the room between the bars, judged as a ratio (decision 86). On an
  iPhone 15 that is scale 3 at Close (393 game pixels across, 12.3 tiles, her 144 device pixels,
  8 mm) and 2 at Far (18.4 tiles, as before). On its side the short side is the strip's height
  (about 990 device pixels), which gives the same 3 and 2, so the view keeps whichever she chose.
- **Kept by the phone, beside the sound switches.** `src/settings.ts` (`readCloseness`,
  `writeCloseness`, the key `mcfrancisville:view`), read once in `main.ts`; the type is
  `Closeness` in `types/view.ts` so the HUD and the drawing share it. Settings has a **View** tab
  first, two chips, Close and Far, a line under them saying what each is like; a tap refits the
  canvas at once (`ViewApi`). Not in the save: it's how this phone shows the town, like the
  rod's colour (decision 171), and a backup code doesn't carry it.
- **A room is fitted to show it whole, within a step of the town.** `fitRoom` picks the whole
  scale nearest to showing the whole room both ways, but never farther out than the town at her
  closeness and never more than one step closer, so a small shop (9 tiles) fills the width at
  scale 4 on an iPhone, her first room (13) is scale 3 at either closeness and scrolls by the
  little it's over, and the big home rooms (17, 21) stay at the town's scale and scroll as
  before. `main.ts` refits when the room she's in changes size (going in, out, or through the
  arch) as well as on a resize. Upright the room fills the width; on its side it fills the
  height.
- **What a room stands in is a house, not a void.** `drawRoomFrame` (`render/room.ts`) fills the
  canvas with dark wood panelling moving with the camera, then the house round the room: a plum
  shingled roof with a chimney on its top, timber posts at its sides, a stone footing under its
  front with a step out below the mat, and its soft shadow on the panelling, a dollhouse on a
  shelf. The art is `sprites/roomSurround.ts`, built from the town's building kit
  (`slopedRoof`, `chimney`, `footing`, `buildingPalette`), each piece baked once per size, the
  panel a pattern; four rows in the catalogue (`surround:*`).
- **Everything else reads the scale through the canvas.** The camera, taps (`screenToWorld`),
  the bed card (`tileToClient`), the occlusion pass and `drawTarget` all work in world pixels
  against the canvas's backing size, so nothing changed in them; smoke's `closer` section runs
  `smooth`'s walks again at Far. The title's picture is drawn at 1× into its own canvas and the
  party photo is cut from the canvas pixel for pixel, so neither depends on the closeness.
- **The perf baseline is at Close** (`docs/architecture.md`), with Far beside it; `npm run perf
-- --view=far` measures Far.

**Rejected:** a closeness per place (one switch is what she asked for); fitting a room by its width
alone (on its side a room would be drawn at scale 8, her a hand tall); fitting a room however close
it takes (a seven-tile room at scale 5, her two-thirds again her size outdoors); flooring the room's
fit rather than taking the nearest (her first room, 13 tiles, would float at 71% of the width at
Far for want of the 0.7 tile it's over at scale 3); drawing the sky or the town outside round a
room (a room isn't anywhere in the town's map, and the night outside would fight the room's cosy
light); a soft frame alone (the panelling, roof and footing say "a house" where a frame says "a
picture"); pinch-to-zoom (decision 268).

## 281. Her verbs have a body: she faces what she walks up to, and five action poses (2026-10-07, V1's E2)

_Session E2 of the V1 plan, lane 1, answering `docs/v1_analysis.md`'s finding 1 ("Her verbs have
no body"). No save change. Personal touches parked (decision 177): nothing was asked._

- **She faces what she walks up to.** `facingToward` (`systems/facing.ts`) turns her to the
  nearest tile of the box she arrived at (`arrived.toward`): across or along whichever is
  further, **up or down on a tie** (a bed at her corner is in front of her or behind, as one
  reached over is), and her own way when she stands on it (flowers, a mat). `World.face` calls
  it in the prop, bed, thing and piece arrivals, before a seat (which turns her its way) or a
  door (whose crossing stands her in the next place facing in) has its say; a critter, fish,
  pet or neighbour keeps turning her by pixels as before. So she tends a bed, chips a rock,
  opens the chest and knocks at a neighbour's door facing it.
- **Five action poses, facing her way** (`ActionPose`: `crouch`, `pour`, `swing`, `holdUp`,
  `wave`), where the five old poses face the front. Each is a body per view (front, back, side)
  and frame in `sprites/doll.ts` (`ACTION_BODY`): her standing body with the arms that move drawn
  over it as limbs in region keys and outlined against whatever they cross, so every cut,
  sleeve, glove, tattoo and bracelet follows them (decision 27), and those arms again as an
  `over` part, in front of her hair, a skirt or a bib. From the front her right arm (the
  viewer's left) does the one-handed things, as it holds her net and can; from behind, the
  viewer's right; from the side her near arm. **A crouch is a fold**, like sitting: `folded`
  takes `CROUCH_DROP` (5) rows out of her legs and lets everything above come down, her feet
  where they stood, so every hem, boot and cape rule (decisions 220–221) holds on it unchanged;
  `seated` is now a fold too. Tall hats lift with `raised` (decision 131).
- **Which verb, how long, from which moment.** `systems/poses.ts` has the verbs and their beats
  (`VERBS`): **pick**, a crouch (320 ms); **water**, the can tipped (480 ms, long enough for the
  splash to land); **find**, a crouch then the find **held up** over her head (720 ms, as long as
  E1's pop takes to float up off her hands); **show**, held up alone; **greet**, a wave (600 ms, the
  hand one way and the other every 150 ms). `verbOf` (`world/services/Poses.ts`) maps moments:
  gathered, tilled, bare, planted, sowedRow, fitted, unfitted, potted, foundLost, a candy-tree
  shake that dropped something, a sapling planted, a pumpkin picked and a later harvest are
  pick; watered is water; dug, foundEgg, a fossil unearthed and **a first harvest** are find; a
  catch (once the net has come down, `NET_MS`; a fish as soon as it's reeled), a fair prize and a
  trick-or-treat sweet are show; walking up to a neighbour is greet, and to a pet, a crouch to pat
  it. `World.update` hands each batch to `poses.saw`, the last moment with a verb wins, the
  clock times it, and a tap (`stir`) stops it. **The net's swing moves her arm**: two frames by
  how far through `netSwing` it is (`swingFrame`), and `drawNet` sweeps from her hand
  (`SWING_HAND`). An action wins over busy (talking, petting) and over a rock-out, which a
  thrill now holds back until the action is done, so a first catch is swung, held up, then
  rocked out.
- **Hold-it-up carries the thing through the effects layer.** E1's pop already lands over her
  head and floats up from there; her hands go up under it as it lands, so what she found rises
  off her hands. Nothing is drawn in her hands twice, and the world still never names an effect.
- **The can is drawn tipped** (`TIPPED_CAN`, `sprites/actions.ts`): the can's columns let down a
  row every three across, the 1:3 stair pixel art draws a slope in, with three drops from its
  rose, held in the pouring hand (`POUR_HAND`) and turned away from her.
- **A breath and a blink while she stands** (before the phone, and talking too): every 3.2 s
  she breathes out, everything above her hips down a pixel (`folded` at `BREATH_FROM`, one row),
  and every 4.3 s she blinks for 130 ms, every third time twice (`blinking`, the `blink` mood: her
  lids down, `EYE_BLINK`). What she holds comes down with her hands. `poses.rest()` says which;
  `bakeDoll` takes it as `Rest`, a picture of its own in the cache (`:out`, `:blink`).
  Neighbours' breath is left to E3, who does the rest of them: `folded(figureLayers(…), BREATH_FROM,
1)` behind a key in `bakeFigure` is their breath, but Gourdon's lit pumpkin would want its glow
  folded too, which is more than a line.
- **Held by** `tests/sprites/doll.test.ts` (every action, view and frame painted in regions;
  every piece, hairstyle, tattoo and bracelet drawn in every action, facing and frame; each
  facing a picture of its own; a witch hat lifted and her feet where they stand; the crouch's
  fold; no shoe over any hem and a cape behind every skirt in every action; ink and bracelets
  moving with her arms; the breath's fold and the blink), `tests/systems/facing.test.ts`,
  `tests/world/poses.test.ts` (a first harvest crouched, held up, then rocked; the bed faced and
  the can tipped; a rock turned to and crouched at; breathing; `verbOf`), and smoke's `verbs`
  section (a real tap on a rock: crouched and turned to it, upright and on its side; a bed tapped
  twice: faced and crouched at). The gallery's `doll:act:*` rows are every action and facing,
  and `doll:acts:dressed` four looks (witch hat, cape, skirt, boots, gloves and bracelets;
  overalls and a hoodie with long hair; the ball gown and tiara; a jacket, bat wings and the
  helmet) through all of them.
- **No new pass.** The poses are baked pictures like her walk; the can is one more drawable.
  Measured with `npm run perf` beside L3's session on the same machine, within the Close and Far
  baseline's spread (the numbers are in the PR).

**Rejected:** a sixth pose to shake a tree (she crouches for the wood that fell, as for anything
on the ground); the find drawn in her hands as well as popped (two of it); moving E1's pop onto
her hands while she holds it up (it would jump as the pose begins and ends); the pose timed by
stepped time, as stillness is (the net's swing and the rock-out are on the clock, and an action
is a moment, not a wait); a crouch drawn with knees out (every hem, boot and cape would need
drawing again; the fold keeps them right for nothing); turning to a thing at her corner sideways
(the side view hides her far arm, and up or down shows both hands at work); a whole-sprite bob
for the breath (her feet would leave the ground).

## 291. Light: a grade by hour, dithered lamp pools, bloom, a night vignette, moonlight, cloud shadows and wet ground (2026-10-07, V1's L3)

_Session L3 of the V1 plan, lane 2, for `docs/v1_analysis.md`'s finding 4 ("Night is one
multiply") and decision 267 (she plays mostly at night). No save change. Personal touches parked
(decision 177): nothing was asked._

- **The grade is a row per sky** (`GRADE` in `src/render/grade.ts`), blended as the light is
  (`gradeOf(daylight)`; `grade(hour)` for a clear day outdoors, tested). Each row has a `light`
  (a palette colour the frame is multiplied by, which tells most on its highlights), `shadows`
  (a signed offset a channel: positive lifts the darks toward it, negative presses them down), a
  `vignette` strength and how strongly the `clouds` show. Midday is a touch of warm sun
  (`lightDay`) and the clouds; dawn is pink with its shadows lifted; the golden hour is warm with
  its shadows deepened, for contrast; dusk is rose highlights over shadows lifted blue; night is
  the old blue with its shadows lifted toward a grey-blue, which desaturates it a little; a full
  moon's night is brighter and silver. Rain and fog multiply their `tint` in and hide the clouds;
  indoors `soften` lifts the light toward plain, halves the vignette and the shadows, and there
  are no clouds. The old sky colours (`skyDusk`…) stay in the palette for the art that mixes them.
- **One pass added, and only where the shadows move.** The light map is still the one multiply
  over the frame; the grade's shadows are one more fill over it, a `screen` in their colour to
  lift or a `color-burn` in a colour just under white to deepen (`passOf`), and none at all when
  they're zero, as at midday. Between a sky that lifts and one that deepens the offsets pass
  through nothing, and a channel leaning against the rest is left alone, so it is always one pass
  and never jumps. Midday, which drew nothing before, now draws one pass: with nothing lit and
  no vignette there is no map at all, and the day's light with the clouds in it is one 512-pixel
  tile (cached until its colour changes, so by day never) multiplied straight over the frame.
- **The vignette and the clouds are folded into the light map.** The map's base (the grade's
  light with the vignette multiplied in) is cached on the `Lighting` and made again only when its
  colour or the vignette's strength changes (a step every minute or two of real time); a frame
  copies it. The vignette is measured in world pixels from the middle of the frame (from 4 tiles
  out to its darkest at 11, `vignetteShade`), as L1's note asked, so Far, showing more of the
  town, sees more of it darkened; it darkens toward a plum-blue (`PALETTE.vignette`), never
  black, in sixteen dithered steps. The clouds are a 512-pixel tile of low-frequency value noise
  (`src/render/clouds.ts`), their edges four dithered steps, multiplied into the map outdoors by
  day as it drifts (`Lighting.outdoors(cam, nowMs)`, which a view without clouds never calls).
- **Lamp pools fall off smoothly in dithered steps.** `poolFalloff` is 1 − d² of the radius,
  stepped into eight levels with a 4×4 Bayer dither (`src/render/dither.ts`) in the pool's own
  pixels; a lamp stands on a whole world pixel, so the pattern keeps to the ground as the camera
  moves. Brighter at the middle than the old rings and gone at the edge.
- **Bloom is cached per glowing sprite, not per place and hour band.** Each sprite's `glow` gets a
  halo the first time it's drawn (`bloomOf`, a `WeakMap` beside the glow it came from): every lit
  pixel spreads its own colour five pixels round, capped at 0.42 and stepped in four dithered
  levels. It's drawn into `drawLight`'s glow layer just under the glow itself (one line added to
  `render/scene.ts`), so whatever stands in front rubs it out as it does the glow, and it fades
  with the lamps. A frame pays a copy per glowing thing on screen and no pass over the frame. A
  cache per place and hour band was the plan's other suggestion; per sprite needs no band (the
  lamps' strength is the layer's alpha) and survives every place.
- **Sparkles glint after dark.** The effects layer's sparkles and coins (`Effects.glints`, a
  method added to lane 1's `render/effects.ts`) get a small warm dithered halo added under them
  as the lamps are lit (`drawGlints`, one baked halo copied per sparkle), in every view.
- **A full moon rims what stands outdoors.** On a night that's more moonlit than not (`rimLit`,
  from the light's own blend) each drawable is drawn as its rimmed copy (`rimmedOf`, made once
  per sprite): solid pixels with air above go 55% to `PALETTE.moonRim`, with air to their left
  30%, light from the top left as the art style says. Drawn in the sprite's place, so it's hidden
  by what's in front, and costs nothing over the frame.
- **Rain bakes the ground wet** (`Ground.wet`): when the day's weather turns to rain or from it
  every chunk is let go and baked again as it's drawn, never per frame: everything a shade darker
  (`PALETTE.wetGround` multiplied in under the shadows) and puddles holding the grey sky on about
  one open path tile in six (`puddlesOf`, `src/render/puddles.ts`, the same tiles every rainy
  day; three shapes in `src/sprites/puddles.ts`, each inside its tile so the chunks' seams hold).
  The rain's splashes and ripples still fall over them each frame as before.
- **Measured** with `npm run perf` and `npm run perf -- --view=far` beside a copy of `v1-dev` on
  the same machine, alternating, two runs each (the table is in `docs/architecture.md`): at
  21:30 the town draws in 29.1–31.6 ms at Close against 23–29.6, and 47–60.2 at Far against
  46–48.2, so about 2–4 ms dearer at Close, inside the runs' own spread, and no frame doubled; at
  noon 13.4 ms against 10.6 (medians 8.3 and 8.5). A first version laid the day through the map
  as the night is and cost noon 14 ms; the day's tile took it back. `scripts/perf.mjs` takes
  `--hour=` and `--day=` now, to measure the clouds at noon and the rims on a full moon.
- **Held by** `tests/render/grade.test.ts` (each sky's look as the canvas would blend it: dusk's
  cool shadows and warm highlights, the golden hour's contrast, the night's desaturation and blue,
  midday not plain, the moon's silver, rain and indoors, one pass at most and smooth at every six
  minutes of the day) and `tests/render/light.test.ts` (the dither, the pools, the vignette in
  world pixels, the bloom's reach and colour, the rim, the clouds' cover, the puddles).

**Rejected:** a self-blend (`soft-light` of the frame over itself) for contrast (a copy and a
pass, where a `color-burn` in a near-white is an affine curve in one); a `color` or `saturation`
blend for the night's desaturation (a non-separable blend, dearer, and a mode that can't blend
with the hours either side); a pass each for the grade, vignette and clouds (three passes where
the plan allows one); a smooth gradient vignette (it would band and soften the pixels); bloom
from a blurred copy of the whole frame (a pass and a blur, and not crisp); bloom drawn after the
light over everything (a window's halo would shine through her when she stood in front of it);
rim light drawn as a pass of edges over the frame (the same occlusion problem); puddles as
decals every day (they'd be dry on a sunny one) or drawn each frame (decision 138's bake).

## 320. Her fixes: a held − or + repeats, the greenhouse's seeds sit in the soil, and each piece comes in its own colours (2026-10-07, V1's S4)

_Session S4 of the V1 plan, lane 5, answering three of her callouts (decision 275). No save
change. Personal touches parked (decision 177): nothing was asked._

- **A held button** (`held` in `src/hud/dom.ts`, its timing `HELD` and `heldGap`): a step as
  it's pressed (pointer events, mouse and finger alike), the next 400 ms on, then a step every
  120 ms easing evenly down to every 50 ms by two seconds held; it stops on release, when the
  pointer slides off or is cancelled (a scroll), and when the button is disabled, which is the
  − n + at one or at all she has. The click a browser sends after a press is swallowed, so a tap
  is one step; a click with no press before it (a keyboard, a script) is one step too. A long
  press is never the phone's own: no text picked, no callout, no menu. `howMany`
  (`hud/itemCard.ts`) is the only − n + in the game and uses it, so the shop's Sell card, the
  bag's put away at home and the chest's take out all repeat; held a second and a half it passes
  ten (smoke's `held` section, upright and on its side, then sells that many). **Ordering** (the
  catalogue, Gourdon's book) is one piece at an Order button and has no − n +, so nothing was
  added there: a count to order is a feature for a later session, not a fix. **Rejected:** a
  constant 120 ms after the wait (twenty takes three seconds, and a stack of sixty forever); the
  jump from 120 to 50 ms at two seconds the brief sketched (it lurches under the thumb, where an
  even ramp just feels quicker); pointer capture (it would keep a slid-off finger counting).
- **The greenhouse's beds** didn't lose the seed: they drew it in the wrong place. A planter's
  crop (a raised bed in the greenhouse, a planter box at home) is lifted `PLANTER_SOIL` pixels to
  its soil, which is right for a growing or ripe crop, whose art has its mound at its foot. A
  seed's and a sprout's art have their mound in the middle of a bed's soil (`BED_MIDDLE`, as an
  outdoor bed's tile is all soil), so lifted the same they floated 8 pixels over the bed's back
  edge, a brown speck on the cobbles behind it that didn't read as planted. `cropTop`
  (`render/garden.ts`) now sets those two stages down by `EARLY_MOUND_RISE`
  (`sprites/garden.ts`) in a planter, so every stage's mound stands where the grown crop's will,
  on the bed's soil; outdoor beds are untouched. Fixed where it's worked out, not in
  `RoomView.ts`, so her planter boxes at home are mended too. Held by
  `tests/render/planter.test.ts` (each crop's every stage on the raised bed's soil, read from the
  art) and smoke's `greenhouseBeds` (the strip over the bed unchanged by planting and the soil
  strip changed, a sprout a day on, `.smoke/greenhouse-seed.png` and `greenhouse-sprout.png`).
- **The colours:** "every piece that recolours comes in a blue" (decision 141) is replaced by
  **each piece comes in the colours that suit it**: blues where they suit (Scream Dion still
  starts in blue, her first look is untouched, denim stays denim), and reds, blacks, creams,
  golds and greens where a piece wants them. **The bat wings come in scarlet first**, then black,
  plum and maroon. The pass changed 56 of the 89 pieces' lists, using only the fabrics already
  drawable (`FABRICS`, `FABRIC_TONES`; no new fabric was needed, scarlet and maroon being the
  palette's reds): the ruby slippers' red glitter heels, oxblood stompy boots, red gingham and
  polka dots, yellow rain boots, black pearls, rose-gold lockets, khaki bug-catching kit, a green
  witch hat, a ginger cat-ears band, orange space suits, the monarch dress without its blue. The
  blue flag on `FabricRow` is gone. `tests/data/outfits.test.ts` holds the new rule: every
  piece's fabrics non-empty, each drawable, none twice; the bat wings red first; her first look
  in its own colours; and fewer than a quarter of recolouring pieces blue first. A saved look
  wearing a piece in a colour it no longer comes in is put in its first by `repairLook`, as
  decision 141 does for a fixed piece: no save change, nothing she owns lost, only a colour.
  **Rejected:** adding a `red` fabric beside scarlet (the palette's scarlet is red, and two reds
  a shade apart would crowd the swatches); dropping blue from everything (it's her favourite; it
  stays where it suits); a rule like "at least one warm colour" (it would fill lists for a test,
  as the blue rule did).

## 282. Neighbours come alive: a stroll round the stop, a breath and a blink, a wave, chatter, sitting and their jobs (2026-10-07, V1's E3)

_Session E3 of the V1 plan, lane 1, answering `docs/v1_analysis.md`'s finding 1 ("Neighbours are
statues"). No save change. Personal touches parked (decision 177): nothing was asked, and the
jobs are the warmest defaults the rows suggested._

- **The rules are `systems/neighbourLife.ts`; the neighbour keeps where it's up to; the view
  draws it** (decision 9). `Neighbour` (`world/Neighbour.ts`) gains `roam`, `notice`, `rest`, a
  `seat` and what it's `working` at; `Neighbourhood.step` hands them their stop and what she's
  near, and `stanceOf` says how each is drawn this instant (`Stance`, `types/stance.ts`: a wave
  or a job and its frame, sitting, breathing out, blinking), read by `render/villagers.ts`.
- **Only at their own stop.** `stopNow` is the schedule's stop when that is where they are: not
  on her birthday, at a happening or on a visit, where everyone keeps their place, their lines
  and their facing as before. Away from where she is, nothing of it runs (`Neighbour.rest`).
- **A stroll goes a tile or two, a short walk, and comes back.** After 20–40 s standing at the
  stop (`strollAfter`, hashed by neighbour and how many strolls they've had, timed in stepped
  time so tests and smoke crank it), they walk to one of the open tiles within two of the stop
  that's at most three steps away (`strollTiles`), stand 3–6 s (`lingerFor`) and walk back. Never
  a tile she needs: a way out or a mat (`doorAt` with no prop), a building's door step, or the way
  up to a seat; never another neighbour's stop. Worked out once a stop (`strollsAround`) and kept
  to what's still open today (a mound may stand on one). None starts while she's within two
  tiles. Neighbours aren't solid (phase S), so a stroll never blocks her way; it keeps off where
  she taps. Held by `tests/world/neighbourLife.test.ts`: every stop in every place, and ninety
  seconds of town.
- **A breath and a blink for everyone**, her own rules (`breathingOut`, `blinking`, decision 281)
  at a phase of their own (`restOf`, hashed by id) so a crowd doesn't breathe as one. The breath is
  `folded(…, BREATH_FROM, 1)` of the whole figure (`stanceFolded`), and Gourdon's lit face and
  Maude's glow are folded alike so they stay on what lights them; the blink is the `blink` mood.
  A pumpkin and a skull have no lids, so Gourdon and Barty only breathe.
- **They wave as she comes within two tiles** (`NEAR_TILES`), once per approach: the next wave
  waits until she has been beyond three (`GONE_TILES`), so hovering at the edge doesn't set them
  off again. A wave is E2's `wave` body (`ACTION_BODY.wave`) on theirs, 1.2 s, the hand one way and
  the other every 200 ms (`waveFrame`); Maude, a sheet, raises a hand of sheet. A pose, not an
  emote: the `!` already means news (phase S2).
- **Chatter is the world's, its bubbles the effects layer's.** Two standing still a tile apart
  (a guest and their host, or any two side by side) pair up; each 2.6 s beat of stepped time one of
  them, taking turns, says … (most), ♪ or ♥, or neither for a beat (`chatOn`).
  `Neighbourhood.chatter(zone)` names each beat; `wiring/chatter.ts` pushes each once as an
  `emote` from `main.ts`'s tick, since it isn't a moment. Reduced motion keeps them still, as the
  layer does.
- **Sitting is a seat beside the stop**, automatically: a `PROP_SEATS` bench, log or stump
  outdoors, or a furniture piece with a `seat` in a room, on the tile above, either side or below
  (`seatBeside`, found once a stop). `sits: false` on a `Stop` keeps them standing. They're folded
  with `seated` and drawn on it as she is (decision 174), facing the way it faces, and a tap on the
  seat is a tap on them. Today that sits Maude in the library's wingback, Cody on his manor's
  settee and Nessa on the bench by the lake; a stop moved beside a bench sits whoever keeps it.
- **A working pose is data plus art.** `doing: WorkId` on a `Stop` (`data/villagers.ts`,
  `scarah.ts`; the only fields this session added there) names a `WORKS` row (`data/work.ts`):
  which way they face to do it, each frame's length, and whether they kneel (folded as her crouch
  is). The art is `sprites/working.ts`: per job, two frames of `ActionArms` over a standing body
  (`armsBody`, E2's action body for any arms) and what's in their hands (`Held`, drawn behind
  their hands or `front`, with what glows `lit`). Drawn only for the way the job faces; while she's
  within two tiles they stop and look at her instead, so one view each is enough. Twelve: Rufus's
  bucket of flowers, Gourdon sawing across a trestle, Barty on his knees with a trowel, Wrapunzel's
  tray of cakes, Nessa lighting a lantern at dusk (its flame glows), Ollie's satchel open with a
  letter out, Scarah's little can, Hazel at her telescope, Boothoven conducting, Agatha stirring
  her cauldron, Cody's coffee, and Maude reading (her own sheet, the book open, a page turning).
- **Maude has walk frames**: her sheet's lower half trails behind her as she drifts, the hem
  swinging two pixels each way (`HEM_SWAY`), and a hand, a blink and an open book are drawn into
  her sheet (`MaudeLook`).
- **Seen**: the gallery's `figure:*:wave:*`, `figure:*:blink`, `figure:*:sit` and
  `figure:*:work:*:*`; smoke's `alive` section (everyone standing in town is drawn more than one
  way within four seconds, upright and on its side, and two standing together chatter);
  `view.figures()` in a dev build says how each is drawn.
- **No pass added.** Every stance is a baked picture like a walk frame; a stroll is a walk. Seats
  and strolls are found once a stop, since asking each step cost the town's update about a
  millisecond (`MapZone.propAt` round every neighbour). Measured in `docs/architecture.md`.

**Rejected:** a stroll timed by the clock (a test's stopped clock would have them forever on a
stroll or never); strolls anywhere in a place (a neighbour who wanders off can't be found);
an emote `!` as the greeting (it means news); a wave every time she's within two tiles
(hovering would set it off every step); working poses drawn for every facing (four times the art
for a pose they leave the moment she's near enough to see them side on); a `sits` needed on every
stop by a seat (a bench is for sitting on); chatter as a moment (it would reach the sound and the
HUD, and a moment is something that happened to her).

## 283. Taps are felt and places pass through an iris: a ring, brackets, a shrug, held presses, the broom seen flying, sheets that slide (2026-10-07, V1's E4)

_Session E4 of the V1 plan, lane 1, answering `docs/v1_analysis.md`'s finding 1 ("Taps are dead",
"Transitions are a cut and a 320 ms fade"). No save change. Personal touches parked (decision
177): nothing was asked._

- **What a tap shows** (`wiring/taps.ts`, `feelTap`, called by `main.ts` with what the view's
  `tap` now returns, `Tapped`: whether she set off and where it landed): a **ring** of whole
  pixels where her finger came down (a new `ring` effect in E1's layer, 3 to 12 pixels across in
  360 ms in the candle's bright, every view), **candle brackets** round what she set off toward
  for a beat (a new `outline` effect, 640 ms, closing in from 8 pixels out to 2 in 140 ms and
  fading, drawn at any size like the bed's look), and a soft `CUES.tap`. What she set off toward
  is the world's to say, `World.aim`, read from the walk she's on: a prop's, bed's, piece's or
  thing's tiles, a pet's or critter's tile, or a neighbour, whose brackets follow them as they
  move and onto a seat (`Resolve.figure`, from `overHead`, as E3's note asked). Open ground
  gets only the ring; a bed's first tap already has its own brackets.
- **Where she can't go, she shrugs.** `World.tapTile` is the old tap (now `tapOn`) with one
  rule after it: false (nowhere to stand within reach of it) and not decorating, `poses.shrug()`
  (a new `shrug` verb, 640 ms, and a new `shrug` action pose in `sprites/doll.ts`: elbows in,
  hands out either side palm up, a body per view like E2's, so every outfit is held by the doll
  tests); the view adds a ? over her and `CUES.refused`, the soft pluck down a shut place makes.
  Never a toast. While she's still walking somewhere a shrug is hidden by the walk; the ? still
  shows. A hedge beside open ground is walked up to, as before.
- **A held press is a tap.** The 500 ms limit is gone; the 8-pixel slop stays, so a drag is
  still not a tap. The canvas takes no callout, selection or menu on a long press.
- **The iris.** `render/transition.ts` (`Transitions`, made once in `main.ts`) is the view's,
  started by the moments that say she went somewhere (`entered`, `flew`) or the day turned
  (`window`), three lines added to `wiring/moments.ts`; the world never knows. A place's moment
  plays before the next frame is drawn, so the canvas still holds the place she left: it's
  copied once (and, when something moves her outside the step and a frame is drawn before the
  moment, kept by `leaving` from the frame before), stretched if going in refits the canvas, and
  an iris of whole-pixel rows (`irisRows`, a staircase edge like the art's) closes on her middle
  over it in 180 ms, easing in, then opens on her at the new place in 220 ms, easing out, in
  `PALETTE.ink`. Doors, doorways between her rooms and the mat alike. With reduced motion it's a
  fade through the same dark over the same time, nothing moving; smoke runs that way, so its
  pixel checks wait for it (`view.transition()`, which the woods' and greenhouse's checks read).
- **The broom seen flying.** On `flew` (her broom home and back, the map's flights), before the
  iris: a puff of lavender smoke where she stood, big enough to hide her and a tall hat
  (`POOF_FRAMES`, three frames), and her sat on her broom side on in its own colours
  (`RIDING_BROOM` in a new `sprites/broomFlight.ts`, under her `sit` doll) swooping out of it,
  a hop and then up and away faster and faster toward whichever side of the frame has more room,
  with a short trail of candle pixels, 560 ms; then the iris closes on the puff and opens where
  she lands, and E1's landing dust and sparkles wait for it (`LANDING_MS`).
- **A window turning** washes the frame in the window's colour (morning `skyDawn`, afternoon
  `skyGolden`, evening `skyDusk`) up to 22% in 260 ms and away over the rest of 1.1 s, with the
  chime and toast it had. Not motion, so reduced motion keeps it.
- **Sheets slide** (`styles.ts`, a block added): up in 180 ms on an ease-out over a backdrop
  fading in, and away in 160 ms as they close (`leave` in `hud/dom.ts`): from the moment it
  starts going a sheet isn't open (`sheetOpen`), takes no taps (`inert`), and isn't a dialog;
  one opened over another cuts the first, so two never stack. **The title fades** into the town
  in 420 ms, out of reach of a second tap, and his dedication fades in. With reduced motion all
  of it is a cut, as before, which is what smoke and the HUD tests see unless they ask.
- **No pass in play.** The ring and brackets are a handful of 2-pixel rects for a fraction of a
  second; the iris, the flight and the wash are drawn only while one is under way, and the copy
  of the frame she left is let go when it ends. Measured in `docs/architecture.md`.
- **Held by** `tests/render/transition.test.ts` (the iris's rows, its timing, the swoop, the
  wash, a passage started and finished, a frame kept for its moment), `tests/world/taps.test.ts`
  (a shrug at an unreachable hedge, not at a reachable one, `aim`), `tests/wiring/taps.test.ts`,
  the ring and brackets in `tests/render/effects.test.ts`, the slide in `tests/hud/sheet.test.ts`,
  the title's fade in `tests/hud/titleScreen.test.ts`, the shrug in every outfit in
  `tests/sprites/doll.test.ts`, and smoke's `taps` section (a real tap on a hedge in the clear:
  a shrug, a ? and a ring, upright and on its side; a press held 900 ms sets her off; flying
  home fades, flying back with motion shows the broom then the iris; a sheet slides up and away,
  both ways; `.smoke/taps-*.png`).

**Rejected:** the iris in the HUD's overlay with a CSS `clip-path` circle (a soft edge over a
world of whole pixels, and the frame she left isn't the HUD's to show); a canvas `arc` for the
iris (antialiased in world pixels, soft when scaled up); only opening the iris at the new place
(the old place would cut to dark); holding the world back until the iris closes (the world
would wait on the view, decision 9); the broom flight drawn over the new place (she'd be drawn
twice, landing and standing) or her vanishing from the old frame (the frame is a picture: the
puff is what hides her); a toast on an unreachable tap (the plan's word: never); keeping the
500 ms limit with a long-press action (there's nothing a long press should do but tap); the
closing slide on every close, including one sheet replacing another (two would stack for
160 ms); a closing sheet left a `.hud-sheet` that counts as open (a tap during its slide would
reach it).

## 321. Heard: the silent switch, a mixer with a room in it, a B and a night for every tune, and ambience by place (2026-10-07, V1's S1)

_Session S1 of the V1 plan, lane 5, answering finding 5 of `docs/v1_analysis.md` (a mute phone on
silent, a dry music box looping one melody, no ambience). She has sound on about half the time
and plays mostly at night (decision 267), so the night is what was tuned. No save change.
Personal touches parked (decision 177): nothing was asked._

- **The silent switch** (`src/audio/session.ts`, `SilentSwitch`). iOS plays Web Audio in the
  "ambient" category, which the ring/silent switch mutes. Where the phone has
  `navigator.audioSession` (iOS 17 and later) its `type` is set to `playback`; otherwise a looping
  `<audio>` element plays a second of silence, which moves the page's whole audio session to
  playback, Web Audio with it. The silence is an 8-bit WAV made in code (`silentWav`, a data
  URI), not a file. Both happen first thing in her touch, **before** the context is made or
  resumed (`SoundBoard.unlock`), which is the order the technique needs; the element is kept off
  AirPlay and the remote controls and paused when the page is hidden, and restarted by the next
  touch. Only the order can be tested off a phone (`tests/audio/heard.test.ts`, with a stand-in
  context); that the switch no longer mutes it is for her iPhone. **A hint** in Settings' Sound
  tab, "Sound off? Check the silent switch on the side of your phone.", the first time that tab
  is shown on a phone (`silentHint`, kept beside the sound switches, never in the save).
  **Rejected:** the silent element on every phone (on iOS 17 it would put a silent track in
  Control Center for nothing); a file of silence in `public/` (decision 2's spirit: made, not
  loaded); muting the hint once she turns sound on (we can't tell the switch's position, so it
  would tell her nothing she needed).
- **The bus layout** (`src/audio/graph.ts`, `Mixer`, built once on the context, so an
  `OfflineAudioContext` gets the same graph to measure): four buses, effects (0.7), music (0.45),
  records (0.7) and a new ambience bus (0.5), each going dry into one master
  `DynamicsCompressor` (−20 dB, knee 18, 3:1) and sending into one `ConvolverNode` whose impulse
  is generated (2.2 s of stereo noise, a different stream each side, 18 ms in, dying away and
  darkening as it dies). The sends: music 0.34 and ambience 0.4 (they sit back in the room),
  records 0.2, cues 0.12 (a tap still sounds like a tap). Every triangle, square and sawtooth
  voice goes through a lowpass a few times its pitch (6×, 3.5×, 3×, kept within 700–7000 Hz),
  the buzz off a phone's speaker; a part may carry a `pan`, made once per position per
  destination (`Mixer.into`), the melody and bass always in the middle, chords left, the shimmer
  and counter-melody right, a footstep a little to its foot's side. **Loudness**, rendered offline
  in Chromium through the real graph: the compressor's make-up gain and the reverb made
  everything about 1.5× louder, so the master came down from 0.8 to 0.55, which puts each sound
  back where it was (records 0.048–0.089 RMS, peaks under 0.41; the music 0.019–0.022 RMS, the
  night's peaks a little lower than the afternoon's; the cues as before). **Rejected:** a reverb
  per bus (four convolvers for one room); a send per voice (a node per note for what a bus does
  once); stereo by detuning (a phone's two speakers are close, and detune already makes the
  chorus); keeping the master at 0.8 (records peaked at 0.59).
- **A B section** is a second run of 8 bars in each `THEMES` row (`b`: its own chords, in the
  same metre and feel, ending on a chord that leads back to A's first), played on every odd pass:
  so a place's tune goes A, B, A, B. The town's waltz is still note for note on its first time
  round. **A night arrangement** is a fourth `Time`, `night`, from 10pm until 5am inside the
  evening window (the evening's now covers 6pm–10pm; `isNight`, `NIGHT_FROM`): 0.74 of the
  tempo (the evening's 0.85), the melody softer with a longer ring, and under it only the bass on
  each bar's first beat and one bell of the chord's top note a beat later, over the evening's
  held pad: whatever the feel, the night has room in it. `musicFor` takes `night` in its
  `Occasion` rather than a new window, so nothing else in the game learns a fourth window; the
  fountain's music box is the same by night. **Variation pass to pass** (`variationOf`): the
  first A and the first B are as written; after that each round of an A and a B brings, in turn,
  a counter-melody (each chord's middle note held, stepping to its top, a soft triangle off to
  the right), the answer up an octave (the second half, or the first if the second won't fit
  under C7), a counter-melody with a bar left out, then a bar left out (never the first or the
  last bar: the tune always starts and lands; the chords play on under it). The bar left out
  moves each time round, so ten passes in a row are all different and the whole comes back only
  after many minutes. `SoundBoard` writes each pass as it comes round (`tuneOf(key, pass)`, once
  a pass, with the first kept); `musicBeat` reads the pass playing, so the fountain's lamps still
  pulse true. The music box takes the B and the bars left out, never the octave or the counter
  (it stays bright and plucked). **Rejected:** a tune written out per place and time (twenty-four
  scores, decision 172's reasoning); one long cycle of passes written into a single `Tune`
  (minutes of notes held in memory for every place visited); a random variation (the same pass
  should sound the same, as every other sound in the game does); a fourth `DayWindow` (the
  noticeboard, gathering and the calendar are three windows a day; only the music needed the
  night).
- **How ambience is chosen** (`src/audio/ambience.ts`, `ambienceFor`): from what the music reads
  (the place, the hour, the weather) plus the month and how near water she stands, a `Bed` of
  levels. Outdoors: crickets from 8pm to 4am, April to October, never in rain, louder in the
  woods, the clearing, the farm and by the lake, faint at the fair; rain on a wet day, more in a
  storm; wind in Whisperwood (0.45) and on the castle hill (0.7), a breath of it on a foggy day
  and more in a storm anywhere; water from `waterNear` (open water within five tiles, the nearer
  the louder; the creek under its ice and the pond frozen over at half), with Lantern Shore's
  lake heard all over the shore; the fairground's murmur while it's open. Indoors: a soft hum,
  and rain on the roof, low and muffled. `src/wiring/hearing.ts` reads it only when she steps
  onto another tile or into another place, or once a minute, and `SoundBoard.setAmbience` fades
  each layer in, out or to its new level over two seconds. A layer is generated: noise (a 4 s
  stereo buffer) through filters, swelling and moving on slow oscillators of its own, so nothing
  is touched per frame (perf's update times are unchanged); the crickets are three `Tune`s of
  narrow bursts of noise, each looping at its own length (23, 29 and 31 beats) so they never
  fall into step. All of it measures under the music (a wet night's rain 0.015 RMS, the shore's
  water about 0.011, crickets 0.005 with peaks near the music's). It follows the **Sounds**
  switch, not Music. **Footsteps** (`FOOTSTEPS`, a left and a right per ground: grass, path,
  boards, ice, floor, from `groundOf` on the tile under her) fall on her walk cycle every 280 ms
  of walking (`Footfalls`, as E1's dust does), cues on the effects bus. **The UI tick** is one
  delegated listener (`tickOnPress` in `hud/dom.ts`) on the HUD's root, so every `<button>`,
  `button()`'s or not, ticks once as it's clicked, a disabled one never, a held − or + once, not
  each step. A new `brush` wave (noise through a band at the note's pitch, its width `q`) makes
  the footsteps, the tick and the crickets. **Rejected:** daytime birdsong (not in the brief, and
  it would sound the same every morning); ambience on the music's switch (she may want the town
  without its tunes, and the ambience is the town); reading the ambience every step (a `Date` and
  a scan of tiles 120 times a second for something that changes a few times a minute); a tick in
  `button()` only (two buttons in three are made another way).
- **A question lifts** (`voiceOf`, `asks`): a line ending in "?" (whatever quotes or faces follow
  it) rises a tone and then a fourth on its last two blips and holds the last a touch longer. A
  word is hashed without the stop or question after it, so "tonight?" and "tonight" are the same
  blip and only the lift tells them apart.
