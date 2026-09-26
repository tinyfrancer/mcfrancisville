# Decisions

Append at the bottom; never edit an entry except to mark it superseded (and then add the entry that
supersedes it). An entry belongs here when a choice closed off a real alternative: it says what was
chosen, who chose it, what was rejected, and why, so the same argument is not had twice. A choice
with no alternative is not a decision and belongs as a comment beside the code instead.

Entries 1–12 were settled while planning version 0 (`docs/v0_plan.md`), in one conversation on
2026-09-26.

## 1. Pixel art, 2D, top-down

**2026-09-26 · the user · supersedes nothing**

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
