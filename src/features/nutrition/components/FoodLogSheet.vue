<script setup lang="ts">
import { Barcode, PenLine, Search, X, Zap } from '@lucide/vue'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { getNutritionRepository } from '@/db'
import type { DbFood, DbFoodNutrients, DbNutritionTargets, MealKind } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'
import { useToastStore } from '@/stores/toast'
import { useFoodLogBasket } from '../composables/useFoodLogBasket'
import { useFoodLookup } from '../composables/useFoodLookup'
import { isBarcodeScanSupported } from '../lib/barcodeDetector'
import { buildCommit } from '../lib/foodBasket'
import type { ExternalFood, ExternalFoodHit } from '../lib/foodData'
import FoodBasketTray from './FoodBasketTray.vue'
import FoodBudgetBars from './FoodBudgetBars.vue'
import FoodCustomPanel from './FoodCustomPanel.vue'
import type { CustomFood } from './FoodCustomPanel.vue'
import FoodPortionPanel from './FoodPortionPanel.vue'
import FoodQuickAddPanel from './FoodQuickAddPanel.vue'
import FoodSearchPanel from './FoodSearchPanel.vue'

// Loaded on first scan so the camera/torch machinery stays off the startup
// path — the app has a Lighthouse performance budget on first paint.
const FoodBarcodeScanner = defineAsyncComponent(() => import('./FoodBarcodeScanner.vue'))

type Tab = 'search' | 'scan' | 'quick' | 'custom'

/**
 * One scanning attempt, start to finish. A union rather than a status string
 * plus a nullable pending food: `confirm` without a food — or a leftover food
 * in any other state — should not be representable.
 */
type ScanFlow =
  | { kind: 'scanning' }
  | { kind: 'looking-up' }
  | { kind: 'not-found' }
  | { kind: 'failed' }
  | { kind: 'confirm'; food: ExternalFood }

/**
 * A search row opened in the portion panel. The origin decides what Add
 * stages: a library food keeps its `foodId`, an Open Food Facts hit becomes a
 * new food — same split the plus buttons already make.
 */
type SearchPortion =
  | { origin: 'library'; food: DbFood }
  | { origin: 'external'; hit: ExternalFoodHit }

/** Both origins render through the panel's provider-neutral food shape. */
function portionFood(portion: SearchPortion): ExternalFood {
  if (portion.origin === 'external') return portion.hit
  const { name, brand, defaultServingGrams, nutrientsPer100Grams } = portion.food
  return { name, brand, servingGrams: defaultServingGrams, nutrientsPer100Grams }
}

const { foods, localDate, initialMeal, goal, committed, dayLabel } = defineProps<{
  foods: ReadonlyArray<DbFood>
  localDate: string
  initialMeal: MealKind
  goal: DbNutritionTargets
  /** Macros already logged for this day, so the bars can show staged on top. */
  committed: DbFoodNutrients
  dayLabel: string
}>()
const open = defineModel<boolean>('open', { required: true })

const { t } = useI18n()
const { showToast } = useToastStore()
const basket = useFoodLogBasket()
const { lookup } = useFoodLookup()

const tab = ref<Tab>('search')
const query = ref('')
const scanFlow = ref<ScanFlow>({ kind: 'scanning' })
const searchPortion = ref<SearchPortion | null>(null)
const committing = ref(false)
const commitFailed = ref(false)

const scanSupported = isBarcodeScanSupported()
const tabs = computed(() =>
  (
    [
      { id: 'search', label: t('nutrition.sheet.tabs.search'), icon: Search },
      { id: 'scan', label: t('nutrition.sheet.tabs.scan'), icon: Barcode },
      { id: 'quick', label: t('nutrition.sheet.tabs.quick'), icon: Zap },
      { id: 'custom', label: t('nutrition.sheet.tabs.custom'), icon: PenLine },
    ] as const satisfies ReadonlyArray<{ id: Tab; label: string; icon: unknown }>
  ).filter((entry) => entry.id !== 'scan' || scanSupported),
)

