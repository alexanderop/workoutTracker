<script setup lang="ts">
import { Check, Circle, type LucideIcon } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { cn } from '@/lib/utils'
import ExerciseAvatar from '@/components/ExerciseAvatar.vue'
import type { BlockExercise } from '@/types/blocks'

type ExerciseStatus = 'completed' | 'active' | 'pending'

type StatusConfig = {
  icon: LucideIcon
  iconClass: string
  labelKey: string
}

type Props = {
  exercise: BlockExercise
  status: ExerciseStatus
  exerciseNumber: number
  roundNumber?: number
}

const { exercise, status, exerciseNumber, roundNumber } = defineProps<Props>()

const { t } = useI18n()

// Strategy Pattern: Unify status-based configuration into single object
const STATUS_CONFIG: Record<ExerciseStatus, StatusConfig> = {
  completed: {
    icon: Check,
    iconClass: 'text-primary',
    labelKey: 'workouts.benchmarks.queue.exerciseStatus.completed',
  },
  active: {
    icon: Circle,
    iconClass: 'text-primary fill-primary',
    labelKey: 'workouts.benchmarks.queue.exerciseStatus.active',
  },
  pending: {
    icon: Circle,
    iconClass: 'text-muted-foreground',
    labelKey: 'workouts.benchmarks.queue.exerciseStatus.pending',
  },
}

const statusConfig = computed(() => STATUS_CONFIG[status])
const statusIcon = computed(() => statusConfig.value.icon)
const statusIconClass = computed(() => statusConfig.value.iconClass)
const statusLabel = computed(() => t(statusConfig.value.labelKey))

const isActive = computed(() => status === 'active')
const isCompleted = computed(() => status === 'completed')

const ariaLabel = computed(() => {
  const roundInfo = roundNumber
    ? t('workouts.benchmarks.queue.roundInfo', { n: roundNumber })
    : ''
  const exerciseInfo = t('workouts.benchmarks.queue.exerciseInfo', {
    n: exerciseNumber,
    name: exercise.name,
    reps: exercise.prescribedReps,
  })
  return `${roundInfo}${exerciseInfo}, ${statusLabel.value}`
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
        <ExerciseAvatar :name="exercise.name" :image="exercise.image" size="sm" />
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
