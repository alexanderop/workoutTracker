import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  resetWorkoutPersistence,
  useWorkoutPersistence,
} from '@/features/workout/composables/useWorkoutPersistence'
import { getActiveWorkoutRepository, getWorkoutsRepository } from '@/db'
import { withSetup } from '../helpers/withSetup'
import { workoutBuilder } from '../factories'
import { resetDatabase } from '../helpers/resetDatabase'

function buildWorkout() {
  return workoutBuilder()
    .withName('Push Day')
    .withExerciseAndSets(
      [
        { kg: '100', reps: '8', rir: '2', status: 'completed' },
        { kg: '100', reps: '8', rir: '2', status: 'planned' },
      ],
      { name: 'Bench Press' },
    )
    .build()
}

function setupPersistence() {
  const workout = ref(buildWorkout())
  const [persistence, app] = withSetup(() => useWorkoutPersistence(workout))
  return { workout, persistence, app }
}

describe('useWorkoutPersistence', () => {
  beforeEach(async () => {
    resetWorkoutPersistence()
    await resetDatabase()
  })

  afterEach(async () => {
    resetWorkoutPersistence()
    await resetDatabase()
  })

  it('reports no active workout on a fresh database', async () => {
    const { persistence, app } = setupPersistence()

    await expect(persistence.hasActiveWorkout()).resolves.toBe(false)
    await expect(persistence.loadActiveWorkout()).resolves.toBeNull()

    app.unmount()
  })

  it('saves and reloads the active workout', async () => {
    const { persistence, app } = setupPersistence()
    persistence.startNewWorkoutSession()

    await persistence.saveNow()

    await expect(persistence.hasActiveWorkout()).resolves.toBe(true)

    const loaded = await persistence.loadActiveWorkout()
    expect(loaded?.name).toBe('Push Day')
    expect(loaded?.blocks).toHaveLength(1)

    app.unmount()
  })

  it('keeps the original startedAt when reloading a saved session', async () => {
    const first = setupPersistence()
    first.persistence.startNewWorkoutSession()
    await first.persistence.saveNow()
    const savedBefore = await getActiveWorkoutRepository().get()
    first.app.unmount()

    resetWorkoutPersistence()

    const second = setupPersistence()
    await second.persistence.loadActiveWorkout()
    await second.persistence.saveNow()

    const savedAfter = await getActiveWorkoutRepository().get()
    expect(savedAfter?.startedAt).toBe(savedBefore?.startedAt)

    second.app.unmount()
  })

  it('discards the active workout and clears unsaved changes', async () => {
    const { persistence, app } = setupPersistence()
    persistence.startNewWorkoutSession()
    await persistence.saveNow()

    await persistence.discardActiveWorkout()

    await expect(persistence.hasActiveWorkout()).resolves.toBe(false)
    expect(persistence.hasUnsavedChanges.value).toBe(false)

    app.unmount()
  })

  it('returns null when completing without an active workout', async () => {
    const { persistence, app } = setupPersistence()

    await expect(persistence.completeWorkout()).resolves.toBeNull()

    app.unmount()
  })

  it('completes the active workout into history with notes', async () => {
    const { persistence, app } = setupPersistence()
    persistence.startNewWorkoutSession()
    await persistence.saveNow()

    const completed = await persistence.completeWorkout('felt strong')

    expect(completed?.name).toBe('Push Day')
    expect(completed?.notes).toBe('felt strong')
    expect(persistence.hasUnsavedChanges.value).toBe(false)

    const history = await getWorkoutsRepository().getHistory()
    expect(history).toHaveLength(1)
    await expect(getActiveWorkoutRepository().exists()).resolves.toBe(false)

    app.unmount()
  })

  it('round-trips timed and cardio blocks through the database', async () => {
    const exercise = {
      id: 'push-ups',
      name: 'Push-ups',
      prescribedReps: 10,
      load: null,
      image: null,
    }
    const workout = ref(buildWorkout())
    workout.value = {
      ...workout.value,
      blocks: [
        ...workout.value.blocks,
        {
          kind: 'amrap',
          id: 2,
          config: { durationSeconds: 600 },
          exercises: [exercise],
          result: { rounds: 5, partialReps: 2, actualDuration: 600 },
        },
        {
          kind: 'emom',
          id: 3,
          config: { minutes: 10, exerciseRotation: 'each-minute' },
          exercises: [exercise],
          result: null,
        },
        {
          kind: 'tabata',
          id: 4,
          config: { rounds: 8, workSeconds: 20, restSeconds: 10 },
          exercise,
          result: null,
        },
        // splitTimes is frozen in production (createSplitTracker) — Vue leaves frozen
        // arrays un-proxied, which structured clone requires
        {
          kind: 'fortime',
          id: 5,
          config: { timeCapSeconds: 300 },
          exercises: [exercise],
          result: { completionTime: 240, completed: true, splitTimes: Object.freeze([120, 240]) },
        },
        {
          kind: 'cardio',
          id: 6,
          config: { activity: 'running', targetDurationSeconds: 1800, targetDistanceMeters: null },
          result: null,
        },
      ],
    }
    const [persistence, app] = withSetup(() => useWorkoutPersistence(workout))
    persistence.startNewWorkoutSession()

    await persistence.saveNow()
    const loaded = await persistence.loadActiveWorkout()

    expect(loaded?.blocks.map((b) => b.kind)).toEqual([
      'strength',
      'amrap',
      'emom',
      'tabata',
      'fortime',
      'cardio',
    ])
    const amrap = loaded?.blocks[1]
    if (amrap?.kind !== 'amrap') throw new Error('Expected AMRAP block')
    expect(amrap.result).toEqual({ rounds: 5, partialReps: 2, actualDuration: 600 })
    const fortime = loaded?.blocks[4]
    if (fortime?.kind !== 'fortime') throw new Error('Expected ForTime block')
    expect(fortime.result).toEqual({ completionTime: 240, completed: true, splitTimes: [120, 240] })

    app.unmount()
  })

  it('back-calculates completedAt from a duration override', async () => {
    const { persistence, app } = setupPersistence()
    persistence.startNewWorkoutSession()
    await persistence.saveNow()

    const completed = await persistence.completeWorkout('', 600)

    expect(completed?.durationSeconds).toBe(600)
    expect(completed && completed.completedAt - completed.startedAt).toBe(600_000)

    app.unmount()
  })
})
