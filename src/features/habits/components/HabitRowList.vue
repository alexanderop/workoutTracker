<script setup lang="ts">
/**
 * `rows` mode: the compact layout, one `HabitHomeRow` per habit under a shared
 * date header.
 *
 * A container rather than a bare `v-for` in the view, because the header has to
 * share the rows' column geometry exactly -- both take it from
 * `HABIT_ROW_GRID_COLUMNS` so they cannot drift apart.
 *
 * The seven columns are the *current calendar week*, Monday to Sunday, not the
 * last seven days: `HabitCompactGrid` slices the tail off a Monday-aligned
 * 16-week grid, so its final row is this week including days still to come.
 * The header is computed the same way rather than from `today - 6`, which would
 * be off by however far into the week we are.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { addDays } from 'date-fns'
import type { DbHabit } from '@/db/schema'
import type { HabitTodayItem } from '../composables/useHabits'
import { startOfDay, startOfWeekDay } from '../lib/habitStats'
import { HABIT_ROW_DAYS, HABIT_ROW_GRID_COLUMNS } from '../lib/rowLayout'
import HabitHomeRow from './HabitHomeRow.vue'

defineProps<{ items: ReadonlyArray<HabitTodayItem> }>()

const emit = defineEmits<{
  toggle: [habit: DbHabit]
  'open-details': [habit: DbHabit]
}>()

const { t, locale } = useI18n()

const days = computed(() => {
  const today = startOfDay(Date.now())
  const weekStart = startOfWeekDay(today)
  // Built once for the week rather than per cell: `toLocaleDateString` spins up
  // a fresh formatter on every call, and this ran fourteen of them per render.
  //
  // `narrow` (one character), not `short`: a 12.5px column fits "M" in any
  // locale but not English's "Mon". Narrow weekdays repeat (T/T, S/S), which
  // the date underneath disambiguates -- "T 23" and "T 25" are never confusable
  // the way a bare "T" would be.
  const weekdayFormat = new Intl.DateTimeFormat(locale.value, { weekday: 'narrow' })
  const dayOfMonthFormat = new Intl.DateTimeFormat(locale.value, { day: 'numeric' })
  return Array.from({ length: HABIT_ROW_DAYS }, (_, index) => {
    const date = addDays(weekStart, index)
    return {
      key: date.getTime(),
      weekday: weekdayFormat.format(date),
      dayOfMonth: dayOfMonthFormat.format(date),
      isToday: startOfDay(date.getTime()) === today,
    }
  })
})
</script>

<template>
  <div class="space-y-2">
    <div
      class="grid items-end gap-3 px-3"
      :class="HABIT_ROW_GRID_COLUMNS"
      data-testid="habit-row-date-header"
    >
      <span aria-hidden="true" class="size-6" />
      <span class="text-xs font-medium text-muted-foreground">{{ t('habits.thisWeek') }}</span>
      <div class="grid grid-cols-7 gap-1 text-center">
        <span
          v-for="day in days"
          :key="day.key"
          class="text-[0.625rem] leading-tight"
          :class="day.isToday ? 'font-bold text-foreground' : 'text-muted-foreground'"
          :data-today="day.isToday ? 'true' : undefined"
        >
          <span class="block">{{ day.weekday }}</span>
          <span class="block tabular-nums">{{ day.dayOfMonth }}</span>
        </span>
      </div>
      <span aria-hidden="true" class="size-9" />
    </div>

    <HabitHomeRow
      v-for="item in items"
      :key="item.habit.id"
      :item="item"
      @toggle="emit('toggle', $event)"
      @open-details="emit('open-details', $event)"
    />
  </div>
</template>
