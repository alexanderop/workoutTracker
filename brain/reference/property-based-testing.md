---
type: Reference
title: Property-Based Testing with fast-check
description: How the fast-check property suites are structured, the shared arbitraries, and the lossy-domain gotchas discovered while writing them.
resource: brain/reference/property-based-testing.md
tags: [brain, reference, testing, fast-check, property-based]
timestamp: 2026-07-12T20:40:00Z
---

## Property-Based Testing with fast-check

fast-check (`catalog:testing`) drives generative tests in Vitest browser mode.
Suites are named `*.property.spec.ts` and live next to the example-based specs.

### Shared arbitraries

`src/__tests__/factories/arbitraries.ts` holds one generator set for the block
discriminated union, deliberately constrained to the bounds of the export
validation schemas (`src/features/settings/utils/validation`) so the same
arbitraries feed:

- `src/__tests__/db/converters.property.spec.ts` — workoutToDb/dbToWorkout
- `src/__tests__/features/settings/exportDataSchema.property.spec.ts` — Zod pipeline
- `src/__tests__/lib/workoutBlockFactory.property.spec.ts` — template instantiation

Further suites use module-local generators (their domains don't overlap the
block union):

- `src/__tests__/lib/fractionalIndexing.property.spec.ts` — ordering, n-key
  generation, model-based random insertion; keys are grown from the module
  itself (order keys have a strict format, so arbitrary strings won't do)
- `src/__tests__/lib/plateCalculation.property.spec.ts` — constructive
  achievability proves the greedy algorithm complete for both plate sets
- `src/__tests__/lib/structureHash.property.spec.ts` — hash invariance under
  storage-order permutation, order-preserving orderKey relabeling, and image
  changes (never assert "different structure → different hash": djb2 collides)
- `src/__tests__/lib/workoutBlockList.property.spec.ts` — selection tracked by
  block *identity* (id), not index arithmetic, plus a model-based op-sequence
  test against a naive `{ids, selectedId}` model
- `src/__tests__/features/progressions/progressionLogic.property.spec.ts` —
  full-run simulation: exactly `calculateTotalSessions` steps for dividing
  increments; termination + clamped progress for non-dividing ones
- `src/__tests__/features/benchmarks/benchmarkStats.property.spec.ts` —
  splitComparison sign consistency, attemptStats field preservation
- `src/__tests__/features/weight/lib/weightCalculations.property.spec.ts` —
  isOutlier thresholds on a 0.1 kg grid, `fc.pre` skipping exact boundaries
- `src/__tests__/composables/timers/emomMath.property.spec.ts` — pure EMOM
  math, extracted from `useEmomTimer` into
  `src/composables/timers/emomMath.ts` to make it property-testable

`normalizedWorkoutArb` generates workouts already in the *fixed-point domain*
of the converters (block/set ids = array position + 1, selectedBlockIndex in
bounds, builder mode when empty). The converters are a **normalizing**
round-trip, not identity — test `fromDb(toDb(x))` against the normalized
input, and test idempotence for arbitrary DB records.

### Lossy domains: constrain generators, document the loss

Markdown export/import is deliberately lossy. The property suite
(`markdownRoundtrip.property.spec.ts`) generates only the *lossless input
domain* and documents every excluded edge in its header comment. When a
round-trip target is lossy, don't fight it with tolerant assertions — shrink
the generator domain and write the exclusions down.

### Gotchas discovered while building the generators

1. **`splitTimes` failed export validation (confirmed bug, fixed).**
   `DbForTimeResult.splitTimes` exists in `src/db/schema.ts` and is copied by
   the converters, but `databaseForTimeResultSchema` in
   `src/features/settings/utils/validation/blockSchemas.ts` was `.strict()`
   without allowing it — a completed ForTime benchmark with split times made
   the app's own export fail its own import validation (same incident class
   as the seeded-exercise-enum drift noted in `primitiveSchemas.ts`). Fixed
   by adding `splitTimes` to the schema as an optional (no `.default()`,
   absent-preserving) array of non-int numbers; `forTimeResultArb` now
   generates it (sometimes omitting the key entirely) and a regression test
   lives in `validation.spec.ts`. The whole incident class is now also
   guarded at compile time: every schema in `blockSchemas.ts` is wrapped in
   `schemaFor<DbType>()(...)`, which makes a key-set mismatch between a
   `.strict()` schema and its Db type a `tsc` error instead of a runtime
   import failure. New `.strict()` schemas elsewhere should use the same
   pattern.
