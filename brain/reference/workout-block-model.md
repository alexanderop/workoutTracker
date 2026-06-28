---
type: Reference
title: "Workout Block Model"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/workout-block-model.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## Workout Block Model

A workout is a sequence of `WorkoutBlock`s. `WorkoutBlock` is a discriminated union keyed on `kind`. Both bodybuilding and CrossFit-style workouts use the same shape — the `kind` discriminator decides UI, persistence, and result shape.

> Adding a **field** to an existing block? See [TIL: Adding Fields to Block Types](./TIL-adding-fields-to-block-types.md). This doc covers the model itself and adding a brand-new **kind**.

## The Discriminator

```ts
// src/types/blocks.ts:230
export type WorkoutBlock = StrengthBlock | TimedBlock | CardioBlock
// src/types/blocks.ts:228
export type TimedBlock = EmomBlock | AmrapBlock | TabataBlock | ForTimeBlock
```

`Workout.blocks` is `Array<WorkoutBlock>` (`src/types/workout.ts:24`). Always narrow on `block.kind` before touching kind-specific fields — there are no shared fields beyond `kind` and `id`.

## The Six Variants

| `kind`     | Exercises shape                           | Config                                                | Result shape                             | Has sets?                 |
| ---------- | ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------- | ------------------------- |
| `strength` | n/a (uses `sets`)                         | `targetReps`, `targetDuration`, `targetWeight` inline | none — progress lives in `sets[].status` | yes (`Array<WorkoutSet>`) |
| `amrap`    | `exercises: ReadonlyArray<BlockExercise>` | `AmrapConfig`                                         | `AmrapResult \| null`                    | no                        |
| `emom`     | `exercises: ReadonlyArray<BlockExercise>` | `EmomConfig`                                          | `EmomResult \| null`                     | no                        |
| `tabata`   | `exercise: BlockExercise` (single!)       | `TabataConfig`                                        | `TabataResult \| null`                   | no                        |
| `fortime`  | `exercises: ReadonlyArray<BlockExercise>` | `ForTimeConfig`                                       | `ForTimeResult \| null`                  | no                        |
| `cardio`   | none (activity only)                      | `CardioConfig`                                        | `CardioResult \| null`                   | no                        |

Tabata's `exercise` (singular) vs the others' `exercises` (plural) is a recurring footgun — see `getBlockExerciseList` (`src/types/blocks.ts:321`) for the canonical normalizer.

### StrengthBlock (no result object)

```ts
// src/types/blocks.ts:176
export type StrengthBlock = {
  kind: 'strength'
  id: number
  exerciseDefinitionId: string | null
  name: string
  equipment: Equipment
  targetReps: number
  targetDuration: number | null // isometrics
  targetWeight: number | null // weighted holds
  sets: Array<WorkoutSet>
  image: Blob | null
}
```

Strength has no `result` field. "Did the user complete it?" is derived by walking `sets[].status` (`'completed' | 'active' | 'planned'`). All other blocks store a single `result` object that's `null` until completed.

### Result shapes (the #1 footgun)

Every non-strength block has its own `*Result` type. They are not interchangeable:

```ts
// src/types/blocks.ts:104
export type AmrapResult = { rounds; partialReps; actualDuration }
export type EmomResult = { completedMinutes; missedMinutes: ReadonlyArray<number> }
export type TabataResult = { repsPerRound: ReadonlyArray<number> }
export type ForTimeResult = { completionTime; completed; splitTimes? }
export type CardioResult = {
  actualDurationSeconds
  distanceMeters
  avgPaceSecondsPerKm
  calories
  notes
}
```

`TimedBlockResult` is the union of the four timed-block results (`src/types/blocks.ts:137`) — note `CardioResult` is **not** included. There's a Zod-backed runtime guard `isTimedBlockResult` (`src/types/blocks.ts:265`) that uses `TimedBlockResultSchema`.

