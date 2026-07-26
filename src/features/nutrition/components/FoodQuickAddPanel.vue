<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import type { DbFoodNutrients } from '@/db/schema'
import FoodMacroFields from './FoodMacroFields.vue'

const emit = defineEmits<{ stage: [nutrients: DbFoodNutrients] }>()
const { t } = useI18n()

const calories = ref<number | string>('')
const protein = ref<number | string>('')
const carbs = ref<number | string>('')
const fat = ref<number | string>('')

const isValid = computed(() => Number(calories.value) > 0)

function stage(): void {
  if (!isValid.value) return
  emit('stage', {
    calories: Number(calories.value),
    proteinGrams: Number(protein.value) || 0,
    carbohydrateGrams: Number(carbs.value) || 0,
    fatGrams: Number(fat.value) || 0,
  })
  calories.value = ''
  protein.value = ''
  carbs.value = ''
  fat.value = ''
}
</script>

<template>
  <form class="space-y-3 p-4" @submit.prevent="stage">
    <p class="text-sm text-muted-foreground">{{ t('nutrition.sheet.quickHint') }}</p>
    <FoodMacroFields
      id-prefix="food-quick"
      v-model:calories="calories"
      v-model:protein="protein"
      v-model:carbs="carbs"
      v-model:fat="fat"
    />
    <Button type="submit" class="w-full" :disabled="!isValid">
      {{ t('nutrition.sheet.quickAdd') }}
    </Button>
  </form>
</template>
