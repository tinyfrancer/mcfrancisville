# Decisions

Append at the bottom; never edit an entry except to mark it superseded (and then add the entry that
supersedes it). An entry belongs here when a choice closed off a real alternative: it says what was
chosen, who chose it, what was rejected, and why, so the same argument is not had twice. A choice
with no alternative is not a decision and belongs as a comment beside the code instead.

Entries 1–12 were settled while planning version 0 (`docs/v0_plan.md`), in one conversation on
2026-09-26.

## 1. Pixel art, 2D, top-down

**2026-09-26 · the user · supersedes nothing** · _her size superseded by 32_

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

**2026-09-26 · the user · supersedes the character size in 1**

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
