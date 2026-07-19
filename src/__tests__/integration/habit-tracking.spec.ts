/* eslint-disable vitest/expect-expect -- Page-object actions include their own visible-state assertions. */
import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import { generateId, getHabitsRepository } from '@/db'
import { getStartOfDay } from '@/lib/date'
import { createDbHabit, createDbHabitEntriesForDays, createDbHabitEntryForDate } from '../factories'

/** Returns a Date N days before today, at midnight-agnostic local time. */
function daysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

describe('Habit Tracking', () => {
  describe('creating and checking off a binary habit', () => {
    it('creates a binary daily habit via the form and shows it in the Today list', async ({
      createTestApp,
    }) => {
      const { navigateTo, habits } = await createTestApp()

      await navigateTo({ name: RouteNames.Habits })
      await habits.createHabit({ name: 'Drink water' })

      await expect.element(habits.getTodayRow('Drink water')).toBeVisible()

      const repo = getHabitsRepository()
      const all = await repo.getAllHabits()
      expect(all).toHaveLength(1)
      expect(all[0]?.schedule).toEqual({ type: 'daily' })
      expect(all[0]?.kind).toEqual({ type: 'binary' })
    })

    it('toggles complete/incomplete and persists across navigation away and back', async ({
      createTestApp,
    }) => {
      const { navigateTo, habits } = await createTestApp()

      await navigateTo({ name: RouteNames.Habits })
      await habits.createHabit({ name: 'Stretch' })
      await habits.expectIncomplete('Stretch')

      await habits.toggleBinaryHabit('Stretch')
      await habits.expectComplete('Stretch')

      const repo = getHabitsRepository()
      const habit = (await repo.getAllHabits())[0]!
      await expect.poll(async () => (await repo.getEntriesForHabit(habit.id)).length).toBe(1)

      // Navigate away and back -- a fresh HabitsView mount re-fetches from
      // the DB, proving the toggle was persisted rather than only held in
      // in-memory state (same convention as weight-tracking.spec.ts).
      await navigateTo({ name: RouteNames.Settings })
      await navigateTo({ name: RouteNames.Habits })
      await habits.expectComplete('Stretch')

      // Toggling again clears the entry entirely (not just marks it 0).
      await habits.toggleBinaryHabit('Stretch')
      await habits.expectIncomplete('Stretch')
      await expect.poll(async () => (await repo.getEntriesForHabit(habit.id)).length).toBe(0)
    })

    it("updates today's compact grid cell when the habit is marked complete", async ({
      createTestApp,
    }) => {
      const { navigateTo, habits } = await createTestApp()

      await navigateTo({ name: RouteNames.Habits })
      await habits.createHabit({ name: 'Add weight' })

      const incompleteColor = habits.getTodayCompactGridColor('Add weight')

      await habits.toggleBinaryHabit('Add weight')
      await habits.expectComplete('Add weight')

      await expect
        .poll(() => habits.getTodayCompactGridColor('Add weight'))
        .not.toBe(incompleteColor)
    })
  })

  describe('quantity habit', () => {
    it('logs progress via +1, shows partial progress, then reaches target', async ({
      createTestApp,
    }) => {
      const { navigateTo, habits } = await createTestApp()

      await navigateTo({ name: RouteNames.Habits })
      await habits.createHabit({
        name: 'Drink water',
        kind: { type: 'quantity', target: '3', unit: 'glasses' },
      })

      await expect
        .element(habits.getTodayRow('Drink water').getByText('0 / 3 glasses'))
        .toBeVisible()

      await habits.clickIncrementQuantity('Drink water', 2)
      await expect
        .element(habits.getTodayRow('Drink water').getByText('2 / 3 glasses'))
        .toBeVisible()

      const repo = getHabitsRepository()
      const habit = (await repo.getAllHabits())[0]!
      await expect.poll(async () => (await repo.getEntriesForHabit(habit.id))[0]?.value).toBe(2)

      await habits.clickIncrementQuantity('Drink water', 1)
      await expect
        .element(habits.getTodayRow('Drink water').getByText('3 / 3 glasses'))
        .toBeVisible()
      await expect.poll(async () => (await repo.getEntriesForHabit(habit.id))[0]?.value).toBe(3)
    })

    it('shows weekly progress alongside the quantity progress for a weekly quantity habit', async ({
      createTestApp,
    }) => {
      const { navigateTo, habits } = await createTestApp()

      await navigateTo({ name: RouteNames.Habits })
      await habits.createHabit({
        name: 'Push-ups',
        schedule: { type: 'weekly', targetDaysPerWeek: '3' },
        kind: { type: 'quantity', target: '20', unit: 'reps' },
      })

      await habits.expectWeekProgress('Push-ups', 0, 3)

      await habits.clickIncrementQuantity('Push-ups', 20)
      await expect.element(habits.getTodayRow('Push-ups').getByText('20 / 20 reps')).toBeVisible()
      await habits.expectWeekProgress('Push-ups', 1, 3)
    })

    it('tolerates a corrupted zero quantity target without crashing (progress reads 0)', async ({
      createTestApp,
    }) => {
      // Not reachable via the form (min target is 1) -- seeded directly to
      // model a habit whose local data got corrupted after the fact.
      const habit = createDbHabit({
        name: 'Broken',
        orderIndex: 0,
        kind: { type: 'quantity', target: 0, unit: 'x' },
      })
      await getHabitsRepository().addHabit(habit)

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })

      await expect.element(habits.getTodayRow('Broken').getByText('0 / 0 x')).toBeVisible()
      const progress = habits.getTodayRow('Broken').getByRole('progressbar')
      await expect.element(progress).toHaveAttribute('aria-valuenow', '0')
    })
  })

  describe('weekly habit', () => {
    it('shows completed/target progress for the current week after checking off today', async ({
      createTestApp,
    }) => {
      const { navigateTo, habits } = await createTestApp()

      await navigateTo({ name: RouteNames.Habits })
      await habits.createHabit({
        name: 'Gym session',
        schedule: { type: 'weekly', targetDaysPerWeek: '3' },
      })

      await habits.expectWeekProgress('Gym session', 0, 3)

      await habits.toggleBinaryHabit('Gym session')

      await habits.expectWeekProgress('Gym session', 1, 3)
    })
  })

  describe('streaks', () => {
    it('shows a streak badge once a multi-day streak is seeded', async ({ createTestApp }) => {
      // Seed a 3-day streak ending yesterday (today deliberately left blank --
      // habitStats.currentStreak grants a grace day for "today not done yet").
      const habit = createDbHabit({ name: 'Journal', orderIndex: 0 })
      const repo = getHabitsRepository()
      await repo.addHabit(habit)
      const entries = createDbHabitEntriesForDays(habit.id, daysAgo(3), [1, 1, 1])
      for (const entry of entries) await repo.upsertEntry(entry)

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })

      await habits.expectStreakBadge('Journal', 3)
    })

    it('does not show a streak badge for a single completed day', async ({ createTestApp }) => {
      const habit = createDbHabit({ name: 'Journal', orderIndex: 0 })
      const repo = getHabitsRepository()
      await repo.addHabit(habit)
      await repo.upsertEntry(createDbHabitEntryForDate(habit.id, new Date()))

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })

      await habits.expectNoStreakBadge('Journal')
    })

    it('shows a streak badge on a quantity habit row too', async ({ createTestApp }) => {
      const habit = createDbHabit({
        name: 'Push-ups',
        orderIndex: 0,
        kind: { type: 'quantity', target: 20, unit: 'reps' },
      })
      const repo = getHabitsRepository()
      await repo.addHabit(habit)
      const entries = createDbHabitEntriesForDays(habit.id, daysAgo(3), [20, 20, 20])
      for (const entry of entries) await repo.upsertEntry(entry)

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })

      await habits.expectStreakBadge('Push-ups', 3)
    })
  })

  describe('editing and archiving', () => {
    it('edits a habit, archives it out of the Today list, and restores it with history preserved', async ({
      createTestApp,
    }) => {
      const { navigateTo, habits } = await createTestApp()

      await navigateTo({ name: RouteNames.Habits })
      await habits.createHabit({ name: 'Meditate' })
      await habits.toggleBinaryHabit('Meditate')
      await habits.expectComplete('Meditate')

      // Edit: rename.
      await habits.openEditForm('Meditate')
      await habits.fillName('Meditate daily')
      await habits.clickSave()

      await expect.element(habits.getTodayRow('Meditate daily')).toBeVisible()
      await expect.element(page.getByText('Meditate', { exact: true })).not.toBeInTheDocument()

      const repo = getHabitsRepository()
      const habit = (await repo.getAllHabits())[0]!
      expect(habit.name).toBe('Meditate daily')

      // Archive: leaves the Today list, entries preserved.
      await habits.requestArchive('Meditate daily')
      await habits.confirmArchive()

      await expect.element(habits.getTodayRow('Meditate daily')).not.toBeInTheDocument()
      await expect.poll(async () => (await repo.getHabitById(habit.id))?.archivedAt).not.toBeNull()
      expect(await repo.getEntriesForHabit(habit.id)).toHaveLength(1)

      // Unarchive: reappears in the Today list, history intact.
      await habits.openArchivedSection()
      await expect.element(habits.getArchivedRow('Meditate daily')).toBeVisible()
      await habits.unarchiveHabit('Meditate daily')

      await expect.element(habits.getTodayRow('Meditate daily')).toBeVisible()
      await habits.expectComplete('Meditate daily')
      expect(await repo.getEntriesForHabit(habit.id)).toHaveLength(1)
    })
  })

  describe('history grid', () => {
    it('renders a seeded day as complete and retro-toggles a past day', async ({
      createTestApp,
    }) => {
      const habit = createDbHabit({ name: 'Walk', orderIndex: 0 })
      const repo = getHabitsRepository()
      await repo.addHabit(habit)
      const twoDaysAgo = getStartOfDay(daysAgo(2))
      await repo.upsertEntry(
        createDbHabitEntryForDate(habit.id, new Date(twoDaysAgo), { id: generateId() }),
      )

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })

      await habits.expandDetails('Walk')
      await expect.poll(() => habits.countCompleteHistoryDays('Walk')).toBe(1)

      // Retro-toggle yesterday (not yet complete) on.
      const yesterday = getStartOfDay(daysAgo(1))
      await expect.element(habits.getHistoryDayCell('Walk', yesterday)).toBeVisible()
      await habits.toggleHistoryDay('Walk', yesterday)

      await expect.poll(() => habits.countCompleteHistoryDays('Walk')).toBe(2)
      const entries = await repo.getEntriesForHabit(habit.id)
      expect(entries.some((entry) => entry.date === yesterday)).toBe(true)
    })
  })

  describe('home card', () => {
    it('shows habits, supports quick check-off, and links to /habits', async ({
      createTestApp,
    }) => {
      const habit = createDbHabit({ name: 'Read', orderIndex: 0 })
      await getHabitsRepository().addHabit(habit)

      const { habits } = await createTestApp()

      await expect.element(page.getByText('Read')).toBeVisible()
      await habits.expectIncomplete('Read')
      const incompleteColor = habits.getTodayCompactGridColor('Read')

      await habits.toggleBinaryHabit('Read')
      await habits.expectComplete('Read')
      await expect.poll(() => habits.getTodayCompactGridColor('Read')).not.toBe(incompleteColor)

      await habits.navigateToHabitsFromHomeCard()
    })
  })

  describe('form validation', () => {
    it('rejects an empty name', async ({ createTestApp }) => {
      const { navigateTo, habits } = await createTestApp()

      await navigateTo({ name: RouteNames.Habits })
      await habits.openCreateForm()

      expect(habits.isSaveDisabled()).toBe(true)
      await expect.element(page.getByRole('alert').first()).toBeVisible()

      await habits.fillName('Read')
      expect(habits.isSaveDisabled()).toBe(false)
    })

    it('constrains the weekly target field to 1-7', async ({ createTestApp }) => {
      const { navigateTo, habits } = await createTestApp()

      await navigateTo({ name: RouteNames.Habits })
      await habits.openCreateForm()
      await habits.selectSchedule('weekly')

      const input = page
        .getByRole('dialog')
        .getByRole('spinbutton', { name: /target days per week/i })
      await expect.element(input).toHaveAttribute('aria-valuemin', '1')
      await expect.element(input).toHaveAttribute('aria-valuemax', '7')
    })

    it('constrains the quantity target field to 1-9999', async ({ createTestApp }) => {
      const { navigateTo, habits } = await createTestApp()

      await navigateTo({ name: RouteNames.Habits })
      await habits.openCreateForm()
      await habits.selectKind('quantity')

      const input = page.getByRole('dialog').getByRole('spinbutton', { name: /^target$/i })
      await expect.element(input).toHaveAttribute('aria-valuemin', '1')
      await expect.element(input).toHaveAttribute('aria-valuemax', '9999')
    })

    it('flags an out-of-range weekly target and disables save (corrupted local data)', async ({
      createTestApp,
    }) => {
      // Not reachable via the form (NumberField clamps to 1-7) -- seeded
      // directly to model a habit whose local data got corrupted after the
      // fact, then opened for editing.
      const habit = createDbHabit({
        name: 'Gym session',
        orderIndex: 0,
        schedule: { type: 'weekly', targetDaysPerWeek: 10 },
      })
      await getHabitsRepository().addHabit(habit)

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })
      await habits.openEditForm('Gym session')

      await expect
        .element(page.getByRole('dialog').getByText('Must be between 1 and 7'))
        .toBeVisible()
      expect(habits.isSaveDisabled()).toBe(true)
    })

    it('flags an out-of-range quantity target and disables save (corrupted local data)', async ({
      createTestApp,
    }) => {
      const habit = createDbHabit({
        name: 'Broken',
        orderIndex: 0,
        kind: { type: 'quantity', target: 0, unit: 'x' },
      })
      await getHabitsRepository().addHabit(habit)

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })
      await habits.openEditForm('Broken')

      await expect
        .element(page.getByRole('dialog').getByText('Must be between 1 and 9999'))
        .toBeVisible()
      expect(habits.isSaveDisabled()).toBe(true)
    })
  })

  describe('form interactions', () => {
    it('discards changes when the form is cancelled', async ({ createTestApp }) => {
      const { navigateTo, habits } = await createTestApp()

      await navigateTo({ name: RouteNames.Habits })
      await habits.openCreateForm()
      await habits.fillName('Abandoned habit')
      await habits.clickCancel()

      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
      const repo = getHabitsRepository()
      expect(await repo.getAllHabits()).toEqual([])
    })

    it('discards changes when the form is closed via Escape', async ({ createTestApp }) => {
      const { navigateTo, habits } = await createTestApp()

      await navigateTo({ name: RouteNames.Habits })
      await habits.openCreateForm()
      await habits.fillName('Abandoned habit')
      await userEvent.keyboard('{Escape}')

      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
      const repo = getHabitsRepository()
      expect(await repo.getAllHabits()).toEqual([])
    })

    it('sets a custom icon via a preset button or by typing it directly', async ({
      createTestApp,
    }) => {
      const { navigateTo, habits } = await createTestApp()

      await navigateTo({ name: RouteNames.Habits })
      await habits.openCreateForm()
      await habits.fillName('Read')
      await habits.clickIconPreset('📚')
      await habits.clickSave()

      const repo = getHabitsRepository()
      const withPreset = (await repo.getAllHabits())[0]!
      expect(withPreset.icon).toBe('📚')

      await habits.openEditForm('Read')
      await habits.setIcon('🎯')
      await habits.clickSave()

      const withTypedIcon = (await repo.getAllHabits())[0]!
      expect(withTypedIcon.icon).toBe('🎯')
    })

    it('creates a habit that auto-links to completed workouts when the switch is toggled', async ({
      createTestApp,
    }) => {
      const { navigateTo, habits } = await createTestApp()

      await navigateTo({ name: RouteNames.Habits })
      await habits.createHabit({ name: 'Train', autoLink: true })

      const repo = getHabitsRepository()
      const habit = (await repo.getAllHabits())[0]!
      expect(habit.autoLink).toBe('completed-workout')
    })

    it('ignores an attempt to deselect the schedule/kind toggle groups (single-select, one must stay chosen)', async ({
      createTestApp,
    }) => {
      const { navigateTo, habits } = await createTestApp()

      await navigateTo({ name: RouteNames.Habits })
      await habits.openCreateForm()

      // Both toggle groups default to their first option already selected --
      // clicking it again attempts to deselect it (reka-ui's single-select
      // ToggleGroup emits an empty value), which the form's change handlers
      // must ignore rather than clearing the schedule/kind.
      await habits.selectSchedule('daily')
      await habits.selectKind('binary')

      await habits.fillName('Still valid')
      expect(habits.isSaveDisabled()).toBe(false)

      await habits.clickSave()
      const repo = getHabitsRepository()
      const habit = (await repo.getAllHabits())[0]!
      expect(habit.schedule).toEqual({ type: 'daily' })
      expect(habit.kind).toEqual({ type: 'binary' })
    })
  })
})
