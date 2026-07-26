<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DbHabit, DbHabitEntry } from '@/db/schema'
import { buildCompactHabitGrid } from '../lib/habitGrid'
import { habitDayCellClass } from '../lib/gridCell'

const {
  habit,
  entries,
  days = 112,
} = defineProps<{
  habit: DbHabit
  entries: ReadonlyArray<DbHabitEntry>
  days?: number
}>()

const { t } = useI18n()
const grid = computed(() => buildCompactHabitGrid(habit, entries, Date.now()))
const visibleDays = computed(() => grid.value.flat().slice(-days))
const completedCount = computed(
  () => visibleDays.value.filter((day) => day.state === 'complete').length,
)
const summary = computed(() =>
  t('habits.gridSummary', {
    name: habit.name,
    count: completedCount.value,
    days: visibleDays.value.length,
  }),
)
</script>

<template>
  <div
    role="img"
    :aria-label="summary"
    class="grid gap-1"
    :class="days === 7 ? 'grid-cols-7' : 'grid-flow-col grid-rows-7'"
  >
    <span
      v-for="day in visibleDays"
      :key="day.date"
      aria-hidden="true"
      class="aspect-square min-w-0 rounded-[3px]"
      :class="habitDayCellClass(day)"
    />
  </div>
</template>
