<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWeightEntries } from '@/features/weight/composables/useWeightEntries'
import { useWeightStats } from '@/features/weight/composables/useWeightStats'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import WeightEntryForm from '@/features/weight/components/WeightEntryForm.vue'
import WeightStatsSummary from '@/features/weight/components/WeightStatsSummary.vue'
import WeightChart from '@/features/weight/components/WeightChart.vue'
import WeightHistoryList from '@/features/weight/components/WeightHistoryList.vue'

const { t } = useI18n()

const {
  entries,
  chartData,
  selectedRange,
  hasEntries,
  addEntry,
  deleteEntry,
  setTimeRange,
} = useWeightEntries()

const { stats } = useWeightStats(() => entries.value)

// Get last recorded weight in display units for preset centering
const { toDisplayValue } = useWeightDisplay()
const lastWeightDisplay = computed(() => {
  const latestEntry = entries.value[0]
  if (!latestEntry) return
  // entries are sorted by date descending, so first entry is the most recent
  return toDisplayValue(latestEntry.weight)
})

async function handleSave(weightKg: number) {
  await addEntry(weightKg)
}

async function handleDelete(id: string) {
  await deleteEntry(id)
}
</script>

<template>
  <div class="container mx-auto max-w-lg space-y-6 p-4">
    <h1 class="text-2xl font-bold">{{ t('weight.title') }}</h1>

    <WeightEntryForm :last-weight="lastWeightDisplay" @save="handleSave" />

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
  </div>
</template>
