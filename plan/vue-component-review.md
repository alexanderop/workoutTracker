# Vue Component Review - Readability Analysis

**Date:** 2025-11-29
**Components Reviewed:** 11 Vue components

---

## High Impact Issues

### 1. Duplicate Label Mappings

**Files:**
- `src/views/CreateCustomExercise.vue:35-72`
- `src/components/workout/WorkoutAddExerciseDialog.vue:31-38`

**Issue:** Same equipment/muscle/type/metrics label objects defined in multiple components

**Suggestion:** Centralize in `src/lib/exerciseLabels.ts`:

```typescript
// src/lib/exerciseLabels.ts
import type { Equipment, ExerciseType, Metrics, Muscle } from '@/types/exercise'

export const EQUIPMENT_LABELS: Readonly<Record<Equipment, string>> = {
  'barbell': 'Barbell',
  'dumbbell': 'Dumbbell',
  'machine': 'Machine',
  'cable': 'Cable',
  'bodyweight': 'Bodyweight',
  'kettlebell': 'Kettlebell',
  'band': 'Band',
  'ez-bar': 'EZ Bar',
  'hex-bar': 'Hex Bar',
} as const

export const MUSCLE_LABELS: Readonly<Record<Muscle, string>> = {
  chest: 'Chest',
  back: 'Back',
  legs: 'Legs',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
} as const

export const TYPE_LABELS: Readonly<Record<ExerciseType, string>> = {
  compound: 'Compound',
  isolation: 'Isolation',
} as const

export const METRICS_LABELS: Readonly<Record<Metrics, string>> = {
  'weight-reps': 'Weight & Reps',
  'bodyweight-reps': 'Bodyweight & Reps',
  'duration': 'Duration',
  'distance': 'Distance',
} as const
```

---

### 2. Extract Form Composable

**File:** `src/views/CreateCustomExercise.vue:16-127`

**Issue:** Extensive business logic (form state, validation, label mappings) mixed with presentation

**Suggestion:** Extract to `useExerciseForm()` composable:

```typescript
import type { Equipment, ExerciseType, Metrics, Muscle } from '@/types/exercise'
// src/composables/useExerciseForm.ts
import { computed, ref } from 'vue'

export function useExerciseForm() {
  const icon = ref('💪')
  const name = ref('')
  const equipment = ref<Equipment | undefined>()
  const muscle = ref<Muscle | undefined>()
  const type = ref<ExerciseType>('isolation')
  const metrics = ref<Metrics>('weight-reps')

  const isNameValid = computed(() => name.value.trim().length > 0)
  const isSaveDisabled = computed(() => !isNameValid.value)

  function reset() {
    icon.value = '💪'
    name.value = ''
    equipment.value = undefined
    muscle.value = undefined
    type.value = 'isolation'
    metrics.value = 'weight-reps'
  }

  return {
    icon,
    name,
    equipment,
    muscle,
    type,
    metrics,
    isNameValid,
    isSaveDisabled,
    reset,
  }
}
```

---

### 3. Extract Theme Composable

**Files:**
- `src/App.vue:7-28`
- `src/views/Settings.vue:8-15`

**Issue:** Color mode logic duplicated between components

**Suggestion:** Create `useTheme()` composable:

```typescript
// src/composables/useTheme.ts
import { useColorMode } from '@vueuse/core'
import { computed, watch } from 'vue'

export function useTheme() {
  const colorMode = useColorMode({
    attribute: 'class',
    modes: {
      light: '',
      dark: 'dark',
    },
  })

  // Sync HTML class with color mode
  watch(
    () => colorMode.value,
    (newMode) => {
      const html = document.documentElement
      if (newMode === 'dark') {
        html.classList.add('dark')
      }
      else {
        html.classList.remove('dark')
      }
    },
  )

  const isDark = computed({
    get: () => colorMode.value === 'dark',
    set: (value: boolean) => {
      colorMode.value = value ? 'dark' : 'light'
    },
  })

  return { colorMode, isDark }
}
```

---

## Medium Impact Issues

### 4. List Component Pattern - Settings Items

**File:** `src/views/CreateCustomExercise.vue:176-232`

