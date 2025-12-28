<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { TrendingDown, TrendingUp, Minus } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import type { WeightStats } from '../composables/useWeightStats'

const { stats } = defineProps<{
  stats: WeightStats
}>()

const { t } = useI18n()
const { formatWithUnit, toDisplayValue, unitLabel } = useWeightDisplay()

const currentDisplay = computed(() => {
  if (stats.current === null) return '—'
  return formatWithUnit(stats.current, 1)
})

const change7dDisplay = computed(() => {
  if (stats.change7d === null) return null
  const display = toDisplayValue(Math.abs(stats.change7d))
  if (display === undefined) return null
  const sign = stats.change7d >= 0 ? '+' : '-'
  return `${sign}${display.toFixed(1)} ${unitLabel.value}`
})

const trendIcon = computed(() => {
  if (stats.trend === 'up') return TrendingUp
  if (stats.trend === 'down') return TrendingDown
  return Minus
})

const trendClass = computed(() => {
  if (stats.trend === 'up') return 'text-amber-500'
  if (stats.trend === 'down') return 'text-green-500'
  return 'text-muted-foreground'
})
</script>

<template>
  <Card>
    <CardContent class="p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-muted-foreground">{{ t('weight.current') }}</p>
          <p class="text-2xl font-bold">{{ currentDisplay }}</p>
        </div>
        <div v-if="change7dDisplay" class="text-right">
          <p class="text-sm text-muted-foreground">{{ t('weight.change7d') }}</p>
          <div class="flex items-center justify-end gap-1">
            <component :is="trendIcon" class="h-4 w-4" :class="trendClass" />
            <span class="text-lg font-medium" :class="trendClass">
              {{ change7dDisplay }}
            </span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
