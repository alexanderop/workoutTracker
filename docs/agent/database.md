# IndexedDB Data Structure

This document explains the complete IndexedDB data structure for the workout tracker application using Dexie.js.

## Overview

The application uses IndexedDB with Dexie.js for client-side persistence, implementing a repository pattern to abstract database operations. All data persists in the browser's IndexedDB storage.

**Key files:**
- `src/db/schema.ts` - TypeScript type definitions prefixed with `Db`
- `src/db/interfaces.ts` - Repository interface definitions
- `src/db/converters.ts` - Bidirectional conversion between in-memory and database formats
- `src/db/index.ts` - Public API for accessing repositories

## Database Tables

The application uses 5 main tables:

| Table | Primary Key | Purpose |
|-------|-------------|---------|
| `activeWorkout` | `'current'` (singleton) | Stores the single in-progress workout |
| `workouts` | `id` (UUID) | Completed workout history |
| `templates` | `id` (UUID) | Reusable workout templates |
| `customExercises` | `id` (UUID) | User-defined exercises |
| `settings` | `key` | User preferences and configuration |

## Core Data Types

### Active Workout

**Type:** `DbActiveWorkout` (src/db/schema.ts:175)

A singleton record (id is always `'current'`) representing the workout currently in progress.

```typescript
type DbActiveWorkout = {
  id: 'current'                               // Always 'current' (singleton)
  name: string                                 // Workout name
  blocks: ReadonlyArray<DbWorkoutBlock>        // Sequence of workout blocks
  selectedBlockIndex: number                   // Currently selected block (0-based)
  startedAt: number                            // Timestamp when workout started
  lastModifiedAt: number                       // Timestamp of last save
  mode: WorkoutMode                            // 'builder' | 'active'
  activeSetIndex: number | null                // Currently active set in strength block
}
```

**Key characteristics:**
- Only one active workout exists at a time
- Automatically updated on every workout state change
- Contains embedded blocks with full exercise data
- Cleared when workout completes

### Completed Workout

**Type:** `DbCompletedWorkout` (src/db/schema.ts:189)

Historical record of a finished workout.

```typescript
type DbCompletedWorkout = {
  id: string                                   // UUID
  name: string                                 // Workout name
  blocks: ReadonlyArray<DbWorkoutBlock>        // Completed blocks with results
  startedAt: number                            // Timestamp when workout started
  completedAt: number                          // Timestamp when workout finished
  durationSeconds: number                      // Total workout duration
  notes: string                                // User notes (optional)
}
```

**Storage approach:**
- Blocks are embedded (denormalized)
- Contains snapshot of exercise data at completion time
- Sorted by `completedAt` descending (newest first)

### Workout Blocks

**Discriminated Union:** `DbWorkoutBlock = DbStrengthBlock | DbTimedBlock` (src/db/schema.ts:165)

Workouts are sequences of **blocks** differentiated by `kind` property:

#### Strength Block

**Type:** `DbStrengthBlock` (src/db/schema.ts:115)

Traditional strength training with sets, reps, and weights.

```typescript
type DbStrengthBlock = {
  kind: 'strength'                             // Discriminator
  id: string                                   // Block ID
  exerciseDefinitionId: string | null          // Reference to base exercise (null for ad-hoc)
  name: string                                 // Exercise name
  equipment: string                            // Equipment used
  targetReps: number                           // Target reps per set
  thumbnail: string                            // Exercise image/icon
  sets: ReadonlyArray<DbSet>                   // Array of sets
  orderIndex: number                           // Position in workout sequence
}
```

**Set structure:**

```typescript
type DbSet = {
  id: string                                   // Set ID
  kg: string                                   // Weight (stored as string)
  reps: string                                 // Reps performed (stored as string)
  rir: string                                  // Reps in reserve (stored as string)
  status: SetStatus                            // 'completed' | 'active' | 'planned'
  completedAt: number | null                   // Timestamp when set completed
}
```

#### Timed Blocks (CrossFit-style)

