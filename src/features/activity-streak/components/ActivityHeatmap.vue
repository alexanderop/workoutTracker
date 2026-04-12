<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Dumbbell, Play } from 'lucide-vue-next'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { RouteNames } from '@/router'
import { useActivityHeatmap } from '../composables/useActivityHeatmap'
import type { HeatmapCell } from '../types/streak'

const { t } = useI18n()
const router = useRouter()
const { grid, hasAnyActivity } = useActivityHeatmap()

const WEEKDAY_ROWS = [0, 1, 2, 3, 4, 5, 6] as const
const INTENSITY_STEPS = [0, 1, 2, 3, 4] as const

/**
 * Row-major matrix: rows[weekday][weekIndex] for a 7xN grid.
 * buildHeatmap always emits 7-cell weeks aligned to Monday.
 */
const rows = computed<Array<Array<HeatmapCell>>>(() =>
  WEEKDAY_ROWS.map((weekdayIndex) =>
    grid.value.weeks.map((week) => week[weekdayIndex]!),
  ),
)

/**
 * Map from weekIndex → month label for the first week that enters a new month.
 */
const monthLabelByWeek = computed<Map<number, string>>(() => {
  const labels = new Map<number, string>()
  let previousMonth = -1
  for (const [weekIndex, week] of grid.value.weeks.entries()) {
    const firstCell = week[0]
    if (!firstCell) continue
    const month = firstCell.date.getMonth()
    if (month !== previousMonth) {
      labels.set(weekIndex, format(firstCell.date, 'MMM'))
      previousMonth = month
    }
  }
  return labels
})

function cellTitle(cell: HeatmapCell): string {
  const dateLabel = format(cell.date, 'MMM d, yyyy')
  return `${dateLabel}: ${cell.count} workouts`
}

function intensityClass(cell: HeatmapCell): string {
  return `heatmap-cell heatmap-cell--intensity-${cell.intensity}`
}

function startWorkout(): void {
  void router.push({ name: RouteNames.ActiveWorkout })
}
</script>

<template>
  <Card class="w-full max-w-md" data-testid="activity-heatmap">
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {{ t('activityStreak.title') }}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <template v-if="hasAnyActivity">
        <div class="flex flex-col gap-1" role="img" :aria-label="t('activityStreak.title')">
          <div class="flex gap-[3px] pl-6 text-[10px] text-muted-foreground" aria-hidden="true">
            <div
              v-for="(_week, weekIndex) in grid.weeks"
              :key="`m-${weekIndex}`"
              class="w-[12px] text-left"
            >
              {{ monthLabelByWeek.get(weekIndex) ?? '\u00A0' }}
            </div>
          </div>
          <div
            v-for="(row, rowIndex) in rows"
            :key="`r-${rowIndex}`"
            class="flex items-center gap-[3px]"
          >
            <div class="w-6 text-[10px] text-muted-foreground" aria-hidden="true"></div>
            <div
              v-for="(cell, cellIndex) in row"
              :key="`c-${rowIndex}-${cellIndex}`"
              :class="intensityClass(cell)"
              :title="cell.inRange ? cellTitle(cell) : ''"
              :data-intensity="cell.intensity"
              :data-date="cell.dateKey"
              :data-testid="`heatmap-cell-intensity-${cell.intensity}`"
              :aria-hidden="!cell.inRange"
            />
          </div>
          <div
            class="mt-2 flex items-center justify-end gap-2 text-[10px] text-muted-foreground"
          >
            <span>{{ t('activityStreak.legendLess') }}</span>
            <span
              v-for="step in INTENSITY_STEPS"
              :key="`legend-${step}`"
              :class="`heatmap-cell heatmap-cell--intensity-${step}`"
            />
            <span>{{ t('activityStreak.legendMore') }}</span>
          </div>
        </div>
      </template>
      <template v-else>
        <Empty data-testid="activity-heatmap-empty">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Dumbbell />
            </EmptyMedia>
            <EmptyTitle>{{ t('activityStreak.emptyTitle') }}</EmptyTitle>
            <EmptyDescription>
              {{ t('activityStreak.emptyDescription') }}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button @click="startWorkout">
              <Play class="mr-2 h-4 w-4" />
              {{ t('activityStreak.startCta') }}
            </Button>
          </EmptyContent>
        </Empty>
      </template>
    </CardContent>
  </Card>
</template>

<style scoped>
.heatmap-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background-color: var(--heat-0);
  display: inline-block;
}
.heatmap-cell--intensity-0 {
  background-color: var(--heat-0);
}
.heatmap-cell--intensity-1 {
  background-color: var(--heat-1);
}
.heatmap-cell--intensity-2 {
  background-color: var(--heat-2);
}
.heatmap-cell--intensity-3 {
  background-color: var(--heat-3);
}
.heatmap-cell--intensity-4 {
  background-color: var(--heat-4);
}
</style>
