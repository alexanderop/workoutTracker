---
type: Reference
title: "TIL: Adding Fields to Block Types (Discriminated Unions)"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/TIL-adding-fields-to-block-types.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## TIL: Adding Fields to Block Types (Discriminated Unions)

When adding new fields to `StrengthBlock` or other block types, the change cascades through many files due to strict typing. Here's the systematic approach:

## Checklist

1. **Write failing test first (TDD)**
   - Integration test in `src/__tests__/integration/`
   - Verifies the UI shows the new field

2. **Update domain type** (`src/types/blocks.ts`)

   ```typescript
   export type StrengthBlock = {
     // existing fields...
     targetDuration: number | null // NEW
     targetWeight: number | null // NEW
   }
   ```

3. **Update database types** (`src/db/schema.ts`)
   - `DbStrengthBlock`
   - `DbWorkoutExercise`
   - `DbTemplateStrengthBlock`

4. **Update converters with backward compatibility** (`src/db/converters.ts`)

   ```typescript
   // Use ?? null for fields that may not exist in old data
   targetDuration: databaseBlock.targetDuration ?? null,
   ```

5. **Update Zod validation schemas** (`src/features/settings/utils/validation/`)
   - `blockConfigSchemas.ts` - shared field definitions

6. **Update all factories** (`src/__tests__/factories/`)
   - `block.factory.ts`
   - `dbBlock.factory.ts`
   - `template.factory.ts`

7. **Update template data** (`src/data/popularTemplates.ts`)

8. **Update all creation points**
   - `useWorkout.ts` - `addExercise()`
   - `usePastWorkout.ts` - block creation
   - Any components that create blocks

9. **Add i18n translations** for labels

## Detecting Exercise Type for Conditional UI

Use the exercises store to check metrics:

```typescript
const exercisesStore = useExercisesStore()

const isDurationBased = computed(() => {
  if (!block.exerciseDefinitionId) return false
  const exercise = exercisesStore.getExerciseById(block.exerciseDefinitionId)
  return exercise?.metrics === 'duration'
})
```

## Key Insight

Run `pnpm type-check` frequently - it will show you all the files that need updating. Fix them systematically until type-check passes.
