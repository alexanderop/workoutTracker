<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { DbFoodNutrients, DbNutritionTargets } from '@/db/schema'
import { portionGrams, type PortionUnit, targetImpactPercents } from '../lib/foodPortion'
import { MACRO_DISPLAY, scaleNutrients } from '../lib/nutritionCalculations'

/**
 * What the panel needs to render and stage a food — deliberately its own
 * shape rather than `ExternalFood`, because the food here may just as well be
 * a library one; callers map to it at the call site.
 */
export type PortionFood = {
  name: string
  brand: string | null
  servingGrams: number | null
  nutrientsPer100Grams: DbFoodNutrients
}

const LABEL_KEYS = {
  calories: 'nutrition.fields.calories',
  proteinGrams: 'nutrition.foodLog.totals.protein',
  fatGrams: 'nutrition.foodLog.totals.fat',
  carbohydrateGrams: 'nutrition.foodLog.totals.carbs',
} as const satisfies Record<keyof DbNutritionTargets, string>

/**
 * Confirms how much of a resolved food goes into the basket. A scan (or a
 * tapped search hit) names the product; only the user knows the amount on the
 * plate — this panel is where they say it, with the macro cost and the share
 * of the daily targets recomputed live as they type.
 */
const { food, goal } = defineProps<{ food: PortionFood; goal: DbNutritionTargets }>()
const emit = defineEmits<{ add: [grams: number]; back: [] }>()

const { t, locale } = useI18n()

/**
 * Locale-aware decimals ("30,9" in de) without thousands grouping — a kcal
 * figure reads as one number at arm's length, not as "1,348".
 */
const numberFormat = computed(
  () => new Intl.NumberFormat(locale.value, { useGrouping: false, maximumFractionDigits: 1 }),
)

/** Narrowed once: a non-positive serving size counts as "no serving". */
const servingGrams = food.servingGrams !== null && food.servingGrams > 0 ? food.servingGrams : null
const hasServing = servingGrams !== null

const unit = ref<PortionUnit>(hasServing ? 'serving' : 'grams')
const amount = ref<number | string>(hasServing ? '1' : '100')

const grams = computed(() => portionGrams(Number(amount.value), unit.value, servingGrams))

/** Switching units converts the amount, so "1 serving" becomes "15 g", not "1 g". */
function switchUnit(next: PortionUnit): void {
  if (next === unit.value) return
  const current = grams.value
  unit.value = next
  if (current === null) return
  if (next === 'grams') {
    amount.value = Math.round(current * 100) / 100
    return
  }
  // Unreachable null: the serving toggle only renders when a serving exists.
  if (servingGrams === null) return
  amount.value = Math.round((current / servingGrams) * 100) / 100
}

/**
 * Plain buttons, not the shared `ToggleGroup`: reka-ui's roving-focus
 * machinery ends up in the entry's modulepreload graph, and the Lighthouse
 * performance budget on first paint is a single point deep.
 */
const units = computed(() => {
  const available: ReadonlyArray<PortionUnit> = hasServing ? ['grams', 'serving'] : ['grams']
  return available.map((value) => ({
    value,
    label: value === 'grams' ? t('nutrition.gramsUnit') : t('nutrition.food.serving'),
  }))
})

/** Whole kcal; grams to one decimal — the label precision of a food package. */
function formatValue(key: keyof DbNutritionTargets, value: number): string {
  return numberFormat.value.format(key === 'calories' ? Math.round(value) : value)
}

const macros = computed(() => {
  const portion = scaleNutrients(food.nutrientsPer100Grams, grams.value ?? 0)
  const impact = targetImpactPercents(portion, goal)
  return MACRO_DISPLAY.map(({ key, colorVar }) => ({
    key,
    color: colorVar,
    label: t(LABEL_KEYS[key]),
    value: formatValue(key, portion[key]),
    percent: impact[key],
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
              v-for="option in units"
              :key="option.value"
              type="button"
              class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
              :class="
                unit === option.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input text-muted-foreground'
              "
              :aria-pressed="unit === option.value"
              @click="switchUnit(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <p v-if="unit === 'serving' && grams !== null" class="text-xs text-muted-foreground">
          {{ t('nutrition.sheet.portion.resolvedGrams', { grams: numberFormat.format(grams) }) }}
        </p>
      </div>
      <Button type="submit" class="w-full" :disabled="grams === null">
        {{ t('common.buttons.add') }}
      </Button>
    </form>
  </div>
</template>
