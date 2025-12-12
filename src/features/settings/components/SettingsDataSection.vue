<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { Download, Upload } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { exportAllData, type ExportData } from '@/features/settings/utils/dataExport'
import { importAllData, parseExportFile } from '@/features/settings/utils/dataImport'
import { tryCatch } from '@/lib/tryCatch'
import { Button } from '@/components/ui/button'
import SettingsImportDataDialog from './SettingsImportDataDialog.vue'
import ErrorDialog from '@/components/ErrorDialog.vue'

const { t } = useI18n()

const isExporting = ref(false)
const isImporting = ref(false)
const showImportDialog = ref(false)
const showImportErrorDialog = ref(false)
const showExportErrorDialog = ref(false)
const importData = ref<ExportData | null>(null)
const importError = ref('')
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInput')

async function handleExport() {
  isExporting.value = true
  const [error] = await tryCatch(exportAllData())
  if (error) {
    showExportErrorDialog.value = true
  }
  isExporting.value = false
}

function handleImportClick() {
  fileInputRef.value?.click()
}

async function handleFileSelect(event: Event) {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return

  const file = input.files?.[0]

  // Reset the input so the same file can be selected again
  input.value = ''

  if (!file) return

  const result = await parseExportFile(file)

  if (!result.success) {
    importError.value = t(`settings.errors.${result.error}`)
    showImportErrorDialog.value = true
    return
  }

  importData.value = result.data
  showImportDialog.value = true
}

async function handleImportConfirm() {
  if (!importData.value) return

  isImporting.value = true
  const [error] = await tryCatch(importAllData(importData.value))
  isImporting.value = false

  if (error) {
    importError.value = t('settings.errors.importFailed')
    showImportErrorDialog.value = true
    return
  }

  window.location.reload()
}
</script>

<template>
  <section>
    <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
      {{ t('settings.sections.data') }}
    </h2>
    <div class="space-y-3">
      <!-- Export -->
      <Button
        variant="outline"
        :aria-label="t('settings.labels.ariaExportData')"
        class="flex items-center justify-between w-full h-auto p-4 text-left bg-card hover:bg-accent/50 touch-target"
        :disabled="isExporting"
        @click="handleExport"
      >
        <div class="flex items-center gap-3">
          <Download class="icon-md text-muted-foreground" />
          <div>
            <p class="font-medium">{{ t('settings.labels.exportData') }}</p>
            <p class="text-sm text-muted-foreground">
              {{ t('settings.labels.downloadBackup') }}
            </p>
          </div>
        </div>
        <span v-if="isExporting" class="text-sm text-muted-foreground">{{
          t('settings.labels.exporting')
        }}</span>
      </Button>

      <!-- Import -->
      <Button
        variant="outline"
        :aria-label="t('settings.labels.ariaImportData')"
        class="flex items-center gap-3 w-full h-auto p-4 text-left bg-card hover:bg-accent/50 touch-target"
        @click="handleImportClick"
      >
        <Upload class="icon-md text-muted-foreground" />
        <div>
          <p class="font-medium">{{ t('settings.labels.importData') }}</p>
          <p class="text-sm text-muted-foreground">
            {{ t('settings.labels.restoreFromBackup') }}
          </p>
        </div>
      </Button>
      <input
        ref="fileInput"
        type="file"
        accept=".json"
        class="hidden"
        @change="handleFileSelect"
      />
    </div>

    <SettingsImportDataDialog
      v-if="importData"
      v-model:open="showImportDialog"
      :data="importData"
      :is-importing="isImporting"
      @confirm="handleImportConfirm"
    />
    <ErrorDialog v-model:open="showImportErrorDialog" :error="importError" />
    <ErrorDialog
      v-model:open="showExportErrorDialog"
      :error="t('settings.errors.exportFailed.message')"
      :title="t('settings.errors.exportFailed.title')"
    />
  </section>
</template>
