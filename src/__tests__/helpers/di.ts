/**
 * Shared DI test helpers for the Node `unit` tier.
 *
 * The Layer-override idiom — build the working service, then replace exactly
 * the one method under test — was being copy-pasted per spec file. It is the
 * seam ADR 004's *Limits* names as changing next (a `Logger` service), so it
 * belongs in one place rather than N.
 *
 * Node-safe: imports only `@/lib/di/**`, which never reaches `@/db`
 * (enforced by `src/__tests__/architecture/unitTierImports.test.ts`).
 */
import { make } from '@/lib/di/context'
import type { Context } from '@/lib/di/context'
import type { Tag } from '@/lib/di/tag'

/**
 * A `Context` providing `impl` for `tag`, with `failing` methods overridden.
 *
 * @example
 * const ctx = contextFor(ProgressionRepo, repo, { getAll: rejects })
 */
export function contextFor<S extends object>(
  tag: Tag<S>,
  impl: S,
  failing: Partial<S> = {},
): Context<S> {
  return make(tag, { ...impl, ...failing })
}

/** A service method that always rejects — the "the dependency throws" arm. */
export const rejects = () => Promise.reject(new Error('boom'))
