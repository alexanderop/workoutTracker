import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { useOnboarding } from '@/features/onboarding/composables/useOnboarding'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

/**
 * Integration tests for the onboarding feature.
 * Tests the multi-step onboarding flow for first-time users.
 */
describe('Onboarding Flow', () => {
  // Reset onboarding state before all tests to clear any state from previous test files
  beforeAll(() => {
    useOnboarding().$reset()
  })

  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Skip Flow', () => {
    it('skips onboarding from welcome slide and navigates to home', async () => {
      const { router, cleanup } = await createTestApp({ initialRoute: '/onboarding' })

      // Wait for welcome slide
      await expect.element(page.getByRole('heading', { name: /workout tracker/i })).toBeVisible()

      // Click Skip to App
      await userEvent.click(page.getByRole('button', { name: /skip to app/i }))

      // Verify navigated to home
      await expect.poll(() => router.currentRoute.value.path).toBe('/')

      // Verify onboarding marked as completed
      await expect
        .poll(async () => {
          const state = await db.onboarding.get('onboarding')
          return state?.completed
        })
        .toBe(true)

      cleanup()
    })

    it('skip button is visible and functional on every slide', async () => {
      const { cleanup } = await createTestApp({ initialRoute: '/onboarding' })

      // Start the tour
      await expect.element(page.getByRole('heading', { name: /workout tracker/i })).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /start tour/i }))

      // Verify skip button is visible on slide 2 (PWA Install)
      await expect.element(page.getByText(/install for the best experience/i)).toBeVisible()
      await expect.element(page.getByRole('button', { name: /skip/i })).toBeVisible()

      // Navigate to slide 3
      await userEvent.click(page.getByRole('button', { name: /next/i }))
      await expect.element(page.getByText(/build workouts on the fly/i)).toBeVisible()
      await expect.element(page.getByRole('button', { name: /skip/i })).toBeVisible()

      // Navigate to slide 4
      await userEvent.click(page.getByRole('button', { name: /next/i }))
      await expect.element(page.getByText(/save your favorites/i)).toBeVisible()
      await expect.element(page.getByRole('button', { name: /skip/i })).toBeVisible()

      // Navigate to slide 5
      await userEvent.click(page.getByRole('button', { name: /next/i }))
      await expect.element(page.getByText(/track your progress/i)).toBeVisible()
      await expect.element(page.getByRole('button', { name: /skip/i })).toBeVisible()

      // Navigate to slide 6 (checklist)
      await userEvent.click(page.getByRole('button', { name: /next/i }))
      await expect.element(page.getByText(/you're ready/i)).toBeVisible()
      await expect.element(page.getByRole('button', { name: /skip/i })).toBeVisible()

      cleanup()
    })
  })

  describe('Resume Flow', () => {
    it('persists current step and resumes on return', async () => {
      // First session: navigate to slide 3
      const { cleanup } = await createTestApp({ initialRoute: '/onboarding' })

      await expect.element(page.getByRole('heading', { name: /workout tracker/i })).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /start tour/i }))

      // Slide 2: PWA Install
      await expect.element(page.getByText(/install for the best experience/i)).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /next/i }))

      // Slide 3: Quick Workout
      await expect.element(page.getByText(/build workouts on the fly/i)).toBeVisible()

      // Verify step is persisted in database
      await expect
        .poll(async () => {
          const state = await db.onboarding.get('onboarding')
          return state?.currentStep
        })
        .toBe(2) // 0-indexed, slide 3 = step 2

      cleanup()

      // Second session: should resume at slide 3
      const { cleanup: cleanup2 } = await createTestApp({ initialRoute: '/onboarding' })

      // Should resume at Quick Workout slide (instant jump)
      await expect.element(page.getByText(/build workouts on the fly/i)).toBeVisible()

      cleanup2()
    })
  })

  describe('Router Guard', () => {
    it('redirects incomplete users to onboarding when navigating to home', async () => {
      const { router, cleanup } = await createTestApp()

      // Router guard should redirect to onboarding since not completed
      await expect.poll(() => router.currentRoute.value.path).toBe('/onboarding')

      cleanup()
    })

    it('redirects completed users away from onboarding to home', async () => {
      // Mark onboarding as completed first
      await db.onboarding.put({
        id: 'onboarding',
        completed: true,
        currentStep: 0,
      })

      const { router, cleanup } = await createTestApp({ initialRoute: '/onboarding' })

      // Should redirect to home since onboarding is already completed
      await expect.poll(() => router.currentRoute.value.path).toBe('/')

      cleanup()
    })

    it('allows completed users to navigate freely', async () => {
      // Mark onboarding as completed
      await db.onboarding.put({
        id: 'onboarding',
        completed: true,
        currentStep: 0,
      })

      const { router, cleanup } = await createTestApp({ initialRoute: '/' })

      // Should stay on home, not redirect to onboarding
      await expect.poll(() => router.currentRoute.value.path).toBe('/')

      // Navigate to exercises
      await router.push('/exercises')
      await expect.poll(() => router.currentRoute.value.path).toBe('/exercises')

      cleanup()
    })
  })

  describe('Returning User', () => {
    it('shows "Welcome back" variant when existing workout data detected', async () => {
      // Seed existing workout data
      await db.workouts.add({
        id: 'existing-workout-1',
        name: 'Past Workout',
        startedAt: Date.now() - 3_600_000,
        completedAt: Date.now(),
        durationSeconds: 3600,
        blocks: [],
        notes: '',
        benchmarkId: null,
      })

      const { router, cleanup } = await createTestApp({ initialRoute: '/' })

      // Router guard should redirect to onboarding with returning=true
      await expect.poll(() => router.currentRoute.value.path).toBe('/onboarding')
      await expect.poll(() => router.currentRoute.value.query.returning).toBe('true')

      // Should show "Welcome back" heading
      await expect.element(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()

      // Should show "Resume Tour" button instead of "Start Tour"
      await expect.element(page.getByRole('button', { name: /resume tour/i })).toBeVisible()

      cleanup()
    })

    it('shows "Welcome back" variant when existing template data detected', async () => {
      // Seed existing template data
      await db.templates.add({
        id: 'existing-template-1',
        name: 'My Template',
        blocks: [],
        createdAt: Date.now(),
        lastUsedAt: null,
        tags: [],
      })

      const { router, cleanup } = await createTestApp({ initialRoute: '/' })

      // Should redirect to onboarding with returning=true
      await expect.poll(() => router.currentRoute.value.query.returning).toBe('true')

      // Should show "Welcome back" heading
      await expect.element(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()

      cleanup()
    })

    it('shows regular welcome for first-time users with no data', async () => {
      const { router, cleanup } = await createTestApp()

      // Should redirect to onboarding without returning query param
      await expect.poll(() => router.currentRoute.value.path).toBe('/onboarding')
      expect(router.currentRoute.value.query.returning).toBeUndefined()

      // Should show regular "Workout Tracker" heading
      await expect.element(page.getByRole('heading', { name: /workout tracker/i })).toBeVisible()

      // Should show "Start Tour" button
      await expect.element(page.getByRole('button', { name: /start tour/i })).toBeVisible()

      cleanup()
    })
  })

  describe('Checklist Deep-Links', () => {
    it('clicking "Create your first template" navigates to CreateTemplate', async () => {
      const { router, cleanup } = await createTestApp({ initialRoute: '/onboarding' })

      // Navigate to checklist slide
      await expect.element(page.getByRole('heading', { name: /workout tracker/i })).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /start tour/i }))

      // Navigate through slides to checklist
      for (let i = 0; i < 4; i++) {
        await userEvent.click(page.getByRole('button', { name: /next/i }))
      }

      await expect.element(page.getByText(/you're ready/i)).toBeVisible()

      // Click the template checklist item
      await userEvent.click(page.getByText(/create your first template/i))

      // Verify navigation
      await expect.poll(() => router.currentRoute.value.name).toBe('CreateTemplate')

      // Verify onboarding marked as completed
      await expect
        .poll(async () => {
          const state = await db.onboarding.get('onboarding')
          return state?.completed
        })
        .toBe(true)

      cleanup()
    })

    it('clicking "Browse the exercise library" navigates to Exercises', async () => {
      const { router, cleanup } = await createTestApp({ initialRoute: '/onboarding' })

      // Navigate to checklist slide
      await userEvent.click(page.getByRole('button', { name: /start tour/i }))
      for (let i = 0; i < 4; i++) {
        await userEvent.click(page.getByRole('button', { name: /next/i }))
      }

      await expect.element(page.getByText(/you're ready/i)).toBeVisible()

      // Click the exercises checklist item
      await userEvent.click(page.getByText(/browse the exercise library/i))

      // Verify navigation
      await expect.poll(() => router.currentRoute.value.name).toBe('Exercises')

      cleanup()
    })

    it('clicking "Start a quick workout" navigates to Home', async () => {
      const { router, cleanup } = await createTestApp({ initialRoute: '/onboarding' })

      // Navigate to checklist slide
      await userEvent.click(page.getByRole('button', { name: /start tour/i }))
      for (let i = 0; i < 4; i++) {
        await userEvent.click(page.getByRole('button', { name: /next/i }))
      }

      await expect.element(page.getByText(/you're ready/i)).toBeVisible()

      // Click the workout checklist item
      await userEvent.click(page.getByText(/start a quick workout/i))

      // Verify navigation
      await expect.poll(() => router.currentRoute.value.name).toBe('Home')

      cleanup()
    })

    it('clicking "Try a benchmark" navigates to Workouts', async () => {
      const { router, cleanup } = await createTestApp({ initialRoute: '/onboarding' })

      // Navigate to checklist slide
      await userEvent.click(page.getByRole('button', { name: /start tour/i }))
      for (let i = 0; i < 4; i++) {
        await userEvent.click(page.getByRole('button', { name: /next/i }))
      }

      await expect.element(page.getByText(/you're ready/i)).toBeVisible()

      // Click the benchmark checklist item
      await userEvent.click(page.getByText(/try a benchmark/i))

      // Verify navigation
      await expect.poll(() => router.currentRoute.value.name).toBe('Workouts')

      cleanup()
    })
  })

  describe('Navigation Controls', () => {
    it('back button is hidden on first slide and visible on others', async () => {
      const { cleanup } = await createTestApp({ initialRoute: '/onboarding' })

      // On welcome slide, back button should not be visible
      await expect.element(page.getByRole('heading', { name: /workout tracker/i })).toBeVisible()
      await expect.element(page.getByRole('button', { name: /back/i })).not.toBeInTheDocument()

      // Navigate to slide 2
      await userEvent.click(page.getByRole('button', { name: /start tour/i }))
      await expect.element(page.getByText(/install for the best experience/i)).toBeVisible()

      // Back button should be visible
      await expect.element(page.getByRole('button', { name: /back/i })).toBeVisible()

      cleanup()
    })

    it('back button navigates to previous slide', async () => {
      const { cleanup } = await createTestApp({ initialRoute: '/onboarding' })

      // Navigate to slide 2
      await userEvent.click(page.getByRole('button', { name: /start tour/i }))
      await expect.element(page.getByText(/install for the best experience/i)).toBeVisible()

      // Navigate to slide 3
      await userEvent.click(page.getByRole('button', { name: /next/i }))
      await expect.element(page.getByText(/build workouts on the fly/i)).toBeVisible()

      // Click back
      await userEvent.click(page.getByRole('button', { name: /back/i }))

      // Should be back on slide 2
      await expect.element(page.getByText(/install for the best experience/i)).toBeVisible()

      cleanup()
    })

    it('progress dots show current position', async () => {
      const { cleanup } = await createTestApp({ initialRoute: '/onboarding' })

      // Progress dots should be visible (6 dots for non-PWA mode)
      const progressDots = page.getByRole('tablist', { name: /progress/i })
      await expect.element(progressDots).toBeVisible()

      // First dot should be selected
      const firstDot = page.getByRole('tab', { name: /go to slide 1/i })
      await expect
        .poll(async () => {
          const el = await firstDot.element()
          return el.getAttribute('aria-selected')
        })
        .toBe('true')

      // Navigate to next slide
      await userEvent.click(page.getByRole('button', { name: /start tour/i }))
      await expect.element(page.getByText(/install for the best experience/i)).toBeVisible()

      // Second dot should now be selected
      const secondDot = page.getByRole('tab', { name: /go to slide 2/i })
      await expect
        .poll(async () => {
          const el = await secondDot.element()
          return el.getAttribute('aria-selected')
        })
        .toBe('true')

      cleanup()
    })

    it('clicking a progress dot navigates to that slide', async () => {
      const { cleanup } = await createTestApp({ initialRoute: '/onboarding' })

      // Start on welcome slide
      await expect.element(page.getByRole('heading', { name: /workout tracker/i })).toBeVisible()

      // Click third dot (Quick Workout slide)
      const thirdDot = page.getByRole('tab', { name: /go to slide 3/i })
      await userEvent.click(thirdDot)

      // Should navigate to Quick Workout slide
      await expect.element(page.getByText(/build workouts on the fly/i)).toBeVisible()

      cleanup()
    })
  })
})
