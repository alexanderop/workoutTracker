<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { useAmrapTimer } from '@/composables/timers/useAmrapTimer'
import { cn } from '@/lib/utils'
import type { AmrapBlock, AmrapResult } from '@/types/blocks'
import { BLOCK_COLORS, BLOCK_LABELS, getBlockExerciseList } from '@/types/blocks'
import WorkoutCircularTimer from './WorkoutCircularTimer.vue'

type Props = {
  block: AmrapBlock
  onComplete?: () => void
}

const { block, onComplete } = defineProps<Props>()

const emit = defineEmits<{
  'increment-round': []
}>()

const timer = useAmrapTimer({ onComplete })

const blockColors = computed(() => BLOCK_COLORS.amrap)
const exercises = computed(() => getBlockExerciseList(block))
const currentExercise = computed(() => exercises.value[timer.currentExerciseIndex.value])

const nextExercises = computed(() => {
  if (exercises.value.length <= 1) return []
  const next = []
  for (let i = 1; i <= 2; i++) {
    const idx = (timer.currentExerciseIndex.value + i) % exercises.value.length
    if (exercises.value[idx]) {
      next.push(exercises.value[idx])
    }
  }
  return next
})

const isUrgent = computed(() => timer.remainingSeconds.value <= 10)

// Initialize timer on mount
onMounted(() => {
  timer.initialize(block)
})

function handleIncrementRound() {
  timer.incrementRound()
  emit('increment-round')
}

// Expose for parent coordination
defineExpose({
  complete: (): AmrapResult => timer.complete(),
  toggle: () => timer.toggle(),
  reset: () => timer.reset(),
  isRunning: timer.isRunning,
  formattedTime: timer.formattedRemaining,
  timerLabel: BLOCK_LABELS.amrap,
})
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center px-6">
    <!-- Progress label -->
    <div class="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
      {{ BLOCK_LABELS.amrap }}
    </div>

    <!-- Circular Timer -->
    <WorkoutCircularTimer
      :progress="timer.progress.value"
      :progress-color="blockColors.text"
      :urgent="isUrgent"
      class="mb-6"
    >
      <span
        :class="
          cn(
            'text-5xl font-mono tabular-nums font-bold transition-colors',
            isUrgent && 'text-destructive animate-pulse',
          )
        "
      >
        {{ timer.formattedRemaining.value }}
      </span>

      <!-- Current Exercise (inside circle) -->
      <div v-if="currentExercise" class="mt-4 text-center max-w-[200px]">
        <p class="text-lg font-semibold text-foreground truncate">
          {{ currentExercise.name }}
        </p>
        <p class="text-sm text-muted-foreground">{{ currentExercise.prescribedReps }} reps</p>
      </div>
    </WorkoutCircularTimer>

    <!-- Next Exercises -->
    <div v-if="nextExercises.length > 0" class="flex items-center gap-2 text-muted-foreground mb-6">
      <span class="text-xs uppercase tracking-wide">Next:</span>
      <span v-for="(ex, i) in nextExercises" :key="ex.id" class="text-sm">
        {{ ex.name }}<span v-if="i < nextExercises.length - 1" class="mx-1">&rarr;</span>
      </span>
    </div>

    <!-- Round Counter -->
    <div class="flex items-center gap-6">
      <div class="text-center">
        <div :class="cn('text-5xl font-bold tabular-nums', blockColors.text)">
          {{ timer.rounds.value }}
        </div>
        <div class="text-xs text-muted-foreground uppercase tracking-wider mt-1">Rounds</div>
      </div>
      <Button
        size="lg"
        variant="outline"
        class="h-16 w-20 text-xl font-bold"
        :disabled="!timer.isRunning.value"
        @click="handleIncrementRound"
      >
        +1
      </Button>
    </div>
  </div>
</template>
