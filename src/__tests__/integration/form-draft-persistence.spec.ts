import { page } from '../helpers/locator'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expectElement, expectPoll } from '../helpers/assertions'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { RouteNames } from '@/router'
import { db } from '@/db'

describe('Form Draft Persistence', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Template Creation Draft', () => {
    it('restores draft when returning to create template page', async () => {
      const { getByRole, common, navigateTo, cleanup } = await createTestApp()

      // Navigate to Create Template
      await navigateTo({ name: RouteNames.CreateTemplate })
      await expectElement(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

      // Fill in template name
      const nameInput = getByRole('textbox', { name: /template name/i })
      await nameInput.fill('My Draft Template')

      // Add an exercise
      await getByRole('button', { name: /add block/i }).click()
      await common.waitForDialog()
      await common.getDialogButton('Bench Press').click()
      await common.waitForDialogClose()

      // Wait for debounced auto-save
      await vi.waitFor(
        async () => {
          const draft = await db.drafts.get('template-create')
          expect(draft).toBeTruthy()
          expect(draft?.data).toMatchObject({ name: 'My Draft Template' })
        },
        { timeout: 1000 },
      )

      // Navigate away
      await navigateTo({ name: RouteNames.Workouts })
      await expectElement(page.getByRole('heading', { name: /workouts/i })).toBeVisible()

      // Navigate back to create template
      await navigateTo({ name: RouteNames.CreateTemplate })
      await expectElement(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

      // Verify draft was restored
      const restoredNameInput = getByRole('textbox', { name: /template name/i })
      await expectPoll(async () => {
        const element = await restoredNameInput.element()
        return element instanceof HTMLInputElement ? element.value : null
      }).toBe('My Draft Template')

      // Verify block was also restored
      await expectElement(page.getByText('Bench Press')).toBeVisible()

      cleanup()
    })

    it('clears draft when template is successfully saved', async () => {
      const { getByRole, common, navigateTo, router, cleanup } = await createTestApp()

      // Navigate to Create Template
      await navigateTo({ name: RouteNames.CreateTemplate })

      // Fill in template name and add exercise
      await getByRole('textbox', { name: /template name/i }).fill('Saved Template')
      await getByRole('button', { name: /add block/i }).click()
      await common.waitForDialog()
      await common.getDialogButton('Squat').click()
      await common.waitForDialogClose()

      // Wait for draft to be saved
      await vi.waitFor(
        async () => {
          const draft = await db.drafts.get('template-create')
          expect(draft).toBeTruthy()
        },
        { timeout: 1000 },
      )

      // Save the template
      await getByRole('button', { name: /save template/i }).click()

      // Wait for navigation to template detail
      await expectPoll(() => router.currentRoute.value.name).toBe(RouteNames.TemplateDetail)

      // Verify draft was cleared
      const draft = await db.drafts.get('template-create')
      expect(draft).toBeUndefined()

      cleanup()
    })

    it('shows discard button when draft exists and clears on click', async () => {
      const { getByRole, common, navigateTo, cleanup } = await createTestApp()

      // Navigate to Create Template
      await navigateTo({ name: RouteNames.CreateTemplate })

      // Initially no discard button
      await expectElement(page.getByRole('button', { name: /discard/i })).not.toBeInTheDocument()

      // Fill in data
      await getByRole('textbox', { name: /template name/i }).fill('Draft to Discard')
      await getByRole('button', { name: /add block/i }).click()
      await common.waitForDialog()
      await common.getDialogButton('Deadlift').click()
      await common.waitForDialogClose()

      // Wait for draft and discard button to appear
      await vi.waitFor(
        async () => {
          const draft = await db.drafts.get('template-create')
          expect(draft).toBeTruthy()
        },
        { timeout: 1000 },
      )

      // Wait for discard button to be visible
      await expectElement(page.getByRole('button', { name: /discard/i })).toBeVisible()

      // Click discard
      await getByRole('button', { name: /discard/i }).click()

      // Verify form is reset
      const nameInput = getByRole('textbox', { name: /template name/i })
      await expectPoll(async () => {
        const element = await nameInput.element()
        return element instanceof HTMLInputElement ? element.value : null
      }).toBe('')

      // Verify block is removed
      await expectElement(page.getByText('Deadlift')).not.toBeInTheDocument()

      // Verify draft is cleared
      const draft = await db.drafts.get('template-create')
      expect(draft).toBeUndefined()

      // Discard button should be hidden
      await expectElement(page.getByRole('button', { name: /discard/i })).not.toBeInTheDocument()

      cleanup()
    })

    it('discard button stays hidden after discarding (regression test)', async () => {
      const { getByRole, common, navigateTo, cleanup } = await createTestApp()

      // Navigate and fill form to create draft
      await navigateTo({ name: RouteNames.CreateTemplate })
      await getByRole('textbox', { name: /template name/i }).fill('Test Draft')
      await getByRole('button', { name: /add block/i }).click()
      await common.waitForDialog()
      await common.getDialogButton('Bench Press').click()
      await common.waitForDialogClose()

      // Wait for draft to be saved
      await vi.waitFor(
        async () => {
          const draft = await db.drafts.get('template-create')
          expect(draft).toBeTruthy()
        },
        { timeout: 1000 },
      )

      // Click discard
      await getByRole('button', { name: /discard/i }).click()

      // Verify discard button is hidden immediately
      await expectElement(page.getByRole('button', { name: /discard/i })).not.toBeInTheDocument()

      // Wait longer than debounce period (test uses 50ms, wait 200ms to be safe)
      await new Promise((resolve) => setTimeout(resolve, 200))

      // BUG: Discard button should STILL be hidden, but without the fix it reappears
      await expectElement(page.getByRole('button', { name: /discard/i })).not.toBeInTheDocument()

      // Verify no draft exists in database
      const draft = await db.drafts.get('template-create')
      expect(draft).toBeUndefined()

      cleanup()
    })
  })

  describe('Benchmark Creation Draft', () => {
    it('restores draft when returning to create benchmark page', async () => {
      const { getByRole, navigateTo, cleanup } = await createTestApp()

      // Navigate to Create Benchmark
      await navigateTo({ name: RouteNames.CreateBenchmark })
      await expectElement(page.getByRole('textbox', { name: /name/i })).toBeVisible()

      // Fill in benchmark name
      await getByRole('textbox', { name: /name/i }).fill('My Draft Benchmark')

      // Wait for debounced auto-save
      await vi.waitFor(
        async () => {
          const draft = await db.drafts.get('benchmark-create')
          expect(draft).toBeTruthy()
          expect(draft?.data).toMatchObject({ name: 'My Draft Benchmark' })
        },
        { timeout: 1000 },
      )

      // Navigate away
      await navigateTo({ name: RouteNames.Workouts })

      // Navigate back
      await navigateTo({ name: RouteNames.CreateBenchmark })
      await expectElement(page.getByRole('textbox', { name: /name/i })).toBeVisible()

      // Verify draft was restored
      const restoredNameInput = getByRole('textbox', { name: /name/i })
      await expectPoll(async () => {
        const element = await restoredNameInput.element()
        return element instanceof HTMLInputElement ? element.value : null
      }).toBe('My Draft Benchmark')

      cleanup()
    })

    it('clears draft when benchmark is successfully saved', async () => {
      const { getByRole, common, navigateTo, router, cleanup } = await createTestApp()

      // Navigate to Create Benchmark
      await navigateTo({ name: RouteNames.CreateBenchmark })

      // Fill in benchmark name
      await getByRole('textbox', { name: /name/i }).fill('Completed Benchmark')

      // Wait for draft to be saved
      await vi.waitFor(
        async () => {
          const draft = await db.drafts.get('benchmark-create')
          expect(draft).toBeTruthy()
        },
        { timeout: 1000 },
      )

      // Add an exercise via dialog - click add, select exercise (added with default 10 reps)
      await getByRole('button', { name: /add exercise/i }).click()
      await common.waitForDialog()
      await common.selectExercise('Barbell Row')
      // Exercise is added immediately with default 10 reps (no second reps dialog)
      await common.waitForDialogClose()

      // Save the benchmark
      await getByRole('button', { name: /save/i }).click()

      // Wait for navigation to benchmark detail (after save, user sees new benchmark)
      await expectPoll(() => router.currentRoute.value.name).toBe(RouteNames.BenchmarkDetail)

      // Verify draft was cleared
      const draft = await db.drafts.get('benchmark-create')
      expect(draft).toBeUndefined()

      cleanup()
    })

    it('shows discard button when draft exists and clears on click', async () => {
      const { getByRole, navigateTo, cleanup } = await createTestApp()

      // Navigate to Create Benchmark
      await navigateTo({ name: RouteNames.CreateBenchmark })

      // Initially no discard button (need to wait for content to load first)
      await expectElement(page.getByRole('textbox', { name: /name/i })).toBeVisible()

      // Fill in data
      await getByRole('textbox', { name: /name/i }).fill('Draft to Discard')

      // Wait for draft to be saved
      await vi.waitFor(
        async () => {
          const draft = await db.drafts.get('benchmark-create')
          expect(draft).toBeTruthy()
        },
        { timeout: 1000 },
      )

      // Wait for discard button
      await expectElement(page.getByRole('button', { name: /discard/i })).toBeVisible()

      // Click discard
      await getByRole('button', { name: /discard/i }).click()

      // Verify form is reset
      const nameInput = getByRole('textbox', { name: /name/i })
      await expectPoll(async () => {
        const element = await nameInput.element()
        return element instanceof HTMLInputElement ? element.value : null
      }).toBe('')

      // Verify draft is cleared
      const draft = await db.drafts.get('benchmark-create')
      expect(draft).toBeUndefined()

      // Discard button should be hidden
      await expectElement(page.getByRole('button', { name: /discard/i })).not.toBeInTheDocument()

      cleanup()
    })
  })

  describe('Draft Isolation', () => {
    it('template and benchmark drafts are independent', async () => {
      const { getByRole, common, navigateTo, cleanup } = await createTestApp()

      // Create template draft
      await navigateTo({ name: RouteNames.CreateTemplate })
      await getByRole('textbox', { name: /template name/i }).fill('Template Draft')
      await getByRole('button', { name: /add block/i }).click()
      await common.waitForDialog()
      await common.getDialogButton('Bench Press').click()
      await common.waitForDialogClose()

      // Wait for template draft to be saved with correct name
      await vi.waitFor(
        async () => {
          const draft = await db.drafts.get('template-create')
          expect(draft?.data).toMatchObject({ name: 'Template Draft' })
        },
        { timeout: 1000 },
      )

      // Create benchmark draft
      await navigateTo({ name: RouteNames.CreateBenchmark })
      await expectElement(page.getByRole('textbox', { name: /name/i })).toBeVisible()
      await getByRole('textbox', { name: /name/i }).fill('Benchmark Draft')

      // Wait for benchmark draft to be saved with correct name
      await vi.waitFor(
        async () => {
          const draft = await db.drafts.get('benchmark-create')
          expect(draft?.data).toMatchObject({ name: 'Benchmark Draft' })
        },
        { timeout: 1000 },
      )

      // Verify both drafts exist independently
      const templateDraft = await db.drafts.get('template-create')
      const benchmarkDraft = await db.drafts.get('benchmark-create')

      expect(templateDraft?.data).toMatchObject({ name: 'Template Draft' })
      expect(benchmarkDraft?.data).toMatchObject({ name: 'Benchmark Draft' })

      // Wait for discard button and click it
      await expectElement(page.getByRole('button', { name: /discard/i })).toBeVisible()
      await getByRole('button', { name: /discard/i }).click()

      // Verify only benchmark draft was cleared
      await vi.waitFor(async () => {
        const benchmarkDraftAfter = await db.drafts.get('benchmark-create')
        expect(benchmarkDraftAfter).toBeUndefined()
      })

      const templateDraftAfter = await db.drafts.get('template-create')
      expect(templateDraftAfter?.data).toMatchObject({ name: 'Template Draft' })

      cleanup()
    })
  })
})
