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

The application uses 12 tables (current schema version: 6):

| Table | Primary Key | Purpose |
|-------|-------------|---------|
| `activeWorkout` | `'current'` (singleton) | Stores the single in-progress workout |
| `workouts` | `id` (UUID) | Completed workout history |
| `templates` | `id` (UUID) | Reusable workout templates |
| `customExercises` | `id` (UUID) | User-defined exercises |
| `settings` | `key` | User preferences and configuration |
| `activeBenchmark` | `'current-benchmark'` (singleton) | In-progress benchmark workout |
| `benchmarks` | `id` (UUID) | Benchmark workout definitions |
| `weightEntries` | `id` (UUID) | Daily body weight entries |
| `drafts` | `key` (unique) | Auto-saved form drafts |
| `progressions` | `id` (UUID) | Kettlebell swing progression plans |
| `progressionSessions` | `id` (UUID) | Individual progression sessions |
| `onboarding` | `'onboarding'` (singleton) | First-time user onboarding state |

## Core Data Types

### Active Workout

**Type:** `DbActiveWorkout` (src/db/schema.ts)

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
  activeExerciseIndex: number | null           // Currently active exercise index
  benchmarkId: string | null                   // Linked benchmark (if benchmark workout)
  globalTimerStartedAt: number | null          // Global timer start timestamp
}
```

**Key characteristics:**
- Only one active workout exists at a time
- Automatically updated on every workout state change
- Contains embedded blocks with full exercise data
- Cleared when workout completes

### Completed Workout

**Type:** `DbCompletedWorkout` (src/db/schema.ts)

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
  benchmarkId: string | null                   // Linked benchmark (if applicable)
}
```

**Storage approach:**
- Blocks are embedded (denormalized)
- Contains snapshot of exercise data at completion time
- Sorted by `completedAt` descending (newest first)

### Workout Blocks

**Discriminated Union:** `DbWorkoutBlock = DbStrengthBlock | DbEmomBlock | DbAmrapBlock | DbTabataBlock | DbForTimeBlock | DbCardioBlock` (src/db/schema.ts)

Workouts are sequences of **blocks** differentiated by `kind` property:

#### Strength Block

**Type:** `DbStrengthBlock` (src/db/schema.ts)

Traditional strength training with sets, reps, and weights.

```typescript
type DbStrengthBlock = {
  kind: 'strength'                             // Discriminator
  id: string                                   // Block ID
  exerciseDefinitionId: string | null          // Reference to base exercise (null for ad-hoc)
  name: string                                 // Exercise name
  equipment: Equipment                         // Equipment used
  targetReps: number                           // Target reps per set
  targetDuration: number | null                // Target duration per set (seconds)
  targetWeight: number | null                  // Target weight (kg)
  image: Blob | null                           // Exercise image
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
  duration: string                             // Duration (stored as string)
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

**Type:** `DbAmrapBlock` (src/db/schema.ts)

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

**Type:** `DbEmomBlock` (src/db/schema.ts)

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

**Type:** `DbTabataBlock` (src/db/schema.ts)

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

**Type:** `DbForTimeBlock` (src/db/schema.ts)

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
  splitTimes?: ReadonlyArray<number>           // Optional per-round split times
}
```

##### Cardio Block

**Type:** `DbCardioBlock` (src/db/schema.ts)

Steady-state cardio session (run, bike, row, etc.).

```typescript
type DbCardioBlock = {
  kind: 'cardio'
  id: string
  config: DatabaseCardioConfig
  result: DbCardioResult | null
  orderIndex: number
}

type DatabaseCardioConfig = {
  activity: 'running' | 'cycling' | 'rowing' | 'elliptical' | 'swimming' | 'stairclimber' | 'walking'
  targetDurationSeconds: number | null
  targetDistanceMeters: number | null
}

type DbCardioResult = {
  actualDurationSeconds: number
  distanceMeters: number | null
  avgPaceSecondsPerKm: number | null
  calories: number | null
  notes: string | null
}
```

**Block Exercise structure:**

```typescript
type DbBlockExercise = {
  id: string                                   // Exercise ID
  name: string                                 // Exercise name
  prescribedReps: number                       // Target reps per round
  load: string | null                          // Load specification ("24kg", "bodyweight", etc.)
  image: Blob | null                           // Exercise image
}
```