All timed blocks share:
- `kind`: Discriminator ('amrap' | 'emom' | 'tabata' | 'fortime')
- `id`: Block ID
- `config`: Block-specific timing configuration
- `exercises`: Array of exercises or single exercise
- `result`: Performance metrics (null until completed)
- `orderIndex`: Position in workout sequence

##### AMRAP Block

**Type:** `DbAmrapBlock` (src/db/schema.ts:136)

"As Many Rounds As Possible" in a time limit.

```typescript
type DbAmrapBlock = {
  kind: 'amrap'
  id: string
  config: {
    durationSeconds: number                    // Time limit
  }
  exercises: ReadonlyArray<DbBlockExercise>    // Circuit of exercises
  result: DbAmrapResult | null
  orderIndex: number
}

type DbAmrapResult = {
  rounds: number                               // Full rounds completed
  partialReps: number                          // Additional reps beyond last full round
  actualDuration: number                       // Actual time taken
}
```

##### EMOM Block

**Type:** `DbEmomBlock` (src/db/schema.ts:127)

"Every Minute On the Minute" - perform exercises at the start of each minute.

```typescript
type DbEmomBlock = {
  kind: 'emom'
  id: string
  config: {
    minutes: number                            // Total duration
    exerciseRotation: 'each-minute' | 'full-round'  // Rotation pattern
  }
  exercises: ReadonlyArray<DbBlockExercise>
  result: DbEmomResult | null
  orderIndex: number
}

type DbEmomResult = {
  completedMinutes: number                     // Minutes successfully completed
  missedMinutes: ReadonlyArray<number>         // Which minutes were missed
}
```

##### Tabata Block

**Type:** `DbTabataBlock` (src/db/schema.ts:145)

High-intensity interval training with work/rest cycles.

```typescript
type DbTabataBlock = {
  kind: 'tabata'
  id: string
  config: {
    rounds: number                             // Number of intervals
    workSeconds: number                        // Work duration per interval
    restSeconds: number                        // Rest duration per interval
  }
  exercise: DbBlockExercise                    // Single exercise
  result: DbTabataResult | null
  orderIndex: number
}

type DbTabataResult = {
  repsPerRound: ReadonlyArray<number>          // Reps in each round
}
```

##### For Time Block

**Type:** `DbForTimeBlock` (src/db/schema.ts:154)

Complete prescribed work as quickly as possible.

```typescript
type DbForTimeBlock = {
  kind: 'fortime'
  id: string
  config: {
    timeCapSeconds: number | null              // Max time allowed (null = no cap)
  }
  exercises: ReadonlyArray<DbBlockExercise>
  result: DbForTimeResult | null
  orderIndex: number
}

type DbForTimeResult = {
  completionTime: number                       // Time taken in seconds
  completed: boolean                           // Whether finished within time cap
}
```

**Block Exercise structure:**

```typescript
type DbBlockExercise = {
  id: string                                   // Exercise ID
  name: string                                 // Exercise name
  prescribedReps: number                       // Target reps per round
  load: string | null                          // Load specification ("24kg", "bodyweight", etc.)
  thumbnail: string                            // Exercise image/icon
}
```

### Workout Templates

**Type:** `DbWorkoutTemplate` (src/db/schema.ts:261)

Reusable workout structures for quick workout creation.

```typescript
type DbWorkoutTemplate = {
  id: string                                   // UUID
  name: string                                 // Template name
  blocks: ReadonlyArray<DbTemplateBlock>       // Template blocks (no runtime state)
  createdAt: number                            // Creation timestamp
  lastUsedAt: number | null                    // Last usage timestamp (for sorting)
  tags: ReadonlyArray<string>                  // Categorization tags
}
```

**Template blocks:**

Template blocks are similar to workout blocks but exclude runtime state:

```typescript
type DbTemplateStrengthBlock = {
  kind: 'strength'
  exerciseDefinitionId: string | null
  name: string
  equipment: string
  targetReps: number
  thumbnail: string
  defaultSetCount: number                      // No actual sets, just default count
}

// Timed template blocks have same structure as workout blocks
// but exercises use DbTemplateBlockExercise (no IDs)
```

### Custom Exercises

**Type:** `DbCustomExercise` (src/db/schema.ts:13)

User-defined exercise definitions.

