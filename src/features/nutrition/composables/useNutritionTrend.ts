import { computed } from 'vue'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { getNutritionRepository } from '@/db'
import { caloriesByLocalDate, lastNLocalDateKeys } from '../lib/nutritionCalculations'

/**
 * Daily calorie totals for the last `days` days, oldest first — for a
 * dashboard trend sparkline.
 */
export function useNutritionTrend(days = 7) {
  const dateKeys = lastNLocalDateKeys(days)
  const { data } = useLiveQuery(() =>
    getNutritionRepository().observeRange(dateKeys[0]!, dateKeys.at(-1)!),
  )

  const caloriesTrend = computed<Array<number>>(() =>
    caloriesByLocalDate(data.value ?? [], dateKeys),
  )

  return { caloriesTrend }
}
