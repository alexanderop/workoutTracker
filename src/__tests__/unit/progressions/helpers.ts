/**
 * Progressions-specific setup shared by the Node-tier specs.
 *
 * Extracted so the four composable specs and the advancement spec share one
 * definition instead of five verbatim copies — the same reason
 * `unit/habits/habitStatsHelpers.ts` exists. The generic DI plumbing
 * (`contextFor`, `rejects`) lives in `@/__tests__/helpers/di`, which is not
 * feature-specific.
 *
 * Node-safe: imports only the feature's Tags and pure logic, the fake, and
 * types. Nothing here reaches `@/db` (enforced by
 * `src/__tests__/architecture/unitTierImports.test.ts`).
 */
import { calculateNextLevel } from '@/features/progressions/lib/progressionLogic'
import { ProgressionRepo } from '@/features/progressions/services'
import { contextFor } from '@/__tests__/helpers/di'
import { createFakeProgressionsRepository } from '@/__tests__/fakes/progressionsRepository'
import type { ProgressionsRepository } from '@/db/interfaces'
import type { DbProgression } from '@/db/schema'
import type { Context } from '@/lib/di/context'

/** `contextFor` bound to this feature's Tag. */
export function progressionContext(
  repo: ProgressionsRepository,
  failing: Partial<ProgressionsRepository> = {},
): Context<ProgressionsRepository> {
  return contextFor(ProgressionRepo, repo, failing)
}

/**
 * A fake repository holding one progression, optionally patched.
 * `useProgressionSession`'s specs pass `{ currentMinutes: 1 }` so a full timer
 * run is 60 fake ticks rather than 600.
 */
export async function seeded(
  overrides?: Partial<Omit<DbProgression, 'id' | 'createdAt'>>,
): Promise<{ repo: ProgressionsRepository; id: string }> {
  const repo = createFakeProgressionsRepository()
  const progression = await repo.create({
    name: 'KB Swing Ladder',
    availableWeights: [16, 20],
  })
  if (overrides) await repo.update(progression.id, overrides)
  return { repo, id: progression.id }
}

/**
 * Record a session the way the feature layer does: the next level is computed
 * in the feature and handed to the repository, which never derives it itself.
 */
export async function recordSessionWithAdvancement(
  repo: ProgressionsRepository,
  progressionId: string,
  completed: boolean,
): Promise<void> {
  const progression = await repo.getById(progressionId)
  if (!progression) throw new Error(`Progression ${progressionId} not found`)

  const nextLevel =
    completed && !progression.isComplete ? calculateNextLevel(progression) : undefined

  await repo.recordSession(progressionId, completed, nextLevel)
}