```typescript
type DbCustomExercise = {
  id: string                                   // UUID
  icon: string                                 // Emoji or icon
  name: string                                 // Exercise name
  equipment: Equipment | null                  // Required equipment
  muscle: Muscle | null                        // Primary muscle group
  type: ExerciseType                           // Exercise category
  metrics: Metrics                             // Tracking metrics (weight, reps, etc.)
  createdAt: number                            // Creation timestamp
  updatedAt: number                            // Last modification timestamp
}
```

**Key characteristics:**
- Uses `null` instead of `undefined` for database storage
- Exercise definitions are referenced by ID in blocks
- Name must be unique (case-insensitive)

### User Settings

**Type:** `DbUserSetting` (discriminated union by `key`, src/db/schema.ts:277)

User preferences stored as key-value pairs.

```typescript
type DbUserSetting =
  | { key: 'theme'; value: 'light' | 'dark' | 'system' }
  | { key: 'defaultRestTimer'; value: number }
  | { key: 'weightUnit'; value: 'kg' | 'lbs' }
  | { key: 'heightUnit'; value: 'cm' | 'ft-in' }
  | { key: 'autoSaveInterval'; value: number }
  | { key: 'screenWakeLock'; value: boolean }
  | { key: 'timerSoundEnabled'; value: boolean }
  | { key: 'language'; value: 'en' | 'de' }
```

**Storage approach:**
- Each setting is a separate record with discriminated union type
- Missing settings fall back to defaults defined in `SettingDefaults`
- Type-safe get/set operations via repository overloads

## Data Flow

### Conversion Pattern

The application maintains separate types for in-memory usage and database storage:

**In-memory types** (src/types/blocks.ts):
- Use numeric IDs for blocks and sets
- Optimized for reactivity and UI rendering
- No `orderIndex` (array position determines order)

**Database types** (src/db/schema.ts):
- Prefixed with `Db`
- Use string IDs (UUIDs)
- Include `orderIndex` for explicit ordering
- Use `null` instead of `undefined`

**Converters** (src/db/converters.ts):
- `workoutToDb()`: Convert in-memory `Workout` to `DbActiveWorkout`
- `dbToWorkout()`: Convert `DbActiveWorkout` to in-memory `Workout`
- Block-specific converters handle each block type
- Automatic sorting by `orderIndex` on read

### Save Strategy

Active workout auto-saves use debouncing:

1. User modifies workout state
2. State updates in `useWorkout` composable
3. Auto-save debounces at `autoSaveInterval` (default 1000ms)
4. Repository converts and saves to IndexedDB
5. `lastModifiedAt` timestamp updated automatically

### Completing Workouts

When completing a workout (src/db/interfaces.ts:229):

```typescript
// Transaction ensures atomic operation
const completed = await workoutsRepository.completeWorkout(activeWorkout, notes)
// 1. Creates DbCompletedWorkout with completion timestamp
// 2. Saves to workouts table
// 3. Deletes from activeWorkout table
// 4. All in single transaction
```

## Repository Pattern

Access all database operations through repository interfaces (src/db/interfaces.ts):

### Available Repositories

```typescript
// Get repository instances
import {
  getActiveWorkoutRepository,
  getWorkoutsRepository,
  getTemplatesRepository,
  getCustomExercisesRepository,
  getSettingsRepository,
  getDataManagementRepository,
} from '@/db'
```

### Example Usage

**Active Workout:**

```typescript
const repo = getActiveWorkoutRepository()

// Load current workout
const current = await repo.get()

// Save workout (auto-updates lastModifiedAt)
await repo.save(dbWorkout)

// Clear active workout
await repo.clear()

// Check if workout exists
const hasActive = await repo.exists()
```

**Completed Workouts:**

```typescript
const repo = getWorkoutsRepository()

// Get workout history (pagination)
const history = await repo.getHistory({ limit: 20, offset: 0 })

// Get workouts in date range
const recent = await repo.getByDateRange({
  startDate: Date.now() - 7 * 24 * 60 * 60 * 1000,  // Last 7 days
  endDate: Date.now(),
})

// Complete active workout
const completed = await repo.completeWorkout(activeWorkout, 'Great session!')

// Start from completed workout
const newActive = await repo.startFromCompleted(workoutId)
```

