/**
 * Markdown building blocks (spec v1) shared by multiple block codecs and by
 * the import/export orchestrators in `features/workout`.
 * All functions are side-effect free: (input) => output
 */

import type { DbBlockExercise } from './types'

// ============================================
// Parsed Intermediates (kind-neutral)
// ============================================

/**
 * Exercise line parsed from markdown, before exercise-catalog resolution
 * (which stays with the import orchestrator).
 */
export type ParsedBlockExercise = {
  name: string
  prescribedReps: number
  load: string | null
}

/** Set row parsed from a strength table (raw string cells). */
export type ParsedSet = {
  kg: string
  reps: string
  rir: string
}

// ============================================
// Parse Result Types
// ============================================

type ParseError = {
  line?: number
  message: string
  context?: string
}

export type ParseSuccess<T> = {
  success: true
  data: T
}

export type ParseFailure = {
  success: false
  errors: ReadonlyArray<ParseError>
}

export type ParseResult<T> = ParseSuccess<T> | ParseFailure

export function parseSuccess<T>(data: T): ParseSuccess<T> {
  return { success: true, data }
}

function parseFailure(errors: ReadonlyArray<ParseError>): ParseFailure {
  return { success: false, errors }
}

export function singleError(message: string, line?: number, context?: string): ParseFailure {
  return parseFailure([{ message, line, context }])
}

// ============================================
// Field Parser Types and Helpers
// ============================================

export type FieldParser<T> = (line: string, state: T) => boolean

export function createFieldParserLoop<T>(parsers: ReadonlyArray<FieldParser<T>>) {
  return (
    lines: ReadonlyArray<string>,
    state: T,
    stopCondition?: (line: string) => boolean,
  ): void => {
    for (const line of lines) {
      if (stopCondition?.(line)) break
      for (const parser of parsers) {
        if (parser(line, state)) break
      }
    }
  }
}

// ============================================
// Format Helpers
// ============================================

export function formatExerciseLine(exercise: DbBlockExercise): string {
  // '@' is the load delimiter, so escape it inside the name: an exercise
  // called "Row @ 2k pace" would otherwise be silently truncated to "Row"
  // (with the rest misread as load) on re-import.
  const name = exercise.name.replaceAll('@', String.raw`\@`)
  const load = exercise.load ? ` @ ${exercise.load}` : ''
  return `- ${exercise.prescribedReps} \u{D7} ${name}${load}`
}

export function getBlockDisplayName(
  exercises: ReadonlyArray<DbBlockExercise>,
  fallback: string,
): string {
  if (exercises.length === 0) return fallback
  const first = exercises[0]
  if (exercises.length === 1 && first) return first.name
  return fallback
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (secs === 0) return `${mins} min`
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

// ============================================
// Parse Helpers
// ============================================

export function parseExerciseLine(line: string): ParsedBlockExercise | null {
  // - 10 × Kettlebell Swings @ 24kg
  // The name may contain escaped at-signs (`\@`, written by
  // formatExerciseLine); only an unescaped '@' starts the load. Unescaped
  // '@' in the name (pre-escaping exports) still splits at the first '@',
  // matching the old behavior.
  const match = line.match(/^-\s*(\d+)\s*[x×]\s*((?:\\@|[^@])+?)(?:\s*(?<!\\)@\s*(.+))?$/i)
  if (!match?.[1] || !match[2]) return null

  return {
    name: match[2].trim().replaceAll(String.raw`\@`, '@'),
    prescribedReps: Number.parseInt(match[1], 10),
    load: match[3]?.trim() ?? null,
  }
}

function parseMinutesFormat(string_: string): number | null {
  const match = string_.match(/^(\d+)\s*min/)
  return match?.[1] ? Number.parseInt(match[1], 10) * 60 : null
}

function parseMmSsFormat(parts: Array<number>): number {
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
}

function parseHhMmSsFormat(parts: Array<number>): number {
  return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0)
}

function parseTimeFormat(string_: string): number | null {
  const match = string_.match(/^(\d+):(\d+)(?::(\d+))?$/)
  if (!match?.[1] || !match[2]) return null

  const parts = [match[1], match[2], match[3]].filter(Boolean).map(Number)
  return parts.length === 3 ? parseHhMmSsFormat(parts) : parseMmSsFormat(parts)
}

export function parseDurationString(string_: string): number | null {
  // "45 min" or "45:30" or "1:30:00"
  return parseMinutesFormat(string_) ?? parseTimeFormat(string_)
}

export function parseDurationToMs(string_: string): number {
  // "10:32" -> ms
  const match = string_.match(/^(\d+):(\d+)$/)
  if (match?.[1] && match[2]) {
    const mins = Number.parseInt(match[1], 10)
    const secs = Number.parseInt(match[2], 10)
    return (mins * 60 + secs) * 1000
  }
  return 0
}
