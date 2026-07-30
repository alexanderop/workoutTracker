import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { getWeightRepository } from '@/db'

describe('Quick Add Sheet', () => {
  it('opens from the nav plus button with quick actions and browse rows', async ({
    createTestApp,
  }) => {
    const { common } = await createTestApp()

    await common.openQuickAddSheet()

    const dialog = page.getByRole('dialog')
    await expect.element(dialog.getByRole('button', { name: /start workout/i })).toBeVisible()
    await expect.element(dialog.getByRole('button', { name: /^log weight$/i })).toBeVisible()
    await expect.element(dialog.getByRole('button', { name: /add habit/i })).toBeVisible()
    await expect.element(dialog.getByRole('button', { name: /past workout/i })).toBeVisible()
    await expect.element(dialog.getByRole('button', { name: /^exercises$/i })).toBeVisible()
    await expect.element(dialog.getByRole('button', { name: /weight history/i })).toBeVisible()
  })

  it('starts a workout from the sheet', async ({ createTestApp }) => {
    const { common } = await createTestApp()

    await common.openQuickAddSheet()
    await userEvent.click(page.getByRole('dialog').getByRole('button', { name: /start workout/i }))

    await common.waitForRoute(/^\/workout\/active$/)
    // The sheet closes itself before navigating.
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
  })

  it('navigates to log past workout from the sheet', async ({ createTestApp }) => {
    const { common } = await createTestApp()

    await common.openQuickAddSheet()
    await userEvent.click(page.getByRole('dialog').getByRole('button', { name: /past workout/i }))

    await common.waitForRoute(/^\/log-past-workout$/)
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the habit create form via Add Habit', async ({ createTestApp }) => {
    const { common, router } = await createTestApp()

    await common.openQuickAddSheet()
    await userEvent.click(page.getByRole('dialog').getByRole('button', { name: /add habit/i }))

    await common.waitForRoute(/^\/habits$/)
    // The ?create=1 deep link opens the create form on arrival.
    await expect.element(page.getByRole('heading', { name: /new habit/i })).toBeVisible()
    // The flag is consumed so back/refresh would not reopen the form.
    await expect.poll(() => router.currentRoute.value.query.create).toBeUndefined()
  })

  it('logs a weight entry through the quick-log dialog', async ({ createTestApp }) => {
    const { common, weight } = await createTestApp()

    await common.openQuickAddSheet()
    await userEvent.click(page.getByRole('dialog').getByRole('button', { name: /^log weight$/i }))

    // The dialog title is sr-only; the visible subtitle is the design authority's name.
    await expect.element(page.getByText('Scale Weight', { exact: true })).toBeVisible()
    await weight.enterWeight('82.5')
    await weight.clickSave()

    // Dialog closes on save and the entry lands in the database.
    await common.waitForDialogClose()
    const entries = await getWeightRepository().getAll()
    expect(entries).toHaveLength(1)
    expect(entries[0]?.weight).toBe(82.5)

    // Never-silent confirmation toast.
    await expect.element(page.getByText('Weight saved')).toBeVisible()
  })

  it('navigates to the weight page via the Weight History row', async ({ createTestApp }) => {
    const { weight } = await createTestApp()

    await weight.navigateTo()

    await expect.element(page.getByRole('heading', { name: /^weight$/i })).toBeVisible()
  })
})
