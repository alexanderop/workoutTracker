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

const { data, selectedRange } = defineProps<{
  data: Array<WeightChartDataPoint>
  selectedRange: TimeRange
}>()

const emit = defineEmits<{
  'update:selectedRange': [range: TimeRange]
}>()

const { t } = useI18n()
const { toDisplayValue } = useWeightDisplay()

const chartConfig = computed<ChartConfig>(() => ({
  weight: {
    label: t('weight.weight'),
    color: 'hsl(var(--primary))',
  },
}))

// Transform data for display unit
const displayData = computed(() =>
  data.map((d) => ({
    ...d,
    weight: toDisplayValue(d.weight) ?? d.weight,
  })),
)

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

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
        v-if="displayData.length > 0"
        :config="chartConfig"
        class="h-[200px] w-full"
        :cursor="true"
      >
        <VisXYContainer :data="displayData" :margin="{ top: 10, right: 10, bottom: 30, left: 40 }">
          <VisLine
            :x="(_d: WeightChartDataPoint, i: number) => i"
            :y="(d: WeightChartDataPoint) => d.weight"
            color="hsl(var(--primary))"
            curve-type="monotoneX"
            :line-width="2"
          />
          <VisScatter
            :x="(_d: WeightChartDataPoint, i: number) => i"
            :y="(d: WeightChartDataPoint) => d.weight"
            color="hsl(var(--primary))"
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
            color="hsl(var(--primary))"
          />
        </VisXYContainer>
      </ChartContainer>
    </CardContent>
  </Card>
</template>
