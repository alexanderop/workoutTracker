<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight } from '@lucide/vue'
import type { BlockExercise } from '@/blocks'

type Properties = {
  exercise?: BlockExercise | null
  isFinalExercise?: boolean
}

const { exercise, isFinalExercise = false } = defineProps<Properties>()
const { t } = useI18n()

const displayText = computed(() => {
  if (isFinalExercise || !exercise) {
    return t('workouts.benchmarks.next.finalExercise')
  }

  let text = exercise.name
  if (exercise.prescribedReps) {
    text += ` · ${exercise.prescribedReps} ${t('workouts.benchmarks.exerciseDisplay.reps')}`
  }
  if (exercise.load) {
    text += ` · ${exercise.load}`
  }
  return text
})
</script>

<template>
  <div v-if="exercise || isFinalExercise" class="px-4 py-3 bg-muted/30 border-t border-border/50">
    <div class="flex items-center justify-center gap-2 text-sm text-muted-foreground">
      <template v-if="!isFinalExercise">
        <span class="font-semibold uppercase tracking-wider text-xs">
          {{ t('workouts.benchmarks.next.label') }}
        </span>
        <ChevronRight class="size-4" aria-hidden="true" />
      </template>
      <span class="font-medium">{{ displayText }}</span>
    </div>
  </div>
</template>
