# Handoff: picking up version 0 cold

Written 2026-09-26 at the end of phase 0. Keep it current as phases land, and delete it when v0
ships.

## Where things stand

Phase 0 is done. The repo builds, lints, typechecks, tests and smoke-checks. The page draws a
pixel-scaled checkerboard under the title, and it installs as a home-screen app with a pumpkin
icon. Nothing is playable yet. **Next is phase 1** (`docs/v0_plan.md`).

## Starting cold

1. Read `CLAUDE.md`, then the status line and your phase in `docs/v0_plan.md`, then
   `docs/decisions.md` (short, and it holds every fork already argued).
2. `git log --oneline -20` to see what actually landed.
3. Branch before the first commit. One PR per phase, merged with a merge commit.
4. Before pushing: `npm run lint && npm run format:check && npm run typecheck && npm run test &&
npm run build`, then `npm run dev` in one shell and `npm run smoke` in another.
5. As part of the phase's own PR: update the plan's status line, append any real forks to
   `decisions.md`, and correct this file.
6. If a phase touches something the MMO already solved (saves, the HUD overlay, the harness,
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

- The answers in `docs/personal_touches.md`: pets, their villager, inside jokes, her name, the
  currency.

## Settled since

- **v0 is a surprise** (decision 14): don't put questions to her, and don't let anything reach her
  before the handover.
- **Vercel is connected:** merges to `main` deploy, and PRs get preview URLs.
