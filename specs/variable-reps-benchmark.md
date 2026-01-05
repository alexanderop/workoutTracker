# Variable Reps Per Round - Benchmark Feature (Refined Spec)

## Overview

Enable benchmark workouts where each round can have different rep counts AND different exercises per round, supporting pyramid/ladder-style workouts (e.g., 40-30-20-10 reps across 4 rounds).

**Scope**: ForTime benchmarks only (AMRAP/EMOM use same schema but sync all rounds)

---

## Problem Statement

Currently, benchmarks store a single `prescribedReps` value per exercise that applies uniformly across all rounds. Users cannot create popular workout formats like:

- **Descending ladder**: 40-30-20-10 reps
- **Ascending pyramid**: 10-15-20-25 reps
- **Custom patterns**: 21-15-9 (CrossFit style)

---

## User Stories

### US-1: Create Variable Reps Benchmark
**As a** user creating a ForTime benchmark
**I want to** define different rep counts for each round
**So that** I can create pyramid/ladder workouts

### US-2: Copy Round
**As a** user creating a multi-round benchmark
**I want to** copy an existing round
**So that** I can quickly create similar rounds and only modify the reps

### US-3: View Variable Reps Summary
**As a** user viewing a benchmark
**I want to** see the rep breakdown per round (grouped by round)
**So that** I understand the workout structure before starting

---

## Functional Requirements

### FR-1: Data Model Changes

#### New Model (Unified Schema - All Benchmark Types)

```typescript
type DbBenchmark = {
  id: string
  name: string
  type: 'fortime' | 'amrap' | 'emom'
  // Unified structure for all types
  rounds: Array<{
    orderKey: string  // Fractional index (e.g., "a0", "a1", "a2")
    exercises: Array<{
      orderKey: string
      exerciseDefinitionId: string | null
      name: string
      prescribedReps: number
      image: Blob | null
    }>
  }>
  // Structure hash for result comparison (excludes images)
  structureHash: string
}
```

**Why unified schema?**
- Simpler code paths - one data structure, one set of components
- Future flexibility - variable reps for other types requires no schema change
- Consistent mental model - "A benchmark has rounds, rounds have exercises"
- Less branching in code

**Type-specific behavior:**
- **ForTime**: Rounds are independent - each can have different exercises/reps
- **AMRAP/EMOM**: Rounds sync - changing one round updates all rounds

**Why fractional indexing?**
- Reordering rounds requires updating only ONE key, not recalculating all indices
- Inserting between rounds: `generateKeyBetween("a0", "a1")` → `"a0V"`
- Deleting rounds requires no index updates
- See `src/lib/fractionalIndexing.ts` for implementation

**No migration needed** - app not published yet, full rewrite of existing data acceptable.

### FR-2: Copy Round Feature

#### Location
- Add "Copy Round" option to the existing `...` menu on each round header
- **This is the ONLY way to add new rounds** (no separate "Add Round" button)

#### Behavior
1. User taps `...` menu on "Round 2/4"
2. User selects "Copy Round"
3. System creates a new round with:
   - Same exercises as the copied round
   - Same rep counts as the copied round
   - Same exerciseDefinitionIds (references preserved, not detached)
   - Same image blob references (shared, not deep-copied)
   - Inserted at the end of the round list
4. User can then edit the copied round's reps individually

#### Acceptance Criteria
| ID | Criteria |
|----|----------|
| AC-2.1 | "Copy Round" option appears in round `...` menu |
| AC-2.2 | Copied round appears at end of round list |
| AC-2.3 | Copied round has identical exercises, reps, and exerciseDefinitionIds |
| AC-2.4 | Copied round shares image blob references (not deep-copied) |
| AC-2.5 | Copied round is immediately editable |
| AC-2.6 | Round counter updates (e.g., "Round 3/3" → "Round 4/4") |

### FR-3: Per-Round Exercise & Rep Management

#### Adding Exercises
- Exercises are added to the **current round only**
- Different rounds can have completely different exercises
- No global "add to all rounds" option

#### Editing Reps
- Each exercise in each round displays its own rep count
- Users can tap the exercise to modify reps for that specific round
- Changed reps apply only to that exercise in that specific round
- Other rounds retain their original rep values
- Uses existing `BenchmarkRepsDialog`

