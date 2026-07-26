import { beforeEach, describe, expect, it } from 'vitest'
import { useFoodLogBasket } from '@/features/nutrition/composables/useFoodLogBasket'
import type { DbFood } from '@/db/schema'

/**
 * Node-tier spec: the basket is plain reactive state over pure helpers -- no
 * DOM, no IndexedDB, nothing for the browser tier to earn. `createGlobalState`
 * makes it a process-wide singleton, so every test resets it explicitly rather
 * than relying on module isolation.
 */

function food(overrides: Partial<DbFood> = {}): DbFood {
  return {
    id: 'food-skyr',
    name: 'Skyr',
    brand: 'Arla',
    nutrientsPer100Grams: {
      calories: 60,
      proteinGrams: 11,
      carbohydrateGrams: 3.5,
      fatGrams: 0.2,
    },
    defaultServingName: 'serving',
    defaultServingGrams: 400,
    favorite: false,
    archivedAt: null,
    createdAt: 0,
    updatedAt: 0,
    lastUsedAt: null,
    ...overrides,
  }
}

describe('useFoodLogBasket', () => {
  beforeEach(() => {
    const basket = useFoodLogBasket()
    basket.clear()
    basket.localDate.value = ''
  })

  it('stages a library food at its default serving', () => {
    const basket = useFoodLogBasket()

    basket.stageLibraryFood(food())

    expect(basket.items.value).toHaveLength(1)
    expect(basket.items.value[0]).toMatchObject({
      source: 'library',
      foodId: 'food-skyr',
      name: 'Skyr',
      brand: 'Arla',
      grams: 400,
    })
  })

  it('falls back to 100 g for a food with no default serving', () => {
    const basket = useFoodLogBasket()

    basket.stageLibraryFood(food({ defaultServingGrams: null }))

    expect(basket.items.value[0]?.grams).toBe(100)
  })

  it('gives each staged item its own identity, so the same food can be staged twice', () => {
    const basket = useFoodLogBasket()

    basket.stageLibraryFood(food())
    basket.stageLibraryFood(food())

    const [first, second] = basket.items.value
    expect(basket.items.value).toHaveLength(2)
    expect(first?.stageId).not.toBe(second?.stageId)
  })

  it('sums staged macros as items arrive', () => {
    const basket = useFoodLogBasket()

    expect(basket.isEmpty.value).toBe(true)
    basket.stageLibraryFood(food())

    expect(basket.isEmpty.value).toBe(false)
    expect(basket.totals.value.calories).toBeCloseTo(240, 10)
    expect(basket.totals.value.proteinGrams).toBeCloseTo(44, 10)
  })

  it('adjusts grams and the totals follow', () => {
    const basket = useFoodLogBasket()
    basket.stageLibraryFood(food())
    const stageId = basket.items.value[0]?.stageId ?? ''

    basket.adjustGrams(stageId, -100)

    expect(basket.items.value[0]?.grams).toBe(300)
    expect(basket.totals.value.calories).toBeCloseTo(180, 10)
  })

  it('floors the grams stepper instead of walking a food down to nothing', () => {
    const basket = useFoodLogBasket()
    basket.stageLibraryFood(food({ defaultServingGrams: 10 }))
    const stageId = basket.items.value[0]?.stageId ?? ''

    basket.adjustGrams(stageId, -50)

    expect(basket.items.value[0]?.grams).toBe(5)
  })

  it('ignores grams edits on a quick add, whose macros are the whole truth', () => {
    const basket = useFoodLogBasket()
    basket.stageQuickAdd('Restaurant', {
      calories: 650,
      proteinGrams: 45,
      carbohydrateGrams: 30,
      fatGrams: 20,
    })
    const stageId = basket.items.value[0]?.stageId ?? ''

    basket.adjustGrams(stageId, 100)

    expect(basket.items.value[0]?.grams).toBe(100)
    expect(basket.totals.value.calories).toBe(650)
  })

  it('unstages by id and leaves the rest alone', () => {
    const basket = useFoodLogBasket()
    basket.stageLibraryFood(food({ id: 'a', name: 'A' }))
    basket.stageLibraryFood(food({ id: 'b', name: 'B' }))
    const stageId = basket.items.value[0]?.stageId ?? ''

    basket.unstage(stageId)

    expect(basket.items.value.map((item) => item.name)).toEqual(['B'])
  })

  describe('openFor', () => {
    it('keeps the basket when reopened on the same day', () => {
      const basket = useFoodLogBasket()
      basket.openFor('2026-07-26', 'lunch')
      basket.stageLibraryFood(food())

      basket.openFor('2026-07-26', 'dinner')

      expect(basket.items.value).toHaveLength(1)
      expect(basket.meal.value).toBe('dinner')
    })

    it('discards the basket when the day changes', () => {
      const basket = useFoodLogBasket()
      basket.openFor('2026-07-26', 'lunch')
      basket.stageLibraryFood(food())

      basket.openFor('2026-07-27', 'breakfast')

      expect(basket.items.value).toEqual([])
      expect(basket.localDate.value).toBe('2026-07-27')
    })
  })
})
