# UX/UI Review — Hands-On Browser Test (2026-07-04)

> **Status (2026-07-04): all findings fixed** — Criticals #1–#5, Highs #6–#9,
> all Mediums, and all Lows, each with red-green-refactor test coverage.
> Gotchas recorded in [brain/lessons/ux-review-fix-gotchas.md](../../lessons/ux-review-fix-gotchas.md).
> Note: "Progressions" scoping was fixed via copy only (no route rename); the
> `/benchmarks` list page suggestion was resolved via the 404 catch-all.

Four parallel testing agents drove the app end-to-end with `agent-browser` at a 390×844 mobile
viewport against `pnpm dev` (localhost:5173), each in an isolated browser session, covering:
onboarding/navigation, the core workout-logging flow, the content library
(templates/exercises/progressions), and utilities (timers/benchmarks/weight/settings).
Screenshots referenced below live in the session scratchpad under
`scratchpad/{onboard,workout,library,tools}/` (temporary — copy anything worth keeping).

**Headline metric:** logging a repeat set costs **1 tap** (auto-prefill from previous set + big
footer CTA) — best-in-class. The first set of an exercise costs 3 taps + ~4 keystrokes. The core
interaction is fast; the problems are around its edges.

**Overall pattern:** almost every serious issue is a *silent failure* — an interaction that does
nothing, with no toast, no error dialog, and no console output. In a gym, silence reads as
"the app is broken."

---

## Critical (fix first)

### 1. Backup round-trip is broken: the app's own export fails its own import

`/settings` → Export Data → re-import the untouched file → "Import Failed". Root cause (verified
in-browser with `exportDataSchema.safeParse()` on a fresh `exportAll()`): the seeded exercise
library contains `type: "isometric"` (e.g. Side Plank) and `equipment: "battle-rope"` (Battle Rope
Waves), which are missing from the import Zod enums in
`src/features/settings/utils/validation/` (`compound|isolation|stability|cardio` and the 10-item
equipment enum). The validation enums drifted from the seed data. This directly violates the
"Long Now" principle — a user's backup cannot restore.
**Fix:** derive the Zod enums from the same union types the DB schema uses, and add a round-trip
test: `exportAll()` must pass `exportDataSchema.parse()` with the full seed library.
(`tools/import-failed.png`)

### 2. Import error dialog shows a raw i18n key

The failure dialog body literally reads `settings.errors.validationFailed`.
`useDataExportImport.ts:44` does `t('settings.errors.' + result.error)` but `en/settings.ts`
only defines `importFailed`/`exportFailed` — the codes `validationFailed`, `newerVersion`,
`fileTooLarge`, `readFailed`, `invalidJson` from `dataImport.ts` have no translations (en or de).
`parseExportFile` even computes a helpful `details` string ("Invalid data at …") that is never
shown. **Fix:** add locale entries for every error code and surface `details`.

### 3. Resuming a persisted workout breaks set completion

Log a set → reload → "Resume Workout?" → Resume: values restore, but (a) the set's *completed*
status is lost, and (b) "Mark set complete" becomes a no-op — 5 taps across 3 sets produced zero
state change, no rest timer, footer CTA stayed disabled, zero console errors. Only escape was
End Workout (which did save the sets). The rehydrated store is likely missing whatever state the
completion handler checks. **Fix:** persist/restore `completed` per set; add a browser-mode test
for resume → complete set. (`workout/30-persistence-after-reload.png`, `31/32-finish-dialog*.png`)

### 4. Tapping an exercise in the unfiltered "Add to Workout" list silently fails

Reproduced twice in independent sessions: open the add-block sheet, tap "Bench Press" directly in
the full alphabetical list → sheet closes, nothing added, no feedback. Searching first and tapping
the same item works every time. Likely virtualization/scroll/pointer interplay in the long list.
This is the first thing a new user does. **Fix:** debug the tap handler on the long list; add an
"Added X" toast so failures can never be silent. (`workout/04-after-select-exercise.png`)

