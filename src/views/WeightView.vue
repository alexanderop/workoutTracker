<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWeightEntries } from '@/features/weight/composables/useWeightEntries'
import { useWeightOutlierConfirm } from '@/features/weight/composables/useWeightOutlierConfirm'
import { useWeightStats } from '@/features/weight/composables/useWeightStats'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import { useToastStore } from '@/stores/toast'
import { Button } from '@/components/ui/button'
import WeightEntryForm from '@/features/weight/components/WeightEntryForm.vue'
import WeightStatsSummary from '@/features/weight/components/WeightStatsSummary.vue'
import WeightChart from '@/features/weight/components/WeightChart.vue'
import WeightHistoryList from '@/features/weight/components/WeightHistoryList.vue'

const { t } = useI18n()
const { showToast } = useToastStore()

const { entries, chartData, selectedRange, hasEntries, addEntry, deleteEntry, setTimeRange } =
  useWeightEntries()

const { stats } = useWeightStats(() => entries.value)

// Get last recorded weight in display units for preset centering
const { toDisplayValue } = useWeightDisplay()
const lastWeightDisplay = computed(() => {
  const latestEntry = entries.value[0]
  if (!latestEntry) return
  // entries are sorted by date descending, so first entry is the most recent
  return toDisplayValue(latestEntry.weight)
})

async function saveEntry(weightKg: number) {
  const saved = await addEntry(weightKg)
  // Success is visible in the stats/history below; only failures need a toast.
  if (!saved) showToast(t('weight.saveError'))
}

const {
  pendingWeightKg,
  pendingConfirmMessage,
  requestSave,
  confirmPendingSave,
  cancelPendingSave,
} = useWeightOutlierConfirm({
  entries: () => entries.value,
  save: saveEntry,
})

async function handleDelete(id: string) {
  await deleteEntry(id)
}
</script>

<template>
  <div class="container mx-auto max-w-lg space-y-section p-4">
    <h1 class="text-page-title font-bold">{{ t('weight.title') }}</h1>

    <WeightEntryForm :last-weight="lastWeightDisplay" @save="requestSave" />

    <div
      v-if="pendingWeightKg !== null"
      role="alert"
      class="space-y-3 rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm"
    >
      <p>{{ pendingConfirmMessage }}</p>
      <div class="flex justify-end gap-2">
        <Button variant="outline" size="sm" @click="cancelPendingSave">
          {{ t('weight.outlierConfirm.cancel') }}
        </Button>
        <Button size="sm" @click="confirmPendingSave">
          {{ t('weight.outlierConfirm.confirm') }}
        </Button>
      </div>
    </div>

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
