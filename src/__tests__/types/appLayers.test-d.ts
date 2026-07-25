import { expectTypeOf } from 'vitest'
import { appLayers } from '@/appLayers'
import type { HabitRepository, RepositoryProvider } from '@/db/interfaces'
import { Repositories } from '@/db/services'
import { HabitRepo } from '@/features/habits/services'
import { makeRuntime } from '@/lib/di/runtime'

// The app runtime must resolve every service the app depends on. Deleting a
// layer from `appLayers` makes one of these a compile error rather than a
// runtime `Service not found` -- that guarantee is what ADR 004's 250 -> 280
// line budget bought, and this file is what stops it regressing silently.
const runtime = makeRuntime(appLayers)

expectTypeOf(runtime.get(Repositories)).toEqualTypeOf<RepositoryProvider>()
expectTypeOf(runtime.get(HabitRepo)).toEqualTypeOf<HabitRepository>()
