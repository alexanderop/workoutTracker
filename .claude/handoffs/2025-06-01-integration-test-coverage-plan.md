# Integration Test Coverage Plan

## 1. Primary Request and Intent
The user ran test coverage analysis and asked for concrete implementation plans for integration tests to improve coverage. The goal is to increase test coverage from 80.79% by targeting specific low-coverage files. The user wants to save this plan to implement the tests later.

## 2. Key Technical Concepts
- Vue 3 integration testing with `@testing-library/vue`
- `createTestApp` helper pattern for full app testing
- Factory pattern for test data (`workoutBuilder`, `dbWorkoutBuilder`)
- IndexedDB testing with `fake-indexeddb`
- Test isolation with `resetWorkout()` and `resetDatabase()`
- Dialog interaction patterns (`waitForDialog`, `getDialogButton`)
- Route assertions and navigation testing

## 3. Files and Code Sections

### `src/__tests__/helpers/createTestApp.ts`
- **Why important**: Core test helper that provides app instance with router, user events, and custom helpers
- **Key methods**: `navigateTo()`, `waitForRoute()`, `waitForDialog()`, `getDialogButton()`, `startWorkout()`, `getSetRow()`, `fillSet()`

### `src/db/repositories/templates.ts` (5.7% coverage)
- **Why important**: Primary target for template flow tests
- **Key functions to cover**:
```typescript
async createFromWorkout(workout, templateName): Promise<DbWorkoutTemplate>
async startFromTemplate(templateId): Promise<DbActiveWorkout>
async update(id, updates): Promise<void>
async delete(id): Promise<void>
```

### `src/composables/useExerciseForm.ts` (6.25% coverage)
- **Why important**: Form state for custom exercise creation - almost no coverage
- **Code to cover**:
```typescript
export function useExerciseForm() {
  const form = ref<ExerciseFormState>(createInitialState())
  const isNameValid = computed(() => form.value.name.trim().length > 0)
  const isSaveDisabled = computed(() => !isNameValid.value)
  function reset() { form.value = createInitialState() }
  function getFormData(): ExerciseFormState { ... }
}
```

### `src/composables/timers/useAmrapTimer.ts` (58.33% coverage)
- **Why important**: Lines 117-139 uncovered (complete() and incrementRound())
- **Uncovered code**:
```typescript
function complete(): AmrapResult {
  const wasAlreadyCompleted = status.value === 'completed'
  status.value = 'completed'
  stopInterval()
  if (!wasAlreadyCompleted) { config.onComplete?.() }
  return { rounds: rounds.value, partialReps: currentExerciseIndex.value, actualDuration: elapsedSeconds.value }
}

function incrementRound() {
  rounds.value++
  currentExerciseIndex.value = 0
}
```

### `src/lib/dataImport.ts` (54.73% coverage)
- **Why important**: Lines 94-137 uncovered (error handling, transaction logic)
- **Uncovered scenarios**: File read errors, version validation, bulkAdd operations

### `src/views/TemplateDetailView.vue`
- **Why important**: UI for template editing, starting workouts from templates
- **Key actions**: Edit name, add/remove exercises, save changes, delete template, start workout

### `src/views/CreateCustomExercise.vue`
- **Why important**: UI for custom exercise creation form
- **Key flow**: Name input → Equipment selector → Muscle selector → Save

## 4. Problem Solving
No problems encountered - this was a planning session. Coverage gaps were identified and concrete test plans created.

## 5. Pending Tasks - 8 Integration Tests

### Test #1: `template-flow.spec.ts` (HIGHEST PRIORITY)
**Coverage targets:** `templates.ts` (5.7% → ~70%), `TemplateDetailView.vue`

#### Test 1a: Create template from finished workout
```
Flow:
1. Navigate to `/` → click "Get Started"
2. Add Bench Press block, add Squat block
3. Start workout, complete 1 set each
4. Finish workout with name "Push Day"
5. On summary page, click "Save as Template"
6. Verify template saved to DB via `db.templates.toArray()`
7. Navigate to `/workouts`, click "Templates" tab
8. Verify "Push Day" template appears
```

#### Test 1b: Start workout from template
```
Flow:
1. Pre-seed DB with template: `db.templates.add({ id: 'tpl-1', name: 'Leg Day', blocks: [...] })`
2. Navigate to `/workouts`
3. Click "Templates" tab
4. Click on "Leg Day" template card
5. Verify route is `/templates/tpl-1`
6. Click "Start Workout" button
7. Verify route is `/workout/active`
8. Verify blocks match template (Squat, etc.)
```

#### Test 1c: Edit and delete template
```
Flow:
1. Pre-seed template in DB
2. Navigate to `/templates/{id}`
3. Change template name input
4. Click "+ Add Exercise", add new exercise
5. Click "Save Changes"
6. Verify `db.templates.get(id)` reflects changes
7. Click "Delete Template"
8. Confirm in dialog
9. Verify redirect to `/workouts`
10. Verify template removed from DB
```

---

### Test #2: `custom-exercise-flow.spec.ts`
**Coverage targets:** `useExerciseForm.ts` (6.25% → ~90%), `customExercises.ts` (35% → ~80%)

#### Test 2a: Create custom exercise
```
Flow:
1. Navigate to `/exercises`
2. Click "+ Create Custom Exercise"
3. Verify route is `/create-exercise`
4. Type "Zercher Squat" in name input
5. Click "Equipment" → select "Barbell"
6. Click "Muscle" → select "Legs"
7. Click "Save" button
8. Verify redirect back (router.back())
9. Verify `db.customExercises.toArray()` contains "Zercher Squat"
```

