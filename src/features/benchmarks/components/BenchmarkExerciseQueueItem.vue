<script setup lang="ts">
import { Check, Circle } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { cn } from '@/lib/utils'
import type { BlockExercise } from '@/types/blocks'

type Props = {
  exercise: BlockExercise
  status: 'completed' | 'active' | 'pending'
  exerciseNumber: number
  roundNumber?: number
}

const { exercise, status, exerciseNumber, roundNumber } = defineProps<Props>()

const { t } = useI18n()

const statusIcon = computed(() => {
  switch (status) {
    case 'completed':
      return Check
    case 'active':
    case 'pending':
      return Circle
    default:
      return Circle
  }
})

const statusIconClass = computed(() => {
  switch (status) {
    case 'completed':
      return 'text-primary'
    case 'active':
      return 'text-primary fill-primary'
    case 'pending':
      return 'text-muted-foreground'
    default:
      return 'text-muted-foreground'
  }
})

const statusLabel = computed(() => {
  switch (status) {
    case 'completed':
      return t('workouts.benchmarks.queue.exerciseStatus.completed')
    case 'active':
      return t('workouts.benchmarks.queue.exerciseStatus.active')
    case 'pending':
      return t('workouts.benchmarks.queue.exerciseStatus.pending')
    default:
      return t('workouts.benchmarks.queue.exerciseStatus.pending')
  }
})

const isActive = computed(() => status === 'active')
const isCompleted = computed(() => status === 'completed')

const ariaLabel = computed(() => {
  const roundInfo = roundNumber ? `Round ${roundNumber}, ` : ''
  return `${roundInfo}Exercise ${exerciseNumber}, ${exercise.name}, ${exercise.prescribedReps} reps, ${statusLabel.value}`
})
</script>

<template>
  <div
    data-exercise-item
    :class="
      cn(
        'flex items-center gap-3 px-4 py-3 transition-all',
        isActive && 'bg-primary/10 border-l-4 border-primary',
        isCompleted && 'opacity-60',
      )
    "
    :aria-label="ariaLabel"
    role="listitem"
  >
    <!-- Status icon -->
    <div class="flex-shrink-0" :aria-hidden="true">
      <component
        :is="statusIcon"
        :class="cn('size-5', statusIconClass)"
        :aria-label="isCompleted ? t('common.aria.completed') : undefined"
      />
    </div>

    <!-- Exercise info -->
    <div class="flex-1 min-w-0 flex items-center gap-2">
      <!-- Exercise number, thumbnail, and name -->
      <div class="flex items-center gap-1.5 min-w-0">
        <span class="text-sm font-medium text-muted-foreground shrink-0">{{ exerciseNumber }}.</span>
        <span class="text-base shrink-0">{{ exercise.thumbnail }}</span>
        <span class="font-medium truncate">{{ exercise.name }}</span>
      </div>

      <!-- Active badge -->
      <span v-if="isActive" class="text-xs text-primary font-medium shrink-0">
        {{ t('workouts.benchmarks.queue.active') }}
      </span>
    </div>

    <!-- Reps -->
    <div class="text-sm text-muted-foreground shrink-0 tabular-nums">
      {{ exercise.prescribedReps }}
    </div>
  </div>
</template>
