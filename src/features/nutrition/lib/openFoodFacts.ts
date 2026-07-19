import { z } from 'zod'
import type { DbFoodNutrients } from '@/db/schema'
import type { BarcodeApiAdapter, BarcodeLookup } from './foodData'

/**
 * A numeric value as Open Food Facts returns it: normally a number, but
 * legacy entries carry numeric strings (e.g. "10.6"). Non-finite values
 * and non-numeric strings are rejected.
 */
const numericValueSchema = z
  .union([z.number(), z.string()])
  .transform((value) => (typeof value === 'string' ? Number(value) : value))
  .refine((value) => Number.isFinite(value), { message: 'Expected a finite number' })

/**
 * Macros per 100 g (per 100 ml for beverages, which OFF also reports under
 * the `_100g` keys). `energy_100g` is kilojoules and is only used as a
 * fallback when `energy-kcal_100g` is missing.
 */
const nutrimentsSchema = z.object({
  'energy-kcal_100g': numericValueSchema.optional(),
  energy_100g: numericValueSchema.optional(),
  proteins_100g: numericValueSchema.optional(),
  carbohydrates_100g: numericValueSchema.optional(),
  fat_100g: numericValueSchema.optional(),
})

const productSchema = z.object({
  product_name: z.string().optional(),
  brands: z.string().optional(),
  serving_quantity: numericValueSchema.optional(),
  nutriments: nutrimentsSchema.optional(),
})

/**
 * Response of GET /api/v2/product/{barcode}. `status` is 1 when the product
 * exists and 0 for unknown/invalid codes (which the API can also answer with
 * an HTTP 404 instead of a body).
 */
const productResponseSchema = z.object({
  status: z.number().optional(),
  product: productSchema.optional(),
})

type OpenFoodFactsNutriments = z.infer<typeof nutrimentsSchema>

const PRODUCT_ENDPOINT = 'https://world.openfoodfacts.org/api/v2/product/'
const PRODUCT_FIELDS = 'product_name,brands,serving_quantity,nutriments'

function productUrl(barcode: string): string {
  return `${PRODUCT_ENDPOINT}${encodeURIComponent(barcode)}?fields=${PRODUCT_FIELDS}`
}

const KILOJOULES_PER_KCAL = 4.184

function caloriesPer100Grams(nutriments: OpenFoodFactsNutriments): number {
  const kcal = nutriments['energy-kcal_100g']
  if (kcal !== undefined) return kcal
  const kilojoules = nutriments['energy_100g']
  return kilojoules === undefined ? 0 : kilojoules / KILOJOULES_PER_KCAL
}

function toNutrientsPer100Grams(nutriments: OpenFoodFactsNutriments | undefined): DbFoodNutrients {
  if (nutriments === undefined) {
    return { calories: 0, proteinGrams: 0, carbohydrateGrams: 0, fatGrams: 0 }
  }
  return {
    calories: caloriesPer100Grams(nutriments),
    proteinGrams: nutriments['proteins_100g'] ?? 0,
    carbohydrateGrams: nutriments['carbohydrates_100g'] ?? 0,
    fatGrams: nutriments['fat_100g'] ?? 0,
  }
}

/** OFF lists brands as a comma-separated string; the first one is the primary. */
function primaryBrand(brands: string | undefined): string | null {
  const first = brands?.split(',', 1)[0]?.trim()
  return first ? first : null
}

function servingGrams(quantity: number | undefined): number | null {
  return quantity !== undefined && quantity > 0 ? quantity : null
}

/**
 * Maps an Open Food Facts product response to the provider-neutral
 * BarcodeLookup. Exported separately from the fetch so the mapping stays
 * unit-testable.
 */
export function parseBarcodeLookup(json: unknown): BarcodeLookup {
  const parsed = productResponseSchema.safeParse(json)
  if (!parsed.success) return { status: 'error' }

  const { status, product } = parsed.data
  if (status === 0 || product === undefined) return { status: 'not-found' }

  const name = product.product_name?.trim() ?? ''
  if (name.length === 0 && product.nutriments === undefined) return { status: 'not-found' }

  return {
    status: 'found',
    food: {
      name,
      brand: primaryBrand(product.brands),
      servingGrams: servingGrams(product.serving_quantity),
      nutrientsPer100Grams: toNutrientsPer100Grams(product.nutriments),
    },
  }
}

export const openFoodFactsAdapter: BarcodeApiAdapter = {
  productUrl,
  parseResponse: parseBarcodeLookup,
}
