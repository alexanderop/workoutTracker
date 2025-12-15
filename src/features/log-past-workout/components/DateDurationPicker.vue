<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CalendarDays, Clock } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import type { DateValue } from '@internationalized/date'
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'

const date = defineModel<Date>('date', { required: true })
const duration = defineModel<number>('duration', { required: true })

const emit = defineEmits<{
  continue: []
}>()

const { t } = useI18n()

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120]

const calendarValue = computed({
  get() {
    return new CalendarDate(
      date.value.getFullYear(),
      date.value.getMonth() + 1,
      date.value.getDate(),
    )
  },
  set(value: DateValue | undefined) {
    if (value) {
      date.value = value.toDate(getLocalTimeZone())
    }
  },
})

const maxDate = today(getLocalTimeZone())

const formattedDate = computed(() => {
  return date.value.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
})

const durationString = computed({
  get() {
    return String(duration.value)
  },
  set(value: string) {
    duration.value = Number(value)
  },
})

function handleContinue() {
  emit('continue')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Date Selection -->
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="text-base flex items-center gap-2">
          <CalendarDays class="w-4 h-4" />
          {{ t('logPastWorkout.whenDidYouWorkOut', 'When did you work out?') }}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              class="w-full justify-start text-left font-normal"
              :aria-label="t('logPastWorkout.selectDate', 'Select date')"
            >
              {{ formattedDate }}
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="start">
            <Calendar
              v-model="calendarValue"
              :max-value="maxDate"
              initial-focus
            />
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>

    <!-- Duration Selection -->
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="text-base flex items-center gap-2">
          <Clock class="w-4 h-4" />
          {{ t('logPastWorkout.howLong', 'How long was your workout?') }}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ToggleGroup
          v-model="durationString"
          type="single"
          class="flex flex-wrap gap-2 justify-start"
        >
          <ToggleGroupItem
            v-for="option in DURATION_OPTIONS"
            :key="option"
            :value="String(option)"
            :aria-label="`${option} min`"
            class="px-4"
          >
            {{ `${option} min` }}
          </ToggleGroupItem>
        </ToggleGroup>
      </CardContent>
    </Card>

    <!-- Continue Button -->
    <Button class="w-full" @click="handleContinue">
      {{ t('common.continue', 'Continue') }}
    </Button>
  </div>
</template>
