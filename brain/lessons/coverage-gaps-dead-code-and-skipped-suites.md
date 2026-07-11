---
type: Lesson
title: Coverage gaps are often dead code or browser-skipped suites
description: Before writing tests for uncovered lines, check for callers and describe.skipIf — much of this repo's uncovered code is unreachable from the UI.
resource: brain/lessons/coverage-gaps-dead-code-and-skipped-suites.md
tags: [lesson, testing, coverage, dead-code, vitest-browser]
timestamp: 2026-07-09T21:00:00Z
---

## Coverage Gaps Are Often Dead Code or Browser-Skipped Suites

Learned 2026-07-09 while raising line coverage 84.9% → 88.1% with user-flow
integration tests.

### Check reachability before testing an uncovered function

A large share of uncovered lines had **no caller anywhere in `src/`** and
cannot be covered by honest user-flow tests. Grep for callers first. Dead code
found (still present, candidates for deletion):

- `src/features/workout/components/` — `WorkoutSetTable(Row).vue`,
  `WorkoutTimedBlockCard.vue`, `WorkoutHeader.vue`,
  `WorkoutPreviousHistory.vue` (~134 lines, 0% coverage, only import each other)
- `usePastWorkout.ts` — `updateStrengthSets`, `updateSet`, `addSetToBlock`,
  `removeSetFromBlock` (lines ~209–282)
- `dexie/settings.ts` — repo `get`/`getAll`/`reset`/`resetAll` (app only uses
  `set` + `observeAll`)
- `dexie/exerciseProgress.ts` — `getPerformedExercises`
- `dexie/templates.ts` — `rename`
- `stores/exercises.ts` — `deleteExercise`, `getAllExercises`
- `useBenchmarkMode.ts` — `advanceToNextBlock`/`goToPreviousBlock` (block
  advancement actually goes through `useBenchmarkExerciseNavigation`)
- `useBenchmarkForm.ts` — `reorderRounds`, the `saveToRepo` update branch
- `markdownImport.ts` parse functions — no UI feature imports them
- `webVitals.ts`, `main.ts` — untestable entry code

### describe.skipIf(isBrowserMode) hides whole features from coverage

`data-management.spec.ts` skips its Import/Export block in browser mode (it
stubs `window.location.reload`, read-only in real browsers), and the default
project IS browser mode — so the export/import UI had ~0% coverage despite
"existing tests". Browser-compatible replacements live in
`settings-export-import-browser.spec.ts`: spy on `URL.createObjectURL` to
capture the exported Blob, drive the hidden file input with `DataTransfer` +
a bubbling `change` event, and stop before the final import confirm (which
calls `location.reload()`).

### Other browser-mode testing gotchas

- Concurrent `vitest --coverage` runs clobber each other's `coverage/.tmp`;
  give each run `--coverage.reportsDirectory=<unique dir>`.
- `NumericInputModalPO.waitForClose()` asserts NO dialog exists — it fails
  when the keypad modal sits on top of another dialog (e.g. ConfigureCardio).
  Assert on the updated trigger-button value instead.
- `CommonPO.getDialogButton()` grabs the first `role=dialog`; with stacked
  dialogs use `page.getByRole('button', { name, exact: true })`.
- No fake timers in browser mode: shrink real durations via repository updates
  (see `progression-session-flows.spec.ts`, 2-second sessions).

### Production bugs found by these tests (unfixed as of 2026-07-09)

- **Standalone EMOM/Tabata "Log Workout" silently fails**: deep `ref` result
  arrays become reactive proxies; `useTimerWorkoutLogger` shallow-copies them
  into Dexie `add()` → `DataCloneError` swallowed by `tryCatch`. Fix: spread
  nested arrays (`[...result.missedMinutes]`) like `db/converters.ts` does.
- **ActiveProgressionView error state**: `totalSeconds === 0` makes
  `isTimerComplete` true, so a "Session Complete" dialog covers the error
  screen and its overlay blocks the back button.
- **Benchmark runs never auto-save mid-run**: benchmark persistence never
  calls `markInitialized()`, so a restart loses progress (regular workouts
  don't have this gap).
