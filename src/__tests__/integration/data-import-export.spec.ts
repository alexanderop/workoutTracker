import { waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { resetInitState } from '@/composables/useAppInitialization'
import { resetWorkout } from '@/composables/useWorkout'
import { resetDatabase } from '../setup'
import { db } from '@/db'
import { dbWorkoutBuilder } from '../factories'
import * as dataImport from '@/lib/dataImport'
import * as dbModule from '@/db'

describe('Data Import/Export', () => {
  beforeEach(async () => {
    resetInitState()
    await resetDatabase()

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

  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.style.cssText = ''
    document.body.removeAttribute('style')
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  async function navigateToSettings(app: Awaited<ReturnType<typeof createTestApp>>): Promise<void> {
    await app.user.click(app.getByRole('button', { name: /settings/i }))
    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe('/settings')
    })
  }

  it('exports data when clicking Export Data button', async () => {
    // Arrange: Add test data to DB
    const workout = dbWorkoutBuilder().withName('Test Workout').withStrengthBlock().build()
    await db.workouts.add(workout)

    const app = await createTestApp()
    await navigateToSettings(app)

    // Act: Click export button
    await app.user.click(app.getByRole('button', { name: /^export data$/i }))

    // Assert: Blob was created and cleaned up
    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalled()
    })
    expect(URL.revokeObjectURL).toHaveBeenCalled()

    app.cleanup()
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

    const app = await createTestApp()
    await navigateToSettings(app)

    // Act: Upload file via hidden input
    const fileInput = document.querySelector('input[type="file"]')
    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error('File input not found')
    }
    await app.user.upload(fileInput, file)

    // Assert: Confirmation dialog appears with correct count
    await app.waitForDialog()
    expect(app.queryByRole('heading', { name: /import data/i })).toBeTruthy()
    expect(app.queryByText(/1 workout/i)).toBeTruthy()

    // Act: Confirm import
    await app.user.click(app.getDialogButton('Import Data'))

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

    app.cleanup()
  })

  it('shows error dialog when importing invalid JSON', async () => {
    const file = new File(['not valid json'], 'bad.json', { type: 'application/json' })

    const app = await createTestApp()
    await navigateToSettings(app)

    // Act: Upload invalid file
    const fileInput = document.querySelector('input[type="file"]')
    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error('File input not found')
    }
    await app.user.upload(fileInput, file)

    // Assert: Error dialog appears with correct message
    await app.waitForDialog()
    expect(app.queryByRole('heading', { name: /import failed/i })).toBeTruthy()
    expect(app.queryByText(/not valid JSON/i)).toBeTruthy()

    // Dismiss dialog
    await app.user.click(app.getDialogButton('OK'))
    await waitFor(() => {
      expect(app.queryByRole('dialog')).toBeNull()
    })

    app.cleanup()
  })

  it('deletes all data when confirmed', async () => {
    // Arrange: Add data to database and spy on deleteAllData
    await db.workouts.add(dbWorkoutBuilder().withStrengthBlock().build())
    expect(await db.workouts.count()).toBe(1)

    const deleteSpy = vi.spyOn(dbModule, 'deleteAllData').mockResolvedValue()

    const app = await createTestApp()
    await navigateToSettings(app)

    // Act: Click delete all data button (use exact match to avoid matching dialog button)
    const deleteButton = app.getByRole('button', { name: /^delete all data$/i })
    await app.user.click(deleteButton)

    // Assert: Confirmation dialog appears
    await app.waitForDialog()
    expect(app.queryByRole('heading', { name: /delete all data/i })).toBeTruthy()

    // Confirm deletion
    await app.user.click(app.getDialogButton('Delete All Data'))

    // Assert: deleteAllData was called
    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalled()
    })

    app.cleanup()
  })
})
