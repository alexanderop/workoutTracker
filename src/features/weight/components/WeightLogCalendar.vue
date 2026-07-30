<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { CalendarRoot } from 'reka-ui'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { getCurrentLocale, getDateLocale } from '@/lib/dateLocale'
import { getStartOfDay } from '@/lib/date'
import { Button } from '@/components/ui/button'
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
} from '@/components/ui/calendar'

const { selectedDay, visibleMonth, maxDay } = defineProps<{
  /** Selected day as a start-of-day timestamp. */
  selectedDay: number
  /** First day of the displayed month, as a timestamp. */
  visibleMonth: number
  /** Latest selectable day (today), as a start-of-day timestamp. */
  maxDay: number
}>()

const emit = defineEmits<{
  select: [day: number]
  'previous-month': []
  'next-month': []
  'go-back': []
  'go-to-today': []
}>()

const { t } = useI18n()

function toCalendarDate(timestamp: number): CalendarDate {
  const date = new Date(timestamp)
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

const selectedValue = computed(() => toCalendarDate(selectedDay))
const placeholderValue = computed(() => toCalendarDate(visibleMonth))
const maxValue = computed(() => toCalendarDate(maxDay))

const monthHeading = computed(() =>
  format(new Date(visibleMonth), 'MMMM yyyy', { locale: getDateLocale(getCurrentLocale()) }),
)

function handleSelect(value: DateValue | undefined) {
  if (!value) return
  const jsDate = value.toDate(getLocalTimeZone())
  emit('select', getStartOfDay(jsDate))
}
</script>

<template>
  <div :aria-label="t('weight.sheet.calendarLabel')" role="group">
    <div class="flex items-center justify-between pb-4">
      <h2 class="text-sm font-medium">{{ monthHeading }}</h2>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          class="h-8 w-8"
          :aria-label="t('weight.sheet.previousMonth')"
          @click="emit('previous-month')"
        >
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          class="h-8 w-8"
          :aria-label="t('weight.sheet.nextMonth')"
          @click="emit('next-month')"
        >
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <CalendarRoot
      v-slot="{ grid, weekDays }"
      :model-value="selectedValue"
      :placeholder="placeholderValue"
      :max-value="maxValue"
      class="w-full"
      :week-starts-on="1"
      weekday-format="narrow"
      :locale="getCurrentLocale()"
      :fixed-weeks="true"
      @update:model-value="handleSelect"
    >
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
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </CalendarRoot>

    <div class="flex items-center justify-between pt-4">
      <Button variant="outline" @click="emit('go-back')">{{ t('weight.sheet.goBack') }}</Button>
      <Button @click="emit('go-to-today')">{{ t('weight.sheet.goToToday') }}</Button>
    </div>
  </div>
</template>
