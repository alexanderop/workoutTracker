<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { VisXYContainer, VisLine, VisAxis, VisScatter } from '@unovis/vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChartContainer,
  ChartCrosshair,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
} from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import type { WeightChartDataPoint, TimeRange } from '../composables/useWeightEntries'
import { formatDate } from '../lib/weightCalculations'

const { data, selectedRange } = defineProps<{
  data: Array<WeightChartDataPoint>
  selectedRange: TimeRange
}>()

const emit = defineEmits<{
  'update:selectedRange': [range: TimeRange]
}>()

const { t } = useI18n()
const { toDisplayValue } = useWeightDisplay()

// Chart config defines colors that ChartStyle converts to --color-{key} CSS variables
const chartConfig = computed<ChartConfig>(() => ({
  weight: {
    label: t('weight.weight'),
    color: 'var(--primary)',
  },
}))

// Color reference for unovis components - uses the generated CSS variable
const chartColor = 'var(--color-weight)'

// Transform data for display unit
const displayData = computed(() =>
  data.map((d) => ({
    ...d,
    weight: toDisplayValue(d.weight) ?? d.weight,
  })),
)

function formatWeight(value: number): string {
  return `${Math.round(value)}`
}

const timeRanges: Array<TimeRange> = ['7D', '30D', '90D', 'All']
</script>

<template>
  <Card class="overflow-hidden">
    <CardHeader class="pb-2">
      <div class="flex items-center justify-between">
        <CardTitle class="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {{ t('weight.trend') }}
        </CardTitle>
        <Tabs
          :model-value="selectedRange"
          :aria-label="t('weight.timeRangeSelector')"
          @update:model-value="emit('update:selectedRange', $event as TimeRange)"
        >
          <TabsList class="h-7">
            <TabsTrigger
              v-for="range in timeRanges"
              :key="range"
              :value="range"
              class="px-2 py-1 text-xs"
            >
              {{ range }}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </CardHeader>
    <CardContent class="p-0 pb-4 px-2">
      <div v-if="displayData.length === 0" class="flex h-[200px] items-center justify-center">
        <p class="text-muted-foreground">{{ t('weight.noData') }}</p>
      </div>
      <ChartContainer
        v-else
        :config="chartConfig"
        class="h-[200px] w-full"
        :cursor="true"
        role="img"
        :aria-label="t('weight.chartLabel', { count: displayData.length })"
      >
        <VisXYContainer :data="displayData" :margin="{ top: 10, right: 10, bottom: 30, left: 40 }">
          <VisLine
            :x="(_d: WeightChartDataPoint, i: number) => i"
            :y="(d: WeightChartDataPoint) => d.weight"
            :color="chartColor"
            curve-type="monotoneX"
            :line-width="2"
          />
          <VisScatter
            :x="(_d: WeightChartDataPoint, i: number) => i"
            :y="(d: WeightChartDataPoint) => d.weight"
            :color="chartColor"
            :size="4"
          />
          <VisAxis
            type="x"
            :tick-format="(i: number) => (displayData[i] ? formatDate(displayData[i]!.date.getTime()) : '')"
            :tick-line="false"
            :domain-line="false"
            :grid-line="false"
            :num-ticks="Math.min(displayData.length, 5)"
          />
          <VisAxis
            type="y"
            :tick-format="formatWeight"
            :tick-line="false"
            :domain-line="false"
            :grid-line="true"
            :num-ticks="4"
          />
          <ChartTooltip />
          <ChartCrosshair
            :template="
              componentToString(chartConfig, ChartTooltipContent, {
                labelFormatter: (d: number | Date) => {
                  const index = typeof d === 'number' ? d : 0
                  return displayData[index] ? formatDate(displayData[index]!.date.getTime()) : ''
                },
              })
            "
            :color="chartColor"
          />
        </VisXYContainer>
      </ChartContainer>
    </CardContent>
  </Card>
</template>
