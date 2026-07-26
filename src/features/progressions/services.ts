/**
 * Progressions — Tags only (ADR 003: brain/decisions/003-effect-style-di.md,
 * ADR 004: brain/decisions/004-db-in-di.md).
 *
 * `import type` from `@/db/interfaces` is fully erased at compile time, so
 * this module stays importable from the Node `unit` tier. No value import
 * from `@/db` or `src/db/implementations/**` may appear here, directly or
 * transitively — the Live Layer that resolves an actual
 * `ProgressionsRepository` lives in `services.live.ts` instead (enforced by
 * `src/__tests__/architecture/unitTierImports.test.ts`).
 */
import type { ProgressionsRepository } from '@/db/interfaces'
import { Tag } from '@/lib/di/tag'

export const ProgressionRepo = Tag<ProgressionsRepository>('ProgressionRepo')
