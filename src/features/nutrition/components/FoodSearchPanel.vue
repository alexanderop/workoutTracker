<script setup lang="ts">
import { Plus, Search } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { DbFood } from '@/db/schema'
import { searchFoods } from '../lib/foodSearch'
import { scaleNutrients } from '../lib/nutritionCalculations'

const { foods } = defineProps<{ foods: ReadonlyArray<DbFood> }>()
const emit = defineEmits<{ stage: [food: DbFood] }>()
const query = defineModel<string>('query', { required: true })

const { t } = useI18n()

const results = computed(() => searchFoods(foods, query.value))

function servingGrams(food: DbFood): number {
  return food.defaultServingGrams ?? 100
}

/** "240 kcal · P 44 F 1 C 14" — one line, scannable at arm's length. */
function macroLine(food: DbFood): string {
  const serving = scaleNutrients(food.nutrientsPer100Grams, servingGrams(food))
  const grams = t('nutrition.gramsUnit')
  return [
    `${Math.round(serving.calories)} ${t('nutrition.caloriesUnit')}`,
    `${t('nutrition.foodLog.proteinShort')} ${Math.round(serving.proteinGrams)}${grams}`,
    `${t('nutrition.foodLog.fatShort')} ${Math.round(serving.fatGrams)}${grams}`,
    `${t('nutrition.foodLog.carbsShort')} ${Math.round(serving.carbohydrateGrams)}${grams}`,
  ].join(' · ')
}

function servingLine(food: DbFood): string {
  const serving = t('nutrition.sheet.perServing', {
    grams: servingGrams(food),
    serving: food.defaultServingName ?? t('nutrition.food.serving'),
  })
  return food.brand === null ? serving : `${serving} · ${food.brand}`
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <p class="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {{ query.length > 0 ? t('nutrition.sheet.matches') : t('nutrition.sheet.recents') }}
    </p>

    <ul
      v-if="results.length > 0"
      class="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      data-testid="food-search-results"
    >
      <li
        v-for="food in results"
        :key="food.id"
        class="flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0"
      >
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ food.name }}</p>
          <p class="truncate text-xs tabular-nums text-muted-foreground">{{ macroLine(food) }}</p>
          <p class="truncate text-xs text-muted-foreground">{{ servingLine(food) }}</p>
        </div>
        <button
          type="button"
          class="flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-primary hover:text-primary-foreground"
          :aria-label="t('nutrition.sheet.stage', { name: food.name })"
          @click="emit('stage', food)"
        >
          <Plus class="size-4" aria-hidden="true" />
        </button>
      </li>
    </ul>
    <p v-else class="flex-1 px-4 py-6 text-center text-sm text-muted-foreground">
      {{ foods.length === 0 ? t('nutrition.sheet.emptyLibrary') : t('nutrition.sheet.noMatches') }}
    </p>

    <!--
      Pinned low rather than at the top of the panel: on a phone this is the
      only field in the sheet, and it belongs in thumb reach.
    -->
    <div class="shrink-0 border-t p-3">
      <Label for="food-sheet-search" class="sr-only">{{ t('nutrition.sheet.search') }}</Label>
      <div class="relative">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="food-sheet-search"
          v-model="query"
          class="pl-9"
          type="search"
          autocomplete="off"
          :placeholder="t('nutrition.sheet.searchPlaceholder')"
        />
      </div>
    </div>
  </div>
</template>
