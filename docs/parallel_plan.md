# Finishing 0.2 in parallel: three lanes of Opus 5.5 agents

_Drafted 2026-10-01 and approved by the user the same day (three lanes). It's the plan for running the rest of
`docs/v0.2_plan.md` side by side, the way decision 163's two lanes ran overnight._

## What's left

Ten sessions, from the plan's status line and the handoff's "Next":

| Session | Size | What it is                                                                                      | Changes the save?                                                      |
| ------- | ---- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| U2      | M    | The sheet frame redesigned (tabbed head, a picture, larger type); every sheet moved onto it     | no                                                                     |
| U3      | M    | The neighbours sheet (👥): hearts, loves, gifts by band, birthday, where they are, walk to them | no                                                                     |
| U4      | S    | Settings, the map and the calendar onto the frame                                               | no                                                                     |
| G2      | S    | The piano piece and `plays` on a furniture row; `audio/pianos.ts`                               | no                                                                     |
| L1      | M    | Boothoven: newcomer row, house, lines, favours, rewards, art                                    | yes (a new `VillagerId` in friendships and `Newcomers`; likely a bump) |
| L2      | S    | His lessons: a tune a visit at friend, a duet at close                                          | yes (tunes learnt)                                                     |
| M1      | M    | The Hollow Fairground: a new zone beyond the graveyard, gated on meeting Boothoven              | no (a new `ZoneId` only; the atlas keeps found places by id)           |
| M2      | M    | `ACTIVITIES` rows: ring toss, the fortune tent, a snack stall (corn dogs, fried pickles)        | probably (prizes won, a fortune read today: `Takings` may cover it)    |
| M3      | S    | Market day, the contest, the gatherings and welcomes move to the fairground                     | no                                                                     |
| V1      | S    | Review and release: architecture, perf, art notes, decisions, `NOTES`, the release PR           | no                                                                     |

