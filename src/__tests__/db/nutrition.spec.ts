import { beforeEach, describe, expect, it } from 'vitest'
import { getNutritionRepository } from '@/db'
import { db } from '@/db/implementations/dexie/database'
import { resetDatabase } from '@/__tests__/setup'
import type { DbFood, DbNutritionDiaryEntry } from '@/db/schema'

/**
 * Repository-level tests for `commitDiaryBatch`.
 *
 * Deliberately in the browser tier and deliberately thin: what rows a basket
 * turns into is decided by `buildCommit`, which is pure and covered in the
 * Node `unit` tier (`unit/nutrition/foodBasket.spec.ts`). The only thing that
 * needs real IndexedDB is whether the write is genuinely all-or-nothing -- a
 * fake would assert its own implementation of a Dexie transaction, and
 * `brain/principles/a-fake-must-not-promise-more-than-the-real-thing` says
 * that proves nothing.
 */

const LOCAL_DATE = '2026-07-26'
const NOW = 1_700_000_000_000

function food(id: string, name: string, lastUsedAt: number | null = null): DbFood {
  return {
    id,
    name,
    brand: null,
    nutrientsPer100Grams: { calories: 60, proteinGrams: 11, carbohydrateGrams: 3.5, fatGrams: 0.2 },
    defaultServingName: 'serving',
    defaultServingGrams: 100,
    favorite: false,
    archivedAt: null,
    createdAt: 0,
    updatedAt: 0,
    lastUsedAt,
  }
}

function entry(id: string, foodId: string | null, loggedAt = NOW): DbNutritionDiaryEntry {
  return {
    id,
    localDate: LOCAL_DATE,
    meal: 'lunch',
    foodId,
    grams: 100,
    foodSnapshot: {
      name: 'Skyr',
      brand: null,
      nutrientsPer100Grams: {
        calories: 60,
        proteinGrams: 11,
        carbohydrateGrams: 3.5,
        fatGrams: 0.2,
      },
    },
    loggedAt,
    updatedAt: loggedAt,
  }
}

describe('NutritionRepository.commitDiaryBatch', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('writes every new food and every entry in one go', async () => {
    const repository = getNutritionRepository()

    await repository.commitDiaryBatch(
      [food('new-1', 'Nutella'), food('new-2', 'Hafermilch')],
      [entry('e1', 'new-1'), entry('e2', 'new-2'), entry('e3', null)],
    )

    const snapshot = await repository.observeDay(LOCAL_DATE).get()
    expect(snapshot.foods.map((f) => f.name).toSorted()).toEqual(['Hafermilch', 'Nutella'])
    expect(snapshot.diaryEntries.map((e) => e.id)).toEqual(['e1', 'e2', 'e3'])
  })

  it('bumps lastUsedAt on pre-existing foods the batch logs', async () => {
    await db.foods.add(food('existing', 'Skyr', 100))
    const repository = getNutritionRepository()

    await repository.commitDiaryBatch([], [entry('e1', 'existing')])

    expect((await db.foods.get('existing'))?.lastUsedAt).toBe(NOW)
  })

  it('keeps the newest loggedAt when one basket logs the same food twice', async () => {
    await db.foods.add(food('existing', 'Skyr', 100))
    const repository = getNutritionRepository()

    await repository.commitDiaryBatch(
      [],
      [entry('e1', 'existing', NOW + 5), entry('e2', 'existing', NOW)],
    )

    expect((await db.foods.get('existing'))?.lastUsedAt).toBe(NOW + 5)
  })

  it('leaves a quick-add entry with no food to point at', async () => {
    const repository = getNutritionRepository()

    await repository.commitDiaryBatch([], [entry('e1', null)])

    const snapshot = await repository.observeDay(LOCAL_DATE).get()
    expect(snapshot.foods).toEqual([])
    expect(snapshot.diaryEntries[0]?.foodId).toBeNull()
  })

  it('rolls the whole basket back when one member write fails', async () => {
    await db.nutritionDiaryEntries.add(entry('collides', null))
    const repository = getNutritionRepository()

    // `bulkAdd` rejects on the duplicate key, which aborts the transaction --
    // so the good entry and the new food must not survive either.
    await expect(
      repository.commitDiaryBatch(
        [food('new-1', 'Nutella')],
        [entry('fresh', null), entry('collides', null)],
      ),
    ).rejects.toThrow()

    const snapshot = await repository.observeDay(LOCAL_DATE).get()
    expect(snapshot.foods).toEqual([])
    expect(snapshot.diaryEntries.map((e) => e.id)).toEqual(['collides'])
  })

  it('is a no-op for an empty basket', async () => {
    const repository = getNutritionRepository()

    await repository.commitDiaryBatch([], [])

    const snapshot = await repository.observeDay(LOCAL_DATE).get()
    expect(snapshot.diaryEntries).toEqual([])
  })
})
