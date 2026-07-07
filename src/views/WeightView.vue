<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWeightEntries } from '@/features/weight/composables/useWeightEntries'
import { useWeightStats } from '@/features/weight/composables/useWeightStats'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import { isOutlier } from '@/features/weight/lib/weightCalculations'
import { Button } from '@/components/ui/button'
import WeightEntryForm from '@/features/weight/components/WeightEntryForm.vue'
import WeightStatsSummary from '@/features/weight/components/WeightStatsSummary.vue'
import WeightChart from '@/features/weight/components/WeightChart.vue'
import WeightHistoryList from '@/features/weight/components/WeightHistoryList.vue'

const { t } = useI18n()

const { entries, chartData, selectedRange, hasEntries, addEntry, deleteEntry, setTimeRange } =
  useWeightEntries()

const { stats } = useWeightStats(() => entries.value)

// Get last recorded weight in display units for preset centering
const { toDisplayValue, formatWithUnit } = useWeightDisplay()
const lastWeightDisplay = computed(() => {
  const latestEntry = entries.value[0]
  if (!latestEntry) return
  // entries are sorted by date descending, so first entry is the most recent
  return toDisplayValue(latestEntry.weight)
})

// Weight (in kg) awaiting confirmation because it deviates wildly from the
// previous entry. `null` means no confirmation is pending.
const pendingWeightKg = ref<number | null>(null)

const pendingConfirmMessage = computed(() => {
  const previousEntry = entries.value[0]
  if (!previousEntry) return ''
  return t('weight.outlierConfirm.message', {
    weight: formatWithUnit(previousEntry.weight, 1),
  })
})

async function handleSave(weightKg: number) {
  const previousEntry = entries.value[0]

  // Non-blocking for the first entry - there's nothing to compare against.
  if (previousEntry && isOutlier(previousEntry.weight, weightKg)) {
    pendingWeightKg.value = weightKg
    return
  }

  await addEntry(weightKg)
}

async function confirmPendingSave() {
  if (pendingWeightKg.value === null) return
  const weightKg = pendingWeightKg.value
  pendingWeightKg.value = null
  await addEntry(weightKg)
}

function cancelPendingSave() {
  pendingWeightKg.value = null
}

async function handleDelete(id: string) {
  await deleteEntry(id)
}
</script>

<template>
  <div class="container mx-auto max-w-lg space-y-6 p-4">
    <h1 class="text-2xl font-bold">{{ t('weight.title') }}</h1>

    <WeightEntryForm :last-weight="lastWeightDisplay" @save="handleSave" />

    <div
      v-if="pendingWeightKg !== null"
      role="alert"
      class="space-y-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm"
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