#### Deleting Exercises
- Deleting removes exercise from that round only
- Other rounds keep the exercise

#### Reordering Exercises
- Exercises can be reordered within a round via drag-and-drop
- Reordering affects only that round's order

#### Acceptance Criteria
| ID | Criteria |
|----|----------|
| AC-3.1 | Each exercise shows its rep count per round |
| AC-3.2 | Tapping exercise opens BenchmarkRepsDialog |
| AC-3.3 | Saving reps updates only that round's exercise |
| AC-3.4 | Other rounds are unaffected by the edit |
| AC-3.5 | Adding exercise only adds to current round |
| AC-3.6 | Deleting exercise only removes from current round |
| AC-3.7 | Exercises can be reordered within a round via drag-and-drop |

### FR-4: Round Management

#### Deletion Rules
- **Cannot delete the last remaining round** - show disabled menu item or block action
- Minimum 1 round must exist at all times

#### Validation Rules
- **Each round must have at least 1 exercise** - block saving if any round is empty
- Show validation error if user tries to save with empty rounds

#### Reordering
- Rounds can be reordered via drag-and-drop on round headers
- Reuse existing pattern from templates

#### Acceptance Criteria
| ID | Criteria |
|----|----------|
| AC-4.1 | Delete option disabled/blocked when only 1 round exists |
| AC-4.2 | Validation error shown if any round has 0 exercises |
| AC-4.3 | Rounds can be reordered via drag-and-drop |
| AC-4.4 | Reordering updates only the moved round's orderKey |

### FR-5: Summary View

#### Display Format
- **Per-round grouping**: Each round's exercises listed as a distinct group
- Example:
  ```
  Round 1: Burpees 40, Squats 30
  Round 2: Burpees 30, Pull-ups 20
  Round 3: Burpees 20, Squats 15
  ```

#### Acceptance Criteria
| ID | Criteria |
|----|----------|
| AC-5.1 | Summary shows exercises grouped by round |
| AC-5.2 | Each round displays its specific exercises and reps |
| AC-5.3 | Rounds with different exercises display correctly |

### FR-6: Result Comparison

