# Handoff: picking up version 0 cold

Written 2026-09-26, updated at the end of phase 3 for a fresh session. Keep it current as phases land, and delete it
when v0 ships.

## Where things stand

Phases 0–3 are built. The game boots into a first draft of the town: her house and farm plot, the
square and its well, the shop, the Muse Hair Salon, the graveyard garden and the pond. A new game
opens on the character creator, already dressed as her, and waits for her name. After that she
walks wherever you tap. The 👗 button (top right) opens her closet, and walking up to the pink
salon opens the Muse Hair Salon. Her place and her look are saved after each walk and each change,
and whenever the app is hidden or closed. Settings (the gear) holds a backup code to copy and a box
to restore one. **Next is phase 4**: the clock, day and night, gathering, and the bag
(`docs/v0_plan.md`).

**Branches and PRs.** The phases are stacked PRs, which the user merges in order:

| PR  | Branch                                        | Merges into |
| --- | --------------------------------------------- | ----------- |
| #1  | `claude/mobile-new-project-qtn0ee`            | `main`      |
| #2  | `claude/phase-1-town-walk`                    | #1's branch |
| #3  | `claude/phase-2-saves`                        | #2's branch |
| #4  | `claude/handoff-document-continuation-usez8t` | #3's branch |

Phase 3's branch has a session-given name rather than `claude/phase-3-wardrobe`. If GitHub doesn't
retarget a PR to `main` after the one below it merges, merge `origin/main` into the next branch.
Don't rebase. Check which have merged with `git log origin/main` before branching.

**Starting phase 4 in a new session:**

1. Attach `tinyfrancer/mcfrancisville`, and the MMO read-only if its patterns are needed (its
   `src/world/eventBus.ts` is the model for the bag's HUD updates).
2. Branch from `main` if #4 has merged, otherwise from #4's branch, and open its PR against that.
3. Nobody is watching PRs #1–#4. A new session that wants to subscribes to them itself.
4. The personal touches have nothing for phase 4 itself; ask the user for new ones first (Starting
   cold, step 6).

**Her look, for whoever adds clothes next (phase 6 sells them, phase 9 gives them):**

- A new piece is a row in `OUTFITS` (`src/data/outfits.ts`) with a slot, a cut and its fabrics, at
  least one of them a blue; a print or pendant goes in `OUTFIT_ART` (`src/sprites/doll.ts`). A new
  _cut_ is a case in `cutRows`. `tests/sprites/doll.test.ts` draws every piece in every colour,
  facing and frame, so a broken grid fails there.
- Giving her a piece means adding its id to `town.wardrobe.owned` and saving. Nothing adds to it
  yet, so that method doesn't exist: add it with the shop.
- The layer order, and why gauges sit over the hair, is on `dollLayers`.
- Look at new art with `?gallery`, which shows every piece on her from the front and turning.

**Where saves live, and how to add to one:**

- `src/persistence/SaveState.ts` holds the shape and `SAVE_VERSION` (2). `main.ts` builds each
  save from `town.snapshot()` and `town.wardrobe.snapshot()`.
- **Adding a field:**
  1. Add it to `SaveState`.
  2. Bump `SAVE_VERSION`.
  3. Add the N→N+1 step to `migrations.ts`, with a comment on why its default is honest, and its
     data written out rather than imported (see the v1 → v2 step).
  4. Extend `isSaveState`. Check shapes only; repair unknown ids where the data is used, as
     `repairLook` does, rather than setting a whole town aside.
  5. Add a migration test.
- Smoke's `save`, `closet`, `salon` and `settings` sections cover the round trips. Smoke gets
  through the creator in `boot`, because a fresh browser has no save.

## Starting cold

1. Read `CLAUDE.md`, then the status line and your phase in `docs/v0_plan.md`, then
   `docs/decisions.md` (short, and it holds every fork already argued).
2. `git log --oneline -20` to see what actually landed.
3. Branch before the first commit. One PR per phase, merged with a merge commit.
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

- Nothing blocking. These are optional and fleshed out over time: more of her likes and more inside
  jokes.

## Settled since

- **v0 is a surprise** (decision 14): don't put questions to her, and don't let anything reach her
  before the handover.
- **The personal touches are answered** in `docs/personal_touches.md`, and decisions 15–20 say
  how they're used. Read it before any phase that adds content: it names what lands where.
- **Vercel is connected:** merges to `main` deploy, and PRs get preview URLs.
- **Phase 3's forks** are decisions 27–31: painted clothes, the creator for old saves, colours as
  part of what's worn, a creator that opens on her, and gauges and tattoos in the closet.
