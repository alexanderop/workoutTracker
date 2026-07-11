import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DbBlockExercise, DbTemplateBlock, DbWorkoutBlock } from '@/db/schema'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { getAllWorkouts, seedCompletedWorkout, seedTemplate } from '../helpers/dbAssertions'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { dbWorkoutBuilder as databaseWorkoutBuilder } from '../factories/dbWorkout.factory'

/**
 * Logging a past workout that contains timed and cardio blocks.
 *
 * The existing log-past-workout tests only save strength blocks. Real users
 * also redo conditioning sessions: they pick a previous workout or a template
 * that contains AMRAP/EMOM/Tabata/ForTime/cardio blocks, adjust the date, and
 * save. These flows exercise the timed-block conversion paths from history,
 * template, and builder-dialog sources through to the database.
 */

function blockExercise(name: string): DbBlockExercise {
  return { id: crypto.randomUUID(), name, prescribedReps: 10, load: null, image: null }
}

function templateExercise(name: string): {
  exerciseDefinitionId: string | null
  name: string
  prescribedReps: number
  load: string | null
  image: Blob | null
} {
  return { exerciseDefinitionId: null, name, prescribedReps: 10, load: null, image: null }
}

function mixedHistoryBlocks(): Array<DbWorkoutBlock> {
  return [
    {
      kind: 'amrap',
      id: crypto.randomUUID(),
      config: { durationSeconds: 600 },
      exercises: [blockExercise('Burpees'), blockExercise('Pull Ups')],
      result: null,
      orderIndex: 0,
    },
    {
      kind: 'emom',
      id: crypto.randomUUID(),
      config: { minutes: 10, exerciseRotation: 'each-minute' },
      exercises: [blockExercise('Kettlebell Swings')],
      result: null,
      orderIndex: 1,
    },
    {
      kind: 'tabata',
      id: crypto.randomUUID(),
      config: { rounds: 8, workSeconds: 20, restSeconds: 10 },
      exercise: blockExercise('Mountain Climbers'),
      result: null,
      orderIndex: 2,
    },
    {
      kind: 'fortime',
      id: crypto.randomUUID(),
      config: { timeCapSeconds: 900 },
      exercises: [blockExercise('Thrusters')],
      result: null,
      orderIndex: 3,
    },
    {
      kind: 'cardio',
      id: crypto.randomUUID(),
      config: { activity: 'running', targetDurationSeconds: 1200, targetDistanceMeters: null },
      result: null,
      orderIndex: 4,
    },
  ]
}

function mixedTemplateBlocks(): Array<DbTemplateBlock> {
  return [
    {
      kind: 'amrap',
      config: { durationSeconds: 300 },
      exercises: [templateExercise('Air Squats')],
    },
    {
      kind: 'emom',
      config: { minutes: 12, exerciseRotation: 'full-round' },
      exercises: [templateExercise('Push-ups'), templateExercise('Sit-ups')],
    },
    {
      kind: 'tabata',
      config: { rounds: 8, workSeconds: 20, restSeconds: 10 },
      exercise: templateExercise('Jumping Jacks'),
    },
    {
      kind: 'fortime',
      config: { timeCapSeconds: 600 },
      exercises: [templateExercise('Row Sprints')],
    },
    {
      kind: 'cardio',
      config: { activity: 'cycling', targetDurationSeconds: null, targetDistanceMeters: 10_000 },
    },
  ]
}

