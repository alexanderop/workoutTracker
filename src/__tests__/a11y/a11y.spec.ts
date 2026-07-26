/* eslint-disable vitest/expect-expect -- assertNoViolations performs the test assertion through axe. */
import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { assertNoViolations } from '../helpers/a11y'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createDbHabit } from '../factories'
import { getHabitsRepository } from '@/db'

describe('Accessibility', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Home Page', () => {
    it('has no a11y violations on initial load', async () => {
      const { container, cleanup } = await createTestApp()

      await assertNoViolations(container)

      cleanup()
    })
  })

  describe('Workout Builder', () => {
    it('has no a11y violations in builder mode', async () => {
      const { builder, container, cleanup } = await createTestApp()

      await builder.navigateTo()
      await assertNoViolations(container)

      cleanup()
    })

    it('has no a11y violations with strength block added', async () => {
      const { builder, container, cleanup } = await createTestApp()

      await builder.addStrengthBlock('Squat')
      await assertNoViolations(container)

      cleanup()
    })

    it('has no a11y violations with multiple blocks', async () => {
      const { builder, container, common, cleanup } = await createTestApp()

      await builder.addStrengthBlock('Squat')
      await builder.openAddBlockDialog()
      await common.selectExercise('Bench Press')

      await assertNoViolations(container)

      cleanup()
    })
  })

  describe('Exercise Selector Dialog', () => {
    it('has no a11y violations when open', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()

      const dialog = page.getByRole('dialog').element()
      await assertNoViolations(dialog)

      cleanup()
    })
  })

  describe('Active Workout', () => {
    it('has no a11y violations in active mode with strength block', async () => {
      const { builder, container, cleanup } = await createTestApp()

      await builder.addStrengthBlock('Bench Press')
      await builder.startWorkout()

      await expect
        .poll(() => page.getByRole('heading', { name: /bench press/i }).query())
        .toBeTruthy()

      await assertNoViolations(container)

      cleanup()
    })

    it('exposes a per-row set options button with a unique accessible name for each set', async () => {
      // Finding 9, July 2026 UX review: delete/duplicate had no a11y-tree presence at
      // all (long-press only). Each set row must now expose a real, uniquely-named
      // button so screen-reader users can tell rows apart and reach the actions menu.
      const { builder, cleanup } = await createTestApp()

      await builder.addStrengthBlock('Bench Press')
      await builder.startWorkout()

      await expect
        .poll(() => page.getByRole('heading', { name: /bench press/i }).query())
        .toBeTruthy()

      const optionsButtons = await page.getByRole('button', { name: /options for set \d+/i }).all()
      expect(optionsButtons.length).toBeGreaterThanOrEqual(3)

      const names = await Promise.all(
        optionsButtons.map(async (button) => (await button.element()).getAttribute('aria-label')),
      )

      expect(names.every((name) => typeof name === 'string' && name.length > 0)).toBe(true)
      expect(new Set(names).size).toBe(names.length)

      cleanup()
    })
  })

  describe('Settings Page', () => {
    it('has no a11y violations on settings page', async () => {
      const { common, container, cleanup } = await createTestApp()

      await common.navigateToSettings()
      await assertNoViolations(container)

      cleanup()
    })
  })

  describe('Exercises Page', () => {
    it('has no a11y violations on exercises page', async () => {
      const { common, container, cleanup } = await createTestApp()

      await common.navigateToExercises()
      await assertNoViolations(container)

      cleanup()
    })
  })

  describe('Workouts Page', () => {
    it('has no a11y violations on workouts page', async () => {
      const { common, container, cleanup } = await createTestApp()

      await common.navigateToWorkouts()
      await assertNoViolations(container)

      cleanup()
    })
  })

  describe('Habits Page', () => {
    it('has no a11y violations in each view mode', async () => {
      await getHabitsRepository().addHabit(createDbHabit({ name: 'Read', orderIndex: 0 }))

      const { habits, container, cleanup } = await createTestApp()

      await habits.navigateTo()
      await assertNoViolations(container)

      for (const mode of ['grid', 'rows'] as const) {
        await habits.switchViewMode(mode)
        await assertNoViolations(container)
      }

      cleanup()
    })

    /**
     * The one state where two controls for the same habit are on screen at
     * once: `cards` renders a quantity stepper inline and the detail sheet
     * renders another over it.
     *
     * Covers the sheet's own markup. It is explicitly **not** the guard against
     * the duplicate-input-id bug that state once had -- verified by restoring
     * the collision, which this case still passes: axe-core dropped
     * `duplicate-id-active`, and `form-field-multiple-labels` does not fire
     * when the *second* input is the unlabelled one. The regression test that
     * does catch it asserts the sheet's spinbutton is reachable by name, in
     * `habit-tracking.spec.ts`.
     */
    it('has no a11y violations with the detail sheet open over a quantity habit', async () => {
      await getHabitsRepository().addHabit(
        createDbHabit({
          name: 'Water',
          orderIndex: 0,
          kind: { type: 'quantity', target: 3, unit: 'L' },
        }),
      )

      const { habits, container, cleanup } = await createTestApp()

      await habits.navigateTo()
      await habits.openDetails('Water')
      await assertNoViolations(container)

      cleanup()
    })
  })
})
