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

---

## High Priority Changes

### 1. ~~Replace Manual Event Listeners with `useEventListener`~~ ✅ Done

`src/composables/useScreenWakeLock.ts` now imports `useEventListener` from `@vueuse/core` and calls
`useEventListener(sentinel, 'release', handleForcedRelease)` — the manual `addEventListener` /
`removeEventListener` watch pair described below has been removed.

---

### 2. ~~Replace Manual setTimeout with `useTimeoutFn`~~ ✅ Done

`src/composables/useEnterAnimation.ts` already uses `useTimeoutFn` from `@vueuse/core`.

---

### 3. ~~Replace Manual matchMedia with `useMediaQuery`~~ ✅ Done

`src/composables/useScreenWakeLock.ts` already uses `useMediaQuery` and `useEventListener` from VueUse.

---

## Medium Priority Changes

### 4. Replace Manual Keyboard Handlers with `useMagicKeys`

**Status:** `src/views/TheWorkoutsView.vue` no longer contains the `handleWorkoutKeyDown` /
`handleTemplateKeyDown` handlers this section described — that manual keydown logic has since been
removed from the view entirely. The `useMagicKeys` pattern below remains a valid template for any
future manual keyboard handling elsewhere in the app.

**Before (illustrative, no longer present in the codebase):**

```typescript
function handleWorkoutKeyDown(event: KeyboardEvent, workoutId: string): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    navigateToWorkoutDetail(workoutId)
  }
}

function handleTemplateKeyDown(event: KeyboardEvent, templateId: string): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    navigateToTemplateDetail(templateId)
  }
}
```

**After:**

```typescript
import { onKeyStroke } from '@vueuse/core'

// Create a reusable composable
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
- Centralizes keyboard handling logic
- More readable and maintainable
- Consistent patterns across app

---

### 5. Standardize Component Keyboard Events

**Files:**

- `src/features/workout/components/WorkoutQueueItem.vue` (lines 75-76)

(`src/components/blocks/WorkoutBlockPlaylistItem.vue`, previously listed here, no longer has a
keydown handler.)

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

**File:** `src/features/workout/components/WorkoutDetailExerciseCard.vue` (line 19)

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

All four files originally listed here already use `useToggle` from `@vueuse/core`:

- `src/features/workout/components/WorkoutDetailExerciseCard.vue`
- `src/components/blocks/ConfigureTabataDialog.vue` (renamed from `WorkoutConfigureTabataDialog.vue`)
- `src/features/timers/components/TimerPresetSelector.vue`
- `src/composables/useTimedBlockExercises.ts` (moved from `src/features/workout/composables/`)

---

## Implementation Checklist

- [x] `useScreenWakeLock.ts` - Replace addEventListener with `useEventListener` ✅ Done
- [x] `useEnterAnimation.ts` - Replace setTimeout with `useTimeoutFn` ✅ Done
- [x] `useScreenWakeLock.ts` - Replace matchMedia with `useMediaQuery` ✅ Done
- [ ] `TheWorkoutsView.vue` - manual keydown handlers have since been removed; no longer applicable
- [x] Review toggle refs for potential `useToggle` conversion ✅ Done (all four originally-flagged files converted)

---

## VueUse Documentation

- [useEventListener](https://vueuse.org/core/useEventListener/)
- [useTimeoutFn](https://vueuse.org/core/useTimeoutFn/)
- [useMediaQuery](https://vueuse.org/core/useMediaQuery/)
- [useMagicKeys](https://vueuse.org/core/useMagicKeys/)
- [onKeyStroke](https://vueuse.org/core/onKeyStroke/)
- [useToggle](https://vueuse.org/core/useToggle/)
- [useArrayFilter](https://vueuse.org/core/useArrayFilter/)
