<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEmomTimer } from '@/composables/timers/useEmomTimer'
import { cn } from '@/lib/utils'
import type { EmomBlock, EmomResult } from '@/types/blocks'
import { BLOCK_COLORS, getBlockExerciseList } from '@/types/blocks'
import WorkoutCircularTimer from './WorkoutCircularTimer.vue'

const { t } = useI18n()

type Properties = {
  block: EmomBlock
  onComplete?: () => void
}

const { block, onComplete } = defineProps<Properties>()

const emit = defineEmits<{
  'update:isRunning': [value: boolean]
}>()

const timer = useEmomTimer({ onComplete })

// Emit when isRunning changes so parent can react
watch(timer.isRunning, (isRunning) => {
  emit('update:isRunning', isRunning)
})

const blockColors = computed(() => BLOCK_COLORS.emom)
const exercises = computed(() => getBlockExerciseList(block))
const currentExercise = computed(() => exercises.value[timer.currentExerciseIndex.value])

const isUrgent = computed(() => timer.secondsRemainingInMinute.value <= 5)

// Progress within current minute (0-100)
const circularProgress = computed(() => ((60 - timer.secondsRemainingInMinute.value) / 60) * 100)

// Timer display - seconds in current minute
const timerDisplay = computed(() => String(timer.secondsRemainingInMinute.value).padStart(2, '0'))

// Footer display format
const formattedTime = computed(
  () =>
    `${timer.currentMinute.value}/${block.config.minutes} — :${String(timer.secondsRemainingInMinute.value).padStart(2, '0')}`,
)

// Initialize timer on mount
onMounted(() => {
  timer.initialize(block)
})

// Expose for parent coordination
defineExpose({
  complete: (): EmomResult => timer.complete(),
  toggle: () => timer.toggle(),
  reset: () => timer.reset(),
  isRunning: timer.isRunning,
  formattedTime,
  timerLabel: 'EMOM',
})
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center px-4">
    <!-- Circular Timer - gym variant with all info inside -->
    <WorkoutCircularTimer
      variant="gym"
      :progress="circularProgress"
      :progress-color="blockColors.text"
      :urgent="isUrgent"
    >
      <!-- Minute indicator inside circle -->
      <div class="mb-1 flex items-center gap-2">
        <span :class="cn('text-3xl font-black tabular-nums', blockColors.text)">
          {{ timer.currentMinute.value }}
        </span>
        <span class="text-xl text-muted-foreground font-bold">/</span>
        <span class="text-xl text-muted-foreground font-bold tabular-nums">
          {{ block.config.minutes }}
        </span>
        <span class="text-sm text-muted-foreground font-semibold uppercase ml-1">{{ t('timers.labels.minuteAbbr') }}</span>
      </div>

      <!-- MASSIVE seconds display -->
      <span
        :class="
          cn(
            'text-[7rem] leading-none font-mono tabular-nums font-black tracking-tight transition-colors',
            isUrgent && 'text-destructive animate-pulse',
          )
        "
      >
        {{ timerDisplay }}
      </span>

      <!-- Current Exercise (inside circle) -->
      <div v-if="currentExercise" class="mt-2 text-center max-w-[220px]">
        <p class="text-lg font-bold text-foreground truncate">
          {{ currentExercise.name }}
        </p>
        <p class="text-base text-muted-foreground font-semibold">
          {{ currentExercise.prescribedReps }} {{ t('workouts.builder.timedCard.reps') }}
        </p>
      </div>
    </WorkoutCircularTimer>
  </div>
</template>
