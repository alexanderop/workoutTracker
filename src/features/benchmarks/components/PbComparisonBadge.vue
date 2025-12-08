<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PbComparisonResult } from '@/features/benchmarks/composables/usePbComparison'
import { formatDuration } from '@/lib/formatters'

type Props = {
  comparisonResult: PbComparisonResult
}

const { comparisonResult } = defineProps<Props>()
const { t } = useI18n()

// Format improvement time as human-readable string
const improvementText = computed(() => {
  if (comparisonResult.status !== 'new-pb') return ''

  const seconds = comparisonResult.improvement

  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (remainingSeconds === 0) {
      const timeStr = `${minutes} ${t(`workouts.benchmarks.pb.${minutes === 1 ? 'minute' : 'minutes'}`)}`
      return t('workouts.benchmarks.pb.faster', { time: timeStr })
    }

    const timeStr = `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
    return t('workouts.benchmarks.pb.faster', { time: timeStr })
  }

  const timeStr = `${seconds} ${t(`workouts.benchmarks.pb.${seconds === 1 ? 'second' : 'seconds'}`)}`
  return t('workouts.benchmarks.pb.faster', { time: timeStr })
})

const previousTimeFormatted = computed(() => {
  if (comparisonResult.status === 'first-pb') return ''
  return formatDuration(comparisonResult.previousTime)
})
</script>

<template>
  <!-- New PB or First PB: render badge (nothing for no-pb) -->
  <div
    v-if="comparisonResult.status !== 'no-pb'"
    role="status"
    aria-live="polite"
    class="rounded-xl px-6 py-4 text-center bg-gradient-to-br"
    :class="{
      'from-green-500/20 to-green-600/10': comparisonResult.status === 'new-pb',
      'from-blue-500/20 to-blue-600/10': comparisonResult.status === 'first-pb',
    }"
  >
    <!-- New PB -->
    <template v-if="comparisonResult.status === 'new-pb'">
      <div class="text-2xl font-bold mb-2">
        {{ t('workouts.benchmarks.pb.newPb') }}
      </div>
      <div class="text-lg font-semibold text-green-600 dark:text-green-400">
        {{ improvementText }}
      </div>
      <div class="text-sm text-muted-foreground mt-2">
        {{ t('workouts.benchmarks.pb.previous') }} {{ previousTimeFormatted }}
      </div>
    </template>

    <!-- First PB -->
    <template v-if="comparisonResult.status === 'first-pb'">
      <div class="text-2xl font-bold">
        {{ t('workouts.benchmarks.pb.firstPb') }}
      </div>
    </template>
  </div>
</template>
