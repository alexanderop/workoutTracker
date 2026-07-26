# QA: progressions DI conversion + test-tier inversion - 2026-07-26

## Verdict: SHIP WITH CAVEATS

Every acceptance criterion in `brain/plans/progressions-di.md` is met with
direct evidence, including the two the handoff listed as unverifiable:
`pnpm test:coverage` **did** complete (174/174 files, thresholds passed) and the
manual browser walk **was** performed — against the production build under
`vite preview` rather than `pnpm dev`, which is stricter than the plan asked
for (see TC-05). The single caveat is documentation, not code — see
Observation 1.

## Route

**Hybrid.** The change is developer-facing (repository injection + test-tier
moves) and claims to be behaviour-preserving in the UI, so it needs both:

- a **contract/structural** pass against the plan's `## Acceptance` bar (the
  four-edit measurement, the browser-capability comments, no lost assertions,
  coverage), and
- a **frontend** pass proving the user-visible progressions flow still works
  end to end, because "behaviour-preserving" is a claim, not evidence.

`agent-browser` is not installed in this environment (`agent-browser: command
not found`), so the browser pass was driven with the repo's own Playwright
(chromium 1.61.1, present at `/opt/pw-browsers`) against the **production
build** served by `vite preview` — closer to shipping than `pnpm dev`, and it
made the plan's Manual Verification box executable rather than skipped.

Branch under test: `claude/di-pattern-unit-tests-jlcgja`, 8 commits vs
`origin/main`.

---

## TC-01: The four-edit bar (Acceptance #1) - PASS

Steps:

1. `git show --stat 35f68ab` (Wave 1, the tracer-bullet commit that takes the
   measurement).
2. `git diff --stat origin/main..HEAD` for the whole-branch blast radius.
3. Grep the full-branch diff for the prohibited paths: `src/lib/di/`,
   `src/db/provider.ts`, `src/main.ts`,
   `src/__tests__/helpers/createTestApp.ts`.

Expected: exactly `services.ts`, `services.live.ts`, the composable's
signature, one line in `src/appLayers.ts`, one line in
`src/__tests__/types/appLayers.test-d.ts` — plus this slice's own fake and
spec. No edit to any of the four prohibited paths.

Actual: Wave 1 touched exactly seven files and nothing else:

```
src/__tests__/fakes/progressionsRepository.ts      | 168 +
src/__tests__/types/appLayers.test-d.ts            |   4 +-
src/__tests__/unit/progressions/useProgressions.spec.ts | 141 +
src/appLayers.ts                                   |   2 +
src/features/progressions/composables/useProgressions.ts | 16 +-
src/features/progressions/services.live.ts         |  26 +
src/features/progressions/services.ts              |  15 +
```

`src/appLayers.ts` gained one import + one array entry, positioned after
`RepositoriesLive` as the ordering contract requires.
`types/appLayers.test-d.ts` gained one `expectTypeOf` line. Across all 8
commits, none of `src/lib/di/`, `src/db/provider.ts`, `src/main.ts`, or
`src/__tests__/helpers/createTestApp.ts` is touched.

The template is copyable as written. The only deviation is the one the plan
predicted in Contracts (*The fifth file*): the bar is really **four production
edits plus the pinned call site**. See Observations for why that finding did
not actually land anywhere durable.

Evidence: `qa/evidence/progressions-di/` (commit stats reproducible via the
commands above).

---

## TC-02: Every surviving browser spec names its capability (Acceptance #2) - PASS

Steps:

1. Count the surviving browser tests:
   `grep -c "  it(" src/__tests__/integration/progression-{management,session-flows}.spec.ts`
2. Read each `it(` and check the preceding line(s) for a `// Browser: …`
   comment naming a real capability.
3. Compare against `origin/main`'s counts for the same two files.

Expected: 16 surviving browser tests, each with a one-line comment naming the
browser capability it genuinely needs.

Actual: 9 + 7 = **16 tests, 16 `// Browser:` comments**, no exceptions. Spot
check of the justifications — all name something a Node spec cannot do:

- "the starting-weight control is a reka-ui `Select`, which opens its listbox
  on real pointer events"
- "a real 2s EMOM runs to completion, raising the real dialog"
- "back-navigation out of a *running* timer, twice"
- "asserts the timer control is absent from the DOM, a negative"
- "a real confirm dialog (open, confirm, close) followed by router navigation"

`origin/main` had 12 + 7 = 19 in these files; the 3 that left are the
repository-only advancement loops (TC-03). This matches the plan's recorded
"browser tests 19 -> 16" exactly.

---