#### Structure Hash
- Generate hash from: exercise names, exerciseDefinitionIds, prescribed reps, and order
- **Exclude images** from hash (image changes don't affect workout structure)
- Store `structureHash` on DbBenchmark

#### Comparison Logic
- Results can only be compared if `structureHash` matches
- Different hashes = incomparable results (show as separate result sets)

#### Edit Warning
- When saving changes that alter `structureHash`:
  - Compare hash before/after edit
  - If different AND benchmark has previous results: show warning dialog
  - Dialog: "Changing structure will break comparison with previous attempts. Continue or Cancel?"
  - "Continue" saves changes, "Cancel" discards

#### Acceptance Criteria
| ID | Criteria |
|----|----------|
| AC-6.1 | structureHash excludes image data |
| AC-6.2 | Results only compare when structureHash matches |
| AC-6.3 | Warning shown when structure changes on benchmark with results |
| AC-6.4 | Warning only appears when structure actually changed |

### FR-7: Import/Export

#### Export
- Export includes full `rounds` array with all fields
- Uses new schema format

#### Import
- **Reject legacy format** (old `exercises` array without `rounds`)
- Show error message if imported JSON doesn't match new schema
- No auto-conversion of old format

#### Acceptance Criteria
| ID | Criteria |
|----|----------|
| AC-7.1 | Export includes rounds array |
| AC-7.2 | Import validates rounds structure |
| AC-7.3 | Import fails with clear error on legacy format |

---

## Technical Design

### Database Schema

```typescript
// In src/db/schema.ts
const dbBenchmarkRoundExerciseSchema = z.object({
  orderKey: z.string(),
  exerciseDefinitionId: z.string().nullable(),
  name: z.string(),
  prescribedReps: z.number().min(0),
  image: z.instanceof(Blob).nullable(),
})

const dbBenchmarkRoundSchema = z.object({
  orderKey: z.string(),
  exercises: z.array(dbBenchmarkRoundExerciseSchema).min(1), // At least 1 exercise
})

const dbBenchmarkSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['fortime', 'amrap', 'emom']),
  rounds: z.array(dbBenchmarkRoundSchema).min(1), // At least 1 round
  structureHash: z.string(),
})
```

### Structure Hash Generation

```typescript
function generateStructureHash(rounds: BenchmarkRound[]): string {
  const sortedRounds = [...rounds].sort((a, b) =>
    a.orderKey.localeCompare(b.orderKey)
  )

  const structure = sortedRounds.map(round => ({
    exercises: round.exercises
      .sort((a, b) => a.orderKey.localeCompare(b.orderKey))
      .map(ex => ({
        exerciseDefinitionId: ex.exerciseDefinitionId,
        name: ex.name,
        prescribedReps: ex.prescribedReps,
      }))
  }))

  // Simple hash of JSON string
  return hashString(JSON.stringify(structure))
}
```

### Block Generation Logic

Update `BenchmarksRepository.startFromBenchmark()`:

```typescript
import { generateKeyBetween } from '@/lib/fractionalIndexing'

const createBlocks = (benchmark: DbBenchmark): DbForTimeBlock[] => {
  const sortedRounds = [...benchmark.rounds].sort(
    (a, b) => a.orderKey.localeCompare(b.orderKey)
  )

  return sortedRounds.map((round, index) => ({
    kind: 'fortime',
    id: generateId(),
    exercises: round.exercises
      .sort((a, b) => a.orderKey.localeCompare(b.orderKey))
      .map(ex => ({
        id: generateId(),
        name: ex.name,
        prescribedReps: ex.prescribedReps,
        load: null,
        image: ex.image,
      })),
    result: null,
    orderIndex: index,
  }))
}
```

### Form State

```typescript
type BenchmarkFormState = {
  name: string
  type: BenchmarkType
  rounds: RoundFormState[]  // Sorted by orderKey for display
}

type RoundFormState = {
  orderKey: string
  exercises: ExerciseFormState[]
}

type ExerciseFormState = {
  orderKey: string
  exerciseDefinitionId: string | null
  name: string
  prescribedReps: number
  image: Blob | null
}
```

### Copy Round Implementation

```typescript
import { generateKeyBetween, generateNKeysBetween } from '@/lib/fractionalIndexing'

function copyRound(roundOrderKey: string) {
  const sourceRound = state.rounds.find(r => r.orderKey === roundOrderKey)
  if (!sourceRound) return

  const sortedRounds = [...state.rounds].sort(
    (a, b) => a.orderKey.localeCompare(b.orderKey)
  )
  const lastKey = sortedRounds.at(-1)?.orderKey ?? null
  const newRoundKey = generateKeyBetween(lastKey, null)

  const exerciseKeys = generateNKeysBetween(null, null, sourceRound.exercises.length)

  const copiedRound: RoundFormState = {
    orderKey: newRoundKey,
    exercises: sourceRound.exercises.map((ex, i) => ({
      ...ex,  // Preserves exerciseDefinitionId, image reference
      orderKey: exerciseKeys[i],
    })),
  }

  state.rounds.push(copiedRound)
}
```

### Round Operations

```typescript
function moveRound(roundKey: string, afterKey: string | null, beforeKey: string | null) {
  const round = state.rounds.find(r => r.orderKey === roundKey)
  if (round) {
    round.orderKey = generateKeyBetween(afterKey, beforeKey)
  }
}

function deleteRound(roundKey: string) {
  // Block if only 1 round remains
  if (state.rounds.length <= 1) return false

  const index = state.rounds.findIndex(r => r.orderKey === roundKey)
  if (index !== -1) {
    state.rounds.splice(index, 1)
  }
  return true
}

function canDeleteRound(): boolean {
  return state.rounds.length > 1
}
```

---

## UI Changes

### Round Menu (`...`)

```vue
<DropdownMenuItem
  @click="copyRound(round.orderKey)"
>
  <CopyIcon class="mr-2 h-4 w-4" />
  {{ t('benchmarks.copyRound') }}
</DropdownMenuItem>

<DropdownMenuItem
  @click="deleteRound(round.orderKey)"
  :disabled="!canDeleteRound"
>
  <TrashIcon class="mr-2 h-4 w-4" />
  {{ t('benchmarks.deleteRound') }}
</DropdownMenuItem>
```

### Creation Flow

1. User starts with 1 empty round
2. User adds exercises to Round 1
3. User uses "Copy Round" from menu to add Round 2
4. User edits Round 2's reps/exercises as needed
5. Repeat for additional rounds

---

## Edge Cases

| Case | Behavior |
|------|----------|
| Delete last round | Blocked - cannot delete when only 1 round exists |
| Empty round on save | Validation error - each round must have at least 1 exercise |
| Reorder rounds | Update only the moved round's orderKey |
| Add exercise | Adds to current round only |
| Remove exercise | Removes from that round only |
| Reorder exercises | Affects only that round's exercise order |
| Copy round | Preserves exerciseDefinitionId, shares image blob reference |
| Import legacy JSON | Fail with error - no auto-conversion |
| Edit with existing results | Warn if structureHash changes |

---

## Out of Scope

- Rep modifiers when copying (e.g., "-10 reps") - manual editing only
- Preset patterns (40-30-20-10 templates) - future enhancement
- Variable reps for templates/regular workouts
- Auto-conversion of legacy import format

---

## Testing Requirements

### Integration Tests (BDD with Vitest Browser Mode)

- [ ] Create ForTime benchmark with 4 rounds, different reps each
- [ ] Copy round and modify reps - verify independence
- [ ] Copy round preserves exerciseDefinitionId and image references
- [ ] Reorder rounds via drag-drop, verify order in summary
- [ ] Reorder exercises within a round
- [ ] Delete middle round, verify remaining rounds unaffected
- [ ] Cannot delete last remaining round
- [ ] Cannot save with empty round (validation error)
- [ ] Add exercise to one round only
- [ ] Delete exercise from one round only
- [ ] Start workout from benchmark, verify each round has correct reps
- [ ] Edit benchmark with results - warning shown only when structure changes
- [ ] Import/export round trip with new schema
- [ ] Import legacy format fails with error

### Manual Testing Checklist

- [ ] Create pyramid benchmark (40-30-20-10)
- [ ] Edit reps in middle round
- [ ] Summary view shows correct per-round grouping
- [ ] Workout execution shows correct reps per round
- [ ] Drag-and-drop rounds works smoothly
- [ ] Drag-and-drop exercises within round works

---

## i18n Keys

```yaml
# English
benchmarks:
  copyRound: "Copy Round"
  deleteRound: "Delete Round"
  roundReps: "Reps per Round"
  emptyRoundError: "Each round must have at least one exercise"
  structureChangeWarning: "Changing the structure will break comparison with previous results. Continue?"
  legacyImportError: "This benchmark format is no longer supported. Please re-export from the latest app version."

# German
benchmarks:
  copyRound: "Runde kopieren"
  deleteRound: "Runde löschen"
  roundReps: "Wiederholungen pro Runde"
  emptyRoundError: "Jede Runde muss mindestens eine Übung haben"
  structureChangeWarning: "Die Änderung der Struktur macht den Vergleich mit vorherigen Ergebnissen unmöglich. Fortfahren?"
  legacyImportError: "Dieses Benchmark-Format wird nicht mehr unterstützt. Bitte erneut aus der aktuellen App-Version exportieren."
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add unified `rounds` schema with `structureHash` |
| `src/features/benchmarks/composables/useBenchmarkForm.ts` | Update form state, add `copyRound()`, `moveRound()`, `deleteRound()`, validation |
| `src/db/implementations/dexie/benchmarks.ts` | Update block generation, add hash generation |
| `src/features/benchmarks/components/BenchmarkExerciseItem.vue` | Support per-round exercise management |
| `src/features/benchmarks/components/BenchmarkRoundHeader.vue` | Add Copy/Delete round menu items |
| `src/features/benchmarks/components/BenchmarkSummary.vue` | Per-round grouping display |
| `src/features/benchmarks/components/BenchmarkEditView.vue` | Structure change warning dialog |
| Import/export logic | Update for new schema, reject legacy format |
| `src/lib/fractionalIndexing.ts` | Already exists—use `generateKeyBetween()` and `generateNKeysBetween()` |
| i18n files | Add English and German translations |

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] Integration tests written and passing (BDD style)
- [ ] Manual QA completed
- [ ] Works for ForTime benchmarks
- [ ] AMRAP/EMOM benchmarks sync rounds correctly
- [ ] i18n strings added for German and English
- [ ] No TypeScript errors
- [ ] Code reviewed
