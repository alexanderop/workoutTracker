import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { useTimerWorkoutLogger } from '@/features/timers/composables/useTimerWorkoutLogger'
import { db } from '@/db'
import type {
  AmrapBlock,
  EmomBlock,
  TabataBlock,
  ForTimeBlock,
  AmrapResult,
  EmomResult,
  TabataResult,
  ForTimeResult,
} from '@/types/blocks'
import { resetDatabase } from '../helpers/resetDatabase'

describe('useTimerWorkoutLogger', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  afterEach(async () => {
    await resetDatabase()
  })

  describe('initial state', () => {
    it('starts with isLogged false', () => {
      const { isLogged } = useTimerWorkoutLogger()

      expect(isLogged.value).toBe(false)
    })

    it('starts with isSaving false', () => {
      const { isSaving } = useTimerWorkoutLogger()

      expect(isSaving.value).toBe(false)
    })
  })

  describe('logAmrap()', () => {
    it('saves AMRAP workout to database', async () => {
      const { logAmrap } = useTimerWorkoutLogger()

      const block: AmrapBlock = {
        kind: 'amrap',
        config: { durationSeconds: 300 },
        exercises: [],
      }

      const result: AmrapResult = {
        rounds: 5,
        partialReps: 10,
        actualDuration: 300,
      }

      const startedAt = Date.now() - 300000
      const completedAt = Date.now()

      const workoutId = await logAmrap(block, result, startedAt, completedAt)

      expect(workoutId).toBeTruthy()
      expect(await db.workouts.count()).toBe(1)

      const workout = await db.workouts.toArray()
      expect(workout[0]?.name).toMatch(/amrap/i)
      expect(workout[0]?.blocks).toHaveLength(1)
      expect(workout[0]?.blocks[0]?.kind).toBe('amrap')
    })

    it('sets isLogged to true after successful save', async () => {
      const { logAmrap, isLogged } = useTimerWorkoutLogger()

      const block: AmrapBlock = {
        kind: 'amrap',
        config: { durationSeconds: 300 },
        exercises: [],
      }

      const result: AmrapResult = {
        rounds: 5,
        partialReps: 10,
        actualDuration: 300,
      }

      await logAmrap(block, result, Date.now() - 300000, Date.now())

      expect(isLogged.value).toBe(true)
    })

    it('saves AMRAP result with correct rounds and partialReps', async () => {
      const { logAmrap } = useTimerWorkoutLogger()

      const block: AmrapBlock = {
        kind: 'amrap',
        config: { durationSeconds: 600 },
        exercises: [],
      }

      const result: AmrapResult = {
        rounds: 8,
        partialReps: 15,
        actualDuration: 600,
      }

      await logAmrap(block, result, Date.now() - 600000, Date.now())

      const workouts = await db.workouts.toArray()
      const savedBlock = workouts[0]?.blocks[0]

      expect(savedBlock?.kind).toBe('amrap')
      if (savedBlock?.kind === 'amrap') {
        expect(savedBlock.result?.rounds).toBe(8)
        expect(savedBlock.result?.partialReps).toBe(15)
        expect(savedBlock.config.durationSeconds).toBe(600)
      }
    })

    it('generates correct workout name with duration', async () => {
      const { logAmrap } = useTimerWorkoutLogger()

      const block: AmrapBlock = {
        kind: 'amrap',
        config: { durationSeconds: 600 },
        exercises: [],
      }

      const result: AmrapResult = {
        rounds: 3,
        partialReps: 5,
        actualDuration: 600,
      }

      await logAmrap(block, result, Date.now(), Date.now())

      const workouts = await db.workouts.toArray()
      expect(workouts[0]?.name).toMatch(/10.*min.*amrap/i)
    })

    it('calculates duration correctly from timestamps', async () => {
      const { logAmrap } = useTimerWorkoutLogger()

      const block: AmrapBlock = {
        kind: 'amrap',
        config: { durationSeconds: 300 },
        exercises: [],
      }

      const result: AmrapResult = {
        rounds: 5,
        partialReps: 0,
        actualDuration: 300,
      }

      const startedAt = 1000000000000
      const completedAt = 1000000300500 // 300.5 seconds later

      await logAmrap(block, result, startedAt, completedAt)

      const workouts = await db.workouts.toArray()
      expect(workouts[0]?.durationSeconds).toBe(300) // Floors to 300
      expect(workouts[0]?.startedAt).toBe(startedAt)
      expect(workouts[0]?.completedAt).toBe(completedAt)
    })

    it('prevents duplicate saves when called multiple times', async () => {
      const { logAmrap, isLogged } = useTimerWorkoutLogger()

      const block: AmrapBlock = {
        kind: 'amrap',
        config: { durationSeconds: 300 },
        exercises: [],
      }

      const result: AmrapResult = {
        rounds: 5,
        partialReps: 10,
        actualDuration: 300,
      }

      const startedAt = Date.now()
      const completedAt = Date.now()

      const firstId = await logAmrap(block, result, startedAt, completedAt)
      expect(firstId).toBeTruthy()
      expect(isLogged.value).toBe(true)

      const secondId = await logAmrap(block, result, startedAt, completedAt)
      expect(secondId).toBeNull()
      expect(await db.workouts.count()).toBe(1)
    })

    it('does not save when isSaving is true', async () => {
      const { logAmrap, isSaving } = useTimerWorkoutLogger()

      const block: AmrapBlock = {
        kind: 'amrap',
        config: { durationSeconds: 300 },
        exercises: [],
      }

      const result: AmrapResult = {
        rounds: 5,
        partialReps: 10,
        actualDuration: 300,
      }

      // Manually set isSaving (simulating concurrent call)
      isSaving.value = true

      const workoutId = await logAmrap(block, result, Date.now(), Date.now())

      expect(workoutId).toBeNull()
      expect(await db.workouts.count()).toBe(0)
    })
  })

  describe('logEmom()', () => {
    it('saves EMOM workout to database', async () => {
      const { logEmom } = useTimerWorkoutLogger()

      const block: EmomBlock = {
        kind: 'emom',
        config: {
          minutes: 10,
          exerciseRotation: 'each-minute',
        },
        exercises: [],
      }

      const result: EmomResult = {
        completedMinutes: 10,
        missedMinutes: [],
      }

      const workoutId = await logEmom(block, result, Date.now() - 600000, Date.now())

      expect(workoutId).toBeTruthy()
      expect(await db.workouts.count()).toBe(1)

      const workouts = await db.workouts.toArray()
      expect(workouts[0]?.blocks[0]?.kind).toBe('emom')
    })

    it('saves EMOM result with completed and missed minutes', async () => {
      const { logEmom } = useTimerWorkoutLogger()

      const block: EmomBlock = {
        kind: 'emom',
        config: {
          minutes: 12,
          exerciseRotation: 'full-round',
        },
        exercises: [],
      }

      const result: EmomResult = {
        completedMinutes: 10,
        missedMinutes: [5, 11],
      }

      await logEmom(block, result, Date.now(), Date.now())

      const workouts = await db.workouts.toArray()
      const savedBlock = workouts[0]?.blocks[0]

      expect(savedBlock?.kind).toBe('emom')
      if (savedBlock?.kind === 'emom') {
        expect(savedBlock.result?.completedMinutes).toBe(10)
        expect(savedBlock.result?.missedMinutes).toEqual([5, 11])
        expect(savedBlock.config.minutes).toBe(12)
        expect(savedBlock.config.exerciseRotation).toBe('full-round')
      }
    })

    it('generates correct workout name for EMOM', async () => {
      const { logEmom } = useTimerWorkoutLogger()

      const block: EmomBlock = {
        kind: 'emom',
        config: {
          minutes: 15,
          exerciseRotation: 'each-minute',
        },
        exercises: [],
      }

      const result: EmomResult = {
        completedMinutes: 15,
        missedMinutes: [],
      }

      await logEmom(block, result, Date.now(), Date.now())

      const workouts = await db.workouts.toArray()
      expect(workouts[0]?.name).toMatch(/15.*min.*emom/i)
    })

    it('sets isLogged to true after successful EMOM save', async () => {
      const { logEmom, isLogged } = useTimerWorkoutLogger()

      const block: EmomBlock = {
        kind: 'emom',
        config: { minutes: 8, exerciseRotation: 'each-minute' },
        exercises: [],
      }

      const result: EmomResult = {
        completedMinutes: 8,
        missedMinutes: [],
      }

      await logEmom(block, result, Date.now(), Date.now())

      expect(isLogged.value).toBe(true)
    })

    it('handles EMOM with all minutes missed', async () => {
      const { logEmom } = useTimerWorkoutLogger()

      const block: EmomBlock = {
        kind: 'emom',
        config: { minutes: 5, exerciseRotation: 'each-minute' },
        exercises: [],
      }

      const result: EmomResult = {
        completedMinutes: 0,
        missedMinutes: [1, 2, 3, 4, 5],
      }

      await logEmom(block, result, Date.now(), Date.now())

      const workouts = await db.workouts.toArray()
      const savedBlock = workouts[0]?.blocks[0]

      if (savedBlock?.kind === 'emom') {
        expect(savedBlock.result?.completedMinutes).toBe(0)
        expect(savedBlock.result?.missedMinutes).toHaveLength(5)
      }
    })
  })

  describe('logTabata()', () => {
    it('saves Tabata workout to database', async () => {
      const { logTabata } = useTimerWorkoutLogger()

      const block: TabataBlock = {
        kind: 'tabata',
        config: {
          rounds: 8,
          workSeconds: 20,
          restSeconds: 10,
        },
        exercise: {
          id: 'test-1',
          name: 'Burpees',
          prescribedReps: 0,
          load: null,
          image: null,
        },
      }

      const result: TabataResult = {
        repsPerRound: [15, 14, 13, 12, 11, 10, 10, 9],
      }

      const workoutId = await logTabata(block, result, Date.now(), Date.now())

      expect(workoutId).toBeTruthy()
      expect(await db.workouts.count()).toBe(1)

      const workouts = await db.workouts.toArray()
      expect(workouts[0]?.blocks[0]?.kind).toBe('tabata')
    })

    it('saves Tabata result with reps per round', async () => {
      const { logTabata } = useTimerWorkoutLogger()

      const block: TabataBlock = {
        kind: 'tabata',
        config: {
          rounds: 4,
          workSeconds: 30,
          restSeconds: 15,
        },
        exercise: {
          id: 'test-2',
          name: 'Jump Squats',
          prescribedReps: 0,
          load: 'bodyweight',
          image: null,
        },
      }

      const result: TabataResult = {
        repsPerRound: [20, 18, 16, 14],
      }

      await logTabata(block, result, Date.now(), Date.now())

      const workouts = await db.workouts.toArray()
      const savedBlock = workouts[0]?.blocks[0]

      expect(savedBlock?.kind).toBe('tabata')
      if (savedBlock?.kind === 'tabata') {
        expect(savedBlock.result?.repsPerRound).toEqual([20, 18, 16, 14])
        expect(savedBlock.config.rounds).toBe(4)
        expect(savedBlock.config.workSeconds).toBe(30)
        expect(savedBlock.config.restSeconds).toBe(15)
      }
    })

    it('generates correct workout name for Tabata', async () => {
      const { logTabata } = useTimerWorkoutLogger()

      const block: TabataBlock = {
        kind: 'tabata',
        config: {
          rounds: 8,
          workSeconds: 20,
          restSeconds: 10,
        },
        exercise: {
          id: 'test-3',
          name: 'Push-ups',
          prescribedReps: 0,
          load: null,
          image: null,
        },
      }

      const result: TabataResult = {
        repsPerRound: [12, 11, 10, 10, 9, 8, 8, 7],
      }

      await logTabata(block, result, Date.now(), Date.now())

      const workouts = await db.workouts.toArray()
      expect(workouts[0]?.name).toMatch(/tabata.*8.*20.*10/i)
    })

    it('sets isLogged to true after successful Tabata save', async () => {
      const { logTabata, isLogged } = useTimerWorkoutLogger()

      const block: TabataBlock = {
        kind: 'tabata',
        config: { rounds: 6, workSeconds: 25, restSeconds: 15 },
        exercise: {
          id: 'test-4',
          name: 'Mountain Climbers',
          prescribedReps: 0,
          load: null,
          image: null,
        },
      }

      const result: TabataResult = {
        repsPerRound: [30, 28, 26, 25, 23, 22],
      }

      await logTabata(block, result, Date.now(), Date.now())

      expect(isLogged.value).toBe(true)
    })

    it('saves Tabata with placeholder exercise for standalone timer', async () => {
      const { logTabata } = useTimerWorkoutLogger()

      const block: TabataBlock = {
        kind: 'tabata',
        config: { rounds: 4, workSeconds: 20, restSeconds: 10 },
        exercise: {
          id: 'standalone',
          name: 'Conditioning',
          prescribedReps: 0,
          load: null,
          image: null,
        },
      }

      const result: TabataResult = {
        repsPerRound: [10, 9, 8, 7],
      }

      await logTabata(block, result, Date.now(), Date.now())

      const workouts = await db.workouts.toArray()
      const savedBlock = workouts[0]?.blocks[0]

      if (savedBlock?.kind === 'tabata') {
        expect(savedBlock.exercise.name).toBe('Conditioning')
      }
    })
  })

  describe('logForTime()', () => {
    it('saves For Time workout to database', async () => {
      const { logForTime } = useTimerWorkoutLogger()

      const block: ForTimeBlock = {
        kind: 'fortime',
        config: {
          timeCapSeconds: 1200,
        },
        exercises: [],
      }

      const result: ForTimeResult = {
        completionTime: 720,
        completed: true,
      }

      const workoutId = await logForTime(block, result, Date.now(), Date.now())

      expect(workoutId).toBeTruthy()
      expect(await db.workouts.count()).toBe(1)

      const workouts = await db.workouts.toArray()
      expect(workouts[0]?.blocks[0]?.kind).toBe('fortime')
    })

    it('saves For Time result with completion data', async () => {
      const { logForTime } = useTimerWorkoutLogger()

      const block: ForTimeBlock = {
        kind: 'fortime',
        config: {
          timeCapSeconds: 600,
        },
        exercises: [],
      }

      const result: ForTimeResult = {
        completionTime: 480,
        completed: true,
        splitTimes: [120, 240, 360, 480],
      }

      await logForTime(block, result, Date.now(), Date.now())

      const workouts = await db.workouts.toArray()
      const savedBlock = workouts[0]?.blocks[0]

      expect(savedBlock?.kind).toBe('fortime')
      if (savedBlock?.kind === 'fortime') {
        expect(savedBlock.result?.completionTime).toBe(480)
        expect(savedBlock.result?.completed).toBe(true)
        expect(savedBlock.result?.splitTimes).toEqual([120, 240, 360, 480])
        expect(savedBlock.config.timeCapSeconds).toBe(600)
      }
    })

    it('saves For Time workout that was not completed within time cap', async () => {
      const { logForTime } = useTimerWorkoutLogger()

      const block: ForTimeBlock = {
        kind: 'fortime',
        config: {
          timeCapSeconds: 300,
        },
        exercises: [],
      }

      const result: ForTimeResult = {
        completionTime: 300,
        completed: false,
      }

      await logForTime(block, result, Date.now(), Date.now())

      const workouts = await db.workouts.toArray()
      const savedBlock = workouts[0]?.blocks[0]

      if (savedBlock?.kind === 'fortime') {
        expect(savedBlock.result?.completed).toBe(false)
        expect(savedBlock.result?.completionTime).toBe(300)
      }
    })

    it('generates correct workout name for For Time with time cap', async () => {
      const { logForTime } = useTimerWorkoutLogger()

      const block: ForTimeBlock = {
        kind: 'fortime',
        config: {
          timeCapSeconds: 900,
        },
        exercises: [],
      }

      const result: ForTimeResult = {
        completionTime: 600,
        completed: true,
      }

      await logForTime(block, result, Date.now(), Date.now())

      const workouts = await db.workouts.toArray()
      expect(workouts[0]?.name).toMatch(/for time.*15.*min.*cap/i)
    })

    it('generates correct workout name for For Time without time cap', async () => {
      const { logForTime } = useTimerWorkoutLogger()

      const block: ForTimeBlock = {
        kind: 'fortime',
        config: {
          timeCapSeconds: null,
        },
        exercises: [],
      }

      const result: ForTimeResult = {
        completionTime: 450,
        completed: true,
      }

      await logForTime(block, result, Date.now(), Date.now())

      const workouts = await db.workouts.toArray()
      expect(workouts[0]?.name).toMatch(/for time/i)
      expect(workouts[0]?.name).not.toMatch(/cap/i)
    })

    it('sets isLogged to true after successful For Time save', async () => {
      const { logForTime, isLogged } = useTimerWorkoutLogger()

      const block: ForTimeBlock = {
        kind: 'fortime',
        config: { timeCapSeconds: 600 },
        exercises: [],
      }

      const result: ForTimeResult = {
        completionTime: 420,
        completed: true,
      }

      await logForTime(block, result, Date.now(), Date.now())

      expect(isLogged.value).toBe(true)
    })
  })

  describe('reset()', () => {
    it('resets isLogged to false', async () => {
      const { logAmrap, isLogged, reset } = useTimerWorkoutLogger()

      const block: AmrapBlock = {
        kind: 'amrap',
        config: { durationSeconds: 300 },
        exercises: [],
      }

      const result: AmrapResult = {
        rounds: 5,
        partialReps: 10,
        actualDuration: 300,
      }

      await logAmrap(block, result, Date.now(), Date.now())
      expect(isLogged.value).toBe(true)

      reset()

      expect(isLogged.value).toBe(false)
    })

    it('allows saving again after reset', async () => {
      const { logAmrap, isLogged, reset } = useTimerWorkoutLogger()

      const block: AmrapBlock = {
        kind: 'amrap',
        config: { durationSeconds: 300 },
        exercises: [],
      }

      const result: AmrapResult = {
        rounds: 5,
        partialReps: 10,
        actualDuration: 300,
      }

      // First save
      await logAmrap(block, result, Date.now(), Date.now())
      expect(isLogged.value).toBe(true)

      reset()

      // Second save should work
      const secondId = await logAmrap(block, result, Date.now(), Date.now())
      expect(secondId).toBeTruthy()
      expect(await db.workouts.count()).toBe(2)
    })

    it('does not affect database when called', async () => {
      const { logAmrap, reset } = useTimerWorkoutLogger()

      const block: AmrapBlock = {
        kind: 'amrap',
        config: { durationSeconds: 300 },
        exercises: [],
      }

      const result: AmrapResult = {
        rounds: 5,
        partialReps: 10,
        actualDuration: 300,
      }

      await logAmrap(block, result, Date.now(), Date.now())
      expect(await db.workouts.count()).toBe(1)

      reset()

      expect(await db.workouts.count()).toBe(1)
    })
  })

  describe('error handling', () => {
    it('returns null and does not set isLogged on database error', async () => {
      const { logAmrap, isLogged } = useTimerWorkoutLogger()

      // Spy on the repository to simulate error
      const originalAdd = db.workouts.add.bind(db.workouts)
      vi.spyOn(db.workouts, 'add').mockRejectedValueOnce(new Error('Database error'))

      const block: AmrapBlock = {
        kind: 'amrap',
        config: { durationSeconds: 300 },
        exercises: [],
      }

      const result: AmrapResult = {
        rounds: 5,
        partialReps: 10,
        actualDuration: 300,
      }

      const workoutId = await logAmrap(block, result, Date.now(), Date.now())

      expect(workoutId).toBeNull()
      expect(isLogged.value).toBe(false)

      // Restore original implementation
      vi.mocked(db.workouts.add).mockImplementation(originalAdd)
    })

    it('sets isSaving back to false even when save fails', async () => {
      const { logAmrap, isSaving } = useTimerWorkoutLogger()

      vi.spyOn(db.workouts, 'add').mockRejectedValueOnce(new Error('Database error'))

      const block: AmrapBlock = {
        kind: 'amrap',
        config: { durationSeconds: 300 },
        exercises: [],
      }

      const result: AmrapResult = {
        rounds: 5,
        partialReps: 10,
        actualDuration: 300,
      }

      expect(isSaving.value).toBe(false)
      await logAmrap(block, result, Date.now(), Date.now())
      expect(isSaving.value).toBe(false)

      vi.restoreAllMocks()
    })
  })

  describe('concurrent operations', () => {
    it('handles multiple composable instances independently', async () => {
      const logger1 = useTimerWorkoutLogger()
      const logger2 = useTimerWorkoutLogger()

      const block: AmrapBlock = {
        kind: 'amrap',
        config: { durationSeconds: 300 },
        exercises: [],
      }

      const result: AmrapResult = {
        rounds: 5,
        partialReps: 10,
        actualDuration: 300,
      }

      await logger1.logAmrap(block, result, Date.now(), Date.now())

      expect(logger1.isLogged.value).toBe(true)
      expect(logger2.isLogged.value).toBe(false)

      await logger2.logAmrap(block, result, Date.now(), Date.now())

      expect(logger1.isLogged.value).toBe(true)
      expect(logger2.isLogged.value).toBe(true)
      expect(await db.workouts.count()).toBe(2)
    })
  })

  describe('workout metadata', () => {
    it('saves workout with empty notes', async () => {
      const { logAmrap } = useTimerWorkoutLogger()

      const block: AmrapBlock = {
        kind: 'amrap',
        config: { durationSeconds: 300 },
        exercises: [],
      }

      const result: AmrapResult = {
        rounds: 5,
        partialReps: 10,
        actualDuration: 300,
      }

      await logAmrap(block, result, Date.now(), Date.now())

      const workouts = await db.workouts.toArray()
      expect(workouts[0]?.notes).toBe('')
    })

    it('saves workout with null benchmarkId', async () => {
      const { logAmrap } = useTimerWorkoutLogger()

      const block: AmrapBlock = {
        kind: 'amrap',
        config: { durationSeconds: 300 },
        exercises: [],
      }

      const result: AmrapResult = {
        rounds: 5,
        partialReps: 10,
        actualDuration: 300,
      }

      await logAmrap(block, result, Date.now(), Date.now())

      const workouts = await db.workouts.toArray()
      expect(workouts[0]?.benchmarkId).toBeNull()
    })

    it('generates unique IDs for each workout', async () => {
      const { logAmrap } = useTimerWorkoutLogger()

      const block: AmrapBlock = {
        kind: 'amrap',
        config: { durationSeconds: 300 },
        exercises: [],
      }

      const result: AmrapResult = {
        rounds: 5,
        partialReps: 10,
        actualDuration: 300,
      }

      await logAmrap(block, result, Date.now(), Date.now())

      const logger2 = useTimerWorkoutLogger()
      await logger2.logAmrap(block, result, Date.now(), Date.now())

      const workouts = await db.workouts.toArray()
      expect(workouts[0]?.id).toBeTruthy()
      expect(workouts[1]?.id).toBeTruthy()
      expect(workouts[0]?.id).not.toBe(workouts[1]?.id)
    })

    it('generates unique block IDs', async () => {
      const { logAmrap } = useTimerWorkoutLogger()

      const block: AmrapBlock = {
        kind: 'amrap',
        config: { durationSeconds: 300 },
        exercises: [],
      }

      const result: AmrapResult = {
        rounds: 5,
        partialReps: 10,
        actualDuration: 300,
      }

      await logAmrap(block, result, Date.now(), Date.now())

      const workouts = await db.workouts.toArray()
      const blockId = workouts[0]?.blocks[0]?.id

      expect(blockId).toBeTruthy()
      expect(typeof blockId).toBe('string')
    })
  })
})