import { describe, it, expect } from 'vitest'
import { exportWorkoutAsMarkdown } from '@/features/workout/utils/markdownExport'
import { parseWorkoutMarkdown } from '@/features/workout/utils/markdownImport'
import { dbWorkoutBuilder } from '@/__tests__/factories/dbWorkout.factory'
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

describe('markdown round-trip', () => {
  describe('strength block', () => {
    it('preserves exercise name', () => {
      const workout = dbWorkoutBuilder()
        .withName('Test Workout')
        .withStrengthBlock({ name: 'Barbell Squat' })
        .build()

      const markdown = exportWorkoutAsMarkdown(workout)
      const result = parseWorkoutMarkdown(markdown)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.blocks[0]?.kind).toBe('strength')
        if (result.data.blocks[0]?.kind === 'strength') {
          expect(result.data.blocks[0].name).toBe('Barbell Squat')
        }
      }
    })

    it('preserves set data', () => {
      const workout = dbWorkoutBuilder()
        .withName('Test')
        .withExerciseAndSets(
          [
            { kg: '100', reps: '5', rir: '2' },
            { kg: '110', reps: '4', rir: '1' },
          ],
          { name: 'Deadlift' },
        )
        .build()

      const markdown = exportWorkoutAsMarkdown(workout)
      const result = parseWorkoutMarkdown(markdown)

      expect(result.success).toBe(true)
      if (result.success && result.data.blocks[0]?.kind === 'strength') {
        const sets = result.data.blocks[0].sets
        expect(sets).toHaveLength(2)
        expect(sets[0]).toEqual({ kg: '100', reps: '5', rir: '2' })
        expect(sets[1]).toEqual({ kg: '110', reps: '4', rir: '1' })
      }
    })

    it('preserves equipment', () => {
      const workout = dbWorkoutBuilder()
        .withName('Test')
        .withStrengthBlock({ name: 'Curl', equipment: 'dumbbell' })
        .build()

      const markdown = exportWorkoutAsMarkdown(workout)
      const result = parseWorkoutMarkdown(markdown)

      expect(result.success).toBe(true)
      if (result.success && result.data.blocks[0]?.kind === 'strength') {
        expect(result.data.blocks[0].equipment).toBe('dumbbell')
      }
    })
  })

  describe('AMRAP block', () => {
    it('preserves exercises and result', () => {
      const workout = dbWorkoutBuilder()
        .withName('AMRAP Test')
        .withBlock(
          createDbAmrapBlock({
            config: { durationSeconds: 600 },
            exercises: [
              createDbBlockExercise({ name: 'Burpees', prescribedReps: 10, load: null }),
              createDbBlockExercise({ name: 'KB Swings', prescribedReps: 15, load: '24kg' }),
            ],
            result: createDbAmrapResult({ rounds: 5, partialReps: 12, actualDuration: 600_000 }),
          }),
        )
        .build()

      const markdown = exportWorkoutAsMarkdown(workout)
      const result = parseWorkoutMarkdown(markdown)

      expect(result.success).toBe(true)
      if (result.success && result.data.blocks[0]?.kind === 'amrap') {
        const block = result.data.blocks[0]
        expect(block.durationSeconds).toBe(600)
        expect(block.exercises).toHaveLength(2)
        expect(block.exercises[0]).toEqual({ name: 'Burpees', prescribedReps: 10, load: null })
        expect(block.exercises[1]).toEqual({ name: 'KB Swings', prescribedReps: 15, load: '24kg' })
        expect(block.result).toEqual({ rounds: 5, partialReps: 12, actualDuration: 600_000 })
      }
    })
  })

  describe('EMOM block', () => {
    it('preserves config and result', () => {
      const workout = dbWorkoutBuilder()
        .withName('EMOM Test')
        .withBlock(
          createDbEmomBlock({
            config: { minutes: 12, exerciseRotation: 'full-round' },
            exercises: [createDbBlockExercise({ name: 'Thrusters', prescribedReps: 8 })],
            result: createDbEmomResult({ completedMinutes: 10, missedMinutes: [] }),
          }),
        )
        .build()

      const markdown = exportWorkoutAsMarkdown(workout)
      const result = parseWorkoutMarkdown(markdown)

      expect(result.success).toBe(true)
      if (result.success && result.data.blocks[0]?.kind === 'emom') {
        const block = result.data.blocks[0]
        expect(block.minutes).toBe(12)
        expect(block.rotation).toBe('full-round')
        expect(block.result?.completedMinutes).toBe(10)
      }
    })
  })

  describe('Tabata block', () => {
    it('preserves timing and reps per round', () => {
      const workout = dbWorkoutBuilder()
        .withName('Tabata Test')
        .withBlock(
          createDbTabataBlock({
            config: { rounds: 8, workSeconds: 20, restSeconds: 10 },
            exercise: createDbBlockExercise({ name: 'Air Squats', prescribedReps: 0 }),
            result: createDbTabataResult({ repsPerRound: [15, 14, 13, 12, 11, 10, 9, 8] }),
          }),
        )
        .build()

      const markdown = exportWorkoutAsMarkdown(workout)
      const result = parseWorkoutMarkdown(markdown)

      expect(result.success).toBe(true)
      if (result.success && result.data.blocks[0]?.kind === 'tabata') {
        const block = result.data.blocks[0]
        expect(block.rounds).toBe(8)
        expect(block.workSeconds).toBe(20)
        expect(block.restSeconds).toBe(10)
        expect(block.result?.repsPerRound).toEqual([15, 14, 13, 12, 11, 10, 9, 8])
      }
    })
  })

  describe('ForTime block', () => {
    it('preserves time cap and completion time', () => {
      const workout = dbWorkoutBuilder()
        .withName('ForTime Test')
        .withBlock(
          createDbForTimeBlock({
            config: { timeCapSeconds: 900 },
            exercises: [createDbBlockExercise({ name: 'Thrusters', prescribedReps: 21 })],
            result: createDbForTimeResult({ completionTime: 512_000, completed: true }),
          }),
        )
        .build()

      const markdown = exportWorkoutAsMarkdown(workout)
      const result = parseWorkoutMarkdown(markdown)

      expect(result.success).toBe(true)
      if (result.success && result.data.blocks[0]?.kind === 'fortime') {
        const block = result.data.blocks[0]
        expect(block.timeCapSeconds).toBe(900)
        expect(block.result?.completionTime).toBe(512_000)
        expect(block.result?.completed).toBe(true)
      }
    })
  })

  describe('Cardio block', () => {
    it('preserves activity and result metrics', () => {
      const workout = dbWorkoutBuilder()
        .withName('Cardio Test')
        .withBlock(
          createDbCardioBlock({
            config: { activity: 'running', targetDurationSeconds: null, targetDistanceMeters: null },
            result: createDbCardioResult({
              actualDurationSeconds: 1800,
              distanceMeters: 5200,
              avgPaceSecondsPerKm: 346,
              calories: 420,
              notes: null,
            }),
          }),
        )
        .build()

      const markdown = exportWorkoutAsMarkdown(workout)
      const result = parseWorkoutMarkdown(markdown)

      expect(result.success).toBe(true)
      if (result.success && result.data.blocks[0]?.kind === 'cardio') {
        const block = result.data.blocks[0]
        expect(block.activity).toBe('running')
        expect(block.result?.actualDurationSeconds).toBe(1800)
        expect(block.result?.distanceMeters).toBe(5200)
        expect(block.result?.avgPaceSecondsPerKm).toBe(346)
        expect(block.result?.calories).toBe(420)
      }
    })
  })

  describe('mixed workout', () => {
    it('preserves multiple block types in order', () => {
      const workout = dbWorkoutBuilder()
        .withName('Mixed Workout')
        .withExerciseAndSets([{ kg: '60', reps: '5' }], { name: 'Deadlift', orderIndex: 0 })
        .withBlock(
          createDbAmrapBlock({
            exercises: [createDbBlockExercise({ name: 'Burpees', prescribedReps: 10 })],
            result: createDbAmrapResult({ rounds: 6, partialReps: 4 }),
            orderIndex: 1,
          }),
        )
        .withBlock(
          createDbCardioBlock({
            config: { activity: 'rowing', targetDurationSeconds: null, targetDistanceMeters: null },
            result: createDbCardioResult({ actualDurationSeconds: 600 }),
            orderIndex: 2,
          }),
        )
        .build()

      const markdown = exportWorkoutAsMarkdown(workout)
      const result = parseWorkoutMarkdown(markdown)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.blocks).toHaveLength(3)
        expect(result.data.blocks[0]?.kind).toBe('strength')
        expect(result.data.blocks[1]?.kind).toBe('amrap')
        expect(result.data.blocks[2]?.kind).toBe('cardio')
      }
    })
  })

  describe('metadata', () => {
    it('preserves workout name', () => {
      const workout = dbWorkoutBuilder()
        .withName('My Custom Workout Name')
        .withStrengthBlock()
        .build()

      const markdown = exportWorkoutAsMarkdown(workout)
      const result = parseWorkoutMarkdown(markdown)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.metadata.name).toBe('My Custom Workout Name')
      }
    })

    it('preserves notes', () => {
      const workout = dbWorkoutBuilder()
        .withName('Test')
        .withNotes('Felt strong today!')
        .withStrengthBlock()
        .build()

      const markdown = exportWorkoutAsMarkdown(workout)
      const result = parseWorkoutMarkdown(markdown)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.metadata.notes).toBe('Felt strong today!')
      }
    })

    it('preserves duration', () => {
      const workout = dbWorkoutBuilder()
        .withName('Test')
        .withDuration(2700) // 45 min
        .withStrengthBlock()
        .build()

      const markdown = exportWorkoutAsMarkdown(workout)
      const result = parseWorkoutMarkdown(markdown)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.metadata.durationSeconds).toBe(2700)
      }
    })
  })
})
