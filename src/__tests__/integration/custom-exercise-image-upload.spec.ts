/* eslint-disable vitest/no-conditional-in-test -- Image upload availability differs by browser capability. */
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { page, userEvent } from 'vitest/browser'
import { createTestImageFile } from '../factories/image'
import { getCustomExercisesRepository } from '@/db'

describe('Custom Exercise Image Upload', () => {
  it('uploads an image when creating a custom exercise', async ({ createTestApp }) => {
    const { common, exercises } = await createTestApp()

    // Navigate to exercises view
    await common.navigateToExercises()

    // Click create custom exercise button
    const createButton = page.getByRole('button', { name: /create.*custom/i })
    await userEvent.click(createButton)
    await common.waitForRoute(/^\/create-exercise$/)

    // Fill exercise name and required muscle group (Finding M5)
    const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
    await userEvent.fill(nameInput, 'Exercise With Image')
    await exercises.selectMuscle('Shoulders')

    // Verify save button is enabled after name and muscle group are entered
    const saveButton = page.getByRole('button', { name: /save/i })
    await expect.element(saveButton).not.toBeDisabled()

    // Create test image
    const imageFile = await createTestImageFile('test-exercise-image.png')

    // Find file input and upload using DataTransfer (more reliable than userEvent.upload for image files)
    const fileInputLocator = page.getByTestId('exercise-image-upload')
    const fileInput = await fileInputLocator.element()
    if (!(fileInput instanceof HTMLInputElement)) {
      throw new TypeError('File input not found')
    }

    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(imageFile)
    fileInput.files = dataTransfer.files
    fileInput.dispatchEvent(new Event('change', { bubbles: true }))

    // Verify avatar shows image preview (not just initials)
    const avatarImage = page.getByRole('img', { name: 'Exercise With Image' })
    await expect.element(avatarImage).toBeVisible()

    // Wait for conversion and verify save button remains enabled
    await expect.element(saveButton).not.toBeDisabled()

    // Save the exercise
    await userEvent.click(saveButton)
    await common.waitForRoute(/^\/exercises$/)

    // Verify the exercise was saved with the image converted to WebP
    const savedExercises = await getCustomExercisesRepository().getAll()
    const exerciseWithImage = savedExercises.find((e) => e.name === 'Exercise With Image')

    expect(exerciseWithImage).toBeDefined()
    expect(exerciseWithImage?.image).toBeInstanceOf(Blob)
    expect(exerciseWithImage?.image?.type).toBe('image/webp')
    expect(exerciseWithImage?.image?.size).toBeGreaterThan(0)
  })
})
