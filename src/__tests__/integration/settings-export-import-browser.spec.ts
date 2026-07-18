import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { dbWorkoutBuilder as databaseWorkoutBuilder } from '../factories'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { getWorkoutCount, seedCompletedWorkout } from '../helpers/dbAssertions'

/**
 * Browser-mode tests for the settings export/import flow.
 *
 * The older jsdom-only tests in `data-management.spec.ts` are skipped in
 * browser mode because they stub `window.location.reload`. These tests cover
 * the same user journeys in a real browser: exporting a backup file and
 * walking through the import confirmation/error dialogs. The final import
 * confirmation (which reloads the page) is intentionally not clicked here —
 * the import itself is covered by `data-export-import-roundtrip.spec.ts`.
 */

function buildExportFile(overrides: { version?: number; workouts?: ReadonlyArray<unknown> }): File {
  const exportFile = {
    version: overrides.version ?? 1,
    exportedAt: new Date().toISOString(),
    data: {
      settings: [],
      customExercises: [],
      templates: [],
      workouts: overrides.workouts ?? [],
      benchmarks: [],
    },
  }
  return new File([JSON.stringify(exportFile)], 'backup.json', { type: 'application/json' })
}

/**
 * Selects a file on the hidden import input, the same way the browser does
 * when the user picks a file from the OS file dialog.
 */
function selectImportFile(file: File): void {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')
  if (!input) throw new Error('Import file input not found on settings page')

  const dataTransfer = new DataTransfer()
  dataTransfer.items.add(file)
  input.files = dataTransfer.files
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

describe('Settings Export/Import (browser)', () => {
  beforeEach(setupIntegrationTest)

  afterEach(async () => {
    await cleanupIntegrationTest()
    vi.restoreAllMocks()
  })

  describe('Export', () => {
    it('downloads a backup containing the user data', async () => {
      const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-export')
      const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

      const workout = databaseWorkoutBuilder().withName('Heavy Leg Day').withStrengthBlock().build()
      await seedCompletedWorkout(workout)

      const { common, getByRole, cleanup } = await createTestApp()
      await common.navigateToSettings()

      await userEvent.click(getByRole('button', { name: /^export data$/i }))

      await expect.poll(() => createObjectUrl.mock.calls.length).toBeGreaterThan(0)
      expect(revokeObjectUrl).toHaveBeenCalledWith('blob:test-export')

      // The downloaded blob is a valid backup containing the seeded workout
      const blob = createObjectUrl.mock.calls[0]?.[0]
      if (!(blob instanceof Blob)) throw new Error('Expected a Blob to be downloaded')
      const parsed = JSON.parse(await blob.text())
      expect(parsed.version).toBe(2)
      expect(parsed.data.workouts).toHaveLength(1)
      expect(parsed.data.workouts[0].name).toBe('Heavy Leg Day')

      cleanup()
    })
  })

  describe('Import confirmation dialog', () => {
    it('shows what is about to be imported and cancel keeps existing data untouched', async () => {
      const workouts = [
        databaseWorkoutBuilder().withName('Imported A').withStrengthBlock().build(),
        databaseWorkoutBuilder().withName('Imported B').withStrengthBlock().build(),
      ]

      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      selectImportFile(buildExportFile({ workouts }))

      await expect.element(page.getByRole('heading', { name: /import data\?/i })).toBeVisible()
      await expect.element(page.getByText(/you are about to import/i)).toBeVisible()
      await expect.element(page.getByText(/2\s+workouts/i)).toBeVisible()
      await expect.element(page.getByText(/0\s+templates/i)).toBeVisible()
      await expect.element(page.getByText(/0\s+custom exercises/i)).toBeVisible()

      await userEvent.click(common.getDialogButton('Cancel'))
      await common.waitForDialogClose()

      // Cancelling must not import anything
      expect(await getWorkoutCount()).toBe(0)

      cleanup()
    })

    it('uses singular labels when the backup contains exactly one workout', async () => {
      const workouts = [databaseWorkoutBuilder().withName('Solo').withStrengthBlock().build()]

      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      selectImportFile(buildExportFile({ workouts }))

      await expect.element(page.getByText(/1\s+workout$/i)).toBeVisible()

      await userEvent.click(common.getDialogButton('Cancel'))
      await common.waitForDialogClose()
      cleanup()
    })
  })

  describe('Import error dialogs', () => {
    it('rejects a file that is not valid JSON', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      selectImportFile(
        new File(['this is { not json'], 'backup.json', { type: 'application/json' }),
      )

      await expect.element(page.getByRole('heading', { name: /import failed/i })).toBeVisible()
      await expect.element(page.getByText(/the selected file is not valid json/i)).toBeVisible()

      await userEvent.click(common.getDialogButton('OK'))
      await common.waitForDialogClose()
      cleanup()
    })

    it('rejects a JSON file that is not a workout tracker backup', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      selectImportFile(
        new File([JSON.stringify({ hello: 'world' })], 'backup.json', {
          type: 'application/json',
        }),
      )

      await expect.element(page.getByText(/not a valid workout tracker backup/i)).toBeVisible()

      await userEvent.click(common.getDialogButton('OK'))
      await common.waitForDialogClose()
      cleanup()
    })

    it('rejects a backup from a newer app version', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      selectImportFile(buildExportFile({ version: 3 }))

      await expect
        .element(page.getByText(/from a newer version and cannot be imported/i))
        .toBeVisible()

      await userEvent.click(common.getDialogButton('OK'))
      await common.waitForDialogClose()
      cleanup()
    })

    it('rejects files larger than 10MB', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      const oversized = new File([new ArrayBuffer(10 * 1024 * 1024 + 1)], 'backup.json', {
        type: 'application/json',
      })
      selectImportFile(oversized)

      await expect.element(page.getByText(/exceeds maximum size of 10mb/i)).toBeVisible()

      await userEvent.click(common.getDialogButton('OK'))
      await common.waitForDialogClose()
      cleanup()
    })
  })
})
