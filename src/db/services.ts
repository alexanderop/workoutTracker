/**
 * `Db` in DI (ADR 004: brain/decisions/004-db-in-di.md) — Tags only.
 *
 * `import type` from `@/db/interfaces` is fully erased at compile time, so
 * this module stays importable from the Node `unit` tier. No value import
 * from `@/db` or `src/db/implementations/**` may appear here, directly or
 * transitively — importing the `@/db` barrel constructs the Dexie singleton
 * at import time, which needs an `indexedDB` global the Node `unit` tier does
 * not have. The Live Layer that resolves an actual `RepositoryProvider` lives
 * in `services.live.ts` instead (enforced by
 * `src/__tests__/architecture/unitTierImports.test.ts`).
 */
import type { RepositoryProvider } from './interfaces'
import { Tag } from '@/lib/di/tag'

export const Repositories = Tag<RepositoryProvider>('Repositories')
