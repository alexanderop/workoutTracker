/**
 * Pure functions for exporting workouts to markdown.
 * All functions are side-effect free: (input) => output
 */

import type {
  DbCompletedWorkout,
  DbWorkoutBlock,
  DbStrengthBlock,
  DbAmrapBlock,
  DbEmomBlock,
  DbTabataBlock,
  DbForTimeBlock,
  DbCardioBlock,
  DbBlockExercise,
  DbSet,
} from '@/db/schema'
import { MARKDOWN_SPEC_VERSION, MARKDOWN_SPEC_FORMAT } from './markdownSpec'

// ============================================
// Frontmatter
// ============================================

export function formatFrontmatter(exportedAt: Date = new Date()): string {
  return `---
format: ${MARKDOWN_SPEC_FORMAT}
version: ${MARKDOWN_SPEC_VERSION}
exported: ${exportedAt.toISOString()}
---`
}

// ============================================
// Metadata Section
// ============================================

export function formatMetadata(workout: DbCompletedWorkout): string {
  const date = new Date(workout.completedAt)
  const dateStr = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const duration = formatDuration(workout.durationSeconds)

  const lines = [`**Date:** ${dateStr}`, `**Duration:** ${duration}`]

  if (workout.notes.trim()) {
    lines.push(`**Notes:** ${workout.notes}`)
  }

  return lines.join('  \n')
}

// ============================================
// Strength Block
// ============================================

export function formatStrengthBlock(block: DbStrengthBlock): string {
  const lines: Array<string> = [ `## ${block.name} (Strength)`]

  // Header

  // Equipment
  if (block.equipment && block.equipment !== 'bodyweight') {
    lines.push(`Equipment: ${block.equipment}`)
  }

  // Target reps
  if (block.targetReps > 0) {
    lines.push(`Target: ${block.targetReps} reps`)
  }

  lines.push('', '| Set | Weight | Reps | RIR |', '|-----|--------|------|-----|')

  for (const [index, set] of block.sets.entries()) {
    lines.push(formatSetRow(set, index + 1))
  }

  return lines.join('\n')
}

function formatSetRow(set: DbSet, setNumber: number): string {
  const weight = set.kg ? `${set.kg}kg` : '-'
  const reps = set.reps || '-'
  const rir = set.rir || '-'
  return `| ${setNumber}   | ${weight} | ${reps}    | ${rir}   |`
}

// ============================================
// AMRAP Block
// ============================================

export function formatAmrapBlock(block: DbAmrapBlock): string {
  const lines: Array<string> = []

  // Header - use block name if exercises exist, else generic
  const name = getBlockDisplayName(block.exercises, 'AMRAP')
  lines.push(`## ${name} (AMRAP)`)

  // Duration
  const minutes = Math.floor(block.config.durationSeconds / 60)
  lines.push(`Duration: ${minutes} min`, '')

  // Exercises
  for (const ex of block.exercises) {
    lines.push(formatExerciseLine(ex))
  }

  // Result
  if (block.result) {
    lines.push('')
    const duration = formatDurationMs(block.result.actualDuration)
    lines.push(`**Result:** ${block.result.rounds} rounds + ${block.result.partialReps} reps (${duration})`)
  }

  return lines.join('\n')
}

// ============================================
// EMOM Block
// ============================================

export function formatEmomBlock(block: DbEmomBlock): string {
  const lines: Array<string> = []

  const name = getBlockDisplayName(block.exercises, 'EMOM')
  lines.push(`## ${name} (EMOM)`, `Duration: ${block.config.minutes} min`, `Rotation: ${block.config.exerciseRotation}`, '')

  for (const ex of block.exercises) {
    lines.push(formatExerciseLine(ex))
  }

  if (block.result) {
    lines.push('', `**Result:** ${block.result.completedMinutes}/${block.config.minutes} minutes completed`)
  }

  return lines.join('\n')
}

// ============================================
// Tabata Block
// ============================================

