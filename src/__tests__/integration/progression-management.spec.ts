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

describe('Progression Management', () => {
  describe('Creation', () => {
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
    it('advances progression when session is completed successfully', async ({ createTestApp }) => {
      const app = await createTestApp()
      const repo = getProgressionsRepository()

      // Create progression via API
      const progression = await repo.create({
        name: 'Test Progression',
        availableWeights: [16, 20],
      })

      // Navigate to detail
      await app.navigateTo(`/progressions/${progression.id}`)
      await app.progressions.assertCurrentLevel(16, 10, 10)

      // Start session
      await app.progressions.clickStartSession()
      await expect.poll(() => app.router.currentRoute.value.path).toMatch(/\/session$/)

      // Start timer (click play button)
      await app.progressions.clickPlayButton()

      // Fast-forward: directly complete via API to avoid waiting for timer
      await recordSessionWithAdvancement(repo, progression.id, true)

      // Navigate back to detail to check advancement
      await app.navigateTo(`/progressions/${progression.id}`)

      // Should have advanced to 12 reps
      await app.progressions.assertCurrentLevel(16, 12, 10)
      await app.progressions.assertSessionsCompleted(1)
    })

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

  describe('Progression Advancement', () => {
    it('advances from reps to time phase', async () => {
      const repo = getProgressionsRepository()

      // Create progression and advance to max reps (20)
      const progression = await repo.create({
        name: 'Test Progression',
        availableWeights: [16, 20],
      })

      // Simulate completing 5 sessions: 10→12→14→16→18→20 reps
      for (const _ of Array.from({ length: 5 })) {
        await recordSessionWithAdvancement(repo, progression.id, true)
      }

      // Verify in database - should be at 20 reps, 10 min
      const afterRepsPhase = await repo.getById(progression.id)
      expect(afterRepsPhase?.currentReps).toBe(20)
      expect(afterRepsPhase?.currentMinutes).toBe(10)

      // Complete another session - should advance to 12 min
      await recordSessionWithAdvancement(repo, progression.id, true)

      // Verify advancement
      const afterTimeAdvance = await repo.getById(progression.id)
      expect(afterTimeAdvance?.currentReps).toBe(20)
      expect(afterTimeAdvance?.currentMinutes).toBe(12)
    })

    it('advances to next kettlebell after completing all phases', async () => {
      const repo = getProgressionsRepository()

      // Create progression
      const progression = await repo.create({
        name: 'Test Progression',
        availableWeights: [16, 20, 24],
      })

      // Simulate completing entire first KB (11 sessions total):
      // Reps: 10→12→14→16→18→20 (5 sessions to reach max reps)
      // Time: 10→12→14→16→18→20 (5 more sessions to reach max time)
      // +1 session to trigger advance to next KB
      for (const _ of Array.from({ length: 11 })) {
        await recordSessionWithAdvancement(repo, progression.id, true)
      }

      // Verify in database - should have advanced to 20kg, reset to 10 reps, 10 min
      const updated = await repo.getById(progression.id)
      expect(updated?.currentWeightIndex).toBe(1) // 20kg
      expect(updated?.currentReps).toBe(10)
      expect(updated?.currentMinutes).toBe(10)
      expect(updated?.sessionsCompleted).toBe(11)
    })

    it('marks progression as complete after finishing all kettlebells', async () => {
      const repo = getProgressionsRepository()

      // Create progression with only one KB for faster completion
      const progression = await repo.create({
        name: 'Quick Progression',
        availableWeights: [16],
      })

      // Complete all 11 sessions for the single KB:
      // 6 rep phases (10→12→14→16→18→20) + 5 time phases (10→12→14→16→18→20)
      for (const _ of Array.from({ length: 11 })) {
        await recordSessionWithAdvancement(repo, progression.id, true)
      }

      // Verify in database
      const updated = await repo.getById(progression.id)
      expect(updated?.isComplete).toBe(true)
    })

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
