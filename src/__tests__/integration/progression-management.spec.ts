import { page } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { getProgressionsRepository } from '@/db'
import type { ProgressionsRepository } from '@/db/interfaces'
import { calculateNextLevel } from '@/features/progressions/lib/progressionLogic'

/**
 * Record a session with proper advancement calculation.
 * The repository requires nextLevel to be calculated in the feature layer.
 */
async function recordSessionWithAdvancement(
  repo: ProgressionsRepository,
  progressionId: string,
  completed: boolean,
): Promise<void> {
  const progression = await repo.getById(progressionId)
  if (!progression) throw new Error(`Progression ${progressionId} not found`)

  const nextLevel =
    completed && !progression.isComplete ? calculateNextLevel(progression) : undefined

  await repo.recordSession(progressionId, completed, nextLevel)
}

/**
 * Full-app UI flows for managing progressions.
 *
 * Every test here mounts the app, so per ADR 004's tiering rule each one names
 * the browser capability it needs in a one-line comment. The feature's pure
 * logic, its state machine, and its repository-error branches are *not*
 * retested here — they live in `src/__tests__/unit/progressions/**` against an
 * injected fake, and the Dexie adapter's transactional guarantees live in
 * `src/__tests__/db/progressions.spec.ts`.
 */
describe('Progression Management', () => {
  describe('Creation', () => {
    // Browser: real text input and repeated button presses driving a live form,
    // then router navigation to the created progression's detail route.
    it('creates a progression with multiple kettlebells', async ({ createTestApp }) => {
      const app = await createTestApp()

      // Navigate to progressions tab
      await app.progressions.navigateToTab()
      await app.progressions.assertEmptyState()

      // Click create and fill form
      await app.progressions.clickCreateProgression()
      await expect.poll(() => app.router.currentRoute.value.path).toBe('/progressions/create')

      await app.progressions.fillName('KB Swing Challenge')
      await app.progressions.toggleWeight(16)
      await app.progressions.toggleWeight(20)
      await app.progressions.toggleWeight(24)

      // Save progression
      await app.progressions.clickSave()

      // Verify navigation to detail
      await expect.poll(() => app.router.currentRoute.value.path).toMatch(/^\/progressions\//)

      // Verify current level shown
      await app.progressions.assertCurrentLevel(16, 10, 10)
      await app.progressions.assertSessionsCompleted(0)

      // Verify in database
      const progressions = await getProgressionsRepository().getAll()
      expect(progressions).toHaveLength(1)
      expect(progressions[0]?.name).toBe('KB Swing Challenge')
      expect(progressions[0]?.availableWeights).toEqual([16, 20, 24])
    })

    // Browser: the starting-weight control is a reka-ui `Select`, which opens
    // its listbox on real pointer events — there is no headless equivalent.
    it('creates progression with custom starting weight', async ({ createTestApp }) => {
      const app = await createTestApp()

      await app.progressions.navigateToTab()
      await app.progressions.clickCreateProgression()

      await app.progressions.fillName('Advanced KB')
      await app.progressions.toggleWeight(16)
      await app.progressions.toggleWeight(20)
      await app.progressions.toggleWeight(24)

      // Select starting weight (20kg)
      const select = page.getByRole('combobox')
      await select.click()
      await page.getByRole('option', { name: /20kg/i }).click()

      await app.progressions.clickSave()

      // Verify starting at 20kg
      await app.progressions.assertCurrentLevel(20, 10, 10)

      const progressions = await getProgressionsRepository().getAll()
      expect(progressions[0]?.currentWeightIndex).toBe(1)
    })
  })

  describe('Session Completion', () => {
    // Browser: the detail view must re-render the stored level on a fresh
    // mount, and "Start Session" must route to the session screen.
    //
    // The advancement arithmetic behind this is asserted in
    // `unit/progressions/progressionAdvancement.spec.ts`; this test only proves
    // the screen reflects it. The previous version also clicked the play button
    // before bypassing the timer via the repository — that click asserted
    // nothing and left a live 10-minute interval running, so it is gone.
    it('advances progression when session is completed successfully', async ({ createTestApp }) => {
      const app = await createTestApp()
      const repo = getProgressionsRepository()

      const progression = await repo.create({
        name: 'Test Progression',
        availableWeights: [16, 20],
      })

      await app.navigateTo(`/progressions/${progression.id}`)
      await app.progressions.assertCurrentLevel(16, 10, 10)

      // "Start Session" reaches the session screen...
      await app.progressions.clickStartSession()
      await expect.poll(() => app.router.currentRoute.value.path).toMatch(/\/session$/)

      // ...and once a session is on record, a fresh mount of the detail view
      // shows the advanced level rather than a stale one.
      await recordSessionWithAdvancement(repo, progression.id, true)
      await app.navigateTo(`/progressions/${progression.id}`)

      await app.progressions.assertCurrentLevel(16, 12, 10)
      await app.progressions.assertSessionsCompleted(1)
    })

    // Browser: renders the unchanged level plus the "Incomplete" history badge.
    it('stays at same level when session is failed', async ({ createTestApp }) => {
      const app = await createTestApp()
      const repo = getProgressionsRepository()

      // Create progression via API
      const progression = await repo.create({
        name: 'Test Progression',
        availableWeights: [16, 20],
      })

      // Record a failed session
      await recordSessionWithAdvancement(repo, progression.id, false)

      // Navigate to detail
      await app.navigateTo(`/progressions/${progression.id}`)

      // Should still be at starting level
      await app.progressions.assertCurrentLevel(16, 10, 10)
      await app.progressions.assertSessionsCompleted(1)

      // Verify session history shows failed
      await expect.element(page.getByText(/incomplete/i)).toBeVisible()
    })
  })

  // The three repository-only advancement tests that used to live here moved
  // to `src/__tests__/unit/progressions/progressionAdvancement.spec.ts`: they
  // looped `recordSession` 5-11 times to assert arithmetic, which needs no
  // browser. What is left here mounts the app, which does.
  describe('Progression Advancement', () => {
    // Browser: renders the completion badge and, just as importantly, proves
    // "Start Session" is absent from the DOM once the plan is finished.
    it('shows complete badge in UI after finishing all kettlebells', async ({ createTestApp }) => {
      const app = await createTestApp()
      const repo = getProgressionsRepository()

      // Create and complete a progression
      const progression = await repo.create({
        name: 'Completed Progression',
        availableWeights: [16],
      })

      // 11 sessions needed for single KB completion
      for (const _ of Array.from({ length: 11 })) {
        await recordSessionWithAdvancement(repo, progression.id, true)
      }

      // Navigate to detail (fresh component mount)
      await app.navigateTo(`/progressions/${progression.id}`)

      // Should show complete badge
      await app.progressions.assertCompleteBadge()

      // Start session button should not be visible
      await expect
        .element(page.getByRole('button', { name: /start session/i }))
        .not.toBeInTheDocument()
    })
  })

  describe('Deletion', () => {
    // Browser: a real confirm dialog (open, confirm, close) followed by router
    // navigation back to the list.
    it('deletes progression and navigates back to list', async ({ createTestApp }) => {
      const app = await createTestApp()
      const repo = getProgressionsRepository()

      // Create progression
      const progression = await repo.create({
        name: 'To Delete',
        availableWeights: [16],
      })

      // Navigate to detail
      await app.navigateTo(`/progressions/${progression.id}`)

      // Click delete
      await app.progressions.clickDelete()
      await app.progressions.confirmDelete()

      // Wait for navigation back to progressions
      await expect.poll(() => app.router.currentRoute.value.path).toBe('/progressions')

      // Verify deleted from database
      const deleted = await repo.getById(progression.id)
      expect(deleted).toBeUndefined()
    })
  })

  describe('Session History', () => {
    // Browser: renders a mixed history list — the Completed/Incomplete badge
    // pair is a template concern, not a repository one.
    it('displays session history with correct status badges', async ({ createTestApp }) => {
      const app = await createTestApp()
      const repo = getProgressionsRepository()

      // Create progression
      const progression = await repo.create({
        name: 'History Test',
        availableWeights: [16, 20],
      })

      // Record mixed sessions
      await recordSessionWithAdvancement(repo, progression.id, true) // Completed
      await recordSessionWithAdvancement(repo, progression.id, false) // Failed
      await recordSessionWithAdvancement(repo, progression.id, true) // Completed

      // Navigate to detail
      await app.navigateTo(`/progressions/${progression.id}`)

      // Should show 3 sessions in history
      await app.progressions.assertSessionsCompleted(3)

      // Verify session history shows both completed and incomplete badges
      await expect.element(page.getByText('Completed').first()).toBeVisible()
      await expect.element(page.getByText('Incomplete').first()).toBeVisible()
    })
  })

  describe('List View', () => {
    // Browser: renders multiple cards and follows a real click through to the
    // detail route — the list-to-detail wiring, not the list data itself.
    it('shows progressions in list with current level info', async ({ createTestApp }) => {
      const app = await createTestApp()
      const repo = getProgressionsRepository()

      // Create multiple progressions
      await repo.create({
        name: 'Beginner KB',
        availableWeights: [12, 16],
      })

      const advanced = await repo.create({
        name: 'Advanced KB',
        availableWeights: [20, 24, 28],
      })

      // Advance the second one
      await recordSessionWithAdvancement(repo, advanced.id, true)

      // Navigate to list
      await app.progressions.navigateToTab()

      // Both should be visible
      await app.progressions.assertProgressionExists('Beginner KB')
      await app.progressions.assertProgressionExists('Advanced KB')

      // Click through to detail
      await app.progressions.clickProgressionCard('Advanced KB')
      await expect.poll(() => app.router.currentRoute.value.path).toMatch(/^\/progressions\//)

      // Should show advanced level
      await app.progressions.assertCurrentLevel(20, 12, 10)
    })
  })

  describe('Scope Copy', () => {
    // Browser: asserts rendered i18n copy, including a negative ("kettlebell
    // swing" must not appear) that only a real DOM can answer.
    it('scopes the page to kettlebell EMOM without assuming a specific exercise', async ({
      createTestApp,
    }) => {
      const app = await createTestApp()

      // resetDatabase()/deleteAll() clears the progressions table (see
      // src/__tests__/db/dataManagement.spec.ts), so this starts empty.
      await app.navigateTo('/progressions')

      // Subtitle makes the kettlebell-EMOM-only scope explicit...
      await expect
        .element(page.getByText('Kettlebell EMOM progressions', { exact: true }))
        .toBeVisible()

      // ...and the empty state no longer assumes the exercise is specifically "swing".
      await app.progressions.assertEmptyState()
      await expect.element(page.getByText(/kettlebell emom progression plan/i)).toBeVisible()
      await expect.element(page.getByText(/kettlebell swing/i)).not.toBeInTheDocument()
    })
  })
})
