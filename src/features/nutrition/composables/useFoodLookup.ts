import { useFetch } from '@vueuse/core'
import { computed, ref } from 'vue'
import type { BarcodeApiAdapter, BarcodeLookup, FoodDataProvider } from '../lib/foodData'
import { openFoodFactsAdapter } from '../lib/openFoodFacts'

const LOOKUP_TIMEOUT_MS = 10_000

/**
 * Barcode lookup against the configured food-data API. Defaults to Open Food
 * Facts; pass a different BarcodeApiAdapter to switch APIs.
 */
export function useFoodLookup(adapter: BarcodeApiAdapter = openFoodFactsAdapter): FoodDataProvider {
  const barcode = ref('')
  const url = computed(() => adapter.productUrl(barcode.value))
  const { execute, data, response } = useFetch(url, {
    immediate: false,
    timeout: LOOKUP_TIMEOUT_MS,
  })
    .get()
    .json<unknown>()

  async function lookup(code: string): Promise<BarcodeLookup> {
    barcode.value = code
    await execute()
    if (response.value?.status === 404) return { status: 'not-found' }
    if (response.value?.ok !== true || data.value === null) return { status: 'error' }
    return adapter.parseResponse(data.value)
  }

  return { lookup }
}
