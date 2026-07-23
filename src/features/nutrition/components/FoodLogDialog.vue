<script setup lang="ts">
import { ArrowLeft, ScanBarcode } from '@lucide/vue'
import { computed, defineAsyncComponent, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { generateId, getNutritionRepository } from '@/db'
import type { DbFood, DbFoodNutrients, DbNutritionDiaryEntry, MealKind } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'
import { useFoodLookup } from '../composables/useFoodLookup'
import { isBarcodeScanSupported } from '../lib/barcodeDetector'
import type { ScannedFood } from '../lib/foodData'
import { shiftLocalDateKey } from '../lib/foodLogTimeline'
import { quickAddGrams } from '../lib/foodSuggestions'
import { getLocalDateKey, nutrientsPer100Grams, scaleNutrients } from '../lib/nutritionCalculations'
import FoodSearchPanel from './FoodSearchPanel.vue'

// Loaded on first scan so the camera/torch machinery stays off the startup
// path — the app has a Lighthouse performance budget on first paint.
const FoodBarcodeScanner = defineAsyncComponent(() => import('./FoodBarcodeScanner.vue'))

/** Days of diary history the picks/recents suggestions are ranked over. */
const SUGGESTION_HISTORY_DAYS = 90

const { foods, localDate, initialMeal } = defineProps<{
  foods: ReadonlyArray<DbFood>
  localDate: string
  initialMeal: MealKind
}>()
const open = defineModel<boolean>('open', { required: true })
const { t } = useI18n()

type DialogMode = { kind: 'search' } | { kind: 'portion'; food: DbFood } | { kind: 'create' }

// Shallow on purpose: the mode object is replaced wholesale, and a deep ref
// would proxy the carried DbFood — IndexedDB's structured clone rejects
// proxies when the food snapshot is persisted.
const mode = shallowRef<DialogMode>({ kind: 'search' })

const name = ref('')
const meal = ref<MealKind>(initialMeal)
const grams = ref<number | string>(100)
const calories = ref<number | string>('')
const protein = ref<number | string>('')
const carbohydrates = ref<number | string>('')
const fat = ref<number | string>('')
const brand = ref('')
const saving = ref(false)
const saveFailed = ref(false)

type ScanState = 'idle' | 'scanning' | 'looking-up' | 'not-found' | 'failed'
const scanSupported = isBarcodeScanSupported()
const scanState = ref<ScanState>('idle')
const { lookup } = useFoodLookup()

// Suggestions rank over recent history across all days, not just the diary
// day being edited.
const { data: historyEntries } = useLiveQuery(() => {
  const today = getLocalDateKey()
  return getNutritionRepository().observeRange(
    shiftLocalDateKey(today, -(SUGGESTION_HISTORY_DAYS - 1)),
    today,
  )
})
const history = computed(() => historyEntries.value ?? [])

const isValid = computed(() => {
  if (Number(grams.value) <= 0) return false
  if (mode.value.kind === 'portion') return true
  return (
    name.value.trim().length > 0 &&
    Number(calories.value) >= 0 &&
    Number(protein.value) >= 0 &&
    Number(carbohydrates.value) >= 0 &&
    Number(fat.value) >= 0
  )
})

watch(open, (isOpen) => {
  if (!isOpen) return
  mode.value = { kind: 'search' }
  name.value = ''
  meal.value = initialMeal
  grams.value = 100
  calories.value = ''
  protein.value = ''
  carbohydrates.value = ''
  fat.value = ''
  brand.value = ''
  saveFailed.value = false
  scanState.value = 'idle'
})

function backToSearch() {
  mode.value = { kind: 'search' }
  saveFailed.value = false
  scanState.value = 'idle'
}

function selectFood(food: DbFood) {
  mode.value = { kind: 'portion', food }
  meal.value = initialMeal
  grams.value = quickAddGrams(food, history.value)
  saveFailed.value = false
}

function startCreate(initialName: string) {
  mode.value = { kind: 'create' }
  name.value = initialName
  meal.value = initialMeal
  grams.value = 100
  saveFailed.value = false
}

function roundNutrient(value: number): number {
  return Math.round(value * 10) / 10
}

function applyScannedFood(food: ScannedFood) {
  name.value = food.name
  brand.value = food.brand ?? ''
  const servingGrams = food.servingGrams ?? 100
  grams.value = servingGrams
  const serving = scaleNutrients(food.nutrientsPer100Grams, servingGrams)
  calories.value = Math.round(serving.calories)
  protein.value = roundNutrient(serving.proteinGrams)
  carbohydrates.value = roundNutrient(serving.carbohydrateGrams)
  fat.value = roundNutrient(serving.fatGrams)
}

async function handleBarcodeDetected(barcode: string) {
  scanState.value = 'looking-up'
  const result = await lookup(barcode)
  // The dialog was reset (closed/reopened) while the lookup was in flight.
  if (scanState.value !== 'looking-up') return
  // The user left the create form mid-lookup; discard the result.
  if (mode.value.kind !== 'create') {
    scanState.value = 'idle'
    return
  }
  if (result.status !== 'found') {
    scanState.value = result.status === 'not-found' ? 'not-found' : 'failed'
    return
  }
  applyScannedFood(result.food)
  scanState.value = 'idle'
}

function diaryEntryFor(
  food: DbFood,
  entryGrams: number,
  entryMeal: MealKind,
  now: number,
): DbNutritionDiaryEntry {
  return {
    id: generateId(),
    localDate,
    meal: entryMeal,
    foodId: food.id,
    grams: entryGrams,
    foodSnapshot: {
      name: food.name,
      brand: food.brand,
      nutrientsPer100Grams: food.nutrientsPer100Grams,
    },
    loggedAt: now,
    updatedAt: now,
  }
}

async function quickAdd(food: DbFood) {
  if (saving.value) return
  saving.value = true
  saveFailed.value = false
  const entry = diaryEntryFor(food, quickAddGrams(food, history.value), initialMeal, Date.now())
  const [error] = await tryCatch(getNutritionRepository().addDiaryEntry(entry))
  saving.value = false
  if (error) saveFailed.value = true
  // Stays open on success so more foods can be logged in one visit.
}

async function toggleFavorite(food: DbFood) {
  saveFailed.value = false
  const [error] = await tryCatch(
    getNutritionRepository().updateFood(food.id, {
      favorite: !food.favorite,
      updatedAt: Date.now(),
    }),
  )
  if (error) saveFailed.value = true
}

async function save() {
  if (!isValid.value || saving.value) return
  saving.value = true
  saveFailed.value = false
  const repository = getNutritionRepository()
  const now = Date.now()
  const servingGrams = Number(grams.value)

  function logNewFood(): Promise<void> {
    const servingNutrients: DbFoodNutrients = {
      calories: Number(calories.value),
      proteinGrams: Number(protein.value),
      carbohydrateGrams: Number(carbohydrates.value),
      fatGrams: Number(fat.value),
    }
    const trimmedBrand = brand.value.trim()
    const food: DbFood = {
      id: generateId(),
      name: name.value.trim(),
      brand: trimmedBrand.length > 0 ? trimmedBrand : null,
      nutrientsPer100Grams: nutrientsPer100Grams(servingNutrients, servingGrams),
      defaultServingName: t('nutrition.food.serving'),
      defaultServingGrams: servingGrams,
      favorite: false,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
    }
    return repository.addFoodAndDiaryEntry(food, diaryEntryFor(food, servingGrams, meal.value, now))
  }

  const promise =
    mode.value.kind === 'portion'
      ? repository.addDiaryEntry(diaryEntryFor(mode.value.food, servingGrams, meal.value, now))
      : logNewFood()

  const [error] = await tryCatch(promise)
  saving.value = false
  if (error) {
    saveFailed.value = true
    return
  }
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent class="sm:max-h-[min(40rem,calc(100vh-4rem))]">
      <DialogHeader>
        <DialogTitle>{{ t('nutrition.food.title') }}</DialogTitle>
        <DialogDescription>{{ t('nutrition.food.description') }}</DialogDescription>
      </DialogHeader>

      <template v-if="mode.kind === 'search'">
        <FoodSearchPanel
          :foods="foods"
          :history="history"
          @select="selectFood"
          @quick-add="quickAdd"
          @toggle-favorite="toggleFavorite"
          @create="startCreate"
        />
        <p v-if="saveFailed" role="alert" class="text-sm text-destructive">
          {{ t('nutrition.errors.saveFailed') }}
        </p>
      </template>

      <form v-else class="flex min-h-0 flex-col gap-4" @submit.prevent="save">
        <Button type="button" variant="ghost" size="sm" class="w-fit -ml-2" @click="backToSearch">
          <ArrowLeft class="size-4" aria-hidden="true" />
          {{ t('nutrition.food.backToSearch') }}
        </Button>

        <div
          v-if="scanState === 'scanning'"
          class="min-h-0 overflow-y-auto overscroll-contain scroll-py-2"
        >
          <FoodBarcodeScanner @detected="handleBarcodeDetected" @cancel="scanState = 'idle'" />
        </div>
        <div v-else class="min-h-0 space-y-4 overflow-y-auto overscroll-contain scroll-py-2">
          <p v-if="mode.kind === 'portion'" class="px-1 font-medium">
            {{ mode.food.name }}
            <span v-if="mode.food.brand" class="text-muted-foreground">
              · {{ mode.food.brand }}
            </span>
          </p>

          <div v-if="mode.kind === 'create' && scanSupported" class="space-y-1.5">
            <Button
              type="button"
              variant="outline"
              class="w-full"
              :disabled="scanState === 'looking-up'"
              @click="scanState = 'scanning'"
            >
              <ScanBarcode />
              {{
                scanState === 'looking-up'
                  ? t('nutrition.food.scanLookingUp')
                  : t('nutrition.food.scan')
              }}
            </Button>
            <p v-if="scanState === 'not-found'" role="alert" class="text-sm text-destructive">
              {{ t('nutrition.food.scanNotFound') }}
            </p>
            <p v-if="scanState === 'failed'" role="alert" class="text-sm text-destructive">
              {{ t('nutrition.food.scanFailed') }}
            </p>
          </div>

          <div v-if="mode.kind === 'create'" class="space-y-1.5">
            <Label for="nutrition-food-name">{{ t('nutrition.food.name') }}</Label>
            <Input
              id="nutrition-food-name"
              v-model="name"
              :placeholder="t('nutrition.food.namePlaceholder')"
              autocomplete="off"
            />
          </div>

          <div v-if="mode.kind === 'create'" class="space-y-1.5">
            <Label for="nutrition-food-brand">{{ t('nutrition.food.brand') }}</Label>
            <Input
              id="nutrition-food-brand"
              v-model="brand"
              :placeholder="t('nutrition.food.brandPlaceholder')"
              autocomplete="off"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label for="nutrition-food-meal">{{ t('nutrition.food.meal') }}</Label>
              <NativeSelect id="nutrition-food-meal" v-model="meal" class="w-full">
                <option value="breakfast">{{ t('nutrition.meals.breakfast') }}</option>
                <option value="lunch">{{ t('nutrition.meals.lunch') }}</option>
                <option value="dinner">{{ t('nutrition.meals.dinner') }}</option>
                <option value="snack">{{ t('nutrition.meals.snack') }}</option>
              </NativeSelect>
            </div>
            <div class="space-y-1.5">
              <Label for="nutrition-food-grams">{{ t('nutrition.food.servingGrams') }}</Label>
              <Input
                id="nutrition-food-grams"
                v-model="grams"
                type="number"
                min="1"
                step="1"
                inputmode="decimal"
              />
            </div>
          </div>

          <div v-if="mode.kind === 'create'">
            <p class="mb-2 text-sm font-medium">{{ t('nutrition.food.nutrientsForServing') }}</p>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <Label for="nutrition-food-calories">{{ t('nutrition.fields.calories') }}</Label>
                <Input
                  id="nutrition-food-calories"
                  v-model="calories"
                  type="number"
                  min="0"
                  inputmode="decimal"
                />
              </div>
              <div class="space-y-1.5">
                <Label for="nutrition-food-protein">{{ t('nutrition.fields.protein') }}</Label>
                <Input
                  id="nutrition-food-protein"
                  v-model="protein"
                  type="number"
                  min="0"
                  step="0.1"
                  inputmode="decimal"
                />
              </div>
              <div class="space-y-1.5">
                <Label for="nutrition-food-carbs">{{ t('nutrition.fields.carbs') }}</Label>
                <Input
                  id="nutrition-food-carbs"
                  v-model="carbohydrates"
                  type="number"
                  min="0"
                  step="0.1"
                  inputmode="decimal"
                />
              </div>
              <div class="space-y-1.5">
                <Label for="nutrition-food-fat">{{ t('nutrition.fields.fat') }}</Label>
                <Input
                  id="nutrition-food-fat"
                  v-model="fat"
                  type="number"
                  min="0"
                  step="0.1"
                  inputmode="decimal"
                />
              </div>
            </div>
          </div>
        </div>

        <p v-if="saveFailed" role="alert" class="text-sm text-destructive">
          {{ t('nutrition.errors.saveFailed') }}
        </p>
        <Button
          v-if="scanState !== 'scanning'"
          type="submit"
          class="w-full"
          :disabled="!isValid || saving"
        >
          {{ saving ? t('common.states.saving') : t('nutrition.food.add') }}
        </Button>
      </form>
    </MobileDialogContent>
  </Dialog>
</template>
