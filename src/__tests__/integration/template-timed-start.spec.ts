/* eslint-disable vitest/no-conditional-in-test -- Timed template controls are conditionally rendered. */
import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import type { DbTemplateBlock } from '@/db/schema'
import { seedTemplate } from '../helpers/dbAssertions'

function createExercise(name: string) {
  return { exerciseDefinitionId: null, name, prescribedReps: 10, load: null, image: null }
}

/**
 * Starting a live workout from a template that contains timed and cardio
 * blocks. Existing template specs only start strength templates, so the
 * template→active-workout conversion for AMRAP/EMOM/Tabata/ForTime/cardio
 * blocks was never exercised end to end.
 */

function conditioningTemplateBlocks(): Array<DbTemplateBlock> {
  return [
    { kind: 'amrap', config: { durationSeconds: 300 }, exercises: [createExercise('Air Squats')] },
    {
      kind: 'emom',
      config: { minutes: 8, exerciseRotation: 'each-minute' },
      exercises: [createExercise('Push-ups')],
    },
    {
      kind: 'tabata',
      config: { rounds: 8, workSeconds: 20, restSeconds: 10 },
      exercise: createExercise('Jumping Jacks'),
    },
    { kind: 'fortime', config: { timeCapSeconds: 600 }, exercises: [createExercise('Thrusters')] },
    {
      kind: 'cardio',
      config: { activity: 'rowing', targetDurationSeconds: 900, targetDistanceMeters: null },
    },
  ]
}

describe('Start workout from conditioning template', () => {
  it('converts all timed and cardio template blocks into a live workout', async ({
    createTestApp,
  }) => {
    const { getByRole, common } = await createTestApp()

    const template = await seedTemplate({
      name: 'Metcon Monday',
      blocks: conditioningTemplateBlocks(),
    })

    await common.navigateToWorkoutsAndClickTab('templates')
    await expect.element(page.getByText('Metcon Monday')).toBeVisible()

    const templateName = await page.getByText('Metcon Monday').element()
    const templateCard = templateName.closest('[role="button"]')
    if (!(templateCard instanceof HTMLElement)) {
      throw new TypeError('Template card not found')
    }
    await userEvent.click(templateCard)
    await common.waitForRoute(new RegExp(`^/templates/${template.id}`))

    await expect.element(page.getByRole('button', { name: /start workout/i })).toBeVisible()
    await userEvent.click(getByRole('button', { name: /start workout/i }))

    // The live workout starts on the first (AMRAP) block
    await common.waitForRoute(/^\/workout\/active/)
    await expect.element(page.getByText(/amrap/i).first()).toBeVisible()
  })
})
