<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import { useToastStore } from '@/stores/toast'
import { useWeightEntries } from '../composables/useWeightEntries'
import { isOutlier } from '../lib/weightCalculations'
import WeightEntryForm from './WeightEntryForm.vue'

const open = defineModel<boolean>('open', { required: true })

const { t } = useI18n()
const { showToast } = useToastStore()
const { entries, addEntry } = useWeightEntries()
const { toDisplayValue, formatWithUnit } = useWeightDisplay()

// Latest entry in display units so the form's presets center on it,
// mirroring WeightView.
const lastWeightDisplay = computed(() => {
  const latestEntry = entries.value[0]
  if (!latestEntry) return
  return toDisplayValue(latestEntry.weight)
})

// Weight (in kg) awaiting confirmation because it deviates wildly from the
// previous entry. `null` means no confirmation is pending.
const pendingWeightKg = ref<number | null>(null)

watch(open, (isOpen) => {
  if (isOpen) pendingWeightKg.value = null
})

const pendingConfirmMessage = computed(() => {
  const previousEntry = entries.value[0]
  if (!previousEntry) return ''
  return t('weight.outlierConfirm.message', {
    weight: formatWithUnit(previousEntry.weight, 1),
  })
})

async function saveEntry(weightKg: number) {
  const saved = await addEntry(weightKg)
  if (saved) {
    showToast(t('weight.quickLog.saved'))
    open.value = false
  }
}

async function handleSave(weightKg: number) {
  const previousEntry = entries.value[0]

  // Non-blocking for the first entry - there's nothing to compare against.
  if (previousEntry && isOutlier(previousEntry.weight, weightKg)) {
    pendingWeightKg.value = weightKg
    return
  }

  await saveEntry(weightKg)
}

async function confirmPendingSave() {
  if (pendingWeightKg.value === null) return
  const weightKg = pendingWeightKg.value
  pendingWeightKg.value = null
  await saveEntry(weightKg)
}

function cancelPendingSave() {
  pendingWeightKg.value = null
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('weight.quickLog.title') }}</DialogTitle>
        <DialogDescription class="sr-only">{{ t('weight.enterWeight') }}</DialogDescription>
      </DialogHeader>

      <WeightEntryForm :last-weight="lastWeightDisplay" @save="handleSave" />

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
    </MobileDialogContent>
  </Dialog>
</template>
