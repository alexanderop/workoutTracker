import { expect } from 'vitest'
import { db } from '@/db'

/**
 * Waits for and asserts that a template with the given name was saved to the database.
 * @param name - The name of the template to find
 */
export async function expectTemplateSaved(name: string): Promise<void> {
  await expect.poll(async () => {
    const templates = await db.templates.toArray()
    return templates.length
  }).toBeGreaterThan(0)

  const templates = await db.templates.toArray()
  expect(templates.find((t) => t.name === name)).toBeDefined()
}

/**
 * Waits for and asserts that the expected number of templates exist in the database.
 * @param expectedCount - The expected number of templates
 */
export async function expectTemplateCount(expectedCount: number): Promise<void> {
  await expect.poll(async () => {
    const templates = await db.templates.toArray()
    return templates.length
  }).toBe(expectedCount)
}

/**
 * Waits for and asserts that the expected number of workouts exist in the database.
 * @param expectedCount - The expected number of workouts (default: 1)
 */
export async function expectWorkoutSaved(expectedCount = 1): Promise<void> {
  await expect.poll(async () => {
    const workouts = await db.workouts.toArray()
    return workouts.length
  }).toBe(expectedCount)
}
