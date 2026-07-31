<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { Apple, ChevronRight, Plus, Target, Trash2, Utensils } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getNutritionRepository } from '@/db'
import { RouteNames } from '@/router'
import type { DbNutritionDiaryEntry, MealKind } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'
import NutritionGoalsDialog from './NutritionGoalsDialog.vue'
import { useNutritionDay } from '../composables/useNutritionDay'
import { getLocalDateKey, scaleNutrients } from '../lib/nutritionCalculations'

// Loaded on first use so the barcode-scanning/camera machinery (and the food
// lookup network code) stays off the startup path — the app has a Lighthouse
// performance budget on first paint.
const FoodLogSheet = defineAsyncComponent(() => import('./FoodLogSheet.vue'))

const { t } = useI18n()
const router = useRouter()
const localDate = getLocalDateKey()
const {
  goal,
  foods,
  diaryEntries,
  totals,
  remainingCalories,
  caloriesOver,
  calorieProgress,
  calorieSegments,
} = useNutritionDay(localDate)

const goalsOpen = ref(false)
const foodLogOpen = ref(false)
// Stays true after the first request so the dialog (and its exit animation)
// survives closing; it just never mounts before it's needed.
const foodLogRequested = ref(false)
const selectedMeal = ref<MealKind>('breakfast')
const meals: ReadonlyArray<MealKind> = ['breakfast', 'lunch', 'dinner', 'snack']

const isOverGoal = computed(() => caloriesOver.value > 0)

const entriesByMeal = computed<Record<MealKind, ReadonlyArray<DbNutritionDiaryEntry>>>(() => ({
  breakfast: diaryEntries.value.filter((entry) => entry.meal === 'breakfast'),
  lunch: diaryEntries.value.filter((entry) => entry.meal === 'lunch'),
  dinner: diaryEntries.value.filter((entry) => entry.meal === 'dinner'),
  snack: diaryEntries.value.filter((entry) => entry.meal === 'snack'),
}))

function rounded(value: number): number {
  return Math.round(value)
}

function mealCalories(meal: MealKind): number {
  return rounded(
    entriesByMeal.value[meal].reduce(
      (sum, entry) =>
        sum + scaleNutrients(entry.foodSnapshot.nutrientsPer100Grams, entry.grams).calories,
      0,
    ),
  )
}

function mealSummary(meal: MealKind): string {
  const names = entriesByMeal.value[meal].map((entry) => entry.foodSnapshot.name)
  return names.length > 0 ? names.join(', ') : t('nutrition.emptyMeal')
}

function openFoodLog(meal: MealKind) {
  selectedMeal.value = meal
  foodLogRequested.value = true
  foodLogOpen.value = true
}

async function removeEntry(entry: DbNutritionDiaryEntry) {
  await tryCatch(getNutritionRepository().deleteDiaryEntry(entry.id))
}
</script>

