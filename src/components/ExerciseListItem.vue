<script setup lang="ts">
import type { Exercise } from '@/composables/useExerciseSearch'

import { ChevronRight } from 'lucide-vue-next'

import ExerciseAvatar from '@/components/ExerciseAvatar.vue'
import { MUSCLE_LABELS } from '@/lib/exerciseLabels'

const { exercise } = defineProps<{
  exercise: Exercise
}>()

defineEmits<{
  select: [exercise: Exercise]
}>()
</script>

<template>
  <button
    class="w-full flex items-center gap-4 px-4 py-4 text-left rounded-xl transition-all duration-150 hover:bg-muted/50 active:bg-muted active:scale-[0.99] group"
    @click="$emit('select', exercise)"
  >
    <ExerciseAvatar :name="exercise.name" :image="exercise.image" size="lg" />
    <div class="min-w-0 flex-1">
      <p class="font-semibold text-base tracking-tight truncate">
        {{ exercise.name }}
      </p>
      <p v-if="exercise.muscle" class="text-sm text-muted-foreground mt-0.5">
        {{ MUSCLE_LABELS[exercise.muscle] }}
      </p>
    </div>
    <ChevronRight
      class="icon-md text-muted-foreground/50 flex-shrink-0 group-hover:text-muted-foreground transition-all"
    />
  </button>
</template>
