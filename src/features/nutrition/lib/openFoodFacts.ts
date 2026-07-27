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
 * Drops the keys Open Food Facts has no value for.
 *
 * It spells "not known" two ways — the key is absent, or it is present and
 * `null` for a crowd-sourced entry whose field was cleared — and both have to
 * mean the same thing here. Reconciling them once, before validation, is why
 * every field below can stay a plain `.optional()`. Letting `null` reach the
 * schema instead fails the *whole product*: `"serving_quantity": null` is
 * common enough to drop about one hit per search page, and on the barcode path
 * it turns a scan of a real, fully-populated product into a lookup error.
 *
 * One level deep on purpose — each nested object is parsed through its own
 * schema, which does this for itself.
 *
 * Arrays pass through untouched so they stay malformed. `Object.fromEntries`
 * would turn `[]` into `{}`, and since every field below is optional the empty
 * object validates: a scan of a product whose `nutriments` came back as an
 * array would report "found" with a silent 0 kcal for every macro instead of
 * an error.
 */
function withoutUnknownFields(value: unknown): unknown {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value
  return Object.fromEntries(Object.entries(value).filter(([, field]) => field !== null))
}

/**
 * Macros per 100 g (per 100 ml for beverages, which OFF also reports under
 * the `_100g` keys). `energy_100g` is kilojoules and is only used as a
 * fallback when `energy-kcal_100g` is missing.
 */
const nutrimentsSchema = z.preprocess(
  withoutUnknownFields,
  z.object({
    'energy-kcal_100g': numericValueSchema.optional(),
    energy_100g: numericValueSchema.optional(),
    proteins_100g: numericValueSchema.optional(),
    carbohydrates_100g: numericValueSchema.optional(),
    fat_100g: numericValueSchema.optional(),
  }),
)

/**
 * Brands as either backend spells them: the CGI serves one comma-separated
 * string, Search-a-licious an array of names. Normalised to the string form so
 * everything downstream reads a single shape.
 */
const brandsSchema = z
  .union([z.string(), z.array(z.string())])
  .transform((value) => (Array.isArray(value) ? value.join(',') : value))

const productSchema = z.preprocess(
  withoutUnknownFields,
  z.object({
    code: z.string().optional(),
    product_name: z.string().optional(),
    brands: brandsSchema.optional(),
    serving_quantity: numericValueSchema.optional(),
    nutriments: nutrimentsSchema.optional(),
  }),
)

/**
 * Response of GET /api/v2/product/{barcode}. `status` is 1 when the product
 * exists and 0 for unknown/invalid codes (which the API can also answer with
 * an HTTP 404 instead of a body).
 *
 * Required, not optional: the endpoint sends it on every answer — verified for
 * both a known and an unknown barcode, and it survives the `fields` filter. A
 * body without it did not come from this API, and a `product` arriving with no
 * verdict attached is not grounds to log food from it.
 */
const productStatusSchema = z.union([z.literal(0), z.literal(1)])

const productResponseSchema = z.preprocess(
  withoutUnknownFields,
  z.object({
    status: productStatusSchema,
    product: productSchema.optional(),
  }),
)

/**
 * Text search returns a page of products. Open Food Facts serves this from two
 * places with the same product shape under different keys: the legacy
 * `/cgi/search.pl` answers with `products`, the Search-a-licious service with
 * `hits`. Accepting both means moving to Search-a-licious, should it ever
 * become reachable from a browser (see below), needs no change here — but it
 * is not a one-line switch: that service takes the query as `q` and has no use
 * for `search_simple`/`action`/`json`, so `searchUrl` has to change with it.
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
 * The legacy `/cgi/search.pl`, on the same host as the barcode lookup, rather
 * than Search-a-licious at `search.openfoodfacts.org`.
 *
 * Search-a-licious is the faster and better endpoint, and it is unusable from
 * a browser: it answers with `Access-Control-Allow-Credentials: true` and no
 * `Access-Control-Allow-Origin` at all, so every request this app makes is
 * blocked at the CORS layer before the response is readable — search could
 * only ever render "Open Food Facts is unreachable". That is a server-side
 * misconfiguration nothing here can work around; a proxy would need a backend,
 * and this app does not have one.
 *
 * `world.openfoodfacts.org` sends `Access-Control-Allow-Origin: *`, which is
 * why the barcode scanner has always worked. The trade is a much slower and
 * less available backend — it answers a large share of requests with an HTML
 * 503 under load — which is why `useRemoteFoodSearch` retries before giving
 * up. What it cannot retry past still lands in the `error` state, leaving the
 * user's own library untouched.
 */
const SEARCH_ENDPOINT = 'https://world.openfoodfacts.org/cgi/search.pl'
/**
 * Worth sending even though the CGI only honours it at the top level: it takes
 * a page of 20 from ~790 kB to ~35 kB. The remainder is `nutriments`, which
 * comes back complete (~81 keys per product) whether or not five of them are
 * all that is asked for — the CGI has no syntax for selecting inside it, so
 * that cost is not removable from this side.
 */
const SEARCH_FIELDS = 'code,product_name,brands,serving_quantity,nutriments'
/** One screenful after dedupe against the library; the list scrolls, but nobody scrolls it far. */
const SEARCH_PAGE_SIZE = 20

function productUrl(barcode: string): string {
  return `${PRODUCT_ENDPOINT}${encodeURIComponent(barcode)}?fields=${PRODUCT_FIELDS}`
}

function searchUrl(query: string): string {
  const parameters = new URLSearchParams({
    search_terms: query,
    // The CGI serves the human search page by default; these two ask it for the
    // free-text search a query field means, and `json` for a body to parse.
    search_simple: '1',
    action: 'process',
    json: '1',
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
  // Falls back to the position when a hit carries no barcode -- or a blank
  // one, which would hand every such hit the same list key. The id only has to
  // be unique within one response.
  const code = product.code?.trim()
  return { ...food, id: code === undefined || code.length === 0 ? `off-${index}` : code }
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
