<script setup lang="ts">
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
import { nutrientsPer100Grams } from '../lib/nutritionCalculations'

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
const saving = ref(false)
const saveFailed = ref(false)

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
  saveFailed.value = false
})

watch(selectedFood, (food) => {
  if (!food) return
  grams.value = food.defaultServingGrams ?? 100
})

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
      brand: null,
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
    <MobileDialogContent class="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ t('nutrition.food.title') }}</DialogTitle>
        <DialogDescription>{{ t('nutrition.food.description') }}</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="save">
        <div v-if="foods.length > 0" class="space-y-1.5">
          <Label for="nutrition-existing-food">{{ t('nutrition.food.choose') }}</Label>
          <NativeSelect id="nutrition-existing-food" v-model="selectedFoodId" class="w-full">
            <option value="">{{ t('nutrition.food.createNew') }}</option>
            <option v-for="food in foods" :key="food.id" :value="food.id">{{ food.name }}</option>
          </NativeSelect>
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

        <p v-if="saveFailed" role="alert" class="text-sm text-destructive">
          {{ t('nutrition.errors.saveFailed') }}
        </p>
        <Button type="submit" class="w-full" :disabled="!isValid || saving">
          {{ saving ? t('common.states.saving') : t('nutrition.food.add') }}
        </Button>
      </form>
    </MobileDialogContent>
  </Dialog>
</template>
