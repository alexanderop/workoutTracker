# Vue Style Guide

A concise set of conventions and best practices for building maintainable, type-safe Vue 3 applications.

## Table of Contents

- [About Guide](#about-guide)
- [TLDR](#tldr)
- [Essential Packages](#essential-packages)
- [Project Structure](#project-structure)
- [State Management](#state-management)
- [Composables](#composables)
- [Components](#components)
- [Database & Repository Layer](#database--repository-layer)
- [Error Handling](#error-handling)
- [TypeScript Conventions](#typescript-conventions)
- [Utility Patterns](#utility-patterns)
- [Domain Patterns](#domain-patterns)
- [Testing](#testing)
- [UI Components](#ui-components)
- [Code Quality](#code-quality)
- [Appendix - Routing](#appendix---routing)
- [Appendix - Internationalization](#appendix---internationalization)
- [Appendix - PWA](#appendix---pwa)
- [Appendix - Performance](#appendix---performance)
- [Appendix - Environment Variables](#appendix---environment-variables)
- [Quick Reference](#quick-reference)

---

## About Guide

### What

This guide enforces the majority of rules using ESLint, TypeScript, and Prettier. Design and architectural decisions that cannot be automated are described in the conventions below.

### Why

- Consistent codebase leads to faster development cycles
- No code style debates during reviews
- Saves team time and energy
- New contributors can onboard quickly

### Disclaimer

This guide is opinionated. Adapt conventions to your team's needs while maintaining consistency.

### Requirements

- Vue 3.5+
- TypeScript strict mode
- Vite
- VueUse (required)
- ESLint 9 flat config with `@vue/eslint-config-typescript`

---

## TLDR

- Use `createGlobalState()` from VueUse instead of Pinia. [⭣](#state-management)
- Strive for data immutability with `Readonly` and `ReadonlyArray`. [⭣](#typescript-conventions)
- Embrace discriminated unions for state over boolean flags. [⭣](#composables)
- Use `tryCatch()` utility instead of native try/catch. [⭣](#error-handling)
- Features must not import from other features. [⭣](#project-structure)
- Test through the UI with integration tests. [⭣](#testing)
- Always check VueUse before implementing utility composables. [⭣](#essential-packages)

---

## Essential Packages

### VueUse (Required)

VueUse is the standard utility library for Vue 3 Composition API. Install it in every Vue project.

```bash
pnpm add @vueuse/core
```

**Key utilities:**

| Utility | Purpose |
|---------|---------|
| `createGlobalState` | Singleton state pattern (Pinia replacement) |
| `watchDebounced` | Debounced watchers for form auto-save |
| `useLocalStorage` | Reactive browser storage |
| `useDark` | Theme management |
| `useEventListener` | Auto-cleanup event listeners |
| `toValue` | Flexible composable arguments |
| `useSwipe` | Touch interactions for mobile |
| `useMediaQuery` | Responsive logic in JavaScript |
| `useOnline` | Network status detection |

Always check VueUse before implementing utility composables.

```typescript
// ❌ Avoid reinventing utilities
const isOnline = ref(navigator.onLine)
window.addEventListener('online', () => isOnline.value = true)
window.addEventListener('offline', () => isOnline.value = false)

// ✅ Use VueUse
import { useOnline } from '@vueuse/core'
const isOnline = useOnline()
```

### Other Dependencies

```json
{
  "dependencies": {
    "@vueuse/core": "^14.0.0",
    "vue": "^3.5.0",
    "vue-router": "^4.0.0",
    "zod": "^4.0.0",
    "date-fns": "^4.0.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^3.0.0"
  }
}
```

---

## Project Structure

```
src/
├── features/           # Self-contained feature modules
│   └── [feature]/
│       ├── components/ # Feature-specific components
│       ├── composables/# Feature-specific logic
│       ├── lib/        # Feature utilities (pure functions)
│       ├── state/      # Feature-scoped global state
│       └── views/      # Route-level pages
├── components/
│   ├── ui/            # Primitives (shadcn-vue)
│   └── [shared]/      # Shared composite components
├── composables/        # App-wide shared composables
├── stores/            # Global state (createGlobalState)
├── db/                # Database layer
│   ├── interfaces.ts  # Repository contracts
│   ├── schema.ts      # Database entity types
│   ├── converters.ts  # Domain ↔ DB conversion
│   └── implementations/
├── lib/               # Pure utility functions
├── types/             # Shared type definitions
├── views/             # Route-level pages
└── router/            # Route configuration
```

### Feature Isolation

Features must not import from other features 📏 Rule

Features are self-contained units. Shared code goes in `composables/`, `lib/`, or `components/`.

```typescript
// ✅ Feature imports shared code
// features/workout/composables/useWorkout.ts
import { useFormDraft } from '@/composables/useFormDraft'
import { getWorkoutsRepository } from '@/db'

// ❌ Feature imports another feature
// features/workout/composables/useWorkout.ts
import { useTemplates } from '@/features/templates' // Error
```

---

## State Management

### Use `createGlobalState` from VueUse

Avoid Pinia. `createGlobalState` is simpler and leverages Vue's existing reactivity.

Benefits:
- Returns a singleton reactive object
- No additional concepts ($patch, $reset duplication)
- Smaller bundle size
- Standard Vue reactivity

```typescript
// stores/settings.ts
import { createGlobalState } from '@vueuse/core'
import { reactive, ref } from 'vue'

export const useSettingsStore = createGlobalState(() => {
  const weightUnit = ref<WeightUnit>('kg')
  const theme = ref<Theme>('system')

  async function setWeightUnit(unit: WeightUnit): Promise<void> {
    weightUnit.value = unit
    await getSettingsRepository().set({ key: 'weightUnit', value: unit })
  }

  function $reset(): void {
    weightUnit.value = 'kg'
    theme.value = 'system'
  }

  return reactive({
    weightUnit,
    theme,
    setWeightUnit,
    $reset,
  })
})
```

### State Patterns

**Pattern 1: Global Store with DB Persistence**

Use when state needs to survive page refresh.

```typescript
export const useSettingsStore = createGlobalState(() => {
  const language = ref<Language>('en')

  async function loadFromDatabase(): Promise<void> {
    const settings = await getSettingsRepository().getAll()
    language.value = settings.language
  }

  return reactive({ language, loadFromDatabase, $reset })
})
```

**Pattern 2: Simple Singleton Ref**

Use for app-wide state without persistence.

```typescript
// stores/workoutState.ts
const workout = ref<Workout>(createInitialWorkout())

export function getWorkoutRef() { return workout }
export function resetWorkout(): void {
  workout.value = createInitialWorkout()
}
```

**Pattern 3: Feature-Scoped State**

Use for state relevant only within a feature.

```typescript
// features/benchmarks/state/benchmarkState.ts
const currentBenchmark = ref<Benchmark | null>(null)

export function useBenchmarkState() {
  return { currentBenchmark, setBenchmark, clearBenchmark }
}
```

### Include `$reset` for Testing

Every store must expose a `$reset` method for test isolation.

```typescript
function $reset(): void {
  weightUnit.value = 'kg'
  theme.value = 'system'
}
```

---

## Composables

Composables are the primary abstraction for reusable reactive logic.

### Naming

Composables must be prefixed with `use` 📏 Rule

```typescript
// ✅ Use
useFormDraft()
useDialogState()
useWeightEntries()

// ❌ Avoid
formDraft()
FormDraftHook()
```

### Structure

```typescript
export function useFeatureName(config?: Config) {
  // 1. Reactive state
  const state = ref<State>({ status: 'idle' })

  // 2. Computed properties
  const isLoading = computed(() => state.value.status === 'loading')

  // 3. Pure helper functions
  function transformData(data: Data): TransformedData {
    return /* pure transformation */
  }

  // 4. Methods that modify state
  async function loadData(): Promise<void> {
    state.value = { status: 'loading' }
    const [error, data] = await tryCatch(fetchData())
    state.value = error
      ? { status: 'error', error }
      : { status: 'success', data }
  }

  // 5. Lifecycle hooks
  onMounted(() => loadData())

  // 6. Return public API
  return {
    state: readonly(state),
    isLoading,
    loadData,
  }
}
```

### Discriminated Unions for State

Embrace discriminated unions over multiple boolean flags.

```typescript
// ❌ Avoid multiple flags with invalid state combinations
const isLoading = ref(false)
const hasError = ref(false)
const data = ref<Data | null>(null)

// ✅ Use discriminated union ensuring valid states
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Data }
  | { status: 'error'; error: Error }

const state = ref<State>({ status: 'idle' })
```

### State Machine Transitions

For complex stateful logic, define explicit transitions:

```typescript
const TRANSITIONS = {
  idle:      { start: 'running' },
  running:   { pause: 'paused', complete: 'completed' },
  paused:    { resume: 'running' },
  completed: {},
} as const

function transition(action: TimerAction): boolean {
  const allowed = TRANSITIONS[status.value]
  if (action in allowed) {
    status.value = allowed[action as keyof typeof allowed]
    return true
  }
  return false
}
```

### Dialog State Management

Centralize dialog state to prevent multiple dialogs opening simultaneously:

```typescript
export function useDialogState<T extends string>() {
  const activeDialog = ref<T | null>(null)

  function createDialogModel(dialogName: T): WritableComputedRef<boolean> {
    return computed({
      get: () => activeDialog.value === dialogName,
      set: (value: boolean) => {
        activeDialog.value = value ? dialogName : null
      },
    })
  }

  return { activeDialog, createDialogModel, open, close, isOpen }
}

// Usage
const { createDialogModel } = useDialogState<'edit' | 'delete' | 'confirm'>()
const editOpen = createDialogModel('edit')
const deleteOpen = createDialogModel('delete')
```

### Form Draft Persistence

Auto-save form state to prevent data loss:

```typescript
export function useFormDraft<T extends object>(
  key: DraftKey,
  formState: T | Ref<T>,
  options: { debounce?: number; isEmpty?: (state: T) => boolean } = {},
) {
  const { debounce = 1000, isEmpty } = options

  onMounted(async () => {
    const draft = await getDraftsRepository().get(key)
    if (draft) Object.assign(toValue(formState), draft)
  })

  watchDebounced(formState, async (state) => {
    if (isEmpty?.(toValue(state))) return
    await getDraftsRepository().save(key, toPlainObject(state))
  }, { debounce, deep: true })

  return { clearDraft: () => getDraftsRepository().delete(key) }
}
```

### Cleanup Pattern with `onScopeDispose`

Prevent stale writes after component unmount:

```typescript
let isDisposed = false
onScopeDispose(() => {
  isDisposed = true
})

watchDebounced(formState, async (state) => {
  if (isDisposed) return // Guard against post-unmount writes
  await save(state)
}, { debounce: 1000, deep: true })
```

### `shallowRef` for Complex Objects

Use `shallowRef` when deep reactivity tracking is unnecessary:

```typescript
import { shallowRef } from 'vue'

// Only triggers on .value reassignment, not nested property changes
const block = shallowRef<EmomBlock | null>(null)
const serverVersion = shallowRef<VersionInfo | null>(null)

// ✅ Triggers reactivity
block.value = newBlock

// ❌ Does NOT trigger (intentionally)
block.value.exercises[0].name = 'Updated'
```

### Factory Composables

Create reusable composable factories for generic patterns:

```typescript
export function createPersistenceCore<TDomain, TDatabase>(
  config: PersistenceConfig<TDomain, TDatabase>,
) {
  const state = ref<PersistenceState>({ status: 'idle' })

  async function save(): Promise<void> {
    state.value = { status: 'saving' }
    const [error] = await tryCatch(config.repository.save(config.toDb()))
    state.value = error ? { status: 'error', error } : { status: 'idle' }
  }

  return { state: readonly(state), save, load }
}
```

### `MaybeRefOrGetter` for Flexible Arguments

Accept refs, getters, or raw values using `MaybeRefOrGetter`:

```typescript
import { toValue, type MaybeRefOrGetter } from 'vue'

export function useAnimatedCounter(
  target: MaybeRefOrGetter<number>,
  options: { duration?: number } = {},
) {
  const source = ref(0)

  // toValue() unwraps refs, calls getters, or returns raw values
  watch(() => toValue(target), (newTarget) => {
    source.value = newTarget
  }, { immediate: true })

  return { displayValue: source }
}

// All these work:
useAnimatedCounter(100)
useAnimatedCounter(ref(100))
useAnimatedCounter(() => props.count)
```

### Browser Environment Guards

Guard against SSR and test environments:

```typescript
const isBrowser = typeof document !== 'undefined'

export function useScreenWakeLock() {
  function acquire(): void {
    if (!isBrowser) return // Skip in SSR/tests
    if (!('wakeLock' in navigator)) return // API not available

    navigator.wakeLock.request('screen')
  }

  return { acquire, release }
}
```

### Functional Core, Imperative Shell

Separate pure functions from reactive state management:

```typescript
// ============================================
// Pure Functions (Functional Core)
// ============================================

function filterByTimeRange(
  entries: ReadonlyArray<WeightEntry>,
  range: TimeRange,
): ReadonlyArray<WeightEntry> {
  const cutoff = getDateCutoff(range)
  return entries.filter((e) => e.date >= cutoff)
}

function calculateTrend(entries: ReadonlyArray<WeightEntry>): number {
  if (entries.length < 2) return 0
  return entries[entries.length - 1].weight - entries[0].weight
}

// ============================================
// Composable (Imperative Shell)
// ============================================

export function useWeightEntries() {
  const entries = ref<ReadonlyArray<WeightEntry>>([])
  const timeRange = ref<TimeRange>('month')

  // Pure functions used in computed
  const filteredEntries = computed(() =>
    filterByTimeRange(entries.value, timeRange.value)
  )
  const trend = computed(() => calculateTrend(filteredEntries.value))

  return { entries, timeRange, filteredEntries, trend }
}
```

---

## Components

### Script Setup with TypeScript

All components use `<script setup lang="ts">` 📏 Rule

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Set } from '@/types'

const { t } = useI18n()
</script>
```

### Props

Use `defineProps<T>()` with destructuring 📏 Rule

```typescript
type Props = {
  set: Set
  index: number
  canDelete?: boolean
  mode?: 'inline' | 'modal'
}

const {
  set,
  index,
  canDelete = true,
  mode = 'inline',
} = defineProps<Props>()
```

> **Note**
> Max 6 props per component is enforced by ESLint.

### Emits

Use `defineEmits<T>()` with typed payloads:

```typescript
type Emits = {
  'toggle-complete': [set: Set]
  'remove-set': [setId: number]
  'update-set': [setId: number, field: 'kg' | 'reps', value: number | undefined]
}

const emit = defineEmits<Emits>()
emit('update-set', set.id, 'kg', 80)
```

### Two-Way Binding

Use `defineModel` for v-model binding:

```typescript
// Dialog open state
const open = defineModel<boolean>('open', { required: true })

// Form data binding
const model = defineModel<FormData>({ required: true })
```

```vue
<!-- Parent usage -->
<MyDialog v-model:open="isDialogOpen" />
<MyForm v-model="formData" />
```

### Slots

Type your slots with `defineSlots<T>()`:

```typescript
defineSlots<{
  default: (props: { buttonClass: string }) => unknown
}>()
```

### Component Organization

```vue
<script setup lang="ts">
// 1. Imports (external, then internal)
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import type { Workout } from '@/types'

// 2. Props, emits, model, slots
const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const open = defineModel<boolean>('open')

// 3. Composables
const { t } = useI18n()
const { items, addItem } = useMyFeature()

// 4. Local state
const searchQuery = ref('')

// 5. Computed properties
const filteredItems = computed(() =>
  items.value.filter(item => item.name.includes(searchQuery.value))
)

// 6. Methods
function handleSubmit(): void {
  // ...
}

// 7. Lifecycle & watchers
onMounted(() => loadData())
watch(open, (isOpen) => {
  if (isOpen) reset()
})
</script>

<template>
  <!-- Template here -->
</template>
```

### Container vs Presentational

**Container components** handle logic, state, and side effects:

```vue
<!-- RecentWorkoutsSection.vue (Container) -->
<script setup lang="ts">
const { recentWorkouts, isLoading, loadRecent } = useRecentWorkouts(3)
const { openCardId, handleCardOpen, handleDelete } = useSwipeableDelete({
  workouts: recentWorkouts,
  onDeleted: loadRecent,
})
</script>

<template>
  <section>
    <SwipeableWorkoutCard
      v-for="workout in recentWorkouts"
      :key="workout.id"
      :is-open="openCardId === workout.id"
      @open="handleCardOpen"
      @delete="handleDelete"
    >
      <RecentWorkoutCard :workout="workout" />
    </SwipeableWorkoutCard>
  </section>
</template>
```

**Presentational components** are pure rendering:

```vue
<!-- RecentWorkoutCard.vue (Presentational) -->
<script setup lang="ts">
defineProps<{ workout: Workout }>()
</script>

<template>
  <Card>
    <CardTitle>{{ workout.name }}</CardTitle>
    <CardDescription>{{ formatDate(workout.date) }}</CardDescription>
  </Card>
</template>
```

### Computed Classes

Use `cn()` (clsx + tailwind-merge) for conditional classes:

```typescript
const rowClass = computed(() =>
  cn(
    'border-none transition-all duration-200',
    isActive.value && 'bg-primary/15',
    isCompleted.value && 'opacity-60',
  )
)
```

### Template Refs with `useTemplateRef`

Use `useTemplateRef` (Vue 3.5+) for type-safe template refs:

```typescript
import { useTemplateRef } from 'vue'

// Element ref
const scrollRef = useTemplateRef<HTMLElement>('scrollRef')

// Component ref with exposed methods
const pickerContent = useTemplateRef<InstanceType<typeof ExercisePicker>>('picker')

onMounted(() => {
  scrollRef.value?.scrollTo({ top: 0 })
  pickerContent.value?.reset() // Call exposed method
})
```

```vue
<template>
  <div ref="scrollRef">
    <ExercisePicker ref="picker" />
  </div>
</template>
```

### Generic Components

Use `generic` attribute for type-safe reusable components:

```vue
<script setup lang="ts" generic="T extends string">
type SegmentedOption<V extends string> = {
  value: V
  label: string
}

type Props = {
  options: Array<SegmentedOption<T>>
  defaultValue?: T
}

const { options, defaultValue } = defineProps<Props>()
const model = defineModel<T>()
</script>

<template>
  <div v-for="option in options" :key="option.value">
    <button @click="model = option.value">
      {{ option.label }}
    </button>
  </div>
</template>
```

Usage preserves type safety:

```vue
<!-- T is inferred as 'kg' | 'lbs' -->
<SegmentedControl
  v-model="weightUnit"
  :options="[
    { value: 'kg', label: 'Kilograms' },
    { value: 'lbs', label: 'Pounds' },
  ]"
/>
```

### Provide/Inject with `createInjectionState`

Use VueUse's `createInjectionState` for type-safe provide/inject:

```typescript
import { createInjectionState } from '@vueuse/core'

const [useProvideCarousel, useInjectCarousel] = createInjectionState(
  (props: CarouselProps) => {
    const emblaApi = ref<EmblaCarouselType | null>(null)
    const canScrollNext = ref(false)
    const canScrollPrev = ref(false)

    function scrollNext(): void {
      emblaApi.value?.scrollNext()
    }

    return { emblaApi, canScrollNext, canScrollPrev, scrollNext }
  },
)

export { useProvideCarousel }

export function useCarousel() {
  const state = useInjectCarousel()
  if (!state) {
    throw new Error('useCarousel must be used within a <Carousel />')
  }
  return state
}
```

### Attribute Inheritance Control

Use `defineOptions` to control attribute inheritance:

```vue
<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<Props>()
const delegatedProps = reactiveOmit(props, 'class', 'side')
</script>

<template>
  <DialogContent v-bind="{ ...$attrs, ...delegatedProps }">
    <slot />
  </DialogContent>
</template>
```

### Dynamic Component Strategy

Use computed maps for dynamic component selection:

```typescript
import { computed, type Component } from 'vue'

const TIMED_VIEW_COMPONENTS: Record<string, Component> = {
  amrap: WorkoutAmrapView,
  emom: WorkoutEmomView,
  tabata: WorkoutTabataView,
  fortime: WorkoutForTimeView,
}

const timedViewComponent = computed(() => {
  if (!currentBlock.value) return null
  return TIMED_VIEW_COMPONENTS[currentBlock.value.kind] ?? null
})
```

```vue
<template>
  <component
    v-if="timedViewComponent"
    :is="timedViewComponent"
    ref="timedView"
    :block="currentBlock"
    @complete="handleComplete"
  />
</template>
```

---

## Database & Repository Layer

### Repository Pattern

Abstract database access behind interfaces:

- Enables testing with mock repositories
- Allows swapping implementations (IndexedDB → REST API)
- Provides type-safe database operations

```typescript
// db/interfaces.ts
export type WorkoutsRepository = {
  getAll(): Promise<ReadonlyArray<DbWorkout>>
  getById(id: string): Promise<DbWorkout | undefined>
  add(workout: Readonly<DbWorkout>): Promise<void>
  update(id: string, updates: Partial<DbWorkout>): Promise<void>
  delete(id: string): Promise<void>
}
```

### Implementation

```typescript
// db/implementations/dexie/workouts.ts
export function createDexieWorkoutsRepository(
  database: WorkoutTrackerDatabase,
): WorkoutsRepository {
  return {
    async getAll() {
      return database.workouts.orderBy('startedAt').reverse().toArray()
    },

    async update(id, updates) {
      const updated = await database.workouts.update(id, {
        ...updates,
        updatedAt: Date.now(),
      })
      if (updated === 0) {
        throw createDatabaseError('NOT_FOUND', 'update workout')
      }
    },
  }
}
```

### Service Locator

```typescript
// db/provider.ts
let currentProvider: RepositoryProvider | null = null

export function getRepositoryProvider(): RepositoryProvider {
  if (!currentProvider) {
    currentProvider = createDexieRepositoryProvider()
  }
  return currentProvider
}

export function resetRepositoryProvider(): void {
  currentProvider = null
}

// db/index.ts
export function getWorkoutsRepository(): WorkoutsRepository {
  return getRepositoryProvider().workouts
}
```

### Type Conversion

Keep domain types clean. Database types handle persistence concerns:

```typescript
// db/schema.ts - Database types
export type DbWorkout = {
  id: string
  name: string
  startedAt: number        // Timestamps as numbers
  notes: string | null     // null for empty (Dexie convention)
}

// types/workout.ts - Domain types
export type Workout = {
  id: string
  name: string
  startedAt: Date          // Date objects in domain
  notes?: string           // undefined for empty (JS convention)
}

// db/converters.ts
export function workoutToDatabase(workout: Workout): DbWorkout {
  return {
    id: workout.id,
    name: workout.name,
    startedAt: workout.startedAt.getTime(),
    notes: workout.notes ?? null,
  }
}

export function databaseToWorkout(db: DbWorkout): Workout {
  return {
    id: db.id,
    name: db.name,
    startedAt: new Date(db.startedAt),
    notes: db.notes ?? undefined,
  }
}
```

### Partial Updates

Handle domain `undefined` ↔ database `null` conversion:

```typescript
export function buildPartialUpdate(
  updates: Record<string, unknown>,
  nullableFields: ReadonlyArray<string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const key of Object.keys(updates)) {
    const value = updates[key]
    const isNullable = nullableFields.includes(key)

    if (isNullable || value !== undefined) {
      result[key] = isNullable ? (value ?? null) : value
    }
  }

  return result
}
```

### Cross-Tab Version Change Handling

Handle database version changes from other browser tabs:

```typescript
constructor() {
  super('WorkoutTrackerDb')

  this.version(1).stores({
    workouts: 'id, startedAt, completedAt',
    activeWorkout: 'id',
  })

  // Handle version changes from other tabs
  this.on('versionchange', () => {
    this.close()
    // Optionally notify user to refresh
  })
}
```

### Singleton Pattern for Single-Document Stores

Use fixed IDs for tables that store only one document:

```typescript
// Active workout: only one can exist at a time
async get(): Promise<DbActiveWorkout | undefined> {
  return database.activeWorkout.get('current')
}

async save(workout: DbActiveWorkout): Promise<void> {
  await database.activeWorkout.put({ ...workout, id: 'current' })
}

async clear(): Promise<void> {
  await database.activeWorkout.delete('current')
}

// Other singletons
await database.activeBenchmark.get('current-benchmark')
await database.onboarding.get('onboarding')
```

### Query Chaining Patterns

Common Dexie query patterns:

```typescript
// Pagination with ordering
async getHistory(params: { limit?: number; offset?: number } = {}) {
  const { limit = 50, offset = 0 } = params
  return database.workouts
    .orderBy('completedAt')
    .reverse()
    .offset(offset)
    .limit(limit)
    .toArray()
}

// Multiple value matching
const workouts = await database.workouts
  .where('benchmarkId')
  .anyOf(benchmarkIds)
  .toArray()

// Range queries
const entries = await database.weightEntries
  .where('date')
  .between(startTimestamp, endTimestamp, true, true)
  .reverse()
  .toArray()

// Chained sort after filter
const sessions = await database.progressionSessions
  .where('progressionId')
  .equals(id)
  .reverse()
  .sortBy('completedAt')
```

### Post-Update Verification

Verify updates succeeded before proceeding:

```typescript
async update(
  id: string,
  updates: Partial<Omit<DbProgression, 'id' | 'createdAt'>>,
): Promise<void> {
  const count = await database.progressions
    .where('id')
    .equals(id)
    .modify(updates)

  if (count === 0) {
    throw new Error(`Progression with id ${id} not found`)
  }
}

// Alternative: fetch after update
async update(id: string, updates: Partial<DbBenchmark>): Promise<DbBenchmark> {
  const updated = await database.benchmarks.update(id, updates)
  if (updated === 0) {
    throw createDatabaseError('NOT_FOUND', 'update benchmark')
  }

  const benchmark = await database.benchmarks.get(id)
  if (!benchmark) {
    throw createDatabaseError('NOT_FOUND', 'get updated benchmark')
  }

  return benchmark
}
```

### Bulk Operations in Transactions

Wrap bulk operations in transactions for atomicity:

```typescript
async importAll(data: ExportDataContents): Promise<void> {
  const allTables = [
    database.settings,
    database.customExercises,
    database.templates,
    database.workouts,
    database.benchmarks,
    database.weightEntries,
  ]

  await database.transaction('rw', allTables, async () => {
    // Clear all tables first
    await Promise.all(allTables.map((table) => table.clear()))

    // Bulk add with conditional checks
    await Promise.all([
      data.settings.length > 0
        ? database.settings.bulkAdd([...data.settings])
        : Promise.resolve(),
      data.workouts.length > 0
        ? database.workouts.bulkAdd([...data.workouts])
        : Promise.resolve(),
      data.templates.length > 0
        ? database.templates.bulkAdd([...data.templates])
        : Promise.resolve(),
    ])
  })
}

// Cross-table workflow
async completeWorkout(activeWorkout: DbActiveWorkout): Promise<DbCompletedWorkout> {
  const completed = convertToCompleted(activeWorkout)

  await database.transaction('rw', [database.workouts, database.activeWorkout], async () => {
    await database.workouts.add(completed)
    await database.activeWorkout.delete('current')
  })

  return completed
}
```

---

## Error Handling

### The `tryCatch` Pattern

Use `tryCatch()` instead of native try/catch 📏 Rule

Inspired by Go's error handling. Makes errors explicit in the type system.

```typescript
type Result<T> = [Error, null] | [null, T]

export function tryCatch<T>(promise: Promise<T>): Promise<Result<T>>
export function tryCatch<T>(fn: () => T): Result<T>
export function tryCatch<T>(input: Promise<T> | (() => T)) {
  if (isPromiseLike<T>(input)) {
    return input
      .then((data): Result<T> => [null, data])
      .catch((error): Result<T> => [normalizeError(error), null])
  }

  try {
    return [null, input()]
  } catch (error) {
    return [normalizeError(error), null]
  }
}
```

### Usage

```typescript
async function loadWorkouts(): Promise<void> {
  const [error, workouts] = await tryCatch(getWorkoutsRepository().getAll())

  if (error) {
    state.value = { status: 'error', error }
    return
  }

  state.value = { status: 'success', data: workouts }
}
```

### Benefits

- Explicit error handling via return type
- Flat code structure (no nested blocks)
- Consistent pattern for sync and async
- Type narrowing (`error` is `Error`, `data` is `T`)

### Database Errors

Create domain-specific error types:

```typescript
export type DatabaseErrorCode = 'NOT_FOUND' | 'DUPLICATE' | 'CONSTRAINT' | 'UNKNOWN'

export class DatabaseError extends Error {
  constructor(
    public readonly code: DatabaseErrorCode,
    operation: string,
    cause?: Error,
  ) {
    super(`Database ${code}: ${operation}`)
    this.name = 'DatabaseError'
    this.cause = cause
  }
}

export function createDatabaseError(
  code: DatabaseErrorCode,
  operation: string,
  cause?: Error,
): DatabaseError {
  return new DatabaseError(code, operation, cause)
}
```

---

## TypeScript Conventions

### Strict Mode Always

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Readonly by Default

```typescript
// Function parameters
function processWorkouts(workouts: ReadonlyArray<Workout>): void

// Repository returns
getAll(): Promise<ReadonlyArray<DbWorkout>>

// Composable returns
return { state: readonly(state) }
```

### No Enums

Use literal unions or `as const` objects 📏 Rule

```typescript
// ❌ Avoid enums
enum Status { Active, Inactive }

// ✅ Use literal unions
type Status = 'active' | 'inactive'
```

### Discriminated Unions Over Booleans

```typescript
// ❌ Avoid
type Workout = {
  isLoading: boolean
  hasError: boolean
  data: Data | null
}

// ✅ Use discriminated union
type WorkoutState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Data }
  | { status: 'error'; error: Error }
```

### Branded Types

Prevent mixing up string IDs:

```typescript
type WorkoutId = string & { readonly __brand: 'WorkoutId' }
type ExerciseId = string & { readonly __brand: 'ExerciseId' }

// Or use string literal unions for finite sets
type Equipment = 'barbell' | 'dumbbell' | 'kettlebell' | 'cable' | 'bodyweight'
```

### No Type Assertions

Avoid `as` type assertions (except `as const`) 📏 Rule

```typescript
// ❌ Avoid
const user = { name: 'Nika' } as User

// ✅ Use proper typing
const user: User = { id: '1', name: 'Nika', avatar: null }
```

### Named Type Aliases

```typescript
// ❌ Avoid inline types in props
defineProps<{ workout: { id: string; name: string } }>()

// ✅ Use named type alias
type Props = {
  workout: Workout
}
defineProps<Props>()
```

---

## Utility Patterns

### Fractional Indexing

Generate lexicographically sortable keys for ordered lists:

```typescript
const BASE_62_DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

// Generate a key between two existing keys
const key = generateKeyBetween(prevKey, nextKey)

// Generate multiple keys at once
const keys = generateNKeysBetween(startKey, endKey, count)
```

Use case: Reorder items without updating all other items' positions.

### Tagged Union Result Types

Return explicit success/failure states instead of throwing:

```typescript
type ConversionResult =
  | { success: true; blob: Blob }
  | { success: false; error: 'file-too-large' | 'invalid-image' | 'conversion-failed' }

export async function convertImageToWebP(file: File): Promise<ConversionResult> {
  if (file.size > MAX_SIZE) {
    return { success: false, error: 'file-too-large' }
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return { success: false, error: 'invalid-image' }
  }

  const blob = await convert(file)
  return { success: true, blob }
}

// Usage with type narrowing
const result = await convertImageToWebP(file)
if (!result.success) {
  showError(result.error) // TypeScript knows error type
  return
}
useBlob(result.blob) // TypeScript knows blob exists
```

### Lazy Getters for i18n

Use getter properties for translated labels:

```typescript
import { i18n } from '@/i18n'

function getEquipmentLabel(key: Equipment): string {
  return i18n.global.t(`equipment.${key}`)
}

export const EQUIPMENT_LABELS: Readonly<Record<Equipment, string>> = {
  get barbell() { return getEquipmentLabel('barbell') },
  get dumbbell() { return getEquipmentLabel('dumbbell') },
  get kettlebell() { return getEquipmentLabel('kettlebell') },
  get cable() { return getEquipmentLabel('cable') },
  get machine() { return getEquipmentLabel('machine') },
  get bodyweight() { return getEquipmentLabel('bodyweight') },
}

// Labels update when locale changes
console.log(EQUIPMENT_LABELS.barbell) // "Barbell" or "Langhantel"
```

### Factory Functions for Stateful Logic

Encapsulate stateful logic in factory functions:

```typescript
export function createSplitTracker() {
  const splits: Array<number> = []

  function recordSplit(elapsedSeconds: number): void {
    splits.push(elapsedSeconds)
  }

  function getSplits(): ReadonlyArray<number> {
    return Object.freeze([...splits])
  }

  function reset(): void {
    splits.length = 0
  }

  return { recordSplit, getSplits, reset }
}

// Usage
const tracker = createSplitTracker()
tracker.recordSplit(30)
tracker.recordSplit(65)
console.log(tracker.getSplits()) // [30, 65]
```

### Hash Generation

Generate deterministic hashes for structure comparison:

```typescript
function hashString(str: string): string {
  let hash = 5381 // djb2 algorithm
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ (str.codePointAt(i) ?? 0)
  }
  return (hash >>> 0).toString(16)
}

export function generateStructureHash(rounds: ReadonlyArray<Round>): string {
  const sortedRounds = [...rounds].toSorted((a, b) =>
    a.orderKey.localeCompare(b.orderKey)
  )

  const structure = sortedRounds.map((round) => ({
    exercises: round.exercises.map((ex) => ({
      exerciseId: ex.exerciseDefinitionId,
      prescribedReps: ex.prescribedReps,
    })),
  }))

  return hashString(JSON.stringify(structure))
}
```

---

## Domain Patterns

### State Machine Transition Maps

Document valid state transitions explicitly:

```typescript
type TimerStatus = 'idle' | 'running' | 'paused' | 'completed'
type TimerAction = 'start' | 'pause' | 'resume' | 'complete'

const TRANSITIONS = {
  idle:      { start: 'running' },
  running:   { pause: 'paused', complete: 'completed' },
  paused:    { resume: 'running' },
  completed: {},
} as const satisfies Record<TimerStatus, Partial<Record<TimerAction, TimerStatus>>>

function transition(action: TimerAction): boolean {
  const current = status.value
  const allowed = TRANSITIONS[current]

  if (action in allowed) {
    status.value = allowed[action as keyof typeof allowed]
    return true
  }

  console.warn(`Invalid transition: ${action} from ${current}`)
  return false
}
```

### Timer Composition Pattern

Compose specialized timers from a base timer:

```typescript
export function useEmomTimer(config: EmomConfig) {
  // Compose base timer with EMOM-specific behavior
  const baseTimer = useBaseTimer({
    onTick: handleTick,
    onComplete: config.onComplete,
  })

  const currentMinute = ref(1)
  const currentExerciseIndex = ref(0)

  function handleTick(): void {
    const minute = Math.floor(baseTimer.elapsedSeconds.value / 60) + 1
    if (minute !== currentMinute.value) {
      currentMinute.value = minute
      currentExerciseIndex.value = 0
      config.onMinuteChange?.(minute)
    }
  }

  return {
    // Forward base timer state
    elapsedMs: baseTimer.elapsedMs,
    isRunning: baseTimer.isRunning,
    start: baseTimer.start,
    pause: baseTimer.pause,
    toggle: baseTimer.toggle,
    // Add specialized state
    currentMinute,
    currentExerciseIndex,
  }
}
```

### Global Singleton Timers

Use module-level refs for timers that must survive component unmounts:

```typescript
// Module-level state (singleton)
const startedAt = ref<number | null>(null)
const pausedDuration = ref(0)
const isPaused = ref(false)

export function useBenchmarkGlobalTimer() {
  // Timestamp-based calculation survives app closure
  const elapsedSeconds = computed(() => {
    if (!startedAt.value) return 0
    if (isPaused.value) return pausedDuration.value

    return Math.floor((Date.now() - startedAt.value - pausedDuration.value) / 1000)
  })

  function start(): void {
    if (startedAt.value) return
    startedAt.value = Date.now()
  }

  function reset(): void {
    startedAt.value = null
    pausedDuration.value = 0
    isPaused.value = false
  }

  return { elapsedSeconds, isRunning: computed(() => !!startedAt.value && !isPaused.value), start, reset }
}
```

### Idempotency Guards

Prevent duplicate operations:

```typescript
export function useTimerWorkoutLogger() {
  const isLogged = ref(false)
  const isSaving = ref(false)

  async function logWorkout(session: TimerSession): Promise<Workout | null> {
    // Guard against duplicate saves
    if (isLogged.value || isSaving.value) {
      return null
    }

    isSaving.value = true

    const [error, workout] = await tryCatch(saveToDatabase(session))

    if (error) {
      isSaving.value = false
      throw error
    }

    isLogged.value = true
    isSaving.value = false
    return workout
  }

  function reset(): void {
    isLogged.value = false
    isSaving.value = false
  }

  return { logWorkout, isLogged, isSaving, reset }
}
```

### Navigation Cascade Pattern

Navigate through a hierarchy with fallback logic:

```typescript
function navigateAfterSetComplete(blockIndex: number, setId: number): void {
  const blocks = workout.value.blocks

  // 1. Try next set in current block
  const currentBlock = blocks[blockIndex]
  const nextSet = findNextIncompleteSet(currentBlock)
  if (nextSet) {
    selectSet(blockIndex, nextSet.id)
    return
  }

  // 2. Try next block
  if (blockIndex + 1 < blocks.length) {
    selectBlock(blockIndex + 1)
    return
  }

  // 3. Try first incomplete block (user skipped earlier)
  const firstIncomplete = blocks.findIndex((b) => !isBlockComplete(b))
  if (firstIncomplete !== -1) {
    selectBlock(firstIncomplete)
    return
  }

  // 4. All blocks complete
  completeWorkout()
}
```

### Prefill from History Pattern

Auto-fill form fields from historical data:

```typescript
async function prefillFromHistory(exerciseId: string): Promise<Partial<Set>> {
  const history = await repo.getExerciseHistory(exerciseId, { limit: 1 })
  const lastWorkout = history[0]
  const lastSet = lastWorkout?.blocks[0]?.sets[0]

  if (!lastSet) return {}

  return {
    kg: lastSet.kg,
    reps: lastSet.reps,
    rir: lastSet.rir,
  }
}

// Apply on set activation
async function activateSet(setId: number): Promise<void> {
  const set = getSet(setId)

  // Only prefill if empty
  if (!set.kg && !set.reps) {
    const prefill = await prefillFromHistory(currentExerciseId.value)
    updateSet(setId, (s) => ({ ...s, ...prefill }))
  }

  selectedSetId.value = setId
}
```

---

## Testing

### Integration Tests Over Unit Tests

Integration tests verify features work from the user's perspective. Unit tests often test implementation details.

```
Our Approach:
      /\
     /  \  Integration (browser)
    /----\
   /      \ Architecture (ArchUnitTS)
  /--------\
 /          \ Composable Unit Tests
```

### Test Organization

```
__tests__/
├── integration/        # Browser-based user flows (primary)
├── architecture/       # Structural validation
├── composables/        # Unit tests for complex logic
├── helpers/
│   └── pages/         # Page Objects
├── factories/         # Test data builders
└── setup.ts           # Vitest browser setup
```

### Test Description

All test descriptions must follow `it('should ... when ...')` 📏 Rule

```typescript
// ❌ Avoid
it('accepts ISO date format where date is parsed')
it('after title is confirmed user description is rendered')

// ✅ Use
it('should return parsed date as YYYY-MM when input is in ISO date format')
it('should render user description when title is confirmed')
```

### Page Object Pattern

Encapsulate DOM queries and interactions:

```typescript
export class WorkoutPO extends CommonPO {
  async fillSet(options: { weight: string; reps: string }): Promise<void> {
    const setRow = new SetRowPO(this.page, 0)
    await setRow.setWeight(options.weight)
    await setRow.setReps(options.reps)
  }

  async completeSet(index: number): Promise<void> {
    const completeButton = this.page.getByRole('button', {
      name: new RegExp(`complete set ${index + 1}`, 'i'),
    })
    await userEvent.click(await completeButton.element())
  }
}
```

### Query Priority

Follow Testing Library's query priority 📏 Rule

```typescript
// ✅ Best: Accessible queries
page.getByRole('button', { name: /save workout/i })
page.getByRole('textbox', { name: /workout name/i })
page.getByLabelText(/weight/i)

// Good: Text content
page.getByText(/no workouts yet/i)

// Last resort: Test IDs
page.getByTestId('exercise-drag-handle')
```

### Factory Pattern

```typescript
export function createWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: crypto.randomUUID(),
    name: 'Test Workout',
    startedAt: new Date(),
    blocks: [],
    ...overrides,
  }
}

// Builder pattern for complex objects
export class WorkoutBuilder {
  private workout: Workout = createWorkout()

  withName(name: string): this {
    this.workout.name = name
    return this
  }

  withBlock(block: Block): this {
    this.workout.blocks.push(block)
    return this
  }

  build(): Workout {
    return { ...this.workout }
  }
}
```

### Database Isolation

Reset state between tests:

```typescript
export async function resetDatabase(): Promise<void> {
  await getDataManagementRepository().deleteAll()

  useSettingsStore().$reset()
  useExercisesStore().$reset()

  resetWorkout()
  resetRepositoryProvider()
}

describe('Feature', () => {
  beforeEach(resetDatabase)
})
```

### Integration Test Structure

Use `createTestApp()` instead of `render()` 📏 Rule

```typescript
describe('Template Flow', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('should save completed workout as template when user completes flow', async () => {
    const { builder, workout, router } = await createTestApp()

    await userEvent.click(getByRole('button', { name: /start new workout/i }))
    expect(router.currentRoute.value.path).toBe('/workout/builder')

    await builder.addExercise('Bench Press')
    await builder.startWorkout()
    await workout.fillSetAndComplete({ weight: '80', reps: '10' })
    await workout.endWorkout()

    await userEvent.fill(getByRole('textbox', { name: /name/i }), 'Push Day')
    await userEvent.click(getByRole('button', { name: /save template/i }))

    const templates = await db.templates.toArray()
    expect(templates.find(t => t.name === 'Push Day')).toBeDefined()
  })
})
```

### Architecture Tests

```typescript
describe('feature isolation', () => {
  it('should not allow features to import from other features', async () => {
    for (const feature of FEATURES) {
      const rule = projectFiles()
        .inFolder(`src/features/${feature}/**`)
        .shouldNot()
        .dependOnFiles()
        .matchingPattern('src/features/(?!' + feature + ').*')

      await expect(rule).toPassAsync()
    }
  })

  it('should have no circular dependencies in features', async () => {
    const rule = projectFiles()
      .inFolder('src/features/**')
      .should()
      .haveNoCycles()

    await expect(rule).toPassAsync()
  })
})
```

### Async Database Assertions

Use `expect.poll()` for database assertions:

```typescript
it('should save workout to database', async () => {
  await workout.fillSetAndComplete({ weight: '80', reps: '10' })
  await workout.endWorkout()

  // Poll until database reflects the change
  await expect.poll(async () => {
    const workouts = await db.workouts.toArray()
    return workouts.length
  }).toBe(1)

  const saved = await db.workouts.toArray()
  expect(saved[0]?.name).toBe('Morning Workout')
})

// Reusable assertion helpers
export async function expectWorkoutSaved(count = 1): Promise<void> {
  await expect.poll(async () => {
    return (await db.workouts.toArray()).length
  }).toBe(count)
}
```

### Composable Lifecycle Testing

Use `withSetup()` for composables that need lifecycle hooks:

```typescript
export function withSetup<T>(composable: () => T): [T, App] {
  let result: T
  const app = createApp({
    setup() {
      result = composable()
      return () => {}
    },
  })
  app.mount(document.createElement('div'))
  // @ts-expect-error result is assigned synchronously in setup
  return [result, app]
}

// Usage
it('should track elapsed time when started', () => {
  vi.useFakeTimers()

  const [timer, app] = withSetup(() => useBaseTimer())

  timer.start()
  vi.advanceTimersByTime(1000)

  expect(timer.elapsedMs.value).toBeGreaterThanOrEqual(1000)

  app.unmount()
  vi.useRealTimers()
})
```

### Repository Mock Factory

Create comprehensive mock repositories:

```typescript
export function createMockRepositoryProvider(): RepositoryProvider {
  const defaultSettings: SettingDefaults = {
    theme: 'system',
    defaultRestTimer: 90,
    weightUnit: 'kg',
  }

  return {
    activeWorkout: {
      get: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(false),
    },
    workouts: {
      completeWorkout: vi.fn().mockResolvedValue({
        id: 'completed-1',
        name: 'Test Workout',
        blocks: [],
      }),
      getHistory: vi.fn().mockResolvedValue([]),
    },
    settings: {
      get: vi.fn().mockImplementation((key: keyof SettingDefaults) => {
        return Promise.resolve(defaultSettings[key])
      }),
      set: vi.fn().mockResolvedValue(undefined),
      getAll: vi.fn().mockResolvedValue(defaultSettings),
    },
  }
}
```

### Audio Mocking (Dual Mode)

Support both jsdom and browser test environments:

```typescript
// JSDOM Mode: Mock the class
class MockAudioContext {
  destination = {}
  sampleRate = 44_100
  currentTime = 0
  state = 'running'
  createOscillator = vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 0 },
  }))
  createGain = vi.fn(() => ({
    connect: vi.fn(),
    gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
  }))
}

export function setupAudioContextMock(): void {
  globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext
}

// Browser Mode: Spy on prototype
export function setupAudioSpies(): void {
  vi.spyOn(AudioContext.prototype, 'createOscillator')
  vi.spyOn(AudioContext.prototype, 'createGain')
}

// Unified API
export function getAudioMocksUnified() {
  return isBrowserMode() ? getAudioSpies() : getAudioMocks()
}
```

### Touch Device Mocking

Mock touch device detection:

```typescript
let originalMatchMedia: typeof globalThis.matchMedia | null = null

export function mockTouchDevice(): void {
  originalMatchMedia = globalThis.matchMedia

  globalThis.matchMedia = (query: string): MediaQueryList => {
    const isTouchQuery = query === '(pointer: coarse)'
    return {
      matches: isTouchQuery,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }
  }
}

export function restoreMatchMedia(): void {
  if (originalMatchMedia) {
    globalThis.matchMedia = originalMatchMedia
    originalMatchMedia = null
  }
}
```

### Swipe Gesture Helpers

Simulate touch interactions:

```typescript
export async function simulateSwipeLeft(element: Element, distance = 100): Promise<void> {
  const rect = element.getBoundingClientRect()
  const startX = rect.left + rect.width / 2
  const startY = rect.top + rect.height / 2

  element.dispatchEvent(
    new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [new Touch({ identifier: 0, target: element, clientX: startX, clientY: startY })],
    }),
  )

  element.dispatchEvent(
    new TouchEvent('touchmove', {
      bubbles: true,
      cancelable: true,
      touches: [new Touch({ identifier: 0, target: element, clientX: startX - distance, clientY: startY })],
    }),
  )

  element.dispatchEvent(
    new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      changedTouches: [new Touch({ identifier: 0, target: element, clientX: startX - distance, clientY: startY })],
    }),
  )

  await new Promise((resolve) => setTimeout(resolve, 50))
}
```

### Accessibility Testing

Integrate axe-core for a11y validation:

```typescript
import axe from 'axe-core'

export async function assertNoViolations(container: Element): Promise<void> {
  const results = await axe.run(container)

  if (results.violations.length > 0) {
    console.error('Accessibility violations found:')
    for (const violation of results.violations) {
      console.error(`- ${violation.id} (${violation.impact}): ${violation.description}`)
      console.error(`  Help: ${violation.helpUrl}`)
    }
  }

  expect(results.violations).toHaveLength(0)
}

// Skip color contrast for dark mode tests
export async function assertNoViolationsWithoutContrast(container: Element): Promise<void> {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  })
  expect(results.violations).toHaveLength(0)
}
```

### Test Rules Summary

| Rule | ESLint |
|------|--------|
| Use `it()` not `test()` | 📏 |
| Hooks at top of describe | 📏 |
| Max 2 nested describe levels | 📏 |
| No `let` in describe blocks | 📏 |
| Prefer Vitest locators over querySelector | 📏 |

---

## UI Components

### Recommended: shadcn-vue

For Vue + Vite projects, use shadcn-vue:

- Primitives you own and customize
- Based on Radix Vue for accessibility
- Full control over styling and behavior

```bash
npx shadcn-vue@latest init
npx shadcn-vue@latest add button dialog
```

> **Note**
> For Nuxt projects, consider Nuxt UI instead for deeper framework integration.

### Dialog Pattern

```vue
<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>

      <!-- Content -->

      <DialogFooter>
        <Button variant="outline" @click="open = false">Cancel</Button>
        <Button @click="handleConfirm">Confirm</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

### Class Variance Authority

```typescript
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)
```

### Accessibility

Use semantic HTML and ARIA attributes:

```vue
<Button variant="ghost" size="icon" aria-label="Delete workout">
  <TrashIcon class="h-4 w-4" />
</Button>

<SheetDescription class="sr-only">
  {{ t('queue.accessibleDescription') }}
</SheetDescription>
```

---

## Code Quality

### ESLint 9 Flat Config

```typescript
// eslint.config.ts
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginUnicorn from 'eslint-plugin-unicorn'

export default defineConfigWithVueTs(
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  pluginUnicorn.configs.recommended,

  {
    files: ['src/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': ['error', { ignores: ['App', 'Layout'] }],
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/define-props-destructuring': 'error',
      'vue/prefer-use-template-ref': 'error',
      'vue/no-unused-properties': 'error',
      'vue/no-unused-refs': 'error',
    },
  },
)
```

### Recommended Plugins

| Plugin | Purpose |
|--------|---------|
| `eslint-plugin-vue` | Vue-specific rules |
| `eslint-plugin-unicorn` | Modern JS practices |
| `@typescript-eslint/*` | TypeScript rules |
| `eslint-plugin-import-x` | Import validation |
| `@vitest/eslint-plugin` | Test conventions |
| `@intlify/eslint-plugin-vue-i18n` | i18n validation |

### Custom Rules Enforced

**No native try/catch** 📏 Rule

```typescript
{
  'no-restricted-syntax': ['error', {
    selector: 'TryStatement',
    message: 'Use tryCatch() from @/lib/tryCatch instead.',
  }],
}
```

**No `else` blocks** 📏 Rule

```typescript
{
  'no-restricted-syntax': ['error',
    { selector: 'IfStatement > :not(IfStatement).alternate', message: 'Prefer early returns.' },
  ],
}
```

**Feature boundaries** 📏 Rule

```typescript
{
  'import-x/no-restricted-paths': ['error', {
    zones: [
      { target: './src/features/workout', from: './src/features', except: ['./workout'] },
      { target: './src/features/settings', from: './src/features', except: ['./settings'] },
    ],
  }],
}
```

### Pre-commit Hooks

```bash
pnpm add -D husky lint-staged
pnpm husky init
```

```json
{
  "lint-staged": {
    "*.{ts,vue,js}": "eslint --fix --cache",
    "*.md": "markdownlint-cli2 --fix"
  }
}
```

```bash
# .husky/pre-commit
pnpm lint-staged
pnpm type-check
```

### Additional Tools

| Tool | Purpose | Command |
|------|---------|---------|
| **Knip** | Find unused exports | `pnpm knip` |
| **oxlint** | Fast Rust-based linter | `pnpm lint:oxlint` |
| **markdownlint** | Lint markdown | `pnpm lint:md` |
| **Prettier** | Code formatting | `pnpm format` |

### CI/CD Pipeline

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile

  lint:
    needs: setup
    # parallel with type-check, test

  type-check:
    needs: setup
    # parallel

  test:
    needs: setup
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    # run: pnpm vitest --shard=${{ matrix.shard }}/4
```

### Performance Budgets

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.80 }],
        "categories:accessibility": ["error", { "minScore": 1.0 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 3500 }]
      }
    }
  }
}
```

---

## Appendix - Routing

> **Note**
> Include when building multi-page applications with URL-based navigation.

### Route Configuration

```typescript
import { createRouter, createWebHistory } from 'vue-router'

export const RouteNames = {
  Home: 'home',
  WorkoutDetail: 'workout-detail',
  Settings: 'settings',
} as const

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: RouteNames.Home,
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/workout/:id',
      name: RouteNames.WorkoutDetail,
      component: () => import('@/views/WorkoutDetailView.vue'),
      props: true,
    },
  ],
})
```

### Type-Safe Navigation

Use named routes only 📏 Rule

```typescript
// ✅ Use named routes
router.push({ name: RouteNames.Home })
router.push({ name: RouteNames.WorkoutDetail, params: { id: workout.id } })

// ❌ Avoid hardcoded paths
router.push('/workout/123')
```

### Route Meta Types

```typescript
// types/router.d.ts
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    transition?: 'slide' | 'fade'
  }
}
```

---

## Appendix - Internationalization

> **Note**
> Include when supporting multiple languages.

### Setup

```typescript
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en },
})
```

### Typed Translations

```typescript
// types/i18n.d.ts
import en from '@/i18n/locales/en.json'

type MessageSchema = typeof en

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
}
```

### Usage

```vue
<script setup lang="ts">
const { t, locale } = useI18n()
</script>

<template>
  <h1>{{ t('workout.title') }}</h1>
  <p>{{ t('workout.setsCompleted', { count: completedSets }) }}</p>
</template>
```

### No Raw Text

Hardcoded strings in templates are forbidden 📏 Rule

```typescript
{
  '@intlify/vue-i18n/no-raw-text': ['error', {
    ignorePattern: '^[-#:()&+×/°′″%]+$',
    ignoreText: ['kg', 'lbs', '—', '•'],
  }],
}
```

---

## Appendix - PWA

> **Note**
> Include when building offline-capable or installable apps.

### Vite PWA Plugin

```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'My App',
        short_name: 'App',
        theme_color: '#7c3aed',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
```

### Update Prompt

```typescript
import { useRegisterSW } from 'virtual:pwa-register/vue'

export function usePWAUpdate() {
  const { needRefresh, updateServiceWorker } = useRegisterSW()

  async function refresh(): Promise<void> {
    await updateServiceWorker(true)
  }

  return { needRefresh, refresh }
}
```

### Offline-First Sync

```typescript
import { useOnline } from '@vueuse/core'

export function useOnlineSync(syncFn: () => Promise<void>) {
  const isOnline = useOnline()

  watch(isOnline, async (online) => {
    if (online) await syncFn()
  })

  return { isOnline }
}
```

---

## Appendix - Performance

> **Note**
> Include when optimizing for performance or handling large datasets.

### Lazy Load Routes

```typescript
// ✅ Dynamic import
component: () => import('@/views/WorkoutView.vue')

// ❌ Static import bloats bundle
import WorkoutView from '@/views/WorkoutView.vue'
component: WorkoutView
```

### Async Components

```typescript
import { defineAsyncComponent } from 'vue'

const ChartComponent = defineAsyncComponent(() =>
  import('@/components/ChartComponent.vue')
)
```

### `shallowRef` for Large Objects

```typescript
import { shallowRef } from 'vue'

// Only triggers on .value reassignment
const largeDataset = shallowRef<DataPoint[]>([])

// ✅ Triggers reactivity
largeDataset.value = newData

// ❌ Does NOT trigger (intentionally)
largeDataset.value[0].name = 'Updated'
```

### `v-once` for Static Content

```vue
<header v-once>
  <h1>{{ appTitle }}</h1>
  <Logo />
</header>
```

### Computed Caching

```vue
<!-- ❌ Called on every render -->
<div>{{ formatExpensiveData() }}</div>

<!-- ✅ Cached until dependencies change -->
<div>{{ formattedData }}</div>

<script setup>
const formattedData = computed(() => formatExpensiveData(rawData.value))
</script>
```

### Bundle Size Budgets

```typescript
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'CHUNK_SIZE_LIMIT') {
          throw new Error(warning.message)
        }
        warn(warning)
      },
    },
  },
})
```

---

## Appendix - Environment Variables

> **Note**
> Include when managing environment-specific configuration.

### Vite Environment Variables

```bash
# .env
VITE_API_URL=https://api.example.com
VITE_APP_VERSION=$npm_package_version

# .env.local (gitignored)
VITE_API_KEY=secret-dev-key
```

### Type Safety

```typescript
// env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### Usage

```typescript
const apiUrl = import.meta.env.VITE_API_URL
const isDev = import.meta.env.DEV
const isProd = import.meta.env.PROD
```

### File Priority

```
.env                # All environments (committed)
.env.local          # Local overrides (gitignored)
.env.development    # Dev only
.env.production     # Production only
```

---

## Quick Reference

### Commands

```bash
pnpm dev          # Development server
pnpm test         # Run tests
pnpm lint         # Fix lint errors
pnpm type-check   # TypeScript checking
pnpm build        # Production build
```

### Commit Convention

```
feat(scope): add new feature
fix(scope): fix bug
refactor(scope): code change without feature/fix
test(scope): add/update tests
docs(scope): documentation only
```

### File Naming

```
Component.vue          # PascalCase for components
useFeature.ts          # camelCase with 'use' prefix
featureName.ts         # camelCase for utilities
feature.spec.ts        # camelCase with .spec.ts for tests
```

### Import Order

```typescript
// 1. External packages
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

// 2. Internal absolute imports
import { Button } from '@/components/ui/button'
import { useSettingsStore } from '@/stores/settings'
import type { Workout } from '@/types'

// 3. Relative imports
import { formatDate } from './lib/formatting'
```

---

*This guide represents patterns proven effective in production Vue applications. Adapt as needed for your team and project.*
