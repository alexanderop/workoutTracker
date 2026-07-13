---
type: Reference
title: "VueUse Optimization Opportunities"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/VUEUSE_OPPORTUNITIES.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## VueUse Optimization Opportunities

This document identifies manual implementations that can be replaced with VueUse composables.

## Already Using VueUse (No Changes Needed)

| Composable          | VueUse Function         | File                                                                                      |
| ------------------- | ----------------------- | ----------------------------------------------------------------------------------------- |
| Timers              | `useIntervalFn`         | `src/composables/timers/useBaseTimer.ts`, `useRestTimer.ts`, `useWorkoutDurationTimer.ts` |
| Debounced watch     | `watchDebounced`        | `src/composables/persistence/createPersistenceCore.ts`                                    |
| Async state         | `useAsyncState`         | `src/features/settings/composables/useLanguage.ts`                                        |
| Global state        | `createGlobalState`     | `src/features/settings/composables/useLanguage.ts`                                        |
| Color mode          | `useColorMode`          | `src/features/settings/composables/useTheme.ts`                                           |
| Wake lock           | `useWakeLock`           | `src/composables/useScreenWakeLock.ts`                                                    |
| Document visibility | `useDocumentVisibility` | `src/composables/useGlobalWakeLock.ts`, `useScreenWakeLock.ts`                            |
| Transitions         | `useTransition`         | `src/composables/useAnimatedCounter.ts`                                                   |
| Drag & drop         | `useSortable`           | `src/features/templates/components/TemplateBlockList.vue`, `src/features/benchmarks/components/BenchmarkExerciseList.vue` |
| Timeout             | `useTimeoutFn`          | `src/composables/useEnterAnimation.ts`                                                    |
| Media query         | `useMediaQuery`         | `src/composables/useScreenWakeLock.ts`                                                    |
| Event listener      | `useEventListener`      | `src/composables/useScreenWakeLock.ts`, `src/composables/useUnsavedChangesGuard.ts`       |
| Boolean toggle      | `useToggle`             | `src/components/blocks/ConfigureTabataDialog.vue`, `src/composables/useTimedBlockExercises.ts`, `src/features/timers/components/TimerPresetSelector.vue`, `src/features/workout/components/WorkoutDetailExerciseCard.vue` |

---

## High Priority Changes

### 1. ~~Replace Manual Event Listeners with `useEventListener`~~ ✅ Done

`src/composables/useScreenWakeLock.ts:161` now uses `useEventListener(sentinel, 'release', handleForcedRelease)` for the sentinel's forced-release event, with cleanup handled automatically. `src/composables/useUnsavedChangesGuard.ts` also uses it for the `beforeunload` listener.

---

### 2. ~~Replace Manual setTimeout with `useTimeoutFn`~~ ✅ Done

`src/composables/useEnterAnimation.ts` already uses `useTimeoutFn` from `@vueuse/core`.

---

### 3. ~~Replace Manual matchMedia with `useMediaQuery`~~ ✅ Done

`src/composables/useScreenWakeLock.ts` already uses `useMediaQuery` and `useEventListener` from VueUse.

---

## Medium Priority Changes

### 4. Replace Manual Keyboard Handlers with `useMagicKeys` / `onKeyStroke`

**Status:** Still open, but the code has moved. `TheWorkoutsView.vue` no longer builds its own list markup — templates/benchmarks/progressions/history now render through dedicated card components, each with its own near-identical manual handler:

- `src/components/TemplateListCard.vue`
- `src/components/WorkoutHistoryCard.vue`
- `src/components/RecentWorkoutCard.vue`
- `src/features/progressions/components/ProgressionCard.vue`
- `src/features/benchmarks/components/BenchmarkListCard.vue`

Each defines its own `handleActivationKey(event: KeyboardEvent)` bound via `@keydown="handleActivationKey"`, checking for `Enter`/`Space` and calling `emit('click', ...)`. This is now duplicated five times, which strengthens the original case for extracting a shared composable (e.g. `useActivateOnKey` via `onKeyStroke`) rather than weakening it — but no such extraction has happened yet.

**Sketch (unchanged from original suggestion):**

