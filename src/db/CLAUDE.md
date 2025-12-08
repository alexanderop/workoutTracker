# Database Guide

AI agent guidance for database access in this Vue 3 PWA.

## Database Stack

**ORM**: Dexie.js (IndexedDB wrapper)

**Pattern**: Repository pattern with interface abstractions

**Location**: All database code in `src/db/`

**Test isolation**: `fake-indexeddb` (NOT real IndexedDB in tests)

## Repository Architecture

This codebase uses the **Repository Pattern** to abstract database access:

```
src/db/
├── schema.ts                 # Database types (Db* prefix)
├── interfaces.ts             # Repository interfaces (contracts)
├── provider.ts               # Repository provider (singleton)
├── index.ts                  # Public API (getters)
├── converters.ts             # Domain ↔ Database type converters
├── implementations/
│   └── dexie/
│       ├── database.ts       # Dexie schema definition
│       ├── settings.ts       # Settings repository impl
│       ├── customExercises.ts
│       ├── workouts.ts
│       ├── activeWorkout.ts
│       ├── templates.ts
│       ├── benchmarks.ts
│       └── dataManagement.ts
└── __tests__/                # Repository tests
```

## Patterns & Conventions

### ✅ DO: Import Repositories via Getters

**Always** use repository getters from `@/db/index.ts`:

```ts
import {
  getWorkoutsRepository,
  getCustomExercisesRepository,
  getSettingsRepository,
} from '@/db'

const workoutsRepo = getWorkoutsRepository()
const exercises = await workoutsRepo.getAll()
```

**Why**: Provides abstraction layer, makes testing easier, allows swapping implementations.

### ✅ DO: Use `Db*` Types for Database, Domain Types Elsewhere

