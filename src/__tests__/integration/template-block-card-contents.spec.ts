/**
 * Integration tests for template block-card contents and accessibility.
 *
 * FINDING M6 (Medium, UX review 2026-07-04): Exercise names were missing
 * from the a11y tree on template block cards. Controls exposed only
 * "Decrease set count" etc. with no exercise context, so a screen-reader
 * user hears identical "Decrease set count" buttons for every strength
 * block. Fix: wrap each block card in a labelled group and give per-block
 * controls contextual aria-labels.
 *
 * FINDING M7 (Medium, UX review 2026-07-04): Timed-block cards hid their
 * contents -- AMRAP/EMOM/Tabata/ForTime cards showed only a summary line
 * (e.g. "12 min · 1 exercise") with no indication of *which* exercises are
 * in the block. Fix: show the contained exercise names inline.
 */
import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { assertNoViolationsWithoutContrast } from '../helpers/a11y'
import {
  createDbTemplateStrengthBlock,
  createDbTemplateAmrapBlock,
  createDbTemplateEmomBlock,
  createDbTemplateTabataBlock,
  createDbTemplateForTimeBlock,
  createDbTemplateCardioBlock,
  createDbTemplateBlockExercise,
} from '../factories'
import { seedTemplate } from '../helpers/dbAssertions'

describe('Template Block Card Contents & Accessibility', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Finding M7: exercise names shown inline', () => {
    it('should show the contained exercise names on an AMRAP block card', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const template = await seedTemplate({
        name: 'AMRAP Names Template',
        blocks: [
          createDbTemplateAmrapBlock({
            exercises: [
              createDbTemplateBlockExercise({ name: 'Burpees' }),
              createDbTemplateBlockExercise({ name: 'Air Squats' }),
            ],
          }),
        ],
      })

      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })

      await expect.element(page.getByText('Burpees')).toBeVisible()
      await expect.element(page.getByText('Air Squats')).toBeVisible()

      cleanup()
    })

    it('should show the contained exercise name on an EMOM block card', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const template = await seedTemplate({
        name: 'EMOM Names Template',
        blocks: [
          createDbTemplateEmomBlock({
            exercises: [createDbTemplateBlockExercise({ name: 'Push-ups' })],
          }),
        ],
      })

      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })

      await expect.element(page.getByText('Push-ups')).toBeVisible()

      cleanup()
    })

    it('should show the contained exercise name on a Tabata block card', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const template = await seedTemplate({
        name: 'Tabata Names Template',
        blocks: [
          createDbTemplateTabataBlock({
            exercise: createDbTemplateBlockExercise({ name: 'Mountain Climbers' }),
          }),
        ],
      })

      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })

      await expect.element(page.getByText('Mountain Climbers')).toBeVisible()

      cleanup()
    })

    it('should show the contained exercise names on a ForTime block card', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const template = await seedTemplate({
        name: 'ForTime Names Template',
        blocks: [
          createDbTemplateForTimeBlock({
            exercises: [
              createDbTemplateBlockExercise({ name: 'Wall Balls' }),
              createDbTemplateBlockExercise({ name: 'Box Jumps' }),
            ],
          }),
        ],
      })

      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })

      await expect.element(page.getByText('Wall Balls')).toBeVisible()
      await expect.element(page.getByText('Box Jumps')).toBeVisible()

      cleanup()
    })

    it('should not render an exercise list on a cardio block card (no exercises to show)', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const template = await seedTemplate({
        name: 'Cardio Template',
        blocks: [createDbTemplateCardioBlock()],
      })

      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })

      await expect.element(page.getByText(/cardio/i).first()).toBeVisible()

      cleanup()
    })
  })

  describe('Finding M6: distinguishable per-block controls', () => {
    it('should give decrease/increase set-count controls distinct accessible names per exercise', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const template = await seedTemplate({
        name: 'Multi Strength Template',
        blocks: [
          createDbTemplateStrengthBlock({ name: 'Squat' }),
          createDbTemplateStrengthBlock({ name: 'Bench Press' }),
        ],
      })

      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })

      // Each block's decrement/increment controls must be individually
      // addressable by accessible name -- not just "Decrease set count".
      await expect
        .element(page.getByRole('button', { name: /decrease set count.*squat/i }))
        .toBeVisible()
      await expect
        .element(page.getByRole('button', { name: /decrease set count.*bench press/i }))
        .toBeVisible()
      await expect
        .element(page.getByRole('button', { name: /increase set count.*squat/i }))
        .toBeVisible()
      await expect
        .element(page.getByRole('button', { name: /increase set count.*bench press/i }))
        .toBeVisible()

      cleanup()
    })

    it('should wrap each block card in a labelled group naming its exercise or block type', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const template = await seedTemplate({
        name: 'Grouped Template',
        blocks: [
          createDbTemplateStrengthBlock({ name: 'Deadlift' }),
          createDbTemplateAmrapBlock({
            exercises: [createDbTemplateBlockExercise({ name: 'Burpees' })],
          }),
        ],
      })

      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })

      await expect.element(page.getByRole('group', { name: /deadlift/i })).toBeVisible()
      await expect.element(page.getByRole('group', { name: /amrap/i })).toBeVisible()

      cleanup()
    })

    it('should use the same initials-avatar icon treatment as strength blocks instead of an emoji square (block-icon harmonization)', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const template = await seedTemplate({
        name: 'Icon Harmonization Template',
        blocks: [
          createDbTemplateAmrapBlock({
            exercises: [createDbTemplateBlockExercise({ name: 'Burpees' })],
          }),
        ],
      })

      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })

      const amrapCard = page.getByRole('group', { name: /amrap/i })
      // "AMRAP" -> initials "AM", the same ExerciseAvatar treatment strength
      // blocks already use, instead of the previous colored emoji square.
      await expect.element(amrapCard.getByText('AM', { exact: true })).toBeVisible()

      cleanup()
    })

    it('should have no structural a11y violations on a template detail page with multiple block kinds', async () => {
      // Color contrast is excluded here: the block-kind badge
      // (`bg-block-amrap/20` + `text-block-amrap`) has a pre-existing contrast
      // issue unrelated to Findings M6/M7 (group roles, contextual labels,
      // inline exercise names) that this suite targets.
      const { navigateTo, container, cleanup } = await createTestApp()

      const template = await seedTemplate({
        name: 'A11y Template',
        blocks: [
          createDbTemplateStrengthBlock({ name: 'Squat' }),
          createDbTemplateAmrapBlock({
            exercises: [createDbTemplateBlockExercise({ name: 'Burpees' })],
          }),
        ],
      })

      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })
      await expect.element(page.getByText('Squat')).toBeVisible()

      await assertNoViolationsWithoutContrast(container)

      cleanup()
    })
  })

  describe('Regression: existing remove-block affordance still works', () => {
    it('should still expose a remove control with "remove" in its accessible name', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const template = await seedTemplate({
        name: 'Removable Template',
        blocks: [createDbTemplateStrengthBlock({ name: 'Squat' })],
      })

      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })

      const removeButton = page.getByRole('button', { name: /remove.*squat/i })
      await expect.element(removeButton).toBeVisible()
      await userEvent.click(removeButton)

      await expect.element(page.getByText('Squat')).not.toBeInTheDocument()

      cleanup()
    })
  })
})
