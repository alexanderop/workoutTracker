<script setup lang="ts">
import { computed, ref } from 'vue'
import { CalendarDays, Play, Timer, ClipboardList } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import RecentWorkoutsSection from '@/components/RecentWorkoutsSection.vue'
import WeekStrip from '@/components/WeekStrip.vue'
import WorkoutCalendarSheet from '@/components/WorkoutCalendarSheet.vue'
import HabitsHomeCard from '@/features/habits/components/HabitsHomeCard.vue'
import NutritionDashboardCard from '@/features/nutrition/components/NutritionDashboardCard.vue'
import HomeWeightSummaryCard from '@/features/weight/components/HomeWeightSummaryCard.vue'
import { useWorkoutCalendar } from '@/composables/useWorkoutCalendar'

const { t, locale } = useI18n()
const router = useRouter()
const todayLabel = computed(() =>
  new Intl.DateTimeFormat(locale.value, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date()),
)

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
  <div class="min-h-full flex-1 bg-muted/30 pb-8">
    <header class="border-b bg-background px-4 pb-5 pt-6">
      <div class="mx-auto max-w-md">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays class="size-4" aria-hidden="true" />
          {{ todayLabel }}
        </div>
        <h1 class="mt-1 text-2xl font-bold tracking-tight">{{ t('nav.homeView.today') }}</h1>
        <p class="mt-1 text-sm text-muted-foreground">{{ t('nav.homeView.healthSummary') }}</p>
      </div>
    </header>

    <main class="mx-auto flex max-w-md flex-col gap-4 p-4">
      <!-- Week Strip -->
      <WeekStrip class="w-full rounded-2xl border bg-card shadow-sm" @click="openCalendarSheet" />

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

      <NutritionDashboardCard />

      <section aria-labelledby="workout-actions-heading">
        <div class="mb-3 flex items-center justify-between px-1">
          <h2 id="workout-actions-heading" class="font-semibold">
            {{ t('nav.homeView.workout') }}
          </h2>
          <span class="text-xs text-muted-foreground">{{ t('nav.homeView.quickActions') }}</span>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            role="button"
            class="group flex min-h-24 flex-col items-center justify-center rounded-2xl border bg-card p-2 text-center shadow-sm transition-colors hover:bg-accent/40"
            @click="startWorkout"
          >
            <span
              class="flex size-10 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20"
            >
              <Play class="ml-0.5 size-5 text-primary" aria-hidden="true" />
            </span>
            <span class="mt-2 text-xs font-semibold">
              {{ t('nav.homeView.startNewWorkout') }}
            </span>
          </button>

          <button
            type="button"
            class="group flex min-h-24 flex-col items-center justify-center rounded-2xl border bg-card p-2 text-center shadow-sm transition-colors hover:bg-accent/40"
            @click="logPastWorkout"
          >
            <span
              class="flex size-10 items-center justify-center rounded-full bg-success/10 group-hover:bg-success/20"
            >
              <ClipboardList class="size-5 text-success" aria-hidden="true" />
            </span>
            <span class="mt-2 text-xs font-semibold">
              {{ t('nav.homeView.logPastWorkout', 'Log Past Workout') }}
            </span>
          </button>

          <button
            type="button"
            class="group flex min-h-24 flex-col items-center justify-center rounded-2xl border bg-card p-2 text-center shadow-sm transition-colors hover:bg-accent/40"
            @click="goToTimers"
          >
            <span
              class="flex size-10 items-center justify-center rounded-full bg-highlight/10 group-hover:bg-highlight/20"
            >
              <Timer class="size-5 text-highlight" aria-hidden="true" />
            </span>
            <span class="mt-2 text-xs font-semibold">
              {{ t('nav.homeView.quickTimer') }}
            </span>
          </button>
        </div>
      </section>

      <HomeWeightSummaryCard />

      <!-- Today's Habits -->
      <HabitsHomeCard />

      <!-- Recent Workouts -->
      <RecentWorkoutsSection />
    </main>
  </div>
</template>