### Workout Templates

**Type:** `DbWorkoutTemplate` (src/db/schema.ts)

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
  equipment: Equipment
  targetReps: number
  targetDuration: number | null
  targetWeight: number | null
  defaultSetCount: number                      // No actual sets, just default count
  image: Blob | null
}

// Timed template blocks have same structure as workout blocks
// but exercises use DbTemplateBlockExercise (no IDs, no results)
// Cardio template block: { kind: 'cardio', config: DatabaseCardioConfig }
```

### Custom Exercises

**Type:** `DbCustomExercise` (src/db/schema.ts)

User-defined exercise definitions.

```typescript
type DbCustomExercise = {
  id: string                                   // UUID
  name: string                                 // Exercise name
  equipment: Equipment | null                  // Required equipment
  muscle: Muscle | null                        // Primary muscle group
  type: ExerciseType                           // Exercise category
  metrics: Metrics                             // Tracking metrics (weight, reps, etc.)
  createdAt: number                            // Creation timestamp
  updatedAt: number                            // Last modification timestamp
  image: Blob | null                           // Exercise image (no icon/emoji field)
}
```

**Key characteristics:**
- Uses `null` instead of `undefined` for database storage
- Exercise definitions are referenced by ID in blocks
- Name must be unique (case-insensitive)
- `image` stores raw `Blob` data — there is no separate icon/emoji field

### User Settings

**Type:** `DbUserSetting` (discriminated union by `key`, src/db/schema.ts)

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
  | { key: 'timerSoundVolume'; value: number }
  | { key: 'language'; value: 'en' | 'de' }
```

**Storage approach:**
- Each setting is a separate record with discriminated union type
- Missing settings fall back to defaults defined in `SettingDefaults`
- Type-safe get/set operations via repository overloads

### Benchmarks

**Type:** `DbBenchmark` (src/db/schema.ts)

Benchmark workout definition for tracking performance over time.

```typescript
type DbBenchmark = {
  id: string
  name: string
  type: BenchmarkType
  rounds: ReadonlyArray<DbBenchmarkRound>      // Variable reps per round supported
  structureHash: string                        // Used to detect structure changes
  createdAt: number
  lastUsedAt: number | null
}

type DbBenchmarkRound = {
  orderKey: string                             // Fractional index for efficient reordering
  exercises: ReadonlyArray<DbBenchmarkRoundExercise>
}

type DbBenchmarkRoundExercise = {
  orderKey: string
  exerciseDefinitionId: string | null
  name: string
  prescribedReps: number
  image: Blob | null
}
```

Supports pyramid/ladder workouts (e.g. 40-30-20-10) where each round can have different rep counts.

### Active Benchmark Workout

**Type:** `DbActiveBenchmarkWorkout` (src/db/schema.ts)

Singleton (id is always `'current-benchmark'`) for the in-progress benchmark session.

```typescript
type DbActiveBenchmarkWorkout = {
  id: 'current-benchmark'
  name: string
  benchmarkId: string
  blocks: ReadonlyArray<DbForTimeBlock>
  selectedBlockIndex: number
  activeExerciseIndex: number
  startedAt: number
  lastModifiedAt: number
  globalTimerStartedAt: number
  mode: WorkoutMode
}
```

### Weight Entry

**Type:** `DbWeightEntry` (src/db/schema.ts)

Daily body weight record. Weight is always stored in kg; display conversion is applied at the UI layer based on user settings.

```typescript
type DbWeightEntry = {
  id: string
  weight: number       // Always stored in kg
  date: number         // Start-of-day timestamp (enforces one entry per day)
  recordedAt: number   // When the entry was actually logged
}
```

### Form Draft

**Type:** `DbFormDraft` (src/db/schema.ts)

Auto-saves creation form state so users can resume after navigating away.

```typescript
type DraftKey = 'benchmark-create' | 'template-create'

type DbFormDraft = {
  key: DraftKey
  data: unknown        // Serialized form state (JSON-compatible)
  savedAt: number      // Timestamp of last save
}
```

The `drafts` table uses `&key` as its primary key (unique constraint, not auto-increment).

### Progression

**Type:** `DbProgression` and `DbProgressionSession` (src/db/schema.ts)

