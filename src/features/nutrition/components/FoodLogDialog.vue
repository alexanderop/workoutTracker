<script setup lang="ts">
import { ScanBarcode } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { generateId, getNutritionRepository } from '@/db'
import type { DbFood, DbFoodNutrients, DbNutritionDiaryEntry, MealKind } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'
import { useFoodLookup } from '../composables/useFoodLookup'
import { nutrientsPer100Grams, scaleNutrients } from '../lib/nutritionCalculations'
import FoodBarcodeScanner from './FoodBarcodeScanner.vue'

const { foods, localDate, initialMeal } = defineProps<{
  foods: ReadonlyArray<DbFood>
  localDate: string
  initialMeal: MealKind
}>()
const open = defineModel<boolean>('open', { required: true })
const { t } = useI18n()

const selectedFoodId = ref('')
const name = ref('')
const meal = ref<MealKind>(initialMeal)
const grams = ref<number | string>(100)
const calories = ref<number | string>('')
const protein = ref<number | string>('')
const carbohydrates = ref<number | string>('')
const fat = ref<number | string>('')
const brand = ref<string | null>(null)
const saving = ref(false)
const saveFailed = ref(false)

type ScanState = 'idle' | 'scanning' | 'looking-up' | 'not-found' | 'failed'
const scanSupported =
  'BarcodeDetector' in globalThis && globalThis.navigator.mediaDevices !== undefined
const scanState = ref<ScanState>('idle')
const { lookup } = useFoodLookup()

const selectedFood = computed(() => foods.find((food) => food.id === selectedFoodId.value))
const isNewFood = computed(() => selectedFood.value === undefined)
const isValid = computed(() => {
  if (Number(grams.value) <= 0) return false
  if (selectedFood.value) return true
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
  selectedFoodId.value = ''
  name.value = ''
  meal.value = initialMeal
  grams.value = 100
  calories.value = ''
  protein.value = ''
  carbohydrates.value = ''
  fat.value = ''
  brand.value = null
  saveFailed.value = false
  scanState.value = 'idle'
})

watch(selectedFood, (food) => {
  if (!food) return
  grams.value = food.defaultServingGrams ?? 100
})

function roundNutrient(value: number): number {
  return Math.round(value * 10) / 10
}

async function handleBarcodeDetected(barcode: string) {
  scanState.value = 'looking-up'
  const result = await lookup(barcode)
  if (result.status !== 'found') {
    scanState.value = result.status === 'not-found' ? 'not-found' : 'failed'
    return
  }
  const { food } = result
  name.value = food.name
  brand.value = food.brand
  const servingGrams = food.servingGrams ?? 100
  grams.value = servingGrams
  const serving = scaleNutrients(food.nutrientsPer100Grams, servingGrams)
  calories.value = Math.round(serving.calories)
  protein.value = roundNutrient(serving.proteinGrams)
  carbohydrates.value = roundNutrient(serving.carbohydrateGrams)
  fat.value = roundNutrient(serving.fatGrams)
  scanState.value = 'idle'
}

async function save() {
  if (!isValid.value || saving.value) return
  saving.value = true
  saveFailed.value = false
  const repository = getNutritionRepository()
  const now = Date.now()
  const servingGrams = Number(grams.value)

  function logExistingFood(food: DbFood): Promise<void> {
    const entry: DbNutritionDiaryEntry = {
      id: generateId(),
      localDate,
      meal: meal.value,
      foodId: food.id,
      grams: servingGrams,
      foodSnapshot: {
        name: food.name,
        brand: food.brand,
        nutrientsPer100Grams: food.nutrientsPer100Grams,
      },
      loggedAt: now,
      updatedAt: now,
    }
    return repository.addDiaryEntry(entry)
  }

  function logNewFood(): Promise<void> {
    const servingNutrients: DbFoodNutrients = {
      calories: Number(calories.value),
      proteinGrams: Number(protein.value),
      carbohydrateGrams: Number(carbohydrates.value),
      fatGrams: Number(fat.value),
    }
    const food: DbFood = {
      id: generateId(),
      name: name.value.trim(),
      brand: brand.value,
      nutrientsPer100Grams: nutrientsPer100Grams(servingNutrients, servingGrams),
      defaultServingName: t('nutrition.food.serving'),
      defaultServingGrams: servingGrams,
      favorite: false,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
    }
    const entry: DbNutritionDiaryEntry = {
      id: generateId(),
      localDate,
      meal: meal.value,
      foodId: food.id,
      grams: servingGrams,
      foodSnapshot: {
        name: food.name,
        brand: food.brand,
        nutrientsPer100Grams: food.nutrientsPer100Grams,
      },
      loggedAt: now,
      updatedAt: now,
    }
    return repository.addFoodAndDiaryEntry(food, entry)
  }

  const promise = selectedFood.value ? logExistingFood(selectedFood.value) : logNewFood()

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
    <MobileDialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('nutrition.food.title') }}</DialogTitle>
        <DialogDescription>{{ t('nutrition.food.description') }}</DialogDescription>
      </DialogHeader>
      <form class="flex min-h-0 flex-col gap-4" @submit.prevent="save">
        <div
          v-if="scanState === 'scanning'"
          class="min-h-0 overflow-y-auto overscroll-contain scroll-py-2"
        >
          <FoodBarcodeScanner @detected="handleBarcodeDetected" @cancel="scanState = 'idle'" />
        </div>
        <div v-else class="min-h-0 space-y-4 overflow-y-auto overscroll-contain scroll-py-2">
          <div v-if="foods.length > 0" class="space-y-1.5">
            <Label for="nutrition-existing-food">{{ t('nutrition.food.choose') }}</Label>
            <NativeSelect id="nutrition-existing-food" v-model="selectedFoodId" class="w-full">
              <option value="">{{ t('nutrition.food.createNew') }}</option>
              <option v-for="food in foods" :key="food.id" :value="food.id">{{ food.name }}</option>
            </NativeSelect>
          </div>

          <div v-if="isNewFood && scanSupported" class="space-y-1.5">
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

          <div v-if="isNewFood" class="space-y-1.5">
            <Label for="nutrition-food-name">{{ t('nutrition.food.name') }}</Label>
            <Input
              id="nutrition-food-name"
              v-model="name"
              :placeholder="t('nutrition.food.namePlaceholder')"
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

          <div v-if="isNewFood">
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
