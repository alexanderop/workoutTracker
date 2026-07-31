import { generateId } from '@/db/generateId'
import type { DbFood, DbFoodNutrients, DbNutritionDiaryEntry, MealKind } from '@/db/schema'
import { scaleNutrients } from './nutritionCalculations'

/**
 * Where a staged item came from, which is the only thing that decides what
 * committing it writes:
 *
 * - `library` — an existing food; the commit adds a diary entry only.
 * - `new` — scanned or hand-entered; the commit creates a reusable `DbFood`
 *   alongside the entry.
 * - `quick` — macros without a food. The commit writes an entry with
 *   `foodId: null` and nothing reaches the library.
 *
 * A discriminated union rather than `createsFood`/`hasFoodId` booleans:
 * "creates a food *and* points at an existing one" is not a reachable state
 * and should not be representable.
 */
type StagedSource =
  | { readonly source: 'library'; readonly foodId: string }
  | { readonly source: 'new' }
  | { readonly source: 'quick' }

/**
 * An item as a caller describes it, before the basket gives it an identity.
 * Split out because `Omit<StagedItem, 'stageId'>` would collapse the union
 * above into one shape with an optional `foodId`.
 */
export type UnstagedItem = StagedSource & {
  readonly name: string
  readonly brand: string | null
  readonly nutrientsPer100Grams: DbFoodNutrients
  /**
   * Always concrete. A quick add stores its macros as the per-100g figure and
   * pins this to 100, so scaling is the identity and every item in the basket
   * sums the same way.
   */
  readonly grams: number
}

export type StagedItem = UnstagedItem & {
  /** Identity within the basket only; never persisted. */
  readonly stageId: string
}

export type CommitBatch = {
  readonly foods: ReadonlyArray<DbFood>
  readonly entries: ReadonlyArray<DbNutritionDiaryEntry>
}

/** Smallest sensible portion; grams edits never walk a food down to nothing. */
export const MIN_GRAMS = 5

/** Grams are meaningless for a quick add — its macros are the whole truth. */
export function isAdjustable(item: StagedItem): boolean {
  return item.source !== 'quick'
}

/** Macros a staged item contributes, scaled to its grams. */
function stagedNutrients(item: StagedItem): DbFoodNutrients {
  return scaleNutrients(item.nutrientsPer100Grams, item.grams)
}

export function stagedTotals(items: ReadonlyArray<StagedItem>): DbFoodNutrients {
  return items.reduce<DbFoodNutrients>(
    (total, item) => {
      const nutrients = stagedNutrients(item)
      return {
        calories: total.calories + nutrients.calories,
        proteinGrams: total.proteinGrams + nutrients.proteinGrams,
        carbohydrateGrams: total.carbohydrateGrams + nutrients.carbohydrateGrams,
        fatGrams: total.fatGrams + nutrients.fatGrams,
      }
    },
    { calories: 0, proteinGrams: 0, carbohydrateGrams: 0, fatGrams: 0 },
  )
}

export type BuildCommitOptions = {
  readonly localDate: string
  readonly meal: MealKind
  readonly now: number
  /** Localised `DbFood.defaultServingName` for foods this commit creates. */
  readonly servingName: string
  /** Injectable so specs can assert on ids instead of matching UUID shapes. */
  readonly newId?: () => string
}

/**
 * Turn a basket into the exact rows one transaction has to write.
 *
 * Pure on purpose: the whole "did the basket become the right diary" question
 * is decidable in the Node tier, leaving the browser tier to prove only that
 * the transaction is atomic.
 */
export function buildCommit(
  items: ReadonlyArray<StagedItem>,
  options: BuildCommitOptions,
): CommitBatch {
  const { localDate, meal, now, servingName, newId = generateId } = options
  const foods: Array<DbFood> = []
  const entries: Array<DbNutritionDiaryEntry> = []

  function entryFor(item: StagedItem, foodId: string | null): DbNutritionDiaryEntry {
    return {
      id: newId(),
      localDate,
      meal,
      foodId,
      grams: item.grams,
      foodSnapshot: {
        name: item.name,
        brand: item.brand,
        // Copied, not aliased. The basket is reactive state, and IndexedDB
        // cannot `structuredClone` a Vue proxy -- passing one straight
        // through fails the write with a DataCloneError.
        nutrientsPer100Grams: { ...item.nutrientsPer100Grams },
      },
      loggedAt: now,
      updatedAt: now,
    }
  }

  for (const item of items) {
    if (item.source === 'new') {
      const food: DbFood = {
        id: newId(),
        name: item.name,
        brand: item.brand,
        nutrientsPer100Grams: { ...item.nutrientsPer100Grams },
        defaultServingName: servingName,
        defaultServingGrams: item.grams,
        favorite: false,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
        lastUsedAt: now,
      }
      foods.push(food)
      entries.push(entryFor(item, food.id))
      continue
    }
    entries.push(entryFor(item, item.source === 'library' ? item.foodId : null))
  }

  return { foods, entries }
}