## Where Blocks Are Created

All creation goes through `appendBlock` in the workout composable, with one factory per kind:

```ts
// src/features/workout/composables/useWorkout.ts (~line 349-374)
// Construction is delegated to src/lib/workoutBlockFactory.ts
function addAmrapBlock(config, exercises) { appendBlock(createAmrapWorkoutBlock(config, exercises, getNextWorkoutBlockId(workout.value.blocks))) }
function addEmomBlock(config, exercises)   { appendBlock(createEmomWorkoutBlock(config, exercises, getNextWorkoutBlockId(workout.value.blocks))) }
function addTabataBlock(config, exercise)  { appendBlock(createTabataWorkoutBlock(config, exercise, getNextWorkoutBlockId(workout.value.blocks))) }
function addForTimeBlock(config, exercises) { appendBlock(createForTimeWorkoutBlock(config, exercises, getNextWorkoutBlockId(workout.value.blocks))) }
function addCardioBlock(config)            { appendBlock(createCardioWorkoutBlock(config, getNextWorkoutBlockId(workout.value.blocks))) }
```

Strength blocks are added by `addExercise()` in the same file (line ~382), which seeds `sets` from history.

Test factories live in `src/__tests__/factories/block.factory.ts` and `timedBlock.factory.ts` (e.g. `createStrengthBlock` at line 17). The corresponding DB-shape factories are in `dbBlock.factory.ts`.

## Where Blocks Are Edited / Rendered

UI dispatches on `block.kind`. Each variant has dedicated components:

- `WorkoutBuilderMode.vue` — switch on `block.kind` to render builder card per variant
- `WorkoutTimedBlockCard.vue` / `TimedBlockCard.vue` — covers AMRAP / EMOM / Tabata / ForTime
- `WorkoutActiveStrengthView.vue` — strength-only active mode
- `WorkoutActiveModeFooter.vue`, `WorkoutQueueItem.vue`, `WorkoutDetailExerciseCard.vue` — all narrow on `kind`
- `WorkoutEditExerciseDialog.vue` — strength edit only

Markdown export/import (`src/features/workout/utils/markdownExport.ts`, `markdownImport.ts`, `markdownSpec.ts`) also switch on `kind` and must be updated for any new kind.

## Persistence (`src/db/converters.ts`)

The DB layer mirrors every variant. The pattern is one `<kind>BlockToDatabase` + one `databaseTo<Kind>Block` per kind, plus matching `<kind>ResultToDatabase` helpers. They're collected into a compile-time-checked registry:

```ts
// src/db/converters.ts:194
type BlockConverterRegistry = {
  [K in WorkoutBlock['kind']]: BlockConverterPair<K>
}
// src/db/converters.ts:374
const BLOCK_CONVERTERS: BlockConverterRegistry = {
  strength: { toDb: strengthBlockToDatabase, fromDb: databaseToStrengthBlock },
  amrap:    { ... }, emom: { ... }, tabata: { ... }, fortime: { ... }, cardio: { ... },
}
```

The actual dispatch is a `switch` in `blockToDatabase` / `databaseToBlock` (`src/db/converters.ts:390`, `:417`). The registry itself isn't called at runtime — it exists so TS errors if you forget a kind. **Both** the registry and the switch must be updated when adding a kind, otherwise narrowing fails on the missing case.

DB schema types (`DbStrengthBlock`, `DbAmrapBlock`, …) live in `src/db/schema.ts`. They match the in-memory shape but with `id: string` and `orderIndex: number` for ordering.

## Adding a Brand-New Block Kind

Cascade order — type-check after each step:

