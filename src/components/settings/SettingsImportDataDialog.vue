<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import type { ExportData } from '@/lib/dataExport'
import { getExportSummary } from '@/lib/dataImport'

const { data, isImporting = false } = defineProps<{
  data: ExportData
  isImporting?: boolean
}>()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  confirm: []
}>()

const summary = computed(() => getExportSummary(data))

function handleCancel() {
  open.value = false
}

function handleConfirm() {
  emit('confirm')
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent>
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <AlertTriangle class="h-5 w-5 text-destructive" />
          Import Data?
        </DialogTitle>
        <DialogDescription>
          This will replace all your existing data with the imported data. This action cannot be
          undone.
        </DialogDescription>
      </DialogHeader>

      <div class="rounded-lg border bg-muted/50 p-4 text-sm">
        <p class="font-medium mb-2">You are about to import:</p>
        <ul class="space-y-1 text-muted-foreground">
          <li>{{ summary.workouts }} workout{{ summary.workouts === 1 ? '' : 's' }}</li>
          <li>{{ summary.templates }} template{{ summary.templates === 1 ? '' : 's' }}</li>
          <li>{{ summary.exercises }} custom exercise{{ summary.exercises === 1 ? '' : 's' }}</li>
        </ul>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          class="w-full sm:w-auto"
          :disabled="isImporting"
          @click="handleCancel"
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          class="w-full sm:w-auto"
          :disabled="isImporting"
          @click="handleConfirm"
        >
          {{ isImporting ? 'Importing...' : 'Import Data' }}
        </Button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
