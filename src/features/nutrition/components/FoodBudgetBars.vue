<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DbFoodNutrients, DbNutritionTargets } from '@/db/schema'
import { budgetSegments } from '../lib/nutritionCalculations'

const { committed, staged, goal } = defineProps<{
  committed: DbFoodNutrients
  staged: DbFoodNutrients
  goal: DbNutritionTargets
}>()

const { t } = useI18n()

/**
 * One bar per macro, drawn as committed (solid) then staged (translucent) so
 * "what this basket costs me" is readable before committing it.
 */
const bars = computed(() =>
  (
    [
      { key: 'calories', label: t('nutrition.caloriesUnit'), color: 'bg-chart-1' },
      { key: 'proteinGrams', label: t('nutrition.foodLog.proteinShort'), color: 'bg-chart-2' },
      { key: 'fatGrams', label: t('nutrition.foodLog.fatShort'), color: 'bg-chart-4' },
      { key: 'carbohydrateGrams', label: t('nutrition.foodLog.carbsShort'), color: 'bg-chart-5' },
    ] as const
  ).map((bar) => {
    const target = goal[bar.key]
    return {
      ...bar,
      target,
      total: Math.round(committed[bar.key] + staged[bar.key]),
      segments: budgetSegments(committed[bar.key], staged[bar.key], target),
    }
  }),
)
</script>

<template>
  <div class="grid grid-cols-4 gap-2" data-testid="food-budget-bars">
    <div v-for="bar in bars" :key="bar.key">
      <p class="flex items-baseline gap-1 text-[11px] tabular-nums text-muted-foreground">
        <span class="font-semibold text-foreground">{{ bar.label }}</span>
        <span :class="bar.segments.overflow ? 'font-semibold text-destructive' : ''">
          {{ bar.total }}/{{ bar.target }}
        </span>
      </p>
      <div class="relative mt-1 flex h-1.5 overflow-hidden rounded-full bg-muted">
        <div :class="bar.color" :style="{ width: `${bar.segments.committedPct}%` }" />
        <div :class="[bar.color, 'opacity-50']" :style="{ width: `${bar.segments.stagedPct}%` }" />
        <!--
          Only drawn when over target. Under target the tick sits at 100% —
          the end of the bar — where it would be redundant. Over target the
          bar has rescaled, so the tick is the only thing saying where the
          goal was.
        -->
        <span
          v-if="bar.segments.overflow"
          class="absolute inset-y-0 w-0.5 bg-foreground"
          :style="{ left: `${bar.segments.tickPct}%` }"
          :aria-label="t('nutrition.sheet.over')"
        />
      </div>
    </div>
  </div>
</template>
