import type { DbFoodNutrients } from '@/db/schema'

/**
 * Provider-neutral food data resolved from a scanned barcode, normalized
 * per 100 g. Every barcode data source maps its response into this shape.
 */
export type ScannedFood = {
  name: string
  brand: string | null
  servingGrams: number | null
  nutrientsPer100Grams: DbFoodNutrients
}

export type BarcodeLookup =
  | { status: 'found'; food: ScannedFood }
  | { status: 'not-found' }
  | { status: 'error' }

/**
 * Contract every barcode data source implements. To use a different API,
 * export an adapter like `openFoodFactsAdapter` from a new lib module and
 * pass it to `useFoodLookup`.
 */
export type BarcodeApiAdapter = {
  /** Builds the request URL for a barcode. */
  productUrl: (barcode: string) => string
  /** Maps the API's JSON response to the provider-neutral BarcodeLookup. */
  parseResponse: (json: unknown) => BarcodeLookup
}

export type FoodDataProvider = {
  lookup: (barcode: string) => Promise<BarcodeLookup>
}
