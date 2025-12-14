<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Progress } from '@/components/ui/progress'

type Props = {
  current: number // 1-based current exercise
  total: number
}

const { current, total } = defineProps<Props>()
const { t } = useI18n()

const progressPercent = computed(() => {
  if (total === 0) return 0
  // Show progress as percentage of completed exercises
  // current=1 of 3 → 0%, current=2 of 3 → 33%, current=3 of 3 → 66%
  return ((current - 1) / total) * 100
})
</script>

<template>
  <div
    role="status"
    :aria-label="t('workouts.progress.announcement', { current, total })"
    class="flex items-center gap-3"
  >
    <!-- Progress bar using shadcn component -->
    <Progress
      :model-value="progressPercent"
      class="flex-1 h-2"
    />

    <!-- Exercise count -->
    <span class="text-sm font-medium tabular-nums text-muted-foreground min-w-[3ch]">
      {{ t('workouts.progress.exerciseCount', { current, total }) }}
    </span>
  </div>
</template>
