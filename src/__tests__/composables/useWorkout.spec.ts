import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  getWorkoutRef,
  resetWorkout,
  restoreWorkout,
  useWorkout,
} from '@/features/workout/composables/useWorkout'
import { isStrengthBlock, isTimedBlock } from '@/types/blocks'
import type { StrengthBlock } from '@/types/blocks'
import { workoutBuilder } from '../factories'

function strengthBlockAt(index: number): StrengthBlock {
  const block = getWorkoutRef().value.blocks[index]
  if (!block || !isStrengthBlock(block)) {
    throw new Error(`Expected strength block at index ${index}`)
  }
  return block
}

describe('useWorkout', () => {
  beforeEach(resetWorkout)
  afterEach(resetWorkout)

  describe('completeSet', () => {
    it('toggles a completed set back to active', () => {
      restoreWorkout(
        workoutBuilder()
          .withExerciseAndSets([{ kg: '100', reps: '8', rir: '2', status: 'completed' }])
          .build(),
      )
      const { completeSet } = useWorkout()
      const set = strengthBlockAt(0).sets[0]
      if (!set) throw new Error('Expected a set')

      const result = completeSet(set)

      expect(result).toEqual({ kind: 'uncompleted' })
      expect(strengthBlockAt(0).sets[0]?.status).toBe('active')
    })

    it('rejects a set with missing values', () => {
      restoreWorkout(
        workoutBuilder()
          .withExerciseAndSets([{ kg: '', reps: '', rir: '', status: 'active' }])
          .build(),
      )
      const { completeSet } = useWorkout()
      const set = strengthBlockAt(0).sets[0]
      if (!set) throw new Error('Expected a set')

      const result = completeSet(set)

      expect(result).toEqual({ kind: 'uncompleted' })
      expect(strengthBlockAt(0).sets[0]?.status).toBe('active')
    })

    it('activates the next set and prefills it from the completed one', () => {
      restoreWorkout(
        workoutBuilder()
          .withExerciseAndSets([
            { kg: '100', reps: '8', rir: '2', status: 'active' },
            { kg: '', reps: '', rir: '', status: 'planned' },
          ])
          .build(),
      )
      const { completeSet } = useWorkout()
      const set = strengthBlockAt(0).sets[0]
      if (!set) throw new Error('Expected a set')

      const result = completeSet(set)

      expect(result).toMatchObject({ kind: 'completed', nextAction: 'next-set' })
      const nextSet = strengthBlockAt(0).sets[1]
      expect(nextSet).toMatchObject({ status: 'active', kg: '100', reps: '8', rir: '2' })
    })

    it('advances to the next block after the last set of a block', () => {
      restoreWorkout(
        workoutBuilder()
          .withExerciseAndSets([{ kg: '100', reps: '8', rir: '2', status: 'active' }])
          .withExerciseAndSets([{ kg: '', reps: '', rir: '', status: 'planned' }])
          .build(),
      )
      const { completeSet } = useWorkout()
      const set = strengthBlockAt(0).sets[0]
      if (!set) throw new Error('Expected a set')

      const result = completeSet(set)

      expect(result).toEqual({ kind: 'completed', nextAction: 'next-block', blockIndex: 1 })
      expect(getWorkoutRef().value.selectedBlockIndex).toBe(1)
      expect(strengthBlockAt(1).sets[0]?.status).toBe('active')
    })

    it('returns to an earlier skipped block after finishing the last one', () => {
      restoreWorkout(
        workoutBuilder()
          .withExerciseAndSets([{ kg: '', reps: '', rir: '', status: 'planned' }])
          .withExerciseAndSets([{ kg: '80', reps: '10', rir: '1', status: 'active' }])
          .selectBlock(1)
          .build(),
      )
      const { completeSet } = useWorkout()
      const set = strengthBlockAt(1).sets[0]
      if (!set) throw new Error('Expected a set')

      const result = completeSet(set)

      expect(result).toEqual({ kind: 'completed', nextAction: 'next-block', blockIndex: 0 })
      expect(getWorkoutRef().value.selectedBlockIndex).toBe(0)
    })

    it('reports workout-complete when every set is done', () => {
      restoreWorkout(
        workoutBuilder()
          .withExerciseAndSets([
            { kg: '100', reps: '8', rir: '2', status: 'completed' },
            { kg: '100', reps: '8', rir: '2', status: 'active' },
          ])
          .build(),
      )
      const { completeSet } = useWorkout()
      const set = strengthBlockAt(0).sets[1]
      if (!set) throw new Error('Expected a set')

      const result = completeSet(set)

      expect(result).toEqual({ kind: 'completed', nextAction: 'workout-complete' })
    })
  })

  describe('set manipulation', () => {
    it('duplicates a set right after the original with planned status', () => {
      restoreWorkout(
        workoutBuilder()
          .withExerciseAndSets([
            { kg: '100', reps: '8', rir: '2', status: 'completed' },
            { kg: '110', reps: '5', rir: '1', status: 'planned' },
          ])
          .build(),
      )
      const { duplicateSet } = useWorkout()
      const originalId = strengthBlockAt(0).sets[0]?.id
      if (originalId === undefined) throw new Error('Expected a set')

      duplicateSet(0, originalId)

      const sets = strengthBlockAt(0).sets
      expect(sets).toHaveLength(3)
      expect(sets[1]).toMatchObject({ kg: '100', reps: '8', rir: '2', status: 'planned' })
      expect(sets[1]?.id).not.toBe(originalId)
    })

    it('shifts the active set index when duplicating above the active set', () => {
      restoreWorkout(
        workoutBuilder()
          .withExerciseAndSets([
            { kg: '100', reps: '8', rir: '2', status: 'completed' },
            { kg: '100', reps: '8', rir: '2', status: 'active' },
          ])
          .build(),
      )
      getWorkoutRef().value = { ...getWorkoutRef().value, activeSetIndex: 1 }
      const { duplicateSet } = useWorkout()
      const firstSetId = strengthBlockAt(0).sets[0]?.id
      if (firstSetId === undefined) throw new Error('Expected a set')

      duplicateSet(0, firstSetId)

      expect(getWorkoutRef().value.activeSetIndex).toBe(2)
    })

    it('grows and shrinks the set count', () => {
      restoreWorkout(
        workoutBuilder()
          .withExerciseAndSets([{ kg: '100', reps: '8', rir: '2', status: 'planned' }])
          .build(),
      )
      const { setSetCount } = useWorkout()

      setSetCount(0, 4)
      expect(strengthBlockAt(0).sets).toHaveLength(4)

      setSetCount(0, 2)
      expect(strengthBlockAt(0).sets).toHaveLength(2)

      setSetCount(0, 0)
      expect(strengthBlockAt(0).sets).toHaveLength(1)
    })

    it('refuses to remove the last remaining set', () => {
      restoreWorkout(
        workoutBuilder()
          .withExerciseAndSets([{ kg: '100', reps: '8', rir: '2', status: 'planned' }])
          .build(),
      )
      const { removeSet } = useWorkout()
      const setId = strengthBlockAt(0).sets[0]?.id
      if (setId === undefined) throw new Error('Expected a set')

      removeSet(0, setId)

      expect(strengthBlockAt(0).sets).toHaveLength(1)
    })

    it('updates a set field and clears it when the value is undefined', () => {
      restoreWorkout(
        workoutBuilder()
          .withExerciseAndSets([{ kg: '100', reps: '8', rir: '2', status: 'active' }])
          .build(),
      )
      const { updateSetValue } = useWorkout()
      const setId = strengthBlockAt(0).sets[0]?.id
      if (setId === undefined) throw new Error('Expected a set')

      updateSetValue(setId, 'kg', 102.5)
      expect(strengthBlockAt(0).sets[0]?.kg).toBe('102.5')

      updateSetValue(setId, 'rir', undefined)
      expect(strengthBlockAt(0).sets[0]?.rir).toBe('')
    })

    it('activates a planned set and ignores non-planned sets', () => {
      restoreWorkout(
        workoutBuilder()
          .withExerciseAndSets([
            { kg: '100', reps: '8', rir: '2', status: 'completed' },
            { kg: '', reps: '', rir: '', status: 'planned' },
          ])
          .build(),
      )
      const { activateSet } = useWorkout()

      activateSet(0, 0)
      expect(strengthBlockAt(0).sets[0]?.status).toBe('completed')

      activateSet(0, 1)
      expect(strengthBlockAt(0).sets[1]?.status).toBe('active')
      expect(getWorkoutRef().value.activeSetIndex).toBe(1)
    })
  })

  describe('block management', () => {
    it('selects and removes strength blocks by exercise id', () => {
      restoreWorkout(
        workoutBuilder()
          .withStrengthBlock({ name: 'Bench Press' })
          .withStrengthBlock({ name: 'Squat' })
          .build(),
      )
      const { selectExercise, removeExercise, selectedExercise } = useWorkout()
      const squatId = strengthBlockAt(1).id

      selectExercise(squatId)
      expect(selectedExercise.value?.name).toBe('Squat')

      removeExercise(squatId)
      expect(getWorkoutRef().value.blocks).toHaveLength(1)
      expect(strengthBlockAt(0).name).toBe('Bench Press')
    })

    it('updates the selected strength block properties', () => {
      restoreWorkout(
        workoutBuilder().withStrengthBlock({ name: 'Bench Press', targetReps: 8 }).build(),
      )
      const { updateStrengthBlock } = useWorkout()

      updateStrengthBlock({ name: 'Incline Bench', targetReps: 10 })

      expect(strengthBlockAt(0)).toMatchObject({ name: 'Incline Bench', targetReps: 10 })
    })

    it('reorders blocks and keeps selection on the moved block', () => {
      restoreWorkout(
        workoutBuilder()
          .withStrengthBlock({ name: 'Bench Press' })
          .withStrengthBlock({ name: 'Squat' })
          .build(),
      )
      const { reorderExercises } = useWorkout()

      reorderExercises(0, 1)

      expect(strengthBlockAt(0).name).toBe('Squat')
      expect(strengthBlockAt(1).name).toBe('Bench Press')
    })

    it('adds timed and cardio blocks with generated ids', () => {
      const { addAmrapBlock, addTabataBlock, addCardioBlock } = useWorkout()
      const exercise = {
        id: 'push-ups',
        name: 'Push-ups',
        prescribedReps: 10,
        load: null,
        image: null,
      }

      addAmrapBlock({ durationSeconds: 600 }, [exercise])
      addTabataBlock({ rounds: 8, workSeconds: 20, restSeconds: 10 }, exercise)
      addCardioBlock({
        activity: 'running',
        targetDurationSeconds: 1800,
        targetDistanceMeters: null,
      })

      const blocks = getWorkoutRef().value.blocks
      expect(blocks.map((b) => b.kind)).toEqual(['amrap', 'tabata', 'cardio'])
      expect(new Set(blocks.map((b) => b.id)).size).toBe(3)
    })
  })

  describe('setBlockResult', () => {
    it('stores a matching result on a timed block', () => {
      const { addAmrapBlock, setBlockResult } = useWorkout()
      const exercise = {
        id: 'push-ups',
        name: 'Push-ups',
        prescribedReps: 10,
        load: null,
        image: null,
      }
      addAmrapBlock({ durationSeconds: 600 }, [exercise])

      setBlockResult(0, { rounds: 5, partialReps: 3, actualDuration: 600 })

      const block = getWorkoutRef().value.blocks[0]
      if (!block || !isTimedBlock(block) || block.kind !== 'amrap') {
        throw new Error('Expected AMRAP block')
      }
      expect(block.result).toEqual({ rounds: 5, partialReps: 3, actualDuration: 600 })
    })

    it('ignores a result whose shape does not match the block kind', () => {
      const { addAmrapBlock, setBlockResult } = useWorkout()
      const exercise = {
        id: 'push-ups',
        name: 'Push-ups',
        prescribedReps: 10,
        load: null,
        image: null,
      }
      addAmrapBlock({ durationSeconds: 600 }, [exercise])

      setBlockResult(0, { completedMinutes: 10, missedMinutes: [] })

      const block = getWorkoutRef().value.blocks[0]
      if (!block || !isTimedBlock(block) || block.kind !== 'amrap') {
        throw new Error('Expected AMRAP block')
      }
      expect(block.result).toBeNull()
    })
  })

  it('exposes strength blocks through the exercises compatibility computed', () => {
    restoreWorkout(workoutBuilder().withStrengthBlock({ name: 'Bench Press' }).build())
    const { addCardioBlock, exercises } = useWorkout()
    addCardioBlock({ activity: 'rowing', targetDurationSeconds: null, targetDistanceMeters: 2000 })

    expect(exercises.value).toHaveLength(1)
    expect(exercises.value[0]?.name).toBe('Bench Press')
  })
})
