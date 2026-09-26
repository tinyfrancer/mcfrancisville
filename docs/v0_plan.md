# McFrancisVille: plan for version 0

**Status:** live. Opened 2026-09-26. **Phase 0 landed** (bootstrap). **Next: phase 1**, the pixel
engine and a walk around town. Update this line as each phase lands.

## What this is

McFrancisVille is a cozy phone game made as a gift for the user's wife. She loves Animal Crossing,
Stardew Valley, Dreamlight Valley, Hello Kitty Island Adventure, Tomodachi Life and Pokopia, and is
into spooky-cute things: Beetlejuice, The Nightmare Before Christmas, Wednesday. What she enjoys is
**collecting, making a house her own, and making friends**. The vibe is relaxing: nothing punishes
her, nothing expires, nothing is lost.

Version 0 is the first build she could actually play on her iPhone: small, but complete and
charming. The game will be iterated on well beyond it.

## What the user has settled

| Fork                     | Settled as                                                                            | Decision |
| ------------------------ | ------------------------------------------------------------------------------------- | -------- |
| Art                      | Pixel art, 2D, top-down                                                               | 1        |
| Where the art comes from | Drawn in code, recoloured by palette swap                                             | 2        |
| Spooky                   | Spooky-cute all the time                                                              | 3        |
| Time                     | The real-world clock                                                                  | 4        |
| Phone and saves          | iPhone; a home-screen app, autosave, a backup code                                    | 5        |
| v0 scope                 | Creator and wardrobe, house, farming, villagers, critters, pets, crafting, daily shop | 6        |
| Personal touches         | Real pets, the user as a villager, inside jokes and places                            | 7        |

Claude's calls are decisions 8–13: Canvas 2D with no engine, an engine-free simulation, tap to move
with A\*, the cozy rules, the repo and Vercel, and a network-first service worker.

## Shape of the code

```
src/
  world/        engine-free simulation: town, home, player, villagers, critters, pets; update(deltaMs, now)
  systems/      pure rules: farming, friendship, crafting, shop stock, pathfinding (A*), clock
  data/         rows: items, outfits, furniture, crops, critters, villagers, recipes, pets, maps
  sprites/      pixel-grid sprites + palettes; bake.ts turns them into cached canvases
  render/       Canvas 2D: camera, tile layer, y-sorted sprites, day/night tint, picking
  hud/          HTML overlay (engine-free), talks to the world through an EventBus
  persistence/  SaveState, versioned migrations, localStorage, backup code, storage.persist()
  audio/        synthesised chiptune cues (WebAudio), no audio files
  types/        ids.ts id unions, so a new id is a compile error everywhere it must be answered
```

**Sprites.** A sprite is an array of strings, one character per pixel, plus a palette of semantic
keys (`'.'` transparent, `o` outline, `s` skin, `h` hair, `t` top…). A hair or outfit colour is a
palette swap. `bake(sprite, palette)` draws it once to an offscreen canvas cached by key.

Characters are layered paper dolls (body, eyes, hair, top, bottom, shoes, hat or accessory) facing
four directions with a 2–3 frame walk. A dev-only `?gallery` page shows every baked sprite, so art
can be reviewed on the phone. `scripts/make-icons.mjs` is the same idea in miniature.

**Time.** A `Clock` (`now()`) is injected everywhere, so tests fake it. Growth, respawns, shop
stock and critter hours are derived from stored timestamps and the day key (`YYYY-MM-DD`, rolling
over at 5am local), never ticked while the game is closed.

**Saves.** There is one `SaveState` carrying `version`, with a migration chain from the first day.
A corrupt save counts as no save, and a migrated save is written straight back. The game autosaves
(debounced) on every meaningful change and on `visibilitychange`/`pagehide`. The backup code is the
JSON, deflated with `CompressionStream` and base64'd. It is shared through `navigator.share` or the
clipboard, and imported by pasting it.

## Borrowed from the user's MMO (`tinyfrancer/untitled-boomer-mmo`)

Adapt, don't import. If the MMO isn't in the session, attach it read-only to look.

| What           | Where in the MMO                                                                                                                                                                                     | Status                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Toolchain      | `package.json`, both tsconfigs, eslint, prettier, `vitest.config.ts`, `tests/setup.ts`, CI                                                                                                           | Already copied in phase 0 |
| Persistence    | `src/persistence/`: the `SaveService` interface, the `saveService` singleton, `LocalStorageSaveService`, `migrations.ts` with one test per step                                                      | To borrow                 |
| Seam and tests | `src/world/eventBus.ts`, `worldEvents.ts`, `ZoneWorld.update → WorldEvent[]`, `tests/world/harness.ts` (`tick`/`until` in game ms, a recording bus, an injected rng)                                 | To borrow                 |
| HUD            | `src/hud/styles.ts` (`pointer-events:none` overlay, furniture opts back in), `src/ui/layout.ts` (pure, unit-tested geometry), `src/ui/theme.ts` (`touchMin: 44`), `src/ui/gestures.ts` (tap vs drag) | To borrow                 |
| Audio          | `src/audio/cues.ts` (voice recipes), `SoundBoard.ts` (unlock on first pointer), `settings.ts` (mute per device)                                                                                      | To borrow                 |
| Smoke          | `scripts/smoke.mjs`: `?loop=manual` and `window.view.step()` for deterministic waits                                                                                                                 | To borrow                 |

