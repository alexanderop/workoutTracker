import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { usePastWorkout } from '@/features/log-past-workout/composables/usePastWorkout'
import { isStrengthBlock } from '@/types/blocks'
import type { StrengthBlock } from '@/types/blocks'
import { db } from '@/db'
import { resetDatabase } from '../helpers/resetDatabase'
import { createDbTemplate, createDbTemplateStrengthBlock, dbWorkoutBuilder } from '../factories'

function strengthBlockAt(index: number): StrengthBlock {
  const block = usePastWorkout().blocks.value[index]
  if (!block || !isStrengthBlock(block)) {
    throw new Error(`Expected strength block at index ${index}`)
  }
  return block
}

describe('usePastWorkout', () => {
  beforeEach(async () => {
    usePastWorkout().reset()
    await resetDatabase()
  })

  afterEach(async () => {
    usePastWorkout().reset()
    await resetDatabase()
  })

  it('loads name and blocks from a template', async () => {
    const template = createDbTemplate({
      name: 'Push Day Template',
      blocks: [createDbTemplateStrengthBlock({ name: 'Bench Press', defaultSetCount: 2 })],
    })
    await db.templates.add(template)
    const past = usePastWorkout()

    await past.loadFromTemplate(template.id)

    expect(past.workoutName.value).toBe('Push Day Template')
    expect(past.sourceType.value).toBe('template')
    expect(past.sourceId.value).toBe(template.id)
    expect(strengthBlockAt(0).name).toBe('Bench Press')
    expect(strengthBlockAt(0).sets).toHaveLength(2)
  })

  it('leaves state untouched when the template does not exist', async () => {
    const past = usePastWorkout()

    await past.loadFromTemplate('missing-template')

    expect(past.workoutName.value).toBe('')
    expect(past.blocks.value).toEqual([])
    expect(past.sourceType.value).toBeUndefined()
  })

  it('loads a copy from workout history preserving set values', async () => {
    const workout = dbWorkoutBuilder()
      .withName('Leg Day')
      .withExerciseAndSets([{ kg: '120', reps: '5', rir: '2' }], { name: 'Squat' })
      .build()
    await db.workouts.add(workout)
    const past = usePastWorkout()

    await past.loadFromHistory(workout.id)

    expect(past.workoutName.value).toBe('Leg Day (Copy)')
    expect(past.sourceType.value).toBe('history')
    expect(strengthBlockAt(0).sets[0]).toMatchObject({ kg: '120', reps: '5', rir: '2' })
  })

  it('starts a blank workout', () => {
    const past = usePastWorkout()
    past.workoutName.value = 'Leftover'

    past.startBlank()

    expect(past.workoutName.value).toBe('')
    expect(past.blocks.value).toEqual([])
    expect(past.sourceType.value).toBe('blank')
  })

  it('adds timed and cardio blocks with sequential ids and selection', () => {
    const past = usePastWorkout()
    const exercise = {
      id: 'push-ups',
      name: 'Push-ups',
      prescribedReps: 10,
      load: null,
      image: null,
    }

    past.addAmrapBlock({ durationSeconds: 600 }, [exercise])
    past.addEmomBlock({ minutes: 10, exerciseRotation: 'each-minute' }, [exercise])
    past.addTabataBlock({ rounds: 8, workSeconds: 20, restSeconds: 10 }, exercise)
    past.addForTimeBlock({ timeCapSeconds: null }, [exercise])
    past.addCardioBlock({
      activity: 'running',
      targetDurationSeconds: 1800,
      targetDistanceMeters: null,
    })

    expect(past.blocks.value.map((b) => b.kind)).toEqual([
      'amrap',
      'emom',
      'tabata',
      'fortime',
      'cardio',
    ])
    expect(past.blocks.value.map((b) => b.id)).toEqual([1, 2, 3, 4, 5])
    expect(past.selectedBlockIndex.value).toBe(4)
  })

  it('removes blocks by id and by index', () => {
    const past = usePastWorkout()
    const exercise = {
      id: 'push-ups',
      name: 'Push-ups',
      prescribedReps: 10,
      load: null,
      image: null,
    }
    past.addAmrapBlock({ durationSeconds: 600 }, [exercise])
    past.addCardioBlock({
      activity: 'rowing',
      targetDurationSeconds: null,
      targetDistanceMeters: 2000,
    })

    past.removeBlock(1)
    expect(past.blocks.value.map((b) => b.kind)).toEqual(['cardio'])

    past.removeBlockByIndex(0)
    expect(past.blocks.value).toEqual([])
  })

  it('reorders blocks and keeps the selected block index in sync', () => {
    const past = usePastWorkout()
    const exercise = {
      id: 'push-ups',
      name: 'Push-ups',
      prescribedReps: 10,
      load: null,
      image: null,
    }
    past.addAmrapBlock({ durationSeconds: 600 }, [exercise])
    past.addCardioBlock({
      activity: 'running',
      targetDurationSeconds: 1800,
      targetDistanceMeters: null,
    })

    past.reorderBlocks(0, 1)

    expect(past.blocks.value.map((b) => b.kind)).toEqual(['cardio', 'amrap'])
  })

  it('selects blocks only within bounds', () => {
    const past = usePastWorkout()
    const exercise = {
      id: 'push-ups',
      name: 'Push-ups',
      prescribedReps: 10,
      load: null,
      image: null,
    }
    past.addAmrapBlock({ durationSeconds: 600 }, [exercise])

    past.selectBlock(5)
    expect(past.selectedBlockIndex.value).toBe(0)

    past.selectBlock(-1)
    expect(past.selectedBlockIndex.value).toBe(-1)
  })

  describe('strength set editing', () => {
    async function loadStrengthWorkout(): Promise<number> {
      const workout = dbWorkoutBuilder()
        .withExerciseAndSets(
          [
            { kg: '100', reps: '8', rir: '2' },
            { kg: '100', reps: '6', rir: '1' },
          ],
          { name: 'Bench Press' },
        )
        .build()
      await db.workouts.add(workout)
      await usePastWorkout().loadFromHistory(workout.id)
      return strengthBlockAt(0).id
    }

    it('updates a single set within a block', async () => {
      const past = usePastWorkout()
      const blockId = await loadStrengthWorkout()

      past.updateSet(blockId, 1, { kg: '105' })

      expect(strengthBlockAt(0).sets[1]).toMatchObject({ kg: '105', reps: '6' })
      expect(strengthBlockAt(0).sets[0]?.kg).toBe('100')
    })

    it('replaces all sets of a block', async () => {
      const past = usePastWorkout()
      const blockId = await loadStrengthWorkout()

      past.updateStrengthSets(blockId, [
        { id: 1, kg: '90', reps: '10', duration: '', rir: '3', status: 'completed' },
      ])

      expect(strengthBlockAt(0).sets).toHaveLength(1)
      expect(strengthBlockAt(0).sets[0]?.kg).toBe('90')
    })

    it('adds a set prefilled from the previous one', async () => {
      const past = usePastWorkout()
      const blockId = await loadStrengthWorkout()

      past.addSetToBlock(blockId)

      const sets = strengthBlockAt(0).sets
      expect(sets).toHaveLength(3)
      expect(sets[2]).toMatchObject({ kg: '100', reps: '6', rir: '1', status: 'completed' })
    })

    it('removes a set by index', async () => {
      const past = usePastWorkout()
      const blockId = await loadStrengthWorkout()

      past.removeSetFromBlock(blockId, 0)

      expect(strengthBlockAt(0).sets).toHaveLength(1)
      expect(strengthBlockAt(0).sets[0]?.reps).toBe('6')
    })
  })

  it('resets all state to defaults', () => {
    const past = usePastWorkout()
    const exercise = {
      id: 'push-ups',
      name: 'Push-ups',
      prescribedReps: 10,
      load: null,
      image: null,
    }
    past.workoutName.value = 'Something'
    past.durationMinutes.value = 90
    past.addAmrapBlock({ durationSeconds: 600 }, [exercise])

    past.reset()

    expect(past.workoutName.value).toBe('')
    expect(past.durationMinutes.value).toBe(45)
    expect(past.blocks.value).toEqual([])
    expect(past.selectedBlockIndex.value).toBe(-1)
    expect(past.sourceType.value).toBeUndefined()
  })
})