<template>
  <section
    aria-labelledby="nutrition-heading"
    class="rounded-2xl border bg-card shadow-sm"
    data-testid="nutrition-dashboard"
  >
    <div class="p-4 sm:p-5">
      <div class="flex items-center justify-between gap-3">
        <button
          type="button"
          class="flex items-center gap-3 text-left"
          :aria-label="t('nutrition.foodLog.openPage')"
          @click="router.push({ name: RouteNames.FoodLog })"
        >
          <span class="flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <Apple class="size-5 text-primary" aria-hidden="true" />
          </span>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-primary">
              {{ t('nutrition.title') }}
            </p>
            <h2 id="nutrition-heading" class="flex items-center gap-1 text-lg font-semibold">
              {{ t('nutrition.dailyEnergy') }}
              <ChevronRight class="size-4 text-muted-foreground" aria-hidden="true" />
            </h2>
          </div>
        </button>
        <Button variant="ghost" size="sm" @click="goalsOpen = true">
          <Target class="mr-1 size-4" aria-hidden="true" />
          {{ t('nutrition.editGoals') }}
        </Button>
      </div>

      <div class="mt-5 grid grid-cols-[auto_1fr] items-center gap-4 sm:gap-5">
        <div
          class="relative flex size-24 items-center justify-center rounded-full bg-primary/10 sm:size-28"
        >
          <div
            class="absolute inset-2 rounded-full"
            :style="{
              background: `conic-gradient(${isOverGoal ? 'var(--destructive)' : 'var(--primary)'} ${calorieProgress * 3.6}deg, color-mix(in oklch, var(--primary) 18%, transparent) 0deg)`,
            }"
          />
          <div class="absolute inset-[15px] rounded-full bg-card" />
          <div class="relative text-center">
            <p
              class="text-xl font-bold sm:text-2xl"
              :class="isOverGoal ? 'text-destructive' : undefined"
            >
              {{ rounded(isOverGoal ? caloriesOver : remainingCalories) }}
            </p>
            <p class="text-[11px] text-muted-foreground">
              {{ isOverGoal ? t('nutrition.caloriesOver') : t('nutrition.caloriesLeft') }}
            </p>
          </div>
        </div>
        <div class="min-w-0">
          <p class="text-sm text-muted-foreground">{{ t('nutrition.consumed') }}</p>
          <p class="truncate text-2xl font-bold sm:text-3xl">
            {{ rounded(totals.calories).toLocaleString() }}
            <span class="text-sm font-medium text-muted-foreground"
              >/ {{ goal.calories.toLocaleString() }}</span
            >
          </p>
          <!--
            The bar itself still fills to 100 and stops. What says "how far
            over" is the marker: once past the goal the bar rescales to the
            day's total, so the tick lands where the goal was. Under the goal
            the tick would sit at the far end, where it says nothing, so it is
            not drawn.
          -->
          <div class="relative mt-3">
            <Progress :model-value="calorieProgress" />
            <span
              v-if="isOverGoal"
              class="absolute inset-y-0 w-0.5 rounded-full bg-foreground"
              :style="{ left: `${calorieSegments.tickPct}%` }"
              aria-hidden="true"
            />
          </div>
          <p v-if="goal.updatedAt === 0" class="mt-2 text-xs text-muted-foreground">
            {{ t('nutrition.noGoalHint') }}
          </p>
        </div>
      </div>

      <div class="mt-5 grid grid-cols-3 divide-x rounded-xl bg-muted/60 py-3 text-center">
        <div class="min-w-0 px-1">
          <p class="text-base font-bold sm:text-lg">
            {{ rounded(totals.proteinGrams) }}{{ t('nutrition.gramsUnit') }}
          </p>
          <p class="truncate text-[11px] text-muted-foreground sm:text-xs">
            {{ t('nutrition.macroLabels.protein', { target: goal.proteinGrams }) }}
          </p>
        </div>
        <div class="min-w-0 px-1">
          <p class="text-base font-bold sm:text-lg">
            {{ rounded(totals.carbohydrateGrams) }}{{ t('nutrition.gramsUnit') }}
          </p>
          <p class="truncate text-[11px] text-muted-foreground sm:text-xs">
            {{ t('nutrition.macroLabels.carbs', { target: goal.carbohydrateGrams }) }}
          </p>
        </div>
        <div class="min-w-0 px-1">
          <p class="text-base font-bold sm:text-lg">
            {{ rounded(totals.fatGrams) }}{{ t('nutrition.gramsUnit') }}
          </p>
          <p class="truncate text-[11px] text-muted-foreground sm:text-xs">
            {{ t('nutrition.macroLabels.fat', { target: goal.fatGrams }) }}
          </p>
        </div>
      </div>
    </div>

    <div class="border-t px-4 pb-2 pt-4">
      <div class="flex items-center justify-between gap-3 pb-2">
        <div>
          <h3 class="font-semibold">{{ t('nutrition.mealsTitle') }}</h3>
          <p class="text-xs text-muted-foreground">{{ t('nutrition.mealsDescription') }}</p>
        </div>
        <Button size="sm" variant="outline" @click="openFoodLog('snack')">
          <Plus class="mr-1 size-4" aria-hidden="true" />{{ t('nutrition.addFood') }}
        </Button>
      </div>
      <ul class="divide-y" role="list">
        <li v-for="meal in meals" :key="meal" class="py-1">
          <button
            type="button"
            class="flex w-full items-center gap-3 py-2 text-left"
            @click="openFoodLog(meal)"
          >
            <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Utensils class="size-4 text-primary" aria-hidden="true" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block font-medium">{{ t(`nutrition.meals.${meal}`) }}</span>
              <span class="block truncate text-xs text-muted-foreground">{{
                mealSummary(meal)
              }}</span>
            </span>
            <span class="text-sm font-semibold">
              {{ mealCalories(meal) || '+' }}
              <span v-if="mealCalories(meal)" class="text-xs font-normal text-muted-foreground">{{
                t('nutrition.caloriesUnit')
              }}</span>
            </span>
            <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
          <ul v-if="entriesByMeal[meal].length > 0" class="ml-12 space-y-1 pb-2">
            <li
              v-for="entry in entriesByMeal[meal]"
              :key="entry.id"
              class="flex items-center justify-between gap-2 text-xs text-muted-foreground"
            >
              <span
                >{{ entry.foodSnapshot.name }} · {{ entry.grams
                }}{{ t('nutrition.gramsUnit') }}</span
              >
              <button
                type="button"
                class="rounded p-1 hover:bg-muted hover:text-destructive"
                :aria-label="t('nutrition.deleteFood', { name: entry.foodSnapshot.name })"
                @click.stop="removeEntry(entry)"
              >
                <Trash2 class="size-3.5" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </li>
      </ul>
    </div>

    <NutritionGoalsDialog v-model:open="goalsOpen" :goal="goal" />
    <FoodLogSheet
      v-if="foodLogRequested"
      v-model:open="foodLogOpen"
      :foods="foods"
      :local-date="localDate"
      :initial-meal="selectedMeal"
      :goal="goal"
      :committed="totals"
      :day-label="t('nutrition.foodLog.today')"
    />
  </section>
</template>
