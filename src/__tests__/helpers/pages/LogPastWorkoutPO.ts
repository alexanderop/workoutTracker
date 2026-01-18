import { flushPromises } from '@vue/test-utils'
import { page, userEvent } from '../locator'
import { expectElement } from '../assertions'
import type { SetValues } from '../types'
import type { CommonPO } from './CommonPO'

type CardioResultValues = {
  durationMinutes?: number
  distanceKm?: number
  calories?: number
}

/**
 * Page Object for the Log Past Workout feature.
 * Provides methods to interact with hindsight workout logging UI.
 */
export class LogPastWorkoutPO {
  constructor(private common: CommonPO) {}

  /**
   * Navigates to the Log Past Workout page from home.
   */
  async navigateFromHome(): Promise<void> {
    await page.getByRole('button', { name: /log past workout/i }).click()
    await this.common.waitForRoute(/^\/log-past-workout/)
  }

  /**
   * Selects a source type for the past workout.
   */
  async selectSource(type: 'template' | 'history' | 'blank'): Promise<void> {
    const buttonMap = {
      template: /from template/i,
      history: /from history/i,
      blank: /blank workout/i,
    }
    await page.getByRole('button', { name: buttonMap[type] }).click()
  }

  /**
   * Selects a template by name after choosing 'from template' source.
   */
  async selectTemplate(name: string): Promise<void> {
    await this.common.waitForDialog()
    const templateButton = page.getByRole('button', { name: new RegExp(name, 'i') })
    await templateButton.click()
    await this.common.waitForDialogClose()
  }

  /**
   * Selects a workout from history by name after choosing 'from history' source.
   */
  async selectFromHistory(workoutName: string): Promise<void> {
    await this.common.waitForDialog()
    const workoutButton = page.getByRole('button', { name: new RegExp(workoutName, 'i') })
    await workoutButton.click()
    await this.common.waitForDialogClose()
  }

  /**
   * Sets the workout date using the date picker.
   * @param date - The date to set (defaults to today if not provided)
   */
  async setDate(date: Date): Promise<void> {
    // Open date picker
    await page.getByRole('button', { name: /select date/i }).click()
    await this.common.waitForDialog()

    // Select the date (simplified - click on day number)
    const day = date.getDate()
    await page.getByRole('button', { name: new RegExp(`^${day}$`) }).click()
    await this.common.waitForDialogClose()
  }

  /**
   * Sets the workout duration using preset buttons.
   * @param minutes - Duration in minutes (15, 30, 45, 60, 90, 120)
   */
  async setDuration(minutes: number): Promise<void> {
    const durationButton = page.getByRole('button', { name: new RegExp(String.raw`${minutes}\s*min`, 'i') })
    await durationButton.click()
  }

  /**
   * Fills a strength set in the grid view.
   * @param blockIndex - The index of the strength block (0-based)
   * @param setIndex - The index of the set within the block (0-based)
   * @param values - The set values to fill
   */
  async fillStrengthSet(blockIndex: number, setIndex: number, values: SetValues): Promise<void> {
    const block = page.getByTestId(`strength-block-${blockIndex}`)
    const row = block.getByTestId(`set-row-${setIndex}`)

    if (values.kg !== undefined) {
      const kgInput = row.getByRole('spinbutton', { name: /weight|kg/i })
      await kgInput.fill(String(values.kg))
    }

    if (values.reps !== undefined) {
      const repsInput = row.getByRole('spinbutton', { name: /reps/i })
      await repsInput.fill(String(values.reps))
    }

    if (values.rir !== undefined) {
      const rirInput = row.getByRole('spinbutton', { name: /rir/i })
      await rirInput.fill(String(values.rir))
    }

    await flushPromises()
  }

