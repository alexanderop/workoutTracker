<script setup lang="ts">
import type { useRestTimer } from '@/composables/useRestTimer'
import { Clock } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface Props {
  timer: ReturnType<typeof useRestTimer>
}

defineProps<Props>()
</script>

<template>
  <div class="sticky bottom-0 bg-background/95 backdrop-blur-sm">
    <Separator />
    <!-- Rest Timer Widget -->
    <div class="flex items-center justify-between p-4">
      <div class="flex items-center gap-3">
        <Clock class="w-4 h-4 text-muted-foreground" />
        <span class="text-sm font-semibold text-muted-foreground">
          Rest Timer
        </span>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-lg font-bold font-mono w-12 text-right">
          {{ timer.getFormattedTime() }}
        </span>
        <Button
          size="sm"
          :variant="timer.isTimerRunning.value ? 'default' : 'outline'"
          class="px-3"
          @click="timer.toggleTimer"
        >
          {{ timer.isTimerRunning.value ? 'Stop' : 'Start' }}
        </Button>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="p-4 space-y-2">
      <Button class="w-full" size="lg">
        Finish Workout
      </Button>
      <Button variant="outline" class="w-full" size="sm">
        Save & Exit
      </Button>
    </div>
  </div>
</template>
