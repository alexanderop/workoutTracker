# QA: Habits DI template and test tiers - 2026-07-25

## Verdict: SHIP

## Route

**Frontend.** The plan's one remaining Manual Verification item is explicitly a
browser claim — "the habits page loads, a habit can be created, toggled
complete, and the state survives a reload — the inverted provider seam is wired
correctly in the real app, which no unit spec proves." The DI seam itself
(`makeRuntime` → `appLayers` → `provideRuntime` → `useHabits`) has no separate
network or CLI contract; its only observable surface is the running app. All
nine automated checks were already green on this tree and are recorded as
supporting evidence in Observations, not as the verdict.

Environment: `pnpm dev` (Vite 8.0.16) on `http://localhost:5173`,
`agent-browser` session `afk-qa`, viewport 390x844 (mobile-first, the app's real
usage context). Branch `feat/habits-di-template` @ `abb93827`, clean tree.

## TC-01: Habits page loads through the injected runtime - PASS

Steps:

1. `agent-browser open http://localhost:5173/habits`
2. Dismissed the first-run onboarding tour via "Skip to App" (lands on `/`)
3. Clicked the bottom-nav "Habits" entry point

Expected: `/habits` renders its empty state with no runtime service-resolution
failure. `useHabits` now resolves `HabitRepository`, `Clock`, and `IdGen` from
`useRuntimeContext()` rather than `services.live`, so a mis-ordered
`appLayers` array or a missing `provideRuntime` would surface here as a
`Service not found` throw or a blank screen.

Actual: `window.location.href === "http://localhost:5173/habits"`. Snapshot
showed `heading "Habits" [level=1]`, `button "Add Habit"`, and
`button "Add your first habit"`. `agent-browser errors` empty; no `[error]`
console lines — only `[info] [WebVitals]` and `[debug] [vite]`.

Evidence: `qa/evidence/habits-di-template/01-habits-empty.png`,
`qa/evidence/habits-di-template/09-mobile-habits.png`

## TC-02: A habit can be created, and the id comes from IdGen - PASS

Steps:

1. From the habits empty state, clicked "Add your first habit"
2. Filled `textbox "Name"` with `QA Morning Stretch`, picked the 🏃 icon
3. Clicked "Save"

Expected: the habit is persisted and appears in today's list. Per the plan's
Contracts, ids now come from the `IdGen` reference and time from `Clock` — the
direct `@/db/generateId` import was removed — so a broken reference resolution
would produce a missing/`undefined` id rather than a valid record.

Actual: the list rendered `button "Mark QA Morning Stretch complete"`.
Reading IndexedDB directly confirmed the write landed through the injected
Dexie provider:

```json
{"id":"d79d9899-0169-4f5f-b7dc-16be9bb79b65","name":"QA Morning Stretch",
 "icon":"🏃","accent":"purple","schedule":{"type":"daily"},
 "kind":{"type":"binary"},"autoLink":null,"archivedAt":null,
 "orderIndex":0,"createdAt":1785014261233}
```

The id is a well-formed UUID (`IdGen`) and `createdAt` a plausible now
(`Clock`), not a placeholder or `undefined`.

Evidence: `qa/evidence/habits-di-template/02-create-form-filled.png`,
`qa/evidence/habits-di-template/03-habit-created.png`

## TC-03: Toggling complete writes an entry, and it survives a reload - PASS

Steps:

1. Clicked `button "Mark QA Morning Stretch complete"`
2. Observed the accessible name flip
3. `location.reload()`, then waited for `networkidle` and the habit's text

Expected: the entry persists across a full page load — a new `makeRuntime`
build, a fresh `RepositoriesLive` acquire, and a re-read.

Actual: after the toggle the control read
`button "Mark QA Morning Stretch incomplete"` and IndexedDB held

```json
{"id":"65a786dc-…","habitId":"d79d9899-…","date":1784930400000,"value":1,
 "recordedAt":1785014266113}
```

After reload the page returned to `http://localhost:5173/habits` and still read
`button "Mark QA Morning Stretch incomplete"`. No console errors.

Evidence: `qa/evidence/habits-di-template/04-habit-completed.png`,
`qa/evidence/habits-di-template/05-after-reload.png`

## TC-04: Untoggle round-trips, from a second component instance - PASS

Steps:

1. Navigated Home; the `HabitsHomeCard` (`data-testid=habits-home-card`) is a
   second, independent `useHabits()` consumer resolving through the same runtime
2. Scrolled the row toggle into view, clicked
   `button[aria-label^='Mark']`
3. Reloaded, then used the card's "View all habits" button to reach `/habits`

Expected: the Home card reflects the state written from the Habits page, the
untoggle deletes the entry, and both views agree after a reload.

Actual: before the untoggle the Home card showed
`image "QA Morning Stretch: 1 completed days in the last 7 days"` and
`button "Mark QA Morning Stretch incomplete"` — i.e. the state written on
`/habits` was visible from a different component. After the untoggle the label
flipped to `button "Mark QA Morning Stretch complete"`, the streak image read
`0 completed days in the last 7 days`, and `habitEntries` was `[]`. After
reload, still `complete`/`0 days`. Navigating to `/habits` showed
`button "Mark QA Morning Stretch complete"` — consistent across views.