  /**
   * Fills all sets in a strength block with the same values.
   * @param blockIndex - The index of the strength block (0-based)
   * @param values - The set values to apply to all sets
   */
  async fillAllSets(blockIndex: number, values: SetValues): Promise<void> {
    const block = page.getByTestId(`strength-block-${blockIndex}`)
    const rows = await block.getByTestId(/^set-row-/).all()

    for (let index = 0; index < rows.length; index++) {
      await this.fillStrengthSet(blockIndex, index, values)
    }
  }

  /**
   * Adds a new set to a strength block.
   * @param blockIndex - The index of the strength block (0-based)
   */
  async addSet(blockIndex: number): Promise<void> {
    const block = page.getByTestId(`strength-block-${blockIndex}`)
    await block.getByRole('button', { name: /add set/i }).click()
  }

  /**
   * Removes a set from a strength block.
   * @param blockIndex - The index of the strength block (0-based)
   * @param setIndex - The index of the set to remove (0-based)
   */
  async removeSet(blockIndex: number, setIndex: number): Promise<void> {
    const block = page.getByTestId(`strength-block-${blockIndex}`)
    const row = block.getByTestId(`set-row-${setIndex}`)
    await row.getByRole('button', { name: /remove|delete/i }).click()
  }

  /**
   * Fills an AMRAP result.
   * @param rounds - Number of completed rounds
   * @param extraReps - Additional reps beyond the last complete round
   */
  async fillAmrapResult(rounds: number, extraReps: number): Promise<void> {
    const roundsInput = page.getByRole('spinbutton', { name: /rounds/i })
    const repsInput = page.getByRole('spinbutton', { name: /extra reps|additional reps/i })

    await roundsInput.fill(String(rounds))
    await repsInput.fill(String(extraReps))
    await flushPromises()
  }

  /**
   * Fills a ForTime result.
   * @param minutes - Minutes component of completion time
   * @param seconds - Seconds component of completion time
   */
  async fillForTimeResult(minutes: number, seconds: number): Promise<void> {
    const minutesInput = page.getByRole('spinbutton', { name: /minutes/i })
    const secondsInput = page.getByRole('spinbutton', { name: /seconds/i })

    await minutesInput.fill(String(minutes))
    await secondsInput.fill(String(seconds))
    await flushPromises()
  }

  /**
   * Marks a timed workout as DNF (Did Not Finish).
   */
  async markAsDnf(): Promise<void> {
    const dnfCheckbox = page.getByRole('checkbox', { name: /did not finish|dnf/i })
    await dnfCheckbox.click()
  }

  /**
   * Fills cardio block result.
   * @param values - Cardio result values (duration, distance, calories)
   */
  async fillCardioResult(values: CardioResultValues): Promise<void> {
    if (values.durationMinutes !== undefined) {
      const durationInput = page.getByRole('spinbutton', { name: /duration/i })
      await durationInput.fill(String(values.durationMinutes))
    }

    if (values.distanceKm !== undefined) {
      const distanceInput = page.getByRole('spinbutton', { name: /distance/i })
      await distanceInput.fill(String(values.distanceKm))
    }

    if (values.calories !== undefined) {
      const caloriesInput = page.getByRole('spinbutton', { name: /calories/i })
      await caloriesInput.fill(String(values.calories))
    }

    await flushPromises()
  }

  /**
   * Adds a strength block by selecting an exercise.
   * @param exerciseName - The name of the exercise to add
   */
  async addStrengthBlock(exerciseName: string): Promise<void> {
    await page.getByRole('button', { name: /add.*block/i }).click()
    await this.common.waitForDialog()
    await this.common.getDialogButton(exerciseName).click()
    await this.common.waitForDialogClose()
  }

  /**
   * Sets the workout name.
   * @param name - The workout name to set
   */
  async setWorkoutName(name: string): Promise<void> {
    const nameInput = page.getByRole('textbox', { name: /workout name/i })
    await nameInput.clear()
    await nameInput.fill(name)
  }

  /**
   * Saves the past workout.
   */
  async saveWorkout(): Promise<void> {
    await page.getByRole('button', { name: /save workout/i }).click()
  }