2. **Markdown: empty `rir` dropped the whole set row (confirmed bug, fixed).**
   `formatSetRow` wrote `set.rir ?? '-'`, but `''` is not nullish, so the
   cell rendered empty; `parseSetRow` filtered falsy cells, saw fewer than 4,
   and returned null — the set silently disappeared on import. Fixed on both
   sides: export uses `set.rir || '-'`, and `parseSetRow` is now
   position-preserving (strips only the outer pipes) so legacy markdown with
   an empty cell still parses. Both markdown util files are in
   `src/features/workout/utils/`; regression tests are in the
   markdownImport/markdownRoundtrip specs.
3. **`calculateProgress` could exceed 100% (confirmed bug, fixed).**
   `recordSession` (`src/db/implementations/dexie/progressions.ts:99`)
   increments `sessionsCompleted` even for *failed* sessions, so with default
   settings any user who logs failures pushes `sessionsCompleted` past
   `calculateTotalSessions` — the UI showed >100%. Fixed with a `Math.min(100,
   …)` clamp in `progressionLogic.ts:96` (property + example regression tests
   pin it). Open product question: progress measures sessions *attempted*, not
   levels achieved, so it can read 100% mid-plan — the clamp only hides the
   symptom. Also latent: `repIncrement: 0` (not UI-reachable) would loop
   `calculateNextLevel` forever.
4. **`attemptStats.isFaster` is dead code.** pbTime is the minimum of all
   completion times, so `completionTime < pbTime` is false for every attempt.
   Pinned (not fixed) by a property in `benchmarkStats.property.spec.ts`.
5. **EMOM countdown never shows 0.** `secondsRemainingInMinute` returns 60 at
   exact minute boundaries (display counts 60→1, not 59→0) — correct for the
   minute just starting; pinned as intended in `emomMath.property.spec.ts`.
6. **Set `duration` Zod default breaks strict identity.**
   `databaseSetSchema.duration` is `.optional().default('')` — parsing adds
   the field to old records, so parse(x) ≠ x for pre-isometric data. That's
   intended backward compat; the property test pins it down.
7. **Float noise in exported distances.** Distances export at 0.1 km
   precision and `parseFloat(km) * 1000` reintroduces float error
   (5.3 → 5300.000000000001). Compare after `Math.round`.

### Conventions

- Keep array sizes small (`maxLength` 3–5); default 100 runs per property is
  fast (<100ms per suite) even in browser mode.
- Hooks in this repo block `else` and type assertions in new code — use early
  returns and `Extract<Union, { kind: ... }>` helper params for narrowing.
- eslint `unicorn/max-nested-calls` (max 3) forces nested `fc.record`/
  `fc.option` compositions to be extracted into named module-scope consts —
  which is also more readable.
- fast-check v4: `fc.stringOf` is gone; use
  `fc.string({ unit: fc.constantFrom(...chars) })` or `fc.stringMatching`.
- Custom eslint rule `local/no-let-in-describe` forbids `let` inside describe
  blocks — model-based/stateful properties must hold mutable state in a
  `const` object built by a helper (or move loops to module-scope functions).
- Never use `Math.random`/`Date.now` to drive test data — derive all
  randomness from fc-generated integer sequences so failures shrink and
  reproduce.
