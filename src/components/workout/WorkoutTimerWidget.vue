<script setup lang="ts">
import { Clock, Pause, Play, RotateCcw } from 'lucide-vue-next'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import type { useBlockTimer } from '@/composables/useBlockTimer'
import type { useRestTimer } from '@/composables/useRestTimer'
import { cn } from '@/lib/utils'
import type { WorkoutBlock } from '@/types/blocks'
import { BLOCK_LABELS, isTimedBlock } from '@/types/blocks'

type Props = {
  block: WorkoutBlock | undefined
  blockTimer: ReturnType<typeof useBlockTimer>
  restTimer: ReturnType<typeof useRestTimer>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  finish: []
  cancel: []
  'start-block': []
  'complete-block': []
  'increment-round': []
}>()

const isActiveTimedBlock = computed(() => {
  if (!props.block || !isTimedBlock(props.block)) return false
  return props.blockTimer.timerStatus.value.isRunning || props.blockTimer.blockState.value !== null
})

const showTimedBlockUI = computed(() => {
  return props.block && isTimedBlock(props.block)
})

const timedBlock = computed(() => {
  if (!props.block || !isTimedBlock(props.block)) return null
  return props.block
})

// Determine if timer is in final countdown (last 10 seconds)
const isInFinalCountdown = computed(() => {
  if (!isActiveTimedBlock.value) return false
  const remaining = props.blockTimer.timerValues.value.remainingSeconds
  return remaining <= 10 && remaining > 0
})

// Get phase color for Tabata
const phaseColor = computed(() => {
  if (!timedBlock.value || timedBlock.value.kind !== 'tabata') return ''
  return props.blockTimer.blockSpecificValues.value.currentPhase === 'work'
    ? 'text-emerald-500'
    : 'text-amber-500'
})

const phaseBackground = computed(() => {
  if (!timedBlock.value || timedBlock.value.kind !== 'tabata') return ''
  return props.blockTimer.blockSpecificValues.value.currentPhase === 'work'
    ? 'bg-emerald-500/20'
    : 'bg-amber-500/20'
})
</script>