  /**
   * Gets the count of blocks currently displayed.
   * In the new playlist UI, blocks are items with data-testid="workout-block-item".
   */
  async getBlockCount(): Promise<number> {
    const blockItems = await page.getByTestId('workout-block-item').all()
    return blockItems.length
  }

  /**
   * Gets the count of sets in a strength block.
   * @param blockIndex - The index of the strength block (0-based)
   */
  async getSetCount(blockIndex: number): Promise<number> {
    const block = page.getByTestId(`strength-block-${blockIndex}`)
    const rows = await block.getByTestId(/^set-row-/).all()
    return rows.length
  }

  /**
   * Verifies that the source selection screen is visible.
   */
  async assertSourceSelectionVisible(): Promise<void> {
    await expectElement(page.getByRole('button', { name: /from template/i })).toBeVisible()
    await expectElement(page.getByRole('button', { name: /from history/i })).toBeVisible()
    await expectElement(page.getByRole('button', { name: /blank workout/i })).toBeVisible()
  }

  /**
   * Verifies that the date picker defaults to today.
   */
  async assertDateDefaultsToToday(): Promise<void> {
    const today = new Date()
    const formattedDate = today.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    await expectElement(page.getByText(new RegExp(formattedDate, 'i'))).toBeVisible()
  }

  /**
   * Proceeds to the next step in the wizard flow.
   */
  async proceedToNextStep(): Promise<void> {
    await page.getByRole('button', { name: /next|continue/i }).click()
  }

  /**
   * Goes back to the previous step in the wizard flow.
   */
  async goBack(): Promise<void> {
    await page.getByRole('button', { name: /back/i }).click()
  }

  /**
   * Checks if the save button is disabled.
   * @returns true if the save button is disabled
   */
  async isSaveButtonDisabled(): Promise<boolean> {
    const saveButton = page.getByRole('button', { name: /save workout/i })
    const element = await saveButton.element()
    return element.hasAttribute('disabled')
  }

  /**
   * Clicks a block item to select it.
   * @param blockIndex - The index of the block (0-based)
   */
  async selectBlock(blockIndex: number): Promise<void> {
    const blocks = await page.getByTestId('workout-block-item').all()
    const block = blocks[blockIndex]
    if (!block) {
      throw new Error(`Block at index ${blockIndex} not found. Only ${blocks.length} blocks exist.`)
    }
    await block.click()
  }

  /**
   * Removes a block using the remove button.
   * Block items have a remove button with aria-label containing "remove".
   * @param blockIndex - The index of the block to remove (0-based)
   */
  async removeBlock(blockIndex: number): Promise<void> {
    const blocks = await page.getByTestId('workout-block-item').all()
    const block = blocks[blockIndex]
    if (!block) {
      throw new Error(`Block at index ${blockIndex} not found. Only ${blocks.length} blocks exist.`)
    }
    // Each block item has a remove button - aria-label contains "remove"
    const blockElement = await block.element()
    // eslint-disable-next-line no-restricted-syntax -- Need to find button by aria-label pattern within block
    const removeBtn = blockElement.querySelector('button[aria-label*="remove" i], button[aria-label*="Remove" i]')
    if (!removeBtn || !(removeBtn instanceof HTMLButtonElement)) {
      throw new Error(`Remove button not found for block at index ${blockIndex}`)
    }
    await userEvent.click(removeBtn)
  }

  /**
   * Adds a strength block by selecting an exercise from the add block dialog.
   * Uses the exercise picker's search functionality for reliable selection.
   * @param exerciseName - The name of the exercise to add
   */
  async addExerciseBlock(exerciseName: string): Promise<void> {
    await page.getByRole('button', { name: /add.*block|add.*exercise/i }).click()
    await this.common.waitForDialog()
    await this.common.selectExercise(exerciseName)
    await this.common.waitForDialogClose()
  }
}
