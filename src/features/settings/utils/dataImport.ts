import type { ExportData } from './dataExport'
import { getDataManagementRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'

/**
 * Maximum supported export version.
 * Import fails if file version exceeds this.
 */
const MAX_SUPPORTED_VERSION = 1

/**
 * Result of parsing an export file.
 */
type ParseResult = { success: true; data: ExportData } | { success: false; error: string }

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
 * Type guard to check if value is a record object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Validate the structure of export data.
 */
function validateExportData(data: unknown): ParseResult {
  if (!isRecord(data)) {
    return { success: false, error: 'Invalid file format' }
  }

  // Check version
  if (typeof data.version !== 'number') {
    return { success: false, error: 'This file is not a valid workout tracker export' }
  }

  if (data.version > MAX_SUPPORTED_VERSION) {
    return {
      success: false,
      error: 'This export file is from a newer version and cannot be imported',
    }
  }

  // Check exportedAt
  if (typeof data.exportedAt !== 'string') {
    return { success: false, error: 'Export file is corrupted or incomplete' }
  }

  // Check data object
  if (!isRecord(data.data)) {
    return { success: false, error: 'Export file is corrupted or incomplete' }
  }

  const dataObj = data.data

  // Check required arrays exist
  const requiredArrays = ['settings', 'customExercises', 'templates', 'workouts'] as const
  for (const key of requiredArrays) {
    if (!Array.isArray(dataObj[key])) {
      return { success: false, error: 'Export file is corrupted or incomplete' }
    }
  }

  // At this point we've validated the structure matches ExportData
  // @ts-expect-error - We've validated the structure but TypeScript can't narrow it
  return { success: true, data }
}

/**
 * Parse and validate an export file.
 */
export async function parseExportFile(file: File): Promise<ParseResult> {
  const [readError, text] = await tryCatch(readFileAsText(file))
  if (readError) {
    return { success: false, error: 'Failed to read the selected file' }
  }

  const [parseError, parsed] = tryCatch(() => JSON.parse(text))
  if (parseError) {
    return { success: false, error: 'The selected file is not valid JSON' }
  }

  return validateExportData(parsed)
}

/**
 * Import all data from a validated export, replacing existing data.
 * Uses a transaction to ensure atomicity.
 */
export async function importAllData(exportData: ExportData): Promise<void> {
  // Use JSON round-trip to strip Vue reactivity proxies
  // before IndexedDB's structured clone algorithm runs
  const serialized = JSON.stringify(exportData.data)
  const rawData: ExportData['data'] = JSON.parse(serialized)

  await getDataManagementRepository().importAll(rawData)
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
