import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db, getWorkoutsRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { dbWorkoutBuilder } from '../factories'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

// Detect browser mode - location.reload is read-only in real browsers
const isBrowserMode = (() => {
  const [error] = tryCatch(() => {
    const original = window.location.reload
    window.location.reload = vi.fn()
    window.location.reload = original
  })
  return Boolean(error)
})()

describe('Data Management', () => {
  beforeEach(setupIntegrationTest)

  afterEach(async () => {
    await cleanupIntegrationTest()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  // Skip Import/Export tests in browser mode - they require mocking window.location
  // which is read-only in real browsers
  describe.skipIf(isBrowserMode)('Import/Export', () => {
    beforeEach(() => {
      // Mock URL methods that don't exist in JSDOM
      vi.stubGlobal('URL', {
        ...URL,
        createObjectURL: vi.fn(() => 'blob:test'),
        revokeObjectURL: vi.fn(),
      })

      // Mock window.location.reload to prevent navigation errors (jsdom only)
      Object.defineProperty(window, 'location', {
        value: { ...window.location, reload: vi.fn() },
        writable: true,
        configurable: true,
      })
    })

    it('exports data when clicking Export Data button', async () => {
      // Arrange: Add test data to DB
      const workout = dbWorkoutBuilder().withName('Test Workout').withStrengthBlock().build()
      await getWorkoutsRepository().add(workout)

      const { common, getByRole, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Act: Click export button
      await userEvent.click(getByRole('button', { name: /^export data$/i }))

      // Assert: Blob was created and cleaned up
      await expect.poll(() => vi.mocked(URL.createObjectURL).mock.calls.length).toBeGreaterThan(0)
      expect(URL.revokeObjectURL).toHaveBeenCalled()

      cleanup()
    })

    it('imports data from a valid backup file', async () => {
      // Arrange: Verify DB is empty
      expect(await db.workoutHeaders.count()).toBe(0)

      const importedWorkout = dbWorkoutBuilder()
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
        },
      }
      const file = new File([JSON.stringify(importData)], 'backup.json', {
        type: 'application/json',
      })

      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Act: Upload file via hidden input
      const fileInput = document.querySelector('input[type="file"]')
      if (!(fileInput instanceof HTMLInputElement)) {
        throw new Error('File input not found')
      }
      await userEvent.upload(fileInput, file)

      // Assert: Confirmation dialog appears with correct count
      await common.waitForDialog()
      await expect.element(page.getByRole('heading', { name: /import data/i })).toBeVisible()
      await expect.element(page.getByText(/1 workout/i)).toBeVisible()

      // Act: Confirm import
      await userEvent.click(common.getDialogButton('Import Data'))

      // Assert: Data was actually persisted to DB
      await expect.poll(async () => await db.workoutHeaders.count()).toBe(1)
      const workouts = await db.workoutHeaders.toArray()
      expect(workouts[0]?.name).toBe('Imported Workout')

      cleanup()
    })

    it('shows error dialog when importing invalid JSON', async () => {
      const file = new File(['not valid json'], 'bad.json', { type: 'application/json' })

      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Act: Upload invalid file
      const fileInput = document.querySelector('input[type="file"]')
      if (!(fileInput instanceof HTMLInputElement)) {
        throw new Error('File input not found')
      }
      await userEvent.upload(fileInput, file)

      // Assert: Error dialog appears with correct message
      await common.waitForDialog()
      await expect.element(page.getByRole('heading', { name: /import failed/i })).toBeVisible()
      await expect.element(page.getByText(/not valid JSON/i)).toBeVisible()

      // Dismiss dialog
      await userEvent.click(common.getDialogButton('OK'))
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()

      cleanup()
    })

    it('deletes all data when confirmed', async () => {
      // Arrange: Add data to database
      await getWorkoutsRepository().add(dbWorkoutBuilder().withStrengthBlock().build())
      expect(await db.workoutHeaders.count()).toBe(1)

      const { getByRole, common, cleanup } = await createTestApp()
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
      await expect.poll(async () => await db.workoutHeaders.count()).toBe(0)

      cleanup()
    })
  })

  describe('History', () => {
    it('navigates to detail view when clicking a completed workout and displays exercise and set information', async () => {
      // Arrange: Create a completed workout in the database
      const completedWorkout = dbWorkoutBuilder()
        .withName('Push Day')
        .withDuration(3600)
        .withExerciseAndSets([{ kg: '100', reps: '10', rir: '2' }], {
          name: 'Bench Press',
          equipment: 'Barbell',
          thumbnail: '🏋️',
          targetReps: 8,
        })
        .build()

      await getWorkoutsRepository().add(completedWorkout)

      // Act: Start at home and navigate to history page
      const { router, findByText, cleanup } = await createTestApp()
      await router.push({ name: RouteNames.History })

      // Find the workout card and click it
      const workoutCard = await findByText('Push Day')
      await userEvent.click(workoutCard)

      // Assert: Verify navigation to detail view
      await expect.poll(() => router.currentRoute.value.path).toBe(`/workouts/${completedWorkout.id}`)

      // Assert: Verify workout details are displayed (wait for page render)
      await expect.element(page.getByText('Push Day')).toBeVisible()
      await expect.element(page.getByText('Bench Press')).toBeVisible()

      // Expand the exercise card to see set details
      const exerciseCard = await findByText('Bench Press')
      await userEvent.click(exerciseCard)

      // Verify set data is displayed (weight shown as "100kg", reps as "10")
      await expect.element(page.getByText('100kg')).toBeVisible()
      await expect.element(page.getByText('10', { exact: true })).toBeVisible() // reps value

      cleanup()
    })
  })
})
