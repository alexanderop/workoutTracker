<script setup lang="ts">
import { ref } from 'vue'
import { Play, Timer } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import { Card, CardDescription, CardHeader } from '@/components/ui/card'
import RecentWorkoutsSection from '@/components/RecentWorkoutsSection.vue'
import WeekStrip from '@/components/WeekStrip.vue'
import WorkoutCalendarSheet from '@/components/WorkoutCalendarSheet.vue'
import { useWorkoutCalendar } from '@/composables/useWorkoutCalendar'

const { t } = useI18n()
const router = useRouter()

// Calendar state
const calendarSheetOpen = ref(false)
const {
  monthDays,
  selectedMonth,
  selectedDate,
  selectedDayWorkouts,
  selectedDateFormatted,
  goToPreviousMonth,
  goToNextMonth,
  selectDate,
  resetToCurrentMonth,
} = useWorkoutCalendar()

function startWorkout() {
  router.push({ name: RouteNames.ActiveWorkout })
}

function goToTimers() {
  router.push({ name: RouteNames.Timers })
}

function openCalendarSheet() {
  resetToCurrentMonth()
  calendarSheetOpen.value = true
}
</script>

<template>
  <div class="flex flex-1 flex-col items-center gap-3 p-3 sm:gap-6 sm:p-4 lg:p-8">
    <!-- Week Strip -->
    <WeekStrip class="w-full max-w-md lg:max-w-2xl" @click="openCalendarSheet" />

    <!-- Calendar Sheet -->
    <WorkoutCalendarSheet
      v-model:open="calendarSheetOpen"
      :month-days="monthDays"
      :selected-month="selectedMonth"
      :selected-date="selectedDate"
      :selected-day-workouts="selectedDayWorkouts"
      :selected-date-formatted="selectedDateFormatted"
      @select-date="(date) => selectDate(date)"
      @previous-month="goToPreviousMonth"
      @next-month="goToNextMonth"
    />

    <!-- Action cards row -->
    <div class="w-full max-w-md lg:max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
      <!-- Main action card -->
      <Card
        role="button"
        tabindex="0"
        class="cursor-pointer group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full"
        @click="startWorkout"
        @keydown.enter="startWorkout"
        @keydown.space.prevent="startWorkout"
      >
        <CardHeader class="flex-col items-center justify-center text-center p-3 sm:py-6 lg:py-8 h-full">
          <div
            class="mb-2 sm:mb-4 w-10 h-10 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"
          >
            <Play class="w-5 h-5 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary ml-0.5" aria-hidden="true" />
          </div>
          <h2 class="leading-tight font-semibold text-sm sm:text-2xl lg:text-3xl">{{ t('nav.homeView.startNewWorkout') }}</h2>
          <CardDescription class="text-xs sm:text-sm mt-1 hidden sm:block">{{ t('nav.homeView.trackDescription') }}</CardDescription>
        </CardHeader>
      </Card>

      <!-- Quick Timer card -->
      <Card
        role="button"
        tabindex="0"
        class="cursor-pointer group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full"
        @click="goToTimers"
        @keydown.enter="goToTimers"
        @keydown.space.prevent="goToTimers"
      >
        <CardHeader class="flex-col items-center justify-center text-center p-3 sm:py-6 lg:py-8 h-full">
          <div
            class="mb-2 sm:mb-4 w-10 h-10 sm:w-14 sm:h-14 lg:w-18 lg:h-18 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors"
          >
            <Timer class="w-5 h-5 sm:w-7 sm:h-7 lg:w-9 lg:h-9 text-orange-500" aria-hidden="true" />
          </div>
          <h2 class="leading-tight font-semibold text-sm sm:text-xl lg:text-2xl">{{ t('nav.homeView.quickTimer') }}</h2>
          <CardDescription class="text-xs sm:text-sm mt-1 hidden sm:block">{{ t('nav.homeView.quickTimerDescription') }}</CardDescription>
        </CardHeader>
      </Card>
    </div>

    <!-- Recent Workouts -->
    <RecentWorkoutsSection />
  </div>
</template>
