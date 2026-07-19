<script setup lang="ts">
import type { Exercise } from '@/composables/useExerciseSearch'
import type { Equipment, Muscle } from '@/types/exercises'

import { Search } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ExerciseFilters from '@/components/ExerciseFilters.vue'
import ExerciseListItem from '@/components/ExerciseListItem.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCondensedSearch } from '@/composables/useCondensedSearch'
import { useExerciseSearch } from '@/composables/useExerciseSearch'
import { useTouchDevice } from '@/composables/useTouchDevice'
import { cn } from '@/lib/utils'

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

/**
 * True while the user is actively searching. Parents bind this to collapse
 * their own chrome (dialog header, tabs) on mobile so the on-screen keyboard
 * leaves room for more than a single result row.
 */
const condensed = defineModel<boolean>('condensed', { default: false })

const muscleFilter = ref<Muscle | 'all'>('all')
const equipmentFilter = ref<Equipment | 'all'>('all')
const { searchQuery, filteredExercises } = useExerciseSearch({
  muscleFilter,
  equipmentFilter,
})

const { isCondensed, handleSearchFocus, handleSearchBlur } = useCondensedSearch(searchQuery)
watch(isCondensed, (value) => (condensed.value = value), { immediate: true })

// While condensed, filter rows collapse on mobile — but an *active* filter row
// stays visible so the user can always see (and clear) why results are narrowed.
const muscleRowClass = computed(() =>
  cn('-mx-4 px-4 mt-3', isCondensed.value && muscleFilter.value === 'all' && 'max-sm:hidden'),
)
const equipmentRowClass = computed(() =>
  cn('-mx-4 px-4 mt-2', isCondensed.value && equipmentFilter.value === 'all' && 'max-sm:hidden'),
)

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
        @focus="handleSearchFocus"
        @blur="handleSearchBlur"
      />
    </div>

    <!-- Filter Pills -->
    <ExerciseFilters
      v-model:muscle="muscleFilter"
      v-model:equipment="equipmentFilter"
      :muscle-class="muscleRowClass"
      :equipment-class="equipmentRowClass"
    />

    <!-- Exercise List -->
    <div :class="cn('flex-1 overflow-y-auto -mx-4 px-4 mt-4', isCondensed && 'max-sm:mt-2')">
      <div class="space-y-1">
        <ExerciseListItem
          v-for="exercise in filteredExercises"
          :key="exercise.id ?? exercise.name"
          :exercise="exercise"
          @select="handleSelect"
        />
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredExercises.length === 0"
        :class="cn('text-center py-12', isCondensed && 'max-sm:py-6')"
      >
        <Search class="size-8 text-muted-foreground/30 mx-auto mb-3" aria-hidden="true" />
        <p class="text-sm text-muted-foreground">
          {{ t(emptyMessage, { query: searchQuery }) }}
        </p>
        <!-- While condensed the pinned create footer is hidden on mobile, so a
             dead-end search offers the create action inline instead. -->
        <Button
          v-if="showCreate && isCondensed"
          variant="outline"
          class="mt-4 sm:hidden"
          @click="handleCreate"
        >
          {{ t(createButtonText) }}
        </Button>
      </div>
    </div>

    <!-- Create Custom Exercise Button -->
    <div
      v-if="showCreate"
      :class="cn('pt-4 border-t border-border flex-shrink-0', isCondensed && 'max-sm:hidden')"
    >
      <Button variant="default" class="w-full" @click="handleCreate">
        {{ t(createButtonText) }}
      </Button>
    </div>
  </div>
</template>