## TC-03: No behavioural coverage lost in the move (Acceptance #3) - PASS

Steps:

1. Diff `src/__tests__/integration/progression-management.spec.ts` against
   `origin/main` and enumerate every deleted assertion.
2. Locate each deleted assertion in its Node replacement.
3. Confirm the relocated property spec moved verbatim.
4. Count tests per tier before and after.

Expected: every demoted test's assertions survive; assertion count does not go
down, only the tier.

Actual: the three deleted tests
(`advances from reps to time phase`, `advances to next kettlebell after
completing all phases`, `marks progression as complete after finishing all
kettlebells`) map 1:1 onto
`src/__tests__/unit/progressions/progressionAdvancement.spec.ts`, which keeps
the same expectations (`currentReps` 20 / `currentMinutes` 10 -> 12,
`currentWeightIndex` 1 with a reset level, `sessionsCompleted` 11,
`isComplete` true) and adds four cases that never existed (failed session does
not move the level, no advancement past completion, one session row per
attempt, level stamped at performance time).

`progressionLogic.property.spec.ts` shows `| 0` in `git diff --stat` — a pure
rename, zero content change, all 4 property cases intact.

The feature also gains its **first** Dexie adapter certification,
`src/__tests__/db/progressions.spec.ts` (9 tests): documented `create`
defaults, `getAll` ordering, `update` rejecting an unknown id, `recordSession`
committing the session row and parent update together, `getSessionHistory`
newest-first, and `delete` leaving no orphaned sessions.

Tier movement measured, not claimed:

| Tier | main | branch |
|---|---|---|
| Node `unit` (progressions) | 0 | **54** (`--project=unit src/__tests__/unit/progressions`) |
| Browser integration | 19 | **16** |
| Browser db adapter | 0 | **9** |
| e2e scenarios | 0 | **1** |

Evidence: `qa/evidence/progressions-di/test-unit.txt`,
`qa/evidence/progressions-di/browser-progressions.txt`.

---

## TC-04: Automated verification box - PASS (mobile-webkit e2e project blocked)

Steps: ran every command in the plan's `## Test Scope`, capturing stdout.

| Command | Result | Evidence |
|---|---|---|
| `pnpm type-check` | EXIT=0 | `type-check.txt` |
| `pnpm lint:check` | EXIT=0 | `lint.txt` |
| `pnpm knip` | EXIT=0 (1 pre-existing config hint) | `knip.txt` |
| `pnpm test:unit` | 23 files / **223 passed** | `test-unit.txt` |
| `pnpm test:arch` | 4 files / **82 passed** | `test-arch.txt` |
| `--project=default` progression-management + session-flows + db/progressions | 3 files / **25 passed** | `browser-progressions.txt` |
| `--project=default` data-export-import-roundtrip + db/dataManagement | 2 files / **10 passed** | `browser-consumers.txt` |
| `--project=default` habit-tracking (appLayers canary) | 1 file / **23 passed** | `browser-habits-canary.txt` |
| `pnpm build-only` | EXIT=0 | `build.txt` |
| e2e (`bddgen && playwright test --project=bdd --project=chromium`) | **7 passed** | `e2e-chromium.txt` |
| `pnpm test:coverage` | 174 files / **1307 passed**, thresholds green — see TC-06 | `coverage.txt` |

The appLayers canary matters most: a mis-ordered or malformed layer breaks
runtime construction for *every* `createTestApp` spec, and habits is green.

`--project=mobile-webkit-critical` could not run — WebKit is not installed at
`/opt/pw-browsers` (chromium only). It is grepped to onboarding + workout
persistence, neither of which this branch touches, and CI runs it on the PR.

---

## TC-05: The full user flow in a real browser (the plan's Manual Verification) - PASS

This is the walk the plan asks for, executed rather than skipped. Driven with
Playwright chromium at a 390x844 mobile viewport against `vite preview`
(production build) on `http://127.0.0.1:5679`, with `page.clock` installed so
the 10-minute EMOM runs in bounded time. Script:
`qa/evidence/progressions-di/manual-walk.mjs.txt`.

Steps and results (each line is a real DOM assertion, not a screenshot glance):

1. Skip onboarding -> lands on `/`. **PASS**
2. Bottom nav -> Workouts -> Progressions tab -> empty state "No progressions
   yet". **PASS**
3. Create Progression -> fill name "QA Swing Ladder", select 16kg and 20kg ->
   Save -> routes to `/progressions/<uuid>`. **PASS**
4. Detail shows starting level `16kg • 10 reps • 10 min` and
   `0 sessions completed`. **PASS**