// `immediate` matters: both call sites mount this component lazily, with
// `open` already true, so a plain watcher would miss the first opening
// entirely. `basket.localDate` would then still be empty on the *second*
// opening, which `openFor` reads as a day change and discards the basket —
// exactly the thing an app-scoped basket exists to prevent.
watch(
  open,
  (isOpen) => {
    if (!isOpen) return
    // The basket deliberately survives a close, so only the transient
    // per-opening state resets here.
    basket.openFor(localDate, initialMeal)
    tab.value = 'search'
    query.value = ''
    scanFlow.value = { kind: 'scanning' }
    searchPortion.value = null
    commitFailed.value = false
  },
  { immediate: true },
)

async function handleBarcodeDetected(barcode: string): Promise<void> {
  scanFlow.value = { kind: 'looking-up' }
  const result = await lookup(barcode)
  // The sheet was reopened, or the user left the scan tab, mid-lookup.
  if (scanFlow.value.kind !== 'looking-up') return
  if (result.status !== 'found') {
    scanFlow.value = { kind: result.status === 'not-found' ? 'not-found' : 'failed' }
    return
  }
  // Into a confirmation step, not straight into the basket: the barcode names
  // the product, but only the user knows how much of it is on the plate.
  scanFlow.value = { kind: 'confirm', food: result.food }
}

/** The portion panel's Add: stage the confirmed grams and return to search. */
function stageScannedFood(food: ExternalFood, grams: number): void {
  const { name, brand, nutrientsPer100Grams } = food
  basket.stage({ source: 'new', name, brand, nutrientsPer100Grams, grams })
  scanFlow.value = { kind: 'scanning' }
  tab.value = 'search'
  showToast(t('nutrition.sheet.scanAdded', { name }))
}

/**
 * An Open Food Facts hit stages exactly like a scanned one — `source: 'new'`,
 * so committing adds it to the library and the next search finds it locally,
 * without a round trip.
 */
function stageExternalFood(hit: ExternalFoodHit): void {
  const { name, brand, servingGrams, nutrientsPer100Grams } = hit
  basket.stage({ source: 'new', name, brand, nutrientsPer100Grams, grams: servingGrams ?? 100 })
}

/** The search-tab portion panel's Add: stage the confirmed grams. */
function stageSearchPortion(portion: SearchPortion, grams: number): void {
  searchPortion.value = null
  if (portion.origin === 'library') {
    const { id, name, brand, nutrientsPer100Grams } = portion.food
    basket.stage({ source: 'library', foodId: id, name, brand, nutrientsPer100Grams, grams })
    return
  }
  const { name, brand, nutrientsPer100Grams } = portion.hit
  basket.stage({ source: 'new', name, brand, nutrientsPer100Grams, grams })
}

function stageQuickAdd(nutrients: DbFoodNutrients): void {
  basket.stageQuickAdd(t('nutrition.sheet.quickName'), nutrients)
  tab.value = 'search'
}

function stageCustomFood(food: CustomFood): void {
  basket.stage({ source: 'new', ...food })
  tab.value = 'search'
}

