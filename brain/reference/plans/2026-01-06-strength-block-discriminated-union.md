---
type: Reference
title: "Plan: Refactor Strength Block Targets to Discriminated Union"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/plans/2026-01-06-strength-block-discriminated-union.md
tags: [reference, plans]
timestamp: 2026-06-28T08:10:00Z
---
## Plan: Refactor Strength Block Targets to Discriminated Union

> **Status:** Planned (not yet implemented)
> **Created:** 2026-01-06

## Goal

Replace separate `targetReps`, `targetDuration`, `targetWeight` fields with a discriminated union that makes invalid states unrepresentable at the type level.

## Problem

Currently, strength blocks have:

```typescript
targetReps: number
targetDuration: number | null // for isometric exercises
targetWeight: number | null // for weighted holds
```

This allows invalid states where both `targetReps > 0` AND `targetDuration > 0`.

## New Type Structure

```typescript
type StrengthBlockTarget =
  | { kind: 'reps'; targetReps: number }
  | { kind: 'isometric'; targetDuration: number; targetWeight: number | null }
```

**Key decisions:**

- Nested `target` object (matches existing `config` pattern on other blocks)
- `targetWeight` only exists in `isometric` variant (only used for weighted holds)
- Backward-compatible converters normalize old data automatically

---

## Implementation Phases

### Phase 1: Type Foundation (5 files)

| File                                                           | Change                                                                                                                           |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `src/db/schema.ts`                                             | Add `DbStrengthBlockTarget` union, update `DbStrengthBlock` and `DbTemplateStrengthBlock` to use `target: DbStrengthBlockTarget` |
| `src/types/blocks.ts`                                          | Add `StrengthBlockTarget`, update `StrengthBlock`                                                                                |
| `src/features/settings/utils/validation/blockConfigSchemas.ts` | Add `strengthBlockTargetSchema` using `z.discriminatedUnion()`                                                                   |
| `src/features/settings/utils/validation/blockSchemas.ts`       | Update to use new target schema                                                                                                  |
| `src/features/settings/utils/validation/templateSchema.ts`     | Update to use new target schema                                                                                                  |

### Phase 2: Data Layer (1 file)

| File                   | Change                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/db/converters.ts` | Add `normalizeStrengthTarget()` for backward compat, update `strengthBlockToDatabase` and `databaseToStrengthBlock` |

### Phase 3: Business Logic (3 files)

| File                                                          | Change                                          |
| ------------------------------------------------------------- | ----------------------------------------------- |
| `src/features/workout/composables/useWorkout.ts`              | Update `addExercise()`, `updateStrengthBlock()` |
| `src/features/log-past-workout/composables/usePastWorkout.ts` | Update block creation functions                 |
| `src/features/templates/lib/templateBlock.ts`                 | Update `createTemplateStrengthBlock()`          |

### Phase 4: Import/Export (2 files)

| File                                           | Change                         |
| ---------------------------------------------- | ------------------------------ |
| `src/features/workout/utils/markdownExport.ts` | Export target based on kind    |
| `src/features/workout/utils/markdownImport.ts` | Parse into discriminated union |

### Phase 5: UI Components (7 files)

| File                                                                     | Change                                                     |
| ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `src/features/workout/components/WorkoutEditExerciseDialog.vue`          | Update `ExerciseEditData` type, form state, and save logic |
| `src/features/workout/components/WorkoutDetailExerciseCard.vue`          | Update target display logic                                |
| `src/features/workout/components/WorkoutActiveStrengthView.vue`          | Update target access                                       |
| `src/features/templates/components/TemplateBlockItem.vue`                | Update template display                                    |
| `src/features/log-past-workout/components/LogPastWorkoutBuilderStep.vue` | Update block creation                                      |
| `src/features/workout/components/WorkoutHeader.vue`                      | Update header display                                      |
| `src/views/ActiveWorkout.vue`                                            | Update `selectedExerciseData` computation                  |

### Phase 6: Static Data (1 file)

| File                           | Change                                                                    |
| ------------------------------ | ------------------------------------------------------------------------- |
| `src/data/popularTemplates.ts` | Update all 30+ templates to use `target: { kind: 'reps', targetReps: N }` |

### Phase 7: Test Factories (6 files)

| File                                            | Change                                                |
| ----------------------------------------------- | ----------------------------------------------------- |
| `src/__tests__/factories/block.factory.ts`      | Update defaults, add `createIsometricStrengthBlock()` |
| `src/__tests__/factories/dbBlock.factory.ts`    | Update DB block defaults                              |
| `src/__tests__/factories/dbExercise.factory.ts` | Update exercise defaults                              |
| `src/__tests__/factories/template.factory.ts`   | Update template defaults                              |
| `src/__tests__/factories/exercise.factory.ts`   | Update exercise factory                               |
| `src/__tests__/factories/timedBlock.factory.ts` | Update if needed                                      |

### Phase 8: Tests

Update integration tests that reference `targetReps`/`targetDuration` directly.

---

## Backward Compatibility

```typescript
// In converters.ts
function normalizeStrengthTarget(block: LegacyOrNewBlock): DbStrengthBlockTarget {
  // New format - pass through
  if (block.target) return block.target

  // Old format - convert
  if (block.targetDuration != null && block.targetDuration > 0) {
    return {
      kind: 'isometric',
      targetDuration: block.targetDuration,
      targetWeight: block.targetWeight ?? null,
    }
  }
  return { kind: 'reps', targetReps: block.targetReps ?? 0 }
}
```

No database migration needed - converters handle normalization on read.

---

## Zod Schema

```typescript
export const strengthBlockTargetSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('reps'),
      targetReps: z.number().int().min(0).max(1000),
    })
    .strict(),
  z
    .object({
      kind: z.literal('isometric'),
      targetDuration: z.number().int().min(1).max(3600),
      targetWeight: z.number().min(0).max(1000).nullable(),
    })
    .strict(),
])
```

---

## Estimated Scope

- **32 files** to modify
- **No database migration** (converter handles it)
- **Type-safe** at compile time
- **TypeScript strict mode** will surface any missed updates
