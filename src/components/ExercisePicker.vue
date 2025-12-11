<script setup lang="ts">
import type { Exercise } from '@/composables/useExerciseSearch'
import { Search, X } from 'lucide-vue-next'
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import ExerciseListItem from '@/components/ExerciseListItem.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useExerciseSearch } from '@/composables/useExerciseSearch'

const { t } = useI18n()
const router = useRouter()

/**
 * Unified exercise picker component supporting both dialog and overlay presentation.
 *
 * @prop presentation - 'dialog' for modal (template views), 'overlay' for inline (timed blocks)
 * @prop mode - 'single' closes on selection, 'multi' stays open
 * @prop showCreate - Show "Create Custom Exercise" button (dialog mode only)
 */
type Props = {
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
const { presentation = 'dialog', mode = 'single', showCreate = false } = defineProps<Props>()
const emit = defineEmits<Emits>()

const { searchQuery, filteredExercises } = useExerciseSearch()

// Clear search when picker opens
watch(open, (isOpen) => {
  if (isOpen) {
    searchQuery.value = ''
  }
})

function handleSelectExercise(exercise: Exercise) {
  emit('select', exercise)
  searchQuery.value = ''
  if (mode === 'single') {
    open.value = false
  }
}

function handleCreateNew() {
  open.value = false
  searchQuery.value = ''
  router.push({ name: RouteNames.CreateCustomExercise })
}

function handleOpenChange(value: boolean) {
  open.value = value
  if (!value) {
    searchQuery.value = ''
  }
}

function handleClose() {
  open.value = false
}
</script>

<template>
  <!-- Dialog presentation mode -->
  <Dialog v-if="presentation === 'dialog'" :open="open" @update:open="handleOpenChange">
    <MobileDialogContent
      :show-close-button="false"
      class="max-w-md h-[100dvh] sm:h-auto sm:max-h-[80vh] flex flex-col rounded-t-none sm:rounded-lg"
    >
      <!-- Mobile close button -->
      <button
        class="absolute right-4 top-4 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        @click="handleOpenChange(false)"
      >
        <X class="size-5" />
        <span class="sr-only">{{ t('common.buttons.close') }}</span>
      </button>

      <DialogHeader>
        <DialogTitle>{{ t('dialogs.addExercise.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('dialogs.addExercise.description') }}
        </DialogDescription>
      </DialogHeader>

      <!-- Search Input -->
      <div class="relative">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
        />
        <Input
          v-model="searchQuery"
          :placeholder="t('dialogs.addExercise.searchPlaceholder')"
          class="w-full pl-10 h-12 text-base bg-muted/50 border-transparent focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
          autofocus
        />
      </div>

      <!-- Exercises List -->
      <div class="flex-1 overflow-y-auto -mx-4 px-4">
        <div class="divide-y divide-border/50">
          <ExerciseListItem
            v-for="exercise in filteredExercises"
            :key="exercise.id ?? exercise.name"
            :exercise="exercise"
            variant="dialog"
            @select="handleSelectExercise"
          />
        </div>

        <!-- Empty State -->
        <div v-if="filteredExercises.length === 0" class="text-center py-12">
          <Search class="size-8 text-muted-foreground/30 mx-auto mb-3" />
          <p class="text-sm text-muted-foreground">
            {{ t('dialogs.addExercise.noResults', { query: searchQuery }) }}
          </p>
        </div>
      </div>

      <!-- Create Custom Exercise Button -->
      <div v-if="showCreate" class="pt-4 border-t border-border flex-shrink-0">
        <Button variant="default" class="w-full" @click="handleCreateNew">
          {{ t('dialogs.addExercise.createCustomExercise') }}
        </Button>
      </div>
    </MobileDialogContent>
  </Dialog>

  <!-- Overlay presentation mode -->
  <div v-else-if="open" class="absolute inset-0 bg-background flex flex-col z-20">
    <div class="p-4 border-b">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold">
          {{ mode === 'single' ? t('exercises.picker.selectTitle') : t('exercises.picker.addTitle') }}
        </h3>
        <Button variant="ghost" size="icon-sm" @click="handleClose">
          <X class="w-4 h-4" />
        </Button>
      </div>

      <div class="relative">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
        />
        <Input
          v-model="searchQuery"
          :placeholder="t('exercises.picker.searchPlaceholder')"
          class="pl-10"
          autofocus
        />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <button
        v-for="exercise in filteredExercises"
        :key="exercise.id ?? exercise.name"
        class="w-full flex items-center gap-3 py-3 text-left hover:bg-muted/50 rounded-lg px-2 transition-colors"
        @click="handleSelectExercise(exercise)"
      >
        <span class="text-2xl">{{ exercise.icon }}</span>
        <span class="font-medium">{{ exercise.name }}</span>
      </button>

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
