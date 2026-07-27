import type { DbFoodNutrients } from '@/db/schema'

/**
 * Provider-neutral food data resolved from an external source — a scanned
 * barcode or a text search — normalized per 100 g. Every food data source
 * maps its response into this shape.
 */
export type ExternalFood = {
  name: string
  brand: string | null
  servingGrams: number | null
  nutrientsPer100Grams: DbFoodNutrients
}

/** An external food plus a key stable enough for a list to render it. */
export type ExternalFoodHit = ExternalFood & {
  /** Provider-side identity (a barcode, for Open Food Facts). */
  readonly id: string
}

export type BarcodeLookup =
  | { status: 'found'; food: ExternalFood }
  | { status: 'not-found' }
  | { status: 'error' }

/**
 * Outcome of a text search against an external food database. "No hits" is a
 * successful search with an empty list, not an error — the panel says
 * different things about the two.
 */
export type FoodSearchLookup =
  | { status: 'ok'; foods: ReadonlyArray<ExternalFoodHit> }
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

/**
 * Contract every text-search data source implements. Separate from
 * `BarcodeApiAdapter` because the two are used independently: the scanner
 * needs no search, and the search panel needs no barcode.
 */
export type FoodSearchApiAdapter = {
  /** Builds the request URL for a free-text query. */
  searchUrl: (query: string) => string
  /** Maps the API's JSON response to provider-neutral hits. */
  parseSearchResponse: (json: unknown) => FoodSearchLookup
}

export type FoodDataProvider = {
  lookup: (barcode: string) => Promise<BarcodeLookup>
}
