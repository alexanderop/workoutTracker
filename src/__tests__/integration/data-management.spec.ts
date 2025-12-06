import { waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetInitState } from '@/features/workout/composables/useAppInitialization'
import { resetWorkout } from '@/features/workout/composables/useWorkout'
import { db } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import { createTestApp } from '../helpers/createTestApp'
import { dbWorkoutBuilder } from '../factories'
import { resetDatabase } from '../helpers/resetDatabase'

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
  beforeEach(async () => {
    resetInitState()
    await resetDatabase()
  })

  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.style.cssText = ''
    document.body.removeAttribute('style')
    document.body.innerHTML = ''
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
      await db.workouts.add(workout)

      const { common, user, getByRole, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Act: Click export button
      await user.click(getByRole('button', { name: /^export data$/i }))

      // Assert: Blob was created and cleaned up
      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled()
      })
      expect(URL.revokeObjectURL).toHaveBeenCalled()

      cleanup()
    })

    it('imports data from a valid backup file', async () => {
      // Arrange: Verify DB is empty
      expect(await db.workouts.count()).toBe(0)

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

      const { user, queryByRole, queryByText, common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Act: Upload file via hidden input
      const fileInput = document.querySelector('input[type="file"]')
      if (!(fileInput instanceof HTMLInputElement)) {
        throw new Error('File input not found')
      }
      await user.upload(fileInput, file)

      // Assert: Confirmation dialog appears with correct count
      await common.waitForDialog()
      expect(queryByRole('heading', { name: /import data/i })).toBeTruthy()
      expect(queryByText(/1 workout/i)).toBeTruthy()

      // Act: Confirm import
      await user.click(common.getDialogButton('Import Data'))

      // Assert: Data was actually persisted to DB
      await waitFor(async () => {
        expect(await db.workouts.count()).toBe(1)
      })
      const workouts = await db.workouts.toArray()
      expect(workouts[0]?.name).toBe('Imported Workout')

      cleanup()
    })

    it('shows error dialog when importing invalid JSON', async () => {
      const file = new File(['not valid json'], 'bad.json', { type: 'application/json' })

      const { user, queryByRole, queryByText, common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Act: Upload invalid file
      const fileInput = document.querySelector('input[type="file"]')
      if (!(fileInput instanceof HTMLInputElement)) {
        throw new Error('File input not found')
      }
      await user.upload(fileInput, file)

      // Assert: Error dialog appears with correct message
      await common.waitForDialog()
      expect(queryByRole('heading', { name: /import failed/i })).toBeTruthy()
      expect(queryByText(/not valid JSON/i)).toBeTruthy()

      // Dismiss dialog
      await user.click(common.getDialogButton('OK'))
      await waitFor(() => {
        expect(queryByRole('dialog')).toBeNull()
      })

      cleanup()
    })

    it('deletes all data when confirmed', async () => {
      // Arrange: Add data to database
      await db.workouts.add(dbWorkoutBuilder().withStrengthBlock().build())
      expect(await db.workouts.count()).toBe(1)

      const { user, getByRole, queryByRole, common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Act: Click delete all data button (use exact match to avoid matching dialog button)
      const deleteButton = getByRole('button', { name: /^delete all data$/i })
      await user.click(deleteButton)

      // Assert: Confirmation dialog appears
      await common.waitForDialog()
      expect(queryByRole('heading', { name: /delete all data/i })).toBeTruthy()

      // Confirm deletion
      await user.click(common.getDialogButton('Delete All Data'))

      // Assert: Data was actually deleted from DB
      await waitFor(async () => {
        expect(await db.workouts.count()).toBe(0)
      })

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

      await db.workouts.add(completedWorkout)

      // Act: Start at home and navigate to workouts page
      const { common, user, router, queryByText, findByText, cleanup } = await createTestApp()
      await common.navigateToWorkouts()

      // Find the workout card and click it
      const workoutCard = await findByText('Push Day')
      await user.click(workoutCard)

      // Assert: Verify navigation to detail view
      await waitFor(() => {
        expect(router.currentRoute.value.path).toBe(`/workouts/${completedWorkout.id}`)
      })

      // Assert: Verify workout details are displayed (wait for page render)
      await waitFor(() => {
        expect(queryByText('Push Day')).toBeTruthy()
      })
      expect(queryByText('Bench Press')).toBeTruthy()

      // Expand the exercise card to see set details
      const exerciseCard = await findByText('Bench Press')
      await user.click(exerciseCard)

      // Verify set data is displayed (weight shown as "100kg", reps as "10")
      await waitFor(() => {
        expect(queryByText('100kg')).toBeTruthy()
      })
      expect(queryByText('10')).toBeTruthy() // reps value

      cleanup()
    })
  })
})
