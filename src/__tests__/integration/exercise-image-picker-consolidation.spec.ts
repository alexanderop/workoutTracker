/**
 * Create Exercise previously had two separate controls that both opened the
 * same image picker (the avatar button and an "Add Image" settings row),
 * which is confusing -- clicking either does the exact same thing, so having
 * both reads as two features when there's only one (UX review finding).
 */
import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Create Exercise image picker', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('should expose exactly one control that opens the image picker', async () => {
    const { exercises, cleanup } = await createTestApp()

    await exercises.navigateTo()
    await exercises.clickCreateCustomExercise()

    const imagePickerControls = await page.getByRole('button', { name: /add image/i }).all()
    expect(imagePickerControls).toHaveLength(1)

    cleanup()
  })
})
