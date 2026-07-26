import type { Page } from '@playwright/test'
import { expect, Given, Then, When } from '../fixtures'

type FirstSetField = 'weight' | 'reps' | 'rir'

const firstSetFieldLabels: Record<FirstSetField, RegExp> = {
  weight: /weight for set 1/i,
  reps: /^reps for set 1/i,
  rir: /reps in reserve for set 1/i,
}

/** Coarse pointers (the `mobile-webkit-critical` project) get the on-screen
 *  numeric keypad instead of a native spinbutton, so both entry and read-back
 *  branch on the same media query the app itself uses. */
function usesNumericInputModal(page: Page): Promise<boolean> {
  return page.evaluate(() => globalThis.matchMedia('(pointer: coarse)').matches)
}

async function enterFirstSetValue(page: Page, field: FirstSetField, value: number): Promise<void> {
  const name = firstSetFieldLabels[field]

  if (!(await usesNumericInputModal(page))) {
    await page.getByRole('spinbutton', { name }).fill(String(value))
    return
  }

  await page.getByRole('button', { name }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  for (const digit of String(value)) {
    if (digit === '.') {
      await dialog.getByRole('button', { name: /add decimal point/i }).click()
      continue
    }
    await dialog.getByRole('button', { name: digit, exact: true }).click()
  }

  await dialog.getByRole('button', { name: /confirm value/i }).click()
  await expect(dialog).toBeHidden()
}

async function expectFirstSetValue(page: Page, field: FirstSetField, value: number): Promise<void> {
  const name = firstSetFieldLabels[field]
  const expectedValue = String(value)

  if (await usesNumericInputModal(page)) {
    await expect(page.getByRole('button', { name })).toHaveText(expectedValue)
    return
  }

  await expect(page.getByRole('spinbutton', { name })).toHaveValue(expectedValue)
}

/**
 * Reads the first set's status straight out of IndexedDB, bypassing the UI.
 * The point of this feature is that the *write* landed on disk, not that the
 * component re-rendered — only a direct read can tell those two apart before
 * the reload that the scenario goes on to perform.
 */
function readFirstSetStatus(page: Page): Promise<string | undefined> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('WorkoutTrackerDb')
      request.addEventListener('success', () => resolve(request.result))
      request.addEventListener('error', () => reject(request.error))
    })
    const activeWorkout = await new Promise<unknown>((resolve, reject) => {
      const request = database
        .transaction('activeWorkout')
        .objectStore('activeWorkout')
        .get('current')
      request.addEventListener('success', () => {
        const result: unknown = request.result
        resolve(result)
      })
      request.addEventListener('error', () => reject(request.error))
    })
    database.close()

    if (
      typeof activeWorkout !== 'object' ||
      activeWorkout === null ||
      !('blocks' in activeWorkout) ||
      !Array.isArray(activeWorkout.blocks)
    ) {
      return undefined
    }
    const firstBlock: unknown = activeWorkout.blocks[0]
    if (
      typeof firstBlock !== 'object' ||
      firstBlock === null ||
      !('sets' in firstBlock) ||
      !Array.isArray(firstBlock.sets)
    ) {
      return undefined
    }
    const firstSet: unknown = firstBlock.sets[0]
    if (
      typeof firstSet !== 'object' ||
      firstSet === null ||
      !('status' in firstSet) ||
      typeof firstSet.status !== 'string'
    ) {
      return undefined
    }
    return firstSet.status
  })
}

