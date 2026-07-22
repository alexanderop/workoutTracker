<script setup lang="ts">
import { format } from 'date-fns'
import { useI18n } from 'vue-i18n'
import { getCurrentLocale, getDateLocale } from '@/lib/dateLocale'
import type { FoodLogWeekDay } from '../composables/useFoodLogDay'

const { days } = defineProps<{
  days: ReadonlyArray<FoodLogWeekDay>
}>()

const emit = defineEmits<{
  select: [dateKey: string]
}>()

const { t } = useI18n()
const dateLocale = getDateLocale(getCurrentLocale())

function weekdayLetter(date: Date): string {
  return format(date, 'EEEEE', { locale: dateLocale })
}

function dayLabel(day: FoodLogWeekDay): string {
  const date = format(day.date, 'PPPP', { locale: dateLocale })
  return day.calories > 0
    ? t('nutrition.foodLog.dayWithCalories', { date, calories: day.calories })
    : date
}
</script>

<template>
  <div class="grid grid-cols-7 gap-1" role="group" :aria-label="t('nutrition.foodLog.weekStrip')">
    <button
      v-for="day in days"
      :key="day.dateKey"
      type="button"
      class="flex flex-col items-center gap-0.5 rounded-2xl border py-2 transition-colors"
      :class="[
        day.isSelected
          ? 'border-primary bg-primary/10'
          : day.isToday
            ? 'border-primary/40 bg-transparent hover:bg-muted'
            : 'border-transparent bg-transparent hover:bg-muted',
      ]"
      :aria-label="dayLabel(day)"
      :aria-pressed="day.isSelected"
      @click="emit('select', day.dateKey)"
    >
      <span class="text-[11px] font-medium uppercase text-muted-foreground">
        {{ weekdayLetter(day.date) }}
      </span>
      <span
        class="text-sm font-semibold"
        :class="day.isSelected ? 'text-primary' : 'text-foreground'"
      >
        {{ day.date.getDate() }}
      </span>
      <span class="flex h-1.5 items-center justify-center">
        <span v-if="day.calories > 0" class="size-1.5 rounded-full bg-primary" aria-hidden="true" />
      </span>
    </button>
  </div>
</template>
