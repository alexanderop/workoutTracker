<script setup lang="ts">
import type { Exercise } from '@/composables/useExerciseSearch'
import type { Equipment, Muscle } from '@/types/exercises'

import { Search } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ExerciseFilters from '@/components/ExerciseFilters.vue'
import ExerciseListItem from '@/components/ExerciseListItem.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useExerciseSearch } from '@/composables/useExerciseSearch'
import { useTouchDevice } from '@/composables/useTouchDevice'

/**
 * Reusable exercise picker content with search, filters, and exercise list.
 * Used by ExercisePicker (dialog/overlay modes) and AddBlockDialog (embedded in tab).
 */
type Properties = {
  /** Show "Create Custom Exercise" button at the bottom */
  showCreate?: boolean
  /** i18n key for search placeholder */
  searchPlaceholder?: string
  /** i18n key for empty state message (receives {query} param) */
  emptyMessage?: string
  /** i18n key for create button */
  createButtonText?: string
  /** Autofocus the search input */
  autofocus?: boolean
}

type Emits = {
  select: [exercise: Exercise]
  create: []
}

const {
  showCreate = false,
  searchPlaceholder = 'exercises.picker.searchPlaceholder',
  emptyMessage = 'dialogs.addExercise.noResults',
  createButtonText = 'dialogs.addExercise.createCustomExercise',
  autofocus = true,
} = defineProps<Properties>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

const muscleFilter = ref<Muscle | 'all'>('all')
const equipmentFilter = ref<Equipment | 'all'>('all')
const { searchQuery, filteredExercises } = useExerciseSearch({
  muscleFilter,
  equipmentFilter,
})

// On touch devices, autofocusing the search input opens the on-screen
// keyboard the instant this sheet mounts, which resizes the viewport while
// the user's very first tap may already be in flight. That race is the root
// cause of taps on the unfiltered exercise list silently missing their
// target (see the "Add to Workout" tap-selection UX finding). Autofocus is
// safe to keep on non-touch devices, where there is no on-screen keyboard.
const { isTouchDevice } = useTouchDevice()
const shouldAutofocus = computed(() => autofocus && !isTouchDevice.value)

function handleSelect(exercise: Exercise) {
  emit('select', exercise)
}

function handleCreate() {
  emit('create')
}

/**
 * Reset all filters and search query to initial state.
 * Call this when the parent container opens/closes.
 */
function reset() {
  searchQuery.value = ''
  muscleFilter.value = 'all'
  equipmentFilter.value = 'all'
}

defineExpose({ reset })
</script>

<template>
  <div class="flex flex-col min-h-0 flex-1">
    <!-- Search Input -->
    <div class="relative">
      <Search
        class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
        aria-hidden="true"
      />
      <Input
        v-model="searchQuery"
        :placeholder="t(searchPlaceholder)"
        class="w-full pl-10 h-12 text-base bg-muted/50 border-transparent focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
        :autofocus="shouldAutofocus"
      />
    </div>

    <!-- Filter Pills -->
    <ExerciseFilters
      v-model:muscle="muscleFilter"
      v-model:equipment="equipmentFilter"
      muscle-class="-mx-4 px-4 mt-3"
      equipment-class="-mx-4 px-4 mt-2"
    />

    <!-- Exercise List -->
    <div class="flex-1 overflow-y-auto -mx-4 px-4 mt-4">
      <div class="space-y-1">
        <ExerciseListItem
          v-for="exercise in filteredExercises"
          :key="exercise.id ?? exercise.name"
          :exercise="exercise"
          @select="handleSelect"
        />
      </div>

      <!-- Empty State -->
      <div v-if="filteredExercises.length === 0" class="text-center py-12">
        <Search class="size-8 text-muted-foreground/30 mx-auto mb-3" aria-hidden="true" />
        <p class="text-sm text-muted-foreground">
          {{ t(emptyMessage, { query: searchQuery }) }}
        </p>
      </div>
    </div>

    <!-- Create Custom Exercise Button -->
    <div v-if="showCreate" class="pt-4 border-t border-border flex-shrink-0">
      <Button variant="default" class="w-full" @click="handleCreate">
        {{ t(createButtonText) }}
      </Button>
    </div>
  </div>
</template>
