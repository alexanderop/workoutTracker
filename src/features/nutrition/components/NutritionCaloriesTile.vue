<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import StatTrendCard from '@/components/dashboard/StatTrendCard.vue'
import { RouteNames } from '@/router'
import { useNutritionTrend } from '../composables/useNutritionTrend'

const { t } = useI18n()
const router = useRouter()
const { caloriesTrend } = useNutritionTrend(7)

// A single logged day is a dot, not a trend — same gate the old dashboard
// card's sparkline used.
const trend = computed(() =>
  caloriesTrend.value.filter((calories) => calories > 0).length > 1 ? caloriesTrend.value : [],
)
const todayCalories = computed(() => Math.round(caloriesTrend.value.at(-1) ?? 0).toLocaleString())
</script>

<template>
  <StatTrendCard
    :title="t('nutrition.fields.calories')"
    :subtitle="t('common.dashboard.last7Days')"
    :value="todayCalories"
    :unit="t('nutrition.caloriesUnit')"
    :chart="{ data: trend, color: 'var(--highlight)', label: t('nutrition.trend.chartLabel') }"
    @click="router.push({ name: RouteNames.FoodLog })"
  />
</template>
