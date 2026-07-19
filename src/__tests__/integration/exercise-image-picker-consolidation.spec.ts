/**
 * Create Exercise previously had two separate controls that both opened the
 * same image picker (the avatar button and an "Add Image" settings row),
 * which is confusing -- clicking either does the exact same thing, so having
 * both reads as two features when there's only one (UX review finding).
 */
import { page } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'

describe('Create Exercise image picker', () => {
  it('should expose exactly one control that opens the image picker', async ({ createTestApp }) => {
    const { exercises } = await createTestApp()

    await exercises.navigateTo()
    await exercises.clickCreateCustomExercise()

    const imagePickerControls = await page.getByRole('button', { name: /add image/i }).all()
    expect(imagePickerControls).toHaveLength(1)
  })
})