**Issue:** Repeated button patterns for equipment, muscle, type, and metrics with nearly identical structure

**Suggestion:** Extract to `ExerciseSettingsItem` component:

```vue
<!-- src/components/exercise/ExerciseSettingsItem.vue -->
<script setup lang="ts">
interface Props {
  label: string
  value: string
  placeholder?: string
}

defineProps<Props>()
const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button
    class="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 border-b border-border last:border-b-0 transition-colors text-left"
    @click="emit('click')"
  >
    <span class="text-sm font-medium">{{ label }}</span>
    <div class="flex items-center gap-2">
      <span class="text-sm text-muted-foreground">
        {{ value || placeholder || 'Please select' }}
      </span>
      <span class="text-muted-foreground">›</span>
    </div>
  </button>
</template>
```

**Usage:**

```vue
<div class="space-y-0 border border-border rounded-lg overflow-hidden">
  <ExerciseSettingsItem
    label="Equipment"
    :value="equipment ? EQUIPMENT_LABELS[equipment] : ''"
    @click="showEquipmentModal = true"
  />
  <ExerciseSettingsItem
    label="Muscle"
    :value="muscle ? MUSCLE_LABELS[muscle] : ''"
    @click="showMuscleModal = true"
  />
  <!-- etc -->
</div>
```

---

### 5. Exercise List Item Extraction

**File:** `src/components/workout/WorkoutAddExerciseDialog.vue:89-108`

**Issue:** Complex v-for loop with 20+ lines of template logic per item

**Suggestion:** Extract to `WorkoutExerciseListItem` component:

```vue
<!-- src/components/workout/WorkoutExerciseListItem.vue -->
<script setup lang="ts">
import type { PopularExercise } from '@/data/popularExercises'
import { Badge } from '@/components/ui/badge'

interface Props {
  exercise: PopularExercise
  muscleLabel: string
}

defineProps<Props>()
const emit = defineEmits<{ select: [] }>()
</script>

<template>
  <button
    class="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-left"
    @click="emit('select')"
  >
    <div class="flex items-center gap-2 min-w-0 flex-1">
      <span class="text-xl flex-shrink-0">{{ exercise.icon }}</span>
      <div class="min-w-0">
        <p class="font-medium text-sm truncate">
          {{ exercise.name }}
        </p>
        <Badge variant="secondary" class="text-xs mt-1">
          {{ muscleLabel }}
        </Badge>
      </div>
    </div>
    <span class="text-muted-foreground text-lg flex-shrink-0">›</span>
  </button>
</template>
```

---

### 6. Selector Options Duplication

**Files:** All 4 selector components
- `src/components/exercise/ExerciseEquipmentSelector.vue:24-34`
- `src/components/exercise/ExerciseMetricsSelector.vue:24-30`
- `src/components/exercise/ExerciseMuscleSelector.vue:24-31`
- `src/components/exercise/ExerciseTypeSelector.vue:24-29`

**Issue:** Options arrays with value, label, and icon should be in a centralized location

**Suggestion:** Create `src/lib/exerciseOptions.ts`:

