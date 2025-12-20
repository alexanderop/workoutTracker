# Dexie.js Improvement Plan

This plan addresses performance, reactivity, and best practice improvements for the Dexie.js implementation.

## Phase 1: Quick Wins (Low Effort, Immediate Impact)

### 1.1 Fix `exists()` Methods
**Files**: `src/db/implementations/dexie/activeWorkout.ts:25-28`, `activeBenchmarkWorkout.ts:26-29`

Replace full object fetch with count check:
```typescript
async exists(): Promise<boolean> {
  return (await db.activeWorkout.count()) > 0
}
```

### 1.2 Remove Unused Indexes
**File**: `src/db/implementations/dexie/database.ts`

Before:
```typescript
customExercises: 'id, name, muscle, equipment, createdAt',
benchmarks: 'id, name, createdAt, lastUsedAt',
```

After:
```typescript
customExercises: 'id, name, createdAt',
benchmarks: 'id, createdAt, lastUsedAt',
```

### 1.3 Wrap Transactions Around Related Operations
**Files**:
- `src/db/implementations/dexie/benchmarks.ts:59-109` (`startFromBenchmark`)
- `src/db/implementations/dexie/templates.ts:248-276` (`startFromTemplate`)

Wrap the `lastUsedAt` update in a transaction with the read operation.

---

## Phase 2: Reactive Queries with liveQuery

### 2.1 Add VueUse RxJS Integration
```bash
pnpm add @vueuse/rxjs rxjs
```

### 2.2 Create Live Query Composables

Create `src/composables/useLiveActiveWorkout.ts`:
```typescript
import { useObservable } from '@vueuse/rxjs'
import { liveQuery } from 'dexie'
import { db } from '@/db/implementations/dexie/database'

export function useLiveActiveWorkout() {
  return useObservable(liveQuery(() => db.activeWorkout.get('current')))
}
```

Create `src/composables/useLiveSettings.ts` for settings that should sync across tabs.

### 2.3 Priority Tables for liveQuery
1. `activeWorkout` - Cross-tab sync for active workout state
2. `settings` - User preferences should sync immediately
3. `templates` - Less critical, but nice for multi-tab editing

---

## Phase 3: Performance Optimization

### 3.1 Fix Exercise Progress Full-Table Scans
**File**: `src/db/implementations/dexie/exerciseProgress.ts:82-85`

**Option A - Denormalized Index Table** (recommended for scale):
```typescript
// Add to schema
exerciseWorkouts: '[exerciseId+workoutId], exerciseId, workoutId, completedAt'
```

Update when completing workouts. Query becomes:
```typescript
db.exerciseWorkouts.where('exerciseId').equals(id).toArray()
```

**Option B - Pagination with Early Exit**:
```typescript
async getExerciseHistory(exerciseId: string, limit = 20) {
  const collected: ExerciseSession[] = []

  await db.workouts
    .orderBy('completedAt')
    .reverse()
    .until(() => collected.length >= limit)
    .each(workout => {
      const blocks = getStrengthBlocksForExercise(workout, exerciseId)
      if (blocks.length > 0) {
        collected.push(buildSession(workout, blocks))
      }
    })

  return collected.slice(0, limit)
}
```

### 3.2 Improve `searchByName`
**File**: `src/db/implementations/dexie/customExercises.ts:44-49`

For prefix matching:
```typescript
async searchByName(query: string): Promise<DbCustomExercise[]> {
  return db.customExercises
    .where('name')
    .startsWithIgnoreCase(query)
    .toArray()
}
```

For substring matching (current behavior), add limit:
```typescript
.filter(e => e.name.toLowerCase().includes(query))
.limit(50)
.toArray()
```

### 3.3 Optimize `templates.getAll()` Sorting
**File**: `src/db/implementations/dexie/templates.ts:199-207`

Use database ordering instead of client-side sort.

---

## Phase 4: Error Handling & Robustness

### 4.1 Wrap Dexie Errors with Typed Errors
Create consistent error handling for `ConstraintError`, `NotFoundError`, etc.

```typescript
async add(exercise: DbCustomExercise): Promise<void> {
  try {
    await db.customExercises.add(exercise)
  } catch (error) {
    if (error instanceof Dexie.ConstraintError) {
      throw createDatabaseError('DUPLICATE_KEY', 'add custom exercise', error)
    }
    throw error
  }
}
```

### 4.2 Improve Version Change Handling
**File**: `src/db/implementations/dexie/database.ts:58-60`

```typescript
db.on('versionchange', () => {
  db.close()
  // Notify user to refresh
  window.dispatchEvent(new CustomEvent('db-version-change'))
})
```

---

## Implementation Order

| Step | Task | Effort | Files |
|------|------|--------|-------|
| 1 | Fix `exists()` methods | 15 min | 2 files |
| 2 | Remove unused indexes | 10 min | 1 file |
| 3 | Add transactions to `startFrom*` | 20 min | 2 files |
| 4 | Install `@vueuse/rxjs` | 5 min | - |
| 5 | Create `useLiveActiveWorkout` | 30 min | 1 file |
| 6 | Fix exercise progress scans | 1 hr | 1-2 files |
| 7 | Improve search/sort queries | 30 min | 2 files |
| 8 | Add typed error wrapping | 45 min | multiple |

---

## Testing Considerations

- Verify schema migration works (removing indexes)
- Test cross-tab sync with liveQuery
- Benchmark exercise history queries before/after optimization
- Test error scenarios (duplicate keys, not found, etc.)
