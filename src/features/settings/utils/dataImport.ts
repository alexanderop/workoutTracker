import { getDataManagementRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'

import type { ExportData } from './dataExport'
import { exportDataSchema } from './validation'

/**
 * Maximum supported export version.
 * Import fails if file version exceeds this.
 */
const MAX_SUPPORTED_VERSION = 3

/**
 * Maximum file size for import (10MB).
 * Prevents DoS attacks from maliciously large files.
 */
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

/**
 * Every error code `parseExportFile` can return.
 * Each one is looked up as a translation key at `settings.errors.<code>`
 * (see `useDataExportImport.ts`) — see `dataImportLocales.spec.ts` for the
 * test that keeps every locale in sync with this list.
 */
export const IMPORT_ERROR_CODES = [
  'validationFailed',
  'newerVersion',
  'fileTooLarge',
  'readFailed',
  'invalidJson',
] as const

type ImportErrorCode = (typeof IMPORT_ERROR_CODES)[number]

/**
 * Result of parsing an export file.
 */
type ParseResult =
  | { success: true; data: ExportData }
  | { success: false; error: ImportErrorCode; details?: string }

/**
 * Read a File as text.
 */
async function readFileAsText(file: File): Promise<string> {
  return file.text()
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
      weightEntries: rawData.weightEntries ?? [],
      habits: rawData.habits ?? [],
      habitEntries: rawData.habitEntries ?? [],
      nutritionGoals: rawData.nutritionGoals ?? [],
      foods: rawData.foods ?? [],
      nutritionDiaryEntries: rawData.nutritionDiaryEntries ?? [],
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
