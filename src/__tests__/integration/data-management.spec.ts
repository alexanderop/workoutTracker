import { waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetInitState } from '@/composables/useAppInitialization'
import { resetWorkout } from '@/composables/useWorkout'
import { db } from '@/db'
import * as dbModule from '@/db'
import * as dataImport from '@/lib/dataImport'
import { createTestApp } from '../helpers/createTestApp'
import { dbWorkoutBuilder } from '../factories'
import { resetDatabase } from '../setup'

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

  describe('Import/Export', () => {
    beforeEach(() => {
      // Mock URL methods that don't exist in JSDOM
      vi.stubGlobal('URL', {
        ...URL,
        createObjectURL: vi.fn(() => 'blob:test'),
        revokeObjectURL: vi.fn(),
      })

      // Mock window.location.reload to prevent navigation errors
      Object.defineProperty(window, 'location', {
        value: { ...window.location, reload: vi.fn() },
        writable: true,
        configurable: true,
      })
    })

    async function navigateToSettings(testApp: {
      user: Awaited<ReturnType<typeof createTestApp>>['user']
      getByRole: Awaited<ReturnType<typeof createTestApp>>['getByRole']
      router: Awaited<ReturnType<typeof createTestApp>>['router']
    }): Promise<void> {
      await testApp.user.click(testApp.getByRole('button', { name: /settings/i }))
      await waitFor(() => {
        expect(testApp.router.currentRoute.value.path).toBe('/settings')
      })
    }

    it('exports data when clicking Export Data button', async () => {
      // Arrange: Add test data to DB
      const workout = dbWorkoutBuilder().withName('Test Workout').withStrengthBlock().build()
      await db.workouts.add(workout)

      const { user, getByRole, router, cleanup } = await createTestApp()
      const testApp = { user, getByRole, router }
      await navigateToSettings(testApp)

      // Act: Click export button
      await user.click(getByRole('button', { name: /^export data$/i }))

      // Assert: Blob was created and cleaned up
      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled()
      })
      expect(URL.revokeObjectURL).toHaveBeenCalled()

      cleanup()
    })

    it('imports data from a valid backup file and calls importAllData', async () => {
      // Arrange: Spy on importAllData
      const importSpy = vi.spyOn(dataImport, 'importAllData').mockResolvedValue()

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

      const { user, getByRole, router, queryByRole, queryByText, common, cleanup } =
        await createTestApp()
      const testApp = { user, getByRole, router }
      await navigateToSettings(testApp)

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

      // Assert: importAllData was called with correct data
      await waitFor(() => {
        expect(importSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            version: 1,
            data: expect.objectContaining({
              workouts: expect.arrayContaining([
                expect.objectContaining({ name: 'Imported Workout' }),
              ]),
            }),
          }),
        )
      })

      cleanup()
    })

    it('shows error dialog when importing invalid JSON', async () => {
      const file = new File(['not valid json'], 'bad.json', { type: 'application/json' })

      const { user, getByRole, router, queryByRole, queryByText, common, cleanup } =
        await createTestApp()
      const testApp = { user, getByRole, router }
      await navigateToSettings(testApp)

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
      // Arrange: Add data to database and spy on deleteAllData
      await db.workouts.add(dbWorkoutBuilder().withStrengthBlock().build())
      expect(await db.workouts.count()).toBe(1)

      const deleteSpy = vi.spyOn(dbModule, 'deleteAllData').mockResolvedValue()

      const { user, getByRole, router, queryByRole, common, cleanup } = await createTestApp()
      const testApp = { user, getByRole, router }
      await navigateToSettings(testApp)

      // Act: Click delete all data button (use exact match to avoid matching dialog button)
      const deleteButton = getByRole('button', { name: /^delete all data$/i })
      await user.click(deleteButton)

      // Assert: Confirmation dialog appears
      await common.waitForDialog()
      expect(queryByRole('heading', { name: /delete all data/i })).toBeTruthy()

      // Confirm deletion
      await user.click(common.getDialogButton('Delete All Data'))

      // Assert: deleteAllData was called
      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalled()
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
      const { user, router, getByRole, getByText, findByText, cleanup } = await createTestApp()

      // Navigate to workouts via bottom nav
      const workoutsNavButton = getByRole('button', { name: /workouts/i })
      await user.click(workoutsNavButton)

      // Wait for workouts page to load
      expect(router.currentRoute.value.path).toBe('/workouts')

      // Find the workout card and click it
      const workoutCard = await findByText('Push Day')
      await user.click(workoutCard)

      // Assert: Verify navigation to detail view
      expect(router.currentRoute.value.path).toBe(`/workouts/${completedWorkout.id}`)

      // Assert: Verify workout details are displayed
      expect(getByText('Push Day')).toBeDefined()
      expect(getByText('Bench Press')).toBeDefined()

      // Expand the exercise card to see set details
      const exerciseCard = getByText('Bench Press')
      await user.click(exerciseCard)

      // Verify set data is displayed (weight shown as "100kg", reps as "10")
      expect(getByText('100kg')).toBeDefined()
      expect(getByText('10')).toBeDefined() // reps value

      cleanup()
    })
  })
})
