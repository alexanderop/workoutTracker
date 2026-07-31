<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import StatTrendCard from '@/components/dashboard/StatTrendCard.vue'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import { RouteNames } from '@/router'
import { useWeightEntries } from '../composables/useWeightEntries'
import { trailingAverage } from '../lib/weightCalculations'

/** Entries per sparkline — the tile reads "Last 7 Entries". */
const TILE_ENTRY_COUNT = 7

/** Entries averaged per trend point, smoothing day-to-day scale noise. */
const TREND_WINDOW = 3

const { metric } = defineProps<{
  /**
   * `trend` smooths the entries into a trailing average, `scale` plots them
   * raw, `bodyFat` plots the body-fat percentages of entries carrying one.
   */
  metric: 'trend' | 'scale' | 'bodyFat'
}>()

const { t } = useI18n()
const router = useRouter()
const { entries } = useWeightEntries()
const { toDisplayValue, unitLabel } = useWeightDisplay()

// `entries` is newest first; sparklines plot oldest first.
const weightsOldestFirst = computed(() => entries.value.map((entry) => entry.weight).toReversed())

const data = computed<ReadonlyArray<number>>(() => {
  if (metric === 'bodyFat') {
    return entries.value
      .map((entry) => entry.bodyFatPct)
      .filter((pct): pct is number => pct !== undefined)
      .toReversed()
      .slice(-TILE_ENTRY_COUNT)
  }
  if (metric === 'trend') {
    return trailingAverage(weightsOldestFirst.value, TREND_WINDOW).slice(-TILE_ENTRY_COUNT)
  }
  return weightsOldestFirst.value.slice(-TILE_ENTRY_COUNT)
})

const value = computed(() => {
  const latest = data.value.at(-1)
  if (latest === undefined) return '—'
  if (metric === 'bodyFat') return latest.toFixed(1)
  return toDisplayValue(latest)?.toFixed(1) ?? '—'
})

const title = computed(() => {
  if (metric === 'trend') return t('weight.trend')
  if (metric === 'scale') return t('weight.scaleWeight')
  return t('weight.bodyFat')
})

const chartLabel = computed(() =>
  metric === 'bodyFat'
    ? t('weight.bodyFatChartLabel', { count: data.value.length })
    : t('weight.chartLabel', { count: data.value.length }),
)

const COLOR = {
  trend: 'var(--primary)',
  scale: 'var(--success)',
  bodyFat: 'var(--chart-2)',
} as const
</script>

<template>
  <StatTrendCard
    :title="title"
    :subtitle="t('common.dashboard.lastEntries', { count: TILE_ENTRY_COUNT })"
    :value="value"
    :unit="metric === 'bodyFat' ? '%' : unitLabel"
    :chart="{ data, color: COLOR[metric], label: chartLabel }"
    @click="router.push({ name: RouteNames.Weight })"
  />
</template>
