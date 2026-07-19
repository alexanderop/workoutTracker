<script setup lang="ts">
import type { Exercise } from '@/composables/useExerciseSearch'
import type { Equipment, Muscle } from '@/types/exercises'

import { Search, X } from '@lucide/vue'
import { DialogClose } from '@/components/ui/dialog'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import ExerciseFilters from '@/components/ExerciseFilters.vue'
import ExerciseListItem from '@/components/ExerciseListItem.vue'
import ExercisePickerContent from '@/components/ExercisePickerContent.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useCondensedSearch } from '@/composables/useCondensedSearch'
import { useExerciseSearch } from '@/composables/useExerciseSearch'
import { useTouchDevice } from '@/composables/useTouchDevice'
import { cn } from '@/lib/utils'

const { t } = useI18n()
const router = useRouter()

/**
 * Unified exercise picker component supporting both dialog and overlay presentation.
 *
 * @prop presentation - 'dialog' for modal (template views), 'overlay' for inline (timed blocks)
 * @prop mode - 'single' closes on selection, 'multi' stays open
 * @prop showCreate - Show "Create Custom Exercise" button (dialog mode only)
 */
type Properties = {
  /** 'dialog' for modal presentation, 'overlay' for inline absolute positioning */
  presentation?: 'dialog' | 'overlay'
  /** 'single' closes picker on selection, 'multi' stays open for multiple selections */
  mode?: 'single' | 'multi'
  /** Show "Create Custom Exercise" button. Only applies when presentation='dialog' */
  showCreate?: boolean
}

type Emits = {
  select: [exercise: Exercise]
}

const open = defineModel<boolean>('open', { required: true })
const { presentation = 'dialog', mode = 'single', showCreate = false } = defineProps<Properties>()
const emit = defineEmits<Emits>()

// Template ref for the content component (dialog mode)
const pickerContent = useTemplateRef<InstanceType<typeof ExercisePickerContent>>('pickerContent')

// While the user is actively searching, chrome collapses on mobile so the
// on-screen keyboard leaves room for results (dialog mode).
const pickerCondensed = ref(false)

// State for overlay mode (has different structure, so managed separately)
const muscleFilter = ref<Muscle | 'all'>('all')
const equipmentFilter = ref<Equipment | 'all'>('all')
const { searchQuery, filteredExercises } = useExerciseSearch({
  muscleFilter,
  equipmentFilter,
})

// Condensed-search state for overlay mode's own search input
const {
  isCondensed: overlayCondensed,
  handleSearchFocus: handleOverlaySearchFocus,
  handleSearchBlur: handleOverlaySearchBlur,
} = useCondensedSearch(searchQuery)

const overlayMuscleRowClass = computed(() =>
  cn('mt-3', overlayCondensed.value && muscleFilter.value === 'all' && 'max-sm:hidden'),
)
const overlayEquipmentRowClass = computed(() =>
  cn('mt-2', overlayCondensed.value && equipmentFilter.value === 'all' && 'max-sm:hidden'),
)

// Same keyboard-reflow race as ExercisePickerContent: autofocus on touch
// devices pops the keyboard mid-open and swallows the first tap.
const { isTouchDevice } = useTouchDevice()

// Reset state when picker opens
watch(open, (isOpen) => {
  if (!isOpen) {
    return
  }

  // Reset dialog mode content
  pickerContent.value?.reset()
  pickerCondensed.value = false
  // Reset overlay mode state
  searchQuery.value = ''
  muscleFilter.value = 'all'
  equipmentFilter.value = 'all'
})

function handleSelectExercise(exercise: Exercise) {
  emit('select', exercise)
  if (mode === 'single') {
    open.value = false
  }
}

function handleCreateNew() {
  open.value = false
  router.push({ name: RouteNames.ExerciseForm })
}

function handleOpenChange(value: boolean) {
  open.value = value
}

function handleClose() {
  open.value = false
}
</script>

<template>
  <!-- Dialog presentation mode -->
  <Dialog v-if="presentation === 'dialog'" :open="open" @update:open="handleOpenChange">
    <MobileDialogContent
      class="max-w-md h-[100dvh] sm:h-auto sm:max-h-[80vh] flex flex-col rounded-t-none sm:rounded-lg"
    >
      <DialogHeader class="relative">
        <DialogTitle>{{ t('dialogs.addExercise.title') }}</DialogTitle>
        <!-- sr-only while condensed: keeps aria-describedby valid but frees a
             text row for search results under the on-screen keyboard. -->
        <DialogDescription :class="pickerCondensed && 'max-sm:sr-only'">
          {{ t('dialogs.addExercise.description') }}
        </DialogDescription>
        <DialogClose
          class="absolute right-0 top-0 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X class="icon-md text-muted-foreground" />
          <span class="sr-only">{{ t('common.buttons.close') }}</span>
        </DialogClose>
      </DialogHeader>

      <ExercisePickerContent
        ref="pickerContent"
        v-model:condensed="pickerCondensed"
        :show-create="showCreate"
        search-placeholder="dialogs.addExercise.searchPlaceholder"
        @select="handleSelectExercise"
        @create="handleCreateNew"
      />
    </MobileDialogContent>
  </Dialog>

  <!-- Overlay presentation mode (different structure, kept separate) -->
  <div v-else-if="open" class="absolute inset-0 bg-background flex flex-col z-20">
    <div class="p-4 border-b">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold">
          {{
            mode === 'single' ? t('exercises.picker.selectTitle') : t('exercises.picker.addTitle')
          }}
        </h3>
        <Button variant="ghost" size="icon-sm" @click="handleClose">
          <X class="icon-sm" />
          <span class="sr-only">{{ t('common.buttons.close') }}</span>
        </Button>
      </div>

      <div class="relative">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground pointer-events-none"
        />
        <Input
          v-model="searchQuery"
          :placeholder="t('exercises.picker.searchPlaceholder')"
          class="pl-10"
          :autofocus="!isTouchDevice"
          @focus="handleOverlaySearchFocus"
          @blur="handleOverlaySearchBlur"
        />
      </div>

      <!-- Filter Pills -->
      <ExerciseFilters
        v-model:muscle="muscleFilter"
        v-model:equipment="equipmentFilter"
        :muscle-class="overlayMuscleRowClass"
        :equipment-class="overlayEquipmentRowClass"
      />
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <div class="space-y-1">
        <ExerciseListItem
          v-for="exercise in filteredExercises"
          :key="exercise.id ?? exercise.name"
          :exercise="exercise"
          @select="handleSelectExercise"
        />
      </div>

      <!-- Empty State for overlay mode -->
      <div v-if="filteredExercises.length === 0" class="text-center py-12">
        <Search class="size-8 text-muted-foreground/30 mx-auto mb-3" />
        <p class="text-sm text-muted-foreground">
          {{ t('dialogs.addExercise.noResults', { query: searchQuery }) }}
        </p>
      </div>
    </div>
  </div>
</template>
