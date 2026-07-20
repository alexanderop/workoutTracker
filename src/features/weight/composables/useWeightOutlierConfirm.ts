import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import type { DbWeightEntry } from '@/db/schema'
import { isOutlier } from '../lib/weightCalculations'

/**
 * Shared "that's a big change since last time" confirmation flow for weight
 * entry, used by both WeightView and WeightQuickLogDialog so the two entry
 * points can't drift apart.
 *
 * `save` performs the actual persistence; it is only invoked for values that
 * are either unsuspicious or explicitly confirmed by the user.
 */
export function useWeightOutlierConfirm(options: {
  entries: () => ReadonlyArray<DbWeightEntry>
  save: (weightKg: number) => Promise<void>
}) {
  const { t } = useI18n()
  const { formatWithUnit } = useWeightDisplay()

  // Weight (in kg) awaiting confirmation because it deviates wildly from the
  // previous entry. `null` means no confirmation is pending.
  const pendingWeightKg = ref<number | null>(null)

  const pendingConfirmMessage = computed(() => {
    const previousEntry = options.entries()[0]
    if (!previousEntry) return ''
    return t('weight.outlierConfirm.message', {
      weight: formatWithUnit(previousEntry.weight, 1),
    })
  })

  async function requestSave(weightKg: number): Promise<void> {
    const previousEntry = options.entries()[0]

    // Non-blocking for the first entry - there's nothing to compare against.
    if (previousEntry && isOutlier(previousEntry.weight, weightKg)) {
      pendingWeightKg.value = weightKg
      return
    }

    await options.save(weightKg)
  }

  async function confirmPendingSave(): Promise<void> {
    if (pendingWeightKg.value === null) return
    const weightKg = pendingWeightKg.value
    pendingWeightKg.value = null
    await options.save(weightKg)
  }

  function cancelPendingSave(): void {
    pendingWeightKg.value = null
  }

  function reset(): void {
    pendingWeightKg.value = null
  }

  return {
    pendingWeightKg,
    pendingConfirmMessage,
    requestSave,
    confirmPendingSave,
    cancelPendingSave,
    reset,
  }
}
