# VueUse Optimization Opportunities

This document identifies manual implementations that can be replaced with VueUse composables.

## Already Using VueUse (No Changes Needed)

| Composable | VueUse Function | File |
|------------|-----------------|------|
| Timers | `useIntervalFn` | `src/composables/timers/useBaseTimer.ts`, `useRestTimer.ts`, `useWorkoutDurationTimer.ts` |
| Debounced watch | `watchDebounced` | `src/features/workout/composables/useWorkoutPersistence.ts` |
| Async state | `useAsyncState` | `src/features/settings/composables/useLanguage.ts` |
| Global state | `createGlobalState` | `src/features/settings/composables/useLanguage.ts` |
| Color mode | `useColorMode` | `src/features/settings/composables/useTheme.ts` |
| Wake lock | `useWakeLock` | `src/composables/useScreenWakeLock.ts` |
| Document visibility | `useDocumentVisibility` | `src/composables/useGlobalWakeLock.ts`, `useScreenWakeLock.ts` |
| Transitions | `useTransition` | `src/composables/useAnimatedCounter.ts` |
| Drag & drop | `useSortable` | `src/features/workout/components/WorkoutQueueDrawer.vue` |

---

## High Priority Changes

### 1. Replace Manual Event Listeners with `useEventListener`

**File:** `src/composables/useScreenWakeLock.ts` (lines 150-162)

**Before:**
```typescript
watch(sentinel, (newSentinel, oldSentinel) => {
  if (oldSentinel) {
    oldSentinel.removeEventListener('release', handleForcedRelease)
  }
  if (newSentinel && !newSentinel.released) {
    newSentinel.addEventListener('release', handleForcedRelease)
  }
})

onScopeDispose(() => {
  if (sentinel.value) {
    sentinel.value.removeEventListener('release', handleForcedRelease)
  }
  releaseAll()
})
```

**After:**
```typescript
import { useEventListener } from '@vueuse/core'

// Automatic cleanup - no manual removeEventListener needed
useEventListener(sentinel, 'release', handleForcedRelease)

onScopeDispose(() => {
  releaseAll()
})
```

**Benefits:**
- Automatic cleanup on component unmount
- Handles dynamic elements/refs automatically
- Reduces 17 lines to 1 line
- Prevents memory leaks

---

### 2. Replace Manual setTimeout with `useTimeoutFn`

**File:** `src/composables/useEnterAnimation.ts` (lines 12-15)

**Before:**
```typescript
export function useEnterAnimation(delay = 100) {
  const isVisible = ref(false)

  onMounted(() => {
    setTimeout(() => {
      isVisible.value = true
    }, delay)
  })

  return { isVisible }
}
```

**After:**
```typescript
import { useTimeoutFn } from '@vueuse/core'

export function useEnterAnimation(delay = 100) {
  const isVisible = ref(false)

  const { start } = useTimeoutFn(
    () => { isVisible.value = true },
    delay,
    { immediate: false }
  )

  onMounted(start)

  return { isVisible }
}
```

**Benefits:**
- Automatic timeout cleanup on unmount (prevents memory leaks)
- Pause/resume capability if needed
- Better TypeScript support
- Clearer lifecycle binding

---

### 3. Replace Manual matchMedia with `useMediaQuery`

**File:** `src/composables/useScreenWakeLock.ts` (line 56)

**Before:**
```typescript
const isPWAStandalone = computed(() => {
  if (typeof window === 'undefined') return false
  const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches
  const isSafariStandalone =
    'standalone' in window.navigator && window.navigator.standalone === true
  return isStandaloneMedia || isSafariStandalone
})
```

**After:**
```typescript
import { useMediaQuery } from '@vueuse/core'

const isStandaloneMedia = useMediaQuery('(display-mode: standalone)')
const isSafariStandalone = computed(() =>
  'standalone' in window.navigator && window.navigator.standalone === true
)
const isPWAStandalone = computed(() =>
  isStandaloneMedia.value || isSafariStandalone.value
)
```

**Benefits:**
- Reactive updates when display mode changes
- Automatic listener cleanup
- Built-in SSR support
- Cleaner, more declarative code

---

## Medium Priority Changes

### 4. Replace Manual Keyboard Handlers with `useMagicKeys`

**File:** `src/views/TheWorkoutsView.vue` (lines 39-51)

**Before:**
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
  onKeyStroke(['Enter', ' '], (e) => {
    if (e.target === elementRef.value) {
      e.preventDefault()
      onActivate()
    }
  }, { target: elementRef })
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
- `src/features/workout/components/WorkoutQueueItem.vue` (lines 70-71)
- `src/features/workout/components/WorkoutBlockPlaylistItem.vue` (lines 83-84)

**Current (Vue event modifiers - acceptable):**
```vue
@keydown.enter="emit('select')"
@keydown.space.prevent="emit('select')"
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
const completedSets = computed(() =>
  exercise.sets.filter((s) => s.status === 'completed')
)
```

**After:**
```typescript
import { useArrayFilter } from '@vueuse/core'

const completedSets = useArrayFilter(
  () => exercise.sets,
  (set) => set.status === 'completed'
)
```

**Benefits:**
- Dedicated composable for reactive array operations
- More semantic intent
- Potential performance benefits for large datasets

---

### 7. Replace Boolean Refs with `useToggle`

**Files:**
- `src/features/workout/components/WorkoutDetailExerciseCard.vue:17`
- `src/features/workout/components/WorkoutConfigureTabataDialog.vue:27`
- `src/features/timers/components/TimerPresetSelector.vue:97`
- `src/features/workout/composables/useTimedBlockExercises.ts:7`

**Before:**
```typescript
const isOpen = ref(false)
// Toggle manually
isOpen.value = !isOpen.value
```

**After:**
```typescript
import { useToggle } from '@vueuse/core'

const [isOpen, toggleOpen] = useToggle(false)
// Use explicit methods
toggleOpen()      // toggle
toggleOpen(true)  // set to true
toggleOpen(false) // set to false
```

**Benefits:**
- More expressive API
- Explicit toggle/on/off methods
- Cleaner code when toggling state

---

## Implementation Checklist

- [ ] `useScreenWakeLock.ts` - Replace addEventListener with `useEventListener`
- [ ] `useEnterAnimation.ts` - Replace setTimeout with `useTimeoutFn`
- [ ] `useScreenWakeLock.ts` - Replace matchMedia with `useMediaQuery`
- [ ] `TheWorkoutsView.vue` - Consider `onKeyStroke` for keyboard handling
- [ ] Review toggle refs for potential `useToggle` conversion

---

## VueUse Documentation

- [useEventListener](https://vueuse.org/core/useEventListener/)
- [useTimeoutFn](https://vueuse.org/core/useTimeoutFn/)
- [useMediaQuery](https://vueuse.org/core/useMediaQuery/)
- [useMagicKeys](https://vueuse.org/core/useMagicKeys/)
- [onKeyStroke](https://vueuse.org/core/onKeyStroke/)
- [useToggle](https://vueuse.org/core/useToggle/)
- [useArrayFilter](https://vueuse.org/core/useArrayFilter/)
