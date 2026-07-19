<script lang="ts">
// +/-15s taps on the rest timer adjust the persisted default rest target
// in-place.
// Also used by the parent as the floor a running countdown may be lowered to,
// and interpolated into the +/- buttons' aria labels.
export const REST_ADJUST_STEP_SECONDS = 15

export type TimerDisplayData = {
  isRunning: boolean
  display: string
  label: string
}
</script>

<script setup lang="ts">
import { Check, ChevronLeft, ChevronRight, Minus, Pause, Play, Plus } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import type { useRestTimer } from '@/composables/timers/useRestTimer'
import { cn } from '@/lib/utils'
import type { WorkoutBlock } from '@/types/blocks'
import { BLOCK_COLORS, isCardioBlock, isStrengthBlock, isTimedBlock } from '@/types/blocks'

const { t } = useI18n()

type ButtonVariant = 'default' | 'secondary'

type PrimaryAction = {
  label: string
  icon: typeof Check
  emit: 'complete-set' | 'toggle-timer' | 'complete-block'
  variant: ButtonVariant
}

type WorkoutState = {
  canComplete?: boolean
  isFirstBlock?: boolean
  isLastBlock?: boolean
  isTransitioning?: boolean
}

type Properties = {
  block: WorkoutBlock
  timer?: TimerDisplayData
  restTimer?: ReturnType<typeof useRestTimer>
  state?: WorkoutState
}

const { block, timer, restTimer, state: propertiesState } = defineProps<Properties>()

const state = computed(() => propertiesState ?? {})

const canComplete = computed(() => state.value.canComplete ?? true)
const isFirstBlock = computed(() => state.value.isFirstBlock ?? false)
const isLastBlock = computed(() => state.value.isLastBlock ?? false)
const isTransitioning = computed(() => state.value.isTransitioning ?? false)

const emit = defineEmits<{
  'prev-block': []
  'next-block': []
  'complete-set': []
  'toggle-timer': []
  'complete-block': []
  'adjust-rest-target': [deltaSeconds: number]
  'dismiss-rest': []
}>()

const blockColors = computed(() => BLOCK_COLORS[block.kind])

// The rest timer row is shown once a rest is in progress (elapsed > 0) --
// distinct from timed-block rows (AMRAP/EMOM/...), which are read-only and
// driven by the `timer` prop instead.
const isRestRow = computed(
  () => isStrengthBlock(block) && !!restTimer && restTimer.elapsedSeconds.value > 0,
)
const restIsDone = computed(() => isRestRow.value && (restTimer?.isDone.value ?? false))
const showRestAdjustButtons = computed(
  () => isRestRow.value && (restTimer?.hasTarget.value ?? false),
)

// Timer display for footer - uses props for timed blocks, computes for rest timer
const displayedTimer = computed((): string | null => {
  if (isRestRow.value && restTimer) {
    return restIsDone.value
      ? t('workouts.active.footer.restComplete')
      : restTimer.formattedTime.value
  }

  // For timed blocks, use the prop value passed from parent
  if (isTimedBlock(block) && timer?.display) {
    return timer.display
  }

  return null
})

const displayedTimerLabel = computed((): string | null => {
  if (isRestRow.value) {
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
    variant: canComplete.value ? 'default' : 'secondary',
  }
}

// Strategy: Timer-controlled blocks (amrap, emom, tabata) toggle play/pause
function getTimerToggleAction(isRunning: boolean): PrimaryAction {
  return {
    label: isRunning ? t('workouts.active.footer.pause') : t('workouts.active.footer.start'),
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

// Strategy: Cardio blocks show "Done" when completed
function getCardioAction(): PrimaryAction {
  return {
    label: t('workouts.active.footer.done'),
    icon: Check,
    emit: 'complete-block',
    variant: 'default',
  }
}

const primaryAction = computed((): PrimaryAction => {
  if (isStrengthBlock(block)) return getStrengthAction()
  if (isCardioBlock(block)) return getCardioAction()

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
    case 'complete-set': {
      emit('complete-set')
      break
    }
    case 'toggle-timer': {
      emit('toggle-timer')
      break
    }
    case 'complete-block': {
      emit('complete-block')
      break
    }
  }
}
</script>

<template>
  <footer class="px-4 pb-4 pt-2 safe-area-bottom bg-background/95 backdrop-blur-sm">
    <!-- Timer Display Row -->
    <div
      v-if="displayedTimer"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      class="flex items-center justify-center gap-1 py-2 mb-2 -mx-4 px-4"
    >
      <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-2">
        {{ displayedTimerLabel }}
      </span>

      <!-- Rest timer: adjustable via +/-15s and tap-to-dismiss. Never blocks
           logging -- purely informational, no modal. -->
      <template v-if="isRestRow">
        <Button
          v-if="showRestAdjustButtons"
          variant="ghost"
          size="icon"
          class="size-touch shrink-0"
          :aria-label="t('common.aria.decreaseRestTarget', { seconds: REST_ADJUST_STEP_SECONDS })"
          @click="emit('adjust-rest-target', -REST_ADJUST_STEP_SECONDS)"
        >
          <Minus class="icon-sm" aria-hidden="true" />
        </Button>

        <button
          type="button"
          :class="
            cn(
              'font-mono text-2xl font-bold tabular-nums px-2 rounded-md transition-colors',
              restIsDone ? 'text-success' : blockColors.text,
            )
          "
          :aria-label="t('common.aria.dismissRestTimer')"
          @click="emit('dismiss-rest')"
        >
          {{ displayedTimer }}
        </button>

        <Button
          v-if="showRestAdjustButtons"
          variant="ghost"
          size="icon"
          class="size-touch shrink-0"
          :aria-label="t('common.aria.increaseRestTarget', { seconds: REST_ADJUST_STEP_SECONDS })"
          @click="emit('adjust-rest-target', REST_ADJUST_STEP_SECONDS)"
        >
          <Plus class="icon-sm" aria-hidden="true" />
        </Button>
      </template>

      <span v-else :class="cn('font-mono text-2xl font-bold tabular-nums', blockColors.text)">
        {{ displayedTimer }}
      </span>
    </div>

    <!-- Action Buttons Row -->
    <div class="flex items-center gap-3">
      <!-- Previous block -->
      <Button
        variant="outline"
        size="icon"
        class="size-touch flex-shrink-0"
        :aria-label="t('common.aria.previousBlock')"
        :disabled="isFirstBlock"
        @click="emit('prev-block')"
      >
        <ChevronLeft class="icon-md" aria-hidden="true" />
      </Button>

      <!-- Primary action -->
      <Button
        :variant="primaryAction.variant"
        size="lg"
        :class="
          cn(
            'flex-1 h-touch text-lg font-semibold gap-2',
            primaryAction.variant === 'default' && blockColors.accent,
          )
        "
        :disabled="(isStrengthBlock(block) && !canComplete) || isTransitioning"
        @click="handlePrimaryAction"
      >
        <component :is="primaryAction.icon" class="icon-md" aria-hidden="true" />
        {{ primaryAction.label }}
      </Button>

      <!-- Next block -->
      <Button
        variant="outline"
        size="icon"
        class="size-touch flex-shrink-0"
        :aria-label="t('common.aria.nextBlock')"
        :disabled="isLastBlock"
        @click="emit('next-block')"
      >
        <ChevronRight class="icon-md" aria-hidden="true" />
      </Button>
    </div>
  </footer>
</template>