**Database types** (in `schema.ts`):
- Prefix: `Db*` (e.g., `DbWorkout`, `DbCustomExercise`)
- Use `null` for "no value" (IndexedDB doesn't support `undefined`)
- Optimized for storage

**Domain types** (in `src/types/`):
- No prefix (e.g., `Workout`, `Set`)
- Use `undefined` for optional values
- Optimized for app logic

```ts
// ✅ GOOD - Database types for persistence
import type { DbCustomExercise } from '@/db/schema'

async function saveExercise(exercise: DbCustomExercise) {
  await getCustomExercisesRepository().add(exercise)
}

// ✅ GOOD - Domain types for app logic
import type { Workout } from '@/types/workout'

function processWorkout(workout: Workout) {
  // Business logic
}
```

**Example**: `src/db/schema.ts` vs `src/types/workout.ts`

### ✅ DO: Use Converters for Type Transformations

For complex transformations between domain and database types:

```ts
import { convertWorkoutToDb, convertDbToWorkout } from '@/db/converters'
import type { Workout } from '@/types/workout'
import type { DbCompletedWorkout } from '@/db/schema'

// Domain → Database
const workout: Workout = { /* ... */ }
const dbWorkout: DbCompletedWorkout = convertWorkoutToDb(workout)
await getWorkoutsRepository().create(dbWorkout)

// Database → Domain
const dbWorkout = await getWorkoutsRepository().getById(id)
if (dbWorkout) {
  const workout: Workout = convertDbToWorkout(dbWorkout)
}
```

**File**: `src/db/converters.ts`

### ✅ DO: Generate IDs with `generateId()`

```ts
import { generateId } from '@/db'

const exercise: DbCustomExercise = {
  id: generateId(), // ✅ Uses crypto.randomUUID()
  name: 'Squat',
  // ...
}

await getCustomExercisesRepository().add(exercise)
```

**File**: `src/db/index.ts:54-56`

### ✅ DO: Follow Repository Interface Signatures

Repository interfaces define **overloaded signatures** for type safety:

```ts
// ✅ GOOD - Follows SettingsRepository interface
const settingsRepo = getSettingsRepository()

const theme = await settingsRepo.get('theme') // Returns 'light' | 'dark' | 'system'
const restTimer = await settingsRepo.get('defaultRestTimer') // Returns number

await settingsRepo.set({ key: 'theme', value: 'dark' })
```

**Files**: `src/db/interfaces.ts` (definitions), `src/db/implementations/dexie/settings.ts:60-100` (implementation)

### ✅ DO: Use `tryCatch()` for Error Handling

```ts
import { tryCatch } from '@/lib/tryCatch'
import { getWorkoutsRepository } from '@/db'

const [error, workout] = await tryCatch(
  getWorkoutsRepository().getById(id)
)

if (error) {
  console.error('Failed to load workout:', error)
  return
}

// Use workout safely
```

### ❌ DON'T: Import Dexie Database Directly (Outside Tests)

```ts
// ❌ BAD - direct database access
import { db } from '@/db/implementations/dexie/database'
await db.workouts.get(id)

// ✅ GOOD - use repository
import { getWorkoutsRepository } from '@/db'
await getWorkoutsRepository().getById(id)
```

**Exception**: Tests can import `db` for setup/teardown (see `src/__tests__/setup.ts`).

### ❌ DON'T: Mix Domain and Database Types

```ts
// ❌ BAD - mixing types
import type { Workout } from '@/types/workout' // Domain type
import { getWorkoutsRepository } from '@/db'

const workout: Workout = { /* ... */ }
await getWorkoutsRepository().create(workout) // Type error! Expects DbCompletedWorkout

// ✅ GOOD - convert first
import { convertWorkoutToDb } from '@/db/converters'

const dbWorkout = convertWorkoutToDb(workout)
await getWorkoutsRepository().create(dbWorkout)
```

## Touch Points / Key Files

### Repository Interfaces
- **All interfaces**: `src/db/interfaces.ts`
  - `SettingsRepository` - User settings (theme, units, defaults)
  - `CustomExercisesRepository` - Exercise library CRUD
  - `WorkoutsRepository` - Completed workout history
  - `ActiveWorkoutRepository` - Current workout state
  - `TemplatesRepository` - Workout templates
  - `BenchmarksRepository` - Benchmark workouts
  - `DataManagementRepository` - Export/import/delete

### Database Schema
- **Runtime types**: `src/db/schema.ts` (all types with `Db` prefix)
- **Dexie schema**: `src/db/implementations/dexie/database.ts` (table definitions)

### Repository Implementations
- **Settings**: `src/db/implementations/dexie/settings.ts`
- **Custom exercises**: `src/db/implementations/dexie/customExercises.ts`
- **Workouts**: `src/db/implementations/dexie/workouts.ts`
- **Active workout**: `src/db/implementations/dexie/activeWorkout.ts`
- **Templates**: `src/db/implementations/dexie/templates.ts`
- **Benchmarks**: `src/db/implementations/dexie/benchmarks.ts`

### Type Converters
- **All converters**: `src/db/converters.ts`
  - `convertWorkoutToDb` / `convertDbToWorkout`
  - Block converters, set converters, etc.

### Public API
- **Entry point**: `src/db/index.ts`
  - Repository getters (`getWorkoutsRepository()`, etc.)
  - Utilities (`generateId()`, `deleteAllData()`)

## Available Repositories

### SettingsRepository

```ts
import { getSettingsRepository } from '@/db'

const repo = getSettingsRepository()

// Get individual settings (type-safe)
const theme = await repo.get('theme') // 'light' | 'dark' | 'system'
const restTimer = await repo.get('defaultRestTimer') // number

// Set a setting
await repo.set({ key: 'theme', value: 'dark' })

// Get all settings (merged with defaults)
const allSettings = await repo.getAll()

// Reset to defaults
await repo.reset('theme')
await repo.resetAll()
```

### CustomExercisesRepository

```ts
import { getCustomExercisesRepository, generateId } from '@/db'

const repo = getCustomExercisesRepository()

// Get all exercises
const exercises = await repo.getAll()

// Get by ID
const exercise = await repo.getById(id)

// Add new exercise
await repo.add({
  id: generateId(),
  name: 'Squat',
  icon: '🏋️',
  equipment: 'barbell',
  muscle: 'legs',
  type: 'strength',
  metrics: 'reps-weight',
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

// Update exercise
await repo.update(id, { name: 'Back Squat' })

// Delete exercise
await repo.delete(id)
```

### WorkoutsRepository

```ts
import { getWorkoutsRepository } from '@/db'
import { convertWorkoutToDb } from '@/db/converters'

const repo = getWorkoutsRepository()

// Get all completed workouts
const workouts = await repo.getAll()

// Get by ID
const workout = await repo.getById(id)

// Create completed workout
const dbWorkout = convertWorkoutToDb(workout)
const created = await repo.create(dbWorkout)

// Delete workout
await repo.delete(id)
```

### ActiveWorkoutRepository

```ts
import { getActiveWorkoutRepository } from '@/db'

const repo = getActiveWorkoutRepository()

// Load active workout
const activeWorkout = await repo.load()

// Save active workout
await repo.save(dbActiveWorkout)

// Delete active workout
await repo.delete()

// Check if exists
const exists = await repo.exists()
```

### BenchmarksRepository

```ts
import { getBenchmarksRepository, generateId } from '@/db'

const repo = getBenchmarksRepository()

// Get all benchmarks
const benchmarks = await repo.getAll()

// Get by ID
const benchmark = await repo.getById(id)

// Create benchmark
await repo.create({
  id: generateId(),
  name: 'Fran',
  type: 'fortime',
  rounds: 1,
  exercises: [
    { name: 'Thrusters', prescribedReps: 21, thumbnail: '🏋️', exerciseDefinitionId: null },
    { name: 'Pull-ups', prescribedReps: 21, thumbnail: '💪', exerciseDefinitionId: null },
  ],
  createdAt: Date.now(),
  lastUsedAt: null,
})

// Update benchmark
await repo.update(id, { name: 'Fran (Scaled)' })

// Delete benchmark
await repo.delete(id)
```

## JIT Index Hints

```bash
# Find repository interface definitions
rg -n "export type.*Repository" src/db/interfaces.ts

# Find repository implementations
ls src/db/implementations/dexie

# Find database schema types
rg -n "export type Db" src/db/schema.ts

# Find converter functions
rg -n "export function convert" src/db/converters.ts

# Find repository usage in features
rg -n "get.*Repository\(\)" src/features --type ts

# Find database tests
find src/db/__tests__ -name "*.spec.ts"

# Find type definitions
rg -n "^export type" src/db/schema.ts src/db/interfaces.ts
```

## Common Gotchas

### 1. Use `null` in Database Types, `undefined` in Domain Types

```ts
// ❌ BAD - undefined not supported by IndexedDB
type DbCustomExercise = {
  equipment: Equipment | undefined // IndexedDB stores as null anyway
}

// ✅ GOOD - explicit null for database
type DbCustomExercise = {
  equipment: Equipment | null
}

// ✅ GOOD - undefined for domain types
type Exercise = {
  equipment?: Equipment // Optional (undefined when not set)
}
```

### 2. Reset Database in Tests

```ts
import { resetDatabase } from '@/__tests__/setup'

// ❌ BAD - tests interfere with each other
it('test 1', async () => {
  await getWorkoutsRepository().create(workout)
})

it('test 2', async () => {
  const workouts = await getWorkoutsRepository().getAll()
  expect(workouts).toHaveLength(0) // Fails! Includes workout from test 1
})

// ✅ GOOD - reset between tests
beforeEach(async () => {
  await resetDatabase()
})
```

### 3. Use Repository Getters, Not Direct Imports

```ts
// ❌ BAD - direct repository provider access
import { getRepositoryProvider } from '@/db/provider'
const repo = getRepositoryProvider().workouts

// ✅ GOOD - use getter
import { getWorkoutsRepository } from '@/db'
const repo = getWorkoutsRepository()
```

### 4. Convert Between Types When Needed

```ts
import type { Workout } from '@/types/workout'
import { getWorkoutsRepository } from '@/db'
import { convertWorkoutToDb } from '@/db/converters'

const workout: Workout = { /* ... */ }

// ❌ BAD - type mismatch
await getWorkoutsRepository().create(workout) // Type error!

// ✅ GOOD - convert first
const dbWorkout = convertWorkoutToDb(workout)
await getWorkoutsRepository().create(dbWorkout)
```

## Pre-PR Checks

Run database tests before creating a PR:

```bash
# Run all database tests
pnpm test src/db

# Run integration tests (includes database)
pnpm test src/__tests__/integration

# Type-check database code
pnpm type-check
```

**Database checklist:**
- [ ] Used repository getters (`getWorkoutsRepository()`)
- [ ] Used `Db*` types for database, domain types for app logic
- [ ] Used `generateId()` for new records
- [ ] Used `null` in database types (not `undefined`)
- [ ] Reset database in `beforeEach` for tests
- [ ] Used converters for complex type transformations
