# CLAUDE.md

This file gives guidance to Claude Code (claude.ai/code) when working in this repository.

## Project

**McFrancisVille** is a cozy, spooky-cute pixel-art life sim for the phone, made as a gift for the
user's wife. It is Animal Crossing and Stardew Valley by way of The Nightmare Before Christmas: dress
up, decorate a house, farm, befriend monster neighbours, and collect critters, pets, furniture and
clothes. **Cozy and relaxing is the brief**: nothing punishes, expires or is lost (decision 11).

It is a static site (TypeScript + Vite, Canvas 2D, no backend), deployed by Vercel from `main` and
installed on her iPhone as a home-screen app. Saves live in `localStorage`.

**The live plan is `docs/v0_plan.md`.** Its status line says which phase landed and which is next.
**A session starting cold reads `docs/handoff.md` first.** Forks that closed off a real alternative
go in **`docs/decisions.md`**: appended, numbered, never edited. Read it before re-opening a
settled question. `docs/personal_touches.md` holds the real-life details only the user can supply.

## Commands

```bash
npm run dev          # Vite dev server (http://localhost:5173); add `-- --host` to try it on a phone over LAN
npm run build        # production build to dist/ (no typecheck; that is its own step)
npm run preview      # serve the production build (the only way to exercise the service worker)
npm run test         # Vitest, once
npm run coverage     # the same with coverage reported (never gated)
npm run typecheck    # tsc over src/tests and, separately, scripts/
npm run lint         # ESLint
npm run format       # Prettier --write
npm run format:check # what CI runs
npm run icons        # regenerate public/icons/ from the pixel grid in scripts/make-icons.mjs
npm run smoke        # Playwright check on an iPhone-sized touch viewport; needs `npm run dev` running
```

In a Claude Code cloud container, smoke needs `CHROMIUM_PATH=/opt/pw-browsers/chromium`. Never run
`playwright install` there.

CI (`.github/workflows/ci.yml`) runs lint, format, typecheck, coverage and build on Node 22 and 25,
plus browser smoke on PRs. Don't commit on a red suite.

## Workflow

Work happens on a branch and merges through a PR with a merge commit (not a squash), even for a doc
fix. Each phase of the plan is one PR. Keep commits separable when a change has independent parts.
Merging to `main` deploys to her phone, so a merge publishes. The user has asked for
each phase's PR to be merged as soon as it is green (merge commit), rather than left stacked.

