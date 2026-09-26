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
