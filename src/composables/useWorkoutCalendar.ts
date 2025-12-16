import { computed, onMounted, readonly, ref, shallowRef, watch } from 'vue'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  getWeek,
  format,
} from 'date-fns'
import { getWorkoutsRepository } from '@/db'
import type { DbWorkoutHeader } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'
import { formatDurationMinutes, formatDurationHoursMinutes } from '@/lib/formatters'
import { getDateLocale, getCurrentLocale } from '@/lib/dateLocale'

// ============================================
// Types
// ============================================

export type CalendarWorkout = {
  id: string
  name: string
  durationMinutes: string
  setCount: number
}

export type WorkoutDay = {
  date: Date
  hasWorkout: boolean
  isToday: boolean
  workouts: ReadonlyArray<CalendarWorkout>
}

// ============================================
// Pure Functions (Functional Core)
// ============================================

function mapToCalendarWorkout(header: DbWorkoutHeader): CalendarWorkout {
  return {
    id: header.id,
    name: header.name,
    durationMinutes: formatDurationMinutes(header.durationSeconds),
    setCount: header.stats.completedSetCount,
  }
}

function groupWorkoutsByDay(
  workouts: ReadonlyArray<DbWorkoutHeader>,
): Map<string, ReadonlyArray<DbWorkoutHeader>> {
  const grouped = new Map<string, Array<DbWorkoutHeader>>()

  for (const workout of workouts) {
    const dateKey = format(new Date(workout.completedAt), 'yyyy-MM-dd')
    const existing = grouped.get(dateKey) ?? []
    grouped.set(dateKey, [...existing, workout])
  }

  return grouped
}

function createWorkoutDay(
  date: Date,
  workoutsForDay: ReadonlyArray<DbWorkoutHeader>,
  today: Date,
): WorkoutDay {
  return {
    date,
    hasWorkout: workoutsForDay.length > 0,
    isToday: isSameDay(date, today),
    workouts: workoutsForDay.map(mapToCalendarWorkout),
  }
}

// ============================================
// Composable (Imperative Shell)
// ============================================

export function useWorkoutCalendar() {
  const locale = getCurrentLocale()
  const dateLocale = getDateLocale(locale)

  // Primary State
  const workoutsCache = shallowRef<ReadonlyArray<DbWorkoutHeader>>([])
  const selectedMonth = ref(new Date())
  const selectedDate = ref<Date | null>(null)

  // State Metadata
  const isLoading = ref(false)

  // Memoized grouping - computed once per workoutsCache change
  const workoutsByDay = computed(() => groupWorkoutsByDay(workoutsCache.value))

  // Computed: Current week (Mon-Sun)
  const currentWeek = computed<ReadonlyArray<WorkoutDay>>(() => {
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return days.map((day) => {
      const dateKey = format(day, 'yyyy-MM-dd')
      const workoutsForDay = workoutsByDay.value.get(dateKey) ?? []
      return createWorkoutDay(day, workoutsForDay, today)
    })
  })

  // Computed: Week number (ISO week)
  const weekNumber = computed(() => getWeek(new Date(), { weekStartsOn: 1 }))

  // Computed: Weekly workout duration (formatted)
  const weeklyDuration = computed(() => {
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

    const totalSeconds = workoutsCache.value
      .filter((workout) => {
        const workoutDate = new Date(workout.completedAt)
        return workoutDate >= weekStart && workoutDate <= weekEnd
      })
      .reduce((sum, workout) => sum + workout.durationSeconds, 0)

    return formatDurationHoursMinutes(totalSeconds)
  })

  // Computed: Current month/year display
  const currentMonthYear = computed(() => {
    return format(selectedMonth.value, 'MMMM yyyy', { locale: dateLocale })
  })

  // Computed: Month days for calendar
  const monthDays = computed<ReadonlyArray<WorkoutDay>>(() => {
    const today = new Date()
    const monthStart = startOfMonth(selectedMonth.value)
    const monthEnd = endOfMonth(selectedMonth.value)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    return days.map((day) => {
      const dateKey = format(day, 'yyyy-MM-dd')
      const workoutsForDay = workoutsByDay.value.get(dateKey) ?? []
      return createWorkoutDay(day, workoutsForDay, today)
    })
  })

  // Computed: Selected day workouts
  const selectedDayWorkouts = computed<ReadonlyArray<CalendarWorkout>>(() => {
    if (!selectedDate.value) return []

    const dateKey = format(selectedDate.value, 'yyyy-MM-dd')
    const workoutsForDay = workoutsByDay.value.get(dateKey) ?? []

    return workoutsForDay.map(mapToCalendarWorkout)
  })

  // Computed: Selected date formatted
  const selectedDateFormatted = computed(() => {
    if (!selectedDate.value) return ''
    return format(selectedDate.value, 'EEEE, MMM d', { locale: dateLocale })
  })

  // Methods
  async function loadWorkouts(): Promise<void> {
    isLoading.value = true

    // Load workouts for a wide date range (current year +/- 1 year)
    const now = new Date()
    const startDate = new Date(now.getFullYear() - 1, 0, 1).getTime()
    const endDate = new Date(now.getFullYear() + 1, 11, 31).getTime()

    const [error, result] = await tryCatch(
      getWorkoutsRepository().getByDateRange({ startDate, endDate }),
    )

    if (!error && result) {
      workoutsCache.value = result
    }

    isLoading.value = false
  }

  function goToPreviousMonth(): void {
    selectedMonth.value = subMonths(selectedMonth.value, 1)
  }

  function goToNextMonth(): void {
    selectedMonth.value = addMonths(selectedMonth.value, 1)
  }

  function selectDate(date: Date): void {
    selectedDate.value = date
  }

  function clearSelection(): void {
    selectedDate.value = null
  }

  function resetToCurrentMonth(): void {
    selectedMonth.value = new Date()
    selectedDate.value = null
  }

  // Load workouts on mount
  onMounted(() => {
    loadWorkouts()
  })

  // Refresh when month changes (for potential lazy loading in future)
  watch(selectedMonth, () => {
    // Clear selection when changing months
    selectedDate.value = null
  })

  return {
    // Week strip data
    currentWeek,
    weekNumber,
    weeklyDuration,

    // Calendar data
    selectedMonth: readonly(selectedMonth),
    currentMonthYear,
    monthDays,

    // Selection
    selectedDate: readonly(selectedDate),
    selectedDayWorkouts,
    selectedDateFormatted,

    // Navigation
    goToPreviousMonth,
    goToNextMonth,
    selectDate,
    clearSelection,
    resetToCurrentMonth,

    // State
    isLoading: readonly(isLoading),
    refresh: loadWorkouts,
  }
}
