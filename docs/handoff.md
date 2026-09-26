# Handoff: picking up version 0 cold

Written 2026-09-26, updated at the end of phase 4 for a fresh session. Keep it current as phases
land, and delete it when v0 ships.

## Where things stand

Phases 0–4 are built. The game boots into a first draft of the town: her house and farm plot, the
square and its well, the shop, the Muse Hair Salon, the graveyard garden and the pond. A new game
opens on the character creator, already dressed as her, and waits for her name. After that she
walks wherever you tap. The town follows the phone's clock: dawn, day, a golden hour, dusk and a
lavender-blue night, with lanterns, windows and jack-o'-lanterns lit after dark. Tapping a tree
shakes loose wood, a rock gives stone, and walking onto a patch of flowers picks them, all once a
day until 5am. After 8pm a snack waits somewhere in town. Everything goes in the bag (🎒), which
starts with five Purse butter. The 👗 button opens her closet, and walking up to the pink salon
opens the Muse Hair Salon. Settings (the gear) holds the backup code. Everything is saved as she
goes. **Next is phase 5**: farming (`docs/v0_plan.md`).

**Branches and PRs.** PRs #1–#5 (phases 0–4) are merged into `main`, with merge commits. The user
wants each phase's PR merged as soon as its CI is green, so the next phase branches from `main`.

**Starting phase 5 in a new session:**

1. Attach `tinyfrancer/mcfrancisville`.
2. Branch from `main`, open the phase's PR against `main`, and merge it (merge commit) once CI
   is green.
3. Ask the user for phase 5's personal touches first, if the last session didn't (see "Still to
   put to the user").
4. Farming builds on phase 4's pieces: growth is derived from a planted-at timestamp and the day
   key (`src/systems/clock.ts`), harvests go into `town.bag` and come out of `update()` as
   `gathered` moments that `src/hud/messages.ts` turns into toasts, and a crop that is ready is a
   `Giver`-like drawable in `TownView` (see how rocks and patches swap sprites with `isReady`).
   The farm plot is the fenced square north of her house.

**How the town is lit, for whoever adds something that glows:**

- A prop's `glow` in `PROP_ART` is a palette of just its lit keys in their lit colours, and its
  `lights` are pools of lamplight in its own pixels. Its day palette should show those keys unlit.
- The night is a light map multiplied over the frame (`src/render/lighting.ts`), then glows are
  drawn back over it through a layer that whatever is in front rubs out (`drawLight` in
  `TownView`). Nothing else in the renderer needs to know it is night.
- Review the light with `?hour=21.5` (any hour). In production it changes only the light; in a dev
  build it moves the town's clock too, which is how smoke finds the snack (decision 34).

**Her look, for whoever adds clothes next (phase 6 sells them, phase 9 gives them):**

- She is 16×32 (decision 32): head rows 0–10, shoulders at 11, hem at 19, waist at 20, legs 21–31.
  The row constants the cuts are measured against are at the top of the cut code in
  `src/sprites/doll.ts`.
- A new piece is a row in `OUTFITS` (`src/data/outfits.ts`) with a slot, a cut and its fabrics, at
  least one of them a blue; a print or pendant goes in `OUTFIT_ART` (`src/sprites/doll.ts`). A new
  _cut_ is a case in `cutRows`. `tests/sprites/doll.test.ts` draws every piece in every colour,
  facing and frame, so a broken grid fails there.
- Giving her a piece means adding its id to `town.wardrobe.owned` and saving. Nothing adds to it
  yet, so that method doesn't exist: add it with the shop.
- The layer order, and why gauges sit over the hair, is on `dollLayers`.
- Look at new art with `?gallery`, which shows every piece on her from the front and turning.
  Villagers and pets are drawn to her scale.

**Where saves live, and how to add to one:**

- `src/persistence/SaveState.ts` holds the shape and `SAVE_VERSION` (3). `main.ts` builds each
  save from `town.snapshot()`, `town.wardrobe.snapshot()` and `town.finds()` (the bag, and what
  was taken today).
- **Adding a field:**
  1. Add it to `SaveState`.
  2. Bump `SAVE_VERSION`.
  3. Add the N→N+1 step to `migrations.ts`, with a comment on why its default is honest, and its
     data written out rather than imported (see the v1 → v2 step).
  4. Extend `isSaveState`. Check shapes only; repair unknown ids where the data is used, as
     `repairLook` does, rather than setting a whole town aside.
  5. Add a migration test.
- Smoke's `save`, `closet`, `salon`, `gather`, `bag`, `settings` and `night` sections cover the
  round trips. Smoke gets
  through the creator in `boot`, because a fresh browser has no save.

## Starting cold

1. Read `CLAUDE.md`, then the status line and your phase in `docs/v0_plan.md`, then
   `docs/decisions.md` (short, and it holds every fork already argued).
2. `git log --oneline -20` to see what actually landed.
3. Branch before the first commit. One PR per phase, merged with a merge commit as soon as it is
   green.
4. Before pushing: `npm run lint && npm run format:check && npm run typecheck && npm run test &&
npm run build`, then `npm run dev` in one shell and `npm run smoke` in another.
5. As part of the phase's own PR: update the plan's status line, append any real forks to
   `decisions.md`, and correct this file.
6. When the phase is done, ask the user for new personal touches before starting the next one,
   with 2–3 prompts tied to what comes next (see CLAUDE.md, Workflow). Ask them in plain chat:
   the multiple-choice tool loses typed answers on mobile.
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

- Phase 5's personal touches, if the end of phase 4 didn't get answers: the crops and flowers she'd
  love to grow, and anything about a garden of theirs.
- Optional, fleshed out over time: more of her likes and more inside jokes.

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
