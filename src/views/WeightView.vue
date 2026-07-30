<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWeightEntries } from '@/features/weight/composables/useWeightEntries'
import { useWeightStats } from '@/features/weight/composables/useWeightStats'
import { Button } from '@/components/ui/button'
import WeightStatsSummary from '@/features/weight/components/WeightStatsSummary.vue'
import WeightChart from '@/features/weight/components/WeightChart.vue'
import WeightHistoryList from '@/features/weight/components/WeightHistoryList.vue'

// Loaded on first use so the sheet's live query stays off the startup path --
// the app has a Lighthouse performance budget on first paint.
const WeightLogSheet = defineAsyncComponent(
  () => import('@/features/weight/components/WeightLogSheet.vue'),
)

const { t } = useI18n()

const { entries, chartData, selectedRange, hasEntries, deleteEntry, setTimeRange } =
  useWeightEntries()

const { stats } = useWeightStats(() => entries.value)

const sheetOpen = ref(false)
// Stays true after the first request so the sheet (and its exit animation)
// survives closing; it just never mounts before it's needed.
const sheetRequested = ref(false)

function handleLogWeight() {
  sheetRequested.value = true
  sheetOpen.value = true
}

async function handleDelete(id: string) {
  await deleteEntry(id)
}
</script>

<template>
  <div class="container mx-auto max-w-lg space-y-section p-4">
    <h1 class="text-page-title font-bold">{{ t('weight.title') }}</h1>

    <Button class="w-full" @click="handleLogWeight">{{ t('weight.sheet.logWeight') }}</Button>

    <template v-if="hasEntries">
      <WeightStatsSummary :stats="stats" />

      <WeightChart
        :data="chartData"
        :selected-range="selectedRange"
        @update:selected-range="setTimeRange"
      />

      <WeightHistoryList :entries="entries" @delete="handleDelete" />
    </template>

    <div v-else role="status" aria-live="polite" class="py-8 text-center text-muted-foreground">
      <p>{{ t('weight.emptyState') }}</p>
    </div>

    <WeightLogSheet v-if="sheetRequested" v-model:open="sheetOpen" />
  </div>
</template>
