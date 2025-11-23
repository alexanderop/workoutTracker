<script setup lang="ts">
import type { Exercise } from '@/composables/useWorkout'
import { Plus, X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  exercises: Exercise[]
  selectedId: number
}

defineProps<Props>()
defineEmits<{
  select: [exerciseId: number]
  remove: [exerciseId: number]
  addExercise: []
}>()
</script>

<template>
  <div class="px-4 pb-4">
    <div class="flex gap-2 overflow-x-auto pb-2">
      <button
        v-for="exercise in exercises"
        :key="exercise.id"
        :class="cn(
          'flex-shrink-0 h-20 w-20 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all relative',
          exercise.id === selectedId
            ? 'bg-blue-500/30 border-2 border-blue-500'
            : 'bg-secondary hover:bg-secondary/80',
        )"
        :title="exercise.name"
        @click="$emit('select', exercise.id)"
      >
        <span class="text-2xl">{{ exercise.thumbnail }}</span>
        <span class="text-xs mt-1 text-center line-clamp-2 px-1">
          {{ exercise.name.split(' ')[0] }}
        </span>

        <!-- Remove button on hover -->
        <button
          v-if="exercises.length > 1"
          class="absolute -top-2 -right-2 bg-destructive rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity"
          @click.stop="$emit('remove', exercise.id)"
        >
          <X class="w-3 h-3 text-white" />
        </button>
      </button>

      <!-- Add Exercise Button -->
      <button
        class="flex-shrink-0 h-20 w-20 bg-secondary rounded-lg flex items-center justify-center cursor-pointer hover:bg-secondary/80 transition-colors text-muted-foreground"
        @click="$emit('addExercise')"
      >
        <Plus class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>