Kettlebell swing progression plan with automatic advancement through reps → time → weight phases.

```typescript
type DbProgression = {
  id: string
  name: string
  availableWeights: ReadonlyArray<number>      // e.g. [12, 16, 20, 24] kg
  currentWeightIndex: number                   // Which KB we're on
  currentReps: number                          // 10–20
  currentMinutes: number                       // 10–20
  startReps: number                            // Config: starting reps (e.g. 10)
  maxReps: number                              // Config: max reps (e.g. 20)
  repIncrement: number                         // Config: reps per advancement (e.g. 2)
  startMinutes: number                         // Config: starting minutes (e.g. 10)
  maxMinutes: number                           // Config: max minutes (e.g. 20)
  minuteIncrement: number                      // Config: minutes per advancement (e.g. 2)
  sessionsCompleted: number
  isComplete: boolean                          // All KBs mastered
  createdAt: number
  lastSessionAt: number | null
}

type DbProgressionSession = {
  id: string
  progressionId: string
  weight: number       // kg used in this session
  reps: number         // target reps per minute
  minutes: number      // total EMOM minutes
  completed: boolean   // Did user complete all reps each minute?
  completedAt: number
}
```

### Onboarding

**Type:** `DbOnboarding` (src/db/schema.ts)

Singleton (id is always `'onboarding'`) for first-time user flow state.

```typescript
type DbOnboarding = {
  id: 'onboarding'
  completed: boolean
  currentStep: number
}
```

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

When completing a workout (src/db/interfaces.ts):

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
  getActiveBenchmarkWorkoutRepository,
  getWorkoutsRepository,
  getTemplatesRepository,
  getCustomExercisesRepository,
  getSettingsRepository,
  getDataManagementRepository,
  getBenchmarksRepository,
  getWeightRepository,
  getDraftsRepository,
  getProgressionsRepository,
  getOnboardingRepository,
  getExerciseProgressRepository,
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

**Type:** `ExportDataContents` (src/db/interfaces.ts)

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

Sets store `kg`, `reps`, `duration`, `rir` as strings:

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

### 6. Blob Storage for Images

Exercise images (`DbCustomExercise.image`, `DbStrengthBlock.image`, `DbBlockExercise.image`) are stored as raw `Blob` values directly in IndexedDB — not as URLs or base64 strings. There is no separate icon/emoji field.

## Testing

**Database isolation:**

```typescript
// Preferred: direct import
import { resetDatabase } from '@/__tests__/helpers/resetDatabase'

// Also works (re-exported for backward compat):
import { resetDatabase } from '@/__tests__/setup'

beforeEach(async () => {
  await resetDatabase()
})
```

Uses `fake-indexeddb` for all tests - no real IndexedDB needed.

## Schema Versioning

Dexie handles schema migrations automatically. When adding new fields:

1. Update TypeScript types in `src/db/schema.ts`
2. Add database schema version in `src/db/implementations/dexie/database.ts`
3. Provide migration function if needed
4. Test migration with production data backup

**Current version: 6** (see `src/db/implementations/dexie/database.ts`)

Version history:
- v1: Initial schema (customExercises, workouts, activeWorkout, templates, settings, benchmarks)
- v2: Added `activeBenchmark` table
- v3: Added `weightEntries` table
- v4: Added `drafts` table
- v5: Added `progressions` and `progressionSessions` tables
- v6: Added `onboarding` table

## Performance Considerations

**Indexes:**
- `workouts`: `completedAt`, `startedAt`, `benchmarkId` - Fast history and benchmark queries
- `templates`: `lastUsedAt`, `createdAt` - Fast template sorting
- `customExercises`: `name`, `muscle`, `equipment` - Fast name/filter lookups
- `weightEntries`: `date`, `recordedAt` - Fast date range queries
- `progressionSessions`: `progressionId`, `completedAt` - Fast session history per progression

**Optimization strategies:**
- Paginated history queries (`limit`/`offset`)
- Debounced auto-save to reduce write frequency
- Batch operations wrapped in transactions
- Cached repository instances (singleton pattern)

## Related Documentation

- **Architecture:** `docs/agent/architecture.md` - Dependency rules and boundaries
- **Testing:** `docs/agent/testing.md` - Test helpers and factories
- **Composables:** `docs/agent/composables.md` - useWorkout state management
