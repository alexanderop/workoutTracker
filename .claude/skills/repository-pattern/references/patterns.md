# Repository Pattern Catalog

Detailed pattern reference organized by category.

## Table of Contents
1. [Error Handling Patterns](#error-handling-patterns)
2. [CRUD Patterns](#crud-patterns)
3. [Type Transformation Patterns](#type-transformation-patterns)
4. [Advanced Patterns](#advanced-patterns)
5. [Schema Design Patterns](#schema-design-patterns)

---

## Error Handling Patterns

### Pattern 1: Direct Throw (Older Pattern)

**When to use:** Simple operations where error context is obvious.

**Example from CustomExercises:**
```typescript
async update(
  id: string,
  updates: Partial<Omit<DbCustomExercise, 'id' | 'createdAt'>>,
): Promise<void> {
  const updated = await db.customExercises.update(id, {
    ...updates,
    updatedAt: Date.now(),
  })
  if (updated === 0) {
    throw createDatabaseError('NOT_FOUND', 'update custom exercise')
  }
}
```

**Characteristics:**
- No explicit error catching
- Check update count for NOT_FOUND
- Simple error messages
- Allows native exceptions to bubble up

---

### Pattern 2: tryCatch Wrapper (Newer Pattern - Preferred)

**When to use:** All new repositories (current standard).

**Example from Benchmarks:**
```typescript
async update(
  id: string,
  updates: Partial<Omit<DbBenchmark, 'id' | 'createdAt'>>,
): Promise<void> {
  const [error, updatedCount] = await tryCatch(
    db.benchmarks.update(id, updates),
  )

  if (error) {
    throw createDatabaseError('SAVE_FAILED', `update benchmark with id ${id}`, error)
  }

  if (updatedCount === 0) {
    throw createDatabaseError('NOT_FOUND', `benchmark with id ${id} not found`)
  }
}
```

**Characteristics:**
- Explicit error handling via tryCatch
- Two-phase error checking: operation failure + not found
- Descriptive error messages with context
- Original error passed as cause
- Error-first tuple: `[Error, null] | [null, T]`

**Standard pattern:**
```typescript
const [error, result] = await tryCatch(operation)
if (error) {
  throw createDatabaseError('ERROR_CODE', 'operation description', error)
}
// Use result
```

---

### DatabaseError Codes

```typescript
type DatabaseErrorCode =
  | 'SAVE_FAILED'   // Create, update, delete operations
  | 'LOAD_FAILED'   // Read operations
  | 'NOT_FOUND'     // Entity doesn't exist
```

**Usage:**
```typescript
createDatabaseError(code, operation, originalCause?)
```

---

## CRUD Patterns

### Standard getAll()

**Pattern:**
```typescript
async getAll(): Promise<ReadonlyArray<DbEntity>> {
  const [error, entities] = await tryCatch(
    db.entities.orderBy('createdAt').reverse().toArray(),
  )
  if (error) {
    throw createDatabaseError('LOAD_FAILED', 'retrieve entities', error)
  }
  return entities
}
```

**Common orderings:**
- `orderBy('createdAt').reverse()` - Newest first
- `orderBy('name')` - Alphabetical
- `orderBy('useCount').reverse()` - Most used first
- `orderBy('lastUsedAt').reverse()` - Recently used first

---

### Standard getById()

**Pattern:**
```typescript
async getById(id: string): Promise<DbEntity | undefined> {
  const [error, entity] = await tryCatch(db.entities.get(id))
  if (error) {
    throw createDatabaseError('LOAD_FAILED', `retrieve entity with id ${id}`, error)
  }
  return entity
}
```

**Returns:** `undefined` if not found (does NOT throw).

---

### Standard create()

**Pattern:**
```typescript
async create(
  entity: Omit<DbEntity, 'id' | 'createdAt'>,
): Promise<DbEntity> {
  const newEntity: DbEntity = {
    ...entity,
    id: generateId(),
    createdAt: Date.now(),
  }

  const [error] = await tryCatch(db.entities.add(newEntity))
  if (error) {
    throw createDatabaseError('SAVE_FAILED', 'create entity', error)
  }

  return newEntity
}
```

**Key points:**
- Generate ID via `generateId()` (crypto.randomUUID())
- Inject `createdAt: Date.now()`
- Return the created entity
- Use `add()` not `put()` (fails if ID exists)

---

### Standard update()

**Pattern:**
```typescript
async update(
  id: string,
  updates: Partial<Omit<DbEntity, 'id' | 'createdAt'>>,
): Promise<void> {
  const [error, updatedCount] = await tryCatch(
    db.entities.update(id, {
      ...updates,
      updatedAt: Date.now(),
    }),
  )

  if (error) {
    throw createDatabaseError('SAVE_FAILED', `update entity with id ${id}`, error)
  }

  if (updatedCount === 0) {
    throw createDatabaseError('NOT_FOUND', `entity with id ${id} not found`)
  }
}
```

**Key points:**
- Inject `updatedAt: Date.now()` automatically
- Exclude `id` and `createdAt` from updates
- Check for NOT_FOUND via count
- Returns void

---

### Soft Delete Pattern

**Pattern:**
```typescript
async delete(id: string): Promise<void> {
  const [error] = await tryCatch(db.entities.delete(id))
  if (error) {
    throw createDatabaseError('SAVE_FAILED', `delete entity with id ${id}`, error)
  }
  // Does NOT throw if entity doesn't exist
}
```

**Characteristics:**
- Silent success even if entity doesn't exist
- No NOT_FOUND check on delete count
- Use when deletion is idempotent

---

### Timestamp Injection

**Automatic timestamp fields:**
- `createdAt: Date.now()` - Set on creation only
- `updatedAt: Date.now()` - Set on update only
- `lastUsedAt: Date.now()` - Set when entity is accessed/used
- `lastModifiedAt: Date.now()` - Set on any modification

**Example:**
```typescript
async create(entity: Omit<DbEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<DbEntity> {
  const newEntity: DbEntity = {
    ...entity,
    id: generateId(),
    createdAt: Date.now(),
    updatedAt: null,  // null until first update
  }
  await db.entities.add(newEntity)
  return newEntity
}
```

---

### Case-Insensitive Queries

**Pattern:**
```typescript
async existsByName(name: string): Promise<boolean> {
  const count = await db.entities.where('name').equalsIgnoreCase(name).count()
  return count > 0
}

async searchByName(query: string): Promise<ReadonlyArray<DbEntity>> {
  const lowerQuery = query.toLowerCase()
  return db.entities
    .filter((entity) => entity.name.toLowerCase().includes(lowerQuery))
    .toArray()
}
```

**Note:** Dexie's `equalsIgnoreCase()` only works with indexed fields. For non-indexed fields, use client-side filtering.

---

## Type Transformation Patterns

### Pattern: Helper Utilities for Conversion

**When to use:** Converting between related but structurally different types (e.g., templates ↔ workouts).

**Example from Templates repository:**
```typescript
/**
 * Converts template exercises to workout exercises with generated IDs.
 */
function templateExercisesToWorkoutExercises(
  templateExercises: ReadonlyArray<DbTemplateBlockExercise>,
): ReadonlyArray<DbBlockExercise> {
  return templateExercises.map((te) => ({
    id: generateId(),
    name: te.name,
    prescribedReps: te.prescribedReps,
    load: te.load,
    thumbnail: te.thumbnail,
  }))
}

/**
 * Converts workout block to template block (removes IDs, extracts structure).
 */
function workoutBlockToTemplateBlock(block: DbWorkoutBlock): DbTemplateBlock {
  switch (block.kind) {
    case 'strength':
      return {
        kind: 'strength',
        exerciseDefinitionId: block.exerciseDefinitionId,
        name: block.name,
        equipment: block.equipment,
        targetReps: block.targetReps,
        thumbnail: block.thumbnail,
        defaultSetCount: block.sets.length,
      }
    case 'emom':
      return {
        kind: 'emom',
        config: block.config,
        exercises: block.exercises.map(workoutExerciseToTemplateExercise),
      }
    // ... other cases
    default: {
      const _exhaustive: never = block
      throw new Error(`Unhandled block kind: ${JSON.stringify(_exhaustive)}`)
    }
  }
}
```

**Characteristics:**
- Private helper functions within repository file
- Exhaustive switch with `never` type for safety
- ID generation on conversion to workout types
- Removal of runtime data (IDs, results) when converting to templates

---

### Pattern: Deep Cloning with ID Regeneration

**When to use:** Creating new instances from existing data (e.g., "start from template", "repeat workout").

**Example from Workouts repository:**
```typescript
async startFromCompleted(workoutId: string): Promise<void> {
  const workout = await db.workouts.get(workoutId)
  if (!workout) {
    throw createDatabaseError('NOT_FOUND', 'start from completed workout')
  }

  const activeWorkout: DbActiveWorkout = {
    id: 'current',
    name: workout.name,
    blocks: workout.blocks.map((block) => {
      switch (block.kind) {
        case 'strength':
          return {
            ...block,
            id: generateId(),
            sets: block.sets.map((set) => ({
              ...set,
              id: generateId(),
              status: 'planned',
              completedAt: null,
            })),
          }
        case 'emom':
        case 'amrap':
        case 'tabata':
        case 'fortime':
          return {
            ...block,
            id: generateId(),
            result: null,
            exercises: block.exercises.map((ex) => ({
              ...ex,
              id: generateId(),
            })),
          }
        default: {
          const _exhaustive: never = block
          throw new Error(`Unhandled block: ${JSON.stringify(_exhaustive)}`)
        }
      }
    }),
    selectedBlockIndex: 0,
    startedAt: Date.now(),
    lastModifiedAt: Date.now(),
    mode: 'workout',
    activeSetIndex: null,
  }

  await db.activeWorkout.put(activeWorkout)
}
```

**Characteristics:**
- Deep clone with structural recursion
- Regenerate all IDs
- Reset state fields (`status: 'planned'`, `result: null`, `completedAt: null`)
- Inject new timestamps
- Exhaustive type checking

---

## Advanced Patterns

### Pattern: Function Overloads for Type Safety

**When to use:** Key-based access where return type depends on key (e.g., settings).

**Example from Settings repository:**
```typescript
// Interface with overloads
export type SettingsRepository = {
  get(key: 'theme'): Promise<'light' | 'dark' | 'system'>
  get(key: 'defaultRestTimer'): Promise<number>
  get(key: 'weightUnit'): Promise<'kg' | 'lbs'>
  get(key: UserSettingKey): Promise<SettingValue>

  getAll(): Promise<SettingDefaults>
  set<K extends UserSettingKey>(key: K, value: SettingDefaults[K]): Promise<void>
}

// Implementation with discriminated union narrowing
async get(key: UserSettingKey): Promise<SettingValue> {
  const setting = await db.settings.get(key)
  if (!setting) {
    switch (key) {
      case 'theme':
        return defaultSettings.theme
      case 'defaultRestTimer':
        return defaultSettings.defaultRestTimer
      // ... other cases
      default:
        throw new Error(`Unknown setting key: ${key}`)
    }
  }

  // Narrow discriminated union
  switch (setting.key) {
    case 'theme':
      return setting.value  // Type: 'light' | 'dark' | 'system'
    case 'defaultRestTimer':
      return setting.value  // Type: number
    // ... other cases
    default:
      throw new Error(`Unknown setting key: ${setting.key}`)
  }
}
```

**Type definitions:**
```typescript
export type SettingDefaults = {
  theme: 'light' | 'dark' | 'system'
  defaultRestTimer: number
  weightUnit: 'kg' | 'lbs'
  // ...
}

export type DbUserSetting =
  | { key: 'theme'; value: 'light' | 'dark' | 'system' }
  | { key: 'defaultRestTimer'; value: number }
  | { key: 'weightUnit'; value: 'kg' | 'lbs' }
  // ...

export type UserSettingKey = DbUserSetting['key']
export type SettingValue = DbUserSetting['value']
```

---

### Pattern: Singleton Repository

**When to use:** Only one instance should exist (e.g., active workout).

**Example from ActiveWorkout repository:**
```typescript
// Schema type with fixed ID
export type DbActiveWorkout = {
  id: 'current'  // Always 'current'
  name: string
  blocks: ReadonlyArray<DbWorkoutBlock>
  // ...
}

// Table definition with string literal as ID
activeWorkout!: Table<DbActiveWorkout, 'current'>

// Repository implementation
async get(): Promise<DbActiveWorkout | undefined> {
  return db.activeWorkout.get('current')
}

async save(workout: DbActiveWorkout): Promise<void> {
  await db.activeWorkout.put(workout)  // put() for upsert
}
```

**Characteristics:**
- Fixed ID as string literal type
- Use `put()` instead of `add()` for upsert semantics
- No `getAll()` or `getById()` methods

---

### Pattern: Transaction Handling

**When to use:** Multiple table operations that must succeed/fail together.

**Example from Tags repository:**
```typescript
async attachToWorkout(tagId: string, workoutId: string): Promise<void> {
  const [error] = await tryCatch(
    db.transaction('rw', [db.workoutTags, db.tags], async () => {
      // Add junction record
      const junction: DbWorkoutTag = { workoutId, tagId }
      await db.workoutTags.add(junction)

      // Increment use count atomically
      await db.tags.update(tagId, (tag) => {
        tag.useCount += 1
        return tag
      })
    }),
  )

  if (error) {
    throw createDatabaseError('SAVE_FAILED', 'attach tag to workout', error)
  }
}
```

**Transaction signature:**
```typescript
db.transaction(
  mode: 'r' | 'rw',           // Read-only or read-write
  tables: Array<Table>,        // Tables involved
  callback: async () => void,
)
```

**Characteristics:**
- Atomic: all operations succeed or all fail
- Wrap entire transaction in tryCatch
- List all tables accessed in transaction

---

### Pattern: Bulk Operations

**When to use:** Operating on multiple entities at once (import/export, batch delete).

**Example from DataManagement repository:**
```typescript
async exportAll(): Promise<DbExportData> {
  const [customExercises, workouts, templates, settings, benchmarks] = await Promise.all([
    db.customExercises.toArray(),
    db.workouts.toArray(),
    db.templates.toArray(),
    db.settings.toArray(),
    db.benchmarks.toArray(),
  ])

  return {
    customExercises,
    workouts,
    templates,
    settings,
    benchmarks,
  }
}

async importAll(data: DbExportData): Promise<void> {
  await db.transaction('rw', [db.customExercises, db.workouts, ...], async () => {
    await db.customExercises.clear()
    await db.workouts.clear()
    // ... clear all tables

    if (data.customExercises.length > 0) {
      await db.customExercises.bulkAdd(data.customExercises)
    }
    if (data.workouts.length > 0) {
      await db.workouts.bulkAdd(data.workouts)
    }
    // ... bulk add all data
  })
}
```

**Characteristics:**
- Use `Promise.all()` for parallel reads
- Use transactions for bulk writes
- Check array length before `bulkAdd()` (fails on empty arrays)
- Use `clear()` for bulk delete

---

### Pattern: Usage Tracking

**When to use:** Tracking when entities are used (templates, tags).

**Example from Templates repository:**
```typescript
async startFromTemplate(templateId: string): Promise<void> {
  const template = await db.templates.get(templateId)
  if (!template) {
    throw createDatabaseError('NOT_FOUND', 'start from template')
  }

  // Update usage tracking
  await db.templates.update(templateId, {
    lastUsedAt: Date.now(),
  })

  // Convert template to active workout
  const activeWorkout: DbActiveWorkout = {
    id: 'current',
    name: template.name,
    blocks: template.blocks.map(templateBlockToWorkoutBlock),
    // ...
  }

  await db.activeWorkout.put(activeWorkout)
}
```

**Characteristics:**
- Update `lastUsedAt` timestamp when entity is accessed
- Can sort by `lastUsedAt` to show recently used
- Useful for autocomplete/suggestions

---

## Schema Design Patterns

### Pattern: Discriminated Unions

**When to use:** Variants of same concept with different structure (block types, settings, events).

**Example:**
```typescript
export type DbWorkoutBlock =
  | DbStrengthBlock
  | DbEmomBlock
  | DbAmrapBlock
  | DbTabataBlock
  | DbForTimeBlock

export type DbStrengthBlock = {
  kind: 'strength'  // Discriminant
  id: string
  // ... strength-specific fields
}

export type DbEmomBlock = {
  kind: 'emom'  // Discriminant
  id: string
  config: DbEmomConfig
  // ... emom-specific fields
}
```

**Type guard:**
```typescript
export function isDbStrengthBlock(block: DbWorkoutBlock): block is DbStrengthBlock {
  return block.kind === 'strength'
}
```

**Exhaustiveness checking:**
```typescript
function processBlock(block: DbWorkoutBlock) {
  switch (block.kind) {
    case 'strength':
      // handle strength
      break
    case 'emom':
      // handle emom
      break
    // ... other cases
    default: {
      const _exhaustive: never = block
      throw new Error(`Unhandled block: ${JSON.stringify(_exhaustive)}`)
    }
  }
}
```

---

### Pattern: String Storage for Numeric Inputs

**When to use:** User input that needs flexible entry (empty, decimal, calculations).

**Example:**
```typescript
export type DbSet = {
  id: string
  kg: string      // Not number!
  reps: string    // Not number!
  rir: string     // Not number!
  status: SetStatus
  completedAt: number | null
}
```

**Rationale:**
- Allows empty string during input
- Preserves decimal points while typing
- Can show "100.5" instead of "100.50000001"
- Convert to number only when needed for calculations

---

### Pattern: Null vs Undefined

**Convention:** Database uses `null` for "no value", not `undefined`.

**Example:**
```typescript
export type DbCustomExercise = {
  id: string
  name: string
  equipment: Equipment | null    // Use null
  muscle: Muscle | null          // Use null
  updatedAt: number | null       // null until first update
}
```

**Rationale:**
- IndexedDB stores null but not undefined
- Explicit about missing values in JSON
- Consistent with SQL conventions

---

### Pattern: Indexing Strategy

**When to index:**
- Primary key (automatic)
- Foreign keys for joins
- Sort fields (createdAt, name, useCount)
- Filter fields (status, type)

**Example:**
```typescript
this.version(2).stores({
  customExercises: 'id, name, muscle, equipment, createdAt',
  workouts: 'id, startedAt, completedAt, benchmarkId',
  templates: 'id, name, createdAt, lastUsedAt',
  tags: 'id, name, useCount',
  workoutTags: '[workoutId+tagId], workoutId, tagId',  // Compound key
})
```

**Guidelines:**
- Index fields used in `where()`, `orderBy()`, `equals()`
- Don't over-index (impacts write performance)
- Compound indexes for junction tables: `[field1+field2]`

---

### Pattern: Embedded vs Referenced Data

**Embedded:** Data stored within parent (sets in exercises, exercises in blocks)
```typescript
export type DbWorkoutExercise = {
  id: string
  name: string
  sets: ReadonlyArray<DbSet>  // Embedded
}
```

**Referenced:** Data stored in separate table with foreign key
```typescript
export type DbWorkoutTag = {
  workoutId: string  // Foreign key
  tagId: string      // Foreign key
}
```

**Guidelines:**
- **Embed** when data has 1:many relationship and child doesn't exist independently
- **Reference** when data has many:many or data is shared across parents
- **Snapshot** when embedding historical data (workout exercises snapshot exercise definition)
