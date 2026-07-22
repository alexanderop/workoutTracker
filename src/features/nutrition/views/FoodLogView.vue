<script setup lang="ts">
import { ChevronLeft, ChevronRight, Plus } from '@lucide/vue'
import { format } from 'date-fns'
import { computed, defineAsyncComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { getNutritionRepository } from '@/db'
import type { DbNutritionDiaryEntry, MealKind } from '@/db/schema'
import { getCurrentLocale, getDateLocale } from '@/lib/dateLocale'
import { tryCatch } from '@/lib/tryCatch'
import { useToastStore } from '@/stores/toast'
import FoodLogTimeline from '../components/FoodLogTimeline.vue'
import FoodLogWeekStrip from '../components/FoodLogWeekStrip.vue'
import { useFoodLogDay } from '../composables/useFoodLogDay'
import { mealForHour } from '../lib/foodLogTimeline'

// Loaded on first use so the barcode-scanning/camera machinery (and the food
// lookup network code) stays off the startup path — the app has a Lighthouse
// performance budget on first paint.
const FoodLogDialog = defineAsyncComponent(() => import('../components/FoodLogDialog.vue'))

const { t } = useI18n()
const { showToast } = useToastStore()
const dateLocale = computed(() => getDateLocale(getCurrentLocale()))

const {
  selectedDateKey,
  selectedDate,
  isToday,
  weekDays,
  foods,
  diaryEntries,
  totals,
  selectDate,
  goToPreviousDay,
  goToNextDay,
  goToToday,
} = useFoodLogDay()

const dayTitle = computed(() =>
  isToday.value
    ? t('nutrition.foodLog.today')
    : format(selectedDate.value, 'EEE, d MMM', { locale: dateLocale.value }),
)

const foodLogOpen = ref(false)
// Stays true after the first request so the dialog (and its exit animation)
// survives closing; it just never mounts before it's needed.
const foodLogRequested = ref(false)
const selectedMeal = ref<MealKind>('breakfast')

function openFoodLog(meal: MealKind) {
  selectedMeal.value = meal
  foodLogRequested.value = true
  foodLogOpen.value = true
}

function openFoodLogForNow() {
  openFoodLog(mealForHour(new Date().getHours()))
}

async function removeEntry(entry: DbNutritionDiaryEntry) {
  const [error] = await tryCatch(getNutritionRepository().deleteDiaryEntry(entry.id))
  // Success is visible in the timeline itself; only failures need a toast.
  if (error) showToast(t('nutrition.errors.deleteFailed'))
}

function rounded(value: number): number {
  return Math.round(value)
}
</script>

<template>
  <div class="flex h-full flex-col">
    <header
      class="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="container mx-auto max-w-lg space-y-3 px-4 pb-3 pt-2">
        <div class="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            :aria-label="t('nutrition.foodLog.previousDay')"
            @click="goToPreviousDay"
          >
            <ChevronLeft class="size-5" aria-hidden="true" />
          </Button>
          <button
            type="button"
            class="rounded-lg px-3 py-2 text-lg font-semibold transition-colors hover:bg-muted"
            :aria-label="t('nutrition.foodLog.goToToday')"
            @click="goToToday"
          >
            {{ dayTitle }}
          </button>
          <Button
            variant="ghost"
            size="icon"
            :aria-label="t('nutrition.foodLog.nextDay')"
            @click="goToNextDay"
          >
            <ChevronRight class="size-5" aria-hidden="true" />
          </Button>
        </div>

        <FoodLogWeekStrip :days="weekDays" @select="selectDate" />

        <div
          class="grid grid-cols-4 divide-x rounded-xl bg-muted/60 py-2 text-center"
          data-testid="food-log-totals"
        >
          <div class="min-w-0 px-1">
            <p class="text-sm font-bold tabular-nums sm:text-base">
              {{ rounded(totals.calories).toLocaleString() }}
            </p>
            <p class="truncate text-[11px] text-muted-foreground">
              {{ t('nutrition.caloriesUnit') }}
            </p>
          </div>
          <div class="min-w-0 px-1">
            <p class="text-sm font-bold tabular-nums sm:text-base">
              {{ rounded(totals.proteinGrams) }}{{ t('nutrition.gramsUnit') }}
            </p>
            <p class="truncate text-[11px] text-muted-foreground">
              {{ t('nutrition.foodLog.totals.protein') }}
            </p>
          </div>
          <div class="min-w-0 px-1">
            <p class="text-sm font-bold tabular-nums sm:text-base">
              {{ rounded(totals.fatGrams) }}{{ t('nutrition.gramsUnit') }}
            </p>
            <p class="truncate text-[11px] text-muted-foreground">
              {{ t('nutrition.foodLog.totals.fat') }}
            </p>
          </div>
          <div class="min-w-0 px-1">
            <p class="text-sm font-bold tabular-nums sm:text-base">
              {{ rounded(totals.carbohydrateGrams) }}{{ t('nutrition.gramsUnit') }}
            </p>
            <p class="truncate text-[11px] text-muted-foreground">
              {{ t('nutrition.foodLog.totals.carbs') }}
            </p>
          </div>
        </div>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto">
      <div class="container mx-auto max-w-lg px-2 py-3">
        <p
          v-if="diaryEntries.length === 0"
          class="px-2 pb-2 text-center text-sm text-muted-foreground"
        >
          {{ t('nutrition.foodLog.emptyDay') }}
        </p>
        <FoodLogTimeline :entries="diaryEntries" @add="openFoodLog" @remove="removeEntry" />
      </div>
    </div>

    <footer class="sticky bottom-0 border-t bg-background">
      <div class="container mx-auto max-w-lg p-3">
        <Button class="w-full" @click="openFoodLogForNow">
          <Plus class="mr-1 size-4" aria-hidden="true" />
          {{ t('nutrition.addFood') }}
        </Button>
      </div>
    </footer>

    <FoodLogDialog
      v-if="foodLogRequested"
      v-model:open="foodLogOpen"
      :foods="foods"
      :local-date="selectedDateKey"
      :initial-meal="selectedMeal"
    />
  </div>
</template>
