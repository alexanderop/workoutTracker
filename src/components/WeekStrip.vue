<script setup lang="ts">
import { format } from 'date-fns'
import { ChevronRight } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { Card } from '@/components/ui/card'
import { useWorkoutCalendar } from '@/composables/useWorkoutCalendar'
import { getDateLocale, getCurrentLocale } from '@/lib/dateLocale'

const emit = defineEmits<{
  click: []
}>()

const { t } = useI18n()
const { currentWeek, weeklyDuration, currentMonthYear } = useWorkoutCalendar()

const locale = getCurrentLocale()
const dateLocale = getDateLocale(locale)

function getWeekdayShort(date: Date): string {
  return format(date, 'EEE', { locale: dateLocale })
}

function getDayNumber(date: Date): number {
  return date.getDate()
}

function handleClick() {
  emit('click')
}
</script>

<template>
  <Card
    role="button"
    tabindex="0"
    class="w-full cursor-pointer px-4 py-3 hover:shadow-md transition-shadow"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- Header row -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-medium text-muted-foreground">
        {{ currentMonthYear }}
      </span>
      <div class="flex items-center gap-1 text-sm font-medium">
        <span>{{ weeklyDuration }}</span>
        <ChevronRight class="w-4 h-4 text-muted-foreground" aria-hidden="true" />
      </div>
    </div>

    <!-- Week days grid -->
    <div class="grid grid-cols-7 gap-1">
      <!-- Day columns -->
      <div
        v-for="day in currentWeek"
        :key="day.date.toISOString()"
        class="flex flex-col items-center gap-1"
      >
        <!-- Weekday label -->
        <span class="text-xs text-muted-foreground">
          {{ getWeekdayShort(day.date) }}
        </span>

        <!-- Day number with today highlight -->
        <div
          class="flex items-center justify-center w-8 h-8 text-sm font-medium rounded-full"
          :class="{
            'bg-primary text-primary-foreground': day.isToday,
            'text-foreground': !day.isToday,
          }"
        >
          {{ getDayNumber(day.date) }}
        </div>

        <!-- Workout indicator dot -->
        <div class="h-1.5 flex items-center justify-center">
          <div
            v-if="day.hasWorkout"
            class="w-1.5 h-1.5 rounded-full bg-success"
            :aria-label="t('calendar.workoutCompleted')"
          />
        </div>
      </div>
    </div>
  </Card>
</template>