## The phases

Each phase is one PR and roughly one session. Every phase ends deployed, playable on the phone and
green on CI. Phases 3–11 are independent enough to be re-ordered if she wants something sooner.

### Phase 0: Bootstrap (landed)

- the repo, the toolchain and CI
- the Vercel config, the PWA manifest, generated pumpkin icons, and a network-first service worker
- a pixel-scaled checkerboard
- this plan, `decisions.md`, `handoff.md`, `personal_touches.md` and `CLAUDE.md`

**The user's one-time step:** import the repo in Vercel.

### Phase 1: The pixel engine and a walk around town

- the sprite format, the bake cache and `?gallery`
- a tile map from data (`src/data/maps.ts`), with a first, rough town: paths, grass, a pond, the
  player's house plot, the square
- a camera that follows the player, drawn at the pixel scale from phase 0
- the safe areas, and tap to move with A\* (`src/systems/pathfinding.ts`)
- a placeholder player sprite that walks
- the world/render seam: `src/world/Town.ts` with `update(deltaMs, now)`, a headless
  `tests/world/harness.ts`, and a `?loop=manual` crank plus the `window.world`/`window.view` dev
  handles for smoke

**Why first:** everything after this is content on top of it, and seeing her town on the phone is
the moment the project becomes real.

### Phase 2: Saves you can trust

- `SaveState` and migrations, and the `saveService` singleton
- autosave on change and on `visibilitychange`/`pagehide`, and `storage.persist()`
- a Settings sheet with the backup code, copied out and pasted back in
- a first-run "Add to Home Screen" hint when it is Safari but not standalone
- the player's position persisting across a reload, with a smoke round trip

**Why second:** every later feature is saved from the day it is born, rather than retrofitted.

### Phase 3: The character creator and wardrobe

- the layered paper doll: skin tone, hair style and colour, eyes, a starting set of tops, bottoms,
  shoes and a hat
- the creator runs on first launch and asks her name
- a wardrobe in the HUD, where outfits are owned items
- spooky-cute starters: a striped witch stocking, a Wednesday collar dress, a pumpkin beanie

### Phase 4: The clock, day and night, gathering, and the bag

- the injectable `Clock` and the 5am day key (`src/systems/clock.ts`)
- a day/night tint by local hour, with lanterns and windows that glow after dusk
- trees and rocks that give wood and stone and respawn with the day key
- the bag HUD: generous slots, no weight, stacks

### Phase 5: Farming

- a plot by the house that she tills and plants
- seeds: pumpkin, ghost pepper, moonflower, candy-corn stalk, bat-wing beans
- growth derived from the planted-at timestamp; watering once a day speeds it up and is never
  required, and nothing withers
- harvesting into the bag

### Phase 6: Currency and the daily shop

- a currency, with a placeholder name ("Candy") to confirm with her
- a shop whose stock of seeds, clothes and furniture is seeded by the day key: the same all day,
  new tomorrow
- buying and selling

**Why:** the daily shop is the reason to check in each day.

### Phase 7: Home and decorating

- a home interior scene; the door swaps scenes
- a furniture grid where she places, moves, rotates and puts away pieces
- wallpaper and floors, and a storage chest
- furniture: coffin bookshelf, cauldron, bat lamp, pumpkin chair, spiderweb rug

### Phase 8: Crafting

- a workbench, with recipes turning wood, stone and crops into furniture
- recipes learned from villagers and bought at the shop

### Phase 9: Villagers and friendship

- 5–6 spooky-cute villagers who follow hourly schedules: a ghost librarian, a vampire-bat florist,
  a mummy baker, a witch, a skeleton gardener, and the user's own villager
- per villager: daily dialogue pools, a talk bonus once a day, gifts with likes and loves, and
  0–10 hearts
- rewards at heart milestones (outfits and furniture) delivered to a mailbox
- small favour requests

### Phase 10: Critters and the collection book

- a net, and 15–20 critters (moths, bats, frogs, wisps, beetles, ghost-fish in the pond), each
  with its own hours of the day
- a gentle tap to catch, retryable forever
- a "Curiosity Cabinet" book with silhouettes for the ones still missing; each catch is donated,
  kept or sold

### Phase 11: Pets

- adoptable pets, including their real ones (`personal_touches.md`)
- the active pet follows her and can be named and dressed in accessories; the others live at home

### Phase 12: Personal touches, sound, and the gift wrap

- inside jokes and places woven into item names, dialogue and signs
- synthesised sound cues and a soft music loop
- an onboarding letter from the mayor
- a balance pass
- v0 on her phone

## Verification, every phase

- `npm run lint`, `format:check`, `typecheck`, `test` and `build` in CI, plus `npm run smoke`
  locally (iPhone 13 portrait, touch).
- Rules are tested headlessly in `tests/world/` and `tests/systems/` with a fake clock. For
  example: a crop planted yesterday is ripe today, the shop stock is stable within a day and
  changes at 5am, and a critter spawns only in its hours.
- Saves: every migration has a test, and the backup code round-trips.
- On the phone: open the PR's Vercel preview on an iPhone, add it to the Home Screen, force-quit,
  and reopen.

## What this plan does not do

It has no multiplayer, cloud save, seasons, festivals or fishing (the pond's ghost-fish are
critters), and no monetisation of any kind. All of them are fair game for a version 1.
