import { expect } from 'vitest'
import {
  getCustomExercisesRepository,
  getDraftsRepository,
  getSettingsRepository,
  getTemplatesRepository,
  getWorkoutsRepository,
} from '@/db'
import type {
  DbCompletedWorkout,
  DbCustomExercise,
  DbFormDraft,
  DbUserSetting,
  DbWorkoutTemplate,
  DraftKey,
} from '@/db/schema'
import type { DbTemplateBlock } from '@/blocks'

/**
 * Repository-backed seed and assertion helpers for integration tests.
 *
 * These exist so specs never need the raw Dexie database instance directly.
 * Every helper here reads and writes exclusively through the repository
 * getters, so the same specs stay valid against any future adapter.
 */

// ============================================
// Templates
// ============================================

/**
 * Seeds a workout template through the templates repository.
 *
 * Note: `TemplatesRepository.create()` always generates its own `id`
 * (there is no repository method to insert a template with a caller-chosen
 * id, unlike `WorkoutsRepository.add()`). Callers that need to navigate
 * straight to the seeded template (e.g. `params: { id: ... }`) must use the
 * `id` on the returned template rather than assuming a literal string.
 *
 * `lastUsedAt` is applied as a follow-up `update()` call because `create()`
 * always sets it to `null`; this lets tests seed templates with a specific
 * "last used" ordering.
 */
export async function seedTemplate(
  overrides: {
    name?: string
    blocks?: ReadonlyArray<DbTemplateBlock>
    tags?: ReadonlyArray<string>
    lastUsedAt?: number | null
  } = {},
): Promise<DbWorkoutTemplate> {
  const repository = getTemplatesRepository()
  const created = await repository.create({
    name: overrides.name ?? 'Test Template',
    blocks: overrides.blocks ?? [],
    tags: overrides.tags,
  })

  if (overrides.lastUsedAt === undefined) return created

  await repository.update(created.id, { lastUsedAt: overrides.lastUsedAt })
  return { ...created, lastUsedAt: overrides.lastUsedAt }
}

/**
 * Retrieves all workout templates (same ordering as the templates list UI).
 */
export async function getAllTemplates(): Promise<ReadonlyArray<DbWorkoutTemplate>> {
  return getTemplatesRepository().getAll()
}

/**
 * Retrieves a single template by id, or `undefined` if it doesn't exist.
 */
export async function getTemplateById(id: string): Promise<DbWorkoutTemplate | undefined> {
  return getTemplatesRepository().getById(id)
}

/**
 * Retrieves the current number of templates, unpolled. For a one-off count
 * read that isn't waiting on an async UI update (e.g. an initial-state
 * assertion).
 */
export async function getTemplateCount(): Promise<number> {
  const templates = await getAllTemplates()
  return templates.length
}

/**
 * Waits for and asserts that a template with the given name was saved to the database.
 * @param name - The name of the template to find
 */
export async function expectTemplateSaved(name: string): Promise<void> {
  await expect
    .poll(async () => {
      const templates = await getAllTemplates()
      return templates.find((t) => t.name === name)
    })
    .toBeDefined()
}

/**
 * Waits for and asserts that the expected number of templates exist in the database.
 * @param expectedCount - The expected number of templates
 */
export async function expectTemplateCount(expectedCount: number): Promise<void> {
  await expect
    .poll(async () => {
      const templates = await getAllTemplates()
      return templates.length
    })
    .toBe(expectedCount)
}

/**
 * Deletes every template in the database, through the repository.
 */
export async function clearAllTemplates(): Promise<void> {
  const repository = getTemplatesRepository()
  const templates = await repository.getAll()
  for (const template of templates) {
    await repository.delete(template.id)
  }
}

// ============================================
// Workouts (completed history)
// ============================================

/**
 * Seeds a single completed workout directly into history, bypassing the UI.
 */
export async function seedCompletedWorkout(
  workout: Readonly<DbCompletedWorkout>,
): Promise<DbCompletedWorkout> {
  await getWorkoutsRepository().add(workout)
  return workout
}

/**
 * Seeds multiple completed workouts directly into history, bypassing the UI.
 * Adds sequentially so seed order is deterministic for tests that assert on
 * ordering.
 */
export async function seedCompletedWorkouts(
  workouts: ReadonlyArray<DbCompletedWorkout>,
): Promise<void> {
  const repository = getWorkoutsRepository()
  for (const workout of workouts) {
    await repository.add(workout)
  }
}

