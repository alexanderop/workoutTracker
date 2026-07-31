<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { ChevronRight } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

// Loaded on first use so the unovis charting engine stays off the startup
// path — the app has a Lighthouse performance budget on first paint.
const SparklineChart = defineAsyncComponent(
  () => import('@/components/ui/chart/SparklineChart.vue'),
)

export type StatTrendChart = {
  /** Values to plot, oldest first. Fewer than 2 shows a hint instead of a chart. */
  data: ReadonlyArray<number>
  /** Sparkline color — any CSS color, including `var(--token)`. */
  color: string
  /** Accessible description of the sparkline. */
  label: string
}

defineProps<{
  title: string
  subtitle: string
  /** Already formatted for display; the unit renders separately and smaller. */
  value: string
  unit?: string
  chart: StatTrendChart
}>()

const emit = defineEmits<{ click: [] }>()
const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    class="flex flex-col rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent/40"
    @click="emit('click')"
  >
    <span class="block truncate font-semibold">{{ title }}</span>
    <span class="mt-0.5 block text-xs text-muted-foreground">{{ subtitle }}</span>
    <SparklineChart
      v-if="chart.data.length > 1"
      :data="chart.data"
      :color="chart.color"
      :height="40"
      class="mt-3"
      :aria-label="chart.label"
    />
    <span v-else class="mt-3 flex h-10 items-center text-xs text-muted-foreground">
      {{ t('common.dashboard.notEnoughData') }}
    </span>
    <span class="mt-3 flex w-full items-center justify-between gap-2 border-t pt-3">
      <span class="truncate text-2xl font-bold tracking-tight">
        {{ value }}
        <span v-if="unit" class="text-sm font-medium text-muted-foreground">{{ unit }}</span>
      </span>
      <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </span>
  </button>
</template>
