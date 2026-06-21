import { describe, it, expect } from 'vitest'
import {
  formatFrontmatter,
  formatStrengthBlock,
  formatAmrapBlock,
  formatEmomBlock,
  formatTabataBlock,
  formatForTimeBlock,
  formatCardioBlock,
  exportWorkoutAsMarkdown,
} from '@/features/workout/utils/markdownExport'
import { MARKDOWN_SPEC_FORMAT, MARKDOWN_SPEC_VERSION } from '@/features/workout/utils/markdownSpec'
import { createDbStrengthBlockWithSets } from '@/__tests__/factories/dbBlock.factory'
import {
  createDbAmrapBlock,
  createDbAmrapResult,
  createDbBlockExercise,
  createDbEmomBlock,
  createDbEmomResult,
  createDbTabataBlock,
  createDbTabataResult,
  createDbForTimeBlock,
  createDbForTimeResult,
  createDbCardioBlock,
  createDbCardioResult,
} from '@/__tests__/factories/timedBlock.factory'
import { dbWorkoutBuilder } from '@/__tests__/factories/dbWorkout.factory'

describe('markdownExport', () => {
  describe('formatFrontmatter', () => {
    it('includes format and version', () => {
      const result = formatFrontmatter(new Date('2026-01-01T12:00:00Z'))

      expect(result).toContain(`format: ${MARKDOWN_SPEC_FORMAT}`)
      expect(result).toContain(`version: ${MARKDOWN_SPEC_VERSION}`)
      expect(result).toContain('exported: 2026-01-01T12:00:00.000Z')
    })

    it('wraps in YAML delimiters', () => {
      const result = formatFrontmatter()

      expect(result.startsWith('---')).toBe(true)
      expect(result.endsWith('---')).toBe(true)
    })
  })

  describe('formatStrengthBlock', () => {
    it('formats block header with name and type', () => {
      const block = createDbStrengthBlockWithSets(
        [{ kg: '80', reps: '5', rir: '2' }],
        { name: 'Bench Press' },
      )

      const result = formatStrengthBlock(block)

      expect(result).toContain('## Bench Press (Strength)')
    })

    it('includes equipment when not bodyweight', () => {
      const block = createDbStrengthBlockWithSets([], { equipment: 'barbell' })

      const result = formatStrengthBlock(block)

      expect(result).toContain('Equipment: barbell')
    })

    it('omits equipment when bodyweight', () => {
      const block = createDbStrengthBlockWithSets([], { equipment: 'bodyweight' })

      const result = formatStrengthBlock(block)

      expect(result).not.toContain('Equipment:')
    })

    it('formats sets as markdown table', () => {
      const block = createDbStrengthBlockWithSets([
        { kg: '80', reps: '5', rir: '2' },
        { kg: '90', reps: '5', rir: '1' },
      ])

      const result = formatStrengthBlock(block)

      expect(result).toContain('| Set | Weight | Reps | RIR |')
      expect(result).toContain('| 1 | 80kg | 5 | 2 |')
      expect(result).toContain('| 2 | 90kg | 5 | 1 |')
    })

    it('handles empty kg with dash', () => {
      const block = createDbStrengthBlockWithSets([{ kg: '', reps: '10', rir: '' }])

      const result = formatStrengthBlock(block)

      expect(result).toContain('| -')
    })

    it('skips completely empty sets in the table', () => {
      const block = createDbStrengthBlockWithSets([
        { kg: '80', reps: '10', rir: '2' }, // completed
        { kg: '', reps: '', rir: '' }, // empty
        { kg: '', reps: '', rir: '' }, // empty
      ])

      const result = formatStrengthBlock(block)

      // Should only have 1 data row (not 3)
      const lines = result.split('\n')
      const dataRows = lines.filter(
        (l) => l.startsWith('|') && !l.includes('Set') && !l.includes('---'),
      )

      expect(dataRows).toHaveLength(1)
      expect(dataRows[0]).toContain('80kg')
      expect(dataRows[0]).toContain('10')
    })

    it('keeps sets with partial data (weight only)', () => {
      const block = createDbStrengthBlockWithSets([
        { kg: '80', reps: '', rir: '' }, // has weight only
      ])

      const result = formatStrengthBlock(block)

      const lines = result.split('\n')
      const dataRows = lines.filter(
        (l) => l.startsWith('|') && !l.includes('Set') && !l.includes('---'),
      )

      expect(dataRows).toHaveLength(1)
      expect(dataRows[0]).toContain('80kg')
    })

    it('keeps sets with partial data (reps only)', () => {
      const block = createDbStrengthBlockWithSets([
        { kg: '', reps: '15', rir: '' }, // has reps only (bodyweight)
      ])

      const result = formatStrengthBlock(block)

      const lines = result.split('\n')
      const dataRows = lines.filter(
        (l) => l.startsWith('|') && !l.includes('Set') && !l.includes('---'),
      )

      expect(dataRows).toHaveLength(1)
      expect(dataRows[0]).toContain('15')
    })
  })

  describe('formatAmrapBlock', () => {
    it('formats block header', () => {
      const block = createDbAmrapBlock({
        exercises: [createDbBlockExercise({ name: 'Burpees' })],
        config: { durationSeconds: 600 },
      })

      const result = formatAmrapBlock(block)

      expect(result).toContain('## Burpees (AMRAP)')
      expect(result).toContain('Duration: 10 min')
    })

    it('formats exercises with reps and load', () => {
      const block = createDbAmrapBlock({
        exercises: [
          createDbBlockExercise({ name: 'Kettlebell Swings', prescribedReps: 15, load: '24kg' }),
        ],
      })

      const result = formatAmrapBlock(block)

      expect(result).toContain('- 15 × Kettlebell Swings @ 24kg')
    })

    it('formats result when present', () => {
      const block = createDbAmrapBlock({
        result: createDbAmrapResult({ rounds: 5, partialReps: 12, actualDuration: 600_000 }),
      })

      const result = formatAmrapBlock(block)

      expect(result).toContain('**Result:** 5 rounds + 12 reps (10:00)')
    })
  })

  describe('formatEmomBlock', () => {
    it('formats block with duration and rotation', () => {
      const block = createDbEmomBlock({
        config: { minutes: 12, exerciseRotation: 'each-minute' },
      })

      const result = formatEmomBlock(block)

      expect(result).toContain('Duration: 12 min')
      expect(result).toContain('Rotation: each-minute')
    })

    it('formats result as completed minutes', () => {
      const block = createDbEmomBlock({
        config: { minutes: 12, exerciseRotation: 'each-minute' },
        result: createDbEmomResult({ completedMinutes: 10, missedMinutes: [8, 9] }),
      })

      const result = formatEmomBlock(block)

      expect(result).toContain('**Result:** 10/12 minutes completed')
    })
  })

  describe('formatTabataBlock', () => {
    it('formats block with rounds and timing', () => {
      const block = createDbTabataBlock({
        exercise: createDbBlockExercise({ name: 'Squat Jumps' }),
        config: { rounds: 8, workSeconds: 20, restSeconds: 10 },
      })

      const result = formatTabataBlock(block)

      expect(result).toContain('## Squat Jumps (Tabata)')
      expect(result).toContain('Rounds: 8')
      expect(result).toContain('Work/Rest: 20s/10s')
    })

    it('formats result as comma-separated reps', () => {
      const block = createDbTabataBlock({
        result: createDbTabataResult({ repsPerRound: [15, 14, 13, 12] }),
      })

      const result = formatTabataBlock(block)

      expect(result).toContain('**Result:** 15, 14, 13, 12 reps')
    })
  })

  describe('formatForTimeBlock', () => {
    it('formats block with time cap', () => {
      const block = createDbForTimeBlock({
        config: { timeCapSeconds: 900 },
      })

      const result = formatForTimeBlock(block)

      expect(result).toContain('Time cap: 15 min')
    })

    it('formats result with completion time and checkmark', () => {
      const block = createDbForTimeBlock({
        result: createDbForTimeResult({ completionTime: 512_000, completed: true }),
      })

      const result = formatForTimeBlock(block)

      expect(result).toContain('**Result:** 8:32')
      expect(result).toContain('\u{2713}') // checkmark
    })

    it('omits checkmark when not completed', () => {
      const block = createDbForTimeBlock({
        result: createDbForTimeResult({ completionTime: 900_000, completed: false }),
      })

      const result = formatForTimeBlock(block)

      expect(result).toContain('**Result:** 15:00')
      expect(result).not.toContain('\u{2713}')
    })
  })

  describe('formatCardioBlock', () => {
    it('formats activity name', () => {
      const block = createDbCardioBlock({
        config: { activity: 'running', targetDurationSeconds: null, targetDistanceMeters: null },
      })

      const result = formatCardioBlock(block)

      expect(result).toContain('## Running (Cardio)')
      expect(result).toContain('Activity: running')
    })

    it('formats result with all metrics', () => {
      const block = createDbCardioBlock({
        result: createDbCardioResult({
          actualDurationSeconds: 1800,
          distanceMeters: 5200,
          avgPaceSecondsPerKm: 346,
          calories: 420,
        }),
      })

      const result = formatCardioBlock(block)

      expect(result).toContain('- Duration: 30 min')
      expect(result).toContain('- Distance: 5.2 km')
      expect(result).toContain('- Pace: 5:46 /km')
      expect(result).toContain('- Calories: 420')
    })
  })

  describe('exportWorkoutAsMarkdown', () => {
    it('exports complete workout with all sections', () => {
      const workout = dbWorkoutBuilder()
        .withName('Push Day')
        .withNotes('Great session!')
        .withDuration(2700)
        .withTimestamps(
          new Date('2026-01-01T10:00:00Z').getTime(),
          new Date('2026-01-01T10:45:00Z').getTime(),
        )
        .withExerciseAndSets(
          [{ kg: '100', reps: '5', rir: '1' }],
          { name: 'Bench Press', equipment: 'barbell' },
        )
        .build()

      const result = exportWorkoutAsMarkdown(workout)

      // Frontmatter
      expect(result).toContain('format: workout-tracker')
      expect(result).toContain('version: 1')

      // Title
      expect(result).toContain('# Push Day')

      // Metadata
      expect(result).toContain('**Date:** January 1, 2026')
      expect(result).toContain('**Duration:** 45 min')
      expect(result).toContain('**Notes:** Great session!')

      // Block
      expect(result).toContain('## Bench Press (Strength)')
      expect(result).toContain('| 1 | 100kg | 5 | 1 |')
    })

    it('handles workout with multiple block types', () => {
      const workout = dbWorkoutBuilder()
        .withName('CrossFit WOD')
        .withBlock(createDbStrengthBlockWithSets(
          [{ kg: '60', reps: '5' }],
          { name: 'Deadlift', orderIndex: 0 },
        ))
        .withBlock(createDbAmrapBlock({
          exercises: [createDbBlockExercise({ name: 'Burpees', prescribedReps: 10 })],
          result: createDbAmrapResult({ rounds: 6, partialReps: 4 }),
          orderIndex: 1,
        }))
        .build()

      const result = exportWorkoutAsMarkdown(workout)

      expect(result).toContain('## Deadlift (Strength)')
      expect(result).toContain('## Burpees (AMRAP)')
      expect(result).toContain('**Result:** 6 rounds + 4 reps')
    })
  })
})
