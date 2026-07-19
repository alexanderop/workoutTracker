import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { getNutritionRepository } from '@/db'
import type { DbNutritionGoal } from '@/db/schema'
import { DEFAULT_NUTRITION_TARGETS, totalDiaryNutrients } from '../lib/nutritionCalculations'

export function useNutritionDay(localDate: MaybeRefOrGetter<string>) {
  const { data } = useLiveQuery(() => getNutritionRepository().observeDay(toValue(localDate)))

  const goal = computed<DbNutritionGoal>(() =>
    data.value?.goal
      ? data.value.goal
      : { id: 'current', ...DEFAULT_NUTRITION_TARGETS, updatedAt: 0 },
  )
  const foods = computed(() => data.value?.foods ?? [])
  const diaryEntries = computed(() => data.value?.diaryEntries ?? [])
  const totals = computed(() => totalDiaryNutrients(diaryEntries.value))
  const remainingCalories = computed(() => Math.max(0, goal.value.calories - totals.value.calories))
  const calorieProgress = computed(() =>
    Math.min(100, (totals.value.calories / goal.value.calories) * 100),
  )

  return { goal, foods, diaryEntries, totals, remainingCalories, calorieProgress }
}
