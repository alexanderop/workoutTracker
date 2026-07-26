import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { getNutritionRepository } from '@/db'
import type { DbNutritionGoal } from '@/db/schema'
import {
  budgetSegments,
  DEFAULT_NUTRITION_TARGETS,
  totalDiaryNutrients,
} from '../lib/nutritionCalculations'

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
  /** How far past the goal the day has gone; `0` while still under it. */
  const caloriesOver = computed(() => Math.max(0, totals.value.calories - goal.value.calories))
  /**
   * Stays clamped: this drives a conic-gradient ring and the `Progress`
   * primitive, both 0-100 by contract, and a ring has nowhere to grow past its
   * own circumference. Overflow is carried by `caloriesOver` (shown as a
   * number) and by `calorieSegments.tickPct` (a goal marker on the bar).
   */
  const calorieProgress = computed(() =>
    Math.min(100, (totals.value.calories / goal.value.calories) * 100),
  )
  /** Bar geometry for the goal marker — the same math the food sheet's bars use. */
  const calorieSegments = computed(() =>
    budgetSegments(totals.value.calories, 0, goal.value.calories),
  )

  return {
    goal,
    foods,
    diaryEntries,
    totals,
    remainingCalories,
    caloriesOver,
    calorieProgress,
    calorieSegments,
  }
}