<template>
  <div class="sticky bottom-0 bg-background/95 backdrop-blur-sm safe-area-bottom">
    <Separator />

    <!-- Timed Block Timer UI -->
    <template v-if="showTimedBlockUI && timedBlock">
      <div class="p-4">
        <!-- AMRAP Mode -->
        <template v-if="timedBlock.kind === 'amrap'">
          <div class="text-center space-y-3">
            <div class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {{ BLOCK_LABELS.amrap }}
            </div>

            <!-- Countdown Timer -->
            <div
              :class="
                cn(
                  'text-5xl font-bold font-mono tabular-nums transition-colors',
                  isInFinalCountdown ? 'text-destructive animate-pulse' : 'text-primary',
                )
              "
            >
              {{ blockTimer.timerValues.value.formattedRemaining }}
            </div>

            <!-- Progress Bar -->
            <Progress :model-value="blockTimer.timerValues.value.progress" class="h-2" />

            <!-- Round Counter -->
            <div class="flex items-center justify-center gap-4">
              <div class="text-center">
                <div class="text-3xl font-bold text-foreground">
                  {{ blockTimer.blockSpecificValues.value.roundsCompleted }}
                </div>
                <div class="text-xs text-muted-foreground uppercase">Rounds</div>
              </div>
              <Button
                size="lg"
                variant="outline"
                class="h-14 w-24"
                :disabled="!blockTimer.timerStatus.value.isRunning"
                @click="emit('increment-round')"
              >
                +1
              </Button>
            </div>

            <!-- Controls -->
            <div class="flex gap-3 pt-2">
              <Button variant="outline" class="flex-1 h-12" @click="blockTimer.reset">
                <RotateCcw class="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                :variant="blockTimer.timerStatus.value.isRunning ? 'secondary' : 'default'"
                class="flex-1 h-12"
                @click="blockTimer.toggle"
              >
                <component
                  :is="blockTimer.timerStatus.value.isRunning ? Pause : Play"
                  class="w-4 h-4 mr-2"
                />
                {{ blockTimer.timerStatus.value.isRunning ? 'Pause' : 'Start' }}
              </Button>
              <Button variant="default" class="flex-1 h-12" @click="emit('complete-block')">
                Done
              </Button>
            </div>
          </div>
        </template>

        <!-- EMOM Mode -->
        <template v-else-if="timedBlock.kind === 'emom'">
          <div class="text-center space-y-3">
            <div class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              MINUTE {{ blockTimer.blockSpecificValues.value.currentMinute }} of
              {{ timedBlock.config.minutes }}
            </div>

            <!-- Seconds in Current Minute -->
            <div
              :class="
                cn(
                  'text-6xl font-bold font-mono tabular-nums transition-colors',
                  blockTimer.blockSpecificValues.value.secondsRemainingInMinute <= 10
                    ? 'text-destructive animate-pulse'
                    : 'text-primary',
                )
              "
            >
              :{{
                String(blockTimer.blockSpecificValues.value.secondsRemainingInMinute).padStart(
                  2,
                  '0',
                )
              }}
            </div>

            <!-- Current Exercise -->
            <div v-if="timedBlock.exercises.length > 0" class="text-sm text-muted-foreground">
              {{
                timedBlock.exercises[
                  blockTimer.blockState.value?.kind === 'emom'
                    ? blockTimer.blockState.value.state.currentExerciseIndex
                    : 0
                ]?.name
              }}
            </div>

            <!-- Progress -->
            <Progress :model-value="blockTimer.timerValues.value.progress" class="h-2" />

            <!-- Controls -->
            <div class="flex gap-3 pt-2">
              <Button variant="outline" class="flex-1 h-12" @click="blockTimer.reset">
                <RotateCcw class="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                :variant="blockTimer.timerStatus.value.isRunning ? 'secondary' : 'default'"
                class="flex-1 h-12"
                @click="blockTimer.toggle"
              >
                <component
                  :is="blockTimer.timerStatus.value.isRunning ? Pause : Play"
                  class="w-4 h-4 mr-2"
                />
                {{ blockTimer.timerStatus.value.isRunning ? 'Pause' : 'Start' }}
              </Button>
              <Button variant="default" class="flex-1 h-12" @click="emit('complete-block')">
                Done
              </Button>
            </div>
          </div>
        </template>

        <!-- Tabata Mode -->
        <template v-else-if="timedBlock.kind === 'tabata'">
          <div class="text-center space-y-3">
            <!-- Phase Indicator -->
            <div
              :class="
                cn(
                  'inline-block px-4 py-1 rounded-full text-sm font-bold uppercase',
                  phaseBackground,
                  phaseColor,
                )
              "
            >
              {{ blockTimer.blockSpecificValues.value.currentPhase }}
            </div>

            <!-- Timer -->
            <div
              :class="
                cn(
                  'text-6xl font-bold font-mono tabular-nums transition-colors',
                  blockTimer.blockSpecificValues.value.secondsInCurrentPhase <= 3
                    ? 'text-destructive animate-pulse'
                    : phaseColor,
                )
              "
            >
              :{{
                String(blockTimer.blockSpecificValues.value.secondsInCurrentPhase).padStart(2, '0')
              }}
            </div>

            <!-- Round Indicator -->
            <div class="text-sm text-muted-foreground">
              Round {{ blockTimer.blockSpecificValues.value.currentRound }} /
              {{ timedBlock.config.rounds }}
            </div>

            <!-- Progress -->
            <Progress :model-value="blockTimer.timerValues.value.progress" class="h-2" />

            <!-- Controls -->
            <div class="flex gap-3 pt-2">
              <Button variant="outline" class="flex-1 h-12" @click="blockTimer.reset">
                <RotateCcw class="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                :variant="blockTimer.timerStatus.value.isRunning ? 'secondary' : 'default'"
                class="flex-1 h-12"
                @click="blockTimer.toggle"
              >
                <component
                  :is="blockTimer.timerStatus.value.isRunning ? Pause : Play"
                  class="w-4 h-4 mr-2"
                />
                {{ blockTimer.timerStatus.value.isRunning ? 'Pause' : 'Start' }}
              </Button>
              <Button variant="default" class="flex-1 h-12" @click="emit('complete-block')">
                Done
              </Button>
            </div>
          </div>
        </template>

        <!-- For Time Mode -->
        <template v-else-if="timedBlock.kind === 'fortime'">
          <div class="text-center space-y-3">
            <div class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {{ BLOCK_LABELS.fortime }}
            </div>

            <!-- Count-up Timer -->
            <div class="text-5xl font-bold font-mono tabular-nums text-primary">
              {{ blockTimer.timerValues.value.formattedElapsed }}
            </div>

            <!-- Time Cap (if set) -->
            <div v-if="timedBlock.config.timeCapSeconds" class="text-sm text-muted-foreground">
              Cap: {{ Math.floor(timedBlock.config.timeCapSeconds / 60) }}:{{
                String(timedBlock.config.timeCapSeconds % 60).padStart(2, '0')
              }}
            </div>

            <!-- Progress (only if time cap) -->
            <Progress
              v-if="timedBlock.config.timeCapSeconds"
              :model-value="blockTimer.timerValues.value.progress"
              class="h-2"
            />

            <!-- Controls -->
            <div class="flex gap-3 pt-2">
              <Button variant="outline" class="flex-1 h-12" @click="blockTimer.reset">
                <RotateCcw class="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                :variant="blockTimer.timerStatus.value.isRunning ? 'secondary' : 'default'"
                class="flex-1 h-12"
                @click="blockTimer.toggle"
              >
                <component
                  :is="blockTimer.timerStatus.value.isRunning ? Pause : Play"
                  class="w-4 h-4 mr-2"
                />
                {{ blockTimer.timerStatus.value.isRunning ? 'Pause' : 'Start' }}
              </Button>
              <Button
                variant="default"
                class="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700"
                @click="emit('complete-block')"
              >
                Done
              </Button>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- Standard Rest Timer UI (for strength blocks) -->
    <template v-else>
      <div class="flex items-center justify-between px-4 py-3">
        <div class="flex items-center gap-3">
          <div
            :class="
              cn(
                'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
                restTimer.isRunning.value
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground',
              )
            "
          >
            <Clock class="w-4 h-4" />
          </div>
          <div class="flex flex-col">
            <span class="text-xs text-muted-foreground">Rest</span>
            <span
              :class="
                cn(
                  'text-xl font-bold font-mono tabular-nums transition-colors',
                  restTimer.isRunning.value ? 'text-primary' : 'text-foreground',
                )
              "
            >
              {{ restTimer.formattedTime }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Reset button (only when timer has value) -->
          <Button
            v-if="restTimer.elapsedSeconds.value > 0"
            variant="ghost"
            size="icon"
            class="h-9 w-9 text-muted-foreground hover:text-foreground"
            @click="restTimer.reset"
          >
            <RotateCcw class="w-4 h-4" />
          </Button>

          <!-- Start/Stop toggle -->
          <Button
            size="sm"
            :variant="restTimer.isRunning.value ? 'default' : 'outline'"
            class="min-w-[72px] transition-all"
            @click="restTimer.toggle"
          >
            {{ restTimer.isRunning.value ? 'Stop' : 'Start' }}
          </Button>
        </div>
      </div>
    </template>

    <!-- Action Buttons -->
    <div class="flex gap-3 px-4 pb-4">
      <Button
        variant="outline"
        class="flex-1 h-12 text-base font-semibold"
        size="lg"
        @click="emit('cancel')"
      >
        Cancel
      </Button>
      <Button class="flex-1 h-12 text-base font-semibold" size="lg" @click="emit('finish')">
        Finish Workout
      </Button>
    </div>
  </div>
</template>
