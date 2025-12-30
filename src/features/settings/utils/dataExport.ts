import type {
  DbBenchmark,
  DbCompletedWorkout,
  DbCustomExercise,
  DbUserSetting,
  DbWeightEntry,
  DbWorkoutTemplate,
} from '@/db/schema'
import { getDataManagementRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'

/**
 * Current export format version.
 * Increment this when making breaking changes to the export format.
 */
const EXPORT_VERSION = 1

/**
 * Export data structure with versioning for future compatibility.
 */
export type ExportData = {
  version: number
  exportedAt: string
  data: {
    settings: ReadonlyArray<DbUserSetting>
    customExercises: ReadonlyArray<DbCustomExercise>
    templates: ReadonlyArray<DbWorkoutTemplate>
    workouts: ReadonlyArray<DbCompletedWorkout>
    benchmarks: ReadonlyArray<DbBenchmark>
    weightEntries?: ReadonlyArray<DbWeightEntry>
  }
}

/**
 * Collect all user data from the database for export.
 * Excludes active workout (in-progress).
 */
async function collectExportData(): Promise<ExportData | null> {
  const [error, data] = await tryCatch(getDataManagementRepository().exportAll())

  if (error) return null

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

/**
 * Generate a filename for the export with current date.
 */
function generateExportFilename(): string {
  const date = new Date().toISOString().split('T')[0]
  return `workout-tracker-backup-${date}.json`
}

/**
 * Trigger a file download in the browser.
 */
function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}

/**
 * Export all user data and trigger a download.
 * Returns the export data for display purposes (e.g., showing counts).
 */
export async function exportAllData(): Promise<ExportData | null> {
  const exportData = await collectExportData()

  if (!exportData) return null

  const json = JSON.stringify(exportData, null, 2)
  const filename = generateExportFilename()

  downloadFile(json, filename)

  return exportData
}