**Templates:**

```typescript
const repo = getTemplatesRepository()

// Create template from active workout
const template = await repo.createFromWorkout(activeWorkout, 'My Template')

// Start workout from template (updates lastUsedAt)
const workout = await repo.startFromTemplate(templateId)

// Get all templates (sorted by lastUsedAt)
const templates = await repo.getAll()
```

**Settings:**

```typescript
const repo = getSettingsRepository()

// Get with type-safe defaults
const theme = await repo.get('theme')  // Returns 'light' | 'dark' | 'system'
const restTimer = await repo.get('defaultRestTimer')  // Returns number

// Set value
await repo.set({ key: 'theme', value: 'dark' })

// Get all with defaults merged
const allSettings = await repo.getAll()

// Reset to default
await repo.reset('theme')
```

## Data Export/Import

**Type:** `ExportDataContents` (src/db/interfaces.ts:268)

```typescript
const dataRepo = getDataManagementRepository()

// Export all user data
const backup = await dataRepo.exportAll()
// Returns: {
//   settings: DbUserSetting[],
//   customExercises: DbCustomExercise[],
//   templates: DbWorkoutTemplate[],
//   workouts: DbCompletedWorkout[]
// }

// Import (replaces all data in transaction)
await dataRepo.importAll(backup)

// Delete everything
await dataRepo.deleteAll()
```

**Note:** Active workout is excluded from exports to avoid confusion.

## Key Design Decisions

### 1. Denormalization

Blocks and exercises are **embedded** in workouts/templates rather than referenced:

**Rationale:**
- Captures exercise data snapshot at workout time
- Prevents historical data corruption if exercise definitions change
- Simplifies queries (no joins needed)
- Better offline performance

**Trade-off:**
- Larger storage footprint
- Exercise updates don't propagate to past workouts (intentional)

### 2. Singleton Active Workout

Only one workout can be "active" at a time (id = `'current'`):

**Rationale:**
- Simplifies UI state management
- Matches real-world usage (one workout at a time)
- Prevents data inconsistencies
- Clear intent of what user is working on

### 3. Discriminated Unions

All blocks use discriminated unions with `kind` property:

**Rationale:**
- Type-safe block handling in TypeScript
- Exhaustive switch checking at compile time
- Clear block type identification
- Easy extensibility for new block types

### 4. String Storage for Numeric Fields

Sets store `kg`, `reps`, `rir` as strings:

**Rationale:**
- Preserves user input format (e.g., "100.5" vs "100.50")
- Avoids float precision issues
- Allows empty string for "not set yet"
- Validation happens at component level

### 5. Timestamp-based Ordering

All collections sort by timestamps:

**Rationale:**
- Natural sort order for users
- Efficient IndexedDB indexing
- No manual reordering logic needed
- Clear temporal relationships

## Testing

**Database isolation** (src/__tests__/setup.ts):

```typescript
import { resetDatabase } from '@/__tests__/setup'

beforeEach(async () => {
  await resetDatabase()
})
```

Uses `fake-indexeddb` for all tests - no real IndexedDB needed.

## Schema Versioning

Dexie handles schema migrations automatically. When adding new fields:

1. Update TypeScript types in `src/db/schema.ts`
2. Add database schema version in Dexie configuration
3. Provide migration function if needed
4. Test migration with production data backup

Current version: Check `src/db/implementations/dexie/database.ts`

## Performance Considerations

**Indexes:**
- `workouts.completedAt` - Fast history queries
- `templates.lastUsedAt` - Fast template sorting
- `customExercises.name` - Fast name lookups

**Optimization strategies:**
- Paginated history queries (`limit`/`offset`)
- Debounced auto-save to reduce write frequency
- Batch operations wrapped in transactions
- Cached repository instances (singleton pattern)

## Related Documentation

- **Architecture:** `docs/agent/architecture.md` - Dependency rules and boundaries
- **Testing:** `docs/agent/testing.md` - Test helpers and factories
- **Composables:** `docs/agent/composables.md` - useWorkout state management
