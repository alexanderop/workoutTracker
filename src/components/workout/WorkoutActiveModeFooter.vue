<script setup lang="ts">
import { Check, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-vue-next'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import type { useBlockTimer } from '@/composables/useBlockTimer'
import type { useRestTimer } from '@/composables/useRestTimer'
import { cn } from '@/lib/utils'
import type { WorkoutBlock } from '@/types/blocks'
import { BLOCK_COLORS, isStrengthBlock, isTimedBlock } from '@/types/blocks'

type ButtonVariant = 'default' | 'secondary'

type Props = {
  block: WorkoutBlock
  isTimerRunning?: boolean
  canComplete?: boolean
  isFirstBlock?: boolean
  isLastBlock?: boolean
  blockTimer?: ReturnType<typeof useBlockTimer>
  restTimer?: ReturnType<typeof useRestTimer>
}

const {
  block,
  isTimerRunning = false,
  canComplete = true,
  isFirstBlock = false,
  isLastBlock = false,
  blockTimer,
  restTimer,
} = defineProps<Props>()

const emit = defineEmits<{
  'prev-block': []
  'next-block': []
  'complete-set': []
  'increment-round': []
  'toggle-timer': []
  'complete-block': []
}>()

const blockColors = computed(() => BLOCK_COLORS[block.kind])

// Timer display for footer
const timerDisplay = computed((): string | null => {
  // For strength blocks, show rest timer
  if (isStrengthBlock(block) && restTimer) {
    const elapsed = restTimer.elapsedSeconds.value
    if (elapsed === 0) return null
    const mins = Math.floor(elapsed / 60)
    const secs = elapsed % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  // For timed blocks, show appropriate timer
  if (isTimedBlock(block) && blockTimer?.blockState.value) {
    const specific = blockTimer.blockSpecificValues.value
    const values = blockTimer.timerValues.value
    const kind = block.kind
    switch (kind) {
      case 'emom':
        return `${specific.currentMinute}/${block.config.minutes} — :${String(specific.secondsRemainingInMinute).padStart(2, '0')}`
      case 'tabata': {
        const phase = specific.currentPhase === 'work' ? 'WORK' : 'REST'
        return `R${specific.currentRound}/${block.config.rounds} ${phase} :${String(specific.secondsInCurrentPhase).padStart(2, '0')}`
      }
      case 'amrap':
        return values.formattedRemaining
      case 'fortime':
        return values.formattedElapsed
      default: {
        const _exhaustive: never = kind
        return _exhaustive
      }
    }
  }

  return null
})

const timerLabel = computed((): string | null => {
  if (isStrengthBlock(block) && restTimer?.elapsedSeconds.value) {
    return 'Rest'
  }
  if (isTimedBlock(block) && blockTimer?.blockState.value) {
    return block.kind.toUpperCase()
  }
  return null
})

const isTimerUrgent = computed(() => {
  if (!blockTimer?.blockState.value || !isTimedBlock(block)) return false

  const specific = blockTimer.blockSpecificValues.value
  const values = blockTimer.timerValues.value
  switch (block.kind) {
    case 'emom':
      return specific.secondsRemainingInMinute <= 5
    case 'tabata':
      return specific.secondsInCurrentPhase <= 3
    case 'amrap':
      return values.remainingSeconds <= 10
    default:
      return false
  }
})

const primaryAction = computed(() => {
  if (isStrengthBlock(block)) {
    return {
      label: 'Complete Set',
      icon: Check,
      emit: 'complete-set' as const,
      variant: canComplete ? 'default' : 'secondary',
    }
  }

  const kind = block.kind
  switch (kind) {
    case 'amrap':
    case 'emom':
    case 'tabata':
      return {
        label: isTimerRunning ? 'Pause' : 'Start',
        icon: isTimerRunning ? Pause : Play,
        emit: 'toggle-timer' as const,
        variant: isTimerRunning ? 'secondary' : 'default',
      }
    case 'fortime':
      return {
        label: 'Done',
        icon: Check,
        emit: 'complete-block' as const,
        variant: 'default',
      }
    default: {
      // Exhaustive check - kind should be 'never' here
      kind satisfies never
      return {
        label: 'Unknown',
        icon: Check,
        emit: 'complete-block' as const,
        variant: 'default' as const,
      }
    }
  }
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
  }
}
</script>

<template>
  <footer class="px-4 pb-4 pt-2 safe-area-bottom bg-background/95 backdrop-blur-sm">
    <!-- Timer Display Row -->
    <div
      v-if="timerDisplay"
      :class="
        cn(
          'flex items-center justify-center gap-3 py-2 mb-2 -mx-4 px-4',
          isTimerUrgent && 'bg-destructive/10',
        )
      "
    >
      <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {{ timerLabel }}
      </span>
      <span
        :class="
          cn(
            'font-mono text-2xl font-bold tabular-nums',
            isTimerUrgent ? 'text-destructive animate-pulse' : blockColors.text,
          )
        "
      >
        {{ timerDisplay }}
      </span>
    </div>

    <!-- Action Buttons Row -->
    <div class="flex items-center gap-3">
      <!-- Previous block -->
      <Button
        variant="outline"
        size="icon"
        class="h-12 w-12 flex-shrink-0"
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
        :disabled="isLastBlock"
        @click="emit('next-block')"
      >
        <ChevronRight class="size-5" />
      </Button>
    </div>
  </footer>
</template>
