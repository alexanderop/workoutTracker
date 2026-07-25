<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { useAmrapTimer } from '@/blocks/amrap/useAmrapTimer'
import { cn } from '@/lib/utils'
import type { AmrapBlock, AmrapResult } from '@/blocks'
import { BLOCK_COLORS, BLOCK_LABELS, getBlockExerciseList } from '@/blocks'
import WorkoutCircularTimer from '@/blocks/ui/WorkoutCircularTimer.vue'

const { t } = useI18n()

type Properties = {
  block: AmrapBlock
  onComplete?: () => void
}

const { block, onComplete } = defineProps<Properties>()

const emit = defineEmits<{
  'increment-round': []
  'update:isRunning': [value: boolean]
}>()

const timer = useAmrapTimer({ onComplete })

// Emit when isRunning changes so parent can react
watch(timer.isRunning, (isRunning) => {
  emit('update:isRunning', isRunning)
})

const blockColors = computed(() => BLOCK_COLORS.amrap)
const exercises = computed(() => getBlockExerciseList(block))
const currentExercise = computed(() => exercises.value[timer.currentExerciseIndex.value])

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
  <div class="flex-1 flex flex-col items-center justify-center px-4">
    <!-- Circular Timer - gym variant with all info inside -->
    <WorkoutCircularTimer
      variant="gym"
      :progress="timer.progress.value"
      :progress-color="blockColors.text"
      :urgent="isUrgent"
      class="mb-4"
    >
      <!-- Label inside circle -->
      <div class="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">
        {{ BLOCK_LABELS.amrap }}
      </div>

      <!-- MASSIVE time display -->
      <span
        :class="
          cn(
            'text-[5rem] leading-none font-mono tabular-nums font-black tracking-tight transition-colors',
            isUrgent && 'text-destructive animate-pulse',
          )
        "
      >
        {{ timer.formattedRemaining.value }}
      </span>

      <!-- Round counter - prominent inside circle -->
      <div class="mt-2 flex items-center gap-3">
        <span :class="cn('text-4xl font-black tabular-nums', blockColors.text)">
          {{ timer.rounds.value }}
        </span>
        <span class="text-lg text-muted-foreground font-bold uppercase">
          {{ t('workouts.builder.timedCard.rounds') }}
        </span>
      </div>

      <!-- Current Exercise (inside circle) -->
      <div v-if="currentExercise" class="mt-1 text-center max-w-[220px]">
        <p class="text-base font-semibold text-foreground/80 truncate">
          {{ currentExercise.name }}
        </p>
      </div>
    </WorkoutCircularTimer>

    <!-- +1 Button - larger for gym use -->
    <Button
      size="lg"
      variant="outline"
      class="h-14 w-20 text-2xl font-black border-2"
      :class="blockColors.text"
      :disabled="!timer.isRunning.value"
      @click="handleIncrementRound"
    >
      {{ t('workouts.builder.timedCard.plusOne') }}
    </Button>
  </div>
</template>
