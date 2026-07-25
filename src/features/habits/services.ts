/**
 * Habits pilot — Tags only (C2, C5 in effect-style-di.md).
 *
 * `import type` from `@/db/interfaces` is fully erased at compile time, so
 * this module stays importable from the Node `unit` tier. No value import
 * from `@/db` or `src/db/implementations/**` may appear here, directly or
 * transitively — the Live Layer that resolves an actual `HabitRepository`
 * lives in `services.live.ts` instead.
 */
import type { HabitRepository } from '@/db/interfaces'
import { Tag } from '@/lib/di/tag'

export const HabitRepo = Tag<HabitRepository>('HabitRepo')