```typescript
// src/lib/exerciseOptions.ts
import type { Equipment, ExerciseType, Metrics, Muscle } from '@/types/exercise'

type SelectorOption<TValue> = Readonly<{
  value: TValue
  label: string
  icon?: string
  description?: string
}>

export const EQUIPMENT_OPTIONS: ReadonlyArray<SelectorOption<Equipment>> = [
  { value: 'barbell', label: 'Barbell', icon: '🏋️' },
  { value: 'dumbbell', label: 'Dumbbell', icon: '🪑' },
  { value: 'machine', label: 'Machine', icon: '🎰' },
  { value: 'cable', label: 'Cable', icon: '🔗' },
  { value: 'bodyweight', label: 'Bodyweight', icon: '🤸' },
  { value: 'kettlebell', label: 'Kettlebell', icon: '🔔' },
  { value: 'band', label: 'Band', icon: '➰' },
  { value: 'ez-bar', label: 'EZ Bar', icon: '〰️' },
  { value: 'hex-bar', label: 'Hex Bar', icon: '⬡' },
] as const

export const MUSCLE_OPTIONS: ReadonlyArray<SelectorOption<Muscle>> = [
  { value: 'chest', label: 'Chest', icon: '🫁' },
  { value: 'back', label: 'Back', icon: '🔙' },
  { value: 'legs', label: 'Legs', icon: '🦵' },
  { value: 'shoulders', label: 'Shoulders', icon: '🤷' },
  { value: 'arms', label: 'Arms', icon: '💪' },
  { value: 'core', label: 'Core', icon: '🎯' },
] as const

export const TYPE_OPTIONS: ReadonlyArray<SelectorOption<ExerciseType>> = [
  {
    value: 'compound',
    label: 'Compound',
    description: 'Multi-joint movements that work multiple muscle groups'
  },
  {
    value: 'isolation',
    label: 'Isolation',
    description: 'Single-joint movements that target specific muscles'
  },
] as const

export const METRICS_OPTIONS: ReadonlyArray<SelectorOption<Metrics>> = [
  {
    value: 'weight-reps',
    label: 'Weight & Reps',
    description: 'Track weight lifted and repetitions'
  },
  {
    value: 'bodyweight-reps',
    label: 'Bodyweight & Reps',
    description: 'Track repetitions only'
  },
  {
    value: 'duration',
    label: 'Duration',
    description: 'Track time-based exercises'
  },
  {
    value: 'distance',
    label: 'Distance',
    description: 'Track distance-based exercises'
  },
] as const
```

---

## Low Impact Issues

### 7. Shared Selector Option Button

**Files:**
- `src/components/exercise/ExerciseMetricsSelector.vue:50-73`
- `src/components/exercise/ExerciseTypeSelector.vue`

**Issue:** Similar complex button structure that could share a common component

**Suggestion:** Create `SelectorOptionButton` component (optional - current implementation is acceptable):

```vue
<!-- src/components/exercise/SelectorOptionButton.vue -->
<script setup lang="ts">
interface Props {
  label: string
  description: string
  isSelected: boolean
}

defineProps<Props>()
const emit = defineEmits<{ select: [] }>()
</script>

<template>
  <button
    class="w-full text-left px-4 py-3 rounded-lg border transition-all"
    :class="[
      isSelected
        ? 'border-primary bg-primary/10'
        : 'border-border hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900',
    ]"
    @click="emit('select')"
  >
    <div class="flex items-start justify-between gap-2">
      <div>
        <p class="font-medium">
          {{ label }}
        </p>
        <p class="text-xs text-muted-foreground mt-1">
          {{ description }}
        </p>
      </div>
      <span v-if="isSelected" class="text-primary text-lg flex-shrink-0">✓</span>
    </div>
  </button>
</template>
```

---

## Positive Patterns Observed ✓

### Humble Components
- `Exercises.vue`, `Workouts.vue`, `Settings.vue` - All view components properly delegate to UI components and have minimal logic
- All selector components properly handle only presentation and emit events

### Props Down, Events Up
- All selector components correctly use `defineProps` and `defineEmits` with TypeScript interfaces
- No prop drilling violations observed

### Component Naming
- All components follow PascalCase naming convention
- Tightly-coupled components properly prefixed (e.g., `ExerciseEquipmentSelector`, `WorkoutAddExerciseDialog`)

### shadcn/ui Usage
- Excellent use of existing shadcn components (Dialog, Card, Button, Badge, Switch, etc.)
- No unnecessary custom components where shadcn provides equivalent functionality

---

## Implementation Priority

### Phase 1: Centralize Data (High Impact)
1. Create `src/lib/exerciseLabels.ts`
2. Create `src/lib/exerciseOptions.ts`
3. Update all components to use centralized constants

### Phase 2: Extract Composables (High Impact)
4. Create `src/composables/useExerciseForm.ts`
5. Create `src/composables/useTheme.ts`
6. Refactor `CreateCustomExercise.vue`, `App.vue`, and `Settings.vue`

### Phase 3: Extract Components (Medium Impact)
7. Create `ExerciseSettingsItem.vue`
8. Create `WorkoutExerciseListItem.vue`
9. Refactor parent components to use new components

### Phase 4: Polish (Low Impact)
10. Consider `SelectorOptionButton.vue` if pattern grows
