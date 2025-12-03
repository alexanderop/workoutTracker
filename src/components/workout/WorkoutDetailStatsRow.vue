<script setup lang="ts">
import { computed } from 'vue'
import { Clock, Dumbbell, Flame, Target } from 'lucide-vue-next'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import type { WorkoutStats } from '@/composables/useWorkoutDetail'
import { formatDuration } from '@/lib/formatters'

const { stats } = defineProps<{
  stats: WorkoutStats
}>()

const { toDisplayValue, unitLabel } = useWeightDisplay()

const displayedWeight = computed(() => toDisplayValue(stats.totalWeight) ?? 0)
const weightLabelText = computed(() => `${unitLabel.value} lifted`)
</script>

<template>
  <div class="grid grid-cols-4 gap-2 border-b bg-muted/30 px-4 py-3">
    <div class="text-center">
      <div class="flex justify-center">
        <Clock class="h-4 w-4 text-muted-foreground" />
      </div>
      <div class="mt-1 font-mono text-sm font-semibold tabular-nums">
        {{ formatDuration(stats.duration) }}
      </div>
      <div class="text-xs text-muted-foreground">Duration</div>
    </div>

    <div class="text-center">
      <div class="flex justify-center">
        <Dumbbell class="h-4 w-4 text-muted-foreground" />
      </div>
      <div class="mt-1 font-mono text-sm font-semibold tabular-nums">
        {{ stats.exerciseCount }}
      </div>
      <div class="text-xs text-muted-foreground">Exercises</div>
    </div>

    <div class="text-center">
      <div class="flex justify-center">
        <Target class="h-4 w-4 text-muted-foreground" />
      </div>
      <div class="mt-1 font-mono text-sm font-semibold tabular-nums">
        {{ stats.setCount }}
      </div>
      <div class="text-xs text-muted-foreground">Sets</div>
    </div>

    <div class="text-center">
      <div class="flex justify-center">
        <Flame class="h-4 w-4 text-muted-foreground" />
      </div>
      <div class="mt-1 font-mono text-sm font-semibold tabular-nums">
        {{ displayedWeight }}
      </div>
      <div class="text-xs text-muted-foreground">{{ weightLabelText }}</div>
    </div>
  </div>
</template>
