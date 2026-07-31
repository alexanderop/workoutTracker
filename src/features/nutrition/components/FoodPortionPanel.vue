<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { DbNutritionTargets } from '@/db/schema'
import type { ExternalFood } from '../lib/foodData'
import { portionGrams, type PortionUnit, targetImpactPercents } from '../lib/foodPortion'
import { scaleNutrients } from '../lib/nutritionCalculations'

/**
 * Confirms how much of a resolved food goes into the basket. A scan (or a
 * tapped search hit) names the product; only the user knows the amount on the
 * plate — this panel is where they say it, with the macro cost and the share
 * of the daily targets recomputed live as they type.
 */
const { food, goal } = defineProps<{ food: ExternalFood; goal: DbNutritionTargets }>()
const emit = defineEmits<{ add: [grams: number]; back: [] }>()

const { t } = useI18n()

const hasServing = food.servingGrams !== null && food.servingGrams > 0
const unit = ref<PortionUnit>(hasServing ? 'serving' : 'grams')
const amount = ref<number | string>(hasServing ? '1' : '100')

const grams = computed(() => portionGrams(Number(amount.value), unit.value, food.servingGrams))

/** Switching units converts the amount, so "1 serving" becomes "15 g", not "1 g". */
function switchUnit(next: PortionUnit): void {
  if (next === unit.value) return
  const current = grams.value
  if (current !== null) {
    const converted = next === 'grams' ? current : current / (food.servingGrams ?? 1)
    amount.value = Math.round(converted * 100) / 100
  }
  unit.value = next
}

/** Whole kcal; grams to one decimal — the label precision of a food package. */
function formatValue(key: keyof DbNutritionTargets, value: number): string {
  return String(key === 'calories' ? Math.round(value) : Math.round(value * 10) / 10)
}

const macros = computed(() => {
  const portion = scaleNutrients(food.nutrientsPer100Grams, grams.value ?? 0)
  const impact = targetImpactPercents(food.nutrientsPer100Grams, grams.value ?? 0, goal)
  return (
    [
      { key: 'calories', label: t('nutrition.fields.calories'), color: 'var(--chart-1)' },
      {
        key: 'proteinGrams',
        label: t('nutrition.foodLog.totals.protein'),
        color: 'var(--chart-2)',
      },
      { key: 'fatGrams', label: t('nutrition.foodLog.totals.fat'), color: 'var(--chart-4)' },
      {
        key: 'carbohydrateGrams',
        label: t('nutrition.foodLog.totals.carbs'),
        color: 'var(--chart-5)',
      },
    ] as const
  ).map((macro) => ({
    ...macro,
    value: formatValue(macro.key, portion[macro.key]),
    percent: impact[macro.key],
  }))
})

function add(): void {
  if (grams.value === null) return
  emit('add', grams.value)
}
</script>

<template>
  <div class="space-y-4 p-4" data-testid="food-portion-panel">
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
        :aria-label="t('common.aria.goBack')"
        @click="emit('back')"
      >
        <ChevronLeft class="size-4" aria-hidden="true" />
      </button>
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold">{{ food.name }}</p>
        <p v-if="food.brand" class="truncate text-xs text-muted-foreground">{{ food.brand }}</p>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-2 text-center">
      <div v-for="macro in macros" :key="macro.key">
        <p class="text-lg font-bold tabular-nums">{{ macro.value }}</p>
        <p class="text-xs text-muted-foreground">{{ macro.label }}</p>
      </div>
    </div>

    <section>
      <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {{ t('nutrition.sheet.portion.impact') }}
      </p>
      <div class="mt-2 grid grid-cols-4 gap-2">
        <div v-for="macro in macros" :key="macro.key" class="flex flex-col items-center gap-1">
          <div
            class="flex size-14 items-center justify-center rounded-full"
            :style="{
              background: `conic-gradient(${macro.color} ${Math.min(macro.percent, 100) * 3.6}deg, color-mix(in oklch, ${macro.color} 15%, transparent) 0deg)`,
            }"
          >
            <div class="flex size-11 items-center justify-center rounded-full bg-background">
              <span class="text-xs font-semibold tabular-nums">{{ macro.percent }}%</span>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">{{ macro.label }}</p>
        </div>
      </div>
    </section>

    <form class="space-y-3" @submit.prevent="add">
      <div class="space-y-1.5">
        <Label for="food-portion-amount">{{ t('nutrition.sheet.portion.amount') }}</Label>
        <div class="flex items-center gap-2">
          <Input
            id="food-portion-amount"
            v-model="amount"
            class="flex-1"
            type="number"
            min="0"
            step="any"
            inputmode="decimal"
            autocomplete="off"
          />
          <div class="flex gap-1" role="group" :aria-label="t('nutrition.sheet.portion.unit')">
            <button
              type="button"
              class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
              :class="
                unit === 'grams'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input text-muted-foreground'
              "
              :aria-pressed="unit === 'grams'"
              @click="switchUnit('grams')"
            >
              {{ t('nutrition.gramsUnit') }}
            </button>
            <button
              v-if="hasServing"
              type="button"
              class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
              :class="
                unit === 'serving'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input text-muted-foreground'
              "
              :aria-pressed="unit === 'serving'"
              @click="switchUnit('serving')"
            >
              {{ t('nutrition.food.serving') }}
            </button>
          </div>
        </div>
        <p v-if="unit === 'serving' && grams !== null" class="text-xs text-muted-foreground">
          {{ t('nutrition.sheet.portion.resolvedGrams', { grams: Math.round(grams * 10) / 10 }) }}
        </p>
      </div>
      <Button type="submit" class="w-full" :disabled="grams === null">
        {{ t('common.buttons.add') }}
      </Button>
    </form>
  </div>
</template>
