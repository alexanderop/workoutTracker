<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { CalendarRoot } from 'reka-ui'
import { fromDate, getLocalTimeZone } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { RouteNames } from '@/router'
import { getCurrentLocale } from '@/lib/dateLocale'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
} from '@/components/ui/calendar'
import type { CalendarWorkout, WorkoutDay } from '@/features/workout/composables/useWorkoutCalendar'

type Properties = {
  open: boolean
  monthDays: ReadonlyArray<WorkoutDay>
  selectedDate: Date | null
  selectedMonth: Date
  selectedDayWorkouts: ReadonlyArray<CalendarWorkout>
  selectedDateFormatted: string
}

const { open, monthDays, selectedDate, selectedMonth, selectedDayWorkouts, selectedDateFormatted } =
  defineProps<Properties>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'select-date': [date: Date]
  'previous-month': []
  'next-month': []
}>()

const { t } = useI18n()
const router = useRouter()
const locale = getCurrentLocale()

// Derive month/year heading from selectedMonth
const currentMonthYear = computed(() => {
  return format(selectedMonth, 'MMMM yyyy')
})

// Create a map of dates with workouts for quick lookup
const workoutDatesMap = computed(() => {
  const map = new Map<string, boolean>()
  for (const day of monthDays) {
    if (day.hasWorkout) {
      map.set(format(day.date, 'yyyy-MM-dd'), true)
    }
  }
  return map
})

// Convert selected date to DateValue for calendar
const calendarValue = computed(() => {
  if (!selectedDate) return
  return fromDate(selectedDate, getLocalTimeZone())
})

// Convert selectedMonth to DateValue to control which month CalendarRoot displays
const calendarPlaceholder = computed(() => {
  return fromDate(selectedMonth, getLocalTimeZone())
})

function handleDateSelect(dateValue: DateValue) {
  const date = dateValue.toDate(getLocalTimeZone())
  emit('select-date', date)
}

function hasWorkoutOnDate(date: Date): boolean {
  const key = format(date, 'yyyy-MM-dd')
  return workoutDatesMap.value.get(key) ?? false
}

function navigateToWorkout(workoutId: string) {
  emit('update:open', false)
  router.push({ name: RouteNames.WorkoutDetail, params: { id: workoutId } })
}

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}

function handlePrevMonth() {
  emit('previous-month')
}

function handleNextMonth() {
  emit('next-month')
}
</script>

<template>
  <Sheet :open="open" @update:open="handleOpenChange">
    <SheetContent side="bottom" class="max-h-[85dvh] overflow-y-auto px-4 pb-8">
      <SheetHeader class="pb-2">
        <SheetTitle class="text-center">{{ currentMonthYear }}</SheetTitle>
        <SheetDescription class="sr-only">
          {{ t('calendar.description') }}
        </SheetDescription>
      </SheetHeader>

      <!-- Custom Calendar -->
      <CalendarRoot
        v-slot="{ grid, weekDays }"
        :model-value="calendarValue"
        :placeholder="calendarPlaceholder"
        class="w-full"
        weekday-format="short"
        :locale="locale"
        :week-starts-on="1"
        @update:model-value="(v) => v && handleDateSelect(v)"
      >
        <!-- Navigation -->
        <CalendarHeader class="relative pt-1 pb-4">
          <div class="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              class="h-8 w-8"
              :aria-label="t('calendar.previousMonth')"
              @click="handlePrevMonth"
            >
              <ChevronLeft class="h-4 w-4" />
            </Button>
            <CalendarHeading class="text-sm font-medium" />
            <Button
              variant="outline"
              size="icon"
              class="h-8 w-8"
              :aria-label="t('calendar.nextMonth')"
              @click="handleNextMonth"
            >
              <ChevronRight class="h-4 w-4" />
            </Button>
          </div>
        </CalendarHeader>

        <!-- Calendar Grid -->
        <CalendarGrid v-for="month in grid" :key="month.value.toString()" class="w-full">
          <CalendarGridHead>
            <CalendarGridRow class="flex justify-between">
              <CalendarHeadCell
                v-for="day in weekDays"
                :key="day"
                class="w-10 text-xs font-normal text-muted-foreground"
              >
                {{ day }}
              </CalendarHeadCell>
            </CalendarGridRow>
          </CalendarGridHead>
          <CalendarGridBody>
            <CalendarGridRow
              v-for="(weekDates, index) in month.rows"
              :key="`week-${index}`"
              class="mt-2 flex justify-between"
            >
              <CalendarCell
                v-for="weekDate in weekDates"
                :key="weekDate.toString()"
                :date="weekDate"
                class="relative flex flex-col items-center"
              >
                <CalendarCellTrigger :day="weekDate" :month="month.value" class="size-10" />
                <!-- Workout indicator dot -->
                <span
                  v-if="hasWorkoutOnDate(weekDate.toDate(getLocalTimeZone()))"
                  class="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-success"
                />
              </CalendarCell>
            </CalendarGridRow>
          </CalendarGridBody>
        </CalendarGrid>
      </CalendarRoot>

      <!-- Selected Day Workouts -->
      <section class="mt-6 border-t pt-4">
        <h3 v-if="selectedDate" class="text-sm font-medium text-muted-foreground mb-3">
          {{ selectedDateFormatted }}
        </h3>

        <div v-if="selectedDate && selectedDayWorkouts.length > 0" class="space-y-2">
          <Card
            v-for="workout in selectedDayWorkouts"
            :key="workout.id"
            role="button"
            tabindex="0"
            class="cursor-pointer p-3 transition-colors hover:bg-accent flex items-center justify-between"
            @click="navigateToWorkout(workout.id)"
            @keydown.enter="navigateToWorkout(workout.id)"
            @keydown.space.prevent="navigateToWorkout(workout.id)"
          >
            <span class="truncate font-medium">{{ workout.name }}</span>
            <span class="text-sm text-muted-foreground tabular-nums">
              {{ workout.durationMinutes }} · {{ workout.setCount }} {{ t('workouts.stats.sets') }}
            </span>
          </Card>
        </div>

        <p v-else-if="selectedDate" class="text-sm text-muted-foreground">
          {{ t('calendar.noWorkouts') }}
        </p>

        <p v-else class="text-sm text-muted-foreground text-center">
          {{ t('calendar.selectDay') }}
        </p>
      </section>
    </SheetContent>
  </Sheet>
</template>
