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
  DbTemplateBlock,
  DbUserSetting,
  DbWorkoutTemplate,
  DraftKey,
} from '@/db/schema'

/**
 * Repository-backed seed and assertion helpers for integration tests.
 *
 * These exist so specs never need `import { db } from '@/db'` directly (see
 * `brain/reference/plans/2026-07-04-persistence-swap-ticket.md` Slice 6 / AC7).
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
 * Replacement for `db.templates.toArray()`.
 */
export async function getAllTemplates(): Promise<ReadonlyArray<DbWorkoutTemplate>> {
  return getTemplatesRepository().getAll()
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
 * Replacement for `db.templates.clear()`.
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
 * Replacement for `db.workouts.add(workout)`.
 */
export async function seedCompletedWorkout(
  workout: Readonly<DbCompletedWorkout>,
): Promise<DbCompletedWorkout> {
  await getWorkoutsRepository().add(workout)
  return workout
}

/**
 * Seeds multiple completed workouts directly into history, bypassing the UI.
 * Replacement for `db.workouts.bulkAdd([...])`. Adds sequentially so seed
 * order is deterministic for tests that assert on ordering.
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
 * Replacement for `db.workouts.toArray()`.
 */
export async function getAllWorkouts(): Promise<ReadonlyArray<DbCompletedWorkout>> {
  return getWorkoutsRepository().getHistory({ limit: Number.MAX_SAFE_INTEGER })
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
 * Replacement for `expect(await db.workouts.count()).toBe(n)` /
 * `expect.poll(() => db.workouts.count())`.
 */
export async function expectWorkoutCount(expectedCount: number): Promise<void> {
  await expect.poll(async () => getWorkoutsRepository().count()).toBe(expectedCount)
}

// ============================================
// Custom exercises
// ============================================

/**
 * Retrieves every custom exercise. Replacement for `db.customExercises.toArray()`.
 */
export async function getAllCustomExercises(): Promise<ReadonlyArray<DbCustomExercise>> {
  return getCustomExercisesRepository().getAll()
}

/**
 * Waits for and asserts the number of custom exercises in the database.
 * Replacement for `db.customExercises.count()`.
 */
export async function expectCustomExerciseCount(expectedCount: number): Promise<void> {
  await expect
    .poll(async () => {
      const exercises = await getAllCustomExercises()
      return exercises.length
    })
    .toBe(expectedCount)
}

// ============================================
// Settings
// ============================================

/**
 * Seeds a single user setting directly, bypassing the UI.
 * Replacement for `db.settings.put({ key, value })`. Accepts the same
 * discriminated-union shape the repository's `set()` expects, so callers
 * pass e.g. `{ key: 'theme', value: 'dark' }` exactly as they did with `db.settings.put`.
 */
export async function seedSetting(setting: DbUserSetting): Promise<void> {
  await getSettingsRepository().set(setting)
}

/**
 * Retrieves the raw stored settings rows (no defaults merged in).
 * Replacement for `db.settings.toArray()`.
 */
export async function getRawSettings(): Promise<ReadonlyArray<DbUserSetting>> {
  return getSettingsRepository().observeAll().get()
}

/**
 * Waits for and asserts the number of raw setting rows stored.
 * Replacement for `db.settings.count()`.
 */
export async function expectSettingsCount(expectedCount: number): Promise<void> {
  await expect
    .poll(async () => {
      const settings = await getRawSettings()
      return settings.length
    })
    .toBe(expectedCount)
}

/**
 * Waits for and asserts a single raw setting row's stored value.
 * Replacement for the common
 * `expect.poll(() => db.settings.toArray().find(s => s.key === key)?.value)` pattern.
 */
export async function expectSettingValue(
  key: DbUserSetting['key'],
  expected: DbUserSetting['value'],
): Promise<void> {
  await expect
    .poll(async () => {
      const settings = await getRawSettings()
      return settings.find((s) => s.key === key)?.value
    })
    .toBe(expected)
}

// ============================================
// Drafts
// ============================================

/**
 * Retrieves a form draft by key. Replacement for `db.drafts.get(key)`.
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