/**
 * Retrieves every completed workout in history (unbounded).
 *
 * Uses `Infinity` rather than `Number.MAX_SAFE_INTEGER` for "no limit": Dexie
 * special-cases `Infinity` to skip passing a `count` to the underlying
 * `IDBIndex.getAll()`, whereas `Number.MAX_SAFE_INTEGER` gets forwarded as
 * `count` and exceeds IndexedDB's `[EnforceRange] unsigned long`, throwing a
 * `TypeError` under fake-indexeddb.
 */
export async function getAllWorkouts(): Promise<ReadonlyArray<DbCompletedWorkout>> {
  return getWorkoutsRepository().getHistory({ limit: Infinity })
}

/**
 * Waits for and asserts that the expected number of workouts exist in the database.
 * @param expectedCount - The expected number of workouts (default: 1)
 */
export async function expectWorkoutSaved(expectedCount = 1): Promise<void> {
  await expectWorkoutCount(expectedCount)
}

/**
 * Waits for and asserts that the expected number of completed workouts exist.
 */
export async function expectWorkoutCount(expectedCount: number): Promise<void> {
  await expect
    .poll(async () => getWorkoutsRepository().count())
    .toHaveRepositoryCount(expectedCount)
}

/**
 * Retrieves the current number of completed workouts, unpolled. For a
 * one-off count read that isn't waiting on an async UI update (e.g. an
 * initial-state assertion).
 */
export async function getWorkoutCount(): Promise<number> {
  return getWorkoutsRepository().count()
}

// ============================================
// Custom exercises
// ============================================

/**
 * Retrieves every custom exercise.
 */
export async function getAllCustomExercises(): Promise<ReadonlyArray<DbCustomExercise>> {
  return getCustomExercisesRepository().getAll()
}

/**
 * Retrieves the current number of custom exercises, unpolled. For a
 * one-off count read that isn't waiting on an async UI update (e.g. an
 * initial-state assertion).
 */
export async function getCustomExerciseCount(): Promise<number> {
  const exercises = await getAllCustomExercises()
  return exercises.length
}

/**
 * Waits for and asserts the number of custom exercises in the database.
 */
export async function expectCustomExerciseCount(expectedCount: number): Promise<void> {
  await expect
    .poll(async () => {
      const exercises = await getAllCustomExercises()
      return exercises.length
    })
    .toHaveRepositoryCount(expectedCount)
}

// ============================================
// Settings
// ============================================

/**
 * Seeds a single user setting directly, bypassing the UI. Accepts the same
 * discriminated-union shape the repository's `set()` expects, e.g.
 * `{ key: 'theme', value: 'dark' }`.
 */
export async function seedSetting(setting: DbUserSetting): Promise<void> {
  await getSettingsRepository().set(setting)
}

/**
 * Retrieves the raw stored settings rows (no defaults merged in).
 */
export async function getRawSettings(): Promise<ReadonlyArray<DbUserSetting>> {
  return getSettingsRepository().observeAll().get()
}

/**
 * Retrieves the current number of raw setting rows stored, unpolled. For a
 * one-off count read that isn't waiting on an async UI update (e.g. an
 * initial-state assertion).
 */
export async function getSettingsCount(): Promise<number> {
  const settings = await getRawSettings()
  return settings.length
}

/**
 * Waits for and asserts the number of raw setting rows stored.
 */
export async function expectSettingsCount(expectedCount: number): Promise<void> {
  await expect
    .poll(async () => {
      const settings = await getRawSettings()
      return settings.length
    })
    .toHaveRepositoryCount(expectedCount)
}

/**
 * Waits for and asserts a single raw setting row's stored value.
 */
export async function expectSettingValue<K extends DbUserSetting['key']>(
  key: K,
  expected: Extract<DbUserSetting, { key: K }>['value'],
): Promise<void> {
  await expect.poll(getRawSettings).toContainStoredSetting(key, expected)
}

// ============================================
// Drafts
// ============================================

/**
 * Retrieves a form draft by key.
 */
export async function getDraft(key: DraftKey): Promise<DbFormDraft | undefined> {
  return getDraftsRepository().get(key)
}

/**
 * Waits for and asserts that a draft exists and (optionally) that its data
 * matches a partial shape.
 */
export async function expectDraftSaved(
  key: DraftKey,
  expectedData?: Record<string, unknown>,
): Promise<void> {
  await expect.poll(async () => getDraft(key)).toBeTruthy()

  if (expectedData) {
    const draft = await getDraft(key)
    expect(draft?.data).toMatchObject(expectedData)
  }
}

/**
 * Waits for and asserts that a draft has been cleared (deleted).
 */
export async function expectDraftCleared(key: DraftKey): Promise<void> {
  await expect.poll(async () => getDraft(key)).toBeUndefined()
}
