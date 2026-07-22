/* eslint-disable vitest/no-conditional-in-test -- Browser file controls and repository results require runtime narrowing. */
import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, vi } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import { dbWorkoutBuilder as databaseWorkoutBuilder } from '../factories'
import {
  expectWorkoutCount,
  getAllWorkouts,
  getWorkoutCount,
  seedCompletedWorkout,
} from '../helpers/dbAssertions'

describe('Data Management', () => {
  afterEach(async () => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  describe('Import/Export', () => {
    beforeEach(() => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    })

    it('exports data when clicking Export Data button', async ({ createTestApp }) => {
      // Arrange: Add test data to DB
      const workout = databaseWorkoutBuilder().withName('Test Workout').withStrengthBlock().build()
      await seedCompletedWorkout(workout)

      const { common, getByRole } = await createTestApp()
      await common.navigateToSettings()

      // Act: Click export button
      await userEvent.click(getByRole('button', { name: /^export data$/i }))

      // Assert the actual backup payload, not only that a download was attempted.
      await expect.poll(() => vi.mocked(URL.createObjectURL).mock.calls.length).toBeGreaterThan(0)
      const blob = vi.mocked(URL.createObjectURL).mock.calls[0]?.[0]
      if (!(blob instanceof Blob)) {
        throw new TypeError('Expected export to create a Blob')
      }
      const payload: unknown = JSON.parse(await blob.text())
      const expectedWorkout = expect.objectContaining({ name: 'Test Workout' })
      const expectedWorkouts = expect.arrayContaining([expectedWorkout])
      const expectedData = expect.objectContaining({ workouts: expectedWorkouts })
      expect(payload).toEqual(
        expect.objectContaining({
          data: expectedData,
        }),
      )
      expect(URL.revokeObjectURL).toHaveBeenCalled()
    })

    it('imports data from a valid backup file', async ({ createTestApp }) => {
      // Arrange: Verify DB is empty
      expect(await getWorkoutCount()).toBe(0)

      const importedWorkout = databaseWorkoutBuilder()
        .withName('Imported Workout')
        .withStrengthBlock()
        .build()
      const importData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          settings: [],
          customExercises: [],
          templates: [],
          workouts: [importedWorkout],
          benchmarks: [],
        },
      }
      const file = new File([JSON.stringify(importData)], 'backup.json', {
        type: 'application/json',
      })

      const { common, reloadPage } = await createTestApp()
      await common.navigateToSettings()

      // Act: Upload file via hidden input
      // eslint-disable-next-line no-restricted-syntax -- Hidden file input has no accessible alternative
      const fileInput = document.querySelector('input[type="file"]')
      if (!(fileInput instanceof HTMLInputElement)) {
        throw new TypeError('File input not found')
      }
      await userEvent.upload(fileInput, file)

      // Assert: Confirmation dialog appears with correct count
      await common.waitForDialog()
      await expect.element(page.getByRole('heading', { name: /import data/i })).toBeVisible()
      await expect.element(page.getByText(/1 workout/i)).toBeVisible()

      // Act: Confirm import
      await userEvent.click(common.getDialogButton('Import Data'))

      // Assert: Data was actually persisted to DB
      await expectWorkoutCount(1)
      const workouts = await getAllWorkouts()
      expect(workouts[0]?.name).toBe('Imported Workout')
      expect(reloadPage).toHaveBeenCalledOnce()
    })

    it('shows error dialog when importing invalid JSON', async ({ createTestApp }) => {
      const file = new File(['not valid json'], 'bad.json', { type: 'application/json' })

      const { common } = await createTestApp()
      await common.navigateToSettings()

      // Act: Upload invalid file
      // eslint-disable-next-line no-restricted-syntax -- Hidden file input has no accessible alternative
      const fileInput = document.querySelector('input[type="file"]')
      if (!(fileInput instanceof HTMLInputElement)) {
        throw new TypeError('File input not found')
      }
      await userEvent.upload(fileInput, file)

      // Assert: Error dialog appears with correct message
      await common.waitForDialog()
      await expect.element(page.getByRole('heading', { name: /import failed/i })).toBeVisible()
      await expect.element(page.getByText(/not valid json/i)).toBeVisible()

      // Dismiss dialog
      await userEvent.click(common.getDialogButton('OK'))
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
    })

    it('deletes all data when confirmed', async ({ createTestApp }) => {
      // Arrange: Add data to database
      await seedCompletedWorkout(databaseWorkoutBuilder().withStrengthBlock().build())
      expect(await getWorkoutCount()).toBe(1)

      const { getByRole, common, reloadPage } = await createTestApp()
      await common.navigateToSettings()

      // Act: Click delete all data button (use exact match to avoid matching dialog button)
      const deleteButton = getByRole('button', { name: /^delete all data$/i })
      await userEvent.click(deleteButton)

      // Assert: Confirmation dialog appears
      await common.waitForDialog()
      await expect.element(page.getByRole('heading', { name: /delete all data/i })).toBeVisible()

      // Confirm deletion
      await userEvent.click(common.getDialogButton('Delete All Data'))

      // Assert: Data was actually deleted from DB
      await expectWorkoutCount(0)
      expect(reloadPage).toHaveBeenCalledOnce()
    })
  })
  describe('Import validation errors', () => {
    it('shows a translated message and validation details when importing a file that fails schema validation', async ({
      createTestApp,
    }) => {
      // A structurally valid export that fails Zod's `.strict()` check because
      // of an unrecognized property under `data` — this is the failure mode
      // `dataImport.ts` reports as the `validationFailed` error code.
      const invalidData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          settings: [],
          customExercises: [],
          templates: [],
          workouts: [],
          benchmarks: [],
          unexpectedField: 'should not be here',
        },
      }
      const file = new File([JSON.stringify(invalidData)], 'backup.json', {
        type: 'application/json',
      })

      const { common } = await createTestApp()
      await common.navigateToSettings()

      // eslint-disable-next-line no-restricted-syntax -- Hidden file input has no accessible alternative
      const fileInput = document.querySelector('input[type="file"]')
      if (!(fileInput instanceof HTMLInputElement)) {
        throw new TypeError('File input not found')
      }
      await userEvent.upload(fileInput, file)

      // Assert: Error dialog appears with the real translation, not a raw i18n key,
      // and includes the validation details for debuggability.
      await common.waitForDialog()
      await expect.element(page.getByRole('heading', { name: /import failed/i })).toBeVisible()
      await expect
        .element(page.getByText(/settings\.errors\.validationFailed/i))
        .not.toBeInTheDocument()
      await expect.element(page.getByText(/not a valid workout tracker backup/i)).toBeVisible()
      await expect.element(page.getByText(/unexpectedField/i)).toBeVisible()

      await userEvent.click(common.getDialogButton('OK'))
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('History', () => {
    it('navigates to detail view when clicking a completed workout and displays exercise and set information', async ({
      createTestApp,
    }) => {
      // Arrange: Create a completed workout in the database
      const completedWorkout = databaseWorkoutBuilder()
        .withName('Push Day')
        .withDuration(3600)
        .withExerciseAndSets([{ kg: '100', reps: '10', rir: '2' }], {
          name: 'Bench Press',
          equipment: 'barbell',
          image: null,
          targetReps: 8,
        })
        .build()

      await seedCompletedWorkout(completedWorkout)

      // Act: Start at home and navigate to history page
      const { router, getByText } = await createTestApp()
      await router.push({ name: RouteNames.History })

      // Find the workout card and click it
      const workoutCard = getByText('Push Day')
      await userEvent.click(workoutCard)

      // Assert: Verify navigation to detail view
      await expect
        .poll(() => router.currentRoute.value.path)
        .toBe(`/workouts/${completedWorkout.id}`)

      // Assert: Verify workout details are displayed (wait for page render)
      await expect.element(page.getByText('Push Day')).toBeVisible()
      await expect.element(page.getByText('Bench Press')).toBeVisible()

      // Expand the exercise card to see set details
      const exerciseCard = getByText('Bench Press')
      await userEvent.click(exerciseCard)

      // Verify set data is displayed (weight shown as "100kg", reps as "10")
      await expect.element(page.getByText('100kg')).toBeVisible()
      await expect.element(page.getByText('10', { exact: true })).toBeVisible() // reps value
    })
  })
})