describe('Log Past Workout — timed & cardio blocks', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('re-logs a conditioning workout from history and saves all block kinds', async () => {
    const source = databaseWorkoutBuilder().withName('Conditioning Day')
    for (const block of mixedHistoryBlocks()) {
      source.withBlock(block)
    }
    await seedCompletedWorkout(source.build())

    const { logPastWorkout, navigateTo, common, cleanup } = await createTestApp()

    await navigateTo({ name: RouteNames.LogPastWorkout })
    await logPastWorkout.selectSource('history')
    await logPastWorkout.selectFromHistory('Conditioning Day')
    await logPastWorkout.proceedToNextStep()

    // All five blocks are loaded into the builder
    const blockCount = await logPastWorkout.getBlockCount()
    expect(blockCount).toBe(5)

    await logPastWorkout.saveWorkout()
    await common.waitForRoute(/^\/history/)

    // Both the original and the re-logged copy exist
    const workouts = await getAllWorkouts()
    expect(workouts.length).toBe(2)

    const copy = workouts.find((workout) => workout.name === 'Conditioning Day (Copy)')
    expect(copy).toBeDefined()
    expect(copy?.blocks.map((block) => block.kind)).toEqual([
      'amrap',
      'emom',
      'tabata',
      'fortime',
      'cardio',
    ])

    // Configs survive the history → builder → database round trip
    const amrap = copy?.blocks.find((block) => block.kind === 'amrap')
    if (amrap?.kind !== 'amrap') throw new Error('Expected an AMRAP block on the saved copy')
    expect(amrap.config.durationSeconds).toBe(600)
    expect(amrap.exercises.map((exercise) => exercise.name)).toEqual(['Burpees', 'Pull Ups'])
    expect(amrap.result).toBeNull()

    const cardio = copy?.blocks.find((block) => block.kind === 'cardio')
    if (cardio?.kind !== 'cardio') throw new Error('Expected a cardio block on the saved copy')
    expect(cardio.config.activity).toBe('running')
    expect(cardio.config.targetDurationSeconds).toBe(1200)

    cleanup()
  })

  it('logs a past workout from a template containing timed and cardio blocks', async () => {
    await seedTemplate({ name: 'WOD Template', blocks: mixedTemplateBlocks() })

    const { logPastWorkout, navigateTo, common, cleanup } = await createTestApp()

    await navigateTo({ name: RouteNames.LogPastWorkout })
    await logPastWorkout.selectSource('template')
    await logPastWorkout.selectTemplate('WOD Template')
    await logPastWorkout.proceedToNextStep()

    const blockCount = await logPastWorkout.getBlockCount()
    expect(blockCount).toBe(5)

    await logPastWorkout.saveWorkout()
    await common.waitForRoute(/^\/history/)

    const workouts = await getAllWorkouts()
    expect(workouts.length).toBe(1)
    expect(workouts[0]?.name).toBe('WOD Template')
    expect(workouts[0]?.blocks.map((block) => block.kind)).toEqual([
      'amrap',
      'emom',
      'tabata',
      'fortime',
      'cardio',
    ])

    const emom = workouts[0]?.blocks.find((block) => block.kind === 'emom')
    if (emom?.kind !== 'emom') throw new Error('Expected an EMOM block on the saved workout')
    expect(emom.config.minutes).toBe(12)
    expect(emom.config.exerciseRotation).toBe('full-round')
    expect(emom.exercises.map((exercise) => exercise.name)).toEqual(['Push-ups', 'Sit-ups'])

    cleanup()
  })

  it('adds an AMRAP and a cardio block to a blank past workout via the add-block dialog', async () => {
    const { logPastWorkout, navigateTo, common, cleanup } = await createTestApp()

    await navigateTo({ name: RouteNames.LogPastWorkout })
    await logPastWorkout.selectSource('blank')
    await logPastWorkout.proceedToNextStep()

    // Add an AMRAP block through the timed-blocks tab of the add dialog
    await page.getByRole('button', { name: /add.*block|add.*exercise/i }).click()
    await common.waitForDialog()
    await page.getByRole('tab', { name: /timed blocks/i }).click()
    await userEvent.click(common.getDialogButton('AMRAP'))
    await expect.element(page.getByText('Configure')).toBeVisible()
    await userEvent.click(common.getDialogButton('Add Exercise'))
    await common.selectExercise('Push-ups')
    await userEvent.click(common.getDialogButton('Add Block'))
    await common.waitForDialogClose()

    // Add a cardio block the same way
    await page.getByRole('button', { name: /add.*block|add.*exercise/i }).click()
    await common.waitForDialog()
    await page.getByRole('tab', { name: /timed blocks/i }).click()
    await userEvent.click(common.getDialogButton('Cardio'))
    await expect.element(page.getByText('Configure')).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: /running/i }))
    await userEvent.click(common.getDialogButton('Add Block'))
    await common.waitForDialogClose()

    const blockCount = await logPastWorkout.getBlockCount()
    expect(blockCount).toBe(2)

    await logPastWorkout.setWorkoutName('Lunchtime Metcon')
    await logPastWorkout.saveWorkout()
    await common.waitForRoute(/^\/history/)

    const workouts = await getAllWorkouts()
    expect(workouts.length).toBe(1)
    expect(workouts[0]?.blocks.map((block) => block.kind)).toEqual(['amrap', 'cardio'])

    cleanup()
  })
})
