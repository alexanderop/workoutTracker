import { describe, it, expect, beforeEach } from 'vitest'
import {
  getDataManagementRepository,
  getHabitsRepository,
  getNutritionRepository,
  getProgressionsRepository,
} from '@/db'
import { resetDatabase } from '@/__tests__/setup'
import { createDbHabit, createDbHabitEntryForDate } from '@/__tests__/factories'
import { db } from '@/db/implementations/dexie/database'
import type { StoredDbHabit } from '@/db/schema'

/**
 * deleteAll() must wipe every table in the schema (modulo onboarding). It
 * previously missed the progressions/progressionSessions tables added in
 * database.ts version 5, so Settings -> Delete All Data silently left
 * progression data behind (UX review finding).
 */
describe('DataManagementRepository.deleteAll', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('should remove progressions when deleting all data', async () => {
    const progressions = getProgressionsRepository()
    const progression = await progressions.create({
      name: 'KB Swing Challenge',
      availableWeights: [16, 20, 24],
    })
    await progressions.recordSession(progression.id, true, {
      reps: 12,
      minutes: 10,
      weightIndex: 0,
      isComplete: false,
    })

    await getDataManagementRepository().deleteAll()

    expect(await progressions.getAll()).toHaveLength(0)
    expect(await progressions.getSessionHistory(progression.id)).toHaveLength(0)
  })
})

/**
 * Habits/habitEntries are easy to miss when wiring up export/import (they
 * were added after the initial data-management repository), so this pins
 * both the round-trip and the full wipe explicitly.
 */
describe('DataManagementRepository habits export/import', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('should include habits and habitEntries in exportAll and restore them via importAll', async () => {
    const habits = getHabitsRepository()
    const habit = createDbHabit({ name: 'Drink water' })
    await habits.addHabit(habit)
    const entry = createDbHabitEntryForDate(habit.id, new Date('2026-01-01'))
    await habits.upsertEntry(entry)

    const exported = await getDataManagementRepository().exportAll()
    expect(exported.habits).toEqual([habit])
    expect(exported.habitEntries).toEqual([entry])

    await getDataManagementRepository().deleteAll()
    expect(await habits.getAllHabits()).toEqual([])

    await getDataManagementRepository().importAll(exported)

    expect(await habits.getAllHabits()).toEqual([habit])
    expect(await habits.getEntriesForHabit(habit.id)).toEqual([entry])
  })

  it('normalizes legacy habits for export while preserving entries unchanged', async () => {
    const legacyHabit: StoredDbHabit = {
      id: 'legacy-habit',
      name: 'Stretch',
      icon: null,
      schedule: { type: 'daily' },
      kind: { type: 'binary' },
      autoLink: null,
      archivedAt: null,
      orderIndex: 0,
      createdAt: 1,
    }
    const entry = createDbHabitEntryForDate(legacyHabit.id, new Date('2026-01-01'))
    await db.habits.add(legacyHabit)
    await getHabitsRepository().upsertEntry(entry)

    const exported = await getDataManagementRepository().exportAll()

    expect(exported.habits).toEqual([{ ...legacyHabit, description: null, accent: 'purple' }])
    expect(exported.habitEntries).toEqual([entry])
  })

  it('should remove habits and habitEntries when deleting all data', async () => {
    const habits = getHabitsRepository()
    const habit = createDbHabit()
    await habits.addHabit(habit)
    await habits.upsertEntry(createDbHabitEntryForDate(habit.id, new Date('2026-01-01')))

    await getDataManagementRepository().deleteAll()

    expect(await habits.getAllHabits()).toHaveLength(0)
    expect(await habits.getEntriesForHabit(habit.id)).toHaveLength(0)
  })
})

describe('DataManagementRepository nutrition export/import', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('round-trips nutrition goals, foods, and diary entries', async () => {
    const nutrition = getNutritionRepository()
    const now = Date.now()
    const food = {
      id: 'food-1',
      name: 'Oats',
      brand: null,
      nutrientsPer100Grams: {
        calories: 370,
        proteinGrams: 13,
        carbohydrateGrams: 60,
        fatGrams: 7,
      },
      defaultServingName: 'serving',
      defaultServingGrams: 80,
      favorite: false,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
    } as const
    const diaryEntry = {
      id: 'diary-1',
      localDate: '2026-07-19',
      meal: 'breakfast',
      foodId: food.id,
      grams: 80,
      foodSnapshot: {
        name: food.name,
        brand: food.brand,
        nutrientsPer100Grams: food.nutrientsPer100Grams,
      },
      loggedAt: now,
      updatedAt: now,
    } as const
    await nutrition.saveGoal({
      id: 'current',
      calories: 2200,
      proteinGrams: 160,
      carbohydrateGrams: 240,
      fatGrams: 70,
      updatedAt: now,
    })
    await nutrition.addFoodAndDiaryEntry(food, diaryEntry)

    const exported = await getDataManagementRepository().exportAll()
    await getDataManagementRepository().deleteAll()
    await getDataManagementRepository().importAll(exported)

    expect(await nutrition.observeDay('2026-07-19').get()).toEqual({
      goal: exported.nutritionGoals[0],
      foods: [food],
      diaryEntries: [diaryEntry],
    })
  })
})
