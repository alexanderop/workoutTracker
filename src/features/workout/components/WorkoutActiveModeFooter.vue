<script setup lang="ts">
import { Check, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import type { useRestTimer } from '@/composables/timers/useRestTimer'
import { cn } from '@/lib/utils'
import type { WorkoutBlock } from '@/types/blocks'
import { BLOCK_COLORS, isStrengthBlock, isTimedBlock } from '@/types/blocks'

const { t } = useI18n()

type ButtonVariant = 'default' | 'secondary'

type PrimaryAction = {
  label: string
  icon: typeof Check
  emit: 'complete-set' | 'toggle-timer' | 'complete-block' | 'next-exercise'
  variant: ButtonVariant
}

export type TimerDisplayData = {
  isRunning: boolean
  display: string
  label: string
}

type WorkoutState = {
  canComplete?: boolean
  isFirstBlock?: boolean
  isLastBlock?: boolean
  isBenchmarkMode?: boolean
  isLastExercise?: boolean
}

type Props = {
  block: WorkoutBlock
  timer?: TimerDisplayData
  restTimer?: ReturnType<typeof useRestTimer>
  state?: WorkoutState
}

const {
  block,
  timer,
  restTimer,
  state = {},
} = defineProps<Props>()

const {
  canComplete = true,
  isFirstBlock = false,
  isLastBlock = false,
  isBenchmarkMode = false,
  isLastExercise = false,
} = state

const emit = defineEmits<{
  'prev-block': []
  'next-block': []
  'complete-set': []
  'toggle-timer': []
  'complete-block': []
  'next-exercise': []
}>()

const blockColors = computed(() => BLOCK_COLORS[block.kind])

// Timer display for footer - uses props for timed blocks, computes for rest timer
const displayedTimer = computed((): string | null => {
  // For strength blocks, show rest timer
  if (isStrengthBlock(block) && restTimer) {
    const elapsed = restTimer.elapsedSeconds.value
    if (elapsed === 0) return null
    const mins = Math.floor(elapsed / 60)
    const secs = elapsed % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  // For timed blocks, use the prop value passed from parent
  if (isTimedBlock(block) && timer?.display) {
    return timer.display
  }

  return null
})

const displayedTimerLabel = computed((): string | null => {
  if (isStrengthBlock(block) && restTimer?.elapsedSeconds.value) {
    return t('workouts.active.footer.rest')
  }
  if (isTimedBlock(block) && timer?.label) {
    return timer.label
  }
  return null
})

// Strategy: Strength blocks show "Complete Set"
function getStrengthAction(): PrimaryAction {
  return {
    label: t('workouts.active.footer.completeSet'),
    icon: Check,
    emit: 'complete-set',
    variant: canComplete ? 'default' : 'secondary',
  }
}

// Strategy: Timer-controlled blocks (amrap, emom, tabata) toggle play/pause
function getTimerToggleAction(isRunning: boolean): PrimaryAction {
  return {
    label: isRunning
      ? t('workouts.active.footer.pause')
      : t('workouts.active.footer.start'),
    icon: isRunning ? Pause : Play,
    emit: 'toggle-timer',
    variant: isRunning ? 'secondary' : 'default',
  }
}

// Strategy: ForTime blocks show "Done" to mark completion
function getForTimeAction(): PrimaryAction {
  return {
    label: t('workouts.active.footer.done'),
    icon: Check,
    emit: 'complete-block',
    variant: 'default',
  }
}

// Strategy: Benchmark ForTime blocks show "Next Exercise" or "Done" based on position
function getBenchmarkAction(): PrimaryAction {
  if (isLastExercise) {
    return getForTimeAction()
  }
  return {
    label: 'Next Exercise',
    icon: ChevronRight,
    emit: 'next-exercise',
    variant: 'default',
  }
}

const primaryAction = computed((): PrimaryAction => {
  if (isStrengthBlock(block)) return getStrengthAction()

  // Benchmark mode: Show exercise navigation
  if (isBenchmarkMode && block.kind === 'fortime') {
    return getBenchmarkAction()
  }

  const isRunning = timer?.isRunning ?? false
  const actionByKind: Record<'amrap' | 'emom' | 'tabata' | 'fortime', () => PrimaryAction> = {
    amrap: () => getTimerToggleAction(isRunning),
    emom: () => getTimerToggleAction(isRunning),
    tabata: () => getTimerToggleAction(isRunning),
    fortime: getForTimeAction,
  }

  return actionByKind[block.kind]()
})

function handlePrimaryAction() {
  const action = primaryAction.value.emit
  switch (action) {
    case 'complete-set':
      emit('complete-set')
      break
    case 'toggle-timer':
      emit('toggle-timer')
      break
    case 'complete-block':
      emit('complete-block')
      break
    case 'next-exercise':
      emit('next-exercise')
      break
  }
}
</script>

<template>
  <footer class="px-4 pb-4 pt-2 safe-area-bottom bg-background/95 backdrop-blur-sm">
    <!-- Timer Display Row -->
    <div v-if="displayedTimer" class="flex items-center justify-center gap-3 py-2 mb-2 -mx-4 px-4">
      <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {{ displayedTimerLabel }}
      </span>
      <span :class="cn('font-mono text-2xl font-bold tabular-nums', blockColors.text)">
        {{ displayedTimer }}
      </span>
    </div>

    <!-- Action Buttons Row -->
    <div class="flex items-center gap-3">
      <!-- Previous block -->
      <Button
        variant="outline"
        size="icon"
        class="h-12 w-12 flex-shrink-0"
        :aria-label="t('common.aria.previousBlock')"
        :disabled="isFirstBlock"
        @click="emit('prev-block')"
      >
        <ChevronLeft class="size-5" />
      </Button>

      <!-- Primary action -->
      <Button
        :variant="primaryAction.variant as ButtonVariant"
        size="lg"
        :class="
          cn(
            'flex-1 h-14 text-lg font-semibold gap-2',
            primaryAction.variant === 'default' && blockColors.accent,
          )
        "
        :disabled="isStrengthBlock(block) && !canComplete"
        @click="handlePrimaryAction"
      >
        <component :is="primaryAction.icon" class="size-5" />
        {{ primaryAction.label }}
      </Button>

      <!-- Next block -->
      <Button
        variant="outline"
        size="icon"
        class="h-12 w-12 flex-shrink-0"
        :aria-label="t('common.aria.nextBlock')"
        :disabled="isLastBlock"
        @click="emit('next-block')"
      >
        <ChevronRight class="size-5" />
      </Button>
    </div>
  </footer>
</template>
