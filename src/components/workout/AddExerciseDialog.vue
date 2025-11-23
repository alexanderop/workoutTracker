<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { popularExercises } from '@/data/popularExercises'

interface Props {
  open: boolean
}

interface Emits {
  'update:open': [value: boolean]
  'add': [name: string]
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const router = useRouter()
const searchQuery = ref('')

const muscleLabels: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  legs: 'Legs',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
}

const filteredExercises = computed(() => {
  if (!searchQuery.value.trim()) {
    return popularExercises
  }
  const query = searchQuery.value.toLowerCase()
  return popularExercises.filter((ex) =>
    ex.name.toLowerCase().includes(query)
  )
})

function handleSelectExercise(exerciseName: string) {
  emit('add', exerciseName)
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
    <DialogContent class="max-w-md max-h-[80vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Add Exercise</DialogTitle>
        <DialogDescription>
          Choose from popular exercises or create a custom one
        </DialogDescription>
      </DialogHeader>

      <!-- Search Input -->
      <Input
        v-model="searchQuery"
        placeholder="Search exercises..."
        class="w-full"
        autofocus
      />

      <!-- Popular Exercises List -->
      <div class="flex-1 overflow-y-auto space-y-2">
        <button
          v-for="exercise in filteredExercises"
          :key="exercise.name"
          @click="handleSelectExercise(exercise.name)"
          class="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-left"
        >
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <span class="text-xl flex-shrink-0">{{ exercise.icon }}</span>
            <div class="min-w-0">
              <p class="font-medium text-sm truncate">{{ exercise.name }}</p>
              <Badge variant="secondary" class="text-xs mt-1">
                {{ muscleLabels[exercise.muscle] }}
              </Badge>
            </div>
          </div>
          <span class="text-muted-foreground text-lg flex-shrink-0">›</span>
        </button>

        <!-- Empty State -->
        <div v-if="filteredExercises.length === 0" class="text-center py-8">
          <p class="text-sm text-muted-foreground">
            No exercises found for "{{ searchQuery }}"
          </p>
        </div>
      </div>

      <!-- Create Custom Exercise Button -->
      <div class="pt-4 border-t border-border">
        <Button
          @click="handleCreateNew"
          variant="outline"
          class="w-full"
        >
          + Create Custom Exercise
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
