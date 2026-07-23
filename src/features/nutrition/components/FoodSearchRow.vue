<script setup lang="ts">
import { Plus, Star } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DbFood } from '@/db/schema'
import { scaleNutrients } from '../lib/nutritionCalculations'

const { food, grams } = defineProps<{
  food: DbFood
  /** Serving the one-tap quick add would log. */
  grams: number
}>()

const emit = defineEmits<{
  select: [food: DbFood]
  'quick-add': [food: DbFood]
  'toggle-favorite': [food: DbFood]
}>()

const { t } = useI18n()

const macroLine = computed(() => {
  const serving = scaleNutrients(food.nutrientsPer100Grams, grams)
  const round = Math.round
  return [
    `${round(serving.calories)} ${t('nutrition.caloriesUnit')}`,
    `${round(serving.proteinGrams)}${t('nutrition.foodLog.proteinShort')}`,
    `${round(serving.fatGrams)}${t('nutrition.foodLog.fatShort')}`,
    `${round(serving.carbohydrateGrams)}${t('nutrition.foodLog.carbsShort')}`,
  ].join(' · ')
})

const servingLabel = computed(() =>
  food.defaultServingName !== null && food.defaultServingGrams === grams
    ? `1 ${food.defaultServingName} (${grams} ${t('nutrition.gramsUnit')})`
    : `${grams} ${t('nutrition.gramsUnit')}`,
)
</script>

<template>
  <li class="flex items-center gap-1 rounded-xl transition-colors hover:bg-muted/60">
    <button
      type="button"
      class="min-w-0 flex-1 rounded-xl px-2 py-2 text-left"
      @click="emit('select', food)"
    >
      <p class="truncate font-medium">
        {{ food.name }}
        <span v-if="food.brand" class="text-muted-foreground">· {{ food.brand }}</span>
      </p>
      <p class="truncate text-xs tabular-nums text-muted-foreground">
        {{ macroLine }} · {{ servingLabel }}
      </p>
    </button>
    <button
      type="button"
      class="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      :aria-label="t('nutrition.food.favorite', { name: food.name })"
      :aria-pressed="food.favorite"
      @click="emit('toggle-favorite', food)"
    >
      <Star
        class="size-4"
        :class="food.favorite ? 'fill-primary text-primary' : ''"
        aria-hidden="true"
      />
    </button>
    <button
      type="button"
      class="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      :aria-label="t('nutrition.food.quickAdd', { name: food.name })"
      @click="emit('quick-add', food)"
    >
      <Plus class="size-4" aria-hidden="true" />
    </button>
  </li>
</template>
