import { computed, ref } from 'vue'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { getNutritionRepository } from '@/db'
import { dateFromLocalDateKey, shiftLocalDateKey, weekLocalDateKeys } from '../lib/foodLogTimeline'
import { caloriesByLocalDate, getLocalDateKey } from '../lib/nutritionCalculations'
import { useNutritionDay } from './useNutritionDay'

export type FoodLogWeekDay = {
  dateKey: string
  date: Date
  isToday: boolean
  isSelected: boolean
  /** Rounded calories logged that day; 0 when nothing is logged. */
  calories: number
}

/**
 * Day-by-day food log state: a selected local calendar day, its diary
 * snapshot, and the surrounding Monday-based week for the week strip.
 */
export function useFoodLogDay() {
  const selectedDateKey = ref(getLocalDateKey())

  const isToday = computed(() => selectedDateKey.value === getLocalDateKey())
  const selectedDate = computed(() => dateFromLocalDateKey(selectedDateKey.value))
  const weekKeys = computed(() => weekLocalDateKeys(selectedDateKey.value))

  const { data: weekEntries } = useLiveQuery(() =>
    getNutritionRepository().observeRange(weekKeys.value[0], weekKeys.value[6]),
  )

  const weekDays = computed<ReadonlyArray<FoodLogWeekDay>>(() => {
    const todayKey = getLocalDateKey()
    const calories = caloriesByLocalDate(weekEntries.value ?? [], weekKeys.value)
    return weekKeys.value.map((dateKey, index) => ({
      dateKey,
      date: dateFromLocalDateKey(dateKey),
      isToday: dateKey === todayKey,
      isSelected: dateKey === selectedDateKey.value,
      calories: calories[index],
    }))
  })

  function selectDate(dateKey: string): void {
    selectedDateKey.value = dateKey
  }

  function goToPreviousDay(): void {
    selectedDateKey.value = shiftLocalDateKey(selectedDateKey.value, -1)
  }

  function goToNextDay(): void {
    selectedDateKey.value = shiftLocalDateKey(selectedDateKey.value, 1)
  }

  function goToToday(): void {
    selectedDateKey.value = getLocalDateKey()
  }

  const { foods, diaryEntries, totals } = useNutritionDay(selectedDateKey)

  return {
    selectedDateKey,
    selectedDate,
    isToday,
    weekDays,
    foods,
    diaryEntries,
    totals,
    selectDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
  }
}
