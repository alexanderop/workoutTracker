import { flushPromises } from '@vue/test-utils'
import { page } from '../helpers/locator'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expectElement } from '../helpers/assertions'
import { db } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { dbWorkoutBuilder as databaseWorkoutBuilder } from '../factories'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

// Detect browser mode - location.reload is read-only in real browsers
const isBrowserMode = (() => {
  const [error] = tryCatch(() => {
    const original = globalThis.location.reload
    globalThis.location.reload = vi.fn()
    globalThis.location.reload = original
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
      Object.defineProperty(globalThis, 'location', {
        value: { ...globalThis.location, reload: vi.fn() },
        writable: true,
        configurable: true,
      })
    })

    it('exports data when clicking Export Data button', async () => {
      // Arrange: Add test data to DB
      const workout = databaseWorkoutBuilder().withName('Test Workout').withStrengthBlock().build()
      await db.workouts.add(workout)

      const { common, getByRole, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Act: Click export button
      await getByRole('button', { name: /^export data$/i }).click()

      // Assert: Blob was created and cleaned up
      await expect.poll(() => vi.mocked(URL.createObjectURL).mock.calls.length).toBeGreaterThan(0)
      expect(URL.revokeObjectURL).toHaveBeenCalled()

      cleanup()
    })

    it('imports data from a valid backup file', async () => {
      // Arrange: Verify DB is empty
      expect(await db.workouts.count()).toBe(0)

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

      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Act: Upload file via hidden input
      // eslint-disable-next-line no-restricted-syntax -- Hidden file input has no accessible alternative
      const fileInput = document.querySelector('input[type="file"]')
      if (!(fileInput instanceof HTMLInputElement)) {
        throw new TypeError('File input not found')
      }
      // Use DataTransfer for reliable file handling (userEvent.upload doesn't always trigger Vue's @change handler)
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      fileInput.files = dataTransfer.files
      fileInput.dispatchEvent(new Event('change', { bubbles: true }))

      // Wait for Vue to process the async file handling
      await flushPromises()

      // Assert: Confirmation dialog appears with correct count
      await common.waitForDialog()
      await expectElement(page.getByRole('heading', { name: /import data/i })).toBeVisible()
      await expectElement(page.getByText(/1 workout/i)).toBeVisible()

      // Act: Confirm import
      common.getDialogButton('Import Data').click()

      // Assert: Data was actually persisted to DB
      await expect.poll(async () => await db.workouts.count()).toBe(1)
      const workouts = await db.workouts.toArray()
      expect(workouts[0]?.name).toBe('Imported Workout')

      cleanup()
    })

    it('shows error dialog when importing invalid JSON', async () => {
      const file = new File(['not valid json'], 'bad.json', { type: 'application/json' })

      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Act: Upload invalid file
      // eslint-disable-next-line no-restricted-syntax -- Hidden file input has no accessible alternative
      const fileInput = document.querySelector('input[type="file"]')
      if (!(fileInput instanceof HTMLInputElement)) {
        throw new TypeError('File input not found')
      }
      // Use DataTransfer for reliable file handling (userEvent.upload doesn't always trigger Vue's @change handler)
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      fileInput.files = dataTransfer.files
      fileInput.dispatchEvent(new Event('change', { bubbles: true }))

      // Wait for Vue to process the async file handling
      await flushPromises()

      // Assert: Error dialog appears with correct message
      await common.waitForDialog()
      await expectElement(page.getByRole('heading', { name: /import failed/i })).toBeVisible()
      await expectElement(page.getByText(/not valid json/i)).toBeVisible()

      // Dismiss dialog
      common.getDialogButton('OK').click()
      await expectElement(page.getByRole('dialog')).not.toBeInTheDocument()

      cleanup()
    })

    it('deletes all data when confirmed', async () => {
      // Arrange: Add data to database
      await db.workouts.add(databaseWorkoutBuilder().withStrengthBlock().build())
      expect(await db.workouts.count()).toBe(1)

      const { getByRole, common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Act: Click delete all data button (use exact match to avoid matching dialog button)
      await getByRole('button', { name: /^delete all data$/i }).click()

      // Assert: Confirmation dialog appears
      await common.waitForDialog()
      await expectElement(page.getByRole('heading', { name: /delete all data/i })).toBeVisible()

      // Confirm deletion
      common.getDialogButton('Delete All Data').click()

      // Assert: Data was actually deleted from DB
      await expect.poll(async () => await db.workouts.count()).toBe(0)

      cleanup()
    })
  })

  describe('History', () => {
    it('navigates to detail view when clicking a completed workout and displays exercise and set information', async () => {
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

      await db.workouts.add(completedWorkout)

      // Act: Start at home and navigate to history page
      const { router, findByText, cleanup } = await createTestApp()
      await router.push({ name: RouteNames.History })

      // Wait for the workout to appear (async data load) then click it
      await expectElement(page.getByText('Push Day')).toBeVisible()
      await findByText('Push Day').click()

      // Assert: Verify navigation to detail view
      await expect.poll(() => router.currentRoute.value.path).toBe(`/workouts/${completedWorkout.id}`)

      // Assert: Verify workout details are displayed (wait for page render)
      await expectElement(page.getByText('Push Day')).toBeVisible()
      await expectElement(page.getByText('Bench Press')).toBeVisible()

      // Expand the exercise card to see set details
      await findByText('Bench Press').click()

      // Verify set data is displayed (weight shown as "100kg", reps as "10")
      await expectElement(page.getByText('100kg')).toBeVisible()
      await expectElement(page.getByText('10', { exact: true })).toBeVisible() // reps value

      cleanup()
    })
  })
})
