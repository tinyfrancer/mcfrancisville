# McFrancisVille: plan for version 0

**Status:** live. Opened 2026-09-26. **Phases 0–5 landed** (bootstrap; the pixel engine and a walk
around town; saves; the character creator and wardrobe; the clock, day and night, gathering and the
bag, with her redrawn at 16×32 and a depth pass on the art; farming at Hosta La Vista Farm).
**Next: phase 6**, Candy and the daily shop. Update this line as each phase lands.

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
| Art                      | Pixel art, 2D, top-down; she stands 16×32                                             | 1, 32    |
| Where the art comes from | Drawn in code, recoloured by palette swap                                             | 2        |
| Spooky                   | Spooky-cute all the time                                                              | 3        |
| Time                     | The real-world clock                                                                  | 4        |
| Phone and saves          | iPhone; a home-screen app, autosave, a backup code                                    | 5        |
| v0 scope                 | Creator and wardrobe, house, farming, villagers, critters, pets, crafting, daily shop | 6        |
| Personal touches         | Real pets, the user as a villager, inside jokes and places                            | 7        |
| Surprise                 | She doesn't see it until v0 is handed over                                            | 14       |
| How her likes are used   | Scattered as things to find, not the theme (details in `personal_touches.md`)         | 15–20    |

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

### Phase 1: The pixel engine and a walk around town (landed)

- the sprite format, the bake cache and `?gallery`
- a tile map from data (`src/data/maps.ts`), with a first, rough town: paths, grass, a pond, the
  player's house plot, the square
- a camera that follows the player, drawn at the pixel scale from phase 0
- the safe areas, and tap to move with A\* (`src/systems/pathfinding.ts`)
- a placeholder player sprite that walks
- the world/render seam: `src/world/Town.ts` with `update(deltaMs)` (the clock arrives in phase 4), a headless
  `tests/world/harness.ts`, and a `?loop=manual` crank plus the `window.world`/`window.view` dev
  handles for smoke

**Why first:** everything after this is content on top of it, and seeing her town on the phone is
the moment the project becomes real.

### Phase 2: Saves you can trust (landed)

- `SaveState` and migrations, and the `saveService` singleton
- autosave on change and on `visibilitychange`/`pagehide`, and `storage.persist()`
- a Settings sheet with the backup code, copied out and pasted back in
- a first-run "Add to Home Screen" hint when it is Safari but not standalone
- the player's position persisting across a reload, with a smoke round trip

**Why second:** every later feature is saved from the day it is born, rather than retrofitted.

### Phase 3: The character creator and wardrobe (landed)

- the layered paper doll: skin tone, hair style and colour, eyes, a starting set of tops, bottoms,
  shoes and a hat
- her look (`personal_touches.md`): split-dye hair through two hair keys, sundresses, glasses,
  gauges, a necklace slot and tattoo sleeves
- the creator runs on first launch, and she types her own name
- a wardrobe in the HUD, where outfits are owned items
- starters in her style: a few band tees (made-up spooky-pun bands, no real logos), jeans, a
  football jersey and a couple of dresses (a Wednesday collar dress among them), with a blue in
  every palette
- the Muse Hair Salon, where hair is restyled after the creator (decision 18); a HUD sheet until
  phase 7 gives it a building

### Phase 4: The clock, day and night, gathering, and the bag (landed)

- the injectable `Clock` and the 5am day key (`src/systems/clock.ts`)
- a day/night tint by local hour, with lanterns and windows that glow after dusk
- trees and rocks that give wood and stone and respawn with the day key
- the bag HUD: generous slots, no weight, stacks
- her touches (`personal_touches.md`, "Her days"): flower patches to pick from, a late-night
  snack to find after dark, and a few "Purse butter" mints already in the bag
- added at the user's ask: her paper doll redrawn at 16×32 (decision 32), and a depth pass on the
  art: soft shadows under everything, scattered grass, worn path edges, pond banks, and lamplight
  (decision 34)

### Phase 5: Farming (landed)

