<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { VisXYContainer, VisLine, VisAxis, VisScatter } from '@unovis/vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartCrosshair, ChartTooltip, ChartTooltipContent, componentToString } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import type { ChartDataPoint } from '@/features/exercises/composables/useExerciseProgress'

const { t } = useI18n()

const { data, title, yKey, color } = defineProps<{
  data: Array<ChartDataPoint>
  title: string
  yKey: keyof Pick<ChartDataPoint, 'maxWeight' | 'volume' | 'estimated1RM'>
  color: string
}>()

const chartConfig = computed<ChartConfig>(() => ({
  [yKey]: {
    label: title,
    color,
  },
}))

// Format date for x-axis
function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Format value for y-axis
function formatValue(value: number): string {
  if (yKey === 'volume') {
    return value >= 1000 ? `${(value / 1000).toFixed(1)}t` : `${value}`
  }
  return `${Math.round(value)}`
}
</script>

<template>
  <Card class="overflow-hidden">
    <CardHeader class="pb-2">
      <div class="flex items-center justify-between">
        <CardTitle class="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {{ title }}
        </CardTitle>
        <span class="text-xs text-muted-foreground">
          {{ t('exercises.progress.charts.sessions', { count: data.length }) }}
        </span>
      </div>
    </CardHeader>
    <CardContent class="p-0 pb-4 px-2">
      <ChartContainer :config="chartConfig" class="h-[200px] w-full" :cursor="true">
        <VisXYContainer :data="data" :margin="{ top: 10, right: 10, bottom: 30, left: 40 }">
          <VisLine
            :x="(d: ChartDataPoint, i: number) => i"
            :y="(d: ChartDataPoint) => d[yKey]"
            :color="color"
            :curve-type="'monotoneX'"
            :line-width="2"
          />
          <VisScatter
            :x="(d: ChartDataPoint, i: number) => i"
            :y="(d: ChartDataPoint) => d[yKey]"
            :color="color"
            :size="4"
          />
          <VisAxis
            type="x"
            :tick-format="(i: number) => data[i] ? formatDate(data[i]!.date.getTime()) : ''"
            :tick-line="false"
            :domain-line="false"
            :grid-line="false"
            :num-ticks="Math.min(data.length, 5)"
          />
          <VisAxis
            type="y"
            :tick-format="formatValue"
            :tick-line="false"
            :domain-line="false"
            :grid-line="true"
            :num-ticks="4"
          />
          <ChartTooltip />
          <ChartCrosshair
            :template="componentToString(chartConfig, ChartTooltipContent, {
              labelFormatter: (d: number | Date) => {
                const index = typeof d === 'number' ? d : 0
                return data[index] ? formatDate(data[index]!.date.getTime()) : ''
              },
            })"
            :color="color"
          />
        </VisXYContainer>
      </ChartContainer>
    </CardContent>
  </Card>
</template>
