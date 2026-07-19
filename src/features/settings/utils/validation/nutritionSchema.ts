import { z } from 'zod'
import { safeIdSchema, safeStringSchema, timestampSchema } from './primitiveSchemas'

const nutrientAmountSchema = z.number().min(0).max(100_000)

const foodNutrientsSchema = z
  .object({
    calories: nutrientAmountSchema,
    proteinGrams: nutrientAmountSchema,
    carbohydrateGrams: nutrientAmountSchema,
    fatGrams: nutrientAmountSchema,
  })
  .strict()

export const dbNutritionGoalSchema = z
  .object({
    id: z.literal('current'),
    calories: z.number().positive().max(100_000),
    proteinGrams: z.number().min(0).max(10_000),
    carbohydrateGrams: z.number().min(0).max(10_000),
    fatGrams: z.number().min(0).max(10_000),
    updatedAt: timestampSchema,
  })
  .strict()

export const dbFoodSchema = z
  .object({
    id: safeIdSchema,
    name: safeStringSchema.min(1).max(200),
    brand: safeStringSchema.max(200).nullable(),
    nutrientsPer100Grams: foodNutrientsSchema,
    defaultServingName: safeStringSchema.max(100).nullable(),
    defaultServingGrams: z.number().positive().max(10_000).nullable(),
    favorite: z.boolean(),
    archivedAt: timestampSchema.nullable(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    lastUsedAt: timestampSchema.nullable(),
  })
  .strict()

export const dbNutritionDiaryEntrySchema = z
  .object({
    id: safeIdSchema,
    localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    meal: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    foodId: safeIdSchema.nullable(),
    grams: z.number().positive().max(10_000),
    foodSnapshot: z
      .object({
        name: safeStringSchema.min(1).max(200),
        brand: safeStringSchema.max(200).nullable(),
        nutrientsPer100Grams: foodNutrientsSchema,
      })
      .strict(),
    loggedAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict()

export const MAX_NUTRITION_GOALS = 1
export const MAX_FOODS = 10_000
export const MAX_NUTRITION_DIARY_ENTRIES = 100_000
