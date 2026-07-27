import { z } from 'zod'
import type { DbFoodNutrients } from '@/db/schema'
import type {
  BarcodeApiAdapter,
  BarcodeLookup,
  ExternalFood,
  ExternalFoodHit,
  FoodSearchApiAdapter,
  FoodSearchLookup,
} from './foodData'

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
  code: z.string().optional(),
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
  status: z.union([z.literal(0), z.literal(1)]).optional(),
  product: productSchema.optional(),
})

/**
 * Text search returns a page of products. Open Food Facts serves this from two
 * places with the same product shape under different keys: the Search-a-licious
 * service answers with `hits`, the legacy `/cgi/search.pl` with `products`.
 * Accepting both keeps `SEARCH_ENDPOINT` a one-line switch if the newer service
 * is unavailable.
 */
const searchResponseSchema = z.object({
  hits: z.array(z.unknown()).optional(),
  products: z.array(z.unknown()).optional(),
})

type OpenFoodFactsNutriments = z.infer<typeof nutrimentsSchema>
type OpenFoodFactsProduct = z.infer<typeof productSchema>

const PRODUCT_ENDPOINT = 'https://world.openfoodfacts.org/api/v2/product/'
const PRODUCT_FIELDS = 'product_name,brands,serving_quantity,nutriments'

/**
 * Search-a-licious rather than the legacy `/cgi/search.pl`: it is the endpoint
 * Open Food Facts points text search at, and it is not under the 10-searches-
 * per-minute limit the legacy CGI carries — which a debounced search field
 * types straight through.
 */
const SEARCH_ENDPOINT = 'https://search.openfoodfacts.org/search'
const SEARCH_FIELDS = 'code,product_name,brands,serving_quantity,nutriments'
/** One screenful after dedupe against the library; the list scrolls, but nobody scrolls it far. */
const SEARCH_PAGE_SIZE = 20

function productUrl(barcode: string): string {
  return `${PRODUCT_ENDPOINT}${encodeURIComponent(barcode)}?fields=${PRODUCT_FIELDS}`
}

function searchUrl(query: string): string {
  const parameters = new URLSearchParams({
    q: query,
    page_size: String(SEARCH_PAGE_SIZE),
    fields: SEARCH_FIELDS,
  })
  return `${SEARCH_ENDPOINT}?${parameters.toString()}`
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

function hasAnyNutrient(nutrients: DbFoodNutrients): boolean {
  return (
    nutrients.calories > 0 ||
    nutrients.proteinGrams > 0 ||
    nutrients.carbohydrateGrams > 0 ||
    nutrients.fatGrams > 0
  )
}

/**
 * One search hit, or `null` for a product this app cannot log: crowd-sourced
 * entries are frequently a name with no nutrition data at all, and staging one
 * would silently add 0 kcal to the day.
 */
function toSearchHit(raw: unknown, index: number): ExternalFoodHit | null {
  const parsed = productSchema.safeParse(raw)
  if (!parsed.success) return null

  const product: OpenFoodFactsProduct = parsed.data
  const name = product.product_name?.trim() ?? ''
  if (name.length === 0) return null

  const nutrientsPer100Grams = toNutrientsPer100Grams(product.nutriments)
  if (!hasAnyNutrient(nutrientsPer100Grams)) return null

  const food: ExternalFood = {
    name,
    brand: primaryBrand(product.brands),
    servingGrams: servingGrams(product.serving_quantity),
    nutrientsPer100Grams,
  }
  // Falls back to the position when a hit carries no barcode: the id only has
  // to be unique within one response, where it is a list key.
  return { ...food, id: product.code ?? `off-${index}` }
}

/**
 * Maps an Open Food Facts search response to provider-neutral hits. A single
 * malformed product is skipped rather than failing the page — one bad
 * crowd-sourced entry must not blank the whole result list.
 */
export function parseFoodSearch(json: unknown): FoodSearchLookup {
  const parsed = searchResponseSchema.safeParse(json)
  if (!parsed.success) return { status: 'error' }

  const products = parsed.data.hits ?? parsed.data.products
  if (products === undefined) return { status: 'error' }

  return {
    status: 'ok',
    foods: products
      .map((raw, index) => toSearchHit(raw, index))
      .filter((hit): hit is ExternalFoodHit => hit !== null),
  }
}

export const openFoodFactsAdapter: BarcodeApiAdapter & FoodSearchApiAdapter = {
  productUrl,
  parseResponse: parseBarcodeLookup,
  searchUrl,
  parseSearchResponse: parseFoodSearch,
}
