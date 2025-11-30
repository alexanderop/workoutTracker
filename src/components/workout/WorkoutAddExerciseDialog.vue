<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { popularExercises } from '@/data/popularExercises'
import { MUSCLE_LABELS } from '@/lib/exerciseLabels'

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
const searchQuery = ref('')

const filteredExercises = computed(() => {
  if (!searchQuery.value.trim()) {
    return popularExercises
  }
  const query = searchQuery.value.toLowerCase()
  return popularExercises.filter((ex) => ex.name.toLowerCase().includes(query))
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
        <span class="sr-only">Close</span>
      </button>

      <DialogHeader>
        <DialogTitle>Add Exercise</DialogTitle>
        <DialogDescription>
          Choose from popular exercises or create a custom one
        </DialogDescription>
      </DialogHeader>

      <!-- Search Input -->
      <div class="relative">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
        />
        <Input
          v-model="searchQuery"
          placeholder="Search exercises..."
          class="w-full pl-10 h-12 text-base bg-muted/50 border-transparent focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
          autofocus
        />
      </div>

      <!-- Popular Exercises List -->
      <div class="flex-1 overflow-y-auto -mx-4 px-4">
        <button
          v-for="(exercise, index) in filteredExercises"
          :key="exercise.name"
          class="w-full flex items-center gap-3 py-3 text-left transition-colors active:bg-muted/50 group"
          :class="index !== filteredExercises.length - 1 ? 'border-b border-border/50' : ''"
          @click="handleSelectExercise(exercise.name)"
        >
          <span class="text-2xl flex-shrink-0 group-active:scale-110 transition-transform">{{
            exercise.icon
          }}</span>
          <div class="min-w-0 flex-1">
            <p class="font-medium text-[15px] truncate">
              {{ exercise.name }}
            </p>
            <Badge variant="secondary" class="text-xs mt-0.5 font-normal">
              {{ MUSCLE_LABELS[exercise.muscle] }}
            </Badge>
          </div>
          <span
            class="text-muted-foreground/50 text-xl flex-shrink-0 group-active:translate-x-0.5 transition-transform"
            >›</span
          >
        </button>

        <!-- Empty State -->
        <div v-if="filteredExercises.length === 0" class="text-center py-12">
          <Search class="size-8 text-muted-foreground/30 mx-auto mb-3" />
          <p class="text-sm text-muted-foreground">No exercises found for "{{ searchQuery }}"</p>
        </div>
      </div>

      <!-- Create Custom Exercise Button -->
      <div class="pt-4 border-t border-border flex-shrink-0">
        <Button variant="default" class="w-full" @click="handleCreateNew">
          + Create Custom Exercise
        </Button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