5. Start Session -> `/progressions/<uuid>/session`, ready screen shows
   "10 minute EMOM". **PASS**
6. Tap to start -> "Minute 1 of 10". **PASS**
7. `clock.runFor(4min)` -> "Minute 5 of 10". **PASS**
8. `clock.runFor(5min)` -> "Last minute!" with "Minute 10 of 10" and a
   counting-down `0:59`. **PASS**
9. `clock.runFor(1min)` -> "Session Complete" dialog raised automatically at
   10:00. **PASS**
10. "Yes, completed!" -> routes back to detail; **level advanced** to
    `16kg • 12 reps • 10 min`, `1 sessions completed`, and Session History
    shows `16kg × 10 reps × 10 min` badged **Completed** (stamped at the level
    performed, not the level advanced to). **PASS**
11. **Reload** -> advanced level and session count survive. **PASS**
12. Back to list -> card accessible name is
    `QA Swing Ladder - 16kg, 12 reps, 10 min EMOM`. **PASS**
13. Delete -> confirm dialog -> back to list -> **reload** -> "No progressions
    yet". **PASS**

Actual console state: `console errors: []`, `page errors: []` — zero uncaught
exceptions, zero `[error]` console lines across the entire walk.

Evidence: `qa/evidence/progressions-di/manual-walk.txt` (transcript) and 13
screenshots in `qa/evidence/progressions-di/manual-walk/`, including
`07-session-last-minute.png` (timer legible at 8xl, last-minute cue in
primary colour) and `09-detail-after-session.png` (advanced level, 5% progress
bar, history row).

Nothing on screen changed versus the pre-conversion behaviour described in the
plan: the conversion is behaviour-preserving as claimed.

---

## TC-06: Coverage thresholds (Acceptance #4) - PASS

Steps:

1. `CI=1 pnpm test:coverage` — hung, then crashed twice
   (`[vitest] Browser connection was closed while running tests`,
   `ENOSPC: no space left on device`) at 24/174 files.
2. Diagnosed: `vitest.config.ts` sets
   `browser.trace.mode: 'retain-on-failure'` with
   `tracesDir: '.vitest/traces'`. A local full browser-tier run writes **~29 GB**
   of Playwright traces and fills the disk; a run that is then killed leaves
   them behind, so the next run starts closer to full. This — not the change
   under test — is what made coverage "never complete" in this environment.
3. `rm -rf .vitest`, then
   `CI=1 pnpm exec vitest run --project=default --coverage --browser.trace.mode=off`.
   Trace recording has no effect on coverage instrumentation.

Expected: thresholds still pass after the tier moves — lines 82 / functions 80 /
branches 69 / statements 80 (`coverage-thresholds.json`).

Actual: the run completed, **EXIT=0**, thresholds enforced and passed with
headroom on all four:

```
 Test Files  174 passed (174)
      Tests  1307 passed | 17 skipped (1324)
=============================== Coverage summary ===============================
Statements   : 86.27% ( 9644/11178 )   threshold 80   +6.27
Branches     : 77.67% ( 4516/5814 )    threshold 69   +8.67
Functions    : 86.60% ( 3414/3942 )    threshold 80   +6.60
Lines        : 87.78% ( 8925/10167 )   threshold 82   +5.78
================================================================================
   Duration  697.97s
```

Zero `ERROR:` lines. This is stronger than the plan asked for: it is the
**entire `default` browser tier green on this branch** (174/174 files), not just
the scoped specs — so the tier moves cost no coverage, and the change breaks
nothing elsewhere in the tier either.

Note the plan's contract was to measure "before pruning any UI test". Wave 5
pruned nothing (every one of the 16 UI specs named a real capability and
stayed), so before and after are the same measurement.

Evidence: `qa/evidence/progressions-di/coverage.txt`

---

## Observations

Environmental, not product defects:

- **`agent-browser` is not installed** (`command not found`). Frontend QA was
  done with the repo's own Playwright instead — arguably stronger here, since
  it ran against the production build rather than the dev server.
- **WebKit is absent** from `/opt/pw-browsers` (chromium + headless shell
  only), so `--project=mobile-webkit-critical` cannot run locally. Its grep
  targets onboarding and workout persistence; neither is touched by this
  branch.
- **`[WakeLock]` warnings flood every browser-tier run**
  (`NotAllowedError: Wake Lock permission request denied`,
  `Video fallback play failed`). Pre-existing headless-environment noise,
  unrelated to this change.
