# Database Guide

AI agent guidance for database access in this Vue 3 PWA.

## Stack

**ORM**: Dexie.js (IndexedDB wrapper)

**Pattern**: Repository pattern with interface abstractions

**Test isolation**: `fake-indexeddb` (NOT real IndexedDB in tests)

## Architecture

```
src/db/
├── schema.ts           # Database types (Db* prefix)
├── interfaces.ts       # Repository interfaces
├── provider.ts         # Repository provider (singleton)
├── index.ts            # Public API (getters)
├── converters.ts       # Domain ↔ Database converters
└── implementations/dexie/
    ├── database.ts     # Dexie schema
    ├── settings.ts     # Settings repo
    ├── workouts.ts     # Workouts repo
    └── ...             # Other repos
```

## Core Patterns

### Import via Getters

```ts
import { getWorkoutsRepository, getSettingsRepository } from '@/db'

const repo = getWorkoutsRepository()
const workouts = await repo.getAll()
```

**Why**: Abstraction layer, easier testing, swappable implementations.

### `Db*` Types vs Domain Types

| Aspect | Database (`Db*`) | Domain |
|--------|------------------|--------|
| File | `src/db/schema.ts` | `src/types/` |
| Prefix | `DbWorkout`, `DbSet` | `Workout`, `Set` |
| No value | `null` | `undefined` |
| Optimized for | Storage | App logic |

```ts
// Database types for persistence
import type { DbCustomExercise } from '@/db/schema'

// Domain types for business logic
import type { Workout } from '@/types/workout'
```

### Use Converters

```ts
import { convertWorkoutToDb, convertDbToWorkout } from '@/db/converters'

// Domain → Database
const dbWorkout = convertWorkoutToDb(workout)
await getWorkoutsRepository().create(dbWorkout)

// Database → Domain
const dbWorkout = await getWorkoutsRepository().getById(id)
const workout = convertDbToWorkout(dbWorkout)
```

### Generate IDs

```ts
import { generateId } from '@/db'

const exercise = {
  id: generateId(), // crypto.randomUUID()
  name: 'Squat',
}
```

## Available Repositories

### SettingsRepository

```ts
const repo = getSettingsRepository()

await repo.get('theme')           // 'light' | 'dark' | 'system'
await repo.get('defaultRestTimer') // number
await repo.set({ key: 'theme', value: 'dark' })
await repo.getAll()               // All settings merged with defaults
await repo.reset('theme')
```

### CustomExercisesRepository

```ts
const repo = getCustomExercisesRepository()

await repo.getAll()
await repo.getById(id)
await repo.add({ id: generateId(), name: 'Squat', ... })
await repo.update(id, { name: 'Back Squat' })
await repo.delete(id)
```

### WorkoutsRepository

```ts
const repo = getWorkoutsRepository()

await repo.getAll()
await repo.getById(id)
await repo.create(convertWorkoutToDb(workout))
await repo.delete(id)
```

### ActiveWorkoutRepository

```ts
const repo = getActiveWorkoutRepository()

await repo.load()
await repo.save(dbActiveWorkout)
await repo.delete()
await repo.exists()
```

### BenchmarksRepository

```ts
const repo = getBenchmarksRepository()

await repo.getAll()
await repo.getById(id)
await repo.create({ id: generateId(), name: 'Fran', ... })
await repo.update(id, { name: 'Fran (Scaled)' })
await repo.delete(id)
```

### TemplatesRepository

```ts
const repo = getTemplatesRepository()

await repo.getAll()
await repo.getById(id)
await repo.create(template)
await repo.update(id, changes)
await repo.delete(id)
```

## Gotchas

### 1. Use `null` in Database, `undefined` in Domain

IndexedDB doesn't support `undefined`:

```ts
// Database types
type DbExercise = {
  equipment: Equipment | null  // ✅
}

// Domain types
type Exercise = {
  equipment?: Equipment  // ✅ (undefined)
}
```

### 2. Reset Database in Tests

```ts
import { resetDatabase } from '@/__tests__/setup'

beforeEach(async () => {
  await resetDatabase()
})
```

### 3. Convert Types When Crossing Boundaries

```ts
// ❌ Type mismatch
await getWorkoutsRepository().create(workout)

// ✅ Convert first
const dbWorkout = convertWorkoutToDb(workout)
await getWorkoutsRepository().create(dbWorkout)
```

## Quick Find

```bash
rg -n "export type.*Repository" src/db/interfaces.ts  # Repository interfaces
rg -n "export type Db" src/db/schema.ts               # Database types
rg -n "export function convert" src/db/converters.ts  # Converters
ls src/db/implementations/dexie                        # Implementations
```
