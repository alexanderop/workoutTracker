<script setup lang="ts">
import type { useRestTimer } from '@/composables/useRestTimer'
import { Clock, RotateCcw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface Props {
  timer: ReturnType<typeof useRestTimer>
}

defineProps<Props>()
</script>

<template>
  <div class="sticky bottom-0 bg-background/95 backdrop-blur-sm safe-area-bottom">
    <Separator />

    <!-- Rest Timer Row -->
    <div class="flex items-center justify-between px-4 py-3">
      <div class="flex items-center gap-3">
        <div
          :class="cn(
            'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
            timer.isTimerRunning.value ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
          )"
        >
          <Clock class="w-4 h-4" />
        </div>
        <div class="flex flex-col">
          <span class="text-xs text-muted-foreground">Rest</span>
          <span
            :class="cn(
              'text-xl font-bold font-mono tabular-nums transition-colors',
              timer.isTimerRunning.value ? 'text-primary' : 'text-foreground',
            )"
          >
            {{ timer.getFormattedTime() }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Reset button (only when timer has value) -->
        <Button
          v-if="timer.restTime.value > 0"
          variant="ghost"
          size="icon"
          class="h-9 w-9 text-muted-foreground hover:text-foreground"
          @click="timer.resetTimer"
        >
          <RotateCcw class="w-4 h-4" />
        </Button>

        <!-- Start/Stop toggle -->
        <Button
          size="sm"
          :variant="timer.isTimerRunning.value ? 'default' : 'outline'"
          class="min-w-[72px] transition-all"
          @click="timer.toggleTimer"
        >
          {{ timer.isTimerRunning.value ? 'Stop' : 'Start' }}
        </Button>
      </div>
    </div>

    <!-- Single Finish Button -->
    <div class="px-4 pb-4">
      <Button class="w-full h-12 text-base font-semibold" size="lg">
        Finish Workout
      </Button>
    </div>
  </div>
</template>
