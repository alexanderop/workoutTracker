import { ref, readonly, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { exportAllData, type ExportData } from '@/features/settings/utils/dataExport'
import { importAllData, parseExportFile } from '@/features/settings/utils/dataImport'
import { tryCatch } from '@/lib/tryCatch'

interface DataExportImportReturn {
  isExporting: Readonly<Ref<boolean>>
  isImporting: Readonly<Ref<boolean>>
  showImportDialog: Ref<boolean>
  showImportErrorDialog: Ref<boolean>
  showExportErrorDialog: Ref<boolean>
  importData: Readonly<Ref<ExportData | null>>
  importError: Readonly<Ref<string>>
  handleExport: () => Promise<void>
  processFile: (file: File) => Promise<void>
  confirmImport: () => Promise<void>
}

export function useDataExportImport(): DataExportImportReturn {
  const { t } = useI18n()

  const isExporting = ref(false)
  const isImporting = ref(false)
  const showImportDialog = ref(false)
  const showImportErrorDialog = ref(false)
  const showExportErrorDialog = ref(false)
  const importData = ref<ExportData | null>(null)
  const importError = ref('')

  async function handleExport(): Promise<void> {
    isExporting.value = true
    const [error] = await tryCatch(exportAllData())
    if (error) {
      showExportErrorDialog.value = true
    }
    isExporting.value = false
  }

  async function processFile(file: File): Promise<void> {
    const result = await parseExportFile(file)

    if (!result.success) {
      const message = t(`settings.errors.${result.error}`)
      importError.value = result.details ? `${message} (${result.details})` : message
      showImportErrorDialog.value = true
      return
    }

    importData.value = result.data
    showImportDialog.value = true
  }

  async function confirmImport(): Promise<void> {
    if (!importData.value) return

    isImporting.value = true
    const [error] = await tryCatch(importAllData(importData.value))
    isImporting.value = false

    if (error) {
      importError.value = t('settings.errors.importFailed')
      showImportErrorDialog.value = true
      return
    }

    globalThis.location.reload()
  }

  return {
    isExporting: readonly(isExporting),
    isImporting: readonly(isImporting),
    showImportDialog,
    showImportErrorDialog,
    showExportErrorDialog,
    importData: readonly(importData),
    importError: readonly(importError),
    handleExport,
    processFile,
    confirmImport,
  }
}