### 5. Dirty forms discard changes on back navigation with no warning (systemic)

On `/templates/:id`, adding a block flips the UI into a dirty state (Save/Cancel appear, Delete
disables — good), but tapping the header back arrow silently discards the change. Identical
behavior on `/exercises/:id/edit` (renamed exercise reverted). **Fix:** route-guard on dirty
state → confirm-discard dialog, covering header back, hardware back, and route changes.
(`library/05-after-add-block-dirty-state.png`, `06-goku-reverted-to-6-blocks.png`)

---

## High

### 6. First-set completion is unreliable (blur-commit swallows the tap)

With 60kg/10 visibly entered, the row checkmark didn't register on 3 attempts and the footer CTA
stayed disabled; it only worked after entering RIR and re-blurring. Values commit on blur, and a
tap landing while an input is focused gets swallowed. **Fix:** commit on input (or on the
completion tap itself); enable the footer CTA as soon as weight+reps are non-zero; first tap
should both blur and complete. (`workout/09–14-*.png`)

### 7. No duplicate-name validation for exercises

Created "Test Curl QA" twice — both saved silently; the library now shows two visually
indistinguishable entries. Exercises are picked by name everywhere. **Fix:** warn or block on
case-insensitive exact match at save. (`library/16-duplicate-exercise-names.png`)

### 8. Rest timer counts up with no target, countdown, or alert

After completing a set, "REST 0:12" counts up indefinitely (observed past 4:00). Glanceable and
`aria-live` — nice — but "tell me when to lift again" is the job. **Fix:** optional rest target
with countdown + vibration/sound (wake-lock territory), tap-to-dismiss.
(`workout/16-rest-timer-ticking.png`)

### 9. Delete/duplicate set hidden behind an undiscoverable 500ms long-press

No visible affordance, no a11y-tree presence (`WorkoutActiveStrengthView.vue:207-266` +
`SetContextMenu.vue`). Screen-reader/keyboard users cannot delete a set at all. **Fix:** per-row
overflow button (also solves a11y), or at least a one-time "long-press a set for options" hint.

---

## Medium

- **`/history` has no UI entry point.** Real route, clean empty state, but nothing links to it —
  "Recent Workouts" header isn't a link and the calendar opens a modal. Only reachable by URL.
  Add a "See all" link that exists even in the empty state. (`onboard/19-history-page.png`)
- **Unmatched routes render a blank page.** `/benchmarks` (a plausible URL — create/detail exist
  under that prefix) and `/timers/emom/custom` render an empty dark page with only the bottom nav.
  Add a catch-all 404 → Home; consider a real `/benchmarks` list page (benchmarks also have no
  nav entry point). (`tools/benchmarks-list.png`)
- **Intermittent blank boot, `#app` empty.** Once, after EMOM completion → Done → `/timers`, Vue
  never mounted; no console output; reload fixed it; not re-reproducible. Add
  `app.config.errorHandler` + a mount guard with recovery UI so this failure mode is at least
  visible. (`tools/timers-blank.png`)
- **Onboarding showed "Welcome back!" after IndexedDB was deleted** — the returning-user variant
  for what should be a first-run. Probably the completion flag lives outside the DB
  (localStorage?), and the test profile carried prior state; but verify that Settings → Delete All
  Data resets the onboarding flag and any non-Dexie persistence too.
  (`onboard/02-welcome-back-fresh-db.png`)
- **Create Exercise: Equipment/Muscle look required but aren't.** Save enables on name alone; the
  resulting exercise has no muscle badge and is invisible to every filter tab. Require them or
  label "(optional)".
- **Exercise names missing from the a11y tree on block cards.** Controls expose only
  "Decrease set count" etc. with no exercise context; wrap blocks in labelled groups or add
  contextual `aria-label`s. (`library/02-template-detail-goku.png`)
- **Timed-block cards hide their contents.** Strength cards show the exercise name; AMRAP/cardio
  cards show only "AMRAP · 12 min · 1 exercise". Show contained exercise names inline.
  (`library/12-saved-template-detail.png`)

