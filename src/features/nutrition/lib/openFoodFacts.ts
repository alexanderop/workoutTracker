import { z } from 'zod'
import type { DbFoodNutrients } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'

/** Food data resolved from a scanned barcode, normalized per 100 g. */
export type ScannedFood = {
  name: string
  brand: string | null
  nutrientsPer100Grams: DbFoodNutrients
}

export type BarcodeLookup =
  | { status: 'found'; food: ScannedFood }
  | { status: 'not-found' }
  | { status: 'error' }

const nutrimentsSchema = z.object({
  'energy-kcal_100g': z.number().optional(),
  proteins_100g: z.number().optional(),
  carbohydrates_100g: z.number().optional(),
  fat_100g: z.number().optional(),
})

const productSchema = z.object({
  product_name: z.string().optional(),
  brands: z.string().optional(),
  nutriments: nutrimentsSchema.optional(),
})

const responseSchema = z.object({
  status: z.number().optional(),
  product: productSchema.optional(),
})

function toNutrientsPer100Grams(
  nutriments: z.infer<typeof nutrimentsSchema> | undefined,
): DbFoodNutrients {
  return {
    calories: nutriments?.['energy-kcal_100g'] ?? 0,
    proteinGrams: nutriments?.['proteins_100g'] ?? 0,
    carbohydrateGrams: nutriments?.['carbohydrates_100g'] ?? 0,
    fatGrams: nutriments?.['fat_100g'] ?? 0,
  }
}

/** OFF lists brands as a comma-separated string; the first one is the primary. */
function primaryBrand(brands: string | undefined): string | null {
  const first = brands?.split(',', 1)[0]?.trim()
  return first ? first : null
}

/**
 * Maps an Open Food Facts product response to a ScannedFood.
 * Exported separately from the fetch so the mapping stays unit-testable.
 */
export function parseBarcodeLookup(json: unknown): BarcodeLookup {
  const parsed = responseSchema.safeParse(json)
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
      nutrientsPer100Grams: toNutrientsPer100Grams(product.nutriments),
    },
  }
}

const PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product/'
const PRODUCT_FIELDS = 'product_name,brands,nutriments'

/** Looks up a barcode in the free Open Food Facts database. */
export async function lookupBarcode(barcode: string): Promise<BarcodeLookup> {
  const url = `${PRODUCT_URL}${encodeURIComponent(barcode)}?fields=${PRODUCT_FIELDS}`
  const [fetchError, response] = await tryCatch(
    fetch(url, { headers: { Accept: 'application/json' } }),
  )
  if (fetchError) return { status: 'error' }
  if (response.status === 404) return { status: 'not-found' }
  if (!response.ok) return { status: 'error' }

  const [jsonError, json] = await tryCatch<unknown>(response.json())
  if (jsonError) return { status: 'error' }
  return parseBarcodeLookup(json)
}
