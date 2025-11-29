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
    <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        v-for="exercise in exercises"
        :key="exercise.id"
        :class="cn(
          'flex-shrink-0 h-[72px] w-[72px] rounded-xl flex flex-col items-center justify-center cursor-pointer relative touch-manipulation',
          'transition-all duration-200 active:scale-95',
          exercise.id === selectedId
            ? 'bg-primary/20 border-2 border-primary shadow-sm shadow-primary/20'
            : 'bg-secondary hover:bg-secondary/80',
        )"
        :title="exercise.name"
        @click="$emit('select', exercise.id)"
      >
        <span class="text-[28px] leading-none">{{ exercise.thumbnail }}</span>
        <span class="text-[10px] font-medium mt-1 text-center line-clamp-1 px-1 text-muted-foreground">
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
        class="flex-shrink-0 h-[72px] w-[72px] rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary touch-manipulation active:scale-95"
        @click="$emit('addExercise')"
      >
        <Plus class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>
