---
type: Reference
title: "Habit Tracking Model"
description: Data model, invariants, and gotchas for the habits feature (schema v7).
resource: brain/reference/habit-tracking-model.md
tags: [reference, habits, dexie, dst]
timestamp: 2026-07-18T02:00:00Z
---

## Habit Tracking Model

Local-first habit tracking added in Dexie schema **v7** (`habits`,
`habitEntries` tables). Read this before touching anything under
`src/features/habits/`, `src/lib/habits/`, or the habit tables.

## Data Model

- `DbHabit` (`src/db/schema.ts`): `schedule` (`daily` | `weekly{targetDaysPerWeek}`)
  and `kind` (`binary` | `quantity{target, unit}`) are discriminated unions,
  same convention as block kinds. `autoLink: 'completed-workout' | null`.
  Habits are **archived, never deleted** (`archivedAt`), so entry history
  always has a parent.
- `DbHabitEntry`: `date` is a **local start-of-day timestamp**
  (`getStartOfDay` from `src/lib/date.ts`) — one entry per habit per day,
  enforced by `upsertEntry` replacing the same-day entry via the
  `[habitId+date]` compound index. `value` is 1 for binary, the logged amount
  for quantity.
- Streaks/rates are **derived, never stored** — pure functions in
  `src/features/habits/lib/habitStats.ts` (+ `habitGrid.ts` for the
  contribution grid). Composables fetch; lib functions crunch.

## DST Gotcha (twice-bitten in one session)

Never walk day/week sequences with fixed `24h`/`7*24h` millisecond arithmetic
over these local start-of-day keys: Europe/Berlin has 23h/25h days at DST
transitions, so `ts ± DAY_MS` lands 1h off the neighboring day's key and map
lookups silently miss (streaks break, grid cells go empty). Both
`habitStats.ts` and `habitGrid.ts` shipped with this bug independently. Use
date-fns `addDays`/`subDays`/`addWeeks` on `Date` objects and re-normalize
through `startOfDay` after every step. Regression tests pinned to the 2026
transitions (Mar 29 / Oct 25) live in the habitStats/habitGrid specs — they
are honest because browser-mode tests run in the host timezone.

## Auto-Link

`src/lib/habits/autoLinkWorkout.ts` marks active `autoLink:
'completed-workout'` habits when a workout is saved as completed. It lives in
`src/lib` (not the feature) because BOTH `useWorkoutPersistence` (workout
feature) and `useBenchmarkPersistence` (benchmarks feature) call it, and
features may not import each other. Binary habits are idempotent per day;
quantity habits increment per completion. Call sites wrap it in `tryCatch` and
only log on failure — habit bookkeeping must never block workout completion.

## Other Invariants

- No LiveQuery on `HabitRepository` (mirrors `CustomExercisesRepository`):
  composables mutate then patch local refs, so habit changes don't sync
  across tabs the way weight/template changes do. Add `observe*` methods if
  that ever matters.
- Import validation is zod in
  `src/features/settings/utils/validation/habitSchema.ts` (discriminated
  unions rejected on mismatch, not defaulted) — `db/converters.ts` is only
  for workout/exercise/benchmark domain converters.
- Export/import and delete-all in `dataManagement.ts` include both habit
  tables; keep them in sync on any schema change.
- The habits feature has 100% statement/branch/function coverage
  (audited from `coverage-final.json`, 2026-07-18); keep it there when
  extending.
