/**
 * The app's layer composition, in build order (ADR 004:
 * brain/decisions/004-db-in-di.md).
 *
 * Order is load-bearing and there is no dependency graph: `buildAll` walks the
 * array once, so a layer that reads another service off the context must be
 * listed after the layer that provides it. `HabitRepoLive` reads
 * `Repositories`, so `RepositoriesLive` comes first.
 *
 * Declared here rather than inline in `main.ts` because there is a second
 * composition root — `src/__tests__/helpers/createTestApp.ts` — and the
 * ordering contract has to be stated once, not re-satisfied per root. Adding a
 * feature's layer is an edit to this array only.
 */
import { RepositoriesLive } from '@/db/services.live'
import { HabitRepoLive } from '@/features/habits/services.live'

export const appLayers = [RepositoriesLive, HabitRepoLive]
