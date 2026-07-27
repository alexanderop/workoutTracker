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

/**
 * Stays in the browser tier: it drives the mounted habit UI through real DOM
 * events (`userEvent`, `page`) via `createTestApp`, and asserts through
 * `getHabitsRepository()` backed by real IndexedDB -- a real DOM plus a real
 * IndexedDB-backed repository wired end to end through the routed app, which
 * the Node `unit` tier has no globals for.
 */
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

    it(
      'shows weekly progress alongside the quantity progress for a weekly quantity habit',
      { timeout: 15_000 },
      async ({ createTestApp }) => {
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
      },
    )

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

      await habits.openDetails('Walk')
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

    it('offers no one-tap control for a quantity habit, so a stray tap cannot log a full day', async ({
      createTestApp,
    }) => {
      const habit = createDbHabit({
        name: 'Water',
        orderIndex: 0,
        kind: { type: 'quantity', target: 3, unit: 'L' },
      })
      const repo = getHabitsRepository()
      await repo.addHabit(habit)

      const { habits } = await createTestApp()

      await expect.element(habits.getHomeCard().getByText('Water')).toBeVisible()

      // `/habits` rows mode deliberately gives quantity habits a tap-to-target
      // control. The home card must not: it has no stepper, no confirmation and
      // no undo, so one stray tap would write 3 of 3 L for the day.
      await expect
        .element(habits.getHomeCard().getByRole('button', { name: /^Mark Water/i }))
        .not.toBeInTheDocument()
      expect(await repo.getEntriesForHabit(habit.id)).toHaveLength(0)
    })
  })

  describe('view modes', () => {
    it('defaults to cards, so a user who never picks sees the layout they had', async ({
      createTestApp,
    }) => {
      await getHabitsRepository().addHabit(createDbHabit({ name: 'Read', orderIndex: 0 }))

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })

      await expect.element(habits.getViewModeToggle()).toBeVisible()
      await expect.poll(() => habits.getActiveViewMode()).toBe('cards')
      // The card layout is the one carrying the expandable details.
      await expect
        .element(habits.getTodayRow('Read').getByRole('button', { name: /show details/i }))
        .toBeVisible()
    })

    it('switches to the compact rows layout and keeps check-off working there', async ({
      createTestApp,
    }) => {
      await getHabitsRepository().addHabit(createDbHabit({ name: 'Read', orderIndex: 0 }))

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })

      await habits.switchViewMode('rows')
      await expect.poll(() => habits.getActiveViewMode()).toBe('rows')

      // Same habit, different layout -- and still tickable without switching back.
      await expect.element(habits.getTodayRow('Read')).toBeVisible()
      await habits.expectIncomplete('Read')
      await habits.toggleBinaryHabit('Read')
      await habits.expectComplete('Read')
    })

    it('persists the chosen mode across a full app remount (cold start)', async ({
      createTestApp,
    }) => {
      await getHabitsRepository().addHabit(createDbHabit({ name: 'Read', orderIndex: 0 }))

      const first = await createTestApp()
      await first.navigateTo({ name: RouteNames.Habits })
      await first.habits.switchViewMode('rows')
      await expect.poll(() => first.habits.getActiveViewMode()).toBe('rows')

      // A second app instance is what reopening the PWA actually does: fresh
      // component state, same IndexedDB.
      const second = await createTestApp()
      await second.navigateTo({ name: RouteNames.Habits })

      await expect.poll(() => second.habits.getActiveViewMode()).toBe('rows')
    })

    it('reaches edit from the compact rows layout without switching back to cards', async ({
      createTestApp,
    }) => {
      await getHabitsRepository().addHabit(createDbHabit({ name: 'Read', orderIndex: 0 }))

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })
      await habits.switchViewMode('rows')

      // openEditForm goes through the detail sheet, which is the whole point:
      // the same route to management from whichever layout is on screen.
      await habits.openEditForm('Read')
      await habits.fillName('Read more')
      await habits.clickSave()

      await expect.poll(() => habits.getActiveViewMode()).toBe('rows')
      await expect.element(habits.getTodayRow('Read more')).toBeVisible()
    })

    it('reaches archive from the compact rows layout', async ({ createTestApp }) => {
      await getHabitsRepository().addHabit(createDbHabit({ name: 'Read', orderIndex: 0 }))

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })
      await habits.switchViewMode('rows')

      await habits.requestArchive('Read')
      await habits.confirmArchive()

      await expect.poll(async () => (await getHabitsRepository().getAllHabits()).length).toBe(0)
    })

    it('retro-toggles a past day from the compact rows layout', async ({ createTestApp }) => {
      const habit = createDbHabit({ name: 'Walk', orderIndex: 0 })
      const repo = getHabitsRepository()
      await repo.addHabit(habit)

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })
      await habits.switchViewMode('rows')

      await habits.openDetails('Walk')
      const yesterday = getStartOfDay(daysAgo(1))
      await habits.toggleHistoryDay('Walk', yesterday)

      await expect
        .poll(async () =>
          (await repo.getEntriesForHabit(habit.id)).some((e) => e.date === yesterday),
        )
        .toBe(true)
    })

    it('logs an exact quantity from the compact rows layout', async ({ createTestApp }) => {
      const habit = createDbHabit({
        name: 'Water',
        orderIndex: 0,
        kind: { type: 'quantity', target: 3, unit: 'L' },
      })
      const repo = getHabitsRepository()
      await repo.addHabit(habit)

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })
      await habits.switchViewMode('rows')

      // The stepper has no room in a compact row; it lives in the sheet.
      await habits.openDetails('Water')
      await habits.clickIncrementQuantity('Water', 2)

      await expect.poll(async () => (await repo.getEntriesForHabit(habit.id))[0]?.value).toBe(2)
    })

    it('lets a quantity habit be ticked straight to target from a compact row', async ({
      createTestApp,
    }) => {
      const habit = createDbHabit({
        name: 'Water',
        orderIndex: 0,
        kind: { type: 'quantity', target: 3, unit: 'L' },
      })
      const repo = getHabitsRepository()
      await repo.addHabit(habit)

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })
      await habits.switchViewMode('rows')

      // The control announces what it actually does -- it writes the whole
      // target, so "mark complete" would misdescribe it.
      await expect.element(page.getByRole('button', { name: 'Log Water: 3 L' })).toBeVisible()

      // Before this change a compact row rendered a spacer for quantity
      // habits, so they could not be logged from the row at all.
      await habits.toggleBinaryHabit('Water')

      await expect.poll(async () => (await repo.getEntriesForHabit(habit.id))[0]?.value).toBe(3)
    })

    it('heads the compact rows with this week, today marked', async ({ createTestApp }) => {
      await getHabitsRepository().addHabit(createDbHabit({ name: 'Read', orderIndex: 0 }))

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })
      await habits.switchViewMode('rows')

      const header = habits.getRowDateHeader()
      await expect.element(header).toBeVisible()

      // Seven columns, matching the seven heatmap cells in each row.
      expect(await habits.countRowDateHeaderColumns()).toBe(7)

      // ...and each label has to fit the column it labels. Geometry alone is
      // not legibility: the header once shared the grid exactly while every
      // label overflowed and painted over its neighbours.
      expect(await habits.findOverflowingRowDateHeaderColumns()).toEqual([])

      // ...and each label has to sit over the cell it labels. Sharing the grid
      // template is not enough: the header's spacers stand in for the row's
      // icon and check control, so resizing either slides the heatmap column
      // out from under the header. Sub-pixel rounding only.
      expect(await habits.getRowHeaderCellDrift('Read')).toBeLessThan(1)

      // Today has to be findable without counting in from the edge: exactly
      // one column is marked, and it carries today's date. The date is what
      // disambiguates a narrow weekday, which repeats (T/T, S/S).
      const todayColumns = await habits.getRowDateHeaderTodayColumns()
      expect(todayColumns).toHaveLength(1)
      expect(todayColumns[0]).toContain(String(new Date().getDate()))
    })

    it('lays habits out as tiles in grid mode and ticks one off in place', async ({
      createTestApp,
    }) => {
      const repo = getHabitsRepository()
      await repo.addHabit(createDbHabit({ name: 'Read', orderIndex: 0 }))
      await repo.addHabit(createDbHabit({ name: 'Walk', orderIndex: 1 }))

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })
      await habits.switchViewMode('grid')

      await expect.element(habits.getTileGrid()).toBeVisible()
      await expect.element(habits.getTodayRow('Read')).toBeVisible()
      await expect.element(habits.getTodayRow('Walk')).toBeVisible()

      // Check-off is one tap in the densest mode too -- no sheet required.
      await habits.toggleBinaryHabit('Read')
      await habits.expectComplete('Read')
      await habits.expectIncomplete('Walk')
    })

    it('draws each tile a whole number of weeks, so a row is a week', async ({ createTestApp }) => {
      await getHabitsRepository().addHabit(createDbHabit({ name: 'Read', orderIndex: 0 }))

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })
      await habits.switchViewMode('grid')

      // A calendar month padded to whole Monday weeks is 4 to 6 rows of 7. The
      // multiple-of-7 check is what fails if the grid is ever pointed back at a
      // trailing day window, which no other assertion in this file notices.
      const cells = habits.getTileGridCellCount('Read')
      expect(cells % 7).toBe(0)
      expect(cells).toBeGreaterThanOrEqual(28)
      expect(cells).toBeLessThanOrEqual(42)

      // The caption has to name the month the cells actually cover.
      const month = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      await expect.element(habits.getTodayRow('Read').getByText(month)).toBeVisible()
    })

    it('reaches the detail sheet from a tile, so grid mode is not a dead end', async ({
      createTestApp,
    }) => {
      await getHabitsRepository().addHabit(createDbHabit({ name: 'Read', orderIndex: 0 }))

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })
      await habits.switchViewMode('grid')

      await habits.openEditForm('Read')
      await habits.fillName('Read more')
      await habits.clickSave()

      await expect.poll(() => habits.getActiveViewMode()).toBe('grid')
      await expect.element(habits.getTodayRow('Read more')).toBeVisible()
    })

    it('keeps every habit reachable in grid mode at seven habits', async ({ createTestApp }) => {
      const repo = getHabitsRepository()
      const names = ['Walk', 'Read', 'Workout', 'Deep work', 'Steps', 'Calories', 'Protein']
      for (const [index, name] of names.entries()) {
        await repo.addHabit(createDbHabit({ name, orderIndex: index }))
      }

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })
      await habits.switchViewMode('grid')

      // Every tile rendered, and every check control is its own tap target.
      for (const name of names) {
        await expect.element(habits.getTodayRow(name)).toBeVisible()
      }
      expect(await habits.countVisibleCheckControls()).toBe(names.length)

      // Truncated names still have to tell the habits apart. At ~4 characters
      // "Meditate" and "Medication" become the same string, so the name needs
      // real width -- 70px is roughly eight characters at this font size.
      const nameWidths = await habits.getTileNameWidths()
      expect(nameWidths).toHaveLength(names.length)
      expect(Math.min(...nameWidths)).toBeGreaterThan(70)
    })

    it('names the sheet stepper even while the card renders its own', async ({ createTestApp }) => {
      const habit = createDbHabit({
        name: 'Water',
        orderIndex: 0,
        kind: { type: 'quantity', target: 3, unit: 'L' },
      })
      await getHabitsRepository().addHabit(habit)

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })

      // `cards` mode already shows a stepper inline, so opening the sheet puts
      // a second one on screen. If both claim the same input id, the sheet's
      // label resolves to the card's input and the sheet stepper goes unnamed.
      await habits.openDetails('Water')

      await expect
        .element(habits.getDetailSheet().getByRole('spinbutton', { name: /^Log Water$/ }))
        .toBeVisible()
    })

    it('ignores a repeat tap on the active mode rather than emptying the page', async ({
      createTestApp,
    }) => {
      await getHabitsRepository().addHabit(createDbHabit({ name: 'Read', orderIndex: 0 }))

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })

      await habits.switchViewMode('rows')
      await expect.poll(() => habits.getActiveViewMode()).toBe('rows')

      // ToggleGroup emits '' on deselect; there is no "no layout" state.
      await habits.switchViewMode('rows')
      await expect.poll(() => habits.getActiveViewMode()).toBe('rows')
      await expect.element(habits.getTodayRow('Read')).toBeVisible()
    })
  })

  /**
   * The accent a user picks per habit reaches the screen through a CSS cascade
   * layer, which no class-name or aria assertion can see. It once did not
   * reach it at all -- the paint sat in a layer Tailwind's own utilities
   * outrank, so every control in every layout rendered the same neutral grey
   * while the whole suite stayed green. These read computed colours because
   * that is the only thing that notices.
   */
  describe('accent colours', () => {
    async function seedTwoAccents(): Promise<void> {
      const repo = getHabitsRepository()
      await repo.addHabit(createDbHabit({ name: 'Read', accent: 'green', orderIndex: 0 }))
      await repo.addHabit(createDbHabit({ name: 'Walk', accent: 'rose', orderIndex: 1 }))
    }

    for (const mode of ['cards', 'rows', 'grid'] as const) {
      it(`paints each habit's check control in its own accent in ${mode} mode`, async ({
        createTestApp,
      }) => {
        await seedTwoAccents()

        const { navigateTo, habits } = await createTestApp()
        await navigateTo({ name: RouteNames.Habits })
        await habits.switchViewMode(mode)
        await expect.poll(() => habits.getActiveViewMode()).toBe(mode)

        // Two habits, two accents: identical colours mean the accent was
        // discarded somewhere between the picker and the pixel.
        expect(habits.getCheckControlColor('Read')).not.toBe(habits.getCheckControlColor('Walk'))

        // ...and the accent has to survive the completed state too, which is
        // painted by a different rule.
        await habits.toggleBinaryHabit('Read')
        await habits.expectComplete('Read')
        expect(habits.getCheckControlColor('Read')).not.toBe(habits.getCheckControlColor('Walk'))
      })
    }

    it('rings the chosen swatch in the form rather than painting the ring its own colour', async ({
      createTestApp,
    }) => {
      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })
      await habits.openCreateForm()

      await habits.selectAccent('Green')

      const { border, background } = habits.getAccentSwatchColors('Green')
      expect(background).not.toBe('rgba(0, 0, 0, 0)')
      expect(border).not.toBe(background)
    })

    it("tints a habit's untouched heatmap days with its own accent", async ({ createTestApp }) => {
      await seedTwoAccents()

      const { navigateTo, habits } = await createTestApp()
      await navigateTo({ name: RouteNames.Habits })

      expect(habits.getTodayCompactGridColor('Read')).not.toBe(
        habits.getTodayCompactGridColor('Walk'),
      )
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

    it('picks a bundled icon and clears it again', async ({ createTestApp }) => {
      const { navigateTo, habits } = await createTestApp()

      await navigateTo({ name: RouteNames.Habits })
      await habits.openCreateForm()
      await habits.fillName('Read')
      await habits.clickIconPreset('Reading')
      await habits.clickSave()

      const repo = getHabitsRepository()
      const withPreset = (await repo.getAllHabits())[0]!
      expect(withPreset.icon).toBe('habit-read')
      await expect.element(page.getByTestId('app-icon-habit-read').first()).toBeVisible()

      await habits.openEditForm('Read')
      await habits.clickIconPreset('No icon')
      await habits.clickSave()

      const cleared = (await repo.getAllHabits())[0]!
      expect(cleared.icon).toBeNull()
      await expect.element(page.getByTestId('app-icon-habit-default').first()).toBeVisible()
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