#### Test 2b: Custom exercise appears in exercise picker
```
Flow:
1. Pre-seed custom exercise in DB
2. Navigate to `/workout/active`
3. Click "Add First Block"
4. Search for custom exercise name
5. Verify it appears in results
6. Click to add it
7. Verify block added with custom exercise
```

---

### Test #3: `amrap-timer-completion.spec.ts`
**Coverage targets:** `useAmrapTimer.ts` (58% → ~95%), lines 119-139

#### Test 3a: Full AMRAP execution with rounds
```
Flow:
1. Create workout with AMRAP block (duration: 5 seconds for fast test)
2. Start workout, navigate to AMRAP block
3. Click "Start" button
4. Wait for timer to show running state
5. Click "+ Round" button 3 times
6. Verify rounds counter shows 3
7. Wait for timer to complete (5 seconds)
8. Verify timer shows "completed" state
9. Verify result stored: `{ rounds: 3, actualDuration: 5 }`
```

#### Test 3b: AMRAP pause and resume
```
Flow:
1. Start AMRAP timer
2. Click Pause
3. Verify timer paused (not incrementing)
4. Click Resume
5. Verify timer running again
6. Complete timer
```

---

### Test #4: `data-import-edge-cases.spec.ts`
**Coverage targets:** `dataImport.ts` (54% → ~90%), lines 94-137

#### Test 4a: Import file with future version (rejected)
```
Flow:
1. Navigate to `/settings`
2. Create mock file with `version: 999`
3. Trigger file input
4. Verify error dialog shows "newer version" message
```

#### Test 4b: Import file with missing required arrays
```
Flow:
1. Create mock file missing `templates` array
2. Trigger import
3. Verify error dialog shows "corrupted" message
```

#### Test 4c: Import partial data (empty arrays)
```
Flow:
1. Create valid file with empty workouts but populated templates
2. Trigger import
3. Verify success
4. Verify templates imported, workouts table empty
```

---

### Test #5: `settings-persistence.spec.ts`
**Coverage targets:** `settings.ts` (64% → ~90%)

#### Test 5a: Unit preference persists across sessions
```
Flow:
1. Navigate to `/settings`
2. Toggle unit from kg to lb
3. Verify `db.settings.get('units')` is 'lb'
4. Create new test app instance
5. Navigate to `/settings`
6. Verify toggle shows 'lb'
```

#### Test 5b: Theme preference persists
```
Flow:
1. Toggle theme to dark
2. Verify persisted
3. Reload, verify dark theme active
```

---

### Test #6: `workout-persistence.spec.ts`
**Coverage targets:** `useWorkoutPersistence.ts` (70% → ~90%), lines 156-160, 180-182

#### Test 6a: Active workout persists to DB
```
Flow:
1. Start new workout
2. Add blocks, fill in set data
3. Verify `db.activeWorkout.get('current')` contains data
4. Create new app instance
5. Navigate to `/workout/active`
6. Verify workout restored with blocks and data
```

#### Test 6b: Completed workout clears active workout
```
Flow:
1. Start and complete a workout
2. Verify `db.activeWorkout.get('current')` is undefined
3. Verify workout appears in `db.workouts`
```

---

### Test #7: `workout-mode-edge-cases.spec.ts`
**Coverage targets:** `useWorkoutMode.ts` (83% → ~95%), lines 96-97, 119-124

#### Test 7a: Navigate past last block wraps to first
```
Flow:
1. Create workout with 2 blocks
2. Start workout, navigate to block 2
3. Click next button
4. Verify wraps to block 1 (or stays on block 2 if no wrap)
```

#### Test 7b: Handle single-block workout navigation
```
Flow:
1. Create workout with 1 block
2. Start workout
3. Verify prev/next buttons disabled or hidden
```

---

### Test #8: `rest-timer-flow.spec.ts`
**Coverage targets:** `WorkoutRestTimerWidget.vue` (0% → ~80%)

#### Test 8a: Rest timer appears after completing set
```
Flow:
1. Start workout with strength block
2. Complete a set
3. Verify rest timer widget appears
4. Verify countdown starts
5. Click "Skip" or wait for completion
6. Verify timer disappears
```

---

## 6. Factory Requirements

Add to `src/__tests__/factories/template.factory.ts`:
```typescript
export function createDbTemplate(overrides?: Partial<DbWorkoutTemplate>): DbWorkoutTemplate {
  return {
    id: `template-${Date.now()}`,
    name: 'Test Template',
    blocks: [
      {
        kind: 'strength',
        exerciseDefinitionId: null,
        name: 'Bench Press',
        equipment: 'barbell',
        targetReps: 8,
        thumbnail: '🏋️',
        defaultSetCount: 3,
      }
    ],
    createdAt: Date.now(),
    lastUsedAt: null,
    tags: [],
    ...overrides,
  }
}
```

## 7. Priority Order Summary

| # | Test File | Est. Coverage Impact | Complexity |
|---|-----------|---------------------|------------|
| 1 | `template-flow.spec.ts` | +40% templates.ts | Medium |
| 2 | `custom-exercise-flow.spec.ts` | +80% useExerciseForm | Low |
| 3 | `amrap-timer-completion.spec.ts` | +40% useAmrapTimer | Medium |
| 4 | `data-import-edge-cases.spec.ts` | +35% dataImport | Low |
| 5 | `settings-persistence.spec.ts` | +25% settings.ts | Low |
| 6 | `workout-persistence.spec.ts` | +20% persistence | Medium |
| 7 | `workout-mode-edge-cases.spec.ts` | +12% useWorkoutMode | Low |
| 8 | `rest-timer-flow.spec.ts` | +80% widget | Medium |

**Total estimated overall coverage improvement:** +15-20%

## 8. Next Step
Implement Test #1: `template-flow.spec.ts` OR Test #2: `custom-exercise-flow.spec.ts` (lower complexity, recommended starting point)
