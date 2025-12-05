<script setup lang="ts">
import { Timer } from 'lucide-vue-next'
import { useWorkoutDurationTimer } from '@/features/workout/composables/useWorkoutDurationTimer'

const { formattedDuration } = useWorkoutDurationTimer()
</script>

<template>
  <div
    class="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium"
  >
    <span class="relative flex size-2">
      <span
        class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"
      />
      <span class="relative inline-flex size-2 rounded-full bg-primary" />
    </span>
    <Timer class="size-3.5 text-muted-foreground" />
    <span class="font-mono tabular-nums tracking-tight">
      {{ formattedDuration }}
    </span>
  </div>
</template>
