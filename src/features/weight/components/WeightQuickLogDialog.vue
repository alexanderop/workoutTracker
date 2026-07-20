<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import { useToastStore } from '@/stores/toast'
import { useWeightEntries } from '../composables/useWeightEntries'
import { useWeightOutlierConfirm } from '../composables/useWeightOutlierConfirm'
import WeightEntryForm from './WeightEntryForm.vue'

const open = defineModel<boolean>('open', { required: true })

const { t } = useI18n()
const { showToast } = useToastStore()
const { entries, addEntry } = useWeightEntries()
const { toDisplayValue } = useWeightDisplay()

// Latest entry in display units so the form's presets center on it,
// mirroring WeightView.
const lastWeightDisplay = computed(() => {
  const latestEntry = entries.value[0]
  if (!latestEntry) return
  return toDisplayValue(latestEntry.weight)
})

async function saveEntry(weightKg: number) {
  const saved = await addEntry(weightKg)
  if (!saved) {
    showToast(t('weight.saveError'))
    return
  }
  showToast(t('weight.quickLog.saved'))
  open.value = false
}

const {
  pendingWeightKg,
  pendingConfirmMessage,
  requestSave,
  confirmPendingSave,
  cancelPendingSave,
  reset,
} = useWeightOutlierConfirm({
  entries: () => entries.value,
  save: saveEntry,
})

watch(open, (isOpen) => {
  if (isOpen) reset()
})
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('weight.quickLog.title') }}</DialogTitle>
        <DialogDescription class="sr-only">{{ t('weight.enterWeight') }}</DialogDescription>
      </DialogHeader>

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
    </MobileDialogContent>
  </Dialog>
</template>
