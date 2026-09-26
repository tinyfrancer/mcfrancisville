# Handoff: picking up version 0 cold

Written 2026-09-26, updated at the end of phase 2 for a fresh session. Keep it current as phases land, and delete it
when v0 ships.

## Where things stand

Phases 0–2 are built, and green on CI. The game boots into a first draft of the town: her house and
farm plot, the square and its well, the shop, the Muse Hair Salon, the graveyard garden and the
pond. A placeholder villager walks wherever you tap. Her place is saved automatically after each
walk, and whenever the app is hidden or closed. Settings (the gear, top right) holds a backup code
to copy and a box to restore one. **Next is phase 3**, the character creator and wardrobe
(`docs/v0_plan.md`).

**Branches and PRs.** The phases are three stacked PRs, which the user merges in order:

| PR  | Branch                             | Merges into |
| --- | ---------------------------------- | ----------- |
| #1  | `claude/mobile-new-project-qtn0ee` | `main`      |
| #2  | `claude/phase-1-town-walk`         | #1's branch |
| #3  | `claude/phase-2-saves`             | #2's branch |

If GitHub doesn't retarget #2 and #3 to `main` after the one below merges, merge `origin/main` into
the next branch. Don't rebase. Check which have merged with `git log origin/main` before branching.

**Starting phase 3 in a new session:**

1. Attach `tinyfrancer/mcfrancisville`, and the MMO read-only if its patterns are needed.
2. Branch `claude/phase-3-wardrobe` from `main` if #3 has merged, otherwise from
   `claude/phase-2-saves`, and open its PR against that.
3. Read the "Her" section of `docs/personal_touches.md` first. All of phase 3's answers are there:
   split-dye hair, sundresses, glasses, gauges, necklaces, tattoos, the band tees and the jerseys.
4. The old session scheduled an hourly check-in on PRs #1–#3, but it fires into the old session,
   not the new one. A new session that wants to watch the open PRs subscribes to them itself.

**Phase 3, already settled:**

- **The paper doll** is drawn in layers, in this order: body, eyes, ears (gauges), tattoos, bottom,
  top or dress, shoes, necklace, hair (keys `h` and `g`), glasses. Each layer is a 16×24 grid per
  facing and frame, like `src/sprites/player.ts`, whose placeholder it replaces.
- **Save v2:** the appearance and the ids of owned outfits go into `SaveState`. The migration step
  from v1 gives an old save the default look.
- **The creator** runs when there's no save, or when the save has no appearance.
- **The Muse Salon** changes her hair after that. It's a HUD sheet until buildings open in phase 7.
- **The wardrobe** lives in the HUD. Clothes are owned items keyed by id unions in
  `src/types/ids.ts`.

**Where saves live, and how to add to one:**

- `src/persistence/SaveState.ts` holds the shape and `SAVE_VERSION`. `main.ts` builds each save
  from `town.snapshot()`.
- **Adding a field:**
  1. Add it to `SaveState`.
  2. Bump `SAVE_VERSION`.
  3. Add the N→N+1 step to `migrations.ts`, with a comment on why its default is honest.
  4. Extend `isSaveState`.
  5. Add a migration test.
- Smoke's `save` and `settings` sections cover the reload and restore round trips.

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

- Nothing blocking. These are optional and fleshed out over time: more of her likes, her football
  team (if any) for the jersey, and more inside jokes.

## Settled since

- **v0 is a surprise** (decision 14): don't put questions to her, and don't let anything reach her
  before the handover.
- **The personal touches are answered** in `docs/personal_touches.md`, and decisions 15–20 say
  how they're used. Read it before any phase that adds content: it names what lands where.
- **Vercel is connected:** merges to `main` deploy, and PRs get preview URLs.
