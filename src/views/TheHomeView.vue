<script setup lang="ts">
import { ref } from 'vue'
import { Play, Timer, ClipboardList } from 'lucide-vue-next'
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

function logPastWorkout() {
  router.push({ name: RouteNames.LogPastWorkout })
}

function openCalendarSheet() {
  resetToCurrentMonth()
  calendarSheetOpen.value = true
}
</script>

<template>
  <div class="flex flex-1 flex-col items-center gap-3 p-3 sm:gap-6 sm:p-4">
    <!-- Week Strip -->
    <WeekStrip class="w-full max-w-md" @click="openCalendarSheet" />

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
    <div class="w-full max-w-md grid grid-cols-3 gap-2 sm:grid-cols-1 sm:gap-4">
      <!-- Main action card -->
      <Card
        role="button"
        tabindex="0"
        class="cursor-pointer group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full"
        @click="startWorkout"
        @keydown.enter="startWorkout"
        @keydown.space.prevent="startWorkout"
      >
        <CardHeader class="flex-col items-center justify-center text-center p-2 sm:py-6 h-full">
          <div
            class="mb-1 sm:mb-4 w-9 h-9 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"
          >
            <Play class="w-4 h-4 sm:w-8 sm:h-8 text-primary ml-0.5" aria-hidden="true" />
          </div>
          <h2 class="leading-tight font-semibold text-xs sm:text-2xl">{{ t('nav.homeView.startNewWorkout') }}</h2>
          <CardDescription class="text-xs mt-1 hidden sm:block">{{ t('nav.homeView.trackDescription') }}</CardDescription>
        </CardHeader>
      </Card>

      <!-- Log Past Workout card -->
      <Card
        role="button"
        tabindex="0"
        class="cursor-pointer group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full"
        @click="logPastWorkout"
        @keydown.enter="logPastWorkout"
        @keydown.space.prevent="logPastWorkout"
      >
        <CardHeader class="flex-col items-center justify-center text-center p-2 sm:py-6 h-full">
          <div
            class="mb-1 sm:mb-4 w-9 h-9 sm:w-14 sm:h-14 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors"
          >
            <ClipboardList class="w-4 h-4 sm:w-7 sm:h-7 text-emerald-500" aria-hidden="true" />
          </div>
          <h2 class="leading-tight font-semibold text-xs sm:text-xl">{{ t('nav.homeView.logPastWorkout', 'Log Past Workout') }}</h2>
          <CardDescription class="text-xs mt-1 hidden sm:block">{{ t('nav.homeView.logPastWorkoutDescription', 'Log a workout from earlier') }}</CardDescription>
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
        <CardHeader class="flex-col items-center justify-center text-center p-2 sm:py-6 h-full">
          <div
            class="mb-1 sm:mb-4 w-9 h-9 sm:w-14 sm:h-14 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors"
          >
            <Timer class="w-4 h-4 sm:w-7 sm:h-7 text-orange-500" aria-hidden="true" />
          </div>
          <h2 class="leading-tight font-semibold text-xs sm:text-xl">{{ t('nav.homeView.quickTimer') }}</h2>
          <CardDescription class="text-xs mt-1 hidden sm:block">{{ t('nav.homeView.quickTimerDescription') }}</CardDescription>
        </CardHeader>
      </Card>
    </div>

    <!-- Recent Workouts -->
    <RecentWorkoutsSection />
  </div>
</template>