- a plot by the house that she tills and plants: sixteen raised beds, tended from beside them
  (decision 37)
- seeds: pumpkin, ghost pepper, moonflower, candy-corn stalk, bat-wing beans, roses (with a rare
  blue rose, decision 40), and, so flowers lead, skull snapdragons, spider lilies and bat flowers
- growth derived from the planted-at timestamp; watering once a day speeds it up and is never
  required, and nothing withers
- harvesting into the bag, with the seed given back (decision 39)
- her garden (`personal_touches.md`, "Her garden"): flowers get the most variety of any crop; a
  rose bush already growing on the farm, like their real one; hostas along the edge, which she
  can also plant; and a sign at the gate reading **Hosta La Vista Farm**
- growth counts 5am mornings, and each watered day counts one more (decision 38)

### Phase 6: Currency and the daily shop

- the currency, Candy
- a shop whose stock of seeds, clothes and furniture is seeded by the day key: the same all day,
  new tomorrow
- buying and selling
- among the stock: a collectible set of "squishies" (NeeDoh-style squeeze balls and squishy
  dumplings), pizza, and vinyl records of the band puns, some of her likes (decision 15)
- fancy shoes in the clothes stock every day, since she loves shoes (`personal_touches.md`, "The
  shop, and things to come")
- maybe a silly spirit who pops up somewhere different each day (the same section), if it fits
  here rather than phase 9

**Why:** the daily shop is the reason to check in each day.

### Phase 7: Home and decorating

- a home interior scene; the door swaps scenes
- a furniture grid where she places, moves, rotates and puts away pieces
- wallpaper and floors, and a storage chest
- furniture: coffin bookshelf, cauldron, bat lamp, pumpkin chair, spiderweb rug, the mystery
  corkboard with red string (decision 19), a marble-run toy that says "boom tap boom tap boom",
  house plants (a monstera, pothos, snake plant and a potted Venus flytrap), a collection of
  potted succulents (the plants she actually keeps alive, `personal_touches.md`), and a record
  player

### Phase 8: Crafting

- a workbench, with recipes turning wood, stone and crops into furniture
- recipes learned from villagers and bought at the shop
- bracelet-making: friendship bracelets strung from found beads, which villagers love as gifts

### Phase 9: Villagers and friendship

- 5–6 spooky-cute villagers who follow hourly schedules: a ghost librarian, a werewolf florist, a
  mummy baker, a witch, a skeleton gardener, and Cody, a vampire (decision 16). Cody is sarcastic
  but loving, is nicknamed "Pimp Daddy Francis", and loves Chipotle ("chipotle is mah
  liiiiffeee")
- per villager: daily dialogue pools, a talk bonus once a day, gifts with likes and loves, and
  0–10 hearts
- rewards at heart milestones (outfits and furniture) delivered to a mailbox
- small favour requests
- the special days (decision 20): the 04-08 early birthday wish and its correction, the 04-09
  party, and the 06-06 anniversary

### Phase 10: Critters and the collection book

- a net, and 15–20 critters (moths, bats, frogs, orbs, beetles, ghost-fish in the pond), each
  with its own hours of the day; the glowing wisps are called "orbs", with a rare _pair_ of orbs
- a gentle tap to catch, retryable forever
- a "Curiosity Cabinet" book with silhouettes for the ones still missing; each catch is donated,
  kept or sold

### Phase 11: Pets

- their six real pets (decision 17): Florence, Fibi, Dolly and Gary as themselves, and Wybie and
  Elvira as gentle ghost pets, each with the quirk `personal_touches.md` describes
- the active pet follows her and can be named and dressed in accessories; the others live at home

### Phase 12: Personal touches, sound, and the gift wrap

- inside jokes woven into items, dialogue and signs: the "Long neck Yoshi" plushie, and Dolly
  Parton nods (a coat-of-many-colours outfit, butterfly decor) rather than a likeness
- synthesised sound cues and a soft music loop
- the mystery letter from the unseen mayor and its first few clues (decision 19)
- the anniversary orb gift (decision 20)
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
