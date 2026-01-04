# Variable Reps Per Round - Benchmark Feature

## Overview

Enable benchmark workouts where each round can have different rep counts per exercise, supporting pyramid/ladder-style workouts (e.g., 40-30-20-10 reps across 4 rounds).

**Scope**: Benchmarks only (not templates or regular workouts)

## Problem Statement

Currently, benchmarks store a single `prescribedReps` value per exercise that applies uniformly across all rounds. Users cannot create popular workout formats like:

- **Descending ladder**: 40-30-20-10 reps
- **Ascending pyramid**: 10-15-20-25 reps
- **Custom patterns**: 21-15-9 (CrossFit style)

## User Stories

### US-1: Create Variable Reps Benchmark
**As a** user creating a benchmark
**I want to** define different rep counts for each round
**So that** I can create pyramid/ladder workouts

### US-2: Copy Round
**As a** user creating a multi-round benchmark
**I want to** copy an existing round
**So that** I can quickly create similar rounds and only modify the reps

### US-3: View Variable Reps Summary
**As a** user viewing a benchmark
**I want to** see the rep breakdown per round
**So that** I understand the workout structure before starting

---

## Functional Requirements

### FR-1: Data Model Changes

#### Current Model (reference)
```typescript
type DbBenchmark = {
  exercises: Array<{
    prescribedReps: number  // Single value for ALL rounds
  }>
}
```

#### New Model
```typescript
type DbBenchmark = {
  exercises: Array<{
    prescribedReps: number  // Base reps (used for single-round or default)
  }>
  // NEW: Per-round rep overrides
  roundConfigs?: Array<{
    roundIndex: number
    exercises: Array<{
      exerciseIndex: number
      prescribedReps: number
    }>
  }>
}
```

**Note**: `roundConfigs` is optional for backwards compatibility. If absent, all rounds use the base `prescribedReps`.

### FR-2: Copy Round Feature

#### Location
- Add "Copy Round" option to the existing `...` menu on each round header

#### Behavior
1. User taps `...` menu on "Runde 2/4"
2. User selects "Copy Round" (German: "Runde kopieren")
3. System creates a new round with:
   - Same exercises as the copied round
   - Same rep counts as the copied round
   - Inserted at the end of the round list
4. User can then edit the copied round's reps individually

#### Acceptance Criteria
| ID | Criteria |
|----|----------|
| AC-2.1 | "Copy Round" option appears in round `...` menu |
| AC-2.2 | Copied round appears at end of round list |
| AC-2.3 | Copied round has identical exercises and reps |
| AC-2.4 | Copied round is immediately editable |
| AC-2.5 | Round counter updates (e.g., "Runde 3/3" → "Runde 4/4") |

### FR-3: Per-Round Rep Editing

#### Behavior
Each exercise in each round displays its own rep count. Users can tap the exercise to modify reps for that specific round.

#### UI Flow
1. In creation view, each round shows its exercises with rep counts
2. Tapping an exercise opens `BenchmarkRepsDialog`
3. Changed reps apply only to that exercise in that specific round
4. Other rounds retain their original rep values

#### Acceptance Criteria
| ID | Criteria |
|----|----------|
| AC-3.1 | Each exercise shows its rep count per round |
| AC-3.2 | Tapping exercise opens rep edit dialog |
| AC-3.3 | Saving reps updates only that round's exercise |
| AC-3.4 | Other rounds are unaffected by the edit |

### FR-4: Summary View Update

#### Current State
Summary view shows exercises grouped by round with rep counts. Verify this already supports variable reps per round, or update if needed.

#### Acceptance Criteria
| ID | Criteria |
|----|----------|
| AC-4.1 | Summary shows correct reps for each round |
| AC-4.2 | Rounds with different reps display distinctly |
| AC-4.3 | Total rep count per exercise is calculable |

---

## Technical Design

### Database Migration

Add `roundConfigs` field to `DbBenchmark` schema:

```typescript
// In src/db/schema.ts
const dbBenchmarkSchema = z.object({
  // ... existing fields
  roundConfigs: z.array(z.object({
    roundIndex: z.number(),
    exercises: z.array(z.object({
      exerciseIndex: z.number(),
      prescribedReps: z.number().min(0).max(10000),
    })),
  })).optional(),
})
```