## Low

- Tabata sub-label stays "Work" during the REST phase while the badge says REST. (`tools/tabata-rest.png`)
- Benchmark concept is never explained on the create screen; one sentence of helper copy would do.
- Weight page: history/chart pushed below the fold by the entry form; 500 kg accepted without a
  soft-confirm (outlier check vs. last entry would catch fat-fingers); single-entry trend shows
  "80" without a unit.
- All routes share `document.title` "Workout Tracker" — add per-route titles via router meta.
- History detail reads "3 sets × 999.0 kg" when sets were 80/80/999 — say "top set 999 kg".
- Weight/reps clamp silently at 999; a brief flash would communicate the clamp.
- Row checkmarks look enabled on empty sets but do nothing; footer CTA correctly disables —
  make the two affordances consistent.
- No way to reorder exercises in the workout queue drawer (remove + jump exist).
- "Progressions" is actually kettlebell-EMOM-only — rename or add scoping copy; its empty-state
  copy hardcodes "kettlebell swing".
- Consistency nits: Home empty state has an icon, others don't; Home week-strip starts Monday but
  the month calendar starts Sunday; `/exercises` search placeholder clips without an ellipsis at
  390px; three different block-icon treatments (initials circle / plain swatch / emoji square);
  Create Exercise has two controls opening the same image picker.

---

## What works well (keep and protect)

- **1-tap repeat sets** — prefill + big footer CTA. The most important interaction is genuinely fast.
- **Mid-workout ergonomics**: `inputmode="decimal"`, 44px+ targets, tabular numerals, `aria-current`
  on the active set, `aria-live` rest timer; bottom-nav targets are 78×70px.
- **Timer glanceability is excellent** in both themes — giant mono digits, ring progress,
  color-coded WORK/REST; smart presets; completion screen offers "Log Workout" (great local-first touch).
- **Benchmark active flow is genuinely motivating** ("First attempt – set your PB!", tap-to-advance,
  trophy finish).
- **Finish/summary flow**: auto-named workout, confetti, count-up stats, Save as Template.
- **Onboarding content** is concrete and on-brand; skippable in one tap.
- **Destructive-action safety**: red danger zone, confirm dialogs everywhere they matter, delete
  disabled while a form is dirty.
- **Export format is trustworthy**: versioned, timestamped, human-readable JSON; import is atomic
  and hardened (size limit, prototype-pollution) — once the enum drift is fixed.
- **Wake-lock diagnostics panel** in Settings is exceptional mid-workout reliability UX.
- **Quality baseline**: zero JS errors across all four sessions; Web Vitals all "good"
  (FCP ~208ms, LCP ~360–430ms); dark/light both fully styled with no contrast failures found.

## Recommended attack order

1. Export/import round-trip + error-message i18n (#1, #2) — data trust, likely a small fix + test.
2. Resume-workout completion bug (#3) — core-flow reliability.
3. Silent add-exercise failure (#2 in gym-impact terms) + blur-commit tap swallowing (#4, #6).
4. Dirty-form back-navigation guard (#5) — one reusable guard fixes it everywhere.
5. Rest-timer countdown target (#8) — the biggest pure-UX win in the core loop.
6. Sweep the mediums (404 catch-all, history entry point, a11y labels) as a batch.

## Test residue & caveats

- Testing left residue in the *agent-browser* profile storage (not your daily browser): two
  "Test Curl QA" exercises, a QA template, a test progression, a 500 kg weight entry, and a
  "Test Murph Lite" benchmark + completed workout.
- Headless Chrome doesn't report as a touch device, so the inline NumberField path was exercised;
  real phones get `NumericInputModal`, so first-set tap counts may differ slightly.
- The "Welcome back!" finding may partly be a test-profile artifact (sessions shared prior
  storage), but the underlying question — where the onboarding flag lives and whether Delete All
  Data clears it — is worth verifying regardless.
