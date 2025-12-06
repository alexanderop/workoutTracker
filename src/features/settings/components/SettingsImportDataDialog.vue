<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import type { ExportData } from '../utils/dataExport'
import { getExportSummary } from '../utils/dataImport'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
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
          {{ t('settings.dialogs.importData.title') }}
        </DialogTitle>
        <DialogDescription>
          {{ t('settings.dialogs.importData.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="rounded-lg border bg-muted/50 p-4 text-sm">
        <p class="font-medium mb-2">{{ t('settings.dialogs.importData.aboutToImport') }}</p>
        <ul class="space-y-1 text-muted-foreground">
          <li>
            {{ summary.workouts }}
            {{
              summary.workouts === 1
                ? t('settings.dialogs.importData.workouts')
                : t('settings.dialogs.importData.workouts_plural')
            }}
          </li>
          <li>
            {{ summary.templates }}
            {{
              summary.templates === 1
                ? t('settings.dialogs.importData.templates')
                : t('settings.dialogs.importData.templates_plural')
            }}
          </li>
          <li>
            {{ summary.exercises }}
            {{
              summary.exercises === 1
                ? t('settings.dialogs.importData.exercises')
                : t('settings.dialogs.importData.exercises_plural')
            }}
          </li>
        </ul>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          class="w-full sm:w-auto"
          :disabled="isImporting"
          @click="handleCancel"
        >
          {{ t('settings.dialogs.importData.cancel') }}
        </Button>
        <Button
          variant="destructive"
          class="w-full sm:w-auto"
          :disabled="isImporting"
          @click="handleConfirm"
        >
          {{
            isImporting
              ? t('settings.dialogs.importData.importing')
              : t('settings.dialogs.importData.confirm')
          }}
        </Button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
