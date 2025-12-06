<script setup lang="ts">
import type { Exercise } from '@/composables/useExerciseSearch'

import { Search, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ExerciseListItem from '@/components/ExerciseListItem.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useExerciseSearch } from '@/composables/useExerciseSearch'

const { t } = useI18n()

type Props = {
  open: boolean
}

type Emits = {
  'update:open': [value: boolean]
  add: [name: string]
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const router = useRouter()
const { searchQuery, filteredExercises } = useExerciseSearch()

function handleSelectExercise(exercise: Exercise) {
  emit('add', exercise.name)
  emit('update:open', false)
  searchQuery.value = ''
}

function handleCreateNew() {
  emit('update:open', false)
  searchQuery.value = ''
  router.push('/create-exercise')
}

function handleOpenChange(value: boolean) {
  emit('update:open', value)
  if (!value) {
    searchQuery.value = ''
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
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
      <div class="pt-4 border-t border-border flex-shrink-0">
        <Button variant="default" class="w-full" @click="handleCreateNew">
          {{ t('dialogs.addExercise.createCustomExercise') }}
        </Button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
