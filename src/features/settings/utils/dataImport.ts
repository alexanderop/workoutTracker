import { getDataManagementRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'

import type { ExportData } from './dataExport'
import { exportDataSchema } from './validation'

/**
 * Maximum supported export version.
 * Import fails if file version exceeds this.
 */
const MAX_SUPPORTED_VERSION = 1

/**
 * Maximum file size for import (10MB).
 * Prevents DoS attacks from maliciously large files.
 */
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

/**
 * Result of parsing an export file.
 */
type ParseResult =
  | { success: true; data: ExportData }
  | { success: false; error: string; details?: string }

/**
 * Read a File as text.
 */
async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file as text'))
        return
      }
      resolve(result)
    })
    reader.addEventListener('error', () => reject(new Error('Failed to read file')))
    reader.readAsText(file)
  })
}

/**
 * Validate the structure of export data using Zod schema.
 * Uses .strict() mode to reject unknown properties and prevent prototype pollution.
 */
function validateExportData(data: unknown): ParseResult {
  const result = exportDataSchema.safeParse(data)

  if (!result.success) {
    const firstIssue = result.error.issues[0]
    const path = firstIssue?.path.join('.') ?? 'unknown'
    const message = firstIssue?.message ?? 'Validation failed'
    return {
      success: false,
      error: 'validationFailed',
      details: `Invalid data at "${path}": ${message}`,
    }
  }

  // Check version after schema validation
  if (result.data.version > MAX_SUPPORTED_VERSION) {
    return { success: false, error: 'newerVersion' }
  }

  return { success: true, data: result.data }
}

/**
 * Parse and validate an export file.
 */
export async function parseExportFile(file: File): Promise<ParseResult> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { success: false, error: 'fileTooLarge' }
  }

  const [readError, text] = await tryCatch(readFileAsText(file))
  if (readError) {
    return { success: false, error: 'readFailed' }
  }

  const [parseError, parsed] = tryCatch(() => JSON.parse(text))
  if (parseError) {
    return { success: false, error: 'invalidJson' }
  }

  return validateExportData(parsed)
}

/**
 * Import all data from a validated export, replacing existing data.
 * Uses a transaction to ensure atomicity.
 */
export async function importAllData(exportData: ExportData): Promise<boolean> {
  // Use JSON round-trip to strip Vue reactivity proxies
  // before IndexedDB's structured clone algorithm runs
  const serialized = JSON.stringify(exportData.data)
  const rawData = JSON.parse(serialized)

  const [error] = await tryCatch(
    getDataManagementRepository().importAll({
      settings: rawData.settings,
      customExercises: rawData.customExercises,
      templates: rawData.templates,
      workouts: rawData.workouts,
      benchmarks: rawData.benchmarks ?? [],
    }),
  )

  return !error
}

/**
 * Get summary counts from export data for display.
 */
export function getExportSummary(data: ExportData): {
  workouts: number
  templates: number
  exercises: number
  settings: number
} {
  return {
    workouts: data.data.workouts.length,
    templates: data.data.templates.length,
    exercises: data.data.customExercises.length,
    settings: data.data.settings.length,
  }
}
