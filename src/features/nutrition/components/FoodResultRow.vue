<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DbFoodNutrients } from '@/db/schema'
import { scaleNutrients } from '../lib/nutritionCalculations'

/**
 * One tappable search result. Shared by the library list and the Open Food
 * Facts list so both read identically at arm's length — where the hit came
 * from changes what committing it writes, not how it looks.
 */
const { nutrients, grams, servingName, brand } = defineProps<{
  name: string
  brand: string | null
  /** Serving the macros below are shown for. */
  grams: number
  nutrients: DbFoodNutrients
  servingName: string
}>()
const emit = defineEmits<{ stage: [] }>()

const { t } = useI18n()

/** "240 kcal · P 44 F 1 C 14" — one line, scannable at arm's length. */
const macroLine = computed(() => {
  const serving = scaleNutrients(nutrients, grams)
  const gramsUnit = t('nutrition.gramsUnit')
  return [
    `${Math.round(serving.calories)} ${t('nutrition.caloriesUnit')}`,
    `${t('nutrition.foodLog.proteinShort')} ${Math.round(serving.proteinGrams)}${gramsUnit}`,
    `${t('nutrition.foodLog.fatShort')} ${Math.round(serving.fatGrams)}${gramsUnit}`,
    `${t('nutrition.foodLog.carbsShort')} ${Math.round(serving.carbohydrateGrams)}${gramsUnit}`,
  ].join(' · ')
})

const servingLine = computed(() => {
  const serving = t('nutrition.sheet.perServing', { grams, serving: servingName })
  return brand === null ? serving : `${serving} · ${brand}`
})
</script>

<template>
  <li class="flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0">
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium">{{ name }}</p>
      <p class="truncate text-xs tabular-nums text-muted-foreground">{{ macroLine }}</p>
      <p class="truncate text-xs text-muted-foreground">{{ servingLine }}</p>
    </div>
    <button
      type="button"
      class="flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-primary hover:text-primary-foreground"
      :aria-label="t('nutrition.sheet.stage', { name })"
      @click="emit('stage')"
    >
      <Plus class="size-4" aria-hidden="true" />
    </button>
  </li>
</template>