async function commit(): Promise<void> {
  if (basket.isEmpty.value || committing.value) return
  committing.value = true
  commitFailed.value = false

  const meal = basket.meal.value
  const { foods: newFoods, entries } = buildCommit(basket.items.value, {
    localDate,
    meal,
    now: Date.now(),
    servingName: t('nutrition.food.serving'),
  })

  const [error] = await tryCatch(getNutritionRepository().commitDiaryBatch(newFoods, entries))
  committing.value = false
  if (error) {
    commitFailed.value = true
    return
  }

  // Cleared only after the write landed — a failed commit has to leave the
  // basket intact, or the user is retyping five items mid-meal.
  basket.clear()
  open.value = false
  showToast(
    t('nutrition.sheet.logged', {
      count: entries.length,
      meal: t(`nutrition.meals.${meal}`),
    }),
  )
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent
      class="h-[92dvh] gap-0 px-0 pb-0 sm:h-[80vh] sm:px-0 sm:pb-0"
      :show-close-button="false"
    >
      <DialogHeader class="sr-only">
        <DialogTitle>{{ t('nutrition.sheet.title') }}</DialogTitle>
        <DialogDescription>{{ t('nutrition.sheet.description') }}</DialogDescription>
      </DialogHeader>

      <div class="shrink-0 space-y-2.5 border-b px-3 pb-2.5">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
            :aria-label="t('common.buttons.close')"
            @click="open = false"
          >
            <X class="size-4" aria-hidden="true" />
          </button>
          <p class="shrink-0 text-xs font-medium text-muted-foreground">{{ dayLabel }}</p>
          <Label for="food-sheet-meal" class="sr-only">{{ t('nutrition.food.meal') }}</Label>
          <NativeSelect id="food-sheet-meal" v-model="basket.meal.value" class="h-9 w-auto text-xs">
            <option value="breakfast">{{ t('nutrition.meals.breakfast') }}</option>
            <option value="lunch">{{ t('nutrition.meals.lunch') }}</option>
            <option value="dinner">{{ t('nutrition.meals.dinner') }}</option>
            <option value="snack">{{ t('nutrition.meals.snack') }}</option>
          </NativeSelect>
          <Button
            size="sm"
            class="ml-auto shrink-0 rounded-full"
            :disabled="basket.isEmpty.value || committing"
            @click="commit"
          >
            <template v-if="committing">{{ t('nutrition.sheet.committing') }}</template>
            <template v-else-if="basket.isEmpty.value">{{ t('nutrition.sheet.commit') }}</template>
            <template v-else>
              {{ t('nutrition.sheet.commitCount', { count: basket.items.value.length }) }}
            </template>
          </Button>
        </div>

        <FoodBasketTray
          :items="basket.items.value"
          @adjust="basket.adjustGrams"
          @set="basket.setGrams"
          @remove="basket.unstage"
        />

        <FoodBudgetBars :committed="committed" :staged="basket.totals.value" :goal="goal" />

        <p v-if="commitFailed" role="alert" class="text-sm text-destructive">
          {{ t('nutrition.errors.saveFailed') }}
        </p>
      </div>

      <div class="flex shrink-0 border-b">
        <button
          v-for="entry in tabs"
          :key="entry.id"
          type="button"
          class="flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 text-xs font-medium transition-colors"
          :class="
            tab === entry.id
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground'
          "
          :aria-pressed="tab === entry.id"
          @click="tab = entry.id"
        >
          <component :is="entry.icon" class="size-4" aria-hidden="true" />
          {{ entry.label }}
        </button>
      </div>

      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <FoodPortionPanel
          v-if="tab === 'search' && searchPortion !== null"
          :food="portionFood(searchPortion)"
          :goal="goal"
          class="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          @add="stageSearchPortion(searchPortion, $event)"
          @back="searchPortion = null"
        />
        <FoodSearchPanel
          v-else-if="tab === 'search'"
          v-model:query="query"
          :foods="foods"
          @stage="basket.stageLibraryFood"
          @stage-external="stageExternalFood"
          @open="searchPortion = { origin: 'library', food: $event }"
          @open-external="searchPortion = { origin: 'external', hit: $event }"
        />

        <div v-else-if="tab === 'scan'" class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <FoodPortionPanel
            v-if="scanFlow.kind === 'confirm'"
            :food="scanFlow.food"
            :goal="goal"
            @add="stageScannedFood(scanFlow.food, $event)"
            @back="scanFlow = { kind: 'scanning' }"
          />
          <div v-else class="space-y-3 p-4">
            <FoodBarcodeScanner
              v-if="scanFlow.kind !== 'looking-up'"
              @detected="handleBarcodeDetected"
              @cancel="tab = 'search'"
            />
            <p v-else class="text-sm text-muted-foreground">
              {{ t('nutrition.food.scanLookingUp') }}
            </p>
            <p v-if="scanFlow.kind === 'not-found'" role="alert" class="text-sm text-destructive">
              {{ t('nutrition.food.scanNotFound') }}
            </p>
            <p v-if="scanFlow.kind === 'failed'" role="alert" class="text-sm text-destructive">
              {{ t('nutrition.food.scanFailed') }}
            </p>
          </div>
        </div>

        <div v-else class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <FoodQuickAddPanel v-if="tab === 'quick'" @stage="stageQuickAdd" />
          <FoodCustomPanel v-else @stage="stageCustomFood" />
        </div>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