**Between phases, ask for personal touches.** When a phase is done and before the next begins, ask
the user whether any new secrets, inside jokes or familiar things have come to mind. Suggest 2–3
specific prompts tied to the phase coming up (before the wardrobe: "a band shirt you'd put in her
closet?"). Record the answers in `docs/personal_touches.md`, under the phase they land in. v0 is a
surprise (decision 14), so the user answers, never her.

**Write the questions down too.** Before the session ends, copy the exact prompts into
`docs/handoff.md` under "Still to put to the user", numbered, and push them. The user often answers
in a later session, and a new session can't see an earlier one's chat, only the repo. A session
that receives numbered answers reads the numbered questions there first, and clears them once the
answers are recorded.

Ask open-ended questions like these **in plain chat**, not through the multiple-choice question
tool. On Claude Code mobile that tool can't take a picked option and typed text together, and its
last question can't be revisited, so typed answers get lost.

## Architecture (the target shape; phases fill it in)

- **Nothing but `src/render/` knows it is drawing.** `world/`, `systems/`, `data/`, `persistence/`,
  `hud/` and `types/` are plain TypeScript, testable with no canvas. The simulation steps in
  `update(deltaMs, now)`. The renderer reads it once a frame. New rules go in the world or a
  system, never in drawing code (decision 9).
- **Two channels out of the world:** an `EventBus` of state the HUD re-renders from, and the list
  of moments `update()` returns (a catch, a harvest, a heart) for the view and the sound.
- **Time is the real clock, injected** (decision 4). Every rule takes `now` from a `Clock`, and
  tests fake it. Anything that happens over time is derived from a stored timestamp and the 5am
  day key when it is read, never ticked while the game is closed.
- **Sprites are pixel grids in TypeScript**, recoloured by palette swap and baked to cached canvases
  (decision 2). No image files, except the generated icons.
- **Pixels are whole device pixels.** `src/render/pixelScale.ts` fits the canvas at an integer scale
  of _device_ pixels. Don't set a CSS size that isn't `fitPixelScale`'s.
- **Data-driven content.** Items, outfits, furniture, crops, critters, villagers, recipes and pets
  are rows in `src/data/`, keyed by id unions in `src/types/ids.ts`. Prefer a row over code.
- **Saves are versioned from the first day** (`src/persistence/`). Import the `saveService`
  singleton, never the class. When `SaveState` changes shape, bump `SAVE_VERSION`, add a step to
  `migrations.ts` with a test, and extend `isSaveState`. A save that can't be read is moved aside
  under `mcfrancisville:save:unreadable:*`, never deleted (decision 25). The backup code runs the
  same migrations, so an old code still restores.
- **The HUD is an HTML overlay** with `pointer-events: none` and furniture opting back in. Its
  controls are at least 44px, and they are kept clear of the notch and home bar with
  `env(safe-area-inset-*)`.

## Where things are

- **Art:** `src/sprites/`. Tiles and props are grids keyed by `TileId`/`PropId`. A new prop is a grid,
  a palette, a `PROP_FOOTPRINT` row and a map legend character. `?gallery` shows every sprite at
  4×, in production too (decision 21).
- **The town:** `src/data/maps.ts`, a picture in characters. A multi-tile prop is a block of its
  letter the size of its footprint. `tests/data/maps.test.ts` holds the edge solid, the spawn at
  her door, and nothing walkable out of reach.
- **Her look:** `src/sprites/doll.ts` draws the paper doll in layers, painting most clothes onto a
  body drawn in region keys (decision 27). The pieces are rows in `src/data/outfits.ts` (a new one
  is a row, plus a print in `OUTFIT_ART` if it has one); the rules for wearing them are
  `src/systems/wardrobe.ts`; `src/world/Wardrobe.ts` holds what she wears and owns. The creator,
  closet and salon sheets are `src/hud/LookSheets.ts`, and reach the game only through `LookApi`.
  She is 16×32 (decision 32).
- **The world:** `src/world/Town.ts` owns the player, her bag and the clock, and steps in
  `update(deltaMs)`; rules read `town.clock`.
  `src/render/TownView.ts` draws it and forwards taps to `tapTile`. A tap on something solid walks
  to the open tile beside it, and its arrival names the prop (`at`), which is how walking up to
  the salon opens it. Arriving is also how she gathers: trees, rocks and flower patches (yields in
  `src/data/gathering.ts`, rules in `src/systems/gathering.ts`), and the night's snack.
- **Light and depth:** `src/render/ground.ts` draws the ground once with its shadows and edges;
  `src/render/lighting.ts` is the time of day, multiplied over each frame. `?hour=21.5` shows
  another hour's light (decision 34).
- **The garden:** Hosta La Vista Farm, beside her house. Beds are `x` in the map (a `bed` tile,
  solid), crops are rows in `src/data/crops.ts`, the growing rules are `src/systems/farming.ts`,
  and `src/world/Farm.ts` holds which beds are tilled and what's in them. `Town.tend` decides what
  a visit to a bed does; the HUD's seed sheet (`src/hud/SeedSheet.ts`) calls `Town.plant`. Crop
  art is `src/sprites/garden.ts`, where a ripe crop is its leaves with the fruit stamped on.
- **The shops:** Cobweb Corner and the Spirit Halloweenie pop-up are rows in `SHOPS`
  (`src/data/shop.ts`), with prices in `ITEM_VALUE`; the day's stock and the pop-up's lot are
  derived from the day key in `src/systems/shop.ts`. `Town` holds her Candy and does the buying
  and selling; `src/hud/ShopSheet.ts` reaches it only through `ShopApi`.
- **The bag:** `src/world/Bag.ts`, with items as rows in `src/data/items.ts` and art in
  `src/sprites/items.ts`. The HUD follows it through `town.events` (an `EventBus`).
- **Dev handles:** under `npm run dev`, `window.world` (the `Town`) and `window.view` (a
  `DebugView`). `?loop=manual` stops the loop so smoke can crank `view.step(ms, frames)`.

## Verifying a change

Game rules belong in vitest (`tests/world/`, `tests/systems/`) with a fake clock. Smoke
(`scripts/smoke.mjs`) covers only what needs a real browser: booting, real touch, layout at phone
size, and the save surviving a reload. For anything visual, look at `.smoke/*.png`, and ideally at
the Vercel preview on a real iPhone.

## Conventions

- Prettier is the source of truth (single quotes, semicolons, trailing commas, 100 columns). Run
  `npm run format` rather than hand-wrapping.
- `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` and `erasableSyntaxOnly` are
  on, so no `enum`s and no parameter properties.
- Comments are sparing and explain a non-obvious _why_, never narrate what the code does.
- Tone in anything she reads (dialogue, item names, UI copy) is warm, gently silly and spooky-cute,
  never scary or snarky.
