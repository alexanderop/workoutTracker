<script setup lang="ts">
import { Check, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-vue-next'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import type { useRestTimer } from '@/composables/useRestTimer'
import { cn } from '@/lib/utils'
import type { WorkoutBlock } from '@/types/blocks'
import { BLOCK_COLORS, isStrengthBlock, isTimedBlock } from '@/types/blocks'

type ButtonVariant = 'default' | 'secondary'

export type TimerDisplayData = {
  isRunning: boolean
  display: string
  label: string
}

type Props = {
  block: WorkoutBlock
  timer?: TimerDisplayData
  canComplete?: boolean
  isFirstBlock?: boolean
  isLastBlock?: boolean
  restTimer?: ReturnType<typeof useRestTimer>
}

const {
  block,
  timer,
  canComplete = true,
  isFirstBlock = false,
  isLastBlock = false,
  restTimer,
} = defineProps<Props>()

const emit = defineEmits<{
  'prev-block': []
  'next-block': []
  'complete-set': []
  'toggle-timer': []
  'complete-block': []
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
    return 'Rest'
  }
  if (isTimedBlock(block) && timer?.label) {
    return timer.label
  }
  return null
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
        label: timer?.isRunning ? 'Pause' : 'Start',
        icon: timer?.isRunning ? Pause : Play,
        emit: 'toggle-timer' as const,
        variant: timer?.isRunning ? 'secondary' : 'default',
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
