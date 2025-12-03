import type {
  DbCompletedWorkout,
  DbCustomExercise,
  DbUserSetting,
  DbWorkoutTemplate,
} from '@/db/schema'
import { db } from '@/db'

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
  }
}

/**
 * Collect all user data from the database for export.
 * Excludes active workout (in-progress).
 */
async function collectExportData(): Promise<ExportData> {
  const [settings, customExercises, templates, workouts] = await Promise.all([
    db.settings.toArray(),
    db.customExercises.toArray(),
    db.templates.toArray(),
    db.workouts.toArray(),
  ])

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      settings,
      customExercises,
      templates,
      workouts,
    },
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
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Export all user data and trigger a download.
 * Returns the export data for display purposes (e.g., showing counts).
 */
export async function exportAllData(): Promise<ExportData> {
  const exportData = await collectExportData()
  const json = JSON.stringify(exportData, null, 2)
  const filename = generateExportFilename()

  downloadFile(json, filename)

  return exportData
}
