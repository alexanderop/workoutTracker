import type { RouteLocationRaw } from 'vue-router'
import type { DbWorkoutTemplate } from '@/db/schema'
import { db } from '@/db'
import { RouteNames } from '@/router'
import { createDbTemplate as createDatabaseTemplate } from '../factories'

type NavigateTo = (to: RouteLocationRaw) => Promise<void>

/**
 * Seeds a workout template into the database and navigates to its detail page.
 *
 * Pass a deterministic `id: 'tpl-...'` literal in the overrides — tests assert
 * against it (route paths, direct `db.templates.get(id)` lookups).
 *
 * @param navigateTo - The `navigateTo` helper returned by `createTestApp()`
 * @param overrides - Template factory overrides; `id` is required
 * @returns The seeded template
 */
export async function seedTemplateAndOpenDetail(
  navigateTo: NavigateTo,
  overrides: Partial<DbWorkoutTemplate> & { id: string },
): Promise<DbWorkoutTemplate> {
  const template = createDatabaseTemplate(overrides)
  await db.templates.add(template)
  await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })
  return template
}