- **A local full browser-tier run writes ~29 GB to `.vitest/traces` and can
  fill the disk.** `vitest.config.ts` uses
  `trace: { mode: 'retain-on-failure', tracesDir: '.vitest/traces' }`;
  `retain-on-failure` still *records* every test before discarding, and a run
  that is interrupted never discards. This is what made `pnpm test:coverage`
  appear to hang/crash here, and it is pre-existing config untouched by this
  branch (CI does not hit it because each shard gets a fresh runner). Workaround
  for anyone running the tier locally: `rm -rf .vitest` first, or append
  `--browser.trace.mode=off`.
- **Two transient failures were investigated and dismissed**, both
  infrastructure:
  `src/__tests__/browser/drag-reorder.spec.ts` failed with
  `Failed to import test file src/__tests__/setup.ts` — a stale Vite
  dep-optimizer cache after the killed coverage run; passes 3/3 after
  `rm -rf node_modules/.vite`
  (`qa/evidence/progressions-di/drag-reorder-isolated.txt`). And the coverage
  crash above. Neither touches progressions and both are gone in the clean
  174/174 run.
- The QA walk script is kept as `manual-walk.mjs.txt` rather than `.mjs`
  deliberately: as a `.mjs` inside the repo it is picked up by `oxlint` and
  fails `pnpm lint:check` on `no-console`. Run it with
  `node <path>` after copying to a `.mjs` outside the repo (its `playwright`
  import is already absolute).

Findings worth carrying, none blocking:

1. **The plan's own "four edits" correction has nowhere durable to live.**
   The plan records "*Four edits* should read *four production edits plus the
   pinned call site*" and calls it "worth an ADR wording correction". But
   `brain/plans/` is gitignored (`.gitignore:83`), and
   `brain/decisions/004-db-in-di.md` is **unchanged on this branch** — its
   acceptance bar still reads "…and one line in `src/appLayers.ts`", with no
   mention of the pinned call site. The third conversion will re-measure
   against wording this pass already proved wrong. This is the one caveat on
   the verdict: it is a one-line ADR edit, not a code change.
   ADR 004's *Limits* also says "Revisit [the arch test] once a second feature
   has actually been converted and there is a real second data point" — that
   data point now exists and the revisit is likewise unrecorded outside the
   gitignored plan.
2. **Two files outside any slice's declared ownership were added/edited**, both
   in the Wave-6 dedupe commit `3ca9a10` and both benign test scaffolding:
   `src/__tests__/helpers/di.ts` (new shared `contextFor` / `rejects` helpers)
   and `test/e2e/test-utils.ts` + `test/e2e/steps/habits.steps.ts` (extracting
   `skipOnboarding`). Neither is on ADR 004's prohibited list, so the bar in
   TC-01 still holds; noting it only because the plan's file-ownership lists
   did not anticipate them.
3. **`startedAt` was deleted after all.** The plan's Open Non-Blocking Notes
   said removing the write-only `startedAt` from `useProgressionSession` was
   "deliberately kept out of this pass so the four-edit measurement stays
   clean". Commit `3ca9a10` removes it. Since that lands *after* the Wave 1
   measurement, TC-01 is unaffected, and TC-05 confirms the timer still works
   end to end — but the note in the plan is now stale.
4. **Plan Outcome says "e2e scenarios 0 -> 2"; the branch ships 1.**
   `test/e2e/features/progressions.feature` contains a single scenario, with an
   in-file comment explaining the merge ("One scenario, not two…"). The Outcome
   line was not updated to match. Cosmetic, in a gitignored file.
5. **The plan's Open Non-Blocking Note "the play button has no accessible name"
   is inaccurate as written.** `ActiveProgressionView.vue`'s start button carries
   `:aria-label="t('progressions.session.tapToStart')"` and the delete button
   carries `:aria-label="t('progressions.delete.action')"` — both on
   `origin/main`, untouched here. TC-05 drove both by accessible name with no
   CSS-class matching. The real gap is that `ProgressionsPO` matches
   `rounded-full` / `lucide-trash` instead of using the names that already
   exist; that is a page-object cleanup, not an a11y bug, and it does *not*
   block a future timer or deletion e2e as the note claims.
6. **The fake and the Dexie adapter are certified separately, never against
   each other.** `db/progressions.spec.ts` pins the real adapter's contract and
   the unit specs pin the fake's, but nothing fails if the two drift. Correct
   per plan; worth knowing before the fake grows.
7. **`"gitignore": true` in `.markdownlint-cli2.jsonc` is wider than its commit
   subject suggests** ("stop markdownlint from linting gitignored e2e
   artifacts"). It also excludes `brain/plans/**`. Verified safe: gitignored
   files are by definition uncommitted, so no reviewed markdown loses linting,
   and the in-file comment discloses the `brain/plans` effect.
