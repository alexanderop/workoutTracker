import type { DbFood } from '@/db/schema'

const DIACRITICS = /\p{Diacritic}/gu

/**
 * Fold a food name or brand down to something a one-handed, mid-day search
 * can hit: case-insensitive and diacritic-insensitive, so "musli" finds
 * "Müsli". German ß is deliberately left alone — Unicode normalisation does
 * not decompose it, and mapping it to "ss" would be a separate rule than the
 * accent folding this does.
 */
export function normalizeForSearch(value: string): string {
  return value.normalize('NFD').replaceAll(DIACRITICS, '').toLowerCase()
}

/**
 * Filter the food library by a free-text query over name and brand.
 *
 * An empty query returns the input untouched — the repository already sorts
 * foods by `lastUsedAt` descending, so "no query" means "recents", which is
 * what the sheet shows on open.
 */
export function searchFoods(foods: ReadonlyArray<DbFood>, query: string): ReadonlyArray<DbFood> {
  const needle = normalizeForSearch(query.trim())
  if (needle.length === 0) return foods
  return foods.filter((food) =>
    normalizeForSearch(`${food.name} ${food.brand ?? ''}`).includes(needle),
  )
}