Hard dependencies (the plan's "Suggested order", checked against the code):

- **U2 → U3 → U4.** U2 changes `openSheet` (`src/hud/dom.ts`), `styles.ts` and every
  `*Sheet.ts`; U3 adds a sheet and a top-bar button in `Hud.ts`; U4 reworks three sheets. Any two
  of them at once is a conflict in every file they share, so they're one lane, in order.
- **L1 → M1 → M2 → M3.** The fairground's gate opens once she has met Boothoven (an `Unlock`
  `{ hearts: 1, with: 'boothoven' }`, so L1's id has to exist); M2's stalls stand in M1's map;
  M3 moves events onto M2's stage and stalls.
- **G2 → L2** (lessons teach the piano tunes), and G2 before L1 is cheaper (L1's third reward is
  the piano recipe, so G2's `piano` piece should exist first).
- **V1 last**, after everything has merged.

Everything else is independent. The UI lane and the content lanes share only the usual hot spots:
`src/wiring/apis.ts`, `src/wiring/moments.ts`, `src/main.ts`, `src/world/build.ts`,
`src/types/ids.ts`, `scripts/smoke.mjs`, `src/data/patchNotes.ts`, and the three docs
(`handoff.md`, `decisions.md`, the plan's status line). Those merge cleanly when each lane adds
lines rather than reshaping, which is how the last two lanes went.

## The lanes

Three lanes rather than two: decision 163 turned down a third only because the user wanted to see
a night of two first, and the fairground is the obvious third. Each lane is a chain of fresh
cloud sessions on **Opus 5.5** (`claude-opus-5-5`), started by one coordinating session when the
one before it in the lane has merged into `v0.2-dev`.

```
Lane A (the UI)        U2 ──────────────► U3 ────────► U4
Lane B (the save)      G2 ∥ L1 ──────────────────► L2 (after both)
Lane C (the place)             (waits on L1) M1 ──► M2 ──► M3
                                                              └──► V1 (one session, after all three)
```

- **Lane A: the UI.** U2, U3, U4. Never touches `SAVE_VERSION`. Owns `src/hud/**`, `styles.ts`,
  smoke's sheet sections. Decisions numbered from **179**.
- **Lane B: the save.** G2 and L1 side by side (they share no files; L1's third reward, the
  piano recipe, waits for L2 if G2 hasn't merged first), then L2. The only lane that touches
  `SAVE_VERSION`, `migrations.ts` and `isSaveState` (as lane 1 did). Owns `villagers.ts`, `newcomers`, `furniture.ts`,
  `audio/pianos.ts`, the newcomer art. G2 takes decision **190** alone; L1 and L2 from **191**.
- **Lane C: the place.** M1, M2, M3, starting as soon as L1 merges (M1 needs only Boothoven's
  id and the `met` unlock; it can begin the map and art while L1 is in review, but not merge
  before it). Owns `maps.ts`, `zones.ts`, a new `src/sprites/fairground.ts`, `activities.ts`,
  `calendar.ts`'s event places. **If M2 needs state the `Takings` keeper can't hold** (ring toss
  prizes won, the fortune read), it bumps the save only after checking lane B's latest version
  on `v0.2-dev`, and says so in its handoff heading, because two sessions bumping to the same
  number is the one conflict that breaks saves. Decisions numbered from **200**.
- **V1** runs alone at the end, on `v0.2-dev` with everything in: the architecture review
  (`build.ts` is 696 lines against "where it hurts" 3's 300, so V1 splits it by area), perf against
  the baseline, the art notes, the `0.2.4` `NOTES` row folded to five lines, and the release PR
  to `main` for the user to merge.

Why these three and not more: a fourth lane (say G2 alone) saves an hour and adds a merge; the
sessions inside each lane really do depend on each other; and the usage limit goes three times as
fast already (decision 163).

## Rules every lane session follows

These go into each session's starting prompt, and the coordinating session writes them under
"In progress" in `docs/handoff.md` before the first lane starts, so a session that starts cold
finds them.

1. Branch from the latest `v0.2-dev` (`git fetch origin v0.2-dev && git checkout -b
claude/<session> origin/v0.2-dev`); the PR targets `v0.2-dev`, is opened as a draft at the
   first push, and is merged by the session itself with a merge commit once green (decision 132).
   Nothing goes to `main`.
2. Before starting: read `CLAUDE.md`, `docs/handoff.md`'s "In progress" (its lane's heading),
   the session's paragraph in `docs/v0.2_plan.md`, its row in "Her touches", and its answers in
   `docs/personal_touches.md`. Personal touches are parked (decision 177): ask no questions, add
   none; pick the warmest default and name it in the decision.
3. The whole suite in the container before every push: lint, format:check, typecheck, test,
   build, and smoke with `CHROMIUM_PATH=/opt/pw-browsers/chromium`. CI runs on the draft too.
4. Commit and push at least every half hour, and update the lane's heading under "In progress"
   with each push (what's done, what's half done and where, the next steps).
5. Decisions in the lane's block (A from 179, B from 190, C from 200), appended, never edited.
   Each lane adds its own line(s) to the `0.2.4` `NOTES` row; V1 folds them to five.
6. Only lane B touches `SAVE_VERSION`; lane C only as above; lane A never.
7. Merge `v0.2-dev` into the branch before marking the PR ready, resolve any conflict in the
   shared files, rerun the suite, then merge.
8. When the session's PR has merged: update the plan's status line, clear its heading under
   "In progress" to "<session> landed (PR #n). Next in this lane: <session>", and stop.

## The coordinating session

One session (this one, or a fresh one) does what decision 163's did:

- Writes the lane headings and rules into `docs/handoff.md` on `v0.2-dev` first (one small PR),
  so every lane session starts from the same page.
- Starts each lane's first session with `create_session` (model `claude-opus-5-5`, the
  repository at `v0.2-dev`, `permission_mode` the same as its own, never `plan`), with a prompt
  naming the session, the lane, its decision block, and the rules above.
- Checks in about every half hour (`send_later`): is the current PR green and merged? If merged,
  start the lane's next session. If a session has gone quiet for over an hour with its handoff
  heading unchanged, read its PR, and start a fresh session on the same branch to resume it (the
  handoff heading is written for exactly that).
- Starts V1 when U4, L2 and M3 have all merged.
- Never merges to `main`; the release is the user's.

A prompt for a lane session (fill the brackets):

> You are session **[U2]** of McFrancisVille's 0.2 plan, in **lane [A]**. Read `CLAUDE.md`,
> then `docs/handoff.md` ("In progress", your lane's heading and the lane rules), then your
> session's paragraph in `docs/v0.2_plan.md` and its row in "Her touches", and its answers in
> `docs/personal_touches.md`. Branch `claude/[u2-sheet-frame]` from `origin/v0.2-dev`. Follow
> the lane rules exactly: decisions from **[179]**, [never touch `SAVE_VERSION`], the whole
> suite including smoke before each push, push and update your handoff heading at least every
> half hour, a draft PR against `v0.2-dev` at the first push, merge it yourself with a merge
> commit once green and CI has passed, then update the plan's status line and your handoff
> heading and stop. Ask the user nothing about personal touches (decision 177).

## Timeline

Going by the last two lanes (a medium session took roughly 2–4 hours wall clock, a small one
1–2), with the three lanes running:

| Hour  | Lane A                                             | Lane B | Lane C  |
| ----- | -------------------------------------------------- | ------ | ------- |
| 0–3   | U2                                                 | G2, L1 | (waits) |
| 3–6   | U3                                                 | L2     | M1      |
| 6–9   | U4                                                 | done   | M2      |
| 9–11  | done                                               |        | M3      |
| 11–13 | V1 (one session), then the release PR for the user |

So about half a day of wall clock against two days of one session after another, at three
times the usage rate. The critical path is lane C (L1 → M1 → M2 → M3 → V1), which is why L1
goes first in lane B rather than after G2 if G2 is slow: if G2 isn't merged in an hour, L1
starts anyway and G2's piece lands as L1's reward afterwards.

## Risks, and what's done about each

- **Two sessions bumping the save to the same number.** Only lane B does, lane C by exception
  after reading `v0.2-dev`'s current number, lane A never.
- **U2 redraws every sheet while U3 adds one.** Sequenced in one lane; U3 builds on U2's frame.
- **Conflicts in the shared docs.** Each lane its own heading and decision block; `decisions.md`
  may then sit out of order, as it already does from 164 to 178.
- **A session cut off mid-way.** The half-hourly push and handoff heading; the coordinator
  resumes it on the same branch.
- **Lane C starting on a Boothoven that changes in review.** M1 depends only on his id and the
  `hearts` unlock; it waits on L1's merge before its own.
- **Usage.** Three lanes draw three times as fast; the user should expect that and can stop any
  lane at its next merge without leaving anything half-built (each session is whole on its own).
