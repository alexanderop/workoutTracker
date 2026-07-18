<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { HabitGridWeek } from '../lib/habitGrid'

const { grid, habitName } = defineProps<{
  grid: ReadonlyArray<HabitGridWeek>
  habitName: string
}>()

const emit = defineEmits<{
  'toggle-day': [date: number]
}>()

const { t } = useI18n()

function formatDay(date: number): string {
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function dayLabel(day: HabitGridWeek[number]): string {
  const formatted = formatDay(day.date)
  if (day.isFuture) return t('habits.history.dayFuture', { date: formatted })
  return day.complete
    ? t('habits.history.dayComplete', { date: formatted })
    : t('habits.history.dayIncomplete', { date: formatted })
}

/**
 * No `isFuture` guard here: the triggering button is already
 * `:disabled="day.isFuture"`, and disabled buttons never dispatch click
 * events in a real browser, so this can only ever fire for a clickable
 * (non-future) day.
 */
function handleDayClick(day: HabitGridWeek[number]): void {
  emit('toggle-day', day.date)
}
</script>

<template>
  <div
    role="group"
    :aria-label="t('habits.detailsFor', { name: habitName })"
    class="overflow-x-auto pb-1"
  >
    <div class="inline-grid grid-flow-col grid-rows-7 gap-1">
      <template v-for="(week, weekIndex) in grid" :key="weekIndex">
        <button
          v-for="day in week"
          :key="day.date"
          type="button"
          :disabled="day.isFuture"
          :data-testid="`habit-day-${day.date}`"
          :aria-label="dayLabel(day)"
          :aria-pressed="!day.isFuture ? day.complete : undefined"
          class="h-3.5 w-3.5 rounded-sm transition-colors"
          :class="[
            day.isFuture
              ? 'bg-transparent cursor-default'
              : day.complete
                ? 'bg-primary hover:bg-primary/80'
                : 'bg-muted hover:bg-muted-foreground/20',
            day.isToday && 'ring-1 ring-offset-1 ring-primary',
          ]"
          @click="handleDayClick(day)"
        />
      </template>
    </div>
  </div>
</template>