1. **Domain type** — `src/types/blocks.ts`: add `MyBlock`, `MyConfig`, `MyResult`, then add `MyBlock` to the `WorkoutBlock` union (and to `TimedBlock` if it's timed). Add to `BLOCK_LABELS`, `BLOCK_ICONS`, `BLOCK_COLORS`. Update `getBlockName`, `getBlockImage`, and `getBlockDurationDisplay` if relevant. Add to `TimedBlockResult` + `TimedBlockResultSchema` only if the result should pass `isTimedBlockResult`.
2. **Type guards** — add `isMyBlock` if needed; revisit `isTimedBlock` (currently `kind !== 'strength' && kind !== 'cardio'`).
3. **DB schema** — `src/db/schema.ts`: add `DbMyBlock`, `DbMyResult`, add to `DbWorkoutBlock` union.
4. **Converters** — `src/db/converters.ts`: add `myBlockToDatabase` / `databaseToMyBlock` (+ result converters), register in `BLOCK_CONVERTERS`, **and** add a `case 'my'` to both switches in `blockToDatabase` / `databaseToBlock`. Use `?? null` / `?? defaults` for backward compatibility on optional fields.
5. **Zod validation** — `src/features/settings/utils/validation/blockSchemas.ts`, `templateSchema.ts`, and `blockConfigSchemas.ts`: add discriminated-union members so import/export validation accepts the new kind for both completed workouts and templates.
6. **Factories** — `src/__tests__/factories/block.factory.ts`, `timedBlock.factory.ts`, `dbBlock.factory.ts`, `template.factory.ts`: add `createMyBlock` and a DB-shape variant.
7. **Composable** — `src/features/workout/composables/useWorkout.ts`: add `addMyBlock(config, ...)` calling `appendBlock`.
8. **UI** — handle `kind === 'my'` in:
   - `WorkoutBuilderMode.vue`, `WorkoutQueueItem.vue`, `WorkoutActiveModeFooter.vue`
   - `WorkoutDetailExerciseCard.vue`, `WorkoutTimedBlockCard.vue` / `TimedBlockCard.vue`
   - `markdownExport.ts`, `markdownImport.ts`, `markdownSpec.ts`
   - Any `switch (block.kind)` the type-checker flags
9. **Tests** — integration test under `src/__tests__/integration/` covering create → persist → reload → render.

For the lighter case of adding a _field_ to an existing kind, follow [TIL-adding-fields-to-block-types.md](./TIL-adding-fields-to-block-types.md) instead.

## Common Pitfalls

- **Missing `case` in a switch.** TS narrowing keeps switches exhaustive only if every branch returns. The converter switches at `converters.ts:390` / `:417` and the UI switches in builder/queue components all rely on this. Adding a kind without updating every switch silently produces `undefined` returns.
- **Result-shape mixups.** Code that takes a `WorkoutBlock` and reads `block.result` must narrow first — `StrengthBlock` has no `result`, and `AmrapResult.rounds` does not exist on `EmomResult`/`TabataResult`/etc. Use `isTimedBlock(block)` then narrow further on `block.kind`.
- **Duplicated completion rules.** Use `src/lib/workoutBlockStatus.ts` for block completion/progress queries. Strength completion comes from `sets[].status`; timed and cardio completion comes from `result !== null`.
- **Tabata is singular.** `block.exercise`, not `block.exercises`. Iterating with `getBlockExerciseList(block)` (`blocks.ts:321`) avoids the trap.
- **`isTimedBlock` excludes cardio.** Cardio has a `result` but is not a `TimedBlock`, and `CardioResult` is not in `TimedBlockResult`. Don't pass cardio results to `isTimedBlockResult`.
- **Registry vs switch drift.** `BLOCK_CONVERTERS` enforces compile-time exhaustiveness but isn't actually called — the runtime switches are the dispatch. Keep them in sync.
- **Backward compatibility on load.** New optional fields must default with `?? null` in `databaseTo*Block` (see TIL doc), or old DB rows crash on load.
- **`selectedBlockIndex` clamping.** `dbToWorkout` (`converters.ts:471`) clamps the index and resets `mode` to `builder` for empty workouts — preserve this when refactoring.
