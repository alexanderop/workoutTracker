import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { addDays, subMonths, addMonths, format, startOfWeek } from 'date-fns'
import { createTestApp } from '../helpers/createTestApp'
import { seedCompletedWorkout } from '../helpers/dbAssertions'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { dbWorkoutBuilder as databaseWorkoutBuilder } from '../factories/dbWorkout.factory'

// Helper to get week strip button by current month
function getWeekStripButton() {
  const currentMonth = format(new Date(), 'MMMM yyyy')
  return page.getByRole('button', { name: new RegExp(currentMonth, 'i') })
}

describe('Workout Calendar', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Week Strip', () => {
    it('displays current week with correct dates', async () => {
      const { cleanup } = await createTestApp()

      // Week strip should be visible on home page (shows month/year)
      const weekStrip = getWeekStripButton()
      await expect.element(weekStrip).toBeVisible()

      // Should show today's date highlighted
      const today = new Date()
      const todayDate = today.getDate().toString()

      // Find the today indicator (primary background)
      // Use .first() because todayDate (e.g. "20") also matches in "December 2025"
      await expect.element(page.getByText(todayDate, { exact: true }).first()).toBeVisible()

      cleanup()
    })

    it('shows green dot on days with completed workouts', async () => {
      // Seed a workout completed today
      const today = new Date()
      const workout = databaseWorkoutBuilder()
        .withName('Morning Workout')
        .withTimestamps(today.getTime() - 3_600_000, today.getTime())
        .withStrengthBlock({ name: 'Squat' })
        .build()

      await seedCompletedWorkout(workout)

      const { cleanup } = await createTestApp()

      // Wait for the week strip to load
      await expect.element(getWeekStripButton()).toBeVisible()

      // The green dot has aria-label "Workout completed"
      await expect.element(page.getByLabelText(/workout completed/i).first()).toBeVisible()

      cleanup()
    })

    it('shows multiple green dots for multiple workout days', async () => {
      // Use dates guaranteed to be in the same week (Mon-Sun with weekStartsOn: 1)
      // Start from Monday of current week to avoid week boundary issues
      const today = new Date()
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday
      const tuesday = addDays(weekStart, 1)
      const wednesday = addDays(weekStart, 2)

      // Seed workouts on two different days within the same week
      const workoutTuesday = databaseWorkoutBuilder()
        .withName('Tuesday Workout')
        .withTimestamps(tuesday.getTime() - 3_600_000, tuesday.getTime())
        .withStrengthBlock({ name: 'Bench Press' })
        .build()

      const workoutWednesday = databaseWorkoutBuilder()
        .withName('Wednesday Workout')
        .withTimestamps(wednesday.getTime() - 3_600_000, wednesday.getTime())
        .withStrengthBlock({ name: 'Deadlift' })
        .build()

      await seedCompletedWorkout(workoutTuesday)
      await seedCompletedWorkout(workoutWednesday)

      const { cleanup } = await createTestApp()

      // Wait for week strip to load
      await expect.element(getWeekStripButton()).toBeVisible()

      // Wait for workout data to load and render (async loadWorkouts in onMounted)
      // Use longer timeout to handle race condition with IndexedDB
      await expect
        .poll(
          async () => {
            const dots = await page.getByLabelText(/workout completed/i).all()
            return dots.length
          },
          { timeout: 5000 },
        )
        .toBeGreaterThanOrEqual(2)

      cleanup()
    })

    it('displays total weekly workout duration', async () => {
      // Use dates guaranteed to be in the same week to avoid week boundary issues
      const today = new Date()
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday
      const tuesday = addDays(weekStart, 1)
      const wednesday = addDays(weekStart, 2)

      // Seed workouts with known durations (1h 30m + 45m = 2h 15m)
      const workout1 = databaseWorkoutBuilder()
        .withName('Morning Workout')
        .withDuration(5400) // 1h 30m = 90 min = 5400 seconds
        .withTimestamps(tuesday.getTime() - 5_400_000, tuesday.getTime())
        .withStrengthBlock({ name: 'Squat' })
        .build()

      const workout2 = databaseWorkoutBuilder()
        .withName('Evening Workout')
        .withDuration(2700) // 45m = 2700 seconds
        .withTimestamps(wednesday.getTime() - 2_700_000, wednesday.getTime())
        .withStrengthBlock({ name: 'Bench Press' })
        .build()

      await seedCompletedWorkout(workout1)
      await seedCompletedWorkout(workout2)

      const { cleanup } = await createTestApp()

      // Wait for week strip to load and show the total duration
      // Use longer timeout to handle async data loading
      await expect.element(page.getByText('2h 15m'), { timeout: 5000 }).toBeVisible()

      cleanup()
    })

    it('displays 0m when no workouts this week', async () => {
      const { cleanup } = await createTestApp()

      // Week strip should show 0m when no workouts
      await expect.element(page.getByText('0m')).toBeVisible()

      cleanup()
    })
  })

  describe('Calendar Sheet', () => {
    it('opens calendar sheet when clicking week strip', async () => {
      const { cleanup } = await createTestApp()

      // Click the week strip
      const weekStrip = getWeekStripButton()
      await userEvent.click(weekStrip)

      // Calendar sheet should open (SheetContent appears)
      await expect.element(page.getByRole('dialog')).toBeVisible()

      // Should show month heading in the sheet title
      const currentMonth = format(new Date(), 'MMMM yyyy')
      await expect
        .element(page.getByRole('heading', { name: currentMonth, exact: true }))
        .toBeVisible()

      cleanup()
    })

    it('allows navigating to previous and next months', async () => {
      const { cleanup } = await createTestApp()

      // Open calendar sheet
      const weekStrip = getWeekStripButton()
      await userEvent.click(weekStrip)

      await expect.element(page.getByRole('dialog')).toBeVisible()

      // Get current month display
      const currentMonth = format(new Date(), 'MMMM yyyy')
      await expect
        .element(page.getByRole('heading', { name: currentMonth, exact: true }))
        .toBeVisible()

      // Click previous month button
      const previousButton = page.getByRole('button', { name: /previous month/i })
      await userEvent.click(previousButton)

      // Should show previous month in sheet title
      const previousMonth = format(subMonths(new Date(), 1), 'MMMM yyyy')
      await expect
        .element(page.getByRole('heading', { name: previousMonth, exact: true }))
        .toBeVisible()

      // Click next month button twice to go forward
      const nextButton = page.getByRole('button', { name: /next month/i })
      await userEvent.click(nextButton)
      await userEvent.click(nextButton)

      // Should show next month
      const nextMonth = format(addMonths(new Date(), 1), 'MMMM yyyy')
      await expect
        .element(page.getByRole('heading', { name: nextMonth, exact: true }))
        .toBeVisible()

      cleanup()
    })

    it('updates calendar grid when navigating months (not just heading)', async () => {
      // Seed a workout for a specific date in previous month
      const today = new Date()
      // Same day-of-month one month back (date-fns clamps overflow), so the
      // date is always in the previous month -- subDays(today, 35) lands two
      // months back early in the month (e.g. July 5 - 35d = May 31).
      const previousMonthDate = subMonths(today, 1)

      const workout = databaseWorkoutBuilder()
        .withName('Previous Month Workout')
        .withDuration(1800)
        .withTimestamps(previousMonthDate.getTime() - 1_800_000, previousMonthDate.getTime())
        .withStrengthBlock({ name: 'Squat' })
        .build()

      await seedCompletedWorkout(workout)

      const { cleanup } = await createTestApp()

      // Open calendar sheet
      const weekStrip = getWeekStripButton()
      await userEvent.click(weekStrip)
      await expect.element(page.getByRole('dialog')).toBeVisible()

      // Current month should NOT show the workout (it's in previous month)
      // The calendar grid uses CalendarHeading for its internal heading display
      const currentMonthHeading = format(today, 'MMMM yyyy')
      await expect
        .element(page.getByRole('heading', { name: currentMonthHeading, exact: true }))
        .toBeVisible()

      // Navigate to previous month
      const previousButton = page.getByRole('button', { name: /previous month/i })
      await userEvent.click(previousButton)

      // Sheet title should update to previous month
      const previousMonthHeading = format(subMonths(today, 1), 'MMMM yyyy')
      await expect
        .element(page.getByRole('heading', { name: previousMonthHeading, exact: true }))
        .toBeVisible()

      // CRITICAL: The CalendarRoot's internal heading should ALSO show previous month
      // If bug exists, CalendarHeading stays on current month while sheet title changes
      // CalendarHeading renders inside CalendarHeader and shows the month the grid displays
      const calendarHeadingLocator = page.getByText(previousMonthHeading)
      await expect.element(calendarHeadingLocator.first()).toBeVisible()

      // Click on the day that has the workout (verify grid actually changed)
      // Use data-slot attribute to find calendar cell triggers, then filter by day number
      const workoutDayNumber = format(previousMonthDate, 'd')
      const dayCell = page.getByRole('gridcell').filter({ hasText: workoutDayNumber }).first()
      await dayCell.click()

      // If the grid updated correctly, clicking this day should show the workout
      // Use .first() since the name appears in both the card and the calendar tooltip
      await expect.element(page.getByText('Previous Month Workout').first()).toBeVisible()

      cleanup()
    })

    it('shows prompt to select a day when calendar opens', async () => {
      const { cleanup } = await createTestApp()

      // Open calendar sheet
      const weekStrip = getWeekStripButton()
      await userEvent.click(weekStrip)

      await expect.element(page.getByRole('dialog')).toBeVisible()

      // Should show the select day prompt initially
      await expect.element(page.getByText(/select a day/i)).toBeVisible()

      cleanup()
    })

    it('displays calendar with correct structure', async () => {
      const { cleanup } = await createTestApp()

      // Open calendar sheet
      const weekStrip = getWeekStripButton()
      await userEvent.click(weekStrip)

      await expect.element(page.getByRole('dialog')).toBeVisible()

      // Should have navigation buttons
      await expect.element(page.getByRole('button', { name: /previous month/i })).toBeVisible()
      await expect.element(page.getByRole('button', { name: /next month/i })).toBeVisible()

      // Should have weekday headers (at least one - use first to avoid strict mode)
      await expect.element(page.getByText('Mon').first()).toBeVisible()

      cleanup()
    })

    it('should start the week on Monday to match the home week strip', async () => {
      const { cleanup } = await createTestApp()

      // Open calendar sheet
      const weekStrip = getWeekStripButton()
      await userEvent.click(weekStrip)
      await expect.element(page.getByRole('dialog')).toBeVisible()

      // The month grid's weekday headers must start with Monday, the same
      // convention the home week strip already uses (UX review finding:
      // week strip starts Monday, month calendar started Sunday). The head
      // row isn't exposed with table-header roles (flex layout resets the
      // implicit ARIA table semantics), so match on DOM order instead.
      // Scoped to the dialog: the week strip behind it also renders "Mon".
      const dialog = page.getByRole('dialog')
      const firstHeader = dialog.getByText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/).first()
      await expect.element(firstHeader).toHaveTextContent('Mon')

      cleanup()
    })

    it('shows green dots on calendar for workout days', async () => {
      // Seed a workout for today
      const today = new Date()
      const workout = databaseWorkoutBuilder()
        .withName('Push Day')
        .withDuration(1800) // 30 minutes
        .withTimestamps(today.getTime() - 1_800_000, today.getTime())
        .withStrengthBlock({ name: 'Bench Press' })
        .build()

      await seedCompletedWorkout(workout)

      const { cleanup } = await createTestApp()

      // Open calendar sheet
      const weekStrip = getWeekStripButton()
      await userEvent.click(weekStrip)

      await expect.element(page.getByRole('dialog')).toBeVisible()

      // The calendar should have green dots for workout days
      // We verify by counting workout indicators
      await expect
        .poll(async () => {
          const dots = await page.getByLabelText(/workout completed/i).all()
          // Should have dots in both the week strip AND calendar
          return dots.length
        })
        .toBeGreaterThanOrEqual(1)

      cleanup()
    })
  })
})
