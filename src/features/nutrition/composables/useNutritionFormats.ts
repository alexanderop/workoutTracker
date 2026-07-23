import { format } from 'date-fns'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DbFoodNutrients } from '@/db/schema'
import { getCurrentLocale, getDateLocale } from '@/lib/dateLocale'

/**
 * Locale-aware display strings shared by the food log timeline and the food
 * search surface: time-of-day labels and the compact
 * "763 kcal · 26P 36F 74C" macro line.
 */
export function useNutritionFormats() {
  const { t } = useI18n()
  const dateLocale = computed(() => getDateLocale(getCurrentLocale()))

  function timeLabel(date: Date): string {
    return format(date, 'p', { locale: dateLocale.value })
  }

  function hourLabel(hour: number): string {
    return timeLabel(new Date(2000, 0, 1, hour))
  }

  function macroSummary(nutrients: DbFoodNutrients): string {
    const round = Math.round
    return [
      `${round(nutrients.calories)} ${t('nutrition.caloriesUnit')}`,
      `${round(nutrients.proteinGrams)}${t('nutrition.foodLog.proteinShort')}`,
      `${round(nutrients.fatGrams)}${t('nutrition.foodLog.fatShort')}`,
      `${round(nutrients.carbohydrateGrams)}${t('nutrition.foodLog.carbsShort')}`,
    ].join(' · ')
  }

  return { timeLabel, hourLabel, macroSummary }
}