### Block Generation Logic

Update `BenchmarksRepository.startFromBenchmark()`:

```typescript
const createBlock = (roundIndex: number): DbForTimeBlock => {
  const roundConfig = benchmark.roundConfigs?.find(
    rc => rc.roundIndex === roundIndex
  )

  return {
    kind: 'fortime',
    id: generateId(),
    exercises: benchmark.exercises.map((ex, exerciseIndex) => {
      // Use round-specific reps if defined, otherwise base reps
      const overrideReps = roundConfig?.exercises.find(
        e => e.exerciseIndex === exerciseIndex
      )?.prescribedReps

      return {
        id: generateId(),
        name: ex.name,
        prescribedReps: overrideReps ?? ex.prescribedReps,
        load: null,
        image: ex.image,
      }
    }),
    result: null,
    orderIndex: roundIndex,
  }
}
```

### Form State Changes

Update `useBenchmarkForm()`:

```typescript
type BenchmarkFormState = {
  name: string
  type: BenchmarkType
  rounds: RoundFormState[]  // Changed from number to array
}

type RoundFormState = {
  exercises: Array<{
    exerciseDefinitionId: string | null
    name: string
    prescribedReps: number
    image: Blob | null
  }>
}
```

### Copy Round Implementation

Add to `useBenchmarkForm()`:

```typescript
function copyRound(roundIndex: number) {
  const sourcRound = state.rounds[roundIndex]
  const copiedRound: RoundFormState = {
    exercises: sourceRound.exercises.map(ex => ({
      ...ex,
      // Deep copy to avoid reference issues
    }))
  }
  state.rounds.push(copiedRound)
}
```

---

## UI Changes

### Round Menu (`...`)

Add new menu item:

```vue
<DropdownMenuItem @click="copyRound(roundIndex)">
  <CopyIcon class="mr-2 h-4 w-4" />
  {{ t('benchmarks.copyRound') }}
</DropdownMenuItem>
```

### Exercise Item

Update to show editable reps per round:

```vue
<BenchmarkExerciseItem
  :exercise="exercise"
  :reps="getRepsForRound(roundIndex, exerciseIndex)"
  @update:reps="updateReps(roundIndex, exerciseIndex, $event)"
/>
```

---

## Edge Cases

| Case | Behavior |
|------|----------|
| Delete round with custom reps | Reps config for that round is removed |
| Reorder rounds | `roundIndex` values are recalculated |
| Add exercise to existing benchmark | New exercise uses base reps for all rounds |
| Remove exercise | Exercise removed from all rounds |
| Import/export benchmark | `roundConfigs` included in JSON |

---

## Out of Scope

- Rep modifiers when copying (e.g., "-10 reps") - manual editing only
- Preset patterns (40-30-20-10 templates) - future enhancement
- Variable reps for templates/regular workouts

---

## Testing Requirements

### Unit Tests
- [ ] `copyRound()` creates independent copy
- [ ] Round-specific reps override base reps
- [ ] Backwards compatibility with benchmarks without `roundConfigs`
- [ ] Block generation uses correct reps per round

### Integration Tests
- [ ] Create benchmark with 4 rounds, different reps each
- [ ] Copy round and modify reps
- [ ] Start workout, verify each round has correct reps
- [ ] Complete workout, verify results stored correctly

### Manual Testing
- [ ] Create pyramid benchmark (40-30-20-10)
- [ ] Edit reps in middle round
- [ ] Summary view shows correct reps per round
- [ ] Workout execution shows correct reps

---

## i18n Keys

```yaml
benchmarks:
  copyRound: "Runde kopieren"
  roundReps: "Wiederholungen pro Runde"
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add `roundConfigs` to `DbBenchmark` |
| `src/features/benchmarks/composables/useBenchmarkForm.ts` | Update form state, add `copyRound()` |
| `src/db/implementations/dexie/benchmarks.ts` | Update block generation |
| `src/features/benchmarks/components/BenchmarkExerciseItem.vue` | Support per-round rep editing |
| Round menu component | Add "Copy Round" option |
| Summary component | Verify/update variable reps display |

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Manual QA completed
- [ ] Backwards compatible with existing benchmarks
- [ ] i18n strings added for German
- [ ] No TypeScript errors
- [ ] Code reviewed
