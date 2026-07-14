import { describe, it, expect } from 'vitest'
import {
  parseWorkoutMarkdown,
  parseFrontmatter,
  parseMetadata,
  parseStrengthBlock,
  parseAmrapBlock,
  parseEmomBlock,
  parseTabataBlock,
  parseForTimeBlock,
  parseCardioBlock,
} from '@/features/workout/utils/markdownImport'
import { MARKDOWN_SPEC_FORMAT, MARKDOWN_SPEC_VERSION } from '@/features/workout/utils/markdownSpec'

describe('markdownImport', () => {
  describe('parseFrontmatter', () => {
    it('parses valid frontmatter', () => {
      const lines = [
        '---',
        `format: ${MARKDOWN_SPEC_FORMAT}`,
        `version: ${MARKDOWN_SPEC_VERSION}`,
        'exported: 2026-01-01T12:00:00Z',
        '---',
      ]

      const result = parseFrontmatter(lines)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.format).toBe(MARKDOWN_SPEC_FORMAT)
        expect(result.data.version).toBe(MARKDOWN_SPEC_VERSION)
        expect(result.data.exported).toBe('2026-01-01T12:00:00Z')
      }
    })

    it('rejects missing frontmatter delimiter', () => {
      const lines = ['# No frontmatter']

      const result = parseFrontmatter(lines)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors[0]?.message).toContain('Missing YAML frontmatter')
      }
    })

    it('rejects invalid format', () => {
      const lines = ['---', 'format: wrong-format', 'version: 1', '---']

      const result = parseFrontmatter(lines)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors[0]?.message).toContain('Invalid format')
      }
    })
  })

  describe('parseMetadata', () => {
    it('parses workout name from H1', () => {
      const lines = ['# Push Day', '**Date:** January 1, 2026']

      const result = parseMetadata(lines)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Push Day')
      }
    })

    it('parses duration in minutes', () => {
      const lines = ['# Workout', '**Duration:** 45 min']

      const result = parseMetadata(lines)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.durationSeconds).toBe(2700)
      }
    })

    it('parses notes', () => {
      const lines = ['# Workout', '**Notes:** Great session!']

      const result = parseMetadata(lines)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.notes).toBe('Great session!')
      }
    })
  })

  describe('parseStrengthBlock', () => {
    it('parses equipment', () => {
      const lines = ['Equipment: barbell', 'Target: 5 reps']

      const result = parseStrengthBlock('Bench Press', lines)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.equipment).toBe('barbell')
      }
    })

    it('parses markdown table into sets', () => {
      const lines = [
        'Equipment: barbell',
        '',
        '| Set | Weight | Reps | RIR |',
        '|-----|--------|------|-----|',
        '| 1   | 80kg   | 5    | 2   |',
        '| 2   | 90kg   | 5    | 1   |',
      ]

      const result = parseStrengthBlock('Bench Press', lines)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sets).toHaveLength(2)
        expect(result.data.sets[0]).toEqual({ kg: '80', reps: '5', rir: '2' })
        expect(result.data.sets[1]).toEqual({ kg: '90', reps: '5', rir: '1' })
      }
    })

    it('parses legacy rows with an empty RIR cell instead of dropping the set', () => {
      // Older exporters wrote an empty cell for an unfilled RIR
      const lines = [
        '| Set | Weight | Reps | RIR |',
        '|-----|--------|------|-----|',
        '| 1 | 80kg | 5 |  |',
      ]

      const result = parseStrengthBlock('Bench Press', lines)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sets).toHaveLength(1)
        expect(result.data.sets[0]).toEqual({ kg: '80', reps: '5', rir: '' })
      }
    })

    it('handles decimal weights', () => {
      const lines = [
        '| Set | Weight | Reps | RIR |',
        '|-----|--------|------|-----|',
        '| 1   | 12.5kg | 8    | 2   |',
      ]

      const result = parseStrengthBlock('Dumbbell Curl', lines)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sets[0]?.kg).toBe('12.5')
      }
    })
  })

  describe('parseAmrapBlock', () => {
    it('parses duration', () => {
      const lines = ['Duration: 10 min', '', '- 10 × Burpees']

      const result = parseAmrapBlock('AMRAP', lines)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.durationSeconds).toBe(600)
      }
    })

    it('parses exercises with reps and load', () => {
      const lines = ['Duration: 8 min', '', '- 15 × Kettlebell Swings @ 24kg', '- 10 × Push-ups']

      const result = parseAmrapBlock('Finisher', lines)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.exercises).toHaveLength(2)
        expect(result.data.exercises[0]).toEqual({
          name: 'Kettlebell Swings',
          prescribedReps: 15,
          load: '24kg',
        })
        expect(result.data.exercises[1]).toEqual({
          name: 'Push-ups',
          prescribedReps: 10,
          load: null,
        })
      }
    })

    it('parses result', () => {
      const lines = [
        'Duration: 10 min',
        '- 10 × Burpees',
        '',
        '**Result:** 5 rounds + 12 reps (10:00)',
      ]

      const result = parseAmrapBlock('AMRAP', lines)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.result).toEqual({
          rounds: 5,
          partialReps: 12,
          actualDuration: 600_000,
        })
      }
    })
  })

  describe('parseEmomBlock', () => {
    it('parses duration and rotation', () => {
      const lines = ['Duration: 12 min', 'Rotation: full-round']

      const result = parseEmomBlock('EMOM', lines)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.minutes).toBe(12)
        expect(result.data.rotation).toBe('full-round')
      }
    })

    it('parses result', () => {
      const lines = ['Duration: 12 min', '', '**Result:** 10/12 minutes completed']

      const result = parseEmomBlock('EMOM', lines)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.result?.completedMinutes).toBe(10)
      }
    })
  })

  describe('parseTabataBlock', () => {
    it('parses rounds and timing', () => {
      const lines = ['Rounds: 8', 'Work/Rest: 20s/10s']

      const result = parseTabataBlock('Squats', lines)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.rounds).toBe(8)
        expect(result.data.workSeconds).toBe(20)
        expect(result.data.restSeconds).toBe(10)
      }
    })

    it('parses result as comma-separated reps', () => {
      const lines = ['Rounds: 4', '', '**Result:** 15, 14, 13, 12 reps']

      const result = parseTabataBlock('Squats', lines)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.result?.repsPerRound).toEqual([15, 14, 13, 12])
      }
    })
  })

  describe('parseForTimeBlock', () => {
    it('parses time cap', () => {
      const lines = ['Time cap: 15 min']

      const result = parseForTimeBlock('Fran', lines)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.timeCapSeconds).toBe(900)
      }
    })

    it('parses result with checkmark', () => {
      const lines = ['', '**Result:** 8:32 \u{2713}']

      const result = parseForTimeBlock('Fran', lines)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.result?.completionTime).toBe(512_000)
        expect(result.data.result?.completed).toBe(true)
      }
    })
  })

  describe('parseCardioBlock', () => {
    it('parses activity', () => {
      const lines = ['Activity: cycling']

      const result = parseCardioBlock('Morning Ride', lines)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.activity).toBe('cycling')
      }
    })

    it('parses all result metrics', () => {
      const lines = [
        'Activity: running',
        '',
        '**Result:**',
        '- Duration: 30 min',
        '- Distance: 5.2 km',
        '- Pace: 5:46 /km',
        '- Calories: 420',
      ]

      const result = parseCardioBlock('Run', lines)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.result?.actualDurationSeconds).toBe(1800)
        expect(result.data.result?.distanceMeters).toBe(5200)
        expect(result.data.result?.avgPaceSecondsPerKm).toBe(346)
        expect(result.data.result?.calories).toBe(420)
      }
    })
  })

  describe('parseWorkoutMarkdown', () => {
    it('parses complete workout', () => {
      const markdown = `---
format: workout-tracker
version: 1
exported: 2026-01-01T12:00:00Z
---

# Push Day

**Date:** January 1, 2026
**Duration:** 45 min
**Notes:** Great session!

## Bench Press (Strength)
Equipment: barbell
Target: 5 reps

| Set | Weight | Reps | RIR |
|-----|--------|------|-----|
| 1   | 80kg   | 5    | 2   |
| 2   | 90kg   | 5    | 1   |

## Finisher (AMRAP)
Duration: 8 min

- 10 × Burpees
- 15 × Air Squats

**Result:** 4 rounds + 8 reps (8:00)`

      const result = parseWorkoutMarkdown(markdown)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.metadata.name).toBe('Push Day')
        expect(result.data.metadata.notes).toBe('Great session!')
        expect(result.data.blocks).toHaveLength(2)
        expect(result.data.blocks[0]?.kind).toBe('strength')
        expect(result.data.blocks[1]?.kind).toBe('amrap')
      }
    })

    it('rejects invalid markdown without frontmatter', () => {
      const markdown = '# Just a title'

      const result = parseWorkoutMarkdown(markdown)

      expect(result.success).toBe(false)
    })
  })
})
