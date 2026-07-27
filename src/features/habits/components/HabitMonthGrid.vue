<script setup lang="ts">
/**
 * A habit's current calendar month, **one week per row**.
 *
 * The transpose of `HabitCompactGrid`, and the reason it exists: at three tiles
 * across there is no room for the week-per-column heatmap's seven rows, and a
 * column-wise grid gives a reader no anchor -- you cannot tell which speck is
 * Saturday. Rows of seven are the shape everyone already reads a calendar in,
 * so a glance answers "did I miss the weekend?" without counting cells.
 *
 * It also makes the caption honest: the tile has always shown a month label,
 * while the grid under it was a trailing six-week window starting mid-way
 * through the previous month.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DbHabit, DbHabitEntry } from '@/db/schema'
import { buildHabitMonthGrid } from '../lib/habitGrid'
import { habitDayCellClass } from '../lib/gridCell'

const { habit, entries } = defineProps<{
  habit: DbHabit
  entries: ReadonlyArray<DbHabitEntry>
}>()

const { t, locale } = useI18n()

const weeks = computed(() => buildHabitMonthGrid(habit, entries, Date.now()))

const monthLabel = computed(() =>
  new Date().toLocaleDateString(locale.value, { month: 'short', year: 'numeric' }),
)

/**
 * Padding days belong to a neighbouring month, so counting them would make the
 * summary disagree with the caption right above it.
 */
const completedCount = computed(
  () => weeks.value.flat().filter((day) => day.inMonth && day.state === 'complete').length,
)

const summary = computed(() =>
  t('habits.monthGridSummary', {
    name: habit.name,
    count: completedCount.value,
    month: monthLabel.value,
  }),
)
</script>

<template>
  <div class="flex flex-col gap-1">
    <span class="block w-full truncate text-[0.625rem] text-muted-foreground">
      {{ monthLabel }}
    </span>
    <div role="img" :aria-label="summary" class="grid grid-cols-7 gap-[3px]">
      <template v-for="(week, weekIndex) in weeks" :key="weekIndex">
        <!-- `data-date` is the only thing that makes this grid's *shape*
             assertable: the cells are aria-hidden squares, so a trailing
             six-week window would render an identical-looking block of the
             same cell count. Same convention as `HabitHistoryGrid`, whose day
             cells already carry their date. -->
        <span
          v-for="day in week"
          :key="day.date"
          aria-hidden="true"
          :data-date="day.date"
          class="aspect-square min-w-0 rounded-[3px]"
          :class="habitDayCellClass(day)"
        />
      </template>
    </div>
  </div>
</template>