```typescript
import { onKeyStroke } from '@vueuse/core'

function useActivateOnKey(elementRef: Ref<HTMLElement | null>, onActivate: () => void) {
  onKeyStroke(
    ['Enter', ' '],
    (e) => {
      if (e.target === elementRef.value) {
        e.preventDefault()
        onActivate()
      }
    },
    { target: elementRef },
  )
}
```

**Benefits:**

- Removes boilerplate condition checking
- Centralizes keyboard handling logic (currently duplicated across 5 files)
- More readable and maintainable
- Consistent patterns across app

---

### 5. Standardize Component Keyboard Events

**Files:**

- `src/features/workout/components/WorkoutQueueItem.vue` (lines 84-85) — still uses `@keydown.enter` / `@keydown.space.prevent`
- `src/components/blocks/WorkoutBlockPlaylistItem.vue` — no longer has keyboard handling at all; selection is `@click`-only now (moved from `src/features/workout/components/` to `src/components/blocks/`)

**Current (Vue event modifiers - acceptable):**

```vue
@keydown.enter="emit('select')" @keydown.space.prevent="emit('select')"
```

**Alternative with VueUse (for consistency):**

```typescript
import { useMagicKeys } from '@vueuse/core'

const { enter, space } = useMagicKeys()
const activate = computed(() => enter.value || space.value)

watch(activate, (isPressed) => {
  if (isPressed && isFocused.value) {
    emit('select')
  }
})
```

**Note:** Vue's event modifiers work fine here. Only change if you want global keyboard state management.

---

## Low Priority / Optional

### 6. Replace Computed Filter with `useArrayFilter`

**Status:** Still open. **File:** `src/features/workout/components/WorkoutDetailExerciseCard.vue` (line 20)

**Before:**

```typescript
const completedSets = computed(() => exercise.sets.filter((s) => s.status === 'completed'))
```

**After:**

```typescript
import { useArrayFilter } from '@vueuse/core'

const completedSets = useArrayFilter(
  () => exercise.sets,
  (set) => set.status === 'completed',
)
```

**Benefits:**

- Dedicated composable for reactive array operations
- More semantic intent
- Potential performance benefits for large datasets

---

### 7. ~~Replace Boolean Refs with `useToggle`~~ ✅ Done

All four originally-flagged sites now use `useToggle` from `@vueuse/core`:

- `src/features/workout/components/WorkoutDetailExerciseCard.vue:18` — `const [isOpen] = useToggle(false)`
- `src/components/blocks/ConfigureTabataDialog.vue:31` — `const [showExercisePicker, toggleShowExercisePicker] = useToggle(false)` (moved from `WorkoutConfigureTabataDialog.vue`)
- `src/features/timers/components/TimerPresetSelector.vue:98` — `const [showCustom, toggleShowCustom] = useToggle(false)`
- `src/composables/useTimedBlockExercises.ts:14` — `const [showExercisePicker, toggleShowExercisePicker] = useToggle(false)`

---

## Implementation Checklist

- [x] `useScreenWakeLock.ts` - Replace addEventListener with `useEventListener` ✅ Done
- [x] `useEnterAnimation.ts` - Replace setTimeout with `useTimeoutFn` ✅ Done
- [x] `useScreenWakeLock.ts` - Replace matchMedia with `useMediaQuery` ✅ Done
- [x] Toggle refs converted to `useToggle` ✅ Done (see #7)
- [ ] Card components (`TemplateListCard.vue`, `WorkoutHistoryCard.vue`, `RecentWorkoutCard.vue`, `ProgressionCard.vue`, `BenchmarkListCard.vue`) - Consider `onKeyStroke` to de-duplicate the repeated `handleActivationKey` handler
- [ ] `WorkoutDetailExerciseCard.vue` - Consider `useArrayFilter` for `completedSets`

---

## VueUse Documentation

- [useEventListener](https://vueuse.org/core/useEventListener/)
- [useTimeoutFn](https://vueuse.org/core/useTimeoutFn/)
- [useMediaQuery](https://vueuse.org/core/useMediaQuery/)
- [useMagicKeys](https://vueuse.org/core/useMagicKeys/)
- [onKeyStroke](https://vueuse.org/core/onKeyStroke/)
- [useToggle](https://vueuse.org/core/useToggle/)
- [useArrayFilter](https://vueuse.org/core/useArrayFilter/)
