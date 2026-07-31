import { computed, ref } from 'vue'
import { createGlobalState } from '@vueuse/core'
import { generateId } from '@/db/generateId'
import type { DbFood, DbFoodNutrients, MealKind } from '@/db/schema'
import {
  isAdjustable,
  MIN_GRAMS,
  stagedTotals,
  type StagedItem,
  type UnstagedItem,
} from '../lib/foodBasket'

/**
 * The staging basket behind the food-logging sheet.
 *
 * App-scoped rather than component-local so closing the sheet -- or wandering
 * off to another route mid-meal -- does not throw away what was staged.
 * Deliberately *not* persisted: a `useFormDraft` draft would survive a reload,
 * but buys the debounced-save-versus-clear resurrection race recorded in
 * `brain/lessons/local-data-gotchas` and a day-boundary staleness rule, for an
 * exposure window of seconds. Re-adding three items after a crash is cheaper
 * than getting that race wrong.
 */
export const useFoodLogBasket = createGlobalState(() => {
  const items = ref<Array<StagedItem>>([])
  const localDate = ref('')
  const meal = ref<MealKind>('breakfast')

  const totals = computed(() => stagedTotals(items.value))
  const isEmpty = computed(() => items.value.length === 0)

  function clear(): void {
    items.value = []
  }

  /**
   * Point the basket at the day and meal the caller opened the sheet for.
   *
   * Switching days discards what was staged: those macros were reasoned about
   * against a different day's budget, and silently moving them would log food
   * onto a date the user never looked at. The meal is only a label on the
   * pending write, so changing it keeps the basket.
   */
  function openFor(date: string, initialMeal: MealKind): void {
    if (localDate.value !== date) clear()
    localDate.value = date
    meal.value = initialMeal
  }

  function stage(item: UnstagedItem): void {
    items.value = [...items.value, { ...item, stageId: generateId() }]
  }

  function stageLibraryFood(food: DbFood): void {
    stage({
      source: 'library',
      foodId: food.id,
      name: food.name,
      brand: food.brand,
      nutrientsPer100Grams: food.nutrientsPer100Grams,
      grams: food.defaultServingGrams ?? 100,
    })
  }

  /**
   * Macros without a food. Stored as the per-100g figure at exactly 100 g so
   * scaling is the identity and every item in the basket sums the same way.
   */
  function stageQuickAdd(name: string, nutrients: DbFoodNutrients): void {
    stage({ source: 'quick', name, brand: null, nutrientsPer100Grams: nutrients, grams: 100 })
  }

  function unstage(stageId: string): void {
    items.value = items.value.filter((item) => item.stageId !== stageId)
  }

  /**
   * Absolute grams, from the tray's stepper and its typed field alike — the
   * tray has the current grams in hand, so there is no second delta protocol.
   */
  function setGrams(stageId: string, grams: number): void {
    items.value = items.value.map((item) => {
      if (item.stageId !== stageId || !isAdjustable(item)) return item
      return { ...item, grams: Math.max(MIN_GRAMS, grams) }
    })
  }

  /**
   * Full teardown for test isolation — `createGlobalState` outlives a
   * component tree, and `clear()` alone would leave `localDate` set, so the
   * next test's `openFor` on the same day would not discard anything.
   */
  function $reset(): void {
    clear()
    localDate.value = ''
    meal.value = 'breakfast'
  }

  return {
    items,
    localDate,
    meal,
    $reset,
    totals,
    isEmpty,
    openFor,
    stage,
    stageLibraryFood,
    stageQuickAdd,
    unstage,
    setGrams,
    clear,
  }
})
