import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createTestImageFile } from '../factories/image'
import { getCustomExercisesRepository } from '@/db'

describe('Custom Exercise Image Upload', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('uploads an image when creating a custom exercise', async () => {
    const { common, cleanup } = await createTestApp()

    // Navigate to exercises view
    await common.navigateToExercises()

    // Click create custom exercise button
    const createButton = page.getByRole('button', { name: /create.*custom/i })
    await userEvent.click(createButton)
    await common.waitForRoute(/^\/create-exercise$/)

    // Fill exercise name
    const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
    await userEvent.fill(nameInput, 'Exercise With Image')

    // Verify save button is enabled after name is entered
    const saveButton = page.getByRole('button', { name: /save/i })
    await expect.element(saveButton).not.toBeDisabled()

    // Create test image
    const imageFile = await createTestImageFile('test-exercise-image.png')

    // Find file input and upload using DataTransfer (more reliable than userEvent.upload for image files)
    const fileInputLocator = page.getByTestId('exercise-image-upload')
    const fileInput = await fileInputLocator.element()
    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error('File input not found')
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

    cleanup()
  })
})