Re-toggling complete on `/habits` and then hard-loading
`http://localhost:5173/habits` (deep link, not an in-app route change) showed
`button "Mark QA Morning Stretch incomplete"` and a fresh entry
`{"id":"3d82c677-16db-41a9-a2ff-ff63f009369e", …,"value":1}` — a second
distinct `IdGen` UUID, confirming id generation is not memoized to a constant.

Evidence: `qa/evidence/habits-di-template/06-home-today-habits.png`,
`qa/evidence/habits-di-template/07-untoggle-after-reload.png`,
`qa/evidence/habits-di-template/08-deeplink-reload-complete.png`

## TC-05: The deprecated shim and the runtime resolve the same store - PASS

This is the risk the plan's own Decisions call out and that neither the unit
tier nor the Gherkin e2e covers: `getRepositoryProvider()` is retained as a
deprecated shim for 92 call sites, and `src/db/provider.ts` will *lazily
construct its own* Dexie provider (`currentProvider ??=
createDexieRepositoryProvider()`) if anything calls it before `main.ts` runs
`setRepositoryProvider(runtime.get(Repositories))`. `useWorkoutPersistence.ts:126`
is a live shim caller — `autoLinkWorkoutCompletion(getHabitsRepository(), …)` —
while the habits UI reads through the runtime. If the two paths diverged, a
workout-linked habit would be written by one and invisible to the other.

Steps:

1. Created a second habit `QA AutoLink Habit` with the "Auto-complete when I
   finish a workout" switch on; confirmed
   `{"n":"QA AutoLink Habit","autoLink":"completed-workout"}` in IndexedDB
2. Home → "Start New Workout" → "Add First Block" → picked
   *Assisted Pull-up Machine* → "Start Workout"
3. Filled set 1 (40 kg × 8), marked it complete
4. "Workout options" → "End Workout" → "Finish Workout"
5. Hard-loaded `http://localhost:5173/habits`

Expected: the auto-link write performed through the shim is visible to the
runtime-backed habits UI.

Actual: immediately after finishing, `habitEntries` contained
`[{"habit":"QA Morning Stretch","value":1},{"habit":"QA AutoLink Habit","value":1}]`
— the shim wrote into the same store. The freshly loaded `/habits` page then
rendered `button "Mark QA AutoLink Habit incomplete"`. Both paths agree. No
console errors during workout creation, completion, or the auto-link.

Evidence: `qa/evidence/habits-di-template/10-autolink-crosspath.png`

## Observations

- **No product defects found.** Two apparent failures during the run were
  harness artifacts, not bugs, and are recorded so the report reproduces
  honestly: `agent-browser click` reports `✓ Done` but silently no-ops when the
  target is outside the viewport. At the default desktop viewport the Home
  card's buttons sat at `y≈1304` with `innerHeight` 633, and the habit form's
  auto-link switch at `y=625` with the dialog extending past the fold. Both
  worked on the first try after `agent-browser scrollintoview` and after
  switching to a 390x844 mobile viewport. Any future QA of this app should set
  the mobile viewport first and scroll before clicking.
- The first `agent-browser open` timed out because Vite was re-optimizing
  dependencies (`Re-optimizing dependencies because lockfile has changed`); the
  immediate retry succeeded. First-load WebVitals were correspondingly `poor`
  (FCP 24.9s, LCP 31.6s); every subsequent load was `good` (FCP 148–412ms, LCP
  404–496ms). Cold-start dev-server noise, not a product signal.
- A first-run onboarding tour intercepts `/habits` on a fresh profile and must
  be dismissed ("Skip to App") before the habits flow is reachable. Expected
  behavior, noted because it lands the user on `/`, not back on `/habits`.
- Console was clean for the entire session: `agent-browser errors` returned
  nothing, and no `[error]` or `[warning]` console lines were emitted across
  ~8 page loads covering habits, home, and the workout flow.
- QA data (`QA Morning Stretch`, `QA AutoLink Habit`, and their entries) was
  cleared from IndexedDB and the browser session closed; the dev server was
  stopped.
- Supporting automated evidence, already green on this tree and not re-run
  here: `pnpm type-check`; `pnpm test:unit` (165); `pnpm knip`;
  `pnpm lint:check`; `pnpm test:arch` (82); `CI=1 pnpm test` (1289 passed /
  173 files); `pnpm test:e2e` (8 passed); `wc -l src/lib/di/*.ts` = 276/280;
  `pnpm size-limit` 441.27/442 kB.
- `test/e2e/features/habits.feature` already encodes creation, check/uncheck,
  and survive-a-reload as Gherkin scenarios, so TC-01 through TC-04 are now
  regression-protected. TC-05's cross-path (shim ↔ runtime) case is **not**
  covered by any tier and was only proven manually here — worth a scenario when
  the follow-on migrates the 92 remaining `get*Repository()` call sites, since
  that is exactly when the two paths could drift.

## Intent check

The plan's stated intent for this manual item is narrow and was met: the
inverted provider seam is wired correctly in the real running app. Beyond the
literal steps, the seam holds across a second component instance (TC-04), a
deep-link cold load (TC-04), and the deprecated shim path that the plan
deliberately kept alive (TC-05). Nothing observed contradicts the template's
copyability claim, and no functional defect was found.

Manual Verification item 1 is discharged. Item 2 was verified directly and is
already recorded as checked in `brain/plans/habits-di-template.md`.