Given('a bench press workout is in progress', async ({ page }) => {
  await page.getByRole('button', { name: /start new workout/i }).click()
  await expect(page).toHaveURL(/\/workout\/active$/)

  await page.getByRole('button', { name: /add first block/i }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('textbox', { name: /search exercises/i }).fill('Bench Press')
  const benchPress = dialog.getByRole('button', { name: 'BP Bench Press Chest', exact: true })
  await expect(benchPress).toBeVisible()
  await benchPress.click()
  await expect(dialog).toBeHidden()

  await page.getByRole('button', { name: /start workout/i }).click()
  await expect(page.getByRole('table')).toBeVisible()
})

When(
  'they log set 1 as {int} kg for {int} reps at {int} RIR',
  async ({ page }, weight: number, reps: number, rir: number) => {
    await enterFirstSetValue(page, 'weight', weight)
    await enterFirstSetValue(page, 'reps', reps)
    await enterFirstSetValue(page, 'rir', rir)
  },
)

When('they mark set 1 complete', async ({ page }) => {
  const completeButton = page.getByRole('button', { name: /mark set 1 complete/i })
  await completeButton.click()
  await expect(completeButton).toHaveAttribute('aria-pressed', 'true')
})

Then('set 1 is stored as completed in the local database', async ({ page }) => {
  await expect.poll(() => readFirstSetStatus(page)).toBe('completed')
})

When('they resume the in-progress workout', async ({ page }) => {
  const resumeDialog = page.getByRole('dialog')
  await expect(resumeDialog.getByRole('heading', { name: /resume workout/i })).toBeVisible()
  await resumeDialog.getByRole('button', { name: /resume workout/i }).click()
})

Then('set 1 is marked complete', async ({ page }) => {
  await expect(page.getByRole('button', { name: /mark set 1 complete/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

Then(
  'set 1 reads {int} kg for {int} reps at {int} RIR',
  async ({ page }, weight: number, reps: number, rir: number) => {
    await expectFirstSetValue(page, 'weight', weight)
    await expectFirstSetValue(page, 'reps', reps)
    await expectFirstSetValue(page, 'rir', rir)
  },
)

When('they finish the workout as {string}', async ({ page }, name: string) => {
  await page.getByRole('button', { name: /workout options|more options/i }).click()
  await page.getByRole('menuitem', { name: /end workout/i }).click()

  const finishDialog = page.getByRole('dialog')
  await expect(finishDialog.getByRole('heading', { name: /finish workout/i })).toBeVisible()
  await finishDialog.getByRole('textbox', { name: /workout name/i }).fill(name)
  await finishDialog.getByRole('button', { name: /finish workout/i }).click()
})

Then('the workout is reported complete', async ({ page }) => {
  await expect(page.getByText(/workout complete/i)).toBeVisible()
})

When('they open the workout summary', async ({ page }) => {
  await page.getByRole('button', { name: /view details/i }).click()
  await expect(page).toHaveURL(/\/workout\/summary\//)
})

Then(
  'the summary shows {string} with {string} kg lifted',
  async ({ page }, name: string, volume: string) => {
    await expect(page.getByText(name, { exact: true })).toBeVisible()
    await expect(page.getByText(volume, { exact: true })).toBeVisible()
    await expect(page.getByText('kg lifted', { exact: true })).toBeVisible()
  },
)

Then('the summary still shows {string}', async ({ page }, name: string) => {
  await expect(page.getByText(name, { exact: true })).toBeVisible()
})

When('they open {string} from history', async ({ page, goto }, name: string) => {
  await goto('/history')
  await page.getByRole('button', { name: new RegExp(name) }).click()
  await expect(page.getByRole('heading', { name })).toBeVisible()
})

Then(
  'the workout detail lists {string} as {string}',
  async ({ page }, exercise: string, setSummary: string) => {
    await expect(page.getByRole('heading', { name: exercise, exact: true })).toBeVisible()
    await expect(page.getByText(setSummary, { exact: true })).toBeVisible()
  },
)

When('they expand {string}', async ({ page }, exercise: string) => {
  await page.getByRole('heading', { name: exercise, exact: true }).click()
})

Then(
  'a set row shows set 1 at {int} kg for {int} reps at {int} RIR',
  async ({ page }, weight: number, reps: number, rir: number) => {
    await expect(
      page.getByRole('row', { name: new RegExp(`1 ${weight}kg ${reps} ${rir}`, 'i') }),
    ).toBeVisible()
  },
)
