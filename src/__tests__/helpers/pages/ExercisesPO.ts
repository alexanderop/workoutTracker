import { page, userEvent } from 'vitest/browser'
import { expect } from 'vitest'
import type { CommonPO } from './CommonPO'

type CreateExerciseOptions = {
  name: string
  imageFile?: File
}

/**
 * Page Object for the exercises view.
 * Provides methods to navigate, create custom exercises, and manage the exercise library.
 */
export class ExercisesPO {
  constructor(private common: CommonPO) {}

  /**
   * Navigates to the exercises view via the common navigation.
   */
  async navigateTo(): Promise<void> {
    await this.common.navigateToExercises()
  }

  /**
   * Clicks the create custom exercise button and waits for navigation to the create form.
   */
  async clickCreateCustomExercise(): Promise<void> {
    const createButton = page.getByRole('button', { name: /create.*custom/i })
    await userEvent.click(createButton)
    await this.common.waitForRoute(/^\/create-exercise$/)
  }

  /**
   * Fills the exercise name input field.
   * @param name - The name to enter for the exercise
   */
  async fillName(name: string): Promise<void> {
    const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
    await userEvent.fill(nameInput, name)
  }

  /**
   * Uploads an image file to the image upload input.
   * Uses DataTransfer API for reliable image file handling in tests.
   * @param file - The File object to upload
   */
  async uploadImage(file: File): Promise<void> {
    const fileInputLocator = page.getByTestId('exercise-image-upload')
    const fileInput = await fileInputLocator.element()
    if (!(fileInput instanceof HTMLInputElement)) {
      throw new TypeError('File input not found')
    }

    // Use DataTransfer for reliable image file handling (userEvent.upload doesn't work with canvas-generated images)
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)
    fileInput.files = dataTransfer.files
    fileInput.dispatchEvent(new Event('change', { bubbles: true }))

    // Wait for the async image conversion to complete
    const saveButton = page.getByRole('button', { name: /save/i })
    await expect.element(saveButton).not.toBeDisabled()
  }

  /**
   * Clicks the save button and waits for navigation back to exercises view.
   */
  async save(): Promise<void> {
    const saveButton = page.getByRole('button', { name: /save/i })
    await userEvent.click(saveButton)
    await this.common.waitForRoute(/^\/exercises$/)
  }

  /**
   * Convenience method to create a custom exercise with optional image.
   * Navigates to exercises, opens create form, fills details, and saves.
   * @param options - The exercise creation options
   */
  async createExercise(options: CreateExerciseOptions): Promise<void> {
    await this.navigateTo()
    await this.clickCreateCustomExercise()
    await this.fillName(options.name)

    if (options.imageFile) {
      await this.uploadImage(options.imageFile)
    }

    await this.save()
  }
}
