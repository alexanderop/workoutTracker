# Variable Reps Benchmark - Integration Tests

BDD integration tests using Vitest Browser Mode for the variable reps per round feature.

---

## Test Suite: Benchmark Creation

### Test: Create ForTime benchmark with variable reps across rounds

**Given** user is on the benchmark creation page
**When** user creates a ForTime benchmark with name "Pyramid 40-30-20-10"
**And** adds exercises "Burpees" (40 reps) and "Squats" (30 reps) to Round 1
**And** copies Round 1
**And** edits Round 2 exercises to 30 and 20 reps respectively
**And** copies Round 2
**And** edits Round 3 exercises to 20 and 15 reps respectively
**And** copies Round 3
**And** edits Round 4 exercises to 10 and 10 reps respectively
**And** saves the benchmark
**Then** benchmark is saved with 4 rounds
**And** each round has the correct rep values

---

## Test Suite: Copy Round

### Test: Copied round has identical exercises and reps

**Given** a ForTime benchmark with 1 round containing "Burpees" (40 reps)
**When** user copies Round 1
**Then** Round 2 appears with "Burpees" (40 reps)
**And** round counter shows "2/2"

### Test: Copied round is independent from source

**Given** a ForTime benchmark with 2 identical rounds
**When** user edits Round 2's "Burpees" to 30 reps
**And** saves the benchmark
**Then** Round 1 still has 40 reps
**And** Round 2 has 30 reps

### Test: Copied round preserves exerciseDefinitionId

**Given** a ForTime benchmark with Round 1 containing exercise linked to definition "burpees-123"
**When** user copies Round 1
**Then** Round 2's exercise has the same exerciseDefinitionId "burpees-123"

---

## Test Suite: Round Management

### Test: Reorder rounds via drag-and-drop

**Given** a ForTime benchmark with 3 rounds (40, 30, 20 reps)
**When** user drags Round 3 to position 1
**And** saves the benchmark
**Then** rounds are ordered: 20, 40, 30 reps
**And** summary view reflects the new order

### Test: Delete middle round

**Given** a ForTime benchmark with 3 rounds
**When** user deletes Round 2
**Then** 2 rounds remain
**And** Round 1 and Round 3 (now Round 2) are unchanged

### Test: Cannot delete last remaining round

**Given** a ForTime benchmark with 1 round
**When** user opens the round menu
**Then** "Delete Round" option is disabled

---

## Test Suite: Per-Round Exercise Management

### Test: Add exercise to current round only

**Given** a ForTime benchmark with 2 rounds, each with "Burpees"
**When** user adds "Pull-ups" to Round 2
**And** saves the benchmark
**Then** Round 1 has only "Burpees"
**And** Round 2 has "Burpees" and "Pull-ups"

### Test: Delete exercise from current round only

**Given** a ForTime benchmark with 2 rounds, each with "Burpees" and "Squats"
**When** user deletes "Squats" from Round 1
**And** saves the benchmark
**Then** Round 1 has only "Burpees"
**And** Round 2 still has "Burpees" and "Squats"

### Test: Reorder exercises within a round

**Given** a ForTime benchmark with Round 1 containing "Burpees", "Squats", "Pull-ups"
**When** user drags "Pull-ups" to position 1 in Round 1
**And** saves the benchmark
**Then** Round 1 order is "Pull-ups", "Burpees", "Squats"

---

## Test Suite: Validation

### Test: Cannot save benchmark with empty round

**Given** a ForTime benchmark with 2 rounds
**When** user deletes all exercises from Round 2
**And** attempts to save
**Then** validation error is shown: "Each round must have at least one exercise"
**And** benchmark is not saved

---

## Test Suite: Summary View

### Test: Summary shows per-round grouping

**Given** a saved ForTime benchmark with:
  - Round 1: Burpees 40, Squats 30
  - Round 2: Burpees 30, Pull-ups 20
**When** user views the benchmark summary
**Then** summary displays rounds as distinct groups
**And** Round 1 shows "Burpees 40, Squats 30"
**And** Round 2 shows "Burpees 30, Pull-ups 20"

---

## Test Suite: Workout Execution

### Test: Start workout with correct reps per round

**Given** a ForTime benchmark "Pyramid" with:
  - Round 1: Burpees 40
  - Round 2: Burpees 30
  - Round 3: Burpees 20
  - Round 4: Burpees 10
**When** user starts workout from this benchmark
**Then** Block 1 shows Burpees with 40 prescribed reps
**And** Block 2 shows Burpees with 30 prescribed reps
**And** Block 3 shows Burpees with 20 prescribed reps
**And** Block 4 shows Burpees with 10 prescribed reps

---

## Test Suite: Result Comparison

### Test: Warning shown when structure changes on benchmark with results

**Given** a ForTime benchmark with completed workout results
**When** user edits the benchmark and changes reps from 40 to 35
**And** attempts to save
**Then** warning dialog appears: "Changing the structure will break comparison with previous results. Continue?"

### Test: No warning when structure unchanged

**Given** a ForTime benchmark with completed workout results
**When** user edits the benchmark name only (no structure change)
**And** saves
**Then** no warning dialog appears
**And** benchmark is saved

### Test: No warning when benchmark has no results

**Given** a ForTime benchmark with no completed workouts
**When** user edits reps and saves
**Then** no warning dialog appears
**And** benchmark is saved

---

## Test Suite: Import/Export

### Test: Export and reimport benchmark with rounds

**Given** a ForTime benchmark with 3 rounds and variable reps
**When** user exports the benchmark
**And** user imports the exported JSON
**Then** imported benchmark has 3 rounds
**And** each round has correct exercises and reps

### Test: Import legacy format fails with error

**Given** a JSON file with old benchmark format (exercises array, no rounds)
**When** user attempts to import
**Then** error is shown: "This benchmark format is no longer supported"
**And** benchmark is not imported
