<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { nutrientsPer100Grams } from '../lib/nutritionCalculations'
import FoodMacroFields from './FoodMacroFields.vue'

export type CustomFood = {
  name: string
  brand: string | null
  /** Per 100 g, converted from the serving figures the user typed. */
  nutrientsPer100Grams: {
    calories: number
    proteinGrams: number
    carbohydrateGrams: number
    fatGrams: number
  }
  grams: number
}

const emit = defineEmits<{ stage: [food: CustomFood] }>()
const { t } = useI18n()

const name = ref('')
const brand = ref('')
const grams = ref<number | string>('100')
const calories = ref<number | string>('')
const protein = ref<number | string>('')
const carbs = ref<number | string>('')
const fat = ref<number | string>('')

const isValid = computed(
  () => name.value.trim().length > 0 && Number(grams.value) > 0 && Number(calories.value) >= 0,
)

function stage(): void {
  if (!isValid.value) return
  const servingGrams = Number(grams.value)
  const trimmedBrand = brand.value.trim()
  emit('stage', {
    name: name.value.trim(),
    brand: trimmedBrand.length > 0 ? trimmedBrand : null,
    nutrientsPer100Grams: nutrientsPer100Grams(
      {
        calories: Number(calories.value) || 0,
        proteinGrams: Number(protein.value) || 0,
        carbohydrateGrams: Number(carbs.value) || 0,
        fatGrams: Number(fat.value) || 0,
      },
      servingGrams,
    ),
    grams: servingGrams,
  })
  name.value = ''
  brand.value = ''
  grams.value = '100'
  calories.value = ''
  protein.value = ''
  carbs.value = ''
  fat.value = ''
}
</script>

<template>
  <form class="space-y-3 p-4" @submit.prevent="stage">
    <p class="text-sm text-muted-foreground">{{ t('nutrition.sheet.customHint') }}</p>
    <div class="space-y-1.5">
      <Label for="food-custom-name">{{ t('nutrition.food.name') }}</Label>
      <Input
        id="food-custom-name"
        v-model="name"
        autocomplete="off"
        :placeholder="t('nutrition.food.namePlaceholder')"
      />
    </div>
    <div class="space-y-1.5">
      <Label for="food-custom-brand">{{ t('nutrition.food.brand') }}</Label>
      <Input
        id="food-custom-brand"
        v-model="brand"
        autocomplete="off"
        :placeholder="t('nutrition.food.brandPlaceholder')"
      />
    </div>
    <div class="space-y-1.5">
      <Label for="food-custom-grams">{{ t('nutrition.food.servingGrams') }}</Label>
      <Input id="food-custom-grams" v-model="grams" type="number" min="1" inputmode="decimal" />
    </div>
    <p class="text-sm font-medium">{{ t('nutrition.food.nutrientsForServing') }}</p>
    <FoodMacroFields
      id-prefix="food-custom"
      v-model:calories="calories"
      v-model:protein="protein"
      v-model:carbs="carbs"
      v-model:fat="fat"
    />
    <Button type="submit" class="w-full" :disabled="!isValid">
      {{ t('nutrition.sheet.customAdd') }}
    </Button>
  </form>
</template>
