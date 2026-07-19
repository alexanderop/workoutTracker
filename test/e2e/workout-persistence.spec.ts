import type { Page } from '@playwright/test'
import { expect, test } from './test-utils'

type FirstSetField = 'weight' | 'reps' | 'rir'

const firstSetFieldLabels: Record<FirstSetField, RegExp> = {
  weight: /weight for set 1/i,
  reps: /^reps for set 1/i,
  rir: /reps in reserve for set 1/i,
}

async function enterFirstSetValue(page: Page, field: FirstSetField, value: number): Promise<void> {
  const name = firstSetFieldLabels[field]
  const usesNumericInputModal = await page.evaluate(
    () => globalThis.matchMedia('(pointer: coarse)').matches,
  )

  if (!usesNumericInputModal) {
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
  const usesNumericInputModal = await page.evaluate(
    () => globalThis.matchMedia('(pointer: coarse)').matches,
  )
  const expectedValue = String(value)

  if (usesNumericInputModal) {
    await expect(page.getByRole('button', { name })).toHaveText(expectedValue)
    return
  }

  await expect(page.getByRole('spinbutton', { name })).toHaveValue(expectedValue)
}

async function enterApp(page: Page): Promise<void> {
  const skipOnboarding = page.getByRole('button', { name: 'Skip to App', exact: true })
  await expect(skipOnboarding).toBeVisible()
  await skipOnboarding.click()
  await expect(page.getByRole('button', { name: /start new workout/i })).toBeVisible()
}

async function startBenchPressWorkout(page: Page): Promise<void> {
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
}

async function completeFirstSet(page: Page): Promise<void> {
  await enterFirstSetValue(page, 'weight', 80)
  await enterFirstSetValue(page, 'reps', 10)
  await enterFirstSetValue(page, 'rir', 2)
  const completeButton = page.getByRole('button', { name: /mark set 1 complete/i })
  await completeButton.click()
  await expect(completeButton).toHaveAttribute('aria-pressed', 'true')
}

async function readFirstSetStatus(page: Page): Promise<string | undefined> {
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

test.describe('Workout persistence', () => {
  test('an active workout and completed set survive a real page reload', async ({ page, goto }) => {
    await goto('/')
    await enterApp(page)
    await startBenchPressWorkout(page)
    await completeFirstSet(page)
    await expect.poll(() => readFirstSetStatus(page)).toBe('completed')

    await page.reload({ waitUntil: 'domcontentloaded' })

    const resumeDialog = page.getByRole('dialog')
    await expect(resumeDialog.getByRole('heading', { name: /resume workout/i })).toBeVisible()
    await resumeDialog.getByRole('button', { name: /resume workout/i }).click()

    await expect(page.getByRole('button', { name: /mark set 1 complete/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expectFirstSetValue(page, 'weight', 80)
    await expectFirstSetValue(page, 'reps', 10)
    await expectFirstSetValue(page, 'rir', 2)
  })

  test('a completed workout remains available in history after reload', async ({ page, goto }) => {
    await goto('/')
    await enterApp(page)
    await startBenchPressWorkout(page)
    await completeFirstSet(page)

    await page.getByRole('button', { name: /workout options|more options/i }).click()
    await page.getByRole('menuitem', { name: /end workout/i }).click()

    const finishDialog = page.getByRole('dialog')
    const workoutName = 'E2E Strength Session'
    await expect(finishDialog.getByRole('heading', { name: /finish workout/i })).toBeVisible()
    await finishDialog.getByRole('textbox', { name: /workout name/i }).fill(workoutName)
    await finishDialog.getByRole('button', { name: /finish workout/i }).click()

    await expect(page.getByText(/workout complete/i)).toBeVisible()
    await page.getByRole('button', { name: /view details/i }).click()
    await expect(page).toHaveURL(/\/workout\/summary\//)
    await expect(page.getByText(workoutName, { exact: true })).toBeVisible()
    await expect(page.getByText('1.6k', { exact: true })).toBeVisible()
    await expect(page.getByText('kg lifted', { exact: true })).toBeVisible()

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByText(workoutName, { exact: true })).toBeVisible()

    await goto('/history')
    await page.getByRole('button', { name: new RegExp(workoutName) }).click()
    await expect(page.getByRole('heading', { name: workoutName })).toBeVisible()

    const exercise = page.getByRole('heading', { name: 'Bench Press', exact: true })
    await expect(exercise).toBeVisible()
    await expect(page.getByText('2 sets · top 80 kg', { exact: true })).toBeVisible()
    await exercise.click()

    await expect(page.getByRole('row', { name: /1 80kg 10 2/i })).toBeVisible()
  })
})
