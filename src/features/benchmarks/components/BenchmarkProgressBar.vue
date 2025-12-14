<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type Props = {
  current: number // 1-based current exercise
  total: number
}

const { current, total } = defineProps<Props>()
const { t } = useI18n()

const progressPercent = computed(() => {
  if (total === 0) return 0
  return ((current - 1) / total) * 100
})

const dotPosition = computed(() => {
  if (total === 0) return 0
  // Position dot at current exercise (not after it)
  return ((current - 0.5) / total) * 100
})
</script>

<template>
  <div
    role="progressbar"
    :aria-valuenow="current"
    :aria-valuemin="1"
    :aria-valuemax="total"
    :aria-label="t('workouts.progress.announcement', { current, total })"
    class="flex items-center gap-3"
  >
    <!-- Progress bar -->
    <div class="flex-1 h-1.5 bg-muted rounded-full relative overflow-hidden">
      <!-- Completed portion -->
      <div
        class="absolute inset-y-0 left-0 bg-primary/40 rounded-full transition-all duration-300"
        :style="{ width: `${progressPercent}%` }"
      />
      <!-- Current position dot -->
      <div
        class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-3 bg-primary rounded-full shadow-sm shadow-primary/50 transition-all duration-300"
        :style="{ left: `${dotPosition}%` }"
      />
    </div>

    <!-- Exercise count -->
    <span class="text-sm font-medium tabular-nums text-muted-foreground min-w-[3ch]">
      {{ t('workouts.progress.exerciseCount', { current, total }) }}
    </span>
  </div>
</template>