export function formatTabataBlock(block: DbTabataBlock): string {
  const lines: Array<string> = []

  const name = block.exercise.name || 'Tabata'
  lines.push(
    `## ${name} (Tabata)`,
    `Rounds: ${block.config.rounds}`,
    `Work/Rest: ${block.config.workSeconds}s/${block.config.restSeconds}s`,
    '',
    formatExerciseLine(block.exercise),
  )

  if (block.result) {
    lines.push('')
    const reps = block.result.repsPerRound.join(', ')
    lines.push(`**Result:** ${reps} reps`)
  }

  return lines.join('\n')
}

// ============================================
// For Time Block
// ============================================

export function formatForTimeBlock(block: DbForTimeBlock): string {
  const lines: Array<string> = []

  const name = getBlockDisplayName(block.exercises, 'For Time')
  lines.push(`## ${name} (ForTime)`)

  if (block.config.timeCapSeconds) {
    const minutes = Math.floor(block.config.timeCapSeconds / 60)
    lines.push(`Time cap: ${minutes} min`)
  }
  lines.push('')

  for (const ex of block.exercises) {
    lines.push(formatExerciseLine(ex))
  }

  if (block.result) {
    lines.push('')
    const time = formatDurationMs(block.result.completionTime)
    const check = block.result.completed ? ' \u2713' : ''
    lines.push(`**Result:** ${time}${check}`)
  }

  return lines.join('\n')
}

// ============================================
// Cardio Block
// ============================================

export function formatCardioBlock(block: DbCardioBlock): string {
  const lines: Array<string> = []

  const activityName = capitalizeFirst(block.config.activity)
  lines.push(`## ${activityName} (Cardio)`, `Activity: ${block.config.activity}`)

  if (block.result) {
    lines.push('', '**Result:**')

    if (block.result.actualDurationSeconds) {
      lines.push(`- Duration: ${formatDuration(block.result.actualDurationSeconds)}`)
    }
    if (block.result.distanceMeters) {
      const km = (block.result.distanceMeters / 1000).toFixed(1)
      lines.push(`- Distance: ${km} km`)
    }
    if (block.result.avgPaceSecondsPerKm) {
      lines.push(`- Pace: ${formatPace(block.result.avgPaceSecondsPerKm)} /km`)
    }
    if (block.result.calories) {
      lines.push(`- Calories: ${block.result.calories}`)
    }
    if (block.result.notes) {
      lines.push('', `Notes: ${block.result.notes}`)
    }
  }

  return lines.join('\n')
}

// ============================================
// Block Router
// ============================================

export function formatBlock(block: DbWorkoutBlock): string {
  switch (block.kind) {
    case 'strength': {
      return formatStrengthBlock(block)
    }
    case 'amrap': {
      return formatAmrapBlock(block)
    }
    case 'emom': {
      return formatEmomBlock(block)
    }
    case 'tabata': {
      return formatTabataBlock(block)
    }
    case 'fortime': {
      return formatForTimeBlock(block)
    }
    case 'cardio': {
      return formatCardioBlock(block)
    }
  }
}

// ============================================
// Main Export Function
// ============================================

export function exportWorkoutAsMarkdown(workout: DbCompletedWorkout): string {
  const blockSections = workout.blocks.map((block) => formatBlock(block))

  const sections = [
    formatFrontmatter(new Date(workout.completedAt)),
    `# ${workout.name}`,
    formatMetadata(workout),
    ...blockSections,
  ]

  return sections.join('\n\n')
}

// ============================================
// Helper Functions
// ============================================

function formatExerciseLine(exercise: DbBlockExercise): string {
  const load = exercise.load ? ` @ ${exercise.load}` : ''
  return `- ${exercise.prescribedReps} \u00D7 ${exercise.name}${load}`
}

function getBlockDisplayName(
  exercises: ReadonlyArray<DbBlockExercise>,
  fallback: string,
): string {
  if (exercises.length === 0) return fallback
  const first = exercises[0]
  if (exercises.length === 1 && first) return first.name
  return fallback
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (secs === 0) return `${mins} min`
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function formatDurationMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function formatPace(secondsPerKm: number): string {
  const mins = Math.floor(secondsPerKm / 60)
  const secs = Math.floor(secondsPerKm % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
